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

    var MessageHandler = require("languageTools/MessageHandler"),
        ToolingInfo = JSON.parse(require("text!languageTools/ToolingInfo.json"));

    function LanguageClientProxy(name, path, domainInterface) {
        this._name = name;
        this._path = path;
        this._domainInterface = domainInterface;
        this._startClient = null;
        this._stopClient = null;
        this._notifyClient = null;
        this._requestClient = null;

        this._init();
    }

    /**
        Requests
    */
    LanguageClientProxy.prototype.start = function (params) {
        var params = MessageHandler.constructRequestParams(ToolingInfo.LANGUAGE_SERVICE.START, params);
        return this._startClient(params);
    }

    LanguageClientProxy.prototype._init = function () {
        this._domainInterface.registerMethods([
            {
                methodName: ToolingInfo.LANGUAGE_SERVICE.REQUEST,
                methodHandle: this._onRequestHandler.bind(this)
            },
            {
                methodName: ToolingInfo.LANGUAGE_SERVICE.NOTIFY,
                methodHandle: this._onNotificationHandler.bind(this)
            }
        ]);

        //create function interfaces for Client Domain
        this._startClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.START, true);
        this._stopClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.STOP);
        this._notifyClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.NOTIFY);
        this._requestClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.REQUEST, true);
    }

    LanguageClientProxy.prototype._onRequestHandler = function () {

    };

    LanguageClientProxy.prototype._onNotificationHandler = function () {

    };

    //shutdown
    LanguageClientProxy.prototype.stop = function () {
        return this._stopClient();
    };

    //cancelRequest
    LanguageClientProxy.prototype.cancelRequest = function () {

    };

    //customRequest
    LanguageClientProxy.prototype.customRequest = function () {

    };

    /**
        textDocument requests
    */
    //completion
    LanguageClientProxy.prototype.requestHints = function () {

    };

    //completionItemResolve
    LanguageClientProxy.prototype.getAdditionalInfoForHint = function () {

    };

    //hover
    LanguageClientProxy.prototype.requestHoverHints = function () {

    };

    //signatureHelp
    LanguageClientProxy.prototype.requestParameterHints = function () {

    };

    //gotoDefinition
    LanguageClientProxy.prototype.gotoDefinition = function () {

    };

    //gotoDeclaration
    LanguageClientProxy.prototype.gotoDeclaration = function () {

    };

    //gotoImplementation
    LanguageClientProxy.prototype.gotoImplementation = function () {

    };

    //findReferences
    LanguageClientProxy.prototype.findReferences = function () {

    };

    //documentHighlight
    LanguageClientProxy.prototype.resolveHighlightsForPos = function () {

    };

    //documentSymbol
    LanguageClientProxy.prototype.requestSymbols = function () {

    };

    /**
        workspace requests
    */
    //workspaceSymbol
    LanguageClientProxy.prototype.requestSymbolsForWorkspace = function () {

    };

    /*
        Unimplemented Requests
            textDocument
              codeAction
              codeLens
                codeLensResolve
              documentLink
                documentLinkResolve
              documentFormatting
                  onTypeDocumentFormatting
                  rangeDocumentFormatting
              rename
              prepareRename
              foldingRange

            client
                registerCapability
                unregisterCapability

            workspace
                executeCommand (codeAction, codeLens) - response is applyEdit
    */

    //These will mostly be callbacks/[done-fail](promises)
    /**
        Window OnNotifications
    */
    //showMessage
    LanguageClientProxy.prototype.onShowMessage = function () {

    };

    //showMessageRequest
    LanguageClientProxy.prototype.onShowMessageWithRequest = function () {

    };

    //logMessage
    LanguageClientProxy.prototype.onLogMessage = function () {

    };

    /**
        healthData/logging OnNotifications
    */
    //telemetry
    LanguageClientProxy.prototype.onLoggingInfoEvent = function () {

    };

    /**
        textDocument OnNotifications
    */
    //onPublishDiagnostics
    LanguageClientProxy.prototype.onDiagnostics = function () {

    };

    /**
        workspace OnNotifications
    */
    //getConfiguration
    LanguageClientProxy.prototype.onConfigurationRequest = function () {

    };

    //getWorkspaceFolders
    LanguageClientProxy.prototype.onWorkspaceFoldersRequest = function () {

    };

    /*
        Unimplemented OnNotifications
            workspace
                applyEdit (codeAction, codeLens)
    */

    /**
        SendNotifications
    */
    //exit
    LanguageClientProxy.prototype.exitToolingServive = function () {

    };

    //customNotification
    LanguageClientProxy.prototype.sendCustomNotification = function () {

    };


    /**
        workspace SendNotifications
    */
    //didChangeWorkspaceFolders
    LanguageClientProxy.prototype.notifyWorkspaceFoldersChanged = function () {

    };

    //didChangeConfiguration
    LanguageClientProxy.prototype.notifyConfigurationChanged = function () {

    };

    //didChangeWatchedFiles
    LanguageClientProxy.prototype.notifyWatchedFilesChanged = function () {

    };


    /**
        textDocument SendNotifications
    */
    //didOpenTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentOpened = function () {

    };

    //didCloseTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentClosed = function () {

    };

    //didChangeTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentChanged = function () {

    };

    //willSaveTextDocument
    LanguageClientProxy.prototype.notifyDocumentSaveEvent = function () {

    };

    //willSaveWaitUntilTextDocument
    LanguageClientProxy.prototype.notifyDocumentSaveEventWithWait = function () {

    };

    //didSaveTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentSave = function () {

    };

    function intiateToolingService(clientName, clientFilePath) {
        var result = $.Deferred();

        MessageHandler.initiateLanguageClient(clientName, clientFilePath)
            .done(function (languageClientInfo) {
                var languageClient = new LanguageClientProxy(languageClientInfo.name, clientFilePath, languageClientInfo.interface);

                result.resolve(languageClient);
            })
            .fail(result.reject);

        return result;
    }

    exports.intiateToolingService = intiateToolingService;
});
