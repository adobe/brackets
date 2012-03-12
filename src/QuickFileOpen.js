/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

/*
* Displays an auto suggest popup list of files to allow the user to quickly navigate to a file.
* Uses FileIndexManger to supply the file list and registers Commands.FILE_QUICK_NAVIGATE with Brackets.
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
    
    var FileIndexManager    = require("FileIndexManager"),
        DocumentManager     = require("DocumentManager"),
        CommandManager      = require("CommandManager"),
        EditorManager       = require("EditorManager"),
        Commands            = require("Commands"),
        ProjectManager      = require("ProjectManager");

    /**
    * FileLocation class
    * @constructor
    *
    */
    function FileLocation(fullPath, line, column, functionName) {
        this.fullPath = fullPath;
        this.line = line;
        this.column = column;
        this.functionName = functionName
    }

    /**
    * QuickNavigateDialog class
    * @constructor
    *
    */
    function QuickNavigateDialog() {
        this.searchField = undefined; // defined when showDialog() is called
        this.closed = false;
        this.result = null; // $.Deferred, assigned by showShowDialog() resolved by _close()
        this.fileLocation = new FileLocation();
        this.functionList = [];
    }

    /**
    * Creates a dialog div floating on top of the current code mirror editor
    */
    QuickNavigateDialog.prototype._createDialogDiv = function (template) {
        var wrap = $("#editorHolder")[0];
        this.dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
        this.dialog.className = "CodeMirror-dialog";
        this.dialog.innerHTML = '<div>' + template + '</div>';
    };

    function _filenameFromPath(path) {
        return path.slice(path.lastIndexOf("/") + 1, path.length);
    }
    
    /**
    * Closes the search dialog and resolves the promise that showDialog returned
    */
    QuickNavigateDialog.prototype._handleItemCommit = function (value) {

        var query = this.searchField.val();


        if(this.fileLocation && !this.fileLocation.function) {
            // extract line number
            var regInfo = query.match(/(!?:)(\d+)/);
            if(regInfo) {
                this.fileLocation.line = regInfo[2] - 1;
            } else {
                regInfo = query.match(/(!?:)(\d+)/);
            }
        }

        // todo extra @function
        var regInfo = query.match(/@(.+)/);
    }


    /**
    * Closes the search dialog and resolves the promise that showDialog returned
    */
    QuickNavigateDialog.prototype._close = function (value) {
        //EditorManager.focusEditor();

        if (this.closed) {
            return;
        }
        this.closed = true;

        this.dialog.parentNode.removeChild(this.dialog);
        $(".smart_autocomplete_container").remove();

        this.result.resolve(this.fileLocation);
    };
        
    /**
    * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
    * @returns {$.Promise} a promise that is resolved when the dialgo closes with the string value from the search field
    */
    QuickNavigateDialog.prototype.showDialog = function () {
        var that = this;
        var suggestList;
        this.result = new $.Deferred();

        FileIndexManager.getFileInfoList("all")
            .done(function (filelistResult) {
                var dialogHTML = 'Quick Open: <input type="text" autocomplete="off" id="quickFileOpenSearch" style="width: 30em">';
                that._createDialogDiv(dialogHTML);
                that.searchField = $('input#quickFileOpenSearch');
                var closed = false;

                // auto suggest list helper function
                function _handleResultsFormatter(item) {
                    var term = $('input#quickFileOpenSearch').val();
                    var functionSearch = term.charAt(0) === '@';
                    if (functionSearch) {
                        term = term.slice(1, term.length);
                    }

                    if (functionSearch) {
                        var boldName = item.replace(new RegExp(term, "gi"), "<strong>$&</strong>");
                        return "<li>" + boldName + "</li>";
                    } else {
                        var filename = _filenameFromPath(item);
                        var rPath = ProjectManager.makeProjectRelativeIfPossible(item);
                        var boldName = filename.replace(new RegExp(term, "gi"), "<strong>$&</strong>");
                        return "<li data-fullpath='" + encodeURIComponent(item) + "'>" + boldName +
                            "<br><span class='quickOpenPath'>" + rPath + "</span></li>";
                    }
                }

                // auto suggest list helper function
                function _handleFilter(term, source) {
                    var functionSearch = term.charAt(0) === '@';
                    if (functionSearch) {
                        term = term.slice(1, term.length);
                    }

                    var filteredList = $.map(source, function (itemInfo) {

                        if (functionSearch && itemInfo.functionName) {
                            var functionName = itemInfo.functionName;
                            if (functionName.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
                                return functionName;
                            }
                        } else if (!functionSearch && itemInfo.fullPath) {
                            // match term against filename only (not the full path)
                            var path = itemInfo.fullPath;
                            var filename = _filenameFromPath(path);
                            if (filename.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
                                return path;
                            }
                        } else {
                            return null;
                        }   
                    }).sort(function (a, b) {

                        if (functionSearch) {
                            return a > b;
                        } else {
                            // sort by filename
                            var filenameA = _filenameFromPath(a);
                            var filenameB = _filenameFromPath(b);
                            if(filenameA > filenameB) {
                                return -1
                            } else if(filenameA < filenameB) {
                                return 1
                            } else {
                                return 0;
                            }
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
                that._generateFunctionList();
                suggestList = filelistResult.concat(that.functionList);

                that.searchField.smartAutoComplete({
                    source: suggestList,
                    maxResults: 10,
                    forceSelect: false,
                    typeAhead: true,
                    filter: _handleFilter,
                    resultFormatter: _handleResultsFormatter
                });
        
                that.searchField.bind({
                    itemSelect: function (ev, selected_item) {
                        that._handleItemCommit();
                    },

                    itemFocus: function (ev, selected_item) {
                        var fullPath = $(selected_item).attr("data-fullpath");
                        if (fullPath) {
                            that.fileLocation.fullPath = decodeURIComponent(fullPath); 

                            // TODO: make function
                            CommandManager.execute(Commands.FILE_OPEN, {fullPath: that.fileLocation.fullPath, focusEditor: false});
                        } else {
                            that._setLocationFromFunctionName($(selected_item).text());

                            // TODO: make function
                            var from = {line: that.fileLocation.line, ch: that.fileLocation.column};
                            var to = {line: that.fileLocation.line, ch: that.fileLocation.column + that.fileLocation.functionName.length};
                            DocumentManager.getCurrentDocument().setSelection(from, to);
                        }
                    },

                    lostFocus: function (e) {
                        that._close();
                    },
        
                    keydown: function (e) {
                        // close the dialog when the ENTER (13) or ESC (27) key is pressed
                        if ((e.keyCode === 13 && !$(".smart_autocomplete_container").is(":visible")) || e.keyCode === 27) {
                            e.stopPropagation();
                            e.preventDefault();

                            // clear the query on ESC key
                            if (e.keyCode === 27) {
                                that.fileLocation = undefined;
                            }
                            
                            that._handleItemCommit();
                            that._close();
                        }
                    }

        
                });
        
                that.searchField.focus();
            });

        return this.result;
    };


    // TODO: rename function to something better.
    QuickNavigateDialog.prototype._setLocationFromFunctionName = function (functionName) {

        var that = this;
        var i;
        for (i = 0; i < this.functionList.length; i++) {
            var functionInfo = this.functionList[i];
            if (functionInfo.functionName === functionName) {
                that.fileLocation = functionInfo;
                return;
            }
        }

        this.fileLocation.line = undefined;
    }

    QuickNavigateDialog.prototype._generateFunctionList = function () {
        this.functionList = [];

        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        var docText = doc.getText();
        
        var regex = new RegExp(/(function\b)(.+)\b\(/gi);
        var info, i, line;

        var lines = docText.split("\n");

        for (i = 0; i < lines.length; i++) {
            line = lines[i];
            info = regex.exec(line);

            if (info) {
                var funcName = $.trim(info[2]);
                this.functionList.push(new FileLocation(null, i, line.indexOf(funcName), funcName));
                //console.log(info[2]);
            }
        }
    }

        
    /**
    * Displays a non-modal embedded dialog above the code mirror edit that allows the user to quickly 
    * navigate to different files and parts of the current file.
    * The search field lists files in the project. The user can enter ":" followed by a line
    * number to navigate to a specific line in the current file.
    */
    function doFileSearch() {

        var dialog = new QuickNavigateDialog();
        dialog.showDialog()
            .done(function (fileLocation) {
                if (fileLocation) {
                    if (fileLocation.fullPath) {
                        CommandManager.execute(Commands.FILE_OPEN, {fullPath: fileLocation.fullPath});
                    }

                    if (fileLocation.functionName) {
                        var from = {line: fileLocation.line, ch: fileLocation.column};
                        var to = {line: fileLocation.line, ch: fileLocation.column + fileLocation.functionName.length};
                        DocumentManager.getCurrentDocument().setSelection(from, to);
                    } else if (fileLocation.line) {
                        var from = {line: fileLocation.line, ch: 0};
                        var to = {line: fileLocation.line, ch: 0};
                        DocumentManager.getCurrentDocument().setSelection(from, to);
                    }

                    EditorManager.focusEditor();
                }
            });
    }

    CommandManager.register(Commands.FILE_QUICK_NAVIGATE, doFileSearch);
});
