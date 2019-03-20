"use strict";

var LanguageClient = require(global.LanguageClientInfo.languageClientPath).LanguageClient,
    clientName = "LoadSimpleClient";

function init(domainManager) {
    var client = new LanguageClient(clientName, domainManager);
}

exports.init = init;
