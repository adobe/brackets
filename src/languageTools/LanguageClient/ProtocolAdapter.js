/*
 * Copyright (c) 2019 - present Adobe Systems Incorporated. All rights reserved.
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

"use strict";

var protocol = require("vscode-languageserver-protocol"),
    nodeURL = require("url"),
    ToolingInfo = require("./../ToolingInfo.json")

//atom-languageclient
function pathToUri(filePath) {
    var newPath = filePath.replace(/\\/g, '/');
    if (newPath[0] !== '/') {
        newPath = `/${newPath}`;
    }
    return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
}

//atom-languageclient
function uriToPath(uri) {
    var url = nodeURL.URL.parse(uri);
    if (url.protocol !== 'file:' || url.path === undefined) {
        return uri;
    }

    let filePath = decodeURIComponent(url.path);
    if (process.platform === 'win32') {
        // Deal with Windows drive names
        if (filePath[0] === '/') {
            filePath = filePath.substr(1);
        }
        return filePath.replace(/\//g, '\\');
    }
    return filePath;
}

function _constructParamsAndRelay(relay, type, params) {
    var _params;
    switch (type) {
        case ToolingInfo.LANGUAGE_SERVICE.CANCEL_REQUEST:
        {
            break;
        }
        case ToolingInfo.LANGUAGE_SERVICE.CUSTOM_REQUEST: {
            
            break;
        }
        case ToolingInfo.SERVICE_REQUESTS.SHOW_SELECT_MESSAGE:
        case ToolingInfo.SERVICE_REQUESTS.REQUEST_PROJECT_ROOTS:
        {
            _params = {
                type : type,
                params : params
            }
            return relay(_params);
            break;
        }
        case ToolingInfo.SERVICE_EVENTS.SHOW_MESSAGE:
        case ToolingInfo.SERVICE_EVENTS.LOG_MESSAGE:
        case ToolingInfo.SERVICE_EVENTS.TELEMETRY:
        case ToolingInfo.SERVICE_EVENTS.DIAGNOSTICS:
        {
            _params = {
                type : type,
                params : params
            }
            relay(_params);
            break;
        }
        case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_OPENED:
        {
            
            break;
        }
        case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CHANGED:
        {
            
            break;
        }
        case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_SAVED:
        {
            
            break;
        }
        case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CLOSED:
        {
            
            break;
        }
        case ToolingInfo.SYNCHRONIZE_EVENTS.PROJECT_FOLDERS_CHANGED:
        {
            
            break;
        }
        case ToolingInfo.FEATURES.CODE_HINTS:
        {
            
            break;
        }
        case ToolingInfo.FEATURES.CODE_HINT_INFO:
        {
            
            break;
        }
        case ToolingInfo.FEATURES.PARAMETER_HINTS:
        {
            
            break;
        }
        case ToolingInfo.FEATURES.JUMP_TO_DECLARATION:
        {
            
            break;
        }
        case ToolingInfo.FEATURES.JUMP_TO_DEFINITION:
        {
            
            break;
        }
        case ToolingInfo.FEATURES.JUMP_TO_IMPL:
        {
            
            break;
        }
        case ToolingInfo.FEATURES.FIND_REFERENCES:
        {
            
            break;
        }
        case ToolingInfo.FEATURES.DOCUMENT_SYMBOLS:
        {
            
            break;
        }
        case ToolingInfo.FEATURES.PROJECT_SYMBOLS:
        {
            
            break;
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
    connection.sendNotification(protocol.DidChangeWorkspaceFoldersNotification.type, params)
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
    var _params = {
        rootPath: params.rootPath,
        rootUri: pathToUri(params.rootPath),
        processId : process.pid,
        capabilities : params.capabilities
    }
    
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
            case ToolingInfo.protocol.ShowMessageNotification.type: {
                return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_EVENTS.SHOW_MESSAGE);
                break;
            }      
            case ToolingInfo.protocol.LogMessageNotification.type: {
                return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_EVENTS.LOG_MESSAGE);
                break;
            }      
            case ToolingInfo.protocol.TelemetryEventNotification.type: {
                return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_EVENTS.TELEMETRY);
                break;
            }      
            case ToolingInfo.protocol.PublishDiagnosticsNotification.type: {
                return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_EVENTS.DIAGNOSTICS);
                break;
            }      
        }
    }
    
    connection.onNotification(protocol.ShowMessageNotification.type, _callbackFactory(protocol.ShowMessageNotification.type));
    connection.onNotification(protocol.LogMessageNotification.type, _callbackFactory(protocol.LogMessageNotification.type));
    connection.onNotification(protocol.TelemetryEventNotification.type, _callbackFactory(protocol.TelemetryEventNotification.type));
    connection.onNotification(protocol.PublishDiagnosticsNotification.type, _callbackFactory(protocol.PublishDiagnosticsNotification.type));
}

function attachOnRequestHandlers(connection, handler) {
    function _callbackFactory(type) {
        switch (type) {
            case ToolingInfo.protocol.ShowMessageRequest.type: {
                return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_REQUESTS.SHOW_SELECT_MESSAGE);
                break;
            }
            case ToolingInfo.protocol.WorkspaceFoldersRequest.type: {
                return _constructParamsAndRelay.bind(null, handler, ToolingInfo.SERVICE_REQUESTS.REQUEST_PROJECT_ROOTS);
                break;
            }
        }
    }
    
    connection.onRequest(protocol.ShowMessageRequest.type, _callbackFactory(protocol.ShowMessageRequest.type));
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
