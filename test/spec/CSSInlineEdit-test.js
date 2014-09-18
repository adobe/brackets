/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, expect, beforeEach, afterEach, waitsForDone, runs, beforeFirst, afterLast, spyOn */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        Strings         = require("strings");

    var testPath = SpecRunnerUtils.getTestPath("/spec/CSSInlineEdit-test-files");

    describe("CSS Inline Edit", function () {
        this.category = "integration";

        var testWindow,
            brackets,
            $,
            EditorManager,
            CommandManager,
            DocumentManager,
            Commands,
            FileSystem,
            Dialogs;

        beforeFirst(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    // Load module instances from brackets.test
                    $ = testWindow.$;
                    brackets = testWindow.brackets;
                    EditorManager = brackets.test.EditorManager;
                    CommandManager = brackets.test.CommandManager;
                    FileSystem = brackets.test.FileSystem;
                    Dialogs = brackets.test.Dialogs;
                    DocumentManager = brackets.test.DocumentManager;
                    Commands = brackets.test.Commands;
                });
            });

            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
        });

        afterLast(function () {
            EditorManager = null;
            CommandManager = null;
            DocumentManager = null;
            Commands = null;
            Dialogs = null;
            FileSystem = null;
            testWindow = null;
            SpecRunnerUtils.closeTestWindow();
        });

        function dropdownButton() {
            return $(".btn.btn-dropdown.btn-mini.stylesheet-button");
        }

        function dropdownMenu() {
            return $(".dropdown-menu.dropdownbutton-popup");
        }

        function getInlineEditorWidgets() {
            return EditorManager.getCurrentFullEditor().getInlineWidgets();
        }

        function inlineEditorMessage(index) {
            if (index === undefined) {
                index = 0;
            }

            return getInlineEditorWidgets()[index].$messageDiv;
        }

        function inlineEditorFileName(inlineWidget) {
            return inlineWidget.$header.find("a.filename");
        }

        function getRelatedFiles(inlineWidget) {
            return inlineWidget.$relatedContainer.find(".related ul>li");
        }

        function loadFile(file) {
            runs(function () {
                var promise = SpecRunnerUtils.openProjectFiles([file]);
                waitsForDone(promise);
            });
        }

        function closeFilesInTestWindow() {
            runs(function () {
                var promise = CommandManager.execute(Commands.FILE_CLOSE_ALL);
                waitsForDone(promise, "Close all open files in working set");
            });
        }

        function checkAvailableStylesheets(availableFilesInDropdown) {
            expect(availableFilesInDropdown.length).toBe(5);
            expect(availableFilesInDropdown[0].textContent).toEqual("test.css");
            expect(availableFilesInDropdown[1].textContent).toEqual("test.less");
            expect(availableFilesInDropdown[2].textContent).toEqual("test.scss");
            expect(availableFilesInDropdown[3].textContent).toEqual("test2.css");
            expect(availableFilesInDropdown[4].textContent).toEqual("test2.less");
        }

        function getInlineEditorContent(ranges) {
            var document = ranges.textRange.document;

            return document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length});
        }

        describe("CSS", function () {
            beforeEach(function () {
                loadFile("index-css.html");
            });

            afterEach(function () {
                closeFilesInTestWindow();
            });

            it("should open two inline editors and show the matching rules", function () {
                var inlineWidgets;

                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 15, ch: 22});
                    waitsForDone(promise, "Open inline editor 1");

                    var promise2 = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 20, ch: 25});
                    waitsForDone(promise2, "Open inline editor 2");
                });

                runs(function () {
                    inlineWidgets = getInlineEditorWidgets();

                    // Check Inline Editor 1
                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.css : 1");

                    var ranges = inlineWidgets[0]._ranges[0];
                    var document = ranges.textRange.document;

                    expect(document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length})).toEqual(".standard {\n    background-color: red;\n}");

                    var files = getRelatedFiles(inlineWidgets[0]);
                    expect(files.length).toBe(2);
                    expect(files[0].textContent).toEqual(".standard — test.css : 1");
                    expect(files[1].textContent).toEqual(".standard — test2.css : 1");

                    // Check Inline Editor 2
                    expect(inlineEditorFileName(inlineWidgets[1])[0].text).toEqual("test.css : 8");

                    ranges = inlineWidgets[1]._ranges[0];
                    document = ranges.textRange.document;

                    expect(document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length})).toEqual(".banner-new {\n    background-color: blue;\n}");

                    files = getRelatedFiles(inlineWidgets[1]);
                    expect(files.length).toBe(2);
                    expect(files[0].textContent).toEqual(".banner-new — test.css : 8");
                    expect(files[1].textContent).toEqual(".banner-new — test2.css : 8");
                });
            });

            it("should show no matching rule in inline editor", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 16, ch: 7});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    // open the dropdown
                    dropdownButton().click();

                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);

                    expect(inlineEditorMessage().html()).toEqual(Strings.CSS_QUICK_EDIT_NO_MATCHES);
                });
            });

            it("should show one matching rule in inline editor", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 17, ch: 15});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    // open the dropdown
                    dropdownButton().click();

                    var inlineWidgets = getInlineEditorWidgets();

                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);
                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.less : 5");

                    var ranges = inlineWidgets[0]._ranges[0];
                    var document = ranges.textRange.document;

                    expect(document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length})).toEqual(".banner {\n    background-color: red;\n}");
                });
            });

            it("should show one matching rule in two files", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 20, ch: 25});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidgets = getInlineEditorWidgets();

                    // open the dropdown
                    dropdownButton().click();

                    var availableFilesInDropdown = dropdownMenu().children();
                    expect(availableFilesInDropdown.length).toBe(5);
                    checkAvailableStylesheets(availableFilesInDropdown);
                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.css : 8");

                    var ranges = inlineWidgets[0]._ranges[0];
                    var document = ranges.textRange.document;

                    expect(document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length})).toEqual(".banner-new {\n    background-color: blue;\n}");

                    var files = getRelatedFiles(inlineWidgets[0]);
                    expect(files.length).toBe(2);
                    expect(files[0].textContent).toEqual(".banner-new — test.css : 8");
                    expect(files[1].textContent).toEqual(".banner-new — test2.css : 8");
                });
            });

            it("should add the css file to the working set when modified in inline editor", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 48, ch: 25});
                    waitsForDone(promise, "Open inline editor");

                    spyOn(Dialogs, 'showModalDialog').andCallFake(function (dlgClass, title, message, buttons) {
                        return {done: function (callback) { callback(Dialogs.DIALOG_BTN_DONTSAVE); } };
                    });
                });

                runs(function () {
                    var inlineWidgets = getInlineEditorWidgets();

                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.scss : 57");

                    var document = inlineWidgets[0].editor.document;
                    // modify scss to add it to the working set
                    var scssFile = FileSystem.getFileForPath(testPath + "/scss/test.scss");
                    document.setText(".comment-scss-4 {\n    background-color: black;\n}");

                    expect(DocumentManager.findInWorkingSet(scssFile.fullPath)).toBeGreaterThan(0);
                });
            });
        });

        describe("LESS", function () {
            beforeEach(function () {
                loadFile("index-less.html");
            });

            afterEach(function () {
                closeFilesInTestWindow();
            });

            it("should show no matching rule in inline editor", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 16, ch: 10});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    // open the dropdown
                    dropdownButton().click();

                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);

                    expect(inlineEditorMessage().html()).toEqual(Strings.CSS_QUICK_EDIT_NO_MATCHES);
                });
            });

            it("should show one matching rule in inline editor", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 17, ch: 15});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    // open the dropdown
                    dropdownButton().click();

                    var inlineWidgets = getInlineEditorWidgets();

                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);
                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.less : 5");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual(".banner {\n    background-color: red;\n}");
                });
            });

            it("should show one matching rule in two files", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 20, ch: 25});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    // open the dropdown
                    dropdownButton().click();

                    var inlineWidgets = getInlineEditorWidgets();

                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);
                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.less : 9");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("    &.banner-new2 {\n        background-color: blue;\n    }");

                    var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                    expect(files.length).toBe(2);
                    expect(files[0].textContent).toEqual("div / &.banner-new2 — test.less : 9");
                    expect(files[1].textContent).toEqual(".banner-new2 — test2.less : 1");
                });
            });

            describe("Check Rule appearance with matches in one LESS file", function () {
                it("should return the nested rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 25, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 11");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("        .level3 {\n            color: red;\n        }");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".level1 / .level2 / .level3 — test2.less : 11");
                    });
                });

                it("should show matching rule with comment above containing delimiter chars", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 37, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 44");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".confuse1 {\n    /* {this comment is special(;:,)} */\n    .special {\n        color: #ff8000;\n    }\n}");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".confuse1 — test2.less : 44");
                    });
                });

                it("should show matching rule without delimiting whitespace (compressed)", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 44, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 51");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".compressed{color:red}");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".compressed — test2.less : 51");
                    });
                });
            });

            describe("Comments", function () {
                it("should show matching sub rule with comment above containing delimiter chars", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 39, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 45");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    /* {this comment is special(;:,)} */\n    .special {\n        color: #ff8000;\n    }");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".confuse1 / .special — test2.less : 45");
                    });
                });

                it("should show the single line block style comment above the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 31, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 17");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("/* This is a single line block comment that should appear in the inline editor as first line */\n.comment1 {\n    text-align: center;\n}");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".comment1 — test2.less : 17");
                    });
                });

                it("should show the single line inline comment above the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 34, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 33");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("// This is a single line comment that should appear in the inline editor as first line\n.comment4 {\n    text-align: center;\n}");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".comment4 — test2.less : 33");
                    });
                });

                it("should show the multi line block comment above the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 32, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 22");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("/* This is a multiline block comment\n * that should appear in the inline editor\n */\n.comment2 {\n    text-decoration: overline;\n}");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".comment2 — test2.less : 22");
                    });
                });

                it("should show the end of line comment after the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 33, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 29");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".comment3 {\n    text-decoration: underline; /* EOL comment {}(,;:) */\n}");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".comment3 — test2.less : 29");
                    });
                });
            });

            describe("Selector groups", function () {
                it("should show matching selector group", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 49, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 55");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    .uno, .dos {\n        color: red\n    }");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".uno, .dos — test2.less : 55");
                    });
                });

                it("should show 1 matching rule of selector group", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 50, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 55");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    .uno, .dos {\n        color: red\n    }");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(2);
                        expect(files[0].textContent).toEqual(".uno, .dos — test2.less : 55");
                        expect(files[1].textContent).toEqual("#main / .dos — test2.less : 59");
                    });
                });

                it("should show matching selector group with selectors on separate lines", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 54, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 65");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    .tres,\n    .quattro {\n        color: blue;\n    }");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".tres, .quattro — test2.less : 65");
                    });
                });
            });

            describe("Mixins", function () {
                it("should show matching mixin rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 64, ch: 30});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 86");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".mixina-class {\n    .a();\n}");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".mixina-class — test2.less : 86");
                    });
                });

                it("should show matching rule which includes mixin with default parameter", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 71, ch: 20});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 120");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("#header-mixin-paramterized-default {\n    .border-radius;\n}");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual("#header-mixin-paramterized-default — test2.less : 120");
                    });
                });

                it("should show matching rule which includes a parameterized mixin", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 73, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 126");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    #header-mixin-paramterized-custom-1 {\n        .border-radius(20px);\n    }");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual("#header-mixin-paramterized-custom / #header-mixin-paramterized-custom-1 — test2.less : 126");
                    });
                });
            });

            describe("Interpolation", function () {
                // Verify https://github.com/adobe/brackets/issues/8865
                it("should show a rule with variable interpolation in one of its property names", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 67, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test2.less : 109");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".widget {\n    @{property}: #0ee;\n    background-@{property}: #999;\n}");

                        // It's not visible
                        var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".widget — test2.less : 109");
                    });
                });
            });

        });

        describe("SCSS", function () {
            beforeEach(function () {
                loadFile("index-css.html");
            });

            afterEach(function () {
                closeFilesInTestWindow();
            });

            // The following tests will succeed, but once the issue is fixed they will fail
            it("should show one matching rule in inline editor", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 25, ch: 10});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidgets = getInlineEditorWidgets();
                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.scss : 5");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("p {\n    $font-size: 12px;\n    $line-height: 30px;\n    font: #{$font-size}/#{$line-height};\n}");

                    // It's not visible
                    var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                    expect(files.length).toBe(1);
                    expect(files[0].textContent).toEqual("p — test.scss : 5");
                });
            });

            // https://github.com/adobe/brackets/issues/8875
            it("should show one matching rule in inline editor which is defined after rule that uses variable interpolation as property value", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 28, ch: 20});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidgets = getInlineEditorWidgets();
                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.scss : 11");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("#scss-1 {\n    background-color: blue;\n}");

                    // It's not visible
                    var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                    expect(files.length).toBe(1);
                    expect(files[0].textContent).toEqual("#scss-1 — test.scss : 11");
                });
            });

            // https://github.com/adobe/brackets/issues/8895
            it("should show one matching rule that is defined with parent selector", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 38, ch: 25});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidgets = getInlineEditorWidgets();
                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.scss : 20");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("    &-ok {\n        background-image: url(\"ok.png\");\n    }");

                    // It's not visible
                    var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                    expect(files.length).toBe(1);
                    expect(files[0].textContent).toEqual(".button / &-ok — test.scss : 20");
                });
            });

            // https://github.com/adobe/brackets/issues/8851
            it("should show matching rules that follow rules using variable interpolation in a selector", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 42, ch: 10});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidgets = getInlineEditorWidgets();
                    expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.scss : 37");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("a {\n    color: blue;\n}");

                    // It's not visible
                    var files = inlineWidgets[0].$relatedContainer.find(".related ul>li");
                    expect(files.length).toBe(1);
                    expect(files[0].textContent).toEqual("a — test.scss : 37");
                });
            });

            describe("Comments", function () {
                it("should show single line comment above matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 45, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])[0].text).toEqual("test.scss : 41");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("// This is a single line comment\n.comment-scss-1 {\n    background-color: red;\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".comment-scss-1 — test.scss : 41");
                    });
                });
            });
        });
    });
});
