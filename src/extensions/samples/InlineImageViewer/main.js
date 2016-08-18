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

/*jslint regexp: true */

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var EditorManager           = brackets.getModule("editor/EditorManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager");

    // Local modules
    var InlineImageViewer       = require("InlineImageViewer");

    /**
     * Return the token string that is at the specified position.
     *
     * @param hostEditor {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {String} token string at the specified position
     */
    function _getStringAtPos(hostEditor, pos) {
        var token = hostEditor._codeMirror.getTokenAt(pos, true);

        // If the pos is at the beginning of a name, token will be the
        // preceding whitespace or dot. In that case, try the next pos.
        if (!/\S/.match(token.string) || token.string === ".") {
            token = hostEditor._codeMirror.getTokenAt({line: pos.line, ch: pos.ch + 1}, true);
        }

        if (token.type === "string") {
            var string = token.string;

            // Strip quotes
            var ch = string[0];
            if (ch === "\"" || ch === "'") {
                string = string.substr(1);
            }
            ch = string[string.length - 1];
            if (ch === "\"" || ch === "'") {
                string = string.substr(0, string.length - 1);
            }

            return string;
        } else {

            // Check for url(...);
            var line = hostEditor._codeMirror.getLine(pos.line);
            var match = /url\s*\(([^)]*)\)/.exec(line);

            if (match && match[1]) {
                // URLs are relative to the doc
                var docPath = hostEditor.document.file.fullPath;

                docPath = docPath.substr(0, docPath.lastIndexOf("/"));

                return docPath + "/" + match[1];
            }
        }

        return "";
    }

    /**
     * This function is registered with EditManager as an inline editor provider. It creates an inline editor
     * when cursor is on a JavaScript function name, find all functions that match the name
     * and show (one/all of them) in an inline editor.
     *
     * @param {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {$.Promise} a promise that will be resolved with an InlineWidget
     *      or null if we're not going to provide anything.
     */
    function inlineImageViewerProvider(hostEditor, pos) {

        // Only provide image viewer if the selection is within a single line
        var sel = hostEditor.getSelection(false);
        if (sel.start.line !== sel.end.line) {
            return null;
        }

        // Always use the selection start for determining the image file name. The pos
        // parameter is usually the selection end.
        var fileName = _getStringAtPos(hostEditor, hostEditor.getSelection(false).start);
        if (fileName === "") {
            return null;
        }

        // Check for valid file extensions
        if (!/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg)$/i.test(fileName)) {
            return null;
        }

        // TODO: Check for relative path
        var projectPath = ProjectManager.getProjectRoot().fullPath;

        if (fileName.indexOf(projectPath) !== 0) {
            fileName = projectPath + fileName;
        }
        var result = new $.Deferred();

        var imageViewer = new InlineImageViewer(fileName.substr(fileName.lastIndexOf("/")), fileName);
        imageViewer.load(hostEditor);

        result.resolve(imageViewer);

        return result.promise();
    }

    EditorManager.registerInlineEditProvider(inlineImageViewerProvider);
});
