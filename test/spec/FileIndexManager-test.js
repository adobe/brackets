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
        var brackets;

        beforeEach(function () {
        
            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                    brackets = testWindow.brackets;

                    // Load module instances from brackets.test
                    FileIndexManager  = testWindow.brackets.test.FileIndexManager;
                    ProjectManager = testWindow.brackets.test.ProjectManager;

                    
                });
            });


        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
        });
        
        it("should index files in directory", function () {
            // Open a directory
            SpecRunnerUtils.loadProjectInTestWindow(testPath);

            var allFiles, cssFiles;
            runs(function () {
                FileIndexManager.getFileInfoList("all", function(result) {
                    allFiles = result;
                     console.log( "all ready");
                });

                FileIndexManager.getFileInfoList("css", function(result) {
                    cssFiles = result;
                    console.log( "css ready");
                });
            });

            waitsFor(function () { return false; }, "FileIndexManager.getFileInfoList() timeout", 1000);
            
            console.log( "expect");
            expect(allFiles.length).toEqual(5);
            expect(cssFiles.length).toEqual(2);
            
        });

        it("should match a specific filename and return the correct FileInfo", function () {
            // Open a directory
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
            
            runs(function () {
                var fileList = FileIndexManager.getFilenameMatches("all", "file_four.css");
                expect(fileList.length).toEqual(1);
                expect(fileList.name).toEqual("file_four.css");
                expect(fileList.fullPath).toEqual(testPath + "file_four.css");
            });
        });
    });
});
