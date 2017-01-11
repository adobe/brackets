/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*eslint-env node */
/*jslint node: true */
"use strict";

var http     = require("http"),
    pathJoin = require("path").join,
    connect  = require("connect"),
    utils    = require("connect/lib/utils"),
    mime     = require("connect/node_modules/send/node_modules/mime"),
    parse    = utils.parseUrl;

var _domainManager;

var FILTER_REQUEST_TIMEOUT = 5000;

/**
 * @private
 * @type {number}
 * Used to assign unique identifiers to each filter request
 */
var _filterRequestCounter = 0;

/**
 * @private
 * @type {number}
 * Duration to wait before passing a filtered request to the static file server.
 */
var _filterRequestTimeout = FILTER_REQUEST_TIMEOUT;

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
 * @type {Object.<string, {Object.<number, http.ServerResponse>}}
 * A map from a request identifier to its request/response mapping.
 */
var _requests = {};

/**
 * @private
 * @type {Object.<string, {Object.<string>}}
 * A map from root paths to relative paths to rewrite
 */
var _rewritePaths = {};

var PATH_KEY_PREFIX = "LiveDev_";

/**
 * @private
 * Removes trailing forward slash for the project root absolute path
 * @param {string} path Absolute path for a server
 * @returns {string}
 */
function normalizeRootPath(path) {
    return (path && path[path.length - 1] === "/") ? path.slice(0, -1) : path;
}

