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

/*global require, Promise, exports*/
/*eslint no-invalid-this: 0*/
/*eslint max-len: ["error", { "code": 200 }]*/
(function () {

    "use strict";

    var EventEmitter = require("events"),
        bracketsEventHandler = new EventEmitter();

    /** https://gist.github.com/LeverOne/1308368 */
    /*eslint-disable */
    function _generateUUID() {
        var result,
            numericSeed;
        for (
            result = numericSeed = '';
            numericSeed++ < 36;
            result += numericSeed * 51 & 52 ? (numericSeed ^ 15 ? 8 ^ Math.random() * (numericSeed ^ 20 ? 16 : 4) : 4).toString(16) : '-'
        );

        return result;
    }
    /*eslint-enable */

    function NodeToBracketsInterface(domainManager, domainName) {
        this.domainManager = domainManager;
        this.domainName = domainName;
        this.nodeFn = {};

        this._registerDataEvents();
    }

    NodeToBracketsInterface.prototype.processRequest = function (params) {
        var methodName = params.method;
        if (this.nodeFn[methodName]) {
            var method = this.nodeFn[methodName];
            return method.call(null, params.params);
        }
    };

    NodeToBracketsInterface.prototype.processAsyncRequest = function (params, resolver) {
        var methodName = params.method;
        if (this.nodeFn[methodName]) {
            var method = this.nodeFn[methodName];
            method.call(null, params.params) //The Async function should return a promise
                .then(function (result) {
                    resolver(null, result);
                }).catch(function (err) {
                    resolver(err, null);
                });
        }
    };

    NodeToBracketsInterface.prototype.processResponse = function (params) {
        if (params.requestId) {
            if (params.error) {
                bracketsEventHandler.emit(params.requestId, params.error);
            } else {
                bracketsEventHandler.emit(params.requestId, false, params.params);
            }
        } else {
            bracketsEventHandler.emit(params.requestId, "error");
        }
    };

    NodeToBracketsInterface.prototype.createInterface = function (methodName, respond) {
        var self = this;
        return function (params) {
            var callObject = {
                method: methodName,
                params: params
            };

            var retval = undefined;
            if (respond) {
                var requestId = _generateUUID();

                callObject["respond"] = true;
                callObject["requestId"] = requestId;

                self.domainManager.emitEvent(self.domainName, "data", callObject);

                retval = new Promise(function (resolve, reject) {
                    bracketsEventHandler.once(requestId, function (err, response) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(response);
                        }
                    });
                });
            } else {
                self.domainManager.emitEvent(self.domainName, "data", callObject);
            }
            return retval;
        };
    };

    NodeToBracketsInterface.prototype.registerMethod = function (methodName, methodHandle) {
        var self = this;
        if (methodName && methodHandle &&
            typeof methodName === "string" && typeof methodHandle === "function") {
            self.nodeFn[methodName] = methodHandle;
        }
    };

    NodeToBracketsInterface.prototype.registerMethods = function (methodList) {
        var self = this;
        methodList.forEach(function (methodObj) {
            self.registerMethod(methodObj.methodName, methodObj.methodHandle);
        });
    };

    NodeToBracketsInterface.prototype._registerDataEvents = function () {
        if (!this.domainManager.hasDomain(this.domainName)) {
            this.domainManager.registerDomain(this.domainName, {
                major: 0,
                minor: 1
            });
        }

        this.domainManager.registerCommand(
            this.domainName,
            "data",
            this.processRequest.bind(this),
            false,
            "Receives sync request from brackets",
            [
                {
                    name: "params",
                    type: "object",
                    description: "json object containing message info"
                }
            ],
            []
        );

        this.domainManager.registerCommand(
            this.domainName,
            "response",
            this.processResponse.bind(this),
            false,
            "Receives response from brackets for an earlier request",
            [
                {
                    name: "params",
                    type: "object",
                    description: "json object containing message info"
                }
            ],
            []
        );

        this.domainManager.registerCommand(
            this.domainName,
            "asyncData",
            this.processAsyncRequest.bind(this),
            true,
            "Receives async call request from brackets",
            [
                {
                    name: "params",
                    type: "object",
                    description: "json object containing message info"
                },
                {
                    name: "resolver",
                    type: "function",
                    description: "callback required to resolve the async request"
                }
            ],
            []
        );

        this.domainManager.registerEvent(
            this.domainName,
            "data",
            [
                {
                    name: "params",
                    type: "object",
                    description: "json object containing message info to pass to brackets"
                }
            ]
        );
    };

    exports.NodeToBracketsInterface = NodeToBracketsInterface;
}());
