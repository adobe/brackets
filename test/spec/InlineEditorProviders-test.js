/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, waitsForDone, runs, $, brackets */

define(function (require, exports, module) {
    'use strict';
    
    var Commands,           // loaded from brackets.test
        EditorManager,      // loaded from brackets.test
        FileSyncManager,    // loaded from brackets.test
        FileIndexManager,   // loaded from brackets.test
        DocumentManager,    // loaded from brackets.test
        FileViewController, // loaded from brackets.test
        Dialogs          = require("widgets/Dialogs"),
        NativeFileSystem = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils        = require("file/FileUtils"),
        SpecRunnerUtils  = require("spec/SpecRunnerUtils");

    describe("InlineEditorProviders", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/InlineEditorProviders-test-files"),
            testWindow,
            initInlineTest;
        
        function toRange(startLine, endLine) {
            return {startLine: startLine, endLine: endLine};
        }
        
        function rewriteProject(spec) {
            var result = new $.Deferred();
        
            FileIndexManager.getFileInfoList("all").done(function (allFiles) {
                // convert fileInfos to fullPaths
                allFiles = allFiles.map(function (fileInfo) {
                    return fileInfo.fullPath;
                });
                
                // parse offsets and save
                SpecRunnerUtils.saveFilesWithoutOffsets(allFiles).done(function (offsetInfos) {
                    spec.infos = offsetInfos;
            
                    // install after function to restore file content
                    spec.after(function () {
                        var done = false;
                        
                        runs(function () {
                            SpecRunnerUtils.saveFilesWithOffsets(spec.infos).done(function () {
                                done = true;
                            });
                        });
                        
                        waitsFor(function () { return done; }, "saveFilesWithOffsets timeout", 1000);
                    });
                    
                    result.resolve();
                }).fail(function () {
                    result.reject();
                });
            });
            
            return result.promise();
        }
        
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
        var _initInlineTest = function (openFile, openOffset, expectInline, workingSet) {
            var allFiles,
                hostOpened = false,
                err = false,
                inlineOpened = null,
                spec = this,
                rewriteDone = false,
                rewriteErr = false;
            
            workingSet = workingSet || [];
            
            expectInline = (expectInline !== undefined) ? expectInline : true;
            
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
            
            // load project to set CSSUtils scope
            runs(function () {
                rewriteProject(spec)
                    .done(function () { rewriteDone = true; })
                    .fail(function () { rewriteErr = true; });
            });
            
            waitsFor(function () { return rewriteDone && !rewriteErr; }, "rewriteProject timeout", 1000);
            
            runs(function () {
                workingSet.push(openFile);
                SpecRunnerUtils.openProjectFiles(workingSet).done(function (documents) {
                    hostOpened = true;
                }).fail(function () {
                    err = true;
                });
            });
            
            waitsFor(function () { return hostOpened && !err; }, "FILE_OPEN timeout", 1000);
            
            runs(function () {
                var editor = EditorManager.getCurrentFullEditor();
                
                // open inline editor at specified offset index
                var inlineEditorResult = SpecRunnerUtils.toggleQuickEditAtOffset(
                    editor,
                    spec.infos[openFile].offsets[openOffset]
                );
                
                inlineEditorResult.done(function (isOpened) {
                    inlineOpened = isOpened;
                }).fail(function () {
                    inlineOpened = false;
                });
            });
            
            waitsFor(function () {
                return (inlineOpened !== null) && (inlineOpened === expectInline);
            }, "inline editor timeout", 1000);
        };
        
        
        // Utilities for testing Editor state
        function expectText(editor) {
            return expect(editor._codeMirror.getValue());
        }
        
        function expectTextToBeEqual(editor1, editor2) {
            expect(editor1._codeMirror.getValue()).toBe(editor2._codeMirror.getValue());
        }
        


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
                    FileSyncManager     = testWindow.brackets.test.FileSyncManager;
                    FileIndexManager    = testWindow.brackets.test.FileIndexManager;
                    DocumentManager     = testWindow.brackets.test.DocumentManager;
                    FileViewController  = testWindow.brackets.test.FileViewController;
                });
                
                this.addMatchers({
                        
                    toHaveInlineEditorRange: function (range) {
                        var i = 0,
                            editor = this.actual,
                            hidden,
                            lineCount = editor.lineCount(),
                            shouldHide = [],
                            shouldShow = [],
                            startLine = range.startLine,
                            endLine = range.endLine,
                            visibleRangeCheck;
                        
                        for (i = 0; i < lineCount; i++) {
                            hidden = editor._codeMirror.getLineHandle(i).hidden || false;
                            
                            if (i < startLine) {
                                if (!hidden) {
                                    shouldHide.push(i); // lines above start line should be hidden
                                }
                            } else if ((i >= startLine) && (i <= endLine)) {
                                if (hidden) {
                                    shouldShow.push(i); // lines in the range should be visible
                                }
                            } else if (i > endLine) {
                                if (!hidden) {
                                    shouldHide.push(i); // lines below end line should be hidden
                                }
                            }
                        }
                        
                        visibleRangeCheck = (editor._visibleRange.startLine === startLine)
                            && (editor._visibleRange.endLine === endLine);
                        
                        this.message = function () {
                            var msg = "";
                            
                            if (shouldHide.length > 0) {
                                msg += "Expected inline editor to hide [" + shouldHide.toString() + "].\n";
                            }
                            
                            if (shouldShow.length > 0) {
                                msg += "Expected inline editor to show [" + shouldShow.toString() + "].\n";
                            }
                            
                            if (!visibleRangeCheck) {
                                msg += "Editor._visibleRange ["
                                    + editor._visibleRange.startLine + ","
                                    + editor._visibleRange.endLine + "] should be ["
                                    + startLine + "," + endLine + "].";
                            }
                            
                            return msg;
                        };
                        
                        return (shouldHide.length === 0)
                            && (shouldShow.length === 0)
                            && visibleRangeCheck;
                    }
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
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editors[0].getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1.css"].offsets[0]);
                });
            });

            it("should open a class selector", function () {
                initInlineTest("test1.html", 1);
                
                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editors[0].getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1.css"].offsets[1]);
                });
            });

            it("should also open a class selector", function () {
                initInlineTest("test1.html", 7);
                
                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editors[0].getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1.css"].offsets[1]);
                });
            });
            
            it("should open an id selector", function () {
                initInlineTest("test1.html", 2);
                
                runs(function () {
                    var inlineWidget = EditorManager.getCurrentFullEditor().getInlineWidgets()[0];
                    var inlinePos = inlineWidget.editors[0].getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1.css"].offsets[2]);
                });
            });

            it("should close, then remove the inline widget and restore focus", function () {
                initInlineTest("test1.html", 0);
                
                var hostEditor, inlineWidget, inlinePos, savedPos;
                
                runs(function () {
                    hostEditor =  EditorManager.getCurrentFullEditor();
                    savedPos = hostEditor.getCursorPos();
                    inlineWidget = hostEditor.getInlineWidgets()[0];
                    inlinePos = inlineWidget.editors[0].getCursorPos();
                    
                    // verify cursor position in inline editor
                    expect(inlinePos).toEqual(this.infos["test1.css"].offsets[0]);
                    
                    // close the editor
                    EditorManager.closeInlineWidget(hostEditor, inlineWidget, true);
                    
                    // verify no inline widgets 
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                    
                    // verify full editor cursor restored
                    expect(savedPos).toEqual(hostEditor.getCursorPos());
                });
            });

            it("should close inline widget on Esc Key", function () {
                initInlineTest("test1.html", 0);

                runs(function () {
                    var hostEditor = EditorManager.getCurrentFullEditor(),
                        inlineWidget = hostEditor.getInlineWidgets()[0],
                        inlinePos = inlineWidget.editors[0].getCursorPos();

                    // verify inline widget
                    expect(hostEditor.getInlineWidgets().length).toBe(1);

                    // close the editor by simulating Esc key
                    var key = 27,   // Esc key
                        doc = testWindow.document,
                        element = doc.getElementsByClassName("inline-widget")[0];
                    SpecRunnerUtils.simulateKeyEvent(key, "keydown", element);

                    // verify no inline widgets
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
            });

            it("should not open an inline editor when positioned on textContent", function () {
                initInlineTest("test1.html", 3, false);
                
                runs(function () {
                    // verify no inline open
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);
                });
            });

            it("should not open an inline editor when positioned on a tag in a comment", function () {
                initInlineTest("test1.html", 4, false);
                
                runs(function () {
                    // verify no inline open
                    expect(EditorManager.getCurrentFullEditor().getInlineWidgets().length).toBe(0);
                });
            });
            
            it("should increase size based on content", function () {
                initInlineTest("test1.html", 1);
                
                var inlineEditor, widgetHeight;
                
                runs(function () {
                    inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editors[0];
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
                    inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editors[0];
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
                    inlineEditor = hostEditor.getInlineWidgets()[0].editors[0];
                    
                    // insert text at the inline editor's cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(newText, inlineEditor.getCursorPos());
                    
                    // we're going to compare this to disk later, so pass true to get non-normalized line endings
                    newText = inlineEditor.document.getText(true);
                    
                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeTruthy();
                    expect(hostEditor.document.isDirty).toBeFalsy();
                    
                    // verify focus is in inline editor
                    expect(inlineEditor.hasFocus()).toBeTruthy();
                    
                    // execute file save command
                    testWindow.executeCommand(Commands.FILE_SAVE).done(function () {
                        saved = true;
                    }).fail(function () {
                        err = true;
                    });
                });
                
                waitsFor(function () { return saved && !err; }, "save timeout", 1000);
                
                runs(function () {
                    // verify focus is still in inline editor
                    expect(inlineEditor.hasFocus()).toBeTruthy();
                    
                    // read saved file contents
                    FileUtils.readAsText(inlineEditor.document.file).done(function (text) {
                        savedText = text;
                    }).fail(function () {
                        err = true;
                    });
                });
                
                waitsFor(function () { return savedText !== undefined; }, "readAsText timeout", 1000);
                
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
                    inlineEditor = hostEditor.getInlineWidgets()[0].editors[0];
                    
                    // insert text at the host editor's cursor position
                    hostEditor._codeMirror.replaceRange(newHostText, hostEditor.getCursorPos());
                    
                    // insert text at the inline editor's cursor position
                    // can't mutate document directly at this point
                    inlineEditor._codeMirror.replaceRange(newInlineText, inlineEditor.getCursorPos());
                    
                    // we're going to compare this to disk later, so pass true to get non-normalized line endings
                    newInlineText = inlineEditor.document.getText(true);
                    
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
                
                waitsFor(function () { return savedInlineText !== undefined && savedHostText !== undefined; }, "readAsText timeout", 1000);
                
                runs(function () {
                    expect(savedInlineText).toEqual(newInlineText);
                    expect(savedHostText).toEqual(this.infos["test1.html"].text); // i.e, should be unchanged
                    
                    // verify isDirty flag
                    expect(inlineEditor.document.isDirty).toBeFalsy();
                    expect(hostEditor.document.isDirty).toBeTruthy();
                });
            });
            
            
            describe("Inline Editor syncing from disk", function () {
                
                it("should close inline editor when file deleted on disk", function () {
                    // Create an expendable CSS file
                    var fileToWrite = new NativeFileSystem.FileEntry(testPath + "/tempCSS.css");
                    var savedTempCSSFile = false;
                    runs(function () {
                        FileUtils.writeText(fileToWrite, "#anotherDiv {}")
                            .done(function () {
                                savedTempCSSFile = true;
                            });
                    });
                    waitsFor(function () { return savedTempCSSFile; }, "writeText timeout", 1000);
                    
                    // Open inline editor for that file
                    runs(function () {
                        initInlineTest("test1.html", 6, true);
                    });
                    // initInlineTest() inserts a waitsFor() automatically, so must end runs() block here
                    
                    // Delete the file
                    var fileDeleted = false;
                    runs(function () {
                        var hostEditor = EditorManager.getCurrentFullEditor();
                        expect(hostEditor.getInlineWidgets().length).toBe(1);
                        
                        brackets.fs.unlink(fileToWrite.fullPath, function (err) {
                            if (!err) {
                                fileDeleted = true;
                            }
                        });
                    });
                    waitsFor(function () { return fileDeleted; }, 1000);
                    
                    // Ping FileSyncManager to recognize the deletion
                    runs(function () {
                        FileSyncManager.syncOpenDocuments();
                    });
                    
                    // Verify inline is now closed
                    waitsFor(function () {
                        var hostEditor = EditorManager.getCurrentFullEditor();
                        return (hostEditor.getInlineWidgets().length === 0);
                    }, 1000);
                    
                    // Cleanup: initInlineTest() saves contents of all files in the project and rewrites
                    // them back to disk at the end (to restore any stripped offset markers). But in this
                    // case we really want the temp file to stay gone.
                    runs(function () {
                        delete this.infos["tempCSS.css"];
                    });
                });
                
                // FUTURE: Eventually we'll instead want it to stay open and revert to the content on disk.
                // Editor's syncing code can't yet handle blowing away the whole Document like that, though.
                it("should close inline when file is closed without saving changes", function () {
                    initInlineTest("test1.html", 1);
                    
                    var newText = "\n/* jasmine was here */",
                        hostEditor,
                        inlineEditor,
                        promise;
                    
                    runs(function () {
                        hostEditor = EditorManager.getCurrentFullEditor();
                        inlineEditor = hostEditor.getInlineWidgets()[0].editors[0];
                        
                        // verify inline is open
                        expect(hostEditor.getInlineWidgets().length).toBe(1);
                        
                        // insert text at the inline editor's cursor position
                        inlineEditor._codeMirror.replaceRange(newText, inlineEditor.getCursorPos());
                        
                        // verify isDirty flag
                        expect(inlineEditor.document.isDirty).toBe(true);
                        
                        // close the main editor / working set entry for the inline's file
                        promise = testWindow.executeCommand(Commands.FILE_CLOSE, {file: inlineEditor.document.file});
                        
                        // synchronously click the don't save button,
                        // asynchronously wait for the dialog to close and the Dialog's
                        // promise to resolve. 
                        SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_DONTSAVE);
                    });

                    // Wait on the command's promise also since the command performs
                    // asynchronous tasks after the Dialog is resolved. If the command
                    // could complete synchronously, this wait would be unnecessary.
                    runs(function () {
                        waitsForDone(promise);
                    });
                    
                    runs(function () {
                        // verify inline is closed
                        expect(hostEditor.getInlineWidgets().length).toBe(0);
                    });
                });
            });
            
            
            describe("Bi-directional Editor Synchronizing", function () {
                // For these tests we *deliberately* use Editor._codeMirror instead of Document to make edits,
                // in order to test Editor->Document syncing (instead of Document->Editor).
                
                it("should not add an inline document to the working set without being edited", function () {
                    initInlineTest("test1.html", 0);
                    
                    runs(function () {
                        var i = DocumentManager.findInWorkingSet(this.infos["test1.css"].fileEntry.fullPath);
                        expect(i).toEqual(-1);
                    });
                });
            
                it("should add dirty documents to the working set", function () {
                    initInlineTest("test1.html", 1);
                    
                    var inlineEditor, widgetHeight;
                    
                    runs(function () {
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editors[0];
                        widgetHeight = inlineEditor.totalHeight(true);
                        
                        // change inline editor content
                        var newLines = ".bar {\ncolor: #f00;\n}\n.cat {\ncolor: #f00;\n}";
                        
                        // insert new lines at current cursor position
                        inlineEditor._codeMirror.replaceRange(
                            newLines,
                            inlineEditor.getCursorPos()
                        );
                        
                        var i = DocumentManager.findInWorkingSet(this.infos["test1.css"].fileEntry.fullPath);
                        expect(i).toEqual(1);
                    });
                });
            
                it("should sync edits between full and inline editors", function () {
                    var fullEditor,
                        inlineEditor,
                        newInlineText = "/* jasmine was inline */\n";
                    
                    initInlineTest("test1.html", 1, true, ["test1.css"]);
                    
                    runs(function () {
                        var cssPath = this.infos["test1.css"].fileEntry.fullPath;
                        var cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        
                        // edit the inline editor
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].editors[0];
                        inlineEditor._codeMirror.replaceRange(
                            newInlineText,
                            inlineEditor.getCursorPos()
                        );
                        
                        // activate the full editor
                        DocumentManager.setCurrentDocument(cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();
                        
                        // sanity check
                        expect(fullEditor).not.toBe(inlineEditor);
                        expect(fullEditor._codeMirror).not.toBe(inlineEditor._codeMirror);
                        
                        // compare inline editor to full editor
                        expectTextToBeEqual(inlineEditor, fullEditor);
                        
                        // make sure the text was inserted
                        expect(fullEditor._codeMirror.getValue().indexOf(newInlineText)).toBeGreaterThan(0);
                        
                        // edit in the full editor and compare
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            inlineEditor.getCursorPos()
                        );
                        expectTextToBeEqual(inlineEditor, fullEditor);
                    });
                });
            });
            
            
            describe("Inline Editor range updating", function () {
                
                var fullEditor,
                    hostEditor,
                    inlineEditor,
                    newInlineText = "/* insert in full editor */\n",
                    before,
                    start,
                    middle,
                    middleOfMiddle,
                    end,
                    endOfEnd,
                    after,
                    wayafter;
                    
                beforeEach(function () {
                    initInlineTest("test1.html", 1, true, ["test1.css"]);
                    
                    runs(function () {
                        var cssPath = this.infos["test1.css"].fileEntry.fullPath;
                        var cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        hostEditor = EditorManager.getCurrentFullEditor();
                        inlineEditor = hostEditor.getInlineWidgets()[0].editors[0];
                        
                        // activate the full editor
                        DocumentManager.setCurrentDocument(cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();
                        
                        // alias offsets to nice names
                        before = this.infos["test1.css"].offsets[4];
                        start = this.infos["test1.css"].offsets[1];
                        middle = this.infos["test1.css"].offsets[5];
                        middleOfMiddle = {line: middle.line, ch: 3};
                        end = this.infos["test1.css"].offsets[6];
                        endOfEnd = this.infos["test1.css"].offsets[3];
                        after = this.infos["test1.css"].offsets[7];
                        wayafter = this.infos["test1.css"].offsets[2];
                    });
                });
            
                
                it("should insert new line at start of range, and stay open on undo", function () {
                    // insert new line at start of inline range--the new line should be included in 
                    // the inline
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        start
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                    
                    // undo is equivalent to deleting the first line in the range: shouldn't close the editor
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });
                
                it("should insert new line within first line of range, and stay open on undo", function () {
                    // insert new line in middle of first line of inline range--the new line should
                    // be included
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        {line: start.line, ch: start.ch + 1}
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                
                    // Even though the edit didn't start at the beginning of the line, the undo touches
                    // the whole line; but deleting the first line still shouldn't close the editor
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });
                
                it("should not close inline when undoing changes to first line in range that did not include newlines", function () {
                    // undo is NOT deleting the entire first line in these cases, so the inline should be able to stay open
                    
                    // insert new text at start of inline range, without newlines--the new text should be included in 
                    // the inline
                    fullEditor._codeMirror.replaceRange(
                        ".bar, ",
                        start
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    
                    // replace text at start of inline range with text without newlines
                    fullEditor._codeMirror.replaceRange(
                        ".bar",
                        {line: start.line, ch: 0},
                        {line: start.line, ch: 4}
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    
                    // insert new text in middle of first line in range, without newlines
                    fullEditor._codeMirror.replaceRange(
                        "ABCD",
                        {line: start.line, ch: 3}
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });
                
                it("should sync deletions (and their undos) on last line in range, with or without newlines", function () {
                    // undo is NOT deleting the entire last line in these cases, so the inline should be able to stay open
                    
                    // insert new line in middle of last line of inline range--the new line should
                    // be included
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        {line: end.line, ch: end.ch + 1}
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    
                    // insert new line at end of last line of inline range--the new line should
                    // be included
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        endOfEnd
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    
                    // replace all text on last line (without replacing trailing newline)
                    fullEditor._codeMirror.replaceRange(
                        "ABCD",
                        end,
                        endOfEnd
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });

                it("should sync insertions (and their undos) in most cases without closing", function () {
                    // insert line above inline range
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        before
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line + 1, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    
                    // insert line within inline range
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        middle
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    
                    // insert line at end of inline range
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        end
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    
                    // insert line below inline range
                    fullEditor._codeMirror.replaceRange(
                        newInlineText,
                        after
                    );
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });
            
                it("should sync deletions from the full editor and update the visual range of the inline editor", function () {
                    // delete line within inline range
                    fullEditor._codeMirror.replaceRange("", middle, end);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 1));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    
                    // delete line below inline range
                    fullEditor._codeMirror.replaceRange("", after, wayafter);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    fullEditor._codeMirror.undo();
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                });
                it("should close inline when newline at beginning of range is deleted", function () {
                    // delete all of line just above the range
                    fullEditor._codeMirror.replaceRange("", before, start);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should stay open when first line entirely deleted", function () {
                    // delete all of first line in range
                    fullEditor._codeMirror.replaceRange("", start, middle);
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 1));
                });
                it("should stay open when first line and following text deleted", function () {
                    // delete all of first line in range, plus some of the next line
                    fullEditor._codeMirror.replaceRange("", start, middleOfMiddle);
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 1));
                });
                it("should stay open when first two lines deleted", function () {
                    // delete all of first two lines in range
                    fullEditor._codeMirror.replaceRange("", start, end);
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 2));
                });
                it("should close inline when last line entirely deleted", function () {
                    // delete all of last line in range
                    fullEditor._codeMirror.replaceRange("", end, after);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when last line and preceding text deleted", function () {
                    // delete all of last line in range, plus some of previous line
                    fullEditor._codeMirror.replaceRange("", middleOfMiddle, after);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when last line and more preceding text deleted", function () {
                    // delete all of last line in range, plus some of previous two lines
                    fullEditor._codeMirror.replaceRange("", {line: start.line, ch: 3}, after);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when deletion spans top of range", function () {
                    // delete a block starting before the inline and ending within it
                    fullEditor._codeMirror.replaceRange("", {line: before.line - 1, ch: 0}, middleOfMiddle);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when deletion spans top of range (barely)", function () {
                    // delete a block starting before the inline and ending within it
                    fullEditor._codeMirror.replaceRange("", before, {line: start.line, ch: 1});
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                it("should close inline when deletion spans bottom of range", function () {
                    // delete a block starting within the inline and ending after it
                    fullEditor._codeMirror.replaceRange("", middleOfMiddle, wayafter);
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                
            
                it("should sync insertions with multiple change objects in one event", function () {
                    // Insert two new lines: one at start of inline range, the other at the (newly
                    // updated) end of range. The edits are batched into just one event (so the
                    // event's changeList will have length 2); both new lines should be included in
                    // the inline
                    fullEditor._codeMirror.operation(function () {
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            start
                        );
                        // because the edit shifted everything down a line, 'after' is now pointing
                        // at what 'end' used to point at (the "}" line)
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            after
                        );
                    });
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 2));
                    
                    // TODO: can't do our usual undo + re-check range test at the end, becuase of
                    // marijnh/CodeMirror2 bug #487
                });
                
                
                it("should sync multiple edits between full and inline editors", function () {
                    var i,
                        editor,
                        text,
                        newInlineText = "/* jasmine was inline */\n",
                        newFullText = "/* full editor edit */\n";
                    
                    // alternate editors while inserting new text
                    for (i = 0; i < 10; i++) {
                        editor = (i % 2 === 0) ? fullEditor : inlineEditor;
                        text = (i % 2 === 0) ? newFullText : newInlineText;
                        editor._codeMirror.replaceRange(
                            text,
                            editor.getCursorPos()
                        );
                        expectTextToBeEqual(inlineEditor, fullEditor);
                    }
                });
            
                it("should close inline if the contents of the full editor are all deleted", function () {
                    var newInlineText = "/* jasmine was inline */\n";
                    
                    // verify inline is open
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    
                    // delete all text via full editor
                    fullEditor._codeMirror.setValue("");
                    
                    // verify inline is closed
                    expect(hostEditor.getInlineWidgets().length).toBe(0);
                });
                
                it("should sync after undoing and redoing an edit", function () {
                    var originalText,
                        editedText,
                        newInlineText = "/* jasmine was inline */\n";
                    
                    originalText = inlineEditor._codeMirror.getValue();
                    
                    // edit the inline editor in the middle of the text so it doesn't
                    // run into one of the collapsing cases
                    inlineEditor._codeMirror.replaceRange(
                        newInlineText,
                        middle
                    );
                    editedText = inlineEditor._codeMirror.getValue();
                    
                    // compare inline editor to full editor
                    expectTextToBeEqual(inlineEditor, fullEditor);
                    
                    // undo the inline editor
                    inlineEditor._codeMirror.undo();
                    expectTextToBeEqual(inlineEditor, fullEditor);
                    expectText(inlineEditor).toBe(originalText);
                    
                    // redo the inline editor
                    inlineEditor._codeMirror.redo();
                    expectTextToBeEqual(inlineEditor, fullEditor);
                    expectText(inlineEditor).toBe(editedText);
                    
                    // undo the full editor
                    fullEditor._codeMirror.undo();
                    expectTextToBeEqual(inlineEditor, fullEditor);
                    expectText(fullEditor).toBe(originalText);
                    
                    // redo the full editor
                    fullEditor._codeMirror.redo();
                    expectTextToBeEqual(inlineEditor, fullEditor);
                    expectText(fullEditor).toBe(editedText);
                });
                
            });
            
            describe("Multiple inline editor interaction", function () {
                var hostEditor, inlineEditor;
                beforeEach(function () {
                    initInlineTest("test1.html", 1, true, ["test1.css"]);
                    
                    runs(function () {
                        hostEditor = EditorManager.getCurrentFullEditor();
                        inlineEditor = hostEditor.getInlineWidgets()[0].editors[0];
                    });
                });
            

                it("should keep range consistent after undo/redo (bug #1031)", function () {
                    var secondInlineOpen = false, secondInlineEditor;
                    
                    // open inline editor at specified offset index
                    runs(function () {
                        hostEditor.focus();
                        SpecRunnerUtils.toggleQuickEditAtOffset(
                            hostEditor,
                            this.infos["test1.html"].offsets[8]
                        ).done(function (isOpen) {
                            secondInlineOpen = isOpen;
                        });
                    });
                    
                    waitsFor(function () { return secondInlineOpen; }, "second inline open timeout", 1000);
                    
                    // Not sure why we have to wait in between these for the bug to occur, but we do.
                    runs(function () {
                        secondInlineEditor = hostEditor.getInlineWidgets()[1].editors[0];
                        secondInlineEditor._codeMirror.replaceRange("\n\n\n\n\n", { line: 0, ch: 0 });
                    });
                    waits(500);
                    runs(function () {
                        secondInlineEditor._codeMirror.undo();
                    });
                    waits(500);
                    runs(function () {
                        inlineEditor._codeMirror.undo();
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(10, 12));
                    });
                });
            });
            
            
            describe("Inline Editor range equal to file range", function () {
                var fullEditor,
                    hostEditor,
                    inlineEditor;
                    
                beforeEach(function () {
                    initInlineTest("test1.html", 5, true, ["testOneRuleFile.css"]);
                    
                    runs(function () {
                        var cssPath = this.infos["testOneRuleFile.css"].fileEntry.fullPath;
                        var cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        hostEditor = EditorManager.getCurrentFullEditor();
                        inlineEditor = hostEditor.getInlineWidgets()[0].editors[0];
                        
                        // activate the full editor
                        DocumentManager.setCurrentDocument(cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();
                    });
                });
            
                it("should delete line at bottom and not close on undo", function () {
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 2));
                    
                    // delete all of last line in range
                    fullEditor._codeMirror.replaceRange("", {line: 1, ch: 16}, {line: 2, ch: 1});
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 1));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 2));
                });
                it("should insert new line at bottom and not close on undo", function () {
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 2));
                    
                    // delete all of last line in range
                    fullEditor._codeMirror.replaceRange("\n/* New last line */", {line: 2, ch: 1});
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 3));
                    fullEditor._codeMirror.undo();
                    expect(hostEditor.getInlineWidgets().length).toBe(1);
                    expect(inlineEditor).toHaveInlineEditorRange(toRange(0, 2));
                });
            });
            
        });
    });
});
