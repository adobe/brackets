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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true,
indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waits,
waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
    
    // Windows sockets are slow to realize they've disconnected (or failed
    // to connect), so the unit tests that rely on checking disconnect/reconnect
    // need a long timeout. To make sure that unit tests run as fast as
    // possible, we should make sure that any waitsFor functions that use this
    // timeout are expected to succeed in waiting (i.e. return "true" as fast
    // as possible).
    var CONNECTION_TIMEOUT      = 30000;  // 30 seconds
    var RESTART_SERVER_DELAY    = 5000;  // five seconds
    
    var NodeConnection  = require("utils/NodeConnection"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils");

    var testPath = SpecRunnerUtils.getTestPath("/spec/NodeConnection-test-files");
    
    describe("Node Connection", function () {

        var _connectionsToAutoDisconnect = null;
        
        function createConnection() {
            var connection = new NodeConnection();
            _connectionsToAutoDisconnect.push(connection);
            return connection;
        }
        
        function runConnectAndWait(connection, autoReconnect) {
            var connectDeferred = null;
            runs(function () {
                connectDeferred = connection.connect(autoReconnect);
            });
            waitsFor(
                function () {
                    return connectDeferred &&
                        connectDeferred.isResolved() &&
                        connection.connected();
                },
                "The NodeConnection should connect",
                CONNECTION_TIMEOUT
            );
        }
        
        function waitThenRunRestartServer(connection) {
            waits(RESTART_SERVER_DELAY);
            runs(function () {
                connection.domains.base.restartNode();
            });
        }
        
        function runLoadDomainsAndWait(connection, filenames, autoReload) {
            var loadDeferred = null;
            runs(function () {
                var fullPaths = [];
                filenames.forEach(function (filename) {
                    fullPaths.push(testPath + "/" + filename);
                });
                if (connection && connection.connected()) {
                    loadDeferred = connection.loadDomains(
                        fullPaths,
                        autoReload
                    );
                }
            });
            waitsFor(
                function () {
                    return loadDeferred && loadDeferred.isResolved();
                },
                "The load should complete",
                CONNECTION_TIMEOUT
            );
        }
                    
        beforeEach(function () {
            _connectionsToAutoDisconnect = [];
        });
        
        afterEach(function () {
            _connectionsToAutoDisconnect.forEach(function (c) {
                c.disconnect();
            });
        });
                
        it("should not crash when attempting to load malformed domains",
            function () {
                var connection = createConnection();
                var loadDeferred = null;
                var port = -1;
                runConnectAndWait(connection, false);
                runs(
                    function () {
                        port = connection._port;
                        expect(connection.connected()).toBe(true);
                        expect(port).toBeGreaterThan(0);
                        var path = testPath + "/TestCommandsError";
                        loadDeferred = connection.loadDomains(path, false);
                    }
                );
                waitsFor(
                    function () {
                        return loadDeferred &&
                            (loadDeferred.isRejected() ||
                                loadDeferred.isResolved());
                    },
                    CONNECTION_TIMEOUT
                );
                runs(
                    function () {
                        expect(loadDeferred.isRejected()).toBe(true);
                        expect(connection.connected()).toBe(true);
                        expect(connection._port).toBe(port);
                    }
                );
            });
        
        it("should execute synchronous commands", function () {
            var connection = createConnection();
            var commandDeferred = null;
            var result = null;
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["TestCommandsOne"], false);
            runs(function () {
                commandDeferred = connection.domains.test.reverse("asdf");
                commandDeferred.done(function (response) {
                    result = response;
                });
            });
            waitsFor(
                function () {
                    return commandDeferred &&
                        commandDeferred.isResolved() &&
                        result;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                expect(result).toBe("fdsa");
            });
        });
        
        it("should execute asynchronous commands", function () {
            var connection = createConnection();
            var commandDeferred = null;
            var result = null;
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["TestCommandsTwo"], false);
            runs(function () {
                commandDeferred = connection.domains.test.reverseAsync("asdf");
                commandDeferred.done(function (response) {
                    result = response;
                });
            });
            waitsFor(
                function () {
                    return commandDeferred &&
                        commandDeferred.isResolved() &&
                        result;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                expect(result).toBe("fdsa");
            });
        });
        
        it("should receive events", function () {
            var connection = createConnection();
            var eventMessages = [];
            $(connection).on(
                "base.log",
                function (evt, level, timestamp, message) {
                    eventMessages.push(message);
                }
            );
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["TestCommandsOne"], false);
            runs(function () {
                connection.domains.test.log("1234");
            });
            waitsFor(
                function () {
                    return eventMessages.indexOf("1234") >= 0;
                },
                CONNECTION_TIMEOUT
            );
        });
        
        it("should receive command errors and continue to run", function () {
            var connection = createConnection();
            var commandDeferred = null;
            var result = null;
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["TestCommandsOne"], false);
            runs(function () {
                commandDeferred =
                    connection.domains.test.raiseException("qwerty");
                commandDeferred.fail(function (message, stack) {
                    result = message;
                });
            });
            waitsFor(
                function () {
                    return commandDeferred &&
                        commandDeferred.isRejected() &&
                        result;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                expect(result).toBe("qwerty");
                expect(connection.connected()).toBe(true);

                commandDeferred = null;
                result = null;
                commandDeferred = connection.domains.test.reverse("asdf");
                commandDeferred.done(function (response) {
                    result = response;
                });
            });
            waitsFor(
                function () {
                    return commandDeferred &&
                        commandDeferred.isResolved() &&
                        result;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                expect(result).toBe("fdsa");
            });
            
        });
        
        it("should be robust to malformed messages", function () {
            var connection = createConnection();
            var commandDeferred = null;
            var result = null;
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["TestCommandsOne"], false);
            runs(function () {
                connection._ws.send("EXPECTED ERROR FROM UNIT TEST");
                commandDeferred = connection.domains.test.reverse("asdf");
                commandDeferred.done(function (response) {
                    result = response;
                });
            });
            waitsFor(
                function () {
                    return commandDeferred &&
                        commandDeferred.isResolved() &&
                        result;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                expect(result).toBe("fdsa");
            });
        });
        
        it("should restart and automatically reconnect/reload", function () {
            var connectionOne = createConnection();
            var connectionTwo = createConnection();
            var portOne = -1;
            var portTwo = -1;

            runConnectAndWait(connectionOne, true);
            runs(function () {
                portOne = connectionOne._port;
            });
            waitThenRunRestartServer(connectionOne);
            waitsFor(
                function () {
                    return connectionOne.connected() &&
                        connectionOne._port > 0 &&
                        connectionOne._port !== portOne;
                },
                CONNECTION_TIMEOUT,
                "autoReconnect should reconnect to a different port"
            );
            runConnectAndWait(connectionTwo, false);
            runs(function () {
                portOne = connectionOne._port;
                portTwo = connectionTwo._port;
                expect(portOne).toBeGreaterThan(0);
                expect(portTwo).toBeGreaterThan(0);
                expect(portOne).toBe(portTwo);
                expect(connectionOne.domains.test).toBeFalsy();
            });
            runLoadDomainsAndWait(connectionOne, ["TestCommandsOne"], true);
            runs(function () {
                expect(connectionOne.domains.test).toBeTruthy();
                expect(connectionOne.domains.test.reverse).toBeTruthy();
                expect(connectionOne.domains.test.reverseAsync).toBeFalsy();
            });
            waitsFor(
                function () {
                    return connectionTwo.domains.test &&
                        connectionTwo.domains.test.reverse;
                },
                CONNECTION_TIMEOUT,
                "test domain should be defined in other connections"
            );
            runLoadDomainsAndWait(connectionOne, ["TestCommandsTwo"], false);
            runs(function () {
                expect(connectionOne.domains.test.reverseAsync).toBeTruthy();
            });
            waitsFor(
                function () {
                    return connectionTwo.domains.test &&
                        connectionTwo.domains.test.reverseAsync;
                },
                CONNECTION_TIMEOUT,
                "additional test commands should be defined in all connections"
            );
            waitThenRunRestartServer(connectionOne);
            waitsFor(
                function () {
                    return connectionOne.connected() &&
                        connectionOne._port > 0 &&
                        connectionOne._port !== portOne;
                },
                CONNECTION_TIMEOUT,
                "should reconnect to a different port the second time"
            );
            waitsFor(
                function () {
                    return !connectionTwo.connected();
                },
                CONNECTION_TIMEOUT,
                "Non-autoReconnect connection should disconnect"
            );
            waitsFor(
                function () {
                    return connectionOne.domains.test &&
                        connectionOne.domains.test.reverse;
                },
                CONNECTION_TIMEOUT,
                "test.reverse command should be re-registered"
            );
            runs(function () {
                expect(connectionOne.domains.test.reverseAsync).toBeFalsy();
            });

        });
    });
});