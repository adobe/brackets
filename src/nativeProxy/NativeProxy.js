/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets, define, WebSocket, window */

define(function (require, exports, module) {
    "use strict";

    var app = require("nativeProxy/app");
    var fs  = require("nativeProxy/fs");

    var _socket;
    var _messageId = 1;
    var _messageQueue = [];
    var _messageCallbacks = {};

    // received message from the node server
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

    // on websocket open
    function _onopen(event) {
        var i;
        // execute all pending requests
        for (i in _messageQueue) {
            if (_messageQueue.hasOwnProperty(i)) {
                _socket.send(JSON.stringify(_messageQueue[i]));
            }
        }
        _messageQueue = [];
    }

    // on websocket closed
    function _onclose(event) {
        brackets.fs.showConnectErrorDialog(function (err) {
            exports.connect();
        });
    }

    // on websocket error
    function _onerror(event) {
    }

    // connect to the node server
    function connect() {
        _socket = new WebSocket("ws://" + window.location.host.replace(/:[0-9]+$/,'') + ":9000");
        _socket.onopen = _onopen;
        _socket.onerror = _onerror;
        _socket.onclose = _onclose;
        _socket.onmessage = _onmessage;
    }

    // forward the method for the module to the node server
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

    function init() {
        brackets.app = app;
        brackets.fs = fs;
        connect();
    }

    exports.connect = connect;
    exports.send = send;
    exports.init = init;

});