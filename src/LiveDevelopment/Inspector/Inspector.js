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



/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, WebSocket, FileError, XMLHttpRequest */

 /**
 * Inspector manages the connection to Chrome/Chromium's remote debugger.
 * See inspector.html for the documentation of the remote debugger.
 *
 * __SETUP__
 *
 * To enable remote debugging in Chrome or Chromium open either application
 * with the following parameters:
 *
 *     --enable-remote-debugger --remote-debugging-port=9222
 *
 * This will open an HTTP server on the specified port, which can be used to
 * browse the available remote debugger sessions. In general, every open
 * browser tab can host an individual remote debugger session. The
 * available interfaces can be exported by requesting:
 *
 *     http://127.0.0.1:9222/json
 *
 * The response is a JSON-formatted array that specifies all available remote
 * debugger sessions including the remote debugging web sockets.
 *
 * Inspector can connect directly to a web socket via `connect(socketURL)`, or
 * it can find the web socket that corresponds to the tab at the given URL and
 * connect to it via `connectToURL(url)`. The later returns a promise. To
 * disconnect use `disconnect()`.
 *
 * __EVENTS__
 *
 * Inspector dispatches several connectivity-related events + all remote debugger
 * events (see below). Event handlers are attached via `on(event, function)` and
 * detached via `off(event, function)`.
 *
 *   `connect`    Inspector did successfully connect to the remote debugger
 *   `disconnect` Inspector did disconnect from the remote debugger
 *   `error`      Inspector encountered an error
 *   `message`    Inspector received a message from the remote debugger - this
 *                provides a low-level entry point to remote debugger events
 *
 * __REMOTE DEBUGGER COMMANDS__
 *
 * Commands are executed by calling `{Domain}.{Command}()` with the parameters
 * specified in the order of the remote debugger documentation. These command
 * functions are generated automatically at runtime from Inspector.json. The
 * actual implementation of these functions is found in
 * `_send(method, signature, varargs)`, which verifies, serializes, and
 * transmits the command to the remote debugger. If the last parameter of any
 * command function call is a function, it will be used as the callback.
 *
 * __REMOTE DEBUGGER EVENTS__
 *
 * Debugger events are dispatched as regular events using {Domain}.{Event} as
 * the event name. The handler function will be called with a single parameter
 * that stores all returned values as an object.
 */
