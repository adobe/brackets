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

/*global describe, it, spyOn, expect, beforeEach, afterEach */

define(function (require, exports, module) {
    'use strict';

    var WorkspaceManager = require("view/WorkspaceManager"),
        MainViewManager  = require("view/MainViewManager"),
        SpecRunnerUtils  = require("spec/SpecRunnerUtils");

    describe("Editor Redrawing", function () {
        var testEditor, testDoc, $root;
        beforeEach(function () {
            testDoc = SpecRunnerUtils.createMockDocument("");
            MainViewManager._edit(MainViewManager.ACTIVE_PANE, testDoc);
            testEditor = testDoc._masterEditor;
            $root = $(testEditor.getRootElement());
            WorkspaceManager._setMockDOM($("#mock-main-view"),  $root.parent());
        });

        afterEach(function () {
            MainViewManager._closeAll(MainViewManager.ALL_PANES);
            SpecRunnerUtils.destroyMockEditor(testDoc);
            testEditor = null;
            testDoc = null;
            $root = null;
            WorkspaceManager._setMockDOM(undefined, undefined);
        });

        // force cases
        describe("Editor Redraw Perforamnce", function () {
            it("should refresh if force is specified even if no width or height change", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout(true);
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });
            it("should refresh if force is specified when width changed but height hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                $root.width(300); // change the width
                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout(true);
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });
            it("should refresh if force is specified when height changed but width hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                $root.height(300); // change the height (to be different from content div)

                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout(true);
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });
            it("should refresh if force is specified when both height and width changed", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                $root.height(300); // change the height (to be different from content div)
                $root.width(300); // change the width

                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout(true);
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });
            // skip cases
            it("should NOT refresh if skip is specified if no width or height change", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout(false);
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });
            it("should NOT refresh if skip is specified when width changed but height hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                $root.width(300); // change the width

                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout(false);
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });
            it("should NOT refresh if skip is specified when height changed but width hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                $root.height(300); // change the height (to be different from content div)

                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout(false);
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });

            it("should NOT refresh if skip is specified when both height and width changed", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                $root.height(300); // change the height (to be different from content div)
                $root.width(300); // change the width

                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout(false);
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });

            // unspecified cases
            it("should NOT refresh if unspecified if no width or height change", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();

                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout();
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });

            it("should refresh if unspecified when width changed but height hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                $root.width(300); // change the width

                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout();
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });

            it("should refresh if unspecified when height changed but width hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                $root.height(300); // change the height (to be different from content div)

                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout();
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });

            it("should refresh if unspecified when both height and width changed", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                WorkspaceManager.recomputeLayout();
                $root.height(300); // change the height (to be different from content div)
                $root.width(300); // change the width

                spyOn(testEditor, "refreshAll");
                WorkspaceManager.recomputeLayout();
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });
        });
    });
});
