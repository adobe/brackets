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
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, waitsForDone: false, runs: false, brackets: false */

define(function (require, exports, module) {
    'use strict';

    require("utils/Global");
    
    // Load dependent modules
    var SpecRunnerUtils     = require("spec/SpecRunnerUtils");
    var _FSEncodings        = require("file/NativeFileSystem").NativeFileSystem._FSEncodings;
    
    // These are tests for the low-level file io routines in brackets-app. Make sure
    // you have the latest brackets-app before running.

    describe("LowLevelFileIO", function () {
    
        var baseDir = SpecRunnerUtils.getTempDirectory();
    
        beforeEach(function () {
            runs(function () {
                var testFiles = SpecRunnerUtils.getTestPath("/spec/LowLevelFileIO-test-files");
                waitsForDone(SpecRunnerUtils.copyPath(testFiles, baseDir));
            });

            runs(function () {
                // Pre-test setup - set permissions on special directories 
                waitsForDone(SpecRunnerUtils.chmod(baseDir + "/cant_read_here", "222"));
                waitsForDone(SpecRunnerUtils.chmod(baseDir + "/cant_write_here", "444"));
            });
        });

        afterEach(function () {
            // Restore directory permissions
            runs(function () {
                waitsForDone(SpecRunnerUtils.chmod(baseDir + "/cant_read_here", "777"));
                waitsForDone(SpecRunnerUtils.chmod(baseDir + "/cant_write_here", "777"));
            });
        });

        it("should have a brackets.fs namespace", function () {
            expect(brackets.fs).toBeTruthy();
        });
    
        describe("readdir", function () {
            var complete, error, content;
        
            beforeEach(function () {
                complete = false;
            });
        
            it("should read a directory from disk", function () {
                runs(function () {
                    brackets.fs.readdir(baseDir, function (err, contents) {
                        error = err;
                        content = contents;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBeFalsy();
                
                    // Look for known files
                    expect(content.indexOf("file_one.txt")).not.toBe(-1);
                    expect(content.indexOf("file_two.txt")).not.toBe(-1);
                    expect(content.indexOf("file_three.txt")).not.toBe(-1);
                
                    // Make sure '.' and '..' are omitted
                    expect(content.indexOf(".")).toBe(-1);
                    expect(content.indexOf("..")).toBe(-1);
                });
            });
		
            it("should return an error if the directory doesn't exist", function () {
                runs(function () {
                    brackets.fs.readdir("/This/directory/doesnt/exist", function (err, contents) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });

            it("should return an error if the directory can't be read (Mac only)", function () {
                if (brackets.platform === "mac") {
                    runs(function () {
                        brackets.fs.readdir(baseDir + "/cant_read_here", function (err, contents) {
                            error = err;
                            complete = true;
                        });
                    });
                
                    waitsFor(function () { return complete; }, 1000);
                
                    runs(function () {
                        expect(error).toBe(brackets.fs.ERR_CANT_READ);
                    });
                }

            });

            it("should return an error if invalid parameters are passed", function () {
                runs(function () {
                    brackets.fs.readdir(42, function (err, contents) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
        }); // describe("readdir")

        describe("stat", function () {
            var complete, error, stat;
       
            beforeEach(function () {
                complete = false;
            });
        
            it("should return correct information for a directory", function () {
                runs(function () {
                    brackets.fs.stat(baseDir, function (err, _stat) {
                        error = err;
                        stat = _stat;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isDirectory()).toBe(true);
                    expect(stat.isFile()).toBe(false);
                });
            });
        
            it("should return correct information for a file", function () {
                runs(function () {
                    brackets.fs.stat(baseDir + "/file_one.txt", function (err, _stat) {
                        error = err;
                        stat = _stat;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBeFalsy();
                    expect(stat.isDirectory()).toBe(false);
                    expect(stat.isFile()).toBe(true);
                });
            });
        
            it("should return an error if the file/directory doesn't exist", function () {
                runs(function () {
                    brackets.fs.stat("/This/directory/doesnt/exist", function (err, _stat) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });
        
            it("should return an error if incorrect parameters are passed", function () {
                runs(function () {
                    brackets.fs.stat(42, function (err, _stat) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
        
        }); // describe("stat")

        describe("readFile", function () {
            var complete, error, content;
        
            beforeEach(function () {
                complete = false;
            });
        
            it("should read a text file", function () {
                runs(function () {
                    brackets.fs.readFile(baseDir + "/file_one.txt", _FSEncodings.UTF8, function (err, contents) {
                        error = err;
                        content = contents;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBeFalsy();
                    expect(content).toBe("Hello world");
                });
            });
        
            it("should return an error if trying to read a non-existent file", function () {
                runs(function () {
                    brackets.fs.readFile("/This/file/doesnt/exist.txt", _FSEncodings.UTF8, function (err, contents) {
                        error = err;
                        content = contents;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });
        
            it("should return an error if trying to use an unsppported encoding", function () {
                runs(function () {
                    brackets.fs.readFile(baseDir + "/file_one.txt", _FSEncodings.UTF16, function (err, contents) {
                        error = err;
                        content = contents;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_UNSUPPORTED_ENCODING);
                });
            });
        
            it("should return an error if called with invalid parameters", function () {
                runs(function () {
                    brackets.fs.readFile(42, [], function (err, contents) {
                        error = err;
                        content = contents;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });
        
            it("should return an error if trying to read a directory", function () {
                runs(function () {
                    brackets.fs.readFile(baseDir, _FSEncodings.UTF8, function (err, contents) {
                        error = err;
                        content = contents;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_CANT_READ);
                });
            });
        }); // describe("readFile")
    
        describe("writeFile", function () {
            var complete, error, content, contents = "This content was generated from LowLevelFileIO-test.js";
        
            beforeEach(function () {
                complete = false;
            });
        
            it("should write the entire contents of a file", function () {
                runs(function () {
                    brackets.fs.writeFile(baseDir + "/write_test.txt", contents, _FSEncodings.UTF8, function (err) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBeFalsy();
                });

                // Read contents to verify
                runs(function () {
                    complete = false;
                    brackets.fs.readFile(baseDir + "/write_test.txt", _FSEncodings.UTF8, function (err, data) {
                        error = err;
                        content = data;
                        complete = true;
                    });
                });

                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBeFalsy();
                    expect(content).toBe(contents);
                });
            });
        
            it("should return an error if the file can't be written (Mac only)", function () {
                if (brackets.platform === "mac") {
                    runs(function () {
                        brackets.fs.writeFile(baseDir + "/cant_write_here/write_test.txt", contents, _FSEncodings.UTF8, function (err) {
                            error = err;
                            complete = true;
                        });
                    });
                
                    waitsFor(function () { return complete; }, 1000);
                
                    runs(function () {
                        expect(error).toBe(brackets.fs.ERR_CANT_WRITE);
                    });
                }

            });
        
            it("should return an error if called with invalid parameters", function () {
                runs(function () {
                    brackets.fs.writeFile(42, contents, 2, function (err) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });

            it("should return an error if trying to write a directory", function () {
                runs(function () {
                    brackets.fs.writeFile(baseDir, contents, _FSEncodings.UTF8, function (err) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    // Ideally we would get ERR_CANT_WRITE, but as long as we get some sort of error it's fine. 
                    expect(error).toBeTruthy();
                });
            });
        }); // describe("writeFile")
    
        describe("unlink", function () {
            var complete, error, content, contents = "This content was generated from LowLevelFileIO-test.js";
        
            beforeEach(function () {
                complete = false;
            });
        
            it("should remove a file", function () {
                var filename = baseDir + "/remove_me.txt";
            
                runs(function () {
                    brackets.fs.writeFile(filename, contents, _FSEncodings.UTF8, function (err) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBeFalsy();
                });


                // Read contents to verify
                runs(function () {
                    complete = false;
                    brackets.fs.readFile(filename, _FSEncodings.UTF8, function (err, data) {
                        error = err;
                        content = data;
                        complete = true;
                    });
                });

                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBeFalsy();
                    expect(content).toBe(contents);
                });
            
                // Remove the file
                runs(function () {
                    complete = false;
                    brackets.fs.unlink(filename, function (err) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBeFalsy();
                });
            
                // Verify it is gone
                runs(function () {
                    complete = false;
                    brackets.fs.stat(filename, function (err, stat) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });

            it("should return an error if the file doesn't exist", function () {
                runs(function () {
                    brackets.fs.unlink("/This/file/doesnt/exist.txt", function (err) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });

            it("should return an error if the a directory is specified", function () {
                runs(function () {
                    brackets.fs.unlink(baseDir, function (err) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FILE);
                });
            });

            it("should return an error if called with invalid parameters", function () {
                runs(function () {
                    brackets.fs.unlink(42, function (err) {
                        error = err;
                        complete = true;
                    });
                });
            
                waitsFor(function () { return complete; }, 1000);
            
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_INVALID_PARAMS);
                });
            });

        }); // describe("unlink")
        
        describe("makedir", function () {
            var error, complete, isDirectory;
            
            it("should make a new directory", function () {
                var newDirName = baseDir + "/new_dir";
                
                complete = false;
                runs(function () {
                    brackets.fs.makedir(newDirName, parseInt("777", 0), function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                
                // Verify directory was created
                runs(function () {
                    complete = false;
                    brackets.fs.stat(newDirName, function (err, stat) {
                        error = err;
                        isDirectory = stat.isDirectory();
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                    expect(isDirectory).toBe(true);
                });
                
                // Delete the directory
                runs(function () {
                    complete = false;
                    brackets.fs.moveToTrash(newDirName, function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
            });
        });
        
        describe("rename", function () {
            var error, complete;
            
            it("should rename a file", function () {
                var oldName = baseDir + "/file_one.txt",
                    newName = baseDir + "/file_one_renamed.txt";
                
                complete = false;
                
                runs(function () {
                    brackets.fs.rename(oldName, newName, function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                
                // Verify new file is found and old one is missing
                runs(function () {
                    complete = false;
                    brackets.fs.stat(oldName, function (err, stat) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });

                runs(function () {
                    complete = false;
                    brackets.fs.stat(newName, function (err, stat) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                
                // Rename the file back to the old name
                runs(function () {
                    complete = false;
                    brackets.fs.rename(newName, oldName, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                    
            });
            it("should rename a folder", function () {
                var oldName = baseDir + "/rename_me",
                    newName = baseDir + "/renamed_folder";
                
                complete = false;
                
                runs(function () {
                    brackets.fs.rename(oldName, newName, function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                
                // Verify new folder is found and old one is missing
                runs(function () {
                    complete = false;
                    brackets.fs.stat(oldName, function (err, stat) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });

                runs(function () {
                    complete = false;
                    brackets.fs.stat(newName, function (err, stat) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                
                // Rename the folder back to the old name
                runs(function () {
                    complete = false;
                    brackets.fs.rename(newName, oldName, function (err) {
                        complete = true;
                        error = err;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
            });
            it("should return an error if the new name already exists", function () {
                var oldName = baseDir + "/file_one.txt",
                    newName = baseDir + "/file_two.txt";
                
                complete = false;
                
                runs(function () {
                    brackets.fs.rename(oldName, newName, function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; }, 1000);
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_FILE_EXISTS);
                });
            });
            it("should return an error if the parent folder is read only (Mac only)", function () {
                if (brackets.platform === "mac") {
                    var oldName = baseDir + "/cant_write_here/readme.txt",
                        newName = baseDir + "/cant_write_here/readme_renamed.txt";
                    
                    complete = false;
                    
                    runs(function () {
                        brackets.fs.rename(oldName, newName, function (err) {
                            error = err;
                            complete = true;
                        });
                    });
                    
                    waitsFor(function () { return complete; }, 1000);
                    
                    runs(function () {
                        expect(error).toBe(brackets.fs.ERR_CANT_WRITE);
                    });
                }
            });
            // TODO: More testing of error cases? 
        });
        
        describe("moveToTrash", function () {
            var error, complete, isDirectory;
            
            it("should move a file to the trash", function () {
                var newFileName = baseDir + "/delete_me.txt";
                
                // Create a file
                runs(function () {
                    complete = false;
                    brackets.fs.writeFile(newFileName, "", _FSEncodings.UTF8, function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                
                // Move it to the trash
                runs(function () {
                    complete = false;
                    brackets.fs.moveToTrash(newFileName, function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                
                // Make sure it's gone
                runs(function () {
                    complete = false;
                    brackets.fs.moveToTrash(newFileName, function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });
            
            it("should move a folder to the trash", function () {
                var newDirName = baseDir + "/dir_to_delete";
                
                // Create a file
                runs(function () {
                    complete = false;
                    brackets.fs.makedir(newDirName, parseInt("777", 8), function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                
                // Move it to the trash
                runs(function () {
                    complete = false;
                    brackets.fs.moveToTrash(newDirName, function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.NO_ERROR);
                });
                
                // Make sure it's gone
                runs(function () {
                    complete = false;
                    brackets.fs.moveToTrash(newDirName, function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });
            
            it("should return an error if the item doesn't exsit", function () {
                
                // Move it to the trash
                runs(function () {
                    complete = false;
                    brackets.fs.moveToTrash(baseDir + "/doesnt_exist", function (err) {
                        error = err;
                        complete = true;
                    });
                });
                
                waitsFor(function () { return complete; });
                
                runs(function () {
                    expect(error).toBe(brackets.fs.ERR_NOT_FOUND);
                });
            });
        }); // moveToTrash
    });
});
