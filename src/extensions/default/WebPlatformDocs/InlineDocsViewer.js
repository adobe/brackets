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
        this.cssPropName = cssPropName;
        this.cssPropDetails = cssPropDetails;
        InlineWidget.call(this);
    }
    
    InlineDocsViewer.prototype = Object.create(InlineWidget.prototype);
    InlineDocsViewer.prototype.constructor = InlineDocsViewer;
    InlineDocsViewer.prototype.parentClass = InlineWidget.prototype;
    
    InlineDocsViewer.prototype.cssPropName = null;
    InlineDocsViewer.prototype.cssPropDefn = null;
    InlineDocsViewer.prototype.$wrapperDiv = null;
    
    InlineDocsViewer.prototype.load = function (hostEditor) {
        InlineDocsViewer.prototype.parentClass.load.apply(this, arguments);
        
        var propValues = this.cssPropDetails.VALUES.map(function (valueInfo) {
            return { value: valueInfo.TITLE, description: valueInfo.DESCRIPTION };
        });
        
        var templateVars = $.extend({
            propName: this.cssPropName,
            summary: this.cssPropDetails.SUMMARY,
            propValues: propValues,
            url: this.cssPropDetails.URL
        }, Strings);
        
        var html = Mustache.render(inlineEditorTemplate, templateVars);
        
        this.$wrapperDiv = $(html);
        this.$htmlContent.append(this.$wrapperDiv);
        
        this.$wrapperDiv.on("click", "a", function (event) {
            event.preventDefault();
            var url = $(event.target).attr("href");
            if (url) {
                // URLs in JSON data are relative
                if (url.substr(0, 4) !== "http") {
                    url = "http://docs.webplatform.org" + (url.charAt(0) !== "/" ? "/" : "") + url.replace(" ", "_");
                }
                NativeApp.openURLInDefaultBrowser(url);
            }
        });
        
    };

    InlineDocsViewer.prototype.onAdded = function () {
        InlineDocsViewer.prototype.parentClass.onAdded.apply(this, arguments);
        window.setTimeout(this._sizeEditorToContent.bind(this));
    };
    
    InlineDocsViewer.prototype._sizeEditorToContent = function () {
        this.hostEditor.setInlineWidgetHeight(this, this.$htmlContent.height() + 20, true);
        
        // TODO: scroll only right-hand pane
//        var summaryHt = this.$wrapperDiv.find(".css-prop-summary").height();
//        this.hostEditor.setInlineWidgetHeight(this, summaryHt + 20, true);
    };
    
    module.exports = InlineDocsViewer;
});
