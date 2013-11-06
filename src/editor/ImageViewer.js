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
        _scale = 100;
    
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
     * Create a DOM node to show the image coordinates under the cursor
     * and two event handlers -- mousemove handler to show the cursor info
     * and mouseleave handler to hide the cursor info
     */
    function _addCursorInfoTip() {
        var $cursorInfo = $("<div id='cursor-info'>").appendTo($("#img")).hide();
        
        $("#img-preview").on("mousemove", function (e) {
            var x = _scale ? Math.floor(e.offsetX * 100 / _scale) : e.offsetX,
                y = _scale ? Math.floor(e.offsetY * 100 / _scale) : e.offsetY,
                tip = "x: ",
                position = $("#img-preview").position(),
                left = e.offsetX + position.left,
                top = e.offsetY + position.top,
                xyDigitDelta = x.toString().length - y.toString().length,
                windowWidth = $(window).width(),
                fourDigitImageWidth = _naturalWidth.toString().length === 4,
                infoWidth1 = 112,       // info div width 96px + vertical toolbar width 16px
                infoWidth2 = 120,       // info div width 104px (for 4-digit image width) + vertical toolbar width 16px
                tipOffsetX = 6,         // adjustment for info div left from x coordinate of cursor
                tipOffsetY = -48,       // adjustment for info div top from y coordinate of cursor
                tipMinusOffsetX1 = -84, // for less than 4-digit image width
                tipMinusOffsetX2 = -92; // for 4-digit image width 
            
            if ((e.pageX + infoWidth1) > windowWidth ||
                    (fourDigitImageWidth && (e.pageX + infoWidth2) > windowWidth)) {
                tipOffsetX = fourDigitImageWidth ? tipMinusOffsetX2 : tipMinusOffsetX1;
            }
            
            // For some reason we're getting -1 for e.offset when hovering over the very 
            // first pixel of a scaled image. So adjust x to 0 if it is negative.
            if (x < 0) {
                x = 0;
                xyDigitDelta--;     // Skip the minus sign in x coordinate
            }
            
            // Pad non-breaking spaces before x coordinate so that x and y are vertically aligned.
            while (xyDigitDelta < 0) {
                tip += "&nbsp;";
                xyDigitDelta++;
            }

            tip += x + " px<br>y: ";

            // Pad non-breaking spaces before y coordinate so that x and y are vertically aligned.
            while (xyDigitDelta > 0) {
                tip += "&nbsp;";
                xyDigitDelta--;
            }
            tip += y + " px";

            $cursorInfo.html(tip).css({
                left: left + tipOffsetX,
                top: top + tipOffsetY
            }).show();
        });
        
        $("#img-preview").on("mouseleave", function () {
            $cursorInfo.hide();
        });
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
            _updateScale($(this).width());
            _addCursorInfoTip();
        });
    }
    
    exports.getCustomViewHolder = getCustomViewHolder;
    exports.render              = render;
});
