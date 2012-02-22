/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, beforeEach: false, afterEach: false, it: false, runs: false, waitsFor: false, expect: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var FileIndexManager,
        ProjectManager,
        SpecRunnerUtils     = require("./SpecRunnerUtils.js");
    
    describe("FileIndexManager", function () {

    	var testPath = SpecRunnerUtils.getTestPath("/spec/FileIndexManager-test-files");
        var testWindow;

        beforeEach(function () {
        	

            var projectLoaded = false;
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;

                    // Load module instances from brackets.test
                    FileIndexManager  = testWindow.brackets.test.FileIndexManager;
                    ProjectManager = testWindow.brackets.test.ProjectManager;

                    // Initialize: register listeners
                    // testWindow.$(ProjectManager).on("projectRootChanged", function (event, addedDoc) {
                    //     projectLoaded = true;
                    // });

                    // Open a directory
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
            });

            waitsFor(function () { return projectLoaded; }, 1000);

        });

        afterEach(function () {
        });
        
        it("should index files in directory", function () {
        	var allFiles = FileIndexManager.getFileInfoList("all");
        	var cssFiles = FileIndexManager.getFileInfoList("css");
           	
            expect(allFiles.length).toEqual(5);
            expect(cssFiles.length).toEqual(2);
        });

        it("should match a specific filename and return the correct FileInfo", function () {
        	var fileList = FileIndexManager.getFilenameMatches("all", "file_four.css");
        	expect(fileList.length).toEqual(1);
        	expect(fileList.name).toEqual("file_four.css");
        	expect(fileList.fullPath).toEqual(testPath + "file_four.css");
        });
    });
});
