/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
   
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        CSSCodeHints    = require("main");
       
    describe("CSS Code Hinting", function () {

        var defaultContent = "@media screen { \n" +
                             " body { \n" +
                             " }\n" +
                             "} \n" +
                             ".selector { \n" +
                             " \n" +
                             " b\n" +
                             " bord\n" +
                             " border-\n" +
                             " border-colo\n" +
                             " border-color: red;\n" +      // line: 10
                             " d\n" +
                             " disp\n" +
                             " display: \n" +
                             " display: in\n" +
                             " bordborder: \n" +
                             " color\n" +
                             "} \n";
        
        var testDocument, testEditor;
    
        // Ask provider for hints at current cursor position; expect it to return some
        function expectHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(true);
            var hintsObj = provider.getHints();
            expect(hintsObj).not.toBeNull();
            return hintsObj.hints; // return just the array of hints
        }
        
        // Ask provider for hints at current cursor position; expect it NOT to return any
        function expectNoHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(false);
        }
    
        function verifyAttrHints(hintList, expectedFirstHint) {
            expect(hintList.indexOf("div")).toBe(-1);
            expect(hintList[0]).toBe(expectedFirstHint);
        }
            
        function selectHint(provider, expectedHint) {
            var hintList = expectHints(provider);
            expect(hintList.indexOf(expectedHint)).not.toBe(-1);
            return provider.insertHint(expectedHint);
        }
        
        // Helper function for testing cursor position
        function expectCursorAt(pos) {
            var selection = testEditor.getSelection();
            expect(selection.start).toEqual(selection.end);
            expect(selection.start).toEqual(pos);
        }
        
        describe("CSS attributes in general (selection of correct attribute based on input)", function () {
   
            beforeEach(function () {
                // create Editor instance (containing a CodeMirror instance)
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "css");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            it("should list all prop-name hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 4, ch: 11 });    // after {
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"
            });
            
            it("should list all prop-namehints in new line", function () {
                testEditor.setCursorPos({ line: 5, ch: 1 });
                
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"
            });

            it("should list all prop-name hints starting with 'b' in new line", function () {
                testEditor.setCursorPos({ line: 6, ch: 2 });
                
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "backface-visibility");  // filtered on "b"
            });

            it("should list all prop-name hints starting with 'bord' ", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 6, ch: 2 });

                testEditor.setCursorPos({ line: 7, ch: 5 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "border");  // filtered on "bord"
            });

            it("should list all prop-name hints starting with 'border-' ", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 7, ch: 5 });
                
                testEditor.setCursorPos({ line: 8, ch: 8 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "border-bottom");  // filtered on "border-"
            });

            it("should list only prop-name hint border-color", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 8, ch: 8 });

                testEditor.setCursorPos({ line: 9, ch: 12 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "border-color");  // filtered on "border-color"  
                expect(hintList.length).toBe(1);
            });
            
            it("should list prop-name hints at end of property-value finished by ;", function () {
                testEditor.setCursorPos({ line: 10, ch: 19 });    // after ;
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"    
            });
            
            it("should NOT list prop-name hints right before curly bracket", function () {
                testEditor.setCursorPos({ line: 4, ch: 10 });    // inside .selector, before {
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
            it("should NOT list prop-name hints after declaration of mediatype", function () {
                testEditor.setCursorPos({ line: 0, ch: 15 });    // after {
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
            it("should NOT list prop-name hints if previous property is not closed properly", function () {
                testEditor.setCursorPos({ line: 16, ch: 6 });   // cursor directly after color
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
        });

        describe("CSS attribute insertHint", function () {
            beforeEach(function () {
                // create Editor instance (containing a CodeMirror instance)
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "css");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            it("should insert colon prop-name selected", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 6, ch: 2 });
                
                testEditor.setCursorPos({ line: 7, ch: 5 });   // cursor after 'bord'
                selectHint(CSSCodeHints.cssPropHintProvider, "border");
                expect(testDocument.getLine(7)).toBe(" border:");
                expectCursorAt({ line: 7, ch: 8 });
            });
            
            it("should not insert semicolon after prop-value selected", function () {
                testDocument.replaceRange(";", { line: 12, ch: 5 });
                testEditor.setCursorPos({ line: 13, ch: 10 });   // cursor after 'display: '
                selectHint(CSSCodeHints.cssPropHintProvider, "block");
                expect(testDocument.getLine(13)).toBe(" display: block");
            });
            
            it("should insert prop-name directly after semicolon", function () {
                testEditor.setCursorPos({ line: 10, ch: 19 });   // cursor after red;
                selectHint(CSSCodeHints.cssPropHintProvider, "align-content");
                expect(testDocument.getLine(10)).toBe(" border-color: red;align-content:");
            });
            
            it("should insert nothing but the closure(semicolon) if prop-value is fully written", function () {
                testDocument.replaceRange(";", { line: 15, ch: 13 }); // insert text ;
                testEditor.setCursorPos({ line: 16, ch: 6 });   // cursor directly after color
                selectHint(CSSCodeHints.cssPropHintProvider, "color");
                expect(testDocument.getLine(16)).toBe(" color:");
                expectCursorAt({ line: 16, ch: 7 });
            });
            
            xit("should start new hinting whenever there is a whitespace last stringliteral", function () {
                // topic: multi-value properties
                // this needs to be discussed, whether or not this behaviour is aimed for
                // if so, changes to CSSUtils.getInfoAt need to be done imho to classify this 
                testDocument.replaceRange(" ", { line: 16, ch: 6 }); // insert whitespace after color
                testEditor.setCursorPos({ line: 16, ch: 7 });   // cursor one whitespace after color
                selectHint(CSSCodeHints.cssPropHintProvider, "color");
                expect(testDocument.getLine(16)).toBe(" color color:");
                expectCursorAt({ line: 16, ch: 13 });
            });
        });

        describe("CSS prop-value hints", function () {
            beforeEach(function () {
                // create Editor instance (containing a CodeMirror instance)
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "css");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            it("should list all prop-values for 'display' after colon", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 12, ch: 5 });
                
                testEditor.setCursorPos({ line: 13, ch: 9 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "block");  // filtered after "display:"
            });

            it("should list all prop-values for 'display' after colon and whitespace", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 12, ch: 5 });
                
                testEditor.setCursorPos({ line: 13, ch: 10 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "block");  // filtered after "display: "
            });

            it("should list all prop-values starting with 'in' for 'display' after colon and whitespace", function () {
                // insert semicolon after previous rule to avoid incorrect tokenizing
                testDocument.replaceRange(";", { line: 13, ch: 10 });
                
                testEditor.setCursorPos({ line: 14, ch: 12 });
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "inherit");  // filtered after "display: in"
            });
            
            it("should NOT list prop-value hints for unknown prop-name", function () {
                testEditor.setCursorPos({ line: 15, ch: 12 });  // at bordborder:
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
        });
        
        describe("CSS hint provider inside mixed htmlfiles", function () {
            var defaultContent = "<html> \n" +
                                 "<head><style>.selector{display: none;}</style></head> \n" +
                                 "<body> <style> \n" +
                                 " body { \n" +
                                 "    background-color: red; \n" +
                                 " \n" +
                                 "} \n" +
                                 "</style>\n" +
                                 "<div class='selector'></div>\n" +
                                 "<style> .foobar { \n" +
                                 " colo </style>\n" +
                                 "</body></html>";
                    
            beforeEach(function () {
                // create dummy Document for the Editor
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "htmlmixed");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
                
            it("should list prop-name hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 3, ch: 7 });  // inside body-selector, after {
                expectHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should list prop-name hints inside single-line styletags at start", function () {
                testEditor.setCursorPos({ line: 1, ch: 23 });  // inside style, after {
                expectHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should list prop-name hints inside single-line styletags after semicolon", function () {
                testEditor.setCursorPos({ line: 1, ch: 37 });  // inside style, after ;
                expectHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should list prop-name hints inside multi-line styletags with cursor in first line", function () {
                testEditor.setCursorPos({ line: 9, ch: 18 });   // inside style, after {
                expectHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should list prop-name hints inside multi-line styletags with cursor in last line", function () {
                testEditor.setCursorPos({ line: 10, ch: 5 });    // inside style, after colo
                var hintList = expectHints(CSSCodeHints.cssPropHintProvider);
                verifyAttrHints(hintList, "color");  // filtered on "colo"
                expect(hintList.length).toBe(1);
            });
            
            it("should NOT list prop-name hints between closed styletag and new opening styletag", function () {
                testEditor.setCursorPos({ line: 8, ch: 0 });    // right before <div
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
            it("should NOT list hints right before curly bracket", function () {
                testEditor.setCursorPos({ line: 3, ch: 6 });    // inside body-selector, before {
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });

            it("should NOT list hints inside head-tag", function () {
                testEditor.setCursorPos({ line: 1, ch: 6 });    // between <head> and </head> {
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
            
        });
          
        describe("CSS hint provider in other filecontext (e.g. javascript)", function () {
            var defaultContent = "function foobar (args) { \n " +
                                 "    /* do sth */ \n" +
                                 "    return 1; \n" +
                                 "} \n";
            beforeEach(function () {
                // create dummy Document for the Editor
                var mock = SpecRunnerUtils.createMockEditor(defaultContent, "javascript");
                testEditor = mock.editor;
                testDocument = mock.doc;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
            
            it("should NOT list hints after function declaration", function () {
                testEditor.setCursorPos({ line: 0, ch: 24 });    // after {  after function declaration
                expectNoHints(CSSCodeHints.cssPropHintProvider);
            });
        });
    });
});