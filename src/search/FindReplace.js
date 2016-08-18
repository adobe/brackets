/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*unittests: FindReplace*/

/**
 * Adds Find and Replace commands
 *
 * Originally based on the code in CodeMirror/lib/util/search.js.
 */
define(function (require, exports, module) {
    "use strict";

    var CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        MainViewManager     = require("view/MainViewManager"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        Editor              = require("editor/Editor"),
        EditorManager       = require("editor/EditorManager"),
        FindBar             = require("search/FindBar").FindBar,
        FindUtils           = require("search/FindUtils"),
        FindInFilesUI       = require("search/FindInFilesUI"),
        ScrollTrackMarkers  = require("search/ScrollTrackMarkers"),
        _                   = require("thirdparty/lodash"),
        CodeMirror          = require("thirdparty/CodeMirror/lib/codemirror");

    /**
     * Maximum file size to search within (in chars)
     * @const {number}
     */
    var FIND_MAX_FILE_SIZE  = 500000;

    /**
     * If the number of matches exceeds this limit, inline text highlighting and scroll-track tickmarks are disabled
     * @const {number}
     */
    var FIND_HIGHLIGHT_MAX  = 2000;

    /**
     * Currently open Find or Find/Replace bar, if any
     * @type {?FindBar}
     */
    var findBar;

    function SearchState() {
        this.searchStartPos = null;
        this.parsedQuery = null;
        this.queryInfo = null;
        this.foundAny = false;
        this.marked = [];
        this.resultSet = [];
        this.matchIndex = -1;
        this.markedCurrent = null;
    }

    function getSearchState(cm) {
        if (!cm._searchState) {
            cm._searchState = new SearchState();
        }
        return cm._searchState;
    }

    function getSearchCursor(cm, state, pos) {
        // Heuristic: if the query string is all lowercase, do a case insensitive search.
        return cm.getSearchCursor(state.parsedQuery, pos, !state.queryInfo.isCaseSensitive);
    }

    function parseQuery(queryInfo) {
        if (findBar) {
            findBar.showError(null);
        }

        var parsed = FindUtils.parseQueryInfo(queryInfo);
        if (parsed.empty === true) {
            return "";
        }

        if (!parsed.valid) {
            if (findBar) {
                findBar.showError(parsed.error);
            }
            return "";
        }

        return parsed.queryExpr;
    }

    /**
     * @private
     * Determine the query from the given info and store it in the state.
     * @param {SearchState} state The state to store the parsed query in
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo
     *      The query info object as returned by FindBar.getQueryInfo()
     */
    function setQueryInfo(state, queryInfo) {
        state.queryInfo = queryInfo;
        if (!queryInfo) {
            state.parsedQuery = null;
        } else {
            state.parsedQuery = parseQuery(queryInfo);
        }
    }

    /**
     * @private
     * Show the current match index by finding matchRange in the resultSet stored
     * in the search state if this is the first call for a new search query. For
     * subsequent calls, just compare matchRange with the next match in the resultSet
     * based on the search direction and show the next match if they are the same.
     * If not, then find the match index by searching matchRange in the entire resultSet.
     *
     * @param {!SearchState} state The search state that has the array of search result
     * @param {!{from: {line: number, ch: number}, to: {line: number, ch: number}}} matchRange - the range of current match
     * @param {!boolean} searchBackwards true if searching backwards
     */
    function _updateFindBarWithMatchInfo(state, matchRange, searchBackwards) {
        // Bail if there is no result set.
        if (!state.foundAny) {
            return;
        }

        if (findBar) {
            if (state.matchIndex === -1) {
                state.matchIndex = _.findIndex(state.resultSet, matchRange);
            } else {
                state.matchIndex = searchBackwards ? state.matchIndex - 1 : state.matchIndex + 1;
                // Adjust matchIndex for modulo wraparound
                state.matchIndex = (state.matchIndex + state.resultSet.length) % state.resultSet.length;

                // Confirm that we find the right matchIndex. If not, then search
                // matchRange in the entire resultSet.
                if (!_.isEqual(state.resultSet[state.matchIndex], matchRange)) {
                    state.matchIndex = _.findIndex(state.resultSet, matchRange);
                }
            }

            console.assert(state.matchIndex !== -1);
            if (state.matchIndex !== -1) {
                // Convert to 1-based by adding one before showing the index.
                findBar.showFindCount(StringUtils.format(Strings.FIND_MATCH_INDEX,
                                                        state.matchIndex + 1, state.resultSet.length));
            }
        }
    }

    /**
     * @private
     * Returns the next match for the current query (from the search state) before/after the given position. Wraps around
     * the end of the document if no match is found before the end.
     *
     * @param {!Editor} editor The editor to search in
     * @param {boolean} searchBackwards true to search backwards
     * @param {{line: number, ch: number}=} pos The position to start from. Defaults to the current primary selection's
     *      head cursor position.
     * @param {boolean=} wrap Whether to wrap the search around if we hit the end of the document. Default true.
     * @return {?{start: {line: number, ch: number}, end: {line: number, ch: number}}} The range for the next match, or
     *      null if there is no match.
     */
    function _getNextMatch(editor, searchBackwards, pos, wrap) {
        var cm = editor._codeMirror;
        var state = getSearchState(cm);
        var cursor = getSearchCursor(cm, state, pos || editor.getCursorPos(false, searchBackwards ? "start" : "end"));

        state.lastMatch = cursor.find(searchBackwards);
        if (!state.lastMatch && wrap !== false) {
            // If no result found before hitting edge of file, try wrapping around
            cursor = getSearchCursor(cm, state, searchBackwards ? {line: cm.lineCount() - 1} : {line: 0, ch: 0});
            state.lastMatch = cursor.find(searchBackwards);
        }
        if (!state.lastMatch) {
            // No result found, period: clear selection & bail
            cm.setCursor(editor.getCursorPos());  // collapses selection, keeping cursor in place to avoid scrolling
            return null;
        }

        return {start: cursor.from(), end: cursor.to()};
    }

    /**
     * @private
     * Sets the given selections in the editor and applies some heuristics to determine whether and how we should
     * center the primary selection.
     *
     * @param {!Editor} editor The editor to search in
     * @param {!Array<{start:{line:number, ch:number}, end:{line:number, ch:number}, primary:boolean, reversed: boolean}>} selections
     *      The selections to set. Must not be empty.
     * @param {boolean} center Whether to try to center the primary selection vertically on the screen. If false, the selection will still be scrolled
     *      into view if it's offscreen, but will not be centered.
     * @param {boolean=} preferNoScroll If center is true, whether to avoid scrolling if the hit is in the top half of the screen. Default false.
     */
    function _selectAndScrollTo(editor, selections, center, preferNoScroll) {
        var primarySelection = _.find(selections, function (sel) { return sel.primary; }) || _.last(selections),
            resultVisible = editor.isLineVisible(primarySelection.start.line),
            centerOptions = Editor.BOUNDARY_CHECK_NORMAL;

        if (preferNoScroll && resultVisible) {
            // no need to scroll if the line with the match is in view
            centerOptions = Editor.BOUNDARY_IGNORE_TOP;
        }

        // Make sure the primary selection is fully visible on screen.
        var primary = _.find(selections, function (sel) {
            return sel.primary;
        });
        if (!primary) {
            primary = _.last(selections);
        }
        editor._codeMirror.scrollIntoView({from: primary.start, to: primary.end});
        editor.setSelections(selections, center, centerOptions);
    }

    /**
     * Returns the range of the word surrounding the given editor position. Similar to getWordAt() from CodeMirror.
     *
     * @param {!Editor} editor The editor to search in
     * @param {!{line: number, ch: number}} pos The position to find a word at.
     * @return {{start:{line: number, ch: number}, end:{line:number, ch:number}, text:string}} The range and content of the found word. If
     *     there is no word, start will equal end and the text will be the empty string.
     */
    function _getWordAt(editor, pos) {
        var cm = editor._codeMirror,
            start = pos.ch,
            end = start,
            line = cm.getLine(pos.line);
        while (start && CodeMirror.isWordChar(line.charAt(start - 1))) {
            --start;
        }
        while (end < line.length && CodeMirror.isWordChar(line.charAt(end))) {
            ++end;
        }
        return {start: {line: pos.line, ch: start}, end: {line: pos.line, ch: end}, text: line.slice(start, end)};
    }

    /**
     * @private
     * Helper function. Returns true if two selections are equal.
     * @param {!{start: {line: number, ch: number}, end: {line: number, ch: number}}} sel1 The first selection to compare
     * @param {!{start: {line: number, ch: number}, end: {line: number, ch: number}}} sel2 The second selection to compare
     * @return {boolean} true if the selections are equal
     */
    function _selEq(sel1, sel2) {
        return (CodeMirror.cmpPos(sel1.start, sel2.start) === 0 && CodeMirror.cmpPos(sel1.end, sel2.end) === 0);
    }

    /**
     * Expands each empty range in the selection to the nearest word boundaries. Then, if the primary selection
     * was already a range (even a non-word range), adds the next instance of the contents of that range as a selection.
     *
     * @param {!Editor} editor The editor to search in
     * @param {boolean=} removePrimary Whether to remove the current primary selection in addition to adding the
     * next one. If true, we add the next match even if the current primary selection is a cursor (we expand it
     * first to determine what to match).
     */
    function _expandWordAndAddNextToSelection(editor, removePrimary) {
        editor = editor || EditorManager.getActiveEditor();
        if (!editor) {
            return;
        }

        var selections = editor.getSelections(),
            primarySel,
            primaryIndex,
            searchText,
            added = false;

        _.each(selections, function (sel, index) {
            var isEmpty = (CodeMirror.cmpPos(sel.start, sel.end) === 0);
            if (sel.primary) {
                primarySel = sel;
                primaryIndex = index;
                if (!isEmpty) {
                    searchText = editor.document.getRange(primarySel.start, primarySel.end);
                }
            }
            if (isEmpty) {
                var wordInfo = _getWordAt(editor, sel.start);
                sel.start = wordInfo.start;
                sel.end = wordInfo.end;
                if (sel.primary && removePrimary) {
                    // Get the expanded text, even though we're going to remove this selection,
                    // since in this case we still want to select the next match.
                    searchText = wordInfo.text;
                }
            }
        });

        if (searchText && searchText.length) {
            // We store this as a query in the state so that if the user next does a "Find Next",
            // it will use the same query (but throw away the existing selection).
            var state = getSearchState(editor._codeMirror);
            setQueryInfo(state, { query: searchText, isCaseSensitive: false, isRegexp: false });

            // Skip over matches that are already in the selection.
            var searchStart = primarySel.end,
                nextMatch,
                isInSelection;
            do {
                nextMatch = _getNextMatch(editor, false, searchStart);
                if (nextMatch) {
                    // This is a little silly, but if we just stick the equivalence test function in here
                    // JSLint complains about creating a function in a loop, even though it's safe in this case.
                    isInSelection = _.find(selections, _.partial(_selEq, nextMatch));
                    searchStart = nextMatch.end;

                    // If we've gone all the way around, then all instances must have been selected already.
                    if (CodeMirror.cmpPos(searchStart, primarySel.end) === 0) {
                        nextMatch = null;
                        break;
                    }
                }
            } while (nextMatch && isInSelection);

            if (nextMatch) {
                nextMatch.primary = true;
                selections.push(nextMatch);
                added = true;
            }
        }

        if (removePrimary) {
            selections.splice(primaryIndex, 1);
        }

        if (added) {
            // Center the new match, but avoid scrolling to matches that are already on screen.
            _selectAndScrollTo(editor, selections, true, true);
        } else {
            // If all we did was expand some selections, don't center anything.
            _selectAndScrollTo(editor, selections, false);
        }
    }

    function _skipCurrentMatch(editor) {
        return _expandWordAndAddNextToSelection(editor, true);
    }

    /**
     * Takes the primary selection, expands it to a word range if necessary, then sets the selection to
     * include all instances of that range. Removes all other selections. Does nothing if the selection
     * is not a range after expansion.
     */
    function _findAllAndSelect(editor) {
        editor = editor || EditorManager.getActiveEditor();
        if (!editor) {
            return;
        }

        var sel = editor.getSelection(),
            newSelections = [];
        if (CodeMirror.cmpPos(sel.start, sel.end) === 0) {
            sel = _getWordAt(editor, sel.start);
        }
        if (CodeMirror.cmpPos(sel.start, sel.end) !== 0) {
            var searchStart = {line: 0, ch: 0},
                state = getSearchState(editor._codeMirror),
                nextMatch;
            setQueryInfo(state, { query: editor.document.getRange(sel.start, sel.end), isCaseSensitive: false, isRegexp: false });

            while ((nextMatch = _getNextMatch(editor, false, searchStart, false)) !== null) {
                if (_selEq(sel, nextMatch)) {
                    nextMatch.primary = true;
                }
                newSelections.push(nextMatch);
                searchStart = nextMatch.end;
            }

            // This should find at least the original selection, but just in case...
            if (newSelections.length) {
                // Don't change the scroll position.
                editor.setSelections(newSelections, false);
            }
        }
    }

    /** Removes the current-match highlight, leaving all matches marked in the generic highlight style */
    function clearCurrentMatchHighlight(cm, state) {
        if (state.markedCurrent) {
            state.markedCurrent.clear();
            ScrollTrackMarkers.markCurrent(-1);
        }
    }

    /**
     * Selects the next match (or prev match, if searchBackwards==true) starting from either the current position
     * (if pos unspecified) or the given position (if pos specified explicitly). The starting position
     * need not be an existing match. If a new match is found, sets to state.lastMatch either the regex
     * match result, or simply true for a plain-string match. If no match found, sets state.lastMatch
     * to false.
     * @param {!Editor} editor
     * @param {?boolean} searchBackwards
     * @param {?boolean} preferNoScroll
     * @param {?Pos} pos
     */
    function findNext(editor, searchBackwards, preferNoScroll, pos) {
        var cm = editor._codeMirror;
        cm.operation(function () {
            var state = getSearchState(cm);
            clearCurrentMatchHighlight(cm, state);

            var nextMatch = _getNextMatch(editor, searchBackwards, pos);
            if (nextMatch) {
                // Update match index indicators - only possible if we have resultSet saved (missing if FIND_MAX_FILE_SIZE threshold hit)
                if (state.resultSet.length) {
                    _updateFindBarWithMatchInfo(state,
                                                {from: nextMatch.start, to: nextMatch.end}, searchBackwards);
                    // Update current-tickmark indicator - only if highlighting enabled (disabled if FIND_HIGHLIGHT_MAX threshold hit)
                    if (state.marked.length) {
                        ScrollTrackMarkers.markCurrent(state.matchIndex);  // _updateFindBarWithMatchInfo() has updated this index
                    }
                }

                _selectAndScrollTo(editor, [nextMatch], true, preferNoScroll);

                // Only mark text with "current match" highlight if search bar still open
                if (findBar && !findBar.isClosed()) {
                    // If highlighting disabled, apply both match AND current-match styles for correct appearance
                    var curentMatchClassName = state.marked.length ? "searching-current-match" : "CodeMirror-searching searching-current-match";
                    state.markedCurrent = cm.markText(nextMatch.start, nextMatch.end,
                         { className: curentMatchClassName, startStyle: "searching-first", endStyle: "searching-last" });
                }
            } else {
                cm.setCursor(editor.getCursorPos());  // collapses selection, keeping cursor in place to avoid scrolling
                // (nothing more to do: previous highlights already cleared above)
            }
        });
    }

    /** Clears all match highlights, including the current match */
    function clearHighlights(cm, state) {
        cm.operation(function () {
            state.marked.forEach(function (markedRange) {
                markedRange.clear();
            });
            clearCurrentMatchHighlight(cm, state);
        });
        state.marked.length = 0;
        state.markedCurrent = null;

        ScrollTrackMarkers.clear();

        state.resultSet = [];
        state.matchIndex = -1;
    }

    function clearSearch(cm) {
        cm.operation(function () {
            var state = getSearchState(cm);
            if (!state.parsedQuery) {
                return;
            }
            setQueryInfo(state, null);

            clearHighlights(cm, state);
        });
    }

    function toggleHighlighting(editor, enabled) {
        // Temporarily change selection color to improve highlighting - see LESS code for details
        if (enabled) {
            $(editor.getRootElement()).addClass("find-highlighting");
        } else {
            $(editor.getRootElement()).removeClass("find-highlighting");
        }

        ScrollTrackMarkers.setVisible(editor, enabled);
    }

    /**
     * Called each time the search query changes or document is modified (via Replace). Updates
     * the match count, match highlights and scrollbar tickmarks. Does not change the cursor pos.
     */
    function updateResultSet(editor) {
        var cm = editor._codeMirror,
            state = getSearchState(cm);

        function indicateHasMatches(numResults) {
            // Make the field red if it's not blank and it has no matches (which also covers invalid regexes)
            findBar.showNoResults(!state.foundAny && findBar.getQueryInfo().query);

            // Navigation buttons enabled if we have a query and more than one match
            findBar.enableNavigation(state.foundAny && numResults > 1);
            findBar.enableReplace(state.foundAny);
        }

        cm.operation(function () {
            // Clear old highlights
            if (state.marked) {
                clearHighlights(cm, state);
            }

            if (!state.parsedQuery) {
                // Search field is empty - no results
                findBar.showFindCount("");
                state.foundAny = false;
                indicateHasMatches();
                return;
            }

            // Find *all* matches, searching from start of document
            // (Except on huge documents, where this is too expensive)
            var cursor = getSearchCursor(cm, state);
            if (cm.getValue().length <= FIND_MAX_FILE_SIZE) {
                // FUTURE: if last query was prefix of this one, could optimize by filtering last result set
                state.resultSet = [];
                while (cursor.findNext()) {
                    state.resultSet.push(cursor.pos);  // pos is unique obj per search result
                }

                // Highlight all matches if there aren't too many
                if (state.resultSet.length <= FIND_HIGHLIGHT_MAX) {
                    toggleHighlighting(editor, true);

                    state.resultSet.forEach(function (result) {
                        state.marked.push(cm.markText(result.from, result.to,
                             { className: "CodeMirror-searching", startStyle: "searching-first", endStyle: "searching-last" }));
                    });
                    var scrollTrackPositions = state.resultSet.map(function (result) {
                        return result.from;
                    });

                    ScrollTrackMarkers.addTickmarks(editor, scrollTrackPositions);
                }

                // Here we only update find bar with no result. In the case of a match
                // a findNext() call is guaranteed to be followed by this function call,
                // and findNext() in turn calls _updateFindBarWithMatchInfo() to show the
                // match index.
                if (state.resultSet.length === 0) {
                    findBar.showFindCount(Strings.FIND_NO_RESULTS);
                }

                state.foundAny = (state.resultSet.length > 0);
                indicateHasMatches(state.resultSet.length);

            } else {
                // On huge documents, just look for first match & then stop
                findBar.showFindCount("");
                state.foundAny = cursor.findNext();
                indicateHasMatches();
            }
        });
    }

    /**
     * Called each time the search query field changes. Updates state.parsedQuery (parsedQuery will be falsy if the field
     * was blank OR contained a regexp with invalid syntax). Then calls updateResultSet(), and then jumps to
     * the first matching result, starting from the original cursor position.
     * @param {!Editor} editor The editor we're searching in.
     * @param {Object} state The current query state.
     * @param {boolean} initial Whether this is the initial population of the query when the search bar opens.
     *     In that case, we don't want to change the selection unnecessarily.
     */
    function handleQueryChange(editor, state, initial) {
        setQueryInfo(state, findBar.getQueryInfo());
        updateResultSet(editor);

        if (state.parsedQuery) {
            // 3rd arg: prefer to avoid scrolling if result is anywhere within view, since in this case user
            // is in the middle of typing, not navigating explicitly; viewport jumping would be distracting.
            findNext(editor, false, true, state.searchStartPos);
        } else if (!initial) {
            // Blank or invalid query: just jump back to initial pos
            editor._codeMirror.setCursor(state.searchStartPos);
        }
    }


    /**
     * Creates a Find bar for the current search session.
     * @param {!Editor} editor
     * @param {boolean} replace Whether to show the Replace UI; default false
     */
    function openSearchBar(editor, replace) {
        var cm = editor._codeMirror,
            state = getSearchState(cm);

        // Use the selection start as the searchStartPos. This way if you
        // start with a pre-populated search and enter an additional character,
        // it will extend the initial selection instead of jumping to the next
        // occurrence.
        state.searchStartPos = editor.getCursorPos(false, "start");

        // Prepopulate the search field
        var initialQuery = FindBar.getInitialQuery(findBar, editor);

        // Close our previous find bar, if any. (The open() of the new findBar will
        // take care of closing any other find bar instances.)
        if (findBar) {
            findBar.close();
        }

        // Create the search bar UI (closing any previous find bar in the process)
        findBar = new FindBar({
            multifile: false,
            replace: replace,
            initialQuery: initialQuery.query,
            initialReplaceText: initialQuery.replaceText,
            queryPlaceholder: Strings.FIND_QUERY_PLACEHOLDER
        });
        findBar.open();

        findBar
            .on("queryChange.FindReplace", function (e) {
                handleQueryChange(editor, state);
            })
            .on("doFind.FindReplace", function (e, searchBackwards) {
                findNext(editor, searchBackwards);
            })
            .on("close.FindReplace", function (e) {
                // Clear highlights but leave search state in place so Find Next/Previous work after closing
                clearHighlights(cm, state);

                // Dispose highlighting UI (important to restore normal selection color as soon as focus goes back to the editor)
                toggleHighlighting(editor, false);

                findBar.off(".FindReplace");
                findBar = null;
            });

        handleQueryChange(editor, state, true);
    }

    /**
     * If no search pending, opens the Find dialog. If search bar already open, moves to
     * next/prev result (depending on 'searchBackwards')
     */
    function doSearch(editor, searchBackwards) {
        var state = getSearchState(editor._codeMirror);
        if (state.parsedQuery) {
            findNext(editor, searchBackwards);
            return;
        }

        openSearchBar(editor, false);
    }


    /**
     * @private
     * When the user switches documents (or closes the last document), ensure that the find bar
     * closes, and also close the Replace All panel.
     */
    function _handleFileChanged() {
        if (findBar) {
            findBar.close();
        }
    }

    function doReplace(editor, all) {
        var cm = editor._codeMirror,
            state = getSearchState(cm),
            replaceText = findBar.getReplaceText();

        if (all) {
            findBar.close();
            // Delegate to Replace in Files.
            FindInFilesUI.searchAndShowResults(state.queryInfo, editor.document.file, null, replaceText);
        } else {
            cm.replaceSelection(state.queryInfo.isRegexp ? FindUtils.parseDollars(replaceText, state.lastMatch) : replaceText);

            updateResultSet(editor);  // we updated the text, so result count & tickmarks must be refreshed

            findNext(editor);
            if (!state.lastMatch) {
                // No more matches, so destroy find bar
                findBar.close();
            }
        }
    }

    function replace(editor) {
        // If Replace bar already open, treat the shortcut as a hotkey for the Replace button
        if (findBar && findBar.getOptions().replace && findBar.isReplaceEnabled()) {
            doReplace(editor, false);
            return;
        }

        openSearchBar(editor, true);

        findBar
            .on("doReplace.FindReplace", function (e) {
                doReplace(editor, false);
            })
            .on("doReplaceAll.FindReplace", function (e) {
                doReplace(editor, true);
            });
    }

    function _launchFind() {
        var editor = EditorManager.getActiveEditor();
        if (editor) {
            // Create a new instance of the search bar UI
            clearSearch(editor._codeMirror);
            doSearch(editor, false);
        }
    }

    function _findNext() {
        var editor = EditorManager.getActiveEditor();
        if (editor) {
            doSearch(editor);
        }
    }

    function _findPrevious() {
        var editor = EditorManager.getActiveEditor();
        if (editor) {
            doSearch(editor, true);
        }
    }

    function _replace() {
        var editor = EditorManager.getActiveEditor();
        if (editor) {
            replace(editor);
        }
    }

    MainViewManager.on("currentFileChange", _handleFileChanged);

    CommandManager.register(Strings.CMD_FIND,                   Commands.CMD_FIND,                  _launchFind);
    CommandManager.register(Strings.CMD_FIND_NEXT,              Commands.CMD_FIND_NEXT,             _findNext);
    CommandManager.register(Strings.CMD_REPLACE,                Commands.CMD_REPLACE,               _replace);
    CommandManager.register(Strings.CMD_FIND_PREVIOUS,          Commands.CMD_FIND_PREVIOUS,         _findPrevious);
    CommandManager.register(Strings.CMD_FIND_ALL_AND_SELECT,    Commands.CMD_FIND_ALL_AND_SELECT,   _findAllAndSelect);
    CommandManager.register(Strings.CMD_ADD_NEXT_MATCH,         Commands.CMD_ADD_NEXT_MATCH,        _expandWordAndAddNextToSelection);
    CommandManager.register(Strings.CMD_SKIP_CURRENT_MATCH,     Commands.CMD_SKIP_CURRENT_MATCH,    _skipCurrentMatch);

    // For unit testing
    exports._getWordAt                       = _getWordAt;
    exports._expandWordAndAddNextToSelection = _expandWordAndAddNextToSelection;
    exports._findAllAndSelect                = _findAllAndSelect;
});
