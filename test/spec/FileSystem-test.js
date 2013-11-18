/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, window */

define(function (require, exports, module) {
    "use strict";
    
    var Directory           = require("filesystem/Directory"),
        File                = require("filesystem/File"),
        FileSystem          = require("filesystem/FileSystem"),
        FileSystemError     = require("filesystem/FileSystemError"),
        MockFileSystemImpl  = require("./MockFileSystemImpl");
    
    describe("FileSystem", function () {
                        
        // Callback factories
        function resolveCallback() {
            var callback = function (err, entry) {
                callback.error = err;
                callback.entry = entry;
                callback.wasCalled = true;
            };
            return callback;
        }
        
        function errorCallback() {
            var callback = function (err) {
                callback.error = err;
                callback.wasCalled = true;
            };
            return callback;
        }
        
        function readCallback() {
            var callback = function (err, data, stat) {
                callback.error = err;
                callback.data = data;
                callback.stat = stat;
                callback.wasCalled = true;
            };
            return callback;
        }

        function writeCallback() {
            var callback = function (err, stat) {
                callback.error = err;
                callback.stat = stat;
                callback.wasCalled = true;
            };
            return callback;
        }
        
        function getContentsCallback() {
            var callback = function (err, contents) {
                callback.error = err;
                callback.contents = contents;
                callback.wasCalled = true;
            };
            return callback;
        }
        
        // Utilities
        
        /** Pass this to when() as the 'callback' or 'notify' value to delay invoking the callback or change handler by a fixed amount of time */
        function delay(ms) {
            function generateCbWrapper(cb) {
                function cbReadyToRun() {
                    var _args = arguments;
                    window.setTimeout(function () {
                        cb.apply(null, _args);
                    }, ms);
                }
                return cbReadyToRun;
            }
            return generateCbWrapper;
        }
        
        // Setup
        
        var fileSystem;
        
        function permissiveFilter() {
            return true;
        }

        beforeEach(function () {
            // Create an FS instance for testing
            MockFileSystemImpl.reset();
            fileSystem = new FileSystem._FileSystem();
            fileSystem.init(MockFileSystemImpl);
            
            var cb = errorCallback();
            fileSystem.watch(fileSystem.getDirectoryForPath("/"), permissiveFilter, cb);
            waitsFor(function () { return cb.wasCalled; });
            runs(function () {
                expect(cb.error).toBeFalsy();
            });
        });
        
        describe("Path normalization", function () {
            // Auto-prepended to both origPath & normPath in all the test helpers below
            var prefix = "";
            
            function expectNormFile(origPath, normPath) {
                var file = fileSystem.getFileForPath(prefix + origPath);
                expect(file.fullPath).toBe(prefix + normPath);
            }
            function expectNormDir(origPath, normPath) {
                var dir = fileSystem.getDirectoryForPath(prefix + origPath);
                expect(dir.fullPath).toBe(prefix + normPath);
            }
            function expectInvalidFile(origPath) {
                function tryToMakeFile() {
                    return fileSystem.getFileForPath(prefix + origPath);
                }
                expect(tryToMakeFile).toThrow();
            }
            
            // Runs all the tests N times, once with each prefix
            function testPrefixes(prefixes, tests) {
                prefixes.forEach(function (pre) {
                    prefix = pre;
                    tests();
                });
                prefix = "";
            }
            
            it("should ensure trailing slash on directory paths", function () {
                testPrefixes(["", "c:"], function () {
                    expectNormDir("/foo", "/foo/");
                    expectNormDir("/foo/bar", "/foo/bar/");
                    
                    // Paths *with* trailing slash should be unaffected
                    expectNormDir("/", "/");
                    expectNormDir("/foo/", "/foo/");
                    expectNormDir("/foo/bar/", "/foo/bar/");
                });
            });
            
            it("should eliminate duplicated (contiguous) slashes", function () {
                testPrefixes(["", "c:"], function () {
                    expectNormDir("//", "/");
                    expectNormDir("///", "/");
                    expectNormDir("//foo", "/foo/");
                    expectNormDir("/foo//", "/foo/");
                    expectNormDir("//foo//", "/foo/");
                    expectNormDir("///foo///", "/foo/");
                    expectNormDir("/foo//bar", "/foo/bar/");
                    expectNormDir("/foo///bar", "/foo/bar/");
                    
                    expectNormFile("//foo", "/foo");
                    expectNormFile("///foo", "/foo");
                    expectNormFile("/foo//bar", "/foo/bar");
                    expectNormFile("/foo///bar", "/foo/bar");
                    expectNormFile("//foo///bar", "/foo/bar");
                    expectNormFile("///foo///bar", "/foo/bar");
                    expectNormFile("///foo//bar", "/foo/bar");
                    expectNormFile("///foo/bar", "/foo/bar");
                });
            });
            
            it("should normalize out '..' segments", function () {
                testPrefixes(["", "c:"], function () {
                    expectNormDir("/foo/..", "/");
                    expectNormDir("/foo/bar/..", "/foo/");
                    expectNormDir("/foo/../bar", "/bar/");
                    expectNormDir("/foo//../bar", "/bar/");  // even with duplicated "/"es
                    expectNormDir("/foo/..//bar", "/bar/");  // even with duplicated "/"es
                    expectNormDir("/foo/one/two/three/../../../bar", "/foo/bar/");
                    expectNormDir("/foo/one/two/../two/three", "/foo/one/two/three/");
                    expectNormDir("/foo/one/two/../three/../bar", "/foo/one/bar/");
                    
                    expectNormFile("/foo/../bar", "/bar");
                    expectNormFile("/foo//../bar", "/bar");  // even with duplicated "/"es
                    expectNormFile("/foo/..//bar", "/bar");  // even with duplicated "/"es
                    expectNormFile("/foo/one/two/three/../../../bar", "/foo/bar");
                    expectNormFile("/foo/one/two/../two/three", "/foo/one/two/three");
                    expectNormFile("/foo/one/two/../three/../bar", "/foo/one/bar");
                    
                    // Can't go back past root
                    expectInvalidFile("/..");
                    expectInvalidFile("/../");
                    expectInvalidFile("/foo/../../bar");
                    expectInvalidFile("/foo/../bar/../..");
                });
            });
        });
        
        describe("parent and name properties", function () {
            it("should have a name property", function () {
                var file = fileSystem.getFileForPath("/subdir/file3.txt"),
                    directory = fileSystem.getDirectoryForPath("/subdir/foo/");
                
                expect(file.name).toBe("file3.txt");
                expect(directory.name).toBe("foo");
            });
            it("should have a parentPath property if it is not a root directory", function () {
                var file = fileSystem.getFileForPath("/subdir/file3.txt"),
                    directory = fileSystem.getDirectoryForPath("/subdir/foo/");
                
                expect(file.parentPath).toBe("/subdir/");
                expect(directory.parentPath).toBe("/subdir/");
            });
            it("should not have a parentPath property if it is a root directory", function () {
                var unixRootDir = fileSystem.getDirectoryForPath("/"),
                    winRootDir = fileSystem.getDirectoryForPath("B:");
                
                expect(unixRootDir.parentPath).toBeNull();
                expect(winRootDir.parentPath).toBeNull();
            });
        });
        
        describe("Singleton enforcement", function () {
            it("should return the same File object for the same path", function () {
                var cb = resolveCallback();
                expect(fileSystem.getFileForPath("/file1.txt")).toEqual(fileSystem.getFileForPath("/file1.txt"));
                expect(fileSystem.getFileForPath("/file1.txt")).not.toEqual(fileSystem.getFileForPath("/file2.txt"));
                runs(function () {
                    fileSystem.resolve("/file1.txt", cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    expect(fileSystem.getFileForPath("/file1.txt")).toEqual(cb.entry);
                });
            });
            
            it("should return the same Directory object for the same path", function () {
                var cb = resolveCallback();
                expect(fileSystem.getDirectoryForPath("/subdir/")).toEqual(fileSystem.getFileForPath("/subdir/"));
                expect(fileSystem.getDirectoryForPath("/subdir/")).not.toEqual(fileSystem.getFileForPath("/subdir2/"));
                runs(function () {
                    fileSystem.resolve("/subdir/", cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    expect(fileSystem.getDirectoryForPath("/subdir/")).toEqual(cb.entry);
                });
            });
        });
        
        describe("Resolve", function () {
            function testResolve(path, expectedError, expectedType) {
                var cb = resolveCallback();
                runs(function () {
                    fileSystem.resolve(path, cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    if (!expectedError) {
                        expect(cb.error).toBeFalsy();
                    } else {
                        expect(cb.error).toBe(expectedError);
                    }
                    if (expectedType) {
                        expect(cb.entry instanceof expectedType).toBeTruthy();
                    }
                });
            }
            
            it("should resolve a File", function () {
                testResolve("/subdir/file3.txt", null, File);
            });
            it("should resolve a Directory", function () {
                testResolve("/subdir/", null, Directory);
            });
            it("should return an error if the File/Directory is not found", function () {
                testResolve("/doesnt-exist.txt", FileSystemError.NOT_FOUND);
                testResolve("/doesnt-exist/", FileSystemError.NOT_FOUND);
            });
        });
        
        describe("Rename", function () {
            it("should rename a File", function () {
                var file = fileSystem.getFileForPath("/file1.txt"),
                    cb = errorCallback();
                
                runs(function () {
                    file.rename("/file1-renamed.txt", cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    expect(file.fullPath).toBe("/file1-renamed.txt");
                    expect(fileSystem.getFileForPath("/file1-renamed.txt")).toBe(file);
                    expect(fileSystem.getFileForPath("/file1.txt")).not.toBe(file);
                });
            });
            
            it("should fail if the file doesn't exist", function () {
                var file = fileSystem.getFileForPath("/doesnt-exist.txt"),
                    cb = errorCallback();
                
                runs(function () {
                    file.rename("foo.txt", cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBe(FileSystemError.NOT_FOUND);
                });
            });
            
            it("should fail if the new name already exists", function () {
                var file = fileSystem.getFileForPath("/file1.txt"),
                    cb = errorCallback();
                
                runs(function () {
                    file.rename("/file2.txt", cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBe(FileSystemError.ALREADY_EXISTS);
                });
            });
            
            it("should rename a Directory", function () {
                var directory = fileSystem.getDirectoryForPath("/subdir/"),
                    file = fileSystem.getFileForPath("/subdir/file3.txt"),
                    cb = errorCallback();
                
                runs(function () {
                    directory.rename("/subdir-renamed/", cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    expect(directory.fullPath).toBe("/subdir-renamed/");
                    expect(file.fullPath).toBe("/subdir-renamed/file3.txt");
                });
            });
        });
        
        
        describe("Read directory", function () {
            it("should read a Directory", function () {
                var directory = fileSystem.getDirectoryForPath("/subdir/"),
                    cb = getContentsCallback();
                
                runs(function () {
                    directory.getContents(cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    expect(cb.contents.length).toBe(2);
                    expect(cb.contents[0].fullPath).toBe("/subdir/file3.txt");
                });
            });
            
            it("should return an error if the Directory can't be found", function () {
                var directory = fileSystem.getDirectoryForPath("/doesnt-exist/"),
                    cb = getContentsCallback();
                
                runs(function () {
                    directory.getContents(cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBe(FileSystemError.NOT_FOUND);
                });
            });
            
            it("should only call the impl once for simultaneous read requests", function () {
                var directory = fileSystem.getDirectoryForPath("/subdir/"),
                    cb = getContentsCallback(),
                    cb2 = getContentsCallback(),
                    cbCount = 0;
                
                function delayedCallback(cb) {
                    return function () {
                        var args = arguments;
                        window.setTimeout(function () {
                            cbCount++;
                            cb.apply(null, args);
                        }, 300);
                    };
                }
                
                MockFileSystemImpl.when("readdir", "/subdir/", {callback: delayedCallback});
                
                // Fire off 2 getContents() calls in rapid succession
                runs(function () {
                    // Make sure cached data is cleared
                    directory._contents = undefined;
                    directory.getContents(cb);
                    directory.getContents(cb2);
                    expect(cb.wasCalled).toBeFalsy(); // Callback should *not* have been called yet
                });
                waitsFor(function () { return cb.wasCalled && cb2.wasCalled; });
                runs(function () {
                    expect(cb.wasCalled).toBe(true);
                    expect(cb.error).toBeFalsy();
                    expect(cb2.wasCalled).toBe(true);
                    expect(cb2.error).toBeFalsy();
                    expect(cb.contents).toEqual(cb2.contents);
                    expect(cbCount).toBe(1);
                });
            });
        });
        
        describe("Create directory", function () {
            it("should create a Directory", function () {
                var directory = fileSystem.getDirectoryForPath("/subdir2/"),
                    cb = errorCallback(),
                    cbCalled = false;
                
                runs(function () {
                    directory.exists(function (err, exists) {
                        expect(err).toBeFalsy();
                        expect(exists).toBe(false);
                        cbCalled = true;
                    });
                });
                waitsFor(function () { return cbCalled; });
                runs(function () {
                    directory.create(cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    directory.exists(function (err, exists) {
                        expect(err).toBeFalsy();
                        expect(exists).toBe(true);
                    });
                });
            });
        });
        
        describe("Read and write files", function () {
            it("should read and write files", function () {
                var file = fileSystem.getFileForPath("/subdir/file4.txt"),
                    newContents = "New file contents",
                    firstReadCB = readCallback(),
                    writeCB = errorCallback(),
                    secondReadCB = readCallback();
                
                // Verify initial contents
                runs(function () {
                    file.read(firstReadCB);
                });
                waitsFor(function () { return firstReadCB.wasCalled; });
                runs(function () {
                    expect(firstReadCB.error).toBeFalsy();
                    expect(firstReadCB.data).toBe("File 4 Contents");
                    expect(firstReadCB.stat).toBeTruthy();
                });
                
                // Write new contents
                runs(function () {
                    file.write(newContents, writeCB);
                });
                waitsFor(function () { return writeCB.wasCalled; });
                runs(function () {
                    expect(writeCB.error).toBeFalsy();
                });
                
                // Verify new contents
                runs(function () {
                    file.read(secondReadCB);
                });
                waitsFor(function () { return secondReadCB.wasCalled; });
                runs(function () {
                    expect(secondReadCB.error).toBeFalsy();
                    expect(secondReadCB.data).toBe(newContents);
                    expect(secondReadCB.stat).toBeTruthy();
                });
            });
            
            it("should return an error if the file can't be found", function () {
                var file = fileSystem.getFileForPath("/doesnt-exist.txt"),
                    cb = readCallback();
                
                runs(function () {
                    file.read(cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBe(FileSystemError.NOT_FOUND);
                    expect(cb.data).toBeFalsy();
                    expect(cb.stat).toBeFalsy();
                });
            });
            
            it("should create a new file if needed", function () {
                var file = fileSystem.getFileForPath("/new-file.txt"),
                    cb = errorCallback(),
                    readCb = readCallback(),
                    cbCalled = false,
                    newContents = "New file contents";
                
                runs(function () {
                    file.exists(function (err, exists) {
                        expect(err).toBeFalsy();
                        expect(exists).toBe(false);
                        cbCalled = true;
                    });
                });
                waitsFor(function () { return cbCalled; });
                runs(function () {
                    file.write(newContents, cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    file.read(readCb);
                });
                waitsFor(function () { return readCb.wasCalled; });
                runs(function () {
                    expect(readCb.error).toBeFalsy();
                    expect(readCb.data).toBe(newContents);
                    expect(readCb.stat).toBeTruthy();
                });
            });
        });
        
        describe("FileSystemEntry.visit", function () {
            beforeEach(function () {
                function initEntry(entry, command, args) {
                    var cb = getContentsCallback();
                    
                    args.push(cb);
                    runs(function () {
                        entry[command].apply(entry, args);
                    });
                    waitsFor(function () { return cb.wasCalled; });
                    runs(function () {
                        expect(cb.error).toBeFalsy();
                    });
                }

                function initDir(path) {
                    initEntry(fileSystem.getDirectoryForPath(path), "create", []);
                }
                
                function initFile(path) {
                    initEntry(fileSystem.getFileForPath(path), "write", ["abc"]);
                }
                
                initDir("/visit/");
                initFile("/visit/file.txt");
                initDir("/visit/subdir1/");
                initDir("/visit/subdir2/");
                initFile("/visit/subdir1/subfile11.txt");
                initFile("/visit/subdir1/subfile12.txt");
                initFile("/visit/subdir2/subfile21.txt");
                initFile("/visit/subdir2/subfile22.txt");
            });
            
            it("should visit all entries by default", function () {
                var directory = fileSystem.getDirectoryForPath("/visit/"),
                    results = {},
                    visitor = function (entry) {
                        results[entry.fullPath] = entry;
                        return true;
                    };
                
                var cb = getContentsCallback();
                runs(function () {
                    directory.visit(visitor, cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    expect(Object.keys(results).length).toBe(8);
                    expect(results["/visit/"]).toBeTruthy();
                    expect(results["/visit/file.txt"]).toBeTruthy();
                    expect(results["/visit/subdir1/"]).toBeTruthy();
                    expect(results["/visit/subdir2/"]).toBeTruthy();
                    expect(results["/visit/subdir1/subfile11.txt"]).toBeTruthy();
                    expect(results["/visit/subdir1/subfile12.txt"]).toBeTruthy();
                    expect(results["/visit/subdir2/subfile21.txt"]).toBeTruthy();
                    expect(results["/visit/subdir2/subfile21.txt"]).toBeTruthy();
                    expect(results["/"]).not.toBeTruthy();
                });
            });
            
            it("should visit with a specified maximum depth", function () {
                var directory = fileSystem.getDirectoryForPath("/visit/"),
                    results = {},
                    visitor = function (entry) {
                        results[entry.fullPath] = entry;
                        return true;
                    };
                
                var cb = getContentsCallback();
                runs(function () {
                    directory.visit(visitor, {maxDepth: 1}, cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    expect(Object.keys(results).length).toBe(4);
                    expect(results["/visit/"]).toBeTruthy();
                    expect(results["/visit/file.txt"]).toBeTruthy();
                    expect(results["/visit/subdir1/"]).toBeTruthy();
                    expect(results["/visit/subdir2/"]).toBeTruthy();
                    expect(results["/visit/subdir1/subfile11.txt"]).not.toBeTruthy();
                    expect(results["/visit/subdir1/subfile12.txt"]).not.toBeTruthy();
                    expect(results["/visit/subdir2/subfile21.txt"]).not.toBeTruthy();
                    expect(results["/visit/subdir2/subfile21.txt"]).not.toBeTruthy();
                    expect(results["/"]).not.toBeTruthy();
                });
            });
            
            it("should visit with a specified maximum number of entries", function () {
                var directory = fileSystem.getDirectoryForPath("/visit/"),
                    results = {},
                    visitor = function (entry) {
                        results[entry.fullPath] = entry;
                        return true;
                    };
                
                var cb = getContentsCallback();
                runs(function () {
                    directory.visit(visitor, {maxEntries: 4}, cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBe(FileSystemError.TOO_MANY_ENTRIES);
                    expect(Object.keys(results).length).toBe(4);
                    expect(results["/visit/"]).toBeTruthy();
                    expect(results["/visit/file.txt"]).toBeTruthy();
                    expect(results["/"]).not.toBeTruthy();
                });
            });
            
            it("should visit only children of directories admitted by the filter", function () {
                var directory = fileSystem.getDirectoryForPath("/visit/"),
                    results = {},
                    visitor = function (entry) {
                        results[entry.fullPath] = entry;
                        return entry.name === "visit" || /1$/.test(entry.name);
                    };
                
                var cb = getContentsCallback();
                runs(function () {
                    directory.visit(visitor, cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    expect(Object.keys(results).length).toBe(6);
                    expect(results["/visit/"]).toBeTruthy();
                    expect(results["/visit/file.txt"]).toBeTruthy();
                    expect(results["/visit/subdir1/"]).toBeTruthy();
                    expect(results["/visit/subdir2/"]).toBeTruthy();
                    expect(results["/visit/subdir1/subfile11.txt"]).toBeTruthy();
                    expect(results["/visit/subdir1/subfile12.txt"]).toBeTruthy();
                    expect(results["/visit/subdir2/subfile21.txt"]).not.toBeTruthy();
                    expect(results["/visit/subdir2/subfile21.txt"]).not.toBeTruthy();
                    expect(results["/"]).not.toBeTruthy();
                });
            });
        });
        
        describe("Event timing", function () {
            
            it("should notify rename callback before 'change' event", function () {
                var origFilePath = "/file1.txt",
                    origFile = fileSystem.getFileForPath(origFilePath),
                    renamedFilePath = "/file1_renamed.txt";
                
                runs(function () {
                    var renameDone = false, changeDone = false;
                    
                    // Delay impl callback to happen after impl watcher notification
                    MockFileSystemImpl.when("rename", origFilePath, {
                        callback: delay(250)
                    });
                    
                    $(fileSystem).on("change", function (evt, entry) {
                        expect(renameDone).toBe(true);  // this is the important check: callback should have already run!
                        changeDone = true;
                    });
                    
                    origFile.rename(renamedFilePath, function (err) {
                        expect(err).toBeFalsy();
                        renameDone = true;
                    });
                    
                    waitsFor(function () { return changeDone && renameDone; });
                });
                
                runs(function () {
                    expect(origFile.fullPath).toBe(renamedFilePath);
                });
            });
            
            
            it("should notify write callback before 'change' event", function () {
                var testFilePath = "/file1.txt",
                    testFile = fileSystem.getFileForPath(testFilePath);
                
                runs(function () {
                    var writeDone = false, changeDone = false;
                    
                    // Delay impl callback to happen after impl watcher notification
                    MockFileSystemImpl.when("writeFile", testFilePath, {
                        callback: delay(250)
                    });
                    
                    $(fileSystem).on("change", function (evt, entry) {
                        expect(writeDone).toBe(true);  // this is the important check: callback should have already run!
                        changeDone = true;
                    });
                    
                    testFile.write("Foobar", { blind: true }, function (err) {
                        expect(err).toBeFalsy();
                        writeDone = true;
                    });
                    
                    waitsFor(function () { return changeDone && writeDone; });
                });
            });
            
            // Used for various tests below where two write operations (to two different files) overlap in various ways
            function dualWrite(cb1Delay, watcher1Delay, cb2Delay, watcher2Delay) {
                var testFile1 = fileSystem.getFileForPath("/file1.txt"),
                    testFile2 = fileSystem.getFileForPath("/file2.txt");
                
                runs(function () {
                    var write1Done = false, change1Done = false;
                    var write2Done = false, change2Done = false;
                    
                    // Delay impl callback to happen after impl watcher notification
                    MockFileSystemImpl.when("writeFile", "/file1.txt", {
                        callback: delay(cb1Delay),
                        notify: delay(watcher1Delay)
                    });
                    MockFileSystemImpl.when("writeFile", "/file2.txt", {
                        callback: delay(cb2Delay),
                        notify: delay(watcher2Delay)
                    });
                    
                    $(fileSystem).on("change", function (evt, entry) {
                        // this is the important check: both callbacks should have already run!
                        expect(write1Done).toBe(true);
                        expect(write2Done).toBe(true);
                        
                        expect(entry.fullPath === "/file1.txt" || entry.fullPath === "/file2.txt").toBe(true);
                        if (entry.fullPath === "/file1.txt") {
                            change1Done = true;
                        } else {
                            change2Done = true;
                        }
                    });
                    
                    // We always *start* both operations together, synchronously
                    // What varies is when the impl callbacks for for each op, and when the impl's watcher notices each op
                    fileSystem.getFileForPath("/file1.txt").write("Foobar 1", { blind: true }, function (err) {
                        expect(err).toBeFalsy();
                        write1Done = true;
                    });
                    fileSystem.getFileForPath("/file2.txt").write("Foobar 2", { blind: true }, function (err) {
                        expect(err).toBeFalsy();
                        write2Done = true;
                    });
                    
                    waitsFor(function () { return change1Done && write1Done && change2Done && write2Done; });
                });
            }
            
            it("should handle overlapping writes to different files - 2nd file finishes much faster", function () {
                dualWrite(100, 200, 0, 0);
            });
            it("should handle overlapping writes to different files - 2nd file finishes much faster, 1st file watcher runs early", function () {
                dualWrite(200, 100, 0, 0);
            });
            it("should handle overlapping writes to different files - 1st file finishes much faster", function () {
                dualWrite(0, 0, 100, 200);
            });
            it("should handle overlapping writes to different files - 1st file finishes much faster, 2nd file watcher runs early", function () {
                dualWrite(0, 0, 200, 100);
            });
            it("should handle overlapping writes to different files - both watchers run early", function () {
                dualWrite(100, 0, 200, 0);
            });
            it("should handle overlapping writes to different files - both watchers run early, reversed", function () {
                dualWrite(100, 50, 200, 0);
            });
            it("should handle overlapping writes to different files - 2nd file finishes faster, both watchers run early", function () {
                dualWrite(200, 0, 100, 0);
            });
            it("should handle overlapping writes to different files - 2nd file finishes faster, both watchers run early, reversed", function () {
                dualWrite(200, 50, 100, 0);
            });
            it("should handle overlapping writes to different files - watchers run in order", function () {
                dualWrite(0, 100, 0, 200);
            });
            it("should handle overlapping writes to different files - watchers reversed", function () {
                dualWrite(0, 200, 0, 100);
            });
            it("should handle overlapping writes to different files - nonoverlapping in order", function () {
                dualWrite(0, 50, 100, 200);
            });
            it("should handle overlapping writes to different files - nonoverlapping reversed", function () {
                dualWrite(100, 200, 0, 50);
            });
            it("should handle overlapping writes to different files - overlapped in order", function () {
                dualWrite(0, 100, 50, 200);
            });
            it("should handle overlapping writes to different files - overlapped reversed", function () {
                dualWrite(50, 200, 0, 100);
            });
        });
        
        describe("File contents caching", function () {
            var filename = "/file1.txt",
                readCalls,
                writeCalls;
            
            beforeEach(function () {
                readCalls = 0;
                writeCalls = 0;
                
                MockFileSystemImpl.when("readFile", filename, {
                    callback: function (cb) {
                        return function () {
                            var args = arguments;
                            readCalls++;
                            cb.apply(undefined, args);
                        };
                    }
                });
                
                MockFileSystemImpl.when("writeFile", filename, {
                    callback: function (cb) {
                        return function () {
                            var args = arguments;
                            writeCalls++;
                            cb.apply(undefined, args);
                        };
                    }
                });
            });
            
            it("should only read from the impl once", function () {
                var file = fileSystem.getFileForPath(filename),
                    cb1 = readCallback(),
                    cb2 = readCallback();
                
                // confirm empty cached data and then read
                runs(function () {
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBeFalsy();
                    expect(file._contents).toBeFalsy();
                    expect(file._hash).toBeFalsy();
                    expect(readCalls).toBe(0);
                    
                    file.read(cb1);
                });
                waitsFor(function () { return cb1.wasCalled; });
                
                // confirm impl read and cached data and then read again
                runs(function () {
                    expect(cb1.error).toBeFalsy();
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBe(cb1.stat);
                    expect(file._contents).toBe(cb1.data);
                    expect(file._hash).toBeTruthy();
                    expect(readCalls).toBe(1);
                    
                    file.read(cb2);
                });
                waitsFor(function () { return cb2.wasCalled; });
                
                // confirm no impl read and cached data
                runs(function () {
                    expect(cb2.error).toBeFalsy();
                    expect(cb2.stat).toBe(cb1.stat);
                    expect(cb2.data).toBe(cb1.data);
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBe(cb2.stat);
                    expect(file._contents).toBe(cb2.data);
                    expect(file._hash).toBeTruthy();
                    expect(readCalls).toBe(1); // The impl should NOT be called a second time
                });
            });
            
            it("should support blind writes", function () {
                var file = fileSystem.getFileForPath(filename),
                    cb1 = writeCallback(),
                    cb2 = writeCallback(),
                    newFileContent = "Computer programming is an exact science";
                
                // confirm empty cached data and then write blindly
                runs(function () {
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBeFalsy();
                    expect(file._contents).toBeFalsy();
                    expect(file._hash).toBeFalsy();
                    expect(writeCalls).toBe(0);
                    
                    file.write(newFileContent, cb1);
                });
                waitsFor(function () { return cb1.wasCalled; });
                
                // confirm error, empty cache and then force write
                runs(function () {
                    expect(cb1.error).toBe(FileSystemError.CONTENTS_MODIFIED);
                    expect(cb1.stat).toBeFalsy();
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBeFalsy();
                    expect(file._contents).toBeFalsy();
                    expect(file._hash).toBeFalsy();
                    expect(writeCalls).toBe(1);
                    
                    file.write(newFileContent, { blind: true }, cb2);
                });
                waitsFor(function () { return cb2.wasCalled; });
                
                // confirm impl write and updated cache
                runs(function () {
                    expect(cb2.error).toBeFalsy();
                    expect(cb2.stat).toBeTruthy();
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBe(cb2.stat);
                    expect(file._contents).toBe(newFileContent);
                    expect(file._hash).toBeTruthy();
                    expect(writeCalls).toBe(2);
                });
            });
            
            it("should persist data on write and update cached data", function () {
                var file = fileSystem.getFileForPath(filename),
                    cb1 = readCallback(),
                    cb2 = writeCallback(),
                    newFileContent = "I propose to consider the question, 'Can machines think?'",
                    savedHash;
                
                // confirm empty cached data and then read
                runs(function () {
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBeFalsy();
                    expect(file._contents).toBeFalsy();
                    expect(file._hash).toBeFalsy();
                    expect(readCalls).toBe(0);
                    expect(writeCalls).toBe(0);
                    
                    file.read(cb1);
                });
                waitsFor(function () { return cb1.wasCalled; });
                
                // confirm impl read and cached data and then write
                runs(function () {
                    expect(cb1.error).toBeFalsy();
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBe(cb1.stat);
                    expect(file._contents).toBe(cb1.data);
                    expect(file._hash).toBeTruthy();
                    expect(readCalls).toBe(1);
                    expect(writeCalls).toBe(0);
                    
                    savedHash = file._hash;
                    file.write(newFileContent, cb2);
                });
                waitsFor(function () { return cb2.wasCalled; });
                
                // confirm impl write and updated cache
                runs(function () {
                    expect(cb2.error).toBeFalsy();
                    expect(cb2.stat).not.toBe(cb1.stat);
                    expect(cb2.stat).toBeTruthy();
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBe(cb2.stat);
                    expect(file._contents).toBe(newFileContent);
                    expect(file._hash).not.toBe(savedHash);
                    expect(file._hash).toBeTruthy();
                    expect(readCalls).toBe(1);
                    expect(writeCalls).toBe(1);
                });
            });
            
            it("should invalidate cached data on change", function () {
                var file = fileSystem.getFileForPath(filename),
                    cb1 = readCallback(),
                    cb2 = readCallback(),
                    fileChanged = false,
                    savedHash;
                
                // confirm empty cached data and then read
                runs(function () {
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBeFalsy();
                    expect(file._contents).toBeFalsy();
                    expect(file._hash).toBeFalsy();
                    expect(readCalls).toBe(0);
                    
                    file.read(cb1);
                });
                waitsFor(function () { return cb1.wasCalled; });
                
                // confirm impl read and cached data and then fire a synthetic change event
                runs(function () {
                    expect(cb1.error).toBeFalsy();
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBe(cb1.stat);
                    expect(file._contents).toBe(cb1.data);
                    expect(file._hash).toBeTruthy();
                    expect(readCalls).toBe(1);
                    
                    savedHash = file._hash;
                    
                    $(fileSystem).on("change", function (event, filename) {
                        fileChanged = true;
                    });
                    
                    // Fire a whole-sale change event
                    fileSystem._handleWatchResult(null);
                });
                waitsFor(function () { return fileChanged; });
                
                // confirm now-empty cached data and then read
                runs(function () {
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBeFalsy();
                    expect(file._contents).toBeFalsy(); // contents and stat should be cleared
                    expect(file._hash).toBe(savedHash); // but hash should not be cleared
                    
                    file.read(cb2);
                });
                waitsFor(function () { return cb2.wasCalled; });
                
                // confirm impl read and new cached data
                runs(function () {
                    expect(cb2.error).toBeFalsy();
                    expect(file._isWatched).toBe(true);
                    expect(file._stat).toBe(cb2.stat);
                    expect(file._contents).toBe(cb2.data);
                    expect(file._hash).toBeTruthy();
                    expect(readCalls).toBe(2); // The impl should have been called a second time
                });
            });
            
            it("should not cache data for unwatched files", function () {
                var file,
                    cb0 = errorCallback(),
                    cb1 = readCallback(),
                    cb2 = readCallback();
                
                // unwatch root directory
                runs(function () {
                    fileSystem.unwatch(fileSystem.getDirectoryForPath("/"), cb0);
                });
                waitsFor(function () { return cb0.wasCalled; });
                
                // confirm empty cached data and then read
                runs(function () {
                    expect(cb0.error).toBeFalsy();
                    
                    file = fileSystem.getFileForPath(filename);
                    
                    expect(file._isWatched).toBe(false);
                    expect(file._stat).toBeFalsy();
                    expect(file._contents).toBeFalsy();
                    expect(file._hash).toBeFalsy();
                    expect(readCalls).toBe(0);
                    
                    file.read(cb1);
                });
                waitsFor(function () { return cb1.wasCalled; });
                
                // confirm impl read, empty cached data and then read again
                runs(function () {
                    expect(cb1.error).toBeFalsy();
                    expect(file._isWatched).toBe(false);
                    expect(file._stat).toBeFalsy();
                    expect(file._contents).toBeFalsy();
                    expect(file._hash).toBeFalsy();
                    expect(readCalls).toBe(1);
                    
                    file.read(cb2);
                });
                waitsFor(function () { return cb2.wasCalled; });
                
                // confirm impl read and empty cached data
                runs(function () {
                    expect(cb2.error).toBeFalsy();
                    expect(file._isWatched).toBe(false);
                    expect(file._stat).toBeFalsy();
                    expect(file._contents).toBeFalsy();
                    expect(file._hash).toBeFalsy();
                    expect(readCalls).toBe(2);
                });
            });
            
        });
    });
});
