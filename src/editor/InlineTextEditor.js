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


// FUTURE: Merge part (or all) of this class with MultiRangeInlineEditor
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, window */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        InlineWidget        = require("editor/InlineWidget").InlineWidget;

    /**
     * Returns editor holder width (not CodeMirror's width).
     * @private
     */
    function _editorHolderWidth() {
        return $("#editorHolder").width();
    }

    /**
     * Shows or hides the dirty indicator
     * @private
     */
    function _showDirtyIndicator($indicatorDiv, isDirty) {
        // Show or hide the dirty indicator by adjusting
        // the width of the div.
        $indicatorDiv.css("width", isDirty ? 16 : 0);
    }
    
    /**
     * Respond to dirty flag change event. If the dirty flag is associated with an inline editor,
     * show (or hide) the dirty indicator.
     * @private
     */
    function _dirtyFlagChangeHandler(event, doc) {
        var $dirtyIndicators = $(".inlineEditorHolder .dirty-indicator"),
            $indicator;
        
        $.each($dirtyIndicators, function (index, indicator) {
            $indicator = $(indicator);
            if ($indicator.data("fullPath") === doc.file.fullPath) {
                _showDirtyIndicator($indicator, doc.isDirty);
            }
        });
    }
    
    /**
     * @constructor
     *
     */
    function InlineTextEditor() {
        InlineWidget.call(this);

        /* @type {Array.<{Editor}>}*/
        this.editors = [];
    }
    InlineTextEditor.prototype = new InlineWidget();
    InlineTextEditor.prototype.constructor = InlineTextEditor;
    InlineTextEditor.prototype.parentClass = InlineWidget.prototype;
    
    InlineTextEditor.prototype.editors = null;

   /**
     * Given a host editor and its inline editors, find the widest gutter and make all the others match
     * @param {!Editor} hostEditor Host editor containing all the inline editors to sync
     * @private
     */
    function _syncGutterWidths(hostEditor) {
        var allHostedEditors = EditorManager.getInlineEditors(hostEditor);
        
        // add the host itself to the list too
        allHostedEditors.push(hostEditor);
        
        var maxWidth = 0;
        allHostedEditors.forEach(function (editor) {
            var $gutter = $(editor._codeMirror.getGutterElement());
            $gutter.css("min-width", "");
            var curWidth = $gutter.width();
            if (curWidth > maxWidth) {
                maxWidth = curWidth;
            }
        });
        
        if (allHostedEditors.length === 1) {
            //There's only the host, just bail
            allHostedEditors[0]._codeMirror.setOption("gutter", true);
            return;
        }
        
        maxWidth = maxWidth + "px";
        allHostedEditors.forEach(function (editor) {
            $(editor._codeMirror.getGutterElement()).css("min-width", maxWidth);
            editor._codeMirror.setOption("gutter", true);
        });
    }

    /**
     * Called any time inline was closed, whether manually (via close()) or automatically
     */
    InlineTextEditor.prototype.onClosed = function () {
        _syncGutterWidths(this.hostEditor);
        
        this.editors.forEach(function (editor) {
            editor.destroy(); //release ref on Document
        });
    };
    
    /**
     * Update the inline editor's height when the number of lines change
     * @param {boolean} force the editor to resize
     */
    InlineTextEditor.prototype.sizeInlineWidgetToContents = function (force) {
        var i,
            len = this.editors.length,
            editor;
        
        // TODO: only handles 1 editor right now. Add multiple editor support when
        // the design is finalized

        // Reize the editors to the content
        for (i = 0; i < len; i++) {
            // Only supports 1 editor right now
            if (i === 1) {
                break;
            }
            
            editor = this.editors[i];
            
            if (editor.isFullyVisible()) {
                var height = editor.totalHeight(true);
                if (force || height !== this.height) {
                    $(editor.getScrollerElement()).height(height);
                    this.height = height;
                    editor.refresh();
                }
            }
        }
    };

    /**
     * Some tasks have to wait until we've been parented into the outer editor
     * @param {string} the inline ID that is generated by CodeMirror after the widget that holds the inline
     *  editor is constructed and added to the DOM
     */
    InlineTextEditor.prototype.onAdded = function () {
        this.editors.forEach(function (editor) {
            editor.refresh();
        });
        
        _syncGutterWidths(this.hostEditor);
        
        // Set initial size
        // Note that the second argument here (ensureVisibility) is only used by CSSInlineEditor.
        // FUTURE: Should clean up this API so it's consistent between the two.
        this.sizeInlineWidgetToContents(true, true);
        
        this.editors[0].focus();
    };

    /**
     *
     * @param {Document} doc
     * @param {number} startLine of text to show in inline editor
     * @param {number} endLine of text to show in inline editor
     * @param {HTMLDivElement} container container to hold the inline editor
     */
    InlineTextEditor.prototype.createInlineEditorFromText = function (doc, startLine, endLine, container, additionalKeys) {
        var self = this;
        
        var range = {
            startLine: startLine,
            endLine: endLine
        };
        
        // close handler attached to each inline codemirror instance
        function closeThisInline() {
            self.close();
        }
        
        // create the filename div
        var wrapperDiv = window.document.createElement("div");
        var $wrapperDiv = $(wrapperDiv);
        
        // dirty indicator followed by filename
        var $filenameDiv = $(window.document.createElement("div")).addClass("filename");
        
        // save file path data to dirty-indicator
        var $dirtyIndicatorDiv = $(window.document.createElement("div"))
            .addClass("dirty-indicator")
            .width(0); // initialize indicator as hidden
        $dirtyIndicatorDiv.data("fullPath", doc.file.fullPath);
        
        var $nameWithTooltip = $("<span></span>").text(doc.file.name).attr("title", doc.file.fullPath);
        var $lineNumber = $("<span class='lineNumber'>" + (startLine + 1) + "</span>");

        $filenameDiv.append($dirtyIndicatorDiv)
            .append($nameWithTooltip)
            .append(" : ")
            .append($lineNumber);
        $wrapperDiv.append($filenameDiv);

        var inlineInfo = EditorManager.createInlineEditorForDocument(doc, range, wrapperDiv, closeThisInline, additionalKeys);
        this.editors.push(inlineInfo.editor);
        container.appendChild(wrapperDiv);

        // Size editor to content whenever it changes (via edits here or any other view of the doc)
        $(inlineInfo.editor).on("change", function () {
            self.sizeInlineWidgetToContents();
            
            // And update line number since a change to the Editor equals a change to the Document,
            // which may mean a change to the line range too
            $lineNumber.text(inlineInfo.editor.getFirstVisibleLine() + 1);
        });
        
        // If Document's file is deleted, or Editor loses sync with Document, just close
        $(inlineInfo.editor).on("lostContent", function () {
            // Note: this closes the entire inline widget if any one Editor loses sync. This seems
            // better than leaving it open but suddenly removing one rule from the result list.
            self.close();
        });
        
        // set dirty indicator state
        _showDirtyIndicator($dirtyIndicatorDiv, doc.isDirty);
    };

    /**
     * @param {Editor} hostEditor
     */
    InlineTextEditor.prototype.load = function (hostEditor) {
        this.hostEditor = hostEditor;

        // TODO: incomplete impelementation. It's not clear yet if InlineTextEditor
        // will fuction as an abstract class or as generic inline editor implementation
        // that just shows a range of text. See CSSInlineEditor.css for an implementation of load()
    };

    /**
     * Called when the editor containing the inline is made visible.
     */
    InlineTextEditor.prototype.onParentShown = function () {
        // We need to call this explicitly whenever the host editor is reshown, since
        // we don't actually resize the inline editor while its host is invisible (see
        // isFullyVisible() check in sizeInlineWidgetToContents()).
        this.sizeInlineWidgetToContents(true);
    };
    
    InlineTextEditor.prototype._editorHasFocus = function () {
        return this.editors.some(function (editor) {
            return editor.hasFocus();
        });
    };
    
    /** Closes this inline widget and all its contained Editors */
    InlineTextEditor.prototype.close = function () {
        var shouldMoveFocus = this._editorHasFocus();
        EditorManager.closeInlineWidget(this.hostEditor, this, shouldMoveFocus);
        // closeInlineWidget() causes our onClosed() to be called
    };
        
    
    // consolidate all dirty document updates
    $(DocumentManager).on("dirtyFlagChange", _dirtyFlagChangeHandler);

    exports.InlineTextEditor = InlineTextEditor;

});
