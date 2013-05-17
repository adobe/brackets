var testutil = require('testutil')
  , fs = require('../')
  , path = require('path')

var TEST_DIR = '';

describe('fs-extra', function () {
  beforeEach(function() {
    TEST_DIR = testutil.createTestDir('fs-extra');
  })

  describe('+ createFile', function() {
    describe('> when the file and directory does not exist', function() {
      it('should create the file', function(done) {
        var file = path.join(TEST_DIR, Math.random() + 't-ne', Math.random() + '.txt');
        F (fs.existsSync(file));
        fs.createFile(file, function(err) {
          F (err);
          T (fs.existsSync(file));
          done();
        })
      })
    })

    describe('> when the file does exist', function() {
      it('should not modify the file', function(done) {
        var file = path.join(TEST_DIR, Math.random() + 't-e', Math.random() + '.txt');
        fs.mkdirsSync(path.dirname(file))
        fs.writeFileSync(file, 'hello world');
        fs.createFile(file, function(err) {
          F (err);
          T (fs.readFileSync(file, 'utf8') === 'hello world');
          done();
        })
      })
    })
  })

  describe('+ createFileSync', function() {
    describe('> when the file and directory does not exist', function() {
      it('should create the file', function() {
        var file = path.join(TEST_DIR, Math.random() + 'ts-ne', Math.random() + '.txt');
        F (fs.existsSync(file));
        fs.createFileSync(file);
        T (fs.existsSync(file));
      })
    })

    describe('> when the file does exist', function() {
      it('should not modify the file', function() {
        var file = path.join(TEST_DIR, Math.random() + 'ts-e', Math.random() + '.txt');
        fs.mkdirsSync(path.dirname(file))
        fs.writeFileSync(file, 'hello world');
        fs.createFileSync(file);
        T (fs.readFileSync(file, 'utf8') === 'hello world');
      })
    })
  })
  
})