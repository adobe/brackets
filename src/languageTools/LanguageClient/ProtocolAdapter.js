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

/*global LanguageClientInfo*/
/*eslint-env es6, node*/
/*eslint max-len: ["error", { "code": 200 }]*/
/*eslint no-fallthrough: 0*/


var protocol = require("vscode-languageserver-protocol"),
    Utils = require("./Utils"),
    ToolingInfo = LanguageClientInfo.toolingInfo,
    MESSAGE_FORMAT = {
        BRACKETS: "brackets",
        LSP: "lsp"
    };

function _constructParamsAndRelay(relay, type, params) {
    var _params = null,
        handler = null;

    //Check for param object format. We won't change anything if the object is preformatted.
    if (params.format === MESSAGE_FORMAT.LSP) {
        params.format = undefined;
        _params = JSON.parse(JSON.stringify(params));
    }

    switch (type) {
    case ToolingInfo.LANGUAGE_SERVICE.CUSTOM_REQUEST:
        return sendCustomRequest(relay, params.type, params.params);
    case ToolingInfo.LANGUAGE_SERVICE.CUSTOM_NOTIFICATION:
        {
            sendCustomNotification(relay, params.type, params.params);
            break;
        }
    case ToolingInfo.SERVICE_REQUESTS.SHOW_SELECT_MESSAGE:
    case ToolingInfo.SERVICE_REQUESTS.REGISTRATION_REQUEST:
    case ToolingInfo.SERVICE_REQUESTS.UNREGISTRATION_REQUEST:
    case ToolingInfo.SERVICE_REQUESTS.PROJECT_FOLDERS_REQUEST:
        {
            _params = {
                type: type,
                params: params
            };
            return relay(_params);
        }
    case ToolingInfo.SERVICE_NOTIFICATIONS.SHOW_MESSAGE:
    case ToolingInfo.SERVICE_NOTIFICATIONS.LOG_MESSAGE:
    case ToolingInfo.SERVICE_NOTIFICATIONS.TELEMETRY:
    case ToolingInfo.SERVICE_NOTIFICATIONS.DIAGNOSTICS:
        {
            _params = {
                type: type,
                params: params
            };
            relay(_params);
            break;
        }
    case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_OPENED:
        {
            _params = _params || {
                textDocument: {
                    uri: Utils.pathToUri(params.filePath),
                    languageId: params.languageId,
                    version: 1,
                    text: params.fileContent
                }
            };
            didOpenTextDocument(relay, _params);
            break;
        }
    case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CHANGED:
        {
            _params = _params || {
                textDocument: {
                    uri: Utils.pathToUri(params.filePath),
                    version: 1
                },
                contentChanges: [{
                    text: params.fileContent
                }]
            };
            didChangeTextDocument(relay, _params);
            break;
        }
    case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_SAVED:
        {
            if (!_params) {
                _params = {
                    textDocument: {
                        uri: Utils.pathToUri(params.filePath)
                    }
                };

                if (params.fileContent) {
                    _params['text'] = params.fileContent;
                }
            }
            didSaveTextDocument(relay, _params);
            break;
        }
    case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CLOSED:
        {
            _params = _params || {
                textDocument: {
                    uri: Utils.pathToUri(params.filePath)
                }
            };

            didCloseTextDocument(relay, _params);
            break;
        }
    case ToolingInfo.SYNCHRONIZE_EVENTS.PROJECT_FOLDERS_CHANGED:
        {
            var foldersAdded = params.foldersAdded || [],
                foldersRemoved = params.foldersRemoved || [];

            foldersAdded = Utils.convertToWorkspaceFolders(foldersAdded);
            foldersRemoved = Utils.convertToWorkspaceFolders(foldersRemoved);

            _params = _params || {
                event: {
                    added: foldersAdded,
                    removed: foldersRemoved
                }
            };
            didChangeWorkspaceFolders(relay, _params);
            break;
        }
    case ToolingInfo.FEATURES.CODE_HINTS:
        handler = completion;
    case ToolingInfo.FEATURES.PARAMETER_HINTS:
        handler = handler || signatureHelp;
    case ToolingInfo.FEATURES.JUMP_TO_DECLARATION:
        handler = handler || gotoDeclaration;
    case ToolingInfo.FEATURES.JUMP_TO_DEFINITION:
        handler = handler || gotoDefinition;
    case ToolingInfo.FEATURES.JUMP_TO_IMPL:
        {
            handler = handler || gotoImplementation;
            _params = _params || {
                textDocument: {
                    uri: Utils.pathToUri(params.filePath)
                },
                position: Utils.convertToLSPPosition(params.cursorPos)
            };

            return handler(relay, _params);
        }
    case ToolingInfo.FEATURES.CODE_HINT_INFO:
        {
            return completionItemResolve(relay, params);
        }
    case ToolingInfo.FEATURES.FIND_REFERENCES:
        {
            _params = _params || {
                textDocument: {
                    uri: Utils.pathToUri(params.filePath)
                },
                position: Utils.convertToLSPPosition(params.cursorPos),
                context: {
                    includeDeclaration: params.includeDeclaration
                }
            };

            return findReferences(relay, _params);
        }
    case ToolingInfo.FEATURES.DOCUMENT_SYMBOLS:
        {
            _params = _params || {
                textDocument: {
                    uri: Utils.pathToUri(params.filePath)
                }
            };

            return documentSymbol(relay, _params);
        }
    case ToolingInfo.FEATURES.PROJECT_SYMBOLS:
        {
            _params = _params || {
                query: params.query
            };

            return workspaceSymbol(relay, _params);
        }
    }
}

