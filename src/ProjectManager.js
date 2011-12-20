/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

var ProjectManager = {};


/**
 * Returns the root folder of the currently loaded project, or null if no project is open (during
 * startup, or running outside of app shell).
 * @return {DirectoryEntry}
 */
ProjectManager.getProjectRoot = function() {
    return ProjectManager._projectRoot;
}
/**
 * @private
 * @see Projectmanager.getProjectRoot()
 */
ProjectManager._projectRoot = null;

/**
 * @private
 * Reference to the tree control
 */
ProjectManager._projectTree = null;

/**
 * Displays a browser dialog where the user can choose a folder to load.
 * (If the user cancels the dialog, nothing more happens).
 */
ProjectManager.openProject = function() {
    if (!brackets.inBrowser) {
        // Pop up a folder browse dialog
        NativeFileSystem.showOpenDialog(false, true, "Choose a folder", null, null,
            function(files) {
                // If length == 0, user canceled the dialog; length should never be > 1
                if (files.length > 0)
                    ProjectManager.loadProject( files[0] );
            },
            function(error) {
                brackets.showModalDialog(
                      brackets.DIALOG_ID_ERROR
                    , brackets.strings.ERROR_LOADING_PROJECT
                    , brackets.strings.format(brackets.strings.OPEN_DIALOG_ERROR, error.code)
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
ProjectManager.loadProject = function(rootPath) {
    // Set title
    var projectName = rootPath.substring(rootPath.lastIndexOf("/") + 1);
    $("#project-title").html(projectName);
    
    // Populate file tree
    if (brackets.inBrowser) {
        // Hardcoded dummy data for local testing, in jsTree JSON format
        // (we leave ProjectManager._projectRoot null)
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
        ProjectManager._renderTree(treeJSONData);
        
    } else {
        // Point at a real folder structure on local disk
        NativeFileSystem.requestNativeFileSystem(rootPath,
            function(rootEntry) {
                // Success!
                ProjectManager._projectRoot = rootEntry;
                
                // The tree will invoke our "data provider" function to populate the top-level items, then
                // go idle until a node is expanded - at which time it'll call us again to fetch the node's
                // immediate children, and so on.
                ProjectManager._renderTree(ProjectManager._treeDataProvider);
            },
            function(error) {
                brackets.showModalDialog(
                      brackets.DIALOG_ID_ERROR
                    , brackets.strings.ERROR_LOADING_PROJECT
                    , brackets.strings.format(brackets.strings.REQUEST_NATIVE_FILE_SYSTEM_ERROR, rootPath, error.code)
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
ProjectManager.getSelectedItem = function() {
    var selected = ProjectManager._projectTree.jstree("get_selected");   
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
ProjectManager.createNewItem = function(baseDir, initialName, skipRename) {
    // TODO: Need API to get tree node for baseDir.
    // In the meantime, pass null for node so new item is placed
    // relative to the selection
    var node = null,
        selection = ProjectManager.getSelectedItem(),
        position = "inside",
        result = new $.Deferred();
    
    if (selection && selection.isFile)
        position = "after";
    
    // Create the node and open the editor 
    ProjectManager._projectTree.jstree("create", node, position, {data: initialName}, null, false);
    
    ProjectManager._projectTree.on("create.jstree", function(event, data) {
        var error = false;
        $(event.target).off("create.jstree");

        // Validate file name
        // TODO: There are some filenames like COM1, LPT3, etc. that are not valid on Windows.
        // We may want to add checks for those here.
        // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
        if (data.rslt.name.search(/[/?*:;{}<>\\|]+/) !== -1) {
            brackets.showModalDialog(
                    brackets.DIALOG_ID_ERROR
                ,   brackets.strings.INVALID_FILENAME_TITLE
                ,   brackets.strings.INVALID_FILENAME_MESSAGE);
            
            error = true;
        }
        
        // Make sure the file doesn't already exist
        fullPath = baseDir + "/" + data.rslt.name;
        
        // TODO: Use NativeFileSystem call instead of fs.stat(). Also, this
        // is currently depending on stat being synchronous.
        brackets.fs.stat(fullPath, function(err, stat) {
            if (err != brackets.fs.ERR_NOT_FOUND) {
                brackets.showModalDialog(
                        brackets.DIALOG_ID_ERROR
                    ,   brackets.strings.INVALID_FILENAME_TITLE
                    ,   brackets.strings.format(
                            brackets.strings.FILE_ALREADY_EXISTS
                        ,   data.rslt.name
                    ));
                error = true;
            }
        });
        
        if (error) {
            // TODO: Allow the user to fix the filename. For now we just remove the node so
            // you have to start again.
            ProjectManager._projectTree.jstree("remove", data.rslt.obj);
            result.reject();
            return;            
        }
        
        // Create a file entry for the new node
        var fileEntry = new NativeFileSystem.FileEntry(fullPath);
        // Create a file writer (which will create the file)
        fileEntry.createWriter(function(writer) {
            writer.write("");
        });
        data.rslt.obj.data("entry", fileEntry);
        ProjectManager._projectTree.jstree("select_node", data.rslt.obj);
        result.resolve(fileEntry);
    });
    
    // TODO: Figure out better way to style this input. All styles are inlined by jsTree...
    ProjectManager._projectTree.find(".jstree-rename-input").css(
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
ProjectManager._treeDataProvider = function(treeNode, jsTreeCallback) {    
    var dirEntry;
    
    if (treeNode == -1) {
        // Special case: root of tree
        dirEntry = ProjectManager._projectRoot;
    } else {
        // All other nodes: the DirectoryEntry is saved as jQ data in the tree (by _convertEntriesToJSON())
        dirEntry = treeNode.data("entry");
    }
    
    // Fetch dirEntry's contents
    dirEntry.createReader().readEntries(
        function(entries) {
            var subtreeJSON = ProjectManager._convertEntriesToJSON(entries);
            jsTreeCallback(subtreeJSON);
        },
        function(error) {
            brackets.showModalDialog(
                  brackets.DIALOG_ID_ERROR
                , brackets.strings.ERROR_LOADING_PROJECT
                , brackets.strings.format(brackets.strings.READ_DIRECTORY_ENTRIES_ERROR, dirEntry.fullPath, error.code)
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
ProjectManager._convertEntriesToJSON = function(entries) {
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
ProjectManager._renderTree = function(treeDataProvider) {
    
    var projectTreeContainer = $("#project-files-container");
    
    // Instantiate tree widget
    // (jsTree is smart enough to replace the old tree if there's already one there)
    ProjectManager._projectTree = projectTreeContainer.jstree({
        plugins : ["ui", "themes", "json_data", "crrm"],
        json_data : { data:treeDataProvider },
        
        core : { animation:0 },
        themes : { theme:"brackets", url:"styles/jsTreeTheme.css", dots:false, icons:false },
            //(note: our actual jsTree theme CSS lives in brackets.less; we specify an empty .css
            // file because jsTree insists on loading one itself)
        
        strings : { loading : "Loading ...", new_node : "New node" }    // TODO: localization
    })
    .bind("select_node.jstree", function(event, data) {
        CommandManager.execute(Commands.FILE_OPEN, data.rslt.obj.data("entry").fullPath);
    });
};