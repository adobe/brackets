/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */

(function () {
    "use strict";

    var WebSocketServer = require("ws").Server,
        _ = require("lodash");

    /**
     * @private
     * The WebSocket server we listen for incoming connections on.
     * @type {?WebSocketServer}
     */
    var _wsServer;

    /**
     * @private
     * The Brackets domain manager for registering node extensions.
     * @type {?DomainManager}
     */
    var _domainManager;

    /**
     * @private
     * The ID that should be allocated to the next client that connects to the transport.
     * @type {number}
     */
    var _nextClientId = 1;

    /**
     * @private
     * A map of client IDs to the URL and WebSocket for the given ID.
     * @type {Object.<number, {id: number, url: string, socket: WebSocket}>}
     */
    var _clients = {};

    // This must match the port declared in NodeSocketTransport.js.
    // TODO: randomize this?
    var SOCKET_PORT = 8123;

    /**
     * @private
     * Returns the client info for a given WebSocket, or null if that socket isn't registered.
     * @param {WebSocket} ws
     * @return {?{id: number, url: string, socket: WebSocket}}
     */
    function _clientForSocket(ws) {
        return _.find(_clients, function (client) {
            return (client.socket === ws);
        });
    }

    /**
     * @private
     * Creates the WebSocketServer and handles incoming connections.
     */
    function _createServer() {
        if (!_wsServer) {
            // TODO: make port configurable, or use random port
            _wsServer = new WebSocketServer({port: SOCKET_PORT});
            _wsServer.on("connection", function (ws) {
                ws.on("message", function (msg) {
                    console.log("WebSocketServer - received - " + msg);
                    var msgObj;
                    try {
                        msgObj = JSON.parse(msg);
                    } catch (e) {
                        console.error("nodeSocketTransport: Error parsing message: " + msg);
                        return;
                    }

                    // See the comment in NodeSocketTransportRemote.connect() for why we have an extra
                    // layer of transport-layer message objects surrounding the protocol messaging.

                    if (msgObj.type === "connect") {
                        if (!msgObj.url) {
                            console.error("nodeSocketTransport: Malformed connect message: " + msg);
                            return;
                        }
                        var clientId = _nextClientId++;
                        _clients[clientId] = {
                            id: clientId,
                            url: msgObj.url,
                            socket: ws
                        };
                        console.log("emitting connect event");
                        _domainManager.emitEvent("nodeSocketTransport", "connect", [clientId, msgObj.url]);
                    } else if (msgObj.type === "message") {
                        var client = _clientForSocket(ws);
                        if (client) {
                            _domainManager.emitEvent("nodeSocketTransport", "message", [client.id, msgObj.message]);
                        } else {
                            console.error("nodeSocketTransport: Couldn't locate client for message: " + msg);
                        }
                    } else {
                        console.error("nodeSocketTransport: Got bad socket message type: " + msg);
                    }
                }).on("error", function (e) {
                    // TODO: emit error event
                    var client = _clientForSocket(ws);
                    console.error("nodeSocketTransport: Error on socket for client " + JSON.stringify(client) + ": " + e);
                }).on("close", function () {
                    var client = _clientForSocket(ws);
                    if (client) {
                        _domainManager.emitEvent("nodeSocketTransport", "close", [client.id]);
                        delete _clients[client.id];
                    } else {
                        console.error("nodeSocketTransport: Socket closed, but couldn't locate client");
                    }
                });
            });
        }
    }

    /**
     * Initializes the socket server.
     * @param {string} url
     */
    function _cmdStart(url) {
        _createServer();
    }

    /**
     * Sends a transport-layer message over the socket.
     * @param {number|Array.<number>} idOrArray A client ID or array of client IDs to send the message to.
     * @param {string} msgStr The message to send as a JSON string.
     */
    function _cmdSend(idOrArray, msgStr) {
        if (!Array.isArray(idOrArray)) {
            idOrArray = [idOrArray];
        }
        idOrArray.forEach(function (id) {
            var client = _clients[id];
            if (!client) {
                console.error("nodeSocketTransport: Couldn't find client ID: " + id);
            } else {
                client.socket.send(msgStr);
            }
        });
    }

    /**
     * Closes the connection for a given client ID.
     * @param {number} clientId
     */
    function _cmdClose(clientId) {
        var client = _clients[clientId];
        if (client) {
            client.socket.close();
            delete _clients[clientId];
        }
    }

    /**
     * Initializes the domain and registers commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        _domainManager = domainManager;
        if (!domainManager.hasDomain("nodeSocketTransport")) {
            domainManager.registerDomain("nodeSocketTransport", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "nodeSocketTransport",      // domain name
            "start",       // command name
            _cmdStart,     // command handler function
            false,          // this command is synchronous in Node
            "Creates the WS server",
            []
        );
        domainManager.registerCommand(
            "nodeSocketTransport",      // domain name
            "send",         // command name
            _cmdSend,       // command handler function
            false,          // this command is synchronous in Node
            "Sends a message to a given client or list of clients",
            [
                {name: "idOrArray", type: "number|Array.<number>", description: "id or array of ids to send the message to"},
                {name: "message", type: "string", description: "JSON message to send"}
            ],
            []
        );
        domainManager.registerCommand(
            "nodeSocketTransport",      // domain name
            "close",         // command name
            _cmdClose,       // command handler function
            false,          // this command is synchronous in Node
            "Closes the connection to a given client",
            [
                {name: "id", type: "number", description: "id of connection to close"}
            ],
            []
        );
        domainManager.registerEvent(
            "nodeSocketTransport",
            "connect",
            [
                {name: "clientID", type: "number", description: "ID of live preview page connecting to live development"},
                {name: "url", type: "string", description: "URL of page that live preview is connecting from"}
            ]
        );
        domainManager.registerEvent(
            "nodeSocketTransport",
            "message",
            [
                {name: "clientID", type: "number", description: "ID of live preview page sending message"},
                {name: "msg", type: "string", description: "JSON message from client page"}
            ]
        );
        domainManager.registerEvent(
            "nodeSocketTransport",
            "close",
            [
                {name: "clientID", type: "number", description: "ID of live preview page being closed"}
            ]
        );
    }

    exports.init = init;

}());
