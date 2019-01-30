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
    
    var ToolingInfo     = brackets.getModule("languageTools/ToolingInfo"),
        ProjectManager  = brackets.getModule("project/ProjectManager");
    
    var messages = ToolingInfo.getMessages,
        capabilities = ToolingInfo.getCapabilities,
        nodeDomains = {},
        _currentNodeDomain = null,
        lastRequestForLanguageClient = {};

    
    function _createNodeDomain(domainName, domainPath)
    {
        return new nodeDomain(domainName, domainPath); ;
    }
    
    function registerLanguageClientDomain(domainPath) {
        //generate a random hash name for the domain, this is the client id
        var domainName = btoa(domainPath),
            result = $.Deferred(),
            languageClientDomain = _createNodeDomain(domainName, domainPath);
        
        if (languageClientDomain) {
            languageClientDomain.promise()
                .done(function () {
                    console.log(domainPath+ " domain successfully created");
                    nodeDomains[domainName] = languageClientDomain;
                    languageClientDomain.on('data', _processResponse);
                    result.resolve(domainName); 
                })
                .fail(function (err) {
                    console.error(domainPath+" domain could not be created.");
                    result.reject();
                });
        } else {
            console.error(domainPath+" domain could not be created.");
            result.reject();
        }
        
        return result;
    }
    
    
    
    /**
     * Constructs the message to be sent to the languageClient
     * @param {string} type [[Description]]
     */
    function constructMessage(type, ) {
        
    }
    
    function _processResponse(evt, params) {
        if (params.eventType === "onNotification") {
            switch (params.type) {
                 "logMessage": {
                     
                 },
                 "showMessage": {
                     
                 },
                 "telemetry": {
                     
                 },
                 "publishDiagnostics": {
                     
                 }
            }
        } else if (params.eventType === "onRequest") {
            switch (params.type) {
                    
            }
        }
    }
    
    function sendRequest() {
        
    }
    
    function registerEventHandler() {
        
    }
    
    function notify() {
        
    }
    
    function _getNodeDomain(domainId) {
        return nodeDomains[domainId];
    }
    
    function attachNotificationHandlers() {
        
    }
    
    function attachRequestHandlers() {
        
    }
    
    function startLanguageClient(clientId) {
        var result = $.Deferred(),
            clientDomain = _getNodeDomain(clientId);
        
        if (clientDomain) {
            clientDomain.exec("start", {
                clientId : clientId,
                type : messages.SERVER.INITIALIZE,
                params : {
                    rootPath : ProjectManager.getProjectRoot().fullPath,
                    capabilities: capabilities
                }
            })
            .done(function (result) {
                if (result) {
                    result.resolve({
                        clientId : clientId,
                        clientDomain : clientDomain
                    });
                } else {
                    result.reject();
                }
            })
            .fail(result.reject);
        } else {
            result.reject();
        }
        
        return result;
    }
    
    function initiateMessagingService(clientFilePath) {
        var result = $.Deferred();
        
        registerLanguageClientDomain(clientFilePath)
            .done(startLanguageClient)
            .done(result.resolve)
            .fail(result.reject);
        
        
        return result;
    }

});