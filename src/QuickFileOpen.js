/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

/*
* Displays an auto suggest popup list of files to allow the user to quickly navigate to a file and lines
* within a file.
* Uses FileIndexManger to supply the file list.
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
        JSLint              = require("JSLint"),
        DocumentManager     = require("DocumentManager"),
        EditorManager       = require("EditorManager"),
        CommandManager      = require("CommandManager"),
        Commands            = require("Commands"),
        QuickOpenJSSymbol   = require("QuickOpenJSSymbol"),
        QuickOpenCSS        = require("QuickOpenCSS"),
        QuickOpenHTML       = require("QuickOpenHTML"),
        ProjectManager      = require("ProjectManager");
    

    /** @type Array.<QuickOpenPlugin> */
    var plugins = [];

    /** @type {QuickOpenPlugin} */
    var currentPlugin = null;
    var fileList;

    /**
     * Rembers the current document that was displayed when showDialog() was called
     * The current document is restored if the user presses escape
     * @type {string} fullpath
     */
    var origDocPath;

    /**
     * Rembers the current cursor location that was present when showDialog() was called
     * The cursor position s restored if the user presses escape
     * @type {!{line:number, ch:number}}
     */
    var origCursorPos;

    /**
     * Defines API for new QuickOpen plguins
     * @param {string} plugin name
     * @param {Array.<string>} filetypes array. Example: ["js", "css", "txt"]
     * @param {Function} filter takes a query string and returns an array of strings that match the query
     * @param {?Functon} match takes a query string and returns true if this plugin wants to provide results for this query
     * @param {Functon} itemFocus performs an action when a result has focus
     * @param {Functon} itemSelect performs an action when a result is choosen
     * @param {?Functon} resultFormatter takes a query string and an item string and returns a <LI> item to insert into the displayed search resuklts
     */
    function QuickOpenPlugin(name, fileTypes, filter, match, itemFocus, itemSelect, resultsFormatter) {
        
        this.name = name;
        this.fileTypes = fileTypes; // empty array indicates all
        this.filter = filter;
        this.match = match;
        this.itemFocus = itemFocus;
        this.itemSelect = itemSelect;
        this.resultsFormatter = resultsFormatter;
    }
    
    /**
     * Registers new QuickOpenPlugin
     * @param {QuickOpenPlugin} plugin
     */
    function addQuickOpenPlugin(plugin) {
        plugins.push(new QuickOpenPlugin(
            plugin.name,
            plugin.fileTypes,
            plugin.filter,
            plugin.match,
            plugin.itemFocus,
            plugin.itemSelect,
            plugin.resultsFormatter
        ));
    }

    /**
    * QuickNavigateDialog class
    * @constructor
    */
    function QuickNavigateDialog() {
        this.searchField = undefined; // defined when showDialog() is called
        this.closed = false;
    }

    /**
     * Creates a dialog div floating on top of the current code mirror editor
     */
    QuickNavigateDialog.prototype._createDialogDiv = function (template) {
        var wrap = $("#editorHolder")[0];
        this.dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
        this.dialog.className = "CodeMirror-dialog";
        this.dialog.innerHTML = '<div align="center">' + template + '</div>';
    };

    function _filenameFromPath(path, includeExtension) {
        var end;
        if (includeExtension) {
            end = path.length;
        } else {
            end = path.lastIndexOf(".");
        }
        return path.slice(path.lastIndexOf("/") + 1, end);
    }

    function extractLineNumber(query) {
        var result;
        var regInfo = query.match(/(!?:)(\d+)/); // colon followed by a digit
        if (regInfo) {
            result = regInfo[2] - 1;   
        }

        return result;
    }
    
    /**
     * Closes the search dialog and resolves the promise that showDialog returned
     */
    QuickNavigateDialog.prototype._handleItemSelect = function (selectedItem) {
        if (currentPlugin) {
            currentPlugin.itemSelect(selectedItem);
        } else {
            var query = this.searchField.val();
            var fullPath = $(selectedItem).attr("data-fullpath");

            // extract line number
            var cursor;
            var gotoLine = extractLineNumber(query)
            if (gotoLine) {
                cursor = {line: gotoLine, ch: 0};      
            }

            // Do navigation
            if (fullPath) {
                CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: fullPath})
                    .done( function() {
                        if (gotoLine) {
                            EditorManager.getCurrentFullEditor().setCursorPos(cursor);
                        }
                    });
            } else if (gotoLine) {
                EditorManager.getCurrentFullEditor().setCursorPos(cursor);
            }
        }

        this._close();
        EditorManager.focusEditor();
    };

    /**
     * Opens the file specified by selected item if there is no current plugin, otherwise defers handling
     * to the currentPlugin
     */
    QuickNavigateDialog.prototype._handleItemFocus = function (selectedItem) {
        if (currentPlugin) {
            currentPlugin.itemFocus(selectedItem);
        } else {
            var fullPath = $(selectedItem).attr("data-fullpath");
            if (fullPath) {
                var fullPath = decodeURIComponent(fullPath);
                CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath, focusEditor: false});
            }
        }
    };


    QuickNavigateDialog.prototype._handleKeyIn = function (e, query) {
        // extract line number
        var gotoLine = extractLineNumber(query);
        if (gotoLine) {
            var from = {line: gotoLine, ch: 0};
            var to = {line: gotoLine, ch: 99999};
            EditorManager.getCurrentFullEditor().setSelection(from, to);
        }

        // Remove current plugin if the query stops matching
        if (currentPlugin && !currentPlugin.match(query)) {
            currentPlugin = null;
        }

        if ($(".smart_autocomplete_highlight").length === 0) {
            this._handleItemFocus($(".smart_autocomplete_container > li:first-child"));
        }    
    }

    /**
     * Close the dialog when the ENTER (13) or ESC (27) key is pressed
     */
    QuickNavigateDialog.prototype._handleKeyDown = function (e) {
        if (e.keyCode === 13 || e.keyCode === 27) {
            e.stopPropagation();
            e.preventDefault();

            // clear the query on ESC key and restore document and cursor poisition
            if (e.keyCode === 27) {

                // restore document and cursor position
                if (origDocPath) {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: origDocPath})
                        .done(function () {
                            EditorManager.getCurrentFullEditor().setCursorPos(origCursorPos);
                        });
                }
            } else if (e.keyCode === 13) {
                // Select current item on ENTER key
                this._handleItemSelect();
            }
            
            this._close();
        } 
    }


    /**
    * Closes the search dialog and resolves the promise that showDialog returned
    */
    QuickNavigateDialog.prototype._close = function (value) {

        if (this.closed) {
            return;
        }
        this.closed = true;

        JSLint.setEnabled(true);

        // for some odd reason I need to remove the dialog like this through the parent
        // If I do it more directly listeners are not removed by the smart auto complete plugin
        this.dialog.parentNode.removeChild(this.dialog);
        $(".smart_autocomplete_container").remove();
    };
    
    function filterFileList(query) {
        var filteredList = $.map(fileList, function (itemInfo) {
            // match query against filename only (not the full path)
            var path = itemInfo.fullPath;
            var filename = _filenameFromPath(path, true);
            if (filename.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                return path;
            } else {
                return null;
            }
        }).sort(function (a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();
            //first,  sort by filename without extension
            var filenameA = _filenameFromPath(a, false);
            var filenameB = _filenameFromPath(b, false);
            if (filenameA < filenameB) {
                return -1;
            } else if (filenameA > filenameB) {
                return 1;
            } else {
                // filename is the same, compare including extension
                filenameA = _filenameFromPath(a, true);
                filenameB = _filenameFromPath(b, true);
                if (filenameA < filenameB) {
                    return -1;
                } else if (filenameA > filenameB) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });

        return filteredList;
    }

    function _handleFilter(query) {
        var curDoc = DocumentManager.getCurrentDocument();
        if (!curDoc) {
            return [];
        }

        var filename = _filenameFromPath(curDoc.file.fullPath, true );
        var extension = filename.slice( filename.lastIndexOf(".") + 1, filename.length);


        var i;
        for (i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            var extensionMatch = plugin.fileTypes.indexOf(extension) !== -1 || plugin.fileTypes.length === 0;
            if (extensionMatch &&  plugin.match && plugin.match(query)) {
                currentPlugin = plugin;
                return plugin.filter(query);
            }
        }

        currentPlugin = null;
        return filterFileList(query);
    }

    function defaultResultsFormatter(item, query) {
        query = query.slice(query.indexOf("@") + 1, query.length);
        var boldName = item.replace(new RegExp(query, "gi"), "<strong>$&</strong>");
        return "<li>" + boldName + "</li>";
    }


    function _handleResultsFormatter(item) {
        var query = $('input#quickFileOpenSearch').val();

        if (currentPlugin) {
            var formatter = currentPlugin.resultsFormatter ? currentPlugin.resultsFormatter : defaultResultsFormatter;
            return formatter(item, query);
        } else {
            // Format filename result
            var filename = _filenameFromPath(item, true);
            var rPath = ProjectManager.makeProjectRelativeIfPossible(item);
            var boldName = filename.replace(new RegExp(query, "gi"), "<strong>$&</strong>");
            return "<li data-fullpath='" + encodeURIComponent(item) + "'>" + boldName +
                "<br><span class='quickOpenPath'>" + rPath + "</span></li>";
        }
    }
        
    /**
    * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
    */
    QuickNavigateDialog.prototype.showDialog = function (initialValue) {
        var that = this;

        // To improve performance during list selection disable JSLint until a document is choosen or dialog is closed
        JSLint.setEnabled(false);

        var curDoc = DocumentManager.getCurrentDocument();
        origDocPath = curDoc ? curDoc.file.fullPath : null;
        if (curDoc) {
            origCursorPos = EditorManager.getCurrentFullEditor().getCursorPos();
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
                    itemSelect: function (e, selectedItem) { that._handleItemSelect(selectedItem); },
                    itemFocus: function (e, selectedItem) { that._handleItemFocus(selectedItem); },
                    keydown: function (e) { that._handleKeyDown(e); },
                    keyIn: function (e, query) { that._handleKeyIn(e, query); }
                });
        
                that.searchField.val(initialValue);
                that.searchField.focus();
            });
    };

    function doFileSearch() {
        var dialog = new QuickNavigateDialog();
        dialog.showDialog();
    }

    function doGotoLine() {
        var dialog = new QuickNavigateDialog();
        dialog.showDialog(":");
    }


    // TODO: should provide a way for QuickOpenJSSymbol to create this function as a plugin
    function doDefinitionSearch() {
        var dialog = new QuickNavigateDialog();
        dialog.showDialog("@");
    }



    // TODO: in future we would dynamally discover quick open plugins and get their plugins
    var jsFuncPlugin = QuickOpenJSSymbol.getPlugin();
    addQuickOpenPlugin(jsFuncPlugin);

    var cssSelectorsPlugin = QuickOpenCSS.getPlugin();
    addQuickOpenPlugin(cssSelectorsPlugin);

    var htmlIDPlugin = QuickOpenHTML.getPlugin();
    addQuickOpenPlugin(htmlIDPlugin);

    // TODO: allow QuickOpenJS to register it's own commands and keybindings
    CommandManager.register(Commands.FILE_QUICK_NAVIGATE_FILE, doFileSearch);
    CommandManager.register(Commands.FILE_QUICK_NAVIGATE_DEFINITION, doDefinitionSearch);
    CommandManager.register(Commands.FILE_QUICK_NAVIGATE_LINE, doGotoLine);

    exports.addQuickOpenPlugin = addQuickOpenPlugin;
});
