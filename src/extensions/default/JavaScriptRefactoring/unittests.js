/*
 *  Modified Work Copyright (c) 2021 - present core.ai . All rights reserved.
 *  Original work Copyright (c) 2017 - 2021 Adobe Systems Incorporated. All rights reserved.
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


    var MainViewManager      = brackets.getModule("view/MainViewManager"),
        DocumentManager      = brackets.getModule("document/DocumentManager"),
        FileUtils            = brackets.getModule("file/FileUtils"),
        SpecRunnerUtils      = brackets.getModule("spec/SpecRunnerUtils"),
        Strings              = brackets.getModule("strings"),
        KeyEvent             = brackets.getModule("utils/KeyEvent"),
        ExtractToVariable    = require("ExtractToVariable"),
        ExtractToFunction    = require("ExtractToFunction"),
        TokenUtils           = brackets.getModule("utils/TokenUtils"),
        WrapSelection        = require("WrapSelection"),
        RenameIdentifier     = require("RenameIdentifier");

    var extensionPath   = FileUtils.getNativeModuleDirectoryPath(module),
        testPath        = extensionPath + "/unittest-files/test.js",
        testDoc         = null,
        testEditor;

    describe("Javascript Refactoring ", function () {

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
            });
        }

        function tearDownTest() {
            // The following call ensures that the document is reloaded
            // from disk before each test
            MainViewManager._closeAll(MainViewManager.ALL_PANES);
            SpecRunnerUtils.destroyMockEditor(testDoc);
            testEditor = null;
            testDoc = null;
        }

        function _waitForRefactoring(prevDocLength, numberOfLines, callback) {
            if (!callback || numberOfLines instanceof Function) {
                callback = numberOfLines;
                numberOfLines = null;
            }
            waitsFor(function() {
                return (testDoc.getText().length !== prevDocLength || (numberOfLines && testDoc.getText().split("\n").length !== numberOfLines));
            }, 3000);
            runs(function() { callback(); });
        }

        function _waitForRename(prevSelections, callback) {
            waitsFor(function() {
                return testEditor.getSelections().length !== prevSelections;
            }, 3000);
            runs(function() { callback(); });
        }

        describe("Extract to variable", function () {
            beforeEach(function () {
                setupTest(testPath, false);
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should extract literal expression", function () {
                testEditor.setSelection({line: 11, ch: 4}, {line: 11, ch: 7});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(11)).toBe("var extracted1 = 923;");
                    expect(testDoc.getLine(12)).toBe("x = extracted1;");
                });
            });

            it("should extract array expression", function () {
                testEditor.setSelection({line: 14, ch: 4}, {line: 14, ch: 13});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(14)).toBe("var extracted1 = [1, 2, 3];");
                    expect(testDoc.getLine(15)).toBe("x = extracted1;");
                });
            });

            it("should extract object expression", function () {
                testEditor.setSelection({line: 17, ch: 4}, {line: 20, ch: 1});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getRange({line: 17, ch: 0}, {line: 20, ch: 2}))
                        .toBe(
                            "var extracted1 = {\n" +
                            "    test1: 12,\n"     +
                            "    test2: 45\n"      +
                            "};"
                        );
                    expect(testDoc.getLine(21)).toBe("x = extracted1;");
                });
            });

            it("should extract property expression", function () {
                testEditor.setSelection({line: 23, ch: 4}, {line: 23, ch: 11});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(23)).toBe("var extracted1 = x.test1;");
                    expect(testDoc.getLine(24)).toBe("x = extracted1;");
                });
            });

            it("should extract function expression", function () {
                testEditor.setSelection({line: 26, ch: 4}, {line: 28, ch: 1});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getRange({line: 26, ch: 0}, {line: 28, ch: 2}))
                        .toBe(
                            "var extracted1 = function() {\n"      +
                            "    console.log(\"hello world\");\n"  +
                            "};"
                        );
                    expect(testDoc.getLine(29)).toBe("x = extracted1;");
                });
            });

            it("should extract unary expression", function () {
                testEditor.setSelection({line: 31, ch: 4}, {line: 31, ch: 7});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(31)).toBe("var extracted1 = ++y;");
                    expect(testDoc.getLine(32)).toBe("x = extracted1;");
                });
            });

            it("should extract binary expression", function () {
                testEditor.setSelection({line: 34, ch: 4}, {line: 34, ch: 13});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(34)).toBe("var extracted1 = 1 + 2 + 3;");
                    expect(testDoc.getLine(35)).toBe("x = extracted1;");
                });
            });

            it("should extract assignment expression", function () {
                testEditor.setSelection({line: 38, ch: 0}, {line: 38, ch: 6});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(38)).toBe("var extracted1 = x = 23;");
                });
            });

            it("should extract assignment expression", function () {
                testEditor.setSelection({line: 41, ch: 3}, {line: 41, ch: 17});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(41)).toBe("var extracted1 = true || false;");
                    expect(testDoc.getLine(42)).toBe("x = extracted1;");
                });
            });

            it("should extract conditional expression", function () {
                testEditor.setSelection({line: 44, ch: 4}, {line: 44, ch: 19});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(44)).toBe("var extracted1 = (2 < 3)? 34: 45;");
                    expect(testDoc.getLine(45)).toBe("x = extracted1;");
                });
            });

            it("should extract new expression", function () {
                testEditor.setSelection({line: 50, ch: 4}, {line: 50, ch: 16});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(50)).toBe("var extracted1 = new Square();");
                    expect(testDoc.getLine(51)).toBe("x = extracted1;");
                });
            });

            it("should extract arrow function", function () {
                testEditor.setSelection({line: 56, ch: 4}, {line: 56, ch: 16});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(56)).toBe("var extracted1 = y => y ** 2;");
                    expect(testDoc.getLine(57)).toBe("x = extracted1;");
                });
            });

            it("should extract template literal", function () {
                testEditor.setSelection({line: 62, ch: 4}, {line: 62, ch: 22});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(62)).toBe("var extracted1 = `Template Literal`;");
                    expect(testDoc.getLine(63)).toBe("x = extracted1;");
                });
            });

            it("should extract tagged template literal", function () {
                testEditor.setSelection({line: 65, ch: 4}, {line: 65, ch: 29});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(65)).toBe("var extracted1 = String.raw`Hi${2 + 3}!`;");
                    expect(testDoc.getLine(66)).toBe("x = extracted1;");
                });
            });

            it("should extract await expression", function () {
                testEditor.setSelection({line: 77, ch: 12}, {line: 77, ch: 42});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(77)).toBe("    var extracted1 = await resolveAfter2Seconds(10);");
                    expect(testDoc.getLine(78)).toBe("    var x = extracted1;");
                });
            });

            it("should extract yield expression", function () {
                testEditor.setSelection({line: 84, ch: 8}, {line: 84, ch: 26});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(84)).toBe("        var extracted1 = yield saleList[i];");
                });
            });

            it("should extract super expression", function () {
                testEditor.setSelection({line: 103, ch: 8}, {line: 103, ch: 29});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(103)).toBe("        var extracted1 = super(length, length);");
                });
            });

            it("should extract class expression", function () {
                testEditor.setSelection({line: 109, ch: 4}, {line: 114, ch: 1});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getRange({line: 109, ch: 0}, {line: 114, ch: 2}))
                    .toBe(
                        "var extracted1 = class {\n"          +
                        "    constructor (height, width) {\n" +
                        "        this.a = height;\n"          +
                        "        this.b = width;\n"           +
                        "    }\n"                            +
                        "};"
                    );
                    expect(testDoc.getLine(115)).toBe("x = extracted1;");
                });
            });

            it("should extract all the references of expression in a scope", function() {
                testEditor.setSelection({line: 118, ch: 12}, {line: 118, ch: 14});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(118)).toBe("    var extracted1 = 34;");
                    expect(testDoc.getLine(119)).toBe("    var x = extracted1;");
                    expect(testDoc.getLine(120)).toBe("    var y = extracted1;");
                    expect(testDoc.getLine(121)).toBe("    var z = extracted1;");
                });
            });

            it("should create variable with unique name", function() {
                testEditor.setSelection({line: 126, ch: 12}, {line: 126, ch: 14});

                var prevDocLength = testDoc.getText().length;

                ExtractToVariable.handleExtractToVariable();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(126)).toBe("    var extracted2 = 45;");
                    expect(testDoc.getLine(127)).toBe("    var x = extracted2;");
                });
            });
        });

        describe("Extract to function", function () {
            beforeEach(function () {
                setupTest(testPath, false);
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should display correct scopes for line inside a function declaration", function () {
                testEditor.setSelection({line: 7, ch: 4}, {line: 7, ch: 28});

                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu.items.length).toBe(2);
                    expect(scopeMenu.items[0].name).toBe("test");
                    expect(scopeMenu.items[1].name).toBe("global");
                });
            });

            it("should display correct scopes for line inside a function expression", function () {
                testEditor.setSelection({line: 27, ch: 4}, {line: 27, ch: 31});

                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu.items.length).toBe(2);
                    expect(scopeMenu.items[0].name).toBe("x");
                    expect(scopeMenu.items[1].name).toBe("global");
                });
            });

            it("should display correct scopes for line inside a arrow function", function () {
                testEditor.setSelection({line: 58, ch: 4}, {line: 58, ch: 17});

                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu.items.length).toBe(2);
                    expect(scopeMenu.items[0].name).toBe("x");
                    expect(scopeMenu.items[1].name).toBe("global");
                });
            });

            it("should display correct scopes for line inside a nested function", function () {
                testEditor.setSelection({line: 71, ch: 12}, {line: 71, ch: 23});

                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu.items.length).toBe(4);
                    expect(scopeMenu.items[0].name).toBe("function starting with {\n            resolve(x);\n    ");
                    expect(scopeMenu.items[1].name).toBe("function starting with {\n        setTimeout(() => {\n ");
                    expect(scopeMenu.items[2].name).toBe("resolveAfter2Seconds");
                    expect(scopeMenu.items[3].name).toBe("global");
                });
            });

            it("should display correct scopes for line inside a class declaration", function () {
                testEditor.setSelection({line: 93, ch: 8}, {line: 93, ch: 27});

                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu.items.length).toBe(3);
                    expect(scopeMenu.items[0].name).toBe("constructor");
                    expect(scopeMenu.items[1].name).toBe("class Polygon");
                    expect(scopeMenu.items[2].name).toBe("global");
                });
            });

            it("should display correct scopes for line inside a class expression", function () {
                testEditor.setSelection({line: 112, ch: 8}, {line: 112, ch: 23});

                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu.items.length).toBe(3);
                    expect(scopeMenu.items[0].name).toBe("constructor");
                    expect(scopeMenu.items[1].name).toBe("class x");
                    expect(scopeMenu.items[2].name).toBe("global");
                });
            });

            it("should extract line in global scope without displaying scopes", function () {
                testEditor.setSelection({line: 4, ch: 0}, {line: 4, ch: 11});

                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu).toBeUndefined();
                    expect(testDoc.getRange({line: 4, ch: 0}, {line: 7, ch: 1}))
                        .toBe(
                            "function extracted1() {\n" +
                            "    var y = 34;\n"     +
                            "    return y;\n"      +
                            "}"
                        );
                    expect(testDoc.getLine(9)).toBe("var y = extracted1();");
                });
            });

            it("should extract a line inside a function declaration", function () {
                testEditor.setSelection({line: 7, ch: 4}, {line: 7, ch: 27});

                var prevDocLength = testDoc.getText().length;
                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu).toBeDefined();
                    var scopeElement = scopeMenu.$menu.find(".inlinemenu-item")[0];
                    expect(scopeElement).toBeDefined();
                    $(scopeElement).trigger("click");
                });

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getRange({line: 7, ch: 0}, {line: 9, ch: 6}))
                        .toBe(
                            "    function extracted1() {\n"       +
                            "        console.log(\"Testing\");\n" +
                            "    }"
                        );
                });
            });

            it("should extract a line inside a class to a class method", function () {
                testEditor.setSelection({line: 104, ch: 8}, {line: 104, ch: 29});

                var prevDocLength = testDoc.getText().length;
                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu).toBeDefined();
                    var scopeElement = scopeMenu.$menu.find(".inlinemenu-item")[1];
                    expect(scopeElement).toBeDefined();
                    $(scopeElement).trigger("click");
                });

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getRange({line: 101, ch: 0}, {line: 103, ch: 6}))
                        .toBe(
                            "    extracted1() {\n"            +
                            "        this.name = 'Square';\n" +
                            "    }"
                        );
                    expect(testDoc.getLine(108)).toBe("        this.extracted1();");
                });
            });

            it("should extract a line inside a class to global scope", function () {
                testEditor.setSelection({line: 104, ch: 8}, {line: 104, ch: 29});

                var prevDocLength = testDoc.getText().length;
                var result = ExtractToFunction.handleExtractToFunction();
                var scopeMenu;

                waitsForDone(result.then(function(inlineMenu) {
                    scopeMenu = inlineMenu;
                }), "Scope not displayed in extract to function", 3000);

                runs(function() {
                    expect(scopeMenu).toBeDefined();
                    var scopeElement = scopeMenu.$menu.find(".inlinemenu-item")[2];
                    expect(scopeElement).toBeDefined();
                    $(scopeElement).trigger("click");
                });

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getRange({line: 100, ch: 0}, {line: 102, ch: 2}))
                        .toBe(
                            "function extracted1() {\n"            +
                            "    this.name = 'Square';\n" +
                            "}"
                        );
                    expect(testDoc.getLine(108)).toBe("        extracted1.call(this);");
                });
            });
        });


        describe("Rename", function () {
            beforeEach(function () {
                setupTest(testPath, false);
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should rename function name", function() {
                testEditor.setSelection({line: 140, ch: 17}, {line: 140, ch: 17});

                var selections = testEditor.getSelections();

                RenameIdentifier.handleRename();


                _waitForRename(selections.length, function() {
                    var selections = testEditor.getSelections(),
                        token1 = TokenUtils.getTokenAt(testEditor._codeMirror, {line: 132, ch: 14}, {line: 132, ch: 14}),
                        token2 = TokenUtils.getTokenAt(testEditor._codeMirror, {line: 140, ch: 17}, {line: 140, ch: 17});

                    expect(selections[0].start.line).toEqual(132);
                    expect(selections[1].start.line).toEqual(140);
                });
            });

            it("should rename variable name", function() {
                testEditor.setSelection({line: 165, ch: 6}, {line: 165, ch: 6});

                var selections = testEditor.getSelections();

                RenameIdentifier.handleRename();


                _waitForRename(selections.length, function() {
                    var selections = testEditor.getSelections(),
                        token1 = TokenUtils.getTokenAt(testEditor._codeMirror, {line: 149, ch: 6}, {line: 149, ch: 6}),
                        token2 = TokenUtils.getTokenAt(testEditor._codeMirror, {line: 150, ch: 13}, {line: 150, ch: 13});

                    expect(selections[0].start.line).toEqual(165);
                    expect(selections[1].start.line).toEqual(168);
                });
            });
        });

        describe("Wrap Selection", function () {
            beforeEach(function () {
                setupTest(testPath, false);
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should wrap selection in Try-Catch block", function() {
                testEditor.setSelection({line: 140, ch: 17}, {line: 140, ch: 17});

                var prevDocLength = testDoc.getText().length;

                WrapSelection.wrapInTryCatch();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(140)).toBe("    try {");
                    expect(testDoc.getLine(141)).toBe("        return addNumbers(a, c) * b;");
                    expect(testDoc.getLine(142)).toBe("    } catch (e) {");
                    expect(testDoc.getLine(143)).toBe("        //Catch Statement");
                    expect(testDoc.getLine(144)).toBe("    }");
                });
            });

            it("should wrap selection in Condition block", function() {
                testEditor.setSelection({line: 140, ch: 17}, {line: 140, ch: 17});

                var prevDocLength = testDoc.getText().length;

                WrapSelection.wrapInCondition();

                _waitForRefactoring(prevDocLength, function() {
                    expect(testDoc.getLine(140)).toBe("    if (Condition) {");
                    expect(testDoc.getLine(141)).toBe("        return addNumbers(a, c) * b;");
                    expect(testDoc.getLine(142)).toBe("    }");
                });
            });
        });

        describe("Arrow Function", function () {
            beforeEach(function () {
                setupTest(testPath, false);
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should convert selected function to arrow function with two param and one return statement", function() {
                testEditor.setSelection({line: 146, ch: 6}, {line: 146, ch: 6});

                var prevDoc = testDoc.getText();

                WrapSelection.convertToArrowFunction();

                _waitForRefactoring(prevDoc.length, prevDoc.split("\n").length, function() {
                    expect(testDoc.getLine(145)).toBe("var sum = (a, b) => a+b;");
                });
            });

            it("should convert selected function to arrow function with one param and one return statement", function() {
                testEditor.setSelection({line: 150, ch: 6}, {line: 150, ch: 6});

                var prevDoc = testDoc.getText();

                WrapSelection.convertToArrowFunction();

                _waitForRefactoring(prevDoc.length, prevDoc.split("\n").length, function() {
                    expect(testDoc.getLine(149)).toBe("var num = a => a;");
                });
            });

            it("should convert selected function to arrow function with two param and two statements", function() {
                testEditor.setSelection({line: 154, ch: 6}, {line: 154, ch: 6});

                var prevDoc = testDoc.getText();

                WrapSelection.convertToArrowFunction();

                _waitForRefactoring(prevDoc.length, prevDoc.split("\n").length, function() {
                    expect(testDoc.getLine(153)).toBe("var sumAll = (a, b) => {");
                });
            });
        });

        describe("Getters-Setters", function () {
            beforeEach(function () {
                setupTest(testPath, false);
            });

            afterEach(function () {
                tearDownTest();
            });

            it("should create Getters Setters for selected property", function() {
                testEditor.setSelection({line: 161, ch: 12}, {line: 161, ch: 12});

                var prevDoc = testDoc.getText();

                WrapSelection.createGettersAndSetters();

                _waitForRefactoring(prevDoc.length, prevDoc.split("\n").length, function() {
                    expect(testDoc.getLine(162)).toBe("    get docCurrent() {");
                    expect(testDoc.getLine(163)).toBe("        return this.docCurrent;");
                    expect(testDoc.getLine(164)).toBe("    },");
                    expect(testDoc.getLine(166)).toBe("    set docCurrent(val) {");
                    expect(testDoc.getLine(167)).toBe("        this.docCurrent = val;");
                    expect(testDoc.getLine(168)).toBe("    },");
                });
            });

            it("should create Getters Setters for last property in context", function() {
                testEditor.setSelection({line: 162, ch: 12}, {line: 162, ch: 12});

                var prevDoc = testDoc.getText();

                WrapSelection.createGettersAndSetters();

                _waitForRefactoring(prevDoc.length, prevDoc.split("\n").length, function() {
                    expect(testDoc.getLine(162)).toBe("    isReadOnly  : false,");
                    expect(testDoc.getLine(163)).toBe("    get isReadOnly() {");
                    expect(testDoc.getLine(164)).toBe("        return this.isReadOnly;");
                    expect(testDoc.getLine(165)).toBe("    },");
                    expect(testDoc.getLine(167)).toBe("    set isReadOnly(val) {");
                    expect(testDoc.getLine(168)).toBe("        this.isReadOnly = val;");
                    expect(testDoc.getLine(169)).toBe("    }");
                });
            });
        });
    });
});
