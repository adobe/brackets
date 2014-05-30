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
 *
 */

/* unittests: ProjectModel */
/*global define, brackets, describe, it, xit, expect, beforeEach */

define(function (require, exports, module) {
    "use strict";
    
    var ProjectModel = require("project/ProjectModel");
    
    describe("ProjectModel", function () {
        describe("shouldShow", function () {
            it("returns true for names that should be shown", function () {
                expect(ProjectModel.shouldShow({
                    name: "test.js"
                })).toBe(true);
            });
            
            it("returns false for names that should not be shown", function () {
                expect(ProjectModel.shouldShow({
                    name: ".git"
                })).toBe(false);
            });
        });
        
        describe("_ensureTrailingSlash", function () {
            it("adds a slash when there is none", function () {
                expect(ProjectModel._ensureTrailingSlash("/foo/bar")).toBe("/foo/bar/");
            });
            
            it("does nothing when there is already a slash", function () {
                expect(ProjectModel._ensureTrailingSlash("/foo/bar/")).toBe("/foo/bar/");
            });
        });
        
        it("should start with null projectRoot", function () {
            var pm = new ProjectModel.ProjectModel();
            expect(pm.projectRoot).toBe(null);
        });
        
        describe("with projectRoot", function () {
            var root, pm;
            
            beforeEach(function () {
                root = {
                    fullPath: "/foo/bar/project/"
                };
                
                pm = new ProjectModel.ProjectModel({
                    projectRoot: root
                });
            });

            it("allows setting projectRoot on construction", function () {
                expect(pm.projectRoot).toBe(root);
            });

            it("can tell you if a file is in a project", function () {
                var file = {
                        fullPath: "/foo/bar/project/README.md"
                    };
                expect(pm.isWithinProject(file)).toBe(true);
            });

            it("can tell you if a file is not in a project", function () {
                var file = {
                        fullPath: "/some/other/project/README.md"
                    };
                expect(pm.isWithinProject(file)).toBe(false);
            });
            
            it("can make a file project relative", function () {
                expect(pm.makeProjectRelativeIfPossible("/foo/bar/project/README.md")).toBe("README.md");
            });
            
            it("won't create a relative path to a file outside the project", function () {
                expect(pm.makeProjectRelativeIfPossible("/some/other/project/README.md")).toBe("/some/other/project/README.md");
            });
        });
        
        describe("All Files Cache", function () {
            var visited = false;
            
            function getPM(filelist, error, rootPath) {
                rootPath = rootPath || "/";
                var root = {
                    fullPath: rootPath,
                    visit: function (visitor, errorHandler) {
                        visited = true;
                        if (!filelist && error) {
                            errorHandler(error);
                        } else {
                            filelist.map(visitor);
                        }
                    }
                };
                return new ProjectModel.ProjectModel({
                    projectRoot: root
                });
            }
            
            beforeEach(function () {
                visited = false;
            });
            
            it("can create a list of all files", function () {
                var pm = getPM([{
                    fullPath: "/README.md",
                    name: "README.md",
                    isFile: true
                }, {
                    fullPath: "/other/",
                    name: "other",
                    isFile: false
                }, {
                    fullPath: "/other/test.js",
                    name: "test.js",
                    isFile: true
                }]);
                pm.getAllFiles().then(function (allFiles) {
                    expect(allFiles.length).toBe(2);
                    expect(allFiles).toContain("/README.md");
                });
            });
            
            it("filters files that don't pass shouldShow", function () {
                var pm = getPM([
                    {
                        fullPath: "/setup.pyc",
                        name: "setup.pyc",
                        isFile: true
                    }
                ]);
                pm.getAllFiles().then(function (allFiles) {
                    expect(allFiles.length).toBe(0);
                });
            });
            
            // Turned off because these promises are resolved synchronously right now
            // which causes this test to fail. The real running system would hit the error condition
            // asynchronously.
            xit("rejects the promise when there's an error", function () {
                var pm = getPM(null, "Got An Error");
                pm.getAllFiles().then(function (allFiles) {
                    expect("should not have gotten here").toBe("because there should be an error");
                }, function (error) {
                    expect(error).toBe("Got An Error");
                });
            });
            
            it("filters the file list with a function, if desired", function () {
                var pm = getPM([
                    {
                        fullPath: "/README.md",
                        name: "README.md",
                        isFile: true
                    }, {
                        fullPath: "/test.js",
                        name: "test.js",
                        isFile: true
                    }
                ]);
                
                pm.getAllFiles(function (entry) {
                    return entry.name === "test.js";
                }).then(function (allFiles) {
                    expect(allFiles.length).toBe(1);
                    expect(allFiles).toContain("/test.js");
                });
            });
            
            it("can add additional non-project files to the list", function () {
                var pm = getPM([
                    {
                        fullPath: "/project/README.md",
                        name: "README.md",
                        isFile: true
                    }
                ], null, "/project");
                pm.getAllFiles([{
                    fullPath: "/project/otherProjectFile.js"
                }, {
                    fullPath: "/RootFile.txt"
                }]).then(function (allFiles) {
                    expect(allFiles.length).toBe(2);
                    expect(allFiles).toContain("/project/README.md");
                    expect(allFiles).toContain("/RootFile.txt");
                });
            });
            
            it("caches the all files list", function () {
                var pm = getPM([
                    {
                        fullPath: "/project/README.md",
                        name: "README.md",
                        isFile: true
                    }
                ]);
                pm.getAllFiles().then(function (allFiles) {
                    expect(visited).toBe(true);
                    visited = false;
                    pm.getAllFiles().then(function (allFiles) {
                        expect(visited).toBe(false);
                    });
                });
            });
            
            it("can reset the cache", function () {
                var pm = getPM([
                    {
                        fullPath: "/project/README.md",
                        name: "README.md",
                        isFile: true
                    }
                ]);
                pm.getAllFiles().then(function (allFiles) {
                    expect(visited).toBe(true);
                    visited = false;
                    pm._resetCache();
                    pm.getAllFiles().then(function (allFiles) {
                        expect(visited).toBe(true);
                    });
                });
            });
        });
        
        describe("_getWelcomeProjectPath", function () {
            it("returns the initial directory if there's no sample URL", function () {
                expect(ProjectModel._getWelcomeProjectPath(undefined, "/Brackets/")).toBe("/Brackets/");
            });
            
            it("returns the correct sample directory", function () {
                expect(ProjectModel._getWelcomeProjectPath("root/GettingStarted/", "/Brackets/")).toBe(
                    "/Brackets/samples/root/GettingStarted/"
                );
            });
            
            it("ensures there's a trailing slash for backwards compatibility", function () {
                expect(ProjectModel._getWelcomeProjectPath("root/GettingStarted", "/Brackets/")).toBe(
                    "/Brackets/samples/root/GettingStarted/"
                );
            });
        });
        
        describe("_addWelcomeProjectPath", function () {
            it("adds the path to a new array", function () {
                var currentProjects = ["GettingStarted"];
                var newProjects = ProjectModel._addWelcomeProjectPath("NewStart/", currentProjects);
                expect(currentProjects.length).toBe(1);
                expect(newProjects).toEqual(["GettingStarted", "NewStart"]);
            });
        });
        
        describe("_isWelcomeProjectPath", function () {
            it("matches on the current welcome project", function () {
                expect(ProjectModel._isWelcomeProjectPath("/Brackets/GettingStarted/", "/Brackets/GettingStarted/")).toBe(true);
            });
            
            it("matches on previous welcome projects", function () {
                expect(ProjectModel._isWelcomeProjectPath("/Brackets/GettingStarted/", "/Brackets/NewStart/",
                                                          ["/Brackets/GettingStarted"])).toBe(true);
            });
            
            it("returns false when there's no match", function () {
                expect(ProjectModel._isWelcomeProjectPath("/Brackets/Unknown/", "/Brackets/NewStart/",
                                                          ["/Brackets/GettingStarted"])).toBe(false);
            });
            
            it("returns false when the project doesn't match and there are no known projects", function () {
                expect(ProjectModel._isWelcomeProjectPath("/Brackets/Unknown/", "/Brackets/NewStart/")).toBe(false);
            });
        });
        
        describe("isValidFilename", function () {
            it("returns true for filenames with nothing invalid", function () {
                expect(ProjectModel.isValidFilename("foo.txt", "*")).toBe(true);
            });
            
            it("returns false for filenames that match the invalid characters", function () {
                expect(ProjectModel.isValidFilename("foo*txt", "|*")).toBe(false);
            });
            
            it("returns false for filenames that match the internal list of disallowed names", function () {
                expect(ProjectModel.isValidFilename("/test/prn")).toBe(false);
            });
        });
    });
});