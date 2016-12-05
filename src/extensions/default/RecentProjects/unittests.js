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

/*global describe, it, expect, beforeFirst, afterLast, runs, waitsFor, spyOn */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        KeyEvent        = brackets.getModule("utils/KeyEvent"),
        _               = brackets.getModule("thirdparty/lodash");

    describe("Recent Projects", function () {
        var extensionPath = FileUtils.getNativeModuleDirectoryPath(module),
            testWindow,
            $,
            CommandManager,
            PreferencesManager;

        beforeFirst(function () {
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    $ = testWindow.$;
                    CommandManager  = testWindow.brackets.test.CommandManager;
                    PreferencesManager = testWindow.brackets.test.PreferencesManager;
                });
            });
        });

        afterLast(function () {
            testWindow = null;
            SpecRunnerUtils.closeTestWindow();
        });

        function openRecentProjectDropDown() {
            CommandManager.execute("recentProjects.toggle");
            waitsFor(function () {
                return $("#project-dropdown").is(":visible");
            });
        }

        function setupRecentProjectsSpy(howManyProjects) {
            spyOn(PreferencesManager, "getViewState").andCallFake(function (prefId) {
                if (prefId === "recentProjects") {
                    // return howManyProjects number of fake recent projects entries
                    return _.map(_.range(1, howManyProjects + 1), function (num) { return extensionPath + "/Test-Project-" + num; });
                } else {
                    return [];
                }
            });
        }

        describe("UI", function () {
            it("should open the recent projects list with only the getting started project", function () {
                runs(function () {
                    openRecentProjectDropDown();
                });

                runs(function () {
                    var $dropDown = $("#project-dropdown");
                    expect($dropDown.children().length).toEqual(1);
                });
            });

            it("should open the recent project list and show 5 recent projects", function () {
                setupRecentProjectsSpy(5);

                runs(function () {
                    openRecentProjectDropDown();
                });

                runs(function () {
                    var $dropDown = $("#project-dropdown");
                    expect($dropDown.find(".recent-folder-link").length).toEqual(5);
                });
            });

            it("should delete one project from recent project list when delete key is pressed on", function () {
                setupRecentProjectsSpy(5);

                runs(function () {
                    openRecentProjectDropDown();
                });

                runs(function () {
                    var $dropDown = $("#project-dropdown");
                    SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_DOWN, "keydown", $dropDown[0]);
                    SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_DELETE, "keydown", $dropDown[0]);
                });

                runs(function () {
                    var $dropDown = $("#project-dropdown");
                    expect($dropDown.find(".recent-folder-link").length).toEqual(4);
                });
            });
        });
    });
});
