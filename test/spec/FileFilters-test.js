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
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeFirst, afterLast, beforeEach, afterEach, waitsFor, waitsForDone, waits, runs */
/*unittests: FileFilters*/

define(function (require, exports, module) {
    'use strict';

    var FileFilters        = require("search/FileFilters"),
        SpecRunnerUtils    = require("spec/SpecRunnerUtils"),
        Dialogs            = require("widgets/Dialogs"),
        KeyEvent           = require("utils/KeyEvent"),
        PreferencesManager = require("preferences/PreferencesManager"),
        Strings            = require("strings"),
        StringUtils        = require("utils/StringUtils");

    describe("FileFilters", function () {

        describe("Filter matching", function () {
            // filterPath() == true means the path does NOT match the glob, i.e. it passes the filter
            // filterPath() == false means the path DOES match the glob, i.e. it got filtered out
            function expectMatch(compiledFilter, path) {
                expect(FileFilters.filterPath(compiledFilter, path)).toBe(false);
            }
            function expectNotMatch(compiledFilter, path) {
                expect(FileFilters.filterPath(compiledFilter, path)).toBe(true);
            }

            it("empty filter should accept everything", function () {
                var filter = FileFilters.compile([]);
                expectNotMatch(filter, "/foo");
                expectNotMatch(filter, "/foo/bbb/");
                expectNotMatch(filter, "/foo/bbb/file");
                expectNotMatch(filter, "/foo/bbb/file.txt");
            });

            it("should match simple substring", function () {
                var filter = FileFilters.compile(["foo"]);
                expectMatch(filter, "/foo/bbb/file.txt");
                expectMatch(filter, "/aaa/bbb/foo.txt");
                expectMatch(filter, "/aaa/bbb/ccc.foo");
                expectMatch(filter, "/aaa/foo");
                expectMatch(filter, "/foo");
                expectMatch(filter, "/foo_bar/bbb/file.txt");
                expectMatch(filter, "/aaa/bbb/fooX.txt");
                expectMatch(filter, "/aaa/bbb/Xfoo.txt");
                expectMatch(filter, "/aaa/bbb/ccc.fooX");
                expectMatch(filter, "/aaa/bbb/ccc.Xfoo");

                expectNotMatch(filter, "/aaa/bbb/ccc.txt");
                expectNotMatch(filter, "/aaa/fo/o.txt");
            });

            it("should match file extension", function () {
                var filter = FileFilters.compile(["*.css"]);
                expectMatch(filter,    "/file.css");
                expectMatch(filter,    "/aaa/bbb/file.css");
                expectNotMatch(filter, "/foo/bbb/file.txt");
                expectNotMatch(filter, "/aaa/bbb/file.cssX");
                expectNotMatch(filter, "/aaa/bbb/file.Xcss");
                expectNotMatch(filter, "/aaa/bbb/fileXcss");
                expectNotMatch(filter, "/aaa/bbb/file.css.min");
                expectNotMatch(filter, "/aaa/bbb/filecss");
                expectNotMatch(filter, "/aaa/bbb.css/file.txt");
                expectMatch(filter,    "/aaa/bbb.css/file.css");
                expectMatch(filter,    "/aaa/bbb/.css");
                expectNotMatch(filter, "/aaa/bbb/.css/");
            });

            it("should match file name", function () {
                var filter = FileFilters.compile(["/jquery.js"]);
                expectMatch(filter,    "/jquery.js");
                expectMatch(filter,    "/aaa/bbb/jquery.js");
                expectNotMatch(filter, "/foo/bbb/jquery.js.txt");
                expectNotMatch(filter, "/foo/bbb/Xjquery.js");
                expectNotMatch(filter, "/foo/bbb/jquery.jsX");
                expectNotMatch(filter, "/aaa/jqueryXjs");
                expectNotMatch(filter, "/aaa/jquery.js/");
                expectNotMatch(filter, "/aaa/jquery.js/file.js");
                expectNotMatch(filter, "/aaa/jquery.js/file.txt");
                expectMatch(filter,    "/aaa/jquery.js/jquery.js");
            });

            it("should match folder name", function () {
                var filter = FileFilters.compile(["/node_modules/"]);
                expectMatch(filter,    "/node_modules/");
                expectMatch(filter,    "/node_modules/file.js");
                expectMatch(filter,    "/node_modules/bbb/file.js");
                expectMatch(filter,    "/aaa/node_modules/file.js");
                expectNotMatch(filter, "/aaa/bbb/file.js");
                expectNotMatch(filter, "/aaa/Xnode_modules/file.js");
                expectNotMatch(filter, "/aaa/node_modulesX/file.js");
                expectNotMatch(filter, "/aaa/bbb/node_modules.js");
            });

            it("should match multi-segment path part", function () {
                var filter = FileFilters.compile(["/foo/bar/"]);
                expectMatch(filter,    "/foo/bar/");
                expectMatch(filter,    "/foo/bar/file.txt");
                expectMatch(filter,    "/aaa/foo/bar/");
                expectMatch(filter,    "/aaa/foo/bar/file.txt");
                expectNotMatch(filter, "/foo/aaa/bar/");
                expectNotMatch(filter, "/foo.bar/");
                expectNotMatch(filter, "/Xfoo/bar");
                expectNotMatch(filter, "/fooX/bar");
                expectNotMatch(filter, "/foo/Xbar");
                expectNotMatch(filter, "/foo/barX");
                expectMatch(filter,    "/foo/aaa/foo/bar/file.txt");

                filter = FileFilters.compile(["/foo/bar.js"]);
                expectNotMatch(filter, "/foo/bar");
                expectNotMatch(filter, "/foo/bar/");
                expectNotMatch(filter, "/foo/bar/file.txt");
                expectMatch(filter,    "/foo/bar.js");
                expectMatch(filter,    "/aaa/foo/bar.js");
                expectNotMatch(filter, "/aaa/foo/bar.js/file.txt");
                expectNotMatch(filter, "/foo/aaa/bar.js");
                expectNotMatch(filter, "/foo.bar.js");
                expectNotMatch(filter, "/Xfoo/bar.js");
                expectNotMatch(filter, "/fooX/bar.js");
                expectNotMatch(filter, "/foo/Xbar.js");
                expectNotMatch(filter, "/foo/barX.js");
                expectNotMatch(filter, "/foo/bar.Xjs");
                expectNotMatch(filter, "/foo/bar.jsX");
                expectMatch(filter,    "/foo/aaa/foo/bar.js");
            });

            it("should match * within path segment", function () {
                var filter = FileFilters.compile(["a*c"]);
                expectMatch(filter,    "/ac");
                expectMatch(filter,    "/abc");
                expectMatch(filter,    "/a123c");
                expectMatch(filter,    "/Xac");
                expectMatch(filter,    "/Xabc");
                expectMatch(filter,    "/Xa123c");
                expectMatch(filter,    "/acX");
                expectMatch(filter,    "/abcX");
                expectMatch(filter,    "/a123cX");
                expectMatch(filter,    "/ac/");
                expectMatch(filter,    "/abc/");
                expectMatch(filter,    "/a123c/");
                expectMatch(filter,    "/ab.c/");
                expectMatch(filter,    "/Xab.c/");
                expectMatch(filter,    "/ab.cX/");
                expectNotMatch(filter, "/ab/cd");
                expectNotMatch(filter, "/ab/cd/");
                expectMatch(filter,    "/abcd/cd/");

                filter = FileFilters.compile(["/foo*.js"]);
                expectMatch(filter,    "/foo.js");
                expectMatch(filter,    "/aaa/foo.js");
                expectMatch(filter,    "/fooX.js");
                expectMatch(filter,    "/aaa/fooX.js");
                expectMatch(filter,    "/fooXYZ.js");
                expectMatch(filter,    "/aaa/fooXYZ.js");
                expectNotMatch(filter, "/foojs");
                expectNotMatch(filter, "/foo.js/bar");
                expectNotMatch(filter, "/foo/bar.js");

                filter = FileFilters.compile(["*foo*"]);  // this might as well be ** on either side, since implied ones are added
                expectMatch(filter,    "/aaa/foo/ccc");
                expectMatch(filter,    "/foo/bbb/ccc");
                expectMatch(filter,    "/aaa/bbb/foo");
                expectMatch(filter,    "/aaa/bbb/foo.txt");
                expectMatch(filter,    "/aaa/bbb/Xfoo.txt");
                expectMatch(filter,    "/aaa/Xfoo/ccc");
                expectMatch(filter,    "/aaa/fooX/ccc");
                expectMatch(filter,    "/Xfoo/bbb/ccc");
                expectMatch(filter,    "/fooX/bbb/ccc");
                expectNotMatch(filter, "/aaaf/oo/bbb");

                filter = FileFilters.compile(["/*foo*/"]);
                expectMatch(filter,    "/aaa/foo/ccc");
                expectMatch(filter,    "/foo/bbb/ccc");
                expectNotMatch(filter, "/aaa/bbb/foo");
                expectNotMatch(filter, "/aaa/bbb/foo.txt");
                expectMatch(filter,    "/aaa/Xfoo/ccc");
                expectMatch(filter,    "/aaa/fooX/ccc");
                expectMatch(filter,    "/Xfoo/bbb/ccc");
                expectMatch(filter,    "/fooX/bbb/ccc");
                expectNotMatch(filter, "/aaaf/oo/bbb");

                filter = FileFilters.compile(["node_*"]);
                expectMatch(filter,    "/code/node_modules/foo.js");
                expectMatch(filter,    "/code/node_core/foo.js");
                expectMatch(filter,    "/code/node_foo.txt");
                expectMatch(filter,    "/code/Xnode_foo.txt");

                filter = FileFilters.compile(["/node_*"]);
                expectNotMatch(filter, "/code/Xnode_foo.txt");

                filter = FileFilters.compile(["/*/"]);  // remember there's an implied ** on either side of this
                expectMatch(filter,    "/aaa/bbb/ccc");
                expectMatch(filter,    "/aaa/");
                expectMatch(filter,    "/aaa/bbb/file.txt");
                expectMatch(filter,    "/aaa/file.txt");
                expectNotMatch(filter, "/file.txt");

                filter = FileFilters.compile(["/aaa/*/ccc/"]);
                expectMatch(filter,    "/aaa/bbb/ccc/");
                expectMatch(filter,    "/aaa/bbb/ccc/file.txt");
                expectMatch(filter,    "/X/aaa/bbb/ccc/");
                expectNotMatch(filter, "/aaa/ccc/");
                expectNotMatch(filter, "/aaa/bbb/xxx/ccc/");
                expectNotMatch(filter, "/X/aaa/bbb/xxx/ccc/");
                expectNotMatch(filter, "/aaa/bbb/aaa/ccc/");
                expectMatch(filter,    "/aaa/aaa/bbb/ccc/");

                filter = FileFilters.compile(["/aaa*/bbb/"]);
                expectMatch(filter,    "/aaa/bbb/");
                expectMatch(filter,    "/aaa/bbb/file.txt");
                expectMatch(filter,    "/aaaXYZ/bbb/");
                expectMatch(filter,    "/aaaXYZ/bbb/file.txt");
                expectNotMatch(filter, "/aaa/xxx/bbb/");
                expectNotMatch(filter, "/Xaaa/bbb/");
                expectNotMatch(filter, "/aaa/bbbX/");

                // Multiple wildcards
                filter = FileFilters.compile(["/thirdparty/*/jquery*.js"]);
                expectNotMatch(filter, "/thirdparty/jquery.js");
                expectNotMatch(filter, "/thirdparty/jquery-1.7.js");
                expectNotMatch(filter, "/thirdparty/jquery-2.1.0.min.js");
                expectMatch(filter,    "/thirdparty/foo/jquery.js");
                expectMatch(filter,    "/thirdparty/foo/jquery-1.7.js");
                expectMatch(filter,    "/thirdparty/foo/jquery-2.1.0.min.js");
                expectNotMatch(filter, "/thirdparty/foo/bar/jquery.js");
                expectNotMatch(filter, "/thirdparty/foo/bar/jquery-1.7.js");
                expectNotMatch(filter, "/thirdparty/foo/bar/jquery-2.1.0.min.js");
                expectNotMatch(filter, "/foo/jquery-2.1.0.min.js");
                expectNotMatch(filter, "/thirdparty/jquery-1.7.map");
                expectNotMatch(filter, "/thirdparty/jquery-1.7.js.md");
                expectNotMatch(filter, "/thirdparty/jquery-docs.js/foo.js");
            });

            it("should match ** across path segments", function () {
                // Note: many of the other testcases also cover ** since they're implied at the start & end of most filters
                // (see docs in FileFilters.compile() and at https://github.com/adobe/brackets/wiki/Using-File-Filters)

                var filter = FileFilters.compile(["a**c"]);
                expectMatch(filter,    "/ac");
                expectMatch(filter,    "/abc");
                expectMatch(filter,    "/a123c");
                expectMatch(filter,    "/Xac");
                expectMatch(filter,    "/Xabc");
                expectMatch(filter,    "/Xa123c");
                expectMatch(filter,    "/acX");
                expectMatch(filter,    "/abcX");
                expectMatch(filter,    "/a123cX");
                expectMatch(filter,    "/ac/");
                expectMatch(filter,    "/abc/");
                expectMatch(filter,    "/a123c/");
                expectMatch(filter,    "/ab.c/");
                expectMatch(filter,    "/ab.cX/");
                expectMatch(filter,    "/ab/cX");
                expectMatch(filter,    "/ab/cX/");
                expectMatch(filter,    "/Xab.c/");
                expectMatch(filter,    "/Xab/c");
                expectMatch(filter,    "/Xab/c/");
                expectMatch(filter,    "/abcd/cd/");
                expectNotMatch(filter, "/ab/d/");
                expectNotMatch(filter, "/c/a/d/");

                filter = FileFilters.compile(["foo**"]);  // this is equivalent to just "foo"
                expectMatch(filter,    "/foo");
                expectMatch(filter,    "/aaa/foo");
                expectMatch(filter,    "/foo/aaa");
                expectMatch(filter,    "/Xfoo");
                expectMatch(filter,    "/fooX");
                expectMatch(filter,    "/aaa/Xfoo");
                expectMatch(filter,    "/aaa/fooX");
                expectMatch(filter,    "/Xfoo/aaa");
                expectMatch(filter,    "/fooX/aaa");
                expectNotMatch(filter, "/fo/oaaa");

                filter = FileFilters.compile(["/foo**"]);
                expectMatch(filter,    "/foo");
                expectMatch(filter,    "/aaa/foo");
                expectMatch(filter,    "/foo/aaa");
                expectNotMatch(filter, "/Xfoo");
                expectMatch(filter,    "/fooX");
                expectNotMatch(filter, "/aaa/Xfoo");
                expectMatch(filter,    "/aaa/fooX");
                expectNotMatch(filter, "/Xfoo/aaa");
                expectMatch(filter,    "/fooX/aaa");

                filter = FileFilters.compile(["/aaa/**/ccc/"]);
                expectMatch(filter,    "/aaa/ccc/");    // important: slashes delimiting a ** can collapse to a single slash
                expectMatch(filter,    "/aaa/ccc/file.txt");
                expectMatch(filter,    "/aaa/ccc/ddd/");
                expectMatch(filter,    "/aaa/bbb/ccc/");
                expectMatch(filter,    "/aaa/bbb/ccc/file.txt");
                expectMatch(filter,    "/aaa/bbb/ccc/ddd/");
                expectMatch(filter,    "/aaa/bbb/xxx/ccc/");
                expectMatch(filter,    "/aaa/bbb/xxx/ccc/file.txt");
                expectMatch(filter,    "/aaa/bbb/xxx/ccc/ddd/");
                expectMatch(filter,    "/X/aaa/ccc/");
                expectMatch(filter,    "/X/aaa/bbb/ccc/");
                expectMatch(filter,    "/aaa/bbb/aaa/ccc/");
                expectMatch(filter,    "/aaa/aaa/bbb/ccc/");
                expectMatch(filter,    "/ccc/aaa/bbb/ccc/");

                // Combining wildcards
                filter = FileFilters.compile(["/thirdparty/**/jquery*.js"]);
                expectMatch(filter,    "/thirdparty/jquery.js");
                expectMatch(filter,    "/thirdparty/jquery-1.7.js");
                expectMatch(filter,    "/thirdparty/jquery-2.1.0.min.js");
                expectMatch(filter,    "/thirdparty/foo/jquery.js");
                expectMatch(filter,    "/thirdparty/foo/jquery-1.7.js");
                expectMatch(filter,    "/thirdparty/foo/jquery-2.1.0.min.js");
                expectMatch(filter,    "/thirdparty/foo/bar/jquery.js");
                expectMatch(filter,    "/thirdparty/foo/bar/jquery-1.7.js");
                expectMatch(filter,    "/thirdparty/foo/bar/jquery-2.1.0.min.js");
                expectNotMatch(filter, "/foo/jquery-2.1.0.min.js");
                expectNotMatch(filter, "/thirdparty/jquery-1.7.map");
                expectNotMatch(filter, "/thirdparty/jquery-1.7.js.md");
                expectNotMatch(filter, "/thirdparty/jquery-docs.js/foo.js");
            });

            it("should match ? against single non-slash char", function () {
                var filter = FileFilters.compile(["a?c"]);
                expectNotMatch(filter, "/ac");
                expectMatch(filter,    "/abc");
                expectNotMatch(filter, "/Xac");
                expectMatch(filter,    "/Xabc");
                expectNotMatch(filter, "/acX");
                expectMatch(filter,    "/abcX");
                expectNotMatch(filter, "/abbc");
                expectNotMatch(filter, "/a123c");
                expectNotMatch(filter, "/ac/");
                expectMatch(filter,    "/abc/");
                expectMatch(filter,    "/a.c/");
                expectNotMatch(filter, "/Xac/");
                expectMatch(filter,    "/Xabc/");
                expectMatch(filter,    "/Xa.c/");
                expectNotMatch(filter, "/acX/");
                expectMatch(filter,    "/abcX/");
                expectMatch(filter,    "/a.cX/");
                expectNotMatch(filter, "/a/c");
                expectNotMatch(filter, "/a/c/");

                filter = FileFilters.compile(["jquery-1.?.js"]);
                expectMatch(filter,    "/foo/jquery-1.6.js");
                expectNotMatch(filter, "/foo/jquery-1.6.1.js");

                filter = FileFilters.compile(["jquery-?.?.js"]);
                expectMatch(filter,    "/foo/jquery-1.6.js");
                expectMatch(filter,    "/foo/jquery-2.0.js");
                expectNotMatch(filter, "/foo/jquery-1.6.1.js");

                filter = FileFilters.compile(["jquery-1.??.js"]);
                expectNotMatch(filter, "/foo/jquery-1.6.js");
                expectMatch(filter,    "/foo/jquery-1.10.js");
                expectNotMatch(filter, "/foo/jquery-1.6.1.js");
                expectNotMatch(filter, "/foo/jquery-1./a.js");

                filter = FileFilters.compile(["jquery-1.?*.js"]);  // this is essentially a way of saying '1 or more chars', like regexp + quantifier
                expectMatch(filter,    "/foo/jquery-1.6.js");
                expectMatch(filter,    "/foo/jquery-1.10.js");
                expectMatch(filter,    "/foo/jquery-1.6.1.js");
                expectMatch(filter,    "/foo/jquery-1.6-min.js");
                expectNotMatch(filter, "/foo/jquery-1.6/a.js");
            });
        });

        describe("Automatic glob prefixes/suffixes", function () {
            function expectEquivalent(orig, wrapped) {
                var compiled1 = FileFilters.compile([orig]);
                var compiled2 = FileFilters.compile([wrapped]);
                expect(compiled1).toEqual(compiled2);
            }

            it("should add ** prefix & suffix", function () {
                expectEquivalent("node_modules", "**node_modules**");
                expectEquivalent("/node_modules/", "**/node_modules/**");
                expectEquivalent("node_*", "**node_***");
                expectEquivalent("node_?", "**node_?**");
                expectEquivalent("*-test-files/", "***-test-files/**");
                expectEquivalent("LiveDevelopment/**/Inspector", "**LiveDevelopment/**/Inspector**");
            });

            it("shouldn't add ** suffix", function () {
                expectEquivalent("README.md", "**README.md");
                expectEquivalent("/README.md", "**/README.md");
                expectEquivalent("*.ttf", "***.ttf");
                expectEquivalent("*.cf?", "***.cf?");
                expectEquivalent("*.htm*", "***.htm*");
                expectEquivalent("/jquery*.js", "**/jquery*.js");
                expectEquivalent("/jquery-1.?.js", "**/jquery-1.?.js");
                expectEquivalent("thirdparty/**/jquery*.js", "**thirdparty/**/jquery*.js");
            });

            it("shouldn't add extra ** prefix", function () {
                expectEquivalent("**node_modules", "**node_modules**");
                expectEquivalent("**/node_modules/**", "**/node_modules/**");
                expectEquivalent("**README.md", "**README.md");
            });

            it("empty filter shouldn't be prefixed/suffixed", function () {
                expect(FileFilters.compile([])).toEqual("");
            });
        });

        describe("Multiple filter sets preferences", function () {
            it("should not have any filter sets in preferences initially", function () {
                expect(PreferencesManager.get("fileFilters")).toBeFalsy();
            });

            it("should migrate old filter sets to the new multiple filter sets pref", function () {
                PreferencesManager.setViewState("search.exclusions", "*.css, *.less");
                expect(FileFilters.getActiveFilter()).toEqual({name: "", patterns: "*.css, *.less"});
                expect(PreferencesManager.get("fileFilters")).toEqual([{name: "", patterns: "*.css, *.less"}]);
                expect(PreferencesManager.getViewState("activeFileFilter")).toBe(0);
            });

            it("should select the newly added filter set as the active one", function () {
                var existingFilters = [{name: "Node Modules", patterns: "node_module"},
                                       {name: "Mark Down Files", patterns: "*.md"}],
                    newFilterSet    = {name: "CSS Files", patterns: "*.css, *.less"};

                // Create two filter sets and make the first one active.
                PreferencesManager.set("fileFilters", existingFilters);
                PreferencesManager.setViewState("activeFileFilter", 0);

                // Add a new filter set as the last one.
                FileFilters.setActiveFilter(newFilterSet, -1);
                expect(FileFilters.getActiveFilter()).toEqual(newFilterSet);
                expect(PreferencesManager.getViewState("activeFileFilter")).toBe(2);
                expect(PreferencesManager.get("fileFilters")).toEqual(existingFilters.concat([newFilterSet]));
            });

            it("should select the just edited filter set as the active one", function () {
                var existingFilters = [{name: "Node Modules", patterns: "node_module"},
                                       {name: "Mark Down Files", patterns: "*.md"}],
                    newFilterSet    = {name: "CSS Files", patterns: "*.css, *.less"};

                // Create two filter sets and make the first one active.
                PreferencesManager.set("fileFilters", existingFilters);
                PreferencesManager.setViewState("activeFileFilter", 0);

                // Replace the second filter set with a new one.
                FileFilters.setActiveFilter(newFilterSet, 1);
                expect(FileFilters.getActiveFilter()).toEqual(newFilterSet);
                expect(PreferencesManager.getViewState("activeFileFilter")).toBe(1);

                existingFilters.splice(1, 1, newFilterSet);
                expect(PreferencesManager.get("fileFilters")).toEqual(existingFilters);
            });

            it("should not have an active filter set after removing the current active one", function () {
                var existingFilters = [{name: "Node Modules", patterns: "node_module"},
                                       {name: "Mark Down Files", patterns: "*.md"}];

                // Create two filter sets and make the second one active.
                PreferencesManager.set("fileFilters", existingFilters);
                PreferencesManager.setViewState("activeFileFilter", 1);

                expect(PreferencesManager.get("fileFilters")).toEqual(existingFilters);
                expect(PreferencesManager.getViewState("activeFileFilter")).toBe(1);

                // Remove the current active filter
                FileFilters.setActiveFilter();

                expect(PreferencesManager.getViewState("activeFileFilter")).toBe(-1);
            });
        });

        describe("Integration", function () {

            this.category = "integration";

            var testPath = SpecRunnerUtils.getTestPath("/spec/InlineEditorProviders-test-files"),
                testWindow,
                FileFilters,
                FileSystem,
                FindInFiles,
                FindInFilesUI,
                CommandManager,
                $;

            // We don't directly call beforeFirst/afterLast here because it appears that we need
            // separate test windows for the nested describe suites.
            function setupTestWindow(spec) {
                // Create a new window that will be shared by ALL tests in this spec.
                SpecRunnerUtils.createTestWindowAndRun(spec, function (w) {
                    testWindow = w;

                    // Load module instances from brackets.test
                    FileFilters     = testWindow.brackets.test.FileFilters;
                    FileSystem      = testWindow.brackets.test.FileSystem;
                    FindInFiles     = testWindow.brackets.test.FindInFiles;
                    FindInFilesUI   = testWindow.brackets.test.FindInFilesUI;
                    CommandManager  = testWindow.brackets.test.CommandManager;
                    $               = testWindow.$;

                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
            }

            function teardownTestWindow() {
                testWindow = null;
                FileSystem = null;
                FileFilters = null;
                FindInFiles = null;
                FindInFilesUI = null;
                CommandManager = null;
                $ = null;
                SpecRunnerUtils.closeTestWindow();
            }

            // These helper functions are slight variations of the ones in FindInFiles, so need to be
            // kept in sync with those. It's a bit awkward to try to share them, and as long as
            // it's just these few functions it's probably okay to just keep them in sync manually,
            // but if this gets more complicated we should probably figure out how to break them out.
            function openSearchBar(scope) {
                runs(function () {
                    FindInFiles._searchDone = false;
                    FindInFilesUI._showFindBar(scope);
                });
                waitsFor(function () {
                    return $(".modal-bar").length === 1;
                }, "search bar open");
            }

            function closeSearchBar() {
                runs(function () {
                    var $searchField = $(".modal-bar #find-group input");
                    SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keydown", $searchField[0]);
                });
            }

            function executeSearch(searchString) {
                FindInFiles._searchDone = false;
                var $searchField = $(".modal-bar #find-group input");
                $searchField.val(searchString).trigger("input");
                SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $searchField[0]);
                waitsFor(function () {
                    return FindInFiles._searchDone;
                }, "Find in Files done");
            }

            describe("Find in Files filtering", function () {
                beforeFirst(function () {
                    setupTestWindow(this);
                });
                afterLast(teardownTestWindow);

                it("should search all files by default", function () {
                    openSearchBar();
                    runs(function () {
                        executeSearch("{1}");
                    });
                    runs(function () {
                        expect(FindInFiles.searchModel.results[testPath + "/test1.css"]).toBeTruthy();
                        expect(FindInFiles.searchModel.results[testPath + "/test1.html"]).toBeTruthy();
                    });
                });

                // This finishes async, since clickDialogButton() finishes async (dialogs close asynchronously)
                function setExcludeCSSFiles() {
                    // Launch filter editor
                    FileFilters.editFilter({ name: "", patterns: [] }, -1);

                    // Edit the filter & confirm changes
                    $(".modal.instance textarea").val("*.css");
                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK, true);
                }

                it("should exclude files from search", function () {
                    openSearchBar();
                    runs(function () {
                        setExcludeCSSFiles();
                    });
                    runs(function () {
                        executeSearch("{1}");
                    });
                    runs(function () {
                        // *.css should have been excluded this time
                        expect(FindInFiles.searchModel.results[testPath + "/test1.css"]).toBeFalsy();
                        expect(FindInFiles.searchModel.results[testPath + "/test1.html"]).toBeTruthy();
                    });
                });

                it("should respect filter when searching folder", function () {
                    var dirEntry = FileSystem.getDirectoryForPath(testPath);
                    openSearchBar(dirEntry);
                    runs(function () {
                        setExcludeCSSFiles();
                    });
                    runs(function () {
                        executeSearch("{1}");
                    });
                    runs(function () {
                        // *.css should have been excluded this time
                        expect(FindInFiles.searchModel.results[testPath + "/test1.css"]).toBeFalsy();
                        expect(FindInFiles.searchModel.results[testPath + "/test1.html"]).toBeTruthy();
                    });
                });

                it("should ignore filter when searching a single file", function () {
                    var fileEntry = FileSystem.getFileForPath(testPath + "/test1.css");
                    openSearchBar(fileEntry);
                    runs(function () {
                        // Cannot explicitly set *.css filter in dialog because button is hidden
                        // (which is verified here), but filter persists from previous test
                        expect($("button.file-filter-picker").is(":visible")).toBeFalsy();
                    });
                    runs(function () {
                        executeSearch("{1}");
                    });
                    runs(function () {
                        // ignore *.css exclusion since we're explicitly searching this file
                        expect(FindInFiles.searchModel.results[testPath + "/test1.css"]).toBeTruthy();
                    });
                });

                it("should show error when filter excludes all files", function () {
                    openSearchBar();
                    runs(function () {
                        // Launch filter editor
                        FileFilters.editFilter({ name: "", patterns: [] }, -1);

                        // Edit the filter & confirm changes
                        $(".modal.instance textarea").val("test1.*\n*.css");
                        SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK, true);
                    });
                    runs(function () {
                        executeSearch("{1}");
                    });
                    runs(function () {
                        var $modalBar = $(".modal-bar");

                        // Dialog still showing
                        expect($modalBar.length).toBe(1);

                        // Error message displayed
                        expect($modalBar.find("#find-group div.error").is(":visible")).toBeTruthy();

                        // Search panel not showing
                        expect($("#find-in-files-results").is(":visible")).toBeFalsy();

                        // Close search bar
                        var $searchField = $modalBar.find("#find-group input");
                        SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keydown", $searchField[0]);
                    });
                });

                it("should respect filter when editing code", function () {
                    openSearchBar();
                    runs(function () {
                        setExcludeCSSFiles();
                    });
                    runs(function () {
                        executeSearch("{1}");
                    });
                    runs(function () {
                        var promise = testWindow.brackets.test.DocumentManager.getDocumentForPath(testPath + "/test1.css");
                        waitsForDone(promise);
                        promise.done(function (doc) {
                            // Modify line that contains potential search result
                            expect(doc.getLine(5).indexOf("{1}")).not.toBe(-1);
                            doc.replaceRange("X", {line: 5, ch: 0});
                        });
                    });
                    runs(function () {
                        waits(800);  // ensure _documentChangeHandler()'s timeout has time to run
                    });
                    runs(function () {
                        expect(FindInFiles.searchModel.results[testPath + "/test1.css"]).toBeFalsy();  // *.css should still be excluded
                        expect(FindInFiles.searchModel.results[testPath + "/test1.html"]).toBeTruthy();
                    });
                });
            });

            describe("Filter picker UI", function () {
                beforeFirst(function () {
                    setupTestWindow(this);
                });
                afterLast(teardownTestWindow);

                beforeEach(function () {
                    openSearchBar();
                });

                afterEach(function () {
                    closeSearchBar();
                });

                function verifyButtonLabel(expectedLabel) {
                    var newButtonLabel  = StringUtils.format(Strings.EXCLUDE_FILE_FILTER, expectedLabel);

                    if (expectedLabel) {
                        // Verify filter picker button label is updated with the patterns of the selected filter set.
                        expect($("button.file-filter-picker").text()).toEqual(newButtonLabel);
                    } else {
                        expect($("button.file-filter-picker").text()).toEqual(Strings.NO_FILE_FILTER);
                    }
                }

                // This finishes async, since clickDialogButton() finishes async (dialogs close asynchronously)
                function setExcludeCSSFiles() {
                    // Edit the filter & confirm changes
                    $(".modal.instance .exclusions-name").val("CSS Files");
                    $(".modal.instance .exclusions-editor").val("*.css\n*.less\n*.scss");
                    SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK, true);
                }

                // Trigger a mouseover event on the 'parent' and then click on the button with the given 'selector'.
                function clickOnMouseOverButton(selector, parent) {
                    runs(function () {
                        parent.trigger("mouseover");
                    });
                    runs(function () {
                        expect($(selector, parent).is(":visible")).toBeTruthy();
                        $(selector, parent).click();
                    });
                }

                it("should show 'No files Excluded' in filter picker button by default", function () {
                    runs(function () {
                        verifyButtonLabel();
                    });
                });

                it("should show two filter commands by default", function () {
                    runs(function () {
                        FileFilters.showDropdown();
                    });

                    runs(function () {
                        var $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        expect($dropdown.is(":visible")).toBeTruthy();
                        expect($dropdown.children().length).toEqual(2);
                        expect($($dropdown.children()[0]).text()).toEqual(Strings.NEW_FILE_FILTER);
                        expect($($dropdown.children()[1]).text()).toEqual(Strings.CLEAR_FILE_FILTER);
                    });

                    runs(function () {
                        FileFilters.closeDropdown();
                    });
                });

                it("should launch filter editor and add a new filter set when invoked from new filter command", function () {
                    var $dropdown;
                    runs(function () {
                        FileFilters.showDropdown();
                    });

                    // Invoke new filter command by pressing down arrow key once and then enter key.
                    runs(function () {
                        $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_DOWN, "keydown", $dropdown[0]);
                        SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $dropdown[0]);
                    });

                    runs(function () {
                        setExcludeCSSFiles();
                    });

                    runs(function () {
                        FileFilters.showDropdown();
                    });

                    runs(function () {
                        var filterSuffix = StringUtils.format(Strings.FILE_FILTER_CLIPPED_SUFFIX, 1);

                        // Verify filter picker button is updated with the name of the new filter.
                        verifyButtonLabel("CSS Files");

                        $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        expect($dropdown.is(":visible")).toBeTruthy();
                        expect($dropdown.children().length).toEqual(4);
                        expect($($dropdown.children()[0]).text()).toEqual(Strings.NEW_FILE_FILTER);
                        expect($($dropdown.children()[1]).text()).toEqual(Strings.CLEAR_FILE_FILTER);
                        expect($(".recent-filter-name", $($dropdown.children()[3])).text()).toEqual("CSS Files");
                        expect($(".recent-filter-patterns", $($dropdown.children()[3])).text()).toEqual(" - *.css, *.less " + filterSuffix);
                    });

                    runs(function () {
                        FileFilters.closeDropdown();
                    });
                });

                it("should clear the active filter set when invoked from clear filter command", function () {
                    var $dropdown;
                    runs(function () {
                        FileFilters.showDropdown();
                    });

                    // Invoke new filter command by pressing down arrow key twice and then enter key.
                    runs(function () {
                        $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_DOWN, "keydown", $dropdown[0]);
                        SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_DOWN, "keydown", $dropdown[0]);
                        SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $dropdown[0]);
                    });

                    runs(function () {
                        // Verify filter picker button is updated to show no active filter.
                        verifyButtonLabel();
                        expect($dropdown.is(":visible")).toBeFalsy();
                    });

                    // Re-open dropdown list and verify that nothing changed.
                    runs(function () {
                        FileFilters.showDropdown();
                    });

                    runs(function () {
                        var filterSuffix = StringUtils.format(Strings.FILE_FILTER_CLIPPED_SUFFIX, 1);

                        $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        expect($dropdown.is(":visible")).toBeTruthy();
                        expect($dropdown.children().length).toEqual(4);
                        expect($($dropdown.children()[0]).text()).toEqual(Strings.NEW_FILE_FILTER);
                        expect($($dropdown.children()[1]).text()).toEqual(Strings.CLEAR_FILE_FILTER);
                        expect($(".recent-filter-name", $($dropdown.children()[3])).text()).toEqual("CSS Files");
                        expect($(".recent-filter-patterns", $($dropdown.children()[3])).text()).toEqual(" - *.css, *.less " + filterSuffix);
                    });

                    runs(function () {
                        FileFilters.closeDropdown();
                    });
                });

                it("should switch the active filter set to the selected one", function () {
                    var $dropdown;
                    runs(function () {
                        // Verify that there is no active filter (was set from the previous test).
                        verifyButtonLabel();
                        FileFilters.showDropdown();
                    });

                    // Select the last filter set in the dropdown by pressing up arrow key once and then enter key.
                    runs(function () {
                        $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_UP, "keydown", $dropdown[0]);
                        SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", $dropdown[0]);
                    });

                    runs(function () {
                        // Verify filter picker button label is updated with the name of the selected filter set.
                        verifyButtonLabel("CSS Files");
                        expect($dropdown.is(":visible")).toBeFalsy();
                    });
                });

                it("should launch filter editor and fill in the text fields with selected filter info", function () {
                    var $dropdown;

                    runs(function () {
                        FileFilters.showDropdown();
                    });

                    // Click on the edit icon that shows up in the first filter set on mouseover.
                    runs(function () {
                        $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        clickOnMouseOverButton(".filter-edit-icon", $($dropdown.children()[3]));
                    });

                    // Remove the name of the filter set and reduce the filter set to '*.css'.
                    runs(function () {
                        expect($(".modal.instance .exclusions-name").val()).toEqual("CSS Files");
                        expect($(".modal.instance .exclusions-editor").val()).toEqual("*.css\n*.less\n*.scss");

                        $(".modal.instance .exclusions-name").val("");
                        $(".modal.instance .exclusions-editor").val("*.css");
                        SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK, true);
                    });

                    runs(function () {
                        // Verify filter picker button label is updated with the patterns of the selected filter set.
                        verifyButtonLabel("*.css");
                        expect($dropdown.is(":visible")).toBeFalsy();
                    });
                });

                it("should remove selected filter from filter sets preferences without changing picker button label", function () {
                    var $dropdown,
                        filters = [{name: "Node Modules", patterns: ["node_module"]},
                                   {name: "Mark Down Files", patterns: ["*.md"]},
                                   {name: "CSS Files", patterns: ["*.css", "*.less"]}];

                    // Create three filter sets and make the last one active.
                    runs(function () {
                        FileFilters.editFilter(filters[0], 0);
                        SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK, true);
                    });

                    runs(function () {
                        FileFilters.editFilter(filters[1], -1);
                        SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK, true);
                    });

                    runs(function () {
                        FileFilters.editFilter(filters[2], -1);
                        SpecRunnerUtils.clickDialogButton(Dialogs.DIALOG_BTN_OK, true);
                    });

                    runs(function () {
                        verifyButtonLabel("CSS Files");
                        FileFilters.showDropdown();
                    });

                    runs(function () {
                        $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        expect($dropdown.children().length).toEqual(6);
                    });

                    // Click on the delete icon that shows up in the first filter set on mouseover.
                    runs(function () {
                        clickOnMouseOverButton(".filter-trash-icon", $($dropdown.children()[3]));
                    });

                    runs(function () {
                        expect($dropdown.is(":visible")).toBeTruthy();
                        // Verify that button label is still the same since the deleted one is not the active one.
                        verifyButtonLabel("CSS Files");

                        // Verify that the list has one less item (from 6 to 5).
                        expect($dropdown.children().length).toEqual(5);

                        // Verify data-index of the two remaining filter sets.
                        expect($("a", $dropdown.children()[3]).data("index")).toBe(3);
                        expect($("a", $dropdown.children()[4]).data("index")).toBe(4);
                    });

                    runs(function () {
                        FileFilters.closeDropdown();
                    });
                });

                it("should remove selected filter from filter sets preferences plus changing picker button label", function () {
                    var $dropdown;

                    runs(function () {
                        verifyButtonLabel("CSS Files");
                        FileFilters.showDropdown();
                    });

                    runs(function () {
                        $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        expect($dropdown.children().length).toEqual(5);
                    });

                    // Click on the delete icon that shows up in the last filter set on mouseover.
                    runs(function () {
                        clickOnMouseOverButton(".filter-trash-icon", $($dropdown.children()[4]));
                    });

                    runs(function () {
                        expect($dropdown.is(":visible")).toBeTruthy();
                        // Verify that button label is changed to "No Files Excluded".
                        verifyButtonLabel();

                        // Verify that the list has one less item.
                        expect($dropdown.children().length).toEqual(4);
                    });

                    runs(function () {
                        FileFilters.closeDropdown();
                    });
                });

                it("should also remove the divider from the dropdown list after removing the last remaining filter set", function () {
                    var $dropdown;

                    runs(function () {
                        verifyButtonLabel();
                        FileFilters.showDropdown();
                    });

                    runs(function () {
                        $dropdown = $(".dropdown-menu.dropdownbutton-popup");
                        expect($dropdown.children().length).toEqual(4);
                    });

                    // Click on the delete icon that shows up in the last filter set on mouseover.
                    runs(function () {
                        clickOnMouseOverButton(".filter-trash-icon", $($dropdown.children()[3]));
                    });

                    runs(function () {
                        expect($dropdown.is(":visible")).toBeTruthy();
                        // Verify that button label still shows "No Files Excluded".
                        verifyButtonLabel();

                        // Verify that the list has only two filter commands.
                        expect($dropdown.children().length).toEqual(2);
                    });

                    runs(function () {
                        FileFilters.closeDropdown();
                    });
                });
            });
        });
    });
});
