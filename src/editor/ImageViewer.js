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
/*global define, $, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    var LanguageManager     = require("language/LanguageManager"),
        ImageHolderTemplate = require("text!htmlContent/image-holder.html"),
        PanelManager        = require("view/PanelManager"),
        ProjectManager      = require("project/ProjectManager"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem;
    
    var _naturalWidth = 0;
    

    function _updateScale(currentWidth) {
        if (currentWidth < _naturalWidth) {
            var scale = Math.floor(currentWidth / _naturalWidth * 100);
            $("#img-scale").text(scale + "%")
                .show();
        } else {
            $("#img-scale").hide();
        }
    }
    
    /**
     * Update the scale element on reisze
     */
    function onEditorAreaResize() {
        _updateScale($("#img-preview").width());
    }
        
     /**
     * creates a DOM node to place in the editor-holder
     * in order to display an image.
     * @param {?string} path to image file
     * @return {Array.<Editor>}
     *
     */
    function getImageHolder(fullPath) {
        if (!fullPath) {
            return;
        }
        var mode = LanguageManager.getLanguageForPath(fullPath),
            $imageHolder;
        
        if (mode.getId() === "image") {
            $imageHolder = $(Mustache.render(ImageHolderTemplate, {fullPath: fullPath}));
        }
        return $imageHolder;
    }
    /** performs decorations on the view that require loading the image in thebrowser,
    * i.e. getting atural and actual width and height, placing the scale steicker
    *   @param{?string} path to the image file
    */
    function render(fullPath) {
        // null check on the require param
        if (!fullPath) {
            return;
        }
        var relPath = ProjectManager.makeProjectRelativeIfPossible(fullPath),
            scale = 100,
            TEXT_HEIGHT = 170,
            mode = LanguageManager.getLanguageForPath(fullPath);
        
        // only do this if we actually do have an image path
        if (mode.getId() === "image") {
            $("#img-path").text(relPath);
            $("#img-preview").on("load", function () {
                // add dimensions and size
                _naturalWidth = this.naturalWidth;
                var dimensionString = _naturalWidth + " x " + this.naturalHeight + " " + Strings.UNIT_PIXELS;
                // get image size
                var fileEntry = new NativeFileSystem.FileEntry(fullPath);
                fileEntry.getMetadata(
                    function (metadata) {
                        var sizeString = "";
                        if (metadata && metadata.size) {
                            sizeString = " &mdash; " + StringUtils.bytesToSizeString(metadata.size, 2);
                        }
                        $("#img-data").html(dimensionString  + sizeString);
                    },
                    function (error) {
                        $("#img-data").text(dimensionString);
                    }
                );
                $("#image-holder").show();
                _updateScale($(this).width());
            });
        }
    }
    
    exports.getImageHolder      = getImageHolder;
    exports.onEditorAreaResize  = onEditorAreaResize;
    exports.render              = render;
});
    