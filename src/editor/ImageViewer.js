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
        ProjectManager      = require("project/ProjectManager"),
        Strings             = require("strings"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem;
    
    /**
     * Convert number of bytes into human readable format
     *
     * @param integer bytes     Number of bytes to convert
     * @param integer precision Number of digits after the decimal separator
     * @return string
     */
    function bytesToSize(bytes, precision) {
        var kilobyte = 1024;
        var megabyte = kilobyte * 1024;
        var gigabyte = megabyte * 1024;
        var terabyte = gigabyte * 1024;
        
        if ((bytes >= 0) && (bytes < kilobyte)) {
            return bytes + ' B';
    
        } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
            return (bytes / kilobyte).toFixed(precision) + ' KB';
    
        } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
            return (bytes / megabyte).toFixed(precision) + ' MB';
    
        } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
            return (bytes / gigabyte).toFixed(precision) + ' GB';
    
        } else if (bytes >= terabyte) {
            return (bytes / terabyte).toFixed(precision) + ' TB';
    
        } else {
            return bytes + ' B';
        }
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
                var dimensionString = this.naturalWidth + " x " + this.naturalHeight + " " + Strings.UNIT_PIXELS;
                // get image size
                var fileEntry = new NativeFileSystem.FileEntry(fullPath);
                fileEntry.getMetadata(
                    function (metadata) {
                        $("#img-data").text(dimensionString  + " - " + bytesToSize(metadata.size, 2));
                        $("#image-holder").show();
                        if ($(this).width() < this.naturalWidth) {
                            scale = Math.floor($(this).width() / this.naturalWidth * 100);
                            $("#img-scale").text(scale + "%")
                                .show();
                        }
                    },
                    function (error) {
                    }
                );
            });
        }
    }
    
    exports.getImageHolder  = getImageHolder;
    exports.render          = render;
});
    