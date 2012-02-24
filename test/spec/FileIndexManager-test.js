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
                FileIndexManager.getFileInfoList("all")
                    .done(function (result) {
                        allFiles = result;
                    });

                FileIndexManager.getFileInfoList("css")
                    .done(function (result) {
                        cssFiles = result;
                    });
            });

            waitsFor(function () { return allFiles && cssFiles; }, "FileIndexManager.getFileInfoList() timeout", 1000);
            
            runs(function () {
                expect(allFiles.length).toEqual(8);
                expect(cssFiles.length).toEqual(3);
            });
            
        });

        it("should match a specific filename and return the correct FileInfo", function () {
            // Open a directory
            SpecRunnerUtils.loadProjectInTestWindow(testPath);
            
            var fileList;
            
            runs(function () {
                FileIndexManager.getFilenameMatches("all", "file_four.css")
                    .done(function (results) {
                        fileList = results;
                    });
            });
            
            waitsFor(function () { return fileList; }, 1000);
            
            runs(function () {
                expect(fileList.length).toEqual(1);
                expect(fileList[0].name).toEqual("file_four.css");
                expect(fileList[0].fullPath).toEqual(testPath + "/file_four.css");
            });
        });
        
        it("should update the indicies on project change", function () {
            // Load spec/FileIndexManager-test-files
            SpecRunnerUtils.loadProjectInTestWindow(testPath);

            var allFiles;
            runs(function () {
                FileIndexManager.getFileInfoList("all")
                    .done(function (result) {
                        allFiles = result;
                    });
            });

            waitsFor(function () { return allFiles; }, "FileIndexManager.getFileInfoList() timeout", 1000);
            
            runs(function () {
                expect(allFiles.length).toEqual(8);
            });
            
            // load a subfolder in the test project
            // spec/FileIndexManager-test-files/dir1/dir2
            SpecRunnerUtils.loadProjectInTestWindow(testPath + "/dir1/dir2/");

            runs(function () {
                FileIndexManager.getFileInfoList("all")
                    .done(function (result) {
                        allFiles = result;
                    });
            });

            waitsFor(function () { return allFiles; }, "FileIndexManager.getFileInfoList() timeout", 1000);
            
            runs(function () {
                expect(allFiles.length).toEqual(2);
                expect(allFiles[0].name).toEqual("file_eight.css");
                expect(allFiles[1].name).toEqual("file_seven.js");
            });
        });
        
        it("should update the indicies after being marked dirty", function () {
            // Load spec/FileIndexManager-test-files
            SpecRunnerUtils.loadProjectInTestWindow(testPath);

            var allFiles, txtFiles;
            
            // helper function to validate base state of 8 files
            function checkAllFileCount(fileCount) {
                runs(function () {
                    FileIndexManager.getFileInfoList("all")
                        .done(function (result) {
                            allFiles = result;
                        });
                });
    
                waitsFor(function () { return allFiles; }, "FileIndexManager.getFileInfoList() timeout", 1000);
                
                runs(function () {
                    expect(allFiles.length).toEqual(fileCount);
                });
            }
            
            // verify 8 files in base state
            checkAllFileCount(8);
            
            // add a temporary file to the folder
            var entry;
            
            // create a 9th file
            runs(function () {
                var root = ProjectManager.getProjectRoot();
                root.getFile("new-file.txt",
                             { create: true, exclusive: true },
                             function (fileEntry) { entry = fileEntry; });
            });
            
            waitsFor(function () { return entry; }, "getFile() timeout", 1000);
            
            runs(function () {
                // mark FileIndexManager dirty after new file was created
                FileIndexManager.markDirty();
            });

            waitsFor(function () { return allFiles; }, "FileIndexManager.getFileInfoList() timeout", 1000);
            
            // verify 9 files
            checkAllFileCount(9);
            
            var cleanupComplete = false;
            
            // verify the new file was added to the "all" index
            runs(function () {
                var filtered = allFiles.filter(function (value) {
                    return (value.name === "new-file.txt");
                });
                expect(filtered.length).toEqual(1);
                
                // remove the 9th file
                brackets.fs.unlink(entry.fullPath, function (err) {
                    cleanupComplete = (err === brackets.fs.NO_ERROR);
                });
            });

            // wait for the file to be deleted
            waitsFor(function () { return cleanupComplete; }, 1000);
            
            runs(function () {
                // mark FileIndexManager dirty after new file was deleted
                FileIndexManager.markDirty();
            });
            
            // verify that we're back to 8 files
            checkAllFileCount(8);
            
            // make sure the 9th file was removed from the index
            runs(function () {
                var filtered = allFiles.filter(function (value) {
                    return (value.name === "new-file.txt");
                });
                expect(filtered.length).toEqual(0);
            });
        });
    });
});
