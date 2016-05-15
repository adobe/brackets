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
    "use strict";

    // Load dependent modules
    var DocumentManager,      // loaded from brackets.test
        DragAndDrop,          // loaded from brackets.test
        EditorManager,        // loaded from brackets.test
        MainViewManager,      // loaded from brackets.test
        SpecRunnerUtils  = require("spec/SpecRunnerUtils");


    describe("DragAndDrop", function () {
        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/DocumentCommandHandlers-test-files"),
            testWindow,
            _$,
            promise;

        beforeFirst(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
                _$ = testWindow.$;

                // Load module instances from brackets.test
                DocumentManager = testWindow.brackets.test.DocumentManager;
                DragAndDrop     = testWindow.brackets.test.DragAndDrop;
                EditorManager   = testWindow.brackets.test.EditorManager;
                MainViewManager = testWindow.brackets.test.MainViewManager;
            });
        });

        afterLast(function () {
            testWindow      = null;
            DocumentManager = null;
            DragAndDrop     = null;
            EditorManager   = null;
            MainViewManager = null;
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

        describe("Testing openDroppedFiles function", function () {
            it("should activate a pane on drag over", function () {
                MainViewManager.setLayoutScheme(1, 2);
                var $paneEl = _$("#second-pane");
                $paneEl.triggerHandler("dragover");
                expect(MainViewManager.getActivePaneId()).toBe("second-pane");
            });

            it("should NOT open any image file when a text file is in the dropped file list", function () {
                var jsFilePath = testPath + "/test.js";
                runs(function () {
                    var files = [testPath + "/couz.png", testPath + "/couz2.png", jsFilePath];
                    promise = DragAndDrop.openDroppedFiles(files);
                    waitsForDone(promise, "opening dropped files");
                });

                runs(function () {
                    var editor = EditorManager.getActiveEditor();
                    expect(editor.document.file.fullPath).toBe(jsFilePath);
                    expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(jsFilePath);
                });
            });

            it("should show the image when a single image file is dropped", function () {
                var path = testPath + "/couz.png";
                runs(function () {
                    promise = DragAndDrop.openDroppedFiles([path]);
                    waitsForDone(promise, "opening a dropped image file");
                });

                runs(function () {
                    var editor = EditorManager.getActiveEditor();
                    expect(editor).toBe(null);
                    expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(path);
                });
            });

            it("should show the last image when multiple image files are dropped", function () {
                var lastImagePath = testPath + "/couz2.png";
                runs(function () {
                    var files = [testPath + "/couz.png", lastImagePath];
                    promise = DragAndDrop.openDroppedFiles(files);
                    waitsForDone(promise, "opening last image file from the dropped files");
                });

                runs(function () {
                    var editor = EditorManager.getActiveEditor();
                    expect(editor).toBe(null);
                    expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(lastImagePath);
                });
            });

            it("should add images to the working set when they dropped from outside the project", function () {
                var imagesPath = SpecRunnerUtils.getTestPath("/spec/test-image-files");
                runs(function () {
                    var files = [imagesPath + "/thermo.jpg", imagesPath + "/eye.jpg"];
                    promise = DragAndDrop.openDroppedFiles(files);
                    waitsForDone(promise, "opening last image file from the dropped files");
                });

                runs(function () {
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, imagesPath + "/thermo.jpg")).toNotEqual(-1);
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, imagesPath + "/eye.jpg")).toNotEqual(-1);
                });
            });
        });
    });
});
