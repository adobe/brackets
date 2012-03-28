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
        FileUtils       = require("file/FileUtils"),
        SpecRunnerUtils = require("./SpecRunnerUtils.js");

    describe("InlineEditorProviders", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/InlineEditorProviders-test-files"),
            testWindow,
            initInlineTest;
        
        /**
         * Performs setup for an inline editor test. Parses offsets (saved to Spec.offsets) for all files in
         * the test project (testPath) and saves files back to disk without offset markup.
         * When finished, open an editor for the specified project relative file path
         * then attempts opens an inline editor at the given offset. Installs an after()
         * function restore all file content back to original state with offset markup.
         * 
         * @param {!string} openFile Project relative file path to open in a main editor.
         * @param {!number} openOffset The offset index location within openFile to open an inline editor.
         * @param {?boolean} expectInline Use false to verify that an inline editor should not be opened. Omit otherwise.
         */
        var _initInlineTest = function (openFile, openOffset, expectInline) {
            var allFiles,
                hostOpened = false,
                err = false,
                inlineOpened = null,
                spec = this;
            
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
                    spec.infos = offsetInfos;
                }).fail(function () {
                    err = true;
                });
            });
            
            waitsFor(function () { return (spec.infos !== null) && !err; }, "rewrite timeout", 1000);
            
            runs(function () {
                SpecRunnerUtils.openProjectFiles(openFile).done(function (documents) {
                    hostOpened = true;
                }).fail(function () {
                    err = true;
                });
            });
            
            waitsFor(function () { return hostOpened && !err; }, "FILE_OPEN timeout", 1000);
            
            runs(function () {
                var editor = EditorManager.getCurrentFullEditor();
                
                // open inline editor at specified offset index
                var inlineEditorResult = SpecRunnerUtils.openInlineEditorAtOffset(
                    editor,
                    spec.infos[openFile].offsets[openOffset]
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
            
            spec.after(function () {
                var done = false;
                
                runs(function () {
                    SpecRunnerUtils.saveFilesWithOffsets(spec.infos).done(function () {
                        done = true;
                    });
                });
                
                waitsFor(function () { return done; }, "saveFilesWithOffsets timeout", 1000);
            });
        };

        /*
         * Note that the bulk of selector matching tests are in CSSutils-test.js.
         * These tests are primarily focused on the InlineEditorProvider module.
         */
        describe("htmlToCSSProvider", function () {

            beforeEach(function () {
                initInlineTest = _initInlineTest.bind(this);
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow          = w;
                    Commands            = testWindow.brackets.test.Commands;
                    EditorManager       = testWindow.brackets.test.EditorManager;
                    FileIndexManager    = testWindow.brackets.test.FileIndexManager;
                    DocumentManager     = testWindow.brackets.test.DocumentManager;
                });
            });
    
            afterEach(function () {
                //debug visual confirmation of inline editor
                //waits(1000);
                
                // revert files to original content with offset markup
                SpecRunnerUtils.closeTestWindow();
            });

            it("should open a type selector", function () {
                initInlineTest("test1.html", 0);
                
                runs(function () {
                    var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    var inlinePos = inlineData.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1.css"].offsets[0]);
                });
            });

            it("should open a class selector", function () {
                initInlineTest("test1.html", 1);
                
                runs(function () {
                    var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    var inlinePos = inlineData.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1.css"].offsets[1]);
                });
            });

            it("should open an id selector", function () {
                initInlineTest("test1.html", 2);
                
                runs(function () {
                    var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                    var inlinePos = inlineData.editor.getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1.css"].offsets[2]);
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
                    expect(inlinePos).toEqual(this.infos["test1.css"].offsets[0]);
                    
                    // close the editor
                    EditorManager.closeInlineWidget(fullEditor, inlineWidget.id, true);
                    
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
                
                var inlineEditor, widgetHeight;
                
                runs(function () {
                    inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
                    widgetHeight = inlineEditor.totalHeight(true);
                    
                    // verify original line count
                    expect(inlineEditor.lineCount()).toBe(12);
                    
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
                
                var inlineEditor, widgetHeight;
                
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
                        this.infos["test1.css"].offsets[3]
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
                    hostEditor,
                    inlineEditor,
                    newText = "\n/* jasmine was here */",
                    savedText;
                
                runs(function () {
                    hostEditor = EditorManager.getCurrentFullEditor();
                    inlineEditor = hostEditor.getInlineWidgets()[0].data.editor;
                    
                    // insert text at the inline editor's cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(newText, inlineEditor.getCursorPos());
                    newText = inlineEditor.document.getText();
                    
                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeTruthy();
                    expect(hostEditor.document.isDirty).toBeFalsy();
                    
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
                    FileUtils.readAsText(inlineEditor.document.file).done(function (text) {
                        savedText = text;
                    }).fail(function () {
                        err = true;
                    });
                });
                
                waitsFor(function () { return savedText !== null; }, "readAsText timeout", 1000);
                
                runs(function () {
                    expect(savedText).toEqual(newText);
                    
                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeFalsy();
                    expect(hostEditor.document.isDirty).toBeFalsy();
                });
            });
            
            it("should not save changes in the host editor", function () {
                initInlineTest("test1.html", 1);
                
                var saved = false,
                    err = false,
                    hostEditor,
                    inlineEditor,
                    newInlineText = "/* jasmine was inline */\n",
                    newHostText = "/* jasmine was here */\n",
                    savedInlineText,
                    savedHostText;
                
                runs(function () {
                    hostEditor = EditorManager.getCurrentFullEditor();
                    inlineEditor = hostEditor.getInlineWidgets()[0].data.editor;
                    
                    // insert text at the host editor's cursor position
                    hostEditor._codeMirror.replaceRange(newHostText, hostEditor.getCursorPos());
                    newHostText = hostEditor.document.getText();
                    
                    // insert text at the inline editor's cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(newInlineText, inlineEditor.getCursorPos());
                    newInlineText = inlineEditor.document.getText();
                    
                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeTruthy();
                    expect(hostEditor.document.isDirty).toBeTruthy();
                    
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
                    FileUtils.readAsText(inlineEditor.document.file).done(function (text) {
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
                    expect(savedHostText).toEqual(this.infos["test1.html"].text);
                    
                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeFalsy();
                    expect(hostEditor.document.isDirty).toBeTruthy();
                });
            });

        });
    });
});
