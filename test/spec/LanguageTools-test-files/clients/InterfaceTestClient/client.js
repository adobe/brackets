/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
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
/*eslint-env es6, node*/
/*eslint max-len: ["error", { "code": 200 }]*/
/*eslint indent: 0*/
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
