var crypto = require('crypto')
  , fs = require('../lib')
  , path = require('path')
  , testutil = require('testutil')
  , mkdir = require('mkdirp');

var DIR = '';

  buildDir = function() { //shit function that should be deleted
    var baseDir, buf, bytesWritten, ex, subDir;
    buf = new Buffer(5);
    bytesWritten = 0;
    while (bytesWritten < buf.length) {
      buf[bytesWritten] = Math.floor(Math.random() * 256);
      bytesWritten += 1;
    }
    ex = Date.now();
    baseDir = path.join(DIR, "TEST_fs-extra_rmrf-" + ex);
    fs.mkdirSync(baseDir);
    fs.writeFileSync(path.join(baseDir, Math.random() + ''), buf);
    fs.writeFileSync(path.join(baseDir, Math.random() + ''), buf);
    subDir = path.join(DIR, Math.random() + '');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, Math.random() + ''));
    return baseDir;
  };

describe('fs-extra', function() {
  beforeEach(function() {
    DIR = testutil.createTestDir('fs-extra');
  })

  afterEach(function(done) {
    if (fs.existsSync(DIR)) {
      fs.remove(DIR, done);
    } else {
      done();
    }
  })

  describe('+ removeSync()', function() {
    it('should delete directories and files synchronously', function() {
      T (fs.existsSync(DIR));
      fs.removeSync(DIR);
      F (fs.existsSync(DIR));
    })

    it('should delete an empty directory synchronously', function() {
      T (fs.existsSync(DIR));
      fs.removeSync(DIR);
      F (fs.existsSync(DIR));
    })

    it('should delete a file synchronously', function() {
      var file = testutil.createFileWithData(path.join(DIR, 'file'), 4);
      T (fs.existsSync(file));
      fs.removeSync(file);
    })
  })

  describe('+ remove()', function() {
    it('should delete an empty directory', function(done) {
      T (fs.existsSync(DIR));
      fs.remove(DIR, function(err) {
        T (err === null);
        F (fs.existsSync(DIR));
        done();
      })
    })

    it('should delete a directory full of directories and files', function(done) {
      var dir = buildDir();
      T(fs.existsSync(DIR));
      return fs.remove(DIR, function(err) {
        T(err === null);
        F(fs.existsSync(DIR));
        return done();
      });
    });
    it('should delete a file', function(done) {
      var file = testutil.createFileWithData(path.join(DIR, 'file'), 4);
      
      T (fs.existsSync(file));
      fs.remove(file, function(err) {
        T (err === null);
        F (fs.existsSync(file));
        done();
      });
    })

    it('should delete without a callback', function(done) {
      var file = testutil.createFileWithData(path.join(DIR, 'file'), 4);
      T (fs.existsSync(file));
      var existsChecker = setInterval(function() {
        fs.exists(file, function(itDoes) {
          if (!itDoes) {
            clearInterval(existsChecker);
            done();
          }
        });
      }, 25);
      fs.remove(file);
    })
  })

  describe('+ delete()', function() {
    it('should delete an empty directory', function(done) {
      T (fs.existsSync(DIR));
      fs["delete"](DIR, function(err) {
        T (err === null);
        F (fs.existsSync(DIR));
        done();
      })
    })
  })

  describe('+ deleteSync()', function() {
    it('should delete directories and files synchronously', function() {
      T (fs.existsSync(DIR));
      fs.deleteSync(DIR);
      F (fs.existsSync(DIR));
    })
  })

})


