/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define: false, describe: false, it: false, expect: false, spyOn: false, runs: false, waitsForDone: false, waitsForFail: false, beforeEach: false, afterEach: false */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var ExtensionLoader = require("utils/ExtensionLoader"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils");

    var testPath = SpecRunnerUtils.getTestPath("/spec/ExtensionLoader-test-files");

    describe("ExtensionLoader", function () {

        var origTimeout;

        function testLoadExtension(name, promiseState, error) {
            var promise,
                config = {
                    baseUrl: testPath + "/" + name
                },
                consoleErrors = [];

            runs(function () {
                var originalConsoleErrorFn = console.error;
                spyOn(console, "error").andCallFake(function () {
                    originalConsoleErrorFn.apply(console, arguments);

                    if (typeof arguments[0] === "string" &&
                        arguments[0].indexOf("[Extension]") === 0) {
                        consoleErrors.push(Array.prototype.join.call(arguments));
                    }
                });
                promise = ExtensionLoader.loadExtension(name, config, "main");

                if (error) {
                    waitsForFail(promise, "loadExtension", 10000);
                } else {
                    waitsForDone(promise, "loadExtension");
                }
            });

            runs(function () {
                if (error) {
                    if (typeof error === "string") {
                        expect(consoleErrors[0]).toBe(error);
                    } else {
                        expect(consoleErrors[0]).toMatch(error);
                    }
                } else {
                    expect(consoleErrors).toEqual([]);  // causes console errors to be logged in test failure message
                }

                expect(promise.state()).toBe(promiseState);
            });
        }

        beforeEach(function () {
            runs(function () {
                origTimeout = ExtensionLoader._getInitExtensionTimeout();
                ExtensionLoader._setInitExtensionTimeout(500);
            });
        });

        afterEach(function () {
            runs(function () {
                ExtensionLoader._setInitExtensionTimeout(origTimeout);
            });
        });

        it("should load a basic extension", function () {
            testLoadExtension("NoInit", "resolved");
        });

        it("should load a basic extension with sync init", function () {
            testLoadExtension("InitResolved", "resolved");
        });

        it("should load a basic extension with async init", function () {
            testLoadExtension("InitResolvedAsync", "resolved");
        });

        it("should load a basic extension that uses requirejs-config.json", function () {
            runs(function () {
                spyOn(console, "log").andCallThrough();
            });

            testLoadExtension("RequireJSConfig", "resolved");

            runs(function () {
                expect(console.log.mostRecentCall.args[0]).toBe("bar_exported");
            });
        });

        it("should log an error if an extension fails to init", function () {
            testLoadExtension("InitFail", "rejected", "[Extension] Error -- failed initExtension for InitFail");
        });

        it("should log an error with a message if an extension fails to sync init", function () {
            testLoadExtension("InitFailWithError", "rejected", "[Extension] Error -- failed initExtension for InitFailWithError: Didn't work");
        });

        it("should log an error with a message if an extension fails to async init", function () {
            testLoadExtension("InitFailWithErrorAsync", "rejected", "[Extension] Error -- failed initExtension for InitFailWithErrorAsync: Didn't work");
        });

        it("should log an error if an extension init fails with a timeout", function () {
            testLoadExtension("InitTimeout", "rejected", "[Extension] Error -- timeout during initExtension for InitTimeout");
        });

        it("should log an error if an extension init fails with a runtime error", function () {
            testLoadExtension("InitRuntimeError", "rejected", "[Extension] Error -- error thrown during initExtension for InitRuntimeError: ReferenceError: isNotDefined is not defined");
        });

        it("should log an error if an extension fails during RequireJS loading", function () {
            testLoadExtension("BadRequire", "rejected", /\[Extension\] failed to load.*BadRequire.* - Module does not exist: .*BadRequire\/notdefined\.js/);
        });

        it("should log an error if an extension uses an invalid requirejs-config.json", function () {
            testLoadExtension("BadRequireConfig", "rejected", /\[Extension\] failed to load.*BadRequireConfig.*failed to parse requirejs-config.json/);
        });

    });
});
