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
     * @type {?http.Server}
     * The current HTTP server, or null if there isn't one.
     */
    var _server = null;
    
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
     *    either an error string or the newly created server. 
     */
    function createServer(path, cb) {
        var app = connect();
        app.use(connect.favicon())
            .use(connect["static"](path))
            .use(connect.directory(path));

        var server = http.createServer(app);
        server.listen(0, '127.0.0.1', function () {
            cb(null, server);
        });
    }

    /**
     * @private
     * Handler function for the connect.startServer command. Stops any
     * currently running server, and then starts a new server at the
     * specified path
     * @param {string} path The absolute path that should be the document root
     * @param {function(?string, ?{address: string, family: string,
     *    port: number})} cb Callback which sends response to
     *    the requesting client connection. First argument is the error string,
     *    second argument is the address object.
     */
    function cmdStartServer(path, cb) {
        if (_server) {
            try {
                // NOTE: close() stops the server from listening/accepting new
                // connections, but does not close already-open "keep alive"
                // connections
                _server.close();
            } catch (e) { }
            _server = null;
        }
        createServer(path, function (err, server) {
            if (err) {
                cb(err, null);
            } else {
                _server = server;
                cb(null, server.address());
            }
        });
    }
    
    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} DomainManager The DomainManager for the server
     */
    function init(DomainManager) {
        _domainManager = DomainManager;
        if (!_domainManager.hasDomain("connect")) {
            _domainManager.registerDomain("connect", {major: 0, minor: 1});
        }
        _domainManager.registerCommand(
            "connect",
            "startServer",
            cmdStartServer,
            true,
            "Starts a server at the specified path",
            [{name: "path", type: "string"}],
            [{name: "address", type: "{address: string, family: string, port: number}"}]
        );
    }
    
    exports.init = init;
    
}());
