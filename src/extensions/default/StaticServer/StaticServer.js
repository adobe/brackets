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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global $, define, brackets */

define(function (require, exports, module) {
    "use strict";

    var BaseServer           = brackets.getModule("LiveDevelopment/Servers/BaseServer").BaseServer,
        LiveDevelopmentUtils = brackets.getModule("LiveDevelopment/LiveDevelopmentUtils"),
        PreferencesManager   = brackets.getModule("preferences/PreferencesManager");

    
    /**
     * @private
     * 
     * Prefences manager for this extension
     */
    var _prefs = PreferencesManager.getExtensionPrefs("staticserver");

    /**
     * @constructor
     * @extends {BaseServer}
     * Live preview server that uses a built-in HTTP server to serve static
     * and instrumented files.
     *
     * @param {!{baseUrl: string, root: string, pathResolver: function(string), nodeDomain: NodeDomain}} config
     *    Configuration parameters for this server:
     *        baseUrl        - Optional base URL (populated by the current project)
     *        pathResolver   - Function to covert absolute native paths to project relative paths
     *        root           - Native path to the project root (and base URL)
     *        nodeDomain     - An initialized NodeDomain
     */
    function StaticServer(config) {
        this._nodeDomain = config.nodeDomain;
        this._onRequestFilter = this._onRequestFilter.bind(this);

        BaseServer.call(this, config);
    }
    
    StaticServer.prototype = Object.create(BaseServer.prototype);
    StaticServer.prototype.constructor = StaticServer;

    /**
     * Determines whether we can serve local file.
     * @param {string} localPath A local path to file being served.
     * @return {boolean} true for yes, otherwise false.
     */
    StaticServer.prototype.canServe = function (localPath) {
        if (!this._nodeDomain.ready()) {
            return false;
        }
        
        // If we can't transform the local path to a project relative path,
        // the path cannot be served
        if (localPath === this._pathResolver(localPath)) {
            return false;
        }

        // Url ending in "/" implies default file, which is usually index.html.
        // Return true to indicate that we can serve it.
        if (localPath.match(/\/$/)) {
            return true;
        }

        // FUTURE: do a MIME Type lookup on file extension
        return LiveDevelopmentUtils.isStaticHtmlFileExt(localPath);
    };

    /**
     * @private
     * Update the list of paths that fire "request" events
     * @return {jQuery.Promise} Resolved by the StaticServer domain when the message is acknowledged.
     */
    StaticServer.prototype._updateRequestFilterPaths = function () {
        var paths = Object.keys(this._liveDocuments);

        return this._nodeDomain.exec("setRequestFilterPaths", this._root, paths);
    };

    /**
     * Gets the server details from the StaticServerDomain in node.
     * The domain itself handles starting a server if necessary (when
     * the staticServer.getServer command is called).
     *
     * @return {jQuery.Promise} A promise that resolves/rejects when 
     *     the server is ready/failed.
     */
    StaticServer.prototype.readyToServe = function () {
        var self = this;
        var deferred = new $.Deferred();

        function sanitizePort(port) {
            port = parseInt(port, 10);
            port = (port && !isNaN(port) && port > 0 && port < 65536) ? port : 0;
            return port;
        }

        function onSuccess(address) {
            self._baseUrl = "http://" + address.address + ":" + address.port + "/";
            deferred.resolve();
        }

        function onFailure() {
            self._baseUrl = "";
            deferred.resolve();
        }

        var port = sanitizePort(_prefs.get("port"));

        this._nodeDomain.exec("getServer", self._root, port)
            .done(function (address) {

                // If the port returned wasn't what was requested, then the preference has
                // changed. Close the current server, and open a new one with the new port.
                if (address.port !== port && port > 0) {
                    return self._nodeDomain.exec("closeServer", self._root)
                        .done(function () {
                            return self._nodeDomain.exec("getServer", self._root, port)
                                .done(onSuccess)
                                .fail(onFailure);
                        })
                        .fail(onFailure);
                }

                onSuccess(address);
            })
            .fail(onFailure);

        return deferred.promise();
    };

    /**
     * See BaseServer#add. StaticServer ignores documents that do not have
     * a setInstrumentationEnabled method. Updates request filters.
     */
    StaticServer.prototype.add = function (liveDocument) {
        if (liveDocument.setInstrumentationEnabled) {
            // enable instrumentation
            liveDocument.setInstrumentationEnabled(true);
        }
        
        BaseServer.prototype.add.call(this, liveDocument);
        
        // update the paths to watch
        this._updateRequestFilterPaths();
    };

    /**
     * See BaseServer#remove. Updates request filters.
     */
    StaticServer.prototype.remove = function (liveDocument) {
        BaseServer.prototype.remove.call(this, liveDocument);
        
        this._updateRequestFilterPaths();
    };

    /**
     * See BaseServer#clear. Updates request filters.
     */
    StaticServer.prototype.clear = function () {
        BaseServer.prototype.clear.call(this);
        
        this._updateRequestFilterPaths();
    };
    
    /**
     * @private
     * Send HTTP response data back to the StaticServerSomain
     */
    StaticServer.prototype._send = function (location, response) {
        this._nodeDomain.exec("writeFilteredResponse", location.root, location.pathname, response);
    };
    
    /**
     * @private
     * Event handler for StaticServerDomain requestFilter event
     * @param {jQuery.Event} event
     * @param {{hostname: string, pathname: string, port: number, root: string, id: number}} request
     */
    StaticServer.prototype._onRequestFilter = function (event, request) {
        var key             = request.location.pathname,
            liveDocument    = this._liveDocuments[key],
            response;
        
        // send instrumented response or null to fallback to static file
        if (liveDocument && liveDocument.getResponseData) {
            response = liveDocument.getResponseData();
        } else {
            response = {};  // let server fall back on loading file off disk
        }
        response.id = request.id;
        
        this._send(request.location, response);
    };
    
    /**
     * See BaseServer#start. Starts listenting to StaticServerDomain events.
     */
    StaticServer.prototype.start = function () {
        this._nodeDomain.on("requestFilter", this._onRequestFilter);
    };

    /**
     * See BaseServer#stop. Remove event handlers from StaticServerDomain.
     */
    StaticServer.prototype.stop = function () {
        this._nodeDomain.off("requestFilter", this._onRequestFilter);
    };

    module.exports = StaticServer;
});
