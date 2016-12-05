/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, expect, beforeEach, afterEach, waitsForDone, runs, beforeFirst, afterLast, spyOn */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        Strings         = require("strings");

    var testPath = SpecRunnerUtils.getTestPath("/spec/CSSInlineEdit-test-files");

    // TODO: overlaps a lot with MultiRangeInlineEditor-test integration suite
    describe("CSS Inline Edit", function () {
        this.category = "integration";

        var testWindow,
            brackets,
            $,
            EditorManager,
            CommandManager,
            DocumentManager,
            PreferencesManager,
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
                    PreferencesManager = brackets.test.PreferencesManager;
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
            PreferencesManager = null;
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
            var name = inlineWidget.$header.find("a.filename")[0].text;
            if (name[0] === "•") {
                // remove dirty dot
                name = name.slice(1);
            }
            return name;
        }

        function getRelatedFiles(inlineWidget) {
            return inlineWidget.$relatedContainer.find(".related ul>li:not(.section-header)");
        }

        function getRuleListSections(inlineWidget) {
            return inlineWidget.$relatedContainer.find("li.section-header");
        }

        function expectListItem($ruleListItem, ruleLabel, filename, lineNum) {  // TODO: duplicated with MultiRangeInlineEditor-test
            expect($ruleListItem.text()).toBe(ruleLabel + " :" + lineNum);
            expect($ruleListItem.data("filename")).toBe(filename);
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
            // LESS/SCSS files are sorted above all CSS files. Files are otherwise sorted by path & then filename.
            expect(availableFilesInDropdown.length).toBe(5);
            expect(availableFilesInDropdown[0].textContent).toEqual("test.less");
            expect(availableFilesInDropdown[1].textContent).toEqual("test2.less");
            expect(availableFilesInDropdown[2].textContent).toEqual("test.scss");
            expect(availableFilesInDropdown[3].textContent).toEqual("test.css");
            expect(availableFilesInDropdown[4].textContent).toEqual("test2.css");
        }

        function getInlineEditorContent(ranges) {
            var document = ranges.textRange.document;

            return document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length});
        }


        describe("CSS", function () {

            function resetCollapsedPrefs() {
                var context = null; // for unit tests, we don't really need a project-specific setting
                PreferencesManager.setViewState("inlineEditor.collapsedFiles", {}, context);
            }
            function makeInitiallyCollapsed(fullPath) {
                var context = null; // for unit tests, we don't really need a project-specific setting
                var setting = PreferencesManager.getViewState("inlineEditor.collapsedFiles", context) || {};
                setting[fullPath] = true;
                PreferencesManager.setViewState("inlineEditor.collapsedFiles", setting, context);
            }

            beforeEach(function () {
                resetCollapsedPrefs();
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
                    expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test.css : 1");

                    var ranges = inlineWidgets[0]._ranges[0];
                    var document = ranges.textRange.document;

                    expect(document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length})).toEqual(".standard {\n    background-color: red;\n}");

                    var files = getRelatedFiles(inlineWidgets[0]);
                    expect(files.length).toBe(2);
                    expectListItem(files.eq(0), ".standard", "test.css", 1);
                    expectListItem(files.eq(1), ".standard", "test2.css", 1);

                    // Check Inline Editor 2
                    expect(inlineEditorFileName(inlineWidgets[1])).toEqual("test.css : 8");

                    ranges = inlineWidgets[1]._ranges[0];
                    document = ranges.textRange.document;

                    expect(document.getRange({line: ranges.textRange.startLine, ch: 0}, {line: ranges.textRange.endLine, ch: document.getLine(ranges.textRange.endLine).length})).toEqual(".banner-new {\n    background-color: blue;\n}");

                    files = getRelatedFiles(inlineWidgets[1]);
                    expect(files.length).toBe(2);
                    expectListItem(files.eq(0), ".banner-new", "test.css", 8);
                    expectListItem(files.eq(1), ".banner-new", "test2.css", 8);
                });
            });

            it("should show no matching rule in inline editor", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 16, ch: 7});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidget = getInlineEditorWidgets()[0];

                    // verify New Rule dropdown contents
                    dropdownButton().click();
                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);

                    expect(inlineWidget._getSelectedRange()).toBe(null);
                    expect(inlineWidget.editor).toBeNull();

                    expect(inlineEditorMessage().html()).toEqual(Strings.CSS_QUICK_EDIT_NO_MATCHES);

                    expect(inlineWidget.$htmlContent.find(".related-container").length).toBe(0);  // rule list hidden
                });
            });

            it("should show one matching rule in inline editor", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 17, ch: 15});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidget = getInlineEditorWidgets()[0];
                    expect(inlineWidget._ranges.length).toBe(1);

                    // verify New Rule dropdown contents
                    dropdownButton().click();
                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);

                    expect(inlineEditorFileName(inlineWidget)).toEqual("test.less : 5");

                    var range = inlineWidget._ranges[0].textRange;
                    var document = range.document;
                    expect(document.getRange({line: range.startLine, ch: 0}, {line: range.endLine, ch: document.getLine(range.endLine).length})).toEqual(".banner {\n    background-color: red;\n}");

                    expect(inlineWidget.$htmlContent.find(".related-container").length).toBe(0);  // rule list hidden
                });
            });

            it("should show first matching rule of two files", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 20, ch: 25});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidget = getInlineEditorWidgets()[0];
                    expect(inlineWidget._ranges.length).toBe(2);

                    // verify New Rule dropdown contents
                    dropdownButton().click();
                    var availableFilesInDropdown = dropdownMenu().children();
                    checkAvailableStylesheets(availableFilesInDropdown);

                    expect(inlineEditorFileName(inlineWidget)).toEqual("test.css : 8");

                    var range = inlineWidget._ranges[0].textRange;
                    var document = range.document;
                    expect(document.getRange({line: range.startLine, ch: 0}, {line: range.endLine, ch: document.getLine(range.endLine).length})).toEqual(".banner-new {\n    background-color: blue;\n}");

                    var files = getRelatedFiles(inlineWidget);
                    expect(files.length).toBe(2);
                    expectListItem(files.eq(0), ".banner-new", "test.css", 8);
                    expectListItem(files.eq(1), ".banner-new", "test2.css", 8);

                    expect(inlineWidget.$htmlContent.find(".related-container").length).toBe(1);
                });
            });

            it("should collapse section without changing selection, and remember collapsed state", function () {
                runs(function () {
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 20, ch: 25});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidget = getInlineEditorWidgets()[0];
                    expect(inlineWidget._ranges.length).toBe(2);

                    expect(inlineEditorFileName(inlineWidget)).toEqual("test.css : 8");

                    var $ruleListSections = getRuleListSections(inlineWidget);
                    expect($ruleListSections.eq(0).text()).toBe("test.css (1)");
                    expect($ruleListSections.eq(1).text()).toBe("test2.css (1)");
                    expect($ruleListSections.eq(0).find(".disclosure-triangle.expanded").length).toBe(1);  // test.css is expanded
                    expect($ruleListSections.eq(1).find(".disclosure-triangle.expanded").length).toBe(1);  // test2.css is expanded

                    // Collapse test.css section (which contains the selection)
                    $ruleListSections.eq(0).click();

                    $ruleListSections = getRuleListSections(inlineWidget);
                    expect($ruleListSections.eq(0).text()).toBe("test.css (1)");
                    expect($ruleListSections.eq(1).text()).toBe("test2.css (1)");
                    expect($ruleListSections.eq(0).find(".disclosure-triangle:not(.expanded)").length).toBe(1); // test.css is now collapsed
                    expect($ruleListSections.eq(1).find(".disclosure-triangle.expanded").length).toBe(1);  // test2.css is expanded

                    // File in collapsed section is still selected - selection unchanged
                    expect(inlineEditorFileName(inlineWidget)).toEqual("test.css : 8");

                    // Close the inline editor
                    waitsForDone(inlineWidget.close());
                });
                runs(function () {
                    // Reopen it
                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 20, ch: 25});
                    waitsForDone(promise, "Open inline editor");
                });
                runs(function () {
                    var inlineWidget = getInlineEditorWidgets()[0];
                    expect(inlineWidget._ranges.length).toBe(2);

                    // Verify that collapsed section is still collapsed
                    var $ruleListSections = getRuleListSections(inlineWidget);
                    expect($ruleListSections.eq(0).text()).toBe("test.css (1)");
                    expect($ruleListSections.eq(1).text()).toBe("test2.css (1)");
                    expect($ruleListSections.eq(0).find(".disclosure-triangle:not(.expanded)").length).toBe(1); // test.css is still collapsed
                    expect($ruleListSections.eq(1).find(".disclosure-triangle.expanded").length).toBe(1);  // test2.css is expanded
                });
            });

            it("should initially select first non-collapsed result, and not change selection when expanding other groups", function () {
                runs(function () {
                    makeInitiallyCollapsed(testPath + "/css/test.css");

                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 20, ch: 25});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidget = getInlineEditorWidgets()[0];
                    expect(inlineWidget._ranges.length).toBe(2);

                    var $ruleListSections = getRuleListSections(inlineWidget);
                    expect($ruleListSections.eq(0).find(".disclosure-triangle:not(.expanded)").length).toBe(1);  // test.css is collapsed
                    expect($ruleListSections.eq(1).find(".disclosure-triangle.expanded").length).toBe(1);   // test2.css is expanded

                    expect(inlineEditorFileName(inlineWidget)).toEqual("test2.css : 8");

                    expect(inlineWidget.$htmlContent.find(".related-container").length).toBe(1);

                    // Opening a collapsed section shouldn't change the existing selection
                    $ruleListSections.eq(0).click();
                    expect($ruleListSections.eq(0).find(".disclosure-triangle.expanded").length).toBe(1); // test.css now expanded
                    expect($ruleListSections.eq(1).find(".disclosure-triangle.expanded").length).toBe(1);  // test2.css still expanded

                    expect(inlineEditorFileName(inlineWidget)).toEqual("test2.css : 8");
                });
            });

            it("should select nothing if all results collapsed with least 2 results, and auto-select a result on expand", function () {
                runs(function () {
                    makeInitiallyCollapsed(testPath + "/css/test.css");
                    makeInitiallyCollapsed(testPath + "/css/test2.css");

                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 20, ch: 25});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidget = getInlineEditorWidgets()[0];
                    expect(inlineWidget._ranges.length).toBe(2);

                    var $ruleListSections = getRuleListSections(inlineWidget);
                    expect($ruleListSections.eq(0).find(".disclosure-triangle:not(.expanded)").length).toBe(1);  // test.css is collapsed
                    expect($ruleListSections.eq(1).find(".disclosure-triangle:not(.expanded)").length).toBe(1);  // test2.css is collapsed

                    expect(inlineWidget._getSelectedRange()).toBe(null);
                    expect(inlineWidget.editor).toBeNull();

                    expect(inlineEditorMessage().html()).toEqual(Strings.INLINE_EDITOR_HIDDEN_MATCHES);
                    expect(inlineWidget.$htmlContent.find(".related-container").length).toBe(1);    // rule list still visible though

                    // Opening a collapsed section should select its first result
                    $ruleListSections.eq(1).click();
                    expect($ruleListSections.eq(0).find(".disclosure-triangle:not(.expanded)").length).toBe(1); // test.css still collapsed
                    expect($ruleListSections.eq(1).find(".disclosure-triangle.expanded").length).toBe(1);  // test2.css now expanded

                    expect(inlineWidget._getSelectedRange()).toBeTruthy();
                    expect(inlineEditorFileName(inlineWidget)).toEqual("test2.css : 8");
                });
            });

            it("should select collapsed result anyway if there's only one result total", function () {
                runs(function () {
                    makeInitiallyCollapsed(testPath + "/less/test.less");

                    var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 17, ch: 15});
                    waitsForDone(promise, "Open inline editor");
                });

                runs(function () {
                    var inlineWidget = getInlineEditorWidgets()[0];
                    expect(inlineWidget._ranges.length).toBe(1);

                    expect(inlineEditorFileName(inlineWidget)).toEqual("test.less : 5");

                    expect(inlineWidget.$htmlContent.find(".related-container").length).toBe(0);    // rule list hidden
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

                    expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test.scss : 57");

                    var document = inlineWidgets[0].editor.document;
                    // modify scss to add it to the working set
                    document.setText(".comment-scss-4 {\n    background-color: black;\n}");

                    expect(DocumentManager.findInWorkingSet(testPath + "/scss/test.scss")).toBeGreaterThan(0);
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
                    expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test.less : 5");

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
                    expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test.less : 9");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("    &.banner-new2 {\n        background-color: blue;\n    }");

                    var files = getRelatedFiles(inlineWidgets[0]);
                    expect(files.length).toBe(2);
                    expectListItem(files.eq(0), "div / &.banner-new2", "test.less", 9);
                    expectListItem(files.eq(1), ".banner-new2", "test2.less", 1);
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
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 11");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("        .level3 {\n            color: red;\n        }");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".level1 / .level2 / .level3", "test2.less", 11);
                    });
                });

                it("should show matching rule with comment above containing delimiter chars", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 37, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 44");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".confuse1 {\n    /* {this comment is special(;:,)} */\n    .special {\n        color: #ff8000;\n    }\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".confuse1", "test2.less", 44);
                    });
                });

                it("should show matching rule without delimiting whitespace (compressed)", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 44, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 51");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".compressed{color:red}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".compressed", "test2.less", 51);
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
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 45");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    /* {this comment is special(;:,)} */\n    .special {\n        color: #ff8000;\n    }");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".confuse1 / .special", "test2.less", 45);
                    });
                });

                it("should show the single line block style comment above the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 31, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 17");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("/* This is a single line block comment that should appear in the inline editor as first line */\n.comment1 {\n    text-align: center;\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".comment1", "test2.less", 17);
                    });
                });

                it("should show the single line inline comment above the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 34, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 33");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("// This is a single line comment that should appear in the inline editor as first line\n.comment4 {\n    text-align: center;\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".comment4", "test2.less", 33);
                    });
                });

                it("should show the multi line block comment above the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 32, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 22");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("/* This is a multiline block comment\n * that should appear in the inline editor\n */\n.comment2 {\n    text-decoration: overline;\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".comment2", "test2.less", 22);
                    });
                });

                it("should show the end of line comment after the matching rule", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 33, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 29");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".comment3 {\n    text-decoration: underline; /* EOL comment {}(,;:) */\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".comment3", "test2.less", 29);
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
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 55");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    .uno, .dos {\n        color: red\n    }");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".uno, .dos", "test2.less", 55);
                    });
                });

                it("should show 1 matching rule of selector group", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 50, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 55");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    .uno, .dos {\n        color: red\n    }");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(2);
                        expectListItem(files.eq(0), ".uno, .dos", "test2.less", 55);
                        expectListItem(files.eq(1), "#main / .dos", "test2.less", 59);
                    });
                });

                it("should show matching selector group with selectors on separate lines", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 54, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 65");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    .tres,\n    .quattro {\n        color: blue;\n    }");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".tres, .quattro", "test2.less", 65);
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
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 86");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".mixina-class {\n    .a();\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".mixina-class", "test2.less", 86);
                    });
                });

                it("should show matching rule which includes mixin with default parameter", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 71, ch: 20});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 120");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("#header-mixin-paramterized-default {\n    .border-radius;\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), "#header-mixin-paramterized-default", "test2.less", 120);
                    });
                });

                it("should show matching rule which includes a parameterized mixin", function () {
                    runs(function () {
                        var promise = SpecRunnerUtils.toggleQuickEditAtOffset(EditorManager.getCurrentFullEditor(), {line: 73, ch: 25});
                        waitsForDone(promise, "Open inline editor");
                    });

                    runs(function () {
                        var inlineWidgets = getInlineEditorWidgets();
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 126");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("    #header-mixin-paramterized-custom-1 {\n        .border-radius(20px);\n    }");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), "#header-mixin-paramterized-custom / #header-mixin-paramterized-custom-1", "test2.less", 126);
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
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test2.less : 109");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual(".widget {\n    @{property}: #0ee;\n    background-@{property}: #999;\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".widget", "test2.less", 109);
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
                    expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test.scss : 5");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("p {\n    $font-size: 12px;\n    $line-height: 30px;\n    font: #{$font-size}/#{$line-height};\n}");

                    // It's not visible
                    var files = getRelatedFiles(inlineWidgets[0]);
                    expect(files.length).toBe(1);
                    expectListItem(files.eq(0), "p", "test.scss", 5);
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
                    expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test.scss : 11");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("#scss-1 {\n    background-color: blue;\n}");

                    // It's not visible
                    var files = getRelatedFiles(inlineWidgets[0]);
                    expect(files.length).toBe(1);
                    expectListItem(files.eq(0), "#scss-1", "test.scss", 11);
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
                    expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test.scss : 20");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("    &-ok {\n        background-image: url(\"ok.png\");\n    }");

                    // It's not visible
                    var files = getRelatedFiles(inlineWidgets[0]);
                    expect(files.length).toBe(1);
                    expectListItem(files.eq(0), ".button / &-ok", "test.scss", 20);
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
                    expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test.scss : 37");

                    var ranges = inlineWidgets[0]._ranges[0];

                    expect(getInlineEditorContent(ranges)).toEqual("a {\n    color: blue;\n}");

                    // It's not visible
                    var files = getRelatedFiles(inlineWidgets[0]);
                    expect(files.length).toBe(1);
                    expectListItem(files.eq(0), "a", "test.scss", 37);
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
                        expect(inlineEditorFileName(inlineWidgets[0])).toEqual("test.scss : 41");

                        var ranges = inlineWidgets[0]._ranges[0];

                        expect(getInlineEditorContent(ranges)).toEqual("// This is a single line comment\n.comment-scss-1 {\n    background-color: red;\n}");

                        // It's not visible
                        var files = getRelatedFiles(inlineWidgets[0]);
                        expect(files.length).toBe(1);
                        expectListItem(files.eq(0), ".comment-scss-1", "test.scss", 41);
                    });
                });
            });
        });
    });
});
