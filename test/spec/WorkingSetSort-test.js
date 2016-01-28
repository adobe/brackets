/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, expect, waitsFor, runs, beforeFirst, afterLast */

define(function (require, exports, module) {
    "use strict";

    var CommandManager,         // Load from brackets.test
        Commands,               // Load from brackets.test
        DocumentManager,        // Load from brackets.test
        FileViewController,     // Load from brackets.test
        MainViewManager,        // Load from brackets.test
        SpecRunnerUtils         = require("spec/SpecRunnerUtils");


    describe("WorkingSetSort", function () {

        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/WorkingSetView-test-files"),
            testWindow,
            workingSetListItemCount = 0;

        function openAndMakeDirty(path) {
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
        }

        function createTestWindow(spec, loadProject) {
            SpecRunnerUtils.createTestWindowAndRun(spec, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                Commands            = testWindow.brackets.test.Commands;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
                FileViewController  = testWindow.brackets.test.FileViewController;
                MainViewManager     = testWindow.brackets.test.MainViewManager;

                // Open a directory
                if (loadProject) {
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                }
            });

            runs(function () {
                // Initialize: register listeners
                MainViewManager.on("workingSetAdd", function (event, addedFile) {
                    workingSetListItemCount++;
                });
            });
        }

        function closeTestWindow() {
            testWindow          = null;
            CommandManager      = null;
            Commands            = null;
            DocumentManager     = null;
            FileViewController  = null;
            MainViewManager     = null;
            SpecRunnerUtils.closeTestWindow();
        }

        beforeFirst(function () {
            createTestWindow(this, true);

            workingSetListItemCount = 0;

            openAndMakeDirty(testPath + "/file_four.html");
            openAndMakeDirty(testPath + "/file_zero.css");
            openAndMakeDirty(testPath + "/file_two.js");

            // Wait for both files to be added to the working set
            waitsFor(function () { return workingSetListItemCount === 3; }, "workingSetListItemCount to equal 3", 1000);
        });

        afterLast(function () {
            testWindow.closeAllFiles();
            closeTestWindow();
        });

        it("should sort list by name", function () {
            // sort list by name
            CommandManager.execute(Commands.CMD_WORKINGSET_SORT_BY_NAME);

            // confirm files sorted correctly
            var $listItems = testWindow.$(".open-files-container > ul").children();
            expect($listItems.length).toBe(workingSetListItemCount);
            expect($listItems.find("a").get(0).text === "file_four.html").toBeTruthy();
            expect($listItems.find("a").get(1).text === "file_two.js").toBeTruthy();
            expect($listItems.find("a").get(2).text === "file_zero.css").toBeTruthy();
            expect($listItems.find(".file-status-icon").length).toBe(workingSetListItemCount);
        });

        it("should sort list as added", function () {
            // sort list as added
            CommandManager.execute(Commands.CMD_WORKINGSET_SORT_BY_ADDED);

            // confirm files sorted correctly
            var $listItems = testWindow.$(".open-files-container > ul").children();
            expect($listItems.length).toBe(workingSetListItemCount);
            expect($listItems.find("a").get(0).text === "file_two.js").toBeTruthy();
            expect($listItems.find("a").get(1).text === "file_zero.css").toBeTruthy();
            expect($listItems.find("a").get(2).text === "file_four.html").toBeTruthy();
            expect($listItems.find(".file-status-icon").length).toBe(workingSetListItemCount);
        });

        it("should sort list by type", function () {
            // sort list by type
            CommandManager.execute(Commands.CMD_WORKINGSET_SORT_BY_TYPE);

            // confirm files sorted correctly
            var $listItems = testWindow.$(".open-files-container > ul").children();
            expect($listItems.length).toBe(workingSetListItemCount);
            expect($listItems.find("a").get(0).text === "file_zero.css").toBeTruthy();
            expect($listItems.find("a").get(1).text === "file_four.html").toBeTruthy();
            expect($listItems.find("a").get(2).text === "file_two.js").toBeTruthy();
            expect($listItems.find(".file-status-icon").length).toBe(workingSetListItemCount);
        });

        it("should sort list by type automatically", function () {
            // toggle the auto sort on
            CommandManager.execute(Commands.CMD_WORKING_SORT_TOGGLE_AUTO);

            // open another file, which should be added and auto-sorted into the list
            openAndMakeDirty(testPath + "/file_one.js");

            waitsFor(function () { return workingSetListItemCount === 4; }, "workingSetListItemCount to equal 4", 5000);

            runs(function () {
                // confirm files sorted correctly
                var $listItems = testWindow.$(".open-files-container > ul").children();
                expect($listItems.length).toBe(workingSetListItemCount);
                expect($listItems.find("a").get(0).text === "file_zero.css").toBeTruthy();
                expect($listItems.find("a").get(1).text === "file_four.html").toBeTruthy();
                expect($listItems.find("a").get(2).text === "file_one.js").toBeTruthy();
                expect($listItems.find("a").get(3).text === "file_two.js").toBeTruthy();
                expect($listItems.find(".file-status-icon").length).toBe(workingSetListItemCount);
            });
        });

        it("should not sort list by type automatically", function () {
            // toggle the auto sort off
            CommandManager.execute(Commands.CMD_WORKING_SORT_TOGGLE_AUTO);

            // open another file, which should not be added and auto-sorted into the list
            openAndMakeDirty(testPath + "/file_three.js");

            waitsFor(function () { return workingSetListItemCount === 5; }, "workingSetListItemCount to equal 5", 5000);

            runs(function () {
                // confirm files sorted correctly
                var $listItems = testWindow.$(".open-files-container > ul").children();
                expect($listItems.length).toBe(workingSetListItemCount);
                expect($listItems.find("a").get(0).text === "file_zero.css").toBeTruthy();
                expect($listItems.find("a").get(1).text === "file_four.html").toBeTruthy();
                expect($listItems.find("a").get(2).text === "file_one.js").toBeTruthy();
                expect($listItems.find("a").get(3).text === "file_two.js").toBeTruthy();
                expect($listItems.find("a").get(4).text === "file_three.js").toBeTruthy();
                expect($listItems.find(".file-status-icon").length).toBe(workingSetListItemCount);
            });
        });

    });
});
