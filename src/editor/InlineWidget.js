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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, window */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var EditorManager       = require("editor/EditorManager"),
        KeyEvent            = require("utils/KeyEvent");
    
    /**
     * @constructor
     *
     */
    function InlineWidget() {
        var self = this;
        
        // create the outer wrapper div
        this.htmlContent = window.document.createElement("div");
        this.$htmlContent = $(this.htmlContent).addClass("inline-widget");
        this.$htmlContent.append("<div class='shadow top' />")
            .append("<div class='shadow bottom' />");
        
        this.$htmlContent.on("keydown", function (e) {
            if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                self.close();
                e.stopImmediatePropagation();
            }
        });
        
        this.updateWidth = this.updateWidth.bind(this);
    }
    InlineWidget.prototype.htmlContent = null;
    InlineWidget.prototype.$htmlContent = null;
    InlineWidget.prototype.id = null;
    InlineWidget.prototype.hostEditor = null;

    /**
     * Initial height of inline widget in pixels. Can be changed later via hostEditor.setInlineWidgetHeight()
     * @type {number}
     */
    InlineWidget.prototype.height = 0;
    
    /**
     * Automatically updates the width of the inline editor when the parent editor's width changes due to
     * edits or window resizes.
     */
    InlineWidget.prototype.updateWidth = function () {
        // Set the minimum width of the widget (which doesn't include the padding) to the width
        // of CodeMirror's linespace, so that the total width will be at least as large as the
        // width of the host editor's code plus any internal padding required by the widget.
        // We can't just set the min-width to 100% because that would be 100% of the clientWidth of
        // the host editor, rather than the overall scroll width.
        // We also can't just use the host editor's scrollWidth, because if the host editor's own
        // content becomes less wide, our own width will continue to prop open the host editor's
        // scrollWidth.
        // So instead, we peg our width to the right edge of CodeMirror's lineSpace (which is its
        // width plus its offset from the left edge of the $htmlContent container).
        // If the lineSpace is less than the scroller's clientWidth, we want to use the clientWidth instead.
        // This is a bit of a hack since it relies on knowing some detail about the innards of CodeMirror.
        var lineSpace = this.hostEditor._getLineSpaceElement(),
            scroller = this.hostEditor.getScrollerElement(),
            minWidth = Math.max(scroller.clientWidth, $(lineSpace).offset().left - this.$htmlContent.offset().left + lineSpace.scrollWidth);
        this.$htmlContent.css("min-width", minWidth + "px");
    };
    
    /**
     * Closes this inline widget and all its contained Editors
     */
    InlineWidget.prototype.close = function () {
        EditorManager.closeInlineWidget(this.hostEditor, this);
        // closeInlineWidget() causes our onClosed() handler to be called
    };
    
    /** @return {boolean} True if any part of the inline widget is focused */
    InlineWidget.prototype.hasFocus = function () {
        // True if anything in widget's DOM tree has focus (find() excludes root node, hence the extra check)
        return this.$htmlContent.find(":focus").length > 0 || this.$htmlContent.is(":focus");
    };
    
    /**
     * Called any time inline is closed, whether manually or automatically
     */
    InlineWidget.prototype.onClosed = function () {
        $(this.hostEditor).off("change", this.updateWidth);
        $(window).off("resize", this.updateWidth);
    };

    /**
     * Called once content is parented in the host editor's DOM. Useful for performing tasks like setting
     * focus or measuring content, which require htmlContent to be in the DOM tree.
     */
    InlineWidget.prototype.onAdded = function () {
        // Autosize the inline widget to the scrollable width of the main editor.
        $(window).on("resize", this.updateWidth);
        $(this.hostEditor).on("change", this.updateWidth);
        window.setTimeout(this.updateWidth, 0);
    };

    /**
     * @param {Editor} hostEditor
     */
    InlineWidget.prototype.load = function (hostEditor) {
        this.hostEditor = hostEditor;
    };
    
    /**
     * Called when the editor containing the inline is made visible.
     */
    InlineWidget.prototype.onParentShown = function () {
        // do nothing - base implementation
    };
    
    /**
     * Called when the parent editor does a full refresh--for example, when the font size changes.
     */
    InlineWidget.prototype.refresh = function () {
        // do nothing - base implementation
    };
    
    exports.InlineWidget = InlineWidget;

});
