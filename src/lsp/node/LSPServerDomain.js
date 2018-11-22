/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

(function () {
    "use strict";

    var child_process = require("child_process");
    var isNodeDomainInitialized = {};
    var _domainManager = null;
    var _lspProcess = {};
    var _serverName = null;
    var _domainName = "lspServers";


    /**
     * Send Request to LSP Server
     * @param   {String} serverName - server where message is to be sent
     * @param   {String} method - name of the method
     * @param   {Object} params - json object containg params associated with the method
     * @param   {String} messageId - Unique Id corresponding to the request made
     */
    function sendRequestToServer(serverName, method, params, messageId) {
        let message = {
            jsonrpc: "2.0",
            id: messageId,
            method: method,
            params: params
        };
        _lspProcess[serverName].send(message);
    };

    /**
     * Send Notification to LSP Server
     * @param   {String} serverName - server where message is to be sent
     * @param   {String} method - name of the method
     * @param   {Object} params - json object containg params associated with the method
     */
    function sendNotificationToServer(serverName, method, params) {
        let message = {
            jsonrpc: "2.0",
            method: method,
            params: params
        };
        _lspProcess[serverName].send(message);
    };

    /**
     * Send response from server to Brackets 
     * @param   {Object} data - response from server
     */
    function postMessageToBrackets(data) {
        _domainManager.emitEvent(_domainName, 'data', [data]);
    };

    /**
     * Communication channel for request/response between Brackets and LSP Server
     * @param   {Object} msgObj - Object containing information needs to be pass to the server
     */
    function receiveRequestFromBrackets(msgObj) {
        sendRequestToServer(msgObj.serverName, msgObj.method,msgObj.param,msgObj.id);
        _lspProcess[msgObj.serverName].on('message', (json) => {
            postMessageToBrackets({serverName: msgObj.serverName, method:msgObj.method, param:json});
        });
    };

    /**
     * Communication channel for notification from Brackets to LSP Server
     * @param   {Object} msgObj - Object containing information needs to be pass to the server
     */
    function receiveNotificationFromBrackets(msgObj) {
        sendNotificationToServer(msgObj.serverName,msgObj.method,msgObj.param);
    };

    /**
     * Send Request with the initilaization information to LSP Server
     * @param   {Object} initParam - Object containing all the inforamtion related to initialization request
     */
    function initialize(initParam) {
        let _serverName = initParam.serverName;
        let capabilities = initParam.capabilities;
        let rootPath = initParam.rootPath;
        sendRequestToServer(_serverName,"initialize", {
            rootPath: rootPath,
            processId: process.pid,
            capabilities: capabilities
        },-1);
        _lspProcess[_serverName].once('message', (json) => {
            postMessageToBrackets({serverName: _serverName, method:"initialize", param:json});
        });
    };

    /**
     * Register new LSP Server
     * @param   {Object} initParam - Object containg all the information related to initialization adn registration of the server
     */
    function registerLSPServer(initParam) {
        let serverName = initParam.serverName;
        let serverPath = initParam.serverPath;
        if (!isNodeDomainInitialized[serverName]) {
            
            _lspProcess[serverName] = child_process.fork(serverPath, ["--node-ipc"]);
        
            process.on('SIGINT', ()=>{process.exit()}); 
            process.on('SIGTERM', ()=>{process.exit()});
            process.on('exit', ()=>{_lspProcess[serverName].kill()});

            initialize(initParam);
            isNodeDomainInitialized[serverName] = true;
        }
    };

    /**
     * Initialize the domain with commands and events related to LSP
     * @param {DomainManager} domainManager - The DomainManager for LSP
     */
    function init(domainManager) {
        if (!domainManager.hasDomain(_domainName)) {
            domainManager.registerDomain(_domainName, {major: 0, minor: 1});
        }
        _domainManager = domainManager;
        _domainManager.registerCommand(
            _domainName,
            "registerLSPServer",
            registerLSPServer,
            true,
            "Initializes node for lsp",
            [
                {
                    name: "initObj",
                    type: "object",
                    description: "json object containing init information"
                }
            ],
            []
        );

        _domainManager.registerCommand(
            _domainName,
            "request",
            receiveRequestFromBrackets,
            true,
            "Receives request from brackets",
            [
                {
                    name: "msgObj",
                    type: "object",
                    description: "json object containing message info"
                }
            ],
            []
        );
        _domainManager.registerCommand(
            _domainName,
            "notification",
            receiveNotificationFromBrackets,
            true,
            "Receives notification from brackets",
            [
                {
                    name: "msgObj",
                    type: "object",
                    description: "json object containing message info"
                }
            ],
            []
        );
        _domainManager.registerEvent(
            _domainName,
            "data",
            [
                {
                    name: "msgObj",
                    type: "object",
                    description: "json object containing message info to pass to brackets"
                }
            ]
        );
    };

    exports.init = init;
})();
