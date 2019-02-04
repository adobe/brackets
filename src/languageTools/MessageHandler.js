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
    
    var ToolingInfo     = JSON.parse(require("text!languageTools/ToolingInfo.json")),
        NodeDomain = require("utils/NodeDomain"),
        BracketsToNodeInterface = require("languageTools/Interface/nodeInterface").BracketsToNodeInterface,
        ProjectManager  = require("project/ProjectManager");
    
    var messages = ToolingInfo.getMessages,
        capabilities = ToolingInfo.getCapabilities,
        nodeDomains = {},
        nodeInterfaces = {},
        _currentNodeDomain = null,
        lastRequestForLanguageClient = {};

    
    function _createNodeDomain(domainName, domainPath)
    {
        return new NodeDomain(domainName, domainPath); ;
    }
    
    /*
        RequestParams creator - sendNotifications/request
    */
    function constructRequestParams(type, params) {
        var jsonParams = {},
            params = params ? params :{};
        
        switch (type) {
            case ToolingInfo.LANGUAGE_SERVICE.START : {
                jsonParams = {
                    rootPath : ProjectManager.getProjectRoot().fullPath,
                    capabilities : params.capabilities ? params.capabilities : false
                }
                break;
            }
        }
        
        return jsonParams;
    }

    /*
        ReponseParams transformer - used by OnNotifications
    */
    function constructNotificationParams(type) {
        
    }
    
    function loadLanguageClientDomain(clientName, domainPath) {
        //generate a random hash name for the domain, this is the client id
        var domainName = clientName,
            result = $.Deferred(),
            languageClientDomain = _createNodeDomain(domainName, domainPath);
        
        if (languageClientDomain) {
            languageClientDomain.promise()
                .done(function () {
                    console.log(domainPath+ " domain successfully created");
                    result.resolve(languageClientDomain); 
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
    
    function createNodeInterfaceForDomain(languageClientDomain) {
        var nodeInterface = new BracketsToNodeInterface(languageClientDomain);

        return nodeInterface; 
    }
    
    function registerLanguageClientInterface(domainName, languageClientInterface) {
        nodeInterfaces[domainName] = languageClientInterface;
    }
    
    function registerLanguageClientDomain(domainName, languageClientDomain) {
        nodeDomains[domainName] = languageClientDomain;
    }
    
    function _getNodeDomain(domainName) {
        return nodeDomains[domainName];
    }
    
    function _getNodeInterface(domainName) {
        return nodeInterfaces[domainName];
    }
    
    function initiateLanguageClient(clientName, clientFilePath) {
        var result = $.Deferred();
        
        loadLanguageClientDomain(clientName, clientFilePath)
            .then(function (languageClientDomain) {
                var languageClientInterface = createNodeInterfaceForDomain(languageClientDomain);
            
                registerLanguageClientDomain(clientName, languageClientDomain);
                registerLanguageClientInterface(clientName, languageClientInterface);
            
                result.resolve({
                    name : clientName,
                    interface: languageClientInterface
                });
            }, result.reject);
        
        return result;
    }

    exports.initiateLanguageClient = initiateLanguageClient;
    exports.constructRequestParams = constructRequestParams;
    exports.constructNotificationParams = constructNotificationParams;
});