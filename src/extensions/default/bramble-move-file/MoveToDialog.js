/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var Dialogs                = brackets.getModule("widgets/Dialogs");
    var DefaultDialogs         = brackets.getModule("widgets/DefaultDialogs");
    var ProjectManager         = brackets.getModule("project/ProjectManager");
    var CommandManager         = brackets.getModule("command/CommandManager");
    var Commands               = brackets.getModule("command/Commands");
    var MainViewManager        = brackets.getModule("view/MainViewManager");
    var LiveDevMultiBrowser    = brackets.getModule("LiveDevelopment/LiveDevMultiBrowser");
    var KeyEvent               = brackets.getModule("utils/KeyEvent");
    var StartupState           = brackets.getModule("bramble/StartupState");
    var FileSystem             = brackets.getModule("filesystem/FileSystem");
    var BracketsFiler          = brackets.getModule("filesystem/impls/filer/BracketsFiler");
    var Path                   = BracketsFiler.Path;
    var Strings                = brackets.getModule("strings");
    var StringUtils            = brackets.getModule("utils/StringUtils");
    var Mustache               = brackets.getModule("thirdparty/mustache/mustache");

    var MoveUtils              = require("MoveUtils");
    var dialogTemplate         = require("text!htmlContent/move-to-dialog.html");
    var directoryTreeTemplate  = require("text!htmlContent/directory-tree.html");

    var BASE_INDENT            = 20;

    Mustache.parse(dialogTemplate);
    Mustache.parse(directoryTreeTemplate);

    function _finishMove(source, destination, newPath) {
        var fileInEditor = MainViewManager.getCurrentlyViewedPath();
        var relPath;
        var fileToOpen;

        function afterFileTreeRefresh() {
            FileSystem.off("change", afterFileTreeRefresh);
            ProjectManager.showInTree(FileSystem.getFileForPath(fileToOpen));
            LiveDevMultiBrowser.reload();
        }

        if(newPath) {
            relPath = Path.relative(Path.dirname(source), fileInEditor);
            if(relPath === '') {
                relPath = Path.basename(fileInEditor);
            }
            fileToOpen = Path.join(destination, relPath);

            // Reload the editor if the current file that is in the
            // editor is a) what is being moved or b) is somewhere in
            // in the folder that is being moved.
            if(fileInEditor.indexOf(source) === 0) {
                CommandManager.execute(Commands.CMD_OPEN, {fullPath: fileToOpen});
                // Once the file tree has been refreshed, a `change` event
                // on the FileSystem is fired.
                // This is unfortunately the only way to make sure
                // the file tree first reflects the (delete + create) move
                // operation and only then do `afterFileTreeRefresh` which
                // expands the parent directories and reloads the preview.
                // If it is not done in this order, you'll see the directories
                // expand first with the file shown in its old location and
                // after a delay, the file will jump to the new location.
                FileSystem.on("change", afterFileTreeRefresh);
                ProjectManager.refreshFileTree();
                return;
            }
        }

        ProjectManager.refreshFileTree();
        LiveDevMultiBrowser.reload();
    }

    function _failMove(source, destination, error) {
        var from = Path.basename(source);
        var to = Path.basename(destination);

        if(error.type === MoveUtils.NEEDS_RENAME) {
            Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERROR,
                Strings.ERROR_MOVING_FILE_DIALOG_HEADER,
                StringUtils.format(Strings.ERROR_MOVING_FILE_SAME_NAME, from, to)
            );
            return;
        }

        Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERROR,
            Strings.ERROR_MOVING_FILE_DIALOG_HEADER,
            StringUtils.format(Strings.ERROR_MOVING_FILE, from, to)
        );

        console.error("[Bramble] Failed to move `", source, "` to `", destination, "` with: ", error);
    }

    function _handleDialogEvents(dialog) {
        $(window.document.body).one("keyup.installDialog", function(e) {
            if(e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                dialog.close();
            }
        });

        dialog.getElement().one("buttonClick", function(e, button) {
            if(button === Dialogs.DIALOG_BTN_CANCEL) {
                return dialog.close();
            }

            if(button !== Dialogs.DIALOG_BTN_OK) {
                return;
            }

            var $directories = $(".move-to-dialog .directories");
            var source = $directories.attr("data-source");
            var destination = $directories.attr("data-destination");

            MoveUtils.move(source, destination)
            .done(_finishMove.bind(null, source, destination))
            .fail(_failMove.bind(null, source, destination))
            .always(function() {
                dialog.close();
            });
        });
    }

    function _handleClicksOnDirectories(pathToMove) {
        var $directories = $(".move-to-dialog .directories");

        $(".move-to-dialog .directory-name")
        .mousedown(function(e) {
            $(e.currentTarget).addClass("active-directory");
        })
        .click(function(e) {
            var $selectedDirectory = $(e.currentTarget);

            $(".move-to-dialog .directory-name").removeClass("active-directory");
            $directories.attr("data-destination", $selectedDirectory.parent().attr("data-path"));
            $selectedDirectory.addClass("active-directory");
        });
    }

    function _getListOfDirectories(defaultPath, callback) {
        var projectRoot = StartupState.project("root");
        var parentPath = projectRoot.replace(/\/?$/, "");
        var directories = [{
            path: parentPath,
            name: Strings.PROJECT_ROOT,
            children: false,
            indent: 0,
            noIcon: true,
            defaultPath: parentPath === defaultPath
        }];
        var currentIndent = 0;

        function constructDirTree(tree, currentNode, index) {
            if(currentNode.type !== "DIRECTORY") {
                return tree;
            }

            var currentPath = Path.join(parentPath, currentNode.path);
            var directory = {
                name: currentNode.path,
                path: currentPath,
                children: false,
                indent: currentIndent,
                defaultPath: currentPath === defaultPath
            };

            if(currentNode.contents && currentNode.contents.length > 0) {
                currentIndent += BASE_INDENT;
                parentPath = currentPath;
                directory.children = currentNode.contents.reduce(constructDirTree, false);
                parentPath = Path.dirname(currentPath);
                currentIndent -= BASE_INDENT;
            }

            tree = tree || [];
            tree.push(directory);
            return tree;
        }

        BracketsFiler.fs().ls(projectRoot, { recursive: true }, function(err, nodes) {
            if(err) {
                return callback(err);
            }

            callback(null, nodes.reduce(constructDirTree, directories));
        });
    }

    function open() {
        var context = ProjectManager.getContext();
        if(!context) {
            return;
        }
        var defaultPath = Path.dirname(context.fullPath);

        _getListOfDirectories(defaultPath, function(err, directories) {
            if(err) {
                return console.error("Failed to get list of directories with: ", err);
            }

            var dialogContents = {
                defaultPath: defaultPath,
                source: context.fullPath,
                PICK_A_FOLDER_TO_MOVE_TO: Strings.PICK_A_FOLDER_TO_MOVE_TO,
                OK: Strings.OK,
                CANCEL: Strings.CANCEL
            };
            var subdirectoryContents = {
                subdirectories: directoryTreeTemplate
            };
            var directoryContents = {
                directories: Mustache.render(directoryTreeTemplate, directories, subdirectoryContents)
            };

            var dialogHTML = Mustache.render(dialogTemplate, dialogContents, directoryContents);
            var dialog = Dialogs.showModalDialogUsingTemplate(dialogHTML, false);

            _handleDialogEvents(dialog);
            _handleClicksOnDirectories(context.fullPath);
        });
    }

    exports.open = open;
});
