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
 * LiveDevServerManager Overview:
 *
 * The LiveDevServerManager allows extensions to register to be Live Development
 * server providers. Providers are queried for their ability to serve a page in
 * order of descending priority by way their canServe methods.
 *
 * NOTE: This API is currently experimental and intented to be internal-only.
 * It is very likely that it will be changed in the near future and/or
 * removed entirely.
 *
 * # LiveDevServerManager.getProvider(localPath)
 *
 * Returns highest priority provider that can serve the local file.
 *
 * @param {String} url
 * A url to file being served.
 *
 * @return {LiveDevServerProvider}
 * Provider or null.
 *
 *
 * LiveDevServerProvider Overview:
 *
 * A Live Development server provider must implement the following three functions:
 *
 * LiveDevServerProvider.canServe(localPath)
 * LiveDevServerProvider.getBaseUrl()
 * LiveDevServerProvider.readyToServe()
 *
 * The behavior of these three functions is described in detail below.
 *
 * # LiveDevServerProvider.canServe(localPath)
 *
 * The method by which a provider indicates intent to serve a local file.
 * The manager calls this method when querying providers
 *
 * param {String} url
 * A url for the page to be served.
 *
 * return {Boolean}
 * Determines whether the current provider is able to serve the url.
 *
 *
 * # LiveDevServerProvider.getBaseUrl()
 *
 * The method by which a provider provides the base url for the current
 * Brackets project.
 *
 * return {String}
 *
 *
 * # LiveDevServerProvider.readyToServe()
 *
 * This method is called when Live Development is starting to check if the
 * provider that has been selected is ready to serve. The provider returns a
 * jQuery promise. The Live Development launch process waits until the promise
 * resolves/rejects. If the promise rejects, an error window is shown
 * and Live Development does not start.
 *
 * return {jQuery.Promise}
 *
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var FileUtils           = require("file/FileUtils"),
        ProjectManager      = require("project/ProjectManager");

    var _serverProviders   = [];

    /**
     * Comparator to sort providers based on their priority
     */
    function _providerSort(a, b) {
        return b.priority - a.priority;
    }

    /**
     * Determines which provider can serve a file with a local path.
     *
     * @param {String} localPath
     * A local path to file being served.
     *
     * @return {LiveDevServerProvider}
     * true for yes, otherwise false.
     */
    function getProvider(localPath) {

        var provider, i;

        for (i = 0; i < _serverProviders.length; i++) {
            provider = _serverProviders[i].provider;
            if (provider.canServe(localPath)) {
                return provider;
            }
        }

        return null;
    }

    /**
     * The method by which a LiveDevServerProvider registers itself.
     *
     * @param {LiveDevServerProvider} provider
     * The provider to be registered, described below.
     *
     * @param {Integer} priority
     * A non-negative number used to break ties among providers for a
     * particular url. Providers that register with a higher priority will
     * have the opportunity to provide a given url before those with a
     * lower priority. The higher the number, the higher the priority.
     */
    function registerProvider(provider, priority) {
        var providerObj = { provider: provider,
                            priority: priority || 0 };

        _serverProviders.push(providerObj);
        _serverProviders.sort(_providerSort);
    }

    // Define public API
    exports.getProvider         = getProvider;
    exports.registerProvider    = registerProvider;
});
