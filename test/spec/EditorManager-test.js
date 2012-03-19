/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, waits: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';
    
    var DocumentManager     = require("DocumentManager"),
        EditorManager       = require("EditorManager"),
        Editor              = require("Editor").Editor,
        NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        SpecRunnerUtils     = require("./SpecRunnerUtils.js");

    describe("EditorManager", function () {
        var content = 'Brackets is going to be awesome!\n';
        var newCss = "h1 {\n    color: #F00;\n}";
        
        beforeEach(function () {
            this.path = SpecRunnerUtils.getTestPath("/spec/EditorManager-test-files");
        });

        describe("Synchronizing inlines", function () {
            var myEditor;

            beforeEach(function () {
                // init Editor instance (containing a CodeMirror instance)
                $("body").append("<div id='editor'/>");
                var $editorHolder = $("#editor");
                myEditor = new Editor(content, "", $editorHolder.get(0), {});
                EditorManager.setEditorHolder($editorHolder);
                
                newCss = "h1 {\n    color: #F00;\n}";
            });

            afterEach(function () {
                $("#editor").remove();
                myEditor = null;
                EditorManager.setEditorHolder(null);
                
                //Clear out the document manager
                DocumentManager.getWorkingSet().forEach(function (doc) {
                    doc._markClean();
                });
                DocumentManager.closeAll();
            });
            
            it("should not create a doc if no changes where made", function () {
                var fileEntry = new NativeFileSystem.FileEntry(this.path + "/test.css");
                var inlineInfo = EditorManager.createInlineEditorFromText(myEditor, content, null, fileEntry);
                var doc = DocumentManager.getDocumentForFile(fileEntry);
                expect(doc).toBeNull();
            });
            
            it("should create a new doc if it's not open and sync it with the inline text when a change is made", function () {
                var fileEntry = new NativeFileSystem.FileEntry(this.path + "/test.css");
                var inlineInfo = EditorManager.createInlineEditorFromText(myEditor, content, null, fileEntry);
                var doc = DocumentManager.getDocumentForFile(fileEntry);
                expect(doc).toBeNull();
                
                inlineInfo.editor.setText(newCss);
                doc = DocumentManager.getDocumentForFile(fileEntry);
                expect(doc.editor.getText()).toEqual(newCss);
            });
            
            it("should use an already open doc and sync with it from the inline text when a change is made", function () {
                var fileEntry = new NativeFileSystem.FileEntry(this.path + "/test.css");
                var doc = DocumentManager.getOrCreateDocumentForPath(fileEntry.fullPath);
                DocumentManager.addToWorkingSet(doc);
                
                var inlineInfo = EditorManager.createInlineEditorFromText(myEditor, content, null, fileEntry);
                inlineInfo.editor.setText(newCss);
                expect(doc.editor.getText()).toEqual(newCss);
            });
            
            it("should sync even if the contents of the inline are all deleted", function () {
                var fileEntry = new NativeFileSystem.FileEntry(this.path + "/test.css");
                var inlineInfo = EditorManager.createInlineEditorFromText(myEditor, content, null, fileEntry);
                
                inlineInfo.editor.setText("");
                var doc = DocumentManager.getDocumentForFile(fileEntry);
                expect(doc.editor.getText()).toEqual("");
            });
            
            it("should sync after an undoing and redoing an edit", function () {
                var fileEntry = new NativeFileSystem.FileEntry(this.path + "/test.css");
                var doc = DocumentManager.getOrCreateDocumentForPath(fileEntry.fullPath);
                DocumentManager.addToWorkingSet(doc);
                
                var inlineInfo = EditorManager.createInlineEditorFromText(myEditor, content, null, fileEntry);
                inlineInfo.editor.setText(newCss);
                expect(doc.editor.getText()).toEqual(newCss);
                
                inlineInfo.editor._codeMirror.undo();
                expect(doc.editor.getText()).toEqual(content);
                
                inlineInfo.editor._codeMirror.redo();
                expect(doc.editor.getText()).toEqual(newCss);
            });
            
            it("should sync multiple edits in the inline", function () {
                var fileEntry = new NativeFileSystem.FileEntry(this.path + "/test.css");
                var inlineInfo = EditorManager.createInlineEditorFromText(myEditor, content, null, fileEntry);
                var doc = DocumentManager.getOrCreateDocumentForPath(fileEntry.fullPath);
                DocumentManager.addToWorkingSet(doc);
                
                var curText = "";
                var i = 0;
                for (i = 0; i < 10; i++) {
                    inlineInfo.editor.setText(curText);
                    expect(doc.editor.getText()).toEqual(curText);
                    curText = curText + newCss + "\n\n";
                }
            });
            
            
            /* we don't currently support syncing from the other direction, so when that gets
               added, then this unit test should get reversed and more added for that story */
            it("should *NOT* sync changes from the main document back to the inline editor", function () {
                var fileEntry = new NativeFileSystem.FileEntry(this.path + "/test.css");
                var inlineInfo = EditorManager.createInlineEditorFromText(myEditor, content, null, fileEntry);
                
                inlineInfo.editor.setText(newCss);
                var doc = DocumentManager.getDocumentForFile(fileEntry);
                newCss = "h1 {\n    background-color: #0F0;\n}";
                doc.setText(newCss);
                expect(inlineInfo.editor.getText()).not.toEqual(newCss);
            });

        });
    });
});
