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
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        PanelManager        = require("view/PanelManager"),
        ProjectManager      = require("project/ProjectManager"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils");
    
    var _naturalWidth = 0,
        _scale = 100,
        _scaleDivInfo = null;   // coordinates of hidden scale sticker
    
    /** Update the scale element, i.e. on resize 
     *  @param {!string} currentWidth actual width of image in view
     */
    function _updateScale(currentWidth) {
        if (currentWidth < _naturalWidth) {
            _scale = currentWidth / _naturalWidth * 100;
            $("#img-scale").text(Math.floor(_scale) + "%")
                // Keep the position of the image scale div relative to the image.
                .css("left", $("#img-preview").position().left + 5)
                .show();
        } else {
            $("#img-scale").hide();
        }
    }
    
    /** handle editor resize event, i.e. update scale sticker */
    function _onEditorAreaResize() {
        _updateScale($("#img-preview").width());
    }
        
    /**
     * Update file name if necessary
     */
    function _onFileNameChange(e, oldName, newName) {
        var oldRelPath = ProjectManager.makeProjectRelativeIfPossible(oldName),
            currentPath = $("#img-path").text();

        if (currentPath === oldRelPath) {
            $("#img-path").text(ProjectManager.makeProjectRelativeIfPossible(newName));
        }
    }

    /**
     * Check mouse entering/exiting the scale sticker. 
     * Hide it when entering and show it again when exiting.
     *
     * @param {MouseEvent} e mouse move/leave event
     * @return {boolean} true if mouse entering into the scale sticker
     */
    function _handleMouseEnterOrExitScaleSticker(e) {
        var imagePos = $("#img-preview").position(),
            scaleDivPos = $("#img-scale").position(),
            left = e.offsetX + imagePos.left,
            top = e.offsetY + imagePos.top,
            mouseInScaleDiv = $(e.target).is("#img-scale");
            
        if (mouseInScaleDiv) {
            // Handle mouse inside image scale div.
            // But hide it only if the pixel under mouse is also in the image.
            if ((e.offsetX + scaleDivPos.left) < (imagePos.left + $("#img-preview").width()) &&
                    (e.offsetY + scaleDivPos.top) < (imagePos.top + $("#img-preview").height())) {
                // Remember image scale div coordinates before hiding it.
                _scaleDivInfo = {left: scaleDivPos.left,
                                 top: scaleDivPos.top,
                                 right: scaleDivPos.left + $("#img-scale").width(),
                                 bottom: scaleDivPos.top + $("#img-scale").height()};
                $("#img-scale").hide();
            }
        } else if (_scaleDivInfo) {
            // See whether the cursor is no longer inside the hidden scale div.
            // If so, show it again.
            if ((left < _scaleDivInfo.left || left > _scaleDivInfo.right) ||
                    (top < _scaleDivInfo.top || top > _scaleDivInfo.bottom)) {
                _scaleDivInfo = null;
                $("#img-scale").show();
            }
        }
        return mouseInScaleDiv;
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
        
        var x = Math.floor(e.offsetX * 100 / _scale),
            y = Math.floor(e.offsetY * 100 / _scale),
            imagePos = $("#img-preview").position(),
            left = e.offsetX + imagePos.left,
            top = e.offsetY + imagePos.top,
            windowWidth = $(window).width(),
            fourDigitImageWidth = _naturalWidth.toString().length === 4,
            infoWidth1 = 112,       // info div width 96px + vertical toolbar width 16px
            infoWidth2 = 120,       // info div width 104px (for 4-digit image width) + vertical toolbar width 16px
            tipOffsetX = 6,         // adjustment for info div left from x coordinate of cursor
            tipOffsetY = -48,       // adjustment for info div top from y coordinate of cursor
            tipMinusOffsetX1 = -84, // for less than 4-digit image width
            tipMinusOffsetX2 = -92; // for 4-digit image width 
        
        if (_handleMouseEnterOrExitScaleSticker(e)) {
            // If we're in the scale sticker, then just return.
            return;
        }
        
        // Check whether to show the image tip on the left.
        if ((e.pageX + infoWidth1) > windowWidth ||
                (fourDigitImageWidth && (e.pageX + infoWidth2) > windowWidth)) {
            tipOffsetX = fourDigitImageWidth ? tipMinusOffsetX2 : tipMinusOffsetX1;
        }
        
        // For some reason we're getting -1 for e.offset when hovering over the very 
        // first pixel of a scaled image. So adjust x to 0 if it is negative.
        if (x < 0) {
            x = 0;
        }

        $("#x-value").text(x + "px");
        $("#y-value").text(y + "px");

        $("#img-tip").css({
            left: left + tipOffsetX,
            top: top + tipOffsetY
        }).show();
    }
    
    /**
     * Show image coordinates under the mouse cursor
     *
     * @param {MouseEvent} e mouse leave event
     */
    function _hideImageTip(e) {
        $("#img-tip").hide();
        
        // Ensure image scale div is visible when mouse is outside of the image.
        if ($(e.target).is("#img-preview")) {
            $("#img-scale").show();
        }
    }

    /**
     * creates a DOM node to place in the editor-holder
     * in order to display an image.
     * @param {!string} fullPath  path to image file
     * @return {JQuery}
     *
     */
    function getCustomViewHolder(fullPath) {
        return $(Mustache.render(ImageHolderTemplate, {fullPath: fullPath}));
    }
    
    /** 
     *    
     */
    function _removeListeners() {
        $(PanelManager).off("editorAreaResize", _onEditorAreaResize);
        $(DocumentManager).off("fileNameChange", _onFileNameChange);
        $("#img").off("mousemove", "#img-preview, #img-scale", _showImageTip)
                 .off("mouseleave", "#img-preview, #img-scale", _hideImageTip);
    }
    
    /** 
     * Perform decorations on the view that require loading the image in the browser,
     * i.e. getting actual and natural width and height andplacing the scale sticker
     * @param {!string} fullPath path to the image file
     */
    function render(fullPath) {
        var relPath = ProjectManager.makeProjectRelativeIfPossible(fullPath);

        $("#img-path").text(relPath);
        $("#img-preview").on("load", function () {
            // add dimensions and size
            _naturalWidth = this.naturalWidth;
            var dimensionString = _naturalWidth + " &times; " + this.naturalHeight + " " + Strings.UNIT_PIXELS;
            // get image size
            var fileEntry = new NativeFileSystem.FileEntry(fullPath);
            fileEntry.getMetadata(
                function (metadata) {
                    var sizeString = "";
                    if (metadata && metadata.size) {
                        sizeString = " &mdash; " + StringUtils.prettyPrintBytes(metadata.size, 2);
                    }
                    $("#img-data").html(dimensionString + sizeString);
                },
                function (error) {
                    $("#img-data").html(dimensionString);
                }
            );
            $("#image-holder").show();
            // listen to resize to  update the scale sticker
            $(PanelManager).on("editorAreaResize", _onEditorAreaResize);
            // listen to removal to stop listening to resize events
            $(EditorManager).on("removeCustomViewer", _removeListeners);
            $(DocumentManager).on("fileNameChange", _onFileNameChange);

            $("#img-tip").hide();
            $("#img").on("mousemove", "#img-preview, #img-scale", _showImageTip)
                     .on("mouseleave", "#img-preview, #img-scale", _hideImageTip);

            _scale = 100;   // initialize to 100
            _updateScale($(this).width());
        });
    }
    
    exports.getCustomViewHolder = getCustomViewHolder;
    exports.render              = render;
});
