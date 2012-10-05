/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require */

var DEBUG = true;

var http = require("http");
var WebSocketServer = require('ws').Server;

function _logError() {
    "use strict";
    console.error.apply(console, arguments);
}

function _log() {
    "use strict";
    if (DEBUG) {
        console.log.apply(console, arguments);
    }
}

function _handleMessage(ws, message) {
    "use strict";
    var messageObj = JSON.parse(message);
    _log(messageObj.module + "." + messageObj.method + "(" + messageObj.args.join() + ")");
    var module = require("./" + messageObj.module);
    var handler = module[messageObj.method];
    var response = handler.apply(null, messageObj.args);
    if (response && typeof response.then === "function") {
        response.then(function (response) {
            _log("->", response);
            ws.send(JSON.stringify({ id: messageObj.id, response: response }));
        }, function (error) {
            _logError(error);
        });
    } else {
        ws.send(JSON.stringify({ id: messageObj.id, response: response }));
    }
}

// set up the web socket server
var wss = new WebSocketServer({ host: http.INADDR_ANY, port: 9000 });
_log("Brackets Node Server listening on port 9000");
wss.on('connection', function (ws) {
    "use strict";
    ws.on('message', function (message) {
        try {
            _handleMessage(ws, message);
        } catch (error) {
            _logError(error);
        }
    });
});
