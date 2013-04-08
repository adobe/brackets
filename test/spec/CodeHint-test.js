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
/*global define, describe, beforeEach, afterEach, it, runs, waits, waitsFor, expect, $, CodeMirror, brackets  */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var HTMLUtils       = require("language/HTMLUtils"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        Editor          = require("editor/Editor").Editor,
        KeyEvent        = require("utils/KeyEvent"),
        EditorManager,      // loaded from brackets.test
        CodeHintManager;

    var testPath = SpecRunnerUtils.getTestPath("/spec/CodeHint-test-files"),
        testWindow,
        initCodeHintTest;

    describe("Code Hint Menus", function () {
        this.category = "integration";

        /**
         * Performs setup for a code hint test. Opens a file and set pos.
         * 
         * @param {!string} openFile Project relative file path to open in a main editor.
         * @param {!number} openPos The pos within openFile to place the IP.
         */
        var _initCodeHintTest = function (openFile, openPos) {
            var hostOpened = false,
                err = false,
                workingSet = [];
    
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
    
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
                editor.setCursorPos(openPos.line, openPos.ch);
            });
        };
    
        beforeEach(function () {
            initCodeHintTest = _initCodeHintTest.bind(this);
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
    
                // uncomment this line to debug test window:
                //testWindow.brackets.app.showDeveloperTools();
    
                // Load module instances from brackets.test
                CodeHintManager     = testWindow.brackets.test.CodeHintManager;
                EditorManager       = testWindow.brackets.test.EditorManager;
            });
        });
    
        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
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

                // simulate Ctrl+space keystroke to invoke code hints menu
                runs(function () {
                    var e = $.Event("keydown");
                    e.keyCode = KeyEvent.DOM_VK_SPACE;
                    e.ctrlKey = true;

                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();

                    // get text before insert operation
                    lineBefore = editor.document.getLine(pos.line);

                    // Ultimately want to use SpecRunnerUtils.simulateKeyEvent()
                    // here, but it does not yet support modifer keys
                    CodeHintManager.handleKeyEvent(editor, e);

                    var codeHintList = CodeHintManager._getCodeHintList();
                    expect(codeHintList).toBeTruthy();
                    expect(codeHintList.isOpen()).toBe(true);
                });

                // simulate Enter key to insert code hint into doc
                runs(function () {
                    var e = $.Event("keydown");
                    e.keyCode = KeyEvent.DOM_VK_RETURN;

                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();

                    CodeHintManager.handleKeyEvent(editor, e);

                    // doesn't matter what was inserted, but line should be different
                    var newPos = editor.getCursorPos();
                    lineAfter = editor.document.getLine(pos.line);
                    expect(lineBefore).not.toEqual(lineAfter);
                });
            });

            it("should dismiss code hints menu with Esc key", function () {
                var editor,
                    pos = {line: 3, ch: 1};

                // minimal markup with an open '<' before IP
                // Note: line for pos is 0-based and editor lines numbers are 1-based
                initCodeHintTest("test1.html", pos);

                // simulate Ctrl+space keystroke to invoke code hints menu
                runs(function () {
                    var e = $.Event("keydown");
                    e.keyCode = KeyEvent.DOM_VK_SPACE;
                    e.ctrlKey = true;

                    editor = EditorManager.getCurrentFullEditor();
                    expect(editor).toBeTruthy();

                    // Ultimately want to use SpecRunnerUtils.simulateKeyEvent()
                    // here, but it does not yet support modifer keys
                    CodeHintManager.handleKeyEvent(editor, e);

                    // verify list is open
                    var codeHintList = CodeHintManager._getCodeHintList();
                    expect(codeHintList).toBeTruthy();
                    expect(codeHintList.isOpen()).toBe(true);
                });

                // simulate Esc key to dismiss code hints menu
                runs(function () {
                    var key = KeyEvent.DOM_VK_ESCAPE,
                        element = testWindow.$(".dropdown.open")[0];
                    SpecRunnerUtils.simulateKeyEvent(key, "keydown", element);

                    // verify list is no longer open
                    var codeHintList = CodeHintManager._getCodeHintList();
                    expect(codeHintList).toBeFalsy();
                });
            });
        });
    });
});
