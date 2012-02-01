/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';
    
    var EditorUtils = require("EditorUtils");

    describe("Editor", function () {
        var content = 'Brackets is going to be awesome!\n';

        describe("CodeMirror", function () {
            var myCodeMirror;

            beforeEach(function () {
                // init CodeMirror instance
                $("body").append("<div id='editor'/>");
                myCodeMirror = new CodeMirror($("#editor").get(0), {
                    value: content
                });
            });

            afterEach(function () {
                $("#editor").remove();
                myCodeMirror = null;
            });

            it("should initialize with content", function () {
                // verify editor content
                expect(myCodeMirror.getValue()).toEqual(content);
            });
            
            describe("Modes", function () {
                it("should switch to the HTML mode for files ending in .html", function () {
                    // verify editor content
                    EditorUtils.setModeFromFileExtension(myCodeMirror, "file:///only/testing/the/path.html");
                    expect(myCodeMirror.getOption("mode")).toEqual("htmlmixed");
                });
                
                it("should switch modes even if the url has a query string", function () {
                    // verify editor content
                    EditorUtils.setModeFromFileExtension(myCodeMirror, "http://only.org/testing/the/path.css?v=2");
                    expect(myCodeMirror.getOption("mode")).toEqual("css");
                });
                
                it("should accecpt just a file name too", function () {
                    // verify editor content
                    EditorUtils.setModeFromFileExtension(myCodeMirror, "path.js");
                    expect(myCodeMirror.getOption("mode")).toEqual("javascript");
                });

                it("should default to plaintext for unknown file extensions", function () {
                    // verify editor content
                    EditorUtils.setModeFromFileExtension(myCodeMirror, "test.foo");
                    expect(myCodeMirror.getOption("mode")).toEqual("");
                });
            });
        });
    });
});
