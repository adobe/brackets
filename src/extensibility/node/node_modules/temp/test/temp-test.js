var assert = require('assert');
var path = require('path');
var fs = require('fs');
var util = require('util');

var temp = require('../lib/temp');
temp.track();

var existsSync = function(path){
  try {
    fs.statSync(path);
    return true;
  } catch (e){
    return false;
  }
};

// Use path.exists for 0.6 if necessary
var safeExists = fs.exists || path.exists;

var mkdirFired = false;
var mkdirPath = null;
temp.mkdir('foo', function(err, tpath) {
  mkdirFired = true;
  assert.ok(!err, "temp.mkdir did not execute without errors");
  assert.ok(path.basename(tpath).slice(0, 3) == 'foo', 'temp.mkdir did not use the prefix');
  assert.ok(existsSync(tpath), 'temp.mkdir did not create the directory');

  fs.writeFileSync(path.join(tpath, 'a file'), 'a content');
  temp.cleanup();
  assert.ok(!existsSync(tpath), 'temp.cleanup did not remove the directory');

  mkdirPath = tpath;
});

var openFired = false;
var openPath = null;
temp.open('bar', function(err, info) {
  openFired = true;
  assert.equal('object', typeof(info), "temp.open did not invoke the callback with the err and info object");
  assert.equal('number', typeof(info.fd), 'temp.open did not invoke the callback with an fd');
  fs.writeSync(info.fd, 'foo');
  fs.closeSync(info.fd);
  assert.equal('string', typeof(info.path), 'temp.open did not invoke the callback with a path');
  assert.ok(existsSync(info.path), 'temp.open did not create a file');

  temp.cleanup();
  assert.ok(!existsSync(info.path), 'temp.cleanup did not remove the file');

  openPath = info.path;
});


var stream = temp.createWriteStream('baz');
assert.ok(stream instanceof fs.WriteStream, "temp.createWriteStream did not invoke the callback with the err and stream object");
stream.write('foo');
stream.end("More text here\nand more...");
assert.ok(existsSync(stream.path), 'temp.createWriteStream did not create a file');

console.log(temp.cleanup());
assert.ok(!existsSync(stream.path), 'temp.cleanup did not remove the createWriteStream file');

var tempPath = temp.path();
assert.ok(path.dirname(tempPath) === temp.dir, "temp.path does not work in default os temporary directory");

tempPath = temp.path({dir: process.cwd()});
assert.ok(path.dirname(tempPath) === process.cwd(), "temp.path does not work in user-provided temporary directory");

for (var i=0; i <= 10; i++) {
  temp.openSync();
};
assert.equal(process.listeners('exit').length, 1, 'temp created more than one listener for exit');

process.addListener('exit', function() {
  assert.ok(mkdirFired, "temp.mkdir callback did not fire");
  assert.ok(openFired, "temp.open callback did not fire");
});
