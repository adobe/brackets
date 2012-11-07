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
/*global brackets, $, define, describe, it, xit, expect, beforeEach, afterEach, FileError, waitsFor, waitsForDone, waitsForFail, runs */

define(function (require, exports, module) {
    'use strict';

    require("utils/Global");
    
    // Load dependent modules
    var NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
        SpecRunnerUtils         = require("spec/SpecRunnerUtils");
    
    var Encodings               = NativeFileSystem.Encodings;
    var _FSEncodings            = NativeFileSystem._FSEncodings;

    describe("NativeFileSystem", function () {
        
        var _err;

        beforeEach(function () {
            this.path = SpecRunnerUtils.getTestPath("/spec/NativeFileSystem-test-files");
            this.file1content = "Here is file1";
        });

        describe("Reading a directory", function () {

            it("should read a directory from disk", function () {
                var entries = null,
                    deferred = new $.Deferred();
                
                function requestNativeFileSystemSuccessCB(nfs) {
                    var reader = nfs.createReader();

                    var successCallback = function (e) { entries = e; deferred.resolve(); };
                    var errorCallback = function () { deferred.reject(); };

                    reader.readEntries(successCallback, errorCallback);
                }
                
                runs(function () {
                    NativeFileSystem.requestNativeFileSystem(this.path, requestNativeFileSystemSuccessCB);
                    waitsForDone(deferred, "requestNativeFileSystem");
                });

                runs(function () {
                    expect(entries.some(function (element) {
                        return (element.isDirectory && element.name === "dir1");
                    })).toBe(true);

                    expect(entries.some(function (element) {
                        return (element.isFile && element.name === "file1");
                    })).toBe(true);

                    expect(entries.some(function (element) {
                        return (element.isFile && element.name === "file2");
                    })).toBe(false);
                });
            });

            it("should be able to read a drive", function () {
                var entries = null,
                    deferred = new $.Deferred();
                
                function requestNativeFileSystemSuccessCB(nfs) {
                    var reader = nfs.createReader();

                    var successCallback = function (e) { entries = e; deferred.resolve(); };
                    var errorCallback = function () { deferred.reject(); };

                    reader.readEntries(successCallback, errorCallback);
                }
                
                var drivePath = this.path.substr(0, this.path.indexOf("/") + 1);
                
                runs(function () {
                    NativeFileSystem.requestNativeFileSystem(drivePath, requestNativeFileSystemSuccessCB);
                    waitsForDone(deferred, "requestNativeFileSystem");
                });

                runs(function () {
                    expect(entries).not.toBe(null);
                });
            });
            
            it("should return an error if the directory doesn't exist", function () {
                var deferred = new $.Deferred(),
                    error;
                
                runs(function () {
                    NativeFileSystem.requestNativeFileSystem(this.path + '/nonexistent-dir', function (data) {
                        deferred.resolve();
                    }, function (err) {
                        error = err;
                        deferred.reject();
                    });
                    
                    waitsForFail(deferred, "requestNativeFileSystem");
                });

                runs(function () {
                    expect(error.code).toBe(FileError.NOT_FOUND_ERR);
                });
            });

            it("should return an error if you pass a bad parameter", function () {
                var deferred = new $.Deferred(),
                    error;
                
                runs(function () {
                    NativeFileSystem.requestNativeFileSystem(
                        0xDEADBEEF,
                        function (data) {
                            deferred.resolve();
                        },
                        function (err) {
                            error = err;
                            deferred.reject();
                        }
                    );
                    
                    waitsForFail(deferred);
                });

                runs(function () {
                    expect(error.code).toBe(FileError.SECURITY_ERR);
                });
            });

            it("should be okay to not pass an error callback", function () {
                var deferred = new $.Deferred(),
                    entries = null;
                
                runs(function () {
                    NativeFileSystem.requestNativeFileSystem(this.path, function (data) {
                        entries = data;
                        deferred.resolve();
                    });
                    
                    waitsForDone(deferred);
                });

                runs(function () {
                    expect(entries).not.toBe(null);
                });
            });
            
            it("can read an empty folder", function () {
                // TODO: (issue #241): Implement DirectoryEntry.getDirectory() and remove this empty folder workaround.
                // We need an empty folder for testing in this spec. Unfortunately, it's impossible
                // to check an empty folder in to git, and we don't have low level fs calls to create an emtpy folder.
                // So, for now, we have a folder called "emptydir" which contains a single 0-length file called
                // "placeholder". We delete that file at the beginning of each test, and then recreate it at the end.
                //
                // If we add NativeFileSystem commands to create a folder, we should change this test to simply create
                // a new folder (rather than remove a placeholder, etc.)
                var deferred = new $.Deferred(),
                    entries = null,
                    accessedFolder = false,
                    placeholderDeleted = false,
                    gotErrorReadingContents = false,
                    placeholderRecreated = false,
                    dirPath = this.path + "/emptydir",
                    placeholderPath = dirPath + "/placeholder";
                
                function requestNativeFileSystemSuccessCB(nfs) {
                    accessedFolder = true;
                
                    function recreatePlaceholder(deferred) {
                        nfs.getFile("placeholder",
                                    { create: true, exclusive: true },
                                    function () { placeholderRecreated = true; deferred.resolve(); },
                                    function () { placeholderRecreated = false; deferred.reject(); });
                    }

                    function readDirectory() {
                        var reader = nfs.createReader();
                        var successCallback = function (e) {
                            entries = e;
                            recreatePlaceholder(deferred);
                        };
                        var errorCallback = function () {
                            gotErrorReadingContents = true;
                            recreatePlaceholder(deferred);
                        };
                        reader.readEntries(successCallback, errorCallback);
                    }

                    
                    function deletePlaceholder(successCallback) {
                        // TODO: (issue #241): implement FileEntry.remove()
                        // once NativeFileSystem has a delete/unlink, should use that
                        brackets.fs.unlink(placeholderPath, function (err) {
                            if (!err) {
                                placeholderDeleted = true;
                            }
                            // Even if there was an error, we want to read the directory
                            // because it could be that the placeholder is just missing.
                            // If we continue, we'll create the placeholder and the test
                            // will (maybe) pass next time
                            readDirectory();
                        });
                    }
                    
                    deletePlaceholder(); // which calls readDirectory which calls recreatePlaceholder
                            
                }
                
                runs(function () {
                    NativeFileSystem.requestNativeFileSystem(
                        dirPath,
                        requestNativeFileSystemSuccessCB,
                        function () { deferred.reject(); }
                    );
                    
                    waitsForDone(deferred, "requestNativeFileSystem");
                });

                runs(function () {
                    expect(accessedFolder).toBe(true);
                    expect(placeholderDeleted).toBe(true);
                    expect(gotErrorReadingContents).toBe(false);
                    expect(entries).toEqual([]);
                    expect(placeholderRecreated).toBe(true);
                });
            });
            
            it("should timeout with error when reading dir if low-level stat call takes too long", function () {
                var statCalled = false, readComplete = false, gotError = false, theError = null;
                var oldStat = brackets.fs.stat;
                this.after(function () { brackets.fs.stat = oldStat; });
                
                function requestNativeFileSystemSuccessCB(nfs) {
                    var reader = nfs.createReader();
                    
                    var successCallback = function (e) { readComplete = true; };
                    var errorCallback = function (error) { readComplete = true; gotError = true; theError = error; };

                    // mock up new low-level stat that never calls the callback
                    brackets.fs.stat = function (path, callback) {
                        statCalled = true;
                    };
                    
                    reader.readEntries(successCallback, errorCallback);
                }
                
                runs(function () {
                    NativeFileSystem.requestNativeFileSystem(this.path, requestNativeFileSystemSuccessCB);
                });

                waitsFor(function () { return readComplete; }, NativeFileSystem.ASYNC_TIMEOUT * 2);
                    
                runs(function () {
                    expect(readComplete).toBe(true);
                    expect(statCalled).toBe(true);
                    expect(gotError).toBe(true);
                    expect(theError.code).toBe(FileError.SECURITY_ERR);
                });
            });
        });

        describe("Reading a file", function () {
            
            var readFile = function (encoding) {
                return function () {
                    var gotFile = false, readFile = false, gotError = false, content;
                    var fileEntry = new NativeFileSystem.FileEntry(this.path + "/file1");
                    fileEntry.file(function (file) {
                        gotFile = true;
                        var reader = new NativeFileSystem.FileReader();
                        reader.onload = function (event) {
                            readFile = true;
                            content = event.target.result;
                        };
                        reader.onerror = function (event) {
                            gotError = true;
                        };
                        reader.readAsText(file, encoding);
                    });
    
                    waitsFor(function () { return gotFile && readFile; }, 1000);
    
                    runs(function () {
                        expect(gotFile).toBe(true);
                        expect(readFile).toBe(true);
                        expect(gotError).toBe(false);
                        expect(content).toBe(this.file1content);
                    });
                };
            };
            
            it("should read a file from disk", readFile(Encodings.UTF8));
            it("should read a file from disk with lower case encoding", readFile(Encodings.UTF8.toLowerCase()));
            it("should read a file from disk with upper case encoding", readFile(Encodings.UTF8.toUpperCase()));

            it("should return an error if the file is not found", function () {
                var deferred = new $.Deferred(),
                    errorCode;
                
                runs(function () {
                    var fileEntry = new NativeFileSystem.FileEntry(this.path + "/idontexist");
                    fileEntry.file(function (file) {
                        var reader = new NativeFileSystem.FileReader();
                        reader.onload = function (event) {
                            deferred.resolve();
                        };
                        reader.onerror = function (event) {
                            errorCode = event.target.error.code;
                            deferred.reject();
                        };
                        reader.readAsText(file, Encodings.UTF8);
                    });
                    
                    waitsForFail(deferred, "readAsText");
                });

                runs(function () {
                    expect(errorCode).toBe(FileError.NOT_FOUND_ERR);
                });
            });
            
            it("should fire appropriate events when the file is done loading", function () {
                var gotFile = false, gotLoad = false, gotLoadStart = false, gotLoadEnd = false,
                    gotProgress = false, gotError = false, gotAbort = false;
                
                runs(function () {
                    var fileEntry = new NativeFileSystem.FileEntry(this.path + "/file1");
                    fileEntry.file(function (file) {
                        gotFile = true;
                        var reader = new NativeFileSystem.FileReader();
                        reader.onload = function (event) {
                            gotLoad = true;
                        };
                        reader.onloadstart = function (event) {
                            gotLoadStart = true;
                        };
                        reader.onloadend = function (event) {
                            gotLoadEnd = true;
                        };
                        reader.onprogress = function (event) {
                            gotProgress = true;
                        };
                        reader.onerror = function (event) {
                            gotError = true;
                        };
                        reader.onabort = function (event) {
                            gotAbort = true;
                        };
                        reader.readAsText(file, Encodings.UTF8);
                    });
                });

                waitsFor(function () { return gotLoad && gotLoadEnd && gotProgress; }, 1000);

                runs(function () {
                    expect(gotFile).toBe(true);
                    expect(gotLoadStart).toBe(true);
                    expect(gotLoad).toBe(true);
                    expect(gotLoadEnd).toBe(true);
                    expect(gotProgress).toBe(true);
                    expect(gotError).toBe(false);
                    expect(gotAbort).toBe(false);
                });
            });

            it("should return an error but not crash if you create a bad FileEntry", function () {
                var gotFile = false, readFile = false, gotError = false;
                
                runs(function () {
                    var fileEntry = new NativeFileSystem.FileEntry(null);
                    fileEntry.file(function (file) {
                        gotFile = true;
                        var reader = new NativeFileSystem.FileReader();
                        reader.onload = function (event) {
                            readFile = true;
                        };
                        reader.onerror = function (event) {
                            gotError = true;
                        };
                        reader.readAsText(file, Encodings.UTF8);
                    });
                });

                waitsFor(function () { return gotError; }, 1000);

                runs(function () {
                    expect(gotFile).toBe(true);
                    expect(readFile).toBe(false);
                    expect(gotError).toBe(true);
                });
            });
        });

        describe("Writing", function () {

            beforeEach(function () {
                var nfs = null;
                var chmodDone = false;

                runs(function () {
                    NativeFileSystem.requestNativeFileSystem(this.path, function (fs) {
                        nfs = fs;
                    });
                });
                waitsFor(function () { return nfs; }, 1000);

                runs(function () {
                    this.nfs = nfs;
                });

                // set read-only permissions
                runs(function () {
                    brackets.fs.chmod(this.path + "/cant_read_here.txt", parseInt("222", 8), function (err) {
                        _err = err;
                        chmodDone = true;
                    });
                    brackets.fs.chmod(this.path + "/cant_write_here.txt", parseInt("444", 8), function (err) {
                        _err = err;
                        chmodDone = true;
                    });
                });
                waitsFor(function () { return chmodDone && (_err === brackets.fs.NO_ERROR); }, 1000);
            });

            afterEach(function () {
                var chmodDone = false;

                // restore permissions for git
                runs(function () {
                    brackets.fs.chmod(this.path + "/cant_read_here.txt", parseInt("777", 8), function (err) {
                        _err = err;
                        chmodDone = true;
                    });
                });
                waitsFor(function () { return chmodDone && (_err === brackets.fs.NO_ERROR); }, 1000);
            });

            it("should create new, zero-length files", function () {
                var fileEntry = null;
                var writeComplete = false;

                // create a new file exclusively
                runs(function () {
                    var successCallback = function (entry) {
                        fileEntry = entry;
                        writeComplete = true;
                    };
                    var errorCallback = function () {
                        writeComplete = true;
                    };

                    // FIXME (issue #247): NativeFileSystem.root is missing
                    this.nfs.getFile("new-zero-length-file.txt", { create: true, exclusive: true }, successCallback, errorCallback);
                });

                waitsFor(function () { return writeComplete; }, 1000);

                // fileEntry is non-null on success
                runs(function () {
                    expect(fileEntry).not.toBe(null);
                });

                var actualContents = null;

                // read the new file
                runs(function () {
                    brackets.fs.readFile(fileEntry.fullPath, _FSEncodings.UTF8, function (err, contents) {
                        actualContents = contents;
                    });
                });

                // wait for content to be read
                waitsFor(function () { return (actualContents !== null); }, 1000);

                // verify actual content to be empty
                var cleanupComplete = false;
                runs(function () {
                    expect(actualContents).toEqual("");

                    // cleanup
                    var self = this;
                    brackets.fs.unlink(fileEntry.fullPath, function (err) {
                        cleanupComplete = (err === brackets.fs.NO_ERROR);
                    });
                });

                waitsFor(function () { return cleanupComplete; }, 1000);
            });

            it("should report an error when a file does not exist and create = false", function () {
                var fileEntry = null;
                var writeComplete = false;
                var error = null;

                // create a new file exclusively
                runs(function () {
                    var successCallback = function (entry) {
                        fileEntry = entry;
                        writeComplete = true;
                    };
                    var errorCallback = function (err) {
                        error = err;
                        writeComplete = true;
                    };

                    // FIXME (issue #247): NativeFileSystem.root is missing
                    this.nfs.getFile("does-not-exist.txt", { create: false }, successCallback, errorCallback);
                });

                waitsFor(function () { return writeComplete; }, 1000);

                // fileEntry is null on error
                runs(function () {
                    expect(fileEntry).toBe(null);
                    expect(error.code).toBe(FileError.NOT_FOUND_ERR);
                });
            });

            it("should return an error if file exists and exclusive is true", function () {
                var fileEntry = null;
                var writeComplete = false;
                var error = null;

                // try to create a new file exclusively when the file name already exists
                runs(function () {
                    var successCallback = function (entry) {
                        fileEntry = entry;
                        writeComplete = true;
                    };
                    var errorCallback = function (err) {
                        error = err;
                        writeComplete = true;
                    };

                    // FIXME (issue #247): NativeFileSystem.root is missing
                    this.nfs.getFile("file1", { create: true, exclusive: true }, successCallback, errorCallback);
                });

                // wait for success or error to return
                waitsFor(function () { return writeComplete; }, 1000);

                runs(function () {
                    // fileEntry will be null when errorCallback is handled
                    expect(fileEntry).toBe(null);

                    // errorCallback should be called with PATH_EXISTS_ERR
                    expect(error.code).toEqual(FileError.PATH_EXISTS_ERR);
                });
            });

            it("should return an error if the path is a directory", function () {
                var fileEntry = null;
                var writeComplete = false;
                var error = null;

                // try to write to a path that is a directory instead of a file
                runs(function () {
                    var successCallback = function (entry) {
                        fileEntry = entry;
                        writeComplete = true;
                    };
                    var errorCallback = function (err) {
                        error = err;
                        writeComplete = true;
                    };

                    // FIXME (issue #247): NativeFileSystem.root is missing
                    this.nfs.getFile("dir1", { create: false }, successCallback, errorCallback);
                });

                // wait for success or error to return
                waitsFor(function () { return writeComplete; }, 1000);

                runs(function () {
                    // fileEntry will be null when errorCallback is handled
                    expect(fileEntry).toBe(null);

                    // errorCallback should be called with TYPE_MISMATCH_ERR
                    expect(error.code).toEqual(FileError.TYPE_MISMATCH_ERR);
                });
            });

            it("should create overwrite files with new content", function () {
                var fileEntry = null;
                var writeComplete = false;
                var error = null;

                runs(function () {
                    var successCallback = function (entry) {
                        fileEntry = entry;

                        fileEntry.createWriter(function (fileWriter) {
                            fileWriter.onwriteend = function (e) {
                                writeComplete = true;
                            };
                            fileWriter.onerror = function (err) {
                                writeComplete = true;
                            };

                            // TODO (issue #241): BlobBulder
                            fileWriter.write("FileWriter.write");
                        });
                    };
                    var errorCallback = function () {
                        writeComplete = true;
                    };

                    this.nfs.getFile("file1", { create: false }, successCallback, errorCallback);
                });

                waitsFor(function () { return writeComplete && fileEntry; }, 1000);

                var actualContents = null;

                runs(function () {
                    brackets.fs.readFile(fileEntry.fullPath, _FSEncodings.UTF8, function (err, contents) {
                        actualContents = contents;
                    });
                });

                waitsFor(function () { return !!actualContents; }, 1000);

                var rewriteComplete = false;
                
                runs(function () {
                    expect(actualContents).toEqual("FileWriter.write");

                    // reset file1 content
                    // reset file1 content
                    brackets.fs.writeFile(this.path + "/file1", this.file1content, _FSEncodings.UTF8, function () {
                        rewriteComplete = true;
                    });
                });
                
                waitsFor(function () { return rewriteComplete; }, 1000);
            });


            it("should write an empty file", function () {
                var fileEntry = null;
                var writeComplete = false;
                var error = null;

                runs(function () {
                    var successCallback = function (entry) {
                        fileEntry = entry;

                        fileEntry.createWriter(function (fileWriter) {
                            fileWriter.onwriteend = function (e) {
                                writeComplete = true;
                            };
                            fileWriter.onerror = function (err) {
                                writeComplete = true;
                                error = err;
                            };

                            // TODO (jasonsj): BlobBulder
                            fileWriter.write("");
                        });
                    };
                    var errorCallback = function () {
                        writeComplete = true;
                    };

                    this.nfs.getFile("file1", { create: false }, successCallback, errorCallback);
                });

                waitsFor(function () { return writeComplete && fileEntry; }, 1000);

                var actualContents = null;

                runs(function () {
                    brackets.fs.readFile(fileEntry.fullPath, _FSEncodings.UTF8, function (err, contents) {
                        actualContents = contents;
                    });
                });

                waitsFor(function () { return (actualContents !== null); }, 1000);

                var rewriteComplete = false;
                
                runs(function () {
                    expect(actualContents).toEqual("");

                    // reset file1 content
                    brackets.fs.writeFile(this.path + "/file1", this.file1content, _FSEncodings.UTF8, function () {
                        rewriteComplete = true;
                    });
                });
                
                waitsFor(function () { return rewriteComplete; }, 1000);
            });
            
            // This is Mac only because the chmod implementation on Windows supports disallowing write via
            // FILE_ATTRIBUTE_READONLY, but does not support disallowing read.
            it("should report an error when writing to a file that cannot be read (Mac only)", function () {
                if (brackets.platform !== "mac") {
                    return;
                }
                
                var complete = false;
                var error = null;

                // createWriter() should return an error for files it can't read
                runs(function () {
                    this.nfs.getFile(
                        "cant_read_here.txt",
                        { create: false },
                        function (entry) {
                            entry.createWriter(
                                function () { complete = true; },
                                function (err) { error = err; }
                            );
                        }
                    );
                });
                waitsFor(function () { return complete || error; }, 1000);

                runs(function () {
                    expect(complete).toBeFalsy();
                    expect(error.code).toBe(FileError.NOT_READABLE_ERR);
                });
            });

            it("should report an error when writing to a file that cannot be written", function () {
                var writeComplete = false;
                var error = null;

                runs(function () {
                    var successCallback = function (entry) {
                        entry.createWriter(function (fileWriter) {
                            fileWriter.onwriteend = function (e) {
                                writeComplete = true;
                            };
                            fileWriter.onerror = function (err) {
                                writeComplete = true;
                                error = err;
                            };

                            // TODO (issue #241): BlobBulder
                            fileWriter.write("FileWriter.write");
                        });
                    };
                    var errorCallback = function () {
                        writeComplete = true;
                    };

                    this.nfs.getFile("cant_write_here.txt", { create: false }, successCallback, errorCallback);
                });

                // fileWriter.onerror handler should be invoked for read only files
                waitsFor(
                    function () {
                        return writeComplete
                            && error
                            && (error.code === FileError.NO_MODIFICATION_ALLOWED_ERR);
                    },
                    1000
                );
            });

            xit("should append to existing files", function () {
                this.fail("TODO (issue #241): not supported for sprint 1");
            });

            xit("should seek into a file before writing", function () {
                this.fail("TODO (issue #241): not supported for sprint 1");
            });

            xit("should truncate files", function () {
                this.fail("TODO (issue #241): not supported for sprint 1");
            });
        });
    });
});