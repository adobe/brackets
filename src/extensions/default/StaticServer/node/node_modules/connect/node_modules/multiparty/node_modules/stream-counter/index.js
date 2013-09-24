module.exports = ByteCounter;

var Writable = require('readable-stream').Writable;
var util = require('util');

util.inherits(ByteCounter, Writable);
function ByteCounter(options) {
  Writable.call(this, options);
  this.bytes = 0;
}

ByteCounter.prototype._write = function(chunk, encoding, cb) {
  this.bytes += chunk.length;
  this.emit('progress');
  cb();
};
