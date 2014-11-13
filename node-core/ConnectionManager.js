/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";

    var DomainManager = require("./DomainManager");

    /**
     * @private
     * @type{Array.<Connection>}
     * Currently active connections
     */
    var _connections = [];
    
    /**
     * @private
     * @constructor
     * A WebSocket connection to a client. This is a private constructor.
     * Callers should use the ConnectionManager.createConnection function
     * instead.
     * @param {WebSocket} ws The WebSocket representing the client
     */
    function Connection(ws) {
        this._ws = ws;
        this._connected = true;
        this._ws.on("message", this._receive.bind(this));
        this._ws.on("close", this.close.bind(this));
    }
    
    /**
     * @private
     * @type {boolean}
     * Whether the connection is connected.
     */
    Connection.prototype._connected = false;
    
    /**
     * @private
     * @type {WebSocket}
     * The connection's WebSocket
     */
    Connection.prototype._ws = null;
    
    /**
     * @private
     * Sends a message over the WebSocket. Called by public sendX commands.
     * @param {string} type Message type. Currently supported types are 
         "event", "commandResponse", "commandError", "error"
     * @param {object} message Message body, must be JSON.stringify-able
     */
    Connection.prototype._send = function (type, message) {
        if (this._ws && this._connected) {
            try {
                this._ws.send(JSON.stringify({type: type, message: message}));
            } catch (e) {
                console.error("[Connection] Unable to stringify message: " + e.message);
            }
        }
    };
    
    /**
     * @private
     * Sends a binary message over the WebSocket. Implicitly interpreted as a
     * message of type "commandResponse".
     * @param {Buffer} message
     */
    Connection.prototype._sendBinary = function (message) {
        if (this._ws && this._connected) {
            this._ws.send(message, {binary: true, mask: false});
        }
    };

    /**
     * @private
     * Receive event handler for the WebSocket. Responsible for parsing
     * message and handing it off to the appropriate handler.
     * @param {string} message Message received by WebSocket
     */
    Connection.prototype._receive = function (message) {
        var m;
        try {
            m = JSON.parse(message);
        } catch (parseError) {
            this.sendError("Unable to parse message: " + message);
            return;
        }
        
        if (m.id !== null && m.id !== undefined
                && m.domain && m.command) {
            // okay if m.parameters is null/undefined
            try {
                DomainManager.executeCommand(this, m.id, m.domain,
                    m.command, m.parameters);
            } catch (executionError) {
                this.sendCommandError(m.id, executionError.message,
                    executionError.stack);
            }
        } else {
            this.sendError("Malformed message: " + message);
        }
    };

    /**
     * Closes the connection and does necessary cleanup
     */
    Connection.prototype.close = function () {
        if (this._ws) {
            try {
                this._ws.close();
            } catch (e) { }
        }
        this._connected = false;
        _connections.splice(_connections.indexOf(this), 1);
    };
    
    /**
     * Sends an Error message
     * @param {object} message Error message. Must be JSON.stringify-able.
     */
    Connection.prototype.sendError = function (message) {
        this._send("error", {message: message});
    };

    /**
     * Sends a response to a command execution
     * @param {number} id unique ID of the command that was executed. ID is
     *    generated by the client when the command is issued.
     * @param {object|Buffer} response Result of the command execution. Must
     *    either be JSON.stringify-able or a raw Buffer. In the latter case,
     *    the result will be sent as a binary response.
     */
    Connection.prototype.sendCommandResponse = function (id, response) {
        if (Buffer.isBuffer(response)) {
            // Assume the id is an unsigned 32-bit integer, which is encoded
            // as a four-byte header
            var header = new Buffer(4);
            
            header.writeUInt32LE(id, 0);

            // Prepend the header to the message
            var message = Buffer.concat([header, response], response.length + 4);

            this._sendBinary(message);
        } else {
            this._send("commandResponse", {id: id, response: response });
        }
    };
    
    /**
     * Sends a response indicating that an error occurred during command 
     * execution
     * @param {number} id unique ID of the command that was executed. ID is
     *    generated by the client when the command is issued.
     * @param {string} message Error message
     * @param {?object} stack Call stack from the exception, if possible. Must
     *    be JSON.stringify-able.
     */
    Connection.prototype.sendCommandError = function (id, message, stack) {
        this._send("commandError", {id: id, message: message, stack: stack});
    };

    /**
     * Sends an event message
     * @param {number} id unique ID for the event.
     * @param {string} domain Domain of the event.
     * @param {string} event Name of the event
     * @param {object} parameters Event parameters. Must be JSON.stringify-able.
     */
    Connection.prototype.sendEventMessage =
        function (id, domain, event, parameters) {
            this._send("event", {id: id,
                                 domain: domain,
                                 event: event,
                                 parameters: parameters
                                });
        };

    /**
     * Factory function for creating a new Connection
     * @param {WebSocket} ws The WebSocket connected to the client.
     */
    function createConnection(ws) {
        _connections.push(new Connection(ws));
    }
    
    /**
     * Closes all connections gracefully. Should be called during shutdown.
     */
    function closeAllConnections() {
        var i;
        for (i = 0; i < _connections.length; i++) {
            try {
                _connections[i].close();
            } catch (err) { }
        }
        _connections = [];
    }
    
    /**
     * Sends all open connections the specified event
     * @param {number} id unique ID for the event.
     * @param {string} domain Domain of the event.
     * @param {string} event Name of the event
     * @param {object} parameters Event parameters. Must be JSON.stringify-able.
     */
    function sendEventToAllConnections(id, domain, event, parameters) {
        _connections.forEach(function (c) {
            c.sendEventMessage(id, domain, event, parameters);
        });
    }
    
    exports.createConnection          = createConnection;
    exports.closeAllConnections       = closeAllConnections;
    exports.sendEventToAllConnections = sendEventToAllConnections;
}());
