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
/*unittests: QuickOpen*/

/*
 * Displays an auto suggest pop-up list of files to allow the user to quickly navigate to a file and lines
 * within a file.
 * 
 * TODO (issue 333) - currently jquery smart auto complete is used for the pop-up list. While it mostly works
 * it has several issues, so it should be replace with an alternative. Issues:
 * - the pop-up position logic has flaws that require CSS workarounds
 * - the pop-up properties cannot be modified once the object is constructed
 */


define(function (require, exports, module) {
    "use strict";
    
    var DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        CommandManager      = require("command/CommandManager"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        Commands            = require("command/Commands"),
        ProjectManager      = require("project/ProjectManager"),
        LanguageManager     = require("language/LanguageManager"),
        KeyEvent            = require("utils/KeyEvent"),
        ModalBar            = require("widgets/ModalBar").ModalBar,
        QuickSearchField    = require("search/QuickSearchField").QuickSearchField,
        StringMatch         = require("utils/StringMatch");
    

    /** @type Array.<QuickOpenPlugin> */
    var plugins = [];

    /** @type {QuickOpenPlugin} */
    var currentPlugin = null;

    /** @type {Array.<File>} */
    var fileList;
    
    /** @type {$.Promise} */
    var fileListPromise;

    /**
     * The currently open (or last open) QuickNavigateDialog
     * @type {?QuickNavigateDialog}
     */
    var _curDialog;

    /**
     * Defines API for new QuickOpen plug-ins
     */
    function QuickOpenPlugin(name, languageIds, done, search, match, itemFocus, itemSelect, resultsFormatter, matcherOptions, label) {
        this.name = name;
        this.languageIds = languageIds;
        this.done = done;
        this.search = search;
        this.match = match;
        this.itemFocus = itemFocus;
        this.itemSelect = itemSelect;
        this.resultsFormatter = resultsFormatter;
        this.matcherOptions = matcherOptions;
        this.label = label;
    }
    
    /**
     * Creates and registers a new QuickOpenPlugin
     *
     * @param { name: string, 
     *          languageIds: Array.<string>,
     *          done: ?function(),
     *          search: function(string, !StringMatch.StringMatcher):Array.<SearchResult|string>,
     *          match: function(string):boolean,
     *          itemFocus: ?function(?SearchResult|string, string),
     *          itemSelect: function(?SearchResult|string, string),
     *          resultsFormatter: ?function(SearchResult|string, string):string,
     *          matcherOptions: ?Object,
     *          label: ?string
     *        } pluginDef
     *
     * Parameter Documentation:
     *
     * name - plug-in name, **must be unique**
     * languageIds - language Ids array. Example: ["javascript", "css", "html"]. To allow any language, pass []. Required.
     * done - called when quick open is complete. Plug-in should clear its internal state. Optional.
     * search - takes a query string and a StringMatcher (the use of which is optional but can speed up your searches) and returns an array of strings that match the query. Required.
     * match - takes a query string and returns true if this plug-in wants to provide
     *      results for this query. Required.
     * itemFocus - performs an action when a result has been highlighted (via arrow keys, or by becoming top of the list).
     *      Passed the highlighted search result item (as returned by search()), and the current query string. Optional.
     * itemSelect - performs an action when a result is chosen.
     *      Passed the highlighted search result item (as returned by search()), and the current query string. Required.
     * resultsFormatter - takes a query string and an item string and returns 
     *      a <LI> item to insert into the displayed search results. Optional.
     * matcherOptions - options to pass along to the StringMatcher (see StringMatch.StringMatcher
     *          for available options). Optional.
     * label - if provided, the label to show before the query field. Optional.
     *
     * If itemFocus() makes changes to the current document or cursor/scroll position and then the user
     * cancels Quick Open (via Esc), those changes are automatically reverted.
     */
    function addQuickOpenPlugin(pluginDef) {
        // Backwards compatibility (for now) for old fileTypes field, if newer languageIds not specified
        if (pluginDef.fileTypes && !pluginDef.languageIds) {
            console.warn("Using fileTypes for QuickOpen plugins is deprecated. Use languageIds instead.");
            pluginDef.languageIds = pluginDef.fileTypes.map(function (extension) {
                return LanguageManager.getLanguageForPath("file." + extension).getId();
            });
            delete pluginDef.fileTypes;
        }
        
        plugins.push(new QuickOpenPlugin(
            pluginDef.name,
            pluginDef.languageIds,
            pluginDef.done,
            pluginDef.search,
            pluginDef.match,
            pluginDef.itemFocus,
            pluginDef.itemSelect,
            pluginDef.resultsFormatter,
            pluginDef.matcherOptions,
            pluginDef.label
        ));
    }

    /**
     * QuickNavigateDialog class
     * @constructor
     */
    function QuickNavigateDialog() {
        this.$searchField = undefined; // defined when showDialog() is called
        
        // ModalBar event handlers & callbacks
        this._handleBeforeClose        = this._handleBeforeClose.bind(this);
        this._handleCloseBar           = this._handleCloseBar.bind(this);
        
        // QuickSearchField callbacks
        this._handleItemSelect         = this._handleItemSelect.bind(this);
        this._handleItemHighlight      = this._handleItemHighlight.bind(this);
        this._filterCallback           = this._filterCallback.bind(this);
        this._resultsFormatterCallback = this._resultsFormatterCallback.bind(this);
        
        // StringMatchers that cache in-progress query data.
        this._filenameMatcher           = new StringMatch.StringMatcher({
            segmentedSearch: true
        });
        this._matchers                  = {};
    }
    
    /**
     * True if the search bar is currently open. Note that this is set to false immediately
     * when the bar starts closing; it doesn't wait for the ModalBar animation to finish.
     * @type {boolean}
     */
    QuickNavigateDialog.prototype.isOpen = false;
    
    /**
     * @private
     * Handles caching of filename search information for the lifetime of a 
     * QuickNavigateDialog (a single search until the dialog is dismissed)
     *
     * @type {StringMatch.StringMatcher}
     */
    QuickNavigateDialog.prototype._filenameMatcher = null;
    
    /**
     * @private
     * StringMatcher caches for each QuickOpen plugin that keep track of search
     * information for the lifetime of a QuickNavigateDialog (a single search
     * until the dialog is dismissed)
     *
     * @type {Object.<string, StringMatch.StringMatcher>}
     */
    QuickNavigateDialog.prototype._matchers = null;
    
    /**
     * @private
     * If the dialog is closing, this will contain a deferred that is resolved
     * when it's done closing.
     * @type {$.Deferred}
     */
    QuickNavigateDialog.prototype._closeDeferred = null;
    

    /**
     * @private
     * Remembers the current document that was displayed when showDialog() was called.
     * @type {?string} full path
     */
    QuickNavigateDialog.prototype._origDocPath = null;

    /**
     * @private
     * Remembers the selection in origDocPath that was present when showDialog() was called. Focusing on an
     * item can change the selection; we restore this original selection if the user presses Escape. Null if
     * no document was open when Quick Open was invoked.
     * @type {?{start:{line:number, ch:number}, end:{line:number, ch:number}}}
     */
    QuickNavigateDialog.prototype._origSelection = null;
    
    /**
     * @private
     * Remembers the scroll position in origDocPath when showDialog() was called (see origSelection above).
     * @type {?{x:number, y:number}}
     */
    QuickNavigateDialog.prototype._origScrollPos = null;

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
     * @returns {number} line number. Returns NaN to indicate no line number was found
     */
    function extractLineNumber(query) {
        // Only match : at beginning of query for now
        if (query[0] !== ":") {
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
     * for carrying out an action (e.g. go to line).
     */
    QuickNavigateDialog.prototype._handleItemSelect = function (selectedItem, query) {

        var doClose = true,
            self = this;

        // Delegate to current plugin
        if (currentPlugin) {
            currentPlugin.itemSelect(selectedItem, query);
        } else {

            // extract line number, if any
            var gotoLine = extractLineNumber(query);

            // Navigate to file and line number
            var fullPath = selectedItem && selectedItem.fullPath;
            if (fullPath) {
                // This case is tricky. We want to switch editors, so we need to deal with
                // resizing/rescrolling the current editor first. But we don't actually want
                // to start the animation of the ModalBar until afterward (otherwise it glitches
                // because it gets starved of cycles during the creation of the new editor). 
                // So we call `prepareClose()` first, and finish the close later.
                // FIXME: what about this case??
                doClose = false;
                this.modalBar.prepareClose();
                CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: fullPath})
                    .done(function () {
                        if (!isNaN(gotoLine)) {
                            var editor = EditorManager.getCurrentFullEditor();
                            editor.setCursorPos(gotoLine, 0, true);
                        }
                    })
                    .always(function () {
                        self.close();
                    });
            } else if (!isNaN(gotoLine)) {
                EditorManager.getCurrentFullEditor().setCursorPos(gotoLine, 0, true);
            }
        }

        if (doClose) {
            this.close();
            EditorManager.focusEditor();
        }
    };

    /**
     * Opens the file specified by selected item if there is no current plug-in, otherwise defers handling
     * to the currentPlugin
     */
    QuickNavigateDialog.prototype._handleItemHighlight = function (selectedItem, query) {
        if (currentPlugin && currentPlugin.itemFocus) {
            currentPlugin.itemFocus(selectedItem, query);
        }
    };

    /**
     * Make sure ModalBar doesn't restore the scroll pos in cases where we're doing our own restoring instead.
     */
    QuickNavigateDialog.prototype._handleBeforeClose = function (reason) {
        console.log("QuickOpen._handleBeforeClose()", this.isOpen, this.closePromise, reason);
        if (reason === ModalBar.CLOSE_ESCAPE) {
            // Don't actually restore scroll pos yet though: wait for _handleCloseBar() when the editor has
            // been resized back to its original height, matching the state it was in when we saved the pos.
            return { restoreScrollPos: false };
        }
    };

    /**
     * Closes the search dialog and notifies all quick open plugins that
     * searching is done.
     * @return {$.Promise} Resolved when the search bar is entirely closed.
     * 
     * FIXME: replace this by just saving off the Promise in _handleCloseBar() and checking it elsewhere?
     */
    QuickNavigateDialog.prototype.close = function () {
        console.log("QuickOpen.close()", this.isOpen, this.closePromise);
        if (!this.isOpen) {
            console.log("  (already closing)");
            return this.closePromise;
        }
        
        this.modalBar.close();  // calls _handleBeforeClose() and then _handleCloseBar()

        return this.closePromise;
    };
    
    QuickNavigateDialog.prototype._handleCloseBar = function (event, reason, modalBarClosePromise) {
        console.log("QuickOpen._handleCloseBar()", this.isOpen, this.closePromise, reason, modalBarClosePromise);
        console.assert(!this.closePromise);
        this.closePromise = modalBarClosePromise;
        this.isOpen = false;
        
        var i;
        for (i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            if (plugin.done) {
                plugin.done();
            }
        }
        
        // Close popup & ensure we avoid any still-pending result promises
        this.searchField.destroy();
        
        // Restore original selection / scroll pos if closed via Escape
        if (reason === ModalBar.CLOSE_ESCAPE) {
            console.log("QO restoring pos");
            // We reset the scroll position synchronously on the ModalBar "close" event (before the animation
            // completes) since the editor has already been resized at this point.
            var editor = EditorManager.getCurrentFullEditor();
            if (this._origSelection) {
                editor.setSelection(this._origSelection.start, this._origSelection.end);
            }
            if (this._origScrollPos) {
                editor.setScrollPos(this._origScrollPos.x, this._origScrollPos.y);
            }
        }
    };
    
    
    function _doSearchFileList(query, matcher) {
        // First pass: filter based on search string; convert to SearchResults containing extra info
        // for sorting & display
        var filteredList = $.map(fileList, function (fileInfo) {
            // Is it a match at all?
            // match query against the full path (with gaps between query characters allowed)
            var searchResult;
            
            searchResult = matcher.match(ProjectManager.makeProjectRelativeIfPossible(fileInfo.fullPath), query);
            
            if (searchResult) {
                searchResult.label = fileInfo.name;
                searchResult.fullPath = fileInfo.fullPath;
                searchResult.filenameWithoutExtension = _filenameFromPath(fileInfo.name, false);
            }
            return searchResult;
        });
        
        // Sort by "match goodness" tier first, then within each tier sort alphabetically - first by filename
        // sans extension, (so that "abc.js" comes before "abc-d.js"), then by filename, and finally (for
        // identically-named files) by full path
        StringMatch.multiFieldSort(filteredList, { matchGoodness: 0, filenameWithoutExtension: 1, label: 2, fullPath: 3 });

        return filteredList;
    }
    
    function searchFileList(query, matcher) {
        // The file index may still be loading asynchronously - if so, can't return a result yet
        if (!fileList) {
            var asyncResult = new $.Deferred();
            fileListPromise.done(function () {
                // Synchronously re-run the search call and resolve with its results
                asyncResult.resolve(_doSearchFileList(query, matcher));
            });
            return asyncResult.promise();
            
        } else {
            return _doSearchFileList(query, matcher);
        }
    }

    /**
     * Handles changes to the current query in the search field.
     * @param {string} query The new query.
     * @return {Array} The filtered list of results.
     */
    QuickNavigateDialog.prototype._filterCallback = function (query) {
        // "Go to line" mode is special-cased
        if (query[0] === ":") {
            if (query.length === 1) {  // treat blank ":" query as valid, but no-op
                return { error: null };
            } else {
                var lineNum = extractLineNumber(query),
                    editor = EditorManager.getCurrentFullEditor();
                
                // We could just use 0 and lineCount() here, but in future we might want this logic to work for inline editors as well.
                if (!isNaN(lineNum) && editor && lineNum >= editor.getFirstVisibleLine() && lineNum <= editor.getLastVisibleLine()) {
                    // Go to the line now (don't wait for Enter/commit event)
                    var from = {line: lineNum, ch: 0},
                        to   = {line: lineNum, ch: 99999};
                    EditorManager.getCurrentFullEditor().setSelection(from, to, true);
                    
                    return { error: null };  // no error even though no results listed
                } else {
                    return [];  // red error highlight: line number out of range, or no editor open
                }
            }
        }
        
        // Try to invoke a search plugin
        var curDoc = DocumentManager.getCurrentDocument(), languageId;
        if (curDoc) {
            languageId = curDoc.getLanguage().getId();
        }

        var i;
        for (i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            var languageIdMatch = plugin.languageIds.length === 0 || plugin.languageIds.indexOf(languageId) !== -1;
            if (languageIdMatch && plugin.match(query)) {
                currentPlugin = plugin;
                
                // Look up the StringMatcher for this plugin.
                var matcher = this._matchers[currentPlugin.name];
                if (!matcher) {
                    matcher = new StringMatch.StringMatcher(plugin.matcherOptions);
                    this._matchers[currentPlugin.name] = matcher;
                }
                this._updateDialogLabel(plugin, query);
                return plugin.search(query, matcher);
            }
        }
        
        // Reflect current search mode in UI
        this._updateDialogLabel(null, query);
        
        // No matching plugin: use default file search mode
        currentPlugin = null;
        return searchFileList(query, this._filenameMatcher);
    };

    /**
     * Formats item's label as properly escaped HTML text, highlighting sections that match 'query'.
     * If item is a SearchResult generated by stringMatch(), uses its metadata about which string ranges
     * matched; else formats the label with no highlighting.
     * @param {!string|SearchResult} item
     * @param {?string} matchClass CSS class for highlighting matched text
     * @param {?function(boolean, string):string} rangeFilter
     * @return {!string} bolded, HTML-escaped result
     */
    function highlightMatch(item, matchClass, rangeFilter) {
        var label = item.label || item;
        matchClass = matchClass || "quicksearch-namematch";
        
        var stringRanges = item.stringRanges;
        if (!stringRanges) {
            // If result didn't come from stringMatch(), highlight nothing
            stringRanges = [{
                text: label,
                matched: false,
                includesLastSegment: true
            }];
        }
        
        var displayName = "";
        if (item.scoreDebug) {
            var sd = item.scoreDebug;
            displayName += '<span title="sp:' + sd.special + ', m:' + sd.match +
                ', ls:' + sd.lastSegment + ', b:' + sd.beginning +
                ', ld:' + sd.lengthDeduction + ', c:' + sd.consecutive + ', nsos: ' +
                sd.notStartingOnSpecial + '">(' + item.matchGoodness + ') </span>';
        }
        
        // Put the path pieces together, highlighting the matched parts
        stringRanges.forEach(function (range) {
            if (range.matched) {
                displayName += "<span class='" + matchClass + "'>";
            }
            
            var rangeText = rangeFilter ? rangeFilter(range.includesLastSegment, range.text) : range.text;
            displayName += StringUtils.breakableUrl(rangeText);
            
            if (range.matched) {
                displayName += "</span>";
            }
        });
        return displayName;
    }
    
    function defaultResultsFormatter(item, query) {
        query = query.slice(query.indexOf("@") + 1, query.length);

        var displayName = highlightMatch(item);
        return "<li>" + displayName + "</li>";
    }
    
    function _filenameResultsFormatter(item, query) {
        // For main label, we just want filename: drop most of the string
        function fileNameFilter(includesLastSegment, rangeText) {
            if (includesLastSegment) {
                var rightmostSlash = rangeText.lastIndexOf('/');
                return rangeText.substring(rightmostSlash + 1);  // safe even if rightmostSlash is -1
            } else {
                return "";
            }
        }
        var displayName = highlightMatch(item, null, fileNameFilter);
        var displayPath = highlightMatch(item, "quicksearch-pathmatch");
        
        return "<li>" + displayName + "<br /><span class='quick-open-path'>" + displayPath + "</span></li>";
    }

    /**
     * Formats the entry for the given item to be displayed in the dropdown.
     * @param {Object} item The item to be displayed.
     * @return {string} The HTML to be displayed.
     */
    QuickNavigateDialog.prototype._resultsFormatterCallback = function (item, query) {
        var formatter;

        if (currentPlugin) {
            // Plugins use their own formatter or the default formatter
            formatter = currentPlugin.resultsFormatter || defaultResultsFormatter;
        } else {
            // No plugin: default file search mode uses a special formatter
            formatter = _filenameResultsFormatter;
        }
        return formatter(item, query);
    };

    /**
     * Sets the value in the search field, updating the current mode and label based on the
     * given prefix.
     * @param {string} prefix The prefix that determines which mode we're in: must be empty (for file search),
     *      "@" for go to definition, or ":" for go to line.
     * @param {string} initialString The query string to search for (without the prefix).
     */
    QuickNavigateDialog.prototype.setSearchFieldValue = function (prefix, initialString) {
        prefix = prefix || "";
        initialString = initialString || "";
        initialString = prefix + initialString;
        
        this.searchField.setText(initialString, true);
        
        // Select just the text after the prefix
        this.$searchField[0].setSelectionRange(prefix.length, initialString.length);
    };
    
    /**
     * Sets the dialog label based on the current plugin (if any) and the current query.
     * @param {Object} plugin The current Quick Open plugin, or none if there is none.
     * @param {string} query The user's current query.
     */
    QuickNavigateDialog.prototype._updateDialogLabel = function (plugin, query) {
        var dialogLabel = "";
        if (plugin && plugin.label) {
            dialogLabel = plugin.label;
        } else {
            var prefix = (query.length > 0 ? query.charAt(0) : "");
            
            // Update the dialog label based on the current prefix.
            switch (prefix) {
            case ":":
                dialogLabel = Strings.CMD_GOTO_LINE;
                break;
            case "@":
                dialogLabel = Strings.CMD_GOTO_DEFINITION;
                break;
            default:
                dialogLabel = Strings.CMD_QUICK_OPEN;
                break;
            }
        }
        $(".find-dialog-label", this.dialog).text(dialogLabel + ":");
    };
    
    /**
     * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
     */
    QuickNavigateDialog.prototype.showDialog = function (prefix, initialString) {
        if (this.isOpen) {
            return;
        }
        this.isOpen = true;

        // Record current document & cursor pos so we can restore it if search is canceled
        // We record scroll pos *before* modal bar is opened since we're going to restore it *after* it's closed
        var curDoc = DocumentManager.getCurrentDocument();
        this._origDocPath = curDoc ? curDoc.file.fullPath : null;
        if (curDoc) {
            this._origSelection = EditorManager.getCurrentFullEditor().getSelection();
            this._origScrollPos = EditorManager.getCurrentFullEditor().getScrollPos();
        } else {
            this._origSelection = null;
            this._origScrollPos = null;
        }

        // Show the search bar
        var searchBarHTML = "<div align='right'><span class='find-dialog-label'></span> <input type='text' autocomplete='off' id='quickOpenSearch' style='width: 30em'></div>";
        this.modalBar = new ModalBar(searchBarHTML, true);
        
        this.modalBar.onBeforeClose = this._handleBeforeClose;
        $(this.modalBar).on("close", this._handleCloseBar);
        
        this.$searchField = $("input#quickOpenSearch");
        this.$searchField.keyup(this._handleKeyUp);
        
        this.searchField = new QuickSearchField(this.$searchField, {
            maxResults: 20,
            verticalAdjust: this.modalBar.getRoot().outerHeight(),  // FIXME: hide popup until animation done! (setExtraDropdownCSS()?)
            resultProvider: this._filterCallback,
            formatter: this._resultsFormatterCallback,
            onCommit: this._handleItemSelect,
            onHighlight: this._handleItemHighlight
        });
        
        // Start prefetching the file list, which will be needed the first time the user enters an un-prefixed query. If file index
        // caches are out of date, this list might take some time to asynchronously build, forcing searchFileList() to wait.
        fileListPromise = ProjectManager.getAllFiles(true)
            .done(function (files) {
                fileList = files;
                fileListPromise = null;
                this._filenameMatcher.reset();
            }.bind(this));
        
        // Prepopulated query
        this.setSearchFieldValue(prefix, initialString);
        this.$searchField.focus();
    };

    function getCurrentEditorSelectedText() {
        var currentEditor = EditorManager.getActiveEditor();
        return (currentEditor && currentEditor.getSelectedText()) || "";
    }

    /**
     * Opens the Quick Open bar prepopulated with the given prefix (to select a mode) and optionally
     * with the given query text too. Updates text field contents if Quick Open already open.
     * @param {?string} prefix
     * @param {?string} initialString
     */
    function beginSearch(prefix, initialString) {
        function createDialog() {
            _curDialog = new QuickNavigateDialog();
            _curDialog.showDialog(prefix, initialString);
        }

        if (_curDialog) {
            if (_curDialog.isOpen) {
                // Just start a search using the existing dialog.
                _curDialog.setSearchFieldValue(prefix, initialString);
            } else {
                // The dialog is already closing. Wait till it's done closing,
                // then open a new dialog. (Calling close() again returns the
                // promise for the deferred that was already kicked off when it
                // started closing.)
                _curDialog.close().done(createDialog);
            }
        } else {
            createDialog();
        }
    }

    function doFileSearch() {
        beginSearch("", getCurrentEditorSelectedText());
    }

    function doGotoLine() {
        // TODO: Brackets doesn't support disabled menu items right now, when it does goto line and
        // goto definition should be disabled when there is not a current document
        if (DocumentManager.getCurrentDocument()) {
            beginSearch(":", "");
        }
    }

    function doDefinitionSearch() {
        if (DocumentManager.getCurrentDocument()) {
            beginSearch("@", getCurrentEditorSelectedText());
        }
    }
    
    // Listen for a change of project to invalidate our file list
    $(ProjectManager).on("projectOpen", function () {
        // TODO: ugly
        fileList = null;
    });

    CommandManager.register(Strings.CMD_QUICK_OPEN,         Commands.NAVIGATE_QUICK_OPEN,       doFileSearch);
    CommandManager.register(Strings.CMD_GOTO_DEFINITION,    Commands.NAVIGATE_GOTO_DEFINITION,  doDefinitionSearch);
    CommandManager.register(Strings.CMD_GOTO_LINE,          Commands.NAVIGATE_GOTO_LINE,        doGotoLine);

    exports.beginSearch             = beginSearch;
    exports.addQuickOpenPlugin      = addQuickOpenPlugin;
    exports.highlightMatch          = highlightMatch;
    
    // accessing these from this module will ultimately be deprecated
    exports.stringMatch             = StringMatch.stringMatch;
    exports.SearchResult            = StringMatch.SearchResult;
    exports.basicMatchSort          = StringMatch.basicMatchSort;
    exports.multiFieldSort          = StringMatch.multiFieldSort;
});
