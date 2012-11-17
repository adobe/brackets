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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $ */

/**
 * HTMLDocument manages a single HTML source document
 *
 * # EDITING
 *
 * Editing the document will cause the corresponding node to be updated
 * by calling `applyChanges` on the DOMAgent. This will only work for
 * altering text nodes and will break when attempting to change DOM elements
 * or inserting or deleting nodes.
 *
 * # HIGHLIGHTING
 *
 * HTMLDocument supports highlighting nodes from the HighlightAgent and
 * highlighting the DOMNode corresponding to the cursor position in the
 * editor.
 */
define(function HTMLDocumentModule(require, exports, module) {
    "use strict";

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var DOMAgent = require("LiveDevelopment/Agents/DOMAgent");
    var HighlightAgent = require("LiveDevelopment/Agents/HighlightAgent");

    /** Constructor
     *
     * @param Document the source document from Brackets
     */
    var HTMLDocument = function HTMLDocument(doc, editor) {
        if (!editor) {
            return;
        }
        this.doc = doc;
        this.editor = editor;
        this.onHighlight = this.onHighlight.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onCursorActivity = this.onCursorActivity.bind(this);
        $(HighlightAgent).on("highlight", this.onHighlight);
        $(this.editor).on("change", this.onChange);
        $(this.editor).on("cursorActivity", this.onCursorActivity);
        this.onCursorActivity();
    };

    /** Close the document */
    HTMLDocument.prototype.close = function close() {
        if (!this.editor) {
            return;
        }
        $(HighlightAgent).off("highlight", this.onHighlight);
        $(this.editor).off("change", this.onChange);
        $(this.editor).off("cursorActivity", this.onCursorActivity);
        this.onHighlight();
    };


    /** Event Handlers *******************************************************/

    /** Triggered on cursor activity by the editor */
    HTMLDocument.prototype.onCursorActivity = function onCursorActivity(event, editor) {
        var codeMirror = this.editor._codeMirror;
        if (Inspector.config.highlight) {
            var location = codeMirror.indexFromPos(codeMirror.getCursor());
            var node = DOMAgent.allNodesAtLocation(location).pop();
            HighlightAgent.node(node);
        }
    };

    /** Triggered on change by the editor */
    HTMLDocument.prototype.onChange = function onChange(event, editor, change) {
        var codeMirror = this.editor._codeMirror;
        while (change) {
            var from = codeMirror.indexFromPos(change.from);
            var to = codeMirror.indexFromPos(change.to);
            var text = change.text.join("\n");
            DOMAgent.applyChange(from, to, text);
            change = change.next;
        }
    };

    /** Triggered by the HighlightAgent to highlight a node in the editor */
    HTMLDocument.prototype.onHighlight = function onHighlight(event, node) {
        if (!node || !node.location) {
            if (this._highlight) {
                this._highlight.clear();
                delete this._highlight;
            }
            return;
        }
        var codeMirror = this.editor._codeMirror;
        var to, from = codeMirror.posFromIndex(node.location);
        if (node.closeLocation) {
            to = node.closeLocation + node.closeLength;
        } else {
            to = node.location + node.length;
        }
        to = codeMirror.posFromIndex(to);
        if (this._highlight) {
            this._highlight.clear();
        }
        this._highlight = codeMirror.markText(from, to, "highlight");
    };

    // Export the class
    module.exports = HTMLDocument;
});