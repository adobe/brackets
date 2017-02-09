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

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var EditorManager       = require("editor/EditorManager");
    
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
            if (e.keyCode === 27) {
                self.close();
                e.stopImmediatePropagation();
            }
        });
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
     * Closes this inline widget and all its contained Editors
     */
    InlineWidget.prototype.close = function () {
        var shouldMoveFocus = this._editorHasFocus();
        EditorManager.closeInlineWidget(this.hostEditor, this, shouldMoveFocus);
        // closeInlineWidget() causes our onClosed() handler to be called
    };
    
    /**
     * Called any time inline is closed, whether manually or automatically
     */
    InlineWidget.prototype.onClosed = function () {
        // do nothing - base implementation
    };

    /**
     * Called once content is parented in the host editor's DOM. Useful for performing tasks like setting
     * focus or measuring content, which require htmlContent to be in the DOM tree.
     */
    InlineWidget.prototype.onAdded = function () {
        // do nothing - base implementation
    };

    /**
     * @param {Editor} hostEditor
     */
    InlineWidget.prototype.load = function (hostEditor) {
        this.hostEditor = hostEditor;

        // TODO: incomplete impelementation. It's not clear yet if InlineTextEditor
        // will fuction as an abstract class or as generic inline editor implementation
        // that just shows a range of text. See CSSInlineEditor.css for an implementation of load()
    };
    

    /**
     * Called when the editor containing the inline is made visible.
     */
    InlineWidget.prototype.onParentShown = function () {
        // do nothing - base implementation
    };

    exports.InlineWidget = InlineWidget;

});
