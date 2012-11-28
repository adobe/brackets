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
        ProjectManager      = require("project/ProjectManager"),
        KeyEvent            = require("utils/KeyEvent");
    

    /** @type Array.<QuickOpenPlugin> */
    var plugins = [];

    /** @type {QuickOpenPlugin} */
    var currentPlugin = null;

    /** @type Array.<FileInfo>*/
    var fileList;
    
    /** @type $.Promise */
    var fileListPromise;

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

    /** @type {boolean} */
    var dialogOpen = false;

    /** Object representing a search result with associated metadata (added as extra ad hoc fields) */
    function SearchResult(label) {
        this.label = label;
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
     *          itemFocus: function(?SearchResult|string),
     *          itemSelect: funciton(?SearchResult|string),
     *          resultsFormatter: ?function(SearchResult|string, string):string
     *        } pluginDef
     *
     * Parameter Documentation:
     *
     * name - plug-in name
     * fileTypes - file types array. Example: ["js", "css", "txt"]. An empty array
     *      indicates all file types.
     * done - called when quick open is complete. Plug-in should clear its internal state.
     * search - takes a query string and returns an array of strings that match the query.
     * match - takes a query string and returns true if this plug-in wants to provide
     *      results for this query.
     * itemFocus - performs an action when a result has been highlighted (via arrow keys, mouseover, etc.).
     *      The highlighted search result item (as returned by search()) is passed as an argument.
     * itemSelect - performs an action when a result is chosen.
     *      The selected search result item (as returned by search()) is passed as an argument.
     * resultFormatter - takes a query string and an item string and returns 
     *      a <LI> item to insert into the displayed search results. If null, default is provided.
     *
     * If itemFocus() makes changes to the current document or cursor/scroll position and then the user
     * cancels Quick Open (via Esc), those changes are automatically reverted.
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
        // exactly matches index of search result in list returned by _handleFilter()
        var index = $(domItem).index();
        
        // This is just the last return value of _handleFilter(), which smart autocomplete helpfully caches
        var lastFilterResult = $("input#quickOpenSearch").data("smart-autocomplete").rawResults;
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
     * Close the dialog when the Enter or Esc key is pressed
     *
     * Note, when keydown is handled $searchField does not yet have the character added
     * for the current event e. 
     */
    QuickNavigateDialog.prototype._handleKeyDown = function (e) {
        // clear the query on ESC key and restore document and cursor position
        if (e.keyCode === KeyEvent.DOM_VK_RETURN || e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
            e.stopPropagation();
            e.preventDefault();

            if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
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
                
            } else if (e.keyCode === KeyEvent.DOM_VK_RETURN) {
                this._handleItemSelect($(".smart_autocomplete_highlight").get(0));
            }
            
        }
    };
    
    
    /**
     * Give visual clue when there are no results
     */
    QuickNavigateDialog.prototype._handleResultsReady = function (results) {
        var isNoResults = (results.length === 0 && isNaN(extractLineNumber(this.$searchField.val())));
        this.$searchField.toggleClass("no-results", isNoResults);
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
    
    /**
     * Helper functions for stringMatch score calculation.
     */
    
    /**
     * The current scoring gives a boost for matches in the "most specific" (generally farthest right) 
     * segment of the string being tested against the query.
     */
    function _adjustScoreForSegment(segmentCounter, score) {
        if (segmentCounter === 0) {
            // Multiplier used for matches within the most-specific part of the name (filename, for example)
            return score * 3;
        } else {
            return score;
        }
    }
    
    /**
     * Additional points are added when multiple characters in the string
     * being tested match against query characters.
     */
    function _boostForMatches(sequentialMatches) {
        // Multiplier for the number of sequential matched characters
        return sequentialMatches * sequentialMatches * 5;
    }
    
    /**
     * The score is boosted for matches that occur at the beginning
     * of a segment of string that is being tested against the query.
     */
    function _boostForPathSegmentStart(sequentialMatches) {
        // Multiplier for sequential matched characters at the beginning
        // of a delimited section (after a '/' in a path, for example)
        return sequentialMatches * sequentialMatches * 5;
    }
    
    /**
    * Upper case characters are boosted to help match MixedCase strings better.
    */
    function _boostForUpperCase(c) {
        return c.toUpperCase() === c ? 50 : 0;
    }

   /**
    * Performs matching of a string based on a query, and scores
    * the result based on specificity (assuming that the rightmost
    * side of the input is the most specific) and how clustered the
    * query characters are in the input string. The matching is
    * case-insensitive, but case is taken into account in the scoring.
    *
    * If the query characters cannot be found in order (but not necessarily all together), 
    * undefined is returned.
    *
    * The returned SearchResult has a matchGoodness score that can be used
    * for sorting. It also has a stringRanges array, each entry with
    * "text", "matched" and "segment". If you string the "text" properties together, you will
    * get the original str. Using the matched property, you can highlight
    * the string matches. The segment property tells you the most specific (rightmost)
    * segment covered by the range, though there may be more than one segment covered.
    * Segments are currently determined by "/"s.
    *
    * Use basicMatchSort() to sort the filtered results taking this ranking into account.
    * The label of the SearchResult is set to 'str'.
    * @param {!string} str
    * @param {!string} query
    * @return {?SearchResult}
    */
    function stringMatch(str, query) {
        var result;
        
        // start at the end and work backward, because we give preference
        // to matches in the name (last) segment
        var strCounter = str.length - 1;
        
        // stringRanges are used to keep track of which parts of
        // the input str matched the query
        var stringRanges = [];
        
        // segmentCounter tracks which "segment" (delimited section) of the
        // str we are in so that we can treat certain (generally most-specific) segments
        // specially.
        var segmentCounter = 0;
        
        // Keeps track of the most specific segment that the current stringRange
        // is associated with.
        var rangeSegment = 0;
        
        // addToStringRanges is used when we transition between matched and unmatched
        // parts of the string.
        function addToStringRanges(numberOfCharacters, matched) {
            var segment = rangeSegment;
            rangeSegment = segmentCounter;
            stringRanges.unshift({
                text: str.substr(strCounter + 1, numberOfCharacters),
                matched: matched,
                segment: segment
            });
        }

        // No query? Short circuit the normal work done and just
        // return a single range that covers the whole string.
        if (!query) {
            result = new SearchResult(str);
            result.matchGoodness = 0;
            strCounter = -1;
            addToStringRanges(str.length, false);
            result.stringRanges = stringRanges;
            return result;
        }
        
        var queryChars = query.toLowerCase().split("");
        
        // start at the end of the query
        var queryCounter = queryChars.length - 1;

        var score = 0;
        
        // sequentialMatches is positive when we are stepping through matched
        // characters and negative when stepping through unmatched characters
        var sequentialMatches = 0;
        
        while (strCounter >= 0 && queryCounter >= 0) {
            var curChar = str.charAt(strCounter);
            
            // Ideally, this function will work with different delimiters used in
            // different contexts. For now, this is used for paths delimited by '/'.
            if (curChar === '/') {
                // Beginning of segment, apply boost for a matching
                // string of characters, if there is one
                if (sequentialMatches > 0) {
                    score += _boostForPathSegmentStart(sequentialMatches);
                }
                
                score = _adjustScoreForSegment(segmentCounter, score);
                segmentCounter++;
            }
            
            if (queryChars[queryCounter] === curChar.toLowerCase()) {
                
                score += _boostForUpperCase(curChar);
                
                // are we ending a string of unmatched characters?
                if (sequentialMatches < 0) {
                    addToStringRanges(-sequentialMatches, false);
                    sequentialMatches = 0;
                }
                
                // matched character, chalk up another match
                // and move both counters back a character
                sequentialMatches++;
                queryCounter--;
                strCounter--;
            } else {
                // are we ending a string of matched characters?
                if (sequentialMatches > 0) {
                    addToStringRanges(sequentialMatches, true);
                    score += _boostForMatches(sequentialMatches);
                    sequentialMatches = 0;
                }
                // character didn't match, apply sequential matches
                // to score and keep looking
                strCounter--;
                sequentialMatches--;
            }
        }
        
        // if there are still query characters left, we don't
        // have a match
        if (queryCounter >= 0) {
            return undefined;
        }
        
        if (sequentialMatches) {
            addToStringRanges(Math.abs(sequentialMatches), sequentialMatches > 0);
        }
        
        if (strCounter >= 0) {
            stringRanges.unshift({
                text: str.substring(0, strCounter + 1),
                matched: false,
                segment: rangeSegment
            });
        }
        
        // now, we need to apply any score we've accumulated
        // before we ran out of query characters
        score += _boostForMatches(sequentialMatches);
        
        if (sequentialMatches && strCounter >= 0) {
            if (str.charAt(strCounter) === '/') {
                score += _boostForPathSegmentStart(sequentialMatches);
            }
        }
        score = _adjustScoreForSegment(segmentCounter, score);
        
        // Produce a SearchResult that is augmented with matchGoodness
        // (used for sorting) and stringRanges (used for highlighting
        // matched areas of the string)
        result = new SearchResult(str);
        result.matchGoodness = -1 * score;
        result.stringRanges = stringRanges;
        return result;
    }
    
    /**
     * Sorts an array of SearchResult objects on a primary field, followed by secondary fields
     * in case of ties. 'fields' maps field name to priority, where 0 is the primary field. E.g.:
     *      multiFieldSort(bugList, { milestone: 0, severity: 1 });
     * Would sort a bug list by milestone, and within each milestone sort bugs by severity.
     *
     * Any fields that have a string value are compared case-insensitively. Fields used should be
     * present on all SearchResult objects (no optional/undefined fields).
     *
     * @param {!Array.<SearchResult>} searchResults
     * @param {!Object.<string, number>} fields
     */
    function multiFieldSort(searchResults, fields) {
        // Move field names into an array, with primary field first
        var fieldNames = [];
        $.each(fields, function (key, priority) {
            fieldNames[priority] = key;
        });
        
        searchResults.sort(function (a, b) {
            var priority;
            for (priority = 0; priority < fieldNames.length; priority++) {
                var fieldName = fieldNames[priority];
                var valueA = a[fieldName];
                var valueB = b[fieldName];
                if (typeof valueA === "string") {
                    valueA = valueA.toLowerCase();
                    valueB = valueB.toLowerCase();
                }
                
                if (valueA < valueB) {
                    return -1;
                } else if (valueA > valueB) {
                    return 1;
                }
                // otherwise, move on to next sort priority
            }
            return 0; // all sort fields are equal
        });
    }
    
    /**
     * Sorts search results generated by stringMatch(): results are sorted into several
     * tiers based on how well they matched the search query, then sorted alphabetically
     * within each tier.
     */
    function basicMatchSort(searchResults) {
        multiFieldSort(searchResults, { matchGoodness: 0, label: 1 });
    }
    
    
    function searchFileList(query) {
        // FileIndexManager may still be loading asynchronously - if so, can't return a result yet
        if (!fileList) {
            // Smart Autocomplete allows us to return a Promise instead...
            var asyncResult = new $.Deferred();
            fileListPromise.done(function () {
                // ...but it's not very robust. If a previous Promise is obsoleted by the query string changing, it
                // keeps listening to it anyway. So the last Promise to resolve "wins" the UI update even if it's for
                // a stale query. Guard from that by checking that filter text hasn't changed while we were waiting:
                var currentQuery = $("input#quickOpenSearch").val();
                if (currentQuery === query) {
                    // We're still the current query. Synchronously re-run the search call and resolve with its results
                    asyncResult.resolve(searchFileList(query));
                } else {
                    asyncResult.reject();
                }
            });
            return asyncResult.promise();
        }
        
        // First pass: filter based on search string; convert to SearchResults containing extra info
        // for sorting & display
        var filteredList = $.map(fileList, function (fileInfo) {
            // Is it a match at all?
            // match query against the full path (with gaps between query characters allowed)
            var searchResult = stringMatch(ProjectManager.makeProjectRelativeIfPossible(fileInfo.fullPath), query);
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
        multiFieldSort(filteredList, { matchGoodness: 0, filenameWithoutExtension: 1, label: 2, fullPath: 3 });

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
        
        // No plugin: use default file search mode
        currentPlugin = null;
        return searchFileList(query);
    }


    /**
     * Formats item's label as properly escaped HTML text, highlighting sections that match 'query'.
     * If item is a SearchResult generated by stringMatch(), uses its metadata about which string ranges
     * matched; else formats the label with no highlighting.
     * @param {!string|SearchResult} item
     * @param {?string} matchClass CSS class for highlighting matched text
     * @param {?function(number, string):string} rangeFilter
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
                segment: 0
            }];
        }
        
        var displayName = "";
        
        // Put the path pieces together, highlighting the matched parts
        stringRanges.forEach(function (range) {
            if (range.matched) {
                displayName += "<span class='" + matchClass + "'>";
            }
            
            var rangeText = rangeFilter ? rangeFilter(range.segment, range.text) : range.text;
            displayName += StringUtils.breakableUrl(StringUtils.htmlEscape(rangeText));
            
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
        function fileNameFilter(segment, rangeText) {
            if (segment === 0) {
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

    function _handleResultsFormatter(item) {
        var query = $("input#quickOpenSearch").val();
        
        var formatter;

        if (currentPlugin) {
            // Plugins use their own formatter or the default formatter
            formatter = currentPlugin.resultsFormatter || defaultResultsFormatter;
        } else {
            // No plugin: default file search mode uses a special formatter
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
            
            // Kick smart-autocomplete to update (it only listens for keyboard events)
            // (due to #1855, this will only pop up results list; it won't auto-"focus" the first result)
            $field.trigger("keyIn", [initialString]);
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
     * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
     */
    QuickNavigateDialog.prototype.showDialog = function (prefix, initialString) {
        var that = this;

        if (dialogOpen) {
            return;
        }
        dialogOpen = true;

        // Global listener to hide search bar & popup
        this.handleDocumentMouseDown = this.handleDocumentMouseDown.bind(this);
        $(window.document).on("mousedown", this.handleDocumentMouseDown);


        // Ty TODO: disabled for now while file switching is disabled in _handleItemFocus
        // To improve performance during list selection disable JSLint until a document is chosen or dialog is closed
        //JSLintUtils.setEnabled(false);

        // Record current document & cursor pos so we can restore it if search is canceled
        var curDoc = DocumentManager.getCurrentDocument();
        origDocPath = curDoc ? curDoc.file.fullPath : null;
        if (curDoc) {
            origSelection = EditorManager.getCurrentFullEditor().getSelection();
        } else {
            origSelection = null;
        }
        
        // Show the search bar ("dialog")
        var dialogHTML = Strings.CMD_QUICK_OPEN + ": <input type='text' autocomplete='off' id='quickOpenSearch' style='width: 30em'>";
        that._createDialogDiv(dialogHTML);
        that.$searchField = $("input#quickOpenSearch");


        that.$searchField.smartAutoComplete({
            source: [],
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
            resultsReady: function (e, results) { that._handleResultsReady(results); },
            itemSelect: function (e, selectedItem) { that._handleItemSelect(selectedItem); },
            itemFocus: function (e, selectedItem) { that._handleItemFocus(selectedItem); },
            keydown: function (e) { that._handleKeyDown(e); },
            keyup: function (e, query) { that._handleKeyUp(e); },
            blur: function (e) { that._close(); }
            // Note: lostFocus event DOESN'T work because auto smart complete catches the key up from shift-command-o and immediately
            // triggers lostFocus
        });

        setSearchFieldValue(prefix, initialString);
        
        // Start fetching the file list, which will be needed the first time the user enters an un-prefixed query. If FileIndexManager's
        // caches are out of date, this list might take some time to asynchronously build. See searchFileList() for how this is handled.
        fileList = null;
        fileListPromise = FileIndexManager.getFileInfoList("all")
            .done(function (files) {
                fileList = files;
                fileListPromise = null;
            });
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
        if (dialogOpen) {
            setSearchFieldValue(prefix, initialString);
        } else {
            var dialog = new QuickNavigateDialog();
            dialog.showDialog(prefix, initialString);
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



    // TODO: allow QuickOpenJS to register it's own commands and key bindings
    CommandManager.register(Strings.CMD_QUICK_OPEN,         Commands.NAVIGATE_QUICK_OPEN,       doFileSearch);
    CommandManager.register(Strings.CMD_GOTO_DEFINITION,    Commands.NAVIGATE_GOTO_DEFINITION,  doDefinitionSearch);
    CommandManager.register(Strings.CMD_GOTO_LINE,          Commands.NAVIGATE_GOTO_LINE,        doGotoLine);

    exports.beginSearch         = beginSearch;
    exports.addQuickOpenPlugin  = addQuickOpenPlugin;
    exports.SearchResult        = SearchResult;
    exports.stringMatch         = stringMatch;
    exports.basicMatchSort      = basicMatchSort;
    exports.multiFieldSort      = multiFieldSort;
    exports.highlightMatch      = highlightMatch;
});
