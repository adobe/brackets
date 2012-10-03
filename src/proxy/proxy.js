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

define(function (require, exports, module) {

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
			for (var i in _messageQueue) {
				_socket.send(JSON.stringify(_messageQueue[i]));
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