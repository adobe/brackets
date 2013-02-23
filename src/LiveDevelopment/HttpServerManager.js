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

/*
 * HttpServerManager Overview:
 *
 * The HttpServerManager allows extensions to register to be an http server
 * providers. Providers are queried for their ability to serve a page in
 * order of descending priority by way their canServe methods.
 *
 *
 * # HttpServerManager.canServe(url)
 *  
 * Determines whether we can serve url.
 * 
 * @param {String} url 
 * A url to file being served.
 *
 * @return {Boolean} 
 * true for yes, otherwise false.
 *
 * # HttpServerManager.getBaseUrl(url)
 *
 * Determines base url.
 *
 * @param {String} url 
 * A url to file being served.
 *
 * @return {String}
 * Base url for current project.
 *
 *
 * HttpServerProvider Overview:
 *
 * An http server provider must implement the following two functions:
 *
 * HttpServerProvider.canServe(url)
 * HttpServerProvider.getBaseUrl()
 *
 * The behavior of these three functions is described in detail below.
 *
 * # HttpServerProvider.canServe(url)
 *
 * The method by which a provider indicates intent to serbver a url.
 * The manager calls this method when...
 *
 * 
 * param {String} url
 * A url for the page to be served.
 *
 * return {Boolean} 
 * Determines whether the current provider is able to server the url.
 * 
 * 
 * # HttpServerProvider.getBaseUrl()
 * 
 * The method by which a provider provides the base url for the current
 * Brackets project.
 *
 * return {String}
 *
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var FileUtils           = require("file/FileUtils"),
        ProjectManager      = require("project/ProjectManager");
    
    var httpServerProviders   = [];

    /**
     * Comparator to sort providers based on their priority
     */
    function _providerSort(a, b) {
        return b.priority - a.priority;
    }

    /**    
     * Determines which provider can serve a url.
     * 
     * @param {String} url 
     * A url to file being served.
     *
     * @return {HttpServerProvider} 
     * true for yes, otherwise false.
     */
    function _providerCanServe(url) {

        var provider, i;
        
        for (i = 0; i < httpServerProviders.length; i++) {
            provider = httpServerProviders[i].provider;
            if (provider.canServe(url)) {
                return provider;
            }
        }
        
        return null;
    }


    /**    
     * Determines whether we can serve url.
     * 
     * @param {String} url 
     * A url to file being served.
     *
     * @return {Boolean} 
     * true for yes, otherwise false.
     */
    function canServe(url) {

        if (ProjectManager.getBaseUrl() && FileUtils.isServerHtmlFileExt(url)) {
            return true;
        }

        if (_providerCanServe(url)) {
            return true;
        }
        
        return false;
    }

    /**    
     * Determines base url.
     *
     * @param {String} url 
     * A url to file being served.
     *
     * @return {String}
     * Base url for current project.
     */
    function getBaseUrl(url) {

        // First, use ProjectManager base url specified by user
        var userBaseUrl = ProjectManager.getBaseUrl();
        if (userBaseUrl) {
            return userBaseUrl;
        }

        // Next, query all registered providers and getting base url
        // from highest priority provider that can serve file type.
        var provider = _providerCanServe(url);
        if (provider) {
            return provider.getBaseUrl();
        }

        // Otherwise, return empty string
        return "";
    }

    /**    
     * The method by which a HttpServerProvider registers itself.
     *
     * @param {HttpServerProvider} provider
     * The provider to be registered, described below. 
     *
     * @param {Integer} priority
     * A non-negative number used to break ties among providers for a
     * particular url. Providers that register with a higher priority will
     * have the opportunity to provide a given url before those with a
     * lower priority. Brackets default providers have priority zero.
     */
    function registerProvider(providerInfo, priority) {
        var providerObj = { provider: providerInfo,
                            priority: priority || 0 };

        httpServerProviders.push(providerObj);
        httpServerProviders.sort(_providerSort);
    }

    // Define public API
    exports.canServe            = canServe;
    exports.getBaseUrl          = getBaseUrl;
    exports.registerProvider    = registerProvider;
});
