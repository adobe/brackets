var fs = require('../lib')
  , path = require('path-extra')
  , testutil = require('testutil');

var TEST_DIR = ''

describe('fs-extra', function() {
  beforeEach(function() {
    TEST_DIR = testutil.createTestDir('fs-extra')
  })

  describe('+ mkdirs()', function() {
    it('should make the directory', function(done) {
      var dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random());
      
      F (fs.existsSync(dir));
      
      fs.mkdirs(dir, function(err) {
        T (err === null);
        T (fs.existsSync(dir));
        
        done();
      })
    })
    
    it('should make the entire directory path', function(done) {
      var dir = path.join(path.tempdir(), 'tmp-' + Date.now() + Math.random())
        , newDir = path.join(TEST_DIR, 'dfdf', 'ffff', 'aaa');
      
      F (fs.existsSync(dir));
      
      fs.mkdirs(newDir, function(err) {
        T (err === null);
        T (fs.existsSync(newDir));
        
        done();
      });
    })
  })
  
  describe('+ mkdirsSync()', function() {
    it('should make the directory', function(done) {
      var dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random());
      
      F (fs.existsSync(dir));
      fs.mkdirsSync(dir);
      T (fs.existsSync(dir));
      
      done();
    })

    it('should make the entire directory path', function(done) {
      var dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())
        , newDir = path.join(dir, 'dfdf', 'ffff', 'aaa');
      
      F (fs.existsSync(dir));
      fs.mkdirsSync(dir);
      T (fs.existsSync(dir));
      
      done();
    })
  })

})