/**
 * @private
 * Generates a key based on a server's absolute path
 * @param {string} path Absolute path for a server
 * @returns {string}
 */
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
function _createServer(path, port, createCompleteCallback) {
    var server,
        app,
        address,
        pathKey = getPathKey(path);

    // create a new map for this server's requests
    _requests[pathKey] = {};

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
            hasListener = _rewritePaths[pathKey] && _rewritePaths[pathKey][location.pathname],
            requestId = _filterRequestCounter++,
            timeoutId;

        // ignore most HTTP methods and files that we're not watching
        if (("GET" !== req.method && "HEAD" !== req.method) || !hasListener) {
            next();
            return;
        }

        // pause the request and wait for listeners to possibly respond
        var pause = utils.pause(req);

        function resume(doNext) {
            // delete the callback after it's used or we hit the timeout.
            // if this path is requested again, a new callback is generated.
            delete _requests[pathKey][requestId];

            // pass request to next middleware
            if (doNext) {
                next();
            }

            pause.resume();
        }

        // map request pathname to response callback
        _requests[pathKey][requestId] = function (resData) {
            // clear timeout immediately when this callback is called
            clearTimeout(timeoutId);

            // response data is optional
            if (resData.body) {
                // HTTP headers
                var type    = mime.lookup(location.pathname),
                    charset = mime.charsets.lookup(type);

                res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));

                // TODO (jasonsanjose): off-by-1 error here, why?
                // Chrome seems to handle the request without issues when Content-Length is not specified
                //res.setHeader("Content-Length", Buffer.byteLength(resData.body /* TODO encoding? */));

                // response body
                res.end(resData.body);
            }

            // resume the HTTP ServerResponse, pass to next middleware if
            // no response data was passed
            resume(!resData.body);
        };

        location.hostname = address.address;
        location.port = address.port;
        location.root = path;

        var request = {
            headers:    req.headers,
            location:   location,
            id:         requestId
        };

        // dispatch request event
        _domainManager.emitEvent("staticServer", "requestFilter", [request]);

        // set a timeout if custom responses are not returned
        timeoutId = setTimeout(function () { resume(true); }, _filterRequestTimeout);
    }

    app = connect();
    app.use(rewrite);
    // JSLint complains if we use `connect.static` because static is a
    // reserved word.
    app.use(connect["static"](path, { maxAge: STATIC_CACHE_MAX_AGE }));
    app.use(connect.directory(path));

    server = http.createServer(app);

    // Once the server is listening then verify we can handle requests
    // before calling the callback
    server.on("listening", function () {
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

    // If the given port/address is in use then use a random port
    server.on("error", function (e) {
        if (e.code === "EADDRINUSE") {
            server.listen(0, "127.0.0.1");
        } else {
            throw e;
        }
    });

    server.listen(port, "127.0.0.1");
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
function _cmdGetServer(path, port, cb) {
    // Make sure the key doesn't conflict with some built-in property of Object.
    var pathKey = getPathKey(path);
    if (_servers[pathKey]) {
        cb(null, _servers[pathKey].address());
    } else {
        _createServer(path, port, function (err, server) {
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

/**
 * @private
 * Defines a set of paths from a server's root path to watch and fire "request" events for.
 *
 * @param {string} path The absolute path whose server we should watch
 * @param {Array.<string>} paths An array of root-relative paths to watch.
 *     Each path should begin with a forward slash "/".
 */
function _cmdSetRequestFilterPaths(root, paths) {
    var pathKey = getPathKey(root),
        rewritePaths = {};

    // reset list of filtered paths for each call to setRequestFilterPaths
    _rewritePaths[pathKey] = rewritePaths;

    paths.forEach(function (path) {
        rewritePaths[path] = pathJoin(root, path);
    });
}

/**
 * @private
 * Overrides the server response from static middleware with the provided
 * response data. This should be called only in response to a filtered request.
 *
 * @param {string} path The absolute path of the server
 * @param {string} root The relative path of the file beginning with a forward slash "/"
 * @param {!Object} resData Response data to use
 */
function _cmdWriteFilteredResponse(root, path, resData) {
    var pathKey  = getPathKey(root),
        callback = _requests[pathKey][resData.id];

    if (callback) {
        callback(resData);
    } else {
        console.warn("writeFilteredResponse: Missing callback for %s. This command must only be called after a requestFilter event has fired for a path.", pathJoin(root, path));
    }
}

/**
 * @private
 * Unit tests only. Set, or reset, timeout value for filtered requests.
 *
 * @param {number=} timeout Duration to wait before passing a filtered request to the static file server.
 *     If omitted, timeout is reset to FILTER_REQUEST_TIMEOUT (5s).
 */
function _cmdSetRequestFilterTimeout(timeout) {
    timeout = (timeout === undefined) ? FILTER_REQUEST_TIMEOUT : timeout;
    _filterRequestTimeout = timeout;
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
        "_setRequestFilterTimeout",
        _cmdSetRequestFilterTimeout,
        false,
        "Unit tests only. Set timeout value for filtered requests.",
        [{
            name: "timeout",
            type: "number",
            description: "Duration to wait before passing a filtered request to the static file server."
        }],
        []
    );
    _domainManager.registerCommand(
        "staticServer",
        "getServer",
        _cmdGetServer,
        true,
        "Starts or returns an existing server for the given path.",
        [
            {
                name: "path",
                type: "string",
                description: "Absolute filesystem path for root of server."
            },
            {
                name: "port",
                type: "number",
                description: "Port number to use for HTTP server.  Pass zero to assign a random port."
            }
        ],
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
        "setRequestFilterPaths",
        _cmdSetRequestFilterPaths,
        false,
        "Defines a set of paths from a server's root path to watch and fire 'requestFilter' events for.",
        [
            {
                name: "root",
                type: "string",
                description: "absolute filesystem path for root of server"
            },
            {
                name: "paths",
                type: "Array",
                description: "path to notify"
            }
        ],
        []
    );
    _domainManager.registerCommand(
        "staticServer",
        "writeFilteredResponse",
        _cmdWriteFilteredResponse,
        false,
        "Overrides the server response from static middleware with the provided response data. This should be called only in response to a filtered request.",
        [
            {
                name: "root",
                type: "string",
                description: "absolute filesystem path for root of server"
            },
            {
                name: "path",
                type: "string",
                description: "path to rewrite"
            },
            {
                name: "resData",
                type: "{body: string, headers: Array}",
                description: "TODO"
            }
        ],
        []
    );
    _domainManager.registerEvent(
        "staticServer",
        "requestFilter",
        [{
            name: "location",
            type: "{hostname: string, pathname: string, port: number, root: string: id: number}",
            description: "request path"
        }]
    );
}

exports.init = init;
