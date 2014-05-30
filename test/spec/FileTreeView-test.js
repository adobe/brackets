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

/*global $, define, brackets, describe, it, xit, expect, setTimeout, waitsForDone, runs */
/*unittests: FileTreeView*/

define(function (require, exports, module) {
    "use strict";
    
    var FileTreeView = require("project/FileTreeView");

    describe("FileTreeView", function () {
        describe("ViewModel", function () {
            var subdir = {
                fullPath: "/path/to/project/subdir/",
                name: "subdir",
                isFile: false
            },
                contents = [
                    {
                        fullPath: "/path/to/project/README.md",
                        name: "README.md",
                        isFile: true
                    },
                    {
                        fullPath: "/path/to/project/afile.js",
                        name: "afile.js",
                        isFile: true
                    },
                    subdir
                ];
            
            describe("_formatDirectoryContents", function () {
                it("should convert file and directory objects for display", function () {
                    var result = FileTreeView._formatDirectoryContents(contents);
                    expect(result).toEqual([
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "afile",
                            extension: ".js"
                        },
                        {
                            name: "subdir",
                            children: null,
                            directory: subdir
                        }
                    ]);
                });
            });
            
            describe("_sortFormattedDirectory", function () {
                it("should sort alphabetically", function () {
                    var formatted = [
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "afile",
                            extension: ".js"
                        },
                        {
                            name: "subdir",
                            children: null,
                            directory: subdir
                        }
                    ];
                    expect(FileTreeView._sortFormattedDirectory(formatted)).toEqual([
                        {
                            name: "afile",
                            extension: ".js"
                        },
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "subdir",
                            children: null,
                            directory: subdir
                        }
                    ]);
                });
                
                it("should include the extension in the sort", function () {
                    var formatted = [
                        {
                            name: "README",
                            extension: ".txt"
                        },
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "README",
                            extension: ""
                        }
                    ];
                    expect(FileTreeView._sortFormattedDirectory(formatted)).toEqual([
                        {
                            name: "README",
                            extension: ""
                        },
                        {
                            name: "README",
                            extension: ".md"
                        },
                        {
                            name: "README",
                            extension: ".txt"
                        }
                    ]);
                });
            });
            
            describe("updateContents", function () {
                xit("should create a formatted, sorted list of objects", function () {
                    var subdir = {
                        fullPath: "/path/to/project/subdir/",
                        name: "subdir",
                        isFile: false
                    },
                        vm = new FileTreeView.ViewModel({
                            fullPath: "/path/to/project/",
                            getContents: function () {
                                var deferred = new $.Deferred();
                                setTimeout(function () {
                                    deferred.resolve([
                                        {
                                            fullPath: "/path/to/project/README.md",
                                            name: "README.md",
                                            isFile: true
                                        },
                                        {
                                            fullPath: "/path/to/project/afile.js",
                                            name: "afile.js",
                                            isFile: true
                                        },
                                        subdir
                                    ]);
                                }, 10);
                                return deferred.promise();
                            }
                        });
                    
                    var deferred = new $.Deferred();
                    vm.on("change", function () {
                        deferred.resolve();
                    });
                    
                    waitsForDone(deferred.promise());
                    
                    runs(function () {
                        expect(vm.treeData).toEqual([
                            {
                                name: "afile",
                                extension: "js"
                            },
                            {
                                name: "README",
                                extension: "md"
                            },
                            {
                                name: "subdir",
                                children: null,
                                directory: subdir
                            }
                        ]);
                    });
                });
            });
        });
    });
});