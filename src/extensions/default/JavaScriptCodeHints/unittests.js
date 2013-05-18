/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    var Commands            = brackets.getModule("command/Commands"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Editor              = brackets.getModule("editor/Editor").Editor,
        EditorManager       = brackets.getModule("editor/EditorManager"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        UnitTestReporter    = brackets.getModule("test/UnitTestReporter"),
        JSCodeHints         = require("main");

    var extensionPath   = FileUtils.getNativeModuleDirectoryPath(module),
        testPath        = extensionPath + "/unittest-files/basic-test-files/file1.js",
        testHtmlPath    = extensionPath + "/unittest-files/basic-test-files/index.html",
        testDoc         = null,
        testEditor;

    CommandManager.register("test-file-open", Commands.FILE_OPEN, function (fileInfo) {
        // Register a command for FILE_OPEN, which the jump to def code will call
        return DocumentManager.getDocumentForPath(fileInfo.fullPath).done(function (doc) {
            DocumentManager.setCurrentDocument(doc);
        });
    });
    /**
     * Returns an Editor suitable for use in isolation, given a Document. (Unlike
     * SpecRunnerUtils.createMockEditor(), which is given text and creates the Document
     * for you).
     *
     * @param {Document} doc - the document to be contained by the new Editor
     * @return {Editor} - the mock editor object
     */
    function createMockEditor(doc) {
        // Initialize EditorManager
        var $editorHolder = $("<div id='mock-editor-holder'/>");
        EditorManager.setEditorHolder($editorHolder);
        $("body").append($editorHolder);
        
        // create Editor instance
        var editor = new Editor(doc, true, $editorHolder.get(0));

        EditorManager._notifyActiveEditorChanged(editor);
        
        return editor;
    }

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
                expect(hintList).not.toBeNull();
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
                expect(hintList).not.toBeNull();
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
                expect(hintList).not.toBeNull();
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
                expect(hintList).not.toBeNull();
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
            var hintList = expectHints(provider);
            _waitForHints(hintObj, function (hintList) {
                expect(hintList).not.toBeNull();
                var index = findHint(hintList, hintSelection);
                expect(hintList[index].data("token")).not.toBeNull();
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
        function _waitForJump(oldLocation, callback) {
            var cursor = null;
            waitsFor(function () {
                var activeEditor = EditorManager.getActiveEditor();
                cursor = activeEditor.getCursorPos();
                return (cursor.line !== oldLocation.line) ||
                        (cursor.ch !== oldLocation.ch);
            }, "Expected jump did not occur", 3000);

            runs(function () { callback(cursor); });
        }
        
        /**
         * Trigger a jump to definition, and verify that the editor jumped to 
         * the expected location.
         *
         * @param {{line:number, ch:number, file:string}} expectedLocation - the 
         *  line, column, and optionally the new file the editor should jump to.  If the
         *  editor is expected to stay in the same file, then file may be omitted.  
         */
        function editorJumped(expectedLocation) {
            var oldLocation = testEditor.getCursorPos();
            
            JSCodeHints.handleJumpToDefinition();
            
            
            _waitForJump(oldLocation, function (newCursor) {
                expect(newCursor.line).toBe(expectedLocation.line);
                expect(newCursor.ch).toBe(expectedLocation.ch);
                if (expectedLocation.file) {
                    var activeEditor = EditorManager.getActiveEditor();
                    expect(activeEditor.document.file.name).toBe(expectedLocation.file);
                }
            });
            
        }

        function setupTest(path, primePump) {
            DocumentManager.getDocumentForPath(path).done(function (doc) {
                testDoc = doc;
            });

            waitsFor(function () {
                return testDoc !== null;
            }, "Unable to open test document", 10000);

            // create Editor instance (containing a CodeMirror instance)
            runs(function () {
                testEditor = createMockEditor(testDoc);
            });
        }

        function tearDownTest() {
            // The following call ensures that the document is reloaded
            // from disk before each test
            DocumentManager.closeAll();

            SpecRunnerUtils.destroyMockEditor(testDoc);
            testEditor = null;
            testDoc = null;
        }

        describe("JavaScript Code Hinting Basic", function () {

            beforeEach(function () {
                setupTest(testPath, false);
            });
            
            afterEach(function () {
                tearDownTest();
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
/*            
            it("should list explicitly defined globals from JSLint annotations", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["brackets", "$"]);
            });
            
            it("should list implicitly defined globals from JSLint annotations", function () {
                testEditor.setCursorPos({ line: 6, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["alert", "console", "confirm", "navigator", "window", "frames"]);
            });
 */
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
/*
            it("should list string literals that occur in the file", function () {
                testEditor.setCursorPos({ line: 12, ch: 0 });
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                hintsPresent(hintObj, ["use strict"]);
            });
*/
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
                expectHints(JSCodeHints.jsHintProvider, ".");
            });

/*          Single quote and double quote keys cause hasHints() to return false.
            It used to return true when string literals were supported.
            it("should list implicit hints when typing string literals (single quote)", function () {
                testEditor.setCursorPos({ line: 9, ch: 0 });
                expectHints(JSCodeHints.jsHintProvider, "'");
            });
            
            it("should list implicit hints when typing string literals (double quote)", function () {
                testEditor.setCursorPos({ line: 9, ch: 0 });
                expectHints(JSCodeHints.jsHintProvider, "\"");
            });
*/
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
            
/*            it("should choose the correct delimiter for string literal hints with no query", function () {
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
*/
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
            
            it("should replace property hints with no current query", function () {
                var start   = { line: 6, ch: 0 },
                    middle  = { line: 6, ch: 3 },
                    end     = { line: 6, ch: 8 };

                testDoc.replaceRange("A1.prop", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "propA");
                
                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, end)).toEqual("A1.propA");
                    expect(testDoc.getLine(end.line).length).toEqual(8);
                });
            });
            
            it("should replace property hints with a partial current query", function () {
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
                    end     = { line: 6, ch: 8 };
                
                testDoc.replaceRange("A1.propB", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "propA");
                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, end)).toEqual("A1.propA");
                    expect(testDoc.getLine(end.line).length).toEqual(8);
                });
            });

            it("should replace property hints but not following delimiters", function () {
                var start   = { line: 6, ch: 0 },
                    middle  = { line: 6, ch: 4 },
                    end     = { line: 6, ch: 9 },
                    endplus = { line: 6, ch: 10 };

                testDoc.replaceRange("(A1.prop)", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                selectHint(JSCodeHints.jsHintProvider, hintObj, "propA");

                runs(function () {
                    expect(testEditor.getCursorPos()).toEqual(end);
                    expect(testDoc.getRange(start, endplus)).toEqual("(A1.propA)");
                    expect(testDoc.getLine(endplus.line).length).toEqual(10);
                });
            });

            it("should list hints for string, as string assigned to 's', 's' assigned to 'r' and 'r' assigned to 't'", function () {
                var start = { line: 26, ch: 0 },
                    middle = { line: 26, ch: 2 };
                
                testDoc.replaceRange("t.", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["charAt", "charCodeAt", "concat", "indexOf"]);
                });
            });

            it("should list function type", function () {
                var start = { line: 36, ch: 0 },
                    middle = { line: 36, ch: 5 };
                
                testDoc.replaceRange("funD(", start, start);
                testEditor.setCursorPos(middle);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["funD(a: string, b: number) -> {x, y}"]);
                });
            });

            it("should list exports from a requirejs module", function () {
                var start = { line: 40, ch: 21 };
                
                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["a", "b", "j"]);
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
                var start = { line: 12, ch: 10 };
                
                testDoc.replaceRange("param", start, start);
                testEditor.setCursorPos(start);
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
                testDoc.replaceRange("String.prototype.times = function (count) {\n" + "\treturn count < 1 ? '' : new Array[count + 1].join(this);\n};\n\"hello\".time", start, start);
                testEditor.setCursorPos(testPos);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["times", "trimLeft"]);
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
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["calc(a4: number, b4: number) -> number"]);
                });
            });
            
            it("should list function inhertated from super class", function () {
                var start = { line: 79, ch: 11 };
                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["getAmountDue", "getName", "name", "setAmountDue"]);
                });
            });
 
            it("should show argument from from .prototype.Method", function () {
                var start = { line: 80, ch: 0 },
                    testPos = { line: 80, ch: 24 };
                
                testDoc.replaceRange("myCustomer.setAmountDue(", start);
                testEditor.setCursorPos(testPos);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["setAmountDue(amountDue: ?)"]);
                });
            });
            
            it("should show guessed argument type from current passing parameter", function () {
                var start = { line: 80, ch: 0 },
                    testPos = { line: 80, ch: 24 };
                
                testDoc.replaceRange("myCustomer.setAmountDue(10)", start);
                testEditor.setCursorPos(testPos);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["setAmountDue(amountDue: number)"]);
                });
            });
            
            it("should show inner function type", function () {
                var testPos = { line: 96, ch: 23 };
                
                testEditor.setCursorPos(testPos);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["innerFunc(arg: string) -> {t}"]);
                });
            });
            
            it("should show type for inner function returned function", function () {
                var testPos = { line: 96, ch: 33 };
                
                testEditor.setCursorPos(testPos);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentOrdered(hintObj, ["t() -> string"]);
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
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["funFuncArg(f: fn() -> number) -> number"]);
                });
            });

            // parameter type anotation tests
            it("should list parameter function type and best guess for function call/return types", function () {
                var testPos = { line: 139, ch: 12 };
                
                testEditor.setCursorPos(testPos);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["funFunc2Arg(f: fn(s: string, n: number) -> string)"]);
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
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["index1() -> number"]);
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

            it("should not hint function, variable, or param decls", function () {
                var func = { line: 7, ch: 12 },
                    param = { line: 7, ch: 18 },
                    variable = { line: 10, ch: 10 };
                
                runs(function () {
                    testEditor.setCursorPos(func);
                    expectNoHints(JSCodeHints.jsHintProvider);
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
                // check we have a properties from "Function", "Array", and "Date"
                hintsPresentOrdered(hintObj, ["apply", "concat", "getSeconds"]);
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
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["foo(a: number) -> string"]);
                });
            });
            
            it("should show function type code hint for function in script file inside html file", function () {
                var start = { line: 22, ch: 17 };
                
                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["funD(a: string, b: number) -> {x, y}"]);
                });
            });

            it("should show function type code hint for function in another script file inside html file", function () {
                var start = { line: 23, ch: 17 };
                
                testEditor.setCursorPos(start);
                var hintObj = expectHints(JSCodeHints.jsHintProvider);
                runs(function () {
                    hintsPresentExact(hintObj, ["funE(paramE1: D1, paramE2: number)"]);
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

            beforeEach(function () {
                setupTest(testPath, true);
            });

            afterEach(function () {
                tearDownTest();
            });

            // Test reading multiple files and subdirectories
            it("should handle reading all files when modules not used", function () {
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
            it("should read methods created in submodule", function () {
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
            
            // bug in test framework? can't run sequencial jump, verification is wrong 
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
    });
});
