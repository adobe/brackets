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
/*global define, $, window, setTimeout, ArrayBuffer, Int8Array */
/*unittests: QuickOpen */

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
        KeyEvent            = require("utils/KeyEvent"),
        ModalBar            = require("widgets/ModalBar").ModalBar;
    

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
    
    /**
     * The currently open quick open dialog.
     */
    var _curDialog;

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
        
        // Bind event handlers
        this._handleItemSelect         = this._handleItemSelect.bind(this);
        this._handleItemFocus          = this._handleItemFocus.bind(this);
        this._handleKeyUp              = this._handleKeyUp.bind(this);
        this._handleKeyDown            = this._handleKeyDown.bind(this);
        this._handleResultsReady       = this._handleResultsReady.bind(this);
        this._handleBlur               = this._handleBlur.bind(this);
        this._handleDocumentMouseDown  = this._handleDocumentMouseDown.bind(this);
        
        // Bind callbacks from smart-autocomplete
        this._filterCallback           = this._filterCallback.bind(this);
        this._resultsFormatterCallback = this._resultsFormatterCallback.bind(this);
    }

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
        // exactly matches index of search result in list returned by _filterCallback()
        var index = $(domItem).index();
        
        // This is just the last return value of _filterCallback(), which smart autocomplete helpfully caches
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
    QuickNavigateDialog.prototype._handleItemSelect = function (e, selectedDOMItem) {

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
    QuickNavigateDialog.prototype._handleItemFocus = function (e, selectedDOMItem) {
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
            this._handleItemFocus(null, $(".smart_autocomplete_container > li:first-child").get(0));
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
                this._handleItemSelect(null, $(".smart_autocomplete_highlight").get(0));
            }
            
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
        
        var lineNum = extractLineNumber(query),
            editor = EditorManager.getCurrentFullEditor();
        
        // We could just use 0 and lineCount() here, but in future we might want this logic to work for inline editors as well.
        return (!isNaN(lineNum) && editor && lineNum >= editor.getFirstVisibleLine() && lineNum <= editor.getLastVisibleLine());
    };
    
    /**
     * Give visual clue when there are no results
     */
    QuickNavigateDialog.prototype._handleResultsReady = function (e, results) {
        var isNoResults = (results.length === 0 && !this._isValidLineNumberQuery(this.$searchField.val()));
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
        // So we wait until after this call chain is complete before actually closing the dialog.
        var self = this;
        setTimeout(function () {
            self.modalBar.close();
        }, 0);
        
        $(".smart_autocomplete_container").remove();

        $(window.document).off("mousedown", this._handleDocumentMouseDown);
    };
    
    /**
     * Helper functions for stringMatch at the heart of the QuickOpen
     * matching.
     */
    
    /*
     * Identifies the "special" characters in the given string.
     * Special characters for matching purposes are:
     *
     * * the first character
     * * "/" and the character following the "/"
     * * "_", "." and "-" and the character following it
     * * an uppercase character that follows a lowercase one (think camelCase)
     *
     * The returned object contains an array called "specials". This array is
     * a list of indexes into the original string where all of the special
     * characters are. It also has a property "lastSegmentSpecialsIndex" which
     * is an index into the specials array that denotes which location is the
     * beginning of the last path segment. (This is used to allow scanning of
     * the last segment's specials separately.)
     * 
     * @param {string} input string to break apart (e.g. filename that is being searched)
     * @return {{specials:Array.<number>, lastSegmentSpecialsIndex:number}}
     */
    function findSpecialCharacters(str) {
        var i, c;
        
        // the beginning of the string is always special
        var specials = [0];
        
        // lastSegmentSpecialsIndex starts off with the assumption that
        // there are no segments
        var lastSegmentSpecialsIndex = 0;
        
        // used to track down the camelCase changeovers
        var lastWasLowerCase = false;
        
        for (i = 0; i < str.length; i++) {
            c = str[i];
            if (c === "/") {
                // new segment means this character and the next are special
                specials.push(i++);
                specials.push(i);
                lastSegmentSpecialsIndex = specials.length - 1;
                lastWasLowerCase = false;
            } else if (c === "." || c === "-" || c === "_") {
                // _, . and - are separators so they are
                // special and so is the next character
                specials.push(i++);
                specials.push(i);
                lastWasLowerCase = false;
            } else if (c.toUpperCase() === c) {
                // this is the check for camelCase changeovers
                if (lastWasLowerCase) {
                    specials.push(i);
                }
                lastWasLowerCase = false;
            } else {
                lastWasLowerCase = true;
            }
        }
        return {
            specials: specials,
            lastSegmentSpecialsIndex: lastSegmentSpecialsIndex
        };
    }
    
    // states used during the scanning of the string
    var SPECIALS_COMPARE = 0;
    var CONTIGUOUS_COMPARE = 1;
    var SPECIALS_EXHAUSTED = 2;
    
    // Scores can be hard to make sense of. The DEBUG_SCORES flag
    // provides a way to peek into the parts that made up a score.
    // This flag is used for manual debugging and in the unit tests only.
    var DEBUG_SCORES = false;
    function _setDebugScores(ds) {
        DEBUG_SCORES = ds;
    }
    
    // Constants for scoring
    var SPECIAL_POINTS = 25;
    var MATCH_POINTS = 10;
    var LAST_SEGMENT_BOOST = 1;
    var BEGINNING_OF_NAME_POINTS = 25;
    var DEDUCTION_FOR_LENGTH = 0.2;
    var CONSECUTIVE_MATCHES_POINTS = 25;
    var NOT_STARTING_ON_SPECIAL_PENALTY = 25;
    
    /*
     * Finds the best matches between the query and the string. The query is
     * compared with compareStr (generally a lower case string with a lower case
     * query), but the results are returned based on str.
     *
     * Generally speaking, this function tries to find a "special" character
     * (see findSpecialCharacters above) for the first character of the query.
     * When it finds one, it then tries to look for consecutive characters that
     * match. Once the characters stop matching, it tries to find a special
     * character for the next query character. If a special character isn't found, 
     * it starts scanning sequentially.
     *
     * The returned object contains the following fields:
     * * {Array} ranges: the scanned regions of the string, in order. For each range:
     *     * {string} text: the text for the string range
     *     * {boolean} matched: was this range part of the match?
     *     * {boolean} includesLastSegment: is this range part of the last segment of str
     * * {int} matchGoodness: the score computed for this match
     * * (optional) {Object} scoreDebug: if DEBUG_SCORES is true, an object with the score broken down
     *
     * @param {string} query the search string (generally lower cased)
     * @param {string} str the original string to search
     * @param {string} compareStr the string to compare with (generally lower cased)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} startingSpecial index into specials array to start scanning with
     * @param {boolean} lastSegmentStart optional which character does the last segment start at
     * @return {{ranges:Array.{text:string, matched:boolean, includesLastSegment:boolean}, matchGoodness:int, scoreDebug: Object}} matched ranges and score
     */
    function getMatchRanges(query, str, compareStr, specials, startingSpecial, lastSegmentStart) {
        var ranges = [];
        
        var score = 0;
        var scoreDebug;
        if (DEBUG_SCORES) {
            scoreDebug = {
                special: 0,
                match: 0,
                lastSegment: 0,
                beginning: 0,
                lengthDeduction: 0,
                consecutive: 0,
                notStartingOnSpecial: 0
            };
        }
        
        // normalize the optional parameters
        if (!lastSegmentStart) {
            lastSegmentStart = 0;
        }
        
        if (startingSpecial === undefined) {
            startingSpecial = 0;
        }
        
        var specialsCounter = startingSpecial;
        
        // strCounter and queryCounter are the indexes used for pulling characters
        // off of the str/compareStr and query.
        var strCounter = specials[startingSpecial];
        var queryCounter = 0;
        
        // initial state is to scan through the special characters
        var state = SPECIALS_COMPARE;
        
        // currentRange keeps track of the range we are adding characters to now
        var currentRange = null;
        var lastSegmentScore = 0;
        var currentRangeStartedOnSpecial = false;
        
        // the character index (against str) that was last in a matched range. This is used for
        // adding unmatched ranges in between and adding bonus points for consecutive matches.
        var lastMatchIndex = strCounter - 1;
        
        // Records the current range and adds any additional ranges required to
        // get to character index c. This function is called before starting a new range
        // or returning from the function.
        function closeRangeGap(c) {
            // close the current range
            if (currentRange) {
                currentRange.includesLastSegment = lastMatchIndex >= lastSegmentStart;
                if (currentRange.matched && currentRange.includesLastSegment) {
                    if (DEBUG_SCORES) {
                        scoreDebug.lastSegment += lastSegmentScore * LAST_SEGMENT_BOOST;
                    }
                    score += lastSegmentScore * LAST_SEGMENT_BOOST;
                }
                
                if (currentRange.matched && !currentRangeStartedOnSpecial) {
                    if (DEBUG_SCORES) {
                        scoreDebug.notStartingOnSpecial -= NOT_STARTING_ON_SPECIAL_PENALTY;
                    }
                    score -= NOT_STARTING_ON_SPECIAL_PENALTY;
                }
                ranges.push(currentRange);
            }
            
            // if there was space between the new range and the last,
            // add a new unmatched range before the new range can be added.
            if (lastMatchIndex + 1 < c) {
                ranges.push({
                    text: str.substring(lastMatchIndex + 1, c),
                    matched: false,
                    includesLastSegment: c > lastSegmentStart
                });
            }
            currentRange = null;
            lastSegmentScore = 0;
        }
        
        // records that the character at index c (of str) matches, adding
        // that character to the current range or starting a new one.
        function addMatch(c) {
            var newPoints = 0;
            
            // A match means that we need to do some scoring bookkeeping.
            if (DEBUG_SCORES) {
                scoreDebug.match += MATCH_POINTS;
            }
            newPoints += MATCH_POINTS;
            
            // a bonus is given for characters that match at the beginning
            // of the filename
            if (c === lastSegmentStart) {
                if (DEBUG_SCORES) {
                    scoreDebug.beginning += BEGINNING_OF_NAME_POINTS;
                }
                newPoints += BEGINNING_OF_NAME_POINTS;
            }
            
            // If the new character immediately follows the last matched character,
            // we award the consecutive matches bonus. The check for score > 0
            // handles the initial value of lastMatchIndex which is used for
            // constructing ranges but we don't yet have a true match.
            if (score > 0 && lastMatchIndex + 1 === c) {
                if (DEBUG_SCORES) {
                    scoreDebug.consecutive += CONSECUTIVE_MATCHES_POINTS;
                }
                newPoints += CONSECUTIVE_MATCHES_POINTS;
            }
            
            score += newPoints;
            if (c >= lastSegmentStart) {
                lastSegmentScore += newPoints;
            }
            
            // if the last range wasn't a match or there's a gap, we need to close off
            // the range to start a new one.
            if ((currentRange && !currentRange.matched) || c > lastMatchIndex + 1) {
                closeRangeGap(c);
            }
            lastMatchIndex = c;
            
            // set up a new match range or add to the current one
            if (!currentRange) {
                currentRange = {
                    text: str[c],
                    matched: true
                };
                
                // Check to see if this new matched range is starting on a special
                // character. We penalize those ranges that don't, because most
                // people will search on the logical boundaries of the name
                currentRangeStartedOnSpecial = c === specials[specialsCounter];
            } else {
                currentRange.text += str[c];
            }
        }
        
        // Compares the current character from the query string against the
        // special characters in compareStr.
        function findMatchingSpecial() {
            // used to loop through the specials
            var i;
            
            var foundMatch = false;
            for (i = specialsCounter; i < specials.length; i++) {
                // first, check to see if strCounter has moved beyond
                // the current special character. This is possible
                // if the contiguous comparison continued on through
                // the next special
                if (specials[i] < strCounter) {
                    specialsCounter = i;
                } else if (query[queryCounter] === compareStr[specials[i]]) {
                    // we have a match! do the required tracking
                    specialsCounter = i;
                    queryCounter++;
                    strCounter = specials[i];
                    addMatch(strCounter++);
                    if (DEBUG_SCORES) {
                        scoreDebug.special += SPECIAL_POINTS;
                    }
                    score += SPECIAL_POINTS;
                    foundMatch = true;
                    break;
                }
            }
            
            // when we find a match, we switch to looking for consecutive matching characters
            if (foundMatch) {
                state = CONTIGUOUS_COMPARE;
            } else {
                // we didn't find a match among the specials
                state = SPECIALS_EXHAUSTED;
            }
        }
        
        // keep looping until we've either exhausted the query or the string
        while (queryCounter < query.length && strCounter < str.length) {
            if (state === SPECIALS_COMPARE) {
                findMatchingSpecial();
            } else if (state === CONTIGUOUS_COMPARE || state === SPECIALS_EXHAUSTED) {
                // for both of these states, we're looking character by character 
                // for matches
                if (query[queryCounter] === compareStr[strCounter]) {
                    // got a match! record it, and switch to CONTIGUOUS_COMPARE
                    // in case we had been in SPECIALS_EXHAUSTED state
                    queryCounter++;
                    addMatch(strCounter++);
                    state = CONTIGUOUS_COMPARE;
                } else {
                    // no match. If we were in CONTIGUOUS_COMPARE mode, we
                    // we switch to looking for specials again. If we've
                    // already exhaused the specials, we're just going to keep
                    // stepping through compareStr.
                    if (state !== SPECIALS_EXHAUSTED) {
                        findMatchingSpecial();
                    } else {
                        strCounter++;
                    }
                }
            }
        }
        
        var result;
        // Add the rest of the string ranges
        closeRangeGap(str.length);
        
        // It's not a match if we still have query string left.
        if (queryCounter < query.length) {
            result = null;
        } else {
            result = {
                matchGoodness: score,
                ranges: ranges
            };
            if (DEBUG_SCORES) {
                result.scoreDebug = scoreDebug;
            }
        }
        return result;
    }
    
    /*
     * Seek out the best match in the last segment (generally the filename). 
     * Matches in the filename are preferred, but the query entered could match
     * any part of the path. So, we find the best match we can get in the filename
     * and then allow for searching the rest of the string with any characters that
     * are left from the beginning of the query.
     *
     * The parameters and return value are the same as for getMatchRanges,
     * except this function is always working on the last segment and the
     * result can optionally include a remainder, which is the characters
     * at the beginning of the query which did not match in the last segment.
     *
     * @param {string} query the search string (generally lower cased)
     * @param {string} str the original string to search
     * @param {string} compareStr the string to compare with (generally lower cased)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} startingSpecial index into specials array to start scanning with
     * @param {boolean} lastSegmentStart which character does the last segment start at
     * @return {{ranges:Array.{text:string, matched:boolean, includesLastSegment:boolean}, remainder:string, matchGoodness:int, scoreDebug: Object}} matched ranges and score
     */
    function _lastSegmentSearch(query, str, compareStr, specials, startingSpecial, lastSegmentStart) {
        var queryCounter, matchRanges;
        
        // It's possible that the query is longer than the last segment.
        // If so, we can chop off the bit that we know couldn't possibly be there.
        var remainder = "";
        var extraCharacters = specials[startingSpecial] + query.length - str.length;

        if (extraCharacters > 0) {
            remainder = query.substring(0, extraCharacters);
            query = query.substring(extraCharacters);
        }
        
        for (queryCounter = 0; queryCounter < query.length; queryCounter++) {
            matchRanges = getMatchRanges(query.substring(queryCounter),
                                     str, compareStr, specials, startingSpecial, lastSegmentStart);
            
            // if we've got a match *or* there are no segments in this string, we're done
            if (matchRanges || startingSpecial === 0) {
                break;
            }
        }
        
        if (queryCounter === query.length || !matchRanges) {
            return null;
        } else {
            matchRanges.remainder = remainder + query.substring(0, queryCounter);
            return matchRanges;
        }
    }
    
    /*
     * Implements the top-level search algorithm. Search the last segment first,
     * then search the rest of the string with the remainder.
     *
     * The parameters and return value are the same as for getMatchRanges.
     *
     * @param {string} query the search string (will be searched lower case)
     * @param {string} str the original string to search
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} lastSegmentSpecialsIndex index into specials array to start scanning with
     * @return {{ranges:Array.{text:string, matched:boolean, includesLastSegment:boolean}, matchGoodness:int, scoreDebug: Object}} matched ranges and score
     */
    function _computeMatch(query, str, specials, lastSegmentSpecialsIndex) {
        // set up query as all lower case and make a lower case string to use for comparisons
        query = query.toLowerCase();
        var compareStr = str.toLowerCase();
        
        var lastSegmentStart = specials[lastSegmentSpecialsIndex];
        var result;
        
        if (lastSegmentStart + query.length < str.length) {
            result = _lastSegmentSearch(query, str, compareStr, specials, lastSegmentSpecialsIndex, lastSegmentStart);
        }
        
        if (result) {
            // Do we have more query characters that did not fit?
            if (result.remainder) {
                // Scan with the remainder only through the beginning of the last segment
                var remainderResult = getMatchRanges(result.remainder, str.substring(0, lastSegmentStart),
                                              compareStr.substring(0, lastSegmentStart),
                                              specials.slice(0, lastSegmentSpecialsIndex), 0, lastSegmentStart);
                
                if (remainderResult) {
                    // We have a match
                    // This next part deals with scoring for the case where
                    // there are consecutive matched characters at the border of the
                    // last segment.
                    var lastRange = remainderResult.ranges[remainderResult.ranges.length - 1];
                    if (result.ranges[0].matched && lastRange.matched) {
                        result.matchGoodness += lastRange.text.length * CONSECUTIVE_MATCHES_POINTS;
                        if (DEBUG_SCORES) {
                            result.scoreDebug.consecutive += lastRange.text.length * CONSECUTIVE_MATCHES_POINTS;
                        }
                    }
                    
                    // add the new matched ranges to the beginning of the set of ranges we had
                    result.ranges.unshift.apply(result.ranges, remainderResult.ranges);
                } else {
                    // no match
                    return null;
                }
            } else {
                // There was no remainder, which means that the whole match is in the
                // last segment. We need to add a range at the beginning for everything
                // that came before the last segment.
                result.ranges.unshift({
                    text: str.substring(0, lastSegmentStart),
                    matched: false,
                    includesLastSegment: false
                });
            }
            delete result.remainder;
        } else {
            // No match in the last segment, so we start over searching the whole
            // string
            result = getMatchRanges(query, str, compareStr, specials, 0, lastSegmentStart);
        }
        
        if (result) {
            var lengthPenalty = -1 * Math.round(str.length * DEDUCTION_FOR_LENGTH);
            if (DEBUG_SCORES) {
                result.scoreDebug.lengthDeduction = lengthPenalty;
            }
            result.matchGoodness = result.matchGoodness + lengthPenalty;
        }
        return result;
    }
    
    /*
     * Match str against the query using the QuickOpen algorithm provided by
     * the functions above. The general idea is to prefer matches in the last
     * segment (the filename) and matches of "special" characters. stringMatch
     * will try to provide the best match and produces a "matchGoodness" score
     * to allow for relative ranking.
     *
     * The result object returned includes "stringRanges" which can be used to highlight
     * the matched portions of the string, in addition to the "matchGoodness"
     * mentioned above. If DEBUG_SCORES is true, scoreDebug is set on the result
     * to provide insight into the score.
     *
     * The matching is done in a case-insensitive manner.
     * 
     * @param {string} str  The string to search
     * @param {string} query  The query string to find in string
     */
    function stringMatch(str, query) {
        var result;

        // No query? Short circuit the normal work done and just
        // return a single range that covers the whole string.
        if (!query) {
            result = new SearchResult(str);
            result.matchGoodness = 0;
            if (DEBUG_SCORES) {
                result.scoreDebug = {};
            }
            result.stringRanges = [{
                text: str,
                matched: false,
                includesLastSegment: true
            }];
            return result;
        }
        
        // Locate the special characters and then use orderedCompare to do the real
        // work.
        var special = findSpecialCharacters(str);
        var compareData = _computeMatch(query, str, special.specials,
                              special.lastSegmentSpecialsIndex);
        
        // If we get a match, turn this into a SearchResult as expected by the consumers
        // of this API.
        if (compareData) {
            result = new SearchResult(str);
            result.stringRanges = compareData.ranges;
            result.matchGoodness = -1 * compareData.matchGoodness;
            if (DEBUG_SCORES) {
                result.scoreDebug = compareData.scoreDebug;
            }
        }
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

    /**
     * Handles changes to the current query in the search field.
     * @param {string} query The new query.
     * @return {Array} The filtered list of results.
     */
    QuickNavigateDialog.prototype._filterCallback = function (query) {
        this._updateDialogLabel(query);
        
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
        if (DEBUG_SCORES) {
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
        
        this._updateDialogLabel(initialString);
    };
    
    /**
     * Sets the dialog label based on the type of the given query.
     * @param {string} query The user's current query.
     */
    QuickNavigateDialog.prototype._updateDialogLabel = function (query) {
        var prefix = (query.length > 0 ? query.charAt(0) : "");
        
        // Update the dialog label based on the current prefix.
        var dialogLabel = "";
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
        $(".find-dialog-label", this.dialog).text(dialogLabel);
    };
    
    /**
     * Close the dialog when the user clicks outside of it. Smart-autocomplete listens for this and automatically closes its popup,
     * but we want to close the whole search "dialog." (And we can't just piggyback on the popup closing event, since there are cases
     * where the popup closes that we want the dialog to remain open (e.g. deleting search term via backspace).
     */
    QuickNavigateDialog.prototype._handleDocumentMouseDown = function (e) {
        if (this.modalBar.getRoot().find(e.target).length === 0 && $(".smart_autocomplete_container").find(e.target).length === 0) {
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
     * Close the dialog when it loses focus.
     */
    QuickNavigateDialog.prototype._handleBlur = function (e) {
        this._close();
    };

    /**
     * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
     */
    QuickNavigateDialog.prototype.showDialog = function (prefix, initialString) {
        if (dialogOpen) {
            return;
        }
        dialogOpen = true;

        // Global listener to hide search bar & popup
        $(window.document).on("mousedown", this._handleDocumentMouseDown);


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
        var dialogHTML = "<div align='right'><span class='find-dialog-label'></span>: <input type='text' autocomplete='off' id='quickOpenSearch' style='width: 30em'></div>";
        this.modalBar = new ModalBar(dialogHTML, false);
        this.$searchField = $("input#quickOpenSearch");

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

        this.$searchField.bind({
            resultsReady: this._handleResultsReady,
            itemSelect: this._handleItemSelect,
            itemFocus: this._handleItemFocus,
            keydown: this._handleKeyDown,
            keyup: this._handleKeyUp,
            blur: this._handleBlur
            // Note: lostFocus event DOESN'T work because auto smart complete catches the key up from shift-command-o and immediately
            // triggers lostFocus
        });

        this.setSearchFieldValue(prefix, initialString);
        
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
            _curDialog.setSearchFieldValue(prefix, initialString);
        } else {
            _curDialog = new QuickNavigateDialog();
            _curDialog.showDialog(prefix, initialString);
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

    exports.beginSearch             = beginSearch;
    exports.addQuickOpenPlugin      = addQuickOpenPlugin;
    exports.SearchResult            = SearchResult;
    exports.stringMatch             = stringMatch;
    exports.basicMatchSort          = basicMatchSort;
    exports.multiFieldSort          = multiFieldSort;
    exports.highlightMatch          = highlightMatch;
    exports._findSpecialCharacters  = findSpecialCharacters;
    exports._computeMatch           = _computeMatch;
    exports._lastSegmentSearch      = _lastSegmentSearch;
    exports._setDebugScores         = _setDebugScores;
});
