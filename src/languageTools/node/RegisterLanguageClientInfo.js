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

/*global exports*/
/*eslint-env es6, node*/
/*eslint max-len: ["error", { "code": 200 }]*/
"use strict";

var domainName = "LanguageClientInfo",
    LANGUAGE_CLIENT_RELATIVE_PATH_ARRAY = ["languageTools", "LanguageClient", "LanguageClient"],
    FORWARD_SLASH = "/",
    BACKWARD_SLASH = "\\",
    CompletionItemKind = {
        Text: 1,
        Method: 2,
        Function: 3,
        Constructor: 4,
        Field: 5,
        Variable: 6,
        Class: 7,
        Interface: 8,
        Module: 9,
        Property: 10,
        Unit: 11,
        Value: 12,
        Enum: 13,
        Keyword: 14,
        Snippet: 15,
        Color: 16,
        File: 17,
        Reference: 18,
        Folder: 19,
        EnumMember: 20,
        Constant: 21,
        Struct: 22,
        Event: 23,
        Operator: 24,
        TypeParameter: 25
    },
    SymbolKind = {
        File: 1,
        Module: 2,
        Namespace: 3,
        Package: 4,
        Class: 5,
        Method: 6,
        Property: 7,
        Field: 8,
        Constructor: 9,
        Enum: 10,
        Interface: 11,
        Function: 12,
        Variable: 13,
        Constant: 14,
        String: 15,
        Number: 16,
        Boolean: 17,
        Array: 18,
        Object: 19,
        Key: 20,
        Null: 21,
        EnumMember: 22,
        Struct: 23,
        Event: 24,
        Operator: 25,
        TypeParameter: 26
    },
    defaultBracketsCapabilities = {
        //brackets default capabilties
        "workspace": {
            "workspaceFolders": true,
            "symbol": {
                "dynamicRegistration": false,
                "symbolKind": [
                    SymbolKind.File,
                    SymbolKind.Module,
                    SymbolKind.Namespace,
                    SymbolKind.Package,
                    SymbolKind.Class,
                    SymbolKind.Method,
                    SymbolKind.Property,
                    SymbolKind.Field,
                    SymbolKind.Constructor,
                    SymbolKind.Enum,
                    SymbolKind.Interface,
                    SymbolKind.Function,
                    SymbolKind.Variable,
                    SymbolKind.Constant,
                    SymbolKind.String,
                    SymbolKind.Number,
                    SymbolKind.Boolean,
                    SymbolKind.Array,
                    SymbolKind.Object,
                    SymbolKind.Key,
                    SymbolKind.Null,
                    SymbolKind.EnumMember,
                    SymbolKind.Struct,
                    SymbolKind.Event,
                    SymbolKind.Operator,
                    SymbolKind.TypeParameter
                ]
            }
        },
        "textDocument": {
            "synchronization": {
                "didSave": true
            },
            "completion": {
                "dynamicRegistration": false,
                "completionItem": {
                    "deprecatedSupport": true,
                    "documentationFormat": ["plaintext"],
                    "preselectSupport": true
                },
                "completionItemKind": {
                    "valueSet": [
                        CompletionItemKind.Text,
                        CompletionItemKind.Method,
                        CompletionItemKind.Function,
                        CompletionItemKind.Constructor,
                        CompletionItemKind.Field,
                        CompletionItemKind.Variable,
                        CompletionItemKind.Class,
                        CompletionItemKind.Interface,
                        CompletionItemKind.Module,
                        CompletionItemKind.Property,
                        CompletionItemKind.Unit,
                        CompletionItemKind.Value,
                        CompletionItemKind.Enum,
                        CompletionItemKind.Keyword,
                        CompletionItemKind.Snippet,
                        CompletionItemKind.Color,
                        CompletionItemKind.File,
                        CompletionItemKind.Reference,
                        CompletionItemKind.Folder,
                        CompletionItemKind.EnumMember,
                        CompletionItemKind.Constant,
                        CompletionItemKind.Struct,
                        CompletionItemKind.Event,
                        CompletionItemKind.Operator,
                        CompletionItemKind.TypeParameter
                    ]
                },
                "contextSupport": true
            },
            "signatureHelp": {
                "dynamicRegistration": false,
                "signatureInformation": {
                    "documentationFormat": ["plaintext"]
                }
            },
            "references": {
                "dynamicRegistration": false
            },
            "documentSymbol": {
                "dynamicRegistration": false,
                "symbolKind": {
                    "valueSet": [
                        SymbolKind.File,
                        SymbolKind.Module,
                        SymbolKind.Namespace,
                        SymbolKind.Package,
                        SymbolKind.Class,
                        SymbolKind.Method,
                        SymbolKind.Property,
                        SymbolKind.Field,
                        SymbolKind.Constructor,
                        SymbolKind.Enum,
                        SymbolKind.Interface,
                        SymbolKind.Function,
                        SymbolKind.Variable,
                        SymbolKind.Constant,
                        SymbolKind.String,
                        SymbolKind.Number,
                        SymbolKind.Boolean,
                        SymbolKind.Array,
                        SymbolKind.Object,
                        SymbolKind.Key,
                        SymbolKind.Null,
                        SymbolKind.EnumMember,
                        SymbolKind.Struct,
                        SymbolKind.Event,
                        SymbolKind.Operator,
                        SymbolKind.TypeParameter
                    ]
                },
                "hierarchicalDocumentSymbolSupport": false
            },
            "definition": {
                "dynamicRegistration": false
            },
            "declaration": {
                "dynamicRegistration": false
            },
            "typeDefinition": {
                "dynamicRegistration": false
            },
            "implementation": {
                "dynamicRegistration": false
            },
            "publishDiagnostics": {
                "relatedInformation": true
            }
        }
    };

