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
/*global define, describe, beforeEach, afterEach, it, runs, waits, waitsForDone, expect, $  */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var HTMLUtils       = require("language/HTMLUtils"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        KeyEvent        = require("utils/KeyEvent"),
        Commands        = require("command/Commands"),
        EditorManager,      // loaded from brackets.test
        CommandManager,
        CodeHintManager;

    var testPath = SpecRunnerUtils.getTestPath("/spec/CodeHint-test-files"),
        testWindow,
        initCodeHintTest;

    describe("CodeHintManager", function () {
        this.category = "integration";

        /**
         * Performs setup for a code hint test. Opens a file and set pos.
         * 
         * @param {!string} openFile Project relative file path to open in a main editor.
         * @param {!number} openPos The pos within openFile to place the IP.
         */
        var _initCodeHintTest = function (openFile, openPos) {
            
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
            
            runs(function () {
                var promise = SpecRunnerUtils.openProjectFiles([openFile]);
                waitsForDone(promise);
            });
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
                CommandManager      = testWindow.brackets.test.CommandManager;
            });
        });
    
        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
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

                    CodeHintManager._getCodeHintList()._handleKeydown(e);

                    // doesn't matter what was inserted, but line should be different
                    var newPos = editor.getCursorPos();
                    lineAfter = editor.document.getLine(pos.line);
                    expect(lineBefore).not.toEqual(lineAfter);
                    
                    // and popup should auto-close
                    expectNoHints();
                });
            });

            it("should dismiss code hints menu with Esc key", function () {
                var editor,
                    pos = {line: 3, ch: 1};

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
                });
            });
        });
    });
});
