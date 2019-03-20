"use strict";

var LanguageClient = require(global.LanguageClientInfo.languageClientPath).LanguageClient,
    path = require("path"),
    clientName = "CommunicationTestClient",
    client = null,
    modulePath = null,
    getPort = require("get-port"),
    relativeLSPathArray = ["..", "..", "server", "lsp-test-server", "main.js"],
    FORWARD_SLASH = "/",
    BACKWARD_SLASH = "\\",
    defaultPort = 3000;

function getServerOptionsForSocket() {
    return new Promise(function (resolve, reject) {
        var serverPath = modulePath.split(BACKWARD_SLASH)
            .join(FORWARD_SLASH).split(FORWARD_SLASH).concat(relativeLSPathArray)
            .join(FORWARD_SLASH);

        getPort({port: defaultPort})
            .then(function (port) {

                var serverOptions = {
                    module: serverPath,
                    communication: {
                        type: "socket",
                        port: port
                    }
                };
                resolve(serverOptions);
            })
            .catch(reject);

    });
}

function getServerOptions(type) {
    var serverPath = modulePath.split(BACKWARD_SLASH)
        .join(FORWARD_SLASH).split(FORWARD_SLASH).concat(relativeLSPathArray)
        .join(FORWARD_SLASH);

    serverPath = path.resolve(serverPath);

    var serverOptions = {
        module: serverPath,
        communication: type
    };

    return serverOptions;
}

function setModulePath(params) {
    modulePath = params.modulePath.slice(0, params.modulePath.length - 1);

    return Promise.resolve();
}

function setOptions(params) {
    if (!params || !params.communicationType) {
        return Promise.reject("Can't start server because no communication type provided");
    }
    
    var cType = params.communicationType,
        options = {
            serverOptions : getServerOptions(cType)
        };
    
    client.setOptions(options);
    
    return Promise.resolve("Server options set successfully");
}

function setOptionsForSocket() {
    return new Promise(function (resolve, reject) {
        getServerOptionsForSocket()
            .then(function (serverOptions) {
                var options = {
                    serverOptions: serverOptions
                };
                client.setOptions(options);

                resolve();
            }).catch(reject);
    });
}

function init(domainManager) {
    client = new LanguageClient(clientName, domainManager);
    client.addOnRequestHandler('setModulePath', setModulePath);
    client.addOnRequestHandler('setOptions', setOptions);
    client.addOnRequestHandler('setOptionsForSocket', setOptionsForSocket);
}

exports.init = init;
