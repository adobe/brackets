describe("NativeFileSystem", function(){

    beforeEach(function() {
        this.path = SpecRunnerUtils.getTestPath("/spec/NativeFileSystem-test-files");
    });

    describe("Reading a directory", function() {

        beforeEach(function() {
            this.addMatchers({
                toContainDirectoryWithName: function(expected) {
                    for (var i = 0 ; i < this.actual.length; ++i) {
                        if (this.actual[i].isDirectory && this.actual[i].name === expected) {
                            return true;
                        }
                    }
                    return false;
                }
                , toContainFileWithName: function(expected) {
                    for (var i = 0 ; i < this.actual.length; ++i) {
                        if (this.actual[i].isFile && this.actual[i].name === expected) {
                            return true;
                        }
                    }
                    return false;
                }
            });
        });

        it("should read a directory from disk", function() {
            var entries = null;
            var readComplete = false;

            var nfs = NativeFileSystem.requestNativeFileSystem(this.path, requestNativeFileSystemSuccessCB);
            function requestNativeFileSystemSuccessCB( nfs ){
                var reader = nfs.createReader();

                var successCallback = function(e) { entries = e; readComplete = true; }
                // TODO: not sure what parameters error callback will take because it's not implemented yet
                var errorCallback = function() { readComplete = true; }

                reader.readEntries(successCallback, errorCallback);

                waitsFor(function() { return readComplete; }, 1000);

                runs(function() {
                    expect(entries).toContainDirectoryWithName("dir1");
                    expect(entries).toContainFileWithName("file1");
                    expect(entries).not.toContainFileWithName("file2");
                });
            }
        });

        it("should return an error if the directory doesn't exist", function() {
            var successCalled = false, errorCalled = false, error = null;
            NativeFileSystem.requestNativeFileSystem(this.path + '/nonexistent-dir', function(data) {
                successCalled = true;
            }, function(err) {
                errorCalled = true;
                error = err;
            });

            waitsFor(function() { return successCalled || errorCalled; }, 1000);

            runs(function() {
                expect(successCalled).toBe(false);
                expect(errorCalled).toBe(true);
                expect(error.code).toBe(FileError.NOT_FOUND_ERR);
            });
        });

        it("should return an error if you pass a bad parameter", function() {
            var successCalled = false, errorCalled = false, error = null;
            NativeFileSystem.requestNativeFileSystem(0xDEADBEEF, function(data) {
                successCalled = true;
            }, function(err) {
                errorCalled = true;
                error = err;
            });

            waitsFor(function() { return successCalled || errorCalled; }, 1000);

            runs(function() {
                expect(successCalled).toBe(false);
                expect(errorCalled).toBe(true);
                expect(error.code).toBe(FileError.SECURITY_ERR);
            });
        });

        it("should be okay to not pass an error callback", function() {
            var entries = null;
            NativeFileSystem.requestNativeFileSystem(this.path, function(data) {
                entries = data;
            });

            waitsFor(function() { return entries != null; }, 1000);

            runs(function() {
                expect(entries).not.toBe(null);
            });
        });
    });

    describe("Reading a file", function() {
        it("should read a file from disk", function() {
            var gotFile = false, readFile = false, gotError = false, content;
            var fileEntry = new NativeFileSystem.FileEntry(this.path + "/file1");
            fileEntry.file(function(file) {
                gotFile = true;
                var reader = new NativeFileSystem.FileReader();
                reader.onload = function(event) {
                    readFile = true;
                    content = event.target.result;
                };
                reader.onerror = function(event) {
                    gotError = true;
                };
                reader.readAsText(file, "utf8");
            });

            waitsFor(function() { return gotFile && readFile; }, 1000);

            runs(function() {
                expect(gotFile).toBe(true);
                expect(readFile).toBe(true);
                expect(gotError).toBe(false);
                expect(content).toBe("Here is file1\n");
            });
        });

        it("should return an error if the file is not found", function() {
            var gotFile = false, readFile = false, errorCode;
            var fileEntry = new NativeFileSystem.FileEntry(this.path + "/idontexist");
            fileEntry.file(function(file) {
                gotFile = true;
                var reader = new NativeFileSystem.FileReader();
                reader.onload = function(event) {
                    readFile = true;
                };
                reader.onerror = function(event) {
                    errorCode = event.target.error.code;
                };
                reader.readAsText(file, "utf8");
            });

            waitsFor(function() { return gotFile && errorCode; }, 1000);

            runs(function() {
                expect(gotFile).toBe(true);
                expect(readFile).toBe(false);
                expect(errorCode).toBe(FileError.NOT_FOUND_ERR);
            });
        });

        it("should fire appropriate events when the file is done loading", function() {
            var gotFile = false, gotLoad = false, gotLoadStart = false, gotLoadEnd = false,
            gotProgress = false, gotError = false, gotAbort = false;
            var fileEntry = new NativeFileSystem.FileEntry(this.path + "/file1");
            fileEntry.file(function(file) {
                gotFile = true;
                var reader = new NativeFileSystem.FileReader();
                reader.onload = function(event) {
                    gotLoad = true;
                };
                reader.onloadstart = function(event) {
                    gotLoadStart = true;
                }
                reader.onloadend = function(event) {
                    gotLoadEnd = true;
                };
                reader.onprogress = function(event) {
                    gotProgress = true;
                };
                reader.onerror = function(event) {
                    gotError = true;
                };
                reader.onabort = function(event) {
                    gotAbort = true;
                }
                reader.readAsText(file, "utf8");
            });

            waitsFor(function() { return gotLoad && gotLoadEnd && gotProgress; }, 1000);

            runs(function() {
                expect(gotFile).toBe(true);
                expect(gotLoadStart).toBe(true);
                expect(gotLoad).toBe(true);
                expect(gotLoadEnd).toBe(true);
                expect(gotProgress).toBe(true);
                expect(gotError).toBe(false);
                expect(gotAbort).toBe(false);
            });
        });

        it("should return an error but not crash if you create a bad FileEntry", function() {
            var gotFile = false, readFile = false, gotError = false;
            var fileEntry = new NativeFileSystem.FileEntry(null);
            fileEntry.file(function(file) {
                gotFile = true;
                var reader = new NativeFileSystem.FileReader();
                reader.onload = function(event) {
                    readFile = true;
                };
                reader.onerror = function(event) {
                    gotError = true;
                };
                reader.readAsText(file, "utf8");
            });

            waitsFor(function() { return gotError; }, 1000);

            runs(function() {
                expect(gotFile).toBe(true);
                expect(readFile).toBe(false);
                expect(gotError).toBe(true);
            });
        });
    });

    describe("Writing", function() {

        it("should create new, zero-length files", function() {
            var nfs = null;

            NativeFileSystem.requestNativeFileSystem( this.path, function( fs ) {
                nfs = fs;
            });

            waitsFor( function() { return nfs }, 1000);

            var fileEntry = null;
            var writeComplete = false;

            runs(function() {
                var successCallback = function( entry ) {
                    fileEntry = entry;
                    writeComplete = true;
                }
                var errorCallback = function() {
                    writeComplete = true
                };

                // FIXME (jasonsj): NativeFileSystem.root is missing
                // FIXME (jasonsj): Need brackets.fs.rm() to cleanup created file
                //                  https://github.com/adobe/brackets-app/issues/14
                nfs.getFile(Math.random() + "do-not-commit.txt", { create: true }, successCallback, errorCallback );
            });

            waitsFor( function() { return writeComplete; }, 1000 );

            runs(function() {
                expect(fileEntry).not.toBe(null);
            });
        });

        it("should append to existing files", function() {
            this.fail("TODO");
        });

        it("should seek into a file before writing", function() {
            this.fail("TODO");
        });

        it("should truncate files", function() {
            this.fail("TODO");
        });
    });
});
