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
/*eslint max-len: ["error", { "code": 200 }]*/
/*eslint indent: 0*/
define(function (require, exports, module) {
    "use strict";

    var LanguageTools = brackets.getModule("languageTools/LanguageTools"),
        AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils");

    var clientFilePath = ExtensionUtils.getModulePath(module, "client.js"),
        clientName = "OptionsTestClient",
        clientPromise = null,
        client = null;

    AppInit.appReady(function () {
        clientPromise = LanguageTools.initiateToolingService(clientName, clientFilePath, ['unknown']);
    });

    exports.initExtension = function () {
        var retval = $.Deferred();

        if ($.isFunction(clientPromise.promise)) {
            clientPromise.then(function (textClient) {
                client = textClient;

                client.sendCustomRequest({
                    messageType: "brackets",
                    type: "setModulePath",
                    params: {
                        modulePath: ExtensionUtils.getModulePath(module)
                    }
                }).then(retval.resolve);


            }, retval.reject);
        } else {
            retval.reject();
        }

        return retval;
    };

    exports.getClient = function () {
        return client;
    };
});
