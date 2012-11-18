/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
   
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        Editor          = brackets.getModule("editor/Editor").Editor,
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        CSSCodeHints    = require("main");
    
    describe("CSS Code Hinting", function () {

        var defaultContent = "body { \n" +
                             "    width: 300px; \n" +
                             "    position: relative; \n" +
                             "    \n" +
                             "} \n" +
                             "h1 { }\n";
        
        var testWindow;
        var testDocument, testEditor;
        
        beforeEach(function () {
            // create dummy Document for the Editor
            testDocument = SpecRunnerUtils.createMockDocument(defaultContent);
            
            // create Editor instance (containing a CodeMirror instance)
            $("body").append("<div id='editor'/>");
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

        
        // Expect hintList to contain attribute names, starting with given value (if unspecified, expects the default unfilered list)
        function verifyAttrHints(hintList, expectedFirstHint) {
            expect(hintList.indexOf("div")).toBe(-1);   // make sure tag names aren't sneaking in there
            
            expect(hintList[0]).toBe(expectedFirstHint);
        }        

        describe("CSS attributes in general (selection of correct attribute based on input)", function () {
            var defaultContent = ".selector {\n" +
                                 " \n" +
                                 " b\n" +
                                 " bord\n" +
                                 " border-\n" +
                                 " border-colo\n" +
                                 "} \n";
                    
            beforeEach(function () {
                // create dummy Document for the Editor
                testDocument = SpecRunnerUtils.createMockDocument(defaultContent);
                
                // create Editor instance (containing a CodeMirror instance)
                $("body").append("<div id='editor'/>");
                testEditor = new Editor(testDocument, true, "css", $("#editor").get(0), {});
            });
            
            
            
            it("should list all hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 0, ch: 11 });    // inside h1, after {
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"
            });
            
            it("should list all hints in new line", function () {
                testEditor.setCursorPos({ line: 1, ch: 1 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "align-content");  // filtered on "empty string"
            });

            it("should list all hints starting with 'b' in new line", function () {
                testEditor.setCursorPos({ line: 2, ch: 2 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "backface-visibility");  // filtered on "b"
            });            

            it("should list all hints starting with 'bord' ", function () {
                testEditor.setCursorPos({ line: 3, ch: 5 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "border");  // filtered on "bord"
            });

            it("should list all hints starting with 'border-' ", function () {
                testEditor.setCursorPos({ line: 4, ch: 8 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "border-collapse");  // filtered on "border-"
            });

            it("should list only hint border-color", function () {
                testEditor.setCursorPos({ line: 5, ch: 12 });
                
                var hintList = expectHints(CSSCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "border-color");  // filtered on "border-color"  
                expect(hintList.length).toBe(1);
            });
            
        });        
        
        
        describe("CSS attribute hint provider in .css files", function () {
            
            it("should list hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 5, ch: 4 });    // inside h1, after {
                expectHints(CSSCodeHints.attrHintProvider);
            });
            
            it("should list hints at end of existing attribute+value", function () {
                testEditor.setCursorPos({ line: 1, ch: 17 });    // after ; in first line
                expectHints(CSSCodeHints.attrHintProvider);
            });
            
            it("should NOT list hints right before curly bracket", function () {
                testEditor.setCursorPos({ line: 5, ch: 3 });    // inside h1, before {
                expectNoHints(CSSCodeHints.attrHintProvider);
            });
        });
        
        describe("CSS attribute hint provider inside mixed htmlfiles", function () {
            var defaultContent = "<html> \n"+
                                 "<head></head> \n"+
                                 "<body> <style> \n"+
                                 " body { \n"+
                                 "    background-color: red; \n"+
                                 " \n"+ 
                                 "} \n"+
                                 "</style></body></html>";
                    
            beforeEach(function () {
                // create dummy Document for the Editor
                testDocument = SpecRunnerUtils.createMockDocument(defaultContent);
                
                // create Editor instance (containing a CodeMirror instance)
                $("body").append("<div id='editor'/>");
                testEditor = new Editor(testDocument, true, "hmtlmixed", $("#editor").get(0), {});
            });
            
            it("should list hints right after curly bracket", function () {
                testEditor.setCursorPos({ line: 3, ch: 7 });    // inside h1, after {
                expectHints(CSSCodeHints.attrHintProvider);
            }); 
  
            it("should NOT list hints right before curly bracket", function () {
                testEditor.setCursorPos({ line: 3, ch: 6 });    // inside h1, after {
                expectNoHints(CSSCodeHints.attrHintProvider);
            });             

            it("should NOT inside head-tag", function () {
                testEditor.setCursorPos({ line: 1, ch: 6 });    // between <head> and </head> {
                expectNoHints(CSSCodeHints.attrHintProvider);
            }); 
            
        });
        
    });
});