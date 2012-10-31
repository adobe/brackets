/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, brackets */

/**
 * ExtensionUtils defines utility methods for implementing extensions.
 */
define(function (require, exports, module) {
    "use strict";
    
    /**
     * Loads a style sheet relative to the extension module.
     *
     * @param {!module} module Module provided by RequireJS
     * @param {!string} path Relative path from the extension folder to a CSS file
     * @return {!$.Promise} A promise object that is resolved if the CSS file can be loaded.
     */
    function loadStyleSheet(module, path) {
        var modulePath = module.uri.substr(0, module.uri.lastIndexOf("/") + 1),
            url = encodeURI(modulePath + path),
            result = new $.Deferred();

        // Make a request for the same file in order to record success or failure.
        // The link element's onload and onerror events are not consistently supported.
        // On Windows, $.get() fails if the url is a full pathname. To work around this,
        // prepend "file:///". On the Mac, $.get() works fine if the url is a full pathname,
        // but *doesn't* work if it is prepended with "file://". Go figure.
        var getUrl = url;
        
        if (brackets.platform === "win" && url.indexOf(":") !== -1) {
            getUrl = "file:///" + url;
        }
        
        $.get(getUrl).done(function () {
            var $link = $("<link/>");
            
            $link.attr({
                type:       "text/css",
                rel:        "stylesheet",
                href:       url
            });
            
            $("head").append($link[0]);
            
            result.resolve($link[0]);
        }).fail(function (err) {
            result.reject(err);
        });
        
        return result;
    }
    
    exports.loadStyleSheet = loadStyleSheet;
});
