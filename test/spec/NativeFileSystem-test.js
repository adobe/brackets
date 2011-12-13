describe("FileIO", function(){

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

      //TODO: Make this relative -- right now, asking for "." gives "/"
      //Want to be able to simply use:
      //  var path = "spec/NativeFileSystem-test-files";
      var path = window.location.href;
      path = path.substr("file://".length);
      path = path.substr(0,path.lastIndexOf("/")+1);
      path = path + "spec/NativeFileSystem-test-files";

      var entries = null;
      var readComplete = false;

      var nfs = window.NativeFileSystem.requestNativeFileSystem(path);
      var reader = nfs.createReader()

      // TODO: not sure what parameters error callback will take because it's not implemented yet
      reader.readEntries(
        function(e) { entries = e; readComplete = true; }
      , function()  { readComplete = true; }
      );            

      waitsFor(function() { return readComplete; }, 1000);

      runs(function() {
        expect(entries).toContainDirectoryWithName("dir1");
        expect(entries).toContainFileWithName("file1");
        expect(entries).not.toContainFileWithName("file2");
      });

    });
  });
});
