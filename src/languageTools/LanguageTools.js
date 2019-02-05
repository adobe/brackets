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

    var MessageHandler = require("languageTools/MessageHandler"),
        EditorManager = require("editor/EditorManager"),
        ProjectManager = require("project/ProjectManager"),
        LanguageManager = require("language/LanguageManager"),
        ToolingInfo = JSON.parse(require("text!languageTools/ToolingInfo.json"));

    function LanguageClientProxy(name, path, domainInterface, languages) {
        this._name = name;
        this._path = path;
        this._domainInterface = domainInterface;
        this._languages = languages ? languages : [];
        this._startClient = null;
        this._stopClient = null;
        this._notifyClient = null;
        this._requestClient = null;
        this._onRequestHandler = {};
        this._onNotificationHandlers = {};

        this._init();
    }

    LanguageClientProxy.prototype._init = function () {
        this._domainInterface.registerMethods([
            {
                methodName: ToolingInfo.LANGUAGE_SERVICE.REQUEST,
                methodHandle: this._onRequestDelegator.bind(this)
            },
            {
                methodName: ToolingInfo.LANGUAGE_SERVICE.NOTIFY,
                methodHandle: this._onNotificationDelegator.bind(this)
            }
        ]);

        //create function interfaces
        this._startClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.START, true);
        this._stopClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.STOP);
        this._notifyClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.NOTIFY);
        this._requestClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.REQUEST, true);
    };

    LanguageClientProxy.prototype._onRequestDelegator = function (params) {
        if (!params || !params.type) {
            console.log("Invalid Parameters provided for server request type : ", params.type);
            return $.Deferred().reject();
        }

        var requestHandler = this.this._onRequestHandler[params.type];
        if(requestHandler && typeof requestHandler === "function") {
            return requestHandler.call(null, params.params);
        }
        console.log("No handler provided for server request type : ", params.type);
        return $.Deferred().reject();

    };

    LanguageClientProxy.prototype._onNotificationDelegator = function (params) {
        if (!params || !params.type) {
            console.log("Invalid Parameters provided for server notification type : ", params.type);
        }

        var notificationHandlers = this._onNotificationHandlers[params.type];
        if(notificationHandlers && Array.isArray(notificationHandlers) && notificationHandlers.length) {
            notificationHandlers.forEach(function (handler) {
                handler.call(null, params.params);
            });
        } else {
            console.log("No handlers provided for server notification type : ", params.type);
        }
    };

    LanguageClientProxy.prototype._request = function (type, params) {
        params = MessageHandler.constructRequestParams(type, params);
        if (params) {
            return this._requestClient(params);
        }

        console.log("Invalid Parameters provided for request type : ", type);
        return $.Deferred().reject();
    };

    LanguageClientProxy.prototype._notify = function (type, params) {
        params = MessageHandler.constructNotificationParams(type, params);
        if (params) {
            this._requestClient(params);
        } else {
            console.log("Invalid Parameters provided for notification type : ", type);
        }
    };

    LanguageClientProxy.prototype._addOnRequestHandler = function (type, handler) {
        this._onRequestHandler[type] = handler;
    };

    LanguageClientProxy.prototype._addOnNotificationHandler = function (type, handler) {
        if (!this._onNotificationHandlers[type]) {
            this._onNotificationHandlers[type] = [];
        }
        this._onNotificationHandlers[type].push(handler);
    };

    /**
        Requests
    */
    //start
    LanguageClientProxy.prototype.start = function (params) {
        params = MessageHandler.constructRequestParams(ToolingInfo.LANGUAGE_SERVICE.START, params);
        return this._startClient(params);
    };

    //shutdown
    LanguageClientProxy.prototype.stop = function () {
        return this._stopClient();
    };

    //cancelRequest
    LanguageClientProxy.prototype.cancelRequest = function () {
        //TODO
    };

    /**
        textDocument requests
    */
    //completion
    LanguageClientProxy.prototype.requestHints = function (params) {
        return this._request(ToolingInfo.FEATURES.CODE_HINTS, params);
    };

    //completionItemResolve
    LanguageClientProxy.prototype.getAdditionalInfoForHint = function (params) {
        return this._request(ToolingInfo.FEATURES.CODE_HINT_INFO, params);
    };

    //signatureHelp
    LanguageClientProxy.prototype.requestParameterHints = function (params) {
        return this._request(ToolingInfo.FEATURES.PARAMETER_HINTS, params);
    };

    //gotoDefinition
    LanguageClientProxy.prototype.gotoDefinition = function (params) {
        return this._request(ToolingInfo.FEATURES.JUMP_TO_DEFINITION, params);
    };

    //gotoDeclaration
    LanguageClientProxy.prototype.gotoDeclaration = function (params) {
        return this._request(ToolingInfo.FEATURES.JUMP_TO_DECLARATION, params);
    };

    //gotoImplementation
    LanguageClientProxy.prototype.gotoImplementation = function (params) {
        return this._request(ToolingInfo.FEATURES.JUMP_TO_IMPL, params);
    };

    //findReferences
    LanguageClientProxy.prototype.findReferences = function (params) {
        return this._request(ToolingInfo.FEATURES.FIND_REFERENCES, params);
    };

    //documentSymbol
    LanguageClientProxy.prototype.requestSymbolsForDocument = function (params) {
        return this._request(ToolingInfo.FEATURES.DOCUMENT_SYMBOLS, params);
    };

    /**
        workspace requests
    */
    //workspaceSymbol
    LanguageClientProxy.prototype.requestSymbolsForWorkspace = function (params) {
        return this._request(ToolingInfo.FEATURES.PROJECT_SYMBOLS, params);
    };

    //These will mostly be callbacks/[done-fail](promises)
    /**
        Window OnNotifications
    */
    //showMessage
    LanguageClientProxy.prototype.addOnShowMessage = function (handler) {
        this._addOnNotificationHandler(ToolingInfo.SERVICE_EVENTS.SHOW_MESSAGE, handler);
    };

    //logMessage
    LanguageClientProxy.prototype.addOnLogMessage = function (handler) {
        this._addOnNotificationHandler(ToolingInfo.SERVICE_EVENTS.LOG_MESSAGE, handler);
    };

    /**
        healthData/logging OnNotifications
    */
    //telemetry
    LanguageClientProxy.prototype.addOnTelemetryEvent = function (handler) {
        this._addOnNotificationHandler(ToolingInfo.SERVICE_EVENTS.TELEMETRY, handler);
    };

    /**
        textDocument OnNotifications
    */
    //onPublishDiagnostics
    LanguageClientProxy.prototype.addOnDiagnostics = function (handler) {
        this._addOnNotificationHandler(ToolingInfo.SERVICE_EVENTS.DIAGNOSTICS, handler);
    };

    /**
        workspace OnRequest
    */

    //getWorkspaceFolders - handler must return promise
    LanguageClientProxy.prototype.onWorkspaceFoldersRequest = function (handler) {
        this._addOnRequestHandler(ToolingInfo.SERVICE_REQUESTS.REQUEST_PROJECT_ROOTS, handler);
    };

    /**
        Window OnRequest
    */

    //showMessageRequest - handler must return promise
    LanguageClientProxy.prototype.onShowMessageWithRequest = function (handler) {
        this._addOnRequestHandler(ToolingInfo.SERVICE_REQUESTS.SHOW_SELECT_MESSAGE, handler);
    };

    /*
        Unimplemented OnNotifications
            workspace
                applyEdit (codeAction, codeLens)
    */

    /**
        SendNotifications
    */

    /**
        workspace SendNotifications
    */
    //didChangeProjectRoots
    LanguageClientProxy.prototype.notifyProjectRootsChanged = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.PROJECT_FOLDERS_CHANGED, params);
    };

    /**
        textDocument SendNotifications
    */
    //didOpenTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentOpened = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_OPENED, params);
    };

    //didCloseTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentClosed = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CHANGED, params);
    };

    //didChangeTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentChanged = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CLOSED, params);
    };

    //didSaveTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentSave = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.PROJECT_FOLDERS_CHANGED, params);
    };

    /**
        Custom messages
     */

    //customNotification
    LanguageClientProxy.prototype.sendCustomNotification = function (params) {
        this._notifyClient(ToolingInfo.LANGUAGE_SERVICE.CUSTOM_MESSAGE, params);
    };

    //customRequest
    LanguageClientProxy.prototype.customRequest = function (params) {
        return this._requestClient(ToolingInfo.LANGUAGE_SERVICE.CUSTOM_MESSAGE, params);
    };

    //TODO: this needs to be moved to tooling manager
    LanguageClientProxy.prototype._handleActiveEditorChange = function (event, current, previous) {
        var self = this;

        function _sendDocumentOpenNotification(languageId, document) {
            if (self._languages.includes(languageId)) {
                self.notifyTextDocumentOpened({
                    languageId: languageId,
                    filePath: (document.file._path || document.file.fullPath),
                    fileContent: document.getText()
                });
            }
        }

        if (previous) {
            previous.document
                .off("languageChanged.language-tools");
            self.notifyTextDocumentClosed({
                filePath: (previous.document.file._path || previous.document.file.fullPath)
            });
        }
        if (current) {
            var currentLanguageId = LanguageManager.getLanguageForPath(current.document.file.fullPath).getId();
            current.document
                .on("languageChanged.language-tools", function () {
                    //TODO: Also need to attach listeners for Parameter Hints
                    _sendDocumentOpenNotification(currentLanguageId, current.document);
                });
            //TODO: Also need to attach listeners for Parameter Hints
            _sendDocumentOpenNotification(currentLanguageId, current.document);
        }
    };

    //TODO: this needs to be moved to tooling manager
    LanguageClientProxy.prototype._handleProjectOpen = function () {
        var self = this;

        self.stop().done(self.start);
        //TODO : the case where server supports change of workspace folders
        //TODO : Reload with extensions case
    };

    function _attachEventHandlers(client) {
        EditorManager.on("activeEditorChange.language-tools", client._handleActiveEditorChange.bind(client));
        ProjectManager.on("projectOpen", client._handleProjectOpen.bind(client));
    }

    function intiateToolingService(clientName, clientFilePath, languages) {
        var result = $.Deferred();

        MessageHandler.initiateLanguageClient(clientName, clientFilePath)
            .done(function (languageClientInfo) {
                var languageClient = new LanguageClientProxy(languageClientInfo.name, clientFilePath, languageClientInfo.interface, languages);
                _attachEventHandlers(languageClient);
                result.resolve(languageClient);
            })
            .fail(result.reject);

        return result;
    }

    exports.intiateToolingService = intiateToolingService;
});
