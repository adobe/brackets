var testutil = require('testutil')
  , fs = require('../')
  , path = require('path')

var TEST_DIR = '';

describe('fs-extra', function () {
  beforeEach(function() {
    TEST_DIR = testutil.createTestDir('fs-extra')
  })

  describe('+ outputFile', function() {
    describe('> when the file and directory does not exist', function() {
      it('should create the file', function(done) {
        var file = path.join(TEST_DIR, Math.random() + 't-ne', Math.random() + '.txt');
        F (fs.existsSync(file));
        fs.outputFile(file, 'hi jp', function(err) {
          F (err);
          T (fs.existsSync(file));
          EQ (fs.readFileSync(file, 'utf8'), 'hi jp')
          done();
        })
      })
    })

    describe('> when the file does exist', function() {
      it('should still modify the file', function(done) {
        var file = path.join(TEST_DIR, Math.random() + 't-e', Math.random() + '.txt');
        fs.mkdirsSync(path.dirname(file))
        fs.writeFileSync(file, 'hello world');
        fs.outputFile(file, 'hello jp', function(err) {
          if (err) return done(err)
          EQ (fs.readFileSync(file, 'utf8'), 'hello jp')
          done();
        })
      })
    })
  })

  describe('+ outputFileSync', function() {
    describe('> when the file and directory does not exist', function() {
      it('should create the file', function() {
        var file = path.join(TEST_DIR, Math.random() + 'ts-ne', Math.random() + '.txt');
        F (fs.existsSync(file));
        fs.outputFileSync(file, 'hello man');
        T (fs.existsSync(file));
        EQ (fs.readFileSync(file, 'utf8'), 'hello man')
      })
    })

    describe('> when the file does exist', function() {
      it('should still modify the file', function() {
        var file = path.join(TEST_DIR, Math.random() + 'ts-e', Math.random() + '.txt');
        fs.mkdirsSync(path.dirname(file))
        fs.writeFileSync(file, 'hello world');
        fs.outputFileSync(file, 'hello man');
        EQ (fs.readFileSync(file, 'utf8'), 'hello man')
      })
    })
  })
  
})