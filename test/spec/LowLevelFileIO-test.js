// These are tests for the low-level file io routines in brackets-app. Make sure
// you have the latest brackets-app before running.

describe("LowLevelFileIO", function() {

  it("should have a brackets.fs namespace", function() {
    expect(brackets.fs).toBeTruthy();
  });
  
  // Get window.location and remove the initial "file://" or "http://"
  var baseDir = SpecRunnerUtils.getTestPath("/spec/LowLevelFileIO-test-files/");

  beforeEach(function() {
    // Pre-test setup - set permissions on special directories 
      
    // Set read-only mode
    brackets.fs.chmod(baseDir + "cant_read_here", 0222, function(err) {
      expect(err).toBeFalsy();
    });

    // Set write-only mode
    brackets.fs.chmod(baseDir + "cant_write_here", 0444, function(err) {
      expect(err).toBeFalsy();
    });          
  });
  
  afterEach(function() {
    // Restore directory permissions

    // Set read-only mode
    brackets.fs.chmod(baseDir + "cant_read_here", 0777, function(err) {
      expect(err).toBeFalsy();
    });

    // Set write-only mode
    brackets.fs.chmod(baseDir + "cant_write_here", 0777, function(err) {
      expect(err).toBeFalsy();
    });          
  });  
  
  describe("readdir", function() {
    
    it("should read a directory from disk", function() {
      brackets.fs.readdir(baseDir, function(err, contents) {
        expect(err).toBeFalsy();
        
        // Look for known files
        expect(contents.indexOf("file_one.txt")).not.toBe(-1);
        expect(contents.indexOf("file_two.txt")).not.toBe(-1);
        expect(contents.indexOf("file_three.txt")).not.toBe(-1);
        
        // Make sure '.' and '..' are omitted
        expect(contents.indexOf(".")).toBe(-1);
        expect(contents.indexOf("..")).toBe(-1);
      });
    });

    it ("should return an error if the directory doesn't exist", function() {
      brackets.fs.readdir("/This/directory/doesnt/exist", function(err, contents) {
        expect(err).toBe(brackets.fs.ERR_NOT_FOUND);
      });
    });

    it ("should return an error if the directory can't be read", function() {
      brackets.fs.readdir(baseDir + "cant_read_here", function(err, contents) {
        expect(err).toBe(brackets.fs.ERR_CANT_READ);
      });
    });

    it ("should return an error if invalid parameters are passed", function() {
      brackets.fs.readdir(42, function(err, contents) {
        expect(err).toBe(brackets.fs.ERR_INVALID_PARAMS);
      });
    });
  }); // describe("readdir")

  describe("stat", function() {
    it ("should return correct information for a directory", function() {
      brackets.fs.stat(baseDir, function(err, stat) {
        expect(err).toBeFalsy();
        expect(stat.isDirectory()).toBe(true);
        expect(stat.isFile()).toBe(false);
      });
    });
    
    it ("should return correct information for a file", function() {
      brackets.fs.stat(baseDir + "file_one.txt", function(err, stat) {
        expect(err).toBeFalsy();
        expect(stat.isDirectory()).toBe(false);
        expect(stat.isFile()).toBe(true);
      });
    });
    
    it ("should return an error if the file/directory doesn't exist", function() {
      brackets.fs.stat("/This/directory/doesnt/exist", function(err, stat) {
        expect(err).toBe(brackets.fs.ERR_NOT_FOUND);
      });
    });
    
    it ("should return an error if incorrect parameters are passed", function() {
      brackets.fs.stat(42, function(err, stat) {
        expect(err).toBe(brackets.fs.ERR_INVALID_PARAMS);
      });
    });
    
  }); // describe("stat")

  describe("readFile", function() {
    it ("should read a text file", function() {
      brackets.fs.readFile(baseDir + "file_one.txt", "utf8", function(err, contents) {
        expect(err).toBeFalsy();
        expect(contents).toBe("Hello world");
      });      
    });
    
    it ("should return an error if trying to read a non-existent file", function() {
      brackets.fs.readFile("/This/file/doesnt/exist.txt", "utf8", function(err, contents) {
         expect(err).toBe(brackets.fs.ERR_NOT_FOUND);
      });      
    });
    
    it ("should return an error if trying to use an unsppported encoding", function() {
      brackets.fs.readFile(baseDir + "file_one.txt", "utf16", function(err, contents) {
         expect(err).toBe(brackets.fs.ERR_UNSUPPORTED_ENCODING);
      });      
    });
    
    it ("should return an error if called with invalid parameters", function() {
      brackets.fs.readFile(42, [], function(err, contents) {
         expect(err).toBe(brackets.fs.ERR_INVALID_PARAMS);
      });      
    });
  }); // describe("readFile")
  
  describe("writeFile", function() {
    var contents = "This content was generated from LowLevelFileIO-test.js";
    it ("should write the entire contents of a file", function() {
      brackets.fs.writeFile(baseDir + "write_test.txt", contents, "utf8", function(err) {
        expect(err).toBeFalsy();
        
        // Read contents to verify
        brackets.fs.readFile(baseDir + "write_test.txt", "utf8", function(err, data) {
          expect(err).toBeFalsy();
          expect(data).toBe(contents);
        });
      });
    });
    
    it ("should return an error if the file can't be written", function() {
      brackets.fs.writeFile(baseDir + "cant_write_here/write_test.txt", contents, "utf8", function(err) {
        expect(err).toBe(brackets.fs.ERR_CANT_WRITE);
      });
    });
    
    it ("should return an error if called with invalid parameters", function() {
      brackets.fs.writeFile(42, contents, 2, function(err) {
        expect(err).toBe(brackets.fs.ERR_INVALID_PARAMS);
      });
    });
  }); // describe("writeFile")
});
