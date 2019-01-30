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

//Transform params to LSP kind (We will end up here from LanguageClient.processRequest)


"use strict";

var protocol = require("vscode-languageserver-protocol"),
    nodeURL = require('url');

//atom-languageclient
function pathToUri(filePath) {
    var newPath = filePath.replace(/\\/g, '/');
    if (newPath[0] !== '/') {
        newPath = `/${newPath}`;
    }
    return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
}

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
        case "initialize":
        {
            _params = {
                rootPath: params.rootPath,
                rootUri: pathToUri(params.rootPath),
                processId : process.pid,
                capabilities : params.capabilities
            }
                
            return initialize(relay, _params);
            break;
        }
        case "cancelRequest":
        {
            //Code stub for future implementation
            break;
        }
        case "showMessageRequest":
        {
            _params = {
                type : type,
                eventType : "onRequest",
                params : params
            }
            return relay(params);
            break;
        }
        case "showMessage":
        case "logMessage":
        case "telemetry":
        case "publishDiagnostics":
        {
            _params = {
                type : type,
                eventType : "onNotification",
                params : params
            }
            relay(params);
            break;
        }
        case "symbols":
        {
            
            break;
        }
        case "didOpen":
        {
            
            break;
        }
        case "didChange":
        {
            
            break;
        }
        case "willSave":
        {
            
            break;
        }
        case "willSaveWaitUntil":
        {
            
            break;
        }
        case "didSave":
        {
            
            break;
        }
        case "didClose":
        {
            
            break;
        }
        case "completion":
        {
            
            break;
        }
        case "completionResolve":
        {
            
            break;
        }
        case "signatureHelp":
        {
            
            break;
        }
        case "declaration":
        {
            
            break;
        }
        case "definition":
        {
            
            break;
        }
        case "implementation":
        {
            
            break;
        }
        case "references":
        {
            
            break;
        }
        case "documentHighlight":
        {
            
            break;
        }
        case "documentSymbol":
        {
            
            break;
        }
            
        /** TODO: Code stubs for future implementation */
        case "executeCommand":
        {
            //Code stub for future implementation
            break;
        }
        case "applyEdit":
        {
            //Code stub for future implementation
            break;
        }
        case "typeDefinition":
        {
            //Code stub for future implementation
            break;
        }
        case "codeAction":
        {
            //Code stub for future implementation
            break;
        }
        case "formatting":
        {
            //Code stub for future implementation
            break;
        }
        case "rangeFormatting":
        {
            //Code stub for future implementation
            break;
        }
        case "onTypeFormatting":
        {
            //Code stub for future implementation
            break;
        }
        case "rename":
        {
            //Code stub for future implementation
            break;
        }
        case "prepareRename":
        {
            //Code stub for future implementation
            break;
        }
        case "registerCapability":
        {
            //Code stub for future implementation
            break;
        }
        case "unregisterCapability":
        {
            //Code stub for future implementation
            break;
        }
        case "workspaceFolders":
        {
            //Code stub for future implementation
            break;
        }
        case "didChangeWorkspaceFolders":
        {
            //Code stub for future implementation
            break;
        }
        case "didChangeConfiguration":
        {
            //Code stub for future implementation
            break;
        }
        case "configuration":
        {
            //Code stub for future implementation
            break;
        }
        case "didChangedWatchedFiles":
        {
            //Code stub for future implementation
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


/** General Requests */
function initialize(connection, params) {
    return connection.sendRequest(protocol.InitializeRequest.type, params);
}

function initialized(connection) {
    connection.sendNotification(protocol.InitializedNotification.type, {});
}

function shutdown(connection) {
    return connection.sendRequest(protocol.ShutdownRequest.type);
}

function exit(connection) {
    connection.sendNotification(protocol.ExitNotification.type);
}

function didOpenTextDocument(connection, params) {
    connection.sendNotification(protocol.DidOpenTextDocumentNotification.type, params);
}

function didChangeTextDocument(connection, params) {
    connection.sendNotification(protocol.DidChangeTextDocumentNotification.type, params);
}

function didCloseTextDocument(connection, params) {
    connection.sendNotification(protocol.DidCloseTextDocumentNotification.type, params);
}

function willSaveTextDocument(connection, params) {
    connection.sendNotification(protocol.WillSaveTextDocumentNotification.type, params);
}

function willSaveWaitUntilTextDocument(connection, params) {
    return connection.sendRequest(protocol.WillSaveTextDocumentWaitUntilRequest.type, params);
}

function didSaveTextDocument(connection, params) {
    connection.sendNotification(protocol.DidSaveTextDocumentNotification.type, params);
}

function completion(connection, params) {
    return connection.sendRequest(protocol.CompletionRequest.type, params);
}

function completionItemResolve(connection, params) {
    return connection.sendRequest(protocol.CompletionResolveRequest.type, params);
}

function hover(connection, params) {
    return connection.sendRequest(protocol.HoverRequest.type, params);
}

function signatureHelp(connection, params) {
    return connection.sendRequest(protocol.SignatureHelpRequest.type, params);
}

function gotoDefinition(connection, params) {
    return connection.sendRequest(protocol.DefinitionRequest.type, params);
}

function findReferences(connection, params) {
    return connection.sendRequest(protocol.ReferencesRequest.type, params);
}

function documentHighlight(connection, params) {
    return connection.sendRequest(protocol.DocumentHighlightRequest.type, params);
}

function documentSymbol(connection, params) {
    return connection.sendRequest(protocol.DocumentSymbolRequest.type, params);
}

function workspaceSymbol(connection, params) {
    return connection.sendRequest(protocol.WorkspaceSymbolRequest.type, params);
}

/*

function codeLens(connection, params) {
    return connection.sendRequest(protocol.CodeLensRequest.type, params);
}

function codeAction(connection, params) {
    return connection.sendRequest(protocol.CodeActionRequest.type, params);
}

function didChangeWatchedFiles(connection, params) {
    connection.sendNotification(protocol.DidChangeWatchedFilesNotification.type, params);
}

function onApplyEdit(connection, callback) {
    connection.onRequest(protocol.ApplyWorkspaceEditRequest.type, callback);
}

function didChangeConfiguration(connection, params) {
    connection.sendNotification(protocol.DidChangeConfigurationNotification.type, params);
}

function codeLensResolve(connection, params) {
    return connection.sendRequest(protocol.CodeLensResolveRequest.type, params);
}

function documentLink(connection, params) {
    return connection.sendRequest(protocol.DocumentLinkRequest.type, params);
}

function documentLinkResolve(connection, params) {
    return connection.sendRequest(protocol.DocumentLinkResolveRequest.type, params);
}

function documentFormatting(connection, params) {
    return connection.sendRequest(protocol.DocumentFormattingRequest.type, params);
}

function documentRangeFormatting(connection, params) {
    return connection.sendRequest(protocol.DocumentRangeFormattingRequest.type, params);
}

function documentOnTypeFormatting(connection, params) {
    return connection.sendRequest(protocol.DocumentOnTypeFormattingRequest.type, params);
}

function rename(connection, params) {
    return connection.sendRequest(protocol.RenameRequest.type, params);
}

function executeCommand(connection, params) {
    return connection.sendRequest(protocol.ExecuteCommandRequest.type, params);
}

*/

function processRequest(connection, message) {
    return _constructParamsAndRelay(connection, message.type, message.params);
}

function 

function attachOnNotificationHandlers(connection, handler) {
    function _callbackFactory(type) {
        switch (type) {
            case protocol.ShowMessageNotification.type: {
                return _constructParamsAndRelay.bind(null, handler, "showMessage");
                break;
            }      
            case protocol.LogMessageNotification.type: {
                return _constructParamsAndRelay.bind(null, handler, "logMessage");
                break;
            }      
            case protocol.TelemetryEventNotification.type: {
                return _constructParamsAndRelay.bind(null, handler, "telemetry");
                break;
            }      
            case protocol.PublishDiagnosticsNotification.type: {
                return _constructParamsAndRelay.bind(null, handler, "publishDiagnostics");
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
            case protocol.ShowMessageRequest.type: {
                return _constructParamsAndRelay.bind(null, handler, "showMessageRequest");
                break;
            }       
        }
    }
    
    connection.onRequest(protocol.ShowMessageRequest.type, _callbackFactory(protocol.ShowMessageRequest.type));
}

exports.initialized = initialized;
exports.shutdown = shutdown;
exports.exit = exit;
exports.onCustom = onCustom;
exports.sendCustomRequest = sendCustomRequest;
exports.sendCustomNotification = sendCustomNotification;
exports.processRequest = processRequest;
