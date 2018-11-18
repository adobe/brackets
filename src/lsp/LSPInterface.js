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

    function getNextReqId(serverName){
        if(!(serverName in _requestId)){
            _requestId[serverName] = 1;
            return 1;
        }
        return ++_requestId[serverName];
    }

    function receiveMessageFromServer(event, msgObj) {
        
        if(msgObj.param.method && _callbackList[msgObj.serverName+msgObj.param.method]){
            _callbackList[msgObj.serverName+msgObj.param.method](msgObj);
        }
        if($deferredResponse[msgObj.serverName+msgObj.method+msgObj.param.id]){
            $deferredResponse[msgObj.serverName+msgObj.method+msgObj.param.id].resolve(msgObj);
        }
    }
    
    function registerCallback(serverName, method, callback){
        _callbackList[serverName+method] = callback;
    }

    function postRequest(serverName, msgObj) {
        msgObj.id  = getNextReqId(serverName);
        $deferredResponse[serverName+msgObj.method+msgObj.id] = $.Deferred();
        msgObj.serverName = serverName;
        _serverDomain.exec('request', msgObj);
        return $deferredResponse[serverName+msgObj.method+msgObj.id];
    }

    function postNotification(serverName, msgObj) {
        msgObj.serverName = serverName;
        _serverDomain.exec('notification', msgObj);
    }

    function registerLSPServer(msgObj){
        _serverDomain.exec('registerLSPServer',msgObj);
    }

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