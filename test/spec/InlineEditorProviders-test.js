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

/*global describe, it, xit, expect, beforeEach, afterEach, waits, waitsFor, waitsForDone, waitsForFail, runs, beforeFirst, afterLast */

define(function (require, exports, module) {
    'use strict';

    var CommandManager,     // loaded from brackets.test
        Commands,           // loaded from brackets.test
        EditorManager,      // loaded from brackets.test
        FileSyncManager,    // loaded from brackets.test
        DocumentManager,    // loaded from brackets.test
        MainViewManager,    // loaded from brackets.test
        FileViewController, // loaded from brackets.test
        InlineWidget     = require("editor/InlineWidget").InlineWidget,
        Dialogs          = require("widgets/Dialogs"),
        KeyEvent         = require("utils/KeyEvent"),
        FileUtils        = require("file/FileUtils"),
        SpecRunnerUtils  = require("spec/SpecRunnerUtils"),
        Strings          = require("strings");

    describe("InlineEditorProviders", function () {

        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/InlineEditorProviders-test-files"),
            tempPath = SpecRunnerUtils.getTempDirectory(),
            testWindow,
            infos = {};

        function toRange(startLine, endLine) {
            return {startLine: startLine, endLine: endLine};
        }

        function rewriteProject() {
            var result = new $.Deferred(),
                options = {
                    parseOffsets    : true,
                    infos           : infos,
                    removePrefix    : true
                };

            SpecRunnerUtils.copyPath(testPath, tempPath, options).done(function () {
                result.resolve();
            }).fail(function () {
                result.reject();
            });

            return result.promise();
        }

        /**
         * Performs setup for an inline editor test. Parses offsets (saved to infos) for all files in
         * the test project (testPath) and saves files back to disk without offset markup.
         * When finished, open an editor for the specified project relative file path
         * then attempts opens an inline editor at the given offset. Installs an after()
         * function restore all file content back to original state with offset markup.
         *
         * @param {string} openFile  Project relative file path to open in a main editor.
         * @param {number} openOffset  The offset index location within openFile to open an inline editor.
         * @param {boolean=} expectInline  Use false to verify that an inline editor should not be opened. Omit otherwise.
         * @param {Array<{string}>=} documentList  Optional array of files to open in working set
         */
        function initInlineTest(openFile, openOffset, expectInline, documentList) {
            var editor;

            documentList = documentList || [];

            expectInline = (expectInline !== undefined) ? expectInline : true;

            runs(function () {
                documentList.push(openFile);
                waitsForDone(SpecRunnerUtils.openProjectFiles(documentList), "FILE_OPEN timeout", 1000);
            });

            runs(function () {
                editor = EditorManager.getCurrentFullEditor();

                // open inline editor at specified offset index
                var inlineEditorResult = SpecRunnerUtils.toggleQuickEditAtOffset(
                    editor,
                    infos[openFile].offsets[openOffset]
                );

                if (expectInline) {
                    waitsForDone(inlineEditorResult, "inline editor opened", 1000);
                } else {
                    waitsForFail(inlineEditorResult, "inline editor not opened", 1000);
                }
            });

            runs(function () {
                if (expectInline) {
                    var inlineWidgets = editor.getInlineWidgets();
                    expect(inlineWidgets.length).toBe(1);

                    // By the time we're called, the content of the widget should be in the DOM and have a nontrivial height.
                    expect($.contains(testWindow.document.documentElement, inlineWidgets[0].htmlContent)).toBe(true);
                    expect(inlineWidgets[0].$htmlContent.height()).toBeGreaterThan(50);
                }

                editor = null;
            });
        }

        // Utilities for testing Editor state
        function expectText(editor) {
            return expect(editor._codeMirror.getValue());
        }

        function expectTextToBeEqual(editor1, editor2) {
            expect(editor1._codeMirror.getValue()).toBe(editor2._codeMirror.getValue());
        }

        function isLineHidden(cm, lineNum) {
            var markers = cm.findMarksAt({line: lineNum, pos: 0}),
                i;
            for (i = 0; i < markers.length; i++) {
                if (markers[i].collapsed) {
                    return true;
                }
            }
            return false;
        }

        function expectPopoverMessageWithText(text) {
            var $popover;

            runs(function () {
                waitsFor(function () {
                    $popover = testWindow.$(".popover-message");
                    return $popover.length === 1;
                }, "Expect popover window");
            });

            runs(function () {
                var popoverText = testWindow.$(".text", $popover).html();
                expect(popoverText).toEqual(text);
            });
        }

        function getBounds(object, useOffset) {
            var left = (useOffset ? object.offset().left : parseInt(object.css("left"), 10)),
                top = (useOffset ? object.offset().top : parseInt(object.css("top"), 10));
            return {
                left:   left,
                top:    top,
                right:  left + object.outerWidth(),
                bottom: top + object.outerHeight()
            };
        }

        function boundsInsideWindow(object) {
            // For the popover, we can't use offset(), because jQuery gets confused by the
            // scale factor and transform origin that the animation uses. Instead, we rely on
            // the fact that its offset parent is body, and just test its explicit left/top values.
            var bounds = getBounds(object, false),
                editorBounds = getBounds(testWindow.$("#editor-holder"), true);

            return bounds.left >= editorBounds.left   &&
                bounds.right   <= editorBounds.right  &&
                bounds.top     >= editorBounds.top    &&
                bounds.bottom  <= editorBounds.bottom;
        }

        function toggleOption(commandID, text) {
            runs(function () {
                var promise = CommandManager.execute(commandID);
                waitsForDone(promise, text);
            });
        }

        /*
         * Note that the bulk of selector matching tests are in CSSutils-test.js.
         * These tests are primarily focused on the InlineEditorProvider module.
         */
        describe("htmlToCSSProvider", function () {

            beforeFirst(function () {
                SpecRunnerUtils.createTempDirectory();

                // rewrite the project for each spec
                runs(function () {
                    waitsForDone(rewriteProject(), "rewriteProject timeout", 1000);
                });

                // Create a new window that will be shared by ALL tests in this spec.
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;

                    // Load module instances from brackets.test
                    CommandManager      = testWindow.brackets.test.CommandManager;
                    Commands            = testWindow.brackets.test.Commands;
                    EditorManager       = testWindow.brackets.test.EditorManager;
                    FileSyncManager     = testWindow.brackets.test.FileSyncManager;
                    DocumentManager     = testWindow.brackets.test.DocumentManager;
                    MainViewManager     = testWindow.brackets.test.MainViewManager;
                    FileViewController  = testWindow.brackets.test.FileViewController;
                });
            });

            afterLast(function () {
                testWindow          = null;
                Commands            = null;
                EditorManager       = null;
                FileSyncManager     = null;
                DocumentManager     = null;
                MainViewManager     = null;
                FileViewController  = null;
                SpecRunnerUtils.closeTestWindow();

                SpecRunnerUtils.removeTempDirectory();
            });

            beforeEach(function () {
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
                            hidden = isLineHidden(editor._codeMirror, i);

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

                SpecRunnerUtils.loadProjectInTestWindow(tempPath);
            });

            afterEach(function () {
                //debug visual confirmation of inline editor
                //waits(1000);

                // revert files to original content with offset markup
                testWindow.closeAllFiles();
            });


            it("should open a type selector and show correct range including the embedded php", function () {
                initInlineTest("test1.php", 1);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position and displayed range in inline editor
                    expect(inlinePos).toEqual(infos["test1.php"].offsets[0]);
                    expect(inlineWidget.editor).toHaveInlineEditorRange(toRange(4, 8));

                    inlineWidget = null;
                });
            });

            it("should open a type selector on opening tag", function () {
                initInlineTest("test1.html", 0);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(infos["test1.css"].offsets[0]);

                    inlineWidget = null;
                });
            });

            it("should open a type selector on closing tag", function () {
                initInlineTest("test1.html", 9);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(infos["test1.css"].offsets[0]);

                    inlineWidget = null;
                });
            });

            it("should open a class selector", function () {
                initInlineTest("test1.html", 1);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(infos["test1.css"].offsets[1]);

                    inlineWidget = null;
                });
            });

            it("should also open a class selector", function () {
                initInlineTest("test1.html", 7);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(infos["test1.css"].offsets[1]);

                    inlineWidget = null;
                });
            });

            it("should open an embedded class selector", function () {
                initInlineTest("test1.html", 10);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(infos["test1.html"].offsets[11]);

                    inlineWidget = null;
                });
            });

            it("should open an id selector", function () {
                initInlineTest("test1.html", 2);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(infos["test1.css"].offsets[2]);

                    inlineWidget = null;
                });
            });

            it("should work with multiple classes when the cursor is on the first class in the list", function () {
                initInlineTest("test1.html", 14);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(infos["test1.css"].offsets[1]);

                    inlineWidget = null;
                });
            });

            it("should work when the cursor is between classes", function () {
                initInlineTest("test1.html", 15, false);

                runs(function () {
                    // verify no inline editor open
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);

                    // verify popover message is displayed with correct string
                    expectPopoverMessageWithText(Strings.ERROR_CSSQUICKEDIT_BETWEENCLASSES);

                    // verify popover message is automatically dismissed after short wait
                    // current delay is 5 sec + 0.5 sec fade-out transition
                    waits(6000);
                });
            });


            it("should work with multiple classes when the cursor is on the first class in the list", function () {
                initInlineTest("test1.html", 16);

                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(infos["test1.css"].offsets[8]);

                    inlineWidget = null;
                });
            });


            it("should close, then remove the inline widget and restore focus", function () {
                initInlineTest("test1.html", 0);

                var hostEditor, inlineWidget, inlinePos, savedPos;

                runs(function () {
                    hostEditor =  EditorManager.getCurrentFullEditor();
                    savedPos = hostEditor.getCursorPos();
                    inlineWidget = hostEditor.getInlineWidgets()[0];
                    inlinePos = inlineWidget.editor.getCursorPos();

                    // verify cursor position & focus in inline editor
                    expect(inlinePos).toEqual(infos["test1.css"].offsets[0]);
                    expect(inlineWidget.hasFocus()).toEqual(true);
                    expect(hostEditor.hasFocus()).toEqual(false);

                    // close the editor
                    waitsForDone(EditorManager.closeInlineWidget(hostEditor, inlineWidget), "closing inline widget");

                });

                runs(function () {
                    // verify no inline widgets in list
                    expect(hostEditor.getInlineWidgets().length).toBe(0);

                    // verify that the inline widget's content has been removed from the DOM
                    expect($.contains(testWindow.document.documentElement, inlineWidget.htmlContent)).toBe(false);

                    // verify full editor cursor & focus restored
                    expect(savedPos).toEqual(hostEditor.getCursorPos());
                    expect(hostEditor.hasFocus()).toEqual(true);

                    hostEditor = inlineWidget = null;
                });
            });

            it("should close inline widget on Esc Key", function () {
                initInlineTest("test1.html", 0);

                runs(function () {
                    var hostEditor = EditorManager.getCurrentFullEditor(),
                        inlineWidget = hostEditor.getInlineWidgets()[0];

                    // verify inline widget
                    expect(hostEditor.getInlineWidgets().length).toBe(1);

                    // close the editor by simulating Esc key
                    var key = KeyEvent.DOM_VK_ESCAPE,
                        doc = testWindow.document,
                        element = doc.getElementsByClassName("inline-widget")[0];
                    SpecRunnerUtils.simulateKeyEvent(key, "keydown", element);

                    // verify no inline widgets
                    expect(hostEditor.getInlineWidgets().length).toBe(0);

                    doc = hostEditor = inlineWidget = null;
                });
            });

            it("should not open an inline editor when positioned on textContent", function () {
                initInlineTest("test1.html", 3, false);

                runs(function () {
                    // verify no inline editor open
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);

                    // verify popover message is displayed with correct string
                    expectPopoverMessageWithText(Strings.ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND);
                });
            });

            // This recently added test is broken by a more recent change in CM, so disabling this test.
            // See discussion in https://github.com/adobe/brackets/issues/8344
            // The call to `waits(4000)` in this test seems to dismiss the popover
            xit("should not open an inline editor when positioned on title attribute", function () {
                initInlineTest("test1.html", 12, false);

                runs(function () {
                    // verify no inline editor open
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);

                    // verify popover message is displayed with correct string
                    expectPopoverMessageWithText(Strings.ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR);

                    // verify popover message is still open after 4 sec
                    waits(4000);
                });

                runs(function () {
                    // verify popover message
                    var $popover = testWindow.$(".popover-message");
                    expect($popover.length).toEqual(1);
                });

                runs(function () {
                    // verify popover message is automatically dismissed after 2 more seconds
                    // total delay is 5 sec + 0.5 sec fade-out transition
                    waits(2000);
                });

                runs(function () {
                    // verify no popover message
                    var $popover = testWindow.$(".popover-message");
                    expect($popover.length).toEqual(0);
                });
            });

            it("should not open an inline editor when positioned on a tag in a comment", function () {
                initInlineTest("test1.html", 4, false);

                runs(function () {
                    // verify no inline editor open
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);
                });
            });

            it("should open an inline editor when positioned on the non standard html tag <to>, but no content from @keyframes", function () {
                initInlineTest("test1.html", 18);

                runs(function () {
                    // verify inline editor is open for adding a new rule
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(1);

                    var inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editor;
                    expect(inlineEditor).toBe(null);
                });
            });

            it("should close first popover message before opening another one", function () {
                var editor,
                    openFile = "test1.html";

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles([openFile]), "FILE_OPEN timeout", 1000);
                });

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();

                    // attempt to open inline editor at specified offset index
                    var inlineEditorResult = SpecRunnerUtils.toggleQuickEditAtOffset(
                        editor,
                        infos[openFile].offsets[3]
                    );

                    waitsForFail(inlineEditorResult, "inline editor not opened", 1000);
                });

                runs(function () {
                    // attempt to open another inline editor at a different offset index
                    var inlineEditorResult = SpecRunnerUtils.toggleQuickEditAtOffset(
                        editor,
                        infos[openFile].offsets[12]
                    );

                    waitsForFail(inlineEditorResult, "inline editor not opened", 1000);
                });

                runs(function () {
                    // verify only 1 popover message
                    var $popover = testWindow.$(".popover-message");
                    expect($popover.length).toEqual(1);
                });
            });


            it("should close popover message on selection change", function () {
                var editor,
                    openFile = "test1.html";

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles([openFile]), "FILE_OPEN timeout", 1000);
                });

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();

                    // attempt to open inline editor at specified offset index
                    var inlineEditorResult = SpecRunnerUtils.toggleQuickEditAtOffset(
                        editor,
                        infos[openFile].offsets[3]
                    );

                    waitsForFail(inlineEditorResult, "inline editor not opened", 1000);
                });

                runs(function () {
                    // change selection
                    var offset = infos[openFile].offsets[12];
                    editor.setCursorPos(offset.line, offset.ch);

                    // verify no popover message
                    var $popover = testWindow.$(".popover-message");
                    expect($popover.length).toEqual(0);
                });
            });

            it("should position message popover inside left edge of window", function () {
                var $popover;
                initInlineTest("test1.html", 11, false);

                runs(function () {
                    $popover = testWindow.$(".popover-message");
                    expect($popover.length).toEqual(1);
                });

                runs(function () {
                    expect(boundsInsideWindow($popover)).toBeTruthy();
                });
            });

            it("should position message popover inside top edge of window", function () {
                var $popover;
                initInlineTest("test1.html", 3, false);

                runs(function () {
                    $popover = testWindow.$(".popover-message");
                    expect($popover.length).toEqual(1);
                });

                runs(function () {
                    expect(boundsInsideWindow($popover)).toBeTruthy();
                });
            });

            it("should scroll cursor into view and position message popover inside right edge of window", function () {
                var $popover, editor,
                    openFile = "test1.html";

                runs(function () {
                    // Turn off word wrap for next tests
                    toggleOption(Commands.TOGGLE_WORD_WRAP, "Toggle word-wrap");
                });

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles([openFile]), "FILE_OPEN timeout", 1000);
                });

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor.getScrollPos().x).toEqual(0);

                    // attempt to open inline editor at specified offset index
                    var inlineEditorResult = SpecRunnerUtils.toggleQuickEditAtOffset(
                        editor,
                        infos[openFile].offsets[13]
                    );

                    waitsForFail(inlineEditorResult, "inline editor not opened", 1000);
                });

                runs(function () {
                    $popover = testWindow.$(".popover-message");
                    expect($popover.length).toEqual(1);
                });

                runs(function () {
                    // Popover should be inside right edge
                    expect(boundsInsideWindow($popover)).toBeTruthy();

                    // verify that page scrolled left
                    expect(editor.getScrollPos().x).toBeGreaterThan(0);

                    // restore word wrap
                    toggleOption(Commands.TOGGLE_WORD_WRAP, "Toggle word-wrap");
                });
            });

            it("should increase size based on content", function () {
                initInlineTest("test1.html", 1);

                var inlineEditor, widgetHeight;

                runs(function () {
                    inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editor;
                    widgetHeight = inlineEditor.totalHeight();

                    // verify original line count
                    expect(inlineEditor.lineCount()).toBe(25);

                    // change inline editor content
                    var newLines = ".bar {\ncolor: #f00;\n}\n.cat {\ncolor: #f00;\n}";

                    // insert new lines at current cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(
                        newLines,
                        inlineEditor.getCursorPos()
                    );

                    // verify widget resizes when contents is changed
                    expect(inlineEditor.lineCount()).toBe(30);
                    expect(inlineEditor.totalHeight()).toBeGreaterThan(widgetHeight);

                    inlineEditor = null;
                });
            });

            it("should decrease size based on content", function () {
                initInlineTest("test1.html", 1);

                var inlineEditor, widgetHeight;

                runs(function () {
                    inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editor;
                    widgetHeight = inlineEditor.totalHeight();

                    // verify original line count
                    expect(inlineEditor.lineCount()).toBe(25);

                    // replace the entire .foo rule with an empty string
                    // set text on the editor, can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(
                        "",
                        inlineEditor.getCursorPos(),
                        infos["test1.css"].offsets[3]
                    );

                    // verify widget resizes when contents is changed
                    expect(inlineEditor.lineCount()).toBe(23);
                    expect(inlineEditor.totalHeight()).toBeLessThan(widgetHeight);

                    inlineEditor = null;
                });
            });

            it("should save changes in the inline editor", function () {
                initInlineTest("test1.html", 1);

                var err = false,
                    hostEditor,
                    inlineEditor,
                    newText = "\n/* jasmine was here */",
                    savedText;

                this.after(function () {
                    // rewrite the project after saving changes
                    runs(function () {
                        waitsForDone(rewriteProject(), "rewriteProject timeout", 1000);
                    });
                });

                runs(function () {
                    hostEditor = EditorManager.getCurrentFullEditor();
                    inlineEditor = hostEditor.getInlineWidgets()[0].editor;

                    // insert text at the inline editor's cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(newText, inlineEditor.getCursorPos());

                    // we're going to compare this to disk later, so pass true to get non-normalized line endings
                    newText = inlineEditor.document.getText(true);

                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeTruthy();
                    expect(hostEditor.document.isDirty).toBeFalsy();

                    // verify that the dirty dot is visible in the UI
                    expect(testWindow.$(".dirty-indicator", hostEditor.getInlineWidgets()[0].$htmlContent).width()).not.toEqual(0);

                    // verify focus is in inline editor
                    expect(inlineEditor.hasFocus()).toBeTruthy();

                    // execute file save command
                    waitsForDone(testWindow.executeCommand(Commands.FILE_SAVE), "save timeout", 1000);
                });

                runs(function () {
                    // verify focus is still in inline editor
                    expect(inlineEditor.hasFocus()).toBeTruthy();

                    // read saved file contents
                    FileUtils.readAsText(inlineEditor.document.file).done(function (text) {
                        savedText = text;
                    }).fail(function () {
                        err = true;
                    });
                });

                waitsFor(function () { return savedText !== undefined; }, "readAsText timeout", 1000);

                runs(function () {
                    expect(savedText).toEqual(newText);

                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeFalsy();
                    expect(hostEditor.document.isDirty).toBeFalsy();

                    // verify that the dirty dot is hidden in the UI
                    expect(testWindow.$(".dirty-indicator", hostEditor.getInlineWidgets()[0].$htmlContent).width()).toEqual(0);

                    inlineEditor = hostEditor = null;
                });
            });

            it("should not save changes in the host editor", function () {
                initInlineTest("test1.html", 1);

                var err = false,
                    hostEditor,
                    inlineEditor,
                    newInlineText = "/* jasmine was inline */\n",
                    newHostText = "/* jasmine was here */\n",
                    savedInlineText,
                    savedHostText;

                this.after(function () {
                    // rewrite the project after saving changes
                    runs(function () {
                        waitsForDone(rewriteProject(), "rewriteProject timeout", 1000);
                    });
                });

                runs(function () {
                    hostEditor = EditorManager.getCurrentFullEditor();
                    inlineEditor = hostEditor.getInlineWidgets()[0].editor;

                    // insert text at the host editor's cursor position
                    hostEditor._codeMirror.replaceRange(newHostText, hostEditor.getCursorPos());

                    // insert text at the inline editor's cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(newInlineText, inlineEditor.getCursorPos());

                    // we're going to compare this to disk later, so pass true to get non-normalized line endings
                    newInlineText = inlineEditor.document.getText(true);

                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeTruthy();
                    expect(hostEditor.document.isDirty).toBeTruthy();

                    // verify focus is in inline editor
                    expect(inlineEditor.hasFocus()).toBeTruthy();

                    // execute file save command
                    waitsForDone(testWindow.executeCommand(Commands.FILE_SAVE), "save timeout", 1000);
                });

                runs(function () {
                    // read saved inline file contents
                    FileUtils.readAsText(inlineEditor.document.file).done(function (text) {
                        savedInlineText = text;
                    }).fail(function () {
                        err = true;
                    });

                    // read saved host editor file contents
                    FileUtils.readAsText(hostEditor.document.file).done(function (text) {
                        savedHostText = text;
                    }).fail(function () {
                        err = true;
                    });
                });

                waitsFor(function () { return savedInlineText !== undefined && savedHostText !== undefined; }, "readAsText timeout", 1000);

                runs(function () {
                    expect(savedInlineText).toEqual(newInlineText);
                    expect(savedHostText).toEqual(infos["test1.html"].text); // i.e, should be unchanged

                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeFalsy();
                    expect(hostEditor.document.isDirty).toBeTruthy();

                    inlineEditor = hostEditor = null;
                });
            });

            describe("Inline Editor syncing from disk", function () {

                it("should close inline editor when file deleted on disk", function () {
                    // Create an expendable CSS file
                    var fileToWrite;

                    runs(function () {
                        // Important: must create file using test window's FS so that it sees the new file right away
                        var promise = SpecRunnerUtils.createTextFile(tempPath + "/tempCSS.css", "#anotherDiv {}", testWindow.brackets.test.FileSystem)
                            .done(function (entry) {
                                fileToWrite = entry;
                            })
                            .fail(function (err) {
                                console.log(err);
                            });

                        waitsForDone(promise, "writeText tempCSS.css", 1000);
                    });

                    // Open inline editor for that file
                    runs(function () {
                        initInlineTest("test1.html", 6, true);
                    });
                    // initInlineTest() inserts a waitsFor() automatically, so must end runs() block here

                    runs(function () {
                        var hostEditor = EditorManager.getCurrentFullEditor();
                        expect(hostEditor.getInlineWidgets().length).toBe(1);
                    });

                    // Delete the file
                    runs(function () {
                        waitsForDone(SpecRunnerUtils.deletePath(fileToWrite.fullPath));
                    });

                    // Ping FileSyncManager to recognize the deletion
                    runs(function () {
                        FileSyncManager.syncOpenDocuments();
                    });

                    // Verify inline is now closed
                    waitsFor(function () {
                        var hostEditor = EditorManager.getCurrentFullEditor();
                        return (hostEditor.getInlineWidgets().length === 0);
                    }, 1000);

                    // Cleanup: initInlineTest() saves contents of all files in the project and rewrites
                    // them back to disk at the end (to restore any stripped offset markers). But in this
                    // case we really want the temp file to stay gone.
                    runs(function () {
                        delete infos["tempCSS.css"];
                    });
                });

                // FUTURE: Eventually we'll instead want it to stay open and revert to the content on disk.
                // Editor's syncing code can't yet handle blowing away the whole Document like that, though.
                it("should close inline when file is closed without saving changes", function () {
                    initInlineTest("test1.html", 1);

                    var newText = "\n/* jasmine was here */",
                        hostEditor,
                        inlineEditor,
                        promise;

                    runs(function () {
                        hostEditor = EditorManager.getCurrentFullEditor();
                        inlineEditor = hostEditor.getInlineWidgets()[0].editor;

                        // verify inline is open
                        expect(hostEditor.getInlineWidgets().length).toBe(1);

                        // insert text at the inline editor's cursor position
                        inlineEditor._codeMirror.replaceRange(newText, inlineEditor.getCursorPos());

                        // verify isDirty flag
                        expect(inlineEditor.document.isDirty).toBe(true);

                        // close the main editor / working set entry for the inline's file
                        promise = testWindow.executeCommand(Commands.FILE_CLOSE, {file: inlineEditor.document.file});

                        // synchronously click the don't save button,
                        // asynchronously wait for the dialog to close and the Dialog's
                        // promise to resolve.
                        SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_DONTSAVE);
                    });

                    // Wait on the command's promise also since the command performs
                    // asynchronous tasks after the Dialog is resolved. If the command
                    // could complete synchronously, this wait would be unnecessary.
                    runs(function () {
                        waitsForDone(promise);
                    });

                    runs(function () {
                        // verify inline is closed
                        expect(hostEditor.getInlineWidgets().length).toBe(0);

                        inlineEditor = hostEditor = null;
                    });
                });
            });


            describe("Bi-directional Editor Synchronizing", function () {
                // For these tests we *deliberately* use Editor._codeMirror instead of Document to make edits,
                // in order to test Editor->Document syncing (instead of Document->Editor).

                it("should not add an inline document to the working set without being edited", function () {
                    initInlineTest("test1.html", 0);

                    runs(function () {
                        var i = MainViewManager.findInWorkingSet(MainViewManager.ACTIVE_PANE, infos["test1.css"].fileEntry.fullPath);
                        expect(i).toEqual(-1);
                    });
                });

                it("should add dirty documents to the working set", function () {
                    initInlineTest("test1.html", 1);

                    var inlineEditor, widgetHeight;

                    runs(function () {
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editor;
                        widgetHeight = inlineEditor.totalHeight();

                        // change inline editor content
                        var newLines = ".bar {\ncolor: #f00;\n}\n.cat {\ncolor: #f00;\n}";

                        // insert new lines at current cursor position
                        inlineEditor._codeMirror.replaceRange(
                            newLines,
                            inlineEditor.getCursorPos()
                        );

                        var i = MainViewManager.findInWorkingSet(MainViewManager.ACTIVE_PANE, infos["test1.css"].fileEntry.fullPath);
                        expect(i).toEqual(1);

                        inlineEditor = null;
                    });
                });

                it("should sync edits between full and inline editors", function () {
                    var fullEditor,
                        inlineEditor,
                        newInlineText = "/* jasmine was inline */\n";

                    initInlineTest("test1.html", 1, true, ["test1.css"]);

                    runs(function () {
                        var cssPath = infos["test1.css"].fileEntry.fullPath;
                        var cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);

                        // edit the inline editor
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editor;
                        inlineEditor._codeMirror.replaceRange(
                            newInlineText,
                            inlineEditor.getCursorPos()
                        );

                        // activate the full editor
                        MainViewManager._edit(MainViewManager.ACTIVE_PANE, cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();

                        // sanity check
                        expect(fullEditor).not.toBe(inlineEditor);
                        expect(fullEditor._codeMirror).not.toBe(inlineEditor._codeMirror);

                        // compare inline editor to full editor
                        expectTextToBeEqual(inlineEditor, fullEditor);

                        // make sure the text was inserted
                        expect(fullEditor._codeMirror.getValue().indexOf(newInlineText)).toBeGreaterThan(0);

                        // edit in the full editor and compare
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            inlineEditor.getCursorPos()
                        );
                        expectTextToBeEqual(inlineEditor, fullEditor);

                        inlineEditor = fullEditor = null;
                    });
                });
            });

            describe("Inline Editor range updating", function () {

                var fullEditor,
                    hostEditor,
                    inlineEditor,
                    newInlineText = "/* insert in full editor */\n",
                    before,
                    start,
                    middle,
                    middleOfMiddle,
                    end,
                    endOfEnd,
                    after,
                    wayafter;

                beforeEach(function () {
                    initInlineTest("test1.html", 1, true, ["test1.css"]);

                    runs(function () {
                        var cssPath = infos["test1.css"].fileEntry.fullPath;
                        var cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        hostEditor = EditorManager.getCurrentFullEditor();
                        inlineEditor = hostEditor.getInlineWidgets()[0].editor;

                        // activate the full editor
                        MainViewManager._edit(MainViewManager.ACTIVE_PANE, cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();

                        // alias offsets to nice names
                        before = infos["test1.css"].offsets[4];
                        start = infos["test1.css"].offsets[1];
                        middle = infos["test1.css"].offsets[5];
                        middleOfMiddle = {line: middle.line, ch: 3};
                        end = infos["test1.css"].offsets[6];
                        endOfEnd = infos["test1.css"].offsets[3];
                        after = infos["test1.css"].offsets[7];
                        wayafter = infos["test1.css"].offsets[2];
                    });
                });

                afterEach(function () {
                    fullEditor   = null;
                    hostEditor   = null;
                    inlineEditor = null;
                });

                it("should insert new line at start of range, and stay open on undo", function () {
                    // insert new line at start of inline range--the new line should be included in
                    // the inline
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        start
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));

                    // undo is equivalent to deleting the first line in the range: shouldn't close the editor
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });

                it("should insert new line within first line of range, and stay open on undo", function () {
                    // insert new line in middle of first line of inline range--the new line should
                    // be included
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        {line: start.line, ch: start.ch + 1}
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));

                    // Even though the edit didn't start at the beginning of the line, the undo touches
                    // the whole line; but deleting the first line still shouldn't close the editor
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });

                it("should not close inline when undoing changes to first line in range that did not include newlines", function () {
                    // undo is NOT deleting the entire first line in these cases, so the inline should be able to stay open

                    // insert new text at start of inline range, without newlines--the new text should be included in
                    // the inline
                    fullEditor._codeMirror.replaceRange(
                        ".bar, ",
                        start
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));

                    // replace text at start of inline range with text without newlines
                    fullEditor._codeMirror.replaceRange(
                        ".bar",
                        {line: start.line, ch: 0},
                        {line: start.line, ch: 4}
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));

                    // insert new text in middle of first line in range, without newlines
                    fullEditor._codeMirror.replaceRange(
                        "ABCD",
                        {line: start.line, ch: 3}
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });

                it("should sync deletions (and their undos) on last line in range, with or without newlines", function () {
                    // undo is NOT deleting the entire last line in these cases, so the inline should be able to stay open

                    // insert new line in middle of last line of inline range--the new line should
                    // be included
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        {line: end.line, ch: end.ch + 1}
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));

                    // insert new line at end of last line of inline range--the new line should
                    // be included
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        endOfEnd
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));

                    // replace all text on last line (without replacing trailing newline)
                    fullEditor._codeMirror.replaceRange(
                        "ABCD",
                        end,
                        endOfEnd
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });

                it("should sync insertions (and their undos) in most cases without closing", function () {
                    // insert line above inline range
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        before
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line + 1, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));

                    // insert line within inline range
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        middle
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));

                    // insert line at end of inline range
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        end
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));

                    // insert line below inline range
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        after
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });

                it("should sync deletions from the full editor and update the visual range of the inline editor", function () {
                    // delete line within inline range
                    fullEditor._codeMirror.replaceRange("", middle, end);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 1));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));

                    // delete line below inline range
                    fullEditor._codeMirror.replaceRange("", after, wayafter);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });
                it("should close inline when newline at beginning of range is deleted", function () {
                    // delete all of line just above the range
                    fullEditor._codeMirror.replaceRange("", before, start);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should stay open when first line entirely deleted", function () {
                    // delete all of first line in range
                    fullEditor._codeMirror.replaceRange("", start, middle);
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 1));
                });
                it("should stay open when first line and following text deleted", function () {
                    // delete all of first line in range, plus some of the next line
                    fullEditor._codeMirror.replaceRange("", start, middleOfMiddle);
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 1));
                });
                it("should stay open when first two lines deleted", function () {
                    // delete all of first two lines in range
                    fullEditor._codeMirror.replaceRange("", start, end);
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 2));
                });
                it("should close inline when last line entirely deleted", function () {
                    // delete all of last line in range
                    fullEditor._codeMirror.replaceRange("", end, after);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when last line and preceding text deleted", function () {
                    // delete all of last line in range, plus some of previous line
                    fullEditor._codeMirror.replaceRange("", middleOfMiddle, after);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when last line and more preceding text deleted", function () {
                    // delete all of last line in range, plus some of previous two lines
                    fullEditor._codeMirror.replaceRange("", {line: start.line, ch: 3}, after);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when deletion spans top of range", function () {
                    // delete a block starting before the inline and ending within it
                    fullEditor._codeMirror.replaceRange("", {line: before.line - 1, ch: 0}, middleOfMiddle);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when deletion spans top of range (barely)", function () {
                    // delete a block starting before the inline and ending within it
                    fullEditor._codeMirror.replaceRange("", before, {line: start.line, ch: 1});
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when deletion spans bottom of range", function () {
                    // delete a block starting within the inline and ending after it
                    fullEditor._codeMirror.replaceRange("", middleOfMiddle, wayafter);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });


                it("should sync insertions with multiple change objects in one event", function () {
                    // Insert two new lines: one at start of inline range, the other at the (newly
                    // updated) end of range. The edits are batched into just one event (so the
                    // event's changeList will have length 2); both new lines should be included in
                    // the inline
                    fullEditor._codeMirror.operation(function () {
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            start
                        );
                        // because the edit shifted everything down a line, 'after' is now pointing
                        // at what 'end' used to point at (the "}" line)
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            after
                        );
                    });
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 2));

                    // TODO: can't do our usual undo + re-check range test at the end, because of
                    // codemirror/CodeMirror bug #487
                });


                it("should sync multiple edits between full and inline editors", function () {
                    var i,
                        editor,
                        text,
                        newInlineText = "/* jasmine was inline */\n",
                        newFullText = "/* full editor edit */\n";

                    // alternate editors while inserting new text
                    for (i = 0; i < 10; i++) {
                        editor = (i % 2 === 0) ? fullEditor : inlineEditor;
                        text = (i % 2 === 0) ? newFullText : newInlineText;
                        editor._codeMirror.replaceRange(
                            text,
                            editor.getCursorPos()
                        );
                        expectTextToBeEqual(inlineEditor, fullEditor);
                    }
                });

                it("should close inline if the contents of the full editor are all deleted", function () {
                    // verify inline is open
                    expect(hostEditor.getInlineWidgets().length).toBe(1);

                    // delete all text via full editor
                    fullEditor._codeMirror.setValue("");

                    // verify inline is closed
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });

                it("should sync after undoing and redoing an edit", function () {
                    var originalText,
                        editedText,
                        newInlineText = "/* jasmine was inline */\n";

                    originalText = inlineEditor._codeMirror.getValue();

                    // edit the inline editor in the middle of the text so it doesn't
                    // run into one of the collapsing cases
                    inlineEditor._codeMirror.replaceRange(
                        newInlineText,
                        middle
                    );
                    editedText = inlineEditor._codeMirror.getValue();

                    // compare inline editor to full editor
                    expectTextToBeEqual(inlineEditor, fullEditor);

                    // undo the inline editor
                    inlineEditor._codeMirror.undo();
                    expectTextToBeEqual(inlineEditor, fullEditor);
                    expectText(inlineEditor).toBe(originalText);

                    // redo the inline editor
                    inlineEditor._codeMirror.redo();
                    expectTextToBeEqual(inlineEditor, fullEditor);
                    expectText(inlineEditor).toBe(editedText);

                    // undo the full editor
                    fullEditor._codeMirror.undo();
                    expectTextToBeEqual(inlineEditor, fullEditor);
                    expectText(fullEditor).toBe(originalText);

                    // redo the full editor
                    fullEditor._codeMirror.redo();
                    expectTextToBeEqual(inlineEditor, fullEditor);
                    expectText(fullEditor).toBe(editedText);
                });

            });

            describe("Multiple inline editor interaction", function () {
                var hostEditor, inlineEditor;
                beforeEach(function () {
                    initInlineTest("test1.html", 1, true, ["test1.css"]);

                    runs(function () {
                        hostEditor = EditorManager.getCurrentFullEditor();
                        inlineEditor = hostEditor.getInlineWidgets()[0].editor;
                    });
                });

                afterEach(function () {
                    hostEditor   = null;
                    inlineEditor = null;
                });

                it("should keep range consistent after undo/redo (bug #1031)", function () {
                    var secondInlineOpen = false, secondInlineEditor;

                    // open inline editor at specified offset index
                    runs(function () {
                        hostEditor.focus();
                        SpecRunnerUtils.toggleQuickEditAtOffset(
                            hostEditor,
                            infos["test1.html"].offsets[8]
                        ).done(function (isOpen) {
                            secondInlineOpen = isOpen;
                        });
                    });

                    waitsFor(function () { return secondInlineOpen; }, "second inline open timeout", 1000);

                    // Not sure why we have to wait in between these for the bug to occur, but we do.
                    runs(function () {
                        secondInlineEditor = hostEditor.getInlineWidgets()[1].editor;
                        secondInlineEditor._codeMirror.replaceRange("\n\n\n\n\n", { line: 0, ch: 0 });
                    });
                    waits(500);
                    runs(function () {
                        secondInlineEditor._codeMirror.undo();
                    });
                    waits(500);
                    runs(function () {
                        inlineEditor._codeMirror.undo();
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(10, 12));

                        secondInlineEditor = null;
                    });
                });
            });


            describe("Inline Editor range equal to file range", function () {
                var fullEditor,
                    hostEditor,
                    inlineEditor;

                beforeEach(function () {
                    initInlineTest("test1.html", 5, true, ["testOneRuleFile.css"]);

                    runs(function () {
                        var cssPath = infos["testOneRuleFile.css"].fileEntry.fullPath;
                        var cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        hostEditor = EditorManager.getCurrentFullEditor();
                        inlineEditor = hostEditor.getInlineWidgets()[0].editor;

                        // activate the full editor
                        MainViewManager._edit(MainViewManager.ACTIVE_PANE, cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();
                    });
                });

                afterEach(function () {
                    fullEditor   = null;
                    hostEditor   = null;
                    inlineEditor = null;
                });

                it("should delete line at bottom and not close on undo", function () {
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 2));

                    // delete all of last line in range
                    fullEditor._codeMirror.replaceRange("", {line: 1, ch: 16}, {line: 2, ch: 1});
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 1));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 2));
                });

                it("should insert new line at bottom and not close on undo", function () {
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 2));

                    // delete all of last line in range
                    fullEditor._codeMirror.replaceRange("\n/* New last line */", {line: 2, ch: 1});
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 3));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 2));
                });
            });
        });

        describe("InlineEditor provider prioritization", function () {
            var testWindow,
                testDocumentManager,
                testEditorManager,
                testMainViewManager,
                testDoc;

            function getPositiveProviderCallback(widget) {
                return function () {
                    widget.called = true;
                    return $.Deferred().resolve(widget).promise();
                };
            }

            function negativeProviderCallback() {
                return null;
            }

            beforeEach(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    var mock = SpecRunnerUtils.createMockEditor("");
                    testWindow          = w;
                    Commands            = testWindow.brackets.test.Commands;
                    testEditorManager   = testWindow.brackets.test.EditorManager;
                    testMainViewManager = testWindow.brackets.test.MainViewManager;
                    testDocumentManager = testWindow.brackets.test.DocumentManager;

                    testDoc             = mock.doc;

                    testDocumentManager.getOpenDocumentForPath = function (fullPath) {
                        return testDoc;
                    };

                    testMainViewManager._edit(testMainViewManager.ACTIVE_PANE, testDoc);
                });
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDoc);
                SpecRunnerUtils.closeTestWindow();
                testWindow          = null;
                Commands            = null;
                testEditorManager   = null;
                testDoc             = null;
                testMainViewManager = null;
                testDocumentManager = null;
            });


            it("should prefer positive higher priority providers (1)", function () {
                var widget0 = new InlineWidget(),
                    widget1 = new InlineWidget(),
                    widget2 = new InlineWidget();

                testEditorManager.registerInlineEditProvider(getPositiveProviderCallback(widget0));
                testEditorManager.registerInlineEditProvider(getPositiveProviderCallback(widget1), 1);
                testEditorManager.registerInlineEditProvider(getPositiveProviderCallback(widget2), 2);

                runs(function () {
                    testWindow.executeCommand(Commands.TOGGLE_QUICK_EDIT);
                });

                runs(function () {
                    expect(widget0.called).toBeFalsy();
                    expect(widget1.called).toBeFalsy();
                    expect(widget2.called).toBe(true);
                });
            });

            it("should prefer positive higher priority providers (2)", function () {
                var widget0 = new InlineWidget(),
                    widget1 = new InlineWidget(),
                    widget2 = new InlineWidget();

                testEditorManager.registerInlineEditProvider(getPositiveProviderCallback(widget2), 2);
                testEditorManager.registerInlineEditProvider(getPositiveProviderCallback(widget1), 1);
                testEditorManager.registerInlineEditProvider(getPositiveProviderCallback(widget0));

                runs(function () {
                    testWindow.executeCommand(Commands.TOGGLE_QUICK_EDIT);
                });

                runs(function () {
                    expect(widget0.called).toBeFalsy();
                    expect(widget1.called).toBeFalsy();
                    expect(widget2.called).toBe(true);
                });

            });

            it("should ignore negative higher priority providers", function () {
                var widget0 = new InlineWidget(),
                    widget1 = new InlineWidget(),
                    widget2 = new InlineWidget();

                testEditorManager.registerInlineEditProvider(negativeProviderCallback, 2);
                testEditorManager.registerInlineEditProvider(negativeProviderCallback, 1);
                testEditorManager.registerInlineEditProvider(getPositiveProviderCallback(widget0));
                testEditorManager.registerInlineEditProvider(getPositiveProviderCallback(widget1), -1);
                testEditorManager.registerInlineEditProvider(getPositiveProviderCallback(widget2), -2);

                runs(function () {
                    testWindow.executeCommand(Commands.TOGGLE_QUICK_EDIT);
                });

                runs(function () {
                    expect(widget0.called).toBe(true);
                    expect(widget1.called).toBeFalsy();
                    expect(widget2.called).toBeFalsy();
                });

            });

        });
    });
});
