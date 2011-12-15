describe("NativeFileSystem", function() {

    beforeEach(function () {
        this.path = SpecRunnerUtils.getTestPath("/spec/NativeFileSystem-test-files");
    });

    describe("Reading", function() {

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

    describe("Writing", function() {

        it("should write new files", function() {
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
                var errorCallback = function() { writeComplete = true };

                nfs.root.getFile("should-write-new-files.txt", { create: true }, successCallback, errorCallback );
            });

            waitsFor( function() { return writeComplete; }, 1000 );

            runs(function() {
                expect(entries).not.toBe(null);
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
