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
    "use strict";

    var CommandManager,         // loaded from brackets.test
        EditorManager,          // loaded from brackets.test
        PerfUtils,              // loaded from brackets.test
        JSUtils,                // loaded from brackets.test

        FileUtils           = brackets.getModule("file/FileUtils"),
        SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        Strings             = brackets.getModule("strings"),
        UnitTestReporter    = brackets.getModule("test/UnitTestReporter");

    var extensionPath = FileUtils.getNativeModuleDirectoryPath(module),
        testPath = extensionPath + "/unittest-files/syntax",
        tempPath = SpecRunnerUtils.getTempDirectory(),
        testWindow,
        initInlineTest;

    function rewriteProject(spec) {
        var result = new $.Deferred(),
            infos = {},
            options = {
                parseOffsets    : true,
                infos           : infos,
                removePrefix    : true
            };

        SpecRunnerUtils.copyPath(testPath, tempPath, options).done(function () {
            spec.infos = infos;
            result.resolve();
        }).fail(function () {
            result.reject();
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
    var _initInlineTest = function (openFile, openOffset, expectInline, filesToOpen) {
        var spec = this;

        filesToOpen = filesToOpen || [];
        expectInline = (expectInline !== undefined) ? expectInline : true;

        runs(function () {
            waitsForDone(rewriteProject(spec), "rewriteProject");
        });

        SpecRunnerUtils.loadProjectInTestWindow(tempPath);

        runs(function () {
            filesToOpen.push(openFile);
            waitsForDone(SpecRunnerUtils.openProjectFiles(filesToOpen), "openProjectFiles");
        });

        if (openOffset !== undefined) {
            runs(function () {
                // open inline editor at specified offset index
                waitsForDone(SpecRunnerUtils.toggleQuickEditAtOffset(
                    EditorManager.getCurrentFullEditor(),
                    spec.infos[openFile].offsets[openOffset]
                ), "toggleQuickEditAtOffset");
            });
        }
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
                    JSUtils             = testWindow.brackets.test.JSUtils;
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

                        visibleRangeCheck = (editor._visibleRange.startLine === startLine) &&
                            (editor._visibleRange.endLine === endLine);

                        this.message = function () {
                            var msg = "";

                            if (shouldHide.length > 0) {
                                msg += "Expected inline editor to hide [" + shouldHide.toString() + "].\n";
                            }

                            if (shouldShow.length > 0) {
                                msg += "Expected inline editor to show [" + shouldShow.toString() + "].\n";
                            }

                            if (!visibleRangeCheck) {
                                msg += "Editor._visibleRange [" +
                                    editor._visibleRange.startLine + "," +
                                    editor._visibleRange.endLine + "] should be [" +
                                    startLine + "," + endLine + "].";
                            }

                            return msg;
                        };

                        return (shouldHide.length === 0) &&
                            (shouldShow.length === 0) &&
                            visibleRangeCheck;
                    }
                });
            });

            afterEach(function () {
                //debug visual confirmation of inline editor
                //waits(1000);

                // revert files to original content with offset markup
                initInlineTest      = null;
                testWindow          = null;
                EditorManager       = null;
                CommandManager      = null;
                JSUtils             = null;
                SpecRunnerUtils.closeTestWindow();
            });

            it("should ignore tokens that are not function calls or references", function () {
                var editor,
                    extensionRequire,
                    jsQuickEditMain,
                    tokensFile = "tokens.js",
                    promise,
                    offsets;

                initInlineTest(tokensFile);

                runs(function () {
                    extensionRequire = testWindow.brackets.getModule("utils/ExtensionLoader").getRequireContextForExtension("JavaScriptQuickEdit");
                    jsQuickEditMain = extensionRequire("main");
                    editor = EditorManager.getCurrentFullEditor();
                    offsets = this.infos[tokensFile];

                    // regexp token
                    promise = jsQuickEditMain.javaScriptFunctionProvider(editor, offsets[0]);
                    expect(promise).toBe(Strings.ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND);

                    // multi-line comment
                    promise = jsQuickEditMain.javaScriptFunctionProvider(editor, offsets[1]);
                    expect(promise).toBe(Strings.ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND);

                    // single-line comment
                    promise = jsQuickEditMain.javaScriptFunctionProvider(editor, offsets[2]);
                    expect(promise).toBe(Strings.ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND);

                    // string, double quotes
                    promise = jsQuickEditMain.javaScriptFunctionProvider(editor, offsets[3]);
                    expect(promise).toBe(Strings.ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND);

                    // string, single quotes
                    promise = jsQuickEditMain.javaScriptFunctionProvider(editor, offsets[4]);
                    expect(promise).toBe(Strings.ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND);
                });
            });

            it("should open a function with  form: function functionName()", function () {
                initInlineTest("test1main.js", 0);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1inline.js"].offsets[0]);
                });
            });

            it("should open a function with  form: functionName = function()", function () {
                initInlineTest("test1main.js", 1);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1inline.js"].offsets[1]);
                });
            });

            it("should open a function with  form: functionName: function()", function () {
                initInlineTest("test1main.js", 2);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1inline.js"].offsets[2]);
                });
            });

            describe("Code hints tests within quick edit window ", function () {
                var JSCodeHints,
                    ParameterHintManager;

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

                    expect(provider.hasHints(EditorManager.getActiveEditor(), key)).toBe(true);
                    return provider.getHints(null);
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
                function editorJumped(jsCodeHints, testEditor, expectedLocation) {
                    var oldLocation = testEditor.getCursorPos();

                    jsCodeHints.handleJumpToDefinition();


                    _waitForJump(oldLocation, function (newCursor) {
                        expect(newCursor.line).toBe(expectedLocation.line);
                        expect(newCursor.ch).toBe(expectedLocation.ch);
                        if (expectedLocation.file) {
                            var activeEditor = EditorManager.getActiveEditor();
                            expect(activeEditor.document.file.name).toBe(expectedLocation.file);
                        }
                    });
                }

                function initJSCodeHints() {
                    var extensionRequire = testWindow.brackets.getModule("utils/ExtensionLoader").
                                getRequireContextForExtension("JavaScriptCodeHints");
                    JSCodeHints = extensionRequire("main");
                    ParameterHintManager = extensionRequire("ParameterHintManager");
                }

                beforeEach(function () {
                    initInlineTest("test.html");
                    initJSCodeHints();
                });

                afterEach(function () {
                    JSCodeHints = null;
                    ParameterHintManager = null;
                });

                it("should see code hint lists in quick editor", function () {
                    var start        = {line: 13, ch: 11 },
                        testPos      = {line: 5, ch: 29},
                        testEditor;

                    runs(function () {
                        var openQuickEditor = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), start);
                        waitsForDone(openQuickEditor, "Open quick editor");
                    });

                    runs(function () {
                        testEditor = EditorManager.getActiveEditor();
                        testEditor.setCursorPos(testPos);
                        expectParameterHint([{name: "mo", type: "Number"}], 0);
                    });
                });

                it("should see jump to definition on variable working in quick editor", function () {
                    var start        = {line: 13, ch: 10 },
                        testPos      = {line: 6, ch: 7},
                        testJumpPos  = {line: 6, ch: 5},
                        jumpPos      = {line: 3, ch: 6},
                        testEditor;

                    runs(function () {
                        var openQuickEditor = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), start);
                        waitsForDone(openQuickEditor, "Open quick editor");
                    });

                    runs(function () {
                        testEditor = EditorManager.getActiveEditor();
                        testEditor.setCursorPos(testPos);
                        var hintObj = expectHints(JSCodeHints.jsHintProvider);
                        hintsPresentExact(hintObj, ["propA"]);
                    });

                    runs(function () {
                        testEditor = EditorManager.getActiveEditor();
                        testEditor.setCursorPos(testJumpPos);
                        editorJumped(JSCodeHints, testEditor, jumpPos);
                    });
                });

                // FIXME (issue #3951): jump to method inside quick editor doesn't jump
                xit("should see jump to definition on method working in quick editor", function () {
                    var start        = {line: 13, ch: 13 },
                        testPos      = {line: 5,  ch: 25},
                        jumpPos      = {line: 9, ch: 21},
                        testEditor;

                    runs(function () {
                        var openQuickEditor = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), start);
                        waitsForDone(openQuickEditor, "Open quick editor");
                    });

                    runs(function () {
                        testEditor = EditorManager.getActiveEditor();
                        testEditor.setCursorPos(testPos);
                        editorJumped(jumpPos);
                    });

                });

            });
        });

        describe("Performance suite", function () {

            this.category = "performance";

            var testPath = extensionPath + "/unittest-files/jquery-ui";

            beforeEach(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    CommandManager      = testWindow.brackets.test.CommandManager;
                    EditorManager       = testWindow.brackets.test.EditorManager;
                    PerfUtils           = testWindow.brackets.test.PerfUtils;
                });
            });

            afterEach(function () {
                testWindow      = null;
                CommandManager  = null;
                EditorManager   = null;
                PerfUtils       = null;
                SpecRunnerUtils.closeTestWindow();
            });

            it("should open inline editors", function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);

                var extensionRequire,
                    JavaScriptQuickEdit,
                    i,
                    perfMeasurements;

                runs(function () {
                    perfMeasurements = [
                        {
                            measure: PerfUtils.JAVASCRIPT_INLINE_CREATE,
                            children: [
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
                });

                runs(function () {
                    extensionRequire = testWindow.brackets.getModule("utils/ExtensionLoader").getRequireContextForExtension("JavaScriptQuickEdit");
                    JavaScriptQuickEdit = extensionRequire("main");

                    waitsForDone(SpecRunnerUtils.openProjectFiles(["ui/jquery.effects.core.js"]), "openProjectFiles");
                });

                var runCreateInlineEditor = function () {
                    var editor = EditorManager.getCurrentFullEditor();
                    // Set the cursor in the middle of a call to "extend" so the JS helper function works correctly.
                    editor.setCursorPos(271, 20);
                    waitsForDone(
                        JavaScriptQuickEdit._createInlineEditor(editor, "extend"),
                        "createInlineEditor",
                        5000
                    );
                };

                function logPerf() {
                    var reporter = UnitTestReporter.getActiveReporter();
                    reporter.logTestWindow(perfMeasurements);
                    reporter.clearTestWindow();
                }

                // repeat 5 times
                for (i = 0; i < 5; i++) {
                    runs(runCreateInlineEditor);
                    runs(logPerf);
                }
            });
        });
    });
});
