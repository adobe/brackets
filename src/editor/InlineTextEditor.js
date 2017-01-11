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


// FUTURE: Merge part (or all) of this class with MultiRangeInlineEditor

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var CodeMirror          = require("thirdparty/CodeMirror/lib/codemirror"),
        EventDispatcher     = require("utils/EventDispatcher"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        InlineWidget        = require("editor/InlineWidget").InlineWidget,
        KeyEvent            = require("utils/KeyEvent");

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
        var $dirtyIndicators = $(".inline-text-editor .dirty-indicator"),
            $indicator;

        $dirtyIndicators.each(function (index, indicator) {
            $indicator = $(this);
            if ($indicator.data("fullPath") === doc.file.fullPath) {
                _showDirtyIndicator($indicator, doc.isDirty);
            }
        });
    }

    /**
     * @constructor
     * @extends {InlineWidget}
     */
    function InlineTextEditor() {
        InlineWidget.call(this);

        this.editor = null;

        // We need to set this as a capture handler so CodeMirror doesn't handle Esc before we see it.
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.htmlContent.addEventListener("keydown", this.handleKeyDown, true);
    }
    InlineTextEditor.prototype = Object.create(InlineWidget.prototype);
    InlineTextEditor.prototype.constructor = InlineTextEditor;
    InlineTextEditor.prototype.parentClass = InlineWidget.prototype;

    InlineTextEditor.prototype.$wrapper = null;
    /** @type {Editor} */
    InlineTextEditor.prototype.editor = null;
    InlineTextEditor.prototype.$editorHolder = null;
    InlineTextEditor.prototype.$header = null;
    InlineTextEditor.prototype.$filename = null;

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
            var $gutter = $(editor._codeMirror.getGutterElement()).find(".CodeMirror-linenumbers");
            $gutter.css("min-width", "");
            var curWidth = $gutter.width();
            if (curWidth > maxWidth) {
                maxWidth = curWidth;
            }
        });

        if (allHostedEditors.length === 1) {
            //There's only the host, just refresh the gutter
            allHostedEditors[0]._codeMirror.setOption("gutters", allHostedEditors[0]._codeMirror.getOption("gutters"));
            return;
        }

        maxWidth = maxWidth + "px";
        allHostedEditors.forEach(function (editor) {
            $(editor._codeMirror.getGutterElement()).find(".CodeMirror-linenumbers").css("min-width", maxWidth);

            // Force CodeMirror to refresh the gutter
            editor._codeMirror.setOption("gutters", editor._codeMirror.getOption("gutters"));
        });
    }

    /**
     * Called any time inline was closed, whether manually (via close()) or automatically
     */
    InlineTextEditor.prototype.onClosed = function () {
        InlineTextEditor.prototype.parentClass.onClosed.apply(this, arguments);

        _syncGutterWidths(this.hostEditor);

        // Destroy the inline editor.
        this.setInlineContent(null);
        this.htmlContent.removeEventListener("keydown", this.handleKeyDown, true);
    };

    /**
     * Update the inline editor's height when the number of lines change. The
     * base implementation of this method does nothing.
     */
    InlineTextEditor.prototype.sizeInlineWidgetToContents = function () {
        // brackets_codemirror_overrides.css adds height:auto to CodeMirror
        // Inline editors themselves do not need to be sized, but layouts like
        // the one used in CSSInlineEditor do need some manual layout.
    };

    /**
     * Some tasks have to wait until we've been parented into the outer editor
     * @param {string} the inline ID that is generated by CodeMirror after the widget that holds the inline
     *  editor is constructed and added to the DOM
     */
    InlineTextEditor.prototype.onAdded = function () {
        var self = this;

        InlineTextEditor.prototype.parentClass.onAdded.apply(this, arguments);

        if (this.editor) {
            this.editor.refresh();
        }

        // Update display of inline editors when the hostEditor signals a redraw
        CodeMirror.on(this.info, "redraw", function () {
            // At the point where we get the redraw, CodeMirror might not yet have actually
            // re-added the widget to the DOM. This is filed as https://github.com/codemirror/CodeMirror/issues/1226.
            // For now, we can work around it by doing the refresh on a setTimeout().
            window.setTimeout(function () {
                if (self.editor) {
                    self.editor.refresh();
                }
            }, 0);
        });

        _syncGutterWidths(this.hostEditor);

        if (this.editor) {
            this.editor.focus();
        }
    };

    /**
     * @return {?Editor} If an Editor within this inline editor has focus, returns it. Otherwise returns null.
     */
    InlineTextEditor.prototype.getFocusedEditor = function () {
        if (this.editor && this.editor.hasFocus()) {
            return this.editor;
        }
        return null;
    };

    /**
     * @private
     * Make sure that if we want to handle Esc to cancel a multiple selection, we don't let it bubble
     * up to InlineWidget, which will close the edit.
     */
    InlineTextEditor.prototype.handleKeyDown = function (e) {
        if (e.keyCode === KeyEvent.DOM_VK_ESCAPE && this.editor && this.editor.getSelections().length > 1) {
            CodeMirror.commands.singleSelection(this.editor._codeMirror);
            e.stopImmediatePropagation();
        }
    };

    /**
     * Sets the document and range to show in the inline editor, or null to destroy the current editor and leave
     * the content blank.
     * @param {Document} doc The document to show, or null to show nothing
     * @param {number} startLine The first line of text in `doc` to show in inline editor. Ignored if doc is null.
     * @param {number} endLine The last line of text in `doc` to show in inline editor. Ignored if doc is null.
     */
    InlineTextEditor.prototype.setInlineContent = function (doc, startLine, endLine) {
        var self = this;

        // Destroy the previous editor if we had one and clear out the filename info.
        if (this.editor) {
            this.editor.off(".InlineTextEditor");
            this.editor.destroy(); // remove from DOM and release ref on Document
            this.editor = null;
            this.$filename.off(".InlineTextEditor")
                .removeAttr("title");
            this.$filename.html("");
        }

        if (!doc) {
            return;
        }

        var range = {
            startLine: startLine,
            endLine: endLine
        };

        // dirty indicator, with file path stored on it
        var $dirtyIndicatorDiv = $("<div/>")
            .addClass("dirty-indicator")
            .html("&bull;")
            .width(0); // initialize indicator as hidden
        $dirtyIndicatorDiv.data("fullPath", doc.file.fullPath);

        this.$lineNumber = $("<span class='line-number'/>");

        // update contents of filename link
        this.$filename.append($dirtyIndicatorDiv)
            .append(doc.file.name + " : ")
            .append(this.$lineNumber)
            .attr("title", doc.file.fullPath);

        // clicking filename jumps to full editor view
        this.$filename.on("click.InlineTextEditor", function () {
            CommandManager.execute(Commands.FILE_OPEN, { fullPath: doc.file.fullPath })
                .done(function () {
                    EditorManager.getCurrentFullEditor().setCursorPos(startLine, 0, true);
                });
        });

        var inlineInfo = EditorManager.createInlineEditorForDocument(doc, range, this.$editorHolder.get(0));
        this.editor = inlineInfo.editor;

        // Init line number display
        this._updateLineRange(inlineInfo.editor);

        // Always update the widget height when an inline editor completes a
        // display update
        this.editor.on("update.InlineTextEditor", function (event, editor) {
            self.sizeInlineWidgetToContents();
        });

        // Size editor to content whenever text changes (via edits here or any
        // other view of the doc: Editor fires "change" any time its text
        // changes, regardless of origin)
        this.editor.on("change.InlineTextEditor", function (event, editor) {
            if (self.hostEditor.isFullyVisible()) {
                self.sizeInlineWidgetToContents();
                self._updateLineRange(editor);
            }
        });

        // If Document's file is deleted, or Editor loses sync with Document, delegate to this._onLostContent()
        this.editor.on("lostContent.InlineTextEditor", function () {
            self._onLostContent.apply(self, arguments);
        });

        // set dirty indicator state
        _showDirtyIndicator($dirtyIndicatorDiv, doc.isDirty);
    };

    /**
     * Updates start line display.
     * @param {Editor} editor
     */
    InlineTextEditor.prototype._updateLineRange = function (editor) {
        this._startLine = editor.getFirstVisibleLine();
        this._endLine = editor.getLastVisibleLine();
        this._lineCount = this._endLine - this._startLine;

        this.$lineNumber.text(this._startLine + 1);
    };

    /**
     * @param {Editor} hostEditor
     */
    InlineTextEditor.prototype.load = function (hostEditor) {
        InlineTextEditor.prototype.parentClass.load.apply(this, arguments);

        // We don't create the actual editor here--that will happen the first time
        // setInlineContent() is called.
        this.$wrapper = $("<div/>").addClass("inline-text-editor").appendTo(this.$htmlContent);
        this.$header = $("<div/>").addClass("inline-editor-header").appendTo(this.$wrapper);
        this.$filename = $("<a/>").addClass("filename").appendTo(this.$header);
        this.$editorHolder = $("<div/>").addClass("inline-editor-holder").appendTo(this.$wrapper);
    };

    /**
     * Called when the editor containing the inline is made visible.
     */
    InlineTextEditor.prototype.onParentShown = function () {
        InlineTextEditor.prototype.parentClass.onParentShown.apply(this, arguments);

        // Refresh line number display and codemirror line number gutter
        if (this.editor) {
            this._updateLineRange(this.editor);
            this.editor.refresh();
        }

        // We need to call this explicitly whenever the host editor is reshown
        this.sizeInlineWidgetToContents();
    };

    /**
     * If Document's file is deleted, or Editor loses sync with Document, just close
     */
    InlineTextEditor.prototype._onLostContent = function () {
        // Note: this closes the entire inline widget if any one Editor loses sync. This seems
        // better than leaving it open but suddenly removing one rule from the result list.
        this.close();
    };


    // Consolidate all dirty document updates
    // Due to circular dependencies, not safe to call on() directly
    EventDispatcher.on_duringInit(DocumentManager, "dirtyFlagChange", _dirtyFlagChangeHandler);

    exports.InlineTextEditor = InlineTextEditor;

});
