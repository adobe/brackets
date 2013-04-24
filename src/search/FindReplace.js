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
/*unittests: FindReplace*/


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
        StringUtils         = require("utils/StringUtils"),
        Editor              = require("editor/Editor"),
        EditorManager       = require("editor/EditorManager"),
        ModalBar            = require("widgets/ModalBar").ModalBar;
    
    var modalBar,
        isFindFirst = false;
    
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
            if (isRE && isRE[1]) {  // non-empty regexp
                return new RegExp(isRE[1], isRE[2].indexOf("i") === -1 ? "" : "i");
            } else {
                return query;
            }
        } catch (e) {
            $(".modal-bar .message").css("display", "none");
            $(".modal-bar .error")
                .css("display", "inline-block")
                .html("<div class='alert-message' style='margin-bottom: 0'>" + e.message + "</div>");
            return "";
        }
    }

    function findNext(editor, rev) {
        var cm = editor._codeMirror;
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

            var centerOptions = (isFindFirst) ? Editor.BOUNDARY_IGNORE_TOP : Editor.BOUNDARY_CHECK_NORMAL;
            editor.setSelection(cursor.from(), cursor.to(), true, centerOptions);
            state.posFrom = cursor.from();
            state.posTo = cursor.to();
            state.findNextCalled = true;
        });
        return found;
    }

    function clearHighlights(cm, state) {
        cm.operation(function () {
            state.marked.forEach(function (markedRange) {
                markedRange.clear();
            });
        });
        state.marked.length = 0;
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
            ": <input type='text' style='width: 10em'/> <div class='message'><span id='find-counter'></span> " +
            "<span style='color: #888'>(" + Strings.SEARCH_REGEXP_INFO  + ")</span></div><div class='error'></div>";

    /**
     * If no search pending, opens the search dialog. If search is already open, moves to
     * next/prev result (depending on 'rev')
     */
    function doSearch(editor, rev, initialQuery) {
        var cm = editor._codeMirror;
        var state = getSearchState(cm);
        if (state.query) {
            findNext(editor, rev);
            return;
        }
        
        // Use the selection start as the searchStartPos. This way if you
        // start with a pre-populated search and enter an additional character,
        // it will extend the initial selection instead of jumping to the next
        // occurrence.
        var searchStartPos = cm.getCursor(true);
        
        // Called each time the search query changes while being typed. Jumps to the first matching
        // result, starting from the original cursor position
        function findFirst(query) {
            isFindFirst = true;
            cm.operation(function () {
                if (state.query) {
                    clearHighlights(cm, state);
                }
                state.query = parseQuery(query);
                if (!state.query) {
                    // Search field is empty - no results
                    $("#find-counter").text("");
                    cm.setCursor(searchStartPos);
                    if (modalBar) {
                        getDialogTextField().removeClass("no-results");
                    }
                    return;
                }
                
                // Highlight all matches
                // (Except on huge documents, where this is too expensive)
                if (cm.getValue().length < 500000) {
                    // Temporarily change selection color to improve highlighting - see LESS code for details
                    $(cm.getWrapperElement()).addClass("find-highlighting");
                    
                    // FUTURE: if last query was prefix of this one, could optimize by filtering existing result set
                    var resultCount = 0;
                    var cursor = getSearchCursor(cm, state.query);
                    while (cursor.findNext()) {
                        state.marked.push(cm.markText(cursor.from(), cursor.to(), { className: "CodeMirror-searching" }));
                        resultCount++;

                        //Remove this section when https://github.com/marijnh/CodeMirror/issues/1155 will be fixed
                        if (cursor.pos.match && cursor.pos.match[0] === "") {
                            if (cursor.to().line + 1 === cm.lineCount()) {
                                break;
                            }
                            cursor = getSearchCursor(cm, state.query, {line: cursor.to().line + 1, ch: 0});
                        }
                    }
                    $("#find-counter").text(StringUtils.format(Strings.FIND_RESULT_COUNT, resultCount));
                } else {
                    $("#find-counter").text("");
                }
                
                state.posFrom = state.posTo = searchStartPos;
                var foundAny = findNext(editor, rev);
                
                if (modalBar) {
                    getDialogTextField().toggleClass("no-results", !foundAny);
                }
            });
            isFindFirst = false;
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
        $(modalBar).on("closeOk closeCancel closeBlur", function (e, query) {
            // Clear highlights but leave search state in place so Find Next/Previous work after closing
            clearHighlights(cm, state);
            
            // As soon as focus goes back to the editor, restore normal selection color
            $(cm.getWrapperElement()).removeClass("find-highlighting");
        });
        
        var $input = getDialogTextField();
        $input.on("input", function () {
            findFirst($input.attr("value"));
        });

        // Prepopulate the search field with the current selection, if any.
        if (initialQuery !== undefined) {
            // Eliminate newlines since we don't generally support searching across line boundaries (#2960)
            var newline = initialQuery.indexOf("\n");
            if (newline !== -1) {
                initialQuery = initialQuery.substr(0, newline);
            }
            
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

    function replace(editor, all) {
        var cm = editor._codeMirror;
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
                        editor.setSelection(cursor.from(), cursor.to(), true, Editor.BOUNDARY_CHECK_NORMAL);
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

            // Create a new instance of the search bar UI
            clearSearch(codeMirror);
            doSearch(editor, false, codeMirror.getSelection());
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

    CommandManager.register(Strings.CMD_FIND,           Commands.EDIT_FIND,          _launchFind);
    CommandManager.register(Strings.CMD_FIND_NEXT,      Commands.EDIT_FIND_NEXT,     _findNext);
    CommandManager.register(Strings.CMD_REPLACE,        Commands.EDIT_REPLACE,       _replace);
    CommandManager.register(Strings.CMD_FIND_PREVIOUS,  Commands.EDIT_FIND_PREVIOUS, _findPrevious);
});
