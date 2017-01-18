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

define(function (require, exports, module) {
    "use strict";

    var DocumentManager     = require("document/DocumentManager"),
        ImageViewTemplate   = require("text!htmlContent/image-view.html"),
        ProjectManager      = require("project/ProjectManager"),
        LanguageManager     = require("language/LanguageManager"),
        MainViewFactory     = require("view/MainViewFactory"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        FileSystem          = require("filesystem/FileSystem"),
        FileUtils           = require("file/FileUtils"),
        _                   = require("thirdparty/lodash"),
        Mustache            = require("thirdparty/mustache/mustache");

    var _viewers = {};

    /**
     * ImageView objects are constructed when an image is opened
     * @see {@link Pane} for more information about where ImageViews are rendered
     *
     * @constructor
     * @param {!File} file - The image file object to render
     * @param {!jQuery} container - The container to render the image view in
     */
    function ImageView(file, $container) {
        this.file = file;
        this.$el = $(Mustache.render(ImageViewTemplate, {fullPath: FileUtils.encodeFilePath(file.fullPath),
                                                         now: new Date().valueOf()}));

        $container.append(this.$el);

        this._naturalWidth = 0;
        this._naturalHeight = 0;
        this._scale = 100;           // 100%
        this._scaleDivInfo = null;   // coordinates of hidden scale sticker

        this.relPath = ProjectManager.makeProjectRelativeIfPossible(this.file.fullPath);

        this.$imagePath = this.$el.find(".image-path");
        this.$imagePreview = this.$el.find(".image-preview");
        this.$imageData = this.$el.find(".image-data");

        this.$image = this.$el.find(".image");
        this.$imageTip = this.$el.find(".image-tip");
        this.$imageGuides = this.$el.find(".image-guide");
        this.$imageScale = this.$el.find(".image-scale");
        this.$x_value = this.$el.find(".x-value");
        this.$y_value = this.$el.find(".y-value");
        this.$horzGuide = this.$el.find(".horz-guide");
        this.$vertGuide = this.$el.find(".vert-guide");

        this.$imagePath.text(this.relPath).attr("title", this.relPath);
        this.$imagePreview.on("load", _.bind(this._onImageLoaded, this));

        _viewers[file.fullPath] = this;
    }

    /**
     * DocumentManger.fileNameChange handler - when an image is renamed, we must
     * update the view
     *
     * @param {jQuery.Event} e - event
     * @param {!string} oldPath - the name of the file that's changing changing
     * @param {!string} newPath - the name of the file that's changing changing
     * @private
     */
    ImageView.prototype._onFilenameChange = function (e, oldPath, newPath) {
        /*
         * File objects are already updated when the event is triggered
         * so we just need to see if the file has the same path as our image
         */
        if (this.file.fullPath === newPath) {
            this.relPath = ProjectManager.makeProjectRelativeIfPossible(newPath);
            this.$imagePath.text(this.relPath).attr("title", this.relPath);
        }
    };

    /**
     * <img>.on("load") handler - updates content of the image view
     *                            initializes computed values
     *                            installs event handlers
     * @param {Event} e - event
     * @private
     */
    ImageView.prototype._onImageLoaded = function (e) {
        // add dimensions and size
        this._naturalWidth = e.currentTarget.naturalWidth;
        this._naturalHeight = e.currentTarget.naturalHeight;

        var extension = FileUtils.getFileExtension(this.file.fullPath);
        var dimensionString = this._naturalWidth + " &times; " + this._naturalHeight + " " + Strings.UNIT_PIXELS;

        if (extension === "ico") {
            dimensionString += " (" + Strings.IMAGE_VIEWER_LARGEST_ICON + ")";
        }

        // get image size
        var self = this;

        this.file.stat(function (err, stat) {
            if (err) {
                self.$imageData.html(dimensionString);
            } else {
                var sizeString = "";
                if (stat.size) {
                    sizeString = " &mdash; " + StringUtils.prettyPrintBytes(stat.size, 2);
                }
                var dimensionAndSize = dimensionString + sizeString;
                self.$imageData.html(dimensionAndSize)
                        .attr("title", dimensionAndSize
                                    .replace("&times;", "x")
                                    .replace("&mdash;", "-"));
            }
        });

        // make sure we always show the right file name
        DocumentManager.on("fileNameChange.ImageView", _.bind(this._onFilenameChange, this));

        this.$imageTip.hide();
        this.$imageGuides.hide();

        this.$image.on("mousemove.ImageView", ".image-preview", _.bind(this._showImageTip, this))
                   .on("mouseleave.ImageView", ".image-preview", _.bind(this._hideImageTip, this));

        this._updateScale();
    };

    /**
     * Update the scale element
     * @private
     */
    ImageView.prototype._updateScale = function () {
        var currentWidth = this.$imagePreview.width();

        if (currentWidth && currentWidth < this._naturalWidth) {
            this._scale = currentWidth / this._naturalWidth * 100;
            this.$imageScale.text(Math.floor(this._scale) + "%")
                // Keep the position of the image scale div relative to the image.
                .css("left", this.$imagePreview.position().left + 5)
                .show();
        } else {
            // Reset everything related to the image scale sticker before hiding it.
            this._scale = 100;
            this._scaleDivInfo = null;
            this.$imageScale.text("").hide();
        }
    };


    /**
     * Show image coordinates under the mouse cursor
     * @param {Event} e - event
     * @private
     */
    ImageView.prototype._showImageTip = function (e) {
        // Don't show image tip if this._scale is close to zero.
        // since we won't have enough room to show tip anyway.
        if (Math.floor(this._scale) === 0) {
            return;
        }

        var x                   = Math.round(e.offsetX * 100 / this._scale),
            y                   = Math.round(e.offsetY * 100 / this._scale),
            imagePos            = this.$imagePreview.position(),
            left                = e.offsetX + imagePos.left,
            top                 = e.offsetY + imagePos.top,
            width               = this.$imagePreview.width(),
            height              = this.$imagePreview.height(),
            windowWidth         = $(window).width(),
            fourDigitImageWidth = this._naturalWidth.toString().length === 4,

            // @todo -- seems a bit strange that we're computing sizes
            //          using magic numbers

            infoWidth1          = 112,    // info div width 96px + vertical toolbar width 16px
            infoWidth2          = 120,    // info div width 104px (for 4-digit image width) + vertical toolbar width 16px
            tipOffsetX          = 10,     // adjustment for info div left from x coordinate of cursor
            tipOffsetY          = -54,    // adjustment for info div top from y coordinate of cursor
            tipMinusOffsetX1    = -82,    // for less than 4-digit image width
            tipMinusOffsetX2    = -90;    // for 4-digit image width

        // Check whether we're getting mousemove events beyond the image boundaries due to a browser bug
        // or the rounding calculation above for a scaled image. For example, if an image is 120 px wide,
        // we should get mousemove events in the range of 0 <= x < 120, but not 120 or more. If we get
        // a value beyond the range, then simply handle the event as if it were a mouseleave.
        if (x < 0 || x >= this._naturalWidth || y < 0 || y >= this._naturalHeight) {
            this._hideImageTip(e);
            this.$imagePreview.css("cursor", "auto");
            return;
        }

        this.$imagePreview.css("cursor", "none");

        this._handleMouseEnterOrExitScaleSticker(left, top);

        // Check whether to show the image tip on the left.
        if ((e.pageX + infoWidth1) > windowWidth ||
                (fourDigitImageWidth && (e.pageX + infoWidth2) > windowWidth)) {
            tipOffsetX = fourDigitImageWidth ? tipMinusOffsetX2 : tipMinusOffsetX1;
        }

        this.$x_value.text(x + "px");
        this.$y_value.text(y + "px");

        this.$imageTip.css({
            left: left + tipOffsetX,
            top: top + tipOffsetY
        }).show();

        this.$horzGuide.css({
            left: imagePos.left,
            top: top,
            width: width - 1
        }).show();

        this.$vertGuide.css({
            left: left,
            top: imagePos.top,
            height: height - 1
        }).show();
    };

    /**
     * Hide image coordinates info tip
     * @param {Event} e - event
     * @private
     */
    ImageView.prototype._hideImageTip = function (e) {
        var $target   = $(e.target),
            targetPos = $target.position(),
            imagePos  = this.$imagePreview.position(),
            right     = imagePos.left + this.$imagePreview.width(),
            bottom    = imagePos.top + this.$imagePreview.height(),
            x         = targetPos.left + e.offsetX,
            y         = targetPos.top + e.offsetY;

        // Hide image tip and guides only if the cursor is outside of the image.
        if (x < imagePos.left || x >= right ||
                y < imagePos.top || y >= bottom) {
            this._hideGuidesAndTip();
            if (this._scaleDivInfo) {
                this._scaleDivInfo = null;
                this.$imageScale.show();
            }
        }
    };

    /**
     * Hides both guides and the tip
     * @private
     */
    ImageView.prototype._hideGuidesAndTip = function () {
        this.$imageTip.hide();
        this.$imageGuides.hide();
    };

    /**
     * Check mouse entering/exiting the scale sticker.
     * Hide it when entering and show it again when exiting.
     *
     * @param {number} offsetX mouse offset from the left of the previewing image
     * @param {number} offsetY mouseoffset from the top of the previewing image
     * @private
     */
    ImageView.prototype._handleMouseEnterOrExitScaleSticker = function (offsetX, offsetY) {
        var imagePos       = this.$imagePreview.position(),
            scaleDivPos    = this.$imageScale.position(),
            imgWidth       = this.$imagePreview.width(),
            imgHeight      = this.$imagePreview.height(),
            scaleDivLeft,
            scaleDivTop,
            scaleDivRight,
            scaleDivBottom;

        if (this._scaleDivInfo) {
            scaleDivLeft   = this._scaleDivInfo.left;
            scaleDivTop    = this._scaleDivInfo.top;
            scaleDivRight  = this._scaleDivInfo.right;
            scaleDivBottom = this._scaleDivInfo.bottom;

            if ((imgWidth + imagePos.left) < scaleDivRight) {
                scaleDivRight = imgWidth + imagePos.left;
            }

            if ((imgHeight + imagePos.top) < scaleDivBottom) {
                scaleDivBottom = imgHeight + imagePos.top;
            }

        } else {
            scaleDivLeft   = scaleDivPos.left;
            scaleDivTop    = scaleDivPos.top;
            scaleDivRight  = this.$imageScale.width() + scaleDivLeft;
            scaleDivBottom = this.$imageScale.height() + scaleDivTop;
        }

        if (this._scaleDivInfo) {
            // See whether the cursor is no longer inside the hidden scale div.
            // If so, show it again.
            if ((offsetX < scaleDivLeft || offsetX > scaleDivRight) ||
                    (offsetY < scaleDivTop || offsetY > scaleDivBottom)) {
                this._scaleDivInfo = null;
                this.$imageScale.show();
            }
        } else if ((offsetX >= scaleDivLeft && offsetX <= scaleDivRight) &&
                (offsetY >= scaleDivTop && offsetY <= scaleDivBottom)) {
            // Handle mouse inside image scale div.
            // But hide it only if the pixel under mouse is also in the image.
            if (offsetX < (imagePos.left + imgWidth) &&
                    offsetY < (imagePos.top + imgHeight)) {
                // Remember image scale div coordinates before hiding it.
                this._scaleDivInfo = {left: scaleDivPos.left,
                                 top: scaleDivPos.top,
                                 right: scaleDivRight,
                                 bottom: scaleDivBottom};
                this.$imageScale.hide();
            }
        }
    };

    /**
     * View Interface functions
     */

    /*
     * Retrieves the file object for this view
     * return {!File} the file object for this view
     */
    ImageView.prototype.getFile = function () {
        return this.file;
    };

    /*
     * Updates the layout of the view
     */
    ImageView.prototype.updateLayout = function () {
        this._hideGuidesAndTip();

        var $container = this.$el.parent();

        var pos = $container.position(),
            iWidth = $container.innerWidth(),
            iHeight = $container.innerHeight(),
            oWidth = $container.outerWidth(),
            oHeight = $container.outerHeight();

        // $view is "position:absolute" so
        //  we have to update the height, width and position
        this.$el.css({top: pos.top + ((oHeight - iHeight) / 2),
                        left: pos.left + ((oWidth - iWidth) / 2),
                        width: iWidth,
                        height: iHeight});
        this._updateScale();
    };

    /*
     * Destroys the view
     */
    ImageView.prototype.destroy = function () {
        delete _viewers[this.file.fullPath];
        DocumentManager.off(".ImageView");
        this.$image.off(".ImageView");
        this.$el.remove();
    };

    /*
     * Refreshes the image preview with what's on disk
     */
    ImageView.prototype.refresh = function () {
        var noCacheUrl = this.$imagePreview.attr("src"),
            now = new Date().valueOf(),
            index = noCacheUrl.indexOf("?");

        // strip the old param off
        if (index > 0) {
            noCacheUrl = noCacheUrl.slice(0, index);
        }

        // add a new param which will force chrome to
        //  re-read the image from disk
        noCacheUrl = noCacheUrl + "?ver=" + now;


        // Update the DOM node with the src URL
        this.$imagePreview.attr("src", noCacheUrl);
    };

    /*
     * Creates an image view object and adds it to the specified pane
     * @param {!File} file - the file to create an image of
     * @param {!Pane} pane - the pane in which to host the view
     * @return {jQuery.Promise}
     */
    function _createImageView(file, pane) {
        var view = pane.getViewForPath(file.fullPath);

        if (view) {
            pane.showView(view);
        } else {
            view = new ImageView(file, pane.$content);
            pane.addView(view, true);
        }
        return new $.Deferred().resolve().promise();
    }

    /**
     * Handles file system change events so we can refresh
     *  image viewers for the files that changed on disk due to external editors
     * @param {jQuery.event} event - event object
     * @param {?File} file - file object that changed
     * @param {Array.<FileSystemEntry>=} added If entry is a Directory, contains zero or more added children
     * @param {Array.<FileSystemEntry>=} removed If entry is a Directory, contains zero or more removed children
     */
    function _handleFileSystemChange(event, entry, added, removed) {
        // this may have been called because files were added
        //  or removed to the file system.  We don't care about those
        if (!entry || entry.isDirectory) {
            return;
        }

        // Look for a viewer for the changed file
        var viewer = _viewers[entry.fullPath];

        // viewer found, call its refresh method
        if (viewer) {
            viewer.refresh();
        }
    }

    /*
     * Install an event listener to receive all file system change events
     * so we can refresh the view when changes are made to the image in an external editor
     */
    FileSystem.on("change", _handleFileSystemChange);

    /*
     * Initialization, register our view factory
     */
    MainViewFactory.registerViewFactory({
        canOpenFile: function (fullPath) {
            var lang = LanguageManager.getLanguageForPath(fullPath);
            return (lang.getId() === "image");
        },
        openFile: function (file, pane) {
            return _createImageView(file, pane);
        }
    });

    /*
     * This is for extensions that want to create a
     * view factory based on ImageViewer
     */
    exports.ImageView = ImageView;
});
