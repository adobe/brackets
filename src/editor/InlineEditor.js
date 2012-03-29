/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var HTMLUtils           = require("language/HTMLUtils"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        CSSInlineEditor     = require("editor/CSSInlineEditor");


    // track divs to re-position manually
    var _inlineEditorContentList   = [];
    
    /**
     * Returns editor holder width (not CodeMirror's width).
     * @private
     */
    function _editorHolderWidth() {
        return $("#editorHolder").width();
    }
    
    /**
     * Reposition a .inlineCodeEditor .filename div { right: 20px; }
     * @private
     */
    function _updateInlineEditorFilename(holderWidth, filenameDiv) {
        var filenameWidth = $(filenameDiv).outerWidth();
        $(filenameDiv).css("left", holderWidth - filenameWidth - 40);
    }
    
    /**
     * Reposition all filename divs after a window resize.
     * @private
     */
    function _updateAllFilenames() {
        var holderWidth = _editorHolderWidth();
        
        _inlineEditorContentList.forEach(function (value) {
            var filenameDiv = $(value).find(".filename");
            _updateInlineEditorFilename(holderWidth, filenameDiv);
        });
    }

    /**
     * Shows or hides the dirty indicator
     * @private
     */
    function _showDirtyIndicator($indicatorDiv, isDirty) {
        // Show or hide the dirty indicator by adjusting
        // the width of the div. The "hidden" width is 
        // 4 pixels to make the padding look correct.
        $indicatorDiv.css("width", isDirty ? 16 : 4);
    }
    
    /**
     * Respond to dirty flag change event. If the dirty flag is associated with an inline editor,
     * show (or hide) the dirty indicator.
     * @private
     */
    function _dirtyFlagChangeHandler(event, doc) {
        
        _inlineEditorContentList.forEach(function (value) {
            var $filenameDiv = $(value).find(".filename");
            // This only checks filename here. If there are multiple documents with the same filename
            // (in different directories), this test will fail.
            // TODO: This needs to be fixed by connecting this method with a specific inline editor's state
            if ($filenameDiv.text() === doc.file.name) {
                _showDirtyIndicator($filenameDiv.find(".dirty-indicator"), doc.isDirty);
            }
        });
    }

    /**
     * Adds the html content for an InlineEditor to _inlineEditorContentList. The list is used to 
     * update file names and manage the dirty indicator
     * @param {HTMLDivElement}
     */
    function _addInlineEditorContent(content) {
        _inlineEditorContentList.push(content);
        
        // Manually position filename div's. Can't use CSS positioning in this case
        // since the label is relative to the window boundary, not CodeMirror.
        if (_inlineEditorContentList.length > 0) {
            $(window).on("resize", _updateAllFilenames);
            $(DocumentManager).on("dirtyFlagChange", _dirtyFlagChangeHandler);
        }
    }
    
    /**
     * Stops tracking an editor after being removed from the document.
     * @private
     */
    function _inlineEditorRemoved(inlineContent) {
        var indexOf = _inlineEditorContentList.indexOf(inlineContent);
        
        if (indexOf >= 0) {
            _inlineEditorContentList.splice(indexOf, 1);
        }
        
        // stop listening for resize when all inline editors are closed
        if (_inlineEditorContentList.length === 0) {
            $(window).off("resize", _updateAllFilenames);
            $(DocumentManager).off("dirtyFlagChange", _dirtyFlagChangeHandler);
        }
    }

   /**
     * Given a host editor and its inline editors, find the widest gutter and make all the others match
     * @param {!Editor} hostEditor Host editor containing all the inline editors to sync
     * @private
     */
    function _syncGutterWidths(hostEditor) {
        var editors = EditorManager.getInlineEditors(hostEditor);
        // add the host to the list and go through them all
        editors.push(hostEditor);
        
        var maxWidth = 0;
        editors.forEach(function (editor) {
            var gutter = $(editor._codeMirror.getGutterElement());
            gutter.css("min-width", "");
            var curWidth = gutter.width();
            if (curWidth > maxWidth) {
                maxWidth = curWidth;
            }
        });
        
        if (editors.length === 1) {
            //There's only the host, just bail
            editors[0]._codeMirror.setOption("gutter", true);
            return;
        }
        
        maxWidth = maxWidth + "px";
        editors.forEach(function (editor) {
            $(editor._codeMirror.getGutterElement()).css("min-width", maxWidth);
            editor._codeMirror.setOption("gutter", true);
        });
    }

    /**
     * @constructor
     *
     */
    function InlineEditor() {
    }
    InlineEditor.prototype.htmlContent = null;
    InlineEditor.prototype.editor = null;
    InlineEditor.prototype.height = 0;
    InlineEditor.prototype.inlineId = null;
    InlineEditor.prototype.hostEditor = null;

    /**
     * Called any time inline was closed, whether manually (via close()) or automatically
     */
    InlineEditor.prototype.onClosed = function () {
        _syncGutterWidths(this.hostEditor);
        _inlineEditorRemoved(this.htmlContent);
        this.editor.destroy(); //release ref on Document
    };
    
    /**
     * Update the inline editor's height when the number of lines change
     */
    InlineEditor.prototype.sizeInlineEditorToContents = function (force) {
        if (this.editor.isFullyVisible()) {
            var height = this.editor.totalHeight(true);
            if (force || height !== this.height) {
                this.height = height;
                this.hostEditor.setInlineWidgetHeight(this.inlineId, height, true);
                $(this.editor.getScrollerElement()).height(height);
                this.editor.refresh();
            }
        }
    };

    /**
     * Some tasks have to wait until we've been parented into the outer editor
     * @param {string} the inline ID that is generated by CodeMirror after the widget that holds the inline
     *  editor is constructed and added to the DOM
     */
    InlineEditor.prototype.onAdded = function (inlineId) {
        this.inlineId = inlineId;
        
        this.editor.refresh();
        _syncGutterWidths(this.hostEditor);
        
        // Set initial size
        this.sizeInlineEditorToContents();
        
        this.editor.focus();
    };

    /**
     *
     * @param {Document} doc
     * @param {number} startLine of text to show in inline editor
     * @param {number} endLine of text to show in inline editor
     * @param {HTMLDivElement} htmlContent container to hold the inline editor
     */
    InlineEditor.prototype.createInlineEditorFromText = function (doc, startLine, endLine, htmlContent) {
        var self = this;

        var range = {
            startLine: startLine,
            endLine: endLine
        };
        var inlineInfo = EditorManager.createInlineEditorForDocument(doc, range, htmlContent, function () {
            self.close();
        });

        this.htmlContent = inlineInfo.content;
        this.editor = inlineInfo.editor;

        // Size editor to content whenever it changes (via edits here or any other view of the doc)
        $(this.editor).on("change", function () {
            self.sizeInlineEditorToContents();
        });
        
        // If Document's file is deleted, or Editor loses sync with Document, just close
        $(this.editor).on("lostContent", function () {
            self.close();
        });

        this.createInlineEditorDecorations(this.editor, doc);
        _addInlineEditorContent(this.htmlContent);
    };

    /**
     * @param {Editor} hostEditor
     */
    InlineEditor.prototype.load = function (hostEditor) {
        this.hostEditor = hostEditor;

        // TODO: incomplete impelementation. It's not clear yet if InlineEditor
        // will fuction as an abstract class or as generic inline editor implementation
        // that just shows a range of text. See CSSInlineEditor.css for an implementation of load()
    };
    

    /**
     * Called when the editor containing the inline is made visible.
     */
    InlineEditor.prototype.onParentShown = function () {
        // We need to call this explicitly whenever the host editor is reshown, since
        // we don't actually resize the inline editor while its host is invisible (see
        // isFullyVisible() check in sizeInlineEditorToContents()).
        this.sizeInlineEditorToContents(true);
    };


    /**
     * TODO (jasonsj): global command
     * Used to manually trigger closing this inline
     */

    InlineEditor.prototype.close = function (inlineEditor) {
        var shouldMoveFocus = this.editor.hasFocus();
        EditorManager.closeInlineWidget(this.hostEditor, this.inlineId, shouldMoveFocus);
        // closeInlineWidget() causes afterClosed() to get run
    };

    /**
     * Create the shadowing and filename tab for an inline editor.
     */
    InlineEditor.prototype.createInlineEditorDecorations = function (editor, doc) {
        // create the filename div
        var filenameDiv = $('<div class="filename" style="visibility: hidden"/>')
            .append('<div class="dirty-indicator"/>')
            .append(doc.file.name);
        
        $(editor.getScrollerElement())
            .append(filenameDiv);

        // update the current inline editor immediately
        // use setTimeout to allow filenameDiv to render first
        setTimeout(function () {
            _updateInlineEditorFilename(_editorHolderWidth(), filenameDiv);
            _showDirtyIndicator(filenameDiv.find(".dirty-indicator"), doc.isDirty);
            filenameDiv.css("visibility", "");
        }, 0);
    };

    exports.InlineEditor = InlineEditor;

});
