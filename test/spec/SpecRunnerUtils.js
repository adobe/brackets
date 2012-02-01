/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false */
define(function (require, exports, module) {
    'use strict';
    
    var TEST_PREFERENCES_KEY = "com.adobe.brackets.test.preferences",
        testWindow;

    function getTestRoot() {
        // /path/to/brackets/test/SpecRunner.html
        var path = window.location.href;
        path = path.substr("file://".length);
        path = path.substr(0, path.lastIndexOf("/"));

        return path;
    }
    
    function getTestPath(path) {
        return getTestRoot() + path;
    }
    
    function getBracketsSourceRoot() {
        var path = window.location.href;
        path = path.substr("file://".length).split("/");
        path = path.slice(0, path.length - 2);
        path.push("src");
        return path.join("/");
    }

    function createTestWindowAndRun(spec, callback) {
        var isReady = false;

        runs(function () {
            testWindow = window.open(getBracketsSourceRoot() + "/index.html");
        });

        // FIXME (jasonsj): Need an event or something a little more reliable...
        waitsFor(
            function () {
                return testWindow.brackets && testWindow.brackets.test;
            },
            5000
        );

        runs(function () {
            // callback allows specs to query the testWindow before they run
            callback.call(spec, testWindow);
        });
    }

    function closeTestWindow() {
        // debug-only to see testWindow state before closing
        // waits(500);

        runs(function () {
            testWindow.close();
        });
    }

    function loadProjectInTestWindow(path) {
        var isReady = false;

        runs(function () {
            // begin loading project path
            var result = testWindow.brackets.test.ProjectManager.loadProject(path);
            result.done(function () {
                isReady = true;
            });
        });

        // wait for file system to finish loading
        waitsFor(function () { return isReady; }, "loadProject() timeout", 1000);
    }

    exports.TEST_PREFERENCES_KEY    = TEST_PREFERENCES_KEY;
    
    exports.getTestRoot             = getTestRoot;
    exports.getTestPath             = getTestPath;
    exports.getBracketsSourceRoot   = getBracketsSourceRoot;
    exports.createTestWindowAndRun  = createTestWindowAndRun;
    exports.closeTestWindow         = closeTestWindow;
    exports.loadProjectInTestWindow = loadProjectInTestWindow;
});
