var ByteCounter = require('../');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

var counter = new ByteCounter();
var remainingTests = 2;
counter.once('progress', function() {
  assert.strictEqual(counter.bytes, 5);
  remainingTests -= 1;
});
var is = fs.createReadStream(path.join(__dirname, 'test.txt'));
is.pipe(counter);
is.on('end', function() {
  remainingTests -= 1;
  assert.strictEqual(counter.bytes, 5);
});
process.on('exit', function() {
  assert.strictEqual(remainingTests, 0);
});
