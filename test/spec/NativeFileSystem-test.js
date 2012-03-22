/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets: true, define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, FileError: false, waitsFor: false, runs: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
        SpecRunnerUtils         = require("./SpecRunnerUtils.js");

    describe("NativeFileSystem", function () {
        
        var _err;

        beforeEach(function () {
            this.path = SpecRunnerUtils.getTestPath("/spec/NativeFileSystem-test-files");
            this.file1content = "Here is file1";
        });

        describe("Reading a directory", function () {

            beforeEach(function () {
                this.addMatchers({
                    toContainDirectoryWithName: function (expected) {
                        var i;
                        for (i = 0; i < this.actual.length; ++i) {
                            if (this.actual[i].isDirectory && this.actual[i].name === expected) {
                                return true;
                            }
                        }
                        return false;
                    },
                    toContainFileWithName: function (expected) {
                        var i;
                        for (i = 0; i < this.actual.length; ++i) {
                            if (this.actual[i].isFile && this.actual[i].name === expected) {
                                return true;
                            }
                        }
                        return false;
                    }
                });
            });

            it("should read a directory from disk", function () {
                var entries = null;
                var readComplete = false, gotError = false;
                
                function requestNativeFileSystemSuccessCB(nfs) {
                    var reader = nfs.createReader();

                    var successCallback = function (e) { entries = e; readComplete = true; };
                    var errorCallback = function () { readComplete = true; gotError = true; };

                    reader.readEntries(successCallback, errorCallback);
                }
                
                var nfs = NativeFileSystem.requestNativeFileSystem(this.path, requestNativeFileSystemSuccessCB);
                
                waitsFor(function () { return readComplete; }, 1000);

                runs(function () {
                    expect(gotError).toBe(false);
                    expect(entries).toContainDirectoryWithName("dir1");
                    expect(entries).toContainFileWithName("file1");
                    expect(entries).not.toContainFileWithName("file2");
                });
            });

            it("should return an error if the directory doesn't exist", function () {
                var successCalled = false, errorCalled = false, error = null;
                NativeFileSystem.requestNativeFileSystem(this.path + '/nonexistent-dir', function (data) {
                    successCalled = true;
                }, function (err) {
                    errorCalled = true;
                    error = err;
                });

                waitsFor(function () { return successCalled || errorCalled; }, 1000);

                runs(function () {
                    expect(successCalled).toBe(false);
                    expect(errorCalled).toBe(true);
                    expect(error.code).toBe(FileError.NOT_FOUND_ERR);
                });
            });

            it("should return an error if you pass a bad parameter", function () {
                var successCalled = false, errorCalled = false, error = null;
                NativeFileSystem.requestNativeFileSystem(
                    0xDEADBEEF,
                    function (data) {
                        successCalled = true;
                    },
                    function (err) {
                        errorCalled = true;
                        error = err;
                    }
                );

                waitsFor(function () { return successCalled || errorCalled; }, 1000);

                runs(function () {
                    expect(successCalled).toBe(false);
                    expect(errorCalled).toBe(true);
                    expect(error.code).toBe(FileError.SECURITY_ERR);
                });
            });

            it("should be okay to not pass an error callback", function () {
                var entries = null;
                NativeFileSystem.requestNativeFileSystem(this.path, function (data) {
                    entries = data;
                });

                waitsFor(function () { return entries !== null; }, 1000);

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
                var entries = null;
                var accessedFolder = false, placeholderDeleted = false, readComplete = false, gotErrorReadingContents = false, placeholderRecreated = false;

                var dirPath = this.path + "/emptydir";
                var placeholderPath = dirPath + "/placeholder";
                
                function requestNativeFileSystemSuccessCB(nfs) {
                    accessedFolder = true;
                
                    function recreatePlaceholder(successCallback) {
                        nfs.getFile("placeholder",
                                    { create: true, exclusive: true },
                                    function () { placeholderRecreated = true; },
                                    function () { placeholderRecreated = false; });
                    }

                    function readDirectory() {
                        var reader = nfs.createReader();
                        var successCallback = function (e) {
                            entries = e;
                            readComplete = true;
                            recreatePlaceholder();
                        };
                        var errorCallback = function () {
                            readComplete = true;
                            gotErrorReadingContents = true;
                            recreatePlaceholder();
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
                
                var nfs = NativeFileSystem.requestNativeFileSystem(
                    dirPath,
                    requestNativeFileSystemSuccessCB,
                    function () { readComplete = true; }
                );

                waitsFor(function () { return readComplete; }, 1000);

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
                
                var nfs = NativeFileSystem.requestNativeFileSystem(this.path, requestNativeFileSystemSuccessCB);

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
            it("should read a file from disk", function () {
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
                    reader.readAsText(file, "utf8");
                });

                waitsFor(function () { return gotFile && readFile; }, 1000);

                runs(function () {
                    expect(gotFile).toBe(true);
                    expect(readFile).toBe(true);
                    expect(gotError).toBe(false);
                    expect(content).toBe(this.file1content);
                });
            });

            it("should return an error if the file is not found", function () {
                var gotFile = false, readFile = false, errorCode;
                var fileEntry = new NativeFileSystem.FileEntry(this.path + "/idontexist");
                fileEntry.file(function (file) {
                    gotFile = true;
                    var reader = new NativeFileSystem.FileReader();
                    reader.onload = function (event) {
                        readFile = true;
                    };
                    reader.onerror = function (event) {
                        errorCode = event.target.error.code;
                    };
                    reader.readAsText(file, "utf8");
                });

                waitsFor(function () { return gotFile && errorCode; }, 1000);

                runs(function () {
                    expect(gotFile).toBe(true);
                    expect(readFile).toBe(false);
                    expect(errorCode).toBe(FileError.NOT_FOUND_ERR);
                });
            });

            it("should fire appropriate events when the file is done loading", function () {
                var gotFile = false, gotLoad = false, gotLoadStart = false, gotLoadEnd = false,
                    gotProgress = false, gotError = false, gotAbort = false;
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
                    reader.readAsText(file, "utf8");
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
                    reader.readAsText(file, "utf8");
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
                    brackets.fs.readFile(fileEntry.fullPath, "utf8", function (err, contents) {
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
                    brackets.fs.readFile(fileEntry.fullPath, "utf8", function (err, contents) {
                        actualContents = contents;
                    });
                });

                waitsFor(function () { return !!actualContents; }, 1000);

                var rewriteComplete = false;
                
                runs(function () {
                    expect(actualContents).toEqual("FileWriter.write");

                    // reset file1 content
                    // reset file1 content
                    brackets.fs.writeFile(this.path + "/file1", this.file1content, "utf8", function () {
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
                    brackets.fs.readFile(fileEntry.fullPath, "utf8", function (err, contents) {
                        actualContents = contents;
                    });
                });

                waitsFor(function () { return (actualContents !== null); }, 1000);

                var rewriteComplete = false;
                
                runs(function () {
                    expect(actualContents).toEqual("");

                    // reset file1 content
                    brackets.fs.writeFile(this.path + "/file1", this.file1content, "utf8", function () {
                        rewriteComplete = true;
                    });
                });
                
                waitsFor(function () { return rewriteComplete; }, 1000);
            });
            
            // This is Mac only because the chmod implementation on Windows supports disallowing write via
            // FILE_ATTRIBUTE_READONLY, but does not support disallowing read.
            it("should report an error when writing to a file that cannot be read (Mac only)", function () {
                if (brackets.platform === "mac") {
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
                }
                
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