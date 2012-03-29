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
        FileViewController, // loaded from brackets.test
        FileUtils       = require("file/FileUtils"),
        SpecRunnerUtils = require("./SpecRunnerUtils.js");

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
        
            describe("Bi-directional Editor Synchronizing", function () {
    
                it("should not add an inline document to the working set without being edited", function () {
                    initInlineTest("test1.html", 0);
                    
                    runs(function () {
                        var inlineData = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data;
                        var i = DocumentManager.findInWorkingSet(this.infos["test1.css"].fileEntry.fullPath);
                        expect(i).toEqual(-1);
                    });
                });
            
                it("should add dirty documents to the working set", function () {
                    initInlineTest("test1.html", 1);
                    
                    var inlineEditor, widgetHeight;
                    
                    runs(function () {
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
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
                    var cssPath,
                        cssDoc,
                        fullEditor,
                        inlineEditor,
                        newInlineText = "/* jasmine was inline */\n";
                    
                    initInlineTest("test1.html", 1, true, ["test1.css"]);
                    
                    runs(function () {
                        cssPath = this.infos["test1.css"].fileEntry.fullPath;
                        cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        
                        // edit the inline editor
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
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
                        expect(inlineEditor._getText()).toBe(fullEditor._getText());
                        
                        // make sure the text was inserted
                        expect(fullEditor._getText().indexOf(newInlineText)).toBeGreaterThan(0);
                        
                        // edit in the full editor and compare
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            inlineEditor.getCursorPos()
                        );
                        expect(inlineEditor._getText()).toBe(fullEditor._getText());
                    });
                });
            
                it("should sync insertions from the full editor and update the visual range of the inline editor", function () {
                    var cssPath,
                        cssDoc,
                        fullEditor,
                        inlineEditor,
                        newInlineText = "/* insert in full editor */\n",
                        before,
                        start,
                        middle,
                        end,
                        after;
                    
                    initInlineTest("test1.html", 1, true, ["test1.css"]);
                    
                    runs(function () {
                        cssPath = this.infos["test1.css"].fileEntry.fullPath;
                        cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
                        
                        // activate the full editor
                        DocumentManager.setCurrentDocument(cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();
                        
                        // offsets
                        before = this.infos["test1.css"].offsets[4];
                        start = this.infos["test1.css"].offsets[1];
                        middle = this.infos["test1.css"].offsets[5];
                        end = this.infos["test1.css"].offsets[6];
                        after = this.infos["test1.css"].offsets[7];
                        
                        // insert line above inline range
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            before
                        );
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line + 1, end.line + 1));
                        fullEditor._codeMirror.undo();
                        
                        // insert line at start of inline range
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            start
                        );
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                        fullEditor._codeMirror.undo();
                        
                        // insert line within inline range
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            middle
                        );
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line + 1));
                        fullEditor._codeMirror.undo();
                        
                        // insert line at end of inline range
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            end
                        );
                        // FIXME (issue #491): use commented verification
                        //expect(isEditorRangeValid(inlineEditor, start.line, end.line + 1)).toBe(true);
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                        fullEditor._codeMirror.undo();
                        
                        // insert line below inline range
                        fullEditor._codeMirror.replaceRange(
                            newInlineText,
                            after
                        );
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                    });
                });
            
                xit("should sync deletions from the full editor and update the visual range of the inline editor", function () {
                    var cssPath,
                        cssDoc,
                        fullEditor,
                        inlineEditor,
                        before,
                        start,
                        middle,
                        end,
                        after,
                        wayafter;
                    
                    initInlineTest("test1.html", 1, true, ["test1.css"]);
                    
                    runs(function () {
                        cssPath = this.infos["test1.css"].fileEntry.fullPath;
                        cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
                        
                        // activate the full editor
                        DocumentManager.setCurrentDocument(cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();
                        
                        // offsets
                        before = this.infos["test1.css"].offsets[4];
                        start = this.infos["test1.css"].offsets[1];
                        middle = this.infos["test1.css"].offsets[5];
                        end = this.infos["test1.css"].offsets[6];
                        after = this.infos["test1.css"].offsets[7];
                        wayafter = this.infos["test1.css"].offsets[2];
                        
                        // delete line above inline range
                        fullEditor._codeMirror.replaceRange("", before, start);
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line - 1, end.line - 1));
                        console.log(inlineEditor._getText());
                        fullEditor._codeMirror.undo();
                        
                        // delete line at start of inline range
                        fullEditor._codeMirror.replaceRange("", start, middle);
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 1));
                        console.log(inlineEditor._getText());
                        fullEditor._codeMirror.undo();
                        
                        // delete line within inline range
                        fullEditor._codeMirror.replaceRange("", middle, end);
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 1));
                        console.log(inlineEditor._getText());
                        fullEditor._codeMirror.undo();
                        
                        // delete line at end of inline range
                        fullEditor._codeMirror.replaceRange("", end, after);
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line - 1));
                        console.log(inlineEditor._getText());
                        fullEditor._codeMirror.undo();
                        
                        // delete line below inline range
                        fullEditor._codeMirror.replaceRange("", after, wayafter);
                        expect(inlineEditor).toHaveInlineEditorRange(toRange(start.line, end.line));
                        console.log(inlineEditor._getText());
                    });
                });
            
                it("should sync multiple edits between full and inline editors", function () {
                    var i,
                        cssPath,
                        cssDoc,
                        fullEditor,
                        inlineEditor,
                        editor,
                        text,
                        newInlineText = "/* jasmine was inline */\n",
                        newFullText = "/* full editor edit */\n";
                    
                    initInlineTest("test1.html", 1, true, ["test1.css"]);
                    
                    runs(function () {
                        cssPath = this.infos["test1.css"].fileEntry.fullPath;
                        cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        
                        // edit the inline editor
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
                        
                        // activate the full editor
                        DocumentManager.setCurrentDocument(cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();
                        
                        // alternate editors while inserting new text
                        for (i = 0; i < 10; i++) {
                            editor = (i % 2 === 0) ? fullEditor : inlineEditor;
                            text = (i % 2 === 0) ? newFullText : newInlineText;
                            editor._codeMirror.replaceRange(
                                text,
                                editor.getCursorPos()
                            );
                            expect(inlineEditor._getText()).toBe(fullEditor._getText());
                        }
                    });
                });
            
                it("should sync even if the contents of the full editor are all deleted", function () {
                    var cssPath,
                        cssDoc,
                        fullEditor,
                        inlineEditor,
                        newInlineText = "/* jasmine was inline */\n";
                    
                    initInlineTest("test1.html", 1, true, ["test1.css"]);
                    
                    runs(function () {
                        cssPath = this.infos["test1.css"].fileEntry.fullPath;
                        cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
                        
                        // activate the full editor
                        DocumentManager.setCurrentDocument(cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();
                        fullEditor._setText("");
                        
                        // compare inline editor to full editor
                        expect(inlineEditor._getText()).toBe(fullEditor._getText());
                    });
                });
                
                it("should sync after an undoing and redoing an edit", function () {
                    var cssPath,
                        htmlPath,
                        cssDoc,
                        fullEditor,
                        inlineEditor,
                        originalText,
                        editedText,
                        newInlineText = "/* jasmine was inline */\n";
                    
                    initInlineTest("test1.html", 1, true, ["test1.css"]);
                    
                    runs(function () {
                        cssPath = this.infos["test1.css"].fileEntry.fullPath;
                        htmlPath = this.infos["test1.html"].fileEntry.fullPath;
                        cssDoc = DocumentManager.getOpenDocumentForPath(cssPath);
                        
                        inlineEditor = EditorManager.getCurrentFullEditor().getInlineWidgets()[0].data.editor;
                        originalText = inlineEditor._codeMirror.getValue();
                        
                        // edit the inline editor
                        inlineEditor._codeMirror.replaceRange(
                            newInlineText,
                            inlineEditor.getCursorPos()
                        );
                        editedText = inlineEditor._codeMirror.getValue();
                        
                        // activate the full css editor
                        DocumentManager.setCurrentDocument(cssDoc);
                        fullEditor = EditorManager.getCurrentFullEditor();
                        
                        // compare inline editor to full editor
                        expect(inlineEditor._getText()).toBe(fullEditor._getText());
                        
                        // undo the inline editor
                        inlineEditor._codeMirror.undo();
                        expect(inlineEditor._getText()).toBe(fullEditor._getText());
                        expect(inlineEditor._getText()).toBe(originalText);
                        
                        // redo the inline editor
                        inlineEditor._codeMirror.redo();
                        expect(inlineEditor._getText()).toBe(fullEditor._getText());
                        expect(inlineEditor._getText()).toBe(editedText);
                        
                        // undo the full editor
                        fullEditor._codeMirror.undo();
                        expect(inlineEditor._getText()).toBe(fullEditor._getText());
                        expect(fullEditor._getText()).toBe(originalText);
                        
                        // redo the full editor
                        fullEditor._codeMirror.redo();
                        expect(inlineEditor._getText()).toBe(fullEditor._getText());
                        expect(fullEditor._getText()).toBe(editedText);
                    });
                });
            });
        });
    });
});