function syncPreferences(prefs) {
    global.LanguageClientInfo = global.LanguageClientInfo || {};
    global.LanguageClientInfo.preferences = prefs || global.LanguageClientInfo.preferences || {};
}

function initialize(bracketsSourcePath, toolingInfo) {
    var normalizedBracketsSourcePath = bracketsSourcePath.split(BACKWARD_SLASH).join(FORWARD_SLASH),
        bracketsSourcePathArray = normalizedBracketsSourcePath.split(FORWARD_SLASH),
        languageClientAbsolutePath = bracketsSourcePathArray.concat(LANGUAGE_CLIENT_RELATIVE_PATH_ARRAY).join(FORWARD_SLASH);

    global.LanguageClientInfo = global.LanguageClientInfo || {};
    global.LanguageClientInfo.languageClientPath = languageClientAbsolutePath;
    global.LanguageClientInfo.defaultBracketsCapabilities = defaultBracketsCapabilities;
    global.LanguageClientInfo.toolingInfo = toolingInfo;
    global.LanguageClientInfo.preferences = {};
}

function init(domainManager) {
    if (!domainManager.hasDomain(domainName)) {
        domainManager.registerDomain(domainName, {
            major: 0,
            minor: 1
        });
    }

    domainManager.registerCommand(
        domainName,
        "initialize",
        initialize,
        false,
        "Initialize node environment for Language Client Module",
        [
            {
                name: "bracketsSourcePath",
                type: "string",
                description: "Absolute path to the brackets source"
            },
            {
                name: "toolingInfo",
                type: "object",
                description: "Tooling Info json to be used by Language Client"
            }
        ],
        []
    );

    domainManager.registerCommand(
        domainName,
        "syncPreferences",
        syncPreferences,
        false,
        "Sync language tools preferences for Language Client Module",
        [
            {
                name: "prefs",
                type: "object",
                description: "Language tools preferences"
            }
        ],
        []
    );

    domainManager.registerEvent(
        domainName,
        "requestLanguageClientInfo",
        [] //no parameters
    );

    function requestInfo() {
        domainManager.emitEvent(domainName, "requestLanguageClientInfo", []);
    }
    //Allow the handler enough time to get registered on Brackets side.
    setTimeout(requestInfo, 250);
}

exports.init = init;