/** For custom messages */
function onCustom(connection, type, handler) {
    connection.onNotification(type, handler);
}

function sendCustomRequest(connection, type, params) {
    return connection.sendRequest(type, params);
}

function sendCustomNotification(connection, type, params) {
    connection.sendNotification(type, params);
}

/** For Notification messages */
function didOpenTextDocument(connection, params) {
    connection.sendNotification(protocol.DidOpenTextDocumentNotification.type, params);
}

function didChangeTextDocument(connection, params) {
    connection.sendNotification(protocol.DidChangeTextDocumentNotification.type, params);
}

function didCloseTextDocument(connection, params) {
    connection.sendNotification(protocol.DidCloseTextDocumentNotification.type, params);
}

function didSaveTextDocument(connection, params) {
    connection.sendNotification(protocol.DidSaveTextDocumentNotification.type, params);
}

function didChangeWorkspaceFolders(connection, params) {
    connection.sendNotification(protocol.DidChangeWorkspaceFoldersNotification.type, params);
}

/** For Request messages */
function completion(connection, params) {
    return connection.sendRequest(protocol.CompletionRequest.type, params);
}

function completionItemResolve(connection, params) {
    return connection.sendRequest(protocol.CompletionResolveRequest.type, params);
}

function signatureHelp(connection, params) {
    return connection.sendRequest(protocol.SignatureHelpRequest.type, params);
}

function gotoDefinition(connection, params) {
    return connection.sendRequest(protocol.DefinitionRequest.type, params);
}

function gotoDeclaration(connection, params) {
    return connection.sendRequest(protocol.DeclarationRequest.type, params);
}

function gotoImplementation(connection, params) {
    return connection.sendRequest(protocol.ImplementationRequest.type, params);
}

function findReferences(connection, params) {
    return connection.sendRequest(protocol.ReferencesRequest.type, params);
}

function documentSymbol(connection, params) {
    return connection.sendRequest(protocol.DocumentSymbolRequest.type, params);
}

function workspaceSymbol(connection, params) {
    return connection.sendRequest(protocol.WorkspaceSymbolRequest.type, params);
}

/**
 * Server commands
 */
function initialize(connection, params) {
    var rootPath = params.rootPath,
        workspaceFolders = params.rootPaths;

    if(!rootPath && workspaceFolders && Array.isArray(workspaceFolders)) {
        rootPath = workspaceFolders[0];
    }

    if (!workspaceFolders) {
        workspaceFolders = [rootPath];
    }

    if (workspaceFolders.length) {
        workspaceFolders = Utils.convertToWorkspaceFolders(workspaceFolders);
    }

    var _params = {
        rootPath: rootPath,
        rootUri: Utils.pathToUri(rootPath),
        processId: process.pid,
        capabilities: params.capabilities,
        workspaceFolders: workspaceFolders
    };

    return connection.sendRequest(protocol.InitializeRequest.type, _params);
}

