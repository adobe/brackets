/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, brackets, beforeEach, afterEach, it, runs, waitsFor, waitsForDone, expect, spyOn, jasmine, beforeFirst, afterLast */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var SpecRunnerUtils     = require("spec/SpecRunnerUtils");
    
    describe("FileIndexManager", function () {
        
        describe("unit tests", function () {
            var ProjectManager = require("project/ProjectManager"),
                FileIndexManager = require("project/FileIndexManager"),
                curProjectRoot;
            
            beforeEach(function () {
                curProjectRoot = null;
                spyOn(ProjectManager, "shouldShow").andCallFake(function () {
                    return true;
                });
                spyOn(ProjectManager, "getProjectRoot").andCallFake(function () {
                    return curProjectRoot;
                });
            });
            
            function makeFakeProjectDirectory(fakePath, fakeReadEntries) {
                var readEntriesSpy = jasmine.createSpy().andCallFake(fakeReadEntries);
                return {
                    fullPath: fakePath,
                    createReader: function () {
                        return {
                            readEntries: readEntriesSpy
                        };
                    },
                    readEntriesSpy: readEntriesSpy
                };
            }
            
            it("should abort a running scan and start a new one if another scan is requested while dirty", function () {
                var firstCB, secondCB, firstFileInfoResult, secondFileInfoResult,
                    firstProject = makeFakeProjectDirectory("fakeProject1", function (cb) {
                        firstCB = cb;
                    }),
                    secondProject = makeFakeProjectDirectory("fakeProject2", function (cb) {
                        secondCB = cb;
                    });
                
                curProjectRoot = firstProject;
                
                // Ensure it's dirty to begin with
                FileIndexManager.markDirty();
                
                // Request file infos for the first project. This should start a scan.
                FileIndexManager.getFileInfoList("all").done(function (infos) {
                    firstFileInfoResult = infos;
                });
                
                // "Switch" to a new project
                curProjectRoot = secondProject;
                
                // Mark it dirty again and start a second file info request before the first one has "read" its folder
                FileIndexManager.markDirty();
                FileIndexManager.getFileInfoList("all").done(function (infos) {
                    secondFileInfoResult = infos;
                });
                
                // "Complete" the first scan's read request
                firstCB([{ isFile: true, name: "test1FirstProjectFile.js", fullPath: "test1FirstProjectFile.js" }]);
                
                // Since the first scan was aborted, we shouldn't have gotten any result for it.
                expect(firstFileInfoResult).toBeUndefined();
                
                // "Complete" the second scan's read request
                secondCB([{ isFile: true, name: "test1SecondProjectFile.js", fullPath: "test1SecondProjectFile.js" }]);
                
                // Now both callers should have received the info from the second project.
                expect(firstFileInfoResult.length).toBe(1);
                expect(firstFileInfoResult[0].name).toEqual("test1SecondProjectFile.js");
                expect(secondFileInfoResult.length).toBe(1);
                expect(secondFileInfoResult[0].name).toEqual("test1SecondProjectFile.js");
                
                // Each readEntries should only have been called once.
                expect(firstProject.readEntriesSpy.callCount).toBe(1);
                expect(secondProject.readEntriesSpy.callCount).toBe(1);
            });
            
            it("should abort a running scan and start a new one when marked dirty (even before another scan is requested)", function () {
                var firstCB, secondCB, firstFileInfoResult,
                    firstProject = makeFakeProjectDirectory("fakeProject1", function (cb) {
                        firstCB = cb;
                    }),
                    secondProject = makeFakeProjectDirectory("fakeProject2", function (cb) {
                        secondCB = cb;
                    });
                
                curProjectRoot = firstProject;
                
                // Ensure it's dirty to begin with
                FileIndexManager.markDirty();
                
                // Request file infos for the first project. This should start a scan.
                FileIndexManager.getFileInfoList("all").done(function (infos) {
                    firstFileInfoResult = infos;
                });
                
                // "Switch" to a new project
                curProjectRoot = secondProject;
                
                // Mark it dirty again without making a new request. This should still cause the scan to restart.
                FileIndexManager.markDirty();
                
                // "Complete" the first scan's read request
                firstCB([{ isFile: true, name: "test2FirstProjectFile.js", fullPath: "test2FirstProjectFile.js" }]);
                
                // Since the first scan was aborted, we shouldn't have gotten any result for it.
                expect(firstFileInfoResult).toBeUndefined();
                
                // "Complete" the second scan's read request
                secondCB([{ isFile: true, name: "test2SecondProjectFile.js", fullPath: "test2SecondProjectFile.js" }]);
                
                // Now the initial caller should have received the info from the second project.
                expect(firstFileInfoResult.length).toBe(1);
                expect(firstFileInfoResult[0].name).toEqual("test2SecondProjectFile.js");
                
                // Each readEntries should only have been called once.
                expect(firstProject.readEntriesSpy.callCount).toBe(1);
                expect(secondProject.readEntriesSpy.callCount).toBe(1);
            });
            
            it("should not start a new scan if another scan is requested while not dirty", function () {
                var firstCB, secondCB, firstFileInfoResult, secondFileInfoResult;
                curProjectRoot = makeFakeProjectDirectory("fakeProject1", function (cb) {
                    firstCB = cb;
                });
                
                // Ensure it's dirty to begin with
                FileIndexManager.markDirty();
                
                // Start the first file info request
                FileIndexManager.getFileInfoList("all").done(function (infos) {
                    firstFileInfoResult = infos;
                });
                
                // The first scan should have requested the project root
                expect(ProjectManager.getProjectRoot).toHaveBeenCalled();
                expect(ProjectManager.getProjectRoot.callCount).toBe(1);
                
                // Start a second file info request without marking dirty or changing the project root
                FileIndexManager.getFileInfoList("all").done(function (infos) {
                    secondFileInfoResult = infos;
                });
                
                // We shouldn't have started a second scan, so the project root should not have been requested again.
                expect(ProjectManager.getProjectRoot.callCount).toBe(1);
                expect(curProjectRoot.readEntriesSpy.callCount).toBe(1);
                
                // "Complete" the scan's read request
                firstCB([{ isFile: true, name: "test3ProjectFile.js", fullPath: "test3ProjectFile.js" }]);
                
                // Both callers should have received the info from the first project.
                expect(firstFileInfoResult.length).toBe(1);
                expect(firstFileInfoResult[0].name).toEqual("test3ProjectFile.js");
                expect(secondFileInfoResult.length).toBe(1);
                expect(secondFileInfoResult[0].name).toEqual("test3ProjectFile.js");
            });
        });
        
        describe("integration tests", function () {
        
            this.category = "integration";
    
            var testPath = SpecRunnerUtils.getTestPath("/spec/FileIndexManager-test-files"),
                FileIndexManager,
                ProjectManager;
            
            function createTestWindow(spec) {
                SpecRunnerUtils.createTestWindowAndRun(spec, function (testWindow) {
                    // Load module instances from brackets.test
                    FileIndexManager  = testWindow.brackets.test.FileIndexManager;
                    ProjectManager = testWindow.brackets.test.ProjectManager;
                });
            }
            
            function closeTestWindow() {
                FileIndexManager  = null;
                ProjectManager    = null;
                SpecRunnerUtils.closeTestWindow();
            }
            
            describe("multiple requests", function () {
                beforeEach(function () {
                    createTestWindow(this);

                    // Load spec/FileIndexManager-test-files
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
                
                afterEach(closeTestWindow);
                
                it("should handle identical simultaneous requests without doing extra work", function () {  // #330
                    var projectRoot,
                        allFiles1,
                        allFiles2;
        
                    runs(function () {
                        projectRoot = ProjectManager.getProjectRoot();
                        spyOn(projectRoot, "createReader").andCallThrough();
                        
                        // Kick off two index requests in parallel
                        var promise1 = FileIndexManager.getFileInfoList("all")
                            .done(function (result) {
                                allFiles1 = result;
                            });
                        var promise2 = FileIndexManager.getFileInfoList("all") // same request again
                            .done(function (result) {
                                allFiles2 = result;
                            });
                        
                        waitsForDone(promise1, "First FileIndexManager.getFileInfoList()");
                        waitsForDone(promise2, "Second FileIndexManager.getFileInfoList()");
                    });
                    
                    runs(function () {
                        // Correct response to both promises
                        expect(allFiles1.length).toEqual(8);
                        expect(allFiles2.length).toEqual(8);
                        
                        // Didn't scan project tree twice
                        expect(projectRoot.createReader.callCount).toBe(1);
                    });
                });
                
                it("should handle differing simultaneous requests without doing extra work", function () {  // #330
                    var projectRoot,
                        allFiles1,
                        allFiles2;
        
                    runs(function () {
                        projectRoot = ProjectManager.getProjectRoot();
                        spyOn(projectRoot, "createReader").andCallThrough();
                        
                        // Kick off two index requests in parallel
                        var promise1 = FileIndexManager.getFileInfoList("all")
                            .done(function (result) {
                                allFiles1 = result;
                            });
                        var promise2 = FileIndexManager.getFileInfoList("css") // different request in parallel
                            .done(function (result) {
                                allFiles2 = result;
                            });
                        
                        waitsForDone(promise1, "First FileIndexManager.getFileInfoList()");
                        waitsForDone(promise2, "Second FileIndexManager.getFileInfoList()");
                    });
                    
                    runs(function () {
                        // Correct response to both promises
                        expect(allFiles1.length).toEqual(8);
                        expect(allFiles2.length).toEqual(3);
                        
                        // Didn't scan project tree twice
                        expect(projectRoot.createReader.callCount).toBe(1);
                    });
                });
            });
            
            describe("ProjectManager integration", function () {
    
                beforeFirst(function () {
                    createTestWindow(this);
                });
            
                afterLast(closeTestWindow);
                
                beforeEach(function () {
                    // Load spec/FileIndexManager-test-files
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
                
                it("should index files in directory", function () {
                    var allFiles, cssFiles;
                    runs(function () {
                        FileIndexManager.getFileInfoList("all")
                            .done(function (result) {
                                allFiles = result;
                            });
                    });
                    waitsFor(function () { return allFiles; }, "FileIndexManager.getFileInfoList() timeout", 1000);
                    
                    runs(function () {
                        FileIndexManager.getFileInfoList("css")
                            .done(function (result) {
                                cssFiles = result;
                            });
                    });
                    waitsFor(function () { return cssFiles; }, "FileIndexManager.getFileInfoList() timeout", 1000);
        
                    runs(function () {
                        expect(allFiles.length).toEqual(8);
                        expect(cssFiles.length).toEqual(3);
                    });
                    
                });
                
                it("should match a specific filename and return the correct FileInfo", function () {
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
        
                    var dir2Files;
                    runs(function () {
                        FileIndexManager.getFileInfoList("all")
                            .done(function (result) {
                                dir2Files = result;
                            });
                    });
        
                    waitsFor(function () { return dir2Files; }, "FileIndexManager.getFileInfoList() timeout", 1000);
                    
                    runs(function () {
                        expect(dir2Files.length).toEqual(2);
                        expect(dir2Files[0].name).toEqual("file_eight.css");
                        expect(dir2Files[1].name).toEqual("file_seven.js");
                    });
                });
                
                it("should update the indicies after being marked dirty", function () {
                    var allFiles; // set by checkAllFileCount
                    
                    // helper function to validate base state of 8 files
                    function checkAllFileCount(fileCount) {
                        var files;
                        runs(function () {
                            FileIndexManager.getFileInfoList("all")
                                .done(function (result) {
                                    files = result;
                                });
                        });
            
                        waitsFor(function () { return files; }, "FileIndexManager.getFileInfoList() timeout", 1000);
                        
                        runs(function () {
                            allFiles = files;
                            expect(files.length).toEqual(fileCount);
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
    });
});
