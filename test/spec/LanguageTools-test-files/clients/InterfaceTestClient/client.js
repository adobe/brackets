"use strict";

var LanguageClient = require(global.LanguageClientInfo.languageClientPath).LanguageClient,
    clientName = "InterfaceTestClient",
    client = null;

function notificationMethod(params) {
    switch (params.action) {
        case 'acknowledgement':
            {
                client._notifyBrackets({
                    type: "acknowledge",
                    params: {
                        acknowledgement: true,
                        clientName: clientName
                    }
                });
                break;
            }
        case 'nodeSyncRequest':
            {
                var syncRequest = client._requestBrackets({
                    type: "nodeSyncRequest",
                    params: {
                        syncRequest: true,
                        clientName: clientName
                    }
                });

                syncRequest.then(function (value) {
                    client._notifyBrackets({
                        type: "validateSyncRequest",
                        params: {
                            syncRequestResult: value,
                            clientName: clientName
                        }
                    });
                });
                break;
            }
        case 'nodeAsyncRequestWhichResolves':
            {
                var asyncRequestS = client._requestBrackets({
                    type: "nodeAsyncRequestWhichResolves",
                    params: {
                        asyncRequest: true,
                        clientName: clientName
                    }
                });

                asyncRequestS.then(function (value) {
                    client._notifyBrackets({
                        type: "validateAsyncSuccess",
                        params: {
                            asyncRequestResult: value,
                            clientName: clientName
                        }
                    });
                });
                break;
            }
        case 'nodeAsyncRequestWhichFails':
            {
                var asyncRequestE = client._requestBrackets({
                    type: "nodeAsyncRequestWhichFails",
                    params: {
                        asyncRequest: true,
                        clientName: clientName
                    }
                });

                asyncRequestE.catch(function (value) {
                    client._notifyBrackets({
                        type: "validateAsyncFail",
                        params: {
                            asyncRequestError: value,
                            clientName: clientName
                        }
                    });
                });
                break;
            }
    }
}

function requestMethod(params) {
    switch (params.action) {
        case 'resolve':
            {
                return Promise.resolve("resolved");
            }
        case 'reject':
            {
                return Promise.reject("rejected");
            }
    }
}

function init(domainManager) {
    client = new LanguageClient(clientName, domainManager);
    client.addOnNotificationHandler("notificationMethod", notificationMethod);
    client.addOnRequestHandler('requestMethod', requestMethod);
}

exports.init = init;
