var testutil = require('testutil')
  , fs = require('../')
  , path = require('path')

var TEST_DIR;

describe('native fs', function() {
  beforeEach(function() {
    TEST_DIR = testutil.createTestDir('fs-extra')
  })

  it('should use native fs methods', function() {
    var file = path.join(TEST_DIR, 'write.txt')
    fs.writeFileSync(file, 'hello')
    var data = fs.readFileSync(file, 'utf8')
    EQ (data, 'hello')
  })
})