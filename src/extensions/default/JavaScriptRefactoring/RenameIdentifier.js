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
        TokenUtils           = brackets.getModule("utils/TokenUtils"),
        Strings              = brackets.getModule("strings"),
        ProjectManager      = brackets.getModule("project/ProjectManager");

    var session             = null,  // object that encapsulates the current session state
        keywords = ["define", "alert", "exports", "require", "module", "arguments"];

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
            offset, handleFindRefs, token;

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

        token = TokenUtils.getTokenAt(editor._codeMirror, editor._codeMirror.posFromIndex(session.getOffset()));

        if (keywords.indexOf(token.string) >= 0) {
            editor.displayErrorMessageAtCursor(Strings.ERROR_RENAME_GENERAL);
            return;
        }

        var result = new $.Deferred();

        function isInSameFile(obj, refsResp) {
            var projectRoot = ProjectManager.getProjectRoot(),
                projectDir,
                fileName = "";
            if (projectRoot) {
                projectDir = projectRoot.fullPath;
            }

            // get the relative path of File as Tern can also return
            // references with file name as a relative path wrt projectRoot
            // so refernce file name will be compared with both relative and absolute path to check if it is same file
            if (projectDir && refsResp && refsResp.file && refsResp.file.indexOf(projectDir) === 0) {
                fileName = refsResp.file.slice(projectDir.length);
            }
            // In case of unsaved files, After renameing once Tern is returning filename without forward slash
            return (obj && (obj.file === refsResp.file || obj.file === fileName
                            || obj.file === refsResp.file.slice(1, refsResp.file.length)));
        }

        /**
         * Check if references are in this file only
         * If yes then select all references
         */
        function handleFindRefs (refsResp) {
            if (!refsResp || !refsResp.references || !refsResp.references.refs) {
                return;
            }

            var inlineWidget = EditorManager.getFocusedInlineWidget(),
                editor = EditorManager.getActiveEditor(),
                refs = refsResp.references.refs,
                type = refsResp.references.type;

            //In case of inline widget if some references are outside widget's text range then don't allow for rename
            if (inlineWidget) {
                var isInTextRange  = !refs.find(function(item) {
                    return (item.start.line < inlineWidget._startLine || item.end.line > inlineWidget._endLine);
                });
                
                if (!isInTextRange) {
                    editor.displayErrorMessageAtCursor(Strings.ERROR_RENAME_QUICKEDIT);
                    return;
                }
            }

            var currentPosition = editor.posFromIndex(refsResp.offset),
                refsArray = refs;
            if (type !== "local") {
                refsArray = refs.filter(function (element) {
                    return isInSameFile(element, refsResp);
                });
            }

            // Finding the Primary Reference in Array
            var primaryRef = refsArray.find(function (element) {
                return ((element.start.line === currentPosition.line || element.end.line === currentPosition.line)
                        && currentPosition.ch <= element.end.ch && currentPosition.ch >= element.start.ch);
            });
            // Setting the primary flag of Primary Refence to true
            primaryRef.primary = true;

            editor.setSelections(refsArray);
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
