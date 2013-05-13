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

    var AppInit              = brackets.getModule("utils/AppInit"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        FileUtils            = brackets.getModule("file/FileUtils"),
        LiveDevServerManager = brackets.getModule("LiveDevelopment/LiveDevServerManager"),
        NodeConnection       = brackets.getModule("utils/NodeConnection"),
        ProjectManager       = brackets.getModule("project/ProjectManager");

    /**
     * @const
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the static server in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 30000; // 30 seconds
    
    /**
     * @private
     * @type{jQuery.Deferred.<NodeConnection>}
     * A deferred which is resolved with a NodeConnection or rejected if
     * we are unable to connect to Node.
     */
    var _nodeConnectionDeferred = $.Deferred();
    
    /**
     * @private
     * @type {NodeConnection}
     */
    var _nodeConnection = new NodeConnection();
    
    var _baseUrl = "";

    /**
     * @constructor
     * 
     * StaticServerProvider dispatches the following events:
     * 
     * request -- Passes {location: {hostname: string, port: number, root: string, pathname: string}, send: function({body: string}) }
     *     Listeners define paths to intercept requests for by supplying those
     *     paths to setRequestFilterPaths([path1,...,pathN]).
     *
     *     When requests for those paths are received on the server, StaticServerProvider
     *     creates a "request" event with a send() callback that allows the listener to
     *     override the default static file server response.
     *
     *     Listeners to this event should be installed before any HTTP
     *     requests are sent to the server.
     */
    function StaticServerProvider() {}

    /**
     * @private
     * @type {string}
     * Absolute file system path for the root of a server
     */
    StaticServerProvider.prototype.root = null;

    /**
     * Determines whether we can serve local file.
     * 
     * @param {String} localPath
     * A local path to file being served.
     *
     * @return {Boolean} 
     * true for yes, otherwise false.
     */
    StaticServerProvider.prototype.canServe = function (localPath) {

        if (!_nodeConnection.connected()) {
            return false;
        }
        
        if (!ProjectManager.isWithinProject(localPath)) {
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
     * Returns a base url for current project. 
     *
     * @return {String}
     * Base url for current project.
     */
    StaticServerProvider.prototype.getBaseUrl = function () {
        return _baseUrl;
    };

    /**
     * # LiveDevServerProvider.readyToServe()
     *
     * Gets the server details from the StaticServerDomain in node.
     * The domain itself handles starting a server if necessary (when
     * the staticServer.getServer command is called).
     *
     * @return {jQuery.Promise} A promise that resolves/rejects when 
     *     the server is ready/failed.
     */
    StaticServerProvider.prototype.readyToServe = function () {
        var readyToServeDeferred = $.Deferred(),
            self = this;

        if (_nodeConnection.connected()) {
            self.root = ProjectManager.getProjectRoot().fullPath;

            _nodeConnection.domains.staticServer.getServer(self.root).done(function (address) {
                _baseUrl = "http://" + address.address + ":" + address.port + "/";
                readyToServeDeferred.resolve();
            }).fail(function () {
                _baseUrl = "";
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
     * Defines a set of paths from a server's root path to watch and fire "request" events for.
     * 
     * @param {Array.<string>} paths An array of root-relative paths to watch.
     *     Each path should begin with a forward slash "/".
     */
    StaticServerProvider.prototype.setRequestFilterPaths = function (paths) {
        var self = this;

        if (_nodeConnection.connected()) {
            return _nodeConnection.domains.staticServer.setRequestFilterPaths(self.root, paths);
        }

        return new $.Deferred().reject().promise();
    };

    /**
     * @private
     * Callback for "request" event handlers to override the HTTP ServerResponse.
     */
    function _send(location) {
        return function (resData) {
            if (_nodeConnection.connected()) {
                return _nodeConnection.domains.staticServer.writeFilteredResponse(location.root, location.pathname, resData);
            }

            return new $.Deferred().reject().promise();
        };
    }

    /**
     * @private
     * @type{StaticServerProvider}
     * Stores the singleton StaticServerProvider for use in unit testing.
     */
    var _staticServerProvider = new StaticServerProvider();
    
    /**
     * @private
     * @return {StaticServerProvider} The singleton StaticServerProvider initialized
     * on app ready.
     */
    function _getStaticServerProvider() {
        return _staticServerProvider;
    }

    /**
     * Allows access to the deferred that manages the node connection. This
     * is *only* for unit tests. Messing with this not in testing will
     * potentially break everything.
     *
     * @private
     * @return {jQuery.Deferred} The deferred that manages the node connection
     */
    function _getNodeConnectionDeferred() {
        return _nodeConnectionDeferred;
    }
    
    AppInit.appReady(function () {
        // Register as a Live Development server provider
        LiveDevServerManager.registerProvider(_staticServerProvider, 5);
        
        // Start up the node connection, which is held in the
        // _nodeConnectionDeferred module variable. (Use 
        // _nodeConnectionDeferred.done() to access it.
        var connectionTimeout = setTimeout(function () {
            console.error("[StaticServer] Timed out while trying to connect to node");
            _nodeConnectionDeferred.reject();
        }, NODE_CONNECTION_TIMEOUT);
        
        _nodeConnection.connect(true).then(function () {
            _nodeConnection.loadDomains(
                [ExtensionUtils.getModulePath(module, "node/StaticServerDomain")],
                true
            ).then(
                function () {
                    var $staticServerProvider = $(_staticServerProvider);
                    
                    $(_nodeConnection).on("staticServer.requestFilter", function (event, request) {
                        /* create result object to pass to event handlers */
                        var requestData = {
                            headers     : request.headers,
                            location    : request.location,
                            send        : _send(request.location)
                        };

                        $staticServerProvider.triggerHandler("request", [requestData]);
                    });

                    clearTimeout(connectionTimeout);
                    _nodeConnectionDeferred.resolveWith(null, [_nodeConnection]);
                },
                function () { // Failed to connect
                    console.error("[StaticServer] Failed to connect to node", arguments);
                    _nodeConnectionDeferred.reject();
                }
            );
        });
        
        if (brackets.test) {
            brackets.test.extensions.StaticServer = module.exports;
        }
    });

    // For unit tests only
    exports._getStaticServerProvider = _getStaticServerProvider;
    exports._getNodeConnectionDeferred = _getNodeConnectionDeferred;
});
