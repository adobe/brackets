/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
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
        SpecRunnerUtils     = require("./SpecRunnerUtils.js");

    describe("WorkingSetView", function () {
    
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

            var didOpen = false, gotError = false;
            
            var openAndMakeDirty = function (path) {
                // open file
                runs(function () {
                    FileViewController.openAndSelectDocument(path, FileViewController.PROJECT_MANAGER)
                        .done(function () { didOpen = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didOpen && !gotError; }, "FILE_OPEN on file timeout", 1000);

                // change editor content to make doc dirty
                runs(function () {
                    var editor = DocumentManager.getCurrentDocument()._editor;
                    editor.setValue("dirty document");
                    expect(DocumentManager.getCurrentDocument().isDirty).toBe(true);
                });
            
            };
            
            openAndMakeDirty(testPath + "/file_one.js");
            openAndMakeDirty(testPath + "/file_two.js");
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });

        it("should add a list item when a file is dirtied", function () {
            // check if files are added to work set and dirty icons are present
            runs(function () {
                var listItems = testWindow.$("#open-files-container > ul").children();
                expect(listItems.length).toBe(2);
                expect(listItems.find("a").get(0).text === "file_one.js").toBeTruthy();
                expect(listItems.find(".file-status-icon").length).toBe(2);
            });
            
        });
        
        
        it("should remove a list item when a file is closed", function () {
            DocumentManager.getCurrentDocument().markClean(); // so we can close without a save dialog
           
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
            var $ = testWindow.$;
            var secondItem =  $($("#open-files-container > ul").children()[1]);
            secondItem.trigger('click');
            
            var listItems = $("#open-files-container > ul").children();
            expect($(listItems[0]).hasClass("selected")).not.toBeTruthy();
            expect($(listItems[1]).hasClass("selected")).toBeTruthy();
                           
        });
        
        it("should rebuild the ui from the model correctly", function () {
            // force the test window to initialize to unit test preferences
            // for just this test
            runs(function () {
                localStorage.setItem("doLoadPreferences", true);
            });

            // close test window while working set has 2 files
            SpecRunnerUtils.closeTestWindow();

            // reopen without loading a project
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
            });

            // files should be in the working set
            runs(function () {
                var listItems = testWindow.$("#open-files-container > ul").children();
                expect(listItems.find("a").get(0).text === "file_one.js").toBeTruthy();
                expect(listItems.find("a").get(1).text === "file_two.js").toBeTruthy();

                // files should be clean
                expect(listItems.find(".file-status-icon dirty").length).toBe(0);

                // file_two.js should be active
                expect($(listItems[1]).hasClass("selected")).toBeTruthy();

                localStorage.removeItem("doLoadPreferences", true);
            });
        });
        
        it("should close a file when the user clicks the close button", function () {
            var $ = testWindow.$;
                    
            // make 2nd doc clean
            var docList = DocumentManager.getWorkingSet();
			docList[1].markClean();
                            
            // make the first one active
            DocumentManager.showInEditor(docList[0]);
                            
            // hover over and click on close icon of 2nd list item
            var secondItem =  $($("#open-files-container > ul").children()[1]);
            secondItem.trigger('mouseover');
            var closeIcon = secondItem.find(".file-status-icon");
            expect(closeIcon.length).toBe(1);
                            
            // simulate click
            var didClose = false;
            $(DocumentManager).on("workingSetRemove", function (event, removedDoc) {
                didClose = true;
            });
            
            closeIcon.trigger('click');
            waitsFor(function () { return didClose; }, "click on working set close icon timeout", 1000);
                            
            var listItems = $("#open-files-container > ul").children();
            expect(listItems.length).toBe(1);
            expect(listItems.find("a").get(0).text === "file_one.js").toBeTruthy();
                            
                            
        });
        
        it("should remove dirty icon when file becomes clean", function () {
            // check that dirty icon is removed when docs are cleaned
            var docList = DocumentManager.getWorkingSet();
            docList[0].markClean();
            var listItems = testWindow.$("#open-files-container > ul").children();
            expect(listItems.find(".file-status-icon dirty").length).toBe(0);
        });
            
    });
});