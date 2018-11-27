/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint regexp: true */

define(function (require, exports, module) {
    "use strict";

    var TokenUtils      = require("utils/TokenUtils"),
        Utils           = require("lsp/Utils");

    /**
     * Session objects encapsulate state associated with a hinting session
     * and provide methods for updating and querying the session.
     *
     * @constructor
     * @param {Editor} editor - the editor context for the session
     */
    function LSPSession(editor) {
        this.editor = editor;
        this.path = editor.document.file.fullPath;
    }


    /**
     * Get the name of the file associated with the current session
     *
     * @return {string} - the full pathname of the file associated with the
     *      current session
     */
    LSPSession.prototype.getPath = function () {
        return this.path;
    };

    /**
     * Get the current cursor position.
     *
     * @return {{line: number, ch: number}} - the current cursor position
     */
    LSPSession.prototype.getCursor = function () {
        return this.editor.getCursorPos();
    };

    /**
     * Get the text of a line.
     *
     * @param {number} line - the line number
     * @return {string} - the text of the line
     */
    LSPSession.prototype.getLine = function (line) {
        var doc = this.editor.document;
        return doc.getLine(line);
    };


    /**
     * Get the token at the given cursor position, or at the current cursor
     * if none is given.
     *
     * @param {?{line: number, ch: number}} cursor - the cursor position
     *      at which to retrieve a token
     * @return {Object} - the CodeMirror token at the given cursor position
     */
    LSPSession.prototype.getToken = function (cursor) {
        var cm = this.editor._codeMirror;

        if (cursor) {
            return TokenUtils.getTokenAt(cm, cursor);
        } else {
            return TokenUtils.getTokenAt(cm, this.getCursor());
        }
    };

    
    /**
     * Calculate a query string relative to the current cursor position
     * and token. E.g., from a state "identi<cursor>er", the query string is
     * "identi".
     *
     * @return {string} - the query string for the current cursor position
     */
    LSPSession.prototype.getQuery = function () {
        var cursor  = this.getCursor(),
            token   = this.getToken(cursor),
            query   = "",
            start   = cursor.ch,
            end     = start;

        if (token) {
            var line = this.getLine(cursor.line);
            while (start > 0) {
                if (Utils.maybeIdentifier(line[start - 1])) {
                    start--;
                } else {
                    break;
                }
            }

            query = line.substring(start, end);
        }

        return query;
    };


    module.exports = LSPSession;
});
