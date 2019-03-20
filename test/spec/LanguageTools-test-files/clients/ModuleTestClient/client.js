"use strict";

var LanguageClient = require(global.LanguageClientInfo.languageClientPath).LanguageClient,
    path = require("path"),
    clientName = "ModuleTestClient",
    client = null,
    modulePath = null,
    relativeLSPathArray = ["..", "..", "server", "lsp-test-server", "main.js"],
    FORWARD_SLASH = "/",
    BACKWARD_SLASH = "\\";

function getServerOptions() {
    var serverPath = modulePath.split(BACKWARD_SLASH)
        .join(FORWARD_SLASH).split(FORWARD_SLASH).concat(relativeLSPathArray)
        .join(FORWARD_SLASH);

    serverPath = path.resolve(serverPath);

    var serverOptions = {
        module: serverPath //node should fork this
    };

    return serverOptions;
}

function setModulePath(params) {
    modulePath = params.modulePath.slice(0, params.modulePath.length - 1);

    return Promise.resolve();
}

function setOptions(params) {
    var options = {
        serverOptions: getServerOptions()
    };
    
    client.setOptions(options);
    
    return Promise.resolve("Server options set successfully");
}

function init(domainManager) {
    client = new LanguageClient(clientName, domainManager);
    client.addOnRequestHandler('setModulePath', setModulePath);
    client.addOnRequestHandler('setOptions', setOptions);
}

exports.init = init;
