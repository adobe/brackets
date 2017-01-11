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

/*global describe, beforeEach, afterEach, it, expect*/

define(function (require, exports, module) {
    "use strict";

    // Load dependencies.
    var SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        PrefsCodeHints      = require("./main"),
        testPreferences     = JSON.parse(require("text!./unittest-files/preferences.json"));

    describe("Preferences Code Hints", function () {
        var testContent, testDocument, testEditor, mockEditor;

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
                        "        \"regexp\": true\n" +
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

            // Rename the file to preferences file.
            testDocument.file._name = ".brackets.json";

            // Setup a test environment by loading minimum preferences required to run unit tests.
            PrefsCodeHints._setupTestEnvironment(testDocument, testPreferences);
        });

        afterEach(function () {
            testEditor.destroy();
            testDocument = null;
        });

        // Extracts hints out of their DOM nodes.
        function extractHintList(hintList) {
            return $.map(hintList, function ($node) {
                return $node.find(".hint-obj").text();
            });
        }

        // Determines the availability of hints.
        function expectHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(true);
            var hintObj = provider.getHints();
            expect(hintObj).toBeTruthy();
            return hintObj.hints;
        }

        // Determines the non-availability of hints.
        function expectNoHints(provider) {
            var hasHints = provider.hasHints(testEditor, null);
            if (!hasHints) {
                expect(hasHints).toBe(false);
            } else {
                expect(provider.getHints(null)).toBe(null);
            }
        }

        // Determines the presence of a hint in the hint list.
        function verifyHints(hintList, expectedHint) {
            var hints = extractHintList(hintList);
            expect(hints[0]).toBe(expectedHint);
        }

        // Determines the exclusion of a hint in the hint list.
        function verifyHintsExcluded(hintList, unexpectedHint) {
            var hints = extractHintList(hintList);
            expect(hints.indexOf(unexpectedHint)).toBe(-1);
        }

        // Inserts the selected hint.
        function selectHint(provider, expectedHint) {
            var hintList = expectHints(provider),
                hints = extractHintList(hintList),
                index = hints.indexOf(expectedHint);
            expect(index).not.toBe(-1);
            return provider.insertHint(hintList[index]);
        }

        // Determines a token at any given position.
        function expectTokenAt(pos, string, type) {
            var token = testEditor._codeMirror.getTokenAt(pos);
            expect(token.string).toBe(string);
            expect(token.type).toBe(type);
        }

        // Determines the position of the cursor.
        function expectCursorAt(pos) {
            var selection = testEditor.getSelection();
            expect(selection.start).toEqual(selection.end);
            expect(selection.start).toEqual(pos);
        }

        describe("File name based hinting", function () {

            it("it should hint in .brackets.json", function () {
                // Between " and closeBrackets"
                testEditor.setCursorPos({line: 1, ch: 5});
                expectHints(PrefsCodeHints.hintProvider);

                testEditor.setCursorPos({line: 1, ch: 20});
                expectHints(PrefsCodeHints.hintProvider);
            });

            it("it should hint in brackets.json", function () {
                testDocument.file._name = "brackets.json";
                PrefsCodeHints._setupTestEnvironment(testDocument, testPreferences);

                // Between " and closeBrackets"
                testEditor.setCursorPos({line: 1, ch: 5});
                expectHints(PrefsCodeHints.hintProvider);

                // After "closeBrackets":
                testEditor.setCursorPos({line: 1, ch: 20});
                expectHints(PrefsCodeHints.hintProvider);
            });

            it("it should NOT hint in other JSON files", function () {
                testDocument.file._name = "package.json";
                PrefsCodeHints._setupTestEnvironment(testDocument, testPreferences);

                // Between " and closeBrackets"
                testEditor.setCursorPos({line: 1, ch: 5});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "closeBrackets":
                testEditor.setCursorPos({line: 1, ch: 20});
                expectNoHints(PrefsCodeHints.hintProvider);
            });
        });

        describe("Key Hints", function () {
            it("should hint at the begininng of a key", function () {
                var hintList;

                // Between " and language"
                testEditor.setCursorPos({line: 9, ch: 5});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "closeOthers.above");

                // Between " and javascript"
                testEditor.setCursorPos({line: 10, ch: 9});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "audio");

                // Between " and spaceUnits"
                testEditor.setCursorPos({line: 11, ch: 13});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "closeBrackets");
            });
            it("should hint in the center of a key", function () {
                var hintList;

                // In "language"
                testEditor.setCursorPos({line: 9, ch: 9});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "language");

                // In "javascript"
                testEditor.setCursorPos({line: 10, ch: 14});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "javascript");

                // In "spaceUnits"
                testEditor.setCursorPos({line: 11, ch: 18});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "spaceUnits");
            });
            it("should hint at the end of a key", function () {
                var hintList;

                // Between "language and "
                testEditor.setCursorPos({line: 9, ch: 13});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "language");

                // Between "javascript and "
                testEditor.setCursorPos({line: 10, ch: 19});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "javascript");

                // Between "spaceUnits and "
                testEditor.setCursorPos({line: 11, ch: 23});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "spaceUnits");
            });

            it("should NOT hint for blacklisted parent keys", function () {
                // Between " and txt"
                testEditor.setCursorPos({line: 4, ch: 9});
                expectNoHints(PrefsCodeHints.hintProvider);

                // In "txt"
                testEditor.setCursorPos({line: 4, ch: 11});
                expectNoHints(PrefsCodeHints.hintProvider);

                // Between " and README.txt"
                testEditor.setCursorPos({line: 7, ch: 9});
                expectNoHints(PrefsCodeHints.hintProvider);

                // In "README.txt"
                testEditor.setCursorPos({line: 7, ch: 15});
                expectNoHints(PrefsCodeHints.hintProvider);
            });

            it("should NOT hint before initial quote of a key", function () {
                // Before "closeBrackets"
                testEditor.setCursorPos({line: 1, ch: 4});
                expectNoHints(PrefsCodeHints.hintProvider);

                // Before "language"
                testEditor.setCursorPos({line: 9, ch: 4});
                expectNoHints(PrefsCodeHints.hintProvider);

                // Before "javascript"
                testEditor.setCursorPos({line: 10, ch: 8});
                expectNoHints(PrefsCodeHints.hintProvider);

                // Before "spaceUnits"
                testEditor.setCursorPos({line: 11, ch: 12});
                expectNoHints(PrefsCodeHints.hintProvider);
            });
            it("should NOT hint after final quote of a key", function () {
                // After "closeBrackets"
                testEditor.setCursorPos({line: 1, ch: 19});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "language"
                testEditor.setCursorPos({line: 9, ch: 14});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "javascript"
                testEditor.setCursorPos({line: 10, ch: 20});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "spaceUnits"
                testEditor.setCursorPos({line: 11, ch: 24});
                expectNoHints(PrefsCodeHints.hintProvider);
            });

            it("should NOT include keys already used in the context of current object", function () {
                var hintList;

                // Between " and insertHintOnTab"
                testEditor.setCursorPos({line: 2, ch: 5});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHintsExcluded(hintList, "closeBrackets");
                verifyHintsExcluded(hintList, "language.fileExtensions");
                verifyHintsExcluded(hintList, "language.fileNames");
                verifyHintsExcluded(hintList, "language");
                verifyHintsExcluded(hintList, "jslint.options");
                verifyHintsExcluded(hintList, "linting.prefer");
                verifyHintsExcluded(hintList, "linting.usePreferredOnly");

                // Between " and insertHintOnTab"
                testEditor.setCursorPos({line: 15, ch: 13});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHintsExcluded(hintList, "useTabChar");
                verifyHintsExcluded(hintList, "closeBrackets");
            });
        });

        describe("Value Hints", function () {
            it("should hint after a colon", function () {
                var hintList;

                // After "closeBrackets":
                testEditor.setCursorPos({line: 1, ch: 20});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");

                // After "insertHintOnTab":
                testEditor.setCursorPos({line: 2, ch: 22});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");

                // After "useTabChar":
                testEditor.setCursorPos({line: 12, ch: 25});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");
            });
            it("should hint after after a space followed by a colon", function () {
                var hintList;

                // After "closeBrackets":+space
                testEditor.setCursorPos({line: 1, ch: 21});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");

                // After "insertHintOnTab":+space
                testEditor.setCursorPos({line: 2, ch: 23});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");

                // After "useTabChar":+space
                testEditor.setCursorPos({line: 12, ch: 26});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");
            });
            it("should hint even if space is missing after a colon", function () {
                var hintList;

                // After "useTabChar":
                testEditor.setCursorPos({line: 16, ch: 25});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");

                // After "closeBrackets":
                testEditor.setCursorPos({line: 17, ch: 28});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");
            });
            it("should hint at the beginning of value", function () {
                var hintList;

                // After "closeBrackets": t
                testEditor.setCursorPos({line: 1, ch: 22});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "true");

                // After "insertHintOnTab": f
                testEditor.setCursorPos({line: 2, ch: 24});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");

                // After "useTabChar": f
                testEditor.setCursorPos({line: 12, ch: 27});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");
            });
            it("should hint at the center of value", function () {
                var hintList;

                // After "closeBrackets": tru
                testEditor.setCursorPos({line: 1, ch: 24});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "true");

                // After "insertHintOnTab": fal
                testEditor.setCursorPos({line: 2, ch: 26});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");

                // After "useTabChar": fal
                testEditor.setCursorPos({line: 12, ch: 29});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");
            });
            it("should hint at the end of the value", function () {
                var hintList;

                // After "closeBrackets": true
                testEditor.setCursorPos({line: 1, ch: 25});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "true");

                // After "insertHintOnTab": false
                testEditor.setCursorPos({line: 2, ch: 28});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");

                // After "useTabChar": false
                testEditor.setCursorPos({line: 12, ch: 31});
                hintList = expectHints(PrefsCodeHints.hintProvider);
                verifyHints(hintList, "false");
            });

            it("should NOT hint if the corresponding colon is missing", function () {
                // After "linting.usePreferredOnly"
                testEditor.setCursorPos({line: 26, ch: 30});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "linting.usePreferredOnly"+space
                testEditor.setCursorPos({line: 26, ch: 31});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "linting.usePreferredOnly" f
                testEditor.setCursorPos({line: 26, ch: 32});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "linting.usePreferredOnly" fal
                testEditor.setCursorPos({line: 26, ch: 34});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "linting.usePreferredOnly" false
                testEditor.setCursorPos({line: 26, ch: 36});
                expectNoHints(PrefsCodeHints.hintProvider);
            });
            it("should NOT hint after a comma", function () {
                // After "closeBrackets": true,
                testEditor.setCursorPos({line: 1, ch: 26});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "insertHintOnTab": false,
                testEditor.setCursorPos({line: 2, ch: 29});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "javascript": { [rules] },
                testEditor.setCursorPos({line: 13, ch: 10});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "language": { [languages] },
                testEditor.setCursorPos({line: 19, ch: 6});
                expectNoHints(PrefsCodeHints.hintProvider);
            });
            it("should NOT hint before opening braces", function () {
                // Between "javascript": and {
                testEditor.setCursorPos({line: 10, ch: 22});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "javascript": {
                testEditor.setCursorPos({line: 10, ch: 23});
                expectNoHints(PrefsCodeHints.hintProvider);
            });
            it("should NOT hint after closing braces", function () {
                // After "javascript": { [rules] }
                testEditor.setCursorPos({line: 13, ch: 9});
                expectNoHints(PrefsCodeHints.hintProvider);

                // After "language": { [languages] }
                testEditor.setCursorPos({line: 19, ch: 5});
                expectNoHints(PrefsCodeHints.hintProvider);
            });
            it("should NOT hint before opening brackets", function () {
                testEditor.setCursorPos({line: 10, ch: 22});
                expectNoHints(PrefsCodeHints.hintProvider);
            });
            it("should NOT hint after closing brackets", function () {
                testEditor.setCursorPos({line: 10, ch: 22});
                expectNoHints(PrefsCodeHints.hintProvider);
            });
        });

        describe("Key Insertion", function () {
            it("should enter entire key after initial quote is typed", function () {
                testDocument.replaceRange("\"", {line: 25, ch: 4});
                testEditor.setCursorPos({line: 25, ch: 5});
                selectHint(PrefsCodeHints.hintProvider, "closeOthers.above");
                expectTokenAt({line: 25, ch: 22}, "\"closeOthers.above\"", "string property");
                expectTokenAt({line: 25, ch: 24}, ":", null);
                expectCursorAt({line: 25, ch: 25});
            });
            it("should enter entire key after first letter of a key is typed", function () {
                testDocument.replaceRange("\"c", {line: 25, ch: 4});
                testEditor.setCursorPos({line: 25, ch: 6});
                selectHint(PrefsCodeHints.hintProvider, "closeOthers.above");
                expectTokenAt({line: 25, ch: 22}, "\"closeOthers.above\"", "string property");
                expectTokenAt({line: 25, ch: 24}, ":", null);
                expectCursorAt({line: 25, ch: 25});
            });
            it("should enter entire key after few initial letters are typed", function () {
                testDocument.replaceRange("\"close", {line: 25, ch: 4});
                testEditor.setCursorPos({line: 25, ch: 10});
                selectHint(PrefsCodeHints.hintProvider, "closeOthers.above");
                expectTokenAt({line: 25, ch: 22}, "\"closeOthers.above\"", "string property");
                expectTokenAt({line: 25, ch: 24}, ":", null);
                expectCursorAt({line: 25, ch: 25});
            });
            it("should replace existing key after few initial letter are typed", function () {
                testDocument.replaceRange("\"closeOthers.above\": true,", {line: 25, ch: 4});
                testEditor.setCursorPos({line: 25, ch: 17});
                selectHint(PrefsCodeHints.hintProvider, "closeOthers.below");
                expectTokenAt({line: 25, ch: 22}, "\"closeOthers.below\"", "string property");
                expectTokenAt({line: 25, ch: 24}, ":", null);
                expectCursorAt({line: 25, ch: 23});
            });
            it("should append braces to a hint in case it is an object", function () {
                testDocument.replaceRange("\"", {line: 25, ch: 4});
                testEditor.setCursorPos({line: 25, ch: 5});
                selectHint(PrefsCodeHints.hintProvider, "closeTags");
                expectTokenAt({line: 25, ch: 14}, "\"closeTags\"", "string property");
                expectTokenAt({line: 25, ch: 16}, ":", null);
                expectTokenAt({line: 25, ch: 18}, "{", null);
                expectTokenAt({line: 25, ch: 19}, "}", null);
                expectCursorAt({line: 25, ch: 18});
            });
            it("should append brackets to a hint in case it in an array", function () {
                testDocument.replaceRange("\"closeTags\": { \"\" }", {line: 25, ch: 4});
                testEditor.setCursorPos({line: 25, ch: 20});
                selectHint(PrefsCodeHints.hintProvider, "indentTags");
                expectTokenAt({line: 25, ch: 30}, "\"indentTags\"", "string property");
                expectTokenAt({line: 25, ch: 32}, ":", null);
                expectTokenAt({line: 25, ch: 34}, "[", null);
                expectTokenAt({line: 25, ch: 35}, "]", null);
                expectCursorAt({line: 25, ch: 34});
            });

            it("should NOT replace colon and braces/brackets if they already exists", function () {
                // After close in "closeBrackets": true
                testEditor.setCursorPos({line: 1, ch: 10});
                expectTokenAt({line: 1, ch: 20}, ":", null);
                selectHint(PrefsCodeHints.hintProvider, "closeOthers.above");
                expectTokenAt({line: 1, ch: 24}, ":", null);
            });
        });

        describe("Value Insertion", function () {
            it("should insert a value of type Boolean", function () {
                testDocument.replaceRange("\"closeOthers.above\":,", {line: 25, ch: 4});
                testEditor.setCursorPos({line: 25, ch: 24});
                selectHint(PrefsCodeHints.hintProvider, "true");
                expectTokenAt({line: 25, ch: 28}, "true", "atom");
                expectCursorAt({line: 25, ch: 28});
            });
            it("should replace current token when editing", function () {
                testDocument.replaceRange("\"closeOthers.above\": tru", {line: 25, ch: 4});
                testEditor.setCursorPos({line: 25, ch: 28});
                selectHint(PrefsCodeHints.hintProvider, "true");
                expectTokenAt({line: 25, ch: 28}, "true", "atom");
                expectCursorAt({line: 25, ch: 29});
            });
            it("should insert a value of type String", function () {
                testDocument.replaceRange(",\n        \"pavement\":", {line: 7, ch: 32});
                testEditor.setCursorPos({line: 8, ch: 19});
                selectHint(PrefsCodeHints.hintProvider, "python");
                expectTokenAt({line: 8, ch: 27}, "\"python\"", "string");
                expectCursorAt({line: 8, ch: 27});
            });
            it("should insert a value if the next token is also a value", function () {
                // Before true
                testEditor.setCursorPos({line: 1, ch: 21});
                selectHint(PrefsCodeHints.hintProvider, "false");
                expectTokenAt({line: 1, ch: 26}, "false", "atom");
                expectCursorAt({line: 1, ch: 26});

                // Before "JSHint"
                testEditor.setCursorPos({line: 24, ch: 23});
                selectHint(PrefsCodeHints.hintProvider, "JSLint");
                expectTokenAt({line: 24, ch: 31}, "\"JSLint\"", "string");
                expectCursorAt({line: 24, ch: 31});
            });
        });
    });
});
