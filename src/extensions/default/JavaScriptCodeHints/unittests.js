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

/*jslint regexp: true */
/*global describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, waitsForDone, beforeFirst, afterLast */

define(function (require, exports, module) {
    "use strict";

    var Commands             = brackets.getModule("command/Commands"),
        CommandManager       = brackets.getModule("command/CommandManager"),
        MainViewManager      = brackets.getModule("view/MainViewManager"),
        DocumentManager      = brackets.getModule("document/DocumentManager"),
        EditorManager        = brackets.getModule("editor/EditorManager"),
        FileSystem           = brackets.getModule("filesystem/FileSystem"),
        FileUtils            = brackets.getModule("file/FileUtils"),
        PreferencesManager   = brackets.getModule("preferences/PreferencesManager"),
        SpecRunnerUtils      = brackets.getModule("spec/SpecRunnerUtils"),
        JSCodeHints          = require("main"),
        Preferences          = require("Preferences"),
        ScopeManager         = require("ScopeManager"),
        HintUtils            = require("HintUtils"),
        HintUtils2           = require("HintUtils2"),
        ParameterHintManager = require("ParameterHintManager");

    var extensionPath   = FileUtils.getNativeModuleDirectoryPath(module),
        testPath        = extensionPath + "/unittest-files/basic-test-files/file1.js",
        testHtmlPath    = extensionPath + "/unittest-files/basic-test-files/index.html",
        testDoc         = null,
        testEditor,
        preTestText;

    CommandManager.register("test-file-open", Commands.FILE_OPEN, function (fileInfo) {
        // Register a command for FILE_OPEN, which the jump to def code will call
        return DocumentManager.getDocumentForPath(fileInfo.fullPath).done(function (doc) {
            MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
        });
    });

    describe("JavaScript Code Hinting", function () {
        /*
         * Ask provider for hints at current cursor position; expect it to
         * return some
         *
         * @param {Object} provider - a CodeHintProvider object
         * @param {string} key - the charCode of a key press that triggers the
         *      CodeHint provider
         * @return {boolean} - whether the provider has hints in the context of
         *      the test editor
         */
        function expectHints(provider, key) {
            if (key === undefined) {
                key = null;
            }

            expect(provider.hasHints(testEditor, key)).toBe(true);
            return provider.getHints(null);
        }

        /*
         * Ask provider for hints at current cursor position; expect it NOT to
         * return any
         *
         * @param {Object} provider - a CodeHintProvider object
         * @param {string} key - the charCode of a key press that triggers the
         *      CodeHint provider
         */
        function expectNoHints(provider, key) {

            if (key === undefined) {
                key = null;
            }

            expect(provider.hasHints(testEditor, key)).toBe(false);
        }

        /*
         * Return the index at which hint occurs in hintList
         *
         * @param {Array.<Object>} hintList - the list of hints
         * @param {string} hint - the hint to search for
         * @return {number} - the index into hintList at which the hint occurs,
         * or -1 if it does not
         */
        function _indexOf(hintList, hint) {
            var index = -1,
                counter = 0;

            for (counter; counter < hintList.length; counter++) {
                if (hintList[counter].data("token").value === hint) {
                    index = counter;
                    break;
                }
            }
            return index;
        }

        /*
         * Wait for a hint response object to resolve, then apply a callback
         * to the result
         *
         * @param {Object + jQuery.Deferred} hintObj - a hint response object,
         *      possibly deferred
         * @param {Function} callback - the callback to apply to the resolved
         *      hint response object
         */
        function _waitForHints(hintObj, callback) {
            var complete = false,
                hintList = null;

            if (hintObj.hasOwnProperty("hints")) {
                complete = true;
                hintList = hintObj.hints;
            } else {
                hintObj.done(function (obj) {
                    complete = true;
                    hintList = obj.hints;
                });
            }

            waitsFor(function () {
                return complete;
            }, "Expected hints did not resolve", 3000);

            runs(function () { callback(hintList); });
        }

        /*
         * Test if hints should be closed or not closed at a given position.
         *
         * @param {Object} provider - a CodeHintProvider object
         * @param {Object + jQuery.Deferred} hintObj - a hint response object,
         *      possibly deferred
         * @param {line: number, ch: number} newPos - new position to move to
         * after hints are received.
         * @param {boolean} expectedValue - true if hints should close,
         * false otherwise.
         */
        function expectCloseHints(provider, hintObj, newPos, expectedValue) {
            _waitForHints(hintObj, function (hintList) {
                testEditor.setCursorPos(newPos);
                expect(provider.shouldCloseHints(JSCodeHints.getSession())).toBe(expectedValue);
            });
        }

        /*
         * Expect a given list of hints to be absent from a given hint
         * response object
         *
         * @param {Object + jQuery.Deferred} hintObj - a hint response object,
         *      possibly deferred
         * @param {Array.<string>} absentHints - a list of hints that should not
         *      be present in the hint response
         */
        function hintsAbsent(hintObj, absentHints) {
            _waitForHints(hintObj, function (hintList) {
                expect(hintList).toBeTruthy();
                absentHints.forEach(function (absentHint) {
                    expect(_indexOf(hintList, absentHint)).toBe(-1);
                });
            });
        }

        /*
         * Expect a given list of hints to be present in a given hint
         * response object
         *
         * @param {Object + jQuery.Deferred} hintObj - a hint response object,
         *      possibly deferred
         * @param {Array.<string>} expectedHints - a list of hints that should be
         *      present in the hint response
         */
        function hintsPresent(hintObj, expectedHints) {
            _waitForHints(hintObj, function (hintList) {
                expect(hintList).toBeTruthy();
                expectedHints.forEach(function (expectedHint) {
                    expect(_indexOf(hintList, expectedHint)).not.toBe(-1);
                });
            });
        }

        /*
         * Expect a given list of hints to be present in the given order in a
         * given hint response object
         *
         * @param {Object + jQuery.Deferred} hintObj - a hint response object,
         *      possibly deferred
         * @param {Array.<string>} expectedHints - a list of hints that should be
         *      present in the given order in the hint response
         */
        function hintsPresentOrdered(hintObj, expectedHints) {
            var prevIndex = -1,
                currIndex;

            _waitForHints(hintObj, function (hintList) {
                expect(hintList).toBeTruthy();
                expectedHints.forEach(function (expectedHint) {
                    currIndex = _indexOf(hintList, expectedHint);
                    expect(currIndex).toBeGreaterThan(prevIndex);
                    prevIndex = currIndex;
                });
            });
        }

        /*
         * Expect a given list of hints to be present in a given hint
         * response object, and no more.
         *
         * @param {Object + jQuery.Deferred} hintObj - a hint response object,
         *      possibly deferred
         * @param {Array.<string>} expectedHints - a list of hints that should be
         *      present in the hint response, and no more.
         */
        function hintsPresentExact(hintObj, expectedHints) {
            _waitForHints(hintObj, function (hintList) {
                expect(hintList).toBeTruthy();
                expect(hintList.length).toBe(expectedHints.length);
                expectedHints.forEach(function (expectedHint, index) {
                    expect(hintList[index].data("token").value).toBe(expectedHint);
                });
            });
        }

        /**
         * Find the index of a string in a list of hints.
         * @param {Array} hintList - the list of hints
         * @param {string} hintSelection - the string represenation of the hint
         *  to find the index of
         * @return {number} the index of the hint corresponding to the hintSelection
         */
        function findHint(hintList, hintSelection) {
            var i, l;
            for (i = 0, l = hintList.length; i < l; ++i) {
                var current = hintList[i].data("token");
                if (hintSelection === current.value) {
                    return i;
                }
            }
            return -1;
        }
        /*
         * Simulation of selection of a particular hint in a hint list.
         * Presumably results in side effects in the hint provider's
         * current editor context.
         *
         * @param {Object} provider - a CodeHint provider object
         * @param {Object} hintObj - a hint response object from that provider,
         *      possibly deferred
         * @param {string} hintSelection - the hint to select
         */
        function selectHint(provider, hintObj, hintSelection) {
            expectHints(provider);
            _waitForHints(hintObj, function (hintList) {
                expect(hintList).toBeTruthy();
                var index = findHint(hintList, hintSelection);
                expect(hintList[index].data("token")).toBeTruthy();
                expect(provider.insertHint(hintList[index])).toBe(false);
            });
        }

        /**
         * Wait for the editor to change positions, such as after a jump to
         * definition has been triggered.  Will timeout after 3 seconds
         *
         * @param {{line:number, ch:number}} oldLocation - the original line/col
         * @param {Function} callback - the callback to apply once the editor has changed position
         */
        function _waitForJump(jumpPromise, callback) {
            var cursor = null,
                complete = false;

            jumpPromise.done(function () {
                complete = true;
            });

            waitsFor(function () {
                var activeEditor = EditorManager.getActiveEditor();
                cursor = activeEditor.getCursorPos();
                return complete;
            }, "Expected jump did not occur", 3000);

            runs(function () { callback(cursor); });
        }

        /**
         * Trigger a jump to definition, and verify that the editor jumped to
         * the expected location. The new location is the variable definition
         * or function definition of the variable or function at the current
         * cursor location. Jumping to the new location will cause a new editor
         * to be opened or open an existing editor.
         *
         * @param {{line:number, ch:number, file:string}} expectedLocation - the
         *  line, column, and optionally the new file the editor should jump to.  If the
         *  editor is expected to stay in the same file, then file may be omitted.
         */
        function editorJumped(expectedLocation) {
            var jumpPromise = JSCodeHints.handleJumpToDefinition();


            _waitForJump(jumpPromise, function (newCursor) {
                expect(newCursor.line).toBe(expectedLocation.line);
                expect(newCursor.ch).toBe(expectedLocation.ch);
                if (expectedLocation.file) {
                    var activeEditor = EditorManager.getActiveEditor();
                    expect(activeEditor.document.file.name).toBe(expectedLocation.file);
                }
            });

        }

        /**
         * Verify there is no parameter hint at the current cursor.
         */
        function expectNoParameterHint() {
            expect(ParameterHintManager.popUpHint()).toBe(null);
        }

        /**
         * Verify the parameter hint is not visible.
         */
        function expectParameterHintClosed() {
            expect(ParameterHintManager.isHintDisplayed()).toBe(false);
        }

        /*
         * Wait for a hint response object to resolve, then apply a callback
         * to the result
         *
         * @param {Object + jQuery.Deferred} hintObj - a hint response object,
         *      possibly deferred
         * @param {Function} callback - the callback to apply to the resolved
         *      hint response object
         */
        function _waitForParameterHint(hintObj, callback) {
            var complete = false,
                hint = null;

            hintObj.done(function () {
                hint = JSCodeHints.getSession().getParameterHint();
                complete = true;
            });

            waitsFor(function () {
                return complete;
            }, "Expected parameter hint did not resolve", 3000);

            runs(function () { callback(hint); });
        }

        /**
         * Show a function hint based on the code at the cursor. Verify the
         * hint matches the passed in value.
         *
         * @param {Array<{name: string, type: string, isOptional: boolean}>}
         * expectedParams - array of records, where each element of the array
         * describes a function parameter. If null, then no hint is expected.
         * @param {number} expectedParameter - the parameter at cursor.
         */
        function expectParameterHint(expectedParams, expectedParameter) {
            var request = ParameterHintManager.popUpHint();
            if (expectedParams === null) {
                expect(request).toBe(null);
                return;
            }

            function expectHint(hint) {
                var params = hint.parameters,
                    n = params.length,
                    i;

                // compare params to expected params
                expect(params.length).toBe(expectedParams.length);
                expect(hint.currentIndex).toBe(expectedParameter);

                for (i = 0; i < n; i++) {

                    expect(params[i].name).toBe(expectedParams[i].name);
                    expect(params[i].type).toBe(expectedParams[i].type);
                    if (params[i].isOptional) {
                        expect(expectedParams[i].isOptional).toBeTruthy();
                    } else {
                        expect(expectedParams[i].isOptional).toBeFalsy();
                    }
                }

            }

            if (request) {
                _waitForParameterHint(request, expectHint);
            } else {
                expectHint(JSCodeHints.getSession().getParameterHint());
            }
        }

        function setupTest(path, primePump) { // FIXME: primePump argument ignored even though used below
            DocumentManager.getDocumentForPath(path).done(function (doc) {
                testDoc = doc;
            });

            waitsFor(function () {
                return testDoc !== null;
            }, "Unable to open test document", 10000);

            // create Editor instance (containing a CodeMirror instance)
            runs(function () {
                testEditor = SpecRunnerUtils.createMockEditorForDocument(testDoc);
                preTestText = testDoc.getText();
                waitsForDone(ScopeManager._readyPromise());
                waitsForDone(ScopeManager._maybeReset(JSCodeHints.getSession(), testDoc, true));
            });
        }

        function tearDownTest() {
            // Restore the pre-test version of the text here because the hinter
            // will update the contents of the previous document in tern.
            testDoc.setText(preTestText);

            // The following call ensures that the document is reloaded
            // from disk before each test
            MainViewManager._closeAll(MainViewManager.ALL_PANES);
            SpecRunnerUtils.destroyMockEditor(testDoc);
            testEditor = null;
            testDoc = null;
        }

        describe("JavaScript Code Hinting Basic", function () {
            beforeFirst(function () {
                brackets._configureJSCodeHints({
                    noReset: true
                });
            });

            afterLast(function () {
                brackets._configureJSCodeHints({
                    noReset: false
                });
            });

            beforeEach(function () {
                setupTest(testPath, false);
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should not list hints in string literal", function () {
                testEditor.setCursorPos({ line: 20, ch: 22 });
                expectNoHints(JSCodeHints.jsHintProvider);
            });

            it("should list declared variable and function names in outer scope", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["A2", "A3", "funB", "A1"]);
            });

            it("should filter hints by query", function () {
                testEditor.setCursorPos({ line: 5, ch: 10 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["A1", "A2", "A3"]);
                hintsAbsent(hintObj, ["funB"]);
            });

            it("should list keywords", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["break", "case", "catch"]);
            });

            xit("should list explicitly defined globals from JSLint annotations", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["brackets", "$"]);
            });

            xit("should list implicitly defined globals from JSLint annotations", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["alert", "console", "confirm", "navigator", "window", "frames"]);
            });

            it("should NOT list implicitly defined globals from missing JSLint annotations", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsAbsent(hintObj, ["ActiveXObject", "CScript", "VBArray"]);
            });

            it("should NOT list explicitly defined globals from JSLint annotations in other files", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsAbsent(hintObj, ["crazyGlobal", "anotherCrazyGlobal"]);
            });

            it("should NOT list implicitly defined globals from JSLint annotations in other files", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsAbsent(hintObj, ["spawn", "version", "toint32"]);
            });

            it("should list literal constants", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["null", "undefined", "true", "false"]);
            });

            it("should NOT list variables, function names and parameter names out of scope", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsAbsent(hintObj, ["paramB2", "paramB1"]);
            });

            it("should NOT list variables, function names and parameter names in other files", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsAbsent(hintObj, ["E1", "E2"]);
            });

            it("should NOT list property names on value lookups", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsAbsent(hintObj, ["propA", "propB", "propC"]);
            });

            it("should list declared variable, function and parameter names in inner scope", function () {
                testEditor.setCursorPos({ line: 12, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["B1", "B2", "funC", "paramB1", "paramB2", "funB", "A1", "A2", "A3"]);
            });

            xit("should list string literals that occur in the file", function () {
                testEditor.setCursorPos({ line: 12, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["use strict"]);
            });

            it("should NOT list string literals from other files", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsAbsent(hintObj, ["a very nice string"]);
            });

            it("should list property names that have been declared in the file", function () {
                testEditor.setCursorPos({ line: 17, ch: 11 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["propB"]);
            });

            it("should list identifier names that occur in other files", function () {
                testEditor.setCursorPos({ line: 16, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["D1", "D2"]);
            });

            it("should NOT list variable, parameter or function names on property lookups", function () {
                testEditor.setCursorPos({ line: 17, ch: 11 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsAbsent(hintObj, ["A1", "A2", "funB", "paramB1", "paramB2", "B1", "B2", "funC", "paramC1", "paramC2"]);
            });

            it("should NOT list keywords on property lookups", function () {
                testEditor.setCursorPos({ line: 17, ch: 11 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsAbsent(hintObj, ["case", "function", "var"]);
            });

            it("should close hints when move over '.' ", function () {
                testEditor.setCursorPos({ line: 17, ch: 11 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 10 }, true);
            });

            it("should close hints only when move off the end of a property ", function () {
                testEditor.setCursorPos({ line: 17, ch: 11 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 12 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 13 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 14 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 15 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 16 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 17 }, true);
            });

            it("should close hints only when move off the beginning of an identifier ", function () {
                testEditor.setCursorPos({ line: 17, ch: 10 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 9 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 8 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 17, ch: 7 }, true);
            });

            it("should close hints only when move off the beginning of a keyword ", function () {
                testEditor.setCursorPos({ line: 24, ch: 7 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["var"]);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 24, ch: 6 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 24, ch: 5 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 24, ch: 4 }, false);
                expectCloseHints(JSCodeHints.jsHintProvider, hintObj,
                    { line: 24, ch: 3 }, true);
            });

            it("should NOT list implicit hints on left-brace", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                expectNoHints(JSCodeHints.jsHintProvider, "{");
            });

            it("should list explicit hints for variable and function names", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider, null);
                hintsPresent(hintObj, ["A2", "A3", "funB", "A1"]);
            });

            it("should list implicit hints when typing property lookups", function () {
                testEditor.setCursorPos({ line: 17, ch: 10 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider, ".");
                hintsPresent(hintObj, ["B1", "paramB1"]);
            });

            it("should give priority to identifier names associated with the current context", function () {
                testEditor.setCursorPos({ line: 16, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresentOrdered(hintObj, ["C1", "B1"]);
                hintsPresentOrdered(hintObj, ["C2", "B2"]);
            });

            it("should give priority to property names associated with the current context from other files", function () {
                testEditor.setCursorPos({ line: 16, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresentOrdered(hintObj, ["C1", "D1"]);
                hintsPresentOrdered(hintObj, ["B1", "D1"]);
                hintsPresentOrdered(hintObj, ["A1", "D1"]);
                hintsPresentOrdered(hintObj, ["funB", "funE"]);
            });

            xit("should choose the correct delimiter for string literal hints with no query", function () {
                var start = { line: 18, ch: 0 },
                    end   = { line: 18, ch: 18 };

                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, 13); // hint 13 is "hello\\\"world!"
                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, end)).toEqual('"hello\\\\\\" world!"');
                });
            });

            it("should insert value hints with no current query", function () {
                var start = { line: 6, ch: 0 },
                    end   = { line: 6, ch: 2 };

                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "A2");
                runs(function () {
                    //expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, end)).toEqual("A2");
                });
            });

            it("should insert value hints replacing the current query", function () {
                var start   = { line: 5, ch: 10 }, // A3 = A<here>2;
                    before  = { line: 5, ch: 9 },
                    end     = { line: 5, ch: 11 };

                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["A1", "A2", "A3"]);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "A1");
                runs(function () {
                    //expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(before, end)).toEqual("A1");
                });
            });

            it("should insert property hints with no current query", function () {
                var start   = { line: 6, ch: 0 },
                    middle  = { line: 6, ch: 3 },
                    end     = { line: 6, ch: 8 };

                testDoc.replaceRange("A1.", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "propA");

                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, end)).toEqual("A1.propA");
                    expect(testDoc.getLine(end.line).length).toEqual(8);
                });
            });

            it("should insert, not replace, property hints with no current query", function () {
                var start   = { line: 6, ch: 0 },
                    middle  = { line: 6, ch: 3 },
                    end     = { line: 6, ch: 8 },
                    endplus = { line: 6, ch: 12 };

                testDoc.replaceRange("A1.prop", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "propA");

                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, endplus)).toEqual("A1.propAprop");
                    expect(testDoc.getLine(end.line).length).toEqual(12);
                });
            });

            it("should insert, not replace, property hints with a partial current query", function () {
                var start   = { line: 6, ch: 0 },
                    middle  = { line: 6, ch: 6 },
                    end     = { line: 6, ch: 8 };

                testDoc.replaceRange("A1.pro", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "propA");
                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, end)).toEqual("A1.propA");
                    expect(testDoc.getLine(end.line).length).toEqual(8);
                });
            });

            it("should replace property hints replacing a partial current query", function () {
                var start   = { line: 6, ch: 0 },
                    middle  = { line: 6, ch: 6 },
                    end     = { line: 6, ch: 8 },
                    endplus = { line: 6, ch: 10 };

                testDoc.replaceRange("A1.propB", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "propA");
                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, endplus)).toEqual("A1.propApB");
                    expect(testDoc.getLine(end.line).length).toEqual(10);
                });
            });

            it("should replace property hints but not following delimiters", function () {
                var start   = { line: 6, ch: 0 },
                    middle  = { line: 6, ch: 4 },
                    end     = { line: 6, ch: 9 },
                    endplus = { line: 6, ch: 14 };

                testDoc.replaceRange("(A1.prop)", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "propA");

                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, endplus)).toEqual("(A1.propAprop)");
                    expect(testDoc.getLine(endplus.line).length).toEqual(14);
                });
            });

            it("should list hints for string, as string assigned to 's', 's' assigned to 'r' and 'r' assigned to 't'", function () {
                var start = { line: 26, ch: 0 },
                    middle = { line: 26, ch: 6 };

                // pad spaces here as tern has issue,without space, no code hint
                testDoc.replaceRange("    t.", start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["charAt", "charCodeAt", "concat", "indexOf"]);
                });
            });

            it("should list function type", function () {
                var start = { line: 37, ch: 0 },
                    middle = { line: 37, ch: 5 };

                testDoc.replaceRange("funD(", start, start);
                testEditor.setCursorPos(middle);
                runs(function () {
                    expectParameterHint([{name: "a", type: "String"},
                        {name: "b", type: "Number"}], 0);
                });
            });

            it("should list exports from a requirejs module", function () {
                var start = { line: 40, ch: 21 };

                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["a", "b", "c", "j"]);
                });
            });

            it("should list later defined property names", function () {
                var start = { line: 17, ch: 11 };

                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["foo", "propB"]);
                });
            });

            it("should list matching property names", function () {
                var cursor1 = { line: 12, ch: 0 },
                    cursor2 = { line: 12, ch: 6 };

                testDoc.replaceRange("paramB", cursor1, cursor1);
                testEditor.setCursorPos(cursor2);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["paramB1", "paramB2"]);
                });
            });

            it("should take anotation parameter type:String", function () {
                var start = { line: 37, ch: 21 };

                testDoc.replaceRange("var k= funD(10,11).x.", start, start);
                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["charAt", "charCodeAt", "concat", "indexOf"]);
                });
            });

            it("should take anotation parameter type:Number", function () {
                var start = { line: 37, ch: 21 };

                testDoc.replaceRange("var k= funD(10,11).y.", start, start);
                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["toExponential", "toFixed", "toString"]);
                });
            });

            it("should add new method on String .prototype", function () {
                var start = { line: 37, ch: 0 };
                var testPos = { line: 40, ch: 12 };
                testDoc.replaceRange("String.prototype.times = function (count) {\n" + "\treturn count < 1 ? '' : new Array[count + 1].join(this);\n};\n\"hello\".tim", start, start);
                testEditor.setCursorPos(testPos);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["times", "trim"]);
                });
            });

            it("should list function defined from .prototype", function () {
                var start = { line: 59, ch: 5 };

                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["calc"]);
                });
            });

            it("should list function type defined from .prototype", function () {
                var start = { line: 59, ch: 10 };
                testEditor.setCursorPos(start);
                runs(function () {
                    expectParameterHint([{name: "a4", type: "Number"}, {name: "b4", type: "Number"}], 0);
                });
            });

            it("should list function inherited from super class", function () {
                var start = { line: 79, ch: 11 };
                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["amountDue", "getAmountDue", "getName", "name", "setAmountDue"]);
                });
            });

            it("should show argument from from .prototype.Method", function () {
                var start = { line: 80, ch: 0 },
                    testPos = { line: 80, ch: 24 };

                testDoc.replaceRange("myCustomer.setAmountDue(", start);
                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "amountDue", type: "Object"}], 0);
                });
            });

            it("should show inner function type", function () {
                var testPos = { line: 96, ch: 23 };

                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "arg", type: "String"}], 0);
                });
            });

            it("should show type for inner function returned function", function () {
                var testPos = { line: 96, ch: 33 };

                testEditor.setCursorPos(testPos);
                expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    expectParameterHint([], 0);
                });

            });

            // parameter type anotation tests, due to another bug #3670: first argument has ?
            xit("should list parameter Date,boolean type", function () {
                var start = { line: 109, ch: 0 },
                    testPos = { line: 109, ch: 11 };

                testDoc.replaceRange("funTypeAn1(", start);
                testEditor.setCursorPos(testPos);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["funTypeAn1((a: bool, b: Date) -> {x, y}"]);
                });
            });

            // parameter type anotation tests, due to another bug #3670: first argument has ?
            xit("should list parameter function type and best guess for its argument/return types", function () {
                var testPos = { line: 123, ch: 11 };

                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "f", type: "function(): number"}], 0);
                });
            });

            // parameter type annotation tests
            it("should list parameter function type and best guess for function call/return types", function () {
                var testPos = { line: 139, ch: 12 };

                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "f", type: "function(String, Number):String"}], 0);
                });
            });

            it("should list array containing functions", function () {
                var testPos = { line: 142, ch: 7 };

                testEditor.setCursorPos(testPos);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresent(hintObj, ["index1", "index2"]);
                });
            });

            it("should list function reference", function () {
                var start = { line: 144, ch: 0 },
                    testPos = { line: 144, ch: 14 };

                testDoc.replaceRange("funArr.index1(", start);
                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([], 0);
                });
            });

            it("should insert hint as [\"my-key\"] since 'my-key' is not a valid property name", function () {
                var start = { line: 49, ch: 0 },
                    middle = { line: 49, ch: 5 },
                    end = { line: 49, ch: 13 };

                testDoc.replaceRange("arr.m", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "my-key");
                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, end)).toEqual("arr[\"my-key\"]");
                    expect(testDoc.getLine(end.line).length).toEqual(13);
                });
            });

            it("should insert hint as [\"my-key\"] make sure this works if nothing is typed after the '.'", function () {
                var start = { line: 49, ch: 0 },
                    middle = { line: 49, ch: 4 },
                    end = { line: 49, ch: 13 };

                testDoc.replaceRange("arr.", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "my-key");
                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, end)).toEqual("arr[\"my-key\"]");
                    expect(testDoc.getLine(end.line).length).toEqual(13);
                });
            });

            it("should insert hint as '.for' since keywords can be used as property names", function () {
                var start = { line: 49, ch: 0 },
                    middle = { line: 49, ch: 5 },
                    end = { line: 49, ch: 7 };

                testDoc.replaceRange("arr.f", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "for");
                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, end)).toEqual("arr.for");
                    expect(testDoc.getLine(end.line).length).toEqual(7);
                });
            });

            it("should jump to function", function () {
                var start = { line: 43, ch: 0 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 7, ch: 13});
                });
            });

            it("should jump to var", function () {
                var start = { line: 44, ch: 10 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 3, ch: 6});
                });
            });

            it("should jump to closure, early defined var", function () {
                var start = { line: 17, ch: 9 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 10, ch: 10});
                });
            });

            it("should jump to the definition in new module file", function () {
                var start = { line: 40, ch: 22 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 4, ch: 13, file: "MyModule.js"}); //jump to another file
                });
            });

            it("should jump to the method definition in .prototype", function () {
                var start = { line: 59, ch: 8 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 53, ch: 21}); //jump to prototype.calc
                });
            });

            it("should jump to parameter passed in the method", function () {
                var start = { line: 63, ch: 20 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 61, ch: 27});
                });
            });

            it("should jump to parameter passed in anonymous method", function () {
                var start = { line: 83, ch: 25 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 81, ch: 53});
                });
            });

            it("should jump to inner method", function () {
                var start = { line: 96, ch: 32 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 94, ch: 17});
                });
            });

            it("should jump to the actual function definition, and not the exports line", function () {
                var start = { line: 159, ch: 22 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 11, ch: 14, file: "MyModule.js"}); //jump to another file
                });
            });

            it("should not hint function, variable, or param decls", function () {
                var func = { line: 7, ch: 12 },
                    param = { line: 7, ch: 18 },
                    variable = { line: 10, ch: 10 };

                runs(function () {
                    testEditor.setCursorPos(func);
                    expectNoParameterHint();
                    testEditor.setCursorPos(param);
                    expectNoHints(JSCodeHints.jsHintProvider);
                    testEditor.setCursorPos(variable);
                    expectNoHints(JSCodeHints.jsHintProvider);
                });
            });

            it("should sort underscore names to the bottom", function () {
                testEditor.setCursorPos({ line: 146, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresentOrdered(hintObj, ["A1", "A2", "A3", "funB", "_A1"]);
            });

            it("should list all properties for unknown type", function () {
                var start = { line: 149, ch: 0 },
                    end   = { line: 149, ch: 5 };

                testDoc.replaceRange("help.", start, start);
                testEditor.setCursorPos(end);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                // check we have a properties from "Function", "String", and "Array"
                hintsPresentOrdered(hintObj, ["apply", "charCodeAt", "concat"]);
            });

            it("should switch to guesses after typing a query that does not match any hints", function () {
                var start = { line: 150, ch: 0 },
                    end   = { line: 150, ch: 5 };

                testDoc.replaceRange("s.shift", start, start);
                testEditor.setCursorPos(end);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                // check we have a properties that start with "shift"
                hintsPresentOrdered(hintObj, ["shift", "shiftKey"]);
            });

            it("should handle valid non-ascii characters in a property name", function () {
                var start = { line: 153, ch: 0 },
                    end   = { line: 153, ch: 13 };

                testDoc.replaceRange("hope.frenchçP", start, start);
                testEditor.setCursorPos(end);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                // check we have a properties that start with "shift"
                hintsPresentOrdered(hintObj, ["frenchçProp"]);
            });

            it("should show guessed argument type from current passing parameter", function () {
                var start = { line: 80, ch: 0 },
                    testPos = { line: 80, ch: 24 };
                testDoc.replaceRange("myCustomer.setAmountDue(10)", start);
                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "amountDue", type: "Number"}], 0);
                });
            });

            it("should list parameter hint for record type annotation", function () {
                var testPos = { line: 178, ch: 25 };

                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "t", type: "{index: Number, name: String}"}], -1);
                });
            });

            it("should list parameter hint for optional parameters", function () {
                var testPos = { line: 214, ch: 17 };

                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "a", type: "Number", isOptional: true}, {name: "b", type: "String", isOptional: true}], 0);
                });
            });

            it("should list parameter hint for a function parameter", function () {
                var testPos = { line: 181, ch: 12 };

                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "compare",
                        type: "function(Object, Object):Number",
                        isOptional: true}], -1);
                });
            });

            it("should list parameter hint for an array parameter", function () {
                var testPos = { line: 184, ch: 12 };
                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "other", type: "Array.<Object>"}], -1);
                });
            });

            it("should list parameter hint for a source array annotation", function () {
                var testPos = { line: 200, ch: 20 };
                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "a", type: "Array.<String>"}], 0);
                });
            });

            it("should close parameter hint when move off function", function () {
                var testPos = { line: 184, ch: 12 },
                    endPos  = { line: 184, ch: 19 };
                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "other", type: "Array.<Object>"}], -1);
                });

                runs(function () {
                    testEditor.setCursorPos(endPos);
                    expectParameterHintClosed();
                });
            });

            it("should close parameter hint when move off function to another function", function () {
                var testPos = { line: 184, ch: 12 },
                    newPos  = { line: 181, ch: 12 };
                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "other", type: "Array.<Object>"}], -1);
                });

                runs(function () {
                    testEditor.setCursorPos(newPos);
                    expectParameterHintClosed();
                });
            });

            it("should update current parameter as the cursor moves", function () {
                var testPos = { line: 186, ch: 19 },
                    newPos  = { line: 186, ch: 20 };
                testEditor.setCursorPos(testPos);
                runs(function () {
                    expectParameterHint([{name: "char", type: "String"},
                        {name: "from", type: "Number", isOptional: true}], 0);
                });

                runs(function () {
                    testEditor.setCursorPos(newPos);
                    expectParameterHint([{name: "char", type: "String"},
                        {name: "from", type: "Number", isOptional: true}], 1);
                });
            });

            // Test `jscodehints.noHintsOnDot` preference
            it("should consider dot a hintable key based on preference", function () {
                var noHintsOnDot = PreferencesManager.get("jscodehints.noHintsOnDot");

                testEditor.setCursorPos({ line: 44, ch: 10 });

                // Default is falsey
                expect(noHintsOnDot).toBeFalsy();

                // Should get hints after dot
                expectHints(JSCodeHints.jsHintProvider, ".");

                // Set preference to true
                PreferencesManager.set("jscodehints.noHintsOnDot", true);

                // Should no longer get hints after dot
                expectNoHints(JSCodeHints.jsHintProvider, ".");

                // Set preference back to original value (converted to boolean)
                PreferencesManager.set("jscodehints.noHintsOnDot", !!noHintsOnDot);
            });
        });

        describe("JavaScript Code Hinting in a HTML file", function () {

            beforeEach(function () {
                setupTest(testHtmlPath, false);
            });

            afterEach(function () {
                tearDownTest();
            });

            it("basic codehints in html file", function () {
                var start = { line: 37, ch: 9 },
                    end   = { line: 37, ch: 13};

                testDoc.replaceRange("x100.", start);
                testEditor.setCursorPos(end);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["charAt", "charCodeAt", "concat", "indexOf"]);
                });
            });

            it("function type hint in html file", function () {
                var start = { line: 36, ch: 12 };

                testEditor.setCursorPos(start);
                runs(function () {
                    expectParameterHint([{name: "a", type: "Number"}], 0);
                });
            });

            it("should show function type code hint for function in script file inside html file", function () {
                var start = { line: 22, ch: 17 };

                testEditor.setCursorPos(start);
                runs(function () {
                    expectParameterHint([{name: "a", type: "String"}, {name: "b", type: "Number"}], 0);
                });
            });

            it("should show function type code hint for function in another script file inside html file", function () {
                var start = { line: 23, ch: 17 };

                testEditor.setCursorPos(start);
                runs(function () {
                    expectParameterHint([{name: "paramE1", type: "D1"}, {name: "paramE2", type: "Number"}], 0);
                });
            });

            it("should show global variable in another script file inside html file", function () {
                var start        = { line: 27, ch: 8 },
                    end          = { line: 27, ch: 13},
                    testPosStart = { line: 27, ch: 11},
                    testPosEnd   = { line: 27, ch: 21};

                testDoc.replaceRange("arr.m", start);

                testEditor.setCursorPos(end);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresent(hintObj, ["my-key"]);
                });
                selectHint(JSCodeHints.jsHintProvider, hintObj, "my-key");
                runs(function () {
                    expect(testDoc.getRange(testPosStart, testPosEnd)).toEqual("[\"my-key\"]");
                });
            });

            it("should jump to definition inside html file", function () {
                var start = { line: 36, ch: 10 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 19, ch: 20});
                });
            });

            it("should jump to funtion definition to loaded file1", function () {
                var start = { line: 22, ch: 15 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 33, ch: 13});
                });
            });

            it("should jump to funtion definition to loaded file2", function () {
                var start = { line: 23, ch: 15 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 6, ch: 13});
                });
            });

            it("should jump to property definition to loaded file1", function () {
                var start = { line: 23, ch: 28 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 4, ch: 16});
                });
            });

            it("should jump to property definition to loaded file2", function () {
                var start = { line: 23, ch: 18 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 3, ch: 6});
                });
            });


        });

        describe("JavaScript Code Hinting without modules", function () {
            var testPath = extensionPath + "/unittest-files/non-module-test-files/app.js";
            ScopeManager.handleProjectOpen(extensionPath + "/unittest-files/non-module-test-files/");

            beforeEach(function () {
                setupTest(testPath, true);
            });

            afterEach(function () {
                tearDownTest();
            });

            // Test reading multiple files and subdirectories
            // Turned for per #7646
            xit("should handle reading all files when modules not used", function () {
                var start = { line: 8, ch: 8 };

                runs(function () {
                    testEditor.setCursorPos(start);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["a", "b", "b1", "c", "d"]);
                });
            });
        });

        describe("JavaScript Code Hinting with modules", function () {
            var testPath = extensionPath + "/unittest-files/module-test-files/module_tests.js";

            beforeEach(function () {
                setupTest(testPath, true);
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should read methods created in submodule on this", function () {
                var start = { line: 8, ch: 17 };

                runs(function () {
                    testEditor.setCursorPos(start);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["addMessage", "name", "privilegedMethod", "publicMethod1"]);
                });
            });

            // bug: wait for fix in tern
            xit("should read methods created in submodule", function () {
                var start = { line: 19, ch: 15 };

                runs(function () {
                    testEditor.setCursorPos(start);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["addMessage", "name", "privilegedMethod", "publicMethod1"]);
                });
            });

            it("should read properties created in parent module", function () {
                var start        = { line: 30, ch: 8 },
                    testPos          = { line: 30, ch: 15};

                testDoc.replaceRange("parent.", start);
                runs(function () {
                    testEditor.setCursorPos(testPos);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["addMessage", "name", "privilegedMethod", "publicMethod1"]);
                });
            });

            // bug: wait for tern
            xit("should read methods created in submodule module", function () {
                var start        = { line: 62, ch: 0 },
                    testPos          = { line: 62, ch: 13};

                testDoc.replaceRange("SearchEngine.", start);
                runs(function () {
                    testEditor.setCursorPos(testPos);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["getYourLuckyNumber", "subSearch"]);
                });
            });

            it("should read methods created in parent module", function () {
                var start        = { line: 78, ch: 41 };

                runs(function () {
                    testEditor.setCursorPos(start);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["getYourLuckyNumber", "subSearch"]);
                });
            });

            it("should load module by file path from require", function () {
                var start        = { line: 88, ch: 20 };

                runs(function () {
                    testEditor.setCursorPos(start);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["color", "material", "size"]);
                });
            });

            // tern bug: https://github.com/marijnh/tern/issues/147
            xit("should read properties from exported module", function () {
                var start        = { line: 96, ch: 0 },
                    testPos          = { line: 96, ch: 9};

                testDoc.replaceRange("hondaCar.", start);
                runs(function () {
                    testEditor.setCursorPos(testPos);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["model", "name"]);
                });
            });

            // bug in test framework? can't run sequential jump, verification is wrong
            xit("should jump to a module, depending module", function () {
                var start        = { line: 93, ch: 25 },
                    testPos      = { line: 8, ch: 35 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 5, ch: 23});
                });
                testEditor.setCursorPos(testPos);
                runs(function () {
                    editorJumped({line: 5, ch: 23});
                });
            });
        });

        describe("JavaScript Code Hinting preference tests", function () {
            var testPath = extensionPath + "/unittest-files/preference-test-files/",
                preferences;

            function getPreferences(path) {
                preferences = null;

                FileSystem.resolve(path, function (err, file) {
                    if (!err) {
                        FileUtils.readAsText(file).done(function (text) {
                            var configObj = null;
                            try {
                                configObj = JSON.parse(text);
                            } catch (e) {
                                // continue with null configObj
                                console.log(e);
                            }
                            preferences = new Preferences(configObj);
                        }).fail(function (error) {
                            preferences = new Preferences();
                        });
                    } else {
                        preferences = new Preferences();
                    }
                });
            }

            // Test preferences file with no entries. Preferences should contain
            // default values.
            it("should handle reading an empty configuration file", function () {
                getPreferences(testPath + "defaults-test/.jscodehints");
                waitsFor(function () {
                    return preferences !== null;
                });

                runs(function () {
                    expect(preferences.getExcludedDirectories()).toEqual(/node_modules/);
                    expect(preferences.getExcludedFiles().source).
                        toBe(/^require.*\.js$|^jquery.*\.js$/.source);
                    expect(preferences.getMaxFileCount()).toBe(100);
                    expect(preferences.getMaxFileSize()).toBe(512 * 1024);
                });
            });

            // Test preferences file with empty or out of ranges values. Preferences
            // should contain default values.
            it("should handle reading an invalid configuration file", function () {
                getPreferences(testPath + "negative-test/.jscodehints");
                waitsFor(function () {
                    return preferences !== null;
                });

                runs(function () {
                    expect(preferences.getExcludedDirectories()).toEqual(/node_modules/);
                    expect(preferences.getExcludedFiles().source).
                        toBe(/^require.*\.js$|^jquery.*\.js$/.source);
                    expect(preferences.getMaxFileCount()).toBe(100);
                    expect(preferences.getMaxFileSize()).toBe(512 * 1024);
                });
            });

            // Positive test. Test pattern matching.
            it("should handle a valid configuration file", function () {
                getPreferences(testPath + "positive-test/.jscodehints");
                waitsFor(function () {
                    return preferences !== null;
                });

                runs(function () {
                    var excludedDirs = preferences.getExcludedDirectories(),
                        excludedFiles = preferences.getExcludedFiles();

                    // test "excluded-dir1"
                    expect(excludedDirs.test("excluded-dir1")).toBeTruthy();
                    expect(excludedDirs.test("xexcluded-dir1")).toBeFalsy();

                    // test "excluded-dir2-*"
                    expect(excludedDirs.test("excluded-dir2-1")).toBeTruthy();
                    expect(excludedDirs.test("excluded-dir2-12")).toBeFalsy();
                    expect(excludedDirs.test("excluded-dir2-z")).toBeFalsy();
                    expect(excludedDirs.test("excluded-dir2-")).toBeFalsy();
                    expect(excludedDirs.test("xexcluded-dir2-1")).toBeFalsy();

                    // test "file1?.js"
                    expect(excludedFiles.test("file1.js")).toBeTruthy();
                    expect(excludedFiles.test("file12.js")).toBeTruthy();
                    expect(excludedFiles.test("file123.js")).toBeFalsy();

                    // test "file2*.js"
                    expect(excludedFiles.test("file2.js")).toBeTruthy();
                    expect(excludedFiles.test("file2xxx.js")).toBeTruthy();
                    expect(excludedFiles.test("filexxxx.js")).toBeFalsy();

                    // test "file3.js"
                    expect(excludedFiles.test("file3.js")).toBeTruthy();
                    expect(excludedFiles.test("xfile3.js")).toBeFalsy();

                    // test "/file4[x|y|z]?.js/"
                    expect(excludedFiles.test("file4.js")).toBeTruthy();
                    expect(excludedFiles.test("file4x.js")).toBeTruthy();
                    expect(excludedFiles.test("file4y.js")).toBeTruthy();
                    expect(excludedFiles.test("file4z.js")).toBeTruthy();
                    expect(excludedFiles.test("file4b.js")).toBeFalsy();
                    expect(excludedFiles.test("file4xyz.js")).toBeFalsy();
                    expect(excludedFiles.test("xfile4.js")).toBeTruthy();

                    // test builtin exclusions are also present
                    expect(excludedFiles.test("require.js")).toBeTruthy();
                    expect(excludedFiles.test("jquery.js")).toBeTruthy();

                    expect(preferences.getMaxFileCount()).toBe(512);
                    expect(preferences.getMaxFileSize()).toBe(100000);
                });
            });
        });

        describe("regression tests", function () {

            it("should return true for valid identifier, false for invalid one", function () {
                var identifierList = ["ᾩ", "ĦĔĽĻŎ", "〱〱〱〱", "जावास्क्रि",
                                      "KingGeorgeⅦ", "π", "ಠ_ಠ",
                                      "price_9̶9̶_89", "$_3423", "TRUE", "FALSE", "IV"];
                var invalidIdentifierList = [" break", "\tif", "\ntrade"];

                invalidIdentifierList.forEach(function (element) {
                    var result = HintUtils.maybeIdentifier(element);
                    expect(result).toBe(false);
                });

                identifierList.forEach(function (element) {
                    var result = HintUtils.maybeIdentifier(element);
                    expect(result).toBe(true);
                });
            });
        });

        describe("JavaScript Code Hinting with test.html file", function () {
            var testFile = extensionPath + "/unittest-files/basic-test-files/test.html";

            beforeEach(function () {
                setupTest(testFile, true);
            });

            afterEach(function () {
                tearDownTest();

            });

            // FIXME (issue #3915)
            xit("should read function name has double byte chars", function () {
                var start   = { line: 15, ch: 8 },
                    testPos = { line: 15, ch: 10 };

                runs(function () {
                    testEditor.setCursorPos(start);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["fun測试"]);
                });
                runs(function () {
                    testEditor.setCursorPos(testPos);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["fun測试()"]);
                });
            });

            it("should jump to function name with double byte chars", function () {
                var start        = { line: 16, ch: 9 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 12, ch: 20});
                });
            });

            // FIXME (issue #3915)
            xit("should read function name has non ascii chars", function () {
                var start = { line: 16, ch: 16 };

                runs(function () {
                    testEditor.setCursorPos(start);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["frenchçProp()"]);
                });
            });

            it("should jump to function name with non ascii chars", function () {
                var start        = { line: 16, ch: 12 };

                testEditor.setCursorPos(start);
                runs(function () {
                    editorJumped({line: 12, ch: 20});
                });
            });
        });

        describe("Code Hinting Regression", function () {
            var testFile = extensionPath + "/unittest-files/module-test-files/china/cupFiller.js";

            beforeEach(function () {
                setupTest(testFile, true);
            });

            afterEach(function () {
                tearDownTest();
            });

            // The test is disabled, because the TernWorker will consult the ProjectManager to
            // determine all the files in the project root. We don't have a project root for this
            // testcase. Perhaps we need to change the testsetup or find another way of dealing with this
            // Test makes sure that http://github.com/adobe/brackets/issue/6931 doesn't show up
            xit("should show hints for members of referenced class", function () {
                var start = { line: 8, ch: 15 };

                runs(function () {
                    testEditor.setCursorPos(start);
                    var hintObj = expectHints(JSCodeHints.jsHintProvider);
                    hintsPresentExact(hintObj, ["empty", "emptyIt", "fill", "full"]);
                });
            });
        });

        describe("JavaScript Code Hinting format parameters tests", function () {

            it("should format parameters with no params", function () {
                var params = [];

                expect(HintUtils2.formatParameterHint(params)).toBe("");
            });

            it("should format parameters with one param", function () {
                var params = [{name: "param1", type: "String"}];

                expect(HintUtils2.formatParameterHint(params)).toBe("String param1");
            });

            it("should format parameters with one optional param", function () {
                var params = [{name: "param1", type: "String", isOptional: true}];

                expect(HintUtils2.formatParameterHint(params)).toBe("[String param1]");
            });

            it("should format parameters with one required, one optional param", function () {
                var params = [{name: "param1", type: "String"},
                              {name: "param2", type: "String", isOptional: true}];

                expect(HintUtils2.formatParameterHint(params)).toBe("String param1, [String param2]");
            });

            it("should format parameters with required param following an optional param", function () {
                var params = [{name: "param1", type: "String"},
                    {name: "param2", type: "String", isOptional: true},
                    {name: "param3", type: "String"}];

                expect(HintUtils2.formatParameterHint(params)).toBe("String param1, [String param2, String param3]");
            });

            it("should format parameters with optional param following an optional param", function () {
                var params = [{name: "param1", type: "String"},
                    {name: "param2", type: "String", isOptional: true},
                    {name: "param3", type: "String", isOptional: true}];

                expect(HintUtils2.formatParameterHint(params)).toBe("String param1, [String param2], [String param3]");
            });

            it("should format parameters with optional param following optional and required params", function () {
                var params = [{name: "param1", type: "String"},
                    {name: "param2", type: "String", isOptional: true},
                    {name: "param3", type: "String"},
                    {name: "param4", type: "String", isOptional: true}];

                expect(HintUtils2.formatParameterHint(params)).toBe("String param1, [String param2, String param3], [String param4]");
            });

        });
    });
});
