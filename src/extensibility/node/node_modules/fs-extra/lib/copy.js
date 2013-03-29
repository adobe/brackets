var fs = require('fs')
  , ncp = require('ncp').ncp;

var BUF_LENGTH = 64 * 1024;
var _buff = new Buffer(BUF_LENGTH);

var copyFileSync = function(srcFile, destFile) {
  var bytesRead, fdr, fdw, pos;
  fdr = fs.openSync(srcFile, 'r');
  fdw = fs.openSync(destFile, 'w');
  bytesRead = 1;
  pos = 0;
  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
    fs.writeSync(fdw, _buff, 0, bytesRead);
    pos += bytesRead;
  }
  fs.closeSync(fdr);
  return fs.closeSync(fdw);
};

var copyFile = function(srcFile, destFile, cb) {
  var fdr, fdw;
  fdr = fs.createReadStream(srcFile);
  fdw = fs.createWriteStream(destFile);
  fdr.on('end', function() {
    return cb(null);
  });
  return fdr.pipe(fdw);
};

function copy(source, dest, callback) {
    if (callback)
      ncp(source, dest, callback);
    else 
      ncp(source, dest, function(){});
};


module.exports.copyFileSync = copyFileSync;
module.exports.copyFile = copyFile;
module.exports.copy = copy;