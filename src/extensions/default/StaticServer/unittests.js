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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, waitsForDone, runs, $, brackets, waitsForDone, spyOn, tinycolor, KeyEvent */

define(function (require, exports, module) {
    "use strict";
    
    var StaticServer   = require("main"),
        NodeConnection = brackets.getModule("utils/NodeConnection"),
        FileUtils      = brackets.getModule("file/FileUtils");
    
    var testFolder     = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files/";
        
    describe("StaticServer", function () {
        
        // Unit tests for the underlying node server.
        describe("StaticServerDomain", function () {
            var nodeConnection;
            
            beforeEach(function () {
                runs(function () {
                    nodeConnection = new NodeConnection();
                    waitsForDone(nodeConnection.connect(false), "connecting to node server");
                });
                
                runs(function () {
                    var domainPromise = new $.Deferred(),
                        retries = 0;

                    function waitForDomain() {
                        if (nodeConnection.domains.staticServer) {
                            domainPromise.resolve();
                        } else {
                            retries++;
                            if (retries >= 5) {
                                domainPromise.reject();
                            } else {
                                setTimeout(waitForDomain, 100);
                            }
                        }
                    }
                    
                    waitForDomain();
                    waitsForDone(domainPromise, "waiting for StaticServer domain to load");
                });
            });
            
            afterEach(function () {
                nodeConnection.disconnect();
                nodeConnection = null;
            });
            
            function makeBaseUrl(serverInfo) {
                return "http://" + serverInfo.address + ":" + serverInfo.port;
            }
            
            it("should start a static server on the given folder", function () {
                var serverInfo, path = testFolder + "folder1";
                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path)
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
            
            it("should serve the text of a file in the given folder", function () {
                var serverInfo, text, path = testFolder + "folder1";
                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path)
                        .done(function (info) {
                            serverInfo = info;
                        });
                });
                
                waitsFor(function () { return serverInfo; }, "waiting for static server to start");
                
                runs(function () {
                    $.get(makeBaseUrl(serverInfo) + "/index.txt")
                        .done(function (data) {
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
                    path1 = testFolder + "folder1", path2 = testFolder + "folder2";
                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path1)
                        .done(function (info) {
                            serverInfo1 = info;
                        });
                    nodeConnection.domains.staticServer.getServer(path2)
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
                    path1 = testFolder + "folder1", path2 = testFolder + "folder2",
                    text1, text2;
                runs(function () {
                    nodeConnection.domains.staticServer.getServer(path1)
                        .done(function (info) {
                            serverInfo1 = info;
                        });
                    nodeConnection.domains.staticServer.getServer(path2)
                        .done(function (info) {
                            serverInfo2 = info;
                        });
                });
                
                waitsFor(function () { return serverInfo1 && serverInfo2; }, "waiting for static servers to start");
                
                runs(function () {
                    $.get(makeBaseUrl(serverInfo1) + "/index.txt")
                        .done(function (data) {
                            text1 = data;
                        });
                    $.get(makeBaseUrl(serverInfo2) + "/index.txt")
                        .done(function (data) {
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
        });
        
        // Unit tests for the StaticServerProvider that wraps the underlying node server.
        describe("StaticServerProvider", function () {
            
            it("should have initialized the static server provider by app ready time", function () {
                expect(StaticServer._getStaticServerProvider()).toBeTruthy();
            });
        });
    });
});
