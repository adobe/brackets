/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, brackets: false, $ */

/*
* Displays an auto suggest popup list of files to allow the user to quickly navigate to a file.
* Uses FileIndexManger to supply the file list and registers Commands.NAVIGATE_QUICK_OPEN with Brackets.
* 
* TODO (issue 333) - currently jquery smart auto complete is used for the popup list. While it mostly works
* it has several issues, so it should be replace with an alternative. Issues:
* - only accepts an array of strings. A list of objects is preferred to avoid some work arounds to display 
*   both the path and filename.
* - the popup position logic has flaws that require css work-arounds
* - the popup properties cannot be modified once the object is constructed
*/


define(function (require, exports, module) {
    'use strict';

    var FileIndexManager    = brackets.getModule("project/FileIndexManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        Commands            = brackets.getModule("command/Commands"),
        ProjectManager      = brackets.getModule("project/ProjectManager");

    /**
    * QuickNavigateDialog class
    * @constructor
    *
    */
    function QuickNavigateDialog() {
        this.closed = false;
        this.result = null; // $.Deferred
    }

    /**
    * Creates a dialog div floating on top of the current code mirror editor
    */
    QuickNavigateDialog.prototype._createDialogDiv = function (template) {
        var wrap = $("#editorHolder")[0];
        this.dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
        this.dialog.className = "CodeMirror-dialog";
        this.dialog.innerHTML = '<div style=\'background-image:url(' + require.toUrl("./ty.jpg") + ')\'>' + template + '</div>';
    };

    function _filenameFromPath(path) {
        return path.slice(path.lastIndexOf("/") + 1, path.length);
    }
    
    /**
    * Closes the search dialog and resolves the promise that showDialog returned
    */
    QuickNavigateDialog.prototype._close = function (value) {
        if (this.closed) {
            return;
        }
        
        this.closed = true;
            
        this.dialog.parentNode.removeChild(this.dialog);

        $(".smart_autocomplete_container").remove();

        this.result.resolve(value);
    };
        
    /**
    * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
    * @param {?string} initialString Default text to prepopulate the search field with
    * @returns {$.Promise} a promise that is resolved when the dialgo closes with the string value from the search field
    */
    QuickNavigateDialog.prototype.showDialog = function (initialString) {
        var that = this;
        var fileInfoList;
        this.result = new $.Deferred();

        FileIndexManager.getFileInfoList("all")
            .done(function (filelistResult) {
                fileInfoList = filelistResult;
                var dialogHTML = 'Quick Open: <input type="text" autocomplete="off" id="quickFileOpenSearch" style="width: 30em">';
                that._createDialogDiv(dialogHTML);
                var closed = false;
                var searchField = $('input#quickFileOpenSearch');
                
                searchField.attr("value", initialString || "");
                searchField.get(0).select();

                // auto suggest list helper function
                function _handleResultsFormatter(path) {
                    var filename = _filenameFromPath(path);
                    var rPath = ProjectManager.makeProjectRelativeIfPossible(path);
                    var boldName = filename.replace(new RegExp($('input#quickFileOpenSearch').val(), "gi"), "<strong>$&</strong>");
                    return "<li data-fullpath='" + encodeURIComponent(path) + "'>" + boldName +
                        "<br><span class='quickOpenPath'>" + rPath + "</span></li>";
                }

                // auto suggest list helper function
                function _handleFilter(term, source) {
                    var filteredList = $.map(source, function (fileInfo) {
                        // match term again filename only (not the path)
                        var path = fileInfo.fullPath;
                        var filename = _filenameFromPath(path);
                        if (filename.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
                            return fileInfo.fullPath;
                        } else {
                            return null;
                        }
                    }).sort(function (a, b) {
                        // sort by filename
                        var filenameA = _filenameFromPath(a).toLowerCase();
                        var filenameB = _filenameFromPath(b).toLowerCase();
                        if (filenameA < filenameB) {
                            return -1;
                        } else if (filenameA > filenameB) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });

                    return filteredList;
                }

                // Create the auto suggest list of filenames
                searchField.smartAutoComplete({
                    source: fileInfoList,
                    maxResults: 10,
                    forceSelect: false,
                    typeAhead: true,
                    filter: _handleFilter,
                    resultFormatter: _handleResultsFormatter
                });
        
                searchField.bind({
                    // close the dialog when the user selects an item
                    itemSelect: function (ev, selected_item) {
                        var value = decodeURIComponent($(selected_item).attr("data-fullpath"));
                        that._close(value);
                    },
        
                    keydown: function (e) {
                        var query = searchField.val();

                        // close the dialog when the ENTER (23) or ESC (27) key is pressed
                        if ((e.keyCode === 13 && query.charAt(0) === ":") || e.keyCode === 27) {
                            e.stopPropagation();
                            e.preventDefault();

                            // clear the query on ESC key
                            if (e.keyCode === 27) {
                                query = null;
                            }
                            
                            that._close(query);
                            EditorManager.focusEditor();
                        }
                    }

        
                });
        
                searchField.focus();
            });

        return this.result;
    };


        
    /**
    * Displays a non-modal embedded dialog above the code mirror edit that allows the user to quickly 
    * navigate to different files and parts of the current file.
    * The search field lists files in the project. The user can enter ":" followed by a line
    * number to navigate to a specific line in the current file.
    */
    function doFileSearch() {
        // Default to searching for the current selection
        var currentEditor = EditorManager.getFocusedEditor();
        var initialString = currentEditor && currentEditor.getSelectedText();
                            
        var dialog = new QuickNavigateDialog();
        
        dialog.showDialog(initialString)
            .done(function (query) {
                if (query) {
                    if (query.charAt(0) === ":") {
                        var lineNumber = parseInt(query.slice(1, query.length), 10);
                        if (!isNaN(lineNumber)) {
                            var editor = EditorManager.getCurrentFullEditor();
                            editor.setCursorPos(lineNumber - 1, 0);
                        }
                    } else {
                        CommandManager.execute(Commands.FILE_OPEN, {fullPath: query});
                    }
                }
            });
    }

    CommandManager.register(Commands.NAVIGATE_QUICK_OPEN, doFileSearch);
});