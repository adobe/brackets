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
     * @type {number}
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the static server in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 30000; // 30 seconds
    
    /**
     * @const
     * @type {number}
     * Amount of time to wait before giving an error that this particular
     * live development launching has failed. Could timeout if it is taking
     * an especially long time to create a server due to other high
     * load on the node process.
     */
    var READY_TO_SERVE_TIMEOUT = 3000; // 3 seconds
    
    
    /**
     * @private
     * @type{jQuery.Deferred.<NodeConnection>}
     * A deferred which is resolved with a NodeConnection or rejected if
     * we are unable to connect to Node.
     */
    var _nodeConnectionDeferred = $.Deferred();
    
    var _baseUrl = "";

    /**
     * @constructor
     */
    function StaticServerProvider() {}

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

        if (_nodeConnectionDeferred.isRejected()) {
            // connecting to node has completely failed, so we will
            // never be able to use this provider
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
        var readyToServeDeferred = $.Deferred();

        // Setup timeout so that user isn't left waiting forever without feedback
        var readyToServeTimeout = setTimeout(function () {
            console.error("[StaticServer] Timed out while trying to start a new server in readyToServe");
            readyToServeDeferred.reject();
        }, READY_TO_SERVE_TIMEOUT);
        readyToServeDeferred.always(function () {
            clearTimeout(readyToServeTimeout);
        });
        
        _nodeConnectionDeferred.done(function (nodeConnection) {
            if (nodeConnection.connected()) {
                nodeConnection.domains.staticServer.getServer(
                    ProjectManager.getProjectRoot().fullPath
                ).done(function (address) {
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
        });
        
        _nodeConnectionDeferred.fail(function () {
            readyToServeDeferred.reject();
        });
        
        
        return readyToServeDeferred.promise();
    };

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
        _nodeConnectionDeferred.always(function () {
            clearTimeout(connectionTimeout);
        });
        
        var _nodeConnection = new NodeConnection();
        _nodeConnection.connect(true).then(
            function () { // Succeeded in connecting, now load domain
                _nodeConnection.loadDomains(
                    [ExtensionUtils.getModulePath(module, "node/StaticServerDomain")],
                    true
                ).then(
                    function () { // Succeeded in loading domain
                        _nodeConnectionDeferred.resolveWith(null, [_nodeConnection]);
                    },
                    function () { // Failed to load domain
                        console.error("[StaticServer] Failed to load StaticServerDomain in node", arguments);
                        _nodeConnectionDeferred.reject();
                    }
                );
            },
            function () { // Failed to connect
                console.error("[StaticServer] Failed to connect to node", arguments);
                _nodeConnectionDeferred.reject();
            }
        );
    });

    // For unit tests only
    exports._getStaticServerProvider = _getStaticServerProvider;
});
