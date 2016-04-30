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
/*global define, describe, it, expect, beforeEach, afterEach, jasmine, spyOn */

define(function (require, exports, module) {
    'use strict';

    var Editor              = require("editor/Editor").Editor,
        LanguageManager     = require("language/LanguageManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    var langNames = {
        css:        {mode: "css",           langName: "CSS"},
        javascript: {mode: "javascript",    langName: "JavaScript"},
        html:       {mode: "html",          langName: "HTML"},
        unknown:    {mode: null,            langName: "Text"}
    };

    function compareMode(expected, actual) {
        if (typeof actual === "string") {
            return actual === expected;
        } else if (actual === null) {
            return expected === null;
        }

        return actual === expected;
    }

    function expectModeAndLang(editor, lang) {
        expect(editor.getModeForSelection()).toSpecifyModeNamed(lang.mode);
        expect(editor.getLanguageForSelection().getName()).toBe(lang.langName);
    }

    describe("Editor", function () {
        var defaultContent = "Brackets is going to be awesome!\n";
        var myDocument, myEditor;

        function createTestEditor(content, languageId) {
            // create dummy Document and Editor
            var mocks = SpecRunnerUtils.createMockEditor(content, languageId);
            myDocument = mocks.doc;
            myEditor = mocks.editor;
        }

        beforeEach(function () {
            this.addMatchers({
                toSpecifyModeNamed: function (expected) {
                    return compareMode(expected, this.actual);
                }
            });
        });

        afterEach(function () {
            if (myEditor) {
                SpecRunnerUtils.destroyMockEditor(myDocument);
                myEditor = null;
                myDocument = null;
            }
        });

        describe("Editor wrapper", function () {
            beforeEach(function () {
                createTestEditor(defaultContent, "");
            });

            it("should initialize with content", function () {
                // verify editor content
                expect(myEditor._codeMirror.getValue()).toEqual(defaultContent);
            });

            // FUTURE: this should really be in a Document unit test, but there's no "official"
            // way to create the model for a Document without manually creating an Editor, so we're
            // testing this here for now until we get a real central model.
            it("should trigger a synchronous Document change event when an edit is performed", function () {
                var changeFired = false;
                function changeHandler(event, doc, changeList) {
                    myDocument.off("change", changeHandler);
                    changeFired = true;
                    expect(doc).toBe(myDocument);
                    expect(changeList.length).toBe(1);
                    expect(changeList[0].from).toEqual({line: 0, ch: 0});
                    expect(changeList[0].to).toEqual({line: 1, ch: 0});
                    expect(changeList[0].text).toEqual(["new content"]);
                }
                myDocument.on("change", changeHandler);
                myEditor._codeMirror.setValue("new content");
                expect(changeFired).toBe(true);
            });

            it("should send an array of multiple change records for an operation", function () {
                var cm = myEditor._codeMirror,
                    changeHandler = jasmine.createSpy();
                myDocument.on("change", changeHandler);
                cm.operation(function () {
                    cm.replaceRange("inserted", {line: 1, ch: 0});
                    cm.replaceRange("", {line: 0, ch: 0}, {line: 0, ch: 4});
                });

                expect(changeHandler.callCount).toBe(1);

                var args = changeHandler.mostRecentCall.args;
                expect(args[1]).toBe(myDocument);
                expect(args[2][0].text).toEqual(["inserted"]);
                expect(args[2][0].from).toEqual({line: 1, ch: 0});
                expect(args[2][0].to).toEqual({line: 1, ch: 0});
                expect(args[2][1].text).toEqual([""]);
                expect(args[2][1].from).toEqual({line: 0, ch: 0});
                expect(args[2][1].to).toEqual({line: 0, ch: 4});
            });

            it("should set mode based on Document language", function () {
                createTestEditor(defaultContent, "html");

                var htmlLanguage = LanguageManager.getLanguage("html");
                expect(myEditor.getModeForDocument()).toBe(htmlLanguage.getMode());
            });

        });

        describe("Focus", function () {
            beforeEach(function () {
                createTestEditor(defaultContent, "");
            });

            it("should not have focus until explicitly set", function () {
                expect(myEditor.hasFocus()).toBe(false);
            });
            it("should be able to detect when it has focus", function () {
                /*
                 * @note: This test really just ensures that
                 *          calling the editor's focus method
                 *          will call the codeMirror focus method
                 *        This is due to the fact that focusing the editor
                 *          may not actually focus the editor if the app
                 *          doesn't have the keyboard focus which changed
                 *          with cef 2171
                 * @todo: This will need to be replaced with
                 *       checks to see that the editor is the "active" element
                 *       rather than have the input focus after focusing
                 *       the editor
                 * @see: https://github.com/adobe/brackets/issues/9972
                 */
                spyOn(myEditor._codeMirror, "focus").andCallThrough();
                myEditor.focus();
                expect(myEditor._codeMirror.focus).toHaveBeenCalled();
            });
        });

        describe("getModeForSelection()", function () {
            var jsContent = "var foo;";
            var htmlContent = "<html><head>\n" +
                              "  <script>\n" +
                              "    var bar;\n" +
                              "  </script>\n" +
                              "</head><body>\n" +
                              "  <p>Hello</p>\n" +
                              "</body></html>";

            it("should get mode in homogeneous file", function () {
                createTestEditor(jsContent, langNames.javascript.mode);

                // Mode at point
                myEditor.setCursorPos(0, 0);    // first char in text
                expectModeAndLang(myEditor, langNames.javascript);
                myEditor.setCursorPos(0, 8);    // last char in text
                expectModeAndLang(myEditor, langNames.javascript);

                myEditor.setCursorPos(0, 3);    // middle of text
                expectModeAndLang(myEditor, langNames.javascript);

                // Mode for range
                myEditor.setSelection({line: 0, ch: 4}, {line: 0, ch: 7});
                expectModeAndLang(myEditor, langNames.javascript);
                myEditor.setSelection({line: 0, ch: 0}, {line: 0, ch: 8});  // select all
                expectModeAndLang(myEditor, langNames.javascript);

                // Mode for multiple cursors/selections
                myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}},
                                        {start: {line: 0, ch: 5}, end: {line: 0, ch: 5}}]);
                expectModeAndLang(myEditor, langNames.javascript);
                myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 0, ch: 3}},
                                        {start: {line: 0, ch: 5}, end: {line: 0, ch: 7}}]);
                expectModeAndLang(myEditor, langNames.javascript);
            });

            it("should get mode in HTML file", function () {
                createTestEditor(htmlContent, "html");

                // Mode at point
                myEditor.setCursorPos(0, 0);    // first char in text
                expectModeAndLang(myEditor, langNames.html);
                myEditor.setCursorPos(6, 14);    // last char in text
                expectModeAndLang(myEditor, langNames.html);

                myEditor.setCursorPos(5, 7);    // middle of text - html
                expectModeAndLang(myEditor, langNames.html);
                myEditor.setCursorPos(2, 7);    // middle of text - js
                expectModeAndLang(myEditor, langNames.javascript);

                // Mode for range - homogeneous mode
                myEditor.setSelection({line: 5, ch: 2}, {line: 5, ch: 14});
                expectModeAndLang(myEditor, langNames.html);
                myEditor.setSelection({line: 5, ch: 0}, {line: 6, ch: 0});  // whole line
                expectModeAndLang(myEditor, langNames.html);
                myEditor.setSelection({line: 2, ch: 4}, {line: 2, ch: 12});
                expectModeAndLang(myEditor, langNames.javascript);
                myEditor.setSelection({line: 2, ch: 0}, {line: 3, ch: 0});  // whole line
                expectModeAndLang(myEditor, langNames.javascript);

                // Mode for multiple cursors/selections - homogeneous mode
                myEditor.setSelections([{start: {line: 2, ch: 0}, end: {line: 2, ch: 0}},
                                        {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}}]);
                expectModeAndLang(myEditor, langNames.javascript);
                myEditor.setSelections([{start: {line: 2, ch: 0}, end: {line: 2, ch: 2}},
                                        {start: {line: 2, ch: 4}, end: {line: 2, ch: 6}}]);
                expectModeAndLang(myEditor, langNames.javascript);
                myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}},
                                        {start: {line: 5, ch: 7}, end: {line: 5, ch: 7}},
                                        {start: {line: 6, ch: 14}, end: {line: 6, ch: 14}}]);
                expectModeAndLang(myEditor, langNames.html);
                myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 0, ch: 2}},
                                        {start: {line: 5, ch: 7}, end: {line: 5, ch: 9}},
                                        {start: {line: 6, ch: 12}, end: {line: 6, ch: 14}}]);
                expectModeAndLang(myEditor, langNames.html);

                // Mode for range - mix of modes
                myEditor.setSelection({line: 2, ch: 4}, {line: 3, ch: 7});
                expectModeAndLang(myEditor, langNames.unknown);

                // Mode for multiple cursors/selections - mix of modes
                myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}},
                                        {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}},
                                        {start: {line: 6, ch: 14}, end: {line: 6, ch: 14}}]);
                expectModeAndLang(myEditor, langNames.unknown);
                myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 0, ch: 2}},
                                        {start: {line: 2, ch: 4}, end: {line: 2, ch: 7}},
                                        {start: {line: 6, ch: 12}, end: {line: 6, ch: 14}}]);
                expectModeAndLang(myEditor, langNames.unknown);
                myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 2, ch: 0}},
                                        {start: {line: 2, ch: 4}, end: {line: 2, ch: 7}},
                                        {start: {line: 6, ch: 12}, end: {line: 6, ch: 14}}]);
                expectModeAndLang(myEditor, langNames.unknown);
                myEditor.setSelections([{start: {line: 0, ch: 0}, end: {line: 0, ch: 2}},
                                        {start: {line: 2, ch: 4}, end: {line: 5, ch: 3}},
                                        {start: {line: 6, ch: 12}, end: {line: 6, ch: 14}}]);
                expectModeAndLang(myEditor, langNames.unknown);

                // Mode for range - mix of modes where start & endpoints are same mode
                // Known limitation of getModeForSelection() that it does not spot where the mode
                // differs in mid-selection
                myEditor.setSelection({line: 0, ch: 0}, {line: 6, ch: 14});  // select all
                expectModeAndLang(myEditor, langNames.html);
            });

        });

        describe("Column/ch conversion", function () {
            it("should get mode in HTML file", function () {
                var content =
                    "foo () {\n" +
                    "    one;\n" +
                    "\ttwo;\n" +
                    "}\n" +
                    "\n" +
                    "\tA\tB";
                createTestEditor(content, "javascript");

                // Tab size 4

                expect(myEditor.getColOffset({line: 1, ch: 0})).toBe(0);
                expect(myEditor.getColOffset({line: 1, ch: 1})).toBe(1);
                expect(myEditor.getColOffset({line: 1, ch: 2})).toBe(2);
                expect(myEditor.getColOffset({line: 1, ch: 3})).toBe(3);
                expect(myEditor.getColOffset({line: 1, ch: 4})).toBe(4);
                expect(myEditor.getColOffset({line: 1, ch: 5})).toBe(5);
                expect(myEditor.getColOffset({line: 2, ch: 0})).toBe(0);
                expect(myEditor.getColOffset({line: 2, ch: 1})).toBe(4);
                expect(myEditor.getColOffset({line: 2, ch: 2})).toBe(5);
                expect(myEditor.getColOffset({line: 4, ch: 0})).toBe(0);
                expect(myEditor.getColOffset({line: 5, ch: 1})).toBe(4);
                expect(myEditor.getColOffset({line: 5, ch: 2})).toBe(5);
                expect(myEditor.getColOffset({line: 5, ch: 3})).toBe(8);
                expect(myEditor.getColOffset({line: 5, ch: 4})).toBe(9);

                // Tab size 2
                var defaultTabSize = Editor.getTabSize();
                expect(defaultTabSize).toBe(4);
                Editor.setTabSize(2);

                expect(myEditor.getColOffset({line: 1, ch: 0})).toBe(0);  // first line is all spaces: should be unchanged
                expect(myEditor.getColOffset({line: 1, ch: 1})).toBe(1);
                expect(myEditor.getColOffset({line: 1, ch: 2})).toBe(2);
                expect(myEditor.getColOffset({line: 1, ch: 3})).toBe(3);
                expect(myEditor.getColOffset({line: 1, ch: 4})).toBe(4);
                expect(myEditor.getColOffset({line: 1, ch: 5})).toBe(5);
                expect(myEditor.getColOffset({line: 2, ch: 0})).toBe(0);  // but line with a tab shows different behavior
                expect(myEditor.getColOffset({line: 2, ch: 1})).toBe(2);
                expect(myEditor.getColOffset({line: 2, ch: 2})).toBe(3);
                expect(myEditor.getColOffset({line: 4, ch: 0})).toBe(0);
                expect(myEditor.getColOffset({line: 5, ch: 1})).toBe(2);  // same here
                expect(myEditor.getColOffset({line: 5, ch: 2})).toBe(3);
                expect(myEditor.getColOffset({line: 5, ch: 3})).toBe(4);
                expect(myEditor.getColOffset({line: 5, ch: 4})).toBe(5);

                // Restore default
                Editor.setTabSize(defaultTabSize);
            });
        });

        function makeDummyLines(num) {
            var content = [], i;
            for (i = 0; i < num; i++) {
                content.push("this is line " + i);
            }
            return content;
        }

        describe("Selections", function () {

            beforeEach(function () {
                createTestEditor(makeDummyLines(10).join("\n"), "unknown");
            });

            describe("hasSelection", function () {
                it("should return false for a single cursor", function () {
                    myEditor._codeMirror.setCursor(0, 2);
                    expect(myEditor.hasSelection()).toBe(false);
                });

                it("should return true for a single selection", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 1}, {line: 0, ch: 5});
                    expect(myEditor.hasSelection()).toBe(true);
                });

                it("should return false for multiple cursors", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    expect(myEditor.hasSelection()).toBe(false);
                });

                it("should return true for multiple selections", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 2);
                    expect(myEditor.hasSelection()).toBe(true);
                });

                it("should return true for mixed cursors and selections", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    expect(myEditor.hasSelection()).toBe(true);
                });
            });

            describe("getCursorPos", function () {
                it("should return a single cursor", function () {
                    myEditor._codeMirror.setCursor(0, 2);
                    expect(myEditor.getCursorPos()).toEqual({line: 0, ch: 2});
                    expect(myEditor.getCursorPos(false, "start")).toEqual({line: 0, ch: 2});
                    expect(myEditor.getCursorPos(false, "anchor")).toEqual({line: 0, ch: 2});
                    expect(myEditor.getCursorPos(false, "end")).toEqual({line: 0, ch: 2});
                    expect(myEditor.getCursorPos(false, "head")).toEqual({line: 0, ch: 2});
                });

                it("should return the correct ends of a single selection", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 1}, {line: 0, ch: 5});
                    expect(myEditor.getCursorPos()).toEqual({line: 0, ch: 5});
                    expect(myEditor.getCursorPos(false, "start")).toEqual({line: 0, ch: 1});
                    expect(myEditor.getCursorPos(false, "anchor")).toEqual({line: 0, ch: 1});
                    expect(myEditor.getCursorPos(false, "end")).toEqual({line: 0, ch: 5});
                    expect(myEditor.getCursorPos(false, "head")).toEqual({line: 0, ch: 5});
                });

                it("should return the default primary cursor in a multiple cursor selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    expect(myEditor.getCursorPos()).toEqual({line: 2, ch: 1});
                    expect(myEditor.getCursorPos(false, "start")).toEqual({line: 2, ch: 1});
                    expect(myEditor.getCursorPos(false, "anchor")).toEqual({line: 2, ch: 1});
                    expect(myEditor.getCursorPos(false, "end")).toEqual({line: 2, ch: 1});
                    expect(myEditor.getCursorPos(false, "head")).toEqual({line: 2, ch: 1});
                });

                it("should return the specific primary cursor in a multiple cursor selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 1);
                    expect(myEditor.getCursorPos()).toEqual({line: 1, ch: 1});
                    expect(myEditor.getCursorPos(false, "start")).toEqual({line: 1, ch: 1});
                    expect(myEditor.getCursorPos(false, "anchor")).toEqual({line: 1, ch: 1});
                    expect(myEditor.getCursorPos(false, "end")).toEqual({line: 1, ch: 1});
                    expect(myEditor.getCursorPos(false, "head")).toEqual({line: 1, ch: 1});
                });

                it("should return the correct ends of the default primary selection in a multiple selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 2);
                    expect(myEditor.getCursorPos()).toEqual({line: 2, ch: 4});
                    expect(myEditor.getCursorPos(false, "start")).toEqual({line: 2, ch: 1});
                    expect(myEditor.getCursorPos(false, "anchor")).toEqual({line: 2, ch: 1});
                    expect(myEditor.getCursorPos(false, "end")).toEqual({line: 2, ch: 4});
                    expect(myEditor.getCursorPos(false, "head")).toEqual({line: 2, ch: 4});
                });

                it("should return the correct ends of a specific primary selection in a multiple selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 1);
                    expect(myEditor.getCursorPos()).toEqual({line: 1, ch: 4});
                    expect(myEditor.getCursorPos(false, "start")).toEqual({line: 1, ch: 1});
                    expect(myEditor.getCursorPos(false, "anchor")).toEqual({line: 1, ch: 1});
                    expect(myEditor.getCursorPos(false, "end")).toEqual({line: 1, ch: 4});
                    expect(myEditor.getCursorPos(false, "head")).toEqual({line: 1, ch: 4});
                });
            });

            describe("setCursorPos", function () {
                it("should replace an existing single cursor", function () {
                    myEditor._codeMirror.setCursor(0, 2);
                    myEditor.setCursorPos(1, 3);
                    expect(myEditor.getCursorPos()).toEqual({line: 1, ch: 3});
                });

                it("should replace an existing single selection", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 1}, {line: 0, ch: 5});
                    myEditor.setCursorPos(1, 3);
                    expect(myEditor.getCursorPos()).toEqual({line: 1, ch: 3});
                });

                it("should replace existing multiple cursors", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    myEditor.setCursorPos(1, 3);
                    expect(myEditor.getCursorPos()).toEqual({line: 1, ch: 3});
                });

                it("should replace existing multiple selections", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 2);
                    myEditor.setCursorPos(1, 3);
                    expect(myEditor.getCursorPos()).toEqual({line: 1, ch: 3});
                });
            });

            describe("getSelection", function () {
                it("should return a single cursor", function () {
                    myEditor._codeMirror.setCursor(0, 2);
                    expect(myEditor.getSelection()).toEqual({start: {line: 0, ch: 2}, end: {line: 0, ch: 2}, reversed: false});
                });

                it("should return a single selection", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 1}, {line: 0, ch: 5});
                    expect(myEditor.getSelection()).toEqual({start: {line: 0, ch: 1}, end: {line: 0, ch: 5}, reversed: false});
                });

                it("should return a multiline selection", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 5}, {line: 1, ch: 3});
                    expect(myEditor.getSelection()).toEqual({start: {line: 0, ch: 5}, end: {line: 1, ch: 3}, reversed: false});
                });

                it("should return a single selection in the proper order when reversed", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 5}, {line: 0, ch: 1});
                    expect(myEditor.getSelection()).toEqual({start: {line: 0, ch: 1}, end: {line: 0, ch: 5}, reversed: true});
                });

                it("should return a multiline selection in the proper order when reversed", function () {
                    myEditor._codeMirror.setSelection({line: 1, ch: 3}, {line: 0, ch: 5});
                    expect(myEditor.getSelection()).toEqual({start: {line: 0, ch: 5}, end: {line: 1, ch: 3}, reversed: true});
                });

                it("should return the default primary cursor in a multiple cursor selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 1}, end: {line: 2, ch: 1}, reversed: false});
                });

                it("should return the specific primary cursor in a multiple cursor selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 1);
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, reversed: false});
                });

                it("should return the default primary selection in a multiple selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 2);
                    expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 1}, end: {line: 2, ch: 4}, reversed: false});
                });

                it("should return the default primary selection in the proper order when reversed", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 4}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 1}, end: {line: 2, ch: 4}, reversed: true});
                });

                it("should return the specific primary selection in a multiple selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 1);
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 1}, end: {line: 1, ch: 4}, reversed: false});
                });

                it("should return the specific primary selection in the proper order when reversed", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 4}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 1);
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 1}, end: {line: 1, ch: 4}, reversed: true});
                });

            });

            describe("getSelections", function () {
                it("should return a single cursor", function () {
                    myEditor._codeMirror.setCursor(0, 2);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 2}, end: {line: 0, ch: 2}, reversed: false, primary: true}]);
                });

                it("should return a single selection", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 1}, {line: 0, ch: 5});
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 0, ch: 5}, reversed: false, primary: true}]);
                });

                it("should properly reverse a single selection whose head is before its anchor", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 5}, {line: 0, ch: 1});
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 0, ch: 5}, reversed: true, primary: true}]);
                });

                it("should return multiple cursors", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 0, ch: 1}, reversed: false, primary: false},
                                                        {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, reversed: false, primary: false},
                                                        {start: {line: 2, ch: 1}, end: {line: 2, ch: 1}, reversed: false, primary: true}
                                                       ]);
                });

                it("should return a multiple selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 2);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 0, ch: 4}, reversed: false, primary: false},
                                                        {start: {line: 1, ch: 1}, end: {line: 1, ch: 4}, reversed: false, primary: false},
                                                        {start: {line: 2, ch: 1}, end: {line: 2, ch: 4}, reversed: false, primary: true}
                                                       ]);
                });

                it("should properly reverse selections whose heads are before their anchors in a multiple selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 4}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 4}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 0, ch: 4}, reversed: true, primary: false},
                                                        {start: {line: 1, ch: 1}, end: {line: 1, ch: 4}, reversed: false, primary: false},
                                                        {start: {line: 2, ch: 1}, end: {line: 2, ch: 4}, reversed: true, primary: true}
                                                       ]);
                });

                it("should properly reverse multiline selections whose heads are before their anchors in a multiple selection", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 1, ch: 3}, head: {line: 0, ch: 5}},
                                                        {anchor: {line: 4, ch: 4}, head: {line: 3, ch: 1}}
                                                       ], 1);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 5}, end: {line: 1, ch: 3}, reversed: true, primary: false},
                                                        {start: {line: 3, ch: 1}, end: {line: 4, ch: 4}, reversed: true, primary: true}
                                                       ]);
                });
            });

            describe("getSelectedText", function () {
                it("should return empty string for a cursor", function () {
                    myEditor._codeMirror.setCursor(0, 2);
                    expect(myEditor.getSelectedText()).toEqual("");
                    expect(myEditor.getSelectedText(true)).toEqual("");
                });

                it("should return the contents of a single selection", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 8}, {line: 0, ch: 14});
                    expect(myEditor.getSelectedText()).toEqual("line 0");
                    expect(myEditor.getSelectedText(true)).toEqual("line 0");
                });

                it("should return the primary selection by default, but concatenate contents if allSelections is true", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 8}, head: {line: 0, ch: 14}},
                                                        {anchor: {line: 1, ch: 8}, head: {line: 1, ch: 14}},
                                                        {anchor: {line: 2, ch: 8}, head: {line: 2, ch: 14}}
                                                       ], 2);
                    expect(myEditor.getSelectedText()).toEqual("line 2");
                    expect(myEditor.getSelectedText(true)).toEqual("line 0\nline 1\nline 2");
                });

                it("should return a primary selection other than the last", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 8}, head: {line: 0, ch: 14}},
                                                        {anchor: {line: 1, ch: 8}, head: {line: 1, ch: 14}},
                                                        {anchor: {line: 2, ch: 8}, head: {line: 2, ch: 14}}
                                                       ], 1);
                    expect(myEditor.getSelectedText()).toEqual("line 1");
                    expect(myEditor.getSelectedText(true)).toEqual("line 0\nline 1\nline 2");
                });

                it("should return the contents of a multiple selection when some selections are reversed", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 14}, head: {line: 0, ch: 8}},
                                                        {anchor: {line: 1, ch: 8}, head: {line: 1, ch: 14}},
                                                        {anchor: {line: 2, ch: 14}, head: {line: 2, ch: 8}}
                                                       ], 2);
                    expect(myEditor.getSelectedText()).toEqual("line 2");
                    expect(myEditor.getSelectedText(true)).toEqual("line 0\nline 1\nline 2");
                });
            });

            describe("setSelection", function () {
                it("should replace an existing single cursor", function () {
                    myEditor._codeMirror.setCursor(0, 2);
                    myEditor.setSelection({line: 1, ch: 3}, {line: 2, ch: 5});
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 3}, end: {line: 2, ch: 5}, reversed: false});
                });

                it("should replace an existing single selection", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 1}, {line: 0, ch: 5});
                    myEditor.setSelection({line: 1, ch: 3}, {line: 2, ch: 5});
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 3}, end: {line: 2, ch: 5}, reversed: false});
                });

                it("should allow implicit end", function () {
                    myEditor.setSelection({line: 1, ch: 3});
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 3}, end: {line: 1, ch: 3}, reversed: false});
                });

                it("should replace existing multiple cursors", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    myEditor.setSelection({line: 1, ch: 3}, {line: 2, ch: 5});
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 3}, end: {line: 2, ch: 5}, reversed: false});
                });

                it("should replace existing multiple selections", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 2);
                    myEditor.setSelection({line: 1, ch: 3}, {line: 2, ch: 5});
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 3}, end: {line: 2, ch: 5}, reversed: false});
                });
            });

            describe("setSelections", function () {
                it("should replace an existing single cursor", function () {
                    myEditor._codeMirror.setCursor(0, 2);
                    myEditor.setSelections([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}}]);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}, reversed: false, primary: false},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false, primary: true}]);
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false});
                });

                it("should replace an existing single selection", function () {
                    myEditor._codeMirror.setSelection({line: 0, ch: 1}, {line: 0, ch: 5});
                    myEditor.setSelections([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}}]);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}, reversed: false, primary: false},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false, primary: true}]);
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false});
                });

                it("should replace existing multiple cursors", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 1}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 1}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 1}}
                                                       ], 2);
                    myEditor.setSelections([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}}]);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}, reversed: false, primary: false},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false, primary: true}]);
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false});
                });

                it("should replace existing multiple selections", function () {
                    myEditor._codeMirror.setSelections([{anchor: {line: 0, ch: 1}, head: {line: 0, ch: 4}},
                                                        {anchor: {line: 1, ch: 1}, head: {line: 1, ch: 4}},
                                                        {anchor: {line: 2, ch: 1}, head: {line: 2, ch: 4}}
                                                       ], 2);
                    myEditor.setSelections([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}}]);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}, reversed: false, primary: false},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false, primary: true}]);
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false});
                });

                it("should specify non-default primary selection", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}, primary: true},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}}]);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}, reversed: false, primary: true},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false, primary: false}]);
                    expect(myEditor.getSelection()).toEqual({start: {line: 0, ch: 1}, end: {line: 1, ch: 3}, reversed: false});
                });

                it("should sort and merge overlapping selections", function () {
                    myEditor.setSelections([{start: {line: 2, ch: 4}, end: {line: 3, ch: 0}},
                                            {start: {line: 2, ch: 3}, end: {line: 2, ch: 6}},
                                            {start: {line: 1, ch: 1}, end: {line: 1, ch: 4}}]);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 1}, end: {line: 1, ch: 4}, reversed: false, primary: true},
                                            {start: {line: 2, ch: 3}, end: {line: 3, ch: 0}, reversed: false, primary: false}]);
                    expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 1}, end: {line: 1, ch: 4}, reversed: false});
                });

                it("should properly set reversed selections", function () {
                    myEditor.setSelections([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}, reversed: true},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}}]);
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 1}, end: {line: 1, ch: 3}, reversed: true, primary: false},
                                            {start: {line: 1, ch: 8}, end: {line: 2, ch: 5}, reversed: false, primary: true}]);

                });
            });

            describe("convertToLineSelections", function () {
                it("should expand a cursor to a line selection, keeping original selection for tracking", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(1);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 1, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(1);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                });

                it("should expand a range within a line to a line selection, keeping original selection for tracking", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 0, ch: 8}}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(1);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 1, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(1);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                });

                it("should expand a range that spans multiple lines to a line selection", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 1, ch: 8}}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(1);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 2, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(1);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                });

                it("should preserve the reversed attribute on a tracked range", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 0, ch: 8}, reversed: true}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(1);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 1, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(1);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                });

                it("should keep a line selection the same if expandEndAtStartOfLine is not set", function () {
                    var origSelections = [{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(1);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 1, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(1);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                });

                it("should expand a line selection if expandEndAtStartOfLine is set", function () {
                    var origSelections = [{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}}],
                        result = myEditor.convertToLineSelections(origSelections, {expandEndAtStartOfLine: true});
                    expect(result.length).toBe(1);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 2, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(1);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                });

                it("should process a discontiguous mix of cursor, range, and line selections separately, preserving the primary tracked selection", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}},
                                          {start: {line: 2, ch: 4}, end: {line: 2, ch: 8}, primary: true},
                                          {start: {line: 4, ch: 4}, end: {line: 5, ch: 8}},
                                          {start: {line: 7, ch: 0}, end: {line: 8, ch: 0}}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(4);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 1, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(1);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                    expect(result[1].selectionForEdit.start).toEqual({line: 2, ch: 0});
                    expect(result[1].selectionForEdit.end).toEqual({line: 3, ch: 0});
                    expect(result[1].selectionsToTrack.length).toBe(1);
                    expect(result[1].selectionsToTrack[0]).toEqual(origSelections[1]);
                    expect(result[2].selectionForEdit.start).toEqual({line: 4, ch: 0});
                    expect(result[2].selectionForEdit.end).toEqual({line: 6, ch: 0});
                    expect(result[2].selectionsToTrack.length).toBe(1);
                    expect(result[2].selectionsToTrack[0]).toEqual(origSelections[2]);
                    expect(result[3].selectionForEdit.start).toEqual({line: 7, ch: 0});
                    expect(result[3].selectionForEdit.end).toEqual({line: 8, ch: 0}); // not expanded since expandEndAtStartOfLine is false
                    expect(result[3].selectionsToTrack.length).toBe(1);
                    expect(result[3].selectionsToTrack[0]).toEqual(origSelections[3]);
                });

                it("should merge selections on same line, preserving primary/reversed info on subsumed selections", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}},
                                          {start: {line: 0, ch: 8}, end: {line: 1, ch: 8}, primary: true, reversed: true},
                                          {start: {line: 4, ch: 0}, end: {line: 5, ch: 0}}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(2);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 2, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(2);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                    expect(result[0].selectionsToTrack[1]).toEqual(origSelections[1]);
                    expect(result[1].selectionForEdit.start).toEqual({line: 4, ch: 0});
                    expect(result[1].selectionForEdit.end).toEqual({line: 5, ch: 0});
                    expect(result[1].selectionsToTrack.length).toBe(1);
                    expect(result[1].selectionsToTrack[0]).toEqual(origSelections[2]);
                });

                it("should merge selections on adjacent lines by default", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}},
                                          {start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: true},
                                          {start: {line: 4, ch: 0}, end: {line: 5, ch: 0}}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(2);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 2, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(2);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                    expect(result[0].selectionsToTrack[1]).toEqual(origSelections[1]);
                    expect(result[1].selectionForEdit.start).toEqual({line: 4, ch: 0});
                    expect(result[1].selectionForEdit.end).toEqual({line: 5, ch: 0});
                    expect(result[1].selectionsToTrack.length).toBe(1);
                    expect(result[1].selectionsToTrack[0]).toEqual(origSelections[2]);
                });

                it("should merge adjacent multiline selections where the first selection ends on the same line where the second selection starts", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 1, ch: 4}, primary: true},
                                          {start: {line: 1, ch: 8}, end: {line: 2, ch: 8}}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(1);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 3, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(2);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                    expect(result[0].selectionsToTrack[1]).toEqual(origSelections[1]);
                });

                it("should not merge selections on adjacent lines if mergeAdjacent is false", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}},
                                          {start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: true},
                                          {start: {line: 4, ch: 0}, end: {line: 5, ch: 0}}],
                        result = myEditor.convertToLineSelections(origSelections, {mergeAdjacent: false});
                    expect(result.length).toBe(3);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 1, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(1);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                    expect(result[1].selectionForEdit.start).toEqual({line: 1, ch: 0});
                    expect(result[1].selectionForEdit.end).toEqual({line: 2, ch: 0});
                    expect(result[1].selectionsToTrack.length).toBe(1);
                    expect(result[1].selectionsToTrack[0]).toEqual(origSelections[1]);
                    expect(result[2].selectionForEdit.start).toEqual({line: 4, ch: 0});
                    expect(result[2].selectionForEdit.end).toEqual({line: 5, ch: 0}); // not expanded since expandEndAtStartOfLine not set
                    expect(result[2].selectionsToTrack.length).toBe(1);
                    expect(result[2].selectionsToTrack[0]).toEqual(origSelections[2]);
                });

                it("should merge line selections separated by a one-line gap by default if expandEndAtStartOfLine is true", function () {
                    var origSelections = [{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}, primary: true},
                                          {start: {line: 2, ch: 0}, end: {line: 3, ch: 0}}],
                        result = myEditor.convertToLineSelections(origSelections, {expandEndAtStartOfLine: true});
                    expect(result.length).toBe(1);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 4, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(2);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                    expect(result[0].selectionsToTrack[1]).toEqual(origSelections[1]);
                });

                it("should not merge line selections separated by a one-line gap if expandEndAtStartOfLine is true but mergeAdjacent is false", function () {
                    // Note that in this case, if you were to actually set this as a multiple selection, CodeMirror would
                    // merge the adjacent selections at that point. But while processing an edit you might not want that.
                    var origSelections = [{start: {line: 0, ch: 0}, end: {line: 1, ch: 0}, primary: true},
                                          {start: {line: 2, ch: 0}, end: {line: 3, ch: 0}}],
                        result = myEditor.convertToLineSelections(origSelections, {expandEndAtStartOfLine: true, mergeAdjacent: false});
                    expect(result.length).toBe(2);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 2, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(1);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                    expect(result[1].selectionForEdit.start).toEqual({line: 2, ch: 0});
                    expect(result[1].selectionForEdit.end).toEqual({line: 4, ch: 0});
                    expect(result[1].selectionsToTrack.length).toBe(1);
                    expect(result[1].selectionsToTrack[0]).toEqual(origSelections[1]);
                });

                it("should merge multiple adjacent/overlapping selections together", function () {
                    var origSelections = [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}},
                                          {start: {line: 1, ch: 4}, end: {line: 2, ch: 4}, primary: true, reversed: true},
                                          {start: {line: 2, ch: 8}, end: {line: 5, ch: 0}}],
                        result = myEditor.convertToLineSelections(origSelections);
                    expect(result.length).toBe(1);
                    expect(result[0].selectionForEdit.start).toEqual({line: 0, ch: 0});
                    expect(result[0].selectionForEdit.end).toEqual({line: 5, ch: 0});
                    expect(result[0].selectionsToTrack.length).toBe(3);
                    expect(result[0].selectionsToTrack[0]).toEqual(origSelections[0]);
                    expect(result[0].selectionsToTrack[1]).toEqual(origSelections[1]);
                    expect(result[0].selectionsToTrack[2]).toEqual(origSelections[2]);
                });
            });
        });

        describe("Soft tabs", function () {
            beforeEach(function () {
                // Configure the editor's CM instance for 4-space soft tabs, regardless of prefs.
                createTestEditor("", "unknown");
                var instance = myEditor._codeMirror;
                instance.setOption("indentWithTabs", false);
                instance.setOption("indentUnit", 4);
            });

            function checkSoftTab(sel, dir, command, expectedSel, expectedText) {
                expectedText = expectedText || myEditor.document.getText();

                if (Array.isArray(sel)) {
                    myEditor.setSelections(sel);
                } else {
                    myEditor.setCursorPos(sel);
                }

                myEditor._handleSoftTabNavigation(dir, command);

                if (Array.isArray(expectedSel)) {
                    expect(myEditor.getSelections()).toEqual(expectedSel);
                } else {
                    expect(myEditor.getCursorPos()).toEqual(expectedSel);
                }
                expect(myEditor.document.getText()).toEqual(expectedText);
            }

            it("should move left by a soft tab if cursor is immediately after 1 indent level worth of spaces at beginning of line", function () {
                myEditor.document.setText("    content");
                checkSoftTab({line: 0, ch: 4}, -1, "moveH", {line: 0, ch: 0});
            });
            it("should backspace by a soft tab if cursor is immediately after 1 indent level worth of spaces at beginning of line", function () {
                myEditor.document.setText("    content");
                checkSoftTab({line: 0, ch: 4}, -1, "deleteH", {line: 0, ch: 0}, "content");
            });
            it("should move right by a soft tab if cursor is immediately before 1 indent level worth of spaces at beginning of line", function () {
                myEditor.document.setText("    content");
                checkSoftTab({line: 0, ch: 0}, 1, "moveH", {line: 0, ch: 4});
            });
            it("should delete right by a soft tab if cursor is immediately before 1 indent level worth of spaces at beginning of line", function () {
                myEditor.document.setText("    content");
                checkSoftTab({line: 0, ch: 0}, 1, "deleteH", {line: 0, ch: 0}, "content");
            });

            it("should move left by a soft tab if cursor is immediately after 2 indent levels worth of spaces at beginning of line", function () {
                myEditor.document.setText("        content");
                checkSoftTab({line: 0, ch: 8}, -1, "moveH", {line: 0, ch: 4});
            });
            it("should backspace by a soft tab if cursor is immediately after 2 indent levels worth of spaces at beginning of line", function () {
                myEditor.document.setText("        content");
                checkSoftTab({line: 0, ch: 8}, -1, "deleteH", {line: 0, ch: 4}, "    content");
            });
            it("should move right by a soft tab if cursor is immediately before 2 indent levels worth of spaces at beginning of line", function () {
                myEditor.document.setText("        content");
                checkSoftTab({line: 0, ch: 0}, 1, "moveH", {line: 0, ch: 4});
            });
            it("should delete right by a soft tab if cursor is immediately before 2 indent levels worth of spaces at beginning of line", function () {
                myEditor.document.setText("        content");
                checkSoftTab({line: 0, ch: 0}, 1, "deleteH", {line: 0, ch: 0}, "    content");
            });
            it("should move left by a soft tab if cursor is exactly between 2 indent levels worth of spaces", function () {
                myEditor.document.setText("        content");
                checkSoftTab({line: 0, ch: 4}, -1, "moveH", {line: 0, ch: 0});
            });
            it("should backspace by a soft tab if cursor is exactly between 2 indent levels worth of spaces", function () {
                myEditor.document.setText("        content");
                checkSoftTab({line: 0, ch: 4}, -1, "deleteH", {line: 0, ch: 0}, "    content");
            });
            it("should move right by a soft tab if cursor is exactly between 2 indent levels worth of spaces", function () {
                myEditor.document.setText("        content");
                checkSoftTab({line: 0, ch: 4}, 1, "moveH", {line: 0, ch: 8});
            });
            it("should delete right by a soft tab if cursor is exactly between 2 indent levels worth of spaces", function () {
                myEditor.document.setText("        content");
                checkSoftTab({line: 0, ch: 4}, 1, "deleteH", {line: 0, ch: 4}, "    content");
            });

            it("should move left to tab stop if cursor is 1 char after it", function () {
                myEditor.document.setText("        ");
                checkSoftTab({line: 0, ch: 5}, -1, "moveH", {line: 0, ch: 4});
            });
            it("should backspace to tab stop if cursor is 1 char after it", function () {
                myEditor.document.setText("        ");
                checkSoftTab({line: 0, ch: 5}, -1, "deleteH", {line: 0, ch: 4}, "       ");
            });
            it("should move right to tab stop if cursor is 1 char before it", function () {
                myEditor.document.setText("        ");
                checkSoftTab({line: 0, ch: 3}, 1, "moveH", {line: 0, ch: 4});
            });
            it("should delete right to tab stop if cursor is 1 char before it", function () {
                myEditor.document.setText("        ");
                checkSoftTab({line: 0, ch: 3}, 1, "deleteH", {line: 0, ch: 3}, "       ");
            });
            it("should move left to tab stop if cursor is 2 chars after it", function () {
                myEditor.document.setText("        ");
                checkSoftTab({line: 0, ch: 6}, -1, "moveH", {line: 0, ch: 4});
            });
            it("should backspace to tab stop if cursor is 2 chars after it", function () {
                myEditor.document.setText("        ");
                checkSoftTab({line: 0, ch: 6}, -1, "deleteH", {line: 0, ch: 4}, "      ");
            });
            it("should move right to tab stop if cursor is 2 chars before it", function () {
                myEditor.document.setText("        ");
                checkSoftTab({line: 0, ch: 2}, 1, "moveH", {line: 0, ch: 4});
            });
            it("should delete right to tab stop if cursor is 2 chars before it", function () {
                myEditor.document.setText("        ");
                checkSoftTab({line: 0, ch: 2}, 1, "deleteH", {line: 0, ch: 2}, "      ");
            });

            it("should not handle soft tab if moving left after non-whitespace content", function () {
                myEditor.document.setText("start   content");
                checkSoftTab({line: 0, ch: 8}, -1, "moveH", {line: 0, ch: 7});
            });
            it("should not handle soft tab if moving right after non-whitespace content", function () {
                myEditor.document.setText("start   content");
                checkSoftTab({line: 0, ch: 5}, 1, "moveH", {line: 0, ch: 6});
            });
            it("should not handle soft tab if moving left at beginning of line", function () {
                myEditor.document.setText("foo\n    content");
                checkSoftTab({line: 1, ch: 0}, -1, "moveH", {line: 0, ch: 3});
            });
            it("should not handle soft tab if moving right at end of line", function () {
                myEditor.document.setText("    content\nfoo");
                checkSoftTab({line: 0, ch: 11}, 1, "moveH", {line: 1, ch: 0});
            });
            it("should not handle soft tab if moving right at end of line would cause a jump past end of line", function () {
                myEditor.document.setText("   four  ");
                checkSoftTab({line: 0, ch: 8}, 1, "moveH", {line: 0, ch: 9});
            });

            describe("with soft tabs preference off", function () {
                beforeEach(function () {
                    // Disable soft tabs
                    PreferencesManager.set("softTabs", false);
                });
                afterEach(function () {
                    // Re-enable soft tabs
                    PreferencesManager.set("softTabs", true);
                });

                it("should move left by 1 space if cursor is immediately after 1 indent level worth of spaces at beginning of line", function () {
                    myEditor.document.setText("    content");
                    checkSoftTab({line: 0, ch: 4}, -1, "moveH", {line: 0, ch: 3});
                });
                it("should backspace by 1 space if cursor is immediately after 1 indent level worth of spaces at beginning of line", function () {
                    myEditor.document.setText("    content");
                    checkSoftTab({line: 0, ch: 4}, -1, "deleteH", {line: 0, ch: 3}, "   content");
                });
                it("should move right by 1 space if cursor is immediately before 1 indent level worth of spaces at beginning of line", function () {
                    myEditor.document.setText("    content");
                    checkSoftTab({line: 0, ch: 0}, 1, "moveH", {line: 0, ch: 1});
                });
                it("should delete right by 1 space if cursor is immediately before 1 indent level worth of spaces at beginning of line", function () {
                    myEditor.document.setText("    content");
                    checkSoftTab({line: 0, ch: 0}, 1, "deleteH", {line: 0, ch: 0}, "   content");
                });
            });

            describe("with multiple selections", function () {
                it("should move left over a soft tab from multiple aligned cursors", function () {
                    myEditor.document.setText("    one\n    two\n    three\n");
                    checkSoftTab([{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}},
                                  {start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                  {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}}],
                                 -1, "moveH",
                                 [{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 0}, end: {line: 2, ch: 0}, primary: true, reversed: false}]);
                });

                it("should move right over a soft tab from multiple aligned cursors", function () {
                    myEditor.document.setText("    one\n    two\n    three\n");
                    checkSoftTab([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}},
                                  {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}},
                                  {start: {line: 2, ch: 0}, end: {line: 2, ch: 0}}],
                                 1, "moveH",
                                 [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, primary: true, reversed: false}]);
                });

                it("should backspace over a soft tab from multiple aligned cursors", function () {
                    myEditor.document.setText("    one\n    two\n    three\n");
                    checkSoftTab([{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}},
                                  {start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                  {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}}],
                                 -1, "deleteH",
                                 [{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 0}, end: {line: 2, ch: 0}, primary: true, reversed: false}],
                                "one\ntwo\nthree\n");
                });

                it("should delete right over a soft tab from multiple aligned cursors", function () {
                    myEditor.document.setText("    one\n    two\n    three\n");
                    checkSoftTab([{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}},
                                  {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}},
                                  {start: {line: 2, ch: 0}, end: {line: 2, ch: 0}}],
                                 1, "deleteH",
                                 [{start: {line: 0, ch: 0}, end: {line: 0, ch: 0}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 0}, end: {line: 2, ch: 0}, primary: true, reversed: false}],
                                "one\ntwo\nthree\n");
                });

                it("should move left to next soft tab from multiple cursors at same distance from tab stops", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}},
                                  {start: {line: 1, ch: 2}, end: {line: 1, ch: 2}},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}}],
                                 -1, "moveH",
                                 [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: true, reversed: false}]);
                });

                it("should move right to next soft tab from multiple cursors at same distance from tab stops", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                  {start: {line: 2, ch: 9}, end: {line: 2, ch: 9}}],
                                 1, "moveH",
                                 [{start: {line: 0, ch: 8}, end: {line: 0, ch: 8}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 12}, end: {line: 2, ch: 12}, primary: true, reversed: false}]);
                });

                it("should backspace to next soft tab from multiple cursors at same distance from tab stops", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}},
                                  {start: {line: 1, ch: 2}, end: {line: 1, ch: 2}},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}}],
                                 -1, "deleteH",
                                 [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: true, reversed: false}],
                                 "      one\n      two\n          three\n");
                });

                it("should delete right to next soft tab from multiple cursors at same distance from tab stops", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                  {start: {line: 2, ch: 9}, end: {line: 2, ch: 9}}],
                                 1, "deleteH",
                                 [{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 9}, end: {line: 2, ch: 9}, primary: true, reversed: false}],
                                 "     one\n     two\n         three\n"
                                );
                });

                it("should do default move left from multiple cursors at different distances from tab stops", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}}],
                                 -1, "moveH",
                                 [{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 9}, end: {line: 2, ch: 9}, primary: true, reversed: false}]);
                });

                it("should do default move right from multiple cursors at different distances from tab stops", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}}],
                                 1, "moveH",
                                 [{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 11}, end: {line: 2, ch: 11}, primary: true, reversed: false}]);
                });

                it("should do default backspace from multiple cursors at different distances from tab stops", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                  {start: {line: 1, ch: 2}, end: {line: 1, ch: 2}},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}}],
                                 -1, "deleteH",
                                 [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 9}, end: {line: 2, ch: 9}, primary: true, reversed: false}],
                                 "       one\n       two\n           three\n");
                });

                it("should do default delete right from multiple cursors at different distances from tab stops", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                  {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}}],
                                 1, "deleteH",
                                 [{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: true, reversed: false}],
                                 "       one\n       two\n           three\n"
                                );
                });

                it("should do default move left from multiple cursors if one is inside content", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}},
                                  {start: {line: 1, ch: 9}, end: {line: 1, ch: 9}},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}}],
                                 -1, "moveH",
                                 [{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 8}, end: {line: 1, ch: 8}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 9}, end: {line: 2, ch: 9}, primary: true, reversed: false}]);
                });

                it("should do default move right from multiple cursors if one is inside content", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                  {start: {line: 2, ch: 14}, end: {line: 2, ch: 14}}],
                                 1, "moveH",
                                 [{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 15}, end: {line: 2, ch: 15}, primary: true, reversed: false}]);
                });

                it("should do default backspace from multiple cursors if one is inside content", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 10}, end: {line: 0, ch: 10}},
                                  {start: {line: 1, ch: 2}, end: {line: 1, ch: 2}},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}}],
                                 -1, "deleteH",
                                 [{start: {line: 0, ch: 9}, end: {line: 0, ch: 9}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 9}, end: {line: 2, ch: 9}, primary: true, reversed: false}],
                                 "        oe\n       two\n           three\n");
                });

                it("should do default delete right from multiple cursors if one is inside content", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                  {start: {line: 2, ch: 15}, end: {line: 2, ch: 15}}],
                                 1, "deleteH",
                                 [{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 15}, end: {line: 2, ch: 15}, primary: true, reversed: false}],
                                 "       one\n       two\n            thre\n"
                                );
                });

                it("should collapse ranges and handle other consistent soft tabs when moving left", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}},
                                  {start: {line: 1, ch: 2}, end: {line: 1, ch: 6}},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}}],
                                 -1, "moveH",
                                 [{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: true, reversed: false}]);
                });

                it("should collapse ranges and handle other consistent soft tabs when moving right", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 5}, end: {line: 0, ch: 9}},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                  {start: {line: 2, ch: 9}, end: {line: 2, ch: 9}}],
                                 1, "moveH",
                                 [{start: {line: 0, ch: 9}, end: {line: 0, ch: 9}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 12}, end: {line: 2, ch: 12}, primary: true, reversed: false}]);
                });

                it("should delete ranges and do nothing with cursors when backspacing", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}},
                                  {start: {line: 1, ch: 8}, end: {line: 1, ch: 10}},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}}],
                                 -1, "deleteH",
                                 [{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 8}, end: {line: 1, ch: 8}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 10}, end: {line: 2, ch: 10}, primary: true, reversed: false}],
                                 "        one\n        o\n            three\n");
                });

                it("should delete ranges and do nothing with cursors when deleting right", function () {
                    myEditor.document.setText("        one\n        two\n            three\n");
                    checkSoftTab([{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                  {start: {line: 2, ch: 14}, end: {line: 2, ch: 16}}],
                                 1, "deleteH",
                                 [{start: {line: 0, ch: 5}, end: {line: 0, ch: 5}, primary: false, reversed: false},
                                  {start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, primary: false, reversed: false},
                                  {start: {line: 2, ch: 14}, end: {line: 2, ch: 14}, primary: true, reversed: false}],
                                 "        one\n        two\n            the\n"
                                );
                });

            });
        });

        describe("Smart Tab handling", function () {
            function makeEditor(content, useTabs) {
                createTestEditor(content, "javascript");
                var instance = myEditor._codeMirror;
                instance.setOption("indentWithTabs", useTabs);
                instance.setOption("indentUnit", 4);
            }

            it("should indent and move cursor to correct position if at beginning of an empty line - spaces", function () {
                var content = "function foo() {\n" +
                    "    if (bar) {\n" +
                    "\n" +
                    "    }\n" +
                    "}";
                makeEditor(content);
                myEditor.setCursorPos({line: 2, ch: 0});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "        ";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should indent and move cursor to correct position if at beginning of an empty line - tabs", function () {
                var content = "function foo() {\n" +
                    "\tif (bar) {\n" +
                    "\n" +
                    "\t}\n" +
                    "}";
                makeEditor(content, true);
                myEditor.setCursorPos({line: 2, ch: 0});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 2}, end: {line: 2, ch: 2}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "\t\t";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should move cursor to end of whitespace (without adding more) if at beginning of a line with correct amount of whitespace - spaces", function () {
                var content = "function foo() {\n" +
                    "    if (bar) {\n" +
                    "        \n" +
                    "    }\n" +
                    "}";
                makeEditor(content);
                myEditor.setCursorPos({line: 2, ch: 0});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, reversed: false});

                expect(myEditor.document.getText()).toEqual(content);
            });

            it("should move cursor to end of whitespace (without adding more) if at beginning of a line with correct amount of whitespace - tabs", function () {
                var content = "function foo() {\n" +
                    "\tif (bar) {\n" +
                    "\t\t\n" +
                    "\t}\n" +
                    "}";
                makeEditor(content, true);
                myEditor.setCursorPos({line: 2, ch: 0});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 2}, end: {line: 2, ch: 2}, reversed: false});
                expect(myEditor.document.getText()).toEqual(content);
            });

            it("should add another indent whitespace if already past correct indent level on an all whitespace line - spaces", function () {
                var content = "function foo() {\n" +
                    "    if (bar) {\n" +
                    "            \n" +
                    "    }\n" +
                    "}";
                makeEditor(content);
                myEditor.setCursorPos({line: 2, ch: 12});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 16}, end: {line: 2, ch: 16}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "    " + lines[2];
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));

            });

            it("should add another indent whitespace if already past correct indent level on an all whitespace line - tabs", function () {
                var content = "function foo() {\n" +
                    "\tif (bar) {\n" +
                    "\t\t\t\n" +
                    "\t}\n" +
                    "}";
                makeEditor(content, true);
                myEditor.setCursorPos({line: 2, ch: 3});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 4}, end: {line: 2, ch: 4}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "\t" + lines[2];
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));

            });

            it("should indent improperly indented line to proper level and move cursor to beginning of content if cursor is in whitespace before content - spaces", function () {
                var content = "function foo() {\n" +
                    "    if (bar) {\n" +
                    "    indentme();\n" +
                    "    }\n" +
                    "}";
                makeEditor(content);
                myEditor.setCursorPos({line: 2, ch: 2});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "        indentme();";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should indent improperly indented line to proper level and move cursor to beginning of content if cursor is in whitespace before content - tabs", function () {
                var content = "function foo() {\n" +
                    "\tif (bar) {\n" +
                    "\tindentme();\n" +
                    "\t}\n" +
                    "}";
                makeEditor(content, true);
                myEditor.setCursorPos({line: 2, ch: 0});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 2}, end: {line: 2, ch: 2}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "\t\tindentme();";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should add one indent level (not autoindent) if cursor is immediately before content - spaces", function () {
                var content = "function foo() {\n" +
                    "        if (bar) {\n" +
                    "    indentme();\n" +
                    "    }\n" +
                    "}";
                makeEditor(content);
                myEditor.setCursorPos({line: 1, ch: 8});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 12}, end: {line: 1, ch: 12}, reversed: false});

                var lines = content.split("\n");
                lines[1] = "            if (bar) {";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should add one indent level (not autoindent) if cursor is immediately before content - tabs", function () {
                var content = "function foo() {\n" +
                    "\t\tif (bar) {\n" +
                    "\tindentme();\n" +
                    "\t}\n" +
                    "}";
                makeEditor(content, true);
                myEditor.setCursorPos({line: 1, ch: 2});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 3}, end: {line: 1, ch: 3}, reversed: false});

                var lines = content.split("\n");
                lines[1] = "\t\t\tif (bar) {";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should move cursor and not indent further if cursor is in whitespace before properly indented line - spaces", function () {
                var content = "function foo() {\n" +
                    "    if (bar) {\n" +
                    "        indentme();\n" +
                    "    }\n" +
                    "}";
                makeEditor(content);
                myEditor.setCursorPos({line: 2, ch: 4});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, reversed: false});
                expect(myEditor.document.getText()).toEqual(content);
            });

            it("should move cursor and not indent further if cursor is in whitespace before properly indented line - tabs", function () {
                var content = "function foo() {\n" +
                    "\tif (bar) {\n" +
                    "\t\tindentme();\n" +
                    "\t}\n" +
                    "}";
                makeEditor(content, true);
                myEditor.setCursorPos({line: 2, ch: 1});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 2}, end: {line: 2, ch: 2}, reversed: false});
                expect(myEditor.document.getText()).toEqual(content);
            });

            it("should add an indent level if cursor is immediately before content on properly indented line - spaces", function () {
                var content = "function foo() {\n" +
                    "    if (bar) {\n" +
                    "        indentme();\n" +
                    "    }\n" +
                    "}";
                makeEditor(content);
                myEditor.setCursorPos({line: 2, ch: 8});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 12}, end: {line: 2, ch: 12}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "            indentme();";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should add an indent level if cursor is immediately before content on properly indented line - tabs", function () {
                var content = "function foo() {\n" +
                    "\tif (bar) {\n" +
                    "\t\tindentme();\n" +
                    "\t}\n" +
                    "}";
                makeEditor(content, true);
                myEditor.setCursorPos({line: 2, ch: 2});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 3}, end: {line: 2, ch: 3}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "\t\t\tindentme();";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should add an indent level to each line (regardless of existing indentation) if selection spans multiple lines - spaces", function () {
                var content = "function foo() {\n" +
                    "    if (bar) {\n" +
                    "    indentme();\n" +
                    "    }\n" +
                    "}",
                    i;
                makeEditor(content);
                myEditor.setSelection({line: 1, ch: 6}, {line: 3, ch: 3});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 10}, end: {line: 3, ch: 8}, reversed: false});

                var lines = content.split("\n");
                for (i = 1; i <= 3; i++) {
                    lines[i] = "    " + lines[i];
                }
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should add an indent level to each line (regardless of existing indentation) if selection spans multiple lines - tabs", function () {
                var content = "function foo() {\n" +
                    "\tif (bar) {\n" +
                    "\tindentme();\n" +
                    "\t}\n" +
                    "}",
                    i;
                makeEditor(content, true);
                myEditor.setSelection({line: 1, ch: 0}, {line: 3, ch: 1});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 1, ch: 0}, end: {line: 3, ch: 2}, reversed: false});

                var lines = content.split("\n");
                for (i = 1; i <= 3; i++) {
                    lines[i] = "\t" + lines[i];
                }
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should add spaces to indent to the next soft tab stop if cursor is in the middle of a line after non-whitespace content - spaces", function () {
                var content = "function foo() {\n" +
                    "    if (bar) {\n" +
                    "    indentme();\n" +
                    "    }\n" +
                    "}";
                makeEditor(content);
                myEditor.setSelection({line: 2, ch: 9}, {line: 2, ch: 9}); // should add three spaces to get to column 12
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 12}, end: {line: 2, ch: 12}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "    inden   tme();";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should insert a tab if cursor is in the middle of a line after non-whitespace content - tab", function () {
                var content = "function foo() {\n" +
                    "\tif (bar) {\n" +
                    "\tindentme();\n" +
                    "\t}\n" +
                    "}";
                makeEditor(content, true);
                myEditor.setSelection({line: 2, ch: 5}, {line: 2, ch: 5});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 6}, end: {line: 2, ch: 6}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "\tinde\tntme();";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should add spaces to next soft tab before the beginning of the selection if it's a range in the middle of a line after non-whitespace content - spaces", function () {
                var content = "function foo() {\n" +
                    "    if (bar) {\n" +
                    "    indentme();\n" +
                    "    }\n" +
                    "}";
                makeEditor(content);
                myEditor.setSelection({line: 2, ch: 9}, {line: 2, ch: 14}); // should add three spaces to get to column 12
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 12}, end: {line: 2, ch: 17}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "    inden   tme();";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            it("should add a tab before the beginning of the selection if it's a range in the middle of a line after non-whitespace content - tabs", function () {
                var content = "function foo() {\n" +
                    "\tif (bar) {\n" +
                    "\tindentme();\n" +
                    "\t}\n" +
                    "}";
                makeEditor(content, true);
                myEditor.setSelection({line: 2, ch: 5}, {line: 2, ch: 8});
                myEditor._handleTabKey();
                expect(myEditor.getSelection()).toEqual({start: {line: 2, ch: 6}, end: {line: 2, ch: 9}, reversed: false});

                var lines = content.split("\n");
                lines[2] = "\tinde\tntme();";
                expect(myEditor.document.getText()).toEqual(lines.join("\n"));
            });

            describe("with multiple selections", function () {
                // In some of these tests we force a selection other than the last to be primary if the last selection is the
                // one that triggers the behavior - so our code can't just cheat and rely on the primary selection.

                // Note that a side-effect of the way CM adds indent levels is that ends of ranges that are within the
                // whitespace at the beginning of the line get pushed to the first non-whitespace character on the line,
                // so in tests below that fall back to "add one indent level before each line", the selections might change
                // more than you would expect by just adding a single indent level.

                it("should add one indent level before all selected lines if any of the selections is multiline - spaces", function () {
                    var content = "function foo() {\n" +
                        "    if (bar) {\n" +
                        "    indentme();\n" +
                        "    }\n" +
                        "}";
                    makeEditor(content);
                    myEditor.setSelections([{start: {line: 0, ch: 9}, end: {line: 0, ch: 9}, primary: true},
                                            {start: {line: 2, ch: 6}, end: {line: 3, ch: 3}}]);
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 13}, end: {line: 0, ch: 13}, primary: true, reversed: false},
                                                              {start: {line: 2, ch: 10}, end: {line: 3, ch: 8}, primary: false, reversed: false}]);

                    var lines = content.split("\n");
                    lines[0] = "    " + lines[0];
                    lines[2] = "    " + lines[2];
                    lines[3] = "    " + lines[3];
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should add one indent level before all selected lines if any of the selections is multiline - tabs", function () {
                    var content = "function foo() {\n" +
                        "\tif (bar) {\n" +
                        "\tindentme();\n" +
                        "\t}\n" +
                        "}";
                    makeEditor(content, true);
                    myEditor.setSelections([{start: {line: 0, ch: 6}, end: {line: 0, ch: 6}, primary: true},
                                            {start: {line: 2, ch: 3}, end: {line: 3, ch: 1}}]);
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 7}, end: {line: 0, ch: 7}, primary: true, reversed: false},
                                                              {start: {line: 2, ch: 4}, end: {line: 3, ch: 2}, primary: false, reversed: false}]);

                    var lines = content.split("\n");
                    lines[0] = "\t" + lines[0];
                    lines[2] = "\t" + lines[2];
                    lines[3] = "\t" + lines[3];
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should add spaces before each cursor to get to next tab stop if any selection is after first non-whitespace character in its line - spaces", function () {
                    var content = "function foo() {\n" +
                        "    if (bar) {\n" +
                        "    indentme();\n" +
                        "    }\n" +
                        "}";
                    makeEditor(content);
                    myEditor.setSelections([{start: {line: 0, ch: 3}, end: {line: 0, ch: 3}},
                                            {start: {line: 2, ch: 6}, end: {line: 2, ch: 6}},
                                            {start: {line: 3, ch: 2}, end: {line: 3, ch: 2}}]);
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                                              {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: false, reversed: false},
                                                              {start: {line: 3, ch: 4}, end: {line: 3, ch: 4}, primary: true, reversed: false}]);

                    var lines = content.split("\n");
                    lines[0] = "fun ction foo() {";
                    lines[2] = "    in  dentme();";
                    lines[3] = "      }";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should add a tab before each cursor if any selection is after first non-whitespace character in its line - tabs", function () {
                    var content = "function foo() {\n" +
                        "\tif (bar) {\n" +
                        "\tindentme();\n" +
                        "\t}\n" +
                        "}";
                    makeEditor(content, true);
                    myEditor.setSelections([{start: {line: 0, ch: 3}, end: {line: 0, ch: 3}},
                                            {start: {line: 2, ch: 6}, end: {line: 2, ch: 6}},
                                            {start: {line: 3, ch: 1}, end: {line: 3, ch: 1}}]);
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 4}, end: {line: 0, ch: 4}, primary: false, reversed: false},
                                                              {start: {line: 2, ch: 7}, end: {line: 2, ch: 7}, primary: false, reversed: false},
                                                              {start: {line: 3, ch: 2}, end: {line: 3, ch: 2}, primary: true, reversed: false}]);

                    var lines = content.split("\n");
                    lines[0] = "fun\tction foo() {";
                    lines[2] = "\tinden\ttme();";
                    lines[3] = "\t\t}";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should add spaces before beginning of each range to get to next tab stop if any selection is after first non-whitespace character in its line - spaces", function () {
                    var content = "function foo() {\n" +
                        "    if (bar) {\n" +
                        "    indentme();\n" +
                        "    }\n" +
                        "}";
                    makeEditor(content);
                    myEditor.setSelections([{start: {line: 0, ch: 3}, end: {line: 0, ch: 6}},
                                            {start: {line: 2, ch: 6}, end: {line: 2, ch: 9}},
                                            {start: {line: 3, ch: 2}, end: {line: 3, ch: 4}}]);
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 4}, end: {line: 0, ch: 7}, primary: false, reversed: false},
                                                              {start: {line: 2, ch: 8}, end: {line: 2, ch: 11}, primary: false, reversed: false},
                                                              {start: {line: 3, ch: 4}, end: {line: 3, ch: 6}, primary: true, reversed: false}]);

                    var lines = content.split("\n");
                    lines[0] = "fun ction foo() {";
                    lines[2] = "    in  dentme();";
                    lines[3] = "      }";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should add a tab before beginning of each range if any selection is after first non-whitespace character in its line - tabs", function () {
                    var content = "function foo() {\n" +
                        "\tif (bar) {\n" +
                        "\tindentme();\n" +
                        "\t}\n" +
                        "}";
                    makeEditor(content, true);
                    myEditor.setSelections([{start: {line: 0, ch: 3}, end: {line: 0, ch: 6}},
                                            {start: {line: 2, ch: 6}, end: {line: 2, ch: 9}},
                                            {start: {line: 3, ch: 1}, end: {line: 3, ch: 2}}]);
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 0, ch: 4}, end: {line: 0, ch: 7}, primary: false, reversed: false},
                                                              {start: {line: 2, ch: 7}, end: {line: 2, ch: 10}, primary: false, reversed: false},
                                                              {start: {line: 3, ch: 2}, end: {line: 3, ch: 3}, primary: true, reversed: false}]);

                    var lines = content.split("\n");
                    lines[0] = "fun\tction foo() {";
                    lines[2] = "\tinden\ttme();";
                    lines[3] = "\t\t}";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should add spaces before each cursor to get to next tab stop (not autoindent) if any selection is exactly before the first non-whitespace character on the line - spaces", function () {
                    var content = "function foo() {\n" +
                        "    if (bar) {\n" +
                        "    indentme();\n" +
                        "    }\n" +
                        "}";
                    makeEditor(content);
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: true}, // should not move
                                            {start: {line: 2, ch: 4}, end: {line: 2, ch: 4}}]); // should get indented and move
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 8}, end: {line: 1, ch: 8}, primary: true, reversed: false},
                                                              {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: false, reversed: false}]);

                    var lines = content.split("\n");
                    lines[1] = "        if (bar) {";
                    lines[2] = "        indentme();";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should add a tab at each cursor (not autoindent) if any selection is exactly before the first non-whitespace character on the line - tabs", function () {
                    var content = "function foo() {\n" +
                        "\tif (bar) {\n" +
                        "\tindentme();\n" +
                        "\t}\n" +
                        "}";
                    makeEditor(content, true);
                    myEditor.setSelections([{start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, primary: true}, // should not move
                                            {start: {line: 2, ch: 1}, end: {line: 2, ch: 1}}]); // should get indented and move
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: true, reversed: false},
                                                              {start: {line: 2, ch: 2}, end: {line: 2, ch: 2}, primary: false, reversed: false}]);

                    var lines = content.split("\n");
                    lines[1] = "\t\tif (bar) {";
                    lines[2] = "\t\tindentme();";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should try to autoindent each line if all cursors are in start-of-line whitespace, and if at least one cursor changed position or indent was added, do nothing further - spaces", function () {
                    var content = "function foo() {\n" +
                        "    if (bar) {\n" +
                        "    indentme();\n" +
                        "    }\n" +
                        "}";
                    makeEditor(content);
                    myEditor.setSelections([{start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: true}, // should not move
                                            {start: {line: 2, ch: 2}, end: {line: 2, ch: 2}}]); // should get indented and move
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}, primary: true, reversed: false},
                                                              {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}, primary: false, reversed: false}]);

                    var lines = content.split("\n");
                    lines[2] = "        indentme();";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should try to autoindent each line if all cursors are in start-of-line whitespace, and if at least one cursor changed position or indent was added, do nothing further - tabs", function () {
                    var content = "function foo() {\n" +
                        "\tif (bar) {\n" +
                        "\tindentme();\n" +
                        "\t}\n" +
                        "}";
                    makeEditor(content, true);
                    myEditor.setSelections([{start: {line: 1, ch: 0}, end: {line: 1, ch: 0}, primary: true}, // should not move
                                            {start: {line: 2, ch: 0}, end: {line: 2, ch: 0}}]); // should get indented and move
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 1}, end: {line: 1, ch: 1}, primary: true, reversed: false},
                                                              {start: {line: 2, ch: 2}, end: {line: 2, ch: 2}, primary: false, reversed: false}]);

                    var lines = content.split("\n");
                    lines[2] = "\t\tindentme();";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should try to autoindent each line if all cursors are in start-of-line whitespace, but if no cursors changed position or added indent, add an indent to the beginning of each line - spaces", function () {
                    var content = "function foo() {\n" +
                        "    if (bar) {\n" +
                        "        indentme();\n" + // indent already correct
                        "    }\n" +
                        "}";
                    makeEditor(content);
                    myEditor.setSelections([{start: {line: 1, ch: 4}, end: {line: 1, ch: 4}},
                                            {start: {line: 2, ch: 8}, end: {line: 2, ch: 8}}]);
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 8}, end: {line: 1, ch: 8}, primary: false, reversed: false},
                                                              {start: {line: 2, ch: 12}, end: {line: 2, ch: 12}, primary: true, reversed: false}]);

                    var lines = content.split("\n");
                    lines[1] = "        if (bar) {";
                    lines[2] = "            indentme();";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });

                it("should try to autoindent each line if all cursors are in start-of-line whitespace, but if no cursors changed position or added indent, add an indent to the beginning of each line - tabs", function () {
                    var content = "function foo() {\n" +
                        "\tif (bar) {\n" +
                        "\t\tindentme();\n" + // indent already correct
                        "\t}\n" +
                        "}";
                    makeEditor(content, true);
                    myEditor.setSelections([{start: {line: 1, ch: 1}, end: {line: 1, ch: 1}},
                                            {start: {line: 2, ch: 2}, end: {line: 2, ch: 2}}]);
                    myEditor._handleTabKey();
                    expect(myEditor.getSelections()).toEqual([{start: {line: 1, ch: 2}, end: {line: 1, ch: 2}, primary: false, reversed: false},
                                                              {start: {line: 2, ch: 3}, end: {line: 2, ch: 3}, primary: true, reversed: false}]);

                    var lines = content.split("\n");
                    lines[1] = "\t\tif (bar) {";
                    lines[2] = "\t\t\tindentme();";
                    expect(myEditor.document.getText()).toEqual(lines.join("\n"));
                });
            });
        });
    });
});
