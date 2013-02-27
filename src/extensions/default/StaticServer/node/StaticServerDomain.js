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
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var http    = require('http'),
        connect = require('connect');

    /**
     * @private
     * @type {Object.<string, http.Server>}
     * A map from root paths to server instances.
     */
    var _servers = {};
    
    /**
     * @private
     * @type {DomainManager}
     * The DomainManager passed in at init.
     */
    var _domainManager = null;

    /**
     * @private
     * Helper function to create a new server.
     * @param {string} path The absolute path that should be the document root
     * @param {function(?string, ?httpServer)} cb Callback function that receives
     *    an error (or null if there was no error) and the server (or null if there
     *    was an error). 
     */
    function _createServer(path, createCompleteCallback) {
        function requestRoot(server, cb) {
            var address = server.address();
            
            // Request the root file from the project in order to ensure that the
            // server is actually initialized. If we don't do this, it seems like
            // connect takes time to warm up the server.
            var req = http.get(
                {host: address.address, port: address.port},
                function (res) {
                    cb(null, res);
                }
            );
            req.on('error', function (err) {
                cb(err, null);
            });
        }
        
        var app = connect();
        // JSLint complains if we use `connect.static` because static is a
        // reserved word.
        app.use(connect.favicon())
            .use(connect["static"](path))
            .use(connect.directory(path));

        var server = http.createServer(app);
        server.listen(0, '127.0.0.1', function () {
            requestRoot(
                server,
                function (err, res) {
                    if (err) {
                        createCompleteCallback("Could not GET root after launching server", null);
                    } else {
                        createCompleteCallback(null, server);
                    }
                }
            );
        });
    }

    /**
     * @private
     * Handler function for the staticServer.getServer command. If a server
     * already exists for the given path, returns that, otherwise starts a new
     * one.
     * @param {string} path The absolute path that should be the document root
     * @param {function(?string, ?{address: string, family: string,
     *    port: number})} cb Callback that should receive the address information
     *    for the server. First argument is the error string (or null if no error),
     *    second argument is the address object (or null if there was an error).
     *    The "family" property of the address indicates whether the address is,
     *    for example, IPv4, IPv6, or a UNIX socket.
     */
    function _cmdGetServer(path, cb) {
        // Make sure the key doesn't conflict with some built-in property of Object.
        var pathKey = "LiveDev_" + path;
        if (_servers[pathKey]) {
            cb(null, _servers[pathKey].address());
        } else {
            _createServer(path, function (err, server) {
                if (err) {
                    cb(err, null);
                } else {
                    _servers[pathKey] = server;
                    cb(null, server.address());
                }
            });
        }
    }
    
    /**
     * Initializes the StaticServer domain with its commands.
     * @param {DomainManager} DomainManager The DomainManager for the server
     */
    function init(DomainManager) {
        _domainManager = DomainManager;
        if (!_domainManager.hasDomain("staticServer")) {
            _domainManager.registerDomain("staticServer", {major: 0, minor: 1});
        }
        _domainManager.registerCommand(
            "staticServer",
            "getServer",
            _cmdGetServer,
            true,
            "Starts or returns an existing server for the given path.",
            [{name: "path", type: "string"}],
            [{name: "address", type: "{address: string, family: string, port: number}"}]
        );
    }
    
    exports.init = init;
    
}());
