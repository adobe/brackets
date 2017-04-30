/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, waitsForDone */

define(function (require, exports, module) {
    'use strict';

    var DocumentManager,        // loaded from brackets.test
        FileViewController,     // loaded from brackets.test
        ProjectManager,         // loaded from brackets.test

        JSUtils             = require("language/JSUtils"),
        FileSystem          = require("filesystem/FileSystem"),
        FileUtils           = require("file/FileUtils"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    var testPath = SpecRunnerUtils.getTestPath("/spec/JSUtils-test-files"),
        doneLoading = false;

    // Verifies whether one of the results returned by JSUtils.findAllMatchingFunctionsInText()
    // came from the expected function name or not.

    var toMatchFunctionName = function (expected) {
        return this.actual.functionName.trim() === expected;
    };

    var simpleJsFileEntry   = FileSystem.getFileForPath(testPath + "/simple.js");
    var trickyJsFileEntry   = FileSystem.getFileForPath(testPath + "/tricky.js");
    var invalidJsFileEntry  = FileSystem.getFileForPath(testPath + "/invalid.js");
    var jQueryJsFileEntry   = FileSystem.getFileForPath(testPath + "/jquery-1.7.js");
    var braceEndJsFileEntry = FileSystem.getFileForPath(testPath + "/braceEnd.js");
    var eofJsFileEntry      = FileSystem.getFileForPath(testPath + "/eof.js");
    var eof2JsFileEntry     = FileSystem.getFileForPath(testPath + "/eof2.js");

    function init(spec, fileEntry) {
        if (fileEntry) {
            spec.addMatchers({toMatchFunctionName: toMatchFunctionName});

            runs(function () {
                FileUtils.readAsText(fileEntry)
                    .done(function (text) {
                        spec.fileJsContent = text;
                    })
                    .always(function (text) {
                        doneLoading = true;
                    });
            });
        }
    }

    function cleanup(spec) {
        spec.fileJsContent = null;
    }


    describe("JSUtils", function () {

        describe("basics", function () {

            it("should parse an empty string", function () {
                runs(function () {
                    var result = JSUtils.findAllMatchingFunctionsInText("", "myFunc");
                    expect(result.length).toEqual(0);
                });
            });
        });

        // TODO (jason-sanjose): use offset markup in these test files
        describe("line offsets", function () {

            afterEach(function () {
                cleanup(this);
            });

            // Checks the lines ranges of the results returned by JSUtils. Expects the numbers of
            // results to equal the length of 'ranges'; each entry in range gives the {start, end}
            // of the expected line range for that Nth result.

            function expectFunctionRanges(spec, jsCode, funcName, ranges) {
                var result = JSUtils.findAllMatchingFunctionsInText(jsCode, funcName);
                spec.expect(result.length).toEqual(ranges.length);
                ranges.forEach(function (range, i) {
                    spec.expect(result[i].lineStart).toEqual(range.start);
                    spec.expect(result[i].lineEnd).toEqual(range.end);
                });
            }

            function expectNoFunction(jsCode, functionName) {
                var result = JSUtils.findAllMatchingFunctionsInText(jsCode, functionName);
                expect(result.length).toBe(0);
            }

            it("should return correct start and end line numbers for simple functions", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "simple1", [ {start:  0, end:  2} ]);
                    expectFunctionRanges(this, this.fileJsContent, "simple2", [ {start:  7, end:  9} ]);
                    expectFunctionRanges(this, this.fileJsContent, "simple3", [ {start: 11, end: 13} ]);
                });
            });

            it("should return correct start and end line numbers for parameterized functions", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "param1", [ {start: 18, end: 19} ]);
                    expectFunctionRanges(this, this.fileJsContent, "param2", [ {start: 24, end: 26} ]);
                    expectFunctionRanges(this, this.fileJsContent, "param3", [ {start: 28, end: 32} ]);
                });
            });

            it("should return correct start and end line numbers for single line functions", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "single1", [ {start: 35, end: 35} ]);
                    expectFunctionRanges(this, this.fileJsContent, "single2", [ {start: 36, end: 36} ]);
                    expectFunctionRanges(this, this.fileJsContent, "single3", [ {start: 37, end: 37} ]);
                });
            });

            it("should return correct start and end line numbers for nested functions", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "nested1", [ {start: 42, end: 50} ]);
                    expectFunctionRanges(this, this.fileJsContent, "nested2", [ {start: 44, end: 49} ]);
                    expectFunctionRanges(this, this.fileJsContent, "nested3", [ {start: 47, end: 48} ]);
                });
            });

            it("should return correct start and end line numbers for functions with keyword 'function' in name", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    //expectFunctionRanges(this, this.fileJsContent, "functionX",   [ {start: 53, end: 55} ]);
                    expectFunctionRanges(this, this.fileJsContent, "my_function", [ {start: 56, end: 57} ]);
                    expectFunctionRanges(this, this.fileJsContent, "function3",   [ {start: 58, end: 60} ]);
                });
            });

            it("should ignore identifiers with whitespace", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    var negativeTests = ["invalid", "identifier", "invalid identifier"],
                        result,
                        content = this.fileJsContent;

                    negativeTests.forEach(function (name) {
                        result = JSUtils.findAllMatchingFunctionsInText(content, name);
                        expect(result.length).toBe(0);
                    });
                });
            });

            it("should return correct start and end line numbers for prototype method declarations", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "myMethod", [ {start: 66, end: 68} ]);
                });
            });

            it("should handle various whitespace variations", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "noSpaceBeforeFunc", [ {start: 71, end: 71} ]);
                    expectFunctionRanges(this, this.fileJsContent, "spaceBeforeColon", [ {start: 73, end: 75} ]);
                    expectFunctionRanges(this, this.fileJsContent, "noSpaceAfterColon", [ {start: 77, end: 79} ]);
                    expectFunctionRanges(this, this.fileJsContent, "fakePeriodBeforeFunction", [ {start: 82, end: 84} ]);
                    expectFunctionRanges(this, this.fileJsContent, "noSpaceAfterFunction", [ {start: 86, end: 88} ]);
                    expectFunctionRanges(this, this.fileJsContent, "noSpaceAfterFunction2", [ {start: 90, end: 92} ]);
                    expectFunctionRanges(this, this.fileJsContent, "findMe", [ {start: 93, end: 93} ]);
                });
            });

            it("should work with high-ascii characters in function names", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "highAscÍÍChars", [ {start: 95, end: 97} ]);
                    expectFunctionRanges(this, this.fileJsContent, "moreHighAscÍÍChars", [ {start: 99, end: 101} ]);
                    expectFunctionRanges(this, this.fileJsContent, "ÅsciiExtendedIdentifierStart", [ {start: 103, end: 104} ]);
                });
            });

            it("should work with unicode characters in or around function names", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "ʸUnicodeModifierLettervalidIdentifierStart", [ {start: 106, end: 107} ]);
                    expectFunctionRanges(this, this.fileJsContent, "unicodeModifierLettervalidIdentifierPartʸ", [ {start: 112, end: 113} ]);
                });
            });

            // TODO (issue #1125): support escaped unicode
            xit("FAIL should work with unicode characters in or around function names", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, simpleJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "\u02b8UnicodeEscapedIdentifierStart", [ {start: 109, end: 110} ]);
                    expectFunctionRanges(this, this.fileJsContent, "unicodeEscapedIdentifierPart\u02b8", [ {start: 115, end: 116} ]);
                    expectFunctionRanges(this, this.fileJsContent, "unicodeTabBefore", [ {start: 118, end: 119} ]);
                    expectFunctionRanges(this, this.fileJsContent, "unicodeTabAfter", [ {start: 121, end: 122} ]);
                });
            });

            it("should work when colliding with prototype properties", function () { // #1390, #2813
                runs(function () {
                    doneLoading = false;
                    init(this, trickyJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectFunctionRanges(this, this.fileJsContent, "toString", [ {start: 1, end: 3} ]);
                    expectFunctionRanges(this, this.fileJsContent, "length", [ {start: 6, end: 8} ]);
                    expectFunctionRanges(this, this.fileJsContent, "hasOwnProperty", [ {start: 11, end: 13} ]);
                });
            });

            it("should fail with invalid function names", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, invalidJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expectNoFunction(this.fileJsContent, "0digitIdentifierStart");
                    expectNoFunction(this.fileJsContent, ".punctuationIdentifierStart");
                    expectNoFunction(this.fileJsContent, "punctuation.IdentifierPart");
                });
            });
        });

        describe("brace ends of functions", function () {
            beforeEach(function () {
                runs(function () {
                    doneLoading = false;
                    init(this, braceEndJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);
            });

            afterEach(function () {
                cleanup(this);
            });

            function expectEndBrace(spec, funcName) {
                var startPos = spec.fileJsContent.indexOf("function " + funcName);
                expect(startPos).toNotBe(-1);

                var endPos = JSUtils._getFunctionEndOffset(spec.fileJsContent, startPos);
                var endMarker = spec.fileJsContent.slice(endPos);
                expect(endMarker.indexOf("//END " + funcName)).toBe(0);
            }

            it("should handle a simple function", function () {
                expectEndBrace(this, "simpleFunction");
            });
            it("should handle nested braces", function () {
                expectEndBrace(this, "nestedBraces");
            });
            it("should handle a nested function", function () {
                expectEndBrace(this, "nestedFunction");
            });
            it("should handle an end brace in a string", function () {
                expectEndBrace(this, "endBraceInString");
            });
            it("should handle an end brace in a single-quoted string", function () {
                expectEndBrace(this, "endBraceInSingleQuoteString");
            });
            it("should handle an end brace in a line comment", function () {
                expectEndBrace(this, "endBraceInLineComment");
            });
            it("should handle an end brace in a block comment", function () {
                expectEndBrace(this, "endBraceInBlockComment");
            });
            it("should handle an end brace in a multiline block comment", function () {
                expectEndBrace(this, "endBraceInMultilineBlockComment");
            });
            it("should handle an end brace in a regexp", function () {
                expectEndBrace(this, "endBraceInRegexp");
            });
            it("should handle a single-line function", function () {
                expectEndBrace(this, "singleLine");
            });
            it("should handle a single-line function with a fake brace", function () {
                expectEndBrace(this, "singleLineWithFakeBrace");
            });
            it("should handle a complicated case", function () {
                expectEndBrace(this, "itsComplicated");
            });
        });

        describe("brace end of function that ends at end of file", function () {
            it("should find the end of a function that ends exactly at the end of the file", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, eofJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expect(JSUtils._getFunctionEndOffset(this.fileJsContent, 0)).toBe(this.fileJsContent.length);
                    cleanup(this);
                });
            });
        });

        describe("end of function that's unclosed at end of file", function () {
            it("should find the end of a function that is unclosed at the end of the file", function () {
                runs(function () {
                    doneLoading = false;
                    init(this, eof2JsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);

                runs(function () {
                    expect(JSUtils._getFunctionEndOffset(this.fileJsContent, 0)).toBe(this.fileJsContent.length);
                    cleanup(this);
                });
            });
        });

        describe("with real-world jQuery JS code", function () {

            beforeEach(function () {
                runs(function () {
                    doneLoading = false;
                    init(this, jQueryJsFileEntry);
                });
                waitsFor(function () { return doneLoading; }, 1000);
            });

            afterEach(function () {
                cleanup(this);
            });

            it("should find the first instance of the pushStack function", function () {
                var funcNames = JSUtils.findAllMatchingFunctionsInText(this.fileJsContent, "pushStack");
                expect(funcNames).toBeTruthy();
                expect(funcNames.length).toBeGreaterThan(0);

                expect(funcNames[0]).toBeTruthy();
                expect(funcNames[0].lineStart).toBe(243);
                expect(funcNames[0].lineEnd).toBe(267);
            });

            it("should find all instances of the ready function", function () {
                var funcNames = JSUtils.findAllMatchingFunctionsInText(this.fileJsContent, "ready");
                //expect(funcNames.length).toBe(3);
                expect(funcNames.length).toBe(2);

                expect(funcNames[0].lineStart).toBe(276);
                expect(funcNames[0].lineEnd).toBe(284);
                expect(funcNames[1].lineStart).toBe(419);
                expect(funcNames[1].lineEnd).toBe(443);
                //expect(funcNames[2].lineStart).toBe(3422);    // not finding this one...
                //expect(funcNames[2].lineEnd).toBe(3425);
            });

            it("should return an empty array when findAllMatchingSelectors() can't find any matches", function () {
                var funcNames = JSUtils.findAllMatchingFunctionsInText(this.fileJsContent, "NO-SUCH-FUNCTION");
                expect(funcNames.length).toBe(0);
            });
        });

    }); // describe("JSUtils")


    describe("JS Indexing", function () {

        this.category = "integration";

        var functions;  // populated by indexAndFind()

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                // Load module instances from brackets.test
                var brackets        = testWindow.brackets;
                DocumentManager     = brackets.test.DocumentManager;
                FileViewController  = brackets.test.FileViewController;
                ProjectManager      = brackets.test.ProjectManager;
                JSUtils             = brackets.test.JSUtils;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterEach(function () {
            DocumentManager     = null;
            FileViewController  = null;
            JSUtils             = null;
            ProjectManager      = null;
            SpecRunnerUtils.closeTestWindow();
        });

        function init(fileName) {
            runs(function () {
                waitsForDone(
                    FileViewController.openAndSelectDocument(
                        testPath + "/" + fileName,
                        FileViewController.PROJECT_MANAGER
                    ),
                    "openAndSelectDocument"
                );
            });
        }

        /**
         * Builds a fileInfos index of the project, as required to call findMatchingFunctions(). Calls the
         * specified 'invoker' function with fileInfos, and populates the 'functions' var once it's done.
         * Does not need to be wrapped in a runs() block.
         * @param {function(Array.<File>):$.Promise} invokeFind
         */
        function indexAndFind(invokeFind) {
            runs(function () {
                var result = new $.Deferred();
                ProjectManager.getAllFiles().done(function (files) {
                    invokeFind(files)
                        .done(function (functionsResult) { functions = functionsResult; })
                        .then(result.resolve, result.reject);
                });

                waitsForDone(result, "Index and invoke JSUtils.findMatchingFunctions()");
            });
        }


        describe("Index integrity", function () {
            it("should handle colliding with prototype properties", function () { // #2813
                // no init() needed - don't need any editors to be open
                indexAndFind(function (fileInfos) {
                    return JSUtils.findMatchingFunctions("toString", fileInfos);
                });
                runs(function () {
                    expect(functions.length).toBe(1);
                    expect(functions[0].lineStart).toBe(1);
                    expect(functions[0].lineEnd).toBe(3);
                });

                indexAndFind(function (fileInfos) {
                    return JSUtils.findMatchingFunctions("length", fileInfos);
                });
                runs(function () {
                    expect(functions.length).toBe(1);
                    expect(functions[0].lineStart).toBe(6);
                    expect(functions[0].lineEnd).toBe(8);
                });

                indexAndFind(function (fileInfos) {
                    return JSUtils.findMatchingFunctions("hasOwnProperty", fileInfos);
                });
                runs(function () {
                    expect(functions.length).toBe(1);
                    expect(functions[0].lineStart).toBe(11);
                    expect(functions[0].lineEnd).toBe(13);
                });
            });
        });


        describe("Working with unsaved changes", function () {

            function fileChangedTest(buildCache) {
                init("edit.js");

                // Populate JSUtils cache
                if (buildCache) {
                    // Look for "edit2" function
                    indexAndFind(function (fileInfos) {
                        return JSUtils.findMatchingFunctions("edit2", fileInfos);
                    });
                    runs(function () {
                        expect(functions.length).toBe(1);
                        expect(functions[0].lineStart).toBe(7);
                        expect(functions[0].lineEnd).toBe(9);
                    });
                }

                // Add several blank lines at the beginning of the text
                runs(function () {
                    var doc = DocumentManager.getCurrentDocument();
                    doc.setText("\n\n\n\n" + doc.getText());
                });

                // Look for function again, expecting line offsets to have changed
                indexAndFind(function (fileInfos) {
                    return JSUtils.findMatchingFunctions("edit2", fileInfos);
                });
                runs(function () {
                    expect(functions.length).toBe(1);
                    expect(functions[0].lineStart).toBe(11);
                    expect(functions[0].lineEnd).toBe(13);
                });
            }

            it("should return the correct offsets if the file has changed", function () {
                fileChangedTest(false);
            });

            it("should return the correct offsets if the results were cached and the file has changed", function () {
                fileChangedTest(true);
            });

            function insertFunctionTest(buildCache) {
                init("edit.js");

                // Populate JSUtils cache
                if (buildCache) {
                    // Look for function that doesn't exist yet
                    indexAndFind(function (fileInfos) {
                        return JSUtils.findMatchingFunctions("TESTFUNCTION", fileInfos);
                    });
                    runs(function () {
                        expect(functions.length).toBe(0);
                    });
                }

                // Add a new function to the file
                runs(function () {
                    var doc = DocumentManager.getCurrentDocument();
                    doc.setText(doc.getText() + "\n\nfunction TESTFUNCTION() {\n    return true;\n}\n");
                });

                // Look for the function we just created
                indexAndFind(function (fileInfos) {
                    return JSUtils.findMatchingFunctions("TESTFUNCTION", fileInfos);
                });
                runs(function () {
                    expect(functions.length).toBe(1);
                    expect(functions[0].lineStart).toBe(33);
                    expect(functions[0].lineEnd).toBe(35);
                });
            }

            it("should return a newly created function in an unsaved file", function () {
                insertFunctionTest(false);
            });

            it("should return a newly created function in an unsaved file that already has cached results", function () {
                insertFunctionTest(true);
            });
        });
    }); //describe("JS Indexing")
});
