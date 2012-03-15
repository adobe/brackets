/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false */
define(function (require, exports, module) {
    'use strict';
    
    var FileUtils          = require("FileUtils"),
        NativeFileSystem   = require("NativeFileSystem").NativeFileSystem,
        DocumentManager    = require("DocumentManager");
    
    var TEST_PREFERENCES_KEY = "com.adobe.brackets.test.preferences",
        testWindow;
    
    function getTestRoot() {
        // /path/to/brackets/test/SpecRunner.html
        var path = window.location.pathname;
        path = path.substr(0, path.lastIndexOf("/"));
        path = FileUtils.convertToNativePath(path);
        return path;
    }
    
    function getTestPath(path) {
        return getTestRoot() + path;
    }
    
    function getBracketsSourceRoot() {
        var path = window.location.pathname;
        path = path.split("/");
        path = path.slice(0, path.length - 2);
        path.push("src");
        return path.join("/");
    }
    
    function createDummyDocument(initialContent) {
        var dummyFile = new NativeFileSystem.FileEntry("_unitTestDummyFile_" + nextDummyFileSuffix + ".js");
        nextDummyFileSuffix++;
        var realDocument = new DocumentManager.Document(dummyFile, 0, initialContent);
        
        realDocument.addRef = function () {};
        realDocument.releaseRef = function () {};
        realDocument._handleEditorChange = function () {
            this.isDirty = true;
            $(this).triggerHandler("change", [this]);
        };
        realDocument.notifySaved = function () {
            throw new Error("Cannot notifySaved() a unit-test dummy Document");
        };
        return realDocument;
    }
    var nextDummyFileSuffix = 1;

    function createTestWindowAndRun(spec, callback) {
        runs(function () {
            testWindow = window.open(getBracketsSourceRoot() + "/index.html", "_blank", "left=400,top=200,width=1000,height=700");
        });

        // FIXME (issue #249): Need an event or something a little more reliable...
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
            //we need to mark the documents as not dirty before we close
            //or the window will stay open prompting to save
            var workingSet = testWindow.brackets.test.DocumentManager.getAllOpenDocuments();
            workingSet.forEach(function resetDoc(ele, i, array) {
                if (ele.isDirty) {
                    //just refresh it back to it's current text. This will mark it
                    //clean to save
                    ele.refreshText(ele.getText(), ele.diskTimestamp);
                }
            });
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
    exports.createDummyDocument     = createDummyDocument;
    exports.createTestWindowAndRun  = createTestWindowAndRun;
    exports.closeTestWindow         = closeTestWindow;
    exports.loadProjectInTestWindow = loadProjectInTestWindow;
});
