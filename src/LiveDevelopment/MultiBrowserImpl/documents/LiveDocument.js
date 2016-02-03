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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    var EditorManager       = require("editor/EditorManager"),
        EventDispatcher     = require("utils/EventDispatcher"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        _                   = require("thirdparty/lodash");

    /**
     * @const
     * CSS class to use for live preview errors.
     * @type {string}
     */
    var SYNC_ERROR_CLASS = "live-preview-sync-error";

    /**
     * @constructor
     * Base class for managing the connection between a live editor and the browser. Provides functions
     * for subclasses to highlight relevant nodes in the browser, and to mark errors in the editor.
     *
     * Raises these events:
     *     "connect" - when a browser connects from the URL that maps to this live document. Passes the
     *          URL as a parameter.
     *     "errorStatusChanged" - when the status of errors that might prevent live edits from
     *          working (e.g. HTML syntax errors) has changed. Passes a boolean that's true if there
     *          are errors, false otherwise.
     *
     * @param {LiveDevProtocol} protocol The protocol to use for communicating with the browser.
     * @param {function(string): string} urlResolver A function that, given a path on disk, should return
     *     the URL that Live Development serves that path at.
     * @param {Document} doc The Brackets document that this live document is connected to.
     * @param {?Editor} editor If specified, a particular editor that this live document is managing.
     *     If not specified initially, the LiveDocument will connect to the editor for the given document
     *     when it next becomes the active editor.
     */
    function LiveDocument(protocol, urlResolver, doc, editor, roots) {
        this.protocol = protocol;
        this.urlResolver = urlResolver;
        this.doc = doc;
        this.roots = roots || [];

        this._onActiveEditorChange = this._onActiveEditorChange.bind(this);
        this._onCursorActivity = this._onCursorActivity.bind(this);
        this._onHighlightPrefChange = this._onHighlightPrefChange.bind(this);

        EditorManager.on("activeEditorChange", this._onActiveEditorChange);

        PreferencesManager.stateManager.getPreference("livedev.highlight")
            .on("change", this._onHighlightPrefChange);

        // Redraw highlights when window gets focus. This ensures that the highlights
        // will be in sync with any DOM changes that may have occurred.
        $(window).focus(this._onHighlightPrefChange);

        if (editor) {
            // Attach now
            this._attachToEditor(editor);
        }
    }

    EventDispatcher.makeEventDispatcher(LiveDocument.prototype);

    /**
     * Closes the live document, terminating its connection to the browser.
     */
    LiveDocument.prototype.close = function () {

        this._clearErrorDisplay();
        this._detachFromEditor();
        EditorManager.off("activeEditorChange", this._onActiveEditorChange);
        PreferencesManager.stateManager.getPreference("livedev.highlight")
            .off("change", this._onHighlightPrefChange);
    };

    /**
     * Returns true if document edits appear live in the connected browser.
     * Should be overridden by subclasses.
     * @return {boolean}
     */
    LiveDocument.prototype.isLiveEditingEnabled = function () {
        return false;
    };

    /**
     * Called to turn instrumentation on or off for this file. Triggered by being
     * requested from the browser. Should be implemented by subclasses if instrumentation
     * is necessary for the subclass's document type.
     * TODO: this doesn't seem necessary...if we're a live document, we should
     * always have instrumentation on anyway.
     * @param {boolean} enabled
     */
    LiveDocument.prototype.setInstrumentationEnabled = function (enabled) {
        // Does nothing in base class.
    };

    /**
     * Returns the instrumented version of the file. By default, just returns
     * the document text. Should be overridden by subclasses for cases if instrumentation
     * is necessary for the subclass's document type.
     * @return {{body: string}} document body
     */
    LiveDocument.prototype.getResponseData = function (enabled) {
        return {
            body: this.doc.getText()
        };
    };

    /**
     * @private
     * Handles changes to the "Live Highlight" preference, switching it on/off in the browser as appropriate.
     */
    LiveDocument.prototype._onHighlightPrefChange = function () {
        if (this.isHighlightEnabled()) {
            this.updateHighlight();
        } else {
            this.hideHighlight();
        }
    };

    /**
     * @private
     * Handles when the active editor changes, attaching to the new editor if it's for the current document.
     * @param {$.Event} event
     * @param {?Editor} newActive
     * @param {?Editor} oldActive
     */
    LiveDocument.prototype._onActiveEditorChange = function (event, newActive, oldActive) {

        //FIXME: #7 prevents the page to be reloaded when editing JS files.
        //       Temporarily disabling this code to make JS editing work.
//      this._detachFromEditor();

        if (newActive && newActive.document === this.doc) {
            this._attachToEditor(newActive);
        }
    };

    /**
     * @private
     * Attaches to an editor for our associated document when it becomes active.
     * @param {Editor} editor
     */
    LiveDocument.prototype._attachToEditor = function (editor) {
        this.editor = editor;

        if (this.editor) {
            this.editor.on("cursorActivity", this._onCursorActivity);
            this.updateHighlight();
        }
    };

    /**
     * @private
     * Detaches from the current editor.
     */
    LiveDocument.prototype._detachFromEditor = function () {
        if (this.editor) {
            this.hideHighlight();
            this.editor.off("cursorActivity", this._onCursorActivity);
            this.editor = null;
        }
    };

    /**
     * @private
     * Handles a cursor change in our attached editor. Updates the highlight in the browser.
     * @param {$.Event} event
     * @param {Editor} editor
     */
    LiveDocument.prototype._onCursorActivity = function (event, editor) {
        if (!this.editor) {
            return;
        }
        this.updateHighlight();
    };

    /**
     * @private
     * Update errors shown by the live document in the editor. Should be called by subclasses
     * when the list of errors changes.
     */
    LiveDocument.prototype._updateErrorDisplay = function () {
        var self = this,
            startLine,
            endLine,
            i,
            lineHandle;

        if (!this.editor) {
            return;
        }

        // Buffer addLineClass DOM changes in a CodeMirror operation
        this.editor._codeMirror.operation(function () {
            // Remove existing errors before marking new ones
            self._clearErrorDisplay();

            self._errorLineHandles = self._errorLineHandles || [];

            self.errors.forEach(function (error) {
                startLine = error.startPos.line;
                endLine = error.endPos.line;

                for (i = startLine; i < endLine + 1; i++) {
                    lineHandle = self.editor._codeMirror.addLineClass(i, "wrap", SYNC_ERROR_CLASS);
                    self._errorLineHandles.push(lineHandle);
                }
            });
        });

        this.trigger("errorStatusChanged", !!this.errors.length);
    };

    /**
     * @private
     * Clears the errors shown in the attached editor.
     */
    LiveDocument.prototype._clearErrorDisplay = function () {
        var self = this,
            lineHandle;

        if (!this.editor ||
                !this._errorLineHandles ||
                !this._errorLineHandles.length) {
            return;
        }

        this.editor._codeMirror.operation(function () {
            while (true) {
                // Iterate over all lines that were previously marked with an error
                lineHandle = self._errorLineHandles.pop();

                if (!lineHandle) {
                    break;
                }

                self.editor._codeMirror.removeLineClass(lineHandle, "wrap", SYNC_ERROR_CLASS);
            }
        });
    };

    /**
     * Returns true if we should be highlighting.
     * @return {boolean}
     */
    LiveDocument.prototype.isHighlightEnabled = function () {
        return PreferencesManager.getViewState("livedev.highlight");
    };

    /**
     * Called when the highlight in the browser should be updated because the user has
     * changed the selection. Does nothing in base class, should be implemented by subclasses
     * that implement highlighting functionality.
     */
    LiveDocument.prototype.updateHighlight = function () {
        // Does nothing in base class
    };

    /**
     * Hides the current highlight in the browser.
     * @param {boolean=} temporary If true, this isn't a change of state - we're just about
     *     to re-highlight.
     */
    LiveDocument.prototype.hideHighlight = function (temporary) {
        if (!temporary) {
            this._lastHighlight = null;
        }
        this.protocol.evaluate("_LD.hideHighlight()");
    };

    /**
     * Highlight all nodes affected by a CSS rule. Should be called by subclass implementations of
     * `updateHighlight()`.
     * @param {string} name The selector whose matched nodes should be highlighted.
     */
    LiveDocument.prototype.highlightRule = function (name) {
        if (this._lastHighlight === name) {
            return;
        }
        this._lastHighlight = name;
        this.protocol.evaluate("_LD.highlightRule(" + JSON.stringify(name) + ")");
    };

    /**
     * Highlight all nodes with 'data-brackets-id' value
     * that matches id, or if id is an array, matches any of the given ids.
     * Should be called by subclass implementations of
     * `updateHighlight()`.
     * @param {string|Array.<string>} value of the 'data-brackets-id' to match,
     * or an array of such.
     */
    LiveDocument.prototype.highlightDomElement = function (ids) {
        var selector = "";
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        _.each(ids, function (id) {
            if (selector !== "") {
                selector += ",";
            }
            selector += "[data-brackets-id='" + id + "']";
        });
        this.highlightRule(selector);
    };

    /**
     * Redraw active highlights.
     */
    LiveDocument.prototype.redrawHighlights = function () {
        if (this.isHighlightEnabled()) {
            this.protocol.evaluate("_LD.redrawHighlights()");
        }
    };

    module.exports = LiveDocument;
});
