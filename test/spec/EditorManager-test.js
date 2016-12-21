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
/*global define, describe, it, spyOn, expect, beforeEach, afterEach, $ */

define(function (require, exports, module) {
    'use strict';
    
    var EditorManager    = require("editor/EditorManager"),
        ViewStateManager = require("view/ViewStateManager"),
        SpecRunnerUtils  = require("spec/SpecRunnerUtils");

    describe("EditorManager", function () {
        var pane, testEditor, testDoc, $fakeContentDiv, $fakeHolder;
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
            ViewStateManager.reset();
        });
        
        describe("Create Editors", function () {
            
            it("should create a new editor for a document and add it to a pane", function () {
                spyOn(pane, "addView");
                EditorManager.openDocument(testDoc, pane);
                expect(pane.addView).toHaveBeenCalled();
            });
            it("should use an existing editor for a document and show the editor", function () {
                spyOn(pane, "addView");
                spyOn(pane, "showView");
                var editor = SpecRunnerUtils.createEditorInstance(testDoc, pane.$el);
                EditorManager.openDocument(testDoc, pane);
                expect(pane.addView).toHaveBeenCalled();
                expect(pane.showView).toHaveBeenCalled();
                expect(pane.addView.calls[0].args[0]).toEqual(editor);
            });
        });
    });
    describe("ViewStateManager", function () {
        var pane, testEditor, testDoc, $fakeContentDiv, $fakeHolder;
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
            ViewStateManager.reset();
        });
        describe("Save/Restore View State", function () {
            it("should remember a file's view state", function () {
                ViewStateManager.addViewStates({ a: "1234" });
                expect(ViewStateManager.getViewState({fullPath: "a"})).toEqual("1234");
                ViewStateManager.addViewStates({ b: "Jeff was here" });
                expect(ViewStateManager.getViewState({fullPath: "B"})).toBeUndefined();
                expect(ViewStateManager.getViewState({fullPath: "b"})).toEqual("Jeff was here");
            });
            it("should extend the view state cache", function () {
                ViewStateManager.addViewStates({ a: "1234" });
                ViewStateManager.addViewStates({ b: "5678" });
                expect(ViewStateManager.getViewState({fullPath: "a"})).toEqual("1234");
                expect(ViewStateManager.getViewState({fullPath: "b"})).toEqual("5678");
            });
            it("should reset the view state cache", function () {
                ViewStateManager.addViewStates({ a: "1234" });
                ViewStateManager.addViewStates({ b: "5678" });
                ViewStateManager.reset();
                expect(ViewStateManager.getViewState({fullPath: "a"})).toBeUndefined();
                expect(ViewStateManager.getViewState({fullPath: "b"})).toBeUndefined();
            });
            it("should update the view state cache", function () {
                var myView = {
                    getFile: function () {
                        return {
                            fullPath: "a"
                        };
                    },
                    getViewState: function () {
                        return "1234";
                    }
                };
                ViewStateManager.updateViewState(myView);
                expect(ViewStateManager.getViewState({fullPath: "a"})).toEqual("1234");
            });
        });
    });
});
