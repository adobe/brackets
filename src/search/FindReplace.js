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
/*global define, $, doReplace */


/*
 * Adds Find and Replace commands
 *
 * Originally based on the code in CodeMirror2/lib/util/search.js.
 */
define(function (require, exports, module) {
    "use strict";

    var CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        Strings             = require("strings"),
        EditorManager       = require("editor/EditorManager"),
        ModalBar            = require("widgets/ModalBar").ModalBar;
    
    var modalBar;
    
    function SearchState() {
        this.posFrom = this.posTo = this.query = null;
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
        return cm.getSearchCursor(query, pos, typeof query === "string" && query === query.toLowerCase());
    }
    
    function getDialogTextField() {
        return $("input[type='text']", modalBar.getRoot());
    }

    function parseQuery(query) {
        var isRE = query.match(/^\/(.*)\/([a-z]*)$/);
        $(".modal-bar .message").css("display", "inline-block");
        $(".modal-bar .error").css("display", "none");
        try {
            return isRE ? new RegExp(isRE[1], isRE[2].indexOf("i") === -1 ? "" : "i") : query;
        } catch (e) {
            $(".modal-bar .message").css("display", "none");
            $(".modal-bar .error")
                .css("display", "inline-block")
                .html("<div class='alert-message' style='margin-bottom: 0'>" + e.message + "</div>");
            return "";
        }
    }

    function findNext(cm, rev) {
        var found = true;
        cm.operation(function () {
            var state = getSearchState(cm);
            var cursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);
            if (!cursor.find(rev)) {
                // If no result found before hitting edge of file, try wrapping around
                cursor = getSearchCursor(cm, state.query, rev ? {line: cm.lineCount() - 1} : {line: 0, ch: 0});
                
                // No result found, period: clear selection & bail
                if (!cursor.find(rev)) {
                    cm.setCursor(cm.getCursor());  // collapses selection, keeping cursor in place to avoid scrolling
                    found = false;
                    return;
                }
            }
            cm.setSelection(cursor.from(), cursor.to());
            state.posFrom = cursor.from();
            state.posTo = cursor.to();
            state.findNextCalled = true;
        });
        return found;
    }

    function clearSearch(cm) {
        cm.operation(function () {
            var state = getSearchState(cm),
                i;
            if (!state.query) {
                return;
            }
            state.query = null;
            
            // Clear highlights
            for (i = 0; i < state.marked.length; ++i) {
                state.marked[i].clear();
            }
            state.marked.length = 0;
        });
    }
    
    function createModalBar(template, autoClose) {
        // Normally, creating a new modal bar will simply cause the old one to close
        // automatically. This can cause timing issues because the focus change might
        // cause the new one to think it should close, too. The old CodeMirror version
        // of this handled it by adding a timeout within which a blur wouldn't cause
        // the modal bar to close. Rather than reinstate that hack, we simply explicitly
        // close the old modal bar before creating a new one.
        if (modalBar) {
            modalBar.close();
        }
        modalBar = new ModalBar(template, autoClose);
        $(modalBar).on("closeOk closeBlur closeCancel", function () {
            modalBar = null;
        });
    }
    
    var queryDialog = Strings.CMD_FIND +
            ': <input type="text" style="width: 10em"/> <div class="message"><span style="color: #888">(' +
            Strings.SEARCH_REGEXP_INFO  + ')</span></div><div class="error"></div>';

    /**
     * If no search pending, opens the search dialog. If search is already open, moves to
     * next/prev result (depending on 'rev')
     */
    function doSearch(cm, rev, initialQuery) {
        var state = getSearchState(cm);
        if (state.query) {
            return findNext(cm, rev);
        }
        
        // Use the selection start as the searchStartPos. This way if you
        // start with a pre-populated search and enter an additional character,
        // it will extend the initial selection instead of jumping to the next
        // occurrence.
        var searchStartPos = cm.getCursor(true);
        
        // Called each time the search query changes while being typed. Jumps to the first matching
        // result, starting from the original cursor position
        function findFirst(query) {
            cm.operation(function () {
                if (!query) {
                    return;
                }
                
                if (state.query) {
                    clearSearch(cm);  // clear highlights from previous query
                }
                state.query = parseQuery(query);
                
                // Highlight all matches
                // FUTURE: if last query was prefix of this one, could optimize by filtering existing result set
                if (cm.lineCount() < 2000) { // This is too expensive on big documents.
                    var cursor = getSearchCursor(cm, query);
                    while (cursor.findNext()) {
                        state.marked.push(cm.markText(cursor.from(), cursor.to(), "CodeMirror-searching"));
                    }
                }
                
                state.posFrom = state.posTo = searchStartPos;
                var foundAny = findNext(cm, rev);
                
                if (modalBar) {
                    getDialogTextField().toggleClass("no-results", !foundAny);
                }
            });
        }
        
        if (modalBar) {
            // The modalBar was already up. When creating the new modalBar, copy the
            // current query instead of using the passed-in selected text.
            initialQuery = getDialogTextField().attr("value");
        }
        
        createModalBar(queryDialog, true);
        $(modalBar).on("closeOk", function (e, query) {
            if (!state.findNextCalled) {
                // If findNextCalled is false, this means the user has *not*
                // entered any search text *or* pressed Cmd-G/F3 to find the
                // next occurrence. In this case we want to start searching
                // *after* the current selection so we find the next occurrence.
                searchStartPos = cm.getCursor(false);
                findFirst(query);
            }
        });
    
        var $input = getDialogTextField();
        $input.on("input", function () {
            findFirst($input.attr("value"));
        });

        // Prepopulate the search field with the current selection, if any.
        if (initialQuery !== undefined) {
            $input
                .attr("value", initialQuery)
                .get(0).select();
            findFirst(initialQuery);
            // Clear the "findNextCalled" flag here so we have a clean start
            state.findNextCalled = false;
        }
    }

    var replaceQueryDialog = Strings.CMD_REPLACE +
            ': <input type="text" style="width: 10em"/> <div class="message"><span style="color: #888">(' +
            Strings.SEARCH_REGEXP_INFO  + ')</span></div><div class="error"></div>';
    var replacementQueryDialog = Strings.WITH +
            ': <input type="text" style="width: 10em"/>';
    // style buttons to match height/margins/border-radius of text input boxes
    var style = ' style="padding:5px 15px;border:1px #999 solid;border-radius:3px;margin:2px 2px 5px;"';
    var doReplaceConfirm = Strings.CMD_REPLACE +
            '? <button id="replace-yes"' + style + '>' + Strings.BUTTON_YES +
            '</button> <button id="replace-no"' + style + '>' + Strings.BUTTON_NO +
            '</button> <button' + style + '>' + Strings.BUTTON_STOP + '</button>';

    function replace(cm, all) {
        createModalBar(replaceQueryDialog, true);
        $(modalBar).on("closeOk", function (e, query) {
            if (!query) {
                return;
            }
            
            query = parseQuery(query);
            createModalBar(replacementQueryDialog, true);
            $(modalBar).on("closeOk", function (e, text) {
                text = text || "";
                var match,
                    fnMatch = function (w, i) { return match[i]; };
                if (all) {
                    cm.compoundChange(function () {
                        cm.operation(function () {
                            var cursor = getSearchCursor(cm, query);
                            while (cursor.findNext()) {
                                if (typeof query !== "string") {
                                    match = cm.getRange(cursor.from(), cursor.to()).match(query);
                                    cursor.replace(text.replace(/\$(\d)/, fnMatch));
                                } else {
                                    cursor.replace(text);
                                }
                            }
                        });
                    });
                } else {
                    clearSearch(cm);
                    var cursor = getSearchCursor(cm, query, cm.getCursor(true));
                    var advance = function () {
                        var start = cursor.from(),
                            match = cursor.findNext();
                        if (!match) {
                            cursor = getSearchCursor(cm, query);
                            match = cursor.findNext();
                            if (!match ||
                                    (start && cursor.from().line === start.line && cursor.from().ch === start.ch)) {
                                return;
                            }
                        }
                        cm.setSelection(cursor.from(), cursor.to());
                        createModalBar(doReplaceConfirm, true);
                        modalBar.getRoot().on("click", function (e) {
                            modalBar.close();
                            if (e.target.id === "replace-yes") {
                                doReplace(match);
                            } else if (e.target.id === "replace-no") {
                                advance();
                            }
                        });
                    };
                    var doReplace = function (match) {
                        cursor.replace(typeof query === "string" ? text :
                                            text.replace(/\$(\d)/, fnMatch));
                        advance();
                    };
                    advance();
                }
            });
        });
        
        // Prepopulate the replace field with the current selection, if any
        getDialogTextField()
            .attr("value", cm.getSelection())
            .get(0).select();
    }

    function _launchFind() {
        var editor = EditorManager.getActiveEditor();
        if (editor) {
            var codeMirror = editor._codeMirror;

            // Bring up CodeMirror's existing search bar UI
            clearSearch(codeMirror);
            doSearch(codeMirror, false, codeMirror.getSelection());
        }
    }

    function _findNext() {
        var editor = EditorManager.getActiveEditor();
        if (editor) {
            doSearch(editor._codeMirror);
        }
    }

    function _findPrevious() {
        var editor = EditorManager.getActiveEditor();
        if (editor) {
            doSearch(editor._codeMirror, true);
        }
    }

    function _replace() {
        var editor = EditorManager.getActiveEditor();
        if (editor) {
            replace(editor._codeMirror);
        }
    }

    CommandManager.register(Strings.CMD_FIND,           Commands.EDIT_FIND,          _launchFind);
    CommandManager.register(Strings.CMD_FIND_NEXT,      Commands.EDIT_FIND_NEXT,     _findNext);
    CommandManager.register(Strings.CMD_REPLACE,        Commands.EDIT_REPLACE,       _replace);
    CommandManager.register(Strings.CMD_FIND_PREVIOUS,  Commands.EDIT_FIND_PREVIOUS, _findPrevious);
});
