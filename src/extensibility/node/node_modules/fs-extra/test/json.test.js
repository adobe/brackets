"use strict"

var testutil = require('testutil')
  , fs = require('../lib')
  , path = require('path')


var TEST_DIR = null

describe('fs-extra', function() {
  beforeEach(function() {
    TEST_DIR = testutil.createTestDir('fs-extra')    
  })

  describe('+ outputJsonSync(file, data)', function() {
    it('should write the file regardless of whether the directory exists or not', function() {
      var file = path.join(TEST_DIR, 'this-dir', 'does-not', 'exist', 'file.json')
      F (fs.existsSync(file))

      var data = {name: 'JP'}
      fs.outputJsonSync(file, data)
      
      T (fs.existsSync(file))
      var newData = JSON.parse(fs.readFileSync(file, 'utf8'))

      EQ (data.name, newData.name)
    })
  })

  describe('+ outputJson(file, data)', function() {
    it('should write the file regardless of whether the directory exists or not', function(done) {
      var file = path.join(TEST_DIR, 'this-dir', 'prob-does-not', 'exist', 'file.json')
      F (fs.existsSync(file))

      var data = {name: 'JP'}
      fs.outputJson(file, data, function(err) {
        if (err) return done(err)

        T (fs.existsSync(file))
        var newData = JSON.parse(fs.readFileSync(file, 'utf8'))

        EQ (data.name, newData.name)
        done()
      })
    })
  })
})