define(function Inspector(require, exports, module) {
    "use strict";

    var Async           = require("utils/Async"),
        EventDispatcher = require("utils/EventDispatcher");

    /**
     * Map message IDs to the callback function and original JSON message
     * @type {Object.<number, {callback: function, message: Object}}
     */
    var _messageCallbacks = {};

    var _messageId = 1,     // id used for remote method calls, auto-incrementing
        _socket,            // remote debugger WebSocket
        _connectDeferred,   // The deferred connect
        _userAgent = "";    // user agent string

    /** Check a parameter value against the given signature
     * This only checks for optional parameters, not types
     * Type checking is complex because of $ref and done on the remote end anyways
     * @param {signature}
     * @param {value}
     */
    function _verifySignature(signature, value) {
        if (value === undefined) {
            console.assert(signature.optional === true, "Missing argument: " + signature.name);
        }
        return true;
    }

    /** Send a message to the remote debugger
     * All passed arguments after the signature are passed on as parameters.
     * If the last argument is a function, it is used as the callback function.
     * @param {string} remote method
     * @param {object} the method signature
     */
    function _send(method, signature, varargs) {
        if (!_socket) {
            console.log("You must connect to the WebSocket before sending messages.");

            // FUTURE: Our current implementation closes and re-opens an inspector connection whenever
            // a new HTML file is selected. If done quickly enough, pending requests from the previous
            // connection could come in before the new socket connection is established. For now we
            // simply ignore this condition.
            // This race condition will go away once we support multiple inspector connections and turn
            // off auto re-opening when a new HTML file is selected.
            return (new $.Deferred()).reject().promise();
        }

        var id, callback, args, i, params = {}, promise, msg;

        // extract the parameters, the callback function, and the message id
        args = Array.prototype.slice.call(arguments, 2);
        if (typeof args[args.length - 1] === "function") {
            callback = args.pop();
        } else {
            var deferred = new $.Deferred();
            promise = deferred.promise();
            callback = function (result, error) {
                if (error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(result);
                }
            };
        }

        id = _messageId++;

        // verify the parameters against the method signature
        // this also constructs the params object of type {name -> value}
        if (signature) {
            for (i in signature) {
                if (_verifySignature(args[i], signature[i])) {
                    params[signature[i].name] = args[i];
                }
            }
        }

        // Store message callback and send message
        msg = { method: method, id: id, params: params };
        _messageCallbacks[id] = { callback: callback, message: msg };
        _socket.send(JSON.stringify(msg));

        return promise;
    }

    /**
     * Manually send a message to the remote debugger
     * All passed arguments after the command are passed on as parameters.
     * If the last argument is a function, it is used as the callback function.
     * @param {string} domain
     * @param {string} command
     */
    function send(domain, command, varargs) {
        return _send(domain + "." + command, null, varargs);
    }

    /** WebSocket did close */
    function _onDisconnect() {
        _socket = undefined;
        exports.trigger("disconnect");
    }

    /** WebSocket reported an error */
    function _onError(error) {
        if (_connectDeferred) {
            _connectDeferred.reject();
            _connectDeferred = null;
        }
        exports.trigger("error", error);
    }

    /** WebSocket did open */
    function _onConnect() {
        if (_connectDeferred) {
            _connectDeferred.resolve();
            _connectDeferred = null;
        }
        exports.trigger("connect");
    }

    /** Received message from the WebSocket
     * A message can be one of three things:
     *   1. an error -> report it
     *   2. the response to a previous command -> run the stored callback
     *   3. an event -> trigger an event handler method
     * @param {object} message
     */
    function _onMessage(message) {
        var response    = JSON.parse(message.data),
            msgRecord   = _messageCallbacks[response.id],
            callback    = msgRecord && msgRecord.callback,
            msgText     = (msgRecord && msgRecord.message) || "No message";

        if (msgRecord) {
            // Messages with an ID are a response to a command, fire callback
            callback(response.result, response.error);
            delete _messageCallbacks[response.id];
        } else if (response.method) {
            // Messages with a method are an event, trigger event handlers
            var domainAndMethod = response.method.split("."),
                domain = domainAndMethod[0],
                method = domainAndMethod[1];

            EventDispatcher.triggerWithArray(exports[domain], method, response.params);
        }

        // Always fire event handlers for all messages/errors
        exports.trigger("message", response);

        if (response.error) {
            exports.trigger("error", response.error, msgText);
        }
    }


    /** Public Functions *****************************************************/

    /** Get a list of the available windows/tabs/extensions that are remote-debuggable
     * @param {string} host IP or name
     * @param {integer} debugger port
     */
    function getDebuggableWindows(host, port) {
        if (!host) {
            host = "127.0.0.1";
        }
        if (!port) {
            port = 9222;
        }
        var def = new $.Deferred();
        var request = new XMLHttpRequest();
        request.open("GET", "http://" + host + ":" + port + "/json");
        request.onload = function onLoad() {
            var sockets = JSON.parse(request.response);
            def.resolve(sockets);
        };
        request.onerror = function onError() {
            def.reject(request.response);
        };

        request.send(null);

        return def.promise();
    }

    /**
     * Disconnect from the remote debugger WebSocket
     * @return {jQuery.Promise} Promise that is resolved immediately if not
     *     currently connected or asynchronously when the socket is closed.
     */
    function disconnect() {
        var deferred = new $.Deferred(),
            promise = deferred.promise();

        if (_socket && (_socket.readyState === WebSocket.OPEN)) {
            _socket.onclose = function () {
                // trigger disconnect event
                _onDisconnect();

                deferred.resolve();
            };

            promise = Async.withTimeout(promise, 5000);

            _socket.close();
        } else {
            if (_socket) {
                delete _socket.onmessage;
                delete _socket.onopen;
                delete _socket.onclose;
                delete _socket.onerror;

                _socket = undefined;
            }

            deferred.resolve();
        }

        return promise;
    }

    /**
     * Connect to the remote debugger WebSocket at the given URL.
     * Clients must listen for the `connect` event.
     * @param {string} WebSocket URL
     */
    function connect(socketURL) {
        disconnect().done(function () {
            _socket = new WebSocket(socketURL);
            _socket.onmessage = _onMessage;
            _socket.onopen = _onConnect;
            _socket.onclose = _onDisconnect;
            _socket.onerror = _onError;
        });
    }

    /** Connect to the remote debugger of the page that is at the given URL
     * @param {string} url
     */
    function connectToURL(url) {
        if (_connectDeferred) {
            // reject an existing connection attempt
            _connectDeferred.reject("CANCEL");
        }
        var deferred = new $.Deferred();
        _connectDeferred = deferred;
        var promise = getDebuggableWindows();
        promise.done(function onGetAvailableSockets(response) {
            var i, page;
            for (i in response) {
                page = response[i];
                if (page.webSocketDebuggerUrl && page.url.indexOf(url) === 0) {
                    connect(page.webSocketDebuggerUrl);
                    // _connectDeferred may be resolved by onConnect or rejected by onError
                    return;
                }
            }
            deferred.reject(FileError.ERR_NOT_FOUND); // Reject with a "not found" error
        });
        promise.fail(function onFail(err) {
            deferred.reject(err);
        });
        return deferred.promise();
    }

    /** Check if the inspector is connected */
    function connected() {
        return _socket !== undefined && _socket.readyState === WebSocket.OPEN;
    }

    /**
     * Get user agent string
     * @return {string}
     */
    function getUserAgent() {
        return _userAgent;
    }

    /**
     * Set user agent string
     * @param {string} userAgent User agent string returned from Chrome
     */
    function setUserAgent(userAgent) {
        _userAgent = userAgent;
    }

    /** Initialize the Inspector
     * Read the Inspector.json configuration and define the command objects
     * -> Inspector.domain.command()
     */
    function init(theConfig) {
        exports.config = theConfig;

        var InspectorText = require("text!LiveDevelopment/Inspector/Inspector.json"),
            InspectorJSON = JSON.parse(InspectorText);

        var i, j, domain, command;
        for (i in InspectorJSON.domains) {
            domain = InspectorJSON.domains[i];
            var exportedDomain = {};
            exports[domain.domain] = exportedDomain;
            EventDispatcher.makeEventDispatcher(exportedDomain);
            for (j in domain.commands) {
                command = domain.commands[j];
                exportedDomain[command.name] = _send.bind(undefined, domain.domain + "." + command.name, command.parameters);
            }
        }
    }


    EventDispatcher.makeEventDispatcher(exports);

    // Export public functions
    exports.connect              = connect;
    exports.connected            = connected;
    exports.connectToURL         = connectToURL;
    exports.disconnect           = disconnect;
    exports.getDebuggableWindows = getDebuggableWindows;
    exports.getUserAgent         = getUserAgent;
    exports.init                 = init;
    exports.send                 = send;
    exports.setUserAgent         = setUserAgent;
});
