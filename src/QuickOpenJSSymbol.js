/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */



define(function (require, exports, module) {
    'use strict';

    var QuickFileOpen		= require("QuickFileOpen"),
    	FileIndexManager    = require("FileIndexManager"),
	    DocumentManager     = require("DocumentManager");

	var functionList = []; // array of FileLocations

   /** TODO: this is duplicated in QuickFileOpen because we can't have a circular dependency. Solve later.
    * FileLocation class
    * @constructor
    *
    */
    function FileLocation(fullPath, line, column, functionName) {
        this.fullPath = fullPath;
        this.line = line;
        this.column = column;
        this.functionName = functionName;
    }

    var fileLocation = new FileLocation();

    // currently NOT used. This was an attempt to use CodeMirror tokens to find functions
    function generateFunctionList2() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        var docText = doc.editor.getText();
		var mode = CodeMirror.getMode({indentUnit: 2}, "javascript");
        var state = CodeMirror.startState(mode);

        var stream = new CodeMirror.StringStream(docText);
        var style, token;
        while (!stream.eol()) {
            style = mode.token(stream, state);
            token = stream.current();

            stream.start = stream.pos;

            console.log( token + " " + style );

            // if(style==="tag") {
            // 	console.log( token + "    " + style );
            // }
        }
    }


    // create function list and caches it in FileIndexMangage
    function createCachedFunctionList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        var fileInfo = FileIndexManager.getFileInfo(doc.file.fullPath);
        var data = FileIndexManager.getFileInfoData(fileInfo, "JavaScriptFunctionList");
        if(!fileInfo.dirty && data) {
        	// cached function list data is present and clean so use it
        	functionList = data;
        } else {
        	// function list data is not cached or is dirty, so rebuild
	    	functionList = [];
	        var docText = doc.getText();
	        
	        var regex = new RegExp(/(function\b)(.+)\b\(.*\)/gi);
	        var info, i, line;

	        var lines = docText.split("\n");

	        for (i = 0; i < lines.length; i++) {
	            line = lines[i];
	            info = regex.exec(line);

	            if (info) {
	                var funcName = $.trim(info[0]);
	                functionList.push(new FileLocation(null, i, line.indexOf(funcName), funcName));
	                //console.log(info[2]);
	            }
	        }

	        FileIndexManager.setFileInfoData(fileInfo, "JavaScriptFunctionList", functionList);
	    }
    }

    function filter(query) {
    	createCachedFunctionList();

    	query = query.slice(query.indexOf("@")+1, query.length);
        var filteredList = $.map(functionList, function (itemInfo) {

	        var functionName = itemInfo.functionName;
	        if (functionName.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
	            return functionName;
	        }
   		}).sort(function (a, b) {
            if(a > b) {
                return -1
            } else if(a < b) {
                return 1
            } else {
                return 0;
            }
        });

    	return filteredList;
    }

    function match(query) {
    	if (query.indexOf("@") !== -1) {
    		return true;
    	}
    } 

    function itemFocus(selectedItem) {
	    setLocationFromFunctionName($(selectedItem).text());
        
	    var from = {line: fileLocation.line, ch: fileLocation.column};
	    var to = {line: fileLocation.line, ch: fileLocation.column + fileLocation.functionName.length};
	    DocumentManager.getCurrentDocument().editor.setSelection(from, to);
    }

    function itemSelect(selectedItem) {
        if (fileLocation.functionName) {
            var from = {line: fileLocation.line, ch: fileLocation.column};
            var to = {line: fileLocation.line, ch: fileLocation.column + fileLocation.functionName.length};
            DocumentManager.getCurrentDocument().editor.setSelection(from, to);
        }
    }

    function resultsFormatter(item, query) {
        query = query.slice(query.indexOf("@")+1, query.length);
		var boldName = item.replace(new RegExp(query, "gi"), "<strong>$&</strong>");
        return "<li>" + boldName + "</li>";
    }

    function trigger(query) {
    	return query.indexOf("@") !== -1;
    }

    // TODO: this feals ugly. Would prefer to create via QuickOpenProvider in QuickFileOpen
    function getProvider() {
    	var jsFuncProvider = { 	name: "JavaScript functions",
    						 	fileTypes: ["js"],
    						 	filter: filter,
    						 	match: match, 
    							itemFocus: itemFocus,
    							itemSelect: itemSelect,
    							resultsFormatter: resultsFormatter,
    							trigger: trigger,
    							combineWithFileSearch: true
    						};

    	return jsFuncProvider;
    }

    function setLocationFromFunctionName (functionName) {
        var i;
        for (i = 0; i < functionList.length; i++) {
            var functionInfo = functionList[i];
            if (functionInfo.functionName === functionName) {
                fileLocation = functionInfo;
                return;
            }
        }

        this.fileLocation.line = undefined;
    }


    exports.getProvider = getProvider;

});