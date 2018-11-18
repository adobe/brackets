


(function () {
 "use strict";

var child_process = require("child_process");

var isNodeDomainInitialized = {};
var _domainManager = null;
var _lspProcess = {};
var _serverName = null;
var _domainName = "lspServers";

function sendRequestToServer(serverName, method, params, messageId) {
    let message = {
        jsonrpc: "2.0",
        id: messageId,
        method: method,
        params: params
    };
    //console.log("sendReqToServer "+serverName+" "+message)
    _lspProcess[serverName].send(message);
};

function sendNotificationToServer(serverName, method, params) {
    let message = {
        jsonrpc: "2.0",
        method: method,
        params: params
    };

    //console.log("sendNotiToServer "+serverName+" "+message)
    _lspProcess[serverName].send(message);
};

function postMessageToBrackets(data) {
    _domainManager.emitEvent(_domainName, 'data', [data]);
};

function receiveRequestFromBrackets(msgObj) {
    //console.log("receiveReqFromBracket "+msgObj)
    sendRequestToServer(msgObj.serverName, msgObj.method,msgObj.param,msgObj.id);
    _lspProcess[msgObj.serverName].on('message', (json) => {
        //console.log(json);
        postMessageToBrackets({serverName: msgObj.serverName, method:msgObj.method, param:json});
    });
};

function receiveNotificationFromBrackets(msgObj) {
    //console.log("receiveNotifactionFromBracket "+msgObj.serverName+" "+msgObj.method+" "+msgObj.param)
    sendNotificationToServer(msgObj.serverName,msgObj.method,msgObj.param);
};

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
        //console.log(json);
        postMessageToBrackets({serverName: _serverName, method:"initialize", param:json});
    });
};

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
