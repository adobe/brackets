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
        FileUtils       = require("FileUtils"),
        SpecRunnerUtils = require("./SpecRunnerUtils.js");

    describe("InlineEditorProviders", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/InlineEditorProviders-test-files"),
            testWindow;
        
        /* @type {{infos:Array, docs:Array.<Document>}} */
        var inlineTest = null;
        
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
                //debug visual confirmation of inline editor
                //waits(1000);
                
                // revert files to original content with offset markup
                SpecRunnerUtils.saveFilesWithOffsets(inlineTest.infos);
                SpecRunnerUtils.closeTestWindow();
            });

            it("should open a type selector", function () {
                initInlineTest("test1.html", 0);
                
                runs(function () {
                    var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    var inlinePos = inlineData.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(inlineTest.infos["test1.css"].offsets[0]);
                });
            });

            it("should open a class selector", function () {
                initInlineTest("test1.html", 1);
                
                runs(function () {
                    var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    var inlinePos = inlineData.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(inlineTest.infos["test1.css"].offsets[1]);
                });
            });

            it("should open an id selector", function () {
                initInlineTest("test1.html", 2);
                
                runs(function () {
                    var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    var inlinePos = inlineData.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(inlineTest.infos["test1.css"].offsets[2]);
                });
            });

            it("should close, then remove the inline widget and restore focus", function () {
                initInlineTest("test1.html", 0);
                
                var fullEditor, inlineWidget, inlinePos, savedPos;
                
                runs(function () {
                    fullEditor =  EditorManager.getCurrentFullEditor();
                    savedPos = fullEditor.getCursorPos();
                    inlineWidget = fullEditor.getInlineWidgets()[0];
                    inlinePos = inlineWidget.data.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(inlineTest.infos["test1.css"].offsets[0]);
                    
                    // close the editor
                    EditorManager._closeInlineWidget(fullEditor, inlineWidget.id, true);
                    
                    // verify no inline widgets 
                    expect(fullEditor.getInlineWidgets().length).toBe(0);
                    
                    // verify full editor cursor restored
                    expect(savedPos).toEqual(fullEditor.getCursorPos());
                });
            });

            it("should not open an inline editor when positioned on textContent", function () {
                initInlineTest("test1.html", 3, false);
                
                runs(function () {
                    // verify cursor position in inline editor
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);
                });
            });

            it("should not open an inline editor when positioned on a tag in a comment", function () {
                initInlineTest("test1.html", 4, false);
                
                runs(function () {
                    // verify cursor position in inline editor
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);
                });
            });
            
            it("should increase size based on content", function () {
                initInlineTest("test1.html", 1);
                
                var inlineEditor, widgetHeight, inlineDoc;
                
                runs(function () {
                    inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
                    widgetHeight = inlineEditor.totalHeight(true);
                    
                    // verify original line count
                    expect(inlineEditor.lineCount()).toBe(12);
                    
                    DocumentManager.getDocumentForPath(testPath + "/test1.css").done(function (doc) {
                        inlineDoc = doc;
                    });
                });
                
                waitsFor(function () { return inlineDoc !== null; }, "getDocumentForPath timeout", 1000);
                
                runs(function () {
                    // change inline editor content
                    var newLines = ".bar {\ncolor: #f00;\n}\n.cat {\ncolor: #f00;\n}";
                    
                    // insert new lines at current cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(
                        newLines,
                        inlineEditor.getCursorPos()
                    );
                    
                    // verify widget resizes when contents is changed
                    expect(inlineEditor.lineCount()).toBe(17);
                    expect(inlineEditor.totalHeight(true)).toBeGreaterThan(widgetHeight);
                });
            });
            
            it("should decrease size based on content", function () {
                initInlineTest("test1.html", 1);
                
                var inlineEditor, widgetHeight, inlineDoc;
                
                runs(function () {
                    inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
                    widgetHeight = inlineEditor.totalHeight(true);
                    
                    // verify original line count
                    expect(inlineEditor.lineCount()).toBe(12);
                    
                    // replace the entire .foo rule with an empty string
                    // set text on the editor, can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(
                        "",
                        inlineEditor.getCursorPos(),
                        inlineTest.infos["test1.css"].offsets[3]
                    );
                    
                    // verify widget resizes when contents is changed
                    expect(inlineEditor.lineCount()).toBe(10);
                    expect(inlineEditor.totalHeight(true)).toBeLessThan(widgetHeight);
                });
            });
            
            it("should save changes in the inline editor ", function () {
                initInlineTest("test1.html", 1);
                
                var saved = false,
                    err = false,
                    inlineEditor,
                    inlineDoc,
                    newText = "\n/* jasmine was here */",
                    savedText;
                
                runs(function () {
                    inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
                    DocumentManager.getDocumentForPath(testPath + "/test1.css").done(function (doc) {
                        inlineDoc = doc;
                    });
                });
                
                waitsFor(function () { return inlineDoc !== null; }, "getDocumentForPath timeout", 1000);
                
                runs(function () {
                    // insert text at the inline editor's cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(newText, inlineEditor.getCursorPos());
                    newText = inlineDoc.getText();
                    
                    // execute file save command
                    testWindow.executeCommand(Commands.FILE_SAVE).done(function () {
                        saved = true;
                    }).fail(function () {
                        err = true;
                    });
                });
                
                waitsFor(function () { return saved && !err; }, "save timeout", 1000);
                
                runs(function () {
                    // read saved file contents
                    FileUtils.readAsText(inlineDoc.file).done(function (text) {
                        savedText = text;
                    }).fail(function () {
                        err = true;
                    });
                });
                
                waitsFor(function () { return savedText !== null; }, "readAsText timeout", 1000);
                
                runs(function () {
                    expect(savedText).toEqual(newText);
                });
            });
            
            it("should not save changes in the host editor", function () {
                initInlineTest("test1.html", 1);
                
                var saved = false,
                    err = false,
                    hostEditor,
                    inlineEditor,
                    inlineDoc,
                    newInlineText = "/* jasmine was inline */\n",
                    newHostText = "/* jasmine was here */\n",
                    savedInlineText,
                    savedHostText;
                
                runs(function () {
                    hostEditor = EditorManager.getCurrentFullEditor();
                    inlineEditor = hostEditor.getInlineWidgets()[0].data.editor;
                    
                    DocumentManager.getDocumentForPath(testPath + "/test1.css").done(function (doc) {
                        inlineDoc = doc;
                    });
                });
                
                waitsFor(function () { return inlineDoc !== null; }, "getDocumentForPath timeout", 1000);
                
                runs(function () {
                    // insert text at the host editor's cursor position
                    hostEditor._codeMirror.replaceRange(newHostText, hostEditor.getCursorPos());
                    newHostText = hostEditor.document.getText();
                    
                    // insert text at the inline editor's cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(newInlineText, inlineEditor.getCursorPos());
                    newInlineText = inlineDoc.getText();
                    
                    // execute file save command
                    testWindow.executeCommand(Commands.FILE_SAVE).done(function () {
                        saved = true;
                    }).fail(function () {
                        err = true;
                    });
                });
                
                waitsFor(function () { return saved && !err; }, "save timeout", 1000);
                
                runs(function () {
                    // read saved inline file contents
                    FileUtils.readAsText(inlineDoc.file).done(function (text) {
                        savedInlineText = text;
                    }).fail(function () {
                        err = true;
                    });
                    
                    // read saved host editor file contents
                    FileUtils.readAsText(hostEditor.document.file).done(function (text) {
                        savedHostText = text;
                    }).fail(function () {
                        err = true;
                    });
                });
                
                waitsFor(function () { return savedInlineText !== null && savedHostText !== null; }, "readAsText timeout", 1000);
                
                runs(function () {
                    expect(savedInlineText).toEqual(newInlineText);
                    expect(savedHostText).toEqual(inlineTest.infos["test1.html"].text);
                });
            });

        });
    });
});
