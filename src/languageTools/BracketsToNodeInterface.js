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

/*eslint no-invalid-this: 0*/
define(function (require, exports, module) {


    function BracketsToNodeInterface(domain) {
        this.domain = domain;
        this.bracketsFn = {};

        this._registerDataEvent();
    }

    BracketsToNodeInterface.prototype._messageHandler = function (evt, params) {
        var methodName = params.method,
            self = this;

        function _getErrorString(err) {
            if (typeof err === "string") {
                return err;
            } else if (err && err.name && err.name === "Error") {
                return err.message;
            }
            return "Error in executing " + methodName;

        }

        function _sendResponse(response) {
            var responseParams = {
                requestId: params.requestId,
                params: response
            };
            self.domain.exec("response", responseParams);
        }

        function _sendError(err) {
            var responseParams = {
                requestId: params.requestId,
                error: _getErrorString(err)
            };
            self.domain.exec("response", responseParams);
        }

        if (self.bracketsFn[methodName]) {
            var method = self.bracketsFn[methodName];
            try {
                var response = method.call(null, params.params);
                if (params.respond && params.requestId) {
                    if (response.promise) {
                        response.done(function (result) {
                            _sendResponse(result);
                        }).fail(function (err) {
                            _sendError(err);
                        });
                    } else {
                        _sendResponse(response);
                    }
                }
            } catch (err) {
                if (params.respond && params.requestId) {
                    _sendError(err);
                }
            }
        }

    };


    BracketsToNodeInterface.prototype._registerDataEvent = function () {
        this.domain.on("data", this._messageHandler.bind(this));
    };

    BracketsToNodeInterface.prototype.createInterface = function (methodName, isAsync) {
        var self = this;
        return function (params) {
            var execEvent = isAsync ? "asyncData" : "data";
            var callObject = {
                method: methodName,
                params: params
            };
            return self.domain.exec(execEvent, callObject);
        };
    };

    BracketsToNodeInterface.prototype.registerMethod = function (methodName, methodHandle) {
        if (methodName && methodHandle &&
            typeof methodName === "string" && typeof methodHandle === "function") {
            this.bracketsFn[methodName] = methodHandle;
        }
    };

    BracketsToNodeInterface.prototype.registerMethods = function (methodList) {
        var self = this;
        methodList.forEach(function (methodObj) {
            self.registerMethod(methodObj.methodName, methodObj.methodHandle);
        });
    };

    exports.BracketsToNodeInterface = BracketsToNodeInterface;
});
