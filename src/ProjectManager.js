/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    // Load dependent non-module scripts
    require("thirdparty/jstree_pre1.0_fix_1/jquery.jstree");

    // Load dependent modules
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ,   PreferencesManager  = require("PreferencesManager")
    ,   CommandManager      = require("CommandManager")
    ,   Commands            = require("Commands")
    ,   Strings             = require("strings")
    ,   FileViewController  = require("FileViewController")
    ,   DocumentManager     = require("DocumentManager")
    ;
    
    $(FileViewController).on("documentSelectionFocusChange", function(event) {
        var curDoc = DocumentManager.getCurrentDocument();
        if(curDoc !== null && FileViewController.getFileSelectionFocus() != "WorkingSetView"){
            $("#project-files-container li").is( function ( index ) {
                var entry = $(this).data("entry");
                
                if( entry && entry.fullPath == curDoc.file.fullPath && !_projectTree.jstree("is_selected", $(this)) ){
                    //we don't want to trigger another selection change event, so manually deselect
                    //and select without sending out notifications
                    _projectTree.jstree("deselect_all");
                    _projectTree.jstree("select_node", $(this), false);
                    return true;
                }
                return false;
            });
        }
        else {
            _projectTree.jstree("deselect_all");
        }
    });
    
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
     * Returns true if absPath lies within the project, false otherwise.
     * FIXME: Does not support paths containing ".."
     */
    function isWithinProject(absPath) {
        var rootPath = _projectRoot.fullPath;
        if (rootPath.charAt(rootPath.length - 1) != "/") {  // TODO: standardize whether DirectoryEntry.fullPath can end in "/"
            rootPath += "/";
        }
        return (absPath.indexOf(rootPath) == 0);
    }
    /**
     * If absPath lies within the project, returns a project-relative path. Else returns absPath
     * unmodified.
     * FIXME: Does not support paths containing ".."
     */
    function makeProjectRelativeIfPossible(absPath) {
        if (isWithinProject(absPath)) {
            var relPath = absPath.slice(_projectRoot.fullPath.length);
            if (relPath.charAt(0) == '/') {  // TODO: standardize whether DirectoryEntry.fullPath can end in "/"
                relPath = relPath.slice(1);
            }
            return relPath;
        }
        return absPath;
    }
    
    
    /**
     * @private
     * Reference to the tree control
     * @type {jQueryObject}
     */
    var _projectTree = null;

    
    /**
     * @private
     * Used to initialize jstree state
     */
    var _projectInitialLoad =
        { previous : []
        , id : 0
        , fullPathToIdMap : {}
        };

    /**
     * @private
     * Preferences callback. Saves current project path.
     */
    function savePreferences( storage ) {
        // save the current project
        storage.projectPath = _projectRoot.fullPath;

        // save jstree state
        var openNodes = []
        ,   projectPathLength = _projectRoot.fullPath.length + 1
        ,   entry
        ,   fullPath
        ,   shortPath
        ,   depth;

        // Query open nodes by class selector
        $(".jstree-open").each( function ( index ) {
            entry = $( this ).data("entry");

            if ( entry.fullPath ) {
                fullPath = entry.fullPath;

                // Truncate project path prefix
                shortPath = fullPath.slice( projectPathLength );

                // Determine depth of the node by counting path separators.
                // Children at the root have depth of zero.
                depth = shortPath.split("/").length - 1;

                // Map tree depth to list of open nodes
                if ( openNodes[ depth ] === undefined ) {
                    openNodes[ depth ] = [];
                }

                openNodes[ depth ].push( fullPath );
            }
        });

        // Store the open nodes by their full path and persist to storage
        storage.projectTreeState = openNodes;
    }

    /**
     * Unique PreferencesManager clientID
     */
    var PREFERENCES_CLIENT_ID = "com.adobe.brackets.ProjectManager";

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
     * @return {Deferred} A $.Deferred() object that will be resolved when the
     *  project is loaded and tree is rendered, or rejected if the project path
     *  fails to load.
     */
    function loadProject(rootPath) {
        // reset tree node id's
        _projectInitialLoad.id = 0;

        var prefs = PreferencesManager.getPreferences(PREFERENCES_CLIENT_ID)
        ,   result = new $.Deferred();

        if (rootPath === null || rootPath === undefined) {
            // Load the last known project into the tree
            rootPath = prefs.projectPath;
            _projectInitialLoad.previous = prefs.projectTreeState;

            if (brackets.inBrowser) {
                // In browser: dummy folder tree (hardcoded in ProjectManager)
               rootPath = "DummyProject";
            }
        }

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
            _renderTree(treeJSONData, result);

        } else {
            // Point at a real folder structure on local disk
            NativeFileSystem.requestNativeFileSystem(rootPath,
                function(rootEntry) {
                    // Success!
                    _projectRoot = rootEntry;

                    // The tree will invoke our "data provider" function to populate the top-level items, then
                    // go idle until a node is expanded - at which time it'll call us again to fetch the node's
                    // immediate children, and so on.
                    _renderTree(_treeDataProvider, result);
                },
                function(error) {
                    brackets.showModalDialog(
                          brackets.DIALOG_ID_ERROR
                        , Strings.ERROR_LOADING_PROJECT
                        , Strings.format(Strings.REQUEST_NATIVE_FILE_SYSTEM_ERROR, rootPath, error.code
                        , function() { result.reject(); })
                    );
                }
            );
        }

        return result;
    }

    /**
     * Returns the FileEntry or DirectoryEntry corresponding to the selected item, or null
     * if no item is selected.
     *
     * @return {?Entry}
     */
    function getSelectedItem() {
        var selected = _projectTree.jstree("get_selected");
        if (selected)
            return selected.data("entry");
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
            // FIXME (jasonsj): hackish way to get parent directory; replace with Entry.getParent() when available
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
                        else {
                            var errString = error.code == FileError.NO_MODIFICATION_ALLOWED_ERR ? 
                                             Strings.NO_MODIFICATION_ALLOWED_ERR :
                                             Strings.format(String.GENERIC_ERROR, error.code)
                            var errMsg = Strings.format(Strings.ERROR_CREATING_FILE, data.rslt.name, errString);
                          
                            brackets.showModalDialog(
                                  brackets.DIALOG_ID_ERROR
                                , Strings.ERROR_CREATING_FILE_TITLE
                                , errMsg
                            );
                        }

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
                //If the list is empty, add an empty object so the loading message goes away
                if( subtreeJSON.length === 0 )
                    subtreeJSON.push({});
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
        var jsonEntryList = []
        ,   entry;

        for (var entryI in entries) {
            entry = entries[entryI];

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
        return jsonEntryList;
    }


    /**
     * @private
     * Given an input to jsTree's json_data.data setting, display the data in the file tree UI
     * (replacing any existing file tree that was previously displayed). This input could be
     * raw JSON data, or it could be a dataprovider function. See jsTree docs for details:
     * http://www.jstree.com/documentation/json_data
     */
    function _renderTree(treeDataProvider, result) {


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
                FileViewController.openAndSelectDocument(entry.fullPath, "ProjectManager");
        })
        .bind("reopen.jstree", function(event, data) {
            // This handler fires for the initial load and subsequent
            // reload_nodes events. For each depth level of the tree, we open
            // the saved nodes by a fullPath lookup.
            if ( _projectInitialLoad.previous.length > 0 ) {
                // load previously open nodes by increasing depth
                var toOpenPaths = _projectInitialLoad.previous.shift()
                ,   toOpenIds   = [];

                // use path to lookup ID
                $.each( toOpenPaths, function(index, value) {
                    toOpenIds.push(_projectInitialLoad.fullPathToIdMap[value]);
                });

                // specify nodes to open and load
                data.inst.data.core.to_open = toOpenIds;
                _projectTree.jstree("reload_nodes", false);
            }
            if ( _projectInitialLoad.previous.length === 0 ) {
                result.resolve();
            }
        })
        .bind("dblclick.jstree", function(event) {

            var entry = $(event.target).closest("li").data("entry");
            if (entry.isFile)
                FileViewController.addToWorkingSetAndSelect( entry.fullPath);
                
        });
    };

    // Define public API
    exports.getProjectRoot  = getProjectRoot;
    exports.isWithinProject = isWithinProject;
    exports.makeProjectRelativeIfPossible = makeProjectRelativeIfPossible;
    exports.openProject     = openProject;
    exports.loadProject     = loadProject;
    exports.getSelectedItem = getSelectedItem;
    exports.createNewItem   = createNewItem;

    // Register save callback
    var loadedPath = window.location.pathname;
    var bracketsSrc = loadedPath.substr(0, loadedPath.lastIndexOf("/"));
    var defaults =
        { projectPath:      bracketsSrc /* initialze to brackets source */
        , projectTreeState: ""          /* TODO (jasonsj): jstree state */
        };
    PreferencesManager.addPreferencesClient(PREFERENCES_CLIENT_ID, savePreferences, this, defaults);
});
