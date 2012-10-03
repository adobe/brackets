/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, WebSocket, window */

define(function (require, exports, module) {
	"use strict";

	var _socket;
	var _messageId = 1;
	var _messageQueue = [];
	var _messageCallbacks = {};

	function _onmessage(data) {
		if (data.type === "message") {
			var msg = JSON.parse(data.data);
			var id = msg.id;
			if (_messageCallbacks[id]) {
				_messageCallbacks[id].apply(undefined, msg.response);
				delete _messageCallbacks[id];
			}
		}
	}

	function connect(onopen, onclose) {
		_socket = new WebSocket("ws://" + window.location.host + ":9000");
		_socket.onopen = function (event) {
			var i;
			for (i in _messageQueue) {
				if (_messageQueue.hasOwnProperty(i)) {
					_socket.send(JSON.stringify(_messageQueue[i]));
				}
			}
			if (onopen) {
				onopen(event);
			}
		};
		_socket.onmessage = _onmessage;
		_socket.onclose = onclose;
	}

	function send(module, method) {
		var args = Array.prototype.slice.call(arguments, 2);
		var id;
		if (typeof args[args.length - 1] === "function") {
			id = _messageId++;
			_messageCallbacks[id] = args.pop();
		} else {
			id = 0;
		}
		var msg = {
			id: id,
			module: module,
			method: method,
			args: args
		};
		if (_socket.readyState !== 1) {
			_messageQueue.push(msg);
		} else {
			_socket.send(JSON.stringify(msg));
		}
	}


	exports.connect = connect;
	exports.send = send;

});