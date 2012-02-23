/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror */

/*
* Displays a auto suggest popup list of files in the current project to allow the user
* to quickly navigate to a file.
*
*/


define(function (require, exports, module) {
    'use strict';
    
    var FileIndexManager    = require("FileIndexManager"),
        DocumentManager     = require("DocumentManager"),
        CommandManager      = require("CommandManager"),
        EditorManager       = require("EditorManager"),
        Commands            = require("Commands"),
        ProjectManager      = require("ProjectManager");

    /**
    * QuickNavigateDialog class
    * @constructor
    *
    */
    function QuickNavigateDialog(codemirror, resultCallback) {
        this.closed = false;
        this.codemirror = codemirror;
        this.resultCallback = resultCallback;
    }


    QuickNavigateDialog.prototype._dialogDiv = function (cm, template) {
        // TODO (issue 311) - using code mirror's wrapper element for now. Need to design a Brackets equivalent.
        var wrap = this.codemirror.getWrapperElement();
        var dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
        dialog.className = "CodeMirror-dialog";
        dialog.innerHTML = '<div>' + template + '</div>';
        return dialog;
    };

    QuickNavigateDialog.prototype._filenameFromPath = function (path) {
        return path.slice(path.lastIndexOf("/") + 1, path.length);
    };
    
        
    QuickNavigateDialog.prototype._close = function (value) {
        if (this.closed) {
            return;
        }
        
        this.closed = true;
            
        this.dialog.parentNode.removeChild(this.dialog);

        if (value) {
            this.resultCallback(value);
        }
    };
        
    QuickNavigateDialog.prototype.showDialog = function () {
        var that = this;
        var fileInfoList;

        FileIndexManager.getFileInfoList("all", function (filelistResult) {
            fileInfoList = filelistResult;
            var dialogHTML = 'Quick Open: <input type="text" autocomplete="off" id="quickFileOpenSearch" style="width: 30em">';
            that.dialog = that._dialogDiv(that, dialogHTML);
            var closed = false;
            that.searchField = $('input#quickFileOpenSearch');

            function _handleResultsFormatter(path) {
                var filename = that._filenameFromPath(path);
                var rPath = ProjectManager.makeProjectRelativeIfPossible(path);
                var boldName = filename.replace(new RegExp($('input#quickFileOpenSearch').val(), "gi"), "<strong>$&</strong>");
                return "<li data-fullpath='" + encodeURIComponent(path) + "'>" + boldName +
                    "<br><span class='quickOpenPath'>" + rPath + "</span></li>";
            }

            function _handleFilter(term, source) {
                var filteredList = $.map(source, function (fileInfo) {
                    // match term again filename only (not the path)
                    var path = fileInfo.fullPath;
                    var filename = that._filenameFromPath(path);
                    if (filename.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
                        return fileInfo.fullPath;
                    }
                }).sort(function (a, b) {
                    // sort by filename
                    var filenameA = that._filenameFromPath(a);
                    var filenameB = that._filenameFromPath(b);
                    return filenameA > filenameB;
                });

                return filteredList;
            }
    
            that.searchField.smartAutoComplete({
                source: fileInfoList,
                maxResults: 10,
                forceSelect: false,
                typeAhead: true,
                filter: _handleFilter,
                resultFormatter: _handleResultsFormatter
            });
    
            that.searchField.bind({
                itemSelect: function (ev, selected_item) {
                    var value = decodeURIComponent($(selected_item).attr("data-fullpath"));
                    that._close(value);
                },
    
                keydown: function (e) {
                    var query = that.searchField.val();
                    if ((e.keyCode === 13 && query.charAt(0) === ":") || e.keyCode === 27) {
                        e.stopPropagation();
                        e.preventDefault();

                        if (e.keyCode === 27) {
                            query = null;
                        }
                        
                        that._close(query);
                        EditorManager.focusEditor();
                    }
                },

                blur: function (e) {
                    that._close(null);
                }
    
            });
    
            that.searchField.focus();
        });
    };
        

    function doFileSearch() {

        // TODO (issue 311) - using code mirror's wrapper element for now which requires us to get the editor and the code mirror instance
        var curDoc = DocumentManager.getCurrentDocument();
        if (!curDoc) {
            return;
        }
        var cm = curDoc._editor;

        var dialog = new QuickNavigateDialog(cm, function (query) {
            cm.operation(function () {
                if (!query) {
                    return;
                }

                if (query.charAt(0) === ":") {
                    var lineNumber = parseInt(query.slice(1, query.length), 10);
                    if (!isNaN(lineNumber)) {
                        DocumentManager.getCurrentDocument().setCursor(lineNumber - 1, 0);
                    }
                } else {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: query});
                }
            });
        });

        dialog.showDialog();
    }

    CommandManager.register(Commands.FILE_QUICK_NAVIGATE, doFileSearch);
});