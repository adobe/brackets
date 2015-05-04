/*jshint globalstrict:true, node:true*/

"use strict";

var http = require("http");
var Promise = require("bluebird");
var WebSocketServer = require("ws").Server;

var DEFAULT_PORT = 8123;
var httpServer = null;
var httpPort = null;
var wsServer = null;

function log(what) {
    var time = new Date().toTimeString().substring(0,8);
    console.log(time, "[socket-server]", what);
}

function initHttp(port) {
    port = port || DEFAULT_PORT;
    return new Promise(function (resolve, reject) {
        var server = http.createServer(function(req, res) {
            if (req.method === "GET" && req.url.indexOf("/api") === 0) {
                res.setHeader("Content-Type", "application/json");
                // TODO: res.end(JSON.stringify(DomainManager.getDomainDescriptions(), null, 4));
                // TODO: return;
            }
            log("received unhandled http request for " + req.url);
            res.writeHead(404, {
                "Content-Type": "text/plain"
            });
            res.end("Brackets-Shell Server");
        });
        server.on("error", function (err) {
            log("failed to start on port " + port + " (" + err + ")");
            server.close();
            initHttp(port + 1).then(resolve);
        });
        server.listen(port, function() {
            log("listening on port " + port);
            httpServer = server;
            httpPort = port;
            resolve();
        });
    });
}

function initWebsockets() {
    wsServer = new WebSocketServer({
        server: httpServer
    });
    wsServer.on("error", function (err) {
        log("wsServer error: " + err);
    });
    // TODO: wsServer.on("connection", ConnectionManager.createConnection);
}

exports.start = function (callback) {
    initHttp()
        .then(function () {
            return initWebsockets();
        })
        .then(function () {
            // TODO: return DomainManager.loadDomainModulesFromPaths(["./BaseDomain"]);
        })
        .then(function () {
            return httpPort;
        })
        .nodeify(callback);
};

exports.stop = function (callback) {
    if (wsServer) {
        wsServer.close();
        wsServer = null;
    } else {
        log("wsServer not running but stop has been called!");
    }

    if (httpServer) {
        httpServer.close();
        httpServer = null;
    } else {
        log("httpServer not running but stop has been called!");
    }

    // TODO: ConnectionManager.closeAllConnections();

    process.nextTick(callback);
};
