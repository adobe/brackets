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

/*global exports*/
/*eslint-env es6, node*/
/*eslint max-len: ["error", { "code": 200 }]*/
"use strict";

var domainName = "LanguageClientInfo",
    LANGUAGE_CLIENT_RELATIVE_PATH_ARRAY = ["languageTools", "LanguageClient", "LanguageClient"],
    FORWARD_SLASH = "/",
    BACKWARD_SLASH = "\\",
    defaultBracketsCapabilities = {
        //brackets default capabilties
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

function initialize(bracketsSourcePath, toolingInfo) {
    var normalizedBracketsSourcePath = bracketsSourcePath.split(BACKWARD_SLASH).join(FORWARD_SLASH),
        bracketsSourcePathArray = normalizedBracketsSourcePath.split(FORWARD_SLASH),
        languageClientAbsolutePath = bracketsSourcePathArray.concat(LANGUAGE_CLIENT_RELATIVE_PATH_ARRAY).join(FORWARD_SLASH);

    global.LanguageClientInfo = global.LanguageClientInfo || {};
    global.LanguageClientInfo.languageClientPath = languageClientAbsolutePath;
    global.LanguageClientInfo.defaultBracketsCapabilities = defaultBracketsCapabilities;
    global.LanguageClientInfo.toolingInfo = toolingInfo;
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
}

exports.init = init;
