/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */


define(function (require, exports, module) {
    'use strict';
    
    var FileIndexManager    = require("FileIndexManager"),
        DocumentManager     = require("DocumentManager"),
    	FileViewController 	= require("FileViewController");


    var queryDialog =
        'File Search: \
        <input type="text" autocomplete="off" id="quickFileOpenSearch" style="width: 15em">';
    
    function dialog(cm, dialogHTML, closeCallback) {
    	var options = { closeOnEnterKey: false, closeOnClick: false};

    	var closeFunc;
		if (cm.openEditorDialog)
			closeFunc = cm.openEditorDialog(dialogHTML, options, closeCallback);

        // TODO: show file name and fullpath
		$('input#quickFileOpenSearch').smartAutoComplete({
    		source: FileIndexManager.getFileInfoList("all"),
    		maxResults: 10,
    		forceSelect: false,
    		typeAhead: true,
            filter: function(term, source) {
                var filteredList = $.map(source, function(fileInfo) {
                    if( fileInfo.name.toLowerCase().indexOf(term.toLowerCase()) !== -1 ) {
                        return fileInfo.name;
                    }
                }).sort( function(a,b) { 
                    return a > b;
                });

                return filteredList;
            },
            resultFormatter: function(r) { 
                return ("<li>" + r.replace(new RegExp($(this.context).val(),"gi"), "<strong>$&</strong>") + "</li>"); 
            }



   		}).bind ( {
   			itemSelect: function(ev, selected_item) {
                var value = $(selected_item).text();
                if(value !== "") {
                    value = $('input#quickFileOpenSearch').text();
                }

                console.log(value);
		      	closeFunc(value); 
		    }

	   	});

	}

    function doFileSearch(cm, rev) {
        //var state = getSearchState(cm);
        //if (state.query) return findNext(cm, rev);
        dialog(cm, queryDialog, function(query) {
            cm.operation(function() {
                if (!query) 
                	return;

                // if(query.charAt(0) === ":") {
                //     var lineNumber = parseInt(query.slice(1, query.length - 1));
                //     if( lineNumber !== NaN) {
                //         DocumentManager.getCurrentDocument().setCursor( lineNumber, 0);
                //     }
                // }

                var matches = FileIndexManager.getMatches("all", query);
                if (matches.length > 0) {
                	FileViewController.addToWorkingSetAndSelect( matches[0].fullPath, FileViewController.WORKING_SET_VIEW);
                }
            });
        });
    }


	CodeMirror.commands.fileFind = function(cm) {doFileSearch(cm);};
});