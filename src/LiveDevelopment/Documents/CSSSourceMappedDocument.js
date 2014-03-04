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
/*global define, $, CodeMirror */

/**
 * 
 */
define(function (require, exports, module) {
    "use strict";

    var CSSAgent            = require("LiveDevelopment/Agents/CSSAgent"),
        CSSUtils            = require("language/CSSUtils"),
        EditorManager       = require("editor/EditorManager"),
        FileUtils           = require("file/FileUtils"),
        FileSystem          = require("filesystem/FileSystem"),
        HighlightAgent      = require("LiveDevelopment/Agents/HighlightAgent"),
        Inspector           = require("LiveDevelopment/Inspector/Inspector"),
        SourceMapConsumer   = require("thirdparty/source-map/lib/source-map/source-map-consumer").SourceMapConsumer;

    function CSSSourceMappedDocument(doc, editor) {
        this.doc = doc;
        this.onCursorActivity = this.onCursorActivity.bind(this);

        // Add a ref to the doc since we're listening for change events
        this.doc.addRef();
        
        this.onActiveEditorChange = this.onActiveEditorChange.bind(this);
        $(EditorManager).on("activeEditorChange", this.onActiveEditorChange);
        
        if (editor) {
            // Attach now
            this.attachToEditor(editor);
        }
    }
 
    /** Close the document */
    CSSSourceMappedDocument.prototype.close = function close() {
        $(this.doc).off(".CSSSourceMappedDocument");
        $(EditorManager).off("activeEditorChange", this.onActiveEditorChange);
        this.doc.releaseRef();
        this.detachFromEditor();
    };

    CSSSourceMappedDocument.prototype.attachToEditor = function (editor) {
        this.editor = editor;
        
        if (this.editor) {
            $(this.editor).on("cursorActivity.CSSSourceMappedDocument", this.onCursorActivity);
            this.updateHighlight();
        }
    };
    
    CSSSourceMappedDocument.prototype.detachFromEditor = function () {
        if (this.editor) {
            HighlightAgent.hide();
            $(this.editor).off(".CSSSourceMappedDocument");
            this.editor = null;
        }
    };

    CSSSourceMappedDocument.prototype.updateHighlight = function () {
        var self = this;

        if (!Inspector.config.highlight || !self.editor) {
            return;
        }
        
        // One preprocessed CSS file may be shared in multiple generated files
        var sourceMaps = CSSAgent.styleForURL(self.doc.url);

        if (!sourceMaps) {
            return;
        }

        var cursorPos = self.editor.getCursorPos(),
            selector,
            codeMirror,
            cmPos;
        
        // FIXME async iterate over source maps until we find a selector
        sourceMaps.some(function (sourceMap) {
            var generatedFile = sourceMap.file,
                relativePathToSource = self.doc.file.fullPath.slice(generatedFile.parentPath.length),
                sourcePos = { source: relativePathToSource, line: cursorPos.line + 1, column: cursorPos.ch },
                generatedPosition = sourceMap.generatedPositionFor(sourcePos);
            
            if (!generatedPosition || generatedPosition.line === null || generatedPosition.column === null) {
                return false;
            }
            
            // FIXME open the generated file in the working set?
            // Create a temporary CM instance
            codeMirror = new CodeMirror(window.document.createElement());
            
            // Convert 1-based line to 0-based
            cmPos = { line: generatedPosition.line - 1, ch: generatedPosition.column};

            // Read the generated file
            FileUtils.readAsText(generatedFile).done(function (text) {
                codeMirror.setValue(text);
                selector = CSSUtils.findSelectorAtDocumentPos(codeMirror, cmPos);

                if (selector) {
                    HighlightAgent.rule(selector);
                } else {
                    HighlightAgent.hide();
                }
            });

            // FIXME async iterate over source maps
            return true;
        });
    };
    
    /**
     * Enable instrumented CSS
     * @param enabled {boolean} 
     */
    CSSSourceMappedDocument.prototype.setInstrumentationEnabled = function setInstrumentationEnabled(enabled) {
        // no-op
        // "Instrumentation" is always enabled for CSS, we make no modifications
    };
    
    /**
     * Returns true if document edits appear live in the connected browser
     * @return {boolean} 
     */
    CSSSourceMappedDocument.prototype.isLiveEditingEnabled = function () {
        return false;
    };

    /** Event Handlers *******************************************************/

    /** Triggered on cursor activity of the editor */
    CSSSourceMappedDocument.prototype.onCursorActivity = function onCursorActivity(event, editor) {
        this.updateHighlight();
    };

    /** Triggered when the active editor changes */
    CSSSourceMappedDocument.prototype.onActiveEditorChange = function (event, newActive, oldActive) {
        this.detachFromEditor();
        
        if (newActive && newActive.document === this.doc) {
            this.attachToEditor(newActive);
        }
    };

    // Export the class
    module.exports = CSSSourceMappedDocument;
});