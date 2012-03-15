/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';
    
    var Editor          = require("Editor").Editor,
        SpecRunnerUtils = require("./SpecRunnerUtils.js"),
        EditorUtils     = require("EditorUtils");

    describe("Editor", function () {
        var content = 'Brackets is going to be awesome!\n';

        var myDocument, myEditor;
        beforeEach(function () {
            // create dummy Document for the Editor
            myDocument = SpecRunnerUtils.createDummyDocument(content);
            
            // create Editor instance (containing a CodeMirror instance)
            $("body").append("<div id='editor'/>");
            myEditor = new Editor(myDocument, "", $("#editor").get(0), {});
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
