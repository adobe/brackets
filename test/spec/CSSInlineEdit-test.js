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
/*global define, describe, xdescribe, it, xit, expect, beforeEach, afterEach, waitsFor, waitsForDone, runs, $, beforeFirst, afterLast, waits */

define(function (require, exports, module) {
    "use strict";

    var FileSystem                 = require("filesystem/FileSystem"),
        SpecRunnerUtils            = require("spec/SpecRunnerUtils");

    var testPath                   = SpecRunnerUtils.getTestPath("/spec/CSSInlineEdit-test-files");

    // TODO:
    // - make changes in inline editor -> css/scss/less files are added to Workingset and get dirty
    // - check hierachical rules in related content
    // - multiple inline edit widgets

    describe("CSS Inline Edit", function () {
        this.category = "integration";

        var testWindow,
            brackets,
            $,
            EditorManager,
            CommandManager,
            Commands;

        beforeFirst(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    // Load module instances from brackets.test
                    $ = testWindow.$;
                    brackets = testWindow.brackets;
                    EditorManager = brackets.test.EditorManager;
                    CommandManager = brackets.test.CommandManager;
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
            Commands = null;
            testWindow = null;
            SpecRunnerUtils.closeTestWindow();
        });

        function dropdownButton() {
            return $(".btn.btn-dropdown.btn-mini.stylesheet-button");
        }

        function dropdownMenu() {
            return $(".dropdown-menu.dropdownbutton-popup");
        }

        function getInlineEditorWidget() {
            return EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
        }

        function inlineEditorMessage() {
            return getInlineEditorWidget().$messageDiv;
        }

        function inlineEditorHolder() {
            return $("div .inline-editor-holder");
        }

        function inlineEditorFileName() {
            return $(".inline-editor-header a.filename");
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
            expect(availableFilesInDropdown.length).toBe(4);
            expect(availableFilesInDropdown[0].textContent).toEqual("test.css");
            expect(availableFilesInDropdown[1].textContent).toEqual("test.less");
            expect(availableFilesInDropdown[2].textContent).toEqual("test2.css");
            expect(availableFilesInDropdown[3].textContent).toEqual("test2.less");
        }

        describe("CSS", function () {
            beforeEach(function () {
                loadFile("index-css.html");
            });

            afterEach(function () {
                closeFilesInTestWindow();
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

                    expect(inlineEditorMessage().text()).toEqual("There are no existing CSS rules that match your selection. Click \"New Rule\" to create one.");
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

                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);
                    expect(inlineEditorFileName()[0].text).toEqual("test.less : 5");

                    var inlineWidget = getInlineEditorWidget();
                    var ranges = inlineWidget._ranges[0];
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
                    // open the dropdown
                    dropdownButton().click();

                    var availableFilesInDropdown = dropdownMenu().children();
                    expect(availableFilesInDropdown.length).toBe(4);
                    checkAvailableStylesheets(availableFilesInDropdown);
                    expect(inlineEditorFileName()[0].text).toEqual("test.css : 8");

                    var inlineWidget = getInlineEditorWidget();
                    var ranges = inlineWidget._ranges[0];
                    var document = ranges.textRange.document;

                    expect(document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length})).toEqual(".banner-new {\n    background-color: blue;\n}");

                    var files = inlineWidget.$relatedContainer.find(".related ul>li");
                    expect(files.length).toBe(2);
                    expect(files[0].textContent).toEqual(".banner-new — test.css : 8");
                    expect(files[1].textContent).toEqual(".banner-new — test2.css : 8");
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

                    expect(inlineEditorMessage().text()).toEqual("There are no existing CSS rules that match your selection. Click \"New Rule\" to create one.");
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

                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);
                    expect(inlineEditorFileName()[0].text).toEqual("test.less : 5");

                    var inlineWidget = getInlineEditorWidget();
                    var ranges = inlineWidget._ranges[0];
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
                    // open the dropdown
                    dropdownButton().click();

                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);
                    expect(inlineEditorFileName()[0].text).toEqual("test.less : 9");

                    var inlineWidget = getInlineEditorWidget();
                    var ranges = inlineWidget._ranges[0];
                    var document = ranges.textRange.document;

                    expect(document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length})).toEqual("    &.banner-new2 {\n        background-color: blue;\n    }");

                    var files = inlineWidget.$relatedContainer.find(".related ul>li");
                    expect(files.length).toBe(2);
                    expect(files[0].textContent).toEqual("div / &.banner-new2 — test.less : 9");
                    expect(files[1].textContent).toEqual(".banner-new2 — test2.less : 1");
                });
            });
        });
    });
});
