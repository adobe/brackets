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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window, setTimeout */

/*
* Displays an auto suggest pop-up list of files to allow the user to quickly navigate to a file and lines
* within a file.
* Uses FileIndexManger to supply the file list.
* 
* TODO (issue 333) - currently jquery smart auto complete is used for the pop-up list. While it mostly works
* it has several issues, so it should be replace with an alternative. Issues:
* - only accepts an array of strings. A list of objects is preferred to avoid some workarounds to display 
*   both the path and filename.
* - the pop-up position logic has flaws that require CSS workarounds
* - the pop-up properties cannot be modified once the object is constructed
*/


define(function (require, exports, module) {
    "use strict";
    
    var FileIndexManager    = require("project/FileIndexManager"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        CommandManager      = require("command/CommandManager"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        Commands            = require("command/Commands"),
        ProjectManager      = require("project/ProjectManager");
    

    /** @type Array.<QuickOpenPlugin> */
    var plugins = [];
    
    /** The default filename search plugin. See below */
    //var defaultPlugin; - TODO

    /** @type {QuickOpenPlugin} */
    var currentPlugin = null;
    
    /** @type {Array.<SearchResult|string>} */
    var lastFilterResult = null;

    /** @type Array.<FileInfo>*/
    var fileList;

    /**
     * Remembers the current document that was displayed when showDialog() was called
     * The current document is restored if the user presses escape
     * @type {string} full path
     */
    var origDocPath;

    /**
     * Remembers the selection in the document origDocPath that was present when showDialog() was called.
     * Focusing on an item can cause the current and and/or selection to change, so this variable restores it.
     * The cursor position is restored if the user presses escape.
     * @type ?{start:{line:number, ch:number}, end:{line:number, ch:number}}
     */
    var origSelection;

    var dialogOpen = false;

    /** Object representing a search result with associated metadata */
    function SearchResult(label, extraProps) {
        this.label = label;
        $.extend(this, extraProps);
    }
    
    /**
     * Defines API for new QuickOpen plug-ins
     */
    function QuickOpenPlugin(name, fileTypes, done, search, match, itemFocus, itemSelect, resultsFormatter) {
        
        this.name = name;
        this.fileTypes = fileTypes;
        this.done = done;
        this.search = search;
        this.match = match;
        this.itemFocus = itemFocus;
        this.itemSelect = itemSelect;
        this.resultsFormatter = resultsFormatter;
    }
    
    /**
     * Creates and registers a new QuickOpenPlugin
     *
     * @param { name: string, 
     *          fileTypes:Array.<string>,
     *          done: function(),
     *          search: function(string):Array.<SearchResult|string>,
     *          match: function(string):boolean,
     *          itemFocus: function(SearchResult|string),
     *          itemSelect: funciton(SearchResult|string),
     *          resultsFormatter: ?function(SearchResult|string, string):string } pluginDef
     *
     * Parameter Documentation:
     *
     * name - plug-in name
     * filetypes - file types array. Example: ["js", "css", "txt"]. An empty array
     *      indicates all file types.
     * done - called when quick open is complete. Plug-in should clear its internal state.
     * search - takes a query string and returns an array of strings that match the query.
     * match - takes a query string and returns true if this plug-in wants to provide
     *      results for this query.
     * itemFocus - performs an action when a result has focus. 
     *      The focused search result item (as returned by search()) is passed as an argument.
     * itemSelect - performs an action when a result is chosen.
     *      The selected search result item (as returned by search()) is passed as an argument.
     * resultFormatter - takes a query string and an item string and returns 
     *      a <LI> item to insert into the displayed search results. If null, default is provided.
     */
    function addQuickOpenPlugin(pluginDef) {
        plugins.push(new QuickOpenPlugin(
            pluginDef.name,
            pluginDef.fileTypes,
            pluginDef.done,
            pluginDef.search,
            pluginDef.match,
            pluginDef.itemFocus,
            pluginDef.itemSelect,
            pluginDef.resultsFormatter
        ));
    }

    /**
    * QuickNavigateDialog class
    * @constructor
    */
    function QuickNavigateDialog() {
        this.$searchField = undefined; // defined when showDialog() is called
    }

    /**
     * Creates a dialog div floating on top of the current code mirror editor
     */
    QuickNavigateDialog.prototype._createDialogDiv = function (template) {
        this.dialog = $("<div />")
                          .attr("class", "CodeMirror-dialog")
                          .html("<div align='right'>" + template + "</div>")
                          .prependTo($("#editor-holder"));
    };

    function _filenameFromPath(path, includeExtension) {
        var end;
        if (includeExtension) {
            end = path.length;
        } else {
            end = path.lastIndexOf(".");
            if (end === -1) {
                end = path.length;
            }
        }
        return path.slice(path.lastIndexOf("/") + 1, end);
    }
    
    /**
     * Attempts to extract a line number from the query where the line number
     * is followed by a colon. Callers should explicitly test result with isNaN()
     * 
     * @param {string} query string to extract line number from
     * @returns {number} line number. Returns NaN to indicate no line numbeer was found
     */
    function extractLineNumber(query) {
        // only match : at beginning of query for now
        // TODO: match any location of : when QuickOpen._handleItemFocus() is modified to
        // dynamic open files
        if (query.indexOf(":") !== 0) {
            return NaN;
        }

        var result = NaN;
        var regInfo = query.match(/(!?:)(\d+)/); // colon followed by a digit
        if (regInfo) {
            result = regInfo[2] - 1;
        }

        return result;
    }
    
    function domItemToSearchResult(domItem) {
        if (domItem) {
            // smart autocomplete uses this assumption internally: index of DOM node in results list container
            // exactly matches index of search result in list returned by _handleFilter()
            var index = $(domItem).index();
            
            // this is just the last return value of _handleFilter(), which smart autocomplete helpfully caches
            var lastFilterResult = $('input#quickOpenSearch').data("smart-autocomplete").rawResults;
            return lastFilterResult[index];
        }
        return null;
    }
    
    /**
     * Navigates to the appropriate file and file location given the selected item 
     * and closes the dialog.
     *
     * Note, if selectedItem is null quick search should inspect $searchField for text
     * that may have not matched anything in in the list, but may have information
     * for carrying out an action (e.g. go to line).
     */
    QuickNavigateDialog.prototype._handleItemSelect = function (selectedDOMItem) {

        // This is a work-around to select first item when a selection event occurs
        // (usually from pressing the enter key) and no item is selected in the list.
        // This is a work-around since  Smart auto complete doesn't select the first item
        if (!selectedDOMItem) {
            selectedDOMItem = $(".smart_autocomplete_container > li:first-child").get(0);
        }
        
        var selectedItem = domItemToSearchResult(selectedDOMItem);

        // Delegate to current plugin
        if (currentPlugin) {
            currentPlugin.itemSelect(selectedItem);
        } else {

            // extract line number, if any
            var cursor,
                query = this.$searchField.val(),
                gotoLine = extractLineNumber(query);
            if (!isNaN(gotoLine)) {
                cursor = {line: gotoLine, ch: 0};
            }

            // Navigate to file and line number
            var fullPath = selectedItem && selectedItem.fullPath;
            if (fullPath) {
                CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: fullPath})
                    .done(function () {
                        if (!isNaN(gotoLine)) {
                            EditorManager.getCurrentFullEditor().setCursorPos(cursor);
                        }
                    });
            } else if (!isNaN(gotoLine)) {
                EditorManager.getCurrentFullEditor().setCursorPos(cursor);
            }
        }


        this._close();
        EditorManager.focusEditor();
    };

    /**
     * Opens the file specified by selected item if there is no current plug-in, otherwise defers handling
     * to the currentPlugin
     */
    QuickNavigateDialog.prototype._handleItemFocus = function (selectedDOMItem) {
        var selectedItem = domItemToSearchResult(selectedDOMItem);
        
        if (currentPlugin) {
            currentPlugin.itemFocus(selectedItem);
        }
        // TODO: Disable opening files on focus for now since this causes focus related bugs between 
        // the editor and the search field. 
        // Also, see related code in _handleItemFocus
        /*
        else {
            var fullPath = selectedItem.fullPath;
            if (fullPath) {
                fullPath = decodeURIComponent(fullPath);
                CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath, focusEditor: false});
            }
        }
        */
        
    };

    /**
     * KeyUp is for cases that handle AFTER a character has been committed to $searchField
     */
    QuickNavigateDialog.prototype._handleKeyUp = function (e) {
        var query = this.$searchField.val();

        // extract line number
        var gotoLine = extractLineNumber(query);
        if (!isNaN(gotoLine)) {
            var from = {line: gotoLine, ch: 0};
            var to = {line: gotoLine, ch: 99999};
            
            EditorManager.getCurrentFullEditor().setSelection(from, to);
        }

        // Remove current plugin if the query stops matching
        if (currentPlugin && !currentPlugin.match(query)) {
            currentPlugin = null;
        }

        if ($(".smart_autocomplete_highlight").length === 0) {
            this._handleItemFocus($(".smart_autocomplete_container > li:first-child").get(0));
        }
    };

    /**
     * Close the dialog when the ENTER (13) or ESC (27) key is pressed
     *
     * Note, when keydown is handled $searchField does not yet have the character added
     * for the current event e. 
     */
    QuickNavigateDialog.prototype._handleKeyDown = function (e) {

        // TODO: pass event through KeyMap.translateKeyboardEvent() to get friendly names
        // instead of using these constants here. Note, translateKeyboardEvent() doesn't yet
        // make friendly names for the escape and enter key.
        var ESCKey = 27, EnterKey = 13;

        // clear the query on ESC key and restore document and cursor position
        if (e.keyCode === EnterKey || e.keyCode === ESCKey) {
            e.stopPropagation();
            e.preventDefault();

            if (e.keyCode === ESCKey) {

                // restore previously viewed doc if user navigated away from it
                if (origDocPath) {
                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: origDocPath})
                        .done(function () {
                            if (origSelection) {
                                EditorManager.getCurrentFullEditor().setSelection(origSelection.start, origSelection.end);
                            }
                        });
                }

                this._close();
            }

            if (e.keyCode === EnterKey) {
                this._handleItemSelect($(".smart_autocomplete_highlight").get(0));
            }
            
        }
    };
    
    /**
    * Closes the search dialog and notifies all quick open plugins that
    * searching is done. 
    */
    QuickNavigateDialog.prototype._close = function () {

        if (!dialogOpen) {
            return;
        }
        dialogOpen = false;

        var i;
        for (i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            plugin.done();
        }

        // Ty TODO: disabled for now while file switching is disabled in _handleItemFocus
        //JSLintUtils.setEnabled(true);
        
        // Make sure Smart Autocomplete knows its popup is getting closed (in cases where there's no
        // editor to give focus to below, it won't notice otherwise).
        this.$searchField.trigger("lostFocus");

        EditorManager.focusEditor();
        
        // Closing the dialog is a little tricky (see #1384): some Smart Autocomplete code may run later (e.g.
        // (because it's a later handler of the event that just triggered _close()), and that code expects to
        // find metadata that it stuffed onto the DOM node earlier. But $.remove() strips that metadata.
        // So, to hide the dialog immediately it's only safe to remove using raw DOM APIs:
        this.dialog[0].parentNode.removeChild(this.dialog[0]);
        var self = this;
        setTimeout(function () {
            // Now that it's safe, call the real jQuery API to clear the metadata & prevent a memory leak
            self.dialog.remove();
        }, 0);
        
        $(".smart_autocomplete_container").remove();

        $(window.document).off("mousedown", this.handleDocumentMouseDown);
    };
    
    
    function filterFileList(query) {
        // First pass: filter based on search string; convert to SearchResults containing extra info
        // for sorting & display
        var filteredList = $.map(fileList, function (fileInfo) {
            // match query against filename only (not the full path)
            var path = fileInfo.fullPath;
            var filename = fileInfo.name;
            
            // is it a match at all?
            var matchIndex = fileInfo.name.toLowerCase().indexOf(query.toLowerCase());
            if (matchIndex !== -1) {
                // Rough hueristics to decide how good the match is: if query very closely matches
                // filename, rank it highly. Divides the search results into four broad buckets (0-3)
                var filenameWithoutExtension = _filenameFromPath(filename, false);
                var matchGoodness;
                if (matchIndex === 0) {
                    if (filename.length === query.length) {
                        matchGoodness = 0;
                    } else if (filenameWithoutExtension.length === query.length) {
                        matchGoodness = 1;
                    } else {
                        matchGoodness = 2;
                    }
                } else {
                    matchGoodness = 3;
                }
                
                return new SearchResult(filename, {
                    fullPath: path,
                    filenameWithoutExtension: filenameWithoutExtension,
                    matchGoodness: matchGoodness
                });
            } else {
                return null;
            }
            
        }).sort(function (a, b) {
            // Results in better buckets will *always* be listed above lesser buckets
            if (a.matchGoodness < b.matchGoodness) {
                return -1;
            } else if (a.matchGoodness > b.matchGoodness) {
                return 1;
                
            } else {
                // Within a "goodness" bucket, sort alphabetically
                
                // First sort by filename without extension (so that "abc.js" comes before "abc-d.js")
                var filenameA = a.filenameWithoutExtension.toLowerCase();
                var filenameB = b.filenameWithoutExtension.toLowerCase();
                if (filenameA < filenameB) {
                    return -1;
                } else if (filenameA > filenameB) {
                    return 1;
                } else {
                    // If filenames identical, include extension too
                    filenameA = a.label.toLowerCase();
                    filenameB = b.label.toLowerCase();
                    if (filenameA < filenameB) {
                        return -1;
                    } else if (filenameA > filenameB) {
                        return 1;
                    } else {
                        // If full filenames identical, then sort by path
                        var pathA = a.fullPath.toLowerCase();
                        var pathB = b.fullPath.toLowerCase();
                        if (pathA < pathB) {
                            return -1;
                        } else if (pathA > pathB) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                }
            }
        });

        return filteredList;
    }

    function _handleFilter(query) {
        var curDoc = DocumentManager.getCurrentDocument();
        if (curDoc) {
            var filename = _filenameFromPath(curDoc.file.fullPath, true);
            var extension = filename.slice(filename.lastIndexOf(".") + 1, filename.length);

            var i;
            for (i = 0; i < plugins.length; i++) {
                var plugin = plugins[i];
                var extensionMatch = plugin.fileTypes.indexOf(extension) !== -1 || plugin.fileTypes.length === 0;
                if (extensionMatch &&  plugin.match && plugin.match(query)) {
                    currentPlugin = plugin;
                    lastFilterResult = plugin.search(query);
                    return lastFilterResult;
                }
            }
        }

        currentPlugin = null;
        lastFilterResult = filterFileList(query);
        return lastFilterResult;
    }


    function defaultResultsFormatter(item, query) {
        query = query.slice(query.indexOf("@") + 1, query.length);

        // Escape both query and item so the replace works properly below
        query = StringUtils.htmlEscape(query);
        var label = item.label || item;
        var displayName = StringUtils.htmlEscape(label);

        if (query.length > 0) {
            // make the user's query bold within the item's text
            displayName = displayName.replace(
                new RegExp(StringUtils.regexEscape(query), "gi"),
                "<strong>$&</strong>"
            );
        }

        return "<li>" + displayName + "</li>";
    }
    
    function _filenameResultsFormatter(item, query) {
        // Use the filename formatter
        query = StringUtils.htmlEscape(query);
        var displayName = StringUtils.htmlEscape(item.label);
        var displayPath = StringUtils.htmlEscape(ProjectManager.makeProjectRelativeIfPossible(item.fullPath));

        if (query.length > 0) {
            // make the user's query bold within the item's text
            displayName = displayName.replace(
                new RegExp(StringUtils.regexEscape(query), "gi"),
                "<strong>$&</strong>"
            );
        }

        return "<li>" + displayName + "<br /><span class='quick-open-path'>" + displayPath + "</span></li>";
    }

    function _handleResultsFormatter(item) {
        var query = $("input#quickOpenSearch").val();
        
        var formatter;

        if (currentPlugin) {
            // Plugins use their own formatter or the default formatter
            formatter = currentPlugin.resultsFormatter || defaultResultsFormatter;
        } else {
            formatter = _filenameResultsFormatter;
        }
        return formatter(item, query);
    }


    function setSearchFieldValue(prefix, initialString) {
        prefix = prefix || "";
        initialString = initialString || "";
        initialString = prefix + initialString;

        
        var $field = $("input#quickOpenSearch");
        if ($field) {
            $field.val(initialString);
            $field.get(0).setSelectionRange(prefix.length, initialString.length);
        }
    }
    
    /**
     * Close the dialog when the user clicks outside of it. Smart-autocomplete listens for this and automatically closes its popup,
     * but we want to close the whole search "dialog." (And we can't just piggyback on the popup closing event, since there are cases
     * where the popup closes that we want the dialog to remain open (e.g. deleting search term via backspace).
     */
    QuickNavigateDialog.prototype.handleDocumentMouseDown = function (e) {
        if ($(this.dialog).find(e.target).length === 0 && $(".smart_autocomplete_container").find(e.target).length === 0) {
            this._close();
        }
    };

    /**
    * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
    */
    QuickNavigateDialog.prototype.showDialog = function (prefix, initialString) {
        var that = this;

        if (dialogOpen) {
            return;
        }
        dialogOpen = true;

        this.handleDocumentMouseDown = this.handleDocumentMouseDown.bind(this);
        $(window.document).on("mousedown", this.handleDocumentMouseDown);


        // Ty TODO: disabled for now while file switching is disabled in _handleItemFocus
        // To improve performance during list selection disable JSLint until a document is chosen or dialog is closed
        //JSLintUtils.setEnabled(false);

        var curDoc = DocumentManager.getCurrentDocument();
        origDocPath = curDoc ? curDoc.file.fullPath : null;
        if (curDoc) {
            origSelection = EditorManager.getCurrentFullEditor().getSelection();
        } else {
            origSelection = null;
        }

        // Get the file list and initialize the smart auto completes
        FileIndexManager.getFileInfoList("all")
            .done(function (files) {
                fileList = files;
                var dialogHTML = Strings.CMD_QUICK_OPEN + ": <input type='text' autocomplete='off' id='quickOpenSearch' style='width: 30em'>";
                that._createDialogDiv(dialogHTML);
                that.$searchField = $("input#quickOpenSearch");


                that.$searchField.smartAutoComplete({
                    source: files,
                    maxResults: 20,
                    minCharLimit: 0,
                    autocompleteFocused: true,
                    forceSelect: false,
                    typeAhead: false,   // won't work right now because smart auto complete 
                                        // using internal raw results instead of filtered results for matching
                    filter: _handleFilter,
                    resultFormatter: _handleResultsFormatter
                });
        
                that.$searchField.bind({
                    itemSelect: function (e, selectedItem) { that._handleItemSelect(selectedItem); },
                    itemFocus: function (e, selectedItem) { that._handleItemFocus(selectedItem); },
                    keydown: function (e) { that._handleKeyDown(e); },
                    keyup: function (e, query) { that._handleKeyUp(e); }
                    // Note: lostFocus event DOESN'T work because auto smart complete catches the key up from shift-command-o and immediately
                    // triggers lostFocus
                });
        
                setSearchFieldValue(prefix, initialString);
            });
    };

    function getCurrentEditorSelectedText() {
        var currentEditor = EditorManager.getFocusedEditor();
        return (currentEditor && currentEditor.getSelectedText()) || "";
    }

    function doSearch(prefix, initialString) {
        if (dialogOpen) {
            setSearchFieldValue(prefix, initialString);
        } else {
            var dialog = new QuickNavigateDialog();
            dialog.showDialog(prefix, initialString);
        }
    }

    function doFileSearch() {
        doSearch("", getCurrentEditorSelectedText());
    }

    function doGotoLine() {
        // TODO: Brackets doesn't support disabled menu items right now, when it does goto line and
        // goto definition should be disabled when there is not a current document
        if (DocumentManager.getCurrentDocument()) {
            doSearch(":", "");
        }
    }


    // TODO: should provide a way for QuickOpenJSSymbol to create this function as a plug-in
    function doDefinitionSearch() {
        if (DocumentManager.getCurrentDocument()) {
            doSearch("@", getCurrentEditorSelectedText());
        }
    }



    // TODO: allow QuickOpenJS to register it's own commands and key bindings
    CommandManager.register(Strings.CMD_QUICK_OPEN,         Commands.NAVIGATE_QUICK_OPEN,       doFileSearch);
    CommandManager.register(Strings.CMD_GOTO_DEFINITION,    Commands.NAVIGATE_GOTO_DEFINITION,  doDefinitionSearch);
    CommandManager.register(Strings.CMD_GOTO_LINE,          Commands.NAVIGATE_GOTO_LINE,        doGotoLine);

    exports.addQuickOpenPlugin = addQuickOpenPlugin;
    exports.SearchResult = SearchResult;
});
