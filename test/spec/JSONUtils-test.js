/*
 * Copyright (c) 2015 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, beforeEach, afterEach, it, expect */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils        = require("spec/SpecRunnerUtils"),
        JSONUtils            = require("language/JSONUtils");

    describe("JSONUtils", function () {
        var mockEditor, testContent, testDocument, testEditor, ctxInfo;

        // A sample preferences file to run tests against.
        testContent =   "{\n" +
                        "    \"closeBrackets\": true,\n" +
                        "    \"insertHintOnTab\": false,\n" +
                        "    \"language.fileExtensions\": {\n" +
                        "        \"txt\": \"markdown\"\n" +
                        "    },\n" +
                        "    \"language.fileNames\": {\n" +
                        "        \"README.txt\": \"markdown\"\n" +
                        "    },\n" +
                        "    \"language\": {\n" +
                        "        \"javascript\": {\n" +
                        "            \"spaceUnits\": 4,\n" +
                        "            \"useTabChar\": false\n" +
                        "        },\n" +
                        "        \"php\": {\n" +
                        "            \"tabSize\": 4,\n" +
                        "            \"useTabChar\":true,\n" +
                        "            \"closeBrackets\":false\n" +
                        "        }\n" +
                        "    },\n" +
                        "    \"jslint.options\": {\n" +
                        "        \"devel\": true,\n" +
                        "        \"regexp\": tru\n" +
                        "    },\n" +
                        "    \"linting.prefer\": [\"JSHint\",\"JSLint\"],\n" +
                        "    \n" +
                        "    \"linting.usePreferredOnly\" false," +
                        "    \n" +
                        "}";

        beforeEach(function () {
            mockEditor = SpecRunnerUtils.createMockEditor(testContent, "json", {
                startLine: 0,
                endLine: 30
            });
            testEditor = mockEditor.editor;
            testDocument = mockEditor.doc;
        });
        afterEach(function () {
            testEditor.destroy();
            testDocument = null;
            ctxInfo = null;
        });

        function expectContextInfo(ctxInfo, expectedContextInfo) {
            expect(ctxInfo.token).not.toBe(null);
            expect(ctxInfo.tokenType).toBe(expectedContextInfo.tokenType);
            expect(ctxInfo.offset).toBe(expectedContextInfo.offset);
            expect(ctxInfo.keyName).toBe(expectedContextInfo.keyName);
            expect(ctxInfo.valueName).toBe(expectedContextInfo.valueName);
            expect(ctxInfo.parentKeyName).toBe(expectedContextInfo.parentKeyName);
            expect(ctxInfo.isArray).toBe(expectedContextInfo.isArray);
            expect(ctxInfo.exclusionList).toEqual(expectedContextInfo.exclusionList);
            expect(ctxInfo.shouldReplace).toBe(expectedContextInfo.shouldReplace);
        }

        it("should strip quotes from an empty string", function () {
            expect(JSONUtils.stripQuotes("\"\"")).toBe("");
        });
        it("should strip quotes from the beginning of a string", function () {
            expect(JSONUtils.stripQuotes("\"closeTags")).toBe("closeTags");
        });
        it("should strip quotes from the end of a string", function () {
            expect(JSONUtils.stripQuotes("closeTags\"")).toBe("closeTags");
        });
        it("should strip quotes from both sides of a string", function () {
            expect(JSONUtils.stripQuotes("\"closeTags\"")).toBe("closeTags");
        });

        it("should not detect parentKeyName in case we are in the context of main object", function () {
            // Between " and closeBrackets"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 1, ch: 5}, true);
            expect(ctxInfo.parentKeyName).toBe(null);

            // In "jslint.options"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 20, ch: 11}, true);
            expect(ctxInfo.parentKeyName).toBe(null);
        });
        it("should detect a parentKeyName if we are in the context of a child object", function () {
            // Between " and devel"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 21, ch: 9}, true);
            expect(ctxInfo.parentKeyName).toBe("jslint.options");

            // Between " and tabSize"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 15, ch: 13}, true);
            expect(ctxInfo.parentKeyName).toBe("php");

            // Between " and spaceUnits"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 11, ch: 13}, true);
            expect(ctxInfo.parentKeyName).toBe("javascript");

            // Between " and javascript"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 10, ch: 9}, true);
            expect(ctxInfo.parentKeyName).toBe("language");
        });
        it("should not detect a parentKeyName if we don't require it", function () {
            // Between " and devel"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 21, ch: 9});
            expect(ctxInfo.parentKeyName).toBe(null);

            // Between " and tabSize"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 15, ch: 13});
            expect(ctxInfo.parentKeyName).toBe(null);

            // Between " and spaceUnits"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 11, ch: 13});
            expect(ctxInfo.parentKeyName).toBe(null);

            // Between " and javascript"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 10, ch: 9});
            expect(ctxInfo.parentKeyName).toBe(null);
        });

        it("should detect a space value", function () {
            // After "closeBrackets":+space
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 1, ch: 21});
            expectContextInfo(ctxInfo, {
                tokenType: JSONUtils.TOKEN_VALUE,
                offset: 1,
                keyName: "closeBrackets",
                valueName: " ",
                parentKeyName: null,
                isArray: false,
                exclusionList: [],
                shouldReplace: false
            });
        });
        it("should detect a string value", function () {
            // Between " and markdown"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 7, ch: 23}, true);
            expectContextInfo(ctxInfo, {
                tokenType: JSONUtils.TOKEN_VALUE,
                offset: 1,
                keyName: "README.txt",
                valueName: "\"markdown\"",
                parentKeyName: "language.fileNames",
                isArray: false,
                exclusionList: [],
                shouldReplace: false
            });
        });
        it("should detect a number value", function () {
            // After "spaceUnits": 4
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 11, ch: 27}, true);
            expectContextInfo(ctxInfo, {
                tokenType: JSONUtils.TOKEN_VALUE,
                offset: 1,
                keyName: "spaceUnits",
                valueName: "4",
                parentKeyName: "javascript",
                isArray: false,
                exclusionList: [],
                shouldReplace: false
            });
        });
        it("should detect a boolean value", function () {
            // After "devel": true
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 21, ch: 21}, true);
            expectContextInfo(ctxInfo, {
                tokenType: JSONUtils.TOKEN_VALUE,
                offset: 4,
                keyName: "devel",
                valueName: "true",
                parentKeyName: "jslint.options",
                isArray: false,
                exclusionList: [],
                shouldReplace: false
            });
        });
        it("should detect a variable value", function () {
            // After "regexp": tru
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 22, ch: 21}, true);
            expectContextInfo(ctxInfo, {
                tokenType: JSONUtils.TOKEN_VALUE,
                offset: 3,
                keyName: "regexp",
                valueName: "tru",
                parentKeyName: "jslint.options",
                isArray: false,
                exclusionList: [],
                shouldReplace: false
            });
        });
        it("should detect a correct exclusionList for an object", function () {
            // Between " and tabSize"
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 15, ch: 13});
            expect(ctxInfo.exclusionList).toEqual([
                "useTabChar", "closeBrackets"
            ]);
        });
        it("should detect an array", function () {
            // After [
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 24, ch: 23});
            expect(ctxInfo.isArray).toBe(true);

            // In the first string
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 24, ch: 27});
            expect(ctxInfo.isArray).toBe(true);

            // After ,
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 24, ch: 32});
            expect(ctxInfo.isArray).toBe(true);

            // In the second string
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 24, ch: 35});
            expect(ctxInfo.isArray).toBe(true);

            // Before initial [
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 24, ch: 22});
            expect(ctxInfo.isArray).toBe(false);

            // After ]
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 24, ch: 41});
            expect(ctxInfo).toBe(null);

            // After ],
            ctxInfo = JSONUtils.getContextInfo(testEditor, {line: 24, ch: 42});
            expect(ctxInfo).toBe(null);
        });
    });
});
