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

/*global describe, it, xit, expect, beforeEach, afterEach, waitsFor, waitsForDone, runs, beforeFirst, afterLast, waits */

define(function (require, exports, module) {
    "use strict";

    var CommandManager,         // Load from brackets.test
        Commands,               // Load from brackets.test
        DocumentManager,        // Load from brackets.test
        FileViewController,     // Load from brackets.test
        MainViewManager,        // Load from brackets.test
        ProjectManager,         // Load from brackets.test
        WorkingSetView,
        SpecRunnerUtils         = require("spec/SpecRunnerUtils");


    describe("WorkingSetView", function () {

        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/WorkingSetView-test-files"),
            testWindow,
            workingSetListItemCount;

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
                WorkingSetView      = testWindow.brackets.test.WorkingSetView;
                ProjectManager      = testWindow.brackets.test.ProjectManager;

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
        });

        afterLast(closeTestWindow);

        beforeEach(function () {
            workingSetListItemCount = 0;

            openAndMakeDirty(testPath + "/file_one.js");
            openAndMakeDirty(testPath + "/file_two.js");

            // Wait for both files to be added to the working set
            waitsFor(function () { return workingSetListItemCount === 2; }, "workingSetListItemCount to equal 2", 1000);
        });

        afterEach(function () {
            testWindow.closeAllFiles();
        });

        it("should add a list item when a file is dirtied", function () {
            // check if files are added to work set and dirty icons are present
            runs(function () {
                var $listItems = testWindow.$(".open-files-container > ul").children();
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
                var listItems = testWindow.$(".open-files-container > ul").children();
                expect(listItems.length).toBe(1);
            });
        });

        it("should make a file that is clicked the current one in the editor", function () {
            runs(function () {
                var $ = testWindow.$;
                var secondItem =  $($(".open-files-container > ul").children()[1]);
                secondItem.trigger("click");

                var $listItems = $(".open-files-container > ul").children();
                expect($($listItems[0]).hasClass("selected")).not.toBeTruthy();
                expect($($listItems[1]).hasClass("selected")).toBeTruthy();
            });
        });

        xit("should rebuild the ui from the model correctly", function () {
            // force the test window to initialize to unit test preferences
            // for just this test
            runs(function () {
                window.localStorage.setItem("doLoadPreferences", true);
            });

            // remove temporary unit test preferences with a single-spec after()
            this.after(function () {
                window.localStorage.removeItem("doLoadPreferences");
            });

            // close test window while working set has 2 files (see beforeEach())
            closeTestWindow();

            // reopen brackets test window to initialize unit test working set
            createTestWindow(this, false);

            var $listItems;

            // wait for working set to populate
            waitsFor(
                function () {
                    // check working set UI list content
                    $listItems = testWindow.$(".open-files-container > ul").children();
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
            var fileList = MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE);

            runs(function () {
                var doc0 = DocumentManager.getOpenDocumentForPath(fileList[0].fullPath);
                var doc1 = DocumentManager.getOpenDocumentForPath(fileList[1].fullPath);
                doc1._markClean();

                // make the first one active
                MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc0);

                // hover over and click on close icon of 2nd list item
                var secondItem =  $($(".open-files-container > ul").children()[1]);
                secondItem.trigger("mouseover");
                var closeIcon = secondItem.find(".file-status-icon");
                expect(closeIcon.length).toBe(1);

                // simulate click
                MainViewManager.on("workingSetRemove", function (event, removedFile) {
                    didClose = true;
                });

                closeIcon.trigger("mousedown");
            });

            waitsFor(function () { return didClose; }, "click on working set close icon timeout", 1000);

            runs(function () {
                var $listItems = $(".open-files-container > ul").children();
                expect($listItems.length).toBe(1);
                expect($listItems.find("a").get(0).text === "file_one.js").toBeTruthy();
            });
        });

        it("should remove dirty icon when file becomes clean", function () {
            runs(function () {
                // check that dirty icon is removed when docs are cleaned
                var fileList = MainViewManager.getWorkingSet(MainViewManager.ACTIVE_PANE);
                var doc0 = DocumentManager.getOpenDocumentForPath(fileList[0].fullPath);
                doc0._markClean();

                var listItems = testWindow.$(".open-files-container > ul").children();
                expect(listItems.find(".file-status-icon dirty").length).toBe(0);
            });
        });

        it("should show the file in project tree when a file is being renamed", function () {
            var $ = testWindow.$;
            var secondItem =  $(".open-files-container > ul").children().eq(1);
            var fileName = secondItem.text();

            runs(function () {
                secondItem.trigger("click");

                // Calling FILE_RENAME synchronously works fine here since the item is already visible in project file tree.
                // However, if the selected item is not already visible in the tree, this command will complete asynchronously.
                // In that case, waitsFor will be needed before continuing with the rest of the test.
                CommandManager.execute(Commands.FILE_RENAME);
            });

            waits(ProjectManager._RENDER_DEBOUNCE_TIME + 50);

            runs(function () {
                expect($("#project-files-container ul input").val()).toBe(fileName);
            });
        });

        it("should show a directory name next to the file name when two files with same names are opened", function () {
            runs(function () {
                // Count currently opened files
                var workingSetListItemCountBeforeTest = workingSetListItemCount;

                // First we need to open another file
                openAndMakeDirty(testPath + "/directory/file_one.js");

                // Wait for file to be added to the working set
                waitsFor(function () { return workingSetListItemCount === workingSetListItemCountBeforeTest + 1; }, 1000);

                runs(function () {
                    // Two files with the same name file_one.js should be now opened
                    var $list = testWindow.$(".open-files-container > ul");
                    expect($list.find(".directory").length).toBe(2);

                    // Now close last opened file to hide the directories again
                    DocumentManager.getCurrentDocument()._markClean(); // so we can close without a save dialog
                    waitsForDone(CommandManager.execute(Commands.FILE_CLOSE), "timeout on FILE_CLOSE", 1000);

                    // there should be no more directories shown
                    runs(function () {
                        expect($list.find(".directory").length).toBe(0);
                    });
                });
            });
        });

        it("should show different directory names, when two files of the same name are opened, located in folders with same name", function () {
            runs(function () {
                // Count currently opened files
                var workingSetListItemCountBeforeTest = workingSetListItemCount;

                // Open both files
                openAndMakeDirty(testPath + "/directory/file_one.js");
                openAndMakeDirty(testPath + "/directory/directory/file_one.js");

                // Wait for them to load
                waitsFor(function () { return workingSetListItemCount === workingSetListItemCountBeforeTest + 2; }, "Open file count to be increased by 2", 1000);

                runs(function () {
                    // Collect all directory names displayed
                    var $list = testWindow.$(".open-files-container > ul");
                    var names = $list.find(".directory").map(function () {
                        return $(this).text();
                    }).toArray();

                    // All directory names should be unique
                    var uniq = 0, map = {};
                    names.forEach(function (name) {
                        if (!map[name]) {
                            map[name] = true;
                            uniq++;
                        }
                    });
                    expect(uniq).toBe(names.length);
                });
            });
        });

        it("should callback for icons", function () {
            runs(function () {
                function iconProvider(file) {
                    return "<img src='" + file.name + ".jpg' class='icon' />";
                }

                WorkingSetView.addIconProvider(iconProvider);

                runs(function () {
                    // Collect all icon filenames used
                    var $list = testWindow.$(".open-files-container > ul");
                    var icons = $list.find(".icon").map(function () {
                        return $(this).attr("src");
                    }).toArray();

                    // All directory names should be unique
                    expect(icons.length).toBe(2);
                    expect(icons[0]).toBe("file_one.js.jpg");
                    expect(icons[1]).toBe("file_two.js.jpg");
                });
            });
        });

        it("should callback for class", function () {
            runs(function () {
                var master = ["one", "two"],
                    classes = master.slice(0);

                function classProvider(file) {
                    return classes.pop();
                }

                WorkingSetView.addClassProvider(classProvider);

                runs(function () {
                    var $list = testWindow.$(".open-files-container > li"),
                        test = master.slice(0);

                    $list.each(function (number, el) {
                        expect($(el).hasClass(test.pop())).toBeTruthy();
                    });
                });
            });
        });

        it("should allow refresh to be used to update the class list", function () {
            runs(function () {
                function classProvider(file) {
                    return "one";
                }

                WorkingSetView.addClassProvider(classProvider);

                var master = ["three", "four"];

                WorkingSetView.refresh();

                runs(function () {
                    var $list = testWindow.$(".open-files-container > li"),
                        test = master.slice(0);

                    $list.each(function (number, el) {
                        expect($(el).hasClass(test.pop())).toBeTruthy();
                        expect($(el).hasClass("one")).toBeFalsy();
                    });
                });
            });
        });
    });
});
