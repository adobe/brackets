"use strict"

var rimraf = require('rimraf')
  , fs = require('fs');

function rmrfSync(dir) {
    return rimraf.sync(dir);
}

function rmrf(dir, cb) {
    if (cb != null) {
        return rimraf(dir, cb);
    } else {
        return rimraf(dir, (function() {}));
    }
}

module.exports.remove = rmrf;
module.exports.removeSync = rmrfSync;
