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



/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, WebSocket, FileError */

 /**
 * Inspector manages the connection to Chrome/Chromium's remote debugger.
 * See inspector.html for the documentation of the remote debugger.
 *
 * # SETUP
 *
 * To enable remote debugging in Chrome or Chromium open either application
 * with the following parameters:
 *
 *   --enable-remote-debugger --remote-debugging-port=9222
 *
 * This will open an HTTP server on the specified port, which can be used to
 * browse the available remote debugger sessions. In general, every open
 * browser tab can host an individual remote debugger session. The
 * available interfaces can be exported by requesting:
 *
 *   http://127.0.0.1:9222/json
 *
 * The response is a JSON-formatted array that specifies all available remote
 * debugger sessions including the remote debugging web sockets.
 *
 * Inspector can connect directly to a web socket via `connect(socketURL)`, or
 * it can find the web socket that corresponds to the tab at the given URL and
 * connect to it via `connectToURL(url)`. The later returns a promise. To 
 * disconnect use `disconnect()`.
 *
 * # EVENTS
 *
 * Inspector dispatches several connectivity-related events + all remote debugger
 * events (see below). Event handlers are attached via `on(event, function)` and
 * detached via `off(event, function)`.
 *
 *   `connect`    Inspector did successfully connect to the remote debugger
 *   `disconnect` Inspector did disconnect from the remote debugger
 *   `error`      Inspector encountered an error
 *   `message`    Inspector received a message from the remote debugger - this
 *                  provides a low-level entry point to remote debugger events
 *
 * # REMOTE DEBUGGER COMMANDS
 *
 * Commands are executed by calling `{Domain}.{Command}()` with the parameters
 * specified in the order of the remote debugger documentation. These command
 * functions are generated automatically at runtime from Inspector.json. The
 * actual implementation of these functions is found in
 * `_send(method, signature, varargs)`, which verifies, serializes, and
 * transmits the command to the remote debugger. If the last parameter of any
 * command function call is a function, it will be used as the callback.
 *
 * # REMOTE DEBUGGER EVENTS
 *
 * Debugger events are dispatched as regular events using {Domain}.{Event} as
 * the event name. The handler function will be called with a single parameter
 * that stores all returned values as an object.
 */
