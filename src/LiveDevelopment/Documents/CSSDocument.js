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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $ */

/**
 * CSSDocument manages a single CSS source document
 *
 * # EDITING
 *
 * Editing the document will cause the style sheet to be reloaded via the
 * CSSAgent, which immediately updates the appearance of the rendered document.
 *
 * # HIGHLIGHTING
 *
 * CSSDocument supports highlighting nodes from the HighlightAgent and
 * highlighting all DOMNode corresponding to the rule at the cursor position
 * in the editor.
 *
 * # EVENTS
 *
 * CSSDocument dispatches these events:
 *  deleted - When the file for the underlying Document has been deleted. The
 *      2nd argument to the listener will be this CSSDocument.
 */
define(function CSSDocumentModule(require, exports, module) {
    'use strict';

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var CSSAgent = require("LiveDevelopment/Agents/CSSAgent");
    var HighlightAgent = require("LiveDevelopment/Agents/HighlightAgent");

    /** Constructor
     *
     * @param Document the source document from Brackets
     */
    var CSSDocument = function CSSDocument(doc, editor, inspector) {
        this.doc = doc;
        
        // FUTURE: Highlighting is currently disabled, since this code doesn't yet know
        // how to deal with different editors pointing at the same document.
/*
        this.editor = editor;
        this._highlight = [];
        this.onHighlight = this.onHighlight.bind(this);
        this.onCursorActivity = this.onCursorActivity.bind(this);
        Inspector.on("HighlightAgent.highlight", this.onHighlight);
*/
        
        // Add a ref to the doc since we're listening for change events
        this.doc.addRef();
        this.onChange = this.onChange.bind(this);
        this.onDeleted = this.onDeleted.bind(this);
        $(this.doc).on("change", this.onChange);
        $(this.doc).on("deleted", this.onDeleted);

/*
        $(this.editor).on("cursorActivity", this.onCursorActivity);
        this.onCursorActivity();
*/

        // get the style sheet
        this.styleSheet = CSSAgent.styleForURL(this.doc.url);

        // WebInspector Command: CSS.getStyleSheet
        Inspector.CSS.getStyleSheet(this.styleSheet.styleSheetId, function callback(res) {
            // res = {styleSheet}
            this.rules = res.styleSheet.rules;
        }.bind(this));
        
        // If the CSS document is dirty, push the changes into the browser now
        if (doc.isDirty) {
            CSSAgent.reloadCSSForDocument(this.doc);
        }
    };

    /** Get the browser version of the StyleSheet object */
    CSSDocument.prototype.getStyleSheetFromBrowser = function getStyleSheetFromBrowser() {
        var deferred = new $.Deferred();
        
        // WebInspector Command: CSS.getStyleSheet
        Inspector.CSS.getStyleSheet(this.styleSheet.styleSheetId, function callback(res) {
            // res = {styleSheet}
            if (res.styleSheet) {
                deferred.resolve(res.styleSheet);
            } else {
                deferred.reject();
            }
        });
        
        return deferred.promise();
    };
    
    /** Get the browser version of the source */
    CSSDocument.prototype.getSourceFromBrowser = function getSourceFromBrowser() {
        var deferred = new $.Deferred();
        
        this.getStyleSheetFromBrowser().done(function onDone(styleSheet) {
            deferred.resolve(styleSheet.text);
        }).fail(function onFail() {
            deferred.reject();
        });
        
        return deferred.promise();
    };

    /** Close the document */
    CSSDocument.prototype.close = function close() {
        $(this.doc).off("change", this.onChange);
        $(this.doc).off("deleted", this.onDeleted);
        this.doc.releaseRef();
/*
        Inspector.off("HighlightAgent.highlight", this.onHighlight);
        $(this.editor).off("cursorActivity", this.onCursorActivity);
        this.onHighlight();
*/
    };

    // find a rule in the given rules
    CSSDocument.prototype.ruleAtLocation = function ruleAtLocation(location) {
        var i, rule;
        for (i in this.rules) {
            rule = this.rules[i];
            if (rule.selectorRange.start <= location && location <= rule.style.range.end) {
                return rule;
            }
        }
        return null;
    };


    /** Event Handlers *******************************************************/

    /** Triggered on cursor activity of the editor */
    CSSDocument.prototype.onCursorActivity = function onCursorActivity(event, editor) {
        if (Inspector.config.highlight) {
            var codeMirror = this.editor._codeMirror;
            var location = codeMirror.indexFromPos(codeMirror.getCursor());
            var rule = this.ruleAtLocation(location);
            if (rule) {
                HighlightAgent.rule(rule.selectorText);
            } else {
                HighlightAgent.hide();
            }
        }
    };

    /** Triggered whenever the Document is edited */
    CSSDocument.prototype.onChange = function onChange(event, editor, change) {
        // brute force: update the CSS
        CSSAgent.reloadCSSForDocument(this.doc);
    };
    /** Triggered if the Document's file is deleted */
    CSSDocument.prototype.onDeleted = function onDeleted(event, editor, change) {
        // clear the CSS
        CSSAgent.clearCSSForDocument(this.doc);
        
        // shut down, since our Document is now dead
        this.close();
        $(this).triggerHandler("deleted", [this]);
    };

    /** Triggered by the HighlightAgent to highlight a node in the editor */
    CSSDocument.prototype.onHighlight = function onHighlight(node) {
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
            var codeMirror = this.editor._codeMirror;
            var i, rule, from, to;
            for (i in res.matchedCSSRules) {
                rule = res.matchedCSSRules[i];
                if (rule.ruleId && rule.ruleId.styleSheetId === this.styleSheet.styleSheetId) {
                    from = codeMirror.posFromIndex(rule.selectorRange.start);
                    to = codeMirror.posFromIndex(rule.style.range.end);
                    this._highlight.push(codeMirror.markText(from, to, "highlight"));
                }
            }
        }.bind(this));
    };

    // Export the class
    module.exports = CSSDocument;
});