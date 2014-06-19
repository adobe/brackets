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
/*global define, $, window, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    var DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        ImageHolderTemplate = require("text!htmlContent/image-holder.html"),
        PanelManager        = require("view/PanelManager"),
        ProjectManager      = require("project/ProjectManager"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        FileSystem          = require("filesystem/FileSystem"),
        FileUtils           = require("file/FileUtils");
    
    var _naturalWidth = 0,
        _naturalHeight = 0,
        _scale = 100,
        _scaleDivInfo = null;   // coordinates of hidden scale sticker
    
    /** Update the scale element, i.e. on resize 
     *  @param {!string} currentWidth actual width of image in view
     */
    function _updateScale(currentWidth) {
        if (currentWidth && currentWidth < _naturalWidth) {
            _scale = currentWidth / _naturalWidth * 100;
            $("#img-scale").text(Math.floor(_scale) + "%")
                // Keep the position of the image scale div relative to the image.
                .css("left", $("#img-preview").position().left + 5)
                .show();
        } else {
            // Reset everything related to the image scale sticker before hiding it.
            _scale = 100;
            _scaleDivInfo = null;
            $("#img-scale").text("").hide();
        }
    }
    
    function _hideGuidesAndTip() {
        $("#img-tip").hide();
        $(".img-guide").hide();
    }
    
    /** handle editor resize event, i.e. update scale sticker */
    function _onEditorAreaResize() {
        _hideGuidesAndTip();
        _updateScale($("#img-preview").width());
    }
        
    /**
     * Update file name if necessary
     */
    function _onFileNameChange(e, oldName, newName) {
        var oldRelPath = ProjectManager.makeProjectRelativeIfPossible(oldName),
            currentPath = $("#img-path").text();

        if (currentPath === oldRelPath) {
            var newRelName = ProjectManager.makeProjectRelativeIfPossible(newName);
            $("#img-path").text(newRelName)
                .attr("title", newRelName);
        }
    }

    /**
     * Check mouse entering/exiting the scale sticker. 
     * Hide it when entering and show it again when exiting.
     *
     * @param {number} offsetX mouse offset from the left of the previewing image
     * @param {number} offsetY mouseoffset from the top of the previewing image
     */
    function _handleMouseEnterOrExitScaleSticker(offsetX, offsetY) {
        var imagePos       = $("#img-preview").position(),
            scaleDivPos    = $("#img-scale").position(),
            imgWidth       = $("#img-preview").width(),
            imgHeight      = $("#img-preview").height(),
            scaleDivLeft,
            scaleDivTop,
            scaleDivRight,
            scaleDivBottom;
        
        if (_scaleDivInfo) {
            scaleDivLeft   = _scaleDivInfo.left;
            scaleDivTop    = _scaleDivInfo.top;
            scaleDivRight  = _scaleDivInfo.right;
            scaleDivBottom = _scaleDivInfo.bottom;
            
            if ((imgWidth + imagePos.left) < scaleDivRight) {
                scaleDivRight = imgWidth + imagePos.left;
            }
            
            if ((imgHeight + imagePos.top) < scaleDivBottom) {
                scaleDivBottom = imgHeight + imagePos.top;
            }
            
        } else {
            scaleDivLeft   = scaleDivPos.left;
            scaleDivTop    = scaleDivPos.top;
            scaleDivRight  = $("#img-scale").width() + scaleDivLeft;
            scaleDivBottom = $("#img-scale").height() + scaleDivTop;
        }
        
        if (_scaleDivInfo) {
            // See whether the cursor is no longer inside the hidden scale div.
            // If so, show it again.
            if ((offsetX < scaleDivLeft || offsetX > scaleDivRight) ||
                    (offsetY < scaleDivTop || offsetY > scaleDivBottom)) {
                _scaleDivInfo = null;
                $("#img-scale").show();
            }
        } else if ((offsetX >= scaleDivLeft && offsetX <= scaleDivRight) &&
                (offsetY >= scaleDivTop && offsetY <= scaleDivBottom)) {
            // Handle mouse inside image scale div.
            // But hide it only if the pixel under mouse is also in the image.
            if (offsetX < (imagePos.left + imgWidth) &&
                    offsetY < (imagePos.top + imgHeight)) {
                // Remember image scale div coordinates before hiding it.
                _scaleDivInfo = {left: scaleDivPos.left,
                                 top: scaleDivPos.top,
                                 right: scaleDivRight,
                                 bottom: scaleDivBottom};
                $("#img-scale").hide();
            }
        }
    }
    
    /**
     * Hide image coordinates info tip
     *
     * @param {MouseEvent} e mouse leave event
     */
    function _hideImageTip(e) {
        var $target   = $(e.target),
            targetPos = $target.position(),
            imagePos  = $("#img-preview").position(),
            right     = imagePos.left + $("#img-preview").width(),
            bottom    = imagePos.top + $("#img-preview").height(),
            x         = targetPos.left + e.offsetX,
            y         = targetPos.top + e.offsetY;
        
        // Hide image tip and guides only if the cursor is outside of the image.
        if (x < imagePos.left || x >= right ||
                y < imagePos.top || y >= bottom) {
            _hideGuidesAndTip();
            if (_scaleDivInfo) {
                _scaleDivInfo = null;
                $("#img-scale").show();
            }
        }
    }

    /**
     * Show image coordinates under the mouse cursor
     *
     * @param {MouseEvent} e mouse move event
     */
    function _showImageTip(e) {
        // Don't show image tip if _scale is close to zero.
        // since we won't have enough room to show tip anyway.
        if (Math.floor(_scale) === 0) {
            return;
        }
        
        var x                   = Math.round(e.offsetX * 100 / _scale),
            y                   = Math.round(e.offsetY * 100 / _scale),
            $target             = $(e.target),
            imagePos            = $("#img-preview").position(),
            left                = e.offsetX + imagePos.left,
            top                 = e.offsetY + imagePos.top,
            width               = $("#img-preview").width(),
            height              = $("#img-preview").height(),
            windowWidth         = $(window).width(),
            fourDigitImageWidth = _naturalWidth.toString().length === 4,
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
        if (x < 0 || x >= _naturalWidth || y < 0 || y >= _naturalHeight) {
            _hideImageTip(e);
            $("#img-preview").css("cursor", "auto");
            return;
        }
        
        $("#img-preview").css("cursor", "none");
        
        _handleMouseEnterOrExitScaleSticker(left, top);
        
        // Check whether to show the image tip on the left.
        if ((e.pageX + infoWidth1) > windowWidth ||
                (fourDigitImageWidth && (e.pageX + infoWidth2) > windowWidth)) {
            tipOffsetX = fourDigitImageWidth ? tipMinusOffsetX2 : tipMinusOffsetX1;
        }
        
        $("#x-value").text(x + "px");
        $("#y-value").text(y + "px");

        $("#img-tip").css({
            left: left + tipOffsetX,
            top: top + tipOffsetY
        }).show();
        
        $("#horiz-guide").css({
            left: imagePos.left,
            top: top,
            width: width - 1
        }).show();
        
        $("#vert-guide").css({
            left: left,
            top: imagePos.top,
            height: height - 1
        }).show();
    }
        
    /**
     * sign off listeners when editor manager closes
     * the image viewer
     */
    function onRemove() {
        $(PanelManager).off("editorAreaResize", _onEditorAreaResize);
        $(DocumentManager).off("fileNameChange", _onFileNameChange);
        $("#img").off("mousemove", "#img-preview", _showImageTip)
                 .off("mouseleave", "#img-preview", _hideImageTip);
    }

    /**
     * Perform decorations on the view that require loading the image in the browser,
     * i.e. getting actual and natural width and height andplacing the scale sticker
     * @param {!string} fullPath Path to the image file
     * @param {!jQueryObject} $editorHolder The DOM element to append the view to.
     */
    function render(fullPath, $editorHolder) {
        var relPath = ProjectManager.makeProjectRelativeIfPossible(fullPath),
            $customViewer = $(Mustache.render(ImageHolderTemplate, {fullPath: fullPath}));

        // place DOM node to hold image
        $editorHolder.append($customViewer);

        _scale = 100;   // initialize to 100
        _scaleDivInfo = null;
        
        $("#img-path").text(relPath)
                .attr("title", relPath);
        $("#img-preview").on("load", function () {
            // add dimensions and size
            _naturalWidth = this.naturalWidth;
            _naturalHeight = this.naturalHeight;
            var ext = FileUtils.getFileExtension(fullPath);
            var dimensionString = _naturalWidth + " &times; " + this.naturalHeight + " " + Strings.UNIT_PIXELS;
            if (ext === "ico") {
                dimensionString += " (" + Strings.IMAGE_VIEWER_LARGEST_ICON + ")";
            }
            // get image size
            var file = FileSystem.getFileForPath(fullPath);
            file.stat(function (err, stat) {
                if (err) {
                    $("#img-data").html(dimensionString);
                } else {
                    var sizeString = "";
                    if (stat.size) {
                        sizeString = " &mdash; " + StringUtils.prettyPrintBytes(stat.size, 2);
                    }
                    var dimensionAndSize = dimensionString + sizeString;
                    $("#img-data").html(dimensionAndSize)
                        .attr("title", dimensionAndSize
                                        .replace("&times;", "x")
                                        .replace("&mdash;", "-"));
                }
            });
            $("#image-holder").show();
            
            // listen to resize to  update the scale sticker
            $(PanelManager).on("editorAreaResize", _onEditorAreaResize);
            
            // make sure we always show the right file name
            $(DocumentManager).on("fileNameChange", _onFileNameChange);

            $("#img-tip").hide();
            $(".img-guide").hide();
            $("#img").on("mousemove", "#img-preview", _showImageTip)
                     .on("mouseleave", "#img-preview", _hideImageTip);

            _updateScale($(this).width());

        });
        return $customViewer;
    }
    
    EditorManager.registerCustomViewer("image", {
        render: render,
        onRemove: onRemove
    });
    
    exports.render   = render;
    exports.onRemove = onRemove;
});