function initialized(connection) {
    connection.sendNotification(protocol.InitializedNotification.type);
}

function shutdown(connection) {
    return connection.sendRequest(protocol.ShutdownRequest.type);
}

function exit(connection) {
    connection.sendNotification(protocol.ExitNotification.type);
}

function processRequest(connection, message) {
    return _constructParamsAndRelay(connection, message.type, message.params);
}

function processNotification(connection, message) {
    _constructParamsAndRelay(connection, message.type, message.params);
}

function attachOnNotificationHandlers(connection, handler) {
    function _callbackFactory(type) {
        switch (type) {
        case protocol.ShowMessageNotification.type:
            return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_NOTIFICATIONS.SHOW_MESSAGE);
        case protocol.LogMessageNotification.type:
            return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_NOTIFICATIONS.LOG_MESSAGE);
        case protocol.TelemetryEventNotification.type:
            return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_NOTIFICATIONS.TELEMETRY);
        case protocol.PublishDiagnosticsNotification.type:
            return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_NOTIFICATIONS.DIAGNOSTICS);
        }
    }

    connection.onNotification(protocol.ShowMessageNotification.type, _callbackFactory(protocol.ShowMessageNotification.type));
    connection.onNotification(protocol.LogMessageNotification.type, _callbackFactory(protocol.LogMessageNotification.type));
    connection.onNotification(protocol.TelemetryEventNotification.type, _callbackFactory(protocol.TelemetryEventNotification.type));
    connection.onNotification(protocol.PublishDiagnosticsNotification.type, _callbackFactory(protocol.PublishDiagnosticsNotification.type));
    connection.onNotification(function (type, params) {
        var _params = {
            type: type,
            params: params
        };
        handler(_params);
    });
}

function attachOnRequestHandlers(connection, handler) {
    function _callbackFactory(type) {
        switch (type) {
        case protocol.ShowMessageRequest.type:
            return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_REQUESTS.SHOW_SELECT_MESSAGE);
        case protocol.RegistrationRequest.type:
            return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_REQUESTS.REGISTRATION_REQUEST);
        case protocol.UnregistrationRequest.type:
            return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_REQUESTS.UNREGISTRATION_REQUEST);
        case protocol.WorkspaceFoldersRequest.type:
            return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_REQUESTS.PROJECT_FOLDERS_REQUEST);
        }
    }

    connection.onRequest(protocol.ShowMessageRequest.type, _callbackFactory(protocol.ShowMessageRequest.type));
    connection.onRequest(protocol.RegistrationRequest.type, _callbackFactory(protocol.RegistrationRequest.type));
    // See https://github.com/Microsoft/vscode-languageserver-node/issues/199
    connection.onRequest("client/registerFeature", _callbackFactory(protocol.RegistrationRequest.type));
    connection.onRequest(protocol.UnregistrationRequest.type, _callbackFactory(protocol.UnregistrationRequest.type));
    // See https://github.com/Microsoft/vscode-languageserver-node/issues/199
    connection.onRequest("client/unregisterFeature", _callbackFactory(protocol.UnregistrationRequest.type));
    connection.onRequest(protocol.WorkspaceFoldersRequest.type, _callbackFactory(protocol.WorkspaceFoldersRequest.type));
    connection.onRequest(function (type, params) {
        var _params = {
            type: type,
            params: params
        };
        return handler(_params);
    });
}

exports.initialize = initialize;
exports.initialized = initialized;
exports.shutdown = shutdown;
exports.exit = exit;
exports.onCustom = onCustom;
exports.sendCustomRequest = sendCustomRequest;
exports.sendCustomNotification = sendCustomNotification;
exports.processRequest = processRequest;
exports.processNotification = processNotification;
exports.attachOnNotificationHandlers = attachOnNotificationHandlers;
exports.attachOnRequestHandlers = attachOnRequestHandlers;
