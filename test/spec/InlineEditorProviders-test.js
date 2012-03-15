/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false */

define(function (require, exports, module) {
    'use strict';
    
    var Commands,       // loaded from brackets.test
        EditorManager,  // loaded from brackets.test
        SpecRunnerUtils = require("./SpecRunnerUtils.js");

    describe("InlineEditorProviders", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/InlineEditorProviders-test-files"),
            testWindow;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow      = w;
                Commands        = testWindow.brackets.test.Commands;
                EditorManager   = testWindow.brackets.test.EditorManager;
            });
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        describe("htmlToCSSProvider", function () {

            it("TODO", function () {
                var info        = null,
                    editor      = null,
                    err         = false,
                    inlineData  = null;
                
                runs(function () {
                    SpecRunnerUtils.openFileWithOffsets(testPath + "/test1.html")
                        .done(function (result) {
                            info = result;
                            editor = info.document.editor;
                        })
                        .fail(function () {
                            err = true;
                        });
                });
                
                waitsFor(function () { return info && !err; }, "FILE_OPEN timeout", 1000);
                
                runs(function () {
                    SpecRunnerUtils.openInlineEditorAtOffset(editor, info.offsets[0]);
                });
                
                waitsFor(function () {
                    return editor.getInlineWidgets().length > 0;
                }, "inline editor timeout", 1000);
                
                runs(function () {
                    inlineData = editor.getInlineWidgets()[0].data;
                });
            });
        });
    });
});
