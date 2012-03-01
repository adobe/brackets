/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror */

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
    function FileLocation(fullPath, lineNumber, functionName) {
        this.fullPath = fullPath;
        this.lineNumber = lineNumber;
        this.functionName = functionName
    }

    /**
    * QuickNavigateDialog class
    * @constructor
    *
    */
    function QuickNavigateDialog(codemirror) {
        this.searchField = undefined; // defined when showDialog() is called
        this.closed = false;
        this.result = null; // $.Deferred, assigned by showShowDialog() resolved by _close()
        this.fileLocation = new FileLocation();
        this.functionList = [];

        // TODO (issue 311) - remove code mirror references
        this.codemirror = codemirror;
    }

    /**
    * Creates a dialog div floating on top of the current code mirror editor
    */
    QuickNavigateDialog.prototype._createDialogDiv = function (cm, template) {
        // TODO (issue 311) - using code mirror's wrapper element for now. Need to design a Brackets equivalent.
        var wrap = this.codemirror.getWrapperElement();
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
    QuickNavigateDialog.prototype._close = function (value) {
        if (this.closed) {
            return;
        }
        this.closed = true;

;

        // extract line number
        var query = this.searchField.val();
        var regInfo = query.match(/(\d+)/);
        // TODO store line number

        // todo extra @function
        var regInfo = query.match(/@(.+)/);

        // remove the UI
        this.dialog.parentNode.removeChild(this.dialog);
        //this.searchField.remove();

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
                suggestList = filelistResult;
                var dialogHTML = 'Quick Open: <input type="text" autocomplete="off" id="quickFileOpenSearch" style="width: 30em">';
                that._createDialogDiv(that, dialogHTML);
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

                        if (functionSearch && itemInfo.hasOwnProperty("functionName")) {
                            var functionName = itemInfo.functionName;
                            if (functionName.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
                                return functionName;
                            }
                        } else if (!functionSearch && itemInfo.hasOwnProperty("fullPath")) {
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
                            return filenameA > filenameB;
                        }

                    });

                    return filteredList;
                }

                that._generateFunctionList();
                suggestList.push.apply(suggestList, that.functionList)



                // Create the auto suggest list of filenames
                that.searchField.smartAutoComplete({
                    source: suggestList,
                    maxResults: 10,
                    forceSelect: false,
                    typeAhead: true,
                    filter: _handleFilter,
                    resultFormatter: _handleResultsFormatter
                });
        
                that.searchField.bind({
                    // close the dialog when the user selects an item
                    itemSelect: function (ev, selected_item) {
                        var fullPath = $(selected_item).attr("data-fullpath");
                        if (fullPath) {
                            that.fileLocation.fullPath = decodeURIComponent(fullPath); 
                        } else {
                            that._getFunctionLocation($(selected_item).text());
                        }
                        
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
                            
                            that._close();
                            EditorManager.focusEditor();
                        }
                    }

        
                });
        
                that.searchField.focus();
            });

        return this.result;
    };

    function _computeLineNumber(text, offset) {
        var lines = text.substr(0, offset);
        return lines.split("\n").length - 1;
    }

    // TODO: rename function to something better.
    QuickNavigateDialog.prototype._getFunctionLocation = function (functionName) {
        this.fileLocation.functionName = functionName;

        this.functionList.forEach(function (functionInfo) {
            if (functionInfo.functionName === functionName) {
                this.fileLocation.lineNumber = functionInfo.lineNumber;
                return;
            }
        });

        this.fileLocation.lineNumber = undefined;
    }

    QuickNavigateDialog.prototype._generateFunctionList = function () {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            // TODO
        }

        var docText = doc.getText();
        this.functionList = [];
        var regex = new RegExp(/(function\b)(.+)\b\(/gi);
        var info;

        while(info = regex.exec(docText))
        {
            this.functionList.push({ 
                functionName: $.trim(info[2]), 
                index: info.index, 
                lineNumber: _computeLineNumber(docText, info.index) 
            });
            //console.log(info[2]);
        }
    }

        
    /**
    * Displays a non-modal embedded dialog above the code mirror edit that allows the user to quickly 
    * navigate to different files and parts of the current file.
    * The search field lists files in the project. The user can enter ":" followed by a line
    * number to navigate to a specific line in the current file.
    */
    function doFileSearch() {


        // TODO (issue 311) - using code mirror's wrapper element for now which requires us to get the editor and the code mirror instance
        var curDoc = DocumentManager.getCurrentDocument();
        if (!curDoc) {
            return;
        }
        var cm = curDoc._editor;

        var dialog = new QuickNavigateDialog(cm);
        dialog.showDialog()
            .done(function (fileLocation) {
                if (fileLocation) {
                    if (fileLocation.fullPath) {
                        CommandManager.execute(Commands.FILE_OPEN, {fullPath: fileLocation.fullPath});
                    }

                    if (fileLocation.lineNumber) {
                        DocumentManager.getCurrentDocument().setCursor(fileLocation.lineNumber - 1, 0);
                    }

                    // TODO old
                    // if (query.charAt(0) === ":") {
                    //     var lineNumber = parseInt(query.slice(1, query.length), 10);
                    //     if (!isNaN(lineNumber)) {
                    //         DocumentManager.getCurrentDocument().setCursor(lineNumber - 1, 0);
                    //     }
                    // } else {
                    //     CommandManager.execute(Commands.FILE_OPEN, {fullPath: query});
                    // }
                }
            });
    }

    CommandManager.register(Commands.FILE_QUICK_NAVIGATE, doFileSearch);
});