/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var EditorManager        = brackets.getModule("editor/EditorManager"),
        ScopeManager         = brackets.getModule("JSUtils/ScopeManager"),
        Session              = brackets.getModule("JSUtils/Session"),
        MessageIds           = brackets.getModule("JSUtils/MessageIds"),
        Strings              = brackets.getModule("strings");

    var session             = null;  // object that encapsulates the current session state

    //Create new session
    function initializeSession(editor) {
        session = new Session(editor);
    }

    //Post message to tern node domain that will request tern server to find refs
    function getRefs(fileInfo, offset) {
        ScopeManager.postMessage({
            type: MessageIds.TERN_REFS,
            fileInfo: fileInfo,
            offset: offset
        });

        return ScopeManager.addPendingRequest(fileInfo.name, offset, MessageIds.TERN_REFS);
    }

    //Create info required to find reference
    function requestFindRefs(session, document, offset) {
        if (!document || !session) {
            return;
        }
        var path    = document.file.fullPath,
            fileInfo = {
                type: MessageIds.TERN_FILE_INFO_TYPE_FULL,
                name: path,
                offsetLines: 0,
                text: ScopeManager.filterText(session.getJavascriptText())
            };
        var ternPromise = getRefs(fileInfo, offset);

        return {promise: ternPromise};
    }

    //Do rename of identifier which is at cursor
    function handleRename() {
        var editor = EditorManager.getActiveEditor(),
            offset, handleFindRefs;

        if (!editor) {
            return;
        }

        if (editor.getSelections().length > 1) {
            editor.displayErrorMessageAtCursor(Strings.ERROR_RENAME_MULTICURSOR);
            return;
        }
        initializeSession(editor);


        if (!editor || editor.getModeForSelection() !== "javascript") {
            return;
        }

        var result = new $.Deferred();

        function isInSameFile(obj, refsResp) {
            return (obj && obj.file === refsResp.file);
        }

        /**
         * Check if references are in this file only
         * If yes then select all references
         */
        function handleFindRefs (refsResp) {
            if (refsResp && refsResp.references && refsResp.references.refs) {
                if (refsResp.references.type === "local") {
                    EditorManager.getActiveEditor().setSelections(refsResp.references.refs);
                } else {
                    EditorManager.getActiveEditor().setSelections(refsResp.references.refs.filter(function(element) {
                        return isInSameFile(element, refsResp);
                    }));
                }
            }
        }

        /**
         * Make a find ref request.
         * @param {Session} session - the session
         * @param {number} offset - the offset of where to jump from
         */
        function requestFindReferences(session, offset) {
            var response = requestFindRefs(session, session.editor.document, offset);

            if (response && response.hasOwnProperty("promise")) {
                response.promise.done(handleFindRefs).fail(function () {
                    result.reject();
                });
            }
        }

        offset = session.getOffset();
        requestFindReferences(session, offset);

        return result.promise();
    }

    exports.handleRename = handleRename;
});
