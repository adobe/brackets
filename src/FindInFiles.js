/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

/*
*/


define(function (require, exports, module) {
    'use strict';
    
    var Async               = require("Async"),
        CommandManager      = require("CommandManager"),
        Commands            = require("Commands"),
        DocumentManager     = require("DocumentManager"),
        FileIndexManager    = require("FileIndexManager");

    // Much of this file was copied from QuickFileOpen. We should have a common dialog
    // class that everyone can use.
    
    /**
    * FindInFilesDialog class
    * @constructor
    *
    */
    function FindInFilesDialog() {
        this.closed = false;
        this.result = null; // $.Deferred
    }

    /**
    * Creates a dialog div floating on top of the current code mirror editor
    */
    FindInFilesDialog.prototype._createDialogDiv = function (template) {
        var wrap = $("#editorHolder")[0];
        this.dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
        this.dialog.className = "CodeMirror-dialog";
        this.dialog.innerHTML = '<div>' + template + '</div>';
    };
    
    /**
    * Closes the search dialog and resolves the promise that showDialog returned
    */
    FindInFilesDialog.prototype._close = function (value) {
        if (this.closed) {
            return;
        }
        
        this.closed = true;
            
        this.dialog.parentNode.removeChild(this.dialog);

        this.result.resolve(value);
    };
        
    /**
    * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
    * @returns {$.Promise} a promise that is resolved when the dialgo closes with the string value from the search field
    */
    FindInFilesDialog.prototype.showDialog = function () {
        var dialogHTML = 'Find in Files: <input type="text" id="findInFilesInput" style="width: 10em"> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';
        this.result = new $.Deferred();
        this._createDialogDiv(dialogHTML);
        var searchField = $('input#findInFilesInput');
        var that = this;
        
        searchField.bind("keydown", function (event) {
            if (event.keyCode === 13 || event.keyCode === 27) {  // Enter/Return key or Esc key
                event.stopPropagation();
                event.preventDefault();
                
                var query = searchField.val();
                
                if (event.keyCode === 27) {
                    query = null;
                }
                
                that._close(query);
            }
        });
        
        return this.result;
    };


        
    /**
    * Displays a non-modal embedded dialog above the code mirror editor that allows the user to do
    * a find operation across all files in the project.
    */
    function doFindInFiles() {

        var dialog = new FindInFilesDialog();
        dialog.showDialog()
            .done(function (query) {
                if (query) {
                    FileIndexManager.getFileInfoList("all")
                        .done(function (fileListResult) {
                            Async.doInParallel(fileListResult, function (fileInfo) {
                                DocumentManager.getDocumentContents(fileInfo.fullPath)
                                    .done(function (contents) {
                                    });
                            })
                                .done(function () {
                                });
                        });
                }
            });
    }

    CommandManager.register(Commands.FIND_IN_FILES, doFindInFiles);
});