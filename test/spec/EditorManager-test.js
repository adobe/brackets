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
/*global define, describe, it, spyOn, expect, beforeEach, afterEach, waitsFor, runs, $, CodeMirror */

define(function (require, exports, module) {
    'use strict';
    
    var EditorManager   = require("editor/EditorManager"),
        PanelManager    = require("view/PanelManager"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils");

    describe("EditorManager", function () {

        describe("resizeEditor() flag options", function () {
            var testEditor, testDoc, $root, $fakeContentDiv;
            
            beforeEach(function () {
                // Normally the editor holder would be created inside a "content" div, which is
                // used in the available height calculation. We create a fake content div just to
                // hold the height, and we'll place the editor holder in it.
                $fakeContentDiv = $("<div class='content'/>")
                    .css("height", "200px")
                    .appendTo(document.body);
                
                // createMockEditor() creates the mock-editor-holder, and links EditorManager/PanelManager
                // to it (and links PanelManager to our content div)
                var mock = SpecRunnerUtils.createMockEditor("");
                
                // move newly created mock-editor-holder into the content div we created above
                $("#mock-editor-holder")
                    .appendTo($fakeContentDiv);
                
                testEditor = mock.editor;
                testDoc = mock.doc;
                $root = $(testEditor.getRootElement());
                
                testDoc._masterEditor = testEditor;
                EditorManager._doShow(testDoc);
            });
            
            afterEach(function () {
                $fakeContentDiv.remove();
                $fakeContentDiv = null;
                
                SpecRunnerUtils.destroyMockEditor(testDoc);
                testEditor = null;
                testDoc = null;
                $root = null;
            });
            
            // force cases
            it("should refresh if force is specified even if no width or height change", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange(EditorManager.REFRESH_FORCE);
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });

            it("should refresh if force is specified when width changed but height hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                $root.width(300); // change the width
                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange(EditorManager.REFRESH_FORCE);
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });

            it("should refresh if force is specified when height changed but width hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                $root.height(300); // change the height (to be different from content div)
                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange(EditorManager.REFRESH_FORCE);
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });

            it("should refresh if force is specified when both height and width changed", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                $root.height(300); // change the height (to be different from content div)
                $root.width(300); // change the width
                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange(EditorManager.REFRESH_FORCE);
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });

            // skip cases
            it("should NOT refresh if skip is specified if no width or height change", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange(EditorManager.REFRESH_SKIP);
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });

            it("should NOT refresh if skip is specified when width changed but height hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                $root.width(300); // change the width
                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange(EditorManager.REFRESH_SKIP);
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });

            it("should NOT refresh if skip is specified when height changed but width hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                $root.height(300); // change the height (to be different from content div)
                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange(EditorManager.REFRESH_SKIP);
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });

            it("should NOT refresh if skip is specified when both height and width changed", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                $root.height(300); // change the height (to be different from content div)
                $root.width(300); // change the width
                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange(EditorManager.REFRESH_SKIP);
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });
            
            // unspecified cases
            it("should NOT refresh if unspecified if no width or height change", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange();
                expect(testEditor.refreshAll).not.toHaveBeenCalled();
            });

            it("should refresh if unspecified when width changed but height hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                $root.width(300); // change the width
                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange();
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });

            it("should refresh if unspecified when height changed but width hasn't", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                $root.height(300); // change the height (to be different from content div)
                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange();
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });

            it("should refresh if unspecified when both height and width changed", function () {
                $root.height(200); // same as content div, so shouldn't be detected as a change
                $root.width(200);
                EditorManager.resizeEditor(); // cache the width
                $root.height(300); // change the height (to be different from content div)
                $root.width(300); // change the width
                
                spyOn(testEditor, "refreshAll");
                PanelManager._notifyLayoutChange();
                expect(testEditor.refreshAll).toHaveBeenCalled();
            });
        });
    });
});
