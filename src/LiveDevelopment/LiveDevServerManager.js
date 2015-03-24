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
/*global define */

/**
 * LiveDevServerManager Overview:
 *
 * The LiveDevServerManager allows extensions to register to be Live Development
 * servers. Servers are queried for their ability to serve a page in
 * order of descending priority by way their canServe methods.
 *
 * NOTE: This API is currently experimental and intented to be internal-only.
 * It is very likely that it will be changed in the near future and/or
 * removed entirely.
 *
 *   `LiveDevServerManager.getServer(localPath)`
 *
 * Returns highest priority server (BaseServer) that can serve the local file.
 *
 * A Live Development server must implement the BaseServer API. See
 * LiveDevelopment/Servers/BaseServer base class.
 */
define(function (require, exports, module) {
    "use strict";

    var _serverProviders   = [];

    /**
     * @private
     * Comparator to sort providers based on their priority
     * @param {number} a
     * @param {number} b
     */
    function _providerSort(a, b) {
        return b.priority - a.priority;
    }

    /**
     * Determines which provider can serve a file with a local path.
     *
     * @param {string} localPath A local path to file being served.
     * @return {?BaseServer} A server no null if no servers can serve the file
     */
    function getServer(localPath) {
        var provider, server, i;

        for (i = 0; i < _serverProviders.length; i++) {
            provider = _serverProviders[i];
            server = provider.create();

            if (server.canServe(localPath)) {
                return server;
            }
        }

        return null;
    }

    /**
     * The method by which a server registers itself.
     *
     * @param {BaseServer|{create: function():BaseServer}} provider
     *  The provider to be registered, described below.
     * @param {number} priority
     *  A non-negative number used to break ties among providers for a
     *  particular url. Providers that register with a higher priority will
     *  have the opportunity to provide a given url before those with a
     *  lower priority. The higher the number, the higher the priority.
     */
    function registerServer(provider, priority) {
        if (!provider.create) {
            console.error("Incompatible live development server provider");
            return;
        }

        var providerObj = {};

        providerObj.create = provider.create;
        providerObj.priority = priority || 0;

        _serverProviders.push(providerObj);
        _serverProviders.sort(_providerSort);
    }
    
    // Backwards compatibility
    exports.getProvider         = getServer;
    exports.registerProvider    = registerServer;

    // Define public API
    exports.getServer           = getServer;
    exports.registerServer      = registerServer;
});
