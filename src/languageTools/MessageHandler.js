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

/*eslint no-console: 0*/
/*eslint max-len: ["error", { "code": 200 }]*/
define(function (require, exports, module) {
    "use strict";

    var ToolingInfo = JSON.parse(require("text!languageTools/ToolingInfo.json")),
        NodeDomain = require("utils/NodeDomain"),
        EditorManager = require("editor/EditorManager"),
        FileUtils = require("file/FileUtils"),
        BracketsToNodeInterface = require("languageTools/BracketsToNodeInterface").BracketsToNodeInterface,
        ProjectManager = require("project/ProjectManager");

    //Register paths required for Language Client and also register default brackets capabilities.
    var _bracketsPath   = FileUtils.getNativeBracketsDirectoryPath(),
        _modulePath = FileUtils.getNativeModuleDirectoryPath(module),
        _nodePath = "node/RegisterLanguageClientInfo",
        _domainPath = [_bracketsPath, _modulePath, _nodePath].join("/"),
        clientInfoDomain = new NodeDomain("LanguageClientInfo", _domainPath);

    //Init node with Information required by Language Client
    clientInfoDomain.exec("initialize", _bracketsPath, ToolingInfo);


    function _createNodeDomain(domainName, domainPath) {
        return new NodeDomain(domainName, domainPath);
    }

    function _createParams(type, params) {
        return {
            type: type,
            params: params
        };
    }

    function hasValidProp(obj, prop) {
        return (obj && obj[prop] !== undefined && obj[prop] !== null);
    }

    function hasValidProps(obj, props) {
        var retval = !!obj,
            len = props.length,
            i;

        for (i = 0; retval && (i < len); i ++) {
            retval = (retval && obj[props[i]] !== undefined && obj[props[i]] !== null);
        }

        return retval;
    }
    /*
        RequestParams creator - sendNotifications/request
    */
    function constructRequestParams(type, params) {
        var jsonParams = null,
            activeEditor = EditorManager.getActiveEditor();

        params = params ? params : {};
        
        //Don't construct if the formatting is done by the caller
        if (params.format === "spec") {
            return params;
        }
        
        switch (type) {
        case ToolingInfo.LANGUAGE_SERVICE.START:
            {
                jsonParams = {
                    rootPath: hasValidProp(params, "rootPath") ? params.rootPath : ProjectManager.getProjectRoot().fullPath,
                    capabilities: params.capabilities ? params.capabilities : false
                };
                break;
            }
        case ToolingInfo.FEATURES.CODE_HINTS:
        case ToolingInfo.FEATURES.PARAMETER_HINTS:
        case ToolingInfo.FEATURES.JUMP_TO_DECLARATION:
        case ToolingInfo.FEATURES.JUMP_TO_DEFINITION:
        case ToolingInfo.FEATURES.JUMP_TO_IMPL:
            {
                jsonParams = _createParams(type, {
                    filePath: hasValidProp(params, "filePath") ? params.filePath : (activeEditor.document.file._path || activeEditor.document.file.fullPath),
                    cursorPos: hasValidProp(params, "cursorPos") ? params.cursorPos : activeEditor.getCursorPos()
                });
                break;
            }
        case ToolingInfo.FEATURES.CODE_HINT_INFO:
            {
                jsonParams = _createParams(type, params);
                break;
            }
        case ToolingInfo.FEATURES.FIND_REFERENCES:
            {
                jsonParams = _createParams(type, {
                    filePath: hasValidProp(params, "filePath") ? params.filePath : (activeEditor.document.file._path || activeEditor.document.file.fullPath),
                    cursorPos: hasValidProp(params, "cursorPos") ? params.cursorPos : activeEditor.getCursorPos(),
                    includeDeclaration: params.includeDeclaration ? params.includeDeclaration : false
                });
                break;
            }
        case ToolingInfo.FEATURES.DOCUMENT_SYMBOLS:
            {
                jsonParams = _createParams(type, {
                    filePath: hasValidProp(params, "filePath") ? params.filePath : (activeEditor.document.file._path || activeEditor.document.file.fullPath)
                });
                break;
            }
        case ToolingInfo.FEATURES.PROJECT_SYMBOLS:
            {
                if (params && params.query && typeof params.query === "string") {
                    jsonParams = _createParams(type, params);
                }
                break;
            }
        case ToolingInfo.LANGUAGE_SERVICE.CUSTOM_REQUEST:
            {
                jsonParams = _createParams(type, params);
            }
        }

        return jsonParams;
    }

    /*
        ReponseParams transformer - used by OnNotifications
    */
    function constructNotificationParams(type, params) {
        var jsonParams = null;

        params = params ? params : {};
        
        //Don't construct if the formatting is done by the caller
        if (params.format === "spec") {
            return params;
        }
        
        switch (type) {
        case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_OPENED:
            {
                if (hasValidProps(params, ["filePath", "fileContent", "languageId"])) {
                    jsonParams = _createParams(type, params);
                }
                break;
            }
        case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CHANGED:
            {
                if (hasValidProps(params, ["filePath", "fileContent"])) {
                    jsonParams = _createParams(type, params);
                }
                break;
            }
        case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_SAVED:
            {
                if (hasValidProp(params, "filePath")) {
                    jsonParams = _createParams(type, params);
                }
                break;
            }
        case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CLOSED:
            {
                if (hasValidProp(params, "filePath")) {
                    jsonParams = _createParams(type, params);
                }
                break;
            }
        case ToolingInfo.SYNCHRONIZE_EVENTS.PROJECT_FOLDERS_CHANGED:
            {
                if (hasValidProps(params, ["foldersAdded", "foldersRemoved"])) {
                    jsonParams = _createParams(type, params);
                }
                break;
            }
        case ToolingInfo.LANGUAGE_SERVICE.CUSTOM_NOTIFICATION:
            {
                jsonParams = _createParams(type, params);
            }
        }

        return jsonParams;
    }

    function loadLanguageClientDomain(clientName, domainPath) {
        //generate a random hash name for the domain, this is the client id
        var domainName = clientName,
            result = $.Deferred(),
            languageClientDomain = _createNodeDomain(domainName, domainPath);

        if (languageClientDomain) {
            languageClientDomain.promise()
                .done(function () {
                    console.log(domainPath + " domain successfully created");
                    result.resolve(languageClientDomain);
                })
                .fail(function (err) {
                    console.error(domainPath + " domain could not be created.");
                    result.reject();
                });
        } else {
            console.error(domainPath + " domain could not be created.");
            result.reject();
        }

        return result;
    }

    function createNodeInterfaceForDomain(languageClientDomain) {
        var nodeInterface = new BracketsToNodeInterface(languageClientDomain);

        return nodeInterface;
    }

    function initiateLanguageClient(clientName, clientFilePath) {
        var result = $.Deferred();

        loadLanguageClientDomain(clientName, clientFilePath)
            .then(function (languageClientDomain) {
                var languageClientInterface = createNodeInterfaceForDomain(languageClientDomain);

                result.resolve({
                    name: clientName,
                    interface: languageClientInterface
                });
            }, result.reject);

        return result;
    }

    exports.initiateLanguageClient = initiateLanguageClient;
    exports.constructRequestParams = constructRequestParams;
    exports.constructNotificationParams = constructNotificationParams;
});
