/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
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

/*jslint regexp: true */
/*global describe, it, expect, spyOn, runs, waitsForDone, waitsForFail, afterEach */
/*eslint indent: 0*/
/*eslint max-len: ["error", { "code": 200 }]*/
define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var ExtensionLoader = require("utils/ExtensionLoader"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        LanguageClientWrapper = require("languageTools/LanguageClientWrapper"),
        LanguageTools = require("languageTools/LanguageTools"),
        EventDispatcher = require("utils/EventDispatcher"),
        ToolingInfo = JSON.parse(brackets.getModule("text!languageTools/ToolingInfo.json"));

    var testPath = SpecRunnerUtils.getTestPath("/spec/LanguageTools-test-files"),
        serverResponse = {
            capabilities: {
                textDocumentSync: 1,
                completionProvider: {
                    resolveProvider: true,
                    triggerCharacters: [
					'=',
					' ',
					'$',
					'-',
                    '&'
				]
                },
                definitionProvider: true,
                signatureHelpProvider: {
                    triggerCharacters: [
					'-',
					'[',
					',',
					' ',
					'='
				]
                },
                "workspaceSymbolProvider": "true",
                "documentSymbolProvider": "true",
                "referencesProvider": "true"
            }
        };

    describe("LanguageTools", function () {
        function loadClient(name) {
            var config = {
                baseUrl: testPath + "/clients/" + name
            };

            return ExtensionLoader.loadExtension(name, config, "main");
        }

        function getExtensionFromContext(name) {
            var extensionContext = brackets.libRequire.s.contexts[name];

            return extensionContext && extensionContext.defined && extensionContext.defined.main;
        }

        it("should load a simple test client extension", function () {
            var promise,
                consoleErrors = [];

            runs(function () {
                var originalConsoleErrorFn = console.error;
                spyOn(console, "error").andCallFake(function () {
                    originalConsoleErrorFn.apply(console, arguments);

                    if (typeof arguments[0] === "string" &&
                        arguments[0].includes("Error loading domain \"LoadSimpleClient\"")) {
                        consoleErrors.push(Array.prototype.join.call(arguments));
                    }
                });

                promise = loadClient("LoadSimpleClient");

                waitsForDone(promise, "loadClient");
            });

            runs(function () {
                expect(consoleErrors).toEqual([]);
                expect(promise.state()).toBe("resolved");
            });
        });

        describe("Brackets & Node Communication", function () {
            var intefacePromise,
                extension,
                client;

            it("should load the interface client extension", function () {
                runs(function () {
                    intefacePromise = loadClient("InterfaceTestClient");
                    intefacePromise.done(function () {
                        extension = getExtensionFromContext("InterfaceTestClient");
                        client = extension.getClient();
                    });

                    waitsForDone(intefacePromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("InterfaceTestClient");
                });
            });

            it("should receive acknowledgement notification after sending notification to node", function () {
                var notificationStatus = false;

                function notifyWithPromise() {
                    var retval = $.Deferred();

                    client._addOnNotificationHandler("acknowledge", function (params) {
                        if (params.clientName === "InterfaceTestClient" && params.acknowledgement) {
                            notificationStatus = true;
                            retval.resolve();
                        }
                    });

                    client.sendCustomNotification({
                        messageType: "brackets",
                        type: "notificationMethod",
                        params: {
                            action: "acknowledgement"
                        }
                    });

                    return retval;
                }

                runs(function () {
                    var notificationPromise = notifyWithPromise();

                    waitsForDone(notificationPromise, "NotificationInterface");
                });

                runs(function () {
                    expect(notificationStatus).toBe(true);
                });
            });

            it("should send request to node which should resolve", function () {
                var result = null;

                function requestWithPromise() {
                    return client.sendCustomRequest({
                        messageType: "brackets",
                        type: "requestMethod",
                        params: {
                            action: "resolve"
                        }
                    });
                }

                runs(function () {
                    var requestPromise = requestWithPromise();
                    requestPromise.done(function (returnVal) {
                        result = returnVal;
                    });

                    waitsForDone(requestPromise, "RequestInterface");
                });

                runs(function () {
                    expect(result).toBe("resolved");
                });
            });

            it("should send request to node which should reject", function () {
                var result = null;

                function requestWithPromise() {
                    return client.sendCustomRequest({
                        messageType: "brackets",
                        type: "requestMethod",
                        params: {
                            action: "reject"
                        }
                    });
                }

                runs(function () {
                    var requestPromise = requestWithPromise();
                    requestPromise.fail(function (returnVal) {
                        result = returnVal;
                    });

                    waitsForFail(requestPromise, "RequestInterface");
                });

                runs(function () {
                    expect(result).toBe("rejected");
                });
            });

            it("should handle sync request from node side", function () {
                var requestResult = null;

                function nodeRequestWithPromise() {
                    var retval = $.Deferred();

                    client._addOnRequestHandler("nodeSyncRequest", function (params) {
                        if (params.clientName === "InterfaceTestClient" && params.syncRequest) {
                            //We return value directly since it is a sync request
                            return "success";
                        }
                    });

                    //trigger request from node side
                    client._addOnNotificationHandler("validateSyncRequest", function (params) {
                        if (params.clientName === "InterfaceTestClient" && params.syncRequestResult) {
                            requestResult = params.syncRequestResult;
                            retval.resolve();
                        }
                    });

                    client.sendCustomNotification({
                        messageType: "brackets",
                        type: "notificationMethod",
                        params: {
                            action: "nodeSyncRequest"
                        }
                    });

                    return retval;
                }

                runs(function () {
                    var nodeRequestPromise = nodeRequestWithPromise();

                    waitsForDone(nodeRequestPromise, "NodeRequestInterface");
                });

                runs(function () {
                    expect(requestResult).toEqual("success");
                });
            });

            it("should handle async request from node side which is resolved", function () {
                var requestResult = null;

                function nodeRequestWithPromise() {
                    var retval = $.Deferred();

                    client._addOnRequestHandler("nodeAsyncRequestWhichResolves", function (params) {
                        if (params.clientName === "InterfaceTestClient" && params.asyncRequest) {
                            //We return promise which can be resolved in async
                            return $.Deferred().resolve("success");
                        }
                    });

                    //trigger request from node side
                    client._addOnNotificationHandler("validateAsyncSuccess", function (params) {
                        if (params.clientName === "InterfaceTestClient" && params.asyncRequestResult) {
                            requestResult = params.asyncRequestResult;
                            retval.resolve();
                        }
                    });

                    client.sendCustomNotification({
                        messageType: "brackets",
                        type: "notificationMethod",
                        params: {
                            action: "nodeAsyncRequestWhichResolves"
                        }
                    });

                    return retval;
                }

                runs(function () {
                    var nodeRequestPromise = nodeRequestWithPromise();

                    waitsForDone(nodeRequestPromise, "NodeRequestInterface");
                });

                runs(function () {
                    expect(requestResult).toEqual("success");
                });
            });

            it("should handle async request from node side which fails", function () {
                var requestResult = null;

                function nodeRequestWithPromise() {
                    var retval = $.Deferred();

                    client._addOnRequestHandler("nodeAsyncRequestWhichFails", function (params) {
                        if (params.clientName === "InterfaceTestClient" && params.asyncRequest) {
                            //We return promise which can be resolved in async
                            return $.Deferred().reject("error");
                        }
                    });

                    //trigger request from node side
                    client._addOnNotificationHandler("validateAsyncFail", function (params) {
                        if (params.clientName === "InterfaceTestClient" && params.asyncRequestError) {
                            requestResult = params.asyncRequestError;
                            retval.resolve();
                        }
                    });

                    client.sendCustomNotification({
                        messageType: "brackets",
                        type: "notificationMethod",
                        params: {
                            action: "nodeAsyncRequestWhichFails"
                        }
                    });

                    return retval;
                }

                runs(function () {
                    var nodeRequestPromise = nodeRequestWithPromise();

                    waitsForDone(nodeRequestPromise, "NodeRequestInterface");
                });

                runs(function () {
                    expect(requestResult).toEqual("error");
                });
            });
        });

        describe("Client Start and Stop Tests", function () {
            var projectPath = testPath + "/project",
                optionsPromise,
                extension,
                client = null;

            it("should start a simple module based client", function () {
                var startResult = false,
                    startPromise;

                runs(function () {
                    optionsPromise = loadClient("ModuleTestClient");
                    optionsPromise.done(function () {
                        extension = getExtensionFromContext("ModuleTestClient");
                        client = extension.getClient();
                    });

                    waitsForDone(optionsPromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("ModuleTestClient");

                    startPromise = client.start({
                        rootPath: projectPath
                    });

                    startPromise.done(function (capabilities) {
                        startResult = capabilities;
                    });

                    waitsForDone(startPromise, "StartClient");
                });

                runs(function () {
                    expect(startResult).toBeTruthy();
                    expect(startResult).toEqual(serverResponse);
                });
            });

            it("should stop a simple module based client", function () {
                var restartPromise,
                    restartStatus = false;

                runs(function () {
                    if (client) {
                        restartPromise = client.stop().done(function () {
                            return client.start({
                                rootPath: projectPath
                            });
                        });
                        restartPromise.done(function () {
                            restartStatus = true;
                        });
                    }

                    waitsForDone(restartPromise, "RestartClient");
                });

                runs(function () {
                    expect(restartStatus).toBe(true);
                });
            });


            it("should stop a simple module based client", function () {
                var stopPromise,
                    stopStatus = false;

                runs(function () {
                    if (client) {
                        stopPromise = client.stop();
                        stopPromise.done(function () {
                            stopStatus = true;
                            client = null;
                        });
                    }

                    waitsForDone(stopPromise, "StopClient");
                });

                runs(function () {
                    expect(stopStatus).toBe(true);
                });
            });
        });

        describe("Language Server Spawn Schemes", function () {
            var projectPath = testPath + "/project",
                optionsPromise,
                extension,
                client = null;

            afterEach(function () {
                var stopPromise,
                    stopStatus = false;

                runs(function () {
                    if (client) {
                        stopPromise = client.stop();
                        stopPromise.done(function () {
                            stopStatus = true;
                            client = null;
                        });
                    } else {
                        stopStatus = true;
                    }

                    waitsForDone(stopPromise, "StopClient");
                });

                runs(function () {
                    expect(stopStatus).toBe(true);
                });
            });

            it("should start a simple module based client with node-ipc", function () {
                var startResult = false,
                    startPromise;

                runs(function () {
                    optionsPromise = loadClient("CommunicationTestClient");
                    optionsPromise.done(function () {
                        extension = getExtensionFromContext("CommunicationTestClient");
                        client = extension.getClient();
                    });

                    waitsForDone(optionsPromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("CommunicationTestClient");

                    startPromise = client.sendCustomRequest({
                        messageType: "brackets",
                        type: "setOptions",
                        params: {
                            communicationType: "ipc"
                        }
                    }).then(function () {
                        return client.start({
                            rootPath: projectPath
                        });
                    });

                    startPromise.done(function (capabilities) {
                        startResult = capabilities;
                    });

                    waitsForDone(startPromise, "StartClient");
                });

                runs(function () {
                    expect(startResult).toBeTruthy();
                    expect(startResult).toEqual(serverResponse);
                });
            });

            it("should start a simple module based client with stdio", function () {
                var startResult = false,
                    startPromise;

                runs(function () {
                    optionsPromise = loadClient("CommunicationTestClient");
                    optionsPromise.done(function () {
                        extension = getExtensionFromContext("CommunicationTestClient");
                        client = extension.getClient();
                    });

                    waitsForDone(optionsPromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("CommunicationTestClient");

                    startPromise = client.sendCustomRequest({
                        messageType: "brackets",
                        type: "setOptions",
                        params: {
                            communicationType: "stdio"
                        }
                    }).then(function () {
                        return client.start({
                            rootPath: projectPath
                        });
                    });

                    startPromise.done(function (capabilities) {
                        startResult = capabilities;
                    });

                    waitsForDone(startPromise, "StartClient");
                });

                runs(function () {
                    expect(startResult).toBeTruthy();
                    expect(startResult).toEqual(serverResponse);
                });
            });

            it("should start a simple module based client with pipe", function () {
                var startResult = false,
                    startPromise;

                runs(function () {
                    optionsPromise = loadClient("CommunicationTestClient");
                    optionsPromise.done(function () {
                        extension = getExtensionFromContext("CommunicationTestClient");
                        client = extension.getClient();
                    });

                    waitsForDone(optionsPromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("CommunicationTestClient");

                    startPromise = client.sendCustomRequest({
                        messageType: "brackets",
                        type: "setOptions",
                        params: {
                            communicationType: "pipe"
                        }
                    }).then(function () {
                        return client.start({
                            rootPath: projectPath
                        });
                    });

                    startPromise.done(function (capabilities) {
                        startResult = capabilities;
                    });

                    waitsForDone(startPromise, "StartClient");
                });

                runs(function () {
                    expect(startResult).toBeTruthy();
                    expect(startResult).toEqual(serverResponse);
                });
            });

            it("should start a simple module based client with socket", function () {
                var startResult = false,
                    startPromise;

                runs(function () {
                    optionsPromise = loadClient("CommunicationTestClient");
                    optionsPromise.done(function () {
                        extension = getExtensionFromContext("CommunicationTestClient");
                        client = extension.getClient();
                    });

                    waitsForDone(optionsPromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("CommunicationTestClient");

                    startPromise = client.sendCustomRequest({
                        messageType: "brackets",
                        type: "setOptionsForSocket"
                    }).then(function () {
                        return client.start({
                            rootPath: projectPath
                        });
                    });

                    startPromise.done(function (capabilities) {
                        startResult = capabilities;
                    });

                    waitsForDone(startPromise, "StartClient");
                });

                runs(function () {
                    expect(startResult).toBeTruthy();
                    expect(startResult).toEqual(serverResponse);
                });
            });

            it("should start a simple runtime based client", function () {
                var startResult = false,
                    startPromise;

                runs(function () {
                    optionsPromise = loadClient("OptionsTestClient");
                    optionsPromise.done(function () {
                        extension = getExtensionFromContext("OptionsTestClient");
                        client = extension.getClient();
                    });

                    waitsForDone(optionsPromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("OptionsTestClient");

                    startPromise = client.sendCustomRequest({
                        messageType: "brackets",
                        type: "setOptions",
                        params: {
                            optionsType: "runtime"
                        }
                    }).then(function () {
                        return client.start({
                            rootPath: projectPath
                        });
                    });

                    startPromise.done(function (capabilities) {
                        startResult = capabilities;
                    });

                    waitsForDone(startPromise, "StartClient");
                });

                runs(function () {
                    expect(startResult).toBeTruthy();
                    expect(startResult).toEqual(serverResponse);
                });
            });

            it("should start a simple function based client", function () {
                var startResult = false,
                    startPromise;

                runs(function () {
                    optionsPromise = loadClient("OptionsTestClient");
                    optionsPromise.done(function () {
                        extension = getExtensionFromContext("OptionsTestClient");
                        client = extension.getClient();
                    });

                    waitsForDone(optionsPromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("OptionsTestClient");

                    startPromise = client.sendCustomRequest({
                        messageType: "brackets",
                        type: "setOptions",
                        params: {
                            optionsType: "function"
                        }
                    }).then(function () {
                        return client.start({
                            rootPath: projectPath
                        });
                    });

                    startPromise.done(function (capabilities) {
                        startResult = capabilities;
                    });

                    waitsForDone(startPromise, "StartClient");
                });

                runs(function () {
                    expect(startResult).toBeTruthy();
                    expect(startResult).toEqual(serverResponse);
                });
            });

            it("should start a simple command based client", function () {
                var startResult = false,
                    startPromise;

                runs(function () {
                    optionsPromise = loadClient("OptionsTestClient");
                    optionsPromise.done(function () {
                        extension = getExtensionFromContext("OptionsTestClient");
                        client = extension.getClient();
                    });

                    waitsForDone(optionsPromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("OptionsTestClient");

                    startPromise = client.sendCustomRequest({
                        messageType: "brackets",
                        type: "setOptions",
                        params: {
                            optionsType: "command"
                        }
                    }).then(function () {
                        return client.start({
                            rootPath: projectPath
                        });
                    });

                    startPromise.done(function (capabilities) {
                        startResult = capabilities;
                    });

                    waitsForDone(startPromise, "StartClient");
                });

                runs(function () {
                    expect(startResult).toBeTruthy();
                    expect(startResult).toEqual(serverResponse);
                });
            });
        });

        describe("Parameter validation for client based communication", function () {
            var requestValidator = LanguageClientWrapper.validateRequestParams,
                notificationValidator = LanguageClientWrapper.validateNotificationParams;

            var paramTemplateA = {
                rootPath: "somePath"
            };

            var paramTemplateB = {
                filePath: "somePath",
                cursorPos: {
                    line: 1,
                    ch: 1
                }
            };

            var paramTemplateC = {
                filePath: "somePath"
            };

            var paramTemplateD = {
                filePath: "something",
                fileContent: "something",
                languageId: "something"
            };

            var paramTemplateE = {
                filePath: "something",
                fileContent: "something"
            };

            var paramTemplateF = {
                foldersAdded: ["added"],
                foldersRemoved: ["removed"]
            };

            it("should validate the params for request: client.start", function () {
                var params = Object.assign({}, paramTemplateA),
                    retval = requestValidator(ToolingInfo.LANGUAGE_SERVICE.START, params);

                var params2 = Object.assign({}, paramTemplateA);
                params2["capabilities"] = {
                    feature: true
                };
                var retval2 = requestValidator(ToolingInfo.LANGUAGE_SERVICE.START, params2);

                expect(retval).toEqual({
                    rootPath: "somePath",
                    capabilities: false
                });

                expect(retval2).toEqual({
                    rootPath: "somePath",
                    capabilities: {
                        feature: true
                    }
                });
            });

            it("should invalidate the params for request: client.start", function () {
                var retval = requestValidator(ToolingInfo.LANGUAGE_SERVICE.START, {});

                expect(retval).toBeNull();
            });

            it("should validate the params for request: client.{requestHints, requestParameterHints, gotoDefinition}", function () {
                var params = Object.assign({}, paramTemplateB),
                    retval = requestValidator(ToolingInfo.FEATURES.CODE_HINTS, params);

                expect(retval).toEqual(paramTemplateB);
            });

            it("should invalidate the params for request: client.{requestHints, requestParameterHints, gotoDefinition}", function () {
                var retval = requestValidator(ToolingInfo.FEATURES.CODE_HINTS, {});

                expect(retval).toBeNull();
            });

            it("should validate the params for request: client.findReferences", function () {
                var params = Object.assign({}, paramTemplateB),
                    retval = requestValidator(ToolingInfo.FEATURES.FIND_REFERENCES, params);

                var result = Object.assign({}, paramTemplateB);
                result["includeDeclaration"] = false;

                expect(retval).toEqual(result);
            });

            it("should invalidate the params for request: client.findReferences", function () {
                var retval = requestValidator(ToolingInfo.FEATURES.FIND_REFERENCES, {});

                expect(retval).toBeNull();
            });

            it("should validate the params for request: client.requestSymbolsForDocument", function () {
                var params = Object.assign({}, paramTemplateC),
                    retval = requestValidator(ToolingInfo.FEATURES.DOCUMENT_SYMBOLS, params);

                expect(retval).toEqual(paramTemplateC);
            });

            it("should invalidate the params for request: client.requestSymbolsForDocument", function () {
                var retval = requestValidator(ToolingInfo.FEATURES.DOCUMENT_SYMBOLS, {});

                expect(retval).toBeNull();
            });

            it("should validate the params for request: client.requestSymbolsForWorkspace", function () {
                var params = Object.assign({}, {
                        query: 'a'
                    }),
                    retval = requestValidator(ToolingInfo.FEATURES.PROJECT_SYMBOLS, params);

                expect(retval).toEqual({
                    query: 'a'
                });
            });

            it("should invalidate the params for request: client.requestSymbolsForWorkspace", function () {
                var retval = requestValidator(ToolingInfo.FEATURES.PROJECT_SYMBOLS, {});

                expect(retval).toBeNull();
            });

            it("should validate the params for notification: client.notifyTextDocumentOpened", function () {
                var params = Object.assign({}, paramTemplateD),
                    retval = notificationValidator(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_OPENED, params);

                expect(retval).toEqual(paramTemplateD);
            });

            it("should invalidate the params for notification: client.notifyTextDocumentOpened", function () {
                var retval = notificationValidator(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_OPENED, {});

                expect(retval).toBeNull();
            });

            it("should validate the params for notification: client.notifyTextDocumentChanged", function () {
                var params = Object.assign({}, paramTemplateE),
                    retval = notificationValidator(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CHANGED, params);

                expect(retval).toEqual(paramTemplateE);
            });

            it("should invalidate the params for notification: client.notifyTextDocumentChanged", function () {
                var retval = notificationValidator(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CHANGED, {});

                expect(retval).toBeNull();
            });

            it("should validate the params for notification: client.{notifyTextDocumentClosed, notifyTextDocumentSave}", function () {
                var params = Object.assign({}, paramTemplateC),
                    retval = notificationValidator(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_SAVED, params);

                expect(retval).toEqual(paramTemplateC);
            });

            it("should invalidate the params for notification: client.{notifyTextDocumentClosed, notifyTextDocumentSave}", function () {
                var retval = notificationValidator(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_SAVED, {});

                expect(retval).toBeNull();
            });

            it("should validate the params for notification: client.notifyProjectRootsChanged", function () {
                var params = Object.assign({}, paramTemplateF),
                    retval = notificationValidator(ToolingInfo.SYNCHRONIZE_EVENTS.PROJECT_FOLDERS_CHANGED, params);

                expect(retval).toEqual(paramTemplateF);
            });

            it("should invalidate the params for notification: client.notifyProjectRootsChanged", function () {
                var retval = notificationValidator(ToolingInfo.SYNCHRONIZE_EVENTS.PROJECT_FOLDERS_CHANGED, {});

                expect(retval).toBeNull();
            });

            it("should passthrough the params for request: client.sendCustomRequest", function () {
                var params = Object.assign({}, {
                        a: 1,
                        b: 2
                    }),
                    retval = requestValidator(ToolingInfo.LANGUAGE_SERVICE.CUSTOM_REQUEST, params);

                expect(retval).toEqual({
                    a: 1,
                    b: 2
                });
            });

            it("should passthrough the params for notification: client.sendCustomNotification", function () {
                var params = Object.assign({}, {
                        a: 1,
                        b: 2
                    }),
                    retval = notificationValidator(ToolingInfo.LANGUAGE_SERVICE.CUSTOM_NOTIFICATION, params);

                expect(retval).toEqual({
                    a: 1,
                    b: 2
                });
            });

            it("should passthrough the params for any request if format is 'lsp'", function () {
                var params = Object.assign({}, {
                        format: 'lsp',
                        a: 1,
                        b: 2
                    }),
                    retval = requestValidator("AnyType", params);

                expect(retval).toEqual({
                    format: 'lsp',
                    a: 1,
                    b: 2
                });
            });

            it("should passthrough the params for any notification if format is 'lsp'", function () {
                var params = Object.assign({}, {
                        format: 'lsp',
                        a: 1,
                        b: 2
                    }),
                    retval = notificationValidator("AnyType", params);

                expect(retval).toEqual({
                    format: 'lsp',
                    a: 1,
                    b: 2
                });
            });
        });

        describe("Test LSP Request and Notifications", function () {
            var projectPath = testPath + "/project",
                featurePromise,
                extension,
                client = null,
                docPath1 = projectPath + "/sample1.txt",
                docPath2 = projectPath + "/sample2.txt",
                pos = {
                    line: 1,
                    ch: 2
                },
                fileContent = "some content",
                languageId = "unknown";

            function createPromiseForNotification(type) {
                var promise = $.Deferred();

                if (type !== "textDocument/publishDiagnostics") {
                    client.addOnLogMessage(function (params) {
                        if (params.received && params.received.type &&
                            params.received.type === type) {
                            promise.resolve(params);
                        }
                    });
                } else {
                    client.addOnDiagnostics(function (params) {
                        promise.resolve(params);
                    });
                }

                return promise;
            }

            it("should successfully start client", function () {
                var startResult = false,
                    startPromise;

                runs(function () {
                    featurePromise = loadClient("FeatureClient");
                    featurePromise.done(function () {
                        extension = getExtensionFromContext("FeatureClient");
                        client = extension.getClient();
                    });

                    waitsForDone(featurePromise);
                });

                runs(function () {
                    expect(client).toBeTruthy();
                    expect(client._name).toEqual("FeatureClient");

                    startPromise = client.start({
                        rootPath: projectPath
                    });

                    startPromise.done(function (capabilities) {
                        startResult = capabilities;
                    });

                    waitsForDone(startPromise, "StartClient");
                });

                runs(function () {
                    expect(startResult).toBeTruthy();
                    expect(startResult).toEqual(serverResponse);
                });
            });

            it("should successfully requestHints with brackets format", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.requestHints({
                        filePath: docPath1,
                        cursorPos: pos
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully passthrough params with lsp format", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.requestHints({
                        format: 'lsp',
                        textDocument: {
                            uri: 'file:///somepath/project/sample1.txt'
                        },
                        position: {
                            line: 1,
                            character: 2
                        }
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse).toEqual({
                        received: {
                            type: 'textDocument/completion',
                            params: {
                                textDocument: {
                                    uri: 'file:///somepath/project/sample1.txt'
                                },
                                position: {
                                    line: 1,
                                    character: 2
                                }
                            }
                        }
                    });
                });
            });

            it("should successfully getAdditionalInfoForHint", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.getAdditionalInfoForHint({
                        hintItem: true
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse).toEqual({
                        received: {
                            type: 'completionItem/resolve',
                            params: {
                                hintItem: true
                            }
                        }
                    });
                });
            });

            it("should successfully requestParameterHints with brackets format", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.requestParameterHints({
                        filePath: docPath2,
                        cursorPos: pos
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully gotoDefinition with brackets format", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.gotoDefinition({
                        filePath: docPath2,
                        cursorPos: pos
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully gotoImplementation with brackets format", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.gotoImplementation({
                        filePath: docPath2,
                        cursorPos: pos
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully gotoDeclaration with brackets format", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.gotoDeclaration({
                        filePath: docPath2,
                        cursorPos: pos
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully findReferences with brackets format", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.findReferences({
                        filePath: docPath2,
                        cursorPos: pos
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully requestSymbolsForDocument with brackets format", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.requestSymbolsForDocument({
                        filePath: docPath2
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully requestSymbolsForWorkspace", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.requestSymbolsForWorkspace({
                        query: "s"
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully sendCustomRequest to server", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = client.sendCustomRequest({
                        type: "custom/serverRequest",
                        params: {
                            anyParam: true
                        }
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerRequest");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully notifyTextDocumentOpened to server", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = createPromiseForNotification("textDocument/didOpen");
                    client.notifyTextDocumentOpened({
                        languageId: languageId,
                        filePath: docPath1,
                        fileContent: fileContent
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerNotification");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully notifyTextDocumentClosed to server", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = createPromiseForNotification("textDocument/didClose");
                    client.notifyTextDocumentClosed({
                        filePath: docPath1
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerNotification");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully notifyTextDocumentSave to server", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = createPromiseForNotification("textDocument/didSave");
                    client.notifyTextDocumentSave({
                        filePath: docPath2
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerNotification");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully notifyTextDocumentChanged to server", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = createPromiseForNotification("textDocument/didChange");
                    client.notifyTextDocumentChanged({
                        filePath: docPath2,
                        fileContent: fileContent
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerNotification");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully notifyProjectRootsChanged to server", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = createPromiseForNotification("workspace/didChangeWorkspaceFolders");
                    client.notifyProjectRootsChanged({
                        foldersAdded: ["path1", "path2"],
                        foldersRemoved: ["path3"]
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerNotification");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully get send custom notification to trigger diagnostics from server", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    requestPromise = createPromiseForNotification("textDocument/publishDiagnostics");
                    client.sendCustomNotification({
                        type: "custom/triggerDiagnostics"
                    });
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerNotification");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully create a custom event trigger for server notification", function () {
                var requestPromise,
                    requestResponse = null;

                runs(function () {
                    EventDispatcher.makeEventDispatcher(exports);
                    LanguageTools.listenToCustomEvent(exports, "triggerDiagnostics");
                    client.addOnCustomEventHandler("triggerDiagnostics", function () {
                        client.sendCustomNotification({
                            type: "custom/triggerDiagnostics"
                        });
                    });
                    requestPromise = createPromiseForNotification("textDocument/publishDiagnostics");
                    exports.trigger("triggerDiagnostics");
                    requestPromise.done(function (response) {
                        requestResponse = response;
                    });

                    waitsForDone(requestPromise, "ServerNotification");
                });

                runs(function () {
                    expect(requestResponse.received).toBeTruthy();
                });
            });

            it("should successfully stop client", function () {
                var stopPromise,
                    stopStatus = false;

                runs(function () {
                    if (client) {
                        stopPromise = client.stop();
                        stopPromise.done(function () {
                            stopStatus = true;
                            client = null;
                        });
                    }

                    waitsForDone(stopPromise, "StopClient");
                });

                runs(function () {
                    expect(stopStatus).toBe(true);
                });
            });
        });
    });
});
