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

/*global describe, it, expect, beforeEach, afterEach, waits, waitsFor, waitsForDone, runs, waitsForDone, spyOn */

define(function (require, exports, module) {
    "use strict";

    var main            = require("main"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        StaticServer    = require("StaticServer");

    var testFolder = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files";

    var CONNECT_TIMEOUT = 20000;

    function makeBaseUrl(serverInfo) {
        return "http://" + serverInfo.address + ":" + serverInfo.port;
    }

    function getUrl(serverInfo, path) {
        return $.get(makeBaseUrl(serverInfo) + path);
    }

    describe("StaticServer", function () {

        // Unit tests for the underlying node server.
        describe("StaticServerDomain", function () {
            var nodeConnection,
                nodeDomain,
                logs;

            beforeEach(function () {
                logs = [];

                if (!nodeConnection) {
                    runs(function () {
                        // wait for StaticServer/main to connect and load the StaticServerDomain
                        nodeDomain = main._nodeDomain;
                        nodeConnection = nodeDomain.connection;

                        waitsFor(function () { return nodeDomain.ready(); }, "NodeDomain connected", CONNECT_TIMEOUT);
                    });

                    runs(function () {
                        nodeConnection.on("base:log", function (event, level, timestamp, message) {
                            logs.push({level: level, message: message});
                        });
                    });
                }
            });

            afterEach(function () {
                runs(function () {
                    // reset StaticServerDomain
                    waitsForDone(nodeConnection.domains.staticServer._setRequestFilterTimeout(), "restore request filter timeout");
                });
            });

            function onRequestFilter(callback) {
                // only handle the first event
                nodeConnection.one("staticServer:requestFilter", function cb(event, request) {
                    callback(request);
                });
            }

            it("should start a static server on the given folder", function () {
                var serverInfo, path = testFolder + "/folder1";
                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path, 0)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });

                waitsFor(function () { return serverInfo; }, "waiting for static server to start");

                runs(function () {
                    expect(serverInfo.address).toBe("127.0.0.1");
                    expect(Number(serverInfo.port)).toBeGreaterThan(0);

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path),
                                 "waiting for static server to close");
                });
            });

            it("should start the server on the given port", function () {
                var serverInfo,
                    path = testFolder + "/folder1";

                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path, 54321)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });

                waitsFor(function () { return serverInfo; }, "waiting for static server to start");
                runs(function () {
                    expect(serverInfo.port).toBe(54321);

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path),
                                 "waiting for static server to close");
                });
            });

            it("should start a static server using a random port when the given port is already in use", function () {
                var serverInfo1, serverInfo2,
                    path1 = testFolder + "/folder1", path2 = testFolder + "/folder2";

                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path1, 54321)
                        .done(function (info) {
                            serverInfo1 = info;
                        });
                    nodeConnection.domains.staticServer.getServer(path2, 54321)
                        .done(function (info) {
                            serverInfo2 = info;
                        });
                });

                waitsFor(function () { return serverInfo1 && serverInfo2; }, "waiting for static servers to start");

                runs(function () {
                    expect(serverInfo1.port).toBe(54321);
                    expect(serverInfo2.port).not.toBe(54321);
                    expect(serverInfo2.port).toBeGreaterThan(0);

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path1),
                                 "waiting for static server 1 to close");
                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path2),
                                 "waiting for static server 2 to close");
                });
            });

            it("should serve the text of a file in the given folder", function () {
                var serverInfo, text, path = testFolder + "/folder1";
                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path, 0)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });

                waitsFor(function () { return serverInfo; }, "waiting for static server to start");

                runs(function () {
                    getUrl(serverInfo, "/index.txt").done(function (data) {
                        text = data;
                    });
                });

                waitsFor(function () { return text; }, "waiting for text from server");

                runs(function () {
                    expect(text).toBe("This is a file in folder 1.");

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path),
                                 "waiting for static server to close");
                });
            });

            it("should create separate servers for different folders", function () {
                var serverInfo1, serverInfo2,
                    path1 = testFolder + "/folder1", path2 = testFolder + "/folder2";
                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path1, 0)
                        .done(function (info) {
                            serverInfo1 = info;
                        });
                    nodeConnection.domains.staticServer.getServer(path2, 0)
                        .done(function (info) {
                            serverInfo2 = info;
                        });
                });

                waitsFor(function () { return serverInfo1 && serverInfo2; }, "waiting for static servers to start");

                runs(function () {
                    expect(serverInfo1.port).not.toBe(serverInfo2.port);

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path1),
                                 "waiting for static server 1 to close");
                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path2),
                                 "waiting for static server 2 to close");
                });
            });

            it("should keep a previous server alive after creating a new server", function () {
                var serverInfo1, serverInfo2,
                    path1 = testFolder + "/folder1", path2 = testFolder + "/folder2",
                    text1, text2;
                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path1, 0)
                        .done(function (info) {
                            serverInfo1 = info;
                        });
                    nodeConnection.domains.staticServer.getServer(path2, 0)
                        .done(function (info) {
                            serverInfo2 = info;
                        });
                });

                waitsFor(function () { return serverInfo1 && serverInfo2; }, "waiting for static servers to start");

                runs(function () {
                    getUrl(serverInfo1, "/index.txt").done(function (data) {
                        text1 = data;
                    });
                    getUrl(serverInfo2, "/index.txt").done(function (data) {
                        text2 = data;
                    });
                });

                waitsFor(function () { return text1 && text2; }, "waiting for text from servers");

                runs(function () {
                    expect(text1).toBe("This is a file in folder 1.");
                    expect(text2).toBe("This is a file in folder 2.");

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path1),
                                 "waiting for static server 1 to close");
                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path2),
                                 "waiting for static server 2 to close");
                });
            });

            it("should trigger an event when a file path is requested", function () {
                var serverInfo,
                    path = testFolder + "/folder1",
                    text,
                    location,
                    elapsed,
                    requestId,
                    timeout = 500;

                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path, 0)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });

                waitsFor(function () { return serverInfo; }, "waiting for static server to start");

                runs(function () {
                    onRequestFilter(function (request) {
                        location = request.location;
                        requestId = request.id;
                        // Do not call writeFilteredResponse in order to hit timeout
                    });

                    // listen for /index.txt requests
                    waitsForDone(nodeConnection.domains.staticServer.setRequestFilterPaths(path, ["/index.txt"]));

                    // set a custom timeout
                    waitsForDone(nodeConnection.domains.staticServer._setRequestFilterTimeout(timeout));
                });

                runs(function () {
                    // it should take longer than the StaticServerDomain timeout to get a response
                    elapsed = new Date();

                    // request /index.txt
                    getUrl(serverInfo, "/index.txt").done(function (data) {
                        elapsed = new Date() - elapsed;
                        text = data;
                    });
                });

                waitsFor(function () { return location && text; }, "waiting for request event to fire");

                runs(function () {
                    expect(requestId).toBeGreaterThan(-1);
                    expect(location.pathname).toBe("/index.txt");
                    expect(text).toBe("This is a file in folder 1.");

                    // we should hit the timeout since we filtered this path and did not respond
                    expect(elapsed).toBeGreaterThan(timeout);

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path),
                                 "waiting for static server to close");
                });
            });

            it("should send static file contents after canceling a filter request", function () {
                var serverInfo,
                    path = testFolder + "/folder1",
                    text,
                    location,
                    requestId;

                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path, 0)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });

                waitsFor(function () { return serverInfo; }, "waiting for static server to start");

                runs(function () {
                    // listen for request event
                    onRequestFilter(function (request) {
                        location = request.location;
                        requestId = request.id;
                        nodeConnection.domains.staticServer.writeFilteredResponse(request.root, request.pathname, {id: requestId});

                        // a second call to send does nothing
                        nodeConnection.domains.staticServer.writeFilteredResponse(request.root, request.pathname, {id : requestId, body: "custom response"});
                    });

                    // listen for /index.txt requests
                    waitsForDone(nodeConnection.domains.staticServer.setRequestFilterPaths(path, ["/index.txt"]));
                });

                runs(function () {
                    // request /index.txt
                    getUrl(serverInfo, "/index.txt").done(function (data) {
                        text = data;
                    });
                });

                waitsFor(function () { return location && text; }, "waiting for request event to fire");

                runs(function () {
                    expect(requestId).toBeGreaterThan(-1);
                    expect(location.pathname).toBe("/index.txt");
                    expect(text).toBe("This is a file in folder 1.");

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path),
                                 "waiting for static server to close");
                });
            });

            it("should override the static file server response with a new response body", function () {
                var serverInfo,
                    path = testFolder + "/folder1",
                    text,
                    location,
                    requestId;

                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path, 0)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });

                waitsFor(function () { return serverInfo; }, "waiting for static server to start");

                runs(function () {
                    // listen for request event
                    onRequestFilter(function (request) {
                        location = request.location;
                        requestId = request.id;
                        nodeConnection.domains.staticServer.writeFilteredResponse(location.root, location.pathname, {id: requestId, body: "custom response"});
                    });

                    // listen for /index.txt requests
                    waitsForDone(nodeConnection.domains.staticServer.setRequestFilterPaths(path, ["/index.txt"]));
                });

                runs(function () {
                    // request /index.txt
                    getUrl(serverInfo, "/index.txt").done(function (data) {
                        text = data;
                    });
                });

                waitsFor(function () { return location && text; }, "waiting for text from server");

                runs(function () {
                    expect(requestId).toBeGreaterThan(-1);
                    expect(location.pathname).toBe("/index.txt");
                    expect(text).toBe("custom response");

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path),
                                 "waiting for static server to close");
                });
            });

            it("should ignore multiple responses for the same request", function () {
                var serverInfo,
                    path = testFolder + "/folder1",
                    text,
                    location,
                    requestId;

                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path, 0)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });

                waitsFor(function () { return serverInfo; }, "waiting for static server to start");

                runs(function () {
                    // listen for request event
                    onRequestFilter(function (request) {
                        location = request.location;
                        requestId = request.id;

                        nodeConnection.domains.staticServer.writeFilteredResponse(location.root, location.pathname, {id: requestId, body: "good response"});
                        nodeConnection.domains.staticServer.writeFilteredResponse(location.root, location.pathname, {id: requestId, body: "bad response"});
                    });

                    // listen for /index.txt requests
                    waitsForDone(nodeConnection.domains.staticServer.setRequestFilterPaths(path, ["/index.txt"]));
                });

                runs(function () {
                    // request /index.txt
                    getUrl(serverInfo, "/index.txt").done(function (data) {
                        text = data;
                    });
                });

                waitsFor(
                    function () { return location && text && (logs.length > 0); },
                    "waiting for text from server and warning in log"
                );

                runs(function () {
                    expect(logs.length).toBe(1);
                    expect(logs[0].level).toBe("warn");
                    expect(logs[0].message.indexOf("writeFilteredResponse")).toBe(0);

                    expect(requestId).toBeGreaterThan(-1);
                    expect(location.pathname).toBe("/index.txt");
                    expect(text).toBe("good response");

                    // cleanup
                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path),
                                 "waiting for static server to close");
                });
            });

            it("should log a warning when writing to a non-existant request", function () {
                var serverInfo,
                    path = testFolder + "/folder1",
                    text,
                    requestId = -1;

                spyOn(console, "warn").andCallThrough();

                onRequestFilter(function (request) {
                    requestId = request.id;
                });

                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path, 0)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });

                waitsFor(function () { return serverInfo; }, "waiting for static server to start");

                runs(function () {
                    // write response before the request
                    waitsForDone(nodeConnection.domains.staticServer.writeFilteredResponse(path, "/index.txt", {id: requestId, body: "custom response"}));
                });

                runs(function () {
                    // request /index.txt
                    getUrl(serverInfo, "/index.txt").done(function (data) {
                        text = data;
                    });
                });

                runs(function () {
                    // write response after the request
                    waitsForDone(nodeConnection.domains.staticServer.writeFilteredResponse(path, "/index.txt", {id: requestId, body: "custom response"}));
                });

                waitsFor(function () { return text; }, "waiting for text from server");

                runs(function () {
                    // verify console warning
                    expect(logs.length).toBe(2);

                    logs.forEach(function (log) {
                        expect(log.level).toBe("warn");
                        expect(log.message.indexOf("writeFilteredResponse")).toBe(0);
                    });

                    // verify original file content
                    expect(text).toBe("This is a file in folder 1.");
                    expect(requestId).toBe(-1);

                    // cleanup
                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path),
                                 "waiting for static server to close");
                });
            });

            it("should should require paths to be filtered for events to fire", function () {
                var serverInfo,
                    path = testFolder + "/folder1",
                    text = null,
                    location = null,
                    requestId = -1,
                    elapsed,
                    timeout = 500;

                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path, 0)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });

                waitsFor(function () { return serverInfo; }, "waiting for static server to start");

                runs(function () {
                    onRequestFilter(function (request) {
                        location = request.location;
                        requestId = request.id;
                    });

                    // set a custom timeout
                    waitsForDone(nodeConnection.domains.staticServer._setRequestFilterTimeout(timeout));
                });

                runs(function () {
                    // it should take less than the 500ms timeout to get a response
                    elapsed = new Date();

                    // request /index.txt
                    getUrl(serverInfo, "/index.txt").done(function (data) {
                        elapsed = new Date() - elapsed;
                        text = data;
                    });
                });

                waits(timeout);

                runs(function () {
                    // requestFilter should never fire, location is never returned
                    expect(location).toBeNull();

                    // original content
                    expect(text).toBe("This is a file in folder 1.");

                    // server should respond with original content before the timeout lapses
                    expect(elapsed).toBeLessThan(timeout);
                    expect(requestId).toBe(-1);

                    waitsForDone(nodeConnection.domains.staticServer.closeServer(path),
                                 "waiting for static server to close");
                });
            });
        });

        // Unit tests for the StaticServerProvider that wraps the underlying node server.
        describe("StaticServer", function () {
            var projectPath         = testFolder + "/",
                mockNodeDomain      = { ready: function () { return true; } },
                pathResolver        = function (path) {
                    if (path.indexOf(projectPath) === 0) {
                        return path.slice(projectPath.length);
                    }

                    return path;
                },
                config              = {
                    baseUrl: "http://localhost/",
                    nodeDomain: mockNodeDomain,
                    pathResolver: pathResolver,
                    root: projectPath,
                    port: 0
                };

            it("should translate local paths to server paths", function () {
                var outsidePath     = testFolder.substr(0, testFolder.lastIndexOf("/") + 1),
                    fileProtocol    = (brackets.platform === "win") ? "file:///" : "file://",
                    fileRelPath     = "subdir/index.html",
                    file1Path       = projectPath + fileRelPath,
                    file2Path       = outsidePath + fileRelPath,
                    file2FileUrl    = encodeURI(fileProtocol + outsidePath + fileRelPath),
                    file1ServerUrl  = config.baseUrl + encodeURI(fileRelPath),
                    server          = new StaticServer(config);

                // Should use server url with base url
                expect(server.pathToUrl(file1Path)).toBe(file1ServerUrl);
                expect(server.urlToPath(file1ServerUrl)).toBe(file1Path);

                // File outside project should still use file url
                expect(server.pathToUrl(file2Path)).toBe(null);
                expect(server.urlToPath(file2FileUrl)).toBe(null);
            });

            it("should only serve html files that are in the project file hierarchy", function () {
                var server = new StaticServer(config);

                // should not serve files outside project hierarchy
                expect(server.canServe("/foo.html")).toBe(false);

                // should not serve non-HTML files inside hierarchy
                expect(server.canServe(testFolder + "/foo.jpg")).toBe(false);

                // should serve .htm files inside hierarchy
                expect(server.canServe(testFolder + "/foo.htm")).toBe(true);

                // should serve .html files inside hierarchy
                expect(server.canServe(testFolder + "/foo.html")).toBe(true);

                // should serve .HTML files inside hierarchy
                expect(server.canServe(testFolder + "/foo.HTML")).toBe(true);

                // should serve root of hierarchy
                expect(server.canServe(testFolder + "/")).toBe(true);
            });

            it("should decline serving if not connected to node", function () {
                // mock NodeDomain state to be disconnected
                config.nodeDomain = { ready: function () { return false; } };

                var server = new StaticServer(config);

                expect(server.canServe(testFolder + "foo.html")).toBe(false);
            });

        });
    });
});
