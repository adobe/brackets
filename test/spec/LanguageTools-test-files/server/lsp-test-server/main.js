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
/*eslint-env es6, node*/
/*eslint max-len: ["error", { "code": 200 }]*/
/*eslint indent: 0*/
'use strict';

var vls = require("vscode-languageserver"),
    connection = vls.createConnection(vls.ProposedFeatures.all);

connection.onInitialize(function (params) {
    return {
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
});

connection.onInitialized(function () {
    connection.sendNotification(vls.LogMessageNotification.type, {
        received: {
            type: vls.InitializedNotification.type._method
        }
    });

    connection.workspace.onDidChangeWorkspaceFolders(function (params) {
        connection.sendNotification(vls.LogMessageNotification.type, {
            received: {
                type: vls.DidChangeWorkspaceFoldersNotification.type._method,
                params: params
            }
        });
    });
});

connection.onCompletion(function (params) {
    return {
        received: {
            type: vls.CompletionRequest.type._method,
            params: params
        }
    };
});

connection.onSignatureHelp(function (params) {
    return {
        received: {
            type: vls.SignatureHelpRequest.type._method,
            params: params
        }
    };
});

connection.onCompletionResolve(function (params) {
    return {
        received: {
            type: vls.CompletionResolveRequest.type._method,
            params: params
        }
    };
});

connection.onDefinition(function (params) {
    return {
        received: {
            type: vls.DefinitionRequest.type._method,
            params: params
        }
    };
});

connection.onDeclaration(function (params) {
    return {
        received: {
            type: vls.DeclarationRequest.type._method,
            params: params
        }
    };
});

connection.onImplementation(function (params) {
    return {
        received: {
            type: vls.ImplementationRequest.type._method,
            params: params
        }
    };
});

connection.onDocumentSymbol(function (params) {
    return {
        received: {
            type: vls.DocumentSymbolRequest.type._method,
            params: params
        }
    };
});

connection.onWorkspaceSymbol(function (params) {
    return {
        received: {
            type: vls.WorkspaceSymbolRequest.type._method,
            params: params
        }
    };
});

connection.onDidOpenTextDocument(function (params) {
    connection.sendNotification(vls.LogMessageNotification.type, {
        received: {
            type: vls.DidOpenTextDocumentNotification.type._method,
            params: params
        }
    });
});

connection.onDidChangeTextDocument(function (params) {
    connection.sendNotification(vls.LogMessageNotification.type, {
        received: {
            type: vls.DidChangeTextDocumentNotification.type._method,
            params: params
        }
    });
});

connection.onDidCloseTextDocument(function (params) {
    connection.sendNotification(vls.LogMessageNotification.type, {
        received: {
            type: vls.DidCloseTextDocumentNotification.type._method,
            params: params
        }
    });
});

connection.onDidSaveTextDocument(function (params) {
    connection.sendNotification(vls.LogMessageNotification.type, {
        received: {
            type: vls.DidSaveTextDocumentNotification.type._method,
            params: params
        }
    });
});

connection.onNotification(function (type, params) {
    switch (type) {
        case "custom/triggerDiagnostics":
            {
                connection.sendDiagnostics({
                    received: {
                        type: type,
                        params: params
                    }
                });
                break;
            }
        case "custom/getNotification":
            {
                connection.sendNotification("custom/serverNotification", {
                    received: {
                        type: type,
                        params: params
                    }
                });
                break;
            }
        case "custom/getRequest":
            {
                connection.sendRequest("custom/serverRequest", {
                    received: {
                        type: type,
                        params: params
                    }
                }).then(function (resolveResponse) {
                    connection.sendNotification("custom/requestSuccessNotification", {
                        received: {
                            type: "custom/requestSuccessNotification",
                            params: resolveResponse
                        }
                    });
                }).catch(function (rejectResponse) {
                    connection.sendNotification("custom/requestFailedNotification", {
                        received: {
                            type: "custom/requestFailedNotification",
                            params: rejectResponse
                        }
                    });
                });
                break;
            }
        default:
            {
                connection.sendNotification(vls.LogMessageNotification.type, {
                    received: {
                        type: type,
                        params: params
                    }
                });
            }
    }
});

connection.onRequest(function (type, params) {
    return {
        received: {
            type: type,
            params: params
        }
    };
});

// Listen on the connection
connection.listen();
