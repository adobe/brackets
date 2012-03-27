/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';


    // Load dependent modules
    var EditorManager       = require("editor/EditorManager");

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

    // TY TODO: do this another way?
    // Update the inline editor's height when the number of lines change
    InlineEditor.prototype.prevHeight = 0;

    /**
     * @private
     * Given a host editor and its inline editors, find the widest gutter and make all the others match
     * @param {!Editor} hostEditor Host editor containing all the inline editors to sync
     */
    InlineEditor.prototype.syncGutterWidths = function () {
        var editors = EditorManager.getInlineEditors(this.hostEditor);
        // add the host to the list and go through them all
        editors.push(this.hostEditor);
        
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
    };

    // Called any time inline was closed, whether manually (via closeThisInline()) or automatically
    InlineEditor.prototype.onClosed = function () {
        this.syncGutterWidths();
        this.editor.destroy(); //release ref on Document
    };

    // Some tasks have to wait until we've been parented into the outer editor
    InlineEditor.prototype.onAdded = function (inlineId) {
        this.inlineId = inlineId;
            
        this.syncGutterWidths();
        
        // Set initial size
        this.sizeInlineEditorToContents();
        
        this.editor.focus();
    };
    InlineEditor.prototype.load = function () {};

    // Called when the editor containing the inline is made visible.
    InlineEditor.prototype.afterParentShown = function () {
            sizeInlineEditorToContents(true);
    };

    // Update the inline editor's height when the number of lines change
    InlineEditor.prototype.sizeInlineEditorToContents = function (force) {
        if ($(this.editor._codeMirror.getWrapperElement()).is(":visible")) {
            var height = this.editor.totalHeight(true);
            if (force || height !== this.prevHeight) {
                this.prevHeight = height;
                this.hostEditor.setInlineWidgetHeight(this.inlineId, height, true);
                $(this.editor.getScrollerElement()).height(height);
                this.editor.refresh();
            }
        }
    }

    // TODO (jasonsj): global command
    // Used to manually trigger closing this inline
    InlineEditor.prototype.closeEditor = function (inlineEditor) {
        var shouldMoveFocus = this.editor.hasFocus();
        EditorManager.closeInlineWidget(this.hostEditor, this.inlineId, shouldMoveFocus);
        // closeInlineWidget() causes afterClosed() to get run
    }

    exports.InlineEditor = InlineEditor;

});