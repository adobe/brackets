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
 * Uses FileIndexManger to supply the file list.
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
        StringMatch         = require("utils/StringMatch"),
        ViewUtils           = require("utils/ViewUtils");
    
    
    /** @const {RegExp} The regular expression to check the cursor position */
    var CURSOR_POS_EXP = new RegExp(":([^,]+)?(,(.+)?)?");
    
    /** @type Array.<QuickOpenPlugin> */
    var plugins = [];

    /** @type {QuickOpenPlugin} */
    var currentPlugin = null;

    /** @type Array.<FileInfo>*/
    var fileList;
    
    /** @type $.Promise */
    var fileListPromise;

    /**
     * The currently open quick open dialog.
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
     *          itemFocus: ?function(?SearchResult|string),
     *          itemSelect: function(?SearchResult|string),
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
     * itemFocus - performs an action when a result has been highlighted (via arrow keys, mouseover, etc.).
     *      The highlighted search result item (as returned by search()) is passed as an argument. Optional.
     * itemSelect - performs an action when a result is chosen.
     *      The selected search result item (as returned by search()) is passed as an argument. Required.
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
        
        // Bind event handlers
        this._handleItemSelect         = this._handleItemSelect.bind(this);
        this._handleItemFocus          = this._handleItemFocus.bind(this);
        this._handleKeyUp              = this._handleKeyUp.bind(this);
        this._handleResultsReady       = this._handleResultsReady.bind(this);
        this._handleShowResults        = this._handleShowResults.bind(this);
        this._handleBlur               = this._handleBlur.bind(this);
        this._handleDocumentMouseDown  = this._handleDocumentMouseDown.bind(this);
        
        // Bind callbacks from smart-autocomplete
        this._filterCallback           = this._filterCallback.bind(this);
        this._resultsFormatterCallback = this._resultsFormatterCallback.bind(this);
        
        // StringMatchers that cache in-progress query data.
        this._filenameMatcher           = new StringMatch.StringMatcher({
            segmentedSearch: true
        });
        this._matchers                  = {};
    }
    
    /**
     * True if the dialog is currently open. Note that this is set to false immediately
     * when the dialog starts closing; it doesn't wait for the ModalBar animation to finish.
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
     * TODO: in the future, if focusing an item can switch documents, need to restore this on Escape.
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
     * @return {{query: string, local: boolean, line: number, ch: number}} An object with
     *      the extracted line and column numbers, and two additional fields: query with the original position 
     *      string and local indicating if the cursor position should be applied to the current file.
     *      Or null if the query is invalid
     */
    function extractCursorPos(query) {
        var regInfo = query.match(CURSOR_POS_EXP),
            result;
        
        if (query.length <= 1 || !regInfo ||
                (regInfo[1] && isNaN(regInfo[1])) ||
                (regInfo[3] && isNaN(regInfo[3]))) {
            
            return null;
        }
            
        return {
            query:  regInfo[0],
            local:  query.indexOf(":") === 0,
            line:   regInfo[1] - 1 || 0,
            ch:     regInfo[3] - 1 || 0
        };
    }
    
    /** Returns the last return value of _filterCallback(), which Smart Autocomplete helpfully caches */
    function getLastFilterResult() {
        var cachedResult = $("input#quickOpenSearch").data("smart-autocomplete").rawResults;
        return cachedResult || [];
    }
    
    /**
     * Converts from list item DOM node to search provider list object
     * @param {jQueryObject} domItem
     * @return {SearchResult|string} value returned from search()
     */
    function domItemToSearchResult(domItem) {
        if (!domItem) {
            return null;
        }
        
        // Smart Autocomplete uses this assumption internally: index of DOM node in results list container
        // exactly matches index of search result in list returned by _filterCallback()
        var index = $(domItem).index();
        
        var lastFilterResult = getLastFilterResult();
        return lastFilterResult[index];
    }
    
    /**
     * Navigates to the appropriate file and file location given the selected item 
     * and closes the dialog.
     *
     * Note, if selectedItem is null quick search should inspect $searchField for text
     * that may have not matched anything in in the list, but may have information
     * for carrying out an action (e.g. go to line).
     */
    QuickNavigateDialog.prototype._handleItemSelect = function (e, selectedDOMItem) {

        // This is a work-around to select first item when a selection event occurs
        // (usually from pressing the enter key) and no item is selected in the list.
        // This is a work-around since  Smart auto complete doesn't select the first item
        if (!selectedDOMItem) {
            selectedDOMItem = $(".smart_autocomplete_container > li:first-child").get(0);
        }
        
        var selectedItem = domItemToSearchResult(selectedDOMItem),
            doClose      = true,
            self         = this,
            query        = this.$searchField.val(),
            cursorPos    = extractCursorPos(query);

        // Delegate to current plugin
        if (currentPlugin) {
            currentPlugin.itemSelect(selectedItem);
        } else {
            // Navigate to file and line number
            var fullPath = selectedItem && selectedItem.fullPath;
            if (fullPath) {
                // This case is tricky. We want to switch editors, so we need to deal with
                // resizing/rescrolling the current editor first. But we don't actually want
                // to start the animation of the ModalBar until afterward (otherwise it glitches
                // because it gets starved of cycles during the creation of the new editor). 
                // So we call `prepareClose()` first, and finish the close later.
                doClose = false;
                this.modalBar.prepareClose();
                CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: fullPath})
                    .done(function () {
                        if (cursorPos) {
                            var editor = EditorManager.getCurrentFullEditor();
                            editor.setCursorPos(cursorPos.line, cursorPos.ch, true);
                        }
                    })
                    .always(function () {
                        self.close();
                    });
            } else if (cursorPos) {
                EditorManager.getCurrentFullEditor().setCursorPos(cursorPos.line, cursorPos.ch, true);
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
    QuickNavigateDialog.prototype._handleItemFocus = function (e, selectedDOMItem) {
        var selectedItem = domItemToSearchResult(selectedDOMItem);
        
        if (currentPlugin && currentPlugin.itemFocus) {
            currentPlugin.itemFocus(selectedItem);
        }
        // TODO: Disable opening files on focus for now since this causes focus related bugs between 
        // the editor and the search field. 
        // Also, see related code in _handleItemFocus
        /*
        else {
            var fullPath = selectedItem.fullPath;
            if (fullPath) {
                CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath, focusEditor: false});
            }
        }
        */
        
    };

    /**
     * Called before Smart Autocomplete processes the key, but after the DOM textfield ($searchField) updates its value.
     * After this, Smart Autocomplete doesn't call _handleFilter() & re-render the list until a setTimeout(0) later.
     */
    QuickNavigateDialog.prototype._handleKeyUp = function (e) {
        // Cancel the search on Esc key, and finish the search on Enter key
        if (e.keyCode === KeyEvent.DOM_VK_RETURN || e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
            // Smart Autocomplete also handles Enter; but it does so without a timeout, which causes #1855.
            // Since our listener was added first (see showDialog()), we can steal the Enter event and block
            // Smart Autocomplete from buggily acting on it.
            e.stopImmediatePropagation();
            e.preventDefault();
            
            // Process on a timeout since letter keys are handled that way and we don't want to get ahead
            // of processing letters that were typed before the Enter key. The ideal order of events is:
            //   letter keydown/keyup, letter key processed async, enter keydown/keyup, enter key processed async
            // However, we might get 'enter keyup' before 'letter key processed async'. The letter key's
            // timeout will always run before ours since it was registered first.
            var self = this;
            setTimeout(function () {
                if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                    // Restore original selection / scroll pos
                    self.close(self._origScrollPos, self._origSelection);
                } else if (e.keyCode === KeyEvent.DOM_VK_RETURN) {
                    self._handleItemSelect(null, $(".smart_autocomplete_highlight").get(0));  // calls close() too
                }
            }, 0);
            
        }
    };

    /**
     * Checks if the given query string is a line number query that is either empty (the number hasn't been typed yet)
     * or is a valid line number within the visible range of the current full editor.
     * @param {string} query The query to check.
     * @return {boolean} true if the given query is a valid line number query.
     */
    QuickNavigateDialog.prototype._isValidLineNumberQuery = function (query) {
        // Empty query returns NaN from extractLineNumber, but we want to treat it as valid for UI purposes.
        if (query === ":") {
            return true;
        }
        
        var cursorPos = extractCursorPos(query),
            editor    = EditorManager.getCurrentFullEditor();
        
        // We could just use 0 and lineCount() here, but in future we might want this logic to work for inline editors as well.
        return (cursorPos && editor && cursorPos.line >= editor.getFirstVisibleLine() && cursorPos.line <= editor.getLastVisibleLine());
    };
    
    /**
     * Called synchronously after _handleFilter(), but before the cached "last result" is updated and before the DOM
     * list items are re-rendered. Both happen synchronously just after we return. Called even when results is empty.
     */
    QuickNavigateDialog.prototype._handleResultsReady = function (e, results) {
        // Give visual clue when there are no results (unless we're in "Go To Line" mode, where there
        // are never results, or we're in file search mode and waiting for the index to get rebuilt)
        var hasNoResults = (results.length === 0 && (fileList || currentPlugin) && !this._isValidLineNumberQuery(this.$searchField.val()));
        
        ViewUtils.toggleClass(this.$searchField, "no-results", hasNoResults);
    };
    
    /**
     * Called synchronously after all other processing is done (_handleFilter(), updating cached "last result" and
     * re-rendering DOM list items). NOT called if the last filter action had 0 results.
     */
    QuickNavigateDialog.prototype._handleShowResults = function (e, results) {
        // Scroll to top result (unless some other item has been highlighted by user)
        if ($(".smart_autocomplete_highlight").length === 0) {
            this._handleItemFocus(null, $(".smart_autocomplete_container > li:first-child").get(0));
        }
    };

    /**
     * Closes the search dialog and notifies all quick open plugins that
     * searching is done.
     * @param {{x: number, y: number}=} scrollPos If specified, scroll to the given
     *     position when closing the ModalBar.
     * @param {{start: {line: number, ch: number}, end: {line: number, ch: number}} selection If specified,
     *     restore the given selection when closing the ModalBar.
     * @return {$.Promise} Resolved when the search bar is entirely closed.
     */
    QuickNavigateDialog.prototype.close = function (scrollPos, selection) {
        if (!this.isOpen) {
            return this._closeDeferred.promise();
        }
        this.isOpen = false;
        
        // We can't just return the ModalBar's `close()` promise because we need to do it on a
        // setTimeout, so we create our own Deferred and cache it so we can return it if multiple
        // callers happen to call `close()`.
        this._closeDeferred = new $.Deferred();

        var i;
        for (i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            if (plugin.done) {
                plugin.done();
            }
        }

        // Make sure Smart Autocomplete knows its popup is getting closed (in cases where there's no
        // editor to give focus to below, it won't notice otherwise).
        this.$searchField.trigger("lostFocus");
        
        // Closing the dialog is a little tricky (see #1384): some Smart Autocomplete code may run later (e.g.
        // (because it's a later handler of the event that just triggered close()), and that code expects to
        // find metadata that it stuffed onto the DOM node earlier. But $.remove() strips that metadata.
        // So we wait until after this call chain is complete before actually closing the dialog.
        var self = this;
        setTimeout(function () {
            self.modalBar.close(!scrollPos).done(function () {
                self._closeDeferred.resolve();
            });

            // Note that we deliberately reset the scroll position synchronously on return from
            // `ModalBar.close()` (before the animation completes).
            // See description of `restoreScrollPos` in `ModalBar.close()`.
            var editor = EditorManager.getCurrentFullEditor();
            if (selection) {
                editor.setSelection(selection.start, selection.end);
            }
            if (scrollPos) {
                editor.setScrollPos(scrollPos.x, scrollPos.y);
            }
        }, 0);
        
        $(".smart_autocomplete_container").remove();

        $(window.document).off("mousedown", this._handleDocumentMouseDown);
        
        return this._closeDeferred.promise();
    };
    
    /**
     * Returns true if the query string doesn't match the query text field. This can happen when _handleFilter()
     * runs slow (either synchronously or async as in searchFileList()). Several key events queue up before filtering
     * is done, and each sets a timeout. After all the key events are handled, we wind up with a queue of timeouts
     * waiting to run, once per key event. All but the last one reflect a stale value of the text field.
     * @param {string} query
     * @return {boolean}
     */
    function queryIsStale(query) {
        var currentQuery = $("input#quickOpenSearch").val();
        return currentQuery !== query;
    }

    function searchFileList(query, matcher) {
        // The file index may still be loading asynchronously - if so, can't return a result yet
        if (!fileList) {
            // Smart Autocomplete allows us to return a Promise instead...
            var asyncResult = new $.Deferred();
            fileListPromise.done(function () {
                // ...but it's not very robust. If a previous Promise is obsoleted by the query string changing, it
                // keeps listening to it anyway. So the last Promise to resolve "wins" the UI update even if it's for
                // a stale query. Guard from that by checking that filter text hasn't changed while we were waiting:
                if (!queryIsStale(query)) {
                    // We're still the current query. Synchronously re-run the search call and resolve with its results
                    asyncResult.resolve(searchFileList(query, matcher));
                } else {
                    asyncResult.reject();
                }
            });
            return asyncResult.promise();
        }
        
        var cursorPos = extractCursorPos(query);
        if (cursorPos && !cursorPos.local && cursorPos.query !== "") {
            query = query.replace(cursorPos.query, "");
        }

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

    /**
     * Handles changes to the current query in the search field.
     * @param {string} query The new query.
     * @return {Array} The filtered list of results.
     */
    QuickNavigateDialog.prototype._filterCallback = function (query) {
        // If previous filter calls ran slow, we may have accumulated several query change events in the meantime.
        // Only respond to the one that's current. Note that this only works because we're called on a timeout after
        // the key event; checking DURING the key event itself would never yield a future value for the input field.
        if (queryIsStale(query)) {
            return getLastFilterResult();
        }
        
        // "Go to line" mode is special-cased
        var cursorPos = extractCursorPos(query);
        if (cursorPos && cursorPos.local) {
            var from = {line: cursorPos.line, ch: cursorPos.ch},
                to   = {line: cursorPos.line};
            
            EditorManager.getCurrentFullEditor().setSelection(from, to, true);
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
            if (languageIdMatch && plugin.match && plugin.match(query)) {
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
    QuickNavigateDialog.prototype._resultsFormatterCallback = function (item) {
        var query = this.$searchField.val();
        
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
        
        var $field = this.$searchField;
        $field.val(initialString);
        $field.get(0).setSelectionRange(prefix.length, initialString.length);
        
        // Kick smart-autocomplete to update (it only listens for keyboard events)
        // (due to #1855, this will only pop up results list; it won't auto-"focus" the first result)
        $field.trigger("keyIn", [initialString]);
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
                dialogLabel = Strings.CMD_GOTO_LINE + "\u2026";
                break;
            case "@":
                dialogLabel = Strings.CMD_GOTO_DEFINITION + "\u2026";
                break;
            default:
                dialogLabel = "";
                break;
            }
        }
        $(".find-dialog-label", this.dialog).text(dialogLabel);
    };
    
    /**
     * Close the dialog when the user clicks outside of it. Smart-autocomplete listens for this and automatically closes its popup,
     * but we want to close the whole search "dialog." (And we can't just piggyback on the popup closing event, since there are cases
     * where the popup closes that we want the dialog to remain open (e.g. deleting search term via backspace).
     */
    QuickNavigateDialog.prototype._handleDocumentMouseDown = function (e) {
        if (this.modalBar.getRoot().find(e.target).length === 0 && $(".smart_autocomplete_container").find(e.target).length === 0) {
            this.close();
        } else {
            // Allow clicks in the search field to propagate. Clicks in the menu should be 
            // blocked to prevent focus from leaving the search field.
            if ($("input#quickOpenSearch").get(0) !== e.target) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };
    
    /**
     * Close the dialog when it loses focus.
     */
    QuickNavigateDialog.prototype._handleBlur = function (e) {
        this.close();
    };

    /**
     * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
     */
    QuickNavigateDialog.prototype.showDialog = function (prefix, initialString) {
        if (this.isOpen) {
            return;
        }
        this.isOpen = true;

        // Global listener to hide search bar & popup
        $(window.document).on("mousedown", this._handleDocumentMouseDown);

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

        // Show the search bar ("dialog")
        var dialogHTML = "<div align='right'><input type='text' autocomplete='off' id='quickOpenSearch' placeholder='" + Strings.CMD_QUICK_OPEN + "\u2026' style='width: 30em'><span class='find-dialog-label'></span></div>";
        this.modalBar = new ModalBar(dialogHTML, false);
        this.$searchField = $("input#quickOpenSearch");

        // The various listeners registered below fire in this order:
        //   keydown, (async gap), keyup, (async gap), filter, resultsReady, showResults/noResults
        // The later events *always* come after the keydown & keyup (they're triggered on a timeout from keyup). But
        // because of the async gaps, a keydown for the *next* key typed might come *before* they run:
        //   keydown, (async gap), keyup, (async gap), keydown #2, (async gap), filter, resultsReady, showResults/noResults
        // The staleness check in _filterCallback() and the forced async wait in _handleKeyUp() are due to this.
        
        this.$searchField.bind({
            resultsReady: this._handleResultsReady,
            showResults: this._handleShowResults,
            itemSelect: this._handleItemSelect,
            itemFocus: this._handleItemFocus,
            keyup: this._handleKeyUp,   // it's important we register this BEFORE calling smartAutoComplete(); see handler for details
            blur: this._handleBlur   // can't use lostFocus since smart autocomplete fires it immediately in response to the shortcut's keyup
        });
        
        this.$searchField.smartAutoComplete({
            source: [],
            maxResults: 20,
            minCharLimit: 0,
            autocompleteFocused: true,
            forceSelect: false,
            typeAhead: false,   // won't work right now because smart auto complete 
                                // using internal raw results instead of filtered results for matching
            filter: this._filterCallback,
            resultFormatter: this._resultsFormatterCallback
        });

        this.setSearchFieldValue(prefix, initialString);
        
        // Start fetching the file list, which will be needed the first time the user enters an un-prefixed query. If file index
        // caches are out of date, this list might take some time to asynchronously build. See searchFileList() for how this is handled.
        fileListPromise = ProjectManager.getAllFiles(true)
            .done(function (files) {
                fileList = files;
                fileListPromise = null;
                this._filenameMatcher.reset();
            }.bind(this));
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


    // TODO: should provide a way for QuickOpenJSSymbol to create this function as a plug-in
    function doDefinitionSearch() {
        if (DocumentManager.getCurrentDocument()) {
            beginSearch("@", getCurrentEditorSelectedText());
        }
    }
    
    // Listen for a change of project to invalidate our file list
    $(ProjectManager).on("projectOpen", function () {
        fileList = null;
    });

    // TODO: allow QuickOpenJS to register it's own commands and key bindings
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
