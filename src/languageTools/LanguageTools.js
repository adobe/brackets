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
    
    var MessageHandler =  require("languageTools/MessageTools");
    
    function LanguageClientProxy(name, path, domain) {
        var _domain = domain,
            _name = name,
            _path = path;
    }
    
    /*
        RequestParams creator - sendNotifications/request
    */

    /*
        ReponseParams transformer - used by OnNotifications
    */
    
    /**
        Requests
    */
    LanguageClientProxy.prototype.start = function() {
        var self = this;
        
        MessageHandler.startLanguageClient(this)
            .done(function() {
                console.log("Language client started successfully for path : ", self._path);
            })
            .fail(function() {
                console.error("Couldn't start language client for path : ", self._path)
            })
    }
    
    //shutdown
    LanguageClientProxy.prototype.shutdownToolingServive = function() {
    
    }
    
    //cancelRequest
    LanguageClientProxy.prototype.cancelRequest = function() {
    
    }
    
    //customRequest
    LanguageClientProxy.prototype.customRequest = function() {
    
    }
    
    /**
        textDocument requests
    */
    //completion
    LanguageClientProxy.prototype.requestHints = function() {
    
    }
    
    //completionItemResolve
    LanguageClientProxy.prototype.getAdditionalInfoForHint = function () {
        
    }
    
    //hover
    LanguageClientProxy.prototype.requestHoverHints = function() {
    
    }
    
    //signatureHelp
    LanguageClientProxy.prototype.requestParameterHints = function() {
    
    }
    
    //gotoDefinition
    LanguageClientProxy.prototype.gotoDefinition = function() {
    
    }
    
    //gotoDeclaration
    LanguageClientProxy.prototype.gotoDeclaration = function() {
    
    }
    
    //gotoImplementation
    LanguageClientProxy.prototype.gotoImplementation = function() {
    
    }
    
    //findReferences
    LanguageClientProxy.prototype.findReferences = function() {
    
    }
    
    //documentHighlight
    LanguageClientProxy.prototype.resolveHighlightsForPos = function() {
    
    }
    
    //documentSymbol
    LanguageClientProxy.prototype.requestSymbols = function() {
    
    }
    
    /**
        workspace requests
    */
    //workspaceSymbol
    LanguageClientProxy.prototype.requestSymbolsForWorkspace = function() {
    
    }
    
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
    LanguageClientProxy.prototype.onShowMessage = function() {
    
    }
    
    //showMessageRequest
    LanguageClientProxy.prototype.onShowMessageWithRequest = function() {
    
    }
    
    //logMessage
    LanguageClientProxy.prototype.onLogMessage = function() {
    
    }
    
    /**
        healthData/logging OnNotifications
    */
    //telemetry
    LanguageClientProxy.prototype.onLoggingInfoEvent = function() {
    
    }
    
    /**
        textDocument OnNotifications
    */
    //onPublishDiagnostics
    LanguageClientProxy.prototype.onDiagnostics = function() {
    
    }
    
    /**
        workspace OnNotifications
    */
    //getConfiguration
    LanguageClientProxy.prototype.onConfigurationRequest = function() {
        
    }
    
    //getWorkspaceFolders
    LanguageClientProxy.prototype.onWorkspaceFoldersRequest = function() {
        
    }

    /*
        Unimplemented OnNotifications
            workspace
                applyEdit (codeAction, codeLens)
    */
    
    /**
        SendNotifications
    */
    //exit
    LanguageClientProxy.prototype.exitToolingServive = function() {
        
    }
    
    //customNotification
    LanguageClientProxy.prototype.sendCustomNotification = function() {
        
    }
    
    
    /**
        workspace SendNotifications
    */
    //didChangeWorkspaceFolders
    LanguageClientProxy.prototype.notifyWorkspaceFoldersChanged = function() {
        
    }
    
    //didChangeConfiguration
    LanguageClientProxy.prototype.notifyConfigurationChanged = function() {
        
    }
    
    //didChangeWatchedFiles
    LanguageClientProxy.prototype.notifyWatchedFilesChanged = function() {
        
    }
    
    
    /**
        textDocument SendNotifications
    */
    //didOpenTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentOpened = function() {
        
    }
    
    //didCloseTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentClosed = function() {
        
    }
    
    //didChangeTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentChanged = function() {
        
    }
    
    //willSaveTextDocument
    LanguageClientProxy.prototype.notifyDocumentSaveEvent = function() {
        
    }
    
    //willSaveWaitUntilTextDocument
    LanguageClientProxy.prototype.notifyDocumentSaveEventWithWait = function() {
        
    }
    
    //didSaveTextDocument
    LanguageClientProxy.prototype.notifyTextDocumentSave = function() {
        
    }
    
    
    //Miscellaneous APIs
    /*
        initialize
        initialized //has to be sent before other request
        
        Server related APIs (masked as service)
            restart all services
            restart a service
            project root change 
    */
    function intiateToolingService(clientFilePath) {
        /*dependencyInjection For LanguageClient
            create node domain with
                - fileFilePath //full file path, will createLanguageClient
                - ToolingService for Type (or infer),
                - OptionsFile //full file Path
        */
        var result = $.Deferred();
        
        MessageHandler.initiateMessagingService(clientFilePath)
            .done(function (clientInfo) {
                var languageClient = new LanguageClientProxy(clientInfo.clientId, clientFilePath, clientInfo.clientDomain); 
                result.resolve(languageClient);
            })
            .fail(result.reject);
        
        return result;
    }

});
