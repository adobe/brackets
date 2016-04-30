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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, beforeEach, afterEach, it, runs, waitsForDone, expect, $, beforeFirst, afterLast */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        KeyEvent        = require("utils/KeyEvent"),
        Commands        = require("command/Commands"),
        EditorManager,      // loaded from brackets.test
        CommandManager,
        CodeHintManager,
        KeyBindingManager;

    var testPath = SpecRunnerUtils.getTestPath("/spec/CodeHint-test-files"),
        testWindow;

    describe("CodeHintManager", function () {
        this.category = "integration";

        /**
         * Performs setup for a code hint test. Opens a file and set pos.
         *
         * @param {!string} openFile Project relative file path to open in a main editor.
         * @param {!number|Array} openPos The pos within openFile to place the IP, or an array
         *      representing a multiple selection to set.
         */
        function initCodeHintTest(openFile, openPos) {
            SpecRunnerUtils.loadProjectInTestWindow(testPath);

            runs(function () {
                var promise = SpecRunnerUtils.openProjectFiles([openFile]);
                waitsForDone(promise);
            });

            runs(function () {
                var editor = EditorManager.getCurrentFullEditor();
                if (Array.isArray(openPos)) {
                    editor.setSelections(openPos);
                } else {
                    editor.setCursorPos(openPos.line, openPos.ch);
                }
            });
        }

        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // uncomment this line to debug test window:
                //testWindow.brackets.app.showDeveloperTools();

                // Load module instances from brackets.test
                CodeHintManager     = testWindow.brackets.test.CodeHintManager;
                EditorManager       = testWindow.brackets.test.EditorManager;
                CommandManager      = testWindow.brackets.test.CommandManager;
                KeyBindingManager   = testWindow.brackets.test.KeyBindingManager;
            });
        });

        afterLast(function () {
            testWindow          = null;
            CodeHintManager     = null;
            EditorManager       = null;
            CommandManager      = null;
            KeyBindingManager   = null;
            SpecRunnerUtils.closeTestWindow();
        });

        afterEach(function () {
            runs(function () {
                testWindow.closeAllFiles();
            });
        });

        function invokeCodeHints() {
            CommandManager.execute(Commands.SHOW_CODE_HINTS);
        }

        // Note: these don't request hint results - they only examine hints that might already be open
        function expectNoHints() {
            var codeHintList = CodeHintManager._getCodeHintList();
            expect(codeHintList).toBeFalsy();
        }

        function expectSomeHints() {
            var codeHintList = CodeHintManager._getCodeHintList();
            expect(codeHintList).toBeTruthy();
            expect(codeHintList.isOpen()).toBe(true);
            return codeHintList;
        }

        // TODO: There seems to be an issue with CodeHintManager._removeHintProvider because of which the tests
        // added for "Hint Provider Registration" are interfering with this test case
        // (mock provider added for new language shows up for RegExp, even though no code hint should show up)
        // I am unable to reproduce this in a real scenario though/
        // This is the reason this test case is being added before the registration test cases.
        // We need to either figure out whats going wrong with register or change the RegExp code hint fix to bail
        // before HintUtils (Something like the fix for no code hints for multiple selection)
        describe("RegExp codehint tests", function () {
            it("should not show codehints for regular expression in a script block in html", function () {
                var editor,
                    pos = {line: 8, ch: 30};

                // Place cursor inside a sample regular expression
                // Note: line for pos is 0-based and editor lines numbers are 1-based
                initCodeHintTest("test1.html", pos);

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();
                    invokeCodeHints();
                    expectNoHints();
                    editor = null;
                });
            });

            it("should not show codehints for regular expression in a Javascript file", function () {
                var editor,
                    pos = {line: 2, ch: 30};

                // Place cursor inside a sample regular expression
                // Note: line for pos is 0-based and editor lines numbers are 1-based
                initCodeHintTest("testRegexp.js", pos);

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();
                    invokeCodeHints();
                    expectNoHints();
                    editor = null;
                });
            });
        });

        describe("Hint Provider Registration", function () {
            beforeEach(function () {
                initCodeHintTest("test1.html", {line: 0, ch: 0});
            });

            var mockProvider = {
                hasHints: function (editor, implicitChar) {
                    return true;
                },
                getHints: function (implicitChar) {
                    return { hints: ["mock hint"], match: null, selectInitial: false };
                },
                insertHint: function (hint) { }
            };

            function expectMockHints() {
                var codeHintList = expectSomeHints();
                expect(codeHintList.hints[0]).toBe("mock hint");
                expect(codeHintList.hints.length).toBe(1);
            }

            it("should register provider for a new language", function () {
                runs(function () {
                    CodeHintManager.registerHintProvider(mockProvider, ["clojure"], 0);

                    // Ensure no hints in language we didn't register for
                    invokeCodeHints();
                    expectNoHints();

                    // Expect hints in language we did register for
                    var promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: SpecRunnerUtils.makeAbsolute("test.clj") });
                    waitsForDone(promise);
                });
                runs(function () {
                    invokeCodeHints();
                    expectMockHints();

                    CodeHintManager._removeHintProvider(mockProvider, ["clojure"], 0);
                });
            });

            it("should register higher-priority provider for existing language", function () {
                runs(function () {
                    CodeHintManager.registerHintProvider(mockProvider, ["html"], 1);

                    // Expect hints to replace default HTML hints
                    var editor = EditorManager.getCurrentFullEditor();
                    editor.setCursorPos(3, 1);
                    invokeCodeHints();
                    expectMockHints();

                    CodeHintManager._removeHintProvider(mockProvider, ["html"], 1);
                });
            });

            it("should register \"all\" languages provider", function () {
                runs(function () {
                    CodeHintManager.registerHintProvider(mockProvider, ["all"], 0);

                    // Expect hints in language that already had hints (when not colliding with original provider)
                    invokeCodeHints();
                    expectMockHints();

                    // Expect hints in language that had no hints before
                    var promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: SpecRunnerUtils.makeAbsolute("test.clj") });
                    waitsForDone(promise);
                });
                runs(function () {
                    invokeCodeHints();
                    expectMockHints();

                    CodeHintManager._removeHintProvider(mockProvider, ["all"], 0);
                });
            });
        });


        describe("HTML Tests", function () {

            it("should show code hints menu and insert text at IP", function () {
                var editor,
                    pos = {line: 3, ch: 1},
                    lineBefore,
                    lineAfter;

                // minimal markup with an open '<' before IP
                // Note: line for pos is 0-based and editor lines numbers are 1-based
                initCodeHintTest("test1.html", pos);

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();

                    // get text before insert operation
                    lineBefore = editor.document.getLine(pos.line);

                    invokeCodeHints();
                    expectSomeHints();
                });

                // simulate Enter key to insert code hint into doc
                runs(function () {
                    var e = $.Event("keydown");
                    e.keyCode = KeyEvent.DOM_VK_RETURN;

                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();

                    CodeHintManager._getCodeHintList()._keydownHook(e);

                    // doesn't matter what was inserted, but line should be different
                    var newPos = editor.getCursorPos();
                    lineAfter = editor.document.getLine(newPos.line);
                    expect(lineBefore).not.toEqual(lineAfter);

                    // and popup should auto-close
                    expectNoHints();

                    editor = null;
                });
            });

            it("should not show code hints if there is a multiple selection", function () {
                // minimal markup with an open '<' before IP
                // Note: line for pos is 0-based and editor lines numbers are 1-based
                initCodeHintTest("test1.html", [
                    {start: {line: 3, ch: 1}, end: {line: 3, ch: 1}, primary: true},
                    {start: {line: 4, ch: 1}, end: {line: 4, ch: 1}}
                ]);

                runs(function () {
                    invokeCodeHints();
                    expectNoHints();
                });
            });

            it("should dismiss existing code hints if selection changes to a multiple selection", function () {
                var editor;

                initCodeHintTest("test1.html", {line: 3, ch: 1});

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();

                    invokeCodeHints();
                    expectSomeHints();
                });

                runs(function () {
                    editor.setSelections([
                        {start: {line: 3, ch: 1}, end: {line: 3, ch: 1}, primary: true},
                        {start: {line: 4, ch: 1}, end: {line: 4, ch: 1}}
                    ]);
                    expectNoHints();
                });
            });

            it("should dismiss code hints menu with Esc key", function () {
                var pos = {line: 3, ch: 1};

                // minimal markup with an open '<' before IP
                // Note: line for pos is 0-based and editor lines numbers are 1-based
                initCodeHintTest("test1.html", pos);

                runs(function () {
                    invokeCodeHints();

                    // verify list is open
                    expectSomeHints();
                });

                // simulate Esc key to dismiss code hints menu
                runs(function () {
                    var key = KeyEvent.DOM_VK_ESCAPE,
                        element = testWindow.$(".dropdown.open")[0];
                    SpecRunnerUtils.simulateKeyEvent(key, "keydown", element);

                    // verify list is no longer open
                    expectNoHints();
                });
            });

            it("should dismiss code hints menu when launching a command", function () {
                var editor,
                    pos = {line: 3, ch: 1};

                // minimal markup with an open '<' before IP
                // Note: line for pos is 0-based and editor lines numbers are 1-based
                initCodeHintTest("test1.html", pos);

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();

                    editor.document.replaceRange("di", pos);
                    invokeCodeHints();

                    // verify list is open
                    expectSomeHints();
                });

                // Call Undo command to remove "di" and then verify no code hints
                runs(function () {
                    CommandManager.execute(Commands.EDIT_UNDO);

                    // verify list is no longer open
                    expectNoHints();

                    editor = null;
                });
            });

            it("should stop handling keydowns if closed by a click outside", function () {
                var editor,
                    pos = {line: 3, ch: 1};

                // minimal markup with an open '<' before IP
                // Note: line for pos is 0-based and editor lines numbers are 1-based
                initCodeHintTest("test1.html", pos);

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();

                    editor.document.replaceRange("di", pos);
                    invokeCodeHints();

                    // verify list is open
                    expectSomeHints();

                    // get the document text and make sure it doesn't change if we
                    // click outside and then keydown
                    var text = editor.document.getText();

                    testWindow.$("body").click();
                    KeyBindingManager._handleKeyEvent({
                        keyCode: KeyEvent.DOM_VK_ENTER,
                        stopImmediatePropagation: function () { },
                        stopPropagation: function () { },
                        preventDefault: function () { }
                    });

                    // Verify that after the keydown, the session is closed
                    // (not just the hint popup). Because of #1381, we don't
                    // actually have a way to close the session as soon as the
                    // popup is dismissed by Bootstrap, so we do so on the next
                    // keydown. Eventually, once that's fixed, we should be able
                    // to move this expectNoHints() up after the click.
                    expectNoHints();
                    expect(editor.document.getText()).toEqual(text);

                    editor = null;
                });
            });
        });
    });
});
