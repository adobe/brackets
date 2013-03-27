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
    
    var http    = require("http"),
        connect = require("connect"),
        utils   = require("connect/lib/utils"),
        parse   = utils.parseUrl;
    
    var _domainManager;

    /**
     * When Chrome has a css stylesheet replaced over live development,
     * it re-checks any image urls in the new css stylesheet. If it has
     * to hit the server to check them, this is asynchronous, so it causes
     * two re-layouts of the webpage, which causes flickering. By setting
     * a max age of five seconds, Chrome won't bother to hit the server
     * on each keystroke. So, flickers will happen at most once every five
     * seconds.
     *
     * @const
     * @type {number}
     */
    var STATIC_CACHE_MAX_AGE = 5000; // 5 seconds
    
    /**
     * @private
     * @type {Object.<string, http.Server>}
     * A map from root paths to server instances.
     */
    var _servers = {};
    
    /**
     * @private
     * @type {Object.<string, {Object.<string, http.ServerResponse>}}
     * A map from root paths to its request/response mapping.
     */
    var _requests = {};
    
    /**
     * @private
     * @type {Object.<string, {Object.<string>}}
     * A map from root paths to relative paths to rewrite
     */
    var _rewritePaths = {};

    var PATH_KEY_PREFIX = "LiveDev_";
    
    function normalizeRootPath(path) {
        return (path.lastIndexOf("/") === path.length - 1) ? path.slice(0, -1) : path;
    }
    
    function getPathKey(path) {
        return PATH_KEY_PREFIX + normalizeRootPath(path);
    }
    
    /**
     * @private
     * Helper function to create a new server.
     * @param {string} path The absolute path that should be the document root
     * @param {function(?string, ?httpServer)} cb Callback function that receives
     *    an error (or null if there was no error) and the server (or null if there
     *    was an error). 
     */
    function _createServer(path, createCompleteCallback) {
        var server,
            app,
            address,
            pathKey = getPathKey(path);
        
        function requestRoot(server, cb) {
            address = server.address();
            
            // Request the root file from the project in order to ensure that the
            // server is actually initialized. If we don't do this, it seems like
            // connect takes time to warm up the server.
            var req = http.get(
                {host: address.address, port: address.port},
                function (res) {
                    cb(null, res);
                }
            );
            req.on("error", function (err) {
                cb(err, null);
            });
        }
        
        function rewrite(req, res, next) {
            var location = {pathname: parse(req).pathname},
                filepath = location.filepath = path + location.pathname,
                hasListener = _rewritePaths[pathKey] && _rewritePaths[pathKey][location.pathname];
            
            if (("GET" !== req.method && "HEAD" !== req.method) || !hasListener) {
                return next();
            }
            
            console.log(filepath);
            var pause = utils.pause(req);
            
            function resume() {
                next();
                pause.resume();
            }
            
            // map request pathname to response
            _requests[pathKey][location.pathname] = {
                req: req,
                res: res,
                pause: pause
            };
            
            location.hostname = address.address;
            location.port = address.port;
            location.root = path;
            
            _domainManager.emitEvent("staticServer", "request", [location]);
            
            // set a timeout if custom responses are not returned
            setTimeout(function () {
                if (_requests[pathKey][location.pathname]) {
                    resume();
                }
            }, 5000);
        }
        
        app = connect();
        app.use(rewrite);
        // JSLint complains if we use `connect.static` because static is a
        // reserved word.
        app.use(connect["static"](path, { maxAge: STATIC_CACHE_MAX_AGE }));
        app.use(connect.directory(path));

        server = http.createServer(app);
        server.listen(0, "127.0.0.1", function () {
            // create a new map for this server's requests
            _requests[pathKey] = {};
            
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
        var pathKey = getPathKey(path);
        if (_servers[pathKey]) {
            cb(null, _servers[pathKey].address());
        } else {
            _createServer(path, function (err, server) {
                if (err) {
                    cb(err, null);
                } else {
                    _servers[pathKey] = server;
                    _rewritePaths[pathKey] = {};
                    cb(null, server.address());
                }
            });
        }
    }
    
    /**
     * @private
     * Handler function for the staticServer.closeServer command. If a server
     * exists for the given path, closes it, otherwise does nothing. Note that
     * this function doesn't wait for the actual socket to close, since the
     * server will actually wait for all client connections to close (which can
     * be awhile); but once it returns, you're guaranteed to get a different
     * server the next time you call getServer() on the same path.
     *
     * @param {string} path The absolute path whose server we should close.
     * @return {boolean} true if there was a server for that path, false otherwise
     */
    function _cmdCloseServer(path, cba) {
        var pathKey = getPathKey(path);
        if (_servers[pathKey]) {
            var serverToClose = _servers[pathKey];
            delete _servers[pathKey];
            serverToClose.close();
            return true;
        }
        return false;
    }
    
    function _cmdSetRequestFilter(root, paths) {
        var rootPath = normalizeRootPath(root),
            pathKey  = getPathKey(root),
            rewritePaths = _rewritePaths[pathKey];
        
        paths.forEach(function (path) {
            path = (path.indexOf("/") === 0) ? path : "/" + path;
            rewritePaths[path] = root + path;
        });
    }
    
    function _cmdRewriteResponse(root, path, resData) {
        var pathKey  = getPathKey(root),
            request = _requests[pathKey][path],
            pause = request.pause,
            res = request.res;

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(resData.body);

        pause.resume();
    }
    
    /**
     * Initializes the StaticServer domain with its commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        _domainManager = domainManager;
        
        if (!domainManager.hasDomain("staticServer")) {
            domainManager.registerDomain("staticServer", {major: 0, minor: 1});
        }
        _domainManager.registerCommand(
            "staticServer",
            "getServer",
            _cmdGetServer,
            true,
            "Starts or returns an existing server for the given path.",
            [{
                name: "path",
                type: "string",
                description: "absolute filesystem path for root of server"
            }],
            [{
                name: "address",
                type: "{address: string, family: string, port: number}",
                description: "hostname (stored in 'address' parameter), port, and socket type (stored in 'family' parameter) for the server. Currently, 'family' will always be 'IPv4'."
            }]
        );
        _domainManager.registerCommand(
            "staticServer",
            "closeServer",
            _cmdCloseServer,
            false,
            "Closes the server for the given path.",
            [{
                name: "path",
                type: "string",
                description: "absolute filesystem path for root of server"
            }],
            [{
                name: "result",
                type: "boolean",
                description: "indicates whether a server was found for the specific path then closed"
            }]
        );
        _domainManager.registerCommand(
            "staticServer",
            "setRequestFilter",
            _cmdSetRequestFilter,
            true,
            "Rewrite response for a given path from.",
            [{
                name: "root",
                type: "string",
                description: "absolute filesystem path for root of server"
            }],
            [{
                name: "paths",
                type: "Array",
                description: "path to notify"
            }]
        );
        _domainManager.registerCommand(
            "staticServer",
            "writeResponse",
            _cmdRewriteResponse,
            true,
            "Rewrite response for a given path from.",
            [{
                name: "root",
                type: "string",
                description: "absolute filesystem path for root of server"
            }],
            [{
                name: "path",
                type: "string",
                description: "path to rewrite"
            }],
            [{
                name: "response",
                type: "{body: string, headers: Array}",
                description: "TODO"
            }]
        );
        _domainManager.registerEvent(
            "staticServer",
            "request",
            [{
                name: "location",
                type: "{filepath: string, host: string, hostname: string, port: number, pathname: string, root: string}",
                description: "request path"
            }]
        );
    }
    
    exports.init = init;
    
}());
