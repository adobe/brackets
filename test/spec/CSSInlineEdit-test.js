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
                    expect(availableFilesInDropdown.length).toBe(5);
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

                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);
                    expect(inlineEditorFileName()[0].text).toEqual("test.less : 9");

                    var inlineWidget = getInlineEditorWidget();
                    var ranges = inlineWidget._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("    &.banner-new2 {\n        background-color: blue;\n    }");

                    var files = inlineWidget.$relatedContainer.find(".related ul>li");
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
                        expect(inlineEditorFileName()[0].text).toEqual("test2.less : 11");

                        var inlineWidget = getInlineEditorWidget();
                        var ranges = inlineWidget._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("        .level3 {\n            color: red;\n        }");

                        // It's not visible
                        var files = inlineWidget.$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".level1 / .level2 / .level3 — test2.less : 11");
                    });
                });

                it("should show the sinlge line comment above the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 31, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        expect(inlineEditorFileName()[0].text).toEqual("test2.less : 17");

                        var inlineWidget = getInlineEditorWidget();
                        var ranges = inlineWidget._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("/* This is a single line comment that should appear in the inline editor as first line */\n.comment1 {\n    text-align: center;\n}");

                        // It's not visible
                        var files = inlineWidget.$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".comment1 — test2.less : 17");
                    });
                });

                it("should show the multi line comment above the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 34, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        expect(inlineEditorFileName()[0].text).toEqual("test2.less : 22");

                        var inlineWidget = getInlineEditorWidget();
                        var ranges = inlineWidget._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("/* This is a multiline comment\n * that should appear in the inline editor\n */\n.comment2 {\n    text-decoration: overline;\n}");

                        // It's not visible
                        var files = inlineWidget.$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".comment2 — test2.less : 22");
                    });
                });

                it("should show the end of line comment after the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 37, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        expect(inlineEditorFileName()[0].text).toEqual("test2.less : 29");

                        var inlineWidget = getInlineEditorWidget();
                        var ranges = inlineWidget._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".comment3 {\n    text-decoration: underline; /* EOL comment {}(,;:) */\n}");

                        // It's not visible
                        var files = inlineWidget.$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".comment3 — test2.less : 29");
                    });
                });

                it("should show matching rule with comment above containing delimiter chars", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 41, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        expect(inlineEditorFileName()[0].text).toEqual("test2.less : 33");

                        var inlineWidget = getInlineEditorWidget();
                        var ranges = inlineWidget._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".confuse1 {\n    /* {this comment is special(;:,)} */\n    .special {\n        color: #ff8000;\n    }\n}");

                        // It's not visible
                        var files = inlineWidget.$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".confuse1 — test2.less : 33");
                    });
                });

                it("should show matching sub rule with comment above  containing delimiter chars", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 43, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        expect(inlineEditorFileName()[0].text).toEqual("test2.less : 34");

                        var inlineWidget = getInlineEditorWidget();
                        var ranges = inlineWidget._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    /* {this comment is special(;:,)} */\n    .special {\n        color: #ff8000;\n    }");

                        // It's not visible
                        var files = inlineWidget.$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".confuse1 / .special — test2.less : 34");
                    });
                });

                it("should show matching rule without delimiting whitespace (compressed)", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 48, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        expect(inlineEditorFileName()[0].text).toEqual("test2.less : 40");

                        var inlineWidget = getInlineEditorWidget();
                        var ranges = inlineWidget._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".compressed{color:red}");

                        // It's not visible
                        var files = inlineWidget.$relatedContainer.find(".related ul>li");
                        expect(files.length).toBe(1);
                        expect(files[0].textContent).toEqual(".compressed — test2.less : 40");
                    });
                });

                describe("Selector groups", function () {
                    it("should show matching selector group", function () {
                        runs(function () {
                            var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 53, ch: 25});
                            waitsForDone(promise, "Open inline editor");
                        });

                        runs(function () {
                            expect(inlineEditorFileName()[0].text).toEqual("test2.less : 44");

                            var inlineWidget = getInlineEditorWidget();
                            var ranges = inlineWidget._ranges[0];

                            expect(getInlineEditorContent(ranges)).toEqual("    .uno, .dos {\n        color: red\n    }");

                            // It's not visible
                            var files = inlineWidget.$relatedContainer.find(".related ul>li");
                            expect(files.length).toBe(1);
                            expect(files[0].textContent).toEqual(".uno, .dos — test2.less : 44");
                        });
                    });

                    it("should show 1 matching rule of selector group", function () {
                        runs(function () {
                            var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 54, ch: 25});
                            waitsForDone(promise, "Open inline editor");
                        });

                        runs(function () {
                            expect(inlineEditorFileName()[0].text).toEqual("test2.less : 44");

                            var inlineWidget = getInlineEditorWidget();
                            var ranges = inlineWidget._ranges[0];

                            expect(getInlineEditorContent(ranges)).toEqual("    .uno, .dos {\n        color: red\n    }");

                            // It's not visible
                            var files = inlineWidget.$relatedContainer.find(".related ul>li");
                            expect(files.length).toBe(2);
                            expect(files[0].textContent).toEqual(".uno, .dos — test2.less : 44");
                            expect(files[1].textContent).toEqual("#main / .dos — test2.less : 48");
                        });
                    });

                    it("should show matching selector group with selectors on separate lines", function () {
                        runs(function () {
                            var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 58, ch: 25});
                            waitsForDone(promise, "Open inline editor");
                        });

                        runs(function () {
                            expect(inlineEditorFileName()[0].text).toEqual("test2.less : 54");

                            var inlineWidget = getInlineEditorWidget();
                            var ranges = inlineWidget._ranges[0];

                            expect(getInlineEditorContent(ranges)).toEqual("    .tres,\n    .quattro {\n        color: blue;\n    }");

                            // It's not visible
                            var files = inlineWidget.$relatedContainer.find(".related ul>li");
                            expect(files.length).toBe(1);
                            expect(files[0].textContent).toEqual(".tres,     .quattro — test2.less : 54");
                        });
                    });
                });

                describe("Mixins", function () {
                    it("should show matching mixin rule", function () {
                        runs(function () {
                            var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 68, ch: 30});
                            waitsForDone(promise, "Open inline editor");
                        });

                        runs(function () {
                            expect(inlineEditorFileName()[0].text).toEqual("test2.less : 75");

                            var inlineWidget = getInlineEditorWidget();
                            var ranges = inlineWidget._ranges[0];

                            expect(getInlineEditorContent(ranges)).toEqual(".mixina-class {\n    .a();\n}");

                            // It's not visible
                            var files = inlineWidget.$relatedContainer.find(".related ul>li");
                            expect(files.length).toBe(1);
                            expect(files[0].textContent).toEqual(".mixina-class — test2.less : 75");
                        });
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
                    expect(inlineEditorFileName()[0].text).toEqual("test.scss : 5");

                    var inlineWidget = getInlineEditorWidget();
                    var ranges = inlineWidget._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("p {\n    $font-size: 12px;\n    $line-height: 30px;\n    font: #{$font-size}/#{$line-height};");

                    // It's not visible
                    var files = inlineWidget.$relatedContainer.find(".related ul>li");
                    expect(files.length).toBe(1);
                    expect(files[0].textContent).toEqual("p — test.scss : 5");
                });
            });

            xit("should show one matching rule in inline editor which is defined after rule that uses variable interpolation as property value", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 28, ch: 20});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    expect(inlineEditorFileName()[0].text).toEqual("test.scss : 11");

                    var inlineWidget = getInlineEditorWidget();
                    var ranges = inlineWidget._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("p {\n    font-size: ($font-size * 1.20)px;\n    height: ($height + 20)px;\n}");

                    // It's not visible
                    var files = inlineWidget.$relatedContainer.find(".related ul>li");
                    expect(files.length).toBe(1);
                    expect(files[0].textContent).toEqual("p — test.scss : 5");
                });
            });
        });
    });
});
