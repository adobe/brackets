/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, brackets, $, window, Mustache */

/**
 * Inline widget to display WebPlatformDocs JSON data nicely formatted
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load Brackets modules
    var InlineWidget    = brackets.getModule("editor/InlineWidget").InlineWidget,
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        Strings         = brackets.getModule("strings"),
        NativeApp       = brackets.getModule("utils/NativeApp");
    
    // Load template
    var inlineEditorTemplate = require("text!InlineDocsViewer.html");
    
    // Load CSS
    ExtensionUtils.loadStyleSheet(module, "WebPlatformDocs.less");
    
    
    /**
     * @param {!string} cssPropName
     * @param {!{SUMMARY:string, URL:string, VALUES:Array.<{TITLE:string, DESCRIPTION:string}>}} cssPropDetails
     */
    function InlineDocsViewer(cssPropName, cssPropDetails) {
        InlineWidget.call(this);
        
        var propValues = cssPropDetails.VALUES.map(function (valueInfo) {
            return { value: valueInfo.TITLE, description: valueInfo.DESCRIPTION };
        });
        
        var templateVars = {
            propName    : cssPropName,
            summary     : cssPropDetails.SUMMARY,
            propValues  : propValues,
            url         : cssPropDetails.URL,
            Strings     : Strings
        };
        
        var html = Mustache.render(inlineEditorTemplate, templateVars);
        
        this.$wrapperDiv = $(html);
        this.$htmlContent.append(this.$wrapperDiv);
        
        // Preprocess link tags to make URLs absolute
        this.$wrapperDiv.find("a").each(function (index, elem) {
            var $elem = $(elem);
            var url = $elem.attr("href");
            if (url && url.substr(0, 4) !== "http") {
                // URLs in JSON data are relative
                url = "http://docs.webplatform.org" + (url.charAt(0) !== "/" ? "/" : "") + url;
                $elem.attr("href", url);
            }
            $elem.attr("title", url);
        });
        
        this._sizeEditorToContent   = this._sizeEditorToContent.bind(this);
        this._handleLinkClick       = this._handleLinkClick.bind(this);
        this._handleWheelScroll     = this._handleWheelScroll.bind(this);
        
        this.$wrapperDiv.on("click", "a", this._handleLinkClick);
        this.$wrapperDiv.find(".scroller").on("mousewheel", this._handleWheelScroll);
    }
    
    InlineDocsViewer.prototype = Object.create(InlineWidget.prototype);
    InlineDocsViewer.prototype.constructor = InlineDocsViewer;
    InlineDocsViewer.prototype.parentClass = InlineWidget.prototype;
    
    InlineDocsViewer.prototype.$wrapperDiv = null;
    
    
    /** Clicking any link should open it in browser, not in Brackets shell */
    InlineDocsViewer.prototype._handleLinkClick = function (event) {
        event.preventDefault();
        var url = $(event.currentTarget).attr("href");
        if (url) {
            NativeApp.openURLInDefaultBrowser(url);
        }
    };
    
    
    /** Don't allow scrollwheel/trackpad to bubble up to host editor - makes scrolling docs painful */
    InlineDocsViewer.prototype._handleWheelScroll = function (event) {
        var scrollingUp = (event.originalEvent.wheelDeltaY > 0),
            scroller = event.currentTarget;
        
        // If content has no scrollbar, let host editor scroll normally
        if (scroller.clientHeight >= scroller.scrollHeight) {
            return;
        }
        
        // We need to block the event from both the host CodeMirror code (by stopping bubbling) and the
        // browser's native behavior (by preventing default). We preventDefault() *only* when the docs
        // scroller is at its limit (when an ancestor would get scrolled instead); otherwise we'd block
        // normal scrolling of the docs themselves.
        event.stopPropagation();
        if (scrollingUp && scroller.scrollTop === 0) {
            event.preventDefault();
        } else if (!scrollingUp && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight) {
            event.preventDefault();
        }
    };
    
    
    InlineDocsViewer.prototype.onAdded = function () {
        InlineDocsViewer.prototype.parentClass.onAdded.apply(this, arguments);
        
        // Set height initially, and again whenever width might have changed (word wrap)
        this._sizeEditorToContent();
        $(window).on("resize", this._sizeEditorToContent);

        // Set focus
        this.$wrapperDiv.find(".scroller")[0].focus();
    };
    
    InlineDocsViewer.prototype.onClosed = function () {
        InlineDocsViewer.prototype.parentClass.onClosed.apply(this, arguments);
        
        $(window).off("resize", this._sizeEditorToContent);
    };
    
    InlineDocsViewer.prototype._sizeEditorToContent = function () {
        this.hostEditor.setInlineWidgetHeight(this, this.$wrapperDiv.height() + 20, true);
    };
    
    
    module.exports = InlineDocsViewer;
});
