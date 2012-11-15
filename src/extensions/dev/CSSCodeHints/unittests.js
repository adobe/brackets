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
    });
});