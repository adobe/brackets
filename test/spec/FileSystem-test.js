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
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, window, $, jasmine, brackets */

define(function (require, exports, module) {
    "use strict";
    
    var Directory           = require("filesystem/Directory"),
        File                = require("filesystem/File"),
        FileSystem          = require("filesystem/FileSystem"),
        FileSystemError     = require("filesystem/FileSystemError"),
        MockFileSystemImpl  = require("./MockFileSystemImpl");
    
    describe("FileSystem", function () {
        
        var fileSystem;
        
        beforeEach(function () {
            // Create an FS instance for testing
            MockFileSystemImpl.reset();
            fileSystem = new FileSystem._FileSystem();
            fileSystem.init(MockFileSystemImpl);
            fileSystem.watch(fileSystem.getDirectoryForPath("/"), function () {return true; }, function () {});
        });
        
        // Callback factories
        function resolveCallback() {
            var callback = function (err, entry) {
                callback.error = err;
                callback.entry = entry;
                callback.wasCalled = true;
            };
            return callback;
        }
        
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
            function renameCallback() {
                var callback = function (err) {
                    callback.error = err;
                    callback.wasCalled = true;
                };
                return callback;
            }
            
            it("should rename a File", function () {
                var file = fileSystem.getFileForPath("/file1.txt"),
                    cb = renameCallback();
                
                runs(function () {
                    file.rename("/file1-renamed.txt", cb);
                });
                waitsFor(function () { return cb.wasCalled; });
                runs(function () {
                    expect(cb.error).toBeFalsy();
                    expect(file.fullPath).toBe("/file1-renamed.txt");
                });
            });
            
            it("should fail if the file doesn't exist", function () {
                var file = fileSystem.getFileForPath("/doesnt-exist.txt"),
                    cb = renameCallback();
                
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
                    cb = renameCallback();
                
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
                    cb = renameCallback();
                
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
            function getContentsCallback() {
                var callback = function (err, contents) {
                    callback.error = err;
                    callback.contents = contents;
                    callback.wasCalled = true;
                };
                return callback;
            }
            
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
                    cbCount = 0;
                
                function delayedCallback() {
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
                    directory.getContents(cb);
                    expect(cb.wasCalled).toBeFalsy(); // Callback should *not* have been called yet
                });
                waitsFor(function () { return cb.wasCalled; });
                waits(100); // Make sure there is time for a second callback
                runs(function () {
                    expect(cb.wasCalled).toBe(true);
                    expect(cb.error).toBeFalsy();
                    expect(cbCount).toBe(1);
                });
            });
        });
        
        describe("Read and write files", function () {
            function readCallback() {
                var callback = function (err, contents, stat) {
                    callback.error = err;
                    callback.contents = contents;
                    callback.stat = stat;
                    callback.wasCalled = true;
                };
                return callback;
            }
            
            function writeCallback() {
                var callback = function (err) {
                    callback.error = err;
                    callback.wasCalled = true;
                };
                return callback;
            }
            
            it("should read and write files", function () {
                var file = fileSystem.getFileForPath("/subdir/file4.txt"),
                    newContents = "New file contents",
                    firstReadCB = readCallback(),
                    writeCB = writeCallback(),
                    secondReadCB = readCallback();
                
                // Verify initial contents
                runs(function () {
                    file.readAsText(firstReadCB);
                });
                waitsFor(function () { return firstReadCB.wasCalled; });
                runs(function () {
                    expect(firstReadCB.error).toBeFalsy();
                    expect(firstReadCB.contents).toBe("File 4 Contents");
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
                    file.readAsText(secondReadCB);
                });
                waitsFor(function () { return secondReadCB.wasCalled; });
                runs(function () {
                    expect(secondReadCB.error).toBeFalsy();
                    expect(secondReadCB.contents).toBe(newContents);
                });
            });
        });
    });
});
