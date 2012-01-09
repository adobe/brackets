define(function(require, exports, module) {
    
    describe("Editor", function(){
        var content = 'Brackets is going to be awesome!\n';

        describe("CodeMirror", function() {
            var myCodeMirror;

            beforeEach(function() {
                // init CodeMirror instance
                $("body").append("<div id='editor'/>");
                myCodeMirror = CodeMirror($("#editor").get(0), {
                    value: content
                });
            });

            afterEach(function() {
                $("#editor").remove();
                myCodeMirror = null;
            });

            it("should initialize with content", function() {
                // verify editor content
                expect(myCodeMirror.getValue()).toEqual(content);
            });
            
            describe("Modes", function() {
                it("should switch to the HTML mode for files ending in .html", function() {
                    // verify editor content
                    var EditorUtils = require("EditorUtils");
                    EditorUtils.setModeFromFileExtension(myCodeMirror, "file:///only/testing/the/path.html");
                    expect(myCodeMirror.getOption("mode")).toEqual("text/html");
                });
                
                it("should switch modes even if the url has a query string", function() {
                    // verify editor content
                    var EditorUtils = require("EditorUtils");
                    EditorUtils.setModeFromFileExtension(myCodeMirror, "http://only.org/testing/the/path.css?v=2");
                    expect(myCodeMirror.getOption("mode")).toEqual("text/css");
                });
                
                it("should accecpt just a file name too", function() {
                    // verify editor content
                    var EditorUtils = require("EditorUtils");
                    EditorUtils.setModeFromFileExtension(myCodeMirror, "path.js");
                    expect(myCodeMirror.getOption("mode")).toEqual("text/javascript");
                });
            });
        });
    });
});
