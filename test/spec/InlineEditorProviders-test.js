/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false */

define(function (require, exports, module) {
    'use strict';
    
    var Commands,           // loaded from brackets.test
        EditorManager,      // loaded from brackets.test
        FileIndexManager,   // loaded from brackets.test
        DocumentManager,    // loaded from brackets.test
        SpecRunnerUtils = require("./SpecRunnerUtils.js");

    describe("InlineEditorProviders", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/InlineEditorProviders-test-files"),
            testWindow,
            inlineTest = null; /*{infos:[],docs:[]}*/
        
        function initInlineTest(openFile, openOffset, expectInline) {
            var allFiles,
                err = false,
                inlineOpened = null;
            
            expectInline = (expectInline !== undefined) ? expectInline : true;
            
            // load project to set CSSUtils scope
            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });
            
            // find all files in the project
            runs(function () {
                FileIndexManager.getFileInfoList("all")
                    .done(function (result) {
                        allFiles = result;
                    });
            });
            
            waitsFor(function () { return (allFiles !== null); }, "FileIndexManager timeout", 1000);
            
            // rewrite files without offsets
            runs(function () {
                // convert fileInfos to fullPaths
                allFiles = allFiles.map(function (fileInfo) {
                    return fileInfo.fullPath;
                });
                
                // parse offsets and save
                SpecRunnerUtils.saveFilesWithoutOffsets(allFiles).done(function (offsetInfos) {
                    inlineTest.infos = offsetInfos;
                }).fail(function () {
                    err = true;
                });
            });
            
            waitsFor(function () { return (inlineTest.infos !== null) && !err; }, "rewrite timeout", 1000);
            
            runs(function () {
                // open test1.html
                SpecRunnerUtils.openProjectFiles(openFile).done(function (documents) {
                    inlineTest.docs = documents;
                }).fail(function () {
                    err = true;
                });
            });
            
            waitsFor(function () { return (inlineTest.docs !== null) && !err; }, "FILE_OPEN timeout", 1000);
            
            runs(function () {
                // open inline editor at <div...>
                DocumentManager.setCurrentDocument(inlineTest.docs[openFile]);
                var editor = EditorManager.getCurrentFullEditor();
                var inlineEditorResult = SpecRunnerUtils.openInlineEditorAtOffset(
                    editor,
                    inlineTest.infos[openFile].offsets[openOffset]
                );
                
                inlineEditorResult.done(function () {
                    inlineOpened = true;
                }).fail(function () {
                    inlineOpened = false;
                });
            });
            
            waitsFor(function () {
                return (inlineOpened !== null) && (inlineOpened === expectInline);
            }, "inline editor timeout", 1000);
        }

        /*
         * Note that the bulk of selector matching tests are in CSSutils-test.js.
         * These tests are primarily focused on the InlineEditorProvider module.
         */
        describe("htmlToCSSProvider", function () {

            beforeEach(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow          = w;
                    Commands            = testWindow.brackets.test.Commands;
                    EditorManager       = testWindow.brackets.test.EditorManager;
                    FileIndexManager    = testWindow.brackets.test.FileIndexManager;
                    DocumentManager     = testWindow.brackets.test.DocumentManager;
                    inlineTest          = {infos: null, docs: null};
                });
            });
    
            afterEach(function () {
                waits(2000);
                // revert files to original content with offset markup
                SpecRunnerUtils.saveFilesWithOffsets(inlineTest.infos);
                SpecRunnerUtils.closeTestWindow();
            });

            it("Opens a type selector", function () {
                initInlineTest("test1.html", 0);
                
                runs(function () {
                    var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    var inlinePos = inlineData.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(inlineTest.infos["test1.css"].offsets[0]);
                });
            });

            it("Opens a class selector", function () {
                initInlineTest("test1.html", 1);
                
                runs(function () {
                    var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    var inlinePos = inlineData.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(inlineTest.infos["test1.css"].offsets[1]);
                });
            });

            it("Opens an id selector", function () {
                initInlineTest("test1.html", 2);
                
                runs(function () {
                    var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    var inlinePos = inlineData.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(inlineTest.infos["test1.css"].offsets[2]);
                });
            });

            it("Does not open an inline editor when positioned on textContent", function () {
                initInlineTest("test1.html", 3, false);
                
                runs(function () {
                    // verify cursor position in inline editor
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);
                });
            });

            it("Does not open an inline editor when positioned on a tag in a comment", function () {
                initInlineTest("test1.html", 4, false);
                
                runs(function () {
                    // verify cursor position in inline editor
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);
                });
            });
            
            it("Increases size based on content", function () {
                initInlineTest("test1.html", 1);
                
                var inlineData, widgetHeight, inlineDoc;
                
                runs(function () {
                    inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    widgetHeight = inlineData.editor.totalHeight(true);
                    
                    // verify original line count
                    expect(inlineData.editor.lineCount()).toBe(12);
                    
                    DocumentManager.getDocumentForPath(testPath + "/test1.css").done(function (doc) {
                        inlineDoc = doc;
                    });
                });
                
                waitsFor(function () { return inlineDoc !== null; }, "getDocumentForPath timeout", 1000);
                
                runs(function () {
                    // change inline editor content
                    var newLines = ".bar {\ncolor: #f00;\n}\n.cat {\ncolor: #f00;\n}";
                    inlineData.editor._setText(inlineDoc.getText() + newLines);
                    
                    // verify widget resizes when contents is changed
                    expect(inlineData.editor.lineCount()).toBe(17);
                    expect(inlineData.editor.totalHeight(true)).toBeGreaterThan(widgetHeight);
                });
            });
            
            xit("Decreases size based on content", function () {
                initInlineTest("test1.html", 1);
                
                var inlineData, widgetHeight, inlineDoc;
                
                runs(function () {
                    inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    widgetHeight = inlineData.editor.totalHeight(true);
                    
                    // verify original line count
                    expect(inlineData.editor.lineCount()).toBe(12);
                    
                    // change inline editor content
/*
TypeError: Cannot read property 'line' of undefined
    at posEq (file:///Users/jasonsj/Github/brackets-app/brackets/src/thirdparty/CodeMirror2/lib/codemirror.js:3190:33)
*/
                    DocumentManager.getDocumentForPath(testPath + "/test1.css").done(function (doc) {
                        inlineDoc = doc;
                    });
                });
                
                waitsFor(function () { return inlineDoc !== null; }, "getDocumentForPath timeout", 1000);
                
                runs(function () {
                    inlineData.editor._setText("div{}\n");
                    
                    // verify widget resizes when contents is changed
                    expect(inlineData.editor.lineCount()).toBe(2);
                    expect(inlineData.editor.totalHeight(true)).toBeLessThan(widgetHeight);
                });
            });

        });
    });
});
