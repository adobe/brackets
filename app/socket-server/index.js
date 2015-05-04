/*jshint globalstrict:true, node:true*/

"use strict";

var http = require("http");
var Promise = require("bluebird");
var WebSocketServer = require("websocket").server;

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
        var server = http.createServer(function(request, response) {
            // TODO: handle /api calls
            log("received http request for " + request.url);
            response.writeHead(404);
            response.end();
        });
        server.on("error", function (err) {
            log("failed to start on port " + port);
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

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed
    return origin.indexOf("file://") === 0;
}

function handleWsRequest(request) {
    // Make sure we only accept requests from an allowed origin
    if (!originIsAllowed(request.origin)) {
        log("connection from origin " + request.origin + " rejected");
        return request.reject();
    }

    var connection = request.accept(null, request.origin);
    log("connection accepted");

    connection.on("message", function (message) {
        if (message.type === "utf8") {
            log("received message: " + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === "binary") {
            log("received binary message of " + message.binaryData.length + " bytes");
            connection.sendBytes(message.binaryData);
        }
    });

    connection.on("close", function(reasonCode, description) {
        log("peer " + connection.remoteAddress + " disconnected");
    });
}

function initWebsockets() {
    wsServer = new WebSocketServer({
        httpServer: httpServer,
        autoAcceptConnections: false
    });
    wsServer.on("request", handleWsRequest);
}

exports.start = function (callback) {
    initHttp()
        .then(function () {
            return initWebsockets();
        })
        .then(function () {
            return httpPort;
        })
        .nodeify(callback);
};
