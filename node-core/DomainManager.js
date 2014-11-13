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
        
    var util              = require("util"),
        server            = require("./Server"),
        ConnectionManager = require("./ConnectionManager");
    
    /**
     * @constructor
     * DomainManager is a module/class that handles the loading, registration,
     * and execution of all commands and events. It is a singleton, and is passed
     * to a domain in its init() method.
     */
    var self = exports;
    
    /**
     * @private
     * @type {object}
     * Map of all the registered domains
     */
    var _domains = {};

    /**
     * @private
     * @type {Array.<Module>}
     * Array of all modules we have loaded. Used for avoiding duplicate loading.
     */
    var _initializedDomainModules = [];

    /**
     * @private
     * @type {number}
     * Used for generating unique IDs for events.
     */
    var _eventCount = 1;

    /**
     * @private
     * @type {Array}
     * JSON.stringify-able Array of the current API. In the format of
     * Inspector.json. This is a cache that we invalidate every time the
     * API changes.
     */
    var _cachedDomainDescriptions = null;
    
    /**
     * Returns whether a domain with the specified name exists or not.
     * @param {string} domainName The domain name.
     * @return {boolean} Whether the domain exists
     */
    function hasDomain(domainName) {
        return !!_domains[domainName];
    }
    
    /**
     * Returns a new empty domain. Throws error if the domain already exists.
     * @param {string} domainName The domain name.
     * @param {{major: number, minor: number}} version The domain version.
     *   The version has a format like {major: 1, minor: 2}. It is reported
     *   in the API spec, but serves no other purpose on the server. The client
     *   can make use of this.
     */
    function registerDomain(domainName, version) {
        if (!hasDomain(domainName)) {
            // invalidate the cache
            _cachedDomainDescriptions = null;
            
            _domains[domainName] = {version: version, commands: {}, events: {}};
        } else {
            console.error("[DomainManager] Domain " + domainName + " already registered");
        }
    }
    
    /**
     * Registers a new command with the specified domain. If the domain does
     * not yet exist, it registers the domain with a null version.
     * @param {string} domainName The domain name.
     * @param {string} commandName The command name.
     * @param {Function} commandFunction The callback handler for the function.
     *    The function is called with the arguments specified by the client in the
     *    command message. Additionally, if the command is asynchronous (isAsync
     *    parameter is true), the function is called with an automatically-
     *    constructed callback function of the form cb(err, result). The function
     *    can then use this to send a response to the client asynchronously.
     * @param {boolean} isAsync See explanation for commandFunction param
     * @param {?string} description Used in the API documentation
     * @param {?Array.<{name: string, type: string, description:string}>} parameters
     *    Used in the API documentation.
     * @param {?Array.<{name: string, type: string, description:string}>} returns
     *    Used in the API documentation.
     */
    function registerCommand(domainName, commandName, commandFunction, isAsync,
        description, parameters, returns) {
        // invalidate the cache
        _cachedDomainDescriptions = null;
        
        if (!hasDomain(domainName)) {
            registerDomain(domainName, null);
        }

        if (!_domains[domainName].commands[commandName]) {
            _domains[domainName].commands[commandName] = {
                commandFunction: commandFunction,
                isAsync: isAsync,
                description: description,
                parameters: parameters,
                returns: returns
            };
        } else {
            throw new Error("Command " + domainName + "." +
                commandName + " already registered");
        }
    }

    /**
     * Executes a command by domain name and command name. Called by a connection's
     * message parser. Sends response or error (possibly asynchronously) to the
     * connection.
     * @param {Connection} connection The requesting connection object.
     * @param {number} id The unique command ID.
     * @param {string} domainName The domain name.
     * @param {string} commandName The command name.
     * @param {Array} parameters The parameters to pass to the command function. If
     *    the command is asynchronous, will be augmented with a callback function.
     *    (see description in registerCommand documentation)
     */
    function executeCommand(connection, id, domainName,
        commandName, parameters) {
        if (_domains[domainName] &&
                _domains[domainName].commands[commandName]) {
            var command = _domains[domainName].commands[commandName];
            if (command.isAsync) {
                var callback = function (err, result) {
                    if (err) {
                        connection.sendCommandError(id, err);
                    } else {
                        connection.sendCommandResponse(id, result);
                    }
                };
                parameters.push(callback);
                command.commandFunction.apply(connection, parameters);
            } else { // synchronous command
                try {
                    connection.sendCommandResponse(
                        id,
                        command.commandFunction.apply(connection, parameters)
                    );
                } catch (e) {
                    connection.sendCommandError(id, e.message);
                }
            }
        } else {
            connection.sendCommandError(id, "no such command: " +
                domainName + "." + commandName);
        }
    }

    /**
     * Registers an event domain and name.
     * @param {string} domainName The domain name.
     * @param {string} eventName The event name.
     * @param {?Array.<{name: string, type: string, description:string}>} parameters
     *    Used in the API documentation.
     */
    function registerEvent(domainName, eventName, parameters) {
        // invalidate the cache
        _cachedDomainDescriptions = null;
        
        if (!hasDomain(domainName)) {
            registerDomain(domainName, null);
        }

        if (!_domains[domainName].events[eventName]) {
            _domains[domainName].events[eventName] = {
                parameters: parameters
            };
        } else {
            console.error("[DomainManager] Event " + domainName + "." +
                eventName + " already registered");
        }
    }

    /**
     * Emits an event with the specified name and parameters to all connections.
     *
     * TODO: Future: Potentially allow individual connections to register
     * for which events they want to receive. Right now, we have so few events
     * that it's fine to just send all events to everyone and decide on the
     * client side if the client wants to handle them.
     *
     * @param {string} domainName The domain name.
     * @param {string} eventName The event name.
     * @param {?Array} parameters The parameters. Must be JSON.stringify-able
     */
    function emitEvent(domainName, eventName, parameters) {
        if (_domains[domainName] && _domains[domainName].events[eventName]) {
            ConnectionManager.sendEventToAllConnections(
                _eventCount++,
                domainName,
                eventName,
                parameters
            );
        } else {
            console.error("[DomainManager] No such event: " + domainName +
                "." + eventName);
        }
    }
    
    /**
     * Loads and initializes domain modules using the specified paths. Checks to
     * make sure that a module is not loaded/initialized more than once.
     *
     * @param {Array.<string>} paths The paths to load. The paths can be relative
     *    to the DomainManager or absolute. However, modules that aren't in core
     *    won't know where the DomainManager module is, so in general, all paths
     *    should be absolute.
     * @return {boolean} Whether loading succeded. (Failure will throw an exception).
     */
    function loadDomainModulesFromPaths(paths) {
        var pathArray = paths;
        if (!util.isArray(paths)) {
            pathArray = [paths];
        }
        pathArray.forEach(function (path) {
            var m = require(path);
            if (m && m.init && _initializedDomainModules.indexOf(m) < 0) {
                m.init(self);
                _initializedDomainModules.push(m); // don't init more than once
            }
        });
        return true; // if we fail, an exception will be thrown
    }
    
    /**
     * Returns a description of all registered domains in the format of WebKit's
     * Inspector.json. Used for sending API documentation to clients.
     *
     * @return {Array} Array describing all domains.
     */
    function getDomainDescriptions() {
        if (!_cachedDomainDescriptions) {
            _cachedDomainDescriptions = [];
            
            var domainNames = Object.keys(_domains);
            domainNames.forEach(function (domainName) {
                var d = {
                    domain: domainName,
                    version: _domains[domainName].version,
                    commands: [],
                    events: []
                };
                var commandNames = Object.keys(_domains[domainName].commands);
                commandNames.forEach(function (commandName) {
                    var c = _domains[domainName].commands[commandName];
                    d.commands.push({
                        name: commandName,
                        description: c.description,
                        parameters: c.parameters,
                        returns: c.returns
                    });
                });
                var eventNames = Object.keys(_domains[domainName].events);
                eventNames.forEach(function (eventName) {
                    d.events.push({
                        name: eventName,
                        parameters: _domains[domainName].events[eventName].parameters
                    });
                });
                _cachedDomainDescriptions.push(d);
            });
        }
        return _cachedDomainDescriptions;
    }
    
    exports.hasDomain                  = hasDomain;
    exports.registerDomain             = registerDomain;
    exports.registerCommand            = registerCommand;
    exports.executeCommand             = executeCommand;
    exports.registerEvent              = registerEvent;
    exports.emitEvent                  = emitEvent;
    exports.loadDomainModulesFromPaths = loadDomainModulesFromPaths;
    exports.getDomainDescriptions      = getDomainDescriptions;
}());
