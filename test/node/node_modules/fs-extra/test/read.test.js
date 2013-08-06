var fs = require('../lib')
  , testutil = require('testutil')
  , path = require('path');

var DIR = '';

describe('fs-extra', function() {
  beforeEach(function() {
    DIR = testutil.createTestDir('fs-extra')
  })

  afterEach(function(done) {
    fs.remove(DIR, done);
  })

  describe('+ readJSON', function() {
    it('should read a file and parse the json', function(done) {
      var obj1 = {
        firstName: 'JP',
        lastName: 'Richardson'
      };
      var file = path.join(DIR, 'file.json');
      
      fs.writeFileSync(file, JSON.stringify(obj1));
      
      fs.readJSON(file, function(err, obj2) {
        F (err != null);
        T (obj1.firstName === obj2.firstName);
        T (obj1.lastName === obj2.lastName);
        
        done();
      })
    })

    it('should error if it cant parse the json', function(done) {
      var file = path.join(DIR, 'file2.json');
      fs.writeFileSync(file, '%asdfasdff444');
      fs.readJSON(file, function(err, obj) {
        T (err != null);
        F (obj);
        done();
      })
    })
  })

  /*(describe('+ readTextFile', function() {
    it('should read the text file', function(done) {
      var file = path.join(DIR, 'readtext.txt')
      fs.writeFileSync(file, "hello")
      fs.readTextFile(file, function(err, data) {
        if (err) return done(err)
        EQ (data, 'hello')
        done()
      })
    })
  })

  describe('+ readTextFileSync', function() {
    it('should read the text file', function() {
      var file = path.join(DIR, 'readtext.txt')
      fs.writeFileSync(file, "hello")
      var data = fs.readTextFileSync(file)
      EQ (data, 'hello')
    })
  })*/
})


