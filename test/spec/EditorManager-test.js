/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, waits: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';
    
    var DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        Editor              = require("editor/Editor").Editor,
        FileUtils           = require("file/FileUtils"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        SpecRunnerUtils     = require("./SpecRunnerUtils.js");

    // TODO: These need to be rewritten for the new inline syncing approach. In particular, the fact that these don't
    // add the inline editor to the DOM is a problem.
    describe("EditorManager", function () {
        
        beforeEach(function () {
            this.path = SpecRunnerUtils.getTestPath("/spec/EditorManager-test-files");
        });

        describe("Synchronizing inlines", function () {
            var htmlDoc = null,
                cssDoc = null,
                myEditor = null,
                newCss = "",
                cssDocRange = { startLine: 2, endLine: 4 };

            beforeEach(function () {
                // init Editor instance (containing a CodeMirror instance)
                $("body").append("<div id='editor'/>");
                var $editorHolder = $("#editor");
                
                DocumentManager.getDocumentForPath(this.path + "/test.html")
                    .done(function (doc) {
                        htmlDoc = doc;
                    });
                
                DocumentManager.getDocumentForPath(this.path + "/test.css")
                    .done(function (doc) {
                        cssDoc = doc;
                    });
                
                waitsFor(function () {
                    return htmlDoc !== null && cssDoc !== null;
                }, "Test files never loaded", 1000);
                
                myEditor = new Editor(htmlDoc, true, "", $editorHolder.get(0), {});
                EditorManager.setEditorHolder($editorHolder);
                
                newCss = "h1 {\n    color: #F00;\n}";
            });

            afterEach(function () {
                myEditor.destroy();
                $("#editor").remove();
                myEditor = null;
                EditorManager.setEditorHolder(null);
                
                htmlDoc._markClean();
                htmlDoc = null;
                
                cssDoc._markClean();
                cssDoc = null;
                
                //Clear out the document manager
                DocumentManager.closeAll();
            });
        });
    });
});
