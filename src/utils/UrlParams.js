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
/*global define, window */

define(function (require, exports, module) {
    "use strict";
    
    var _ = require("lodash");
    
    /**
     * Convert between URL querystring and name/value pairs. Decodes and encodes URL parameters.
     */
    function UrlParams() {
        this._store = {};
    }
    
    /**
     * Parse the window location by default. Optionally specify a URL to parse.
     * @param {string} url
     */
    UrlParams.prototype.parse = function (url) {
        if (url) {
            url = url.substring(url.indexOf("?") + 1);
        } else {
            url = window.document.location.search.substring(1);
        }
        
        var urlParams = url.split("&"),
            p,
            self = this;
        
        urlParams.forEach(function (param) {
            p = param.split("=");
            self._store[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
        });
    };
    
    /**
     * Store a name/value string pair
     * @param {!string} name
     * @param {!string} value
     */
    UrlParams.prototype.put = function (name, value) {
        this._store[name] = value;
    };
    
    /**
     * Retreive a value by name
     * @param {!string} name
     */
    UrlParams.prototype.get = function (name) {
        return this._store[name];
    };
    
    /**
     * Encode name/value pairs as URI components.
     */
    UrlParams.prototype.toString = function () {
        var strs = [],
            self = this;
        
        _.forEach(self._store, function (value, key) {
            strs.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
        });
        
        return strs.join("&");
    };

    // Define public API
    exports.UrlParams = UrlParams;
});