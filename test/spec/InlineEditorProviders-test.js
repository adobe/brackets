/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false */

define(function (require, exports, module) {
    'use strict';
    
    var Commands,         // loaded from brackets.test
        EditorManager,    // loaded from brackets.test
        DocumentManager,  // loaded from brackets.test
        SpecRunnerUtils = require("./SpecRunnerUtils.js");

    describe("InlineEditorProviders", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/InlineEditorProviders-test-files"),
            testWindow,
            infos;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow      = w;
                Commands        = testWindow.brackets.test.Commands;
                EditorManager   = testWindow.brackets.test.EditorManager;
                DocumentManager = testWindow.brackets.test.DocumentManager;
            });
        });

        afterEach(function () {
            // revert files to original content with offset markup
            SpecRunnerUtils.saveFilesWithOffsets(infos);
            SpecRunnerUtils.closeTestWindow();
        });

        describe("htmlToCSSProvider", function () {

            it("Opens a type selector", function () {
                var docs        = null,
                    err         = false,
                    inlineData  = null;
                
                // load project to set CSSUtils scope
                runs(function () {
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
                
                // rewrite files without offsets
                runs(function () {
                    SpecRunnerUtils.saveFilesWithoutOffsets(["test1.html", "test1.css"]).done(function (fileInfos) {
                        infos = fileInfos;
                    }).fail(function () {
                        err = true;
                    });
                });
                
                waitsFor(function () { return (infos !== null) && !err; }, "rewrite timeout", 1000);
                
                runs(function () {
                    // open test1.html
                    SpecRunnerUtils.openProjectFiles(["test1.html"]).done(function (documents) {
                        docs = documents;
                    }).fail(function () {
                        err = true;
                    });
                });
                
                waitsFor(function () { return (docs !== null) && !err; }, "FILE_OPEN timeout", 1000);
                
                runs(function () {
                    // open inline editor at <div...>
                    DocumentManager.setCurrentDocument(docs["test1.html"]);
                    var editor = EditorManager.getCurrentFullEditor();
                    SpecRunnerUtils.openInlineEditorAtOffset(editor, infos["test1.html"].offsets[0]);
                });
                
                waitsFor(function () {
                    return EditorManager.getCurrentFullEditor().getInlineWidgets().length > 0;
                }, "inline editor timeout", 1000);
                
                var widgetHeight;
                runs(function () {
                    inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    widgetHeight = inlineData.editor.totalHeight(true);
                    var inlinePos = inlineData.editor.getCursorPos();
                    expect(inlinePos).toEqual(infos["test1.css"].offsets[0]);
                    expect(inlineData.editor.lineCount()).toBe(8);
                });

                // verify widget resizes when contents is changed
                runs(function () {
                    var newLines = ".bar {\ncolor: #f00;\n}\n.cat {\ncolor: #f00;\n}";
                    inlineData.editor._setText(inlineData.editor._getText() + newLines);
                    expect(inlineData.editor.lineCount()).toBe(13);
                    expect(inlineData.editor.totalHeight(true)).toBeGreaterThan(widgetHeight);
                });


            });

        });
    });
});
