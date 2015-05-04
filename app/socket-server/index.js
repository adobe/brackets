/*jshint globalstrict:true, node:true*/

"use strict";

var http = require("http");
var Promise = require("bluebird");
var WebSocketServer = require("ws").Server;
var ConnectionManager = require("./ConnectionManager");
var DomainManager = require("./DomainManager");
var portscanner = require("portscanner");

var DEFAULT_PORT = 8123;
var httpServer = null;
var httpPort = null;
var wsServer = null;

function log(what) {
    var time = new Date().toTimeString().substring(0,8);
    console.log(time, "[socket-server]", what);
}

function initPort() {
    return new Promise(function (resolve, reject) {
        portscanner.findAPortNotInUse(DEFAULT_PORT, DEFAULT_PORT + 1000, "127.0.0.1", function(err, port) {
            if (err) {
                return reject(err);
            }
            httpPort = port;
            resolve();
        });
    });
}

function initHttp() {
    return new Promise(function (resolve, reject) {
        var server = http.createServer(function(req, res) {
            if (req.method === "GET" && req.url.indexOf("/api") === 0) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(DomainManager.getDomainDescriptions(), null, 4));
                return;
            }
            log("received unhandled http request for " + req.url);
            res.writeHead(404, {
                "Content-Type": "text/plain"
            });
            res.end("Brackets-Shell Server");
        });
        server.on("error", function (err) {
            log(err.name + ": " + err.message);
        });
        server.listen(httpPort, function() {
            httpServer = server;
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
    wsServer.on("connection", ConnectionManager.createConnection);
}

exports.start = function (callback) {
    initPort()
        .then(function () {
            return initHttp();
        })
        .then(function () {
            return initWebsockets();
        })
        .then(function () {
            return DomainManager.loadDomainModulesFromPaths(["./BaseDomain"]);
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

    ConnectionManager.closeAllConnections();

    process.nextTick(callback);
};
