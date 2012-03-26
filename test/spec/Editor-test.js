/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';
    
    var Editor          = require("editor/Editor").Editor,
        SpecRunnerUtils = require("./SpecRunnerUtils.js"),
        EditorUtils     = require("editor/EditorUtils");

    describe("Editor", function () {
        var content = 'Brackets is going to be awesome!\n';

        var myDocument, myEditor;
        beforeEach(function () {
            // create dummy Document for the Editor
            myDocument = SpecRunnerUtils.createMockDocument(content);
            
            // create Editor instance (containing a CodeMirror instance)
            $("body").append("<div id='editor'/>");
            myEditor = new Editor(myDocument, true, "", $("#editor").get(0), {});
        });

        afterEach(function () {
            myEditor.destroy();
            myEditor = null;
            $("#editor").remove();
            myDocument = null;
        });
        

        describe("Editor wrapper", function () {

            it("should initialize with content", function () {
                // verify editor content
                expect(myEditor._getText()).toEqual(content);
            });
            
            // FUTURE: this should really be in a Document unit test, but there's no "official"
            // way to create the model for a Document without manually creating an Editor, so we're
            // testing this here for now until we get a real central model.
            it("should trigger a synchronous Document change event when an edit is performed", function () {
                var changeFired = false;
                function changeHandler(event, doc, changeList) {
                    $(myDocument).off("change", changeHandler);
                    changeFired = true;
                    expect(doc).toBe(myDocument);
                    expect(changeList.from).toEqual({line: 0, ch: 0});
                    expect(changeList.to).toEqual({line: 1, ch: 0});
                    expect(changeList.text).toEqual(["new content"]);
                    expect(changeList.next).toBe(undefined);
                }
                $(myDocument).on("change", changeHandler);
                myEditor._setText("new content");
                expect(changeFired).toBe(true);
            });

        });
            
        describe("File extension to mode mapping", function () {
            
            it("should switch to the HTML mode for files ending in .html", function () {
                // verify editor content
                var mode = EditorUtils.getModeFromFileExtension("file:///only/testing/the/path.html");
                expect(mode).toEqual("htmlmixed");
            });
            
            it("should switch modes even if the url has a query string", function () {
                // verify editor content
                var mode = EditorUtils.getModeFromFileExtension("http://only.org/testing/the/path.css?v=2");
                expect(mode).toEqual("css");
            });
            
            it("should accecpt just a file name too", function () {
                // verify editor content
                var mode = EditorUtils.getModeFromFileExtension("path.js");
                expect(mode).toEqual("javascript");
            });

            it("should default to plaintext for unknown file extensions", function () {
                // verify editor content
                var mode = EditorUtils.getModeFromFileExtension("test.foo");
                expect(mode).toEqual("");
            });
        });
        
        describe("Focus", function () {
            
            it("should not have focus until explicitly set", function () {
                expect(myEditor.hasFocus()).toBe(false);
            });
            
            it("should be able to detect when it has focus", function () {
                myEditor.focus();
                expect(myEditor.hasFocus()).toBe(true);
            });
        });
    });
});
