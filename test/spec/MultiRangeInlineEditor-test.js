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
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, HTMLElement: false, beforeFirst: false, afterLast: false, waitsForDone: false */

define(function (require, exports, module) {
    'use strict';
    
    var MultiRangeInlineEditor  = require("editor/MultiRangeInlineEditor").MultiRangeInlineEditor,
        InlineTextEditor        = require("editor/InlineTextEditor").InlineTextEditor,
        InlineWidget            = require("editor/InlineWidget").InlineWidget,
        Editor                  = require("editor/Editor").Editor,
        EditorManager           = require("editor/EditorManager"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        Commands                = require("command/Commands");

    describe("MultiRangeInlineEditor", function () {
        
        var inlineEditor,
            hostEditor,
            doc;
        
        describe("unit", function () {
            
            beforeEach(function () {
                // create dummy Document and Editor
                var mocks = SpecRunnerUtils.createMockEditor("hostEditor", "");
                doc = mocks.doc;
                hostEditor = mocks.editor;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(doc);
                doc = null;
                inlineEditor = null;
                hostEditor = null;
            });
    
            it("should initialize to a default state", function () {
                inlineEditor = new MultiRangeInlineEditor([]);
                
                expect(inlineEditor instanceof InlineTextEditor).toBe(true);
                expect(inlineEditor instanceof InlineWidget).toBe(true);
                expect(inlineEditor.editor).toBeNull();
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
                
                expect(inlineEditor.editor).toBeTruthy();
                expect(inlineEditor.editor.document).toBe(inlineDoc);

                // Messages div should be hidden, editor holder should have a child editor.
                expect(inlineEditor.$htmlContent.find(".inline-editor-message").length).toBe(0);
                expect(inlineEditor.$htmlContent.find(".inline-editor-holder").children().length).toBe(1);
                
                // Rule list should be hidden with only one rule.
                expect(inlineEditor.$htmlContent.find(".related-container").length).toBe(0);
            });
    
            it("should contain a rule list widget displaying info for each rule", function () {
                var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n"),
                    inlineDocName = inlineDoc.file.name;
                
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
                expect($($ruleListItems.get(0)).text()).toBe("div — " + inlineDocName + " : 1");
                expect($($ruleListItems.get(1)).text()).toBe(".foo — " + inlineDocName + " : 2");

                // Messages div should be hidden, editor holder should have a child editor.
                expect(inlineEditor.$htmlContent.find(".inline-editor-message").length).toBe(0);
                expect(inlineEditor.$htmlContent.find(".inline-editor-holder").children().length).toBe(1);
                
                // Rule list should be visible.
                expect(inlineEditor.$htmlContent.find(".related-container").length).toBe(1);
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
    
            it("should retrieve all rules", function () {
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
            
            it("should add a new range after other ranges from the same doc, then select it", function () {
                var doc1 = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n"),
                    doc2 = SpecRunnerUtils.createMockDocument("#bar{}\n"),
                    mockRanges = [
                        {
                            document: doc1,
                            name: "div",
                            lineStart: 0,
                            lineEnd: 0
                        },
                        {
                            document: doc2,
                            name: "#bar",
                            lineStart: 0,
                            lineEnd: 0
                        }
                    ];
                
                inlineEditor = new MultiRangeInlineEditor(mockRanges);
                inlineEditor.load(hostEditor);
                
                inlineEditor.addAndSelectRange(".foo", doc1, 1, 1);
                
                var newRanges = inlineEditor._getRanges();
                expect(newRanges.length).toBe(3);
                expect(inlineEditor._getSelectedRange()).toBe(newRanges[1]);
                expectResultItemToEqual(newRanges[0], mockRanges[0]);
                expectResultItemToEqual(newRanges[1], {
                    document: doc1,
                    name: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                });
                expectResultItemToEqual(newRanges[2], mockRanges[1]);
                
                expect(inlineEditor.editor.document).toBe(doc1);
                expect(inlineEditor.editor.getFirstVisibleLine()).toBe(1);
                expect(inlineEditor.editor.getLastVisibleLine()).toBe(1);
            });

            it("should add a new range at the end if there are no other ranges from the same doc", function () {
                var doc1 = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n"),
                    doc2 = SpecRunnerUtils.createMockDocument("#bar{}\n"),
                    mockRanges = [
                        {
                            document: doc1,
                            name: "div",
                            lineStart: 0,
                            lineEnd: 0
                        },
                        {
                            document: doc1,
                            name: ".foo",
                            lineStart: 1,
                            lineEnd: 1
                        }
                    ];
                
                inlineEditor = new MultiRangeInlineEditor(mockRanges);
                inlineEditor.load(hostEditor);
                
                inlineEditor.addAndSelectRange("#bar", doc2, 0, 0);
                
                var newRanges = inlineEditor._getRanges();
                expect(newRanges.length).toBe(3);
                expect(inlineEditor._getSelectedRange()).toBe(newRanges[2]);
                expectResultItemToEqual(newRanges[0], mockRanges[0]);
                expectResultItemToEqual(newRanges[1], mockRanges[1]);
                expectResultItemToEqual(newRanges[2], {
                    document: doc2,
                    name: "#bar",
                    lineStart: 0,
                    lineEnd: 0
                });
                
                expect(inlineEditor.editor.document).toBe(doc2);
                expect(inlineEditor.editor.getFirstVisibleLine()).toBe(0);
                expect(inlineEditor.editor.getLastVisibleLine()).toBe(0);
            });
            
            it("should properly refresh the editor if the range is inserted at the currently selected index", function () {
                var doc1 = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n"),
                    doc2 = SpecRunnerUtils.createMockDocument("#bar{}\n"),
                    mockRanges = [
                        {
                            document: doc1,
                            name: "div",
                            lineStart: 0,
                            lineEnd: 0
                        },
                        {
                            document: doc2,
                            name: "#bar",
                            lineStart: 0,
                            lineEnd: 0
                        }
                    ];
                
                inlineEditor = new MultiRangeInlineEditor(mockRanges);
                inlineEditor.load(hostEditor);
                
                inlineEditor.setSelectedIndex(1);
                inlineEditor.addAndSelectRange(".foo", doc1, 1, 1);
                
                var newRanges = inlineEditor._getRanges();
                expect(newRanges.length).toBe(3);
                expect(inlineEditor._getSelectedRange()).toBe(newRanges[1]);
                expectResultItemToEqual(newRanges[0], mockRanges[0]);
                expectResultItemToEqual(newRanges[1], {
                    document: doc1,
                    name: ".foo",
                    lineStart: 1,
                    lineEnd: 1
                });
                expectResultItemToEqual(newRanges[2], mockRanges[1]);
                
                expect(inlineEditor.editor.document).toBe(doc1);
                expect(inlineEditor.editor.getFirstVisibleLine()).toBe(1);
                expect(inlineEditor.editor.getLastVisibleLine()).toBe(1);
            });
            
            it("should show the rule list if a range is added when only one range existed before", function () {
                var doc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n"),
                    mockRanges = [
                        {
                            document: doc,
                            name: "div",
                            lineStart: 0,
                            lineEnd: 0
                        }
                    ];
                
                inlineEditor = new MultiRangeInlineEditor(mockRanges);
                inlineEditor.load(hostEditor);
                expect(inlineEditor.$htmlContent.find(".related-container").length).toBe(0);
                
                inlineEditor.addAndSelectRange(".foo", doc, 1, 1);
                expect(inlineEditor.$htmlContent.find(".related-container").length).toBe(1);
            });

            it("should be empty if no ranges are specified", function () {
                inlineEditor = new MultiRangeInlineEditor([]);
                inlineEditor.load(hostEditor);
                
                // There are no ranges to select.
                expect(inlineEditor._selectedRangeIndex).toBe(-1);
                expect(inlineEditor.editor).toBeNull();
                
                // Messages div should be visible, editors div should have no child editor.
                expect(inlineEditor.$htmlContent.find(".inline-editor-message").length).toBe(1);
                expect(inlineEditor.$htmlContent.find(".inline-editor-holder").children().length).toBe(0);
                
                // Rule list should be invisible.
                expect(inlineEditor.$htmlContent.find(".related-container").length).toBe(0);
            });
        });
        
        describe("integration", function () {
            
            this.category = "integration";
            
            var testWindow,
                TWCommandManager,
                TWEditorManager,
                TWMultiRangeInlineEditor;

            beforeFirst(function () {
                SpecRunnerUtils.createTempDirectory();
    
                // Create a new window that will be shared by ALL tests in this spec.
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
    
                    // Load module instances from brackets.test
                    TWCommandManager         = testWindow.brackets.test.CommandManager;
                    TWEditorManager          = testWindow.brackets.test.EditorManager;
                    TWMultiRangeInlineEditor = testWindow.brackets.test.MultiRangeInlineEditor;
    
                    SpecRunnerUtils.loadProjectInTestWindow(SpecRunnerUtils.getTempDirectory());
                });
            });
            
            afterLast(function () {
                testWindow               = null;
                TWCommandManager         = null;
                TWEditorManager          = null;
                TWMultiRangeInlineEditor = null;
                SpecRunnerUtils.closeTestWindow();
                
                SpecRunnerUtils.removeTempDirectory();
            });
    
            beforeEach(function () {
                runs(function () {
                    waitsForDone(TWCommandManager.execute(Commands.FILE_NEW_UNTITLED));
                });
                
                runs(function () {
                    hostEditor = TWEditorManager.getCurrentFullEditor();
                });
            });
            
            afterEach(function () {
                runs(function () {
                    waitsForDone(TWCommandManager.execute(Commands.FILE_CLOSE, { _forceClose: true }));
                });
                
                runs(function () {
                    inlineEditor = null;
                    hostEditor = null;
                });
            });

            // This needs to open in a Brackets test window because it's actually relying on
            // the real Editor functions for adding an inline widget, which complete asynchronously
            // after the animation is finished. That animation doesn't actually occur in the
            // Jasmine window.
            it("should close and return to the host editor", function () {
                runs(function () {
                    var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n");
                    
                    var mockRanges = [
                        {
                            document: inlineDoc,
                            name: "div",
                            lineStart: 0,
                            lineEnd: 0
                        }
                    ];
                    
                    inlineEditor = new TWMultiRangeInlineEditor(mockRanges);
                    inlineEditor.load(hostEditor);
                
                    // add widget
                    waitsForDone(hostEditor.addInlineWidget({line: 0, ch: 0}, inlineEditor));
                });
                
                runs(function () {
                    // verify it was added
                    expect(hostEditor.hasFocus()).toBe(false);
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                
                    // close the inline editor directly, should call EditorManager and removeInlineWidget
                    waitsForDone(inlineEditor.close());
                });
                
                runs(function () {
                    // verify no editors
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                    expect(hostEditor.hasFocus()).toBe(true);
                });
            });
            
            it("should be able to add an inline editor with no ranges", function () {
                runs(function () {
                    inlineEditor = new TWMultiRangeInlineEditor([]);
                    inlineEditor.load(hostEditor);
                    waitsForDone(hostEditor.addInlineWidget({line: 0, ch: 0}, inlineEditor), "adding empty inline editor");
                });
                
                runs(function () {
                    // verify it was added
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    waitsForDone(inlineEditor.close(), "closing empty inline editor");
                });
                
                runs(function () {
                    // verify no editors
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
            });
        });
        
    });
});
