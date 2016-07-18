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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, describe, it, expect, beforeFirst, afterLast, beforeEach, afterEach, waits, waitsFor, waitsForDone, runs, spyOn */

define(function (require, exports, module) {
    "use strict";

    var Commands        = require("command/Commands"),
        KeyEvent        = require("utils/KeyEvent"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        FileSystemError = require("filesystem/FileSystemError"),
        FileUtils       = require("file/FileUtils"),
        FindUtils       = require("search/FindUtils"),
        Async           = require("utils/Async"),
        LanguageManager = require("language/LanguageManager"),
        StringUtils     = require("utils/StringUtils"),
        Strings         = require("strings"),
        _               = require("thirdparty/lodash");

    var PreferencesManager;

    var promisify = Async.promisify; // for convenience

    describe("FindInFiles", function () {

        this.category = "integration";

        var defaultSourcePath = SpecRunnerUtils.getTestPath("/spec/FindReplace-test-files"),
            testPath,
            nextFolderIndex = 1,
            searchResults,
            CommandManager,
            DocumentManager,
            MainViewManager,
            EditorManager,
            FileFilters,
            FileSystem,
            File,
            FindInFiles,
            FindInFilesUI,
            ProjectManager,
            testWindow,
            $;

        beforeFirst(function () {
            SpecRunnerUtils.createTempDirectory();

            // Create a new window that will be shared by ALL tests in this spec.
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;

                // Load module instances from brackets.test
                CommandManager      = testWindow.brackets.test.CommandManager;
                DocumentManager     = testWindow.brackets.test.DocumentManager;
                EditorManager       = testWindow.brackets.test.EditorManager;
                FileFilters         = testWindow.brackets.test.FileFilters;
                FileSystem          = testWindow.brackets.test.FileSystem;
                File                = testWindow.brackets.test.File;
                FindInFiles         = testWindow.brackets.test.FindInFiles;
                FindInFilesUI       = testWindow.brackets.test.FindInFilesUI;
                ProjectManager      = testWindow.brackets.test.ProjectManager;
                MainViewManager     = testWindow.brackets.test.MainViewManager;
                $                   = testWindow.$;
                PreferencesManager  = testWindow.brackets.test.PreferencesManager;
                PreferencesManager.set("findInFiles.nodeSearch", false);
                PreferencesManager.set("findInFiles.instantSearch", false);
            });
        });

        afterLast(function () {
            CommandManager      = null;
            DocumentManager     = null;
            EditorManager       = null;
            FileSystem          = null;
            File                = null;
            FindInFiles         = null;
            FindInFilesUI       = null;
            ProjectManager      = null;
            MainViewManager     = null;
            $                   = null;
            testWindow          = null;
            PreferencesManager  = null;
            SpecRunnerUtils.closeTestWindow();
            SpecRunnerUtils.removeTempDirectory();
        });

        function openProject(sourcePath) {
            testPath = sourcePath;
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
        }


        // Note: these utilities can be called without wrapping in a runs() block, because all their top-level
        // statements are calls to runs() or waitsFor() (or other functions that make the same guarantee). But after
        // calling one of these, calls to other Jasmine APIs (e.g. such as expects()) *must* be wrapped in runs().

        function waitForSearchBarClose() {
            // Make sure search bar from previous test has animated out fully
            waitsFor(function () {
                return $(".modal-bar").length === 0;
            }, "search bar close");
        }

        function openSearchBar(scope, showReplace) {
            runs(function () {
                FindInFiles._searchDone = false;
                FindInFilesUI._showFindBar(scope, showReplace);
            });
            waitsFor(function () {
                return $(".modal-bar").length === 1;
            }, "search bar open");
            runs(function () {
                // Reset the regexp and case-sensitivity toggles.
                ["#find-regexp", "#find-case-sensitive"].forEach(function (button) {
                    if ($(button).is(".active")) {
                        $(button).click();
                        expect($(button).is(".active")).toBe(false);
                    }
                });
            });
        }

        function closeSearchBar() {
            runs(function () {
                FindInFilesUI._closeFindBar();
            });
            waitForSearchBarClose();
        }

        function executeSearch(searchString) {
            runs(function () {
                var $searchField = $("#find-what");
                $searchField.val(searchString).trigger("input");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $searchField[0]);
            });
            waitsFor(function () {
                return FindInFiles._searchDone;
            }, "Find in Files done");
        }

        function numMatches(results) {
            return _.reduce(_.pluck(results, "matches"), function (sum, matches) {
                return sum + matches.length;
            }, 0);
        }

        function doSearch(options) {
            runs(function () {
                FindInFiles.doSearchInScope(options.queryInfo, null, null, options.replaceText).done(function (results) {
                    searchResults = results;
                });
            });
            waitsFor(function () { return searchResults; }, 1000, "search completed");
            runs(function () {
                expect(numMatches(searchResults)).toBe(options.numMatches);
            });
        }


        // The functions below are *not* safe to call without wrapping in runs(), if there were any async steps previously
        // (including calls to any of the utilities above)

        function doReplace(options) {
            return FindInFiles.doReplace(searchResults, options.replaceText, {
                forceFilesOpen: options.forceFilesOpen,
                isRegexp: options.queryInfo.isRegexp
            });
        }

        /**
         * Helper function that calls the given asynchronous processor once on each file in the given subtree
         * and returns a promise that's resolved when all files are processed.
         * @param {string} rootPath The root of the subtree to search.
         * @param {function(string, string): $.Promise} processor The function that processes each file. Args are:
         *      contents: the contents of the file
         *      fullPath: the full path to the file on disk
         * @return {$.Promise} A promise that is resolved when all files are processed, or rejected if there was
         *      an error reading one of the files or one of the process steps was rejected.
         */
        function visitAndProcessFiles(rootPath, processor) {
            var rootEntry = FileSystem.getDirectoryForPath(rootPath),
                files = [];

            function visitor(file) {
                if (!file.isDirectory) {
                    // Skip binary files, since we don't care about them for these purposes and we can't read them
                    // to get their contents.
                    if (!LanguageManager.getLanguageForPath(file.fullPath).isBinary()) {
                        files.push(file);
                    }
                }
                return true;
            }
            return promisify(rootEntry, "visit", visitor).then(function () {
                return Async.doInParallel(files, function (file) {
                    return promisify(file, "read").then(function (contents) {
                        return processor(contents, file.fullPath);
                    });
                });
            });
        }

        function ensureParentExists(file) {
            var parentDir = FileSystem.getDirectoryForPath(file.parentPath);
            return promisify(parentDir, "exists").then(function (exists) {
                if (!exists) {
                    return promisify(parentDir, "create");
                }
                return null;
            });
        }

        function copyWithLineEndings(src, dest, lineEndings) {
            function copyOneFileWithLineEndings(contents, srcPath) {
                var destPath = dest + srcPath.slice(src.length),
                    destFile = FileSystem.getFileForPath(destPath),
                    newContents = FileUtils.translateLineEndings(contents, lineEndings);
                return ensureParentExists(destFile).then(function () {
                    return promisify(destFile, "write", newContents);
                });
            }

            return promisify(FileSystem.getDirectoryForPath(dest), "create").then(function () {
                return visitAndProcessFiles(src, copyOneFileWithLineEndings);
            });
        }

        // Creates a clean copy of the test project before each test. We don't delete the old
        // folders as we go along (to avoid problems with deleting the project out from under the
        // open test window); we just delete the whole temp folder at the end.
        function openTestProjectCopy(sourcePath, lineEndings) {
            testPath = SpecRunnerUtils.getTempDirectory() + "/find-in-files-test-" + (nextFolderIndex++);
            runs(function () {
                if (lineEndings) {
                    waitsForDone(copyWithLineEndings(sourcePath, testPath, lineEndings), "copy test files with line endings");
                } else {
                    // Note that we don't skip image files in this case, but it doesn't matter since we'll
                    // only compare files that have an associated file in the known goods folder.
                    waitsForDone(SpecRunnerUtils.copy(sourcePath, testPath), "copy test files");
                }
            });
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
        }

        beforeEach(function () {
            searchResults = null;
        });

        describe("Find", function () {
            beforeEach(function () {
                openProject(defaultSourcePath);
            });

            afterEach(closeSearchBar);

            it("should find all occurences in project", function () {
                openSearchBar();
                executeSearch("foo");

                runs(function () {
                    var fileResults = FindInFiles.searchModel.results[testPath + "/bar.txt"];
                    expect(fileResults).toBeFalsy();

                    fileResults = FindInFiles.searchModel.results[testPath + "/foo.html"];
                    expect(fileResults).toBeTruthy();
                    expect(fileResults.matches.length).toBe(7);

                    fileResults = FindInFiles.searchModel.results[testPath + "/foo.js"];
                    expect(fileResults).toBeTruthy();
                    expect(fileResults.matches.length).toBe(4);

                    fileResults = FindInFiles.searchModel.results[testPath + "/css/foo.css"];
                    expect(fileResults).toBeTruthy();
                    expect(fileResults.matches.length).toBe(3);
                });
            });

            it("should ignore known binary file types", function () {
                var $dlg, actualMessage, expectedMessage,
                    exists = false,
                    done = false,
                    imageDirPath = testPath + "/images";

                runs(function () {
                    // Set project to have only images
                    SpecRunnerUtils.loadProjectInTestWindow(imageDirPath);

                    // Verify an image exists in folder
                    var file = FileSystem.getFileForPath(testPath + "/images/icon_twitter.png");

                    file.exists(function (fileError, fileExists) {
                        exists = fileExists;
                        done = true;
                    });
                });

                waitsFor(function () {
                    return done;
                }, "file.exists");

                runs(function () {
                    expect(exists).toBe(true);
                    openSearchBar();
                });

                runs(function () {
                    // Launch filter editor
                    FileFilters.editFilter({ name: "", patterns: [] }, -1);

                    // Dialog should state there are 0 files in project
                    $dlg = $(".modal");
                    expectedMessage = StringUtils.format(Strings.FILTER_FILE_COUNT_ALL, 0, Strings.FIND_IN_FILES_NO_SCOPE);
                });

                // Message loads asynchronously, but dialog should eventually state: "Allows all 0 files in project"
                waitsFor(function () {
                    actualMessage   = $dlg.find(".exclusions-filecount").text();
                    return (actualMessage === expectedMessage);
                }, "display file count");

                runs(function () {
                    // Dismiss filter dialog (OK button is disabled, have to click on Cancel)
                    $dlg.find(".dialog-button[data-button-id='cancel']").click();

                    // Close search bar
                    var $searchField = $(".modal-bar #find-group input");
                    SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keydown", $searchField[0]);
                });

                runs(function () {
                    // Set project back to main test folder
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
            });

            it("should ignore unreadable files", function () {
                // Add a nonexistent file to the ProjectManager.getAllFiles() result, which will force a file IO error
                // when we try to read the file later. Similar errors may arise in real-world for non-UTF files, etc.
                SpecRunnerUtils.injectIntoGetAllFiles(testWindow, testPath + "/doesNotExist.txt");

                openSearchBar();
                executeSearch("foo");

                runs(function () {
                    expect(Object.keys(FindInFiles.searchModel.results).length).toBe(3);
                });
            });

            it("should find all occurences in folder", function () {
                var dirEntry = FileSystem.getDirectoryForPath(testPath + "/css/");
                openSearchBar(dirEntry);
                executeSearch("foo");

                runs(function () {
                    var fileResults = FindInFiles.searchModel.results[testPath + "/bar.txt"];
                    expect(fileResults).toBeFalsy();

                    fileResults = FindInFiles.searchModel.results[testPath + "/foo.html"];
                    expect(fileResults).toBeFalsy();

                    fileResults = FindInFiles.searchModel.results[testPath + "/foo.js"];
                    expect(fileResults).toBeFalsy();

                    fileResults = FindInFiles.searchModel.results[testPath + "/css/foo.css"];
                    expect(fileResults).toBeTruthy();
                    expect(fileResults.matches.length).toBe(3);
                });
            });

            it("should find all occurences in single file", function () {
                var fileEntry = FileSystem.getFileForPath(testPath + "/foo.js");
                openSearchBar(fileEntry);
                executeSearch("foo");

                runs(function () {
                    var fileResults = FindInFiles.searchModel.results[testPath + "/bar.txt"];
                    expect(fileResults).toBeFalsy();

                    fileResults = FindInFiles.searchModel.results[testPath + "/foo.html"];
                    expect(fileResults).toBeFalsy();

                    fileResults = FindInFiles.searchModel.results[testPath + "/foo.js"];
                    expect(fileResults).toBeTruthy();
                    expect(fileResults.matches.length).toBe(4);

                    fileResults = FindInFiles.searchModel.results[testPath + "/css/foo.css"];
                    expect(fileResults).toBeFalsy();
                });
            });

            it("should find start and end positions", function () {
                var filePath = testPath + "/foo.js",
                    fileEntry = FileSystem.getFileForPath(filePath);

                openSearchBar(fileEntry);
                executeSearch("callFoo");

                runs(function () {
                    var fileResults = FindInFiles.searchModel.results[filePath];
                    expect(fileResults).toBeTruthy();
                    expect(fileResults.matches.length).toBe(1);

                    var match = fileResults.matches[0];
                    expect(match.start.ch).toBe(13);
                    expect(match.start.line).toBe(6);
                    expect(match.end.ch).toBe(20);
                    expect(match.end.line).toBe(6);
                });
            });

            it("should keep dialog and show panel when there are results", function () {
                var filePath = testPath + "/foo.js",
                    fileEntry = FileSystem.getFileForPath(filePath);

                openSearchBar(fileEntry);
                executeSearch("callFoo");

                // With instant search, the Search Bar should not close on a search
                runs(function () {
                    var fileResults = FindInFiles.searchModel.results[filePath];
                    expect(fileResults).toBeTruthy();
                    expect($("#find-in-files-results").is(":visible")).toBeTruthy();
                    expect($(".modal-bar").length).toBe(1);
                });
            });

            it("should keep dialog and not show panel when there are no results", function () {
                var filePath = testPath + "/bar.txt",
                    fileEntry = FileSystem.getFileForPath(filePath);

                openSearchBar(fileEntry);
                executeSearch("abcdefghi");

                waitsFor(function () {
                    return (FindInFiles._searchDone);
                }, "search complete");

                runs(function () {
                    var result, resultFound = false;

                    // verify searchModel.results Object is empty
                    for (result in FindInFiles.searchModel.results) {
                        if (FindInFiles.searchModel.results.hasOwnProperty(result)) {
                            resultFound = true;
                        }
                    }
                    expect(resultFound).toBe(false);

                    expect($("#find-in-files-results").is(":visible")).toBeFalsy();
                    expect($(".modal-bar").length).toBe(1);

                    // Close search bar
                    var $searchField = $(".modal-bar #find-group input");
                    SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keydown", $searchField[0]);
                });
            });

            it("should open file in editor and select text when a result is clicked", function () {
                var filePath = testPath + "/foo.html",
                    fileEntry = FileSystem.getFileForPath(filePath);

                openSearchBar(fileEntry);
                executeSearch("foo");

                runs(function () {
                    // Verify no current document
                    var editor = EditorManager.getActiveEditor();
                    expect(editor).toBeFalsy();

                    // Get panel
                    var $searchResults = $("#find-in-files-results");
                    expect($searchResults.is(":visible")).toBeTruthy();

                    // Get list in panel
                    var $panelResults = $searchResults.find("table.bottom-panel-table tr");
                    expect($panelResults.length).toBe(8);   // 7 hits + 1 file section

                    // First item in list is file section
                    expect($($panelResults[0]).hasClass("file-section")).toBeTruthy();

                    // Click second item which is first hit
                    var $firstHit = $($panelResults[1]);
                    expect($firstHit.hasClass("file-section")).toBeFalsy();
                    $firstHit.click();

                    setTimeout(function () {
                        // Verify current document
                        editor = EditorManager.getActiveEditor();
                        expect(editor.document.file.fullPath).toEqual(filePath);

                        // Verify selection
                        expect(editor.getSelectedText().toLowerCase() === "foo");
                        waitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL), "closing all files");
                    }, 500);
                });
            });

            it("should open file in working set when a result is double-clicked", function () {
                var filePath = testPath + "/foo.js",
                    fileEntry = FileSystem.getFileForPath(filePath);

                openSearchBar(fileEntry);
                executeSearch("foo");

                runs(function () {
                    // Verify document is not yet in working set
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, filePath)).toBe(-1);

                    // Get list in panel
                    var $panelResults = $("#find-in-files-results table.bottom-panel-table tr");
                    expect($panelResults.length).toBe(5);   // 4 hits + 1 file section

                    // Double-click second item which is first hit
                    var $firstHit = $($panelResults[1]);
                    expect($firstHit.hasClass("file-section")).toBeFalsy();
                    $firstHit.dblclick();

                    // Verify document is now in working set
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, filePath)).not.toBe(-1);
                    waitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL), "closing all files");
                });
            });

            it("should update results when a result in a file is edited", function () {
                var filePath = testPath + "/foo.html",
                    fileEntry = FileSystem.getFileForPath(filePath),
                    panelListLen = 8,   // 7 hits + 1 file section
                    $panelResults;

                openSearchBar(fileEntry);
                executeSearch("foo");

                runs(function () {
                    // Verify document is not yet in working set
                    expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, filePath)).toBe(-1);

                    // Get list in panel
                    $panelResults = $("#find-in-files-results table.bottom-panel-table tr");
                    expect($panelResults.length).toBe(panelListLen);

                    // Click second item which is first hit
                    var $firstHit = $($panelResults[1]);
                    expect($firstHit.hasClass("file-section")).toBeFalsy();
                    $firstHit.click();
                });

                // Wait for file to open if not already open
                waitsFor(function () {
                    var editor = EditorManager.getActiveEditor();
                    return (editor.document.file.fullPath === filePath);
                }, 1000, "file open");

                // Wait for selection to change (this happens asynchronously after file opens)
                waitsFor(function () {
                    var editor = EditorManager.getActiveEditor(),
                        sel = editor.getSelection();
                    return (sel.start.line === 4 && sel.start.ch === 7);
                }, 1000, "selection change");

                runs(function () {
                    // Verify current selection
                    var editor = EditorManager.getActiveEditor();
                    expect(editor.getSelectedText().toLowerCase()).toBe("foo");

                    // Edit text to remove hit from file
                    var sel = editor.getSelection();
                    editor.document.replaceRange("Bar", sel.start, sel.end);
                });

                // Panel is updated asynchronously
                waitsFor(function () {
                    $panelResults = $("#find-in-files-results table.bottom-panel-table tr");
                    return ($panelResults.length < panelListLen);
                }, "Results panel updated");

                runs(function () {
                    // Verify list automatically updated
                    expect($panelResults.length).toBe(panelListLen - 1);

                    waitsForDone(CommandManager.execute(Commands.FILE_CLOSE, { _forceClose: true }), "closing file");
                });
            });

            it("should not clear the model until next search is actually committed", function () {
                var filePath = testPath + "/foo.js",
                    fileEntry = FileSystem.getFileForPath(filePath);

                openSearchBar(fileEntry);
                executeSearch("foo");

                runs(function () {
                    expect(Object.keys(FindInFiles.searchModel.results).length).not.toBe(0);
                });

                closeSearchBar();
                openSearchBar(fileEntry);

                runs(function () {
                    // Search model shouldn't be cleared from merely reopening search bar
                    expect(Object.keys(FindInFiles.searchModel.results).length).not.toBe(0);
                });

                closeSearchBar();

                runs(function () {
                    // Search model shouldn't be cleared after search bar closed without running a search
                    expect(Object.keys(FindInFiles.searchModel.results).length).not.toBe(0);
                });
            });
        });

        describe("Find results paging", function () {
            var expectedPages = [
                {
                    totalResults: 500,
                    totalFiles: 2,
                    overallFirstIndex: 1,
                    overallLastIndex: 100,
                    matchRanges: [{file: 0, filename: "manyhits-1.txt", first: 0, firstLine: 1, last: 99, lastLine: 100, pattern: /i'm going to\s+find this\s+now/}],
                    firstPageEnabled: false,
                    lastPageEnabled: true,
                    prevPageEnabled: false,
                    nextPageEnabled: true
                },
                {
                    totalResults: 500,
                    totalFiles: 2,
                    overallFirstIndex: 101,
                    overallLastIndex: 200,
                    matchRanges: [{file: 0, filename: "manyhits-1.txt", first: 0, firstLine: 101, last: 99, lastLine: 200, pattern: /i'm going to\s+find this\s+now/}],
                    firstPageEnabled: true,
                    lastPageEnabled: true,
                    prevPageEnabled: true,
                    nextPageEnabled: true
                },
                {
                    totalResults: 500,
                    totalFiles: 2,
                    overallFirstIndex: 201,
                    overallLastIndex: 300,
                    matchRanges: [
                        {file: 0, filename: "manyhits-1.txt", first: 0, firstLine: 201, last: 49, lastLine: 250, pattern: /i'm going to\s+find this\s+now/},
                        {file: 1, filename: "manyhits-2.txt", first: 0, firstLine: 1, last: 49, lastLine: 50, pattern: /you're going to\s+find this\s+now/}
                    ],
                    firstPageEnabled: true,
                    lastPageEnabled: true,
                    prevPageEnabled: true,
                    nextPageEnabled: true
                },
                {
                    totalResults: 500,
                    totalFiles: 2,
                    overallFirstIndex: 301,
                    overallLastIndex: 400,
                    matchRanges: [{file: 0, filename: "manyhits-2.txt", first: 0, firstLine: 51, last: 99, lastLine: 150, pattern: /you're going to\s+find this\s+now/}],
                    firstPageEnabled: true,
                    lastPageEnabled: true,
                    prevPageEnabled: true,
                    nextPageEnabled: true
                },
                {
                    totalResults: 500,
                    totalFiles: 2,
                    overallFirstIndex: 401,
                    overallLastIndex: 500,
                    matchRanges: [{file: 0, filename: "manyhits-2.txt", first: 0, firstLine: 151, last: 99, lastLine: 250, pattern: /you're going to\s+find this\s+now/}],
                    firstPageEnabled: true,
                    lastPageEnabled: false,
                    prevPageEnabled: true,
                    nextPageEnabled: false
                }
            ];

            function expectPageDisplay(options) {
                // Check the title
                expect($("#find-in-files-results .title").text().match("\\b" + options.totalResults + "\\b")).toBeTruthy();
                expect($("#find-in-files-results .title").text().match("\\b" + options.totalFiles + "\\b")).toBeTruthy();
                var paginationInfo = $("#find-in-files-results .pagination-col").text();
                expect(paginationInfo.match("\\b" + options.overallFirstIndex + "\\b")).toBeTruthy();
                expect(paginationInfo.match("\\b" + options.overallLastIndex + "\\b")).toBeTruthy();

                // Check for presence of file and first/last item rows within each file
                options.matchRanges.forEach(function (range) {
                    var $fileRow = $("#find-in-files-results tr.file-section[data-file-index='" + range.file + "']");
                    expect($fileRow.length).toBe(1);
                    expect($fileRow.find(".dialog-filename").text()).toEqual(range.filename);

                    var $firstMatchRow = $("#find-in-files-results tr[data-file-index='" + range.file + "'][data-item-index='" + range.first + "']");
                    expect($firstMatchRow.length).toBe(1);
                    expect($firstMatchRow.find(".line-number").text().match("\\b" + range.firstLine + "\\b")).toBeTruthy();
                    expect($firstMatchRow.find(".line-text").text().match(range.pattern)).toBeTruthy();

                    var $lastMatchRow = $("#find-in-files-results tr[data-file-index='" + range.file + "'][data-item-index='" + range.last + "']");
                    expect($lastMatchRow.length).toBe(1);
                    expect($lastMatchRow.find(".line-number").text().match("\\b" + range.lastLine + "\\b")).toBeTruthy();
                    expect($lastMatchRow.find(".line-text").text().match(range.pattern)).toBeTruthy();
                });

                // Check enablement of buttons
                expect($("#find-in-files-results .first-page").hasClass("disabled")).toBe(!options.firstPageEnabled);
                expect($("#find-in-files-results .last-page").hasClass("disabled")).toBe(!options.lastPageEnabled);
                expect($("#find-in-files-results .prev-page").hasClass("disabled")).toBe(!options.prevPageEnabled);
                expect($("#find-in-files-results .next-page").hasClass("disabled")).toBe(!options.nextPageEnabled);
            }

            it("should page forward, then jump back to first page, displaying correct contents at each step", function () {
                openProject(SpecRunnerUtils.getTestPath("/spec/FindReplace-test-files-manyhits"));
                openSearchBar();

                // This search will find 500 hits in 2 files. Since there are 100 hits per page, there should
                // be five pages, and the third page should have 50 results from the first file and 50 results
                // from the second file.
                executeSearch("find this");

                runs(function () {
                    var i;
                    for (i = 0; i < 5; i++) {
                        if (i > 0) {
                            $("#find-in-files-results .next-page").click();
                        }
                        expectPageDisplay(expectedPages[i]);
                    }

                    $("#find-in-files-results .first-page").click();
                    expectPageDisplay(expectedPages[0]);
                });
            });

            it("should jump to last page, then page backward, displaying correct contents at each step", function () {
                openProject(SpecRunnerUtils.getTestPath("/spec/FindReplace-test-files-manyhits"));

                executeSearch("find this");

                runs(function () {
                    var i;
                    $("#find-in-files-results .last-page").click();
                    for (i = 4; i >= 0; i--) {
                        if (i < 4) {
                            $("#find-in-files-results .prev-page").click();
                        }
                        expectPageDisplay(expectedPages[i]);
                    }
                });
            });
        });

        describe("SearchModel update on change events", function () {
            var oldResults, gotChange, wasQuickChange;

            function fullTestPath(path) {
                return testPath + "/" + path;
            }

            function expectUnchangedExcept(paths) {
                Object.keys(FindInFiles.searchModel.results).forEach(function (path) {
                    if (paths.indexOf(path) === -1) {
                        expect(FindInFiles.searchModel.results[path]).toEqual(oldResults[path]);
                    }
                });
            }

            beforeEach(function () {
                gotChange = false;
                oldResults = null;
                wasQuickChange = false;
                FindInFiles.searchModel.on("change.FindInFilesTest", function (event, quickChange) {
                    gotChange = true;
                    wasQuickChange = quickChange;
                });

                openTestProjectCopy(defaultSourcePath);
                doSearch({
                    queryInfo:       {query: "foo"},
                    numMatches:      14
                });
                runs(function () {
                    oldResults = _.cloneDeep(FindInFiles.searchModel.results);
                });
            });

            afterEach(function () {
                FindInFiles.searchModel.off(".FindInFilesTest");
                waitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL, { _forceClose: true }), "close all files");
            });

            describe("when filename changes", function () {
                it("should handle a filename change", function () {
                    runs(function () {
                        FindInFiles._fileNameChangeHandler(null, fullTestPath("foo.html"), fullTestPath("newfoo.html"));
                    });
                    waitsFor(function () { return gotChange; }, "model change event");
                    runs(function () {
                        expectUnchangedExcept([fullTestPath("foo.html"), fullTestPath("newfoo.html")]);
                        expect(FindInFiles.searchModel.results[fullTestPath("foo.html")]).toBeUndefined();
                        expect(FindInFiles.searchModel.results[fullTestPath("newfoo.html")]).toEqual(oldResults[fullTestPath("foo.html")]);
                        expect(FindInFiles.searchModel.countFilesMatches()).toEqual({files: 3, matches: 14});
                        expect(wasQuickChange).toBeFalsy();
                    });
                });

                it("should handle a folder change", function () {
                    runs(function () {
                        FindInFiles._fileNameChangeHandler(null, fullTestPath("css"), fullTestPath("newcss"));
                    });
                    waitsFor(function () { return gotChange; }, "model change event");
                    runs(function () {
                        expectUnchangedExcept([fullTestPath("css/foo.css"), fullTestPath("newcss/foo.css")]);
                        expect(FindInFiles.searchModel.results[fullTestPath("css/foo.css")]).toBeUndefined();
                        expect(FindInFiles.searchModel.results[fullTestPath("newcss/foo.css")]).toEqual(oldResults[fullTestPath("css/foo.css")]);
                        expect(FindInFiles.searchModel.countFilesMatches()).toEqual({files: 3, matches: 14});
                        expect(wasQuickChange).toBeFalsy();
                    });
                });
            });

            describe("when in-memory document changes", function () {
                it("should update the results when a matching line is added, updating line numbers and adding the match", function () {
                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: fullTestPath("foo.html") }));
                    });
                    runs(function () {
                        var doc = DocumentManager.getOpenDocumentForPath(fullTestPath("foo.html")),
                            i;
                        expect(doc).toBeTruthy();

                        // Insert another line containing "foo" immediately above the second "foo" match.
                        doc.replaceRange("this is a foo instance\n", {line: 5, ch: 0});

                        // This should update synchronously.
                        expect(gotChange).toBe(true);

                        var oldFileResults = oldResults[fullTestPath("foo.html")],
                            newFileResults = FindInFiles.searchModel.results[fullTestPath("foo.html")];

                        // First match should be unchanged.
                        expect(newFileResults.matches[0]).toEqual(oldFileResults.matches[0]);

                        // Next match should be the new match. We just check the offsets here, not everything in the match record.
                        expect(newFileResults.matches[1].start).toEqual({line: 5, ch: 10});
                        expect(newFileResults.matches[1].end).toEqual({line: 5, ch: 13});

                        // Rest of the matches should have had their lines adjusted.
                        for (i = 2; i < newFileResults.matches.length; i++) {
                            var newMatch = newFileResults.matches[i],
                                oldMatch = oldFileResults.matches[i - 1];
                            expect(newMatch.start).toEqual({line: oldMatch.start.line + 1, ch: oldMatch.start.ch});
                            expect(newMatch.end).toEqual({line: oldMatch.end.line + 1, ch: oldMatch.end.ch});
                        }

                        // There should be one new match.
                        expect(FindInFiles.searchModel.countFilesMatches()).toEqual({files: 3, matches: 15});

                        // Make sure the model is adding the flag that will make the view debounce changes.
                        expect(wasQuickChange).toBeTruthy();
                    });
                });

                it("should update the results when a matching line is deleted, updating line numbers and removing the match", function () {
                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: fullTestPath("foo.html") }));
                    });
                    runs(function () {
                        var doc = DocumentManager.getOpenDocumentForPath(fullTestPath("foo.html")),
                            i;
                        expect(doc).toBeTruthy();

                        // Remove the second "foo" match.
                        doc.replaceRange("", {line: 5, ch: 0}, {line: 6, ch: 0});

                        // This should update synchronously.
                        expect(gotChange).toBe(true);

                        var oldFileResults = oldResults[fullTestPath("foo.html")],
                            newFileResults = FindInFiles.searchModel.results[fullTestPath("foo.html")];

                        // First match should be unchanged.
                        expect(newFileResults.matches[0]).toEqual(oldFileResults.matches[0]);

                        // Second match should be deleted. The rest of the matches should have their lines adjusted.
                        for (i = 1; i < newFileResults.matches.length; i++) {
                            var newMatch = newFileResults.matches[i],
                                oldMatch = oldFileResults.matches[i + 1];
                            expect(newMatch.start).toEqual({line: oldMatch.start.line - 1, ch: oldMatch.start.ch});
                            expect(newMatch.end).toEqual({line: oldMatch.end.line - 1, ch: oldMatch.end.ch});
                        }

                        // There should be one fewer match.
                        expect(FindInFiles.searchModel.countFilesMatches()).toEqual({files: 3, matches: 13});

                        // Make sure the model is adding the flag that will make the view debounce changes.
                        expect(wasQuickChange).toBeTruthy();
                    });
                });

                it("should replace matches in a portion of the document that was edited to include a new match", function () {
                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: fullTestPath("foo.html") }));
                    });
                    runs(function () {
                        var doc = DocumentManager.getOpenDocumentForPath(fullTestPath("foo.html")),
                            i;
                        expect(doc).toBeTruthy();

                        // Replace the second and third foo matches (on two adjacent lines) with a single foo match on a single line.
                        doc.replaceRange("this is a new foo match\n", {line: 5, ch: 0}, {line: 7, ch: 0});

                        // This should update synchronously.
                        expect(gotChange).toBe(true);

                        var oldFileResults = oldResults[fullTestPath("foo.html")],
                            newFileResults = FindInFiles.searchModel.results[fullTestPath("foo.html")];

                        // First match should be unchanged.
                        expect(newFileResults.matches[0]).toEqual(oldFileResults.matches[0]);

                        // Second match should be changed to reflect the new position.
                        expect(newFileResults.matches[1].start).toEqual({line: 5, ch: 14});
                        expect(newFileResults.matches[1].end).toEqual({line: 5, ch: 17});

                        // Third match should be deleted. The rest of the matches should have their lines adjusted.
                        for (i = 2; i < newFileResults.matches.length; i++) {
                            var newMatch = newFileResults.matches[i],
                                oldMatch = oldFileResults.matches[i + 1];
                            expect(newMatch.start).toEqual({line: oldMatch.start.line - 1, ch: oldMatch.start.ch});
                            expect(newMatch.end).toEqual({line: oldMatch.end.line - 1, ch: oldMatch.end.ch});
                        }

                        // There should be one fewer match.
                        expect(FindInFiles.searchModel.countFilesMatches()).toEqual({files: 3, matches: 13});

                        // Make sure the model is adding the flag that will make the view debounce changes.
                        expect(wasQuickChange).toBeTruthy();
                    });
                });

                it("should completely remove the document from the results list if all matches in the document are deleted", function () {
                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: fullTestPath("foo.html") }));
                    });
                    runs(function () {
                        var doc = DocumentManager.getOpenDocumentForPath(fullTestPath("foo.html"));
                        expect(doc).toBeTruthy();

                        // Replace all matches and check that the entire file was removed from the results list.
                        doc.replaceRange("this will not match", {line: 4, ch: 0}, {line: 18, ch: 0});

                        // This should update synchronously.
                        expect(gotChange).toBe(true);
                        expect(FindInFiles.searchModel.results[fullTestPath("foo.html")]).toBeUndefined();

                        // There should be one fewer file and the matches for that file should be gone.
                        expect(FindInFiles.searchModel.countFilesMatches()).toEqual({files: 2, matches: 7});

                        // Make sure the model is adding the flag that will make the view debounce changes.
                        expect(wasQuickChange).toBeTruthy();
                    });
                });
            });

            // Unfortunately, we can't easily mock file changes, so we just do them in a copy of the project.
            // This set of tests isn't as thorough as it could be, because it's difficult to perform file
            // ops that will exercise all possible scenarios of change events (e.g. change events with
            // both added and removed files), and conversely it's difficult to mock all the filesystem stuff
            // without doing a bunch of work. So this is really just a set of basic sanity tests to make
            // sure that stuff being refactored between the change handler and the model doesn't break
            // basic update functionality.
            describe("when on-disk file or folder changes", function () {
                it("should add matches for a new file", function () {
                    var newFilePath;
                    runs(function () {
                        newFilePath = fullTestPath("newfoo.html");
                        expect(FindInFiles.searchModel.results[newFilePath]).toBeFalsy();
                        waitsForDone(promisify(FileSystem.getFileForPath(newFilePath), "write", "this is a new foo match\n"), "add new file");
                    });
                    waitsFor(function () { return gotChange; }, "model change event");
                    runs(function () {
                        var newFileResults = FindInFiles.searchModel.results[newFilePath];
                        expect(newFileResults).toBeTruthy();
                        expect(newFileResults.matches.length).toBe(1);
                        expect(newFileResults.matches[0].start).toEqual({line: 0, ch: 14});
                        expect(newFileResults.matches[0].end).toEqual({line: 0, ch: 17});

                        // There should be one new file and match.
                        expect(FindInFiles.searchModel.countFilesMatches()).toEqual({files: 4, matches: 15});
                    });
                });

                it("should remove matches for a deleted file", function () {
                    runs(function () {
                        expect(FindInFiles.searchModel.results[fullTestPath("foo.html")]).toBeTruthy();
                        waitsForDone(promisify(FileSystem.getFileForPath(fullTestPath("foo.html")), "unlink"), "delete file");
                    });
                    waitsFor(function () { return gotChange; }, "model change event");
                    runs(function () {
                        expect(FindInFiles.searchModel.results[fullTestPath("foo.html")]).toBeFalsy();

                        // There should be one fewer file and the matches should be removed.
                        expect(FindInFiles.searchModel.countFilesMatches()).toEqual({files: 2, matches: 7});
                    });
                });

                it("should remove matches for a deleted folder", function () {
                    runs(function () {
                        expect(FindInFiles.searchModel.results[fullTestPath("css/foo.css")]).toBeTruthy();
                        waitsForDone(promisify(FileSystem.getFileForPath(fullTestPath("css")), "unlink"), "delete folder");
                    });
                    waitsFor(function () { return gotChange; }, "model change event");
                    runs(function () {
                        expect(FindInFiles.searchModel.results[fullTestPath("css/foo.css")]).toBeFalsy();

                        // There should be one fewer file and the matches should be removed.
                        expect(FindInFiles.searchModel.countFilesMatches()).toEqual({files: 2, matches: 11});
                    });
                });
            });
        });

        describe("Replace", function () {
            function expectProjectToMatchKnownGood(kgFolder, lineEndings, filesToSkip) {
                runs(function () {
                    var testRootPath = ProjectManager.getProjectRoot().fullPath,
                        kgRootPath = SpecRunnerUtils.getTestPath("/spec/FindReplace-known-goods/" + kgFolder + "/");

                    function compareKnownGoodToTestFile(kgContents, kgFilePath) {
                        var testFilePath = testRootPath + kgFilePath.slice(kgRootPath.length);
                        if (!filesToSkip || filesToSkip.indexOf(testFilePath) === -1) {
                            return promisify(FileSystem.getFileForPath(testFilePath), "read").then(function (testContents) {
                                if (lineEndings) {
                                    kgContents = FileUtils.translateLineEndings(kgContents, lineEndings);
                                }
                                expect(testContents).toEqual(kgContents);
                            });
                        }
                    }

                    waitsForDone(visitAndProcessFiles(kgRootPath, compareKnownGoodToTestFile), "project comparison done");
                });
            }

            // Does a standard test for files on disk: search, replace, and check that files on disk match.
            // Options:
            //      knownGoodFolder: name of folder containing known goods to match to project files on disk
            //      lineEndings: optional, one of the FileUtils.LINE_ENDINGS_* constants
            //          - if specified, files on disk are expected to have these line endings
            //      uncheckMatches: optional array of {file: string, index: number} items to uncheck; if
            //          index unspecified, will uncheck all matches in file
            function doBasicTest(options) {
                doSearch(options);

                runs(function () {
                    if (options.uncheckMatches) {
                        options.uncheckMatches.forEach(function (matchToUncheck) {
                            var matches = searchResults[testPath + matchToUncheck.file].matches;
                            if (matchToUncheck.index) {
                                matches[matchToUncheck.index].isChecked = false;
                            } else {
                                matches.forEach(function (match) {
                                    match.isChecked = false;
                                });
                            }
                        });
                    }
                    waitsForDone(doReplace(options), "finish replacement");
                });
                expectProjectToMatchKnownGood(options.knownGoodFolder, options.lineEndings);
            }

            // Like doBasicTest, but expects some files to have specific errors.
            // Options: same as doBasicTest, plus:
            //      test: optional function (which must contain one or more runs blocks) to run between
            //          search and replace
            //      errors: array of errors expected to occur (in the same format as performReplacement() returns)
            function doTestWithErrors(options) {
                var done = false;

                doSearch(options);

                if (options.test) {
                    // The test function *must* contain one or more runs blocks.
                    options.test();
                }

                runs(function () {
                    doReplace(options)
                        .then(function () {
                            expect("should fail due to error").toBe(true);
                            done = true;
                        }, function (errors) {
                            expect(errors).toEqual(options.errors);
                            done = true;
                        });
                });
                waitsFor(function () { return done; }, 1000, "finish replacement");
                expectProjectToMatchKnownGood(options.knownGoodFolder, options.lineEndings);
            }

            function expectInMemoryFiles(options) {
                runs(function () {
                    waitsForDone(Async.doInParallel(options.inMemoryFiles, function (filePath) {
                        var fullPath;

                        // If this is a full file path (as would be the case for an external file), handle it specially.
                        if (typeof filePath === "object" && filePath.fullPath) {
                            fullPath = filePath.fullPath;
                            filePath = "/" + FileUtils.getBaseName(fullPath);
                        } else {
                            fullPath = testPath + filePath;
                        }

                        // Check that the document open in memory was changed and matches the expected replaced version of that file.
                        var doc = DocumentManager.getOpenDocumentForPath(fullPath);
                        expect(doc).toBeTruthy();
                        expect(doc.isDirty).toBe(true);

                        var kgPath = SpecRunnerUtils.getTestPath("/spec/FindReplace-known-goods/" + options.inMemoryKGFolder + filePath),
                            kgFile = FileSystem.getFileForPath(kgPath);
                        return promisify(kgFile, "read").then(function (contents) {
                            expect(doc.getText(true)).toEqual(contents);
                        });
                    }), "check in memory file contents");
                });
            }

            // Like doBasicTest, but expects one or more files to be open in memory and the replacements to happen there.
            // Options: same as doBasicTest, plus:
            //      inMemoryFiles: array of project-relative paths (each starting with "/") to files that should be open in memory
            //      inMemoryKGFolder: folder containing known goods to compare each of the inMemoryFiles to
            function doInMemoryTest(options) {
                // Like the basic test, we expect everything on disk to match the kgFolder (which means the file open in memory
                // should *not* have changed on disk yet).
                doBasicTest(options);
                expectInMemoryFiles(options);
            }

            afterEach(function () {
                runs(function () {
                    waitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL, { _forceClose: true }), "close all files");
                });
            });

            describe("Engine", function () {
                it("should replace all instances of a simple string in a project on disk case-insensitively", function () {
                    openTestProjectCopy(defaultSourcePath);
                    doBasicTest({
                        queryInfo:       {query: "foo"},
                        numMatches:      14,
                        replaceText:     "bar",
                        knownGoodFolder: "simple-case-insensitive"
                    });
                });

                it("should replace all instances of a simple string in a project on disk case-sensitively", function () {
                    openTestProjectCopy(defaultSourcePath);
                    doBasicTest({
                        queryInfo:       {query: "foo", isCaseSensitive: true},
                        numMatches:      9,
                        replaceText:     "bar",
                        knownGoodFolder: "simple-case-sensitive"
                    });
                });

                it("should replace all instances of a regexp in a project on disk case-insensitively with a simple replace string", function () {
                    openTestProjectCopy(defaultSourcePath);
                    doBasicTest({
                        queryInfo:       {query: "\\b[a-z]{3}\\b", isRegexp: true},
                        numMatches:      33,
                        replaceText:     "CHANGED",
                        knownGoodFolder: "regexp-case-insensitive"
                    });
                });

                it("should replace all instances of a regexp that spans multiple lines in a project on disk", function () {
                    openTestProjectCopy(defaultSourcePath);

                    // This query should find each rule in the CSS file (but not in the JS file since there's more than one line
                    // between each pair of braces).
                    doBasicTest({
                        queryInfo:       {query: "\\{\\n[^\\n]*\\n\\}", isRegexp: true},
                        numMatches:      4,
                        replaceText:     "CHANGED",
                        knownGoodFolder: "regexp-replace-multiline"
                    });
                });

                it("should replace all instances of a regexp that spans multiple lines in a project in memory", function () {
                    openTestProjectCopy(defaultSourcePath);

                    // This query should find each rule in the CSS file (but not in the JS file since there's more than one line
                    // between each pair of braces).
                    doInMemoryTest({
                        queryInfo:        {query: "\\{\\n[^\\n]*\\n\\}", isRegexp: true},
                        numMatches:       4,
                        replaceText:      "CHANGED",
                        knownGoodFolder:  "unchanged",
                        forceFilesOpen:   true,
                        inMemoryFiles:    ["/css/foo.css"],
                        inMemoryKGFolder: "regexp-replace-multiline"
                    });
                });

                it("should replace all instances of a regexp that spans multiple lines in a project on disk when the last line is a partial match", function () {
                    openTestProjectCopy(defaultSourcePath);

                    // This query should match from the open brace through to (and including) the first colon of each rule in the
                    // CSS file.
                    doBasicTest({
                        queryInfo:       {query: "\\{\\n[^:]+:", isRegexp: true},
                        numMatches:      4,
                        replaceText:     "CHANGED",
                        knownGoodFolder: "regexp-replace-multiline-partial"
                    });
                });

                it("should replace all instances of a regexp that spans multiple lines in a project in memory when the last line is a partial match", function () {
                    openTestProjectCopy(defaultSourcePath);

                    // This query should match from the open brace through to (and including) the first colon of each rule in the
                    // CSS file.
                    doInMemoryTest({
                        queryInfo:        {query: "\\{\\n[^:]+:", isRegexp: true},
                        numMatches:       4,
                        replaceText:      "CHANGED",
                        knownGoodFolder:  "unchanged",
                        forceFilesOpen:   true,
                        inMemoryFiles:    ["/css/foo.css"],
                        inMemoryKGFolder: "regexp-replace-multiline-partial"
                    });
                });

                it("should replace all instances of a regexp in a project on disk case-sensitively with a simple replace string", function () {
                    openTestProjectCopy(defaultSourcePath);
                    doBasicTest({
                        queryInfo:       {query: "\\b[a-z]{3}\\b", isRegexp: true, isCaseSensitive: true},
                        numMatches:      25,
                        replaceText:     "CHANGED",
                        knownGoodFolder: "regexp-case-sensitive"
                    });
                });

                it("should replace instances of a regexp with a $-substitution on disk", function () {
                    openTestProjectCopy(defaultSourcePath);
                    doBasicTest({
                        queryInfo:       {query: "\\b([a-z]{3})\\b", isRegexp: true},
                        numMatches:      33,
                        replaceText:     "[$1]",
                        knownGoodFolder: "regexp-dollar-replace"
                    });
                });

                it("should replace instances of a regexp with a $-substitution in in-memory files", function () {
                    // This test case is necessary because the in-memory case goes through a separate code path before it deals with
                    // the replace text.
                    openTestProjectCopy(defaultSourcePath);

                    doInMemoryTest({
                        queryInfo:       {query: "\\b([a-z]{3})\\b", isRegexp: true},
                        numMatches:      33,
                        replaceText:     "[$1]",
                        knownGoodFolder:   "unchanged",
                        forceFilesOpen:    true,
                        inMemoryFiles:     ["/css/foo.css", "/foo.html", "/foo.js"],
                        inMemoryKGFolder:  "regexp-dollar-replace"
                    });
                });

                it("should replace instances of regexp with 0-length matches on disk", function () {
                    openTestProjectCopy(defaultSourcePath);
                    doBasicTest({
                        queryInfo:       {query: "^", isRegexp: true},
                        numMatches:      55,
                        replaceText:     "CHANGED",
                        knownGoodFolder: "regexp-zero-length"
                    });
                });

                it("should replace instances of regexp with 0-length matches in memory", function () {
                    openTestProjectCopy(defaultSourcePath);
                    doInMemoryTest({
                        queryInfo:       {query: "^", isRegexp: true},
                        numMatches:      55,
                        replaceText:     "CHANGED",
                        knownGoodFolder:   "unchanged",
                        forceFilesOpen:    true,
                        inMemoryFiles:     ["/css/foo.css", "/foo.html", "/foo.js"],
                        inMemoryKGFolder: "regexp-zero-length"
                    });
                });

                it("should replace instances of a string in a project respecting CRLF line endings", function () {
                    openTestProjectCopy(defaultSourcePath, FileUtils.LINE_ENDINGS_CRLF);
                    doBasicTest({
                        queryInfo:       {query: "foo"},
                        numMatches:      14,
                        replaceText:     "bar",
                        knownGoodFolder: "simple-case-insensitive",
                        lineEndings:     FileUtils.LINE_ENDINGS_CRLF
                    });
                });

                it("should replace instances of a string in a project respecting LF line endings", function () {
                    openTestProjectCopy(defaultSourcePath, FileUtils.LINE_ENDINGS_LF);
                    doBasicTest({
                        queryInfo:       {query: "foo"},
                        numMatches:      14,
                        replaceText:     "bar",
                        knownGoodFolder: "simple-case-insensitive",
                        lineEndings:     FileUtils.LINE_ENDINGS_LF
                    });
                });

                it("should not replace unchecked matches on disk", function () {
                    openTestProjectCopy(defaultSourcePath);

                    doBasicTest({
                        queryInfo:         {query: "foo"},
                        numMatches:        14,
                        uncheckMatches:    [{file: "/css/foo.css"}],
                        replaceText:       "bar",
                        knownGoodFolder:   "simple-case-insensitive-except-foo.css"
                    });
                });

                it("should do all in-memory replacements synchronously, so user can't accidentally edit document after start of replace process", function () {
                    openTestProjectCopy(defaultSourcePath);

                    // Open two of the documents we want to replace in memory.
                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: testPath + "/css/foo.css" }), "opening document");
                    });
                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: testPath + "/foo.js" }), "opening document");
                    });

                    // We can't use expectInMemoryFiles(), since this test requires everything to happen fully synchronously
                    // (no file reads) once the replace has started. So we read the files here.
                    var kgFileContents = {};
                    runs(function () {
                        var kgPath = SpecRunnerUtils.getTestPath("/spec/FindReplace-known-goods/simple-case-insensitive");
                        waitsForDone(visitAndProcessFiles(kgPath, function (contents, fullPath) {
                            // Translate line endings to in-memory document style (always LF)
                            kgFileContents[fullPath.slice(kgPath.length)] = FileUtils.translateLineEndings(contents, FileUtils.LINE_ENDINGS_LF);
                        }), "reading known good");
                    });

                    doSearch({
                        queryInfo:       {query: "foo"},
                        numMatches:      14,
                        replaceText:     "bar"
                    });

                    runs(function () {
                        // Start the replace, but don't wait for it to complete. Since the in-memory replacements should occur
                        // synchronously, the in-memory documents should have already been changed. This means we don't have to
                        // worry about detecting changes in documents once the replace starts. (If the user had  changed
                        // the document after the search but before the replace started, we would have already closed the panel,
                        // preventing the user from doing a replace.)
                        var promise = FindInFiles.doReplace(searchResults, "bar");

                        // Check the in-memory contents against the known goods.
                        ["/css/foo.css", "/foo.js"].forEach(function (filename) {
                            var fullPath = testPath + filename,
                                doc = DocumentManager.getOpenDocumentForPath(fullPath);
                            expect(doc).toBeTruthy();
                            expect(doc.isDirty).toBe(true);
                            expect(doc.getText()).toEqual(kgFileContents[filename]);
                        });

                        // Finish the replace operation, which should go ahead and do the file on disk.
                        waitsForDone(promise);
                    });

                    runs(function () {
                        // Now the file on disk should have been replaced too.
                        waitsForDone(promisify(FileSystem.getFileForPath(testPath + "/foo.html"), "read").then(function (contents) {
                            expect(FileUtils.translateLineEndings(contents, FileUtils.LINE_ENDINGS_LF)).toEqual(kgFileContents["/foo.html"]);
                        }), "checking known good");
                    });
                });

                it("should return an error and not do the replacement in files that have changed on disk since the search", function () {
                    openTestProjectCopy(defaultSourcePath);
                    doTestWithErrors({
                        queryInfo:       {query: "foo"},
                        numMatches:      14,
                        replaceText:     "bar",
                        knownGoodFolder: "changed-file",
                        test: function () {
                            // Wait for one second to make sure that the changed file gets an updated timestamp.
                            // TODO: this seems like a FileSystem issue - we don't get timestamp changes with a resolution
                            // of less than one second.
                            waits(1000);

                            runs(function () {
                                // Clone the results so we don't use the version that's auto-updated by FindInFiles when we modify the file
                                // on disk. This case might not usually come up in the real UI if we always guarantee that the results list will
                                // be auto-updated, but we want to make sure there's no edge case where we missed an update and still clobber the
                                // file on disk anyway.
                                searchResults = _.cloneDeep(searchResults);
                                waitsForDone(promisify(FileSystem.getFileForPath(testPath + "/css/foo.css"), "write", "/* changed content */"), "modify file");
                            });
                        },
                        errors:          [{item: testPath + "/css/foo.css", error: FindUtils.ERROR_FILE_CHANGED}]
                    });
                });

                it("should return an error if a write fails", function () {
                    openTestProjectCopy(defaultSourcePath);

                    // Return a fake error when we try to write to the CSS file. (Note that this is spying on the test window's File module.)
                    var writeSpy = spyOn(File.prototype, "write").andCallFake(function (data, options, callback) {
                        if (typeof options === "function") {
                            callback = options;
                        } else {
                            callback = callback || function () {};
                        }
                        if (this.fullPath === testPath + "/css/foo.css") {
                            callback(FileSystemError.NOT_WRITABLE);
                        } else {
                            return writeSpy.originalValue.apply(this, arguments);
                        }
                    });

                    doTestWithErrors({
                        queryInfo:       {query: "foo"},
                        numMatches:      14,
                        replaceText:     "bar",
                        knownGoodFolder: "simple-case-insensitive-except-foo.css",
                        errors:          [{item: testPath + "/css/foo.css", error: FileSystemError.NOT_WRITABLE}]
                    });
                });

                it("should return an error if a match timestamp doesn't match an in-memory document timestamp", function () {
                    openTestProjectCopy(defaultSourcePath);

                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: testPath + "/css/foo.css" }), "opening document");
                    });

                    doTestWithErrors({
                        queryInfo:       {query: "foo"},
                        numMatches:      14,
                        replaceText:     "bar",
                        knownGoodFolder: "simple-case-insensitive-except-foo.css",
                        test: function () {
                            runs(function () {
                                // Clone the results so we don't use the version that's auto-updated by FindInFiles when we modify the file
                                // on disk. This case might not usually come up in the real UI if we always guarantee that the results list will
                                // be auto-updated, but we want to make sure there's no edge case where we missed an update and still clobber the
                                // file on disk anyway.
                                searchResults = _.cloneDeep(searchResults);
                                var oldTimestamp = searchResults[testPath + "/css/foo.css"].timestamp;
                                searchResults[testPath + "/css/foo.css"].timestamp = new Date(oldTimestamp.getTime() - 5000);
                            });
                        },
                        errors:          [{item: testPath + "/css/foo.css", error: FindUtils.ERROR_FILE_CHANGED}]
                    });
                });

                it("should do the replacement in memory for a file open in an Editor in the working set", function () {
                    openTestProjectCopy(defaultSourcePath);

                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: testPath + "/css/foo.css"}), "add file to working set");
                    });

                    doInMemoryTest({
                        queryInfo:        {query: "foo"},
                        numMatches:       14,
                        replaceText:      "bar",
                        knownGoodFolder:  "simple-case-insensitive-except-foo.css",
                        inMemoryFiles:    ["/css/foo.css"],
                        inMemoryKGFolder: "simple-case-insensitive"
                    });
                });

                it("should do the search/replace in the current document content for a dirty in-memory document", function () {
                    openTestProjectCopy(defaultSourcePath);

                    var options = {
                        queryInfo:        {query: "foo"},
                        numMatches:       15,
                        replaceText:      "bar",
                        inMemoryFiles:    ["/css/foo.css"],
                        inMemoryKGFolder: "simple-case-insensitive-modified"
                    };

                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: testPath + "/css/foo.css"}), "add file to working set");
                    });
                    runs(function () {
                        var doc = DocumentManager.getOpenDocumentForPath(testPath + "/css/foo.css");
                        expect(doc).toBeTruthy();
                        doc.replaceRange("/* added a foo line */\n", {line: 0, ch: 0});
                    });
                    doSearch(options);
                    runs(function () {
                        waitsForDone(doReplace(options), "replace done");
                    });
                    expectInMemoryFiles(options);
                    expectProjectToMatchKnownGood("simple-case-insensitive-modified", null, [testPath + "/css/foo.css"]);
                });

                it("should do the replacement in memory for a file open in an Editor that's not in the working set", function () {
                    openTestProjectCopy(defaultSourcePath);

                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.FILE_OPEN, {fullPath: testPath + "/css/foo.css"}), "open file");
                    });

                    doInMemoryTest({
                        queryInfo:        {query: "foo"},
                        numMatches:       14,
                        replaceText:      "bar",
                        knownGoodFolder:  "simple-case-insensitive-except-foo.css",
                        inMemoryFiles:    ["/css/foo.css"],
                        inMemoryKGFolder: "simple-case-insensitive"
                    });
                });

                it("should do the replacement in memory for a file that's in the working set but not yet open in an editor", function () {
                    openTestProjectCopy(defaultSourcePath);

                    runs(function () {
                        MainViewManager.addToWorkingSet(MainViewManager.ACTIVE_PANE, FileSystem.getFileForPath(testPath + "/css/foo.css"));
                    });

                    doInMemoryTest({
                        queryInfo:        {query: "foo"},
                        numMatches:       14,
                        replaceText:      "bar",
                        knownGoodFolder:  "simple-case-insensitive-except-foo.css",
                        inMemoryFiles:    ["/css/foo.css"],
                        inMemoryKGFolder: "simple-case-insensitive"
                    });
                });

                it("should open the document in an editor and do the replacement there if the document is open but not in an Editor", function () {
                    var doc, openFilePath;
                    openTestProjectCopy(defaultSourcePath);

                    runs(function () {
                        openFilePath = testPath + "/css/foo.css";
                        waitsForDone(DocumentManager.getDocumentForPath(openFilePath).done(function (d) {
                            doc = d;
                            doc.addRef();
                        }), "get document");
                    });

                    doInMemoryTest({
                        queryInfo:        {query: "foo"},
                        numMatches:       14,
                        replaceText:      "bar",
                        knownGoodFolder:  "simple-case-insensitive-except-foo.css",
                        inMemoryFiles:    ["/css/foo.css"],
                        inMemoryKGFolder: "simple-case-insensitive"
                    });

                    runs(function () {
                        var workingSet = MainViewManager.getWorkingSet(MainViewManager.ALL_PANES);
                        expect(workingSet.some(function (file) { return file.fullPath === openFilePath; })).toBe(true);
                        doc.releaseRef();
                    });
                });

                it("should open files and do all replacements in memory if forceFilesOpen is true", function () {
                    openTestProjectCopy(defaultSourcePath);

                    doInMemoryTest({
                        queryInfo:         {query: "foo"},
                        numMatches:        14,
                        replaceText:       "bar",
                        knownGoodFolder:   "unchanged",
                        forceFilesOpen:    true,
                        inMemoryFiles:     ["/css/foo.css", "/foo.html", "/foo.js"],
                        inMemoryKGFolder:  "simple-case-insensitive"
                    });
                });

                it("should not perform unchecked matches in memory", function () {
                    openTestProjectCopy(defaultSourcePath);

                    doInMemoryTest({
                        queryInfo:         {query: "foo"},
                        numMatches:        14,
                        uncheckMatches:    [{file: "/css/foo.css", index: 1}, {file: "/foo.html", index: 3}],
                        replaceText:       "bar",
                        knownGoodFolder:   "unchanged",
                        forceFilesOpen:    true,
                        inMemoryFiles:     ["/css/foo.css", "/foo.html", "/foo.js"],
                        inMemoryKGFolder:  "simple-case-insensitive-unchecked"
                    });
                });

                it("should not perform unchecked matches on disk", function () {
                    openTestProjectCopy(defaultSourcePath);

                    doBasicTest({
                        queryInfo:         {query: "foo"},
                        numMatches:        14,
                        uncheckMatches:    [{file: "/css/foo.css", index: 1}, {file: "/foo.html", index: 3}],
                        replaceText:       "bar",
                        knownGoodFolder:   "simple-case-insensitive-unchecked"
                    });
                });

                it("should select the first modified file in the working set if replacements are done in memory and current editor wasn't affected", function () {
                    openTestProjectCopy(defaultSourcePath);

                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: testPath + "/bar.txt"}), "open file");
                    });

                    doInMemoryTest({
                        queryInfo:         {query: "foo"},
                        numMatches:        14,
                        replaceText:       "bar",
                        knownGoodFolder:   "unchanged",
                        forceFilesOpen:    true,
                        inMemoryFiles:     ["/css/foo.css", "/foo.html", "/foo.js"],
                        inMemoryKGFolder:  "simple-case-insensitive"
                    });

                    runs(function () {
                        var expectedFile = testPath + "/foo.html";
                        expect(DocumentManager.getCurrentDocument().file.fullPath).toBe(expectedFile);
                        expect(MainViewManager.findInWorkingSet(MainViewManager.ACTIVE_PANE, expectedFile)).not.toBe(-1);
                    });
                });

                it("should select the first modified file in the working set if replacements are done in memory and no editor was open", function () {
                    openTestProjectCopy(defaultSourcePath);

                    var testFiles = ["/css/foo.css", "/foo.html", "/foo.js"];

                    doInMemoryTest({
                        queryInfo:         {query: "foo"},
                        numMatches:        14,
                        replaceText:       "bar",
                        knownGoodFolder:   "unchanged",
                        forceFilesOpen:    true,
                        inMemoryFiles:     testFiles,
                        inMemoryKGFolder:  "simple-case-insensitive"
                    });


                    runs(function () {
                        // since nothing was opened prior to doing the
                        //  replacements then the first file modified will be opened.
                        // This may not be the first item in the array above
                        //  since the files are sorted differently in performReplacements
                        //  and the replace is performed asynchronously.
                        // So, just ensure that *something* was opened
                        expect(DocumentManager.getCurrentDocument().file.fullPath).toBeTruthy();

                        testFiles.forEach(function (relPath) {
                            expect(MainViewManager.findInWorkingSet(MainViewManager.ACTIVE_PANE, testPath + relPath)).not.toBe(-1);
                        });
                    });
                });

                it("should select the first modified file in the working set if replacements are done in memory and there were no matches checked for current editor", function () {
                    openTestProjectCopy(defaultSourcePath);

                    runs(function () {
                        waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: testPath + "/css/foo.css"}), "open file");
                    });

                    doInMemoryTest({
                        queryInfo:         {query: "foo"},
                        numMatches:        14,
                        uncheckMatches:    [{file: "/css/foo.css"}],
                        replaceText:       "bar",
                        knownGoodFolder:   "unchanged",
                        forceFilesOpen:    true,
                        inMemoryFiles:     ["/foo.html", "/foo.js"],
                        inMemoryKGFolder:  "simple-case-insensitive-except-foo.css"
                    });

                    runs(function () {
                        expect(DocumentManager.getCurrentDocument().file.fullPath).toEqual(testPath + "/foo.html");
                    });
                });
            });

            describe("UI", function () {
                function executeReplace(findText, replaceText, fromKeyboard) {
                    runs(function () {
                        FindInFiles._searchDone = false;
                        FindInFiles._replaceDone = false;
                        $("#find-what").val(findText).trigger("input");
                        $("#replace-with").val(replaceText).trigger("input");
                        if (fromKeyboard) {
                            SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $("#replace-with").get(0));
                        } else {
                            $("#replace-all").click();
                        }
                    });
                }

                function showSearchResults(findText, replaceText, fromKeyboard) {
                    openTestProjectCopy(defaultSourcePath);
                    openSearchBar(null, true);
                    executeReplace(findText, replaceText, fromKeyboard);
                    waitsFor(function () {
                        return FindInFiles._searchDone;
                    }, "search finished");
                }

                afterEach(function () {
                    closeSearchBar();
                });

                describe("Replace in Files Bar", function () {
                    it("should only show a Replace All button", function () {
                        openTestProjectCopy(defaultSourcePath);
                        openSearchBar(null, true);
                        runs(function () {
                            expect($("#replace-yes").length).toBe(0);
                            expect($("#replace-all").length).toBe(1);
                        });
                    });

                    it("should disable the Replace button if query is empty", function () {
                        openTestProjectCopy(defaultSourcePath);
                        openSearchBar(null, true);
                        runs(function () {
                            expect($("#replace-all").is(":disabled")).toBe(true);
                        });
                    });

                    it("should enable the Replace button if the query is a non-empty string", function () {
                        openTestProjectCopy(defaultSourcePath);
                        openSearchBar(null, true);
                        runs(function () {
                            $("#find-what").val("my query").trigger("input");
                            expect($("#replace-all").is(":disabled")).toBe(false);
                        });
                    });

                    it("should disable the Replace button if query is an invalid regexp", function () {
                        openTestProjectCopy(defaultSourcePath);
                        openSearchBar(null, true);
                        runs(function () {
                            $("#find-regexp").click();
                            $("#find-what").val("[invalid").trigger("input");
                            expect($("#replace-all").is(":disabled")).toBe(true);
                        });
                    });

                    it("should enable the Replace button if query is a valid regexp", function () {
                        openTestProjectCopy(defaultSourcePath);
                        openSearchBar(null, true);
                        runs(function () {
                            $("#find-regexp").click();
                            $("#find-what").val("[valid]").trigger("input");
                            expect($("#replace-all").is(":disabled")).toBe(false);
                        });
                    });

                    it("should start with focus in Find, and set focus to the Replace field when the user hits enter in the Find field", function () {
                        openTestProjectCopy(defaultSourcePath);
                        openSearchBar(null, true);
                        runs(function () {
                            // For some reason using $().is(":focus") here is flaky.
                            expect(testWindow.document.activeElement).toBe($("#find-what").get(0));
                            SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $("#find-what").get(0));
                            expect(testWindow.document.activeElement).toBe($("#replace-with").get(0));
                        });
                    });
                });

                describe("Full workflow", function () {
                    it("should prepopulate the find bar with selected text", function () {
                        var doc, editor;

                        openTestProjectCopy(defaultSourcePath);
                        runs(function () {
                            waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: testPath + "/foo.html" }), "open file");
                        });
                        runs(function () {
                            doc = DocumentManager.getOpenDocumentForPath(testPath + "/foo.html");
                            expect(doc).toBeTruthy();
                            MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                            editor = doc._masterEditor;
                            expect(editor).toBeTruthy();
                            editor.setSelection({line: 4, ch: 7}, {line: 4, ch: 10});
                        });

                        openSearchBar(null);
                        runs(function () {
                            expect($("#find-what").val()).toBe("Foo");
                        });
                        waitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL), "closing all files");
                    });

                    it("should prepopulate the find bar with only first line of selected text", function () {
                        var doc, editor;

                        openTestProjectCopy(defaultSourcePath);
                        runs(function () {
                            waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: testPath + "/foo.html" }), "open file");
                        });
                        runs(function () {
                            doc = DocumentManager.getOpenDocumentForPath(testPath + "/foo.html");
                            expect(doc).toBeTruthy();
                            MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                            editor = doc._masterEditor;
                            expect(editor).toBeTruthy();
                            editor.setSelection({line: 4, ch: 7}, {line: 6, ch: 10});
                        });

                        openSearchBar(null);
                        runs(function () {
                            expect($("#find-what").val()).toBe("Foo</title>");
                        });
                        waitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL), "closing all files");
                    });

                    it("should show results from the search with all checkboxes checked", function () {
                        showSearchResults("foo", "bar");
                        runs(function () {
                            expect($("#find-in-files-results").length).toBe(1);
                            expect($("#find-in-files-results .check-one").length).toBe(14);
                            expect($("#find-in-files-results .check-one:checked").length).toBe(14);
                        });
                    });

                    it("should do a simple search/replace all from find bar, opening results in memory, when user clicks on Replace... button", function () {
                        showSearchResults("foo", "bar");
                        // Click the "Replace" button in the search panel - this should kick off the replace
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        waitsFor(function () {
                            return FindInFiles._replaceDone;
                        }, "replace finished");
                        expectInMemoryFiles({
                            inMemoryFiles: ["/css/foo.css", "/foo.html", "/foo.js"],
                            inMemoryKGFolder: "simple-case-insensitive"
                        });
                    });

                    it("should do a simple search/replace all from find bar, opening results in memory, when user hits Enter in Replace field", function () {
                        showSearchResults("foo", "bar");
                        // Click the "Replace" button in the search panel - this should kick off the replace
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        waitsFor(function () {
                            return FindInFiles._replaceDone;
                        }, "replace finished");
                        expectInMemoryFiles({
                            inMemoryFiles: ["/css/foo.css", "/foo.html", "/foo.js"],
                            inMemoryKGFolder: "simple-case-insensitive"
                        });
                    });

                    it("should do a search in folder, replace all from find bar", function () {
                        openTestProjectCopy(defaultSourcePath);
                        var dirEntry = FileSystem.getDirectoryForPath(testPath + "/css/");
                        openSearchBar(dirEntry, true);
                        executeReplace("foo", "bar", true);

                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");

                        // Click the "Replace" button in the search panel - this should kick off the replace
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        waitsFor(function () {
                            return FindInFiles._replaceDone;
                        }, "replace finished");
                        expectInMemoryFiles({
                            inMemoryFiles: ["/css/foo.css"],
                            inMemoryKGFolder: "simple-case-insensitive-only-foo.css"
                        });
                    });

                    it("should do a search in file, replace all from find bar", function () {
                        openTestProjectCopy(defaultSourcePath);
                        var fileEntry = FileSystem.getFileForPath(testPath + "/css/foo.css");
                        openSearchBar(fileEntry, true);
                        executeReplace("foo", "bar", true);

                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");

                        // Click the "Replace" button in the search panel - this should kick off the replace
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        waitsFor(function () {
                            return FindInFiles._replaceDone;
                        }, "replace finished");
                        expectInMemoryFiles({
                            inMemoryFiles: ["/css/foo.css"],
                            inMemoryKGFolder: "simple-case-insensitive-only-foo.css"
                        });
                    });

                    it("should do a regexp search/replace from find bar", function () {
                        openTestProjectCopy(defaultSourcePath);
                        openSearchBar(null, true);
                        runs(function () {
                            $("#find-regexp").click();
                        });
                        executeReplace("\\b([a-z]{3})\\b", "[$1]", true);

                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");

                        // Click the "Replace" button in the search panel - this should kick off the replace
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        waitsFor(function () {
                            return FindInFiles._replaceDone;
                        }, "replace finished");
                        expectInMemoryFiles({
                            inMemoryFiles: ["/css/foo.css", "/foo.html", "/foo.js"],
                            inMemoryKGFolder: "regexp-dollar-replace"
                        });
                    });

                    it("should do a case-sensitive search/replace from find bar", function () {
                        openTestProjectCopy(defaultSourcePath);
                        openSearchBar(null, true);
                        runs(function () {
                            $("#find-case-sensitive").click();
                        });
                        executeReplace("foo", "bar", true);

                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");

                        // Click the "Replace" button in the search panel - this should kick off the replace
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        waitsFor(function () {
                            return FindInFiles._replaceDone;
                        }, "replace finished");
                        expectInMemoryFiles({
                            inMemoryFiles: ["/css/foo.css", "/foo.html", "/foo.js"],
                            inMemoryKGFolder: "simple-case-sensitive"
                        });
                    });

                    it("should warn and do changes on disk if there are changes in >20 files", function () {
                        openTestProjectCopy(SpecRunnerUtils.getTestPath("/spec/FindReplace-test-files-large"));
                        openSearchBar(null, true);
                        executeReplace("foo", "bar");

                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");

                        // Click the "Replace" button in the search panel - this should cause the dialog to appear
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        runs(function () {
                            expect(FindInFiles._replaceDone).toBeFalsy();
                        });

                        var $okButton;
                        waitsFor(function () {
                            $okButton = $(".dialog-button[data-button-id='ok']");
                            return !!$okButton.length;
                        }, "dialog appearing");
                        runs(function () {
                            expect($okButton.length).toBe(1);
                            expect($okButton.text()).toBe(Strings.BUTTON_REPLACE_WITHOUT_UNDO);
                            $okButton.click();
                        });

                        waitsFor(function () {
                            return FindInFiles._replaceDone;
                        }, "replace finished");
                        expectProjectToMatchKnownGood("simple-case-insensitive-large");
                    });

                    it("should not do changes on disk if Cancel is clicked in 'too many files' dialog", function () {
                        spyOn(FindInFiles, "doReplace").andCallThrough();
                        openTestProjectCopy(SpecRunnerUtils.getTestPath("/spec/FindReplace-test-files-large"));
                        openSearchBar(null, true);
                        executeReplace("foo", "bar");

                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");

                        // Click the "Replace" button in the search panel - this should cause the dialog to appear
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        runs(function () {
                            expect(FindInFiles._replaceDone).toBeFalsy();
                        });

                        var $cancelButton;
                        waitsFor(function () {
                            $cancelButton = $(".dialog-button[data-button-id='cancel']");
                            return !!$cancelButton.length;
                        });
                        runs(function () {
                            expect($cancelButton.length).toBe(1);
                            $cancelButton.click();
                        });

                        waitsFor(function () {
                            return $(".dialog-button[data-button-id='cancel']").length === 0;
                        }, "dialog dismissed");
                        runs(function () {
                            expect(FindInFiles.doReplace).not.toHaveBeenCalled();
                            // Panel should be left open.
                            expect($("#find-in-files-results").is(":visible")).toBeTruthy();
                        });
                    });

                    it("should do single-file Replace All in an open file in the project", function () {
                        openTestProjectCopy(defaultSourcePath);
                        runs(function () {
                            waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: testPath + "/foo.js" }), "open file");
                        });
                        runs(function () {
                            waitsForDone(CommandManager.execute(Commands.CMD_REPLACE), "open single-file replace bar");
                        });
                        waitsFor(function () {
                            return $(".modal-bar").length === 1;
                        }, "search bar open");

                        executeReplace("foo", "bar");
                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");

                        // Click the "Replace" button in the search panel - this should kick off the replace
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        waitsFor(function () {
                            return FindInFiles._replaceDone;
                        }, "replace finished");

                        expectInMemoryFiles({
                            inMemoryFiles: ["/foo.js"],
                            inMemoryKGFolder: "simple-case-insensitive"
                        });
                    });

                    it("should do single-file Replace All in a non-project file", function () {
                        // Open an empty project.
                        var blankProject = SpecRunnerUtils.getTempDirectory() + "/blank-project",
                            externalFilePath = defaultSourcePath + "/foo.js";
                        runs(function () {
                            var dirEntry = FileSystem.getDirectoryForPath(blankProject);
                            waitsForDone(promisify(dirEntry, "create"));
                        });
                        SpecRunnerUtils.loadProjectInTestWindow(blankProject);
                        runs(function () {
                            waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: externalFilePath }), "open external file");
                        });
                        runs(function () {
                            waitsForDone(CommandManager.execute(Commands.CMD_REPLACE), "open single-file replace bar");
                        });
                        waitsFor(function () {
                            return $(".modal-bar").length === 1;
                        }, "search bar open");

                        executeReplace("foo", "bar");
                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");

                        // Click the "Replace" button in the search panel - this should kick off the replace
                        runs(function () {
                            $(".replace-checked").click();
                        });

                        waitsFor(function () {
                            return FindInFiles._replaceDone;
                        }, "replace finished");

                        expectInMemoryFiles({
                            inMemoryFiles: [{fullPath: externalFilePath}], // pass a full file path since this is an external file
                            inMemoryKGFolder: "simple-case-insensitive"
                        });
                    });

                    it("should show an error dialog if errors occurred during the replacement", function () {
                        showSearchResults("foo", "bar");
                        runs(function () {
                            spyOn(FindInFiles, "doReplace").andCallFake(function () {
                                return new $.Deferred().reject([
                                    {item: testPath + "/css/foo.css", error: FindUtils.ERROR_FILE_CHANGED},
                                    {item: testPath + "/foo.html", error: FileSystemError.NOT_WRITABLE}
                                ]);
                            });
                        });
                        runs(function () {
                            // This will call our mock doReplace
                            $(".replace-checked").click();
                        });

                        var $dlg;
                        waitsFor(function () {
                            $dlg = $(".error-dialog");
                            return !!$dlg.length;
                        }, "dialog appearing");
                        runs(function () {
                            expect($dlg.length).toBe(1);

                            // Both files should be mentioned in the dialog.
                            var text = $dlg.find(".dialog-message").text();
                            // Have to check this in a funny way because breakableUrl() adds a special character after the slash.
                            expect(text.match(/css\/.*foo.css/)).not.toBe(-1);
                            expect(text.indexOf(StringUtils.breakableUrl("foo.html"))).not.toBe(-1);
                            $dlg.find(".dialog-button[data-button-id='ok']").click();
                            expect($(".error-dialog").length).toBe(0);
                        });
                    });
                });

                // TODO: these could be split out into unit tests, but would need to be able to instantiate
                // a SearchResultsView in the test runner window.
                describe("Checkbox interactions", function () {
                    it("should uncheck all checkboxes and update model when Check All is clicked while checked", function () {
                        showSearchResults("foo", "bar");
                        runs(function () {
                            expect($(".check-all").is(":checked")).toBeTruthy();
                            $(".check-all").click();
                            expect($(".check-all").is(":checked")).toBeFalsy();
                            expect($(".check-one:checked").length).toBe(0);
                            expect(_.find(FindInFiles.searchModel.results, function (result) {
                                return _.find(result.matches, function (match) { return match.isChecked; });
                            })).toBeFalsy();
                        });
                    });

                    it("should uncheck one checkbox and update model, unchecking the Check All checkbox", function () {
                        showSearchResults("foo", "bar");
                        runs(function () {
                            $(".check-one").eq(1).click();
                            expect($(".check-one").eq(1).is(":checked")).toBeFalsy();
                            expect($(".check-all").is(":checked")).toBeFalsy();
                            // In the sorting, this item should be the second match in the first file, which is foo.html
                            var uncheckedMatch = FindInFiles.searchModel.results[testPath + "/foo.html"].matches[1];
                            expect(uncheckedMatch.isChecked).toBe(false);
                            // Check that all items in the model besides the unchecked one to be checked.
                            expect(_.every(FindInFiles.searchModel.results, function (result) {
                                return _.every(result.matches, function (match) {
                                    if (match === uncheckedMatch) {
                                        // This one is already expected to be unchecked.
                                        return true;
                                    }
                                    return match.isChecked;
                                });
                            })).toBeTruthy();
                        });
                    });

                    it("should re-check unchecked checkbox and update model after clicking Check All again", function () {
                        showSearchResults("foo", "bar");
                        runs(function () {
                            $(".check-one").eq(1).click();
                            expect($(".check-one").eq(1).is(":checked")).toBeFalsy();
                            expect($(".check-all").is(":checked")).toBeFalsy();
                            $(".check-all").click();
                            expect($(".check-all").is(":checked")).toBeTruthy();
                            expect($(".check-one:checked").length).toEqual($(".check-one").length);
                            expect(_.every(FindInFiles.searchModel.results, function (result) {
                                return _.every(result.matches, function (match) { return match.isChecked; });
                            })).toBeTruthy();
                        });
                    });

                    // TODO: checkboxes with paging
                });
                // Untitled documents are covered in the "Search -> Replace All in untitled document" cases above.

                describe("Panel closure on changes", function () {
                    it("should close the panel and detach listeners if a file is modified on disk", function () {
                        showSearchResults("foo", "bar");
                        runs(function () {
                            expect($("#find-in-files-results").is(":visible")).toBe(true);
                            waitsForDone(promisify(FileSystem.getFileForPath(testPath + "/foo.html"), "write", "changed content"));
                        });
                        runs(function () {
                            expect($("#find-in-files-results").is(":visible")).toBe(false);
                        });
                    });

                    it("should close the panel if a file is modified in memory", function () {
                        openTestProjectCopy(defaultSourcePath);
                        runs(function () {
                            waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: testPath + "/foo.html" }), "open file");
                        });
                        openSearchBar(null, true);
                        executeReplace("foo", "bar");
                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");
                        runs(function () {
                            expect($("#find-in-files-results").is(":visible")).toBe(true);

                            var doc = DocumentManager.getOpenDocumentForPath(testPath + "/foo.html");
                            expect(doc).toBeTruthy();
                            doc.replaceRange("", {line: 0, ch: 0}, {line: 1, ch: 0});

                            expect($("#find-in-files-results").is(":visible")).toBe(false);
                        });
                    });

                    it("should close the panel if a document was open and modified before the search, but then the file was closed and changes dropped", function () {
                        var doc;

                        openTestProjectCopy(defaultSourcePath);
                        runs(function () {
                            waitsForDone(CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: testPath + "/foo.html" }), "open file");
                        });
                        runs(function () {
                            doc = DocumentManager.getOpenDocumentForPath(testPath + "/foo.html");
                            expect(doc).toBeTruthy();
                            doc.replaceRange("", {line: 0, ch: 0}, {line: 1, ch: 0});
                        });
                        openSearchBar(null, true);
                        executeReplace("foo", "bar");
                        waitsFor(function () {
                            return FindInFiles._searchDone;
                        }, "search finished");
                        runs(function () {
                            expect($("#find-in-files-results").is(":visible")).toBe(true);

                            // We have to go through the dialog workflow for closing the file without saving changes,
                            // because the "revert" behavior only happens in that workflow (it doesn't happen if you
                            // do forceClose, since that's only intended as a shortcut for the end of a unit test).
                            var closePromise = CommandManager.execute(Commands.FILE_CLOSE, { file: doc.file }),
                                $dontSaveButton = $(".dialog-button[data-button-id='dontsave']");
                            expect($dontSaveButton.length).toBe(1);
                            $dontSaveButton.click();
                            waitsForDone(closePromise);
                        });
                        runs(function () {
                            expect($("#find-in-files-results").is(":visible")).toBe(false);
                        });
                    });
                });
                
                describe("Disclosure Arrows", function () {
               
                    it("should expand/collapse items when clicked", function () {
                        showSearchResults("foo", "bar");
                        runs(function () {
                            $(".disclosure-triangle").click();
                            expect($("#items").is(":style")).toBeFalsy();
                            $(".disclosure-triangle").click();
                            expect($("#items").is(":style")).toBeTruthy();
                        });
                    });
                });
            });
        });
    });
});
