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
        QuickOpenJSSymbol   = require("QuickOpenJSSymbol"),
        ProjectManager      = require("ProjectManager");


    var providers = [];
    var currentProvider = null;
    var fileList;
    var suggestList = [];
    var fileLocation = new FileLocation();
    var origDoc;
    var origCursorPos;

    function QuickOpenProvider(name, fileTypes, filter, match, itemFocus, itemSelect, resultsFormatter, trigger, combineWithFileSearch) {
        this.name = name;
        this.fileTypes = []; // default: all
        this.filter = filter;
        this.match = match;
        this.itemFocus = itemFocus;
        this.itemSelect = itemSelect;
        this.trigger = trigger;
        this.resultsFormatter = resultsFormatter;
        this.combineWithFileSearch = combineWithFileSearch;
    }
    
    function addProvider(provider) {
        providers.push(new QuickOpenProvider(provider.name,
            provider.fileTypes,
            provider.filter,
            provider.match,
            provider.itemFocus,
            provider.itemSelect,
            provider.resultsFormatter,
            provider.trigger,
            provider.combineWithFileSearch));
    }

    /**
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

    /**
    * QuickNavigateDialog class
    * @constructor
    *
    */
    function QuickNavigateDialog() {
        this.searchField = undefined; // defined when showDialog() is called
        this.closed = false;
        this.result = null; // $.Deferred, assigned by showShowDialog() resolved by _close()
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
    QuickNavigateDialog.prototype._handleItemSelect = function (selectedItem) {
        if (currentProvider) {
            currentProvider.itemSelect(selectedItem);
        } else {
            var query = this.searchField.val();

            // TODO rework this
            if (fileLocation) {
                // extract line number
                var regInfo = query.match(/(!?:)(\d+)/); // colon followed by a digit
                if (regInfo) {
                    fileLocation.line = regInfo[2] - 1;
                }

                // Do navigation
                if (fileLocation.fullPath) {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: fileLocation.fullPath});
                }

                if (fileLocation.line) {
                    var from = {line: fileLocation.line, ch: 0};
                    var to = {line: fileLocation.line, ch: 0};
                    DocumentManager.getCurrentDocument().editor.setSelection(from, to);
                }

                
            }
        }

        this._close();
        EditorManager.focusEditor();
    };

    QuickNavigateDialog.prototype._handleItemFocus = function (selectedItem) {
        if (currentProvider) {
            currentProvider.itemFocus(selectedItem);
        } else {
            var fullPath = $(selectedItem).attr("data-fullpath");
            if (fullPath) {
                fileLocation.fullPath = decodeURIComponent(fullPath);

                // TODO: make function
                CommandManager.execute(Commands.FILE_OPEN, {fullPath: fileLocation.fullPath, focusEditor: false});
            }
        }
    };


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

        this.result.resolve(fileLocation);
    };
    
    function filterFileList(query) {
        var filteredList = $.map(fileList, function (itemInfo) {
            // match query against filename only (not the full path)
            var path = itemInfo.fullPath;
            var filename = _filenameFromPath(path);
            if (filename.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                return path;
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

    // auto suggest list helper function
    function _handleFilter(query) {
        var i;
        for (i = 0; i < providers.length; i++) {
            var provider = providers[i];
            if (provider.match(query)) {
                currentProvider = provider;
                return provider.filter(query);
            }
        }

        currentProvider = null;
        return filterFileList(query);
    }


    // auto suggest list helper function
    function _handleResultsFormatter(item) {
        var query = $('input#quickFileOpenSearch').val();

        if (currentProvider) {
            return currentProvider.resultsFormatter(item, query);
        } else {
            // Format filename result
            var filename = _filenameFromPath(item);
            var rPath = ProjectManager.makeProjectRelativeIfPossible(item);
            var boldName = filename.replace(new RegExp(query, "gi"), "<strong>$&</strong>");
            return "<li data-fullpath='" + encodeURIComponent(item) + "'>" + boldName +
                "<br><span class='quickOpenPath'>" + rPath + "</span></li>";
        }
    }
        
    /**
    * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
    * @returns {$.Promise} a promise that is resolved with the FileLocation when the dialog closes
    */
    QuickNavigateDialog.prototype.showDialog = function (initialValue) {
        var that = this;
        var suggestList;
        this.result = new $.Deferred();

        origDoc = DocumentManager.getCurrentDocument();
        if (origDoc) {
            origCursorPos = origDoc.editor.getCursorPos();
        } else {
            origCursorPos = null;
        }


        // Move file list getting code so all this code isn't wrapped in it 
        FileIndexManager.getFileInfoList("all")
            .done(function (files) {
                fileList = files;
                var dialogHTML = 'Quick Open: <input type="text" autocomplete="off" id="quickFileOpenSearch" style="width: 30em">';
                that._createDialogDiv(dialogHTML);
                that.searchField = $('input#quickFileOpenSearch');
                var closed = false;


                that.searchField.smartAutoComplete({
                    source: files,
                    maxResults: 20,
                    forceSelect: false,
                    typeAhead: false,   // won't work right now because smart auto complete 
                                        // using internal raw results instead of filtered results for matching
                    filter: _handleFilter,
                    resultFormatter: _handleResultsFormatter
                });
        
                that.searchField.bind({
                    itemSelect: function (ev, selectedItem) { that._handleItemSelect(selectedItem); },
                    itemFocus: function (ev, selectedItem) { that._handleItemFocus(selectedItem); },
                    keydown: function (e) {
                        // close the dialog when the ENTER (13) or ESC (27) key is pressed
                        if ((e.keyCode === 13 && !$(".smart_autocomplete_container").is(":visible")) || e.keyCode === 27) {
                            e.stopPropagation();
                            e.preventDefault();

                            // clear the query on ESC key and restore document and cursor poisition
                            if (e.keyCode === 27) {
                                that.fileLocation = undefined;

                                // restore document and cursor position
                                if (origDoc) {
                                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: origDoc.file.fullPath});
                                    origDoc.editor.setCursorPos(origCursorPos);
                                }
                            } else if (e.keyCode === 13) {
                                // Select current item on ENTER key
                                that._handleItemSelect();
                            }
                            
                            that._close();
                        }
                    }

        
                });
        
                that.searchField.val(initialValue);
                that.searchField.focus();
            });

        return this.result;
    };


        
    function doFileSearch() {
        var dialog = new QuickNavigateDialog();
        dialog.showDialog();
    }

    function doDdefinitionSearch() {
        var dialog = new QuickNavigateDialog();
        dialog.showDialog("@");
    }



    function doGotoLine() {
        var dialog = new QuickNavigateDialog();
        dialog.showDialog(":");
    }

    // TODO: in future we would dynamally discover quick open plugins and get their providers
    var jsFuncProvider = QuickOpenJSSymbol.getProvider();
    addProvider(jsFuncProvider);

    // TODO: allow QuickOpenJS to register it's own commands and keybindings
    CommandManager.register(Commands.FILE_QUICK_NAVIGATE_FILE, doFileSearch);
    CommandManager.register(Commands.FILE_QUICK_NAVIGATE_DEFINITION, doDdefinitionSearch);
    CommandManager.register(Commands.FILE_QUICK_NAVIGATE_LINE, doGotoLine);


    exports.FileLocation = FileLocation;
    exports.QuickOpenProvider = QuickOpenProvider;
    exports.addProvider = addProvider;
});
