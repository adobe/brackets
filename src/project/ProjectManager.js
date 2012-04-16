/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, brackets: false, FileError: false */

/**
 * ProjectManager is the model for the set of currently open project. It is responsible for
 * creating and updating the project tree when projects are opened and when changes occur to
 * the file tree.
 *
 * This module dispatches these events:
 *    - initializeComplete -- When the ProjectManager initializes the first 
 *                            project at application start-up.
 *    - projectRootChanged -- when _projectRoot changes
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(ProjectManager).on("eventname", handler);
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent non-module scripts
    require("thirdparty/jstree_pre1.0_fix_1/jquery.jstree");

    // Load dependent modules
    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        PreferencesManager  = require("preferences/PreferencesManager"),
        DocumentManager     = require("document/DocumentManager"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        Dialogs             = require("widgets/Dialogs"),
        Strings             = require("strings"),
        FileViewController  = require("project/FileViewController"),
        PerfUtils           = require("utils/PerfUtils"),
        ViewUtils           = require("utils/ViewUtils"),
        FileUtils           = require("file/FileUtils");
    
    /**
     * @private
     * Reference to the tree control
     * @type {jQueryObject}
     */
    var _projectTree = null;
    
    /**
     * @private
     * @see getProjectRoot()
     */
    var _projectRoot = null;

    /**
     * @private
     * Used to initialize jstree state
     */
    var _projectInitialLoad = {
        previous        : [],   /* array of arrays containing full paths to open at each depth of the tree */
        id              : 0,    /* incrementing id */
        fullPathToIdMap : {}    /* mapping of fullPath to tree node id attr */
    };
    
    var _documentSelectionFocusChange = function () {
        var curDoc = DocumentManager.getCurrentDocument();
        if (curDoc
                && (FileViewController.getFileSelectionFocus() !== FileViewController.WORKING_SET_VIEW)) {
            $("#project-files-container li").is(function (index) {
                var entry = $(this).data("entry");
                
                if (entry && entry.fullPath === curDoc.file.fullPath && !_projectTree.jstree("is_selected", $(this))) {
                    //we don't want to trigger another selection change event, so manually deselect
                    //and select without sending out notifications
                    _projectTree.jstree("deselect_all");
                    _projectTree.jstree("select_node", $(this), false);
                    return true;
                }
                return false;
            });
        } else if (_projectTree !== null) {
            _projectTree.jstree("deselect_all");
        }
    };

    $(FileViewController).on("documentSelectionFocusChange", _documentSelectionFocusChange);

    /**
     * Unique PreferencesManager clientID
     */
    var PREFERENCES_CLIENT_ID = "com.adobe.brackets.ProjectManager";

    /**
     * Returns the root folder of the currently loaded project, or null if no project is open (during
     * startup, or running outside of app shell).
     * @return {DirectoryEntry}
     */
    function getProjectRoot() {
        return _projectRoot;
    }
    
    /**
     * Returns true if absPath lies within the project, false otherwise.
     * Does not support paths containing ".."
     */
    function isWithinProject(absPath) {
        return (_projectRoot && absPath.indexOf(_projectRoot.fullPath) === 0);
    }
    /**
     * If absPath lies within the project, returns a project-relative path. Else returns absPath
     * unmodified.
     * Does not support paths containing ".."
     */
    function makeProjectRelativeIfPossible(absPath) {
        if (isWithinProject(absPath)) {
            return absPath.slice(_projectRoot.fullPath.length);
        }
        return absPath;
    }

    /**
     * @private
     * Preferences callback. Saves current project path.
     */
    function _savePreferences(storage) {
        // save the current project
        storage.projectPath = _projectRoot.fullPath;

        // save jstree state
        var openNodes = [],
            projectPathLength = _projectRoot.fullPath.length,
            entry,
            fullPath,
            shortPath,
            depth;

        // Query open nodes by class selector
        $(".jstree-open").each(function (index) {
            entry = $(this).data("entry");

            if (entry.fullPath) {
                fullPath = entry.fullPath;

                // Truncate project path prefix, remove the trailing slash
                shortPath = fullPath.slice(projectPathLength, -1);

                // Determine depth of the node by counting path separators.
                // Children at the root have depth of zero
                depth = shortPath.split("/").length - 1;

                // Map tree depth to list of open nodes
                if (openNodes[depth] === undefined) {
                    openNodes[depth] = [];
                }

                openNodes[depth].push(fullPath);
            }
        });

        // Store the open nodes by their full path and persist to storage
        storage.projectTreeState = openNodes;
    }

    /**
     * @private
     * Given an input to jsTree's json_data.data setting, display the data in the file tree UI
     * (replacing any existing file tree that was previously displayed). This input could be
     * raw JSON data, or it could be a dataprovider function. See jsTree docs for details:
     * http://www.jstree.com/documentation/json_data
     */
    function _renderTree(treeDataProvider) {
        var $projectTreeContainer = $("#project-files-container"),
            result = new $.Deferred();

        // Instantiate tree widget
        // (jsTree is smart enough to replace the old tree if there's already one there)
        _projectTree = $projectTreeContainer
            .jstree(
                {
                    plugins : ["ui", "themes", "json_data", "crrm", "sort"],
                    json_data : { data: treeDataProvider, correct_state: false },
                    core : { animation: 0 },
                    themes : { theme: "brackets", url: "styles/jsTreeTheme.css", dots: false, icons: false },
                        //(note: our actual jsTree theme CSS lives in brackets.less; we specify an empty .css
                        // file because jsTree insists on loading one itself)
                    strings : { loading : "Loading ...", new_node : "New node" },
                    sort :  function (a, b) {
                        if (brackets.platform === "win") {
                            // Windows: prepend folder names with a '0' and file names with a '1' so folders are listed first
                            var a1 = ($(a).hasClass("jstree-leaf") ? "1" : "0") + this.get_text(a).toLowerCase(),
                                b1 = ($(b).hasClass("jstree-leaf") ? "1" : "0") + this.get_text(b).toLowerCase();
                            return (a1 > b1) ? 1 : -1;
                        } else {
                            return this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1;
                        }
                    }
                }
            )
            .bind(
                "select_node.jstree",
                function (event, data) {
                    var entry = data.rslt.obj.data("entry");
                    if (entry.isFile) {
                        FileViewController.openAndSelectDocument(entry.fullPath, "ProjectManager");
                    }
                }
            )
            .bind(
                "reopen.jstree",
                function (event, data) {
                    // This handler fires for the initial load and subsequent
                    // reload_nodes events. For each depth level of the tree, we open
                    // the saved nodes by a fullPath lookup.
                    if (_projectInitialLoad.previous.length > 0) {
                        // load previously open nodes by increasing depth
                        var toOpenPaths = _projectInitialLoad.previous.shift(),
                            toOpenIds   = [],
                            node        = null;
        
                        // use path to lookup ID
                        $.each(toOpenPaths, function (index, value) {
                            node = _projectInitialLoad.fullPathToIdMap[value];
                            
                            if (node) {
                                toOpenIds.push(node);
                            }
                        });
        
                        // specify nodes to open and load
                        data.inst.data.core.to_open = toOpenIds;
                        _projectTree.jstree("reload_nodes", false);
                    }
                    if (_projectInitialLoad.previous.length === 0) {
                        // resolve after all paths are opened
                        result.resolve();
                    }
                }
            )
            .bind(
                "loaded.jstree open_node.jstree close_node.jstree",
                function (event, data) {
                    ViewUtils.updateChildrenToParentScrollwidth($("#project-files-container"));
                }
            );

        // jstree has a default event handler for dblclick that attempts to clear the
        // global window selection (presumably because it doesn't want text within the tree
        // to be selected). This ends up messing up CodeMirror, and we don't need this anyway
        // since we've turned off user selection of UI text globally. So we just unbind it,
        // and add our own double-click handler here.
        // Filed this bug against jstree at https://github.com/vakata/jstree/issues/163
        _projectTree.bind("init.jstree", function () {
            // install scroller shadows
            ViewUtils.installScrollShadow(_projectTree[0]);
            
            _projectTree
                .unbind("dblclick.jstree")
                .bind("dblclick.jstree", function (event) {
                    var entry = $(event.target).closest("li").data("entry");
                    if (entry && entry.isFile) {
                        FileViewController.addToWorkingSetAndSelect(entry.fullPath);
                    }
                });
        });

        return result;
    }
    
    /** @param {Entry} entry File or directory to filter */
    function _shouldShowInTree(entry) {
        if (entry.name[0] === ".") {       // "." prefix is always hidden on Mac
            return false;
        }
        
        if (entry.name === "Thumbs.db") {  // "Thumbs.db" hidden file auto-generated by Win
            return false;
        }
        
        return true;
    }

    /**
     * @private
     * Given an array of NativeFileSystem entries, returns a JSON array representing them in the format
     * required by jsTree. Saves the corresponding Entry object as metadata (which jsTree will store in
     * the DOM via $.data()).
     *
     * Does NOT recursively traverse the file system: folders are marked as expandable but are given no
     * children initially.
     *
     * @param {Array.<Entry>} entries  Array of NativeFileSystem entry objects.
     * @return {Array} jsTree node data: array of JSON objects
     */
    function _convertEntriesToJSON(entries) {
        var jsonEntryList = [],
            entry,
            entryI;

        for (entryI = 0; entryI < entries.length; entryI++) {
            entry = entries[entryI];
            
            if (_shouldShowInTree(entry)) {
                var jsonEntry = {
                    data: entry.name,
                    attr: { id: "node" + _projectInitialLoad.id++ },
                    metadata: { entry: entry }
                };
                if (entry.isDirectory) {
                    jsonEntry.children = [];
                    jsonEntry.state = "closed";
                }
    
                // For more info on jsTree's JSON format see: http://www.jstree.com/documentation/json_data
                jsonEntryList.push(jsonEntry);
    
                // Map path to ID to initialize loaded and opened states
                _projectInitialLoad.fullPathToIdMap[entry.fullPath] = jsonEntry.attr.id;
            }
        }
        return jsonEntryList;
    }

    /**
     * @private
     * Called by jsTree when the user has expanded a node that has never been expanded before. We call
     * jsTree back asynchronously with the node's immediate children data once the subfolder is done
     * being fetched.
     *
     * @param {jQueryObject} treeNode  jQ object for the DOM node being expanded
     * @param {function(Array)} jsTreeCallback  jsTree callback to provide children to
     */
    function _treeDataProvider(treeNode, jsTreeCallback) {
        var dirEntry, isProjectRoot = false;

        if (treeNode === -1) {
            // Special case: root of tree
            dirEntry = _projectRoot;
            isProjectRoot = true;
        } else {
            // All other nodes: the DirectoryEntry is saved as jQ data in the tree (by _convertEntriesToJSON())
            dirEntry = treeNode.data("entry");
        }

        // Fetch dirEntry's contents
        dirEntry.createReader().readEntries(
            function (entries) {
                var subtreeJSON = _convertEntriesToJSON(entries),
                    wasNodeOpen = false,
                    emptyDirectory = (subtreeJSON.length === 0);
                
                if (emptyDirectory) {
                    if (!isProjectRoot) {
                        wasNodeOpen = treeNode.hasClass("jstree-open");
                    } else {
                        // project root is a special case, add a placeholder
                        subtreeJSON.push({});
                    }
                }
                
                jsTreeCallback(subtreeJSON);
                
                if (!isProjectRoot && emptyDirectory) {
                    // If the directory is empty, force it to appear as an open or closed node.
                    // This is a workaround for issue #149 where jstree would show this node as a leaf.
                    var classToAdd = (wasNodeOpen) ? "jstree-closed" : "jstree-open";
                    
                    treeNode.removeClass("jstree-leaf jstree-closed jstree-open")
                            .addClass(classToAdd);
                }
            },
            function (error) {
                Dialogs.showModalDialog(
                    Dialogs.DIALOG_ID_ERROR,
                    Strings.ERROR_LOADING_PROJECT,
                    Strings.format(Strings.READ_DIRECTORY_ENTRIES_ERROR, dirEntry.fullPath, error.code)
                );
            }
        );

    }
    
    /** Returns the full path to the default project folder. The path is currently the brackets src folder.
     * TODO: (issue #267): Brackets does not yet support operating when there is no project folder. This code will likely
     * not be needed when this support is added.
     * @private
     * @return {!string} fullPath reference
     */
    function _getDefaultProjectPath() {
        var loadedPath = window.location.pathname;
        var bracketsSrc = loadedPath.substr(0, loadedPath.lastIndexOf("/"));
        
        bracketsSrc = FileUtils.convertToNativePath(bracketsSrc);

        return bracketsSrc;
    }
    
    /**
     * Loads the given folder as a project. Normally, you would call openProject() instead to let the
     * user choose a folder.
     *
     * @param {string} rootPath  Absolute path to the root folder of the project. 
     *  If rootPath is undefined or null, the last open project will be restored.
     * @return {Deferred} A $.Deferred() object that will be resolved when the
     *  project is loaded and tree is rendered, or rejected if the project path
     *  fails to load.
     */
    function loadProject(rootPath) {
        // reset tree node id's
        _projectInitialLoad.id = 0;

        var prefs = PreferencesManager.getPreferences(PREFERENCES_CLIENT_ID),
            result = new $.Deferred(),
            resultRenderTree,
            isFirstProjectOpen = false;

        if (rootPath === null || rootPath === undefined) {
            // Load the last known project into the tree
            rootPath = prefs.projectPath;
            isFirstProjectOpen = true;

            _projectInitialLoad.previous = prefs.projectTreeState;

            if (brackets.inBrowser) {
                // In browser: dummy folder tree (hardcoded in ProjectManager)
                rootPath = "DummyProject";
                $("#project-title").html(rootPath);
            }
        }
        
        PerfUtils.markStart("Load Project: " + rootPath);

        // Populate file tree as long as we aren't running in the browser
        if (!brackets.inBrowser) {
            // Point at a real folder structure on local disk
            NativeFileSystem.requestNativeFileSystem(rootPath,
                function (rootEntry) {
                    var projectRootChanged = (!_projectRoot || !rootEntry)
                        || _projectRoot.fullPath !== rootEntry.fullPath;

                    // Success!
                    _projectRoot = rootEntry;

                    // Set title
                    $("#project-title").html(_projectRoot.name);

                    // The tree will invoke our "data provider" function to populate the top-level items, then
                    // go idle until a node is expanded - at which time it'll call us again to fetch the node's
                    // immediate children, and so on.
                    resultRenderTree = _renderTree(_treeDataProvider);

                    resultRenderTree.done(function () {
                        result.resolve();

                        if (isFirstProjectOpen) {
                            $(exports).triggerHandler("initializeComplete", _projectRoot);
                        }

                        if (projectRootChanged) {
                            $(exports).triggerHandler("projectRootChanged", _projectRoot);
                        }
                    });
                    resultRenderTree.fail(function () {
                        result.reject();
                    });
                    resultRenderTree.always(function () {
                        PerfUtils.addMeasurement("Load Project: " + rootPath);
                    });
                },
                function (error) {
                    Dialogs.showModalDialog(
                        Dialogs.DIALOG_ID_ERROR,
                        Strings.ERROR_LOADING_PROJECT,
                        Strings.format(
                            Strings.REQUEST_NATIVE_FILE_SYSTEM_ERROR,
                            rootPath,
                            error.code,
                            function () {
                                result.reject();
                            }
                        )
                    ).done(function () {
                        // The project folder stored in preference doesn't exist, so load the default 
                        // project directory.
                        // TODO (issue #267): When Brackets supports having no project directory
                        // defined this code will need to change
                        return loadProject(_getDefaultProjectPath());
                    });
                }
                );
        }

        return result;
    }

    /**
     * Displays a browser dialog where the user can choose a folder to load.
     * (If the user cancels the dialog, nothing more happens).
     */
    function openProject() {
        // Confirm any unsaved changes first. We run the command in "prompt-only" mode, meaning it won't
        // actually close any documents even on success; we'll do that manually after the user also oks
        //the folder-browse dialog.
        CommandManager.execute(Commands.FILE_CLOSE_ALL, { promptOnly: true })
            .done(function () {
                // Pop up a folder browse dialog
                NativeFileSystem.showOpenDialog(false, true, "Choose a folder", _projectRoot.fullPath, null,
                    function (files) {
                        // If length == 0, user canceled the dialog; length should never be > 1
                        if (files.length > 0) {
                            // Actually close all the old files now that we know for sure we're proceeding
                            DocumentManager.closeAll();
                            
                            // Load the new project into the folder tree
                            loadProject(files[0]);
                        }
                    },
                    function (error) {
                        Dialogs.showModalDialog(
                            Dialogs.DIALOG_ID_ERROR,
                            Strings.ERROR_LOADING_PROJECT,
                            Strings.format(Strings.OPEN_DIALOG_ERROR, error.code)
                        );
                    }
                    );
            });
        // if fail, don't open new project: user canceled (or we failed to save its unsaved changes)
    }

    /**
     * Returns the FileEntry or DirectoryEntry corresponding to the selected item, or null
     * if no item is selected.
     *
     * @return {?Entry}
     */
    function getSelectedItem() {
        var selected = _projectTree.jstree("get_selected");
        if (selected) {
            return selected.data("entry");
        }
        return null;
    }

    /**
     * Create a new item in the project tree.
     *
     * @param baseDir {string} Full path of the directory where the item should go
     * @param initialName {string} Initial name for the item
     * @param skipRename {boolean} If true, don't allow the user to rename the item
     * @return {Deferred} A $.Deferred() object that will be resolved with the FileEntry
     *  of the created object, or rejected if the user cancelled or entered an illegal
     *  filename.
     */
    function createNewItem(baseDir, initialName, skipRename) {
        var node                = null,
            selection           = _projectTree.jstree("get_selected"),
            selectionEntry      = null,
            position            = "inside",
            escapeKeyPressed    = false,
            result              = new $.Deferred(),
            wasNodeOpen         = true;

        // get the FileEntry or DirectoryEntry
        if (selection) {
            selectionEntry = selection.data("entry");
        }

        // move selection to parent DirectoryEntry
        if (selectionEntry) {
            if (selectionEntry.isFile) {
                position = "after";
                
                var parent = $.jstree._reference(_projectTree)._get_parent(selection);
                
                if (typeof (parent.data) === "function") {
                    // get Entry from tree node
                    // note that the jstree root will return undefined
                    selectionEntry = parent.data("entry");
                } else {
                    // reset here. will be replaced with project root.
                    selectionEntry = null;
                }
            } else if (selectionEntry.isDirectory) {
                wasNodeOpen = selection.hasClass("jstree-open");
            }
        }

        // use the project root DirectoryEntry
        if (!selectionEntry) {
            selectionEntry = getProjectRoot();
        }

        _projectTree.on("create.jstree", function (event, data) {
            $(event.target).off("create.jstree");

            function errorCleanup() {
                // TODO (issue #115): If an error occurred, we should allow the user to fix the filename.
                // For now we just remove the node so you have to start again.
                var parent = data.inst._get_parent(data.rslt.obj);
                
                _projectTree.jstree("remove", data.rslt.obj);
                
                // Restore tree node state and styling when errors occur.
                // parent returns -1 when at the root
                if (parent && (parent !== -1)) {
                    var methodName = (wasNodeOpen) ? "open_node" : "close_node";
                    var classToAdd = (wasNodeOpen) ? "jstree-open" : "jstree-closed";
                    
                    // This is a workaround for issue #149 where jstree would show this node as a leaf.
                    _projectTree.jstree(methodName, parent);
                    parent.removeClass("jstree-leaf jstree-closed jstree-open")
                          .addClass(classToAdd);
                }
                
                result.reject();
            }

            if (!escapeKeyPressed) {
                // Validate file name
                // TODO (issue #270): There are some filenames like COM1, LPT3, etc. that are not valid on Windows.
                // We may want to add checks for those here.
                // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
                if (data.rslt.name.search(/[\/?*:;\{\}<>\\|]+/) !== -1) {
                    Dialogs.showModalDialog(
                        Dialogs.DIALOG_ID_ERROR,
                        Strings.INVALID_FILENAME_TITLE,
                        Strings.INVALID_FILENAME_MESSAGE
                    );

                    errorCleanup();
                    return;
                }

                // Use getFile() to create the new file
                selectionEntry.getFile(
                    data.rslt.name,
                    {create: true, exclusive: true},
                    function (entry) {
                        data.rslt.obj.data("entry", entry);
                        _projectTree.jstree("select_node", data.rslt.obj, true);
                        result.resolve(entry);
                    },
                    function (error) {
                        if ((error.code === FileError.PATH_EXISTS_ERR)
                                || (error.code === FileError.TYPE_MISMATCH_ERR)) {
                            Dialogs.showModalDialog(
                                Dialogs.DIALOG_ID_ERROR,
                                Strings.INVALID_FILENAME_TITLE,
                                Strings.format(Strings.FILE_ALREADY_EXISTS, data.rslt.name)
                            );
                        } else {
                            var errString = error.code === FileError.NO_MODIFICATION_ALLOWED_ERR ?
                                             Strings.NO_MODIFICATION_ALLOWED_ERR :
                                             Strings.format(String.GENERIC_ERROR, error.code);
                            var errMsg = Strings.format(Strings.ERROR_CREATING_FILE, data.rslt.name, errString);
                          
                            Dialogs.showModalDialog(
                                Dialogs.DIALOG_ID_ERROR,
                                Strings.ERROR_CREATING_FILE_TITLE,
                                errMsg
                            );
                        }

                        errorCleanup();
                    }
                );
            } else { //escapeKeyPressed
                errorCleanup();
            }
        });
        
        // TODO (issue #115): Need API to get tree node for baseDir.
        // In the meantime, pass null for node so new item is placed
        // relative to the selection
        node = selection;
        
        // Open the node before creating the new child
        _projectTree.jstree("open_node", node);

        // Create the node and open the editor
        _projectTree.jstree("create", node, position, {data: initialName}, null, skipRename);

        var renameInput = _projectTree.find(".jstree-rename-input");

        renameInput.on("keydown", function (event) {
            // Listen for escape key on keydown, so we can remove the node in the create.jstree handler above
            if (event.keyCode === 27) {
                escapeKeyPressed = true;
            }
        });

        // TODO (issue #277): Figure out better way to style this input. All styles are inlined by jsTree...
        renameInput.css({ left: "17px", height: "24px"})
            .parent().css({ height: "26px"});

        return result;
    }

    // Define public API
    exports.getProjectRoot  = getProjectRoot;
    exports.isWithinProject = isWithinProject;
    exports.makeProjectRelativeIfPossible = makeProjectRelativeIfPossible;
    exports.openProject     = openProject;
    exports.loadProject     = loadProject;
    exports.getSelectedItem = getSelectedItem;
    exports.createNewItem   = createNewItem;

    // Initialize now
    (function () {
        var defaults = {
            projectPath:      _getDefaultProjectPath(), /* initialze to brackets source */
            projectTreeState: ""
        };
        PreferencesManager.addPreferencesClient(PREFERENCES_CLIENT_ID, _savePreferences, this, defaults);

        CommandManager.register(Commands.FILE_OPEN_FOLDER, openProject);
    }());
});
