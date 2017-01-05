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

/**
 * LiveHTMLDocument manages a single HTML source document. Edits to the HTML are applied live in
 * the browser, and the DOM node corresponding to the selection is highlighted.
 *
 * LiveHTMLDocument relies on HTMLInstrumentation in order to map tags in the HTML source text
 * to DOM nodes in the browser, so edits can be incrementally applied.
 */
define(function (require, exports, module) {
    "use strict";

    var EventDispatcher     = require("utils/EventDispatcher"),
        PerfUtils           = require("utils/PerfUtils"),
        _                   = require("thirdparty/lodash"),
        LiveDocument        = require("LiveDevelopment/MultiBrowserImpl/documents/LiveDocument"),
        HTMLInstrumentation = require("LiveDevelopment/MultiBrowserImpl/language/HTMLInstrumentation");


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
    function LiveHTMLDocument(protocol, urlResolver, doc, editor) {
        LiveDocument.apply(this, arguments);

        this._instrumentationEnabled = false;
        this._relatedDocuments = {
            stylesheets: {},
            scripts: {}
        };

        this._onChange = this._onChange.bind(this);
        this.doc.on("change", this._onChange);

        this._onRelated = this._onRelated.bind(this);
        this.protocol.on("DocumentRelated", this._onRelated);

        this._onStylesheetAdded = this._onStylesheetAdded.bind(this);
        this.protocol.on("StylesheetAdded", this._onStylesheetAdded);

        this._onStylesheetRemoved = this._onStylesheetRemoved.bind(this);
        this.protocol.on("StylesheetRemoved", this._onStylesheetRemoved);

        this._onScriptAdded = this._onScriptAdded.bind(this);
        this.protocol.on("ScriptAdded", this._onScriptAdded);

        this._onScriptRemoved = this._onScriptRemoved.bind(this);
        this.protocol.on("ScriptRemoved", this._onScriptRemoved);

    }

    LiveHTMLDocument.prototype = Object.create(LiveDocument.prototype);
    LiveHTMLDocument.prototype.constructor = LiveHTMLDocument;
    LiveHTMLDocument.prototype.parentClass = LiveDocument.prototype;

    EventDispatcher.makeEventDispatcher(LiveHTMLDocument.prototype);

    /**
     * @override
     * Returns true if document edits appear live in the connected browser.
     * @return {boolean}
     */
    LiveHTMLDocument.prototype.isLiveEditingEnabled = function () {
        return this._instrumentationEnabled;
    };

    /**
     * @override
     * Called to turn instrumentation on or off for this file. Triggered by being
     * requested from the browser.
     * TODO: this doesn't seem necessary...if we're a live document, we should
     * always have instrumentation on anyway.
     * @param {boolean} enabled
     */
    LiveHTMLDocument.prototype.setInstrumentationEnabled = function (enabled) {
        if (!this.editor) {
            // TODO: error
            return;
        }
        if (enabled && !this._instrumentationEnabled) {
            // TODO: not clear why we do this here instead of waiting for the next time we want to
            // generate the instrumented HTML. This won't work if the dom offsets are out of date.
            HTMLInstrumentation.scanDocument(this.doc);
            HTMLInstrumentation._markText(this.editor);
        }

        this._instrumentationEnabled = enabled;
    };

    /**
     * Returns the instrumented version of the file.
     * @return {{body: string}} instrumented doc
     */
    LiveHTMLDocument.prototype.getResponseData = function (enabled) {
        var body;
        if (this._instrumentationEnabled) {
            body = HTMLInstrumentation.generateInstrumentedHTML(this.editor, this.protocol.getRemoteScript());
        }

        return {
            body: body || this.doc.getText()
        };
    };

    /**
     * @override
     * Closes the live document, terminating its connection to the browser.
     */
    LiveHTMLDocument.prototype.close = function () {
        this.doc.off("change", this._onChange);
        this.parentClass.close.call(this);
    };

    /**
     * @override
     * Update the highlights in the browser based on the cursor position.
     */
    LiveHTMLDocument.prototype.updateHighlight = function () {
        if (!this.editor || !this.isHighlightEnabled()) {
            return;
        }
        var editor = this.editor,
            ids = [];
        _.each(this.editor.getSelections(), function (sel) {
            var tagID = HTMLInstrumentation._getTagIDAtDocumentPos(
                editor,
                sel.reversed ? sel.end : sel.start
            );
            if (tagID !== -1) {
                ids.push(tagID);
            }
        });

        if (!ids.length) {
            this.hideHighlight();
        } else {
            this.highlightDomElement(ids);
        }
    };

    /**
     * @private
     * For the given editor change, compare the resulting browser DOM with the
     * in-editor DOM. If there are any diffs, a warning is logged to the
     * console along with each diff.
     * @param {Object} change CodeMirror editor change data
     */
    LiveHTMLDocument.prototype._compareWithBrowser = function (change) {
        // TODO: Not implemented.
    };

    /**
     * @private
     * Handles edits to the document. Determines what's changed in the source and sends DOM diffs to the browser.
     * @param {$.Event} event
     * @param {Document} doc
     * @param {Object} change
     */
    LiveHTMLDocument.prototype._onChange = function (event, doc, change) {
        // Make sure LiveHTML is turned on
        if (!this._instrumentationEnabled) {
            return;
        }

        // Apply DOM edits is async, so previous PerfUtils timer may still be
        // running. PerfUtils does not support running multiple timers with same
        // name, so do not start another timer in this case.
        var perfTimerName   = "LiveHTMLDocument applyDOMEdits",
            isNestedTimer   = PerfUtils.isActive(perfTimerName);
        if (!isNestedTimer) {
            PerfUtils.markStart(perfTimerName);
        }

        var self                = this,
            result              = HTMLInstrumentation.getUnappliedEditList(this.editor, change),
            applyEditsPromise;

        if (result.edits) {
            applyEditsPromise = this.protocol.evaluate("_LD.applyDOMEdits(" + JSON.stringify(result.edits) + ")");

            applyEditsPromise.always(function () {
                if (!isNestedTimer) {
                    PerfUtils.addMeasurement(perfTimerName);
                }
            });
        }

        this.errors = result.errors || [];
        this._updateErrorDisplay();

        // Debug-only: compare in-memory vs. in-browser DOM
        // edit this file or set a conditional breakpoint at the top of this function:
        //     "this._debug = true, false"
        if (this._debug) {
            console.log("Edits applied to browser were:");
            console.log(JSON.stringify(result.edits, null, 2));
            applyEditsPromise.done(function () {
                self._compareWithBrowser(change);
            });
        }
    };


    /**
     * @private
     * Handles message DocumentRelated from the browser.
     * @param {$.Event} event
     * @param {Object} msg
     */
    LiveHTMLDocument.prototype._onRelated = function (event, msg) {
        this._relatedDocuments = msg.related;
        return;
    };

    /**
     * @private
     * Handles message Stylesheet.Added from the browser.
     * @param {$.Event} event
     * @param {Object} msg
     */
    LiveHTMLDocument.prototype._onStylesheetAdded = function (event, msg) {
        this._relatedDocuments.stylesheets[msg.href] = true;
        return;
    };

    /**
     * @private
     * Handles message Stylesheet.Removed from the browser.
     * @param {$.Event} event
     * @param {Object} msg
     */
    LiveHTMLDocument.prototype._onStylesheetRemoved = function (event, msg) {
        delete (this._relatedDocuments.stylesheets[msg.href]);
        return;
    };

    /**
     * @private
     * Handles message Script.Added from the browser.
     * @param {$.Event} event
     * @param {Object} msg
     */
    LiveHTMLDocument.prototype._onScriptAdded = function (event, msg) {
        this._relatedDocuments.scripts[msg.src] = true;
        return;
    };

     /**
     * @private
     * Handles message Script.Removed from the browser.
     * @param {$.Event} event
     * @param {Object} msg
     */
    LiveHTMLDocument.prototype._onScriptRemoved = function (event, msg) {
        delete (this._relatedDocuments.scripts[msg.src]);
        return;
    };

     /**
     * For the given path, check if the document is related to the live HTML document.
     * Related means that is an external Javascript or CSS file that is included as part of the DOM.
     * @param {String} fullPath.
     * @return {boolean} - is related or not.
     */
    LiveHTMLDocument.prototype.isRelated = function (fullPath) {
        return (this._relatedDocuments.scripts[this.urlResolver(fullPath)] || this._relatedDocuments.stylesheets[this.urlResolver(fullPath)]);
    };

    LiveHTMLDocument.prototype.getRelated = function () {
        return this._relatedDocuments;
    };
    // Export the class
    module.exports = LiveHTMLDocument;
});
