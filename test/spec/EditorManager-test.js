/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, spyOn, expect, beforeEach, afterEach, waitsFor, runs, $ */

define(function (require, exports, module) {
    'use strict';
    
    var EditorManager    = require("editor/EditorManager"),
        WorkspaceManager = require("view/WorkspaceManager"),
        MainViewManager  = require("view/MainViewManager"),
        SpecRunnerUtils  = require("spec/SpecRunnerUtils");

    // TODO -- This is a workspace layout thing now so we need to repurpose this 
    describe("EditorManager", function () {

        describe("Create Editors", function () {
            var pane, testEditor, testDoc, $root, $fakeContentDiv, $fakeHolder;
            
            beforeEach(function () {
                // Normally the editor holder would be created inside a "content" div, which is
                // used in the available height calculation. We create a fake content div just to
                // hold the height, and we'll place the editor holder in it.
                $fakeContentDiv = $("<div class='content'/>")
                    .css("height", "200px")
                    .appendTo(document.body);
                
                $fakeHolder = SpecRunnerUtils.createMockElement()
                                            .css("width", "1000px")
                                            .attr("id", "hidden-editors")
                                            .appendTo($fakeContentDiv);

                pane = SpecRunnerUtils.createMockPane($fakeHolder);
                testDoc = SpecRunnerUtils.createMockDocument("");
            });
            afterEach(function () {
                $fakeHolder.remove();
                $fakeHolder = null;

                $fakeContentDiv.remove();
                $fakeContentDiv = null;
                
                SpecRunnerUtils.destroyMockEditor(testDoc);
                testEditor = null;
                testDoc = null;
                pane = null;
                $root = null;
                EditorManager.resetViewStates();
            });
            it("should create a new editor for a document and add it to a pane", function () {
                spyOn(pane, "addView");
                EditorManager.doOpenDocument(testDoc, pane);
                expect(pane.addView).toHaveBeenCalled();
            });
            it("should use an existing editor for a document and show the editor", function () {
                spyOn(pane, "addView");
                spyOn(pane, "showView");
                var editor = SpecRunnerUtils.createEditorInstance(testDoc, pane.$el);
                EditorManager.doOpenDocument(testDoc, pane);
                expect(pane.showView).toHaveBeenCalled();
                expect(pane.addView).toHaveBeenCalled();
                expect(pane.addView.calls[0].args[1]).toEqual(editor);
            });
            it("should remember a file's view state", function () {
                EditorManager.addViewStates({ a: "1234" });
                expect(EditorManager.getViewState("a")).toEqual("1234");
            });
            it("should extend the view state cache", function () {
                EditorManager.addViewStates({ a: "1234" });
                EditorManager.addViewStates({ b: "5678" });
                expect(EditorManager.getViewState("a")).toEqual("1234");
                expect(EditorManager.getViewState("b")).toEqual("5678");
            });
            it("should reset the view state cache", function () {
                EditorManager.addViewStates({ a: "1234" });
                EditorManager.addViewStates({ b: "5678" });
                EditorManager.resetViewStates();
                expect(EditorManager.getViewState("a")).toBeUndefined();
                expect(EditorManager.getViewState("b")).toBeUndefined();
            });
        });
    });
});
