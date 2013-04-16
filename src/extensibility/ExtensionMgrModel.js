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
/*global define, window, $, brackets */
/*unittests: ExtensionMgr*/

define(function (require, exports, module) {
    "use strict";
    
    /**
     * @constructor
     * Constructs a registry model, which fetches/caches/filters the registry and provides
     * information about which extensions are already installed.
     */
    function ExtensionMgrModel() {
    }
    
    /**
     * @private
     * @type {object}
     * The current registry JSON downloaded from teh server.
     */
    ExtensionMgrModel.prototype._registry = null;

    /**
     * Returns the registry of Brackets extensions and caches the result for subsequent
     * calls.
     *
     * @param {boolean} forceDownload Fetch the registry from S3 even if we have a cached copy.
     * @return {$.Promise} a promise that's resolved with the registry JSON data
     * or rejected if the server can't be reached.
     */
    ExtensionMgrModel.prototype.getRegistry = function (forceDownload) {
        var self = this;
        if (!this._registry || forceDownload) {
            return $.getJSON(brackets.config.extension_registry, {cache: false})
                .done(function (data) {
                    self._registry = data;
                });
        } else {
            return new $.Deferred().resolve(this._registry).promise();
        }
    };
    
    exports.ExtensionMgrModel = ExtensionMgrModel;
});