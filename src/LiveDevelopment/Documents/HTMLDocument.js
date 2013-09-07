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

    var DocumentManager     = require("document/DocumentManager"),
        DOMAgent            = require("LiveDevelopment/Agents/DOMAgent"),
        HighlightAgent      = require("LiveDevelopment/Agents/HighlightAgent"),
        HTMLInstrumentation = require("language/HTMLInstrumentation"),
        Inspector           = require("LiveDevelopment/Inspector/Inspector"),
        LiveDevelopment     = require("LiveDevelopment/LiveDevelopment"),
        PerfUtils           = require("utils/PerfUtils"),
        RemoteAgent         = require("LiveDevelopment/Agents/RemoteAgent"),
        StringUtils         = require("utils/StringUtils");

    /**
     * Constructor
     * @param {!DocumentManager.Document} doc the source document from Brackets
     * @param {editor=} editor
     */
    var HTMLDocument = function HTMLDocument(doc, editor) {
        this.doc = doc;
        if (!editor) {
            return;
        }
        this.editor = editor;
        this._instrumentationEnabled = false;

        this.onCursorActivity = this.onCursorActivity.bind(this);
        this.onDocumentSaved = this.onDocumentSaved.bind(this);
        
        $(this.editor).on("cursorActivity", this.onCursorActivity);
        $(DocumentManager).on("documentSaved", this.onDocumentSaved);
        
        // Experimental code
        if (LiveDevelopment.config.experimental) {
            // Used by highlight agent to highlight editor text as selected in browser
            this.onHighlight = this.onHighlight.bind(this);
            $(HighlightAgent).on("highlight", this.onHighlight);
        }

        this.onChange = this.onChange.bind(this);
        $(this.editor).on("change", this.onChange);
    };
    
    /**
     * Enable instrumented HTML
     * @param enabled {boolean} 
     */
    HTMLDocument.prototype.setInstrumentationEnabled = function setInstrumentationEnabled(enabled) {
        if (enabled && !this._instrumentationEnabled) {
            HTMLInstrumentation.scanDocument(this.doc);
            HTMLInstrumentation._markText(this.editor);
        }
        
        this._instrumentationEnabled = enabled;
    };
    
    /**
     * Returns a JSON object with HTTP response overrides
     * @returns {{body: string}}
     */
    HTMLDocument.prototype.getResponseData = function getResponseData(enabled) {
        var body;
        if (this._instrumentationEnabled) {
            body = HTMLInstrumentation.generateInstrumentedHTML(this.editor);
        }
        
        return {
            body: body || this.doc.getText()
        };
    };

    /** Close the document */
    HTMLDocument.prototype.close = function close() {
        if (!this.editor) {
            return;
        }

        $(this.editor).off("cursorActivity", this.onCursorActivity);
        $(DocumentManager).off("documentSaved", this.onDocumentSaved);

        // Experimental code
        if (LiveDevelopment.config.experimental) {
            $(HighlightAgent).off("highlight", this.onHighlight);
            this.onHighlight();
        }

        $(this.editor).off("change", this.onChange);
    };
    
    /** Update the highlight */
    HTMLDocument.prototype.updateHighlight = function () {
        var codeMirror = this.editor._codeMirror;
        if (Inspector.config.highlight) {
            var tagID = HTMLInstrumentation._getTagIDAtDocumentPos(
                this.editor,
                codeMirror.getCursor()
            );
            
            if (tagID === -1) {
                HighlightAgent.hide();
            } else {
                HighlightAgent.domElement(tagID);
            }
        }
    };

    /** Event Handlers *******************************************************/

    /** Triggered on cursor activity by the editor */
    HTMLDocument.prototype.onCursorActivity = function onCursorActivity(event, editor) {
        if (!this.editor) {
            return;
        }
        this.updateHighlight();
    };
    
    /**
     * @private
     * For the given editor change, compare the resulting browser DOM with the
     * in-editor DOM. If there are any diffs, a warning is logged to the
     * console along with each diff.
     * @param {Object} change CodeMirror editor change data
     */
    HTMLDocument.prototype._compareWithBrowser = function (change) {
        var self = this;
        
        RemoteAgent.call("getSimpleDOM").done(function (res) {
            var browserSimpleDOM = JSON.parse(res.result.value),
                edits,
                node,
                result;
            
            try {
                result = HTMLInstrumentation._getBrowserDiff(self.editor, browserSimpleDOM);
            } catch (err) {
                console.error("Error comparing in-browser DOM to in-editor DOM");
                console.error(err.stack);
                return;
            }
            
            edits = result.diff.filter(function (delta) {
                // ignore textDelete in html root element
                node = result.browser.nodeMap[delta.parentID];
                
                if (node && node.tag === "html" && delta.type === "textDelete") {
                    return false;
                }
                
                return true;
            });
            
            if (edits.length > 0) {
                console.warn("Browser DOM does not match after change: " + JSON.stringify(change));
                
                edits.forEach(function (delta) {
                    console.log(delta);
                });
            }
        });
    };

    /** Triggered on change by the editor */
    HTMLDocument.prototype.onChange = function onChange(event, editor, change) {
        // Make sure LiveHTML is turned on
        if (!brackets.livehtml || !this._instrumentationEnabled) {
            return;
        }

        // Apply DOM edits is async, so previous PerfUtils timer may still be
        // running. PerfUtils does not support running multiple timers with same
        // name, so do not start another timer in this case.
        var perfTimerName   = "HTMLDocument applyDOMEdits",
            isNestedTimer   = PerfUtils.isActive(perfTimerName);
        if (!isNestedTimer) {
            PerfUtils.markStart(perfTimerName);
        }
        
        // Only handles attribute changes currently.
        // TODO: text changes should be easy to add
        // TODO: if new tags are added, need to instrument them
        var self                = this,
            edits               = HTMLInstrumentation.getUnappliedEditList(editor, change),
            applyEditsPromise   = RemoteAgent.call("applyDOMEdits", edits);

        applyEditsPromise.always(function () {
            if (!isNestedTimer) {
                PerfUtils.addMeasurement(perfTimerName);
            }
        });
        
        // Debug-only: compare in-memory vs. in-browser DOM
        // edit this file or set a conditional breakpoint at the top of this function:
        //     "this._debug = true, false"
        if (this._debug) {
            console.log("Edits applied to browser were:");
            console.log(JSON.stringify(edits, null, 2));
            applyEditsPromise.done(function () {
                self._compareWithBrowser(change);
            });
        }
        
//        var marker = HTMLInstrumentation._getMarkerAtDocumentPos(
//            this.editor,
//            editor.getCursorPos()
//        );
//
//        if (marker && marker.tagID) {
//            var range   = marker.find(),
//                text    = marker.doc.getRange(range.from, range.to);
//
//            // HACK maintain ID
//            text = text.replace(">", " data-brackets-id='" + marker.tagID + "'>");
//
//            // FIXME incorrectly replaces body elements with content only, missing body element
//            RemoteAgent.remoteElement(marker.tagID).replaceWith(text);
//        }

        // if (!this.editor) {
        //     return;
        // }
        // var codeMirror = this.editor._codeMirror;
        // while (change) {
        //     var from = codeMirror.indexFromPos(change.from);
        //     var to = codeMirror.indexFromPos(change.to);
        //     var text = change.text.join("\n");
        //     DOMAgent.applyChange(from, to, text);
        //     change = change.next;
        // }
    };

    /** Triggered by the HighlightAgent to highlight a node in the editor */
    HTMLDocument.prototype.onHighlight = function onHighlight(event, node) {
        if (!node || !node.location || !this.editor) {
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
        this._highlight = codeMirror.markText(from, to, { className: "highlight" });
    };

    /** Triggered when a document is saved */
    HTMLDocument.prototype.onDocumentSaved = function onDocumentSaved(event, doc) {
        if (doc === this.doc) {
            HTMLInstrumentation.scanDocument(this.doc);
            HTMLInstrumentation._markText(this.editor);
        }
    };
    
    // Export the class
    module.exports = HTMLDocument;
});