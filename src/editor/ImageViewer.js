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
    
    var LanguageManager     = require("language/LanguageManager"),
        ImageHolderTemplate = require("text!htmlContent/image-holder.html"),
        ProjectManager      = require("project/ProjectManager"),
        Strings             = require("strings");
    
    
    function getImageHolder(fullPath) {
        var mode = LanguageManager.getLanguageForPath(fullPath),
            $imageHolder;
        
        if (mode.getId() === "image") {
            $imageHolder = $(Mustache.render(ImageHolderTemplate, {fullPath: fullPath}));
            $imageHolder.css("display", "none");
        }
        return $imageHolder;
    }
    
    function renderImageViewer(currentlyViewedFile) {
        var relPath = ProjectManager.makeProjectRelativeIfPossible(currentlyViewedFile);
        $("#img-path").text(relPath);
        // display image in center
        // TODO determine file type here to show image viewer or else
        // to make this code independent of image viewer
        $("#img-preview").on("load", function () {
            // add size
            $("#img-data").text(this.naturalWidth + " x " + this.naturalHeight + " " + Strings.UNIT_PIXELS);
            // position in center
            var marginLeft = Math.floor($("#editor-holder").width() / 2 - this.naturalWidth / 2);
            var marginTop = Math.floor($("#editor-holder").height() / 2 - this.naturalHeight / 2);
            $("#image-holder").css("margin-left", (marginLeft > 0 ? marginLeft : 0));
            $("#image-holder").css("margin-top", (marginTop > 0 ? marginTop : 0));
            
            $("#image-holder").show();
        });
    }
    
    exports.getImageHolder      = getImageHolder;
    exports.renderImageViewer   = renderImageViewer;
});
    