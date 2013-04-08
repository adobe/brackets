/**
* Node fs module that returns promises
*/

var fs = require("fs"),
  convertNodeAsyncFunction = require("./promise").convertNodeAsyncFunction;

// convert all the non-sync functions
for (var i in fs) {
  if (!(i.match(/Sync$/))) {
    exports[i] = convertNodeAsyncFunction(fs[i]);
  }
}

// convert the functions that don't have a declared callback
exports.writeFile = convertNodeAsyncFunction(fs.writeFile, true);
exports.readFile = convertNodeAsyncFunction(fs.readFile, true);