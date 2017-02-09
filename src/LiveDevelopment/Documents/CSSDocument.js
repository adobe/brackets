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

/*jslint forin: true */

/**
 * CSSDocument manages a single CSS source document
 *
 * __EDITING__
 *
 * Editing the document will cause the style sheet to be reloaded via the
 * CSSAgent, which immediately updates the appearance of the rendered document.
 *
 * __HIGHLIGHTING__
 *
 * CSSDocument supports highlighting nodes from the HighlightAgent and
 * highlighting all DOMNode corresponding to the rule at the cursor position
 * in the editor.
 *
 * __EVENTS__
 *
 * CSSDocument dispatches these events:
 *
 * - deleted -- When the file for the underlying Document has been deleted.
 *   The 2nd argument to the listener will be this CSSDocument.
 */
define(function CSSDocumentModule(require, exports, module) {
    "use strict";

    var _               = require("thirdparty/lodash"),
        EventDispatcher = require("utils/EventDispatcher"),
        CSSAgent        = require("LiveDevelopment/Agents/CSSAgent"),
        CSSUtils        = require("language/CSSUtils"),
        EditorManager   = require("editor/EditorManager"),
        HighlightAgent  = require("LiveDevelopment/Agents/HighlightAgent"),
        Inspector       = require("LiveDevelopment/Inspector/Inspector");

    /**
     * @constructor
     * @param {!Document} doc The source document from Brackets
     * @param {!Editor} editor The editor for this document
     */
    var CSSDocument = function CSSDocument(doc, editor) {
        this.doc = doc;

        this._highlight = [];
        this.onHighlight = this.onHighlight.bind(this);
        this.onCursorActivity = this.onCursorActivity.bind(this);

        // Add a ref to the doc since we're listening for change events
        this.doc.addRef();
        this.onChange = this.onChange.bind(this);
        this.onDeleted = this.onDeleted.bind(this);

        this.doc.on("change.CSSDocument", this.onChange);
        this.doc.on("deleted.CSSDocument", this.onDeleted);

        this.onActiveEditorChange = this.onActiveEditorChange.bind(this);
        EditorManager.on("activeEditorChange", this.onActiveEditorChange);

        if (editor) {
            // Attach now
            this.attachToEditor(editor);
        }
    };
    EventDispatcher.makeEventDispatcher(CSSDocument.prototype);

    /**
     * @private
     * Get the CSSStyleSheetHeader for this document
     */
    CSSDocument.prototype._getStyleSheetHeader = function () {
        return CSSAgent.styleForURL(this.doc.url);
    };

    /**
     * Get the browser version of the source
     * @return {jQuery.promise} Promise resolved with the text content of this CSS document
     */
    CSSDocument.prototype.getSourceFromBrowser = function getSourceFromBrowser() {
        function getOnlyValue(obj) {
            var key;
            for (key in obj) {
                if (_.has(obj, key)) {
                    return obj[key];
                }
            }
            return null;
        }

        var deferred = new $.Deferred(),
            styleSheetHeader = this._getStyleSheetHeader(),
            styleSheet = getOnlyValue(styleSheetHeader);

        if (styleSheet) {
            Inspector.CSS.getStyleSheetText(styleSheet.styleSheetId).then(function (res) {
                deferred.resolve(res.text);
            }, deferred.reject);
        } else {
            deferred.reject();
        }

        return deferred.promise();
    };

    /** Close the document */
    CSSDocument.prototype.close = function close() {
        this.doc.off(".CSSDocument");
        EditorManager.off("activeEditorChange", this.onActiveEditorChange);
        this.doc.releaseRef();
        this.detachFromEditor();
    };

    /**
     * @private
     * Update the style sheet text content and redraw highlights
     */
    CSSDocument.prototype._updateBrowser = function () {
        var reloadPromise = CSSAgent.reloadCSSForDocument(this.doc);

        if (Inspector.config.highlight) {
            reloadPromise.done(HighlightAgent.redraw);
        }
    };

    CSSDocument.prototype.attachToEditor = function (editor) {
        this.editor = editor;

        if (this.editor) {
            HighlightAgent.on("highlight", this.onHighlight);
            this.editor.on("cursorActivity.CSSDocument", this.onCursorActivity);
            this.updateHighlight();
        }
    };

    CSSDocument.prototype.detachFromEditor = function () {
        if (this.editor) {
            HighlightAgent.hide();
            HighlightAgent.off("highlight", this.onHighlight);
            this.editor.off(".CSSDocument");
            this.onHighlight();
            this.editor = null;
        }
    };

    CSSDocument.prototype.updateHighlight = function () {
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

    /**
     * Enable instrumented CSS
     * @param enabled {boolean}
     */
    CSSDocument.prototype.setInstrumentationEnabled = function setInstrumentationEnabled(enabled) {
        // no-op
        // "Instrumentation" is always enabled for CSS, we make no modifications
    };

    /**
     * Returns true if document edits appear live in the connected browser
     * @return {boolean}
     */
    CSSDocument.prototype.isLiveEditingEnabled = function () {
        return true;
    };

    /**
     * Returns a JSON object with HTTP response overrides
     * @return {{body: string}}
     */
    CSSDocument.prototype.getResponseData = function getResponseData(enabled) {
        // Serve up the in-memory text, including any unsaved changes
        return {
            body: this.doc.getText()
        };
    };

    /** Event Handlers *******************************************************/

    /** Triggered on cursor activity of the editor */
    CSSDocument.prototype.onCursorActivity = function onCursorActivity(event, editor) {
        this.updateHighlight();
    };

    /** Triggered whenever the Document is edited */
    CSSDocument.prototype.onChange = function onChange(event, editor, change) {
        this._updateBrowser();
    };

    /** Triggered if the Document's file is deleted */
    CSSDocument.prototype.onDeleted = function onDeleted(event, editor, change) {
        // clear the CSS
        CSSAgent.clearCSSForDocument(this.doc);

        // shut down, since our Document is now dead
        this.close();
        this.trigger("deleted", this);
    };

    /** Triggered when the active editor changes */
    CSSDocument.prototype.onActiveEditorChange = function (event, newActive, oldActive) {
        this.detachFromEditor();

        if (newActive && newActive.document === this.doc) {
            this.attachToEditor(newActive);
        }
    };

    /** Triggered by the HighlightAgent to highlight a node in the editor */
    CSSDocument.prototype.onHighlight = function onHighlight(event, node) {
        // clear an existing highlight
        var i;
        for (i in this._highlight) {
            this._highlight[i].clear();
        }
        this._highlight = [];
        if (!node || !node.location) {
            return;
        }

        // WebInspector Command: CSS.getMatchedStylesForNode
        Inspector.CSS.getMatchedStylesForNode(node.nodeId, function onGetMatchesStyles(res) {
            // res = {matchedCSSRules, pseudoElements, inherited}
            var codeMirror = this.editor._codeMirror,
                styleSheetIds = this._getStyleSheetHeader();

            var i, rule, from, to;
            for (i in res.matchedCSSRules) {
                rule = res.matchedCSSRules[i];
                if (rule.ruleId && styleSheetIds[rule.ruleId.styleSheetId]) {
                    from = codeMirror.posFromIndex(rule.selectorRange.start);
                    to = codeMirror.posFromIndex(rule.style.range.end);
                    this._highlight.push(codeMirror.markText(from, to, { className: "highlight" }));
                }
            }
        }.bind(this));
    };

    // Export the class
    module.exports = CSSDocument;
});
