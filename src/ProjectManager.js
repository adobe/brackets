/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

var ProjectManager = {};

ProjectManager.loadProject = function(rootPath) {
	// Set title
	var projectName = rootPath.substring(rootPath.lastIndexOf("/") + 1);
	$("#project-title").html(projectName);
	
	// Build file list
	var fileListData;
	
	if (brackets.inBrowser) {
		var subfolderInner = { name:"Folder_inner", folder: true, items:["subsubfile_1","subsubfile_2"] };
		fileListData = [
			"Dummy tree content:",
			{ name:"Folder_1", folder: true, items:["subfile_1","subfile_2","subfile_3"] },
			{ name:"Folder_2", folder: true, items:["subfile_4",subfolderInner,"subfile_5"] },
			"file_1",
			"file_2"
		];
		
	} else {
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
	
	// Show file list in UI
	ProjectManager._renderTree(fileListData);
	
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
ProjectManager._renderTree = function(fileListData) {
	// Clear old project files
	var projectList = $("#project-files");
	projectList.html("");
	
	// Convert to jsTree's JSON model format
	function _renderSubtree(fileListData) {
		var result = [];
		$(fileListData).each(function(index, item) {
			var entry = {
				data: (item.folder ? item.name : item)
				// for additional options, see http://www.jstree.com/documentation/json_data
			};
			if (item.folder) {
				entry.children = _renderSubtree(item.items);
			}
			
			result.push(entry);
		});
		return result;
	}
	
	var treeJSON = _renderSubtree(fileListData);
	
	// Transform into tree widget
	projectList.parent().jstree({
		plugins : ["ui", "themes", "json_data"],
		json_data : { data:treeJSON },
		core : { animation:0 },
		themes : { theme:"brackets", url:"styles/jsTreeTheme.css", dots:false, icons:false },
			//(note: our actual jsTree theme CSS lives in brackets.less; we specify an empty .css
			// file because jsTree insists on loading one itself)
		strings : { loading : "Loading ...", new_node : "New node" }	// TODO: localization
	});
};