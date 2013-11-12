/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, expect, beforeEach, afterEach, runs, brackets, waitsForDone, spyOn */

define(function (require, exports, module) {
    "use strict";
   
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
		FileUtils		= brackets.getModule("file/FileUtils"),
		CommandManager,
		Commands,
        Menus,
		DocumentManager,
        FileSystem;

    describe("CloseOthers", function () {
		var extensionPath = FileUtils.getNativeModuleDirectoryPath(module),
			testPath      = extensionPath + "/unittest-files/",
			testWindow,
			$,
			docSelectIndex,
			cmdToRun,
			brackets;
		
        function createUntitled(count) {
            function doCreateUntitled(content) {
                runs(function () {
                    var promise = CommandManager.execute(Commands.FILE_NEW_UNTITLED);
                    promise.done(function (untitledDoc) {
                        untitledDoc.replaceRange(content, {line: 0, ch: 0});
                    });
                    waitsForDone(promise, "FILE_NEW_UNTITLED");
                });
            }
            
            var i;
            for (i = 0; i < count; i++) {
                doCreateUntitled(String(i));
            }
        }

        /** Expect a file to exist (failing test if not) and then delete it */
        function expectAndDelete(fullPath) {
            runs(function () {
                var promise = SpecRunnerUtils.resolveNativeFileSystemPath(fullPath);
                waitsForDone(promise, "Verify file exists: " + fullPath);
            });
            runs(function () {
                var promise = SpecRunnerUtils.deletePath(fullPath);
                waitsForDone(promise, "Remove testfile " + fullPath);
            });
        }

        function getFilename(i) {
            return testPath + "test_closeothers" + i + ".js";
        }

        beforeEach(function () {

            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    $ = testWindow.$;
					brackets		= testWindow.brackets;
                    DocumentManager = testWindow.brackets.test.DocumentManager;
                    CommandManager  = testWindow.brackets.test.CommandManager;
                    Commands        = testWindow.brackets.test.Commands;
                    Menus           = testWindow.brackets.test.Menus;
                    FileSystem      = testWindow.brackets.test.FileSystem;
                });
            });
            
            runs(function () {
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });

            createUntitled(5);

            runs(function () {
                var fileI = 0;
                spyOn(FileSystem, 'showSaveDialog').andCallFake(function (dialogTitle, initialPath, proposedNewName, callback) {
                    callback(undefined, getFilename(fileI));
                    fileI++;
                });

                var promise = CommandManager.execute(Commands.FILE_SAVE_ALL);
                waitsForDone(promise, "FILE_SAVE_ALL");
            });
        });
        
        afterEach(function () {
            // Verify files exist & clean up
            [0, 1, 2, 3, 4].forEach(function (i) {
                expectAndDelete(getFilename(i));
            });

            testWindow    = null;
            $             = null;
            brackets      = null;
            SpecRunnerUtils.closeTestWindow();
        });

        function runCloseOthers() {
            var ws = DocumentManager.getWorkingSet(),
                cm = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_MENU),
                promise;

            if (ws.length > docSelectIndex) {
                DocumentManager.getDocumentForPath(ws[docSelectIndex].fullPath).done(function (doc) {
                    DocumentManager.setCurrentDocument(doc);

                    /*
                    "Close Others" extension removes unnecessary menus AND add necessary menus on workingset by listening
                    `beforeContextMenuOpen` event. For that, we have to open workinget's context menu. Then only this extension
                    will populate necessary context menu items.

                    `pageX` and `pageY` can be any number. our only intention is to open context menu. but it can open at anywhere.
                    */
                    cm.open({pageX: 0, pageY: 0});
                });

                promise = CommandManager.execute(cmdToRun);
                waitsForDone(promise, cmdToRun);
            }
            
            runs(function () {
                expect(DocumentManager.getCurrentDocument()).not.toBe(null);
            });
        }

        it("Close others", function () {
            docSelectIndex = 2;
            cmdToRun       = "file.close_others";

            runs(runCloseOthers);
            
            //we created 5 files and selected 3rd file (index = 2), then we ran "close others". 
            //At this point we should have only one file in working set.
            runs(function () {
                expect(DocumentManager.getWorkingSet().length).toEqual(1);
            });
        });

        it("Close others above", function () {
            docSelectIndex = 2;
            cmdToRun       = "file.close_above";

            runs(runCloseOthers);
            
            //we created 5 files and selected 3rd file (index = 2), then we ran "close others above". 
            //At this point we should have only 3 files in working set.
            runs(function () {
                expect(DocumentManager.getWorkingSet().length).toEqual(3);
            });
        });

        it("Close others below", function () {
            docSelectIndex = 1;
            cmdToRun       = "file.close_below";

            runs(runCloseOthers);

            //we created 5 files and selected 2nd file (index = 1), then we ran "close others below". 
            //At this point we should have only 2 files in working set.
            runs(function () {
                expect(DocumentManager.getWorkingSet().length).toEqual(2);
            });
        });
    });
});
