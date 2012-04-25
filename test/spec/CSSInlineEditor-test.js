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
    
    var CSSInlineEditor     = require("editor/CSSInlineEditor").CSSInlineEditor,
        InlineTextEditor    = require("editor/InlineTextEditor").InlineTextEditor,
        InlineWidget        = require("editor/InlineWidget").InlineWidget,
        Editor              = require("editor/Editor").Editor,
        EditorManager       = require("editor/EditorManager"),
        SpecRunnerUtils     = require("./SpecRunnerUtils.js");

    describe("CSSInlineEditor", function () {
        
        var cssInlineEditor,
            $editorHolder,
            hostEditor;
        
        beforeEach(function () {
            // init Editor instance (containing a CodeMirror instance)
            $("body").append("<div id='editorHolder'/>");
            $editorHolder = $("#editorHolder");
            EditorManager.setEditorHolder(this.$editorHolder);
            
            var doc = SpecRunnerUtils.createMockDocument("hostEditor");
            hostEditor = new Editor(doc, true, "", $editorHolder.get(0), {});
        });
        
        afterEach(function () {
            hostEditor.destroy();
            $editorHolder.remove();
        });

        it("should initialize to a default state", function () {
            cssInlineEditor = new CSSInlineEditor([]);
            
            expect(cssInlineEditor instanceof InlineTextEditor).toBe(true);
            expect(cssInlineEditor instanceof InlineWidget).toBe(true);
            expect(cssInlineEditor.editors.length).toBe(0);
            expect(cssInlineEditor.htmlContent instanceof HTMLElement).toBe(true);
            expect(cssInlineEditor.height).toBe(0);
            expect(cssInlineEditor.id).toBeNull();
            expect(cssInlineEditor.hostEditor).toBeNull();
        });

        it("should load a single rule and initialize htmlContent and editor", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("inlineDoc\nstartLine\nendLine\n");
            var mockRule = {
                document: inlineDoc,
                lineStart: 1,
                lineEnd: 2
            };
            
            cssInlineEditor = new CSSInlineEditor([mockRule]);
            cssInlineEditor.load(hostEditor);
            
            expect(cssInlineEditor.editors.length).toBe(1);
            expect(cssInlineEditor.editors[0].document).toBe(inlineDoc);
        });

        it("should contain a rule list widget displaying info for each rule", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRules = [
                {
                    document: inlineDoc,
                    selector: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    selector: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            cssInlineEditor = new CSSInlineEditor(mockRules);
            cssInlineEditor.load(hostEditor);
            
            var $ruleListItems = $(cssInlineEditor.htmlContent).find("li");
            expect($($ruleListItems.get(0)).text()).toBe("div _unitTestDummyFile_.js : 1");
            expect($($ruleListItems.get(1)).text()).toBe(".foo _unitTestDummyFile_.js : 2");
        });

        it("should change selection to the next rule", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRules = [
                {
                    document: inlineDoc,
                    selector: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    selector: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            cssInlineEditor = new CSSInlineEditor(mockRules);
            cssInlineEditor.load(hostEditor);
            cssInlineEditor.nextRule();
            
            var $selection = $(cssInlineEditor.htmlContent).find(".selection");
            var $ruleListItems = $(cssInlineEditor.htmlContent).find("li");
            expect($selection.position().top).toBe($($ruleListItems.get(0)).position().top);
        });

        it("should change selection to the previous rule", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRules = [
                {
                    document: inlineDoc,
                    selector: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    selector: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            cssInlineEditor = new CSSInlineEditor(mockRules);
            cssInlineEditor.load(hostEditor);
            
            // select .foo
            cssInlineEditor.setSelectedRule(1);
            
            // verify selection moves
            var $selection = $(cssInlineEditor.htmlContent).find(".selection");
            var $ruleListItems = $(cssInlineEditor.htmlContent).find("li");
            expect($selection.position().top).toBe($($ruleListItems.get(1)).position().top);
            
            // select div
            cssInlineEditor.previousRule();
            
            // verify selection moves again
            expect($selection.position().top).toBe($($ruleListItems.get(0)).position().top);
        });
        
        
        function expectResultItemToEqual(resultItem, mockRule) {
            expect(resultItem.selector).toBe(mockRule.selector);
            expect(resultItem.textRange.startLine).toBe(mockRule.lineStart);
            expect(resultItem.textRange.endLine).toBe(mockRule.lineEnd);
        }

        it("should retreive all rules", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            var mockRules = [
                {
                    document: inlineDoc,
                    selector: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    selector: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            cssInlineEditor = new CSSInlineEditor(mockRules);
            
            expect(cssInlineEditor.getRules().length).toEqual(mockRules.length);
            expectResultItemToEqual(cssInlineEditor.getRules()[0], mockRules[0]);
            expectResultItemToEqual(cssInlineEditor.getRules()[1], mockRules[1]);
        });

        it("should retreive the selected rule", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRules = [
                {
                    document: inlineDoc,
                    selector: "div",
                    lineStart: 0,
                    lineEnd: 0
                },
                {
                    document: inlineDoc,
                    selector: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                }
            ];
            
            cssInlineEditor = new CSSInlineEditor(mockRules);
            cssInlineEditor.load(hostEditor);
            
            // "div" rule should be selected by default
            expectResultItemToEqual(cssInlineEditor.getSelectedRule(), mockRules[0]);
            
            // select ".foo" rule - should be next
            cssInlineEditor.nextRule();
            expectResultItemToEqual(cssInlineEditor.getSelectedRule(), mockRules[1]);
        });

        it("should close and return to the host editor", function () {
            var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
            
            var mockRules = [
                {
                    document: inlineDoc,
                    selector: "div",
                    lineStart: 0,
                    lineEnd: 0
                }
            ];
            
            cssInlineEditor = new CSSInlineEditor(mockRules);
            cssInlineEditor.load(hostEditor);
            
            // add widget directly, bypass _openInlineWidget
            hostEditor.addInlineWidget({line: 0, ch: 0}, cssInlineEditor);
            
            // verify it was added
            expect(hostEditor.hasFocus()).toBe(false);
            expect(hostEditor.getInlineWidgets().length).toBe(1);
            
            // close the inline editor directly, should call EditorManager and removeInlineWidget
            cssInlineEditor.close();
            
            // verify no editors
            expect(hostEditor.getInlineWidgets().length).toBe(0);
            expect(hostEditor.hasFocus()).toBe(true);
        });
        
    });
});
