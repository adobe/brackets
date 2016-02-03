/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, beforeEach, afterEach, it, runs, expect, waitsForDone, beforeFirst, afterLast */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var CommandManager,          // loaded from brackets.test
        Commands,                // loaded from brackets.test
        DocumentManager,         // loaded from brackets.test
        EditorManager,           // loaded from brackets.test
        SpecRunnerUtils          = require("spec/SpecRunnerUtils");


    describe("DocumentManager", function () {
        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/DocumentCommandHandlers-test-files"),
            testFile = testPath + "/test.js",
            testWindow,
            _$,
            promise;


        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                _$ = testWindow.$;

                // Load module instances from brackets.test
                CommandManager          = testWindow.brackets.test.CommandManager;
                Commands                = testWindow.brackets.test.Commands;
                DocumentManager         = testWindow.brackets.test.DocumentManager;
                EditorManager           = testWindow.brackets.test.EditorManager;
            });
        });

        afterLast(function () {
            testWindow              = null;
            CommandManager          = null;
            Commands                = null;
            DocumentManager         = null;
            EditorManager           = null;
            SpecRunnerUtils.closeTestWindow();
        });


        beforeEach(function () {
            // Working set behavior is sensitive to whether file lives in the project or outside it, so make
            // the project root a known quantity.
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
        });

        afterEach(function () {
            promise = null;

            runs(function () {
                // Call closeAll() directly. Some tests set a spy on the save as
                // dialog preventing SpecRunnerUtils.closeAllFiles() from
                // working properly.
                testWindow.brackets.test.MainViewManager._closeAll(testWindow.brackets.test.MainViewManager.ALL_PANES);
            });
        });
        describe("openDocument ", function () {
            it("Should report document in open documents list", function () {

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: testFile });
                    waitsForDone(promise, Commands.FILE_OPEN);
                });

                runs(function () {
                    expect(DocumentManager.getOpenDocumentForPath(testFile)).toBeTruthy();
                    expect(DocumentManager.getAllOpenDocuments().length).toEqual(1);
                    expect(DocumentManager.getCurrentDocument().file.fullPath).toEqual(testFile);
                });

                runs(function () {
                    promise = DocumentManager.getDocumentText({ fullPath: testFile });
                    waitsForDone(promise, "DocumentManager.getDocumentText");
                });

                runs(function () {
                    promise = CommandManager.execute(Commands.FILE_CLOSE_ALL);
                    waitsForDone(promise, Commands.FILE_CLOSE_ALL);
                });

                runs(function () {
                    expect(DocumentManager.getAllOpenDocuments().length).toEqual(0);
                    expect(DocumentManager.getCurrentDocument()).toBeFalsy();
                });
            });

            it("Should create a new untitled document", function () {
                runs(function () {
                    var doc = DocumentManager.createUntitledDocument(1, ".txt");
                    expect(doc).toBeTruthy();
                });
            });
        });

    });
});
