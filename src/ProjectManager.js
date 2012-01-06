/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    // Load dependent non-module scripts
    require("thirdparty/jstree_pre1.0_fix_1/jquery.jstree");

    // Load dependent modules
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ,   CommandManager      = require("CommandManager")
    ,   Commands            = require("Commands")
    ,   Strings             = require("strings")
    ;
    
    /**
     * Returns the root folder of the currently loaded project, or null if no project is open (during
     * startup, or running outside of app shell).
     * @return {DirectoryEntry}
     */
    function getProjectRoot() {
        return _projectRoot;
    }
    /**
     * @private
     * @see getProjectRoot()
     */
    var _projectRoot = null;

    /**
     * @private
     * Reference to the tree control
     */
    var _projectTree = null;

    /**
     * Displays a browser dialog where the user can choose a folder to load.
     * (If the user cancels the dialog, nothing more happens).
     */
    function openProject() {
        if (!brackets.inBrowser) {
            // Pop up a folder browse dialog
            NativeFileSystem.showOpenDialog(false, true, "Choose a folder", null, null,
                function(files) {
                    // If length == 0, user canceled the dialog; length should never be > 1
                    if (files.length > 0)
                        loadProject( files[0] );
                },
                function(error) {
                    brackets.showModalDialog(
                          brackets.DIALOG_ID_ERROR
                        , Strings.ERROR_LOADING_PROJECT
                        , Strings.format(Strings.OPEN_DIALOG_ERROR, error.code)
                    );
                }
            );
        }
    }

    /**
     * Loads the given folder as a project. Normally, you would call openProject() instead to let the
     * user choose a folder.
     *
     * @param {string} rootPath  Absolute path to the root folder of the project.
     */
     function loadProject(rootPath) {
        // Set title
        var projectName = rootPath.substring(rootPath.lastIndexOf("/") + 1);
        $("#project-title").html(projectName);

        // Populate file tree
        if (brackets.inBrowser) {
            // Hardcoded dummy data for local testing, in jsTree JSON format
            // (we leave _projectRoot null)
            var subfolderInner = { data:"Folder_inner", children:[
                { data: "subsubfile_1" }, { data: "subsubfile_2" }
            ] };
            var treeJSONData = [
                { data: "Dummy tree content:" },
                { data:"Folder_1", children:[
                    { data: "subfile_1" }, { data: "subfile_2" }, { data: "subfile_3" }
                ] },
                { data:"Folder_2", children:[
                    { data: "subfile_4" }, subfolderInner, { data: "subfile_5" }
                ] },
                { data: "file_1" },
                { data: "file_2" }
            ];

            // Show file list in UI synchronously
            _renderTree(treeJSONData);

        } else {
            // Point at a real folder structure on local disk
            NativeFileSystem.requestNativeFileSystem(rootPath,
                function(rootEntry) {
                    // Success!
                    _projectRoot = rootEntry;

                    // The tree will invoke our "data provider" function to populate the top-level items, then
                    // go idle until a node is expanded - at which time it'll call us again to fetch the node's
                    // immediate children, and so on.
                    _renderTree(_treeDataProvider);
                },
                function(error) {
                    brackets.showModalDialog(
                          brackets.DIALOG_ID_ERROR
                        , Strings.ERROR_LOADING_PROJECT
                        , Strings.format(Strings.REQUEST_NATIVE_FILE_SYSTEM_ERROR, rootPath, error.code)
                    );
                }
            );

        }
    };

    /**
     * Returns the FileEntry corresponding to the selected item, or null
     * if no item is selected.
     *
     * @return {string}
     */
    function getSelectedItem() {
        var selected = _projectTree.jstree("get_selected");
        if (selected)
            return selected.data("entry");
        return null;
    };

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
        // TODO: Need API to get tree node for baseDir.
        // In the meantime, pass null for node so new item is placed
        // relative to the selection
        var node = null,
            selection = _projectTree.jstree("get_selected"),
            selectionEntry = null,
            position = "inside",
            escapeKeyPressed = false,
            result = new $.Deferred();

        // get the FileEntry or DirectoryEntry
        if ( selection ) {
            selectionEntry = selection.data("entry")
        }

        // move selection to parent DirectoryEntry
        if ( selectionEntry && selectionEntry.isFile ) {
            position = "after";

            // FIXME (jasonsj): get_parent returns the tree instead of the directory?
            /*
            selection = _projectTree.jstree("get_parent", selection);

            if ( typeof( selection.data ) == "function" ) {
                // get Entry from tree node
                // note that the jstree root will return undefined
                selectionEntry = selection.data("entry");
            }
            else {
                // reset here. will be replaced with project root.
                selectionEntry = null;
            }
            */
            // FIXME (jasonsj): hackish way to get parent directory
            var filePath = selectionEntry.fullPath;
            selectionEntry = new NativeFileSystem.DirectoryEntry(filePath.substring(0, filePath.lastIndexOf("/")));
        }

        // use the project root DirectoryEntry
        if ( !selectionEntry ) {
            selectionEntry = getProjectRoot();
        }

        _projectTree.on("create.jstree", function(event, data) {
            $(event.target).off("create.jstree");

            function errorCleanup() {
                // TODO: If an error occurred, we should allow the user to fix the filename.
                // For now we just remove the node so you have to start again.
                _projectTree.jstree("remove", data.rslt.obj);
                result.reject();
            }

            if (!escapeKeyPressed) {
                // Validate file name
                // TODO: There are some filenames like COM1, LPT3, etc. that are not valid on Windows.
                // We may want to add checks for those here.
                // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
                if (data.rslt.name.search(/[/?*:;{}<>\\|]+/) !== -1) {
                    brackets.showModalDialog(
                            brackets.DIALOG_ID_ERROR
                        ,   Strings.INVALID_FILENAME_TITLE
                        ,   Strings.INVALID_FILENAME_MESSAGE);

                    errorCleanup();
                    return;
                }

                // Use getFile() to create the new file
                selectionEntry.getFile(data.rslt.name
                    , {create: true, exclusive: true}
                    , function( entry ) {
                        data.rslt.obj.data("entry", entry);
                        _projectTree.jstree("select_node", data.rslt.obj, true);
                        result.resolve(entry);
                    }
                    , function ( error ) {
                        if ( ( error.code === FileError.PATH_EXISTS_ERR )
                             || (error.code === FileError.TYPE_MISMATCH_ERR ) ) {
                            brackets.showModalDialog(
                                  brackets.DIALOG_ID_ERROR
                                , Strings.INVALID_FILENAME_TITLE
                                , Strings.format(
                                      Strings.FILE_ALREADY_EXISTS
                                    , data.rslt.name
                                )
                            );
                        }
                        // TODO (jasonsj): proper message for each error.code
                        /*
                        else if ( error.code == FileError ) {

                        }
                        */

                        errorCleanup();
                    }
                );
            }
            else { //escapeKeyPressed
                errorCleanup();
            }
        });

        // Create the node and open the editor
        _projectTree.jstree("create", node, position, {data: initialName}, null, skipRename);

        var renameInput = _projectTree.find(".jstree-rename-input");

        renameInput.on("keydown", function(event) {
            // Listen for escape key on keydown, so we can remove the node in the create.jstree handler above
            if (event.keyCode == 27) {
                escapeKeyPressed = true;
            }
        });

        // TODO: Figure out better way to style this input. All styles are inlined by jsTree...
        renameInput.css(
            { left: "17px"
            , height: "24px"
            }
        ).parent().css(
            { height: "26px"
            }
        );

        return result;
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
        var dirEntry;

        if (treeNode == -1) {
            // Special case: root of tree
            dirEntry = _projectRoot;
        } else {
            // All other nodes: the DirectoryEntry is saved as jQ data in the tree (by _convertEntriesToJSON())
            dirEntry = treeNode.data("entry");
        }

        // Fetch dirEntry's contents
        dirEntry.createReader().readEntries(
            function(entries) {
                var subtreeJSON = _convertEntriesToJSON(entries);
                jsTreeCallback(subtreeJSON);
            },
            function(error) {
                brackets.showModalDialog(
                      brackets.DIALOG_ID_ERROR
                    , Strings.ERROR_LOADING_PROJECT
                    , Strings.format(Strings.READ_DIRECTORY_ENTRIES_ERROR, dirEntry.fullPath, error.code)
                );
            }
        );

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
        var jsonEntryList = [];
        for (var entryI in entries) {
            var entry = entries[entryI];

            var jsonEntry = {
                data: entry.name,
                metadata: { entry: entry }
            };
            if (entry.isDirectory) {
                jsonEntry.children = [];
                jsonEntry.state = "closed";
            }
            // For more info on jsTree's JSON format see: http://www.jstree.com/documentation/json_data

            jsonEntryList.push(jsonEntry);
        }
        return jsonEntryList;
    }


    /**
     * @private
     * Given an input to jsTree's json_data.data setting, display the data in the file tree UI
     * (replacing any existing file tree that was previously displayed). This input could be
     * raw JSON data, or it could be a dataprovider function. See jsTree docs for details:
     * http://www.jstree.com/documentation/json_data
     */
    function _renderTree(treeDataProvider) {

        var projectTreeContainer = $("#project-files-container");

        // Instantiate tree widget
        // (jsTree is smart enough to replace the old tree if there's already one there)
        _projectTree = projectTreeContainer.jstree({
            plugins : ["ui", "themes", "json_data", "crrm"],
            json_data : { data:treeDataProvider, correct_state: false },
            core : { animation:0 },
            themes : { theme:"brackets", url:"styles/jsTreeTheme.css", dots:false, icons:false },
                //(note: our actual jsTree theme CSS lives in brackets.less; we specify an empty .css
                // file because jsTree insists on loading one itself)

            strings : { loading : "Loading ...", new_node : "New node" }    // TODO: localization
        })
        .bind("select_node.jstree", function(event, data) {
            var entry = data.rslt.obj.data("entry");
            if (entry.isFile)
                CommandManager.execute(Commands.FILE_OPEN, entry.fullPath);
        });
    };
    
    // Define public API
    exports.getProjectRoot  = getProjectRoot;
    exports.openProject     = openProject;
    exports.loadProject     = loadProject;
    exports.getSelectedItem = getSelectedItem;
    exports.createNewItem   = createNewItem;
});