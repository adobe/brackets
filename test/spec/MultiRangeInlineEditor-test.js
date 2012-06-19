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
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, HTMLElement: false */

define(function (require, exports, module) {
    'use strict';
    
    var MultiRangeInlineEditor  = require("editor/MultiRangeInlineEditor"),
        InlineTextEditor        = require("editor/InlineTextEditor"),
        InlineWidget            = require("editor/InlineWidget"),
        Editor                  = require("editor/Editor"),
        EditorManager           = require("editor/EditorManager"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils");

    describe("MultiRangeInlineEditor", function () {
        
        var inlineEditor,
            $editorHolder,
            hostEditor;
        
        beforeEach(function () {
            // init Editor instance (containing a CodeMirror instance)
            $("body").append("<div id='editor-holder'/>");
            $editorHolder = $("#editor-holder");
            EditorManager.setEditorHolder(this.$editorHolder);
            
            var doc = SpecRunnerUtils.createMockDocument("hostEditor");
            hostEditor = new Editor(doc, true, "", $editorHolder.get(0), {});
        });
        
        afterEach(function () {
            hostEditor.destroy();
            $editorHolder.remove();
        });

        it("should initialize to a default state", function () {
            inlineEditor = new MultiRangeInlineEditor([]);
            
            expect(inlineEditor instanceof InlineTextEditor).toBe(true);
            expect(inlineEditor instanceof InlineWidget).toBe(true);
            expect(inlineEditor.editors.length).toBe(0);
            expect(inlineEditor.htmlContent instanceof HTMLElement).toBe(true);
            expect(inlineEditor.height).toBe(0);
            expect(inlineEditor.id).toBeNull();
            expect(inlineEditor.hostEditor).toBeNull();
        });

        it("should load a single rule and initialize htmlContent and editor", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("inlineDoc\nstartLine\nendLine\n");
            var mockRange = {
                document: inlineDoc,
                lineStart: 1,
                lineEnd: 2
            };
            
            inlineEditor = new MultiRangeInlineEditor([mockRange]);
            inlineEditor.load(hostEditor);
            
            expect(inlineEditor.editors.length).toBe(1);
            expect(inlineEditor.editors[0].document).toBe(inlineDoc);
        });

        it("should contain a rule list widget displaying info for each rule", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRanges = [
                {
                    document: inlineDoc,
                    name: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    name: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            inlineEditor = new MultiRangeInlineEditor(mockRanges);
            inlineEditor.load(hostEditor);
            
            var $ruleListItems = $(inlineEditor.htmlContent).find("li");
            expect($($ruleListItems.get(0)).text()).toBe("div _unitTestDummyFile_.js : 1");
            expect($($ruleListItems.get(1)).text()).toBe(".foo _unitTestDummyFile_.js : 2");
        });

        it("should change selection to the next rule", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRanges = [
                {
                    document: inlineDoc,
                    name: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    name: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            inlineEditor = new MultiRangeInlineEditor(mockRanges);
            inlineEditor.load(hostEditor);
            inlineEditor._selectNextRange();
            
            var $selection = $(inlineEditor.htmlContent).find(".selection");
            var $ruleListItems = $(inlineEditor.htmlContent).find("li");
            expect($selection.position().top).toBe($($ruleListItems.get(0)).position().top);
        });

        it("should change selection to the previous rule", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRanges = [
                {
                    document: inlineDoc,
                    name: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    name: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            inlineEditor = new MultiRangeInlineEditor(mockRanges);
            inlineEditor.load(hostEditor);
            
            // select .foo
            inlineEditor.setSelectedIndex(1);
            
            // verify selection moves
            var $selection = $(inlineEditor.htmlContent).find(".selection");
            var $ruleListItems = $(inlineEditor.htmlContent).find("li");
            expect($selection.position().top).toBe($($ruleListItems.get(1)).position().top);
            
            // select div
            inlineEditor._selectPreviousRange();
            
            // verify selection moves again
            expect($selection.position().top).toBe($($ruleListItems.get(0)).position().top);
        });
        
        
        function expectResultItemToEqual(resultItem, mockRange) {
            expect(resultItem.name).toBe(mockRange.name);
            expect(resultItem.textRange.startLine).toBe(mockRange.lineStart);
            expect(resultItem.textRange.endLine).toBe(mockRange.lineEnd);
        }

        it("should retreive all rules", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            var mockRanges = [
                {
                    document: inlineDoc,
                    name: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    name: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            inlineEditor = new MultiRangeInlineEditor(mockRanges);
            
            expect(inlineEditor._getRanges().length).toEqual(mockRanges.length);
            expectResultItemToEqual(inlineEditor._getRanges()[0], mockRanges[0]);
            expectResultItemToEqual(inlineEditor._getRanges()[1], mockRanges[1]);
        });

        it("should retreive the selected rule", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRanges = [
                {
                    document: inlineDoc,
                    name: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    name: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            inlineEditor = new MultiRangeInlineEditor(mockRanges);
            inlineEditor.load(hostEditor);
            
            // "div" rule should be selected by default
            expectResultItemToEqual(inlineEditor._getSelectedRange(), mockRanges[0]);
            
            // select ".foo" rule - should be next
            inlineEditor._selectNextRange();
            expectResultItemToEqual(inlineEditor._getSelectedRange(), mockRanges[1]);
        });

        it("should close and return to the host editor", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRanges = [
                {
                    document: inlineDoc,
                    name: "div",
                    lineStart: 0,
                    lineEnd: 0
                }
            ];
            
            inlineEditor = new MultiRangeInlineEditor(mockRanges);
            inlineEditor.load(hostEditor);
            
            // add widget directly, bypass _openInlineWidget
            hostEditor.addInlineWidget({line: 0, ch: 0}, inlineEditor);
            
            // verify it was added
            expect(hostEditor.hasFocus()).toBe(false);
            expect(hostEditor.getInlineWidgets().length).toBe(1);
            
            // close the inline editor directly, should call EditorManager and removeInlineWidget
            inlineEditor.close();
            
            // verify no editors
            expect(hostEditor.getInlineWidgets().length).toBe(0);
            expect(hostEditor.hasFocus()).toBe(true);
        });
        
    });
});
