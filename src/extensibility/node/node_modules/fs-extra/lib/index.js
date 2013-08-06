var fs = require('fs')
  , path = require('path')
  , jsonFile = require('jsonfile')
  , fse = {};

for (var funcName in fs) {
    var func = fs[funcName];
    if (fs.hasOwnProperty(funcName)) {
        if (typeof func == 'function')
            fse[funcName] = func;
    }
}

fs = fse;

// copy

fs.copy = require('./copy').copy;

// remove

var remove = require('./remove');
fs.remove = remove.remove;
fs.removeSync = remove.removeSync;
fs['delete'] = fs.remove
fs.deleteSync = fs.removeSync

// mkdir

var mkdir = require('./mkdir')
fs.mkdirs = mkdir.mkdirs
fs.mkdirsSync = mkdir.mkdirsSync
fs.mkdirp = mkdir.mkdirs
fs.mkdirpSync = mkdir.mkdirsSync

// create

var create = require('./create')
fs.createFile = create.createFile;
fs.createFileSync = create.createFileSync;

//deprecated
fs.touch = function touch() {
  console.log('fs.touch() is deprecated. Please use fs.createFile().')
  fs.createFile.apply(null, arguments)
}

fs.touchSync = function touchSync() {
  console.log('fs.touchSync() is deprecated. Please use fs.createFileSync().')
  fs.createFileSync.apply(null, arguments)
}

// output

var output = require('./output');
fs.outputFile = output.outputFile;
fs.outputFileSync = output.outputFileSync;

// read

/*fs.readTextFile = function(file, callback) {
  return fs.readFile(file, 'utf8', callback)
}

fs.readTextFileSync = function(file, callback) {
  return fs.readFileSync(file, 'utf8')
}*/

// json files

fs.readJsonFile = jsonFile.readFile;
fs.readJSONFile = jsonFile.readFile;
fs.readJsonFileSync = jsonFile.readFileSync;
fs.readJSONFileSync = jsonFile.readFileSync;

fs.readJson = jsonFile.readFile;
fs.readJSON = jsonFile.readFile;
fs.readJsonSync = jsonFile.readFileSync;
fs.readJSONSync = jsonFile.readFileSync;

fs.writeJsonFile = jsonFile.writeFile;
fs.writeJSONFile = jsonFile.writeFile;
fs.writeJsonFileSync = jsonFile.writeFileSync;
fs.writeJSONFileSync = jsonFile.writeFileSync;

fs.writeJson = jsonFile.writeFile;
fs.writeJSON = jsonFile.writeFile;
fs.writeJsonSync = jsonFile.writeFileSync;
fs.writeJSONSync = jsonFile.writeFileSync;


//make compatible for Node v0.8
if (typeof fs.exists == 'undefined')
  fs.exists = path.exists
if  (typeof fs.existsSync == 'undefined')
  fs.existsSync = path.existsSync

module.exports = fs

jsonFile.spaces = 2; //set to 2
module.exports.jsonfile = jsonFile; //so users of fs-extra can modify jsonFile.spaces;

