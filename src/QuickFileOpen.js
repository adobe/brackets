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

    // class
    function QuickNavigateDialog(codemirror, resultCallback) {
        var that = this;
        this.closed = false;
        this.codemirror = codemirror;


        function dialogDiv(cm, template) {
            var wrap = codemirror.getWrapperElement();
            var dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
            dialog.className = "CodeMirror-dialog";
            dialog.innerHTML = '<div>' + template + '</div>';
            return dialog;
        }

        function filenameFromPath(path) {
            return path.slice(path.lastIndexOf("/") + 1, path.length);
        }

        function handleFilter(term, source) {
            var filteredList = $.map(source, function (fileInfo) {
                // match term again filename only (not the path)
                var path = fileInfo.fullPath;
                var filename = filenameFromPath(path);
                if (filename.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
                    return fileInfo.fullPath;
                }
            }).sort(function (a, b) {
                // sort by filename
                var filenameA = filenameFromPath(a);
                var filenameB = filenameFromPath(b);
                return filenameA > filenameB;
            });

            return filteredList;
        }

        function handleResultsFormatter(path) {
            var filename = filenameFromPath(path);
            var rPath = ProjectManager.makeProjectRelativeIfPossible(path);
            var boldName = filename.replace(new RegExp($('input#quickFileOpenSearch').val(), "gi"), "<strong>$&</strong>");
            return "<li data-fullpath='" + encodeURIComponent(path) + "'>" + boldName +
                "<br><span class='quickOpenPath'>" + rPath + "</span></li>";
        }
        
        this.close = function (value) {
            if (this.closed) {
                return;
            }
            
            this.closed = true;
                
            this.dialog.parentNode.removeChild(this.dialog);

            if (value) {
                resultCallback(value);
            }
        };
        
        this.showDialog = function () {
            var dialogHTML = 'File Search: <input type="text" autocomplete="off" id="quickFileOpenSearch" style="width: 30em">';
    
            var options = { closeOnEnterKey: true, closeOnClick: false};
            this.dialog = dialogDiv(this, dialogHTML);
            var closed = false, that = this;
            this.searchField = $('input#quickFileOpenSearch');
    
            this.searchField.smartAutoComplete({
                source: FileIndexManager.getFileInfoList("all"),
                maxResults: 10,
                forceSelect: false,
                typeAhead: true,
                filter: handleFilter,
                resultFormatter: handleResultsFormatter
            });
    
            this.searchField.bind({
                itemSelect: function (ev, selected_item) {
                    var value = decodeURIComponent($(selected_item).attr("data-fullpath"));
                    
                   
                    
                    that.close(value);
                },
    
                keydown: function (e) {
                    var query = that.searchField.val();
                    if ((e.keyCode === 13 && query.charAt(0) === ":") || e.keyCode === 27) {
                        EditorManager.focusEditor();
                        e.stopPropagation();
                        e.preventDefault();

                        if (e.keyCode === 27) {
                            query = null;
                        }
                        
                        that.close(query);
                    }
                },

                blur: function (e) {
                    that.close(null);
                }
    
            });
    
            this.searchField.focus();
            
        };
        
        this.showDialog();
    }

    function doFileSearch(cm, rev) {
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
    }
    



	CodeMirror.commands.fileFind = function (cm) { doFileSearch(cm); };
});