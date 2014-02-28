/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeFirst, afterLast, beforeEach, afterEach, waitsFor, waitsForDone, runs */
/*unittests: FileFilters*/

define(function (require, exports, module) {
    'use strict';
    
    var FileFilters     = require("search/FileFilters"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        Dialogs         = require("widgets/Dialogs"),
        Commands        = require("command/Commands"),
        KeyEvent        = require("utils/KeyEvent");

    describe("FileFilters", function () {
        
        describe("'Compiling' user filters", function () {
            it("should add ** prefix & suffix", function () {
                expect(FileFilters.compile(["node_modules"])).toEqual(["**node_modules**"]);
                expect(FileFilters.compile(["/node_modules/"])).toEqual(["**/node_modules/**"]);
                expect(FileFilters.compile(["node_*"])).toEqual(["**node_***"]);
                expect(FileFilters.compile(["node_?"])).toEqual(["**node_?**"]);
                expect(FileFilters.compile(["*-test-files/"])).toEqual(["***-test-files/**"]);
                expect(FileFilters.compile(["LiveDevelopment/**/Inspector"])).toEqual(["**LiveDevelopment/**/Inspector**"]);
            });

            it("shouldn't add ** suffix", function () {
                expect(FileFilters.compile(["README.md"])).toEqual(["**README.md"]);
                expect(FileFilters.compile(["/README.md"])).toEqual(["**/README.md"]);
                expect(FileFilters.compile(["*.ttf"])).toEqual(["***.ttf"]);
                expect(FileFilters.compile(["*.cf?"])).toEqual(["***.cf?"]);
                expect(FileFilters.compile(["/jquery*.js"])).toEqual(["**/jquery*.js"]);
                expect(FileFilters.compile(["/jquery-1.?.js"])).toEqual(["**/jquery-1.?.js"]);
                expect(FileFilters.compile(["thirdparty/**/jquery*.js"])).toEqual(["**thirdparty/**/jquery*.js"]);
            });
            
            it("shouldn't add extra ** prefix", function () {
                expect(FileFilters.compile(["**node_modules"])).toEqual(["**node_modules**"]);
                expect(FileFilters.compile(["**/node_modules/**"])).toEqual(["**/node_modules/**"]);
                expect(FileFilters.compile(["**README.md"])).toEqual(["**README.md"]);
            });
        });
        
        
        describe("Find in Files filtering", function () {
            
            this.category = "integration";
            
            var testPath = SpecRunnerUtils.getTestPath("/spec/InlineEditorProviders-test-files"),
                testWindow,
                FileFilters,
                FindInFiles,
                CommandManager,
                $;
            
            beforeFirst(function () {
                // Create a new window that will be shared by ALL tests in this spec.
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;

                    // Load module instances from brackets.test
                    FileFilters     = testWindow.brackets.test.FileFilters;
                    FindInFiles     = testWindow.brackets.test.FindInFiles;
                    CommandManager  = testWindow.brackets.test.CommandManager;
                    $               = testWindow.$;
                    
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
            });

            afterLast(function () {
                testWindow = null;
                FileFilters = null;
                FindInFiles = null;
                CommandManager = null;
                $ = null;
                SpecRunnerUtils.closeTestWindow();
            });
            
            function openSearchBar() {
                // Make sure search bar from previous test has animated out fully
                runs(function () {
                    waitsFor(function () {
                        return $(".modal-bar").length === 0;
                    }, "search bar close");
                });
                runs(function () {
                    waitsForDone(CommandManager.execute(Commands.EDIT_FIND_IN_FILES));
                });
            }

            function executeSearch(searchString) {
                var $searchField = $(".modal-bar #find-group input");
                $searchField.val(searchString).trigger("input");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $searchField[0]);
                waitsFor(function () {
                    return FindInFiles._searchResults;
                }, "Find in Files done");
            }

            it("should search all files by default", function () {
                openSearchBar();
                runs(function () {
                    executeSearch("{1}");
                });
                runs(function () {
                    expect(FindInFiles._searchResults[testPath + "/test1.css"]).toBeTruthy();
                    expect(FindInFiles._searchResults[testPath + "/test1.html"]).toBeTruthy();
                });
            });
            
            it("should exclude files from search", function () {
                openSearchBar();
                runs(function () {
                    // Launch filter editor
                    $(".filter-picker button").click();
                    
                    // Edit the filter & confirm changes
                    $(".modal.instance textarea").val("*.css");
                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK);
                });
                // (dialogs close asynchronously)
                runs(function () {
                    executeSearch("{1}");
                });
                runs(function () {
                    expect(FindInFiles._searchResults[testPath + "/test1.css"]).toBeFalsy();  // *.css should have been excluded this time
                    expect(FindInFiles._searchResults[testPath + "/test1.html"]).toBeTruthy();
                });
            });
        });
        
    });
    
});
