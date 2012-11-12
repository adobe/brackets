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
        
        
        describe("CSS attribute hint provider in .css files", function () {
            
            it("should list hints after curly bracket", function () {
                testEditor.setCursorPos({line:5, ch:4});    // inside h1, after {

                expect(true).toBe(false);
            });
            
            it("should list hints at end of existing attribute+value", function () {
                expect(true).toBe(false);
            });
        });
    });
});