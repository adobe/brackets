/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
   
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        Editor          = brackets.getModule("editor/Editor").Editor,
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        CSSCodeHints    = require("main");
    
    /* set indentation to one, to make use of tabs for the following testContent */
    Editor.setIndentUnit(1);
    
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
                             " border-color: red;\n" +
                             " d\n" +
                             " disp\n" +
                             " display: \n" +
                             " display: in\n" +
                             " bordborder: \n" +
                             "} \n";
        
        var testWindow;
        var testDocument, testEditor;
        
        beforeEach(function () {
            // create Editor instance (containing a CodeMirror instance)
            $("body").append("<div id='editor'/>");
            
            // create dummy Document for the Editor
            testDocument = SpecRunnerUtils.createMockDocument(defaultContent);
            testEditor = new Editor(testDocument, true, "css", $("#editor").get(0), {});
        });
        
        afterEach(function () {
            testEditor.destroy();
            testEditor = null;
            $("#editor").remove();
            testDocument = null;
        });
    
        
        // Ask provider for hints at current cursor position; expect it to return some
        function expectHints(provider) {
            var query = provider.getQueryInfo(testEditor, testEditor.getCursorPos());
            expect(query).toBeTruthy();
            expect(query.queryStr).not.toBeNull();
            
            var hintList = provider.search(query);
            expect(hintList).toBeTruthy();
            
            return hintList;
        }
        
        // Ask provider for hints at current cursor position; expect it NOT to return any
        function expectNoHints(provider) {
            var query = provider.getQueryInfo(testEditor, testEditor.getCursorPos());
            expect(query).toBeTruthy();
            expect(query.queryStr).toBeNull();
        }

        
        // Expect hintList to contain attribute names, starting with given value
        function verifyAttrHints(hintList, expectedFirstHint) {
            expect(hintList.indexOf("div")).toBe(-1);   // make sure tag names aren't sneaking in there
            
            expect(hintList[0]).toBe(expectedFirstHint);
        }
        
            
        function selectHint(provider, expectedHint) {
            var hintList = expectHints(provider);
            expect(hintList.indexOf(expectedHint)).not.toBe(-1);
            provider.handleSelect(expectedHint, testEditor, testEditor.getCursorPos(), true);
        }
        
        // Helper function for testing cursor position
        function expectCursorAt(pos) {
            var selection = testEditor.getSelection();
            expect(selection.start).toEqual(selection.end);
            expect(selection.start).toEqual(pos);
        }
        
        describe("CSS attributes in general (selection of correct attribute based on input)", function () {
   
            it("should list all hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 4, ch: 11 });    // after {
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"
            });
            
            it("should list all hints in new line", function () {
                testEditor.setCursorPos({ line: 5, ch: 1 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"
            });

            it("should list all hints starting with 'b' in new line", function () {
                testEditor.setCursorPos({ line: 6, ch: 2 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "backface-visibility");  // filtered on "b"
            });

            it("should list all hints starting with 'bord' ", function () {
                testEditor.setCursorPos({ line: 7, ch: 5 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "border");  // filtered on "bord"
            });

            it("should list all hints starting with 'border-' ", function () {
                testEditor.setCursorPos({ line: 8, ch: 8 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "border-collapse");  // filtered on "border-"
            });

            it("should list only hint border-color", function () {
                testEditor.setCursorPos({ line: 9, ch: 12 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "border-color");  // filtered on "border-color"  
                expect(hintList.length).toBe(1);
            });
            
            it("should list hints at end of existing attribute+value finished by ;", function () {
                testEditor.setCursorPos({ line: 10, ch: 19 });    // after ;
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"    
            });
       
            it("should list hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 4, ch: 11 });    // inside .selector, after {
                expectHints(CSSCodeHints.attrHintProvider);
            });
            
            it("should NOT list hints right before curly bracket", function () {
                testEditor.setCursorPos({ line: 4, ch: 10 });    // inside .selector, before {
                expectNoHints(CSSCodeHints.attrHintProvider);
            });
            it("should NOT list hints after declaration of mediatype", function () {
                testEditor.setCursorPos({ line: 0, ch: 15 });    // after {
                expectNoHints(CSSCodeHints.attrHintProvider);
            });
        });
        
        
        describe("CSS attribute handleSelect", function () {
            it("should insert colon followd by whitespace after attribute", function () {
                testEditor.setCursorPos({ line: 7, ch: 5 });   // cursor after 'bord'
                selectHint(CSSCodeHints.attrHintProvider, "border");
                expect(testDocument.getLine(7)).toBe(" border: ");
                expectCursorAt({ line: 7, ch: 9 });
            });
            
            it("should insert semicolon followed by newline after value added", function () {
                testEditor.setCursorPos({ line: 13, ch: 10 });   // cursor after 'display: '
                selectHint(CSSCodeHints.attrHintProvider, "block");
                expect(testDocument.getLine(13)).toBe(" display: block;");
                // expectCursorAt({ line: 10, ch: 4 });
            });
            
            it("should insert attribute directly after semicolon ", function () {
                testEditor.setCursorPos({ line: 10, ch: 19 });   // cursor after red;
                selectHint(CSSCodeHints.attrHintProvider, "align-content");
                expect(testDocument.getLine(10)).toBe(" border-color: red;align-content: ");
                // expectCursorAt({ line: 10, ch: 4 });
            });

        });

        describe("CSS attribute value hints", function () {
            it("should list all display-values after colon", function () {
                testEditor.setCursorPos({ line: 13, ch: 9 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "block");  // filtered after "display:"
            });

            it("should list all display-values after colon and whitespace", function () {
                testEditor.setCursorPos({ line: 13, ch: 10 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "block");  // filtered after "display: "
            });

            it("should list all display-values after colon and whitespace", function () {
                testEditor.setCursorPos({ line: 14, ch: 12 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "inline");  // filtered after "display: in"
            });
            
            it("should NOT list hints for unknown attribute", function () {
                testEditor.setCursorPos({ line: 15, ch: 12 });    // at borborder:
                
                /* expectNoHints doesn't work here, since the input is the empty string, and the attribute is 'borborder' */
                /* query.queryStr is NOT null, but the search is still empty, so we need to check the result of search instead */
                var query = CSSCodeHints.attrHintProvider.getQueryInfo(testEditor, testEditor.getCursorPos());
                expect(query).toBeTruthy();
                expect(query.queryStr).not.toBeNull();
                var hintList = CSSCodeHints.attrHintProvider.search(query);
                expect(hintList).toBeTruthy();
                expect(hintList.length).toBe(0);
            });
            
        });
        
        describe("CSS attribute hint provider inside mixed htmlfiles", function () {
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
                testDocument = SpecRunnerUtils.createMockDocument(defaultContent);
                testEditor = new Editor(testDocument, true, "htmlmixed", $("#editor").get(0), {});
            });
            
            it("should list hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 3, ch: 7 });    // inside body-selector, after {
                expectHints(CSSCodeHints.attrHintProvider);
            });

            it("should list hints inside oneline styletags at start", function () {
                testEditor.setCursorPos({ line: 1, ch: 23 });    // inside style, after {
                expectHints(CSSCodeHints.attrHintProvider);
            });

            it("should list hints inside oneline styletags after ;", function () {
                testEditor.setCursorPos({ line: 1, ch: 37 });    // inside style, after ;
                expectHints(CSSCodeHints.attrHintProvider);
            });

            it("should list hints inside multiline styletags with cursor in first line", function () {
                testEditor.setCursorPos({ line: 9, ch: 18 });    // inside style, after {
                expectHints(CSSCodeHints.attrHintProvider);
            });

            it("should list hints inside multiline styletags with cursor in last line", function () {
                testEditor.setCursorPos({ line: 10, ch: 5 });    // inside style, after colo
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "color");  // filtered on "colo"
                expect(hintList.length).toBe(1);
            });
            
            it("should NOT list hints between closed styletag and new opening style tag", function () {
                testEditor.setCursorPos({ line: 8, ch: 0 });    // right before <div
                expectNoHints(CSSCodeHints.attrHintProvider);
            });
            
            it("should NOT list hints right before curly bracket", function () {
                testEditor.setCursorPos({ line: 3, ch: 6 });    // inside body-selector, before {
                expectNoHints(CSSCodeHints.attrHintProvider);
            });

            it("should NOT list hints inside head-tag", function () {
                testEditor.setCursorPos({ line: 1, ch: 6 });    // between <head> and </head> {
                expectNoHints(CSSCodeHints.attrHintProvider);
            });
            
        });
        
        
        describe("CSS attribute hint provider in other filecontext (e.g. javascript)", function () {
            var defaultContent = "function foobar (args) { \n " +
                                 "    /* do sth */ \n" +
                                 "    return 1; \n" +
                                 "} \n";
            beforeEach(function () {
                // create dummy Document for the Editor
                testDocument = SpecRunnerUtils.createMockDocument(defaultContent);
                testEditor = new Editor(testDocument, true, "javascript", $("#editor").get(0), {});
            });
            
            it("should NOT list hints after function declaration", function () {
                testEditor.setCursorPos({ line: 0, ch: 24 });    // after {  after function declaration
                expectNoHints(CSSCodeHints.attrHintProvider);
            });
        });
    });
});