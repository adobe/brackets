
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

 define(function (require, exports, module) {
    "use strict";
    var NodeDomain              = require("utils/NodeDomain"),
    AppInit                     = require("utils/AppInit"),
    ExtensionUtils              = require("utils/ExtensionUtils"),
    FileUtils                   = require("file/FileUtils");

    var lspServerList = [];
    var serverDomainList = {};
    var $deferredResponse = {};
    var _domainName = "lspServers";
    var _serverDomain = null;
    var _bracketsPath   = FileUtils.getNativeBracketsDirectoryPath(),
        _modulePath = FileUtils.getNativeModuleDirectoryPath(module),
        _nodePath = "node/LSPServerDomain",
        _domainPath = [_bracketsPath, _modulePath, _nodePath].join("/");
    var _callbackList = {};
    var _requestId = {};

    /**
     * Get Unique request id for the request being made to LSP Server
     * @param   {String} serverName - server where message is to be sent
     * @returns {Number} requestId - requestId to be associated with the request
     */
    function getNextReqId(serverName){
        if(!(serverName in _requestId)){
            _requestId[serverName] = 1;
            return 1;
        }
        return ++_requestId[serverName];
    }

    /**
     * Receive any response/notification from the LSP server
     * @param {Object}  event  - event received from node
     * @param {Object}  msgObj - json containing - {
     *                          serverName - name of the LSP server which sent the message
     *                          param - Content of the message
     */
    function receiveMessageFromServer(event, msgObj) {
        
        if(msgObj.param.method && _callbackList[msgObj.serverName+msgObj.param.method]){
            _callbackList[msgObj.serverName+msgObj.param.method](msgObj);
        }
        if($deferredResponse[msgObj.serverName+msgObj.param.id]){
            $deferredResponse[msgObj.serverName+msgObj.param.id].resolve(msgObj);
        }
    }
    
    /**
     * Register Callback funtion for response to any custom request made to server
     * @param   {String} serverName - server where message is to be sent
     * @param   {String} method - name of the method
     * @param   {Function} callback - callback function
     */
    function registerCallback(serverName, method, callback){
        _callbackList[serverName+method] = callback;
    }

    /**
     * Send Request to LSP Server
     * @param   {String} serverName - server where message is to be sent
     * @param   {Object} msgObj - json object containg information associated with the request
     * @returns {Object} $deffered Object  
     */
    function postRequest(serverName, msgObj) {
        msgObj.id  = getNextReqId(serverName);
        $deferredResponse[serverName+msgObj.id] = $.Deferred();
        msgObj.serverName = serverName;
        _serverDomain.exec('request', msgObj);
        return $deferredResponse[serverName+msgObj.id];
    }

    /**
     * Send Notification to LSP Server
     * @param   {String} serverName - server where message is to be sent
     * @param   {Object} msgObj - json object containg information associated with the notification
     */
    function postNotification(serverName, msgObj) {
        msgObj.serverName = serverName;
        _serverDomain.exec('notification', msgObj);
    }

    /**
     * Register the LSP Server
     * @param   {Object} msgObj - Object containg information associated with the registration
     */
    function registerLSPServer(msgObj){
        _serverDomain.exec('registerLSPServer',msgObj);
    }

    /**
     * Overriding the appReady for LSPInterface
     */
    AppInit.appReady(function () {
        var serverDomain = new NodeDomain(_domainName, _domainPath);
        if(!serverDomain){
            return;
        }
        // Check if the update domain is properly initialised
        serverDomain.promise()
             .done(function () {
                 console.log(_domainName+ " domain successfully created");
                 serverDomain.on('data', receiveMessageFromServer);
            })
             .fail(function (err) {
                console.error(_domainName+" domain could not be created.");
                return;
            });
        _serverDomain = serverDomain;
    });

    exports.registerLSPServer = registerLSPServer;
    exports.postNotification = postNotification;
    exports.postRequest = postRequest;
    exports.registerCallback = registerCallback;
});