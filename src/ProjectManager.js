/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

var ProjectManager = {};

ProjectManager.openProject = function() {
    if (!brackets.inBrowser) {
		// Pop up a folder browse dialog
        NativeFileSystem.showOpenDialog(false, true, "Choose a folder", null, null,
			function(files) {
				// If length == 0, user canceled the dialog; length should never be > 1
				if (files.length > 0)
					ProjectManager.loadProject( files[0] );
			}
		);
    }
}

ProjectManager.loadProject = function(rootPath) {
	// Set title
	var projectName = rootPath.substring(rootPath.lastIndexOf("/") + 1);
	$("#project-title").html(projectName);
	
	// Build file list in JSON format
	var treeJSONData;
	
	if (brackets.inBrowser) {
		// Hardcoded dummy data for local testing
		var subfolderInner = { data:"Folder_inner", children:[
			{ data: "subsubfile_1" }, { data: "subsubfile_2" }
		] };
		treeJSONData = [
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
		// Actually scan the folder structure on local disk
        var rootEntry = NativeFileSystem.requestNativeFileSystem(rootPath, null, null);  // TODO: add success/error callbacks
		
        var reader = rootEntry.createReader();
        reader.readEntries(function(entries) {
			var jsonEntryList = [];
			for (var entryI in entries) {
				var entry = entries[entryI];
				
				// TODO: if (ProjectManager.shouldShowFile(item)) ...
				
				var jsonEntry = { data: entry.name };
				if (entry.isDirectory) {
					jsonEntry.children = [];
					jsonEntry.state = "closed";
				}
				jsonEntryList.push(jsonEntry);
			}
			ProjectManager._renderTree(jsonEntryList);
		},
		function(error) {
			console.log(error);     // TODO: real error handling
		});

		// var rootedTreeJSONData = readDirectory(rootEntry);
		// treeJSONData = rootedTreeJSONData.children;		// we don't want the root folder to be an actual tree node
		
        // function readDirectory(entry){
        //     var reader = entry.createReader();
        //     var jsonItem = {
        //         data: entry.name,
        //         children: []
        //     };
        //     reader.readEntries(dirReaderSuccessCB, dirReaderErrorCB);
        // }
        //         function dirReaderSuccessCB( entries ){
        //             var tabs = "";
        //             for( i = 0; i < nestingLevel; i++ ){
        //                 tabs += "  ";
        //             }
        //         
        //             for ( var entryI in entries ){
        //                 var entry = entries[entryI];
        //                 if( entry.isFile ){
        //                     // create leaf tree node using entry.name
        //                     console.log( tabs+ entry.name );
        //                 }
        //                 else if ( entry.isDirectory ){
        //                     // create branch tree node using entry.name
        //                     console.log( tabs + entry.name );
        //                     
        //                     nestingLevel++;
        //                     readDirectory( entry )
        //                 }
        //             }
        //         }
        // 
        // // Convert to jsTree's JSON model format
        // function _renderSubtree(fileListData) {
        //  var result = [];
        //  $(fileListData).each(function(index, item) {
        //      var entry = {
        //          data: (item.folder ? item.name : item)
        //          // for additional options, see http://www.jstree.com/documentation/json_data
        //      };
        //      if (item.folder) {
        //          entry.children = _renderSubtree(item.items);
        //      }
        // 
        //      result.push(entry);
        //  });
        //  return result;
        // }
        // 
        // var treeJSON = _renderSubtree(fileListData);

		// TODO: fetch from real file APIs
		// var projectFiles = JSON.parse(brackets.file.getDirectoryListing(rootPath)); //eval(
		// fileListData = [];
		
		// projectFiles.forEach(function(index, item) {
			// // Filter down to just visible files
			// if (ProjectManager.shouldShowFile(item)) {
				// if (brackets.file.isDirectory(rootPath + "/" + item))
					// fileListData.push( { name:item, folder:true, items:[] } );
				// else
					// fileListData.push(item);
			// }
		// });
	}
	
	// ProjectManager._currentProjectRoot = rootPath;
};

/**
 * Returns true if the given file should be displayed in the file tree UI.
 * @param fileName File name, including extension but excluding path
 */
ProjectManager.shouldShowFile = function(fileName) {
	// Ignore names starting with "."
	if (item.indexOf(".") == 0) return false;
	
	return true;
};

/**
 * @private
 * Given a tree of file data, display it in the file tree UI (replacing any existing file tree that
 * was previously displayed).
 */
ProjectManager._renderTree = function(treeJSONData) {
	// Clear old project files
	var projectList = $("#project-files");
	projectList.html("");
	
	// Transform into tree widget
	projectList.parent().jstree({
		plugins : ["ui", "themes", "json_data"],
		json_data : { data:treeJSONData },
		core : { animation:0 },
		themes : { theme:"brackets", url:"styles/jsTreeTheme.css", dots:false, icons:false },
			//(note: our actual jsTree theme CSS lives in brackets.less; we specify an empty .css
			// file because jsTree insists on loading one itself)
		strings : { loading : "Loading ...", new_node : "New node" }	// TODO: localization
	});
};