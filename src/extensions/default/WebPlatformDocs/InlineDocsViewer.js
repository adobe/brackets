/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/**
 * Inline widget to display WebPlatformDocs JSON data nicely formatted
 */
define(function (require, exports, module) {
    'use strict';

    // Load Brackets modules
    var Dialogs         = brackets.getModule("widgets/Dialogs"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        InlineWidget    = brackets.getModule("editor/InlineWidget").InlineWidget,
        KeyEvent        = brackets.getModule("utils/KeyEvent"),
        Strings         = brackets.getModule("strings"),
        Mustache        = brackets.getModule("thirdparty/mustache/mustache");

    // Load template
    var inlineEditorTemplate = require("text!InlineDocsViewer.html");

    // Lines height for scrolling
    var SCROLL_LINE_HEIGHT = 40;

    // Load CSS
    ExtensionUtils.loadStyleSheet(module, "WebPlatformDocs.less");


    /**
     * @param {!string} cssPropName
     * @param {!{SUMMARY:string, URL:string, VALUES:?Array.<{value:string, description:string}>}} cssPropDetails
     */
    function InlineDocsViewer(cssPropName, cssPropDetails) {
        InlineWidget.call(this);

        var templateVars = {
            propName    : cssPropName,
            summary     : cssPropDetails.SUMMARY,
            propValues  : cssPropDetails.VALUES || [],
            url         : cssPropDetails.URL,
            Strings     : Strings
        };

        var html = Mustache.render(inlineEditorTemplate, templateVars);

        this.$wrapperDiv = $(html);
        this.$htmlContent.append(this.$wrapperDiv);

        Dialogs.addLinkTooltips(this.$wrapperDiv);

        this._sizeEditorToContent   = this._sizeEditorToContent.bind(this);
        this._handleWheelScroll     = this._handleWheelScroll.bind(this);

        this.$scroller = this.$wrapperDiv.find(".scroller");
        this.$scroller.on("mousewheel", this._handleWheelScroll);
        this._onKeydown = this._onKeydown.bind(this);
    }

    InlineDocsViewer.prototype = Object.create(InlineWidget.prototype);
    InlineDocsViewer.prototype.constructor = InlineDocsViewer;
    InlineDocsViewer.prototype.parentClass = InlineWidget.prototype;

    InlineDocsViewer.prototype.$wrapperDiv = null;
    InlineDocsViewer.prototype.$scroller = null;

    /**
     * Handle scrolling.
     *
     * @param {Event} event Keyboard event or mouse scrollwheel event
     * @param {boolean} scrollingUp Is event to scroll up?
     * @param {DOMElement} scroller Element to scroll
     * @return {boolean} indication whether key was handled
     */
    InlineDocsViewer.prototype._handleScrolling = function (event, scrollingUp, scroller) {
        // We need to block the event from both the host CodeMirror code (by stopping bubbling) and the
        // browser's native behavior (by preventing default). We preventDefault() *only* when the docs
        // scroller is at its limit (when an ancestor would get scrolled instead); otherwise we'd block
        // normal scrolling of the docs themselves.
        event.stopPropagation();
        if (scrollingUp && scroller.scrollTop === 0) {
            event.preventDefault();
            return true;
        } else if (!scrollingUp && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight) {
            event.preventDefault();
            return true;
        }

        return false;
    };

    /** Don't allow scrollwheel/trackpad to bubble up to host editor - makes scrolling docs painful */
    InlineDocsViewer.prototype._handleWheelScroll = function (event) {
        var scrollingUp = (event.originalEvent.wheelDeltaY > 0),
            scroller = event.currentTarget;

        // If content has no scrollbar, let host editor scroll normally
        if (scroller.clientHeight >= scroller.scrollHeight) {
            return;
        }

        this._handleScrolling(event, scrollingUp, scroller);
    };


    /**
     * Convert keydown events into navigation actions.
     *
     * @param {KeyboardEvent} event
     * @return {boolean} indication whether key was handled
     */
    InlineDocsViewer.prototype._onKeydown = function (event) {
        var keyCode  = event.keyCode,
            scroller = this.$scroller[0],
            scrollPos;

        // Ignore key events with modifier keys
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return false;
        }

        // Handle keys that we're interested in
        scrollPos = scroller.scrollTop;

        switch (keyCode) {
        case KeyEvent.DOM_VK_UP:
            scrollPos = Math.max(0, scrollPos - SCROLL_LINE_HEIGHT);
            break;
        case KeyEvent.DOM_VK_PAGE_UP:
            scrollPos = Math.max(0, scrollPos - scroller.clientHeight);
            break;
        case KeyEvent.DOM_VK_DOWN:
            scrollPos = Math.min(scroller.scrollHeight - scroller.clientHeight,
                                 scrollPos + SCROLL_LINE_HEIGHT);
            break;
        case KeyEvent.DOM_VK_PAGE_DOWN:
            scrollPos = Math.min(scroller.scrollHeight - scroller.clientHeight,
                                 scrollPos + scroller.clientHeight);
            break;
        default:
            // Ignore other keys
            return false;
        }

        scroller.scrollTop = scrollPos;

        // Disallow further processing
        event.stopPropagation();
        event.preventDefault();
        return true;
    };

    InlineDocsViewer.prototype.onAdded = function () {
        InlineDocsViewer.prototype.parentClass.onAdded.apply(this, arguments);

        // Set height initially, and again whenever width might have changed (word wrap)
        this._sizeEditorToContent();
        $(window).on("resize", this._sizeEditorToContent);

        // Set focus
        this.$scroller[0].focus();
        this.$wrapperDiv[0].addEventListener("keydown", this._onKeydown, true);
    };

    InlineDocsViewer.prototype.onClosed = function () {
        InlineDocsViewer.prototype.parentClass.onClosed.apply(this, arguments);

        $(window).off("resize", this._sizeEditorToContent);
        this.$wrapperDiv[0].removeEventListener("keydown", this._onKeydown, true);
    };

    InlineDocsViewer.prototype._sizeEditorToContent = function () {
        this.hostEditor.setInlineWidgetHeight(this, this.$wrapperDiv.height() + 20, true);
    };


    module.exports = InlineDocsViewer;
});
