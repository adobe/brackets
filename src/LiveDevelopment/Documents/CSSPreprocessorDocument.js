/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/**
 * CSSPreprocessorDocument manages a single LESS or SASS source document
 *
 * __HIGHLIGHTING__
 *
 * CSSPreprocessorDocument supports highlighting all DOMNode corresponding to the rule at
 * the cursor position in the editor.
 *
 */
define(function CSSPreprocessorDocumentModule(require, exports, module) {
    "use strict";

    var _               = require("thirdparty/lodash"),
        EventDispatcher = require("utils/EventDispatcher"),
        CSSUtils        = require("language/CSSUtils"),
        EditorManager   = require("editor/EditorManager"),
        HighlightAgent  = require("LiveDevelopment/Agents/HighlightAgent"),
        Inspector       = require("LiveDevelopment/Inspector/Inspector");

    /**
     * @constructor
     * @param {!Document} doc The source document from Brackets
     * @param {?Editor} editor The editor for this document. This is not used here since
     *                  we always need to get the active editor for a preprocessor document
     *                  and not the one passed in `editor`.
     */
    var CSSPreprocessorDocument = function CSSPreprocessorDocument(doc, editor) {
        this.doc = doc;

        this.onCursorActivity = this.onCursorActivity.bind(this);

        // Add a ref to the doc since we're listening for change events
        this.doc.addRef();
        this.onActiveEditorChange = this.onActiveEditorChange.bind(this);
        EditorManager.on("activeEditorChange", this.onActiveEditorChange);
        this.onActiveEditorChange(null, EditorManager.getActiveEditor(), null);
    };

    // CSSPreprocessorDocument doesn't dispatch events, but the "live document" interface requires an on() API
    EventDispatcher.makeEventDispatcher(CSSPreprocessorDocument.prototype);

    /** Close the document */
    CSSPreprocessorDocument.prototype.close = function close() {
        this.doc.off(".CSSPreprocessorDocument");
        EditorManager.off("activeEditorChange", this.onActiveEditorChange);
        this.doc.releaseRef();
        this.detachFromEditor();
    };

    /** Return false so edits cause "out of sync" icon to appear */
    CSSPreprocessorDocument.prototype.isLiveEditingEnabled = function () {
        // Normally this isn't called since wasURLRequested() returns false for us, but if user's
        // page uses less.js to dynamically load LESS files, then it'll be true and we'll get called.
        return false;
    };

    CSSPreprocessorDocument.prototype.attachToEditor = function (editor) {
        this.editor = editor;

        if (this.editor) {
            this.editor.on("cursorActivity.CSSPreprocessorDocument", this.onCursorActivity);
            this.updateHighlight();
        }
    };

    CSSPreprocessorDocument.prototype.detachFromEditor = function () {
        if (this.editor) {
            HighlightAgent.hide();
            this.editor.off(".CSSPreprocessorDocument");
            this.editor = null;
        }
    };

    CSSPreprocessorDocument.prototype.updateHighlight = function () {
        if (Inspector.config.highlight && this.editor) {
            var editor = this.editor,
                selectors = [];
            _.each(this.editor.getSelections(), function (sel) {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, (sel.reversed ? sel.end : sel.start));
                if (selector) {
                    selectors.push(selector);
                }
            });
            if (selectors.length) {
                HighlightAgent.rule(selectors.join(","));
            } else {
                HighlightAgent.hide();
            }
        }
    };

    /** Event Handlers *******************************************************/

    /** Triggered on cursor activity of the editor */
    CSSPreprocessorDocument.prototype.onCursorActivity = function onCursorActivity(event, editor) {
        this.updateHighlight();
    };

    /** Triggered when the active editor changes */
    CSSPreprocessorDocument.prototype.onActiveEditorChange = function (event, newActive, oldActive) {
        this.detachFromEditor();

        if (newActive && newActive.document === this.doc) {
            this.attachToEditor(newActive);
        }
    };

    // Export the class
    module.exports = CSSPreprocessorDocument;
});
