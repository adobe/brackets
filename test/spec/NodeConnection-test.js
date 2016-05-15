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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true,
indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, ArrayBuffer, DataView, jasmine */

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

        this.category = "livepreview";

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
                        connectDeferred.state() === "resolved" &&
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
                    return loadDeferred && loadDeferred.state() === "resolved";
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
                c.off("close");
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
                        return loadDeferred && loadDeferred.state() !== "pending";
                    },
                    CONNECTION_TIMEOUT
                );
                runs(
                    function () {
                        expect(loadDeferred.state() === "rejected").toBe(true);
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
                        commandDeferred.state() === "resolved" &&
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
                        commandDeferred.state() === "resolved" &&
                        result;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                expect(result).toBe("fdsa");
            });
        });

        it("should receive progress events from asynchronous commands", function () {
            var connection = createConnection();
            var commandDeferred = null;
            var result = null;
            var progressMessage = null;
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["TestCommandsTwo"], false);
            runs(function () {
                commandDeferred = connection.domains.test.reverseAsyncWithProgress("asdf");
                commandDeferred.progress(function (message) {
                    progressMessage = message;
                });
                commandDeferred.done(function (response) {
                    result = response;
                });
            });
            waitsFor(
                function () {
                    return commandDeferred && progressMessage !== null;
                },
                CONNECTION_TIMEOUT
            );
            waitsFor(
                function () {
                    return commandDeferred &&
                        commandDeferred.state() === "resolved" &&
                        result;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                expect(progressMessage).toBe("progress");
                expect(result).toBe("fdsa");
            });
        });

        it("should receive events", function () {
            var connection = createConnection();
            var spy = jasmine.createSpy();
            connection.one(
                "test:eventOne",
                spy
            );
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["TestCommandsOne"], false);
            runs(function () {
                connection.domains.test.emitEventOne();
            });
            waitsFor(
                function () {
                    return spy.calls.length === 1;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                expect(spy.calls[0].args[0].type).toBe("test:eventOne"); // event.type
                expect(spy.calls[0].args[1]).toBe("foo"); // argOne
                expect(spy.calls[0].args[2]).toBe("bar"); // argTwo
            });
        });

        it("should parse domain event specifications", function () {
            var connection = createConnection();
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["TestCommandsOne"], false);
            runs(function () {
                expect(connection.domainEvents.test.eventOne.length).toBe(2);
                expect(connection.domainEvents.test.eventOne[0].name).toBe('argOne');
                expect(connection.domainEvents.test.eventOne[0].type).toBe('string');
                expect(connection.domainEvents.test.eventOne[1].name).toBe('argTwo');
                expect(connection.domainEvents.test.eventOne[1].type).toBe('string');
                expect(connection.domainEvents.test.eventTwo.length).toBe(2);
                expect(connection.domainEvents.test.eventTwo[0].name).toBe('argOne');
                expect(connection.domainEvents.test.eventTwo[0].type).toBe('boolean');
                expect(connection.domainEvents.test.eventTwo[1].name).toBe('argTwo');
                expect(connection.domainEvents.test.eventTwo[1].type).toBe('boolean');
            });
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
                        commandDeferred.state() === "rejected" &&
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
                        commandDeferred.state() === "resolved" &&
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
                        commandDeferred.state() === "resolved" &&
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

            var reconnectResolved = false, closeHandlerCalled = false;
            connectionOne.on("close", function (e, reconnectPromise) {
                closeHandlerCalled = true;
                reconnectPromise.then(function () {
                    reconnectResolved = true;
                });
            });

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
                expect(closeHandlerCalled).toBe(true);
                expect(reconnectResolved).toBe(true);
                expect(connectionOne.domains.test.reverseAsync).toBeFalsy();
            });

        });

        it("should receive synchronous binary command responses", function () {
            var connection = createConnection();
            var commandDeferred = null;
            var result = null;
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["BinaryTestCommands"], false);
            runs(function () {
                commandDeferred = connection.domains.binaryTest.getBufferSync();
                commandDeferred.done(function (response) {
                    result = response;
                });
            });
            waitsFor(
                function () {
                    return commandDeferred &&
                        commandDeferred.state() === "resolved" &&
                        result;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                var view = new DataView(result);

                expect(result instanceof ArrayBuffer).toBe(true);
                expect(result.byteLength).toBe(18);
                expect(view.getUint8(0)).toBe(1);
                expect(view.getUint32(1)).toBe(4294967295);
                expect(view.getFloat32(5, false)).toBe(3.141592025756836);
                expect(view.getFloat64(9, true)).toBe(1.7976931348623157e+308);
                expect(view.getInt8(17)).toBe(-128);
            });
        });

        it("should receive asynchronous binary command response", function () {
            var connection = createConnection();
            var commandDeferred = null;
            var result = null;
            runConnectAndWait(connection, false);
            runLoadDomainsAndWait(connection, ["BinaryTestCommands"], false);
            runs(function () {
                commandDeferred = connection.domains.binaryTest.getBufferAsync();
                commandDeferred.done(function (response) {
                    result = response;
                });
            });
            waitsFor(
                function () {
                    return commandDeferred &&
                        commandDeferred.state() === "resolved" &&
                        result;
                },
                CONNECTION_TIMEOUT
            );
            runs(function () {
                var view = new DataView(result);

                expect(result instanceof ArrayBuffer).toBe(true);
                expect(result.byteLength).toBe(18);
                expect(view.getUint8(0)).toBe(1);
                expect(view.getUint32(1)).toBe(4294967295);
                expect(view.getFloat32(5, false)).toBe(3.141592025756836);
                expect(view.getFloat64(9, true)).toBe(1.7976931348623157e+308);
                expect(view.getInt8(17)).toBe(-128);
            });
        });
    });
});
