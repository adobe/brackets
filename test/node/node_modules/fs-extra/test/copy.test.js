var crypto = require('crypto')
  , fs = require('../lib')
  , path = require('path-extra')
  , testutil = require('testutil')
  , mkdir = require('mkdirp');

var SIZE = 16 * 64 * 1024 + 7;
var DIR = '';

describe('fs-extra', function() {
  beforeEach(function(done) {
    DIR = testutil.createTestDir('fs-extra');
    done();
  })
  
  afterEach(function(done) {
    fs.remove(DIR, done);
  })
    
  /*
    describe '+ copyFileSync()', ->
      it 'should copy synchronously', ->
        fileSrc = path.join(DIR, "TEST_fs-extra_src")
        fileDest = path.join(DIR, "TEST_fs-extra_copy")
  
        fileSrc = testutil.createFileWithData(fileSrc, SIZE)
        srcMd5 = crypto.createHash('md5').update(fs.readFileSync(fileSrc)).digest('hex')
        fs.copyFileSync(fileSrc, fileDest)
        destMd5 = crypto.createHash('md5').update(fs.readFileSync(fileDest)).digest("hex")
  
        T srcMd5 is destMd5
  */

  describe('+ copy()', function() {
      
    it('should copy the file asynchronously', function(done) {
      var fileSrc = path.join(DIR, "TEST_fs-extra_src")
        , fileDest = path.join(DIR, "TEST_fs-extra_copy")
        , fileSrc = testutil.createFileWithData(fileSrc, SIZE)
        , srcMd5 = crypto.createHash('md5').update(fs.readFileSync(fileSrc)).digest("hex")
        , destMd5 = '';
      
      fs.copy(fileSrc, fileDest, function(err) {
        destMd5 = crypto.createHash('md5').update(fs.readFileSync(fileDest)).digest("hex");
        T (srcMd5 === destMd5);
        done()
      })
    })

    it('should copy the directory asynchronously', function(done) {
      var FILES = 2
        , src = path.join(DIR, 'src')
        , dest = path.join(DIR, 'dest');
        
      mkdir(src, function(err) {
        for (var i = 0; i < FILES; ++i) 
          testutil.createFileWithData(path.join(src, i.toString()), SIZE);
        
        var subdir = path.join(src, 'subdir');
        mkdir(subdir, function(err) {
          for (var i = 0; i < FILES; ++i) 
            testutil.createFileWithData(path.join(subdir, i.toString()), SIZE);
          
          fs.copy(src, dest, function(err) {
            F (err);
            T (fs.existsSync(dest));
            
            for (var i = 0; i < FILES; ++i) 
              T (fs.existsSync(path.join(dest, i.toString())));
            
            
            var destSub = path.join(dest, 'subdir');
            for (var j = 0; j < FILES; ++j)
              T (fs.existsSync(path.join(destSub, j.toString())));
            
            done();
          })
        })
      })
    })

  })
})


