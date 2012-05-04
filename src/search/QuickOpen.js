/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

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
    'use strict';
    
    var FileIndexManager    = require("project/FileIndexManager"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        CommandManager      = require("command/CommandManager"),
        StringUtils         = require("utils/StringUtils"),
        Commands            = require("command/Commands"),
        ProjectManager      = require("project/ProjectManager");
    

    /** @type Array.<QuickOpenPlugin> */
    var plugins = [];

    /** @type {QuickOpenPlugin} */
    var currentPlugin = null;

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
     *          fileTypes:Array.<string>} plugin,
     *          done: function(),
     *          search: function(string):Array.<string>,
     *          match: function(string):boolean,
     *          itemFocus: functon(HTMLLIElement),
     *          itemSelect: functon(HTMLLIElement),
     *          resultsFormatter: ?Functon(string, string):string }
     *
     * @returns {QuickOpenPlugin} plugin
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
     *      The focused HTMLLIElement is passed as an argument.
     * itemSelect - performs an action when a result is chosen.
     *      The selected HTMLLIElement is passed as an argument.
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
        var wrap = $("#editorHolder")[0];
        this.dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
        this.dialog.className = "CodeMirror-dialog";
        this.dialog.innerHTML = '<div align="right">' + template + '</div>';
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
    
    /**
     * Navigates to the appropriate file and file location given the selected item 
     * and closes the dialog.
     *
     * Note, if selectedItem is null quick search should inspect $searchField for text
     * that may have not matched anything in in the list, but may have information
     * for carrying out an action.
     */
    QuickNavigateDialog.prototype._handleItemSelect = function (selectedItem) {

        // This is a work-around to select first item when a selection event occurs
        // (usually from pressing the enter key) and no item is selected in the list.
        // This is a work-around since  Smart auto complete doesn't select the first item
        if (!selectedItem) {
            selectedItem = $(".smart_autocomplete_container > li:first-child").get(0);
        }


        // Delegate to current plugin
        if (currentPlugin) {
            currentPlugin.itemSelect(selectedItem);
        } else {

            // extract line number
            var cursor,
                query = this.$searchField.val(),
                gotoLine = extractLineNumber(query);
            if (!isNaN(gotoLine)) {
                cursor = {line: gotoLine, ch: 0};
            }

            // Extract file path
            var fullPath;
            if (selectedItem) {
                fullPath = decodeURIComponent($(selectedItem).attr("data-fullpath"));
            }

            // Nagivate to file and line number
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
    QuickNavigateDialog.prototype._handleItemFocus = function (selectedItem) {
        if (currentPlugin) {
            currentPlugin.itemFocus(selectedItem);
        }
        // TODO: Disable opening files on focus for now since this causes focus related bugs between 
        // the editor and the search field. 
        // Also, see related code in _handleItemFocus
        /*
        else {
            var fullPath = $(selectedItem).attr("data-fullpath");
            if (fullPath) {
                fullPath = decodeURIComponent(fullPath);
                CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath, focusEditor: false});
            }
        }
        */
        
    };


    QuickNavigateDialog.prototype._handleKeyIn = function (e, query) {
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
            this._handleItemFocus($(".smart_autocomplete_container > li:first-child"));
        }
    };

    /**
     * Close the dialog when the ENTER (13) or ESC (27) key is pressed
     */
    QuickNavigateDialog.prototype._handleKeyDown = function (e) {

        // TODO: pass event through KeyMap.translateKeyboardEvent() to get friendly names
        // instead of using these constants here. Note, translateKeyboardEvent() doesn't yet
        // make friendly names for the escape and enter key.
        var ESCKey = 27, EnterKey = 13;

        // clear the query on ESC key and restore document and cursor position
        if (event.keyCode === EnterKey || e.keyCode === ESCKey) {
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

        EditorManager.focusEditor();

        // for some odd reason I need to remove the dialog like this through the parent
        // If I do it more directly listeners are not removed by the smart auto complete plug-in
        this.dialog.parentNode.removeChild(this.dialog);
        $(".smart_autocomplete_container").remove();

        $(document).off("mousedown", this.handleDocumentClick);
    };
    
    function filterFileList(query) {
        var filteredList = $.map(fileList, function (fileInfo) {
            // match query against filename only (not the full path)
            var path = fileInfo.fullPath;
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
        if (curDoc) {
            var filename = _filenameFromPath(curDoc.file.fullPath, true);
            var extension = filename.slice(filename.lastIndexOf(".") + 1, filename.length);

            var i;
            for (i = 0; i < plugins.length; i++) {
                var plugin = plugins[i];
                var extensionMatch = plugin.fileTypes.indexOf(extension) !== -1 || plugin.fileTypes.length === 0;
                if (extensionMatch &&  plugin.match && plugin.match(query)) {
                    currentPlugin = plugin;
                    return plugin.search(query);
                }
            }
        }

        currentPlugin = null;
        return filterFileList(query);
    }

    function defaultResultsFormatter(item, query) {
        query = StringUtils.htmlEscape(query.slice(query.indexOf("@") + 1, query.length));
        var boldName = item.replace(new RegExp(query, "gi"), "<strong>$&</strong>");
        return "<li>" + boldName + "</li>";
    }



    function _handleResultsFormatter(item) {
        var query = StringUtils.htmlEscape(($('input#quickOpenSearch').val()));

        if (currentPlugin) {
            var formatter = currentPlugin.resultsFormatter || defaultResultsFormatter;
            return formatter(item, query);
        } else {
            // Format filename result
            var filename = _filenameFromPath(item, true);
            var rPath = StringUtils.htmlEscape(ProjectManager.makeProjectRelativeIfPossible(item));
            var boldName = filename.replace(new RegExp(query, "gi"), "<strong>$&</strong>");
            return "<li data-fullpath='" + encodeURIComponent(item) + "'>" + boldName +
                "<br><span class='quickOpenPath'>" + rPath + "</span></li>";
        }
    }


    function setSearchFieldValue(prefix, initialString) {
        prefix = prefix || "";
        initialString = initialString || "";
        initialString = prefix + initialString;

        
        var $field = $('input#quickOpenSearch');
        if ($field) {
            $field.val(initialString);
            $field.get(0).setSelectionRange(prefix.length, initialString.length);
        }
    }
    
    /**
     * Close the dialog when the user clicks outside of it. Note, auto smart complete has a "lostFocus" event that is
     * supposed to capture this event, but it also gets triggered on keyUp which doesn't work for quick find.
     */
    QuickNavigateDialog.prototype.handleDocumentClick = function (e) {
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

        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        $(document).on("mousedown", this.handleDocumentClick);


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
                var dialogHTML = 'Quick Open: <input type="text" autocomplete="off" id="quickOpenSearch" style="width: 30em">';
                that._createDialogDiv(dialogHTML);
                that.$searchField = $('input#quickOpenSearch');


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
                    keyIn: function (e, query) { that._handleKeyIn(e, query); } // note camelcase is correct
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
    CommandManager.register(Commands.NAVIGATE_QUICK_OPEN, doFileSearch);
    CommandManager.register(Commands.NAVIGATE_GOTO_DEFINITION, doDefinitionSearch);
    CommandManager.register(Commands.NAVIGATE_GOTO_LINE, doGotoLine);

    exports.addQuickOpenPlugin = addQuickOpenPlugin;
});
