/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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
    "use strict";

    var EventDispatcher = require("utils/EventDispatcher");


    /**
     * Connection attempts to make before failing
     * @type {number}
     */
    var CONNECTION_ATTEMPTS = 10;

    /**
     * Milliseconds to wait before a particular connection attempt is considered failed.
     * NOTE: It's okay for the connection timeout to be long because the
     * expected behavior of WebSockets is to send a "close" event as soon
     * as they realize they can't connect. So, we should rarely hit the
     * connection timeout even if we try to connect to a port that isn't open.
     * @type {number}
     */
    var CONNECTION_TIMEOUT  = 10000; // 10 seconds

    /**
     * Milliseconds to wait before retrying connecting
     * @type {number}
     */
    var RETRY_DELAY         = 500;   // 1/2 second

    /**
     * Maximum value of the command ID counter
     * @type  {number}
     */
    var MAX_COUNTER_VALUE = 4294967295; // 2^32 - 1

    /**
     * @private
     * Helper function to auto-reject a deferred after a given amount of time.
     * If the deferred is resolved/rejected manually, then the timeout is
     * automatically cleared.
     */
    function setDeferredTimeout(deferred, delay) {
        var timer = setTimeout(function () {
            deferred.reject("timeout");
        }, delay);
        deferred.always(function () { clearTimeout(timer); });
    }

    /**
     * @private
     * Helper function to attempt a single connection to the node server
     */
    function attemptSingleConnect() {
        var deferred = $.Deferred();
        var port = null;
        var ws = null;
        setDeferredTimeout(deferred, CONNECTION_TIMEOUT);

        brackets.app.getNodeState(function (err, nodePort) {
            if (!err && nodePort && deferred.state() !== "rejected") {
                port = nodePort;
                ws = new WebSocket("ws://localhost:" + port);

                // Expect ArrayBuffer objects from Node when receiving binary
                // data instead of DOM Blobs, which are the default.
                ws.binaryType = "arraybuffer";

                // If the server port isn't open, we get a close event
                // at some point in the future (and will not get an onopen
                // event)
                ws.onclose = function () {
                    deferred.reject("WebSocket closed");
                };

                ws.onopen = function () {
                    // If we successfully opened, remove the old onclose
                    // handler (which was present to detect failure to
                    // connect at all).
                    ws.onclose = null;
                    deferred.resolveWith(null, [ws, port]);
                };
            } else {
                deferred.reject("brackets.app.getNodeState error: " + err);
            }
        });

        return deferred.promise();
    }

    /**
     * Provides an interface for interacting with the node server.
     * @constructor
     */
    function NodeConnection() {
        this.domains = {};
        this._registeredModules = [];
        this._pendingInterfaceRefreshDeferreds = [];
        this._pendingCommandDeferreds = [];
    }
    EventDispatcher.makeEventDispatcher(NodeConnection.prototype);

    /**
     * @type {Object}
     * Exposes the domains registered with the server. This object will
     * have a property for each registered domain. Each of those properties
     * will be an object containing properties for all the commands in that
     * domain. So, myConnection.base.enableDebugger would point to the function
     * to call to enable the debugger.
     *
     * This object is automatically replaced every time the API changes (based
     * on the base:newDomains event from the server). Therefore, code that
     * uses this object should not keep their own pointer to the domain property.
     */
    NodeConnection.prototype.domains = null;

    /**
     * @private
     * @type {Array.<string>}
     * List of module pathnames that should be re-registered if there is
     * a disconnection/connection (i.e. if the server died).
     */
    NodeConnection.prototype._registeredModules = null;

    /**
     * @private
     * @type {WebSocket}
     * The connection to the server
     */
    NodeConnection.prototype._ws = null;

    /**
     * @private
     * @type {?number}
     * The port the WebSocket is currently connected to
     */
    NodeConnection.prototype._port = null;

    /**
     * @private
     * @type {number}
     * Unique ID for commands
     */
    NodeConnection.prototype._commandCount = 1;

    /**
     * @private
     * @type {boolean}
     * Whether to attempt reconnection if connection fails
     */
    NodeConnection.prototype._autoReconnect = false;

    /**
     * @private
     * @type {Array.<jQuery.Deferred>}
     * List of deferred objects that should be resolved pending
     * a successful refresh of the API
     */
    NodeConnection.prototype._pendingInterfaceRefreshDeferreds = null;

    /**
     * @private
     * @type {Array.<jQuery.Deferred>}
     * Array (indexed on command ID) of deferred objects that should be
     * resolved/rejected with the response of commands.
     */
    NodeConnection.prototype._pendingCommandDeferreds = null;

    /**
     * @private
     * @return {number} The next command ID to use. Always representable as an
     * unsigned 32-bit integer.
     */
    NodeConnection.prototype._getNextCommandID = function () {
        var nextID;

        if (this._commandCount > MAX_COUNTER_VALUE) {
            nextID = this._commandCount = 0;
        } else {
            nextID = this._commandCount++;
        }

        return nextID;
    };

    /**
     * @private
     * Helper function to do cleanup work when a connection fails
     */
    NodeConnection.prototype._cleanup = function () {
        // clear out the domains, since we may get different ones
        // on the next connection
        this.domains = {};

        // shut down the old connection if there is one
        if (this._ws && this._ws.readyState !== WebSocket.CLOSED) {
            try {
                this._ws.close();
            } catch (e) { }
        }
        var failedDeferreds = this._pendingInterfaceRefreshDeferreds
            .concat(this._pendingCommandDeferreds);
        failedDeferreds.forEach(function (d) {
            d.reject("cleanup");
        });
        this._pendingInterfaceRefreshDeferreds = [];
        this._pendingCommandDeferreds = [];

        this._ws = null;
        this._port = null;
    };

    /**
     * Connect to the node server. After connecting, the NodeConnection
     * object will trigger a "close" event when the underlying socket
     * is closed. If the connection is set to autoReconnect, then the
     * event will also include a jQuery promise for the connection.
     *
     * @param {boolean} autoReconnect Whether to automatically try to
     *    reconnect to the server if the connection succeeds and then
     *    later disconnects. Note if this connection fails initially, the
     *    autoReconnect flag is set to false. Future calls to connect()
     *    can reset it to true
     * @return {jQuery.Promise} Promise that resolves/rejects when the
     *    connection succeeds/fails
     */
    NodeConnection.prototype.connect = function (autoReconnect) {
        var self = this;
        self._autoReconnect = autoReconnect;
        var deferred = $.Deferred();
        var attemptCount = 0;
        var attemptTimestamp = null;

        // Called after a successful connection to do final setup steps
        function registerHandlersAndDomains(ws, port) {
            // Called if we succeed at the final setup
            function success() {
                self._ws.onclose = function () {
                    if (self._autoReconnect) {
                        var $promise = self.connect(true);
                        self.trigger("close", $promise);
                    } else {
                        self._cleanup();
                        self.trigger("close");
                    }
                };
                deferred.resolve();
            }
            // Called if we fail at the final setup
            function fail(err) {
                self._cleanup();
                deferred.reject(err);
            }

            self._ws = ws;
            self._port = port;
            self._ws.onmessage = self._receive.bind(self);

            // refresh the current domains, then re-register any
            // "autoregister" modules
            self._refreshInterface().then(
                function () {
                    if (self._registeredModules.length > 0) {
                        self.loadDomains(self._registeredModules, false).then(
                            success,
                            fail
                        );
                    } else {
                        success();
                    }
                },
                fail
            );
        }

        // Repeatedly tries to connect until we succeed or until we've
        // failed CONNECTION_ATTEMPT times. After each attempt, waits
        // at least RETRY_DELAY before trying again.
        function doConnect() {
            attemptCount++;
            attemptTimestamp = new Date();
            attemptSingleConnect().then(
                registerHandlersAndDomains, // succeded
                function () { // failed this attempt, possibly try again
                    if (attemptCount < CONNECTION_ATTEMPTS) { //try again
                        // Calculate how long we should wait before trying again
                        var now = new Date();
                        var delay = Math.max(
                            RETRY_DELAY - (now - attemptTimestamp),
                            1
                        );
                        setTimeout(doConnect, delay);
                    } else { // too many attempts, give up
                        deferred.reject("Max connection attempts reached");
                    }
                }
            );
        }

        // Start the connection process
        self._cleanup();
        doConnect();

        return deferred.promise();
    };

    /**
     * Determines whether the NodeConnection is currently connected
     * @return {boolean} Whether the NodeConnection is connected.
     */
    NodeConnection.prototype.connected = function () {
        return !!(this._ws && this._ws.readyState === WebSocket.OPEN);
    };

    /**
     * Explicitly disconnects from the server. Note that even if
     * autoReconnect was set to true at connection time, the connection
     * will not reconnect after this call. Reconnection can be manually done
     * by calling connect() again.
     */
    NodeConnection.prototype.disconnect = function () {
        this._autoReconnect = false;
        this._cleanup();
    };

    /**
     * Load domains into the server by path
     * @param {Array.<string>} List of absolute paths to load
     * @param {boolean} autoReload Whether to auto-reload the domains if the server
     *    fails and restarts. Note that the reload is initiated by the
     *    client, so it will only happen after the client reconnects.
     * @return {jQuery.Promise} Promise that resolves after the load has
     *    succeeded and the new API is availale at NodeConnection.domains,
     *    or that rejects on failure.
     */
    NodeConnection.prototype.loadDomains = function (paths, autoReload) {
        var deferred = $.Deferred();
        setDeferredTimeout(deferred, CONNECTION_TIMEOUT);
        var pathArray = paths;
        if (!Array.isArray(paths)) {
            pathArray = [paths];
        }

        if (autoReload) {
            Array.prototype.push.apply(this._registeredModules, pathArray);
        }

        if (this.domains.base && this.domains.base.loadDomainModulesFromPaths) {
            this.domains.base.loadDomainModulesFromPaths(pathArray).then(
                function (success) { // command call succeeded
                    if (!success) {
                        // response from commmand call was "false" so we know
                        // the actual load failed.
                        deferred.reject("loadDomainModulesFromPaths failed");
                    }
                    // if the load succeeded, we wait for the API refresh to
                    // resolve the deferred.
                },
                function (reason) { // command call failed
                    deferred.reject("Unable to load one of the modules: " + pathArray + (reason ? ", reason: " + reason : ""));
                }
            );

            this._pendingInterfaceRefreshDeferreds.push(deferred);
        } else {
            deferred.reject("this.domains.base is undefined");
        }

        return deferred.promise();
    };

    /**
     * @private
     * Sends a message over the WebSocket. Automatically JSON.stringifys
     * the message if necessary.
     * @param {Object|string} m Object to send. Must be JSON.stringify-able.
     */
    NodeConnection.prototype._send = function (m) {
        if (this.connected()) {

            // Convert the message to a string
            var messageString = null;
            if (typeof m === "string") {
                messageString = m;
            } else {
                try {
                    messageString = JSON.stringify(m);
                } catch (stringifyError) {
                    console.error("[NodeConnection] Unable to stringify message in order to send: " + stringifyError.message);
                }
            }

            // If we succeded in making a string, try to send it
            if (messageString) {
                try {
                    this._ws.send(messageString);
                } catch (sendError) {
                    console.error("[NodeConnection] Error sending message: " + sendError.message);
                }
            }
        } else {
            console.error("[NodeConnection] Not connected to node, unable to send.");
        }
    };

    /**
     * @private
     * Handler for receiving events on the WebSocket. Parses the message
     * and dispatches it appropriately.
     * @param {WebSocket.Message} message Message object from WebSocket
     */
    NodeConnection.prototype._receive = function (message) {
        var responseDeferred = null;
        var data = message.data;
        var m;

        if (message.data instanceof ArrayBuffer) {
            // The first four bytes encode the command ID as an unsigned 32-bit integer
            if (data.byteLength < 4) {
                console.error("[NodeConnection] received malformed binary message");
                return;
            }

            var header = data.slice(0, 4),
                body = data.slice(4),
                headerView = new Uint32Array(header),
                id = headerView[0];

            // Unpack the binary message into a commandResponse
            m = {
                type: "commandResponse",
                message: {
                    id: id,
                    response: body
                }
            };
        } else {
            try {
                m = JSON.parse(data);
            } catch (e) {
                console.error("[NodeConnection] received malformed message", message, e.message);
                return;
            }
        }

        switch (m.type) {
        case "event":
            if (m.message.domain === "base" && m.message.event === "newDomains") {
                this._refreshInterface();
            }

            // Event type "domain:event"
            EventDispatcher.triggerWithArray(this, m.message.domain + ":" + m.message.event,
                                             m.message.parameters);
            break;
        case "commandResponse":
            responseDeferred = this._pendingCommandDeferreds[m.message.id];
            if (responseDeferred) {
                responseDeferred.resolveWith(this, [m.message.response]);
                delete this._pendingCommandDeferreds[m.message.id];
            }
            break;
        case "commandProgress":
            responseDeferred = this._pendingCommandDeferreds[m.message.id];
            if (responseDeferred) {
                responseDeferred.notifyWith(this, [m.message.message]);
            }
            break;
        case "commandError":
            responseDeferred = this._pendingCommandDeferreds[m.message.id];
            if (responseDeferred) {
                responseDeferred.rejectWith(
                    this,
                    [m.message.message, m.message.stack]
                );
                delete this._pendingCommandDeferreds[m.message.id];
            }
            break;
        case "error":
            console.error("[NodeConnection] received error: " +
                            m.message.message);
            break;
        default:
            console.error("[NodeConnection] unknown event type: " + m.type);
        }
    };

    /**
     * @private
     * Helper function for refreshing the interface in the "domain" property.
     * Automatically called when the connection receives a base:newDomains
     * event from the server, and also called at connection time.
     */
    NodeConnection.prototype._refreshInterface = function () {
        var deferred = $.Deferred();
        var self = this;

        var pendingDeferreds = this._pendingInterfaceRefreshDeferreds;
        this._pendingInterfaceRefreshDeferreds = [];
        deferred.then(
            function () {
                pendingDeferreds.forEach(function (d) { d.resolve(); });
            },
            function (err) {
                pendingDeferreds.forEach(function (d) { d.reject(err); });
            }
        );

        function refreshInterfaceCallback(spec) {
            function makeCommandFunction(domainName, commandSpec) {
                return function () {
                    var deferred = $.Deferred();
                    var parameters = Array.prototype.slice.call(arguments, 0);
                    var id = self._getNextCommandID();
                    self._pendingCommandDeferreds[id] = deferred;
                    self._send({id: id,
                               domain: domainName,
                               command: commandSpec.name,
                               parameters: parameters
                               });
                    return deferred;
                };
            }

            // TODO: Don't replace the domain object every time. Instead, merge.
            self.domains = {};
            self.domainEvents = {};
            spec.forEach(function (domainSpec) {
                self.domains[domainSpec.domain] = {};
                domainSpec.commands.forEach(function (commandSpec) {
                    self.domains[domainSpec.domain][commandSpec.name] =
                        makeCommandFunction(domainSpec.domain, commandSpec);
                });
                self.domainEvents[domainSpec.domain] = {};
                domainSpec.events.forEach(function (eventSpec) {
                    var parameters = eventSpec.parameters;
                    self.domainEvents[domainSpec.domain][eventSpec.name] = parameters;
                });
            });
            deferred.resolve();
        }

        if (this.connected()) {
            $.getJSON("http://localhost:" + this._port + "/api")
                .done(refreshInterfaceCallback)
                .fail(function (err) { deferred.reject(err); });
        } else {
            deferred.reject("Attempted to call _refreshInterface when not connected.");
        }

        return deferred.promise();
    };

    /**
     * @private
     * Get the default timeout value
     * @return {number} Timeout value in milliseconds
     */
    NodeConnection._getConnectionTimeout = function () {
        return CONNECTION_TIMEOUT;
    };

    module.exports = NodeConnection;

});
