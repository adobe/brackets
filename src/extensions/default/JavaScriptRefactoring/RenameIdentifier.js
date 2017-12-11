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
        MessageIds           = brackets.getModule("JSUtils/MessageIds");
    
    
    var session             = null;  // object that encapsulates the current session state

    function initializeSession(editor) {
        session = new Session(editor);
    }

    function getRefs(fileInfo, offset) {
        ScopeManager.postMessage({
            type: "getRefs",
            fileInfo: fileInfo,
            offset: offset
        });

        return ScopeManager.addPendingRequest(fileInfo.name, offset, MessageIds.TERN_REFS);
    }

    
    function requestFindRefs(session, document, offset) {
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
    
    function doRename(response) {

        var file = response.file,
            offset = response.offset;

        var $deferredFindRefs = ScopeManager.getPendingRequest(file, offset, MessageIds.TERN_REFS);

        if ($deferredFindRefs) {
            $deferredFindRefs.resolveWith(null, [response]);
        }
    }
        
    function handleRename() {
        var editor = EditorManager.getActiveEditor(),
            offset, handleFindRefs;

        if (editor.getSelections().length > 1) {
            editor.displayErrorMessageAtCursor("Rename doesn't work in case of multicursor");
        }
        initializeSession(editor);


        if (!editor || editor.getModeForSelection() !== "javascript") {
            return;
        }

        var result = new $.Deferred();

        /**
         * Make a find ref request.
         * @param {Session} session - the session
         * @param {number} offset - the offset of where to jump from
         */
        function requestFindReferences(session, offset) {
            var response = requestFindRefs(session, session.editor.document, offset);

            if (response || response.hasOwnProperty("promise")) {
                response.promise.done(handleFindRefs).fail(function () {
                    result.reject();
                });
            }
        }

        /**
         * Check if references are in this file only
         * If yes then select all references
         */
        handleFindRefs = function (refsResp) {
            function isInSameFile(obj) {
                return (obj && obj.file === refsResp.file);
            }
            
            if (refsResp && refsResp.references && refsResp.references.refs) {
                if (refsResp.references.type === "local") {
                    EditorManager.getActiveEditor().setSelections(refsResp.references.refs.filter(isInSameFile));
                } else {
                    var isInSameFile = refsResp.references.refs.filter(isInSameFile).length === refsResp.references.refs.length;
                    if (isInSameFile) {
                        EditorManager.getActiveEditor().setSelections(refsResp.references.refs);
                    } else {
                        editor.displayErrorMessageAtCursor("As of now Rename doesn't work across project");
                    }
                    
                }
            }
        };

        offset = session.getOffset();
        requestFindReferences(session, offset);

        return result.promise();
    }
    
    exports.handleRename = handleRename;
});
