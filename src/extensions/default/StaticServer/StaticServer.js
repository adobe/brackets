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

    var BaseServer  = brackets.getModule("LiveDevelopment/Servers/BaseServer").BaseServer,
        FileUtils   = brackets.getModule("file/FileUtils");

    /**
     * @constructor
     * @extends {BaseServer}
     * Live preview server that uses a built-in HTTP server to serve static
     * and instrumented files.
     *
     * @param {!{baseUrl: string, root: string, pathResolver: function(string), nodeConnection: NodeConnection}} config
     *    Configuration parameters for this server:
     *        baseUrl        - Optional base URL (populated by the current project)
     *        pathResolver   - Function to covert absolute native paths to project relative paths
     *        root           - Native path to the project root (and base URL)
     *        nodeConnection - An active NodeConnection
     */
    function StaticServer(config) {
        this._nodeConnection = config.nodeConnection;
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
        if (!this._nodeConnection.connected()) {
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
        return FileUtils.isStaticHtmlFileExt(localPath);
    };

    /**
     * @private
     * Update the list of paths that fire "request" events
     * @return {jQuery.Promise} Resolved by the StaticServer domain when the message is acknowledged.
     */
    StaticServer.prototype._updateRequestFilterPaths = function () {
        if (!this._nodeConnection.connected()) {
            return;
        }

        var paths = [];

        Object.keys(this._liveDocuments).forEach(function (path) {
            paths.push(path);
        });

        return this._nodeConnection.domains.staticServer.setRequestFilterPaths(this._root, paths);
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
        var readyToServeDeferred = $.Deferred(),
            self = this;

        if (this._nodeConnection.connected()) {
            this._nodeConnection.domains.staticServer.getServer(self._root).done(function (address) {
                self._baseUrl = "http://" + address.address + ":" + address.port + "/";
                readyToServeDeferred.resolve();
            }).fail(function () {
                self._baseUrl = "";
                readyToServeDeferred.reject();
            });
        } else {
            // nodeConnection has been connected once (because the deferred
            // resolved, but is not currently connected).
            //
            // If we are in this case, then the node process has crashed
            // and is in the process of restarting. Once that happens, the
            // node connection will automatically reconnect and reload the
            // domain. Unfortunately, we don't have any promise to wait on
            // to know when that happens. The best we can do is reject this
            // readyToServe so that the user gets an error message to try
            // again later.
            //
            // The user will get the error immediately in this state, and
            // the new node process should start up in a matter of seconds
            // (assuming there isn't a more widespread error). So, asking
            // them to retry in a second is reasonable.
            readyToServeDeferred.reject();
        }
        
        return readyToServeDeferred.promise();
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
        if (this._nodeConnection.connected()) {
            this._nodeConnection.domains.staticServer.writeFilteredResponse(location.root, location.pathname, response);
        }
    };
    
    /**
     * @private
     * Event handler for StaticServerDomain requestFilter event
     * @param {jQuery.Event} event
     * @param {{hostname: string, pathname: string, port: number, root: string}} request
     */
    StaticServer.prototype._onRequestFilter = function (event, request) {
        var key             = request.location.pathname,
            liveDocument    = this._liveDocuments[key],
            response        = null;

        // send instrumented response or null to fallback to static file
        if (liveDocument && liveDocument.getResponseData) {
            response = liveDocument.getResponseData();
        }
        
        this._send(request.location, response);
    };
    
    /**
     * See BaseServer#start. Starts listenting to StaticServerDomain events.
     */
    StaticServer.prototype.start = function () {
        $(this._nodeConnection).on("staticServer.requestFilter", this._onRequestFilter);
    };

    /**
     * See BaseServer#stop. Remove event handlers from StaticServerDomain.
     */
    StaticServer.prototype.stop = function () {
        $(this._nodeConnection).off("staticServer.requestFilter", this._onRequestFilter);
    };

    exports.StaticServer = StaticServer;
});
