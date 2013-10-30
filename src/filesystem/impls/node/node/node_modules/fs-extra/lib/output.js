"use strict"

var mkdir = require('./mkdir')
  , path = require('path')
  , fs = require('fs')
  , exists = fs.exists || path.exists
  , existsSync = fs.existsSync || path.existsSync

function outputFile (file, data, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding
    encoding = 'utf8'
  }

  var dir = path.dirname(file)
  exists(dir, function(itDoes) {
    if (itDoes) return fs.writeFile(file, data, encoding, callback)

    mkdir.mkdirs(dir, function(err) {
      if (err) return callback(err)

      fs.writeFile(file, data, encoding, callback)
    })
  })
}


function outputFileSync (file, data, encoding) {
  var dir = path.dirname(file)
  if (existsSync(dir)) return fs.writeFileSync.apply(fs, arguments)
  mkdir.mkdirsSync(dir)
  fs.writeFileSync.apply(fs, arguments)
}


module.exports.outputFile = outputFile;
module.exports.outputFileSync = outputFileSync;