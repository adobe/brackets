/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */

var WebSocketServer = require('ws').Server;

var RED = '\033[31m';
var RESET = '\033[0m';

function _logError(error) {
	"use strict";
	console.error(RED + "[server] " + error.stack + RESET);
}

function _handleMessage(ws, message) {
	"use strict";
	var messageObj = JSON.parse(message);
	console.log(messageObj.module + "." + messageObj.method + "(" + messageObj.args.join() + ")");
	var module = require("./" + messageObj.module);
	var handler = module[messageObj.method];
	var response = handler.apply(null, messageObj.args);
	if (response && typeof response.then === "function") {
		response.then(function (response) {
			ws.send(JSON.stringify({ id: messageObj.id, response: response }));
		}, function (error) {
			_logError(error);
		});
	} else {
		ws.send(JSON.stringify({ id: messageObj.id, response: response }));
	}
}

// set up the web socket server
var wss = new WebSocketServer({ port: 9000 });
console.log("Brackets Node Server listening on port 9000");
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
