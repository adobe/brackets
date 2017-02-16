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
    'use strict';

    // Load Brackets modules
    var InlineWidget        = brackets.getModule("editor/InlineWidget").InlineWidget;

    // Load tempalte
    var inlineEditorTemplate = require("text!InlineImageViewer.html");

    function InlineImageViewer(fileName, fullPath) {
        this.fileName = fileName;
        this.fullPath = fullPath;
        InlineWidget.call(this);
    }
    InlineImageViewer.prototype = Object.create(InlineWidget.prototype);
    InlineImageViewer.prototype.constructor = InlineImageViewer;
    InlineImageViewer.prototype.parentClass = InlineWidget.prototype;

    InlineImageViewer.prototype.fileName = null;
    InlineImageViewer.prototype.fullPath = null;
    InlineImageViewer.prototype.$wrapperDiv = null;
    InlineImageViewer.prototype.$image = null;

    InlineImageViewer.prototype.load = function (hostEditor) {
        InlineImageViewer.prototype.parentClass.load.apply(this, arguments);

        this.$wrapperDiv = $(inlineEditorTemplate);

        // TODO (jason-sanjose): Use handlebars.js and update template to
        // use expressions instead e.g. {{filename}}
        // Header
        $(this.$wrapperDiv.find("span")).text(this.fileName);

        // Image
        this.$image = $(this.$wrapperDiv.find("img")).attr("src", this.fullPath);

        this.$htmlContent.append(this.$wrapperDiv);
        this.$htmlContent.click(this.close.bind(this));
    };

    InlineImageViewer.prototype.onAdded = function () {
        InlineImageViewer.prototype.parentClass.onAdded.apply(this, arguments);
        window.setTimeout(this._sizeEditorToContent.bind(this));
    };

    InlineImageViewer.prototype._sizeEditorToContent = function () {
        // TODO: image might not be loaded yet--need to listen for load event and update then.
        this.hostEditor.setInlineWidgetHeight(this, this.$wrapperDiv.height() + 20, true);
        this.$image.css("opacity", 1);
    };

    module.exports = InlineImageViewer;
});
