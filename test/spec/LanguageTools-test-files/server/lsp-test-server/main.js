/*eslint-env es6, node*/
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
    if (type !== "custom/triggerDiagnostics") {
        connection.sendNotification(vls.LogMessageNotification.type, {
            received: {
                type: type,
                params: params
            }
        });
    } else {
        connection.sendDiagnostics({
            received: {
                type: type,
                params: params
            }
        });
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
