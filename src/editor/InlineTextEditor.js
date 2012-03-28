/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        InlineEditor        = require("editor/InlineEditor").InlineEditor;

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
        var $dirtyIndicators = $(".inlineEditor .dirty-indicator"),
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
        InlineEditor.call(this);
        this._docRangeToEditorMap = {};
        this.editors = [];
    }
    InlineTextEditor.prototype = new InlineEditor();
    InlineTextEditor.prototype.constructor = InlineTextEditor;
    InlineTextEditor.prototype.editors = null;

   /**
     * Given a host editor and its inline editors, find the widest gutter and make all the others match
     * @param {!Editor} hostEditor Host editor containing all the inline editors to sync
     * @private
     */
    function _syncGutterWidths(hostEditor) {
        var inlines = EditorManager.getInlineEditors(hostEditor),
            allHostedEditors = [];
        
        // add all Editor instances of each InlineTextEditor
        inlines.forEach(function (inline) {
            if (inline instanceof InlineTextEditor) {
                Array.push.apply(allHostedEditors, inline.editors);
            }
        });
        
        // add the host to the list and go through them all
        allHostedEditors.push(hostEditor);
        
        var maxWidth = 0;
        allHostedEditors.forEach(function (editor) {
            var gutter = $(editor._codeMirror.getGutterElement());
            gutter.css("min-width", "");
            var curWidth = gutter.width();
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
     * Called any time inline was closed, whether manually (via closeThisInline()) or automatically
     */
    InlineTextEditor.prototype.onClosed = function () {
        _syncGutterWidths(this.hostEditor);
        
        this.editors.forEach(function (editor) {
            editor.destroy(); //release ref on Document
        });
    };
    
    /**
     * Update the inline editor's height when the number of lines change
     */
    InlineTextEditor.prototype.sizeInlineEditorToContents = function (force) {
        var i,
            len = this.editors.length,
            editor;
        
        for (i = 0; i < len; i++) {
            editor = this.editors[i];
            
            if (editor.isFullyVisible()) {
                // set inner editor height
                var editorHeight = editor.totalHeight(true);
                if (force || editorHeight !== this._editorHeight) {
                    this._editorHeight = editorHeight;
                    $(editor.getScrollerElement()).height(editorHeight);
                    editor.refresh();
                }
                
                // use outermost wrapper (htmlContent) scrollHeight to prop open the host editor
                this.height = this.htmlContent.scrollHeight;
                this.hostEditor.setInlineWidgetHeight(this.inlineId, this.height, true);
                
                break; // there should only be 1 visible editor
            }
        }
    };

    /**
     * Some tasks have to wait until we've been parented into the outer editor
     * @param {string} the inline ID that is generated by CodeMirror after the widget that holds the inline
     *  editor is constructed and added to the DOM
     */
    InlineTextEditor.prototype.onAdded = function (inlineId) {
        this.inlineId = inlineId;
        
        this.editors.forEach(function (editor) {
            editor.refresh();
        });
        
        _syncGutterWidths(this.hostEditor);
        
        // Set initial size
        this.sizeInlineEditorToContents();
        
        this.editors[0].focus();
    };

    /**
     *
     * @param {Document} doc
     * @param {number} startLine of text to show in inline editor
     * @param {number} endLine of text to show in inline editor
     * @param {HTMLDivElement} container container to hold the inline editor
     */
    InlineTextEditor.prototype.createInlineEditorFromText = function (doc, startLine, endLine, container) {
        var self = this;
        
        var range = {
            startLine: startLine,
            endLine: endLine
        };
        
        // close handler attached to each inline codemirror instance
        // TODO (jasonsj): make this a global command
        function closeThisInline(editor) {
            var shouldMoveFocus = editor.hasFocus();
            EditorManager.closeInlineWidget(self.hostEditor, self.inlineId, shouldMoveFocus);
        }
        
        // create the filename div
        var wrapperDiv = document.createElement("div");
        var $wrapperDiv = $(wrapperDiv);
        container.appendChild(wrapperDiv);
        
        // dirty indicator followed by filename
        var $filenameDiv = $(document.createElement("div")).addClass("filename");
        
        // save file path data to dirty-indicator
        var $dirtyIndicatorDiv = $(document.createElement("div"))
            .addClass("dirty-indicator")
            .width(4); // initialize indicator as hidden
        $dirtyIndicatorDiv.data("fullPath", doc.file.fullPath);
        
        $filenameDiv.append($dirtyIndicatorDiv);
        $dirtyIndicatorDiv.after(doc.file.name + ":" + (startLine + 1));
        $wrapperDiv.append($filenameDiv);
        
        var inlineInfo = EditorManager.createInlineEditorForDocument(doc, range, wrapperDiv, closeThisInline);
        this.editors.push(inlineInfo.editor);

        // Size editor to current content
        $(inlineInfo.editor).on("change", function () {
            self.sizeInlineEditorToContents();
        });

        // update the current inline editor immediately
        // use setTimeout to allow filenameDiv to render first
        setTimeout(function () {
            _showDirtyIndicator($dirtyIndicatorDiv, doc.isDirty);
        }, 0);
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
        // isFullyVisible() check in sizeInlineEditorToContents()).
        this.sizeInlineEditorToContents(true);
    };
    
    // consolidate all dirty document updates
    $(DocumentManager).on("dirtyFlagChange", _dirtyFlagChangeHandler);

    exports.InlineTextEditor = InlineTextEditor;

});
