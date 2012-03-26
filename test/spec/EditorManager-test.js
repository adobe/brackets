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
            
            it("should use an already open doc and sync with it from the inline text when a change is made", function () {
                DocumentManager.addToWorkingSet(cssDoc);
                
                var inlineInfo = EditorManager.createInlineEditorForDocument(myEditor, cssDoc, cssDocRange);
                inlineInfo.editor._setText(newCss);
                expect(cssDoc.getText()).toEqual(FileUtils.translateLineEndings(newCss, cssDoc._lineEndings));
            });
            
            it("should sync even if the contents of the inline are all deleted", function () {
                var inlineInfo = EditorManager.createInlineEditorForDocument(myEditor, cssDoc, cssDocRange);
                
                inlineInfo.editor._setText("");
                expect(cssDoc.getText()).toEqual("");
            });
            
            it("should sync after an undoing and redoing an edit", function () {
                var oldCss = cssDoc.getText();
                var inlineInfo = EditorManager.createInlineEditorForDocument(myEditor, cssDoc, cssDocRange);
                
                inlineInfo.editor._setText(newCss);
                expect(cssDoc.getText()).toEqual(FileUtils.translateLineEndings(newCss, cssDoc._lineEndings));
                
                inlineInfo.editor._codeMirror.undo();
                expect(cssDoc.getText()).toEqual(oldCss);
                
                inlineInfo.editor._codeMirror.redo();
                expect(cssDoc.getText()).toEqual(FileUtils.translateLineEndings(newCss, cssDoc._lineEndings));
            });
            
            it("should sync multiple edits in the inline", function () {
                var inlineInfo = EditorManager.createInlineEditorForDocument(myEditor, cssDoc, cssDocRange);
                
                var curText = "";
                var i = 0;
                for (i = 0; i < 10; i++) {
                    inlineInfo.editor._setText(curText);
                    expect(cssDoc.getText()).toEqual(FileUtils.translateLineEndings(curText, cssDoc._lineEndings));
                    curText = curText + newCss + "\n\n";
                }
            });
            
            
            /* we don't currently support syncing from the other direction, so when that gets
               added, then this unit test should get reversed and more added for that story */
            it("should *NOT* sync changes from the main document back to the inline editor", function () {
                var inlineInfo = EditorManager.createInlineEditorForDocument(myEditor, cssDoc, cssDocRange);
                
                inlineInfo.editor._setText(newCss);
                newCss = "h1 {\n    background-color: #0F0;\n}";
                cssDoc.setText(newCss);
                expect(inlineInfo.editor._getText()).not.toEqual(newCss);
            });

        });
    });
});
