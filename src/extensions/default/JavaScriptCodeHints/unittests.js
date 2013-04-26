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

    var Editor              = brackets.getModule("editor/Editor").Editor,
        EditorManager       = brackets.getModule("editor/EditorManager"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        UnitTestReporter    = brackets.getModule("test/UnitTestReporter"),
        JSCodeHints         = require("main");

    var extensionPath   = FileUtils.getNativeModuleDirectoryPath(module),
        testPath        = extensionPath + "/test/file1.js",
        testDoc         = null,
        testEditor;

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
            waitsFor(function () {
                var cursor = testEditor.getCursorPos();
                return (cursor.line !== oldLocation.line) ||
                        (cursor.ch !== oldLocation.ch);
            }, "Expected jump did not occur", 3000);

            runs(function () { callback(testEditor.getCursorPos()); });
        }
        
        /**
         * Trigger a jump to definition, and verify that the editor jumped to 
         * the expected location.
         *
         * @param {{line:number, ch:number}} expectedLocation - the location the editor should
         *      jump to.
         */
        function editorJumped(expectedLocation) {
            var oldLocation = testEditor.getCursorPos();
            
            JSCodeHints.handleJumpToDefinition();
            
            
            _waitForJump(oldLocation, function (newCursor) {
                expect(newCursor.line).toBe(expectedLocation.line);
                expect(newCursor.ch).toBe(expectedLocation.ch);
            });
            
        }
        
        describe("JavaScript Code Hinting", function () {
   
            beforeEach(function () {
                
                DocumentManager.getDocumentForPath(testPath).done(function (doc) {
                    testDoc = doc;
                });
                
                waitsFor(function () {
                    return testDoc !== null;
                }, "Unable to open test document", 10000);
                
                // create Editor instance (containing a CodeMirror instance)
                runs(function () {
                    testEditor = createMockEditor(testDoc);
                    JSCodeHints.initializeSession(testEditor);
                });
            });
            
            afterEach(function () {
                // The following call ensures that the document is reloaded 
                // from disk before each test
                DocumentManager.closeAll();
                
                SpecRunnerUtils.destroyMockEditor(testDoc);
                testEditor = null;
                testDoc = null;
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

        });

    });
});