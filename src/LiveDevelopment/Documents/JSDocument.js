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
/*global define, $, Mustache */

/**
 * JSDocument manages a single JavaScript source document
 *
 * # EDITING
 *
 * Editing the document will cause the script to be reloaded via the
 * ScriptAgent, which updates the implementation of all functions without
 * loosing any state. To support redrawing canvases, jQuery must be loaded
 * and a rerender method must be attached to every canvas that clears and
 * renders the canvas.
 *
 * # HIGHLIGHTING
 *
 * JSDocument supports highlighting nodes from the HighlightAgent. Support
 * for highlighting the nodes that were created / touched by the current
 * line is missing.
 */
define(function JSDocumentModule(require, exports, module) {
    "use strict";

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var LiveDevelopment = require("LiveDevelopment/LiveDevelopment");
    var ScriptAgent = require("LiveDevelopment/Agents/ScriptAgent");
    var HighlightAgent = require("LiveDevelopment/Agents/HighlightAgent");
    var DocumentManager = require("document/DocumentManager");
    var EditorManager = require("editor/EditorManager");
    var JSInstrumentation = require("language/JSInstrumentation");
    var MarkedTextTracker = require("utils/MarkedTextTracker");
    
    var functionUpdateTemplate = Mustache.compile(require("text!language/js-function-update.txt")),
        functionAddTemplate = Mustache.compile(require("text!language/js-function-add.txt"));
    
    var RANGE_MARK_TYPE = "jsFunctionID";

    /** Constructor
     *
     * @param {Document} the source document
     */
    var JSDocument = function JSDocument(doc, editor) {
        this.doc = doc;
        this._instrumentationEnabled = false;
        this._instrumentedText = null;
        this._nextFunctionId = 0;

        this.onHighlight = this.onHighlight.bind(this);
        this.onActiveEditorChange = this.onActiveEditorChange.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDocumentSaved = this.onDocumentSaved.bind(this);

        $(EditorManager).on("activeEditorChange", this.onActiveEditorChange);
        this.onActiveEditorChange(null, editor);

        if (LiveDevelopment.config.experimental) {
            $(HighlightAgent).on("highlight", this.onHighlight);
        }
    };
    
    /**
     * Instrument the current document and cache the instrumented text.
     */
    JSDocument.prototype._reinstrument = function () {
        var ranges = [],
            result = JSInstrumentation.instrument(this.doc.getText(), ranges);
        // If we couldn't instrument it because it was invalid, just keep whatever we had
        // before.
        if (result) {
            this._instrumentedText = result.instrumented;
            this._nextFunctionId = result.nextId;
            if (this.editor) {
                MarkedTextTracker.markText(this.editor, ranges, RANGE_MARK_TYPE);
            }
        }
    };

    /**
     * Enable instrumented HTML
     * @param enabled {boolean} 
     */
    JSDocument.prototype.setInstrumentationEnabled = function setInstrumentationEnabled(enabled) {
        if (enabled && !this._instrumentationEnabled) {
            this._reinstrument();
        }
        
        this._instrumentationEnabled = enabled;
    };
    
    /**
     * Returns a JSON object with HTTP response overrides
     * @returns {{body: string}}
     */
    JSDocument.prototype.getResponseData = function getResponseData(enabled) {
        var body = (this._instrumentationEnabled && this._instrumentedText) ? this._instrumentedText : this.doc.getText();
        return {
            body: body
        };
    };

    /** Close the document */
    JSDocument.prototype.close = function close() {
        $(EditorManager).off("activeEditorChange", this.onActiveEditorChange);

        if (this.editor) {
            $(this.editor).off("change", this.onChange);
            $(DocumentManager).off("documentSaved", this.onDocumentSaved);
        }
        
        if (LiveDevelopment.config.experimental) {
            $(HighlightAgent).off("highlight", this.onHighlight);
            this.onHighlight();
        }
    };

//    JSDocument.prototype.script = function script() {
//        return ScriptAgent.scriptForURL(this.doc.url);
//    };


    /** Event Handlers *******************************************************/

    /** Triggered when the current editor changes. */
    JSDocument.prototype.onActiveEditorChange = function (event, editor) {
        if (this.editor) {
            $(this.editor).off("change", this.onChange);
            $(DocumentManager).off("documentSaved", this.onDocumentSaved);
        }
        if (editor && (editor.document === this.doc)) {
            this.editor = editor;
            $(this.editor).on("change", this.onChange);
            $(DocumentManager).on("documentSaved", this.onDocumentSaved);
            this._reinstrument();
        }
    };
    
    /** Triggered on change by the editor */
    // TODO: this is really fragile. As Peter F suggested, maybe we should make
    // it more manual. Highlight stuff that hasn't been pushed to the browser yet,
    // and give the user simple ways to push it (add function, eval in existing closure).
    JSDocument.prototype.onChange = function onChange(event, editor, change) {
        var self = this;
        
        function offsetPos(outerPos, innerPos) {
            return {
                line: outerPos.line + innerPos.line,
                ch: (innerPos.line === 0 ? outerPos.ch + innerPos.ch : innerPos.ch)
            };
        }
        
        if (this._instrumentationEnabled) {
            if (!this._instrumentedText) {
                // The script must have been invalid the first time we loaded, so just instrument it and
                // push it.
                this._reinstrument();
                if (this._instrumentedText) {
                    Inspector.Runtime.evaluate(this._instrumentedText);
                }
            } else {
                // Update all surrounding functions with their new definitions. (We can't just do the outermost one
                // because existing instances of inner functions need to be updated as well.)
                // TODO: not correct to use cursor pos, should look at the change record to figure out what to invalidate
                var ranges = MarkedTextTracker.getRangesAtDocumentPos(editor, editor.getCursorPos(), RANGE_MARK_TYPE);
                ranges.forEach(function (range) {
                    var fnSrc = editor._codeMirror.getRange(range.start, range.end),
                        fnBody = JSInstrumentation.getFunctionBody(fnSrc);
                    if (fnBody) {
                        // We have to pass the whole function to `instrument` in order for it to parse correctly (otherwise
                        // return statements will break the parse). But we pass a flag telling it not to actually instrument
                        // the outermost function.
                        // TODO: this reinstrumentation will only be correct if all the newly reinstrumented IDs
                        // happen to line up with the existing IDs. It will fail if you add new functions in the middle,
                        // remove functions, etc.
                        var subRanges = [],
                            subInstrResult = JSInstrumentation.instrumentFunction(fnSrc, subRanges, null, null, range.data, true);
                        if (subInstrResult) {
                            var changedFunction = functionUpdateTemplate({
                                id: range.data,
                                escapedBody: JSInstrumentation.escapeJS(subInstrResult.instrumented)
                            });
                            console.log(">>> CHANGED FUNCTION\n" + changedFunction);
                            Inspector.Runtime.evaluate(changedFunction);
    
                            // If new (unmarked) functions were added within this function, add them to the closure
                            // context for that function, so they'll be picked up by existing inner closures next time they 
                            // run.
                            // We detect these by reinstrumenting the updated function in order to find the offsets of
                            // all functions, and then seeing which ones are already marked. (We ignore the actual
                            // IDs at this step since we're going to reinstrument the new functions separately anyway.)
                            // TODO: removed functions; adding/removing vars; new imperative code
                            
                            subRanges.forEach(function (subRange) {
                                // TODO: skip further-nested subranges.
                                // Subranges are relative to the original range, so we need to fix up the offsets when looking up marks.
                                var subRangeStart = offsetPos(range.start, subRange.start),
                                    subRangeEnd = offsetPos(range.start, subRange.end),
                                    childRanges = [],
                                    checkPos = {line: subRangeStart.line, ch: subRangeStart.ch + 1}, // offset by 1 so we're inside the range
                                    surroundingRanges = MarkedTextTracker.getRangesAtDocumentPos(editor, checkPos, RANGE_MARK_TYPE);
                                // If the innermost range is the same as our current range, then this must be a new uninstrumented function.
                                // Instrument it and add it to the current range's scope.
                                if (surroundingRanges.length &&
                                        surroundingRanges[0].start.line === range.start.line &&
                                        surroundingRanges[0].start.ch === range.start.ch) {
                                    var newFunctionInstr = JSInstrumentation.instrumentFunction(
                                        editor._codeMirror.getRange(subRangeStart, subRangeEnd),
                                        childRanges,
                                        null,
                                        range.data, // parent id is the surrounding range
                                        self._nextFunctionId
                                    );
                                    
                                    // Mark the newly instrumented function in the editor.
                                    MarkedTextTracker.markText(editor, childRanges, RANGE_MARK_TYPE, false);
                                    
                                    // Push the new function definition to the browser in the correct scope.
                                    // TODO: is it possible for name to be null? Seems like it would be a syntax error, since
                                    // function expressions shouldn't be legal at the top level here.
                                    var addedFunction = functionAddTemplate({
                                        name: newFunctionInstr.name,
                                        parentId: range.data,
                                        escapedDef: JSInstrumentation.escapeJS(newFunctionInstr.instrumented)
                                    });
                                    console.log(">>> ADDED FUNCTION\n" + addedFunction);
                                    Inspector.Runtime.evaluate(addedFunction);
                                    
                                    self._nextFunctionId = newFunctionInstr.nextId;
                                }
                            });
                        }
                    }
                });
            }
        }

// Old way
//        var src = this.doc.getText();
//        Inspector.Debugger.setScriptSource(this.script().scriptId, src, function onSetScriptSource(res) {
//            Inspector.Runtime.evaluate("if($)$(\"canvas\").each(function(i,e){if(e.rerender)e.rerender()})");
//        }.bind(this));
    };

    /** Triggered by the HighlightAgent to highlight a node in the editor */
    JSDocument.prototype.onHighlight = function onHighlight(event, node) {
        // clear an existing highlight
        var codeMirror = this.editor._codeMirror;
        var i;
        for (i in this._highlight) {
            codeMirror.removeLineClass(this._highlight[i], "wrap", "highlight");
        }
        this._highlight = [];
        if (!node || !node.trace) {
            return;
        }

        // go through the trace and find highlight the lines of this script
        var scriptId = this.script().scriptId;
        var callFrame, line;
        for (i in node.trace) {
            callFrame = node.trace[i];
            if (callFrame.location && callFrame.location.scriptId === scriptId) {
                line = callFrame.location.lineNumber;
                codeMirror.addLineClass(line, "wrap", "highlight");
                this._highlight.push(line);
            }
        }
    };

    /** Triggered when a document is saved */
    JSDocument.prototype.onDocumentSaved = function onDocumentSaved(event, doc) {
        if (doc === this.doc) {
            this._reinstrument();
        }
    };

    // Export the class
    module.exports = JSDocument;
});