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
/*global $: false, define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules from brackets.test
    var CommandManager,
        Commands,
        DocumentManager,
        FileViewController,
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    describe("WorkingSetView", function () {
        
        this.category = "integration";
    
        var testPath = SpecRunnerUtils.getTestPath("/spec/WorkingSetView-test-files");
        var testWindow;

        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
                FileViewController  = testWindow.brackets.test.FileViewController;

                // Open a directory
                SpecRunnerUtils.loadProjectInTestWindow(testPath);
            });

            var workingSetCount = 0;
            
            runs(function () {
                // Initialize: register listeners
                testWindow.$(DocumentManager).on("workingSetAdd", function (event, addedFile) {
                    workingSetCount++;
                });
            });
            
            var openAndMakeDirty = function (path) {
                var doc, didOpen = false, gotError = false;
                
                // open file
                runs(function () {
                    FileViewController.openAndSelectDocument(path, FileViewController.PROJECT_MANAGER)
                        .done(function () { didOpen = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didOpen && !gotError; }, "FILE_OPEN on file timeout", 1000);

                // change editor content to make doc dirty which adds it to the working set
                runs(function () {
                    doc = DocumentManager.getCurrentDocument();
                    doc.setText("dirty document");
                });
            };
            
            openAndMakeDirty(testPath + "/file_one.js");
            openAndMakeDirty(testPath + "/file_two.js");
            
            // Wait for both files to be added to the working set
            waitsFor(function () { return workingSetCount === 2; }, 1000);
        });

        afterEach(function () {
            testWindow          = null;
            CommandManager      = null;
            Commands            = null;
            DocumentManager     = null;
            FileViewController  = null;
            SpecRunnerUtils.closeTestWindow();
        });

        it("should add a list item when a file is dirtied", function () {
            // check if files are added to work set and dirty icons are present
            runs(function () {
                var $listItems = testWindow.$("#open-files-container > ul").children();
                expect($listItems.length).toBe(2);
                expect($listItems.find("a").get(0).text === "file_one.js").toBeTruthy();
                expect($listItems.find(".file-status-icon").length).toBe(2);
            });
        });
        
        it("should remove a list item when a file is closed", function () {
            DocumentManager.getCurrentDocument()._markClean(); // so we can close without a save dialog
           
            // close the document
            var didClose = false, gotError = false;
            runs(function () {
                CommandManager.execute(Commands.FILE_CLOSE)
                    .done(function () { didClose = true; })
                    .fail(function () { gotError = true; });
            });
            waitsFor(function () { return didClose && !gotError; }, "FILE_OPEN on file timeout", 1000);
                    
            // check there are no list items
            runs(function () {
                var listItems = testWindow.$("#open-files-container > ul").children();
                expect(listItems.length).toBe(1);
            });
        });
        
        it("should make a file that is clicked the current one in the editor", function () {
            runs(function () {
                var $ = testWindow.$;
                var secondItem =  $($("#open-files-container > ul").children()[1]);
                secondItem.trigger('click');
                
                var $listItems = $("#open-files-container > ul").children();
                expect($($listItems[0]).hasClass("selected")).not.toBeTruthy();
                expect($($listItems[1]).hasClass("selected")).toBeTruthy();
            });
        });
        
        it("should rebuild the ui from the model correctly", function () {
            // force the test window to initialize to unit test preferences
            // for just this test
            runs(function () {
                localStorage.setItem("doLoadPreferences", true);
            });
            
            // remove temporary unit test preferences with a single-spec after() 
            this.after(function () {
                localStorage.removeItem("doLoadPreferences");
            });

            // close test window while working set has 2 files (see beforeEach())
            SpecRunnerUtils.closeTestWindow();

            // reopen brackets test window to initialize unit test working set
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
            });
            
            var $listItems;
            
            // wait for working set to populate
            waitsFor(
                function () {
                    // check working set UI list content
                    $listItems = testWindow.$("#open-files-container > ul").children();
                    return ($listItems.length === 2) && $($listItems[1]).hasClass("selected");
                },
                1000
            );

            // files should be in the working set
            runs(function () {
                expect($listItems.find("a").get(0).text === "file_one.js").toBeTruthy();
                expect($listItems.find("a").get(1).text === "file_two.js").toBeTruthy();

                // files should be clean
                expect($listItems.find(".file-status-icon dirty").length).toBe(0);

                // file_two.js should be active
                expect($($listItems[1]).hasClass("selected")).toBeTruthy();
            });
        });
        
        it("should close a file when the user clicks the close button", function () {
            var $ = testWindow.$;
            var didClose = false;
                    
            // make 2nd doc clean
            var fileList = DocumentManager.getWorkingSet();

            runs(function () {
                var doc0 = DocumentManager.getOpenDocumentForPath(fileList[0].fullPath);
                var doc1 = DocumentManager.getOpenDocumentForPath(fileList[1].fullPath);
                doc1._markClean();
                                
                // make the first one active
                DocumentManager.setCurrentDocument(doc0);
                                
                // hover over and click on close icon of 2nd list item
                var secondItem =  $($("#open-files-container > ul").children()[1]);
                secondItem.trigger('mouseover');
                var closeIcon = secondItem.find(".file-status-icon");
                expect(closeIcon.length).toBe(1);
                                
                // simulate click
                $(DocumentManager).on("workingSetRemove", function (event, removedFile) {
                    didClose = true;
                });

                closeIcon.trigger('mousedown');
            });
            
            waitsFor(function () { return didClose; }, "click on working set close icon timeout", 1000);
                            
            runs(function () {
                var $listItems = $("#open-files-container > ul").children();
                expect($listItems.length).toBe(1);
                expect($listItems.find("a").get(0).text === "file_one.js").toBeTruthy();
            });
        });
        
        it("should remove dirty icon when file becomes clean", function () {
            runs(function () {
                // check that dirty icon is removed when docs are cleaned
                var fileList = DocumentManager.getWorkingSet();
                var doc0 = DocumentManager.getOpenDocumentForPath(fileList[0].fullPath);
                doc0._markClean();
                
                var listItems = testWindow.$("#open-files-container > ul").children();
                expect(listItems.find(".file-status-icon dirty").length).toBe(0);
            });
        });
        
        it("should show the file in project tree when a file is being renamed", function () {
            runs(function () {
                var $ = testWindow.$;
                var secondItem =  $("#open-files-container > ul").children().eq(1);
                var fileName = secondItem.text();
                secondItem.trigger('click');
                
                // Calling FILE_RENAME synchronously works fine here since the item is already visible in project file tree.
                // However, if the selected item is not already visible in the tree, this command will complete asynchronously.
                // In that case, waitsFor will be needed before continuing with the rest of the test.
                CommandManager.execute(Commands.FILE_RENAME);
                
                var $projectFileItems = $("#project-files-container > ul").children();
    
                expect($projectFileItems.find("a.jstree-clicked").eq(0).siblings("input").eq(0).val()).toBe(fileName);
            });
        });
            
    });
});