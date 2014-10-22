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
/*global define, $, brackets */

/**
 * LiveCSSDocument manages a single CSS source document
 *
 * # EDITING
 *
 * Editing the document will cause the style sheet to be reloaded in the browser,
 * which immediately updates the appearance of the rendered document.
 *
 * # HIGHLIGHTING
 *
 * DOM nodes corresponding to the rule at the current cursor position are highlighted.
 *
 * # EVENTS
 *
 * LiveCSSDocument dispatches these events:
 *  deleted - When the file for the underlying Document has been deleted. The
 *      2nd argument to the listener will be this LiveCSSDocument.
 */
define(function LiveCSSDocumentModule(require, exports, module) {
    "use strict";

    var _               = require("thirdparty/lodash"),
        CSSUtils        = require("language/CSSUtils"),
        EditorManager   = require("editor/EditorManager"),
        LiveDocument    = require("LiveDevelopment/impls/livedev2/documents/LiveDocument");

    /** 
     * @constructor
     * @see LiveDocument
     * @param {LiveDevProtocol} protocol The protocol to use for communicating with the browser.
     * @param {function(string): string} urlResolver A function that, given a path on disk, should return
     *     the URL that Live Development serves that path at.
     * @param {Document} doc The Brackets document that this live document is connected to.
     * @param {?Editor} editor If specified, a particular editor that this live document is managing.
     *     If not specified initially, the LiveDocument will connect to the editor for the given document
     *     when it next becomes the active editor.
     */
    var LiveCSSDocument = function LiveCSSDocument(protocol, urlResolver, doc, editor, roots) {
        LiveDocument.apply(this, arguments);
        
        // Add a ref to the doc since we're listening for change events
        this.doc.addRef();
        this.onChange = this.onChange.bind(this);
        this.onDeleted = this.onDeleted.bind(this);

        $(this.doc).on("change.LiveCSSDocument", this.onChange);
        $(this.doc).on("deleted.LiveCSSDocument", this.onDeleted);
    };
    
    LiveCSSDocument.prototype = Object.create(LiveDocument.prototype);
    LiveCSSDocument.prototype.constructor = LiveCSSDocument;
    LiveCSSDocument.prototype.parentClass = LiveDocument.prototype;

    /**
     * @private
     * Returns information about the associated style block in the browser, including a
     * unique ID.
     */
    LiveCSSDocument.prototype._getStyleSheetHeader = function () {
        // TODO Need to add protocol API for getting a stylesheet ID, or
        // decide to just refer to them by URL.
        //return CSSAgent.styleForURL(this.doc.url);
    };

    /**
     * Get the browser version of the source
     * @return {jQuery.promise} Promise resolved with the text content of this CSS document
     */
    LiveCSSDocument.prototype.getSourceFromBrowser = function () {
        // Only used for unit testing. 
        var deferred = new $.Deferred();
        
        this.protocol.getStyleSheetText(this.doc.url)
            .then(function (res) {
                deferred.resolve(res.text);
            })
            .fail(function (err) {
                deferred.reject(err);
            });
        
        return deferred.promise();
    };
 
    /**
     * @override
     * Closes the live document, terminating its connection to the browser.
     */
    LiveCSSDocument.prototype.close = function () {
        $(this.doc).off(".LiveCSSDocument");
        this.doc.releaseRef();
        this.parentClass.close.call(this);
    };

    /**
     * When the user edits the file, update the stylesheet in the browser and redraw highlights.
     */
    LiveCSSDocument.prototype._updateBrowser = function () {
        var i;
        for (i = 0; i < this.roots.length; i++) {
            if (this.doc.url !== this.roots[i]) {
                // if it's not directly included through <link>,
                // reload the original doc
                $(this).triggerHandler("updateDoc", this.roots[i]);
            } else {
                this.protocol.evaluate("_LD.reloadCSS(" +
                                       JSON.stringify(this.doc.url) + ", " +
                                       JSON.stringify(this.doc.getText()) + ")");
            }
        }
        this.redrawHighlights();
    };

    /**
     * @override
     * Update the highlights in the browser based on the cursor position.
     */
    LiveCSSDocument.prototype.updateHighlight = function () {
        if (this.isHighlightEnabled() && this.editor) {
            var editor = this.editor,
                codeMirror = editor._codeMirror,
                selectors = [];
            _.each(this.editor.getSelections(), function (sel) {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, (sel.reversed ? sel.end : sel.start));
                if (selector) {
                    selectors.push(selector);
                }
            });
            if (selectors.length) {
                this.highlightRule(selectors.join(","));
            } else {
                this.hideHighlight();
            }
        }
    };
    
    /**
     * @override
     * Returns true if document edits appear live in the connected browser.
     * @return {boolean} 
     */
    LiveCSSDocument.prototype.isLiveEditingEnabled = function () {
        return true;
    };
 
    /** Event Handlers *******************************************************/

    /**
     * @private
     * Handles edits to the document. Updates the stylesheet in the browser.
     * @param {$.Event} event
     * @param {Editor} editor
     * @param {Object} change
     */
    LiveCSSDocument.prototype.onChange = function (event, editor, change) {
        this._updateBrowser();
    };

    /** 
     * @private
     * Handles when the associated CSS document is deleted on disk. Removes the
     * stylesheet from the browser and shuts down the live document.
     * @param {$.Event} event
     */
    LiveCSSDocument.prototype.onDeleted = function (event) {
        // TODO Need to add protocol API to remove the stylesheet from the document.
        //CSSAgent.clearCSSForDocument(this.doc);

        // shut down, since our Document is now dead
        this.close();
        $(this).triggerHandler("deleted", [this]);
    };

    // Export the class
    module.exports = LiveCSSDocument;
});