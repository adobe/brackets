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

define(function (require, exports, module) {
    "use strict";

    //Capabilities
    /**
     * get IDE capabilities
     * @returns _capabilities - json containing capabilities supported by client
     */
    function getCapabilities() {
        let _capabilities = { //client specific capabilities
            workspace: {
                applyEdit: false,
                configuration: false,
                workspaceEdit: {
                    documentChanges: true
                },
                workspaceFolders: true,
                didChangeConfiguration: {
                    dynamicRegistration: false
                },
                didChangeWatchedFiles: {
                    dynamicRegistration: false
                },
                symbol: {
                    dynamicRegistration: false
                },
                executeCommand: {
                    dynamicRegistration: false
                }
            },
            textDocument: {
                synchronization: {
                    dynamicRegistration: false,
                    willSave: false,
                    willSaveWaitUntil: true,
                    didSave: false
                },
                completion: {
                    dynamicRegistration: false,
                    completionItem: {
                        snippetSupport: false,
                        commitCharactersSupport: false
                    },
                    contextSupport: true
                },
                hover: {
                    dynamicRegistration: false
                },
                signatureHelp: {
                    dynamicRegistration: false
                },
                references: {
                    dynamicRegistration: false
                },
                documentHighlight: {
                    dynamicRegistration: false
                },
                documentSymbol: {
                    dynamicRegistration: false,
                    hierarchicalDocumentSymbolSupport: false
                },
                formatting: {
                    dynamicRegistration: false
                },
                rangeFormatting: {
                    dynamicRegistration: false
                },
                onTypeFormatting: {
                    dynamicRegistration: false
                },
                definition: {
                    dynamicRegistration: false
                },
                codeAction: {
                    dynamicRegistration: false
                },
                codeLens: {
                    dynamicRegistration: false
                },
                documentLink: {
                    dynamicRegistration: false
                },
                rename: {
                    dynamicRegistration: false
                }
            },
            experimental: {}
        };
        return _capabilities;
    }

    //Messages
    function getMessages() {
        var _messages = {
            "SERVER": {
                "INITIALIZE": "initialize", //Send the project root in this
                "INITIALIZED_RESPONSE": "initialized",
                "SHUTDOWN_SERVER": "shutdown",
                "CLOSE_SERVER_PROCESS": "exit",
                "CANCEL_REQUEST": "cancelRequest", //Send request id with every request for identification
                "CUSTOM_REQUEST": "customRequest"
            },
            "SERVER_NOTIFICATIONS": {
                "SHOW_MESSAGE": "showMessage",
                "REQUEST_MESSAGE": "showMessageRequest",
                "LOG_MESSAGE": "logMessage"
            },
            "USAGE_DATA": {
                "LOG_TELEMETRY": "telemetry"
            },
            "CLIENT_DYNAMIC_EVENTS": { //Dynamic changes like changes of project root, or file changes
                "REGISTER": "registerCapability",
                "UNREGISTER": "unregisterCapability"
            },
            "PROJECT": {
                "REQUEST_PROJECT_FOLDERS": "workspaceFolders",
                "PROJECT_FOLDERS_CHANGED": "didChangeWorkspaceFolders", //Sent from client to server
                "CONFIGURATION_CHANGED": "didChangeConfiguration",
                "REQUEST_CONFIGURATION": "configuration",
                "WATCHED_FILES_CHANGED": "didChangedWatchedFiles",
                "LIST_SYMBOLS": "symbols",
                "EXECUTE_COMMAND": "executeCommand", //Send by client to server to trigger command execution, which cause changes on client side on response,
                //like codelens, formatting etc.
                "APPLY_EDIT": "applyEdit" //Response from server on execute command request from client
            },
            "SYNCHRONIZE": {
                "DOCUMENT_OPENED": "didOpen",
                "DOCUMENT_CHANGED": "didChange",
                "DOCUMENT_WILL_SAVE": "willSave",
                "DOCUMENT_WILL_SAVE_WITH_WAIT": "willSaveWaitUntil",
                "DOCUMENT_SAVED": "didSave",
                "DOCUMENT_CLOSED": "didClose"
            },
            "DIAGNOSTICS": {
                "RECIEVE_DIAGNOSTICS": "publishDiagnostics"
            },
            "FEATURE": {
                "CODE_HINTS": "completion",
                "CODE_HINT_INFO": "completionResolve",
                "PARAMETER_HINTS": "signatureHelp",
                "JUMP_TO_DECLARATION": "declaration",
                "JUMP_TO_DEFINITION": "definition",
                "JUMP_TO_TYPEDEF": "typeDefinition",
                "JUMP_TO_IMPL": "implementation",
                "FIND_REFERENCES": "references",
                "HIGHLIGHT_REFRENCES": "documentHighlight",
                "LIST_SYMBOLS": "documentSymbol",
                "CODE_ACTION": "codeAction",
                "CODE_FORMATTING": "formatting",
                "RANGE_FORMATTING": "rangeFormatting",
                "ONTYPE_FORMATTING": "onTypeFormatting",
                "RENAME": "rename",
                "VALIDATE_RENAME": "prepareRename"
            }
        };

        return _messages;
    }

    exports.getCapabilities = getCapabilities;
    exports.getMessages = getMessages;
});
