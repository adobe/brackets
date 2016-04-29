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

/*jslint browser: true, vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global WebSocket */

// This is a transport injected into the browser via a script that handles the low
// level communication between the live development protocol handlers on both sides.
// This transport provides a web socket mechanism. It's injected separately from the
// protocol handler so that the transport can be changed separately.

(function (global) {
    "use strict";

    var WebSocketTransport = {
        /**
         * @private
         * The WebSocket that we communicate with Brackets over.
         * @type {?WebSocket}
         */
        _ws: null,

        /**
         * @private
         * An object that contains callbacks to handle various transport events. See `setCallbacks()`.
         * @type {?{connect: ?function, message: ?function(string), close: ?function}}
         */
        _callbacks: null,

        /**
         * Sets the callbacks that should be called when various transport events occur. All callbacks
         * are optional, but you should at least implement "message" or nothing interesting will happen :)
         * @param {?{connect: ?function, message: ?function(string), close: ?function}} callbacks
         *      The callbacks to set.
         *      connect - called when a connection is established to Brackets
         *      message(msgStr) - called with a string message sent from Brackets
         *      close - called when Brackets closes the connection
         */
        setCallbacks: function (callbacks) {
            if (!global._Brackets_LiveDev_Socket_Transport_URL) {
                console.error("[Brackets LiveDev] No socket transport URL injected");
            } else {
                this._callbacks = callbacks;
            }
        },

        /**
         * Connects to the NodeSocketTransport in Brackets at the given WebSocket URL.
         * @param {string} url
         */
        connect: function (url) {
            var self = this;
            this._ws = new WebSocket(url);

            // One potential source of confusion: the transport sends two "types" of messages -
            // these are distinct from the protocol's own messages. This is because this transport
            // needs to send an initial "connect" message telling the Brackets side of the transport
            // the URL of the page that it's connecting from, distinct from the actual protocol
            // message traffic. Actual protocol messages are sent as a JSON payload in a message of
            // type "message".
            //
            // Other transports might not need to do this - for example, a transport that simply
            // talks to an iframe within the same process already knows what URL that iframe is
            // pointing to, so the only comunication that needs to happen via postMessage() is the
            // actual protocol message strings, and no extra wrapping is necessary.

            this._ws.onopen = function (event) {
                // Send the initial "connect" message to tell the other end what URL we're from.
                self._ws.send(JSON.stringify({
                    type: "connect",
                    url: global.location.href
                }));
                console.log("[Brackets LiveDev] Connected to Brackets at " + url);
                if (self._callbacks && self._callbacks.connect) {
                    self._callbacks.connect();
                }
            };
            this._ws.onmessage = function (event) {
                console.log("[Brackets LiveDev] Got message: " + event.data);
                if (self._callbacks && self._callbacks.message) {
                    self._callbacks.message(event.data);
                }
            };
            this._ws.onclose = function (event) {
                self._ws = null;
                if (self._callbacks && self._callbacks.close) {
                    self._callbacks.close();
                }
            };
            // TODO: onerror
        },

        /**
         * Sends a message over the transport.
         * @param {string} msgStr The message to send.
         */
        send: function (msgStr) {
            if (this._ws) {
                // See comment in `connect()` above about why we wrap the message in a transport message
                // object.
                this._ws.send(JSON.stringify({
                    type: "message",
                    message: msgStr
                }));
            } else {
                console.log("[Brackets LiveDev] Tried to send message over closed connection: " + msgStr);
            }
        },

        /**
         * Establish web socket connection.
         */
        enable: function () {
            this.connect(global._Brackets_LiveDev_Socket_Transport_URL);
        }
    };
    global._Brackets_LiveDev_Transport = WebSocketTransport;
}(this));
