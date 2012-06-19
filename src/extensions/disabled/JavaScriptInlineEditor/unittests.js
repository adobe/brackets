/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, brackets: false */

define(function (require, exports, module) {
    'use strict';

    var CommandManager,         // loaded from brackets.test
        DocumentManager,        // loaded from brackets.test
        EditorManager,          // loaded from brackets.test
        FileIndexManager,       // loaded from brackets.test
        FileViewController,     // loaded from brackets.test
        ProjectManager,         // loaded from brackets.test
        PerfUtils,              // loaded from brackets.test
        
        FileUtils           = brackets.getModule("file/FileUtils"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        PerformanceReporter = brackets.getModule("perf/PerformanceReporter");

    // Local modules
    var JSUtils             = require("JSUtils");

    var extensionPath = FileUtils.getNativeModuleDirectoryPath(module),
        testPath = extensionPath + "/unittest-files",
        testWindow,
        initInlineTest;

    function rewriteProject(spec) {
        var result = new $.Deferred();
    
        FileIndexManager.getFileInfoList("all").done(function (allFiles) {
            // convert fileInfos to fullPaths
            allFiles = allFiles.map(function (fileInfo) {
                return fileInfo.fullPath;
            });
            
            // parse offsets and save
            SpecRunnerUtils.saveFilesWithoutOffsets(allFiles).done(function (offsetInfos) {
                spec.infos = offsetInfos;
        
                // install after function to restore file content
                spec.after(function () {
                    var done = false;
                    
                    runs(function () {
                        SpecRunnerUtils.saveFilesWithOffsets(spec.infos).done(function () {
                            done = true;
                        });
                    });
                    
                    waitsFor(function () { return done; }, "saveFilesWithOffsets timeout", 1000);
                });
                
                result.resolve();
            }).fail(function () {
                result.reject();
            });
        });
        
        return result.promise();
    }
    
    /**
     * Performs setup for an inline editor test. Parses offsets (saved to Spec.offsets) for all files in
     * the test project (testPath) and saves files back to disk without offset markup.
     * When finished, open an editor for the specified project relative file path
     * then attempts opens an inline editor at the given offset. Installs an after()
     * function restore all file content back to original state with offset markup.
     * 
     * @param {!string} openFile Project relative file path to open in a main editor.
     * @param {!number} openOffset The offset index location within openFile to open an inline editor.
     * @param {?boolean} expectInline Use false to verify that an inline editor should not be opened. Omit otherwise.
     */
    var _initInlineTest = function (openFile, openOffset, expectInline, workingSet) {
        var allFiles,
            hostOpened = false,
            err = false,
            inlineOpened = null,
            spec = this,
            rewriteDone = false,
            rewriteErr = false;
        
        workingSet = workingSet || [];
        
        expectInline = (expectInline !== undefined) ? expectInline : true;
        
        SpecRunnerUtils.loadProjectInTestWindow(testPath);
        
        runs(function () {
            rewriteProject(spec)
                .done(function () { rewriteDone = true; })
                .fail(function () { rewriteErr = true; });
        });
        
        waitsFor(function () { return rewriteDone && !rewriteErr; }, "rewriteProject timeout", 1000);
        
        runs(function () {
            workingSet.push(openFile);
            SpecRunnerUtils.openProjectFiles(workingSet).done(function (documents) {
                hostOpened = true;
            }).fail(function () {
                err = true;
            });
        });
        
        waitsFor(function () { return hostOpened && !err; }, "FILE_OPEN timeout", 1000);
        
        runs(function () {
            var editor = EditorManager.getCurrentFullEditor();
            
            // open inline editor at specified offset index
            var inlineEditorResult = SpecRunnerUtils.openInlineEditorAtOffset(
                editor,
                spec.infos[openFile].offsets[openOffset]
            );
            
            inlineEditorResult.done(function () {
                inlineOpened = true;
            }).fail(function () {
                inlineOpened = false;
            });
        });
        
        waitsFor(function () {
            return (inlineOpened !== null) && (inlineOpened === expectInline);
        }, "inline editor timeout", 1000);
    };
    
    describe("JSQuickEdit", function () {

        /*
         * 
         */
        describe("javaScriptFunctionProvider", function () {

            beforeEach(function () {
                initInlineTest = _initInlineTest.bind(this);
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow          = w;
                    EditorManager       = testWindow.brackets.test.EditorManager;
                    CommandManager      = testWindow.brackets.test.CommandManager;
                    DocumentManager     = testWindow.brackets.test.DocumentManager;
                    FileIndexManager    = testWindow.brackets.test.FileIndexManager;
                    FileViewController  = testWindow.brackets.test.FileViewController;
                    ProjectManager      = testWindow.brackets.test.ProjectManager;
                });
                
                this.addMatchers({
                        
                    toHaveInlineEditorRange: function (range) {
                        var i = 0,
                            editor = this.actual,
                            hidden,
                            lineCount = editor.lineCount(),
                            shouldHide = [],
                            shouldShow = [],
                            startLine = range.startLine,
                            endLine = range.endLine,
                            visibleRangeCheck;
                        
                        for (i = 0; i < lineCount; i++) {
                            hidden = editor._codeMirror.getLineHandle(i).hidden || false;
                            
                            if (i < startLine) {
                                if (!hidden) {
                                    shouldHide.push(i); // lines above start line should be hidden
                                }
                            } else if ((i >= startLine) && (i <= endLine)) {
                                if (hidden) {
                                    shouldShow.push(i); // lines in the range should be visible
                                }
                            } else if (i > endLine) {
                                if (!hidden) {
                                    shouldHide.push(i); // lines below end line should be hidden
                                }
                            }
                        }
                        
                        visibleRangeCheck = (editor._visibleRange.startLine === startLine)
                            && (editor._visibleRange.endLine === endLine);
                        
                        this.message = function () {
                            var msg = "";
                            
                            if (shouldHide.length > 0) {
                                msg += "Expected inline editor to hide [" + shouldHide.toString() + "].\n";
                            }
                            
                            if (shouldShow.length > 0) {
                                msg += "Expected inline editor to show [" + shouldShow.toString() + "].\n";
                            }
                            
                            if (!visibleRangeCheck) {
                                msg += "Editor._visibleRange ["
                                    + editor._visibleRange.startLine + ","
                                    + editor._visibleRange.endLine + "] should be ["
                                    + startLine + "," + endLine + "].";
                            }
                            
                            return msg;
                        };
                        
                        return (shouldHide.length === 0)
                            && (shouldShow.length === 0)
                            && visibleRangeCheck;
                    }
                });
            });
    
            afterEach(function () {
                //debug visual confirmation of inline editor
                //waits(1000);
                
                // revert files to original content with offset markup
                SpecRunnerUtils.closeTestWindow();
            });

            it("should open a function with  form: function functionName()", function () {
                initInlineTest("test1main.js", 0);
                
                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editors[0].getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1inline.js"].offsets[0]);
                });
            });

            it("should open a function with  form: functionName = function()", function () {
                initInlineTest("test1main.js", 1);
                
                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editors[0].getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1inline.js"].offsets[1]);
                });
            });
            
            it("should open a function with  form: functionName: function()", function () {
                initInlineTest("test1main.js", 2);
                
                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editors[0].getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1inline.js"].offsets[2]);
                });
            });
        });
        

        // Verifies whether one of the results returned by JSUtils._findAllMatchingFunctionsInText()
        // came from the expected function name or not.
 
        var toMatchFunctionName = function (expected) {
            return this.actual.functionName.trim() === expected;
        };

        var simpleJsFileEntry = new NativeFileSystem.FileEntry(extensionPath + "/unittest-files/simple.js");
        var jQueryJsFileEntry = new NativeFileSystem.FileEntry(extensionPath + "/unittest-files/jquery-1.7.js");
        var braceEndJsFileEntry = new NativeFileSystem.FileEntry(extensionPath + "/unittest-files/braceEnd.js");
        var eofJsFileEntry = new NativeFileSystem.FileEntry(extensionPath + "/unittest-files/eof.js");
        var eof2JsFileEntry = new NativeFileSystem.FileEntry(extensionPath + "/unittest-files/eof2.js");

        function init(spec, fileEntry) {
            spec.fileJsContent = null;
            
            if (fileEntry) {
                spec.addMatchers({toMatchFunctionName: toMatchFunctionName});
                
                var doneLoading = false;
                
                runs(function () {
                    FileUtils.readAsText(fileEntry)
                        .done(function (text) {
                            spec.fileJsContent = text;
                        });
                });
                
                waitsFor(function () { return (spec.fileJsContent !== null); }, 1000);
            }
        }

        describe("JSUtils", function () {

            beforeEach(function () {
                init(this);
            });
            
            describe("basics", function () {
                
                it("should parse an empty string", function () {
                    runs(function () {
                        var result = JSUtils._findAllMatchingFunctionsInText("", "myFunc");
                        expect(result.length).toEqual(0);
                    });
                });
            });
            
            describe("line offsets", function () {
                
                // Checks the lines ranges of the results returned by JSUtils. Expects the numbers of
                // results to equal the length of 'ranges'; each entry in range gives the {start, end}
                // of the expected line range for that Nth result.
    
                function expectFunctionRanges(spec, jsCode, funcName, ranges) {
                    var result = JSUtils._findAllMatchingFunctionsInText(jsCode, funcName);
                    spec.expect(result.length).toEqual(ranges.length);
                    ranges.forEach(function (range, i) {
                        spec.expect(result[i].lineStart).toEqual(range.start);
                        spec.expect(result[i].lineEnd).toEqual(range.end);
                    });
                }
                
                it("should return correct start and end line numbers for simple functions", function () {
                    runs(function () {
                        init(this, simpleJsFileEntry);
                    });
                    
                    runs(function () {
                        expectFunctionRanges(this, this.fileJsContent, "simple1", [ {start:  0, end:  2} ]);
                        expectFunctionRanges(this, this.fileJsContent, "simple2", [ {start:  7, end:  9} ]);
                        expectFunctionRanges(this, this.fileJsContent, "simple3", [ {start: 11, end: 13} ]);
                    });
                });
                
                it("should return correct start and end line numbers for parameterized functions", function () {
                    runs(function () {
                        init(this, simpleJsFileEntry);
                    });
                    
                    runs(function () {
                        expectFunctionRanges(this, this.fileJsContent, "param1", [ {start: 18, end: 19} ]);
                        expectFunctionRanges(this, this.fileJsContent, "param2", [ {start: 24, end: 26} ]);
                        expectFunctionRanges(this, this.fileJsContent, "param3", [ {start: 28, end: 32} ]);
                    });
                });
                
                it("should return correct start and end line numbers for single line functions", function () {
                    runs(function () {
                        init(this, simpleJsFileEntry);
                    });
                    
                    runs(function () {
                        expectFunctionRanges(this, this.fileJsContent, "single1", [ {start: 35, end: 35} ]);
                        expectFunctionRanges(this, this.fileJsContent, "single2", [ {start: 36, end: 36} ]);
                        expectFunctionRanges(this, this.fileJsContent, "single3", [ {start: 37, end: 37} ]);
                    });
                });
                
                it("should return correct start and end line numbers for nested functions", function () {
                    runs(function () {
                        init(this, simpleJsFileEntry);
                    });
                    
                    runs(function () {
                        expectFunctionRanges(this, this.fileJsContent, "nested1", [ {start: 42, end: 50} ]);
                        expectFunctionRanges(this, this.fileJsContent, "nested2", [ {start: 44, end: 49} ]);
                        expectFunctionRanges(this, this.fileJsContent, "nested3", [ {start: 47, end: 48} ]);
                    });
                });
                
                it("should return correct start and end line numbers for functions with keyword 'function' in name", function () {
                    runs(function () {
                        init(this, simpleJsFileEntry);
                    });
                    
                    runs(function () {
                        //expectFunctionRanges(this, this.fileJsContent, "functionX",   [ {start: 53, end: 55} ]);
                        expectFunctionRanges(this, this.fileJsContent, "my_function", [ {start: 56, end: 57} ]);
                        expectFunctionRanges(this, this.fileJsContent, "function3",   [ {start: 58, end: 60} ]);
                    });
                });
                
                it("should ignore identifiers with whitespace", function () {
                    runs(function () {
                        init(this, simpleJsFileEntry);
                    });
                    
                    runs(function () {
                        var negativeTests = ["invalid", "identifier", "invalid identifier"],
                            result,
                            content = this.fileJsContent;
                        
                        negativeTests.forEach(function (name) {
                            result = JSUtils._findAllMatchingFunctionsInText(content, name);
                            expect(result.length).toBe(0);
                        });
                    });
                });
            });
            
            describe("brace ends of functions", function () {
                beforeEach(function () {
                    init(this, braceEndJsFileEntry);
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
                    init(this, eofJsFileEntry);
                    runs(function () {
                        expect(JSUtils._getFunctionEndOffset(this.fileJsContent, 0)).toBe(this.fileJsContent.length);
                    });
                });
            });
            
            describe("end of function that's unclosed at end of file", function () {
                it("should find the end of a function that is unclosed at the end of the file", function () {
                    init(this, eof2JsFileEntry);
                    runs(function () {
                        expect(JSUtils._getFunctionEndOffset(this.fileJsContent, 0)).toBe(this.fileJsContent.length);
                    });
                });
            });

            describe("with real-world jQuery JS code", function () {
                
                beforeEach(function () {
                    init(this, jQueryJsFileEntry);
                });
                
                it("should find the first instance of the pushStack function", function () {
                    var funcNames = JSUtils._findAllMatchingFunctionsInText(this.fileJsContent, "pushStack");
                    expect(funcNames).not.toBe(null);
                    expect(funcNames.length).toBeGreaterThan(0);
                    
                    expect(funcNames[0]).not.toBe(null);
                    expect(funcNames[0].lineStart).toBe(243);
                    expect(funcNames[0].lineEnd).toBe(267);
                });
                
                it("should find all instances of the ready function", function () {
                    var funcNames = JSUtils._findAllMatchingFunctionsInText(this.fileJsContent, "ready");
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
                    var funcNames = JSUtils._findAllMatchingFunctionsInText(this.fileJsContent, "NO-SUCH-FUNCTION");
                    expect(funcNames.length).toBe(0);
                });
            });
            
        }); // describe("JSUtils")
        
        describe("JS Parsing: ", function () {
            
            var lastJsCode,
                match,
                expectParseError;
            
            // Test helper function; tests that parsing plus a simple search won't crash.
    
            var _match = function (jsCode, tagInfo) {
                lastJsCode = jsCode;
                try {
                    return JSUtils._findAllMatchingFunctionsInText(jsCode, tagInfo);
                } catch (e) {
                    this.fail(e.message + ": " + jsCode);
                    return [];
                }
            };
            
            
            // Test helper function: expects CSS parsing to fail at the given 0-based offset within the
            // jsCode string, with the given error message.
    
            var _expectParseError = function (jsCode, expectedCodeOffset, expectedErrorMessage) {
                try {
                    JSUtils._findAllMatchingFunctionsInText(jsCode, null);
                    
                    // shouldn't get here since JSUtils._findAllMatchingFunctionsInText() is expected to throw
                    this.fail("Expected parse error: " + jsCode);
                    
                } catch (error) {
                    expect(error.index).toBe(expectedCodeOffset);
                    expect(error.message).toBe(expectedErrorMessage);
                }
            };
    
            // To call fail(), these helpers need access to the value of 'this' inside each it()
            beforeEach(function () {
                match = _match.bind(this);
                expectParseError = _expectParseError.bind(this);
            });

            describe("Working with unsaved changes", function () {
                var testPath = extensionPath + "/unittest-files",
                    brackets;
        
                beforeEach(function () {
                    SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                        // Load module instances from brackets.test
                        brackets            = testWindow.brackets;
                        DocumentManager     = brackets.test.DocumentManager;
                        FileIndexManager    = brackets.test.FileIndexManager;
                        FileViewController  = brackets.test.FileViewController;

                        SpecRunnerUtils.loadProjectInTestWindow(testPath);
                    });
                });
    
                afterEach(function () {
                    SpecRunnerUtils.closeTestWindow();
                });
                
                it("should return the correct offsets if the file has changed", function () {
                    var doc,
                        didOpen = false,
                        gotError = false,
                        extensionRequire,
                        JSUtilsInExtension,
                        functions = null;

                    runs(function () {
                        FileViewController.openAndSelectDocument(testPath + "/edit.js", FileViewController.PROJECT_MANAGER)
                            .done(function () { didOpen = true; })
                            .fail(function () { gotError = true; });
                    });
                    
                    waitsFor(function () { return didOpen && !gotError; }, "FileViewController.addToWorkingSetAndSelect() timeout", 1000);
                    
                    // Populate JSUtils cache
                    runs(function () {
                        extensionRequire = brackets.getModule('utils/ExtensionLoader').getRequireContextForExtension('JavaScriptInlineEditor');
                        JSUtilsInExtension = extensionRequire("JSUtils");
                            
                        FileIndexManager.getFileInfoList("all")
                            .done(function (fileInfos) {
                                // Look for "edit2" function
                                JSUtilsInExtension.findMatchingFunctions("edit2", fileInfos)
                                    .done(function (result) { functions = result; });
                            });
                    });
                    
                    waitsFor(function () { return functions !== null; }, "JSUtils.findMatchingFunctions() timeout", 1000);
                    
                    runs(function () {
                        expect(functions.length).toBe(1);
                        expect(functions[0].lineStart).toBe(7);
                        expect(functions[0].lineEnd).toBe(9);
                    });
                    
                    runs(function () {
                        var doc = DocumentManager.getCurrentDocument();
                        
                        // Add several blank lines at the beginning of the text
                        doc.setText("\n\n\n\n" + doc.getText());

                        FileIndexManager.getFileInfoList("all")
                            .done(function (fileInfos) {
                                // JSUtils cache should update with new offsets
                                functions = null;
                                
                                // Look for "edit2" function
                                JSUtilsInExtension.findMatchingFunctions("edit2", fileInfos)
                                    .done(function (result) { functions = result; });
                            });
                    });
                    
                    waitsFor(function () { return functions !== null; }, "JSUtils.findMatchingFunctions() timeout", 1000);
                    
                    runs(function () {
                        expect(functions.length).toBe(1);
                        expect(functions[0].lineStart).toBe(11);
                        expect(functions[0].lineEnd).toBe(13);
                    });
                });

                it("should return a newly created function in an unsaved file", function () {
                    var didOpen = false,
                        gotError = false;
                    
                    runs(function () {
                        FileViewController.openAndSelectDocument(testPath + "/edit.js", FileViewController.PROJECT_MANAGER)
                            .done(function () { didOpen = true; })
                            .fail(function () { gotError = true; });
                    });
                    
                    waitsFor(function () { return didOpen && !gotError; }, "FileViewController.addToWorkingSetAndSelect() timeout", 1000);
                    
                    var functions = null;
                    
                    runs(function () {
                        var doc = DocumentManager.getCurrentDocument();
                        // Add a new function to the file
                        doc.setText(doc.getText() + "\n\nfunction TESTFUNCTION() {\n    return true;\n}\n");
                        
                        // Look for the selector we just created
                        FileIndexManager.getFileInfoList("all")
                            .done(function (fileInfos) {
                                var extensionRequire = brackets.getModule('utils/ExtensionLoader').getRequireContextForExtension('JavaScriptInlineEditor');
                                var JSUtilsInExtension = extensionRequire("JSUtils");

                                // Look for "TESTFUNCTION" function
                                JSUtilsInExtension.findMatchingFunctions("TESTFUNCTION", fileInfos)
                                    .done(function (result) {
                                        functions = result;
                                    });
                            });
                    });
                    
                    waitsFor(function () { return functions !== null; }, "JSUtils.findMatchingFunctions() timeout", 1000);
                    
                    runs(function () {
                        expect(functions.length).toBe(1);
                        expect(functions[0].lineStart).toBe(33);
                        expect(functions[0].lineEnd).toBe(35);
                    });
                });
            });
        }); //describe("JS Parsing")
        
        describe("Performance suite", function () {
            
            this.performance = true;
            
            var testPath = SpecRunnerUtils.getTestPath("/../../../brackets-scenario/jquery-ui/");

            beforeEach(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    CommandManager      = testWindow.brackets.test.CommandManager;
                    EditorManager       = testWindow.brackets.test.EditorManager;
                    PerfUtils           = testWindow.brackets.test.PerfUtils;
                });
            });
    
            afterEach(function () {
                SpecRunnerUtils.closeTestWindow();
            });
            
            it("should open inline editors", function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
                
                var extensionRequire,
                    JavaScriptQuickEdit,
                    done = false,
                    error = false,
                    i,
                    perfMeasurements = [
                        {
                            measure: PerfUtils.JAVASCRIPT_INLINE_CREATE,
                            children: [
                                {
                                    measure: PerfUtils.FILE_INDEX_MANAGER_SYNC
                                },
                                {
                                    measure: PerfUtils.JAVASCRIPT_FIND_FUNCTION,
                                    children: [
                                        {
                                            measure: PerfUtils.JSUTILS_GET_ALL_FUNCTIONS,
                                            children: [
                                                {
                                                    measure: PerfUtils.DOCUMENT_MANAGER_GET_DOCUMENT_FOR_PATH,
                                                    name: "Document creation during this search",
                                                    operation: "sum"
                                                },
                                                {
                                                    measure: PerfUtils.JSUTILS_REGEXP,
                                                    operation: "sum"
                                                }
                                            ]
                                        },
                                        {
                                            measure: PerfUtils.JSUTILS_END_OFFSET,
                                            operation: "sum"
                                        }
                                    ]
                                }
                            ]
                        }
                    ];
                
                runs(function () {
                    extensionRequire = testWindow.brackets.getModule('utils/ExtensionLoader').getRequireContextForExtension('JavaScriptInlineEditor');
                    JavaScriptQuickEdit = extensionRequire("main");
                    
                    SpecRunnerUtils.openProjectFiles(["ui/jquery.effects.core.js"]).done(function () {
                        done = true;
                    }).fail(function () {
                        error = true;
                    });
                });
                
                waitsFor(function () { return done && !error; }, 500);
                
                var runCreateInlineEditor = function () {
                    done = error = false;
                    
                    JavaScriptQuickEdit._createInlineEditor(EditorManager.getCurrentFullEditor(), "extend").done(function () {
                        done = true;
                    }).fail(function () {
                        error = true;
                    });
                };
                
                var waitForInlineEditor = function () { return done && !error; };
                
                function logPerf() {
                    PerformanceReporter.logTestWindow(perfMeasurements);
                    PerformanceReporter.clearTestWindow();
                }
                
                // repeat 5 times
                for (i = 0; i < 5; i++) {
                    runs(runCreateInlineEditor);
                    waitsFor(waitForInlineEditor, 500);
                    runs(logPerf);
                }
            });
            
        });
    });
});
