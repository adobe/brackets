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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache */
/*unittests: FindReplace*/


/**
 * Adds Find and Replace commands
 *
 * Originally based on the code in CodeMirror2/lib/util/search.js.
 */
define(function (require, exports, module) {
    "use strict";

    var CommandManager      = require("command/CommandManager"),
        KeyBindingManager   = require("command/KeyBindingManager"),
        AppInit             = require("utils/AppInit"),
        Commands            = require("command/Commands"),
        DocumentManager     = require("document/DocumentManager"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        Editor              = require("editor/Editor"),
        EditorManager       = require("editor/EditorManager"),
        ModalBar            = require("widgets/ModalBar").ModalBar,
        KeyEvent            = require("utils/KeyEvent"),
        ScrollTrackMarkers  = require("search/ScrollTrackMarkers"),
        PanelManager        = require("view/PanelManager"),
        Resizer             = require("utils/Resizer"),
        StatusBar           = require("widgets/StatusBar"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        ViewUtils           = require("utils/ViewUtils"),
        _                   = require("thirdparty/lodash"),
        CodeMirror          = require("thirdparty/CodeMirror2/lib/codemirror");
    
    var searchBarTemplate            = require("text!htmlContent/findreplace-bar.html"),
        searchReplacePanelTemplate   = require("text!htmlContent/search-replace-panel.html"),
        searchReplaceResultsTemplate = require("text!htmlContent/search-replace-results.html");

    /** @const Maximum file size to search within (in chars) */
    var FIND_MAX_FILE_SIZE  = 500000;

    /** @const If the number of matches exceeds this limit, inline text highlighting and scroll-track tickmarks are disabled */
    var FIND_HIGHLIGHT_MAX  = 2000;

    /** @const Maximum number of matches to collect for Replace All; any additional matches are not listed in the panel & are not replaced */
    var REPLACE_ALL_MAX     = 300;
    
    /** @type {!Panel} Panel that shows results of replaceAll action */
    var replaceAllPanel = null;

    /** @type {?Document} Instance of the currently opened document when replaceAllPanel is visible */
    var currentDocument = null;

    /** @type {$.Element} jQuery elements used in the replaceAll panel */
    var $replaceAllContainer,
        $replaceAllWhat,
        $replaceAllWith,
        $replaceAllSummary,
        $replaceAllTable;

    /** @type {?ModalBar} Currently open Find or Find/Replace bar, if any */
    var modalBar;
    
    /** @type {!function():void} API from FindInFiles for closing its conflicting search bar, if open */
    var closeFindInFilesBar;
    
    function SearchState() {
        this.searchStartPos = null;
        this.query = null;
        this.foundAny = false;
        this.marked = [];
    }

    function getSearchState(cm) {
        if (!cm._searchState) {
            cm._searchState = new SearchState();
        }
        return cm._searchState;
    }

    function getSearchCursor(cm, query, pos) {
        // Heuristic: if the query string is all lowercase, do a case insensitive search.
        return cm.getSearchCursor(query, pos, !PreferencesManager.getViewState("caseSensitive"));
    }
    
    function _updateSearchBarFromPrefs() {
        $("#find-case-sensitive").toggleClass("active", PreferencesManager.getViewState("caseSensitive"));
        $("#find-regexp").toggleClass("active",         PreferencesManager.getViewState("regexp"));
    }
    function _updatePrefsFromSearchBar() {
        PreferencesManager.setViewState("caseSensitive", $("#find-case-sensitive").is(".active"));
        PreferencesManager.setViewState("regexp",        $("#find-regexp").is(".active"));
    }
    
    function parseQuery(query) {
        $(".modal-bar .message").show();
        $(".modal-bar .error").hide();
        
        // Is it a (non-blank) regex?
        if (query && $("#find-regexp").is(".active")) {
            try {
                var caseSensitive = $("#find-case-sensitive").is(".active");
                return new RegExp(query, caseSensitive ? "" : "i");
            } catch (e) {
                $(".modal-bar .message").hide();
                $(".modal-bar .error")
                    .show()
                    .text(e.message);
                return "";
            }
        
        } else {
            return query;
        }
    }

    // NOTE: we can't just use the ordinary replace() function here because the string has been
    // extracted from the original text and so might be missing some context that the regexp matched.
    function parseDollars(replaceWith, match) {
        replaceWith = replaceWith.replace(/(\$+)(\d{1,2}|&)/g, function (whole, dollars, index) {
            var parsedIndex = parseInt(index, 10);
            if (dollars.length % 2 === 1) { // check if dollar signs escape themselves (for example $$1, $$$$&)
                if (index === "&") { // handle $&
                    return dollars.substr(1) + (match[0] || "");
                } else if (parsedIndex !== 0) { // handle $n or $nn, don't handle $0 or $00
                    return dollars.substr(1) + (match[parsedIndex] || "");
                }
            }
            return whole;
        });
        replaceWith = replaceWith.replace(/\$\$/g, "$"); // replace escaped dollar signs (for example $$) with single ones
        return replaceWith;
    }

    /**
     * @private
     * Returns the next match for the current query (from the search state) before/after the given position. Wraps around
     * the end of the document if no match is found before the end.
     *
     * @param {!Editor} editor The editor to search in
     * @param {boolean} rev True to search backwards
     * @param {{line: number, ch: number}=} pos The position to start from. Defaults to the current primary selection's
     *      head cursor position.
     * @param {boolean=} wrap Whether to wrap the search around if we hit the end of the document. Default true.
     * @return {?{start: {line: number, ch: number}, end: {line: number, ch: number}}} The range for the next match, or
     *      null if there is no match.
     */
    function _getNextMatch(editor, rev, pos, wrap) {
        var cm = editor._codeMirror;
        var state = getSearchState(cm);
        var cursor = getSearchCursor(cm, state.query, pos || editor.getCursorPos(false, rev ? "start" : "end"));

        state.lastMatch = cursor.find(rev);
        if (!state.lastMatch && wrap !== false) {
            // If no result found before hitting edge of file, try wrapping around
            cursor = getSearchCursor(cm, state.query, rev ? {line: cm.lineCount() - 1} : {line: 0, ch: 0});
            state.lastMatch = cursor.find(rev);
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
            state.query = searchText;
            
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
            state.query = editor.document.getRange(sel.start, sel.end);
            
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

    /**
     * Selects the next match (or prev match, if rev==true) starting from either the current position
     * (if pos unspecified) or the given position (if pos specified explicitly). The starting position
     * need not be an existing match. If a new match is found, sets to state.lastMatch either the regex
     * match result, or simply true for a plain-string match. If no match found, sets state.lastMatch
     * to false.
     * @param {!Editor} editor
     * @param {?boolean} rev
     * @param {?boolean} preferNoScroll
     * @param {?Pos} pos
     */
    function findNext(editor, rev, preferNoScroll, pos) {
        var cm = editor._codeMirror;
        cm.operation(function () {
            var nextMatch = _getNextMatch(editor, rev, pos);
            if (nextMatch) {
                _selectAndScrollTo(editor, [nextMatch], true, preferNoScroll);
            } else {
                cm.setCursor(editor.getCursorPos());  // collapses selection, keeping cursor in place to avoid scrolling
            }
        });
    }

    function clearHighlights(cm, state) {
        cm.operation(function () {
            state.marked.forEach(function (markedRange) {
                markedRange.clear();
            });
        });
        state.marked.length = 0;
        
        ScrollTrackMarkers.clear();
    }

    function clearSearch(cm) {
        cm.operation(function () {
            var state = getSearchState(cm);
            if (!state.query) {
                return;
            }
            state.query = null;

            clearHighlights(cm, state);
        });
    }
    
    function _closeFindBar() {
        if (modalBar) {
            // 1st arg = restore scroll pos; 2nd arg = no animation, since getting replaced immediately
            modalBar.close(true, false);
        }
    }
    function _registerFindInFilesCloser(closer) {
        closeFindInFilesBar = closer;
    }
    
    function createModalBar(template) {
        // Normally, creating a new modal bar will simply cause the old one to close
        // automatically. This can cause timing issues because the focus change might
        // cause the new one to think it should close, too. The old CodeMirror version
        // of this handled it by adding a timeout within which a blur wouldn't cause
        // the modal bar to close. Rather than reinstate that hack, we simply explicitly
        // close the old modal bar (which may be a Find, Replace, *or* Find in Files bar
        // before creating a new one. (TODO: remove once #6203 fixed)
        _closeFindBar();
        closeFindInFilesBar();
        
        modalBar = new ModalBar(template, true);  // 2nd arg = auto-close on Esc/blur
        
        $(modalBar).on("close", function (event) {
            modalBar = null;
        });
    }
    
    function addShortcutToTooltip($elem, commandId) {
        var replaceShortcut = KeyBindingManager.getKeyBindings(commandId)[0];
        if (replaceShortcut) {
            var oldTitle = $elem.attr("title");
            oldTitle = (oldTitle ? oldTitle + " " : "");
            $elem.attr("title", oldTitle + "(" + KeyBindingManager.formatKeyDescriptor(replaceShortcut.displayKey) + ")");
        }
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
            ViewUtils.toggleClass($("#find-what"), "no-results", !state.foundAny && $("#find-what").val());
            
            // Buttons disabled if blank, OR if no matches (Replace buttons) / < 2 matches (nav buttons)
            $("#find-prev, #find-next").prop("disabled", !state.foundAny || numResults < 2);
            $("#replace-yes, #replace-all").prop("disabled", !state.foundAny);
        }
        
        cm.operation(function () {
            // Clear old highlights
            if (state.marked) {
                clearHighlights(cm, state);
            }
            
            if (!state.query) {
                // Search field is empty - no results
                $("#find-counter").text("");
                state.foundAny = false;
                indicateHasMatches();
                return;
            }
            
            // Find *all* matches, searching from start of document
            // (Except on huge documents, where this is too expensive)
            var cursor = getSearchCursor(cm, state.query);
            if (cm.getValue().length <= FIND_MAX_FILE_SIZE) {
                // FUTURE: if last query was prefix of this one, could optimize by filtering last result set
                var resultSet = [];
                while (cursor.findNext()) {
                    resultSet.push(cursor.pos);  // pos is unique obj per search result
                }
                
                // Highlight all matches if there aren't too many
                if (resultSet.length <= FIND_HIGHLIGHT_MAX) {
                    toggleHighlighting(editor, true);
                    
                    resultSet.forEach(function (result) {
                        state.marked.push(cm.markText(result.from, result.to,
                             { className: "CodeMirror-searching", startStyle: "searching-first", endStyle: "searching-last" }));
                    });
                    var scrollTrackPositions = resultSet.map(function (result) {
                        return result.from;
                    });
                    
                    ScrollTrackMarkers.addTickmarks(editor, scrollTrackPositions);
                }
                
                if (resultSet.length === 0) {
                    $("#find-counter").text(Strings.FIND_NO_RESULTS);
                } else if (resultSet.length === 1) {
                    $("#find-counter").text(Strings.FIND_RESULT_COUNT_SINGLE);
                } else {
                    $("#find-counter").text(StringUtils.format(Strings.FIND_RESULT_COUNT, resultSet.length));
                }
                state.foundAny = (resultSet.length > 0);
                indicateHasMatches(resultSet.length);
                
            } else {
                // On huge documents, just look for first match & then stop
                $("#find-counter").text("");
                state.foundAny = cursor.findNext();
                indicateHasMatches();
            }
        });
    }
    
    /**
     * Called each time the search query field changes. Updates state.query (query will be falsy if the field
     * was blank OR contained a regexp with invalid syntax). Then calls updateResultSet(), and then jumps to
     * the first matching result, starting from the original cursor position.
     * @param {!Editor} editor The editor we're searching in.
     * @param {Object} state The current query state.
     * @param {boolean} initial Whether this is the initial population of the query when the search bar opens.
     *     In that case, we don't want to change the selection unnecessarily.
     */
    function handleQueryChange(editor, state, initial) {
        state.query = parseQuery($("#find-what").val());
        updateResultSet(editor);
        
        if (state.query) {
            // 3rd arg: prefer to avoid scrolling if result is anywhere within view, since in this case user
            // is in the middle of typing, not navigating explicitly; viewport jumping would be distracting.
            findNext(editor, false, true, state.searchStartPos);
        } else if (!initial) {
            // Blank or invalid query: just jump back to initial pos
            editor._codeMirror.setCursor(state.searchStartPos);
        }
    }
    
    
    /**
     * Opens the search bar with the given HTML content (Find or Find-Replace), attaches common Find behaviors,
     * and prepopulates the query field.
     * @param {!Editor} editor
     * @param {!Object} templateVars
     */
    function openSearchBar(editor, templateVars) {
        var cm = editor._codeMirror,
            state = getSearchState(cm);
        
        // Use the selection start as the searchStartPos. This way if you
        // start with a pre-populated search and enter an additional character,
        // it will extend the initial selection instead of jumping to the next
        // occurrence.
        state.searchStartPos = editor.getCursorPos(false, "start");
        
        // If a previous search/replace bar was open, capture its query text for use below
        var initialQuery;
        if (modalBar) {
            initialQuery = $("#find-what").val();
        }
        
        // Create the search bar UI (closing any previous modalBar in the process)
        var htmlContent = Mustache.render(searchBarTemplate, $.extend(templateVars, Strings));
        createModalBar(htmlContent);
        addShortcutToTooltip($("#find-next"), Commands.EDIT_FIND_NEXT);
        addShortcutToTooltip($("#find-prev"), Commands.EDIT_FIND_PREVIOUS);
        
        $(modalBar).on("close", function (e, query) {
            // Clear highlights but leave search state in place so Find Next/Previous work after closing
            clearHighlights(cm, state);
            
            // Dispose highlighting UI (important to restore normal selection color as soon as focus goes back to the editor)
            toggleHighlighting(editor, false);
            
            // Hide error popup, since it hangs down low enough to make the slide-out look awkward
            $(".modal-bar .error").hide();
        });
        
        modalBar.getRoot()
            .on("click", "#find-next", function (e) {
                findNext(editor);
            })
            .on("click", "#find-prev", function (e) {
                findNext(editor, true);
            })
            .on("click", "#find-case-sensitive, #find-regexp", function (e) {
                $(e.currentTarget).toggleClass('active');
                _updatePrefsFromSearchBar();
                
                handleQueryChange(editor, state);
            })
            .on("keydown", function (e) {
                if (e.keyCode === KeyEvent.DOM_VK_RETURN) {
                    if (!e.shiftKey) {
                        findNext(editor);
                    } else {
                        findNext(editor, true);
                    }
                }
            });
        
        $("#find-what").on("input", function () {
            handleQueryChange(editor, state);
        });

        // Prepopulate the search field
        if (!initialQuery) {
            // Prepopulate with the current primary selection, if any
            var sel = editor.getSelection();
            initialQuery = cm.getRange(sel.start, sel.end);
            
            // Eliminate newlines since we don't generally support searching across line boundaries (#2960)
            var newline = initialQuery.indexOf("\n");
            if (newline !== -1) {
                initialQuery = initialQuery.substr(0, newline);
            }
        }
        
        // Initial UI state
        $("#find-what")
            .val(initialQuery)
            .get(0).select();
        _updateSearchBarFromPrefs();
        
        handleQueryChange(editor, state, true);
    }
    
    /**
     * If no search pending, opens the Find dialog. If search bar already open, moves to
     * next/prev result (depending on 'rev')
     */
    function doSearch(editor, rev) {
        var state = getSearchState(editor._codeMirror);
        if (state.query) {
            findNext(editor, rev);
            return;
        }
        
        openSearchBar(editor, {});
    }

    /**
     * @private
     * Closes a panel with search-replace results.
     * Main purpose is to make sure that events are correctly detached from current document.
     */
    function _closeReplaceAllPanel() {
        if (replaceAllPanel !== null && replaceAllPanel.isVisible()) {
            replaceAllPanel.hide();
        }
        $(currentDocument).off("change.replaceAll");
    }
    
    /**
     * @private
     * When the user switches documents (or closes the last document), ensure that the find bar
     * closes, and also close the Replace All panel.
     */
    function _handleDocumentChange() {
        if (modalBar) {
            modalBar.close();
        }
        _closeReplaceAllPanel();
    }

    /**
     * @private
     * Shows a panel with search results and offers to replace them,
     * user can use checkboxes to select which results he wishes to replace.
     * @param {Editor} editor - Currently active editor that was used to invoke this action.
     * @param {string|RegExp} replaceWhat - Query that will be passed into CodeMirror Cursor to search for results.
     * @param {string} replaceWith - String that should be used to replace chosen results.
     */
    function _showReplaceAllPanel(editor, replaceWhat, replaceWith) {
        var results = [],
            cm      = editor._codeMirror,
            cursor  = getSearchCursor(cm, replaceWhat),
            from,
            to,
            line,
            multiLine,
            matchResult = cursor.findNext();

        // Collect all results from document
        while (matchResult) {
            from      = cursor.from();
            to        = cursor.to();
            line      = editor.document.getLine(from.line);
            multiLine = from.line !== to.line;

            results.push({
                index:     results.length, // add indexes to array
                from:      from,
                to:        to,
                line:      from.line + 1,
                pre:       line.slice(0, from.ch),
                highlight: line.slice(from.ch, multiLine ? undefined : to.ch),
                post:      multiLine ? "\u2026" : line.slice(to.ch),
                result:    matchResult
            });

            if (results.length >= REPLACE_ALL_MAX) {
                break;
            }
            
            matchResult = cursor.findNext();
        }

        // This text contains some formatting, so all the strings are assumed to be already escaped
        var resultsLength = results.length,
            summary = StringUtils.format(
                Strings.FIND_REPLACE_TITLE_PART3,
                resultsLength,
                resultsLength > 1 ? Strings.FIND_IN_FILES_MATCHES : Strings.FIND_IN_FILES_MATCH,
                resultsLength >= REPLACE_ALL_MAX ? Strings.FIND_IN_FILES_MORE_THAN : ""
            );

        // Insert the search summary
        $replaceAllWhat.text(replaceWhat.toString());
        $replaceAllWith.text(replaceWith.toString());
        $replaceAllSummary.html(summary);

        // All checkboxes are checked by default
        $replaceAllContainer.find(".check-all").prop("checked", true);

        // Attach event to replace button
        $replaceAllContainer.find("button.replace-checked").off().on("click", function (e) {
            $replaceAllTable.find(".check-one:checked")
                .closest(".replace-row")
                .toArray()
                .reverse()
                .forEach(function (checkedRow) {
                    var match = results[$(checkedRow).data("match")],
                        rw    = typeof replaceWhat === "string" ? replaceWith : parseDollars(replaceWith, match.result);
                    editor.document.replaceRange(rw, match.from, match.to, "+replaceAll");
                });
            _closeReplaceAllPanel();
        });

        // Insert the search results
        $replaceAllTable
            .empty()
            .append(Mustache.render(searchReplaceResultsTemplate, {searchResults: results}))
            .off()
            .on("click", ".check-one", function (e) {
                e.stopPropagation();
            })
            .on("click", ".replace-row", function (e) {
                var match = results[$(e.currentTarget).data("match")];
                editor.setSelection(match.from, match.to, true);
            });

        // we can't safely replace after document has been modified
        // this handler is only attached, when replaceAllPanel is visible
        currentDocument = DocumentManager.getCurrentDocument();
        $(currentDocument).on("change.replaceAll", function () {
            _closeReplaceAllPanel();
        });

        replaceAllPanel.show();
        $replaceAllTable.scrollTop(0); // Otherwise scroll pos from previous contents is remembered
    }

    /** Shows the Find-Replace search bar at top */
    function replace(editor) {
        // If Replace bar already open, treat the shortcut as a hotkey for the Replace button
        var $replaceBtn = $("#replace-yes");
        if ($replaceBtn.length) {
            if ($replaceBtn.is(":enabled")) {
                $replaceBtn.click();
            }
            return;
        }
        
        openSearchBar(editor, {replace: true});
        addShortcutToTooltip($("#replace-yes"), Commands.EDIT_REPLACE);
        
        var cm = editor._codeMirror,
            state = getSearchState(cm);
        
        function getReplaceWith() {
            return $("#replace-with").val() || "";
        }
        
        modalBar.getRoot().on("click", function (e) {
            if (e.target.id === "replace-yes") {
                var text = getReplaceWith();
                cm.replaceSelection(typeof state.query === "string" ? text : parseDollars(text, state.lastMatch));
                
                updateResultSet(editor);  // we updated the text, so result count & tickmarks must be refreshed
                
                findNext(editor);
                if (!state.lastMatch) {
                    // No more matches, so destroy modalBar
                    modalBar.close();
                }
                
            } else if (e.target.id === "replace-all") {
                modalBar.close();
                _showReplaceAllPanel(editor, state.query, getReplaceWith());
            }
        });
        
        // One-off hack to make Find/Replace fields a self-contained tab cycle - TODO: remove once https://trello.com/c/lTSJgOS2 implemented
        modalBar.getRoot().on("keydown", function (e) {
            if (e.keyCode === KeyEvent.DOM_VK_TAB && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (e.target.id === "replace-with" && !e.shiftKey) {
                    $("#find-what").focus();
                    e.preventDefault();
                } else if (e.target.id === "find-what" && e.shiftKey) {
                    $("#replace-with").focus();
                    e.preventDefault();
                }
            }
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

    PreferencesManager.stateManager.definePreference("caseSensitive", "boolean", false);
    PreferencesManager.stateManager.definePreference("regexp", "boolean", false);
    PreferencesManager.convertPreferences(module, {"caseSensitive": "user", "regexp": "user"}, true);
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        var panelHtml        = Mustache.render(searchReplacePanelTemplate, Strings);
        replaceAllPanel      = PanelManager.createBottomPanel("findReplace-all.panel", $(panelHtml), 100);
        $replaceAllContainer = replaceAllPanel.$panel;
        $replaceAllWhat      = $replaceAllContainer.find(".replace-what");
        $replaceAllWith      = $replaceAllContainer.find(".replace-with");
        $replaceAllSummary   = $replaceAllContainer.find(".replace-summary");
        $replaceAllTable     = $replaceAllContainer.children(".table-container");

        // Attach events to the panel
        replaceAllPanel.$panel
            .on("click", ".close", function () {
                _closeReplaceAllPanel();
            })
            .on("click", ".check-all", function (e) {
                var isChecked = $(this).is(":checked");
                replaceAllPanel.$panel.find(".check-one").prop("checked", isChecked);
            });
    });

    $(DocumentManager).on("currentDocumentChange", _handleDocumentChange);

    CommandManager.register(Strings.CMD_FIND,                   Commands.EDIT_FIND,                    _launchFind);
    CommandManager.register(Strings.CMD_FIND_NEXT,              Commands.EDIT_FIND_NEXT,               _findNext);
    CommandManager.register(Strings.CMD_REPLACE,                Commands.EDIT_REPLACE,                 _replace);
    CommandManager.register(Strings.CMD_FIND_PREVIOUS,          Commands.EDIT_FIND_PREVIOUS,           _findPrevious);
    CommandManager.register(Strings.CMD_FIND_ALL_AND_SELECT,    Commands.EDIT_FIND_ALL_AND_SELECT,     _findAllAndSelect);
    CommandManager.register(Strings.CMD_ADD_NEXT_MATCH,         Commands.EDIT_ADD_NEXT_MATCH,          _expandWordAndAddNextToSelection);
    CommandManager.register(Strings.CMD_SKIP_CURRENT_MATCH,     Commands.EDIT_SKIP_CURRENT_MATCH,      _skipCurrentMatch);
    
    // APIs shared with FindInFiles
    exports._updatePrefsFromSearchBar        = _updatePrefsFromSearchBar;
    exports._updateSearchBarFromPrefs        = _updateSearchBarFromPrefs;
    exports._closeFindBar                    = _closeFindBar;
    exports._registerFindInFilesCloser       = _registerFindInFilesCloser;
    
    // For unit testing
    exports._getWordAt                       = _getWordAt;
    exports._expandWordAndAddNextToSelection = _expandWordAndAddNextToSelection;
    exports._findAllAndSelect                = _findAllAndSelect;
});
