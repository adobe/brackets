'use strict';


var Vows = require('vows');
var Path = require('path');
var Fs = require('fs');
var Common = require('../lib/js-yaml/common');


var Helper = module.exports = {};


Helper.suite = function suite(name, dirname, regexp) {
  var obj = Vows.describe(name);

  Fs.readdirSync(dirname).forEach(function (filename) {
    var file = Path.join(dirname, filename);

    if (Fs.statSync(file).isFile() && regexp.test(filename)) {
      obj.addBatch(require(file));
    }
  });

  return obj;
};


Helper.issue = function issue(desc) {
  var batch = {};

  batch[desc.title] = function () {
    desc.test();
    if (!desc.fixed) {
      throw {message: "Test passed, but it shouldn't!"};
    }
  };

  return batch;
};


function findTestFilenames(dataDir) {
  var filenames = {};
 
  Fs.readdirSync(dataDir).forEach(function (file) {
    var ext = Path.extname(file),
        base = Path.basename(file, ext);

    if (undefined === filenames[base]) {
      filenames[base] = [];
    }

    filenames[base].push(ext);
  });

  return filenames;
}


Helper.functional = function functional(desc) {
  var batch = {};

  Common.each(findTestFilenames(desc.dirname), function (exts, base) {
    var filenames = [], name;

    desc.files.forEach(function (ext) {
      if (0 <= exts.indexOf(ext)) {
        filenames.push(Path.join(desc.dirname, base + ext));
      }
    });

    if (filenames.length === desc.files.length) {
      name = filenames.map(function (f) {
        return Path.basename(f);
      }).join(', ');

      batch[name] = function () {
        desc.test.apply(desc.test, filenames);
      };
    }
  });

  return batch;
};