define(function Inspector(require, exports, module) {
    'use strict';

    var _messageId = 1; // id used for remote method calls, auto-incrementing
    var _messageCallbacks = {}; // {id -> function} for remote method calls
    var _handlers = {}; // {name -> function} for attached event handlers
    var _socket; // remote debugger WebSocket
    var _connectDeferred; // The deferred connect

    /** Trigger an event handler
     * @param {function} event handler
     * @param {Array} arguments array
     */
    function _triggerHandler(handler, args) {
        handler.apply(undefined, args);
    }

    /** Trigger an event and all attached event handlers
     * All passed arguments after the name are passed on as parameters.
     * @param {string} event name
     */
    function trigger(name, res) {
        var i, handlers = _handlers[name];
        var args = Array.prototype.slice.call(arguments, 1);
        for (i in handlers) {
            setTimeout(_triggerHandler.bind(undefined, handlers[i], args));
        }
    }

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
            // FUTURE: Our current implementation closes and re-opens an inspector connection whenever
            // a new HTML file is selected. If done quickly enough, pending requests from the previous
            // connection could come in before the new socket connection is established. For now we 
            // simply ignore this condition. 
            // This race condition will go away once we support multiple inspector connections and turn
            // off auto re-opening when a new HTML file is selected.
            return;
        }
        
        console.assert(_socket, "You must connect to the WebSocket before sending messages.");
        var id, callback, args, i, params = {};

        // extract the parameters, the callback function, and the message id
        args = Array.prototype.slice.call(arguments, 2);
        if (typeof args[args.length - 1] === "function") {
            id = _messageId++;
            _messageCallbacks[id] = args.pop();
        } else {
            id = 0;
        }

        // verify the parameters against the method signature
        // this also constructs the params object of type {name -> value}
        for (i in signature) {
            if (_verifySignature(args[i], signature[i])) {
                params[signature[i].name] = args[i];
            }
        }
        _socket.send(JSON.stringify({ method: method, id: id, params: params }));
    }

    /** WebSocket did close */
    function _onDisconnect() {
        _socket = undefined;
        trigger("disconnect");
    }

    /** WebSocket reported an error */
    function _onError(error) {
        trigger("error", error);
    }

    /** WebSocket did open */
    function _onConnect() {
        trigger("connect");
    }

    /** Received message from the WebSocket
     * A message can be one of three things:
     *   1. an error -> report it
     *   2. the response to a previous command -> run the stored callback
     *   3. an event -> trigger an event handler method
     * @param {object} message
     */
    function _onMessage(message) {
        var response = JSON.parse(message.data);
        trigger("message", response);
        if (response.error) {
            trigger("error", response.error);
        } else if (response.result) {
            if (_messageCallbacks[response.id]) {
                _messageCallbacks[response.id](response.result);
            }
        } else {
            trigger(response.method, response.params);
        }
    }


    /** Public Functions *****************************************************/

    /** Get the available debugger sockets from the remote debugger
     * @param {string} host IP or name
     * @param {integer} debugger port
     */
    function getAvailableSockets(host, port) {
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

    /** Register a handler to be called when the given event is triggered
     * @param {string} event name
     * @param {function} handler function
     */
    function on(name, handler) {
        if (!_handlers[name]) {
            _handlers[name] = [];
        }
        _handlers[name].push(handler);
    }

    /** Remove the given or all event handler(s) for the given event or remove all event handlers
     * @param {string} optional event name
     * @param {function} optional handler function
     */
    function off(name, handler) {
        if (!name) {
            _handlers = {};
        } else if (!handler) {
            delete _handlers[name];
        } else {
            var i, handlers = _handlers[name];
            for (i in handlers) {
                if (handlers[i] === handler) {
                    handlers.splice(i, 1);
                }
            }
        }
    }

    /** Disconnect from the remote debugger WebSocket */
    function disconnect() {
        if (_socket) {
            if (_socket.readyState === 1) {
                _socket.close();
            } else {
                delete _socket.onmessage;
                delete _socket.onopen;
                delete _socket.onclose;
                delete _socket.onerror;
            }
            _socket = undefined;
        }
    }

    /** Connect to the remote debugger WebSocket at the given URL
     * @param {string} WebSocket URL
     */
    function connect(socketURL) {
        disconnect();
        _socket = new WebSocket(socketURL);
        _socket.onmessage = _onMessage;
        _socket.onopen = _onConnect;
        _socket.onclose = _onDisconnect;
        _socket.onerror = _onError;
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
        var promise = getAvailableSockets();
        promise.done(function onGetAvailableSockets(response) {
            if (deferred.isRejected()) {
                return;
            }
            var i, page;
            for (i in response) {
                page = response[i];
                if (page.webSocketDebuggerUrl && page.url.search(url) === 0) {
                    connect(page.webSocketDebuggerUrl);
                    deferred.resolve();
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
        return _socket !== undefined;
    }

    /** Initialize the Inspector
     * Read the Inspector.json configuration and define the command objects
     * -> Inspector.domain.command()
     */
    function init(theConfig) {
        exports.config = theConfig;
        var request = new XMLHttpRequest();
        request.open("GET", "LiveDevelopment/Inspector/Inspector.json");
        request.onload = function onLoad() {
            var InspectorJSON = JSON.parse(request.response);
            var i, j, domain, domainDef, command;
            for (i in InspectorJSON.domains) {
                domain = InspectorJSON.domains[i];
                exports[domain.domain] = {};
                for (j in domain.commands) {
                    command = domain.commands[j];
                    exports[domain.domain][command.name] = _send.bind(undefined, domain.domain + "." + command.name, command.parameters);
                }
            }
        };
        request.send(null);
    }

    // Export public functions
    exports.trigger = trigger;
    exports.getAvailableSockets = getAvailableSockets;
    exports.on = on;
    exports.off = off;
    exports.disconnect = disconnect;
    exports.connect = connect;
    exports.connectToURL = connectToURL;
    exports.connected = connected;
    exports.init = init;
});