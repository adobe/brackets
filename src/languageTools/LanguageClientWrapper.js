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
        ToolingInfo = JSON.parse(require("text!languageTools/ToolingInfo.json"));

    function validateHandler(handler) {
        var retval = false;

        if (handler && typeof handler === "function") {
            retval = true;
        } else {
            console.warn("Handler validation failed. Handler should be of type 'function'. Provided handler is of type :", typeof handler);
        }

        return retval;
    }

    function LanguageClientWrapper(name, path, domainInterface, languages) {
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

        //Initialize with keys for brackets events we want to tap into.
        this._onEventHandlers = {
            "activeEditorChange": [],
            "projectOpen": [],
            "beforeProjectClose": [],
            "dirtyFlagChange": [],
            "documentChange": [],
            "fileNameChange": []
        };

        this._init();
    }

    LanguageClientWrapper.prototype._init = function () {
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

    LanguageClientWrapper.prototype._onRequestDelegator = function (params) {
        if (!params || !params.type) {
            console.log("Invalid server request");
            return $.Deferred().reject();
        }

        var requestHandler = this._onRequestHandler[params.type];
        if(validateHandler(requestHandler)) {
            return requestHandler.call(null, params.params);
        }
        console.log("No handler provided for server request type : ", params.type);
        return $.Deferred().reject();

    };

    LanguageClientWrapper.prototype._onNotificationDelegator = function (params) {
        if (!params || !params.type) {
            console.log("Invalid server notification");
            return;
        }

        var notificationHandlers = this._onNotificationHandlers[params.type];
        if(notificationHandlers && Array.isArray(notificationHandlers) && notificationHandlers.length) {
            notificationHandlers.forEach(function (handler) {
                if(validateHandler(handler)) {
                    handler.call(null, params.params);
                }
            });
        } else {
            console.log("No handlers provided for server notification type : ", params.type);
        }
    };

    LanguageClientWrapper.prototype._request = function (type, params) {
        params = MessageHandler.constructRequestParams(type, params);
        if (params) {
            return this._requestClient(params);
        }

        console.log("Invalid Parameters provided for request type : ", type);
        return $.Deferred().reject();
    };

    LanguageClientWrapper.prototype._notify = function (type, params) {
        params = MessageHandler.constructNotificationParams(type, params);
        if (params) {
            this._notifyClient(params);
        } else {
            console.log("Invalid Parameters provided for notification type : ", type);
        }
    };

    LanguageClientWrapper.prototype._addOnRequestHandler = function (type, handler) {
        if (validateHandler(handler)) {
            this._onRequestHandler[type] = handler;
        }
    };

    LanguageClientWrapper.prototype._addOnNotificationHandler = function (type, handler) {
        if (validateHandler(handler)) {
            if (!this._onNotificationHandlers[type]) {
                this._onNotificationHandlers[type] = [];
            }

            this._onNotificationHandlers[type].push(handler);
        }
    };

    /**
        Requests
    */
    //start
    LanguageClientWrapper.prototype.start = function (params) {
        params = MessageHandler.constructRequestParams(ToolingInfo.LANGUAGE_SERVICE.START, params);
        return this._startClient(params);
    };

    //shutdown
    LanguageClientWrapper.prototype.stop = function () {
        return this._stopClient();
    };

    /**
        textDocument requests
    */
    //completion
    LanguageClientWrapper.prototype.requestHints = function (params) {
        return this._request(ToolingInfo.FEATURES.CODE_HINTS, params);
    };

    //completionItemResolve
    LanguageClientWrapper.prototype.getAdditionalInfoForHint = function (params) {
        return this._request(ToolingInfo.FEATURES.CODE_HINT_INFO, params);
    };

    //signatureHelp
    LanguageClientWrapper.prototype.requestParameterHints = function (params) {
        return this._request(ToolingInfo.FEATURES.PARAMETER_HINTS, params);
    };

    //gotoDefinition
    LanguageClientWrapper.prototype.gotoDefinition = function (params) {
        return this._request(ToolingInfo.FEATURES.JUMP_TO_DEFINITION, params);
    };

    //gotoDeclaration
    LanguageClientWrapper.prototype.gotoDeclaration = function (params) {
        return this._request(ToolingInfo.FEATURES.JUMP_TO_DECLARATION, params);
    };

    //gotoImplementation
    LanguageClientWrapper.prototype.gotoImplementation = function (params) {
        return this._request(ToolingInfo.FEATURES.JUMP_TO_IMPL, params);
    };

    //findReferences
    LanguageClientWrapper.prototype.findReferences = function (params) {
        return this._request(ToolingInfo.FEATURES.FIND_REFERENCES, params);
    };

    //documentSymbol
    LanguageClientWrapper.prototype.requestSymbolsForDocument = function (params) {
        return this._request(ToolingInfo.FEATURES.DOCUMENT_SYMBOLS, params);
    };

    /**
        workspace requests
    */
    //workspaceSymbol
    LanguageClientWrapper.prototype.requestSymbolsForWorkspace = function (params) {
        return this._request(ToolingInfo.FEATURES.PROJECT_SYMBOLS, params);
    };

    //These will mostly be callbacks/[done-fail](promises)
    /**
        Window OnNotifications
    */
    //showMessage
    LanguageClientWrapper.prototype.addOnShowMessage = function (handler) {
        this._addOnNotificationHandler(ToolingInfo.SERVICE_EVENTS.SHOW_MESSAGE, handler);
    };

    //logMessage
    LanguageClientWrapper.prototype.addOnLogMessage = function (handler) {
        this._addOnNotificationHandler(ToolingInfo.SERVICE_EVENTS.LOG_MESSAGE, handler);
    };

    /**
        healthData/logging OnNotifications
    */
    //telemetry
    LanguageClientWrapper.prototype.addOnTelemetryEvent = function (handler) {
        this._addOnNotificationHandler(ToolingInfo.SERVICE_EVENTS.TELEMETRY, handler);
    };

    /**
        textDocument OnNotifications
    */
    //onPublishDiagnostics
    LanguageClientWrapper.prototype.addOnDiagnostics = function (handler) {
        this._addOnNotificationHandler(ToolingInfo.SERVICE_EVENTS.DIAGNOSTICS, handler);
    };

    /**
        Window OnRequest
    */

    //showMessageRequest - handler must return promise
    LanguageClientWrapper.prototype.onShowMessageWithRequest = function (handler) {
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
    LanguageClientWrapper.prototype.notifyProjectRootsChanged = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.PROJECT_FOLDERS_CHANGED, params);
    };

    /**
        textDocument SendNotifications
    */
    //didOpenTextDocument
    LanguageClientWrapper.prototype.notifyTextDocumentOpened = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_OPENED, params);
    };

    //didCloseTextDocument
    LanguageClientWrapper.prototype.notifyTextDocumentClosed = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CLOSED, params);
    };

    //didChangeTextDocument
    LanguageClientWrapper.prototype.notifyTextDocumentChanged = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CHANGED, params);
    };

    //didSaveTextDocument
    LanguageClientWrapper.prototype.notifyTextDocumentSave = function (params) {
        this._notify(ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_SAVED, params);
    };

    /**
        Custom messages
     */

    //customNotification
    LanguageClientWrapper.prototype.sendCustomNotification = function (params) {
        this._notify(ToolingInfo.LANGUAGE_SERVICE.CUSTOM_NOTIFICATION, params);
    };

    //customRequest
    LanguageClientWrapper.prototype.sendCustomRequest = function (params) {
        return this._request(ToolingInfo.LANGUAGE_SERVICE.CUSTOM_REQUEST, params);
    };

    //Handling Brackets Events
    LanguageClientWrapper.prototype.addOnEditorChangeHandler = function (handler) {
        if (validateHandler(handler)) {
            this._onEventHandlers["activeEditorChange"].push(handler);
        }
    };

    LanguageClientWrapper.prototype.addOnProjectOpenHandler = function (handler) {
        if (validateHandler(handler)) {
            this._onEventHandlers["projectOpen"].push(handler);
        }
    };

    LanguageClientWrapper.prototype.addBeforeProjectCloseHandler = function (handler) {
        if (validateHandler(handler)) {
            this._onEventHandlers["beforeProjectClose"].push(handler);
        }
    };

    LanguageClientWrapper.prototype.addOnDocumentDirtyFlagChangeHandler = function (handler) {
        if (validateHandler(handler)) {
            this._onEventHandlers["dirtyFlagChange"].push(handler);
        }
    };

    LanguageClientWrapper.prototype.addOnDocumentChangeHandler = function (handler) {
        if (validateHandler(handler)) {
            this._onEventHandlers["documentChange"].push(handler);
        }
    };

    LanguageClientWrapper.prototype.addOnFileRenameHandler = function (handler) {
        if (validateHandler(handler)) {
            this._onEventHandlers["fileNameChange"].push(handler);
        }
    };

    LanguageClientWrapper.prototype.addOnCustomEventHandler = function (eventName, handler) {
        if (validateHandler(handler)) {
            if (!this._onEventHandlers[eventName]) {
                this._onEventHandlers[eventName] = [];
            }
            this._onEventHandlers[eventName].push(handler);
        }
    };

    LanguageClientWrapper.prototype.triggerEvent = function (event) {
        var eventName = event.type,
            eventArgs = arguments;

        if (this._onEventHandlers[eventName] && Array.isArray(this._onEventHandlers[eventName])) {
            var handlers = this._onEventHandlers[eventName];

            handlers.forEach(function (handler) {
                if (validateHandler(handler)) {
                    handler.apply(null, eventArgs);
                }
            });
        }
    };


    exports.LanguageClientWrapper = LanguageClientWrapper;
});
