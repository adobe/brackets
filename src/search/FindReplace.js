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
 * Define search commands. Depends on dialog.js or another
 * implementation of the openDialog method.
 *
 * This code was copied from CodeMirror2/lib/util/search.js so that the UI strings 
 * could be localized.
 *
 * Replace works a little oddly -- it will do the replace on the next findNext press.
 * You prevent a replace by making sure the match is no longer selected when hitting
 * findNext.
 *
 */


define(function (require, exports, module) {
//    "use strict";

    var CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        Strings             = require("strings"),
        EditorManager       = require("editor/EditorManager");

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

    function dialog(cm, text, shortText, f) {
        if (cm.openDialog) {
            cm.openDialog(text, f);
        } else {
            f(prompt(shortText, ""));
        }
    }

    function confirmDialog(cm, text, shortText, fs) {
        if (cm.openConfirm) {
            cm.openConfirm(text, fs);
        } else if (confirm(shortText)) {
            fs[0]();
        }
    }

    function parseQuery(query) {
        var isRE = query.match(/^\/(.*)\/([a-z]*)$/);
        return isRE ? new RegExp(isRE[1], isRE[2].indexOf("i") === -1 ? "" : "i") : query;
    }

    function findNext(cm, rev) {
        cm.operation(function () {
            var state = getSearchState(cm);
            var cursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);
            if (!cursor.find(rev)) {
                cursor = getSearchCursor(cm, state.query, rev ? {line: cm.lineCount() - 1} : {line: 0, ch: 0});
                if (!cursor.find(rev)) {
                    return;
                }
            }
            cm.setSelection(cursor.from(), cursor.to());
            state.posFrom = cursor.from();
            state.posTo = cursor.to();
        });
    }

    var queryDialog =
        'Search: <input type="text" style="width: 10em"/> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';

    function doSearch(cm, rev) {
        var state = getSearchState(cm);
        if (state.query) {
            return findNext(cm, rev);
        }
        dialog(cm, queryDialog, "Search for:", function (query) {
            cm.operation(function () {
                var cursor;
                if (!query || state.query) {
                    return;
                }
                state.query = parseQuery(query);
                if (cm.lineCount() < 2000) { // This is too expensive on big documents.
                    for (cursor = getSearchCursor(cm, query); cursor.findNext();) {
                        state.marked.push(cm.markText(cursor.from(), cursor.to(), "CodeMirror-searching"));
                    }
                }
                state.posFrom = state.posTo = cm.getCursor();
                findNext(cm, rev);
            });
        });
    }

    function clearSearch(cm) {
        cm.operation(function () {
            var state = getSearchState(cm),
                i;
            if (!state.query) {
                return;
            }
            state.query = null;
            for (i = 0; i < state.marked.length; ++i) {
                state.marked[i].clear();
            }
            state.marked.length = 0;
        });
    }

    var replaceQueryDialog =
        'Replace: <input type="text" style="width: 10em"/> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';
    var replacementQueryDialog = 'With: <input type="text" style="width: 10em"/>';
    var doReplaceConfirm = "Replace? <button>Yes</button> <button>No</button> <button>Stop</button>";

    function replace(cm, all) {
        dialog(cm, replaceQueryDialog, "Replace:", function (query) {
            if (!query) {
                return;
            }
            query = parseQuery(query);
            dialog(cm, replacementQueryDialog, "Replace with:", function (text) {
                if (all) {
                    cm.compoundChange(function () {
                        cm.operation(function () {
                            var cursor;
                            for (cursor = getSearchCursor(cm, query); cursor.findNext();) {
                                if (typeof query !== "string") {
                                    var match = cm.getRange(cursor.from(), cursor.to()).match(query);
                                    cursor.replace(text.replace(/\$(\d)/, function (w, i) { return match[i]; }));
                                } else {
                                    cursor.replace(text);
                                }
                            }
                        });
                    });
                } else {
                    clearSearch(cm);
                    var cursor = getSearchCursor(cm, query, cm.getCursor());
                    function doReplace(match) {
                        cursor.replace(typeof query === "string" ? text :
                                            text.replace(/\$(\d)/, function (w, i) { return match[i]; }));
                        advance();
                    }
                    function advance() {
                        var start = cursor.from(), match;
                        if (!(match = cursor.findNext())) {
                            cursor = getSearchCursor(cm, query);
                            if (!(match = cursor.findNext()) ||
                                    (start && cursor.from().line === start.line && cursor.from().ch === start.ch)) {
                                return;
                            }
                        }
                        cm.setSelection(cursor.from(), cursor.to());
                        confirmDialog(cm, doReplaceConfirm, "Replace?",
                                                    [function () { doReplace(match); }, advance]);
                    }
                    advance();
                }
            });
        });
    }

    function _launchFind() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            var codeMirror = editor._codeMirror;

            // Bring up CodeMirror's existing search bar UI
            clearSearch(codeMirror);
            doSearch(codeMirror);

            // Prepopulate the search field with the current selection, if any
            $(".CodeMirror-dialog input[type='text']")
                .attr("value", codeMirror.getSelection())
                .get(0).select();
        }
    }

    function _findNext() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            doSearch(editor._codeMirror);
        }
    }

    function _findPrevious() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            doSearch(editor._codeMirror, true);
        }
    }

    function _replace() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            replace(editor._codeMirror);
        }
    }

    CommandManager.register(Strings.CMD_FIND,           Commands.EDIT_FIND,          _launchFind);
    CommandManager.register(Strings.CMD_FIND_NEXT,      Commands.EDIT_FIND_NEXT,     _findNext);
    CommandManager.register(Strings.CMD_REPLACE,        Commands.EDIT_REPLACE,       _replace);
    CommandManager.register(Strings.CMD_FIND_PREVIOUS,  Commands.EDIT_FIND_PREVIOUS, _findPrevious);
});
