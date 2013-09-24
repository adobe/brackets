"use strict"

var jsonFile = require('jsonfile')
  , fs = require('fs')
  , mkdir = require('./mkdir')
  , path = require('path')

var me = module.exports

me.outputJsonSync = function(file, data) {
  var dir = path.dirname(file)

  if (!fs.existsSync(dir))
    mkdir.mkdirsSync(dir)

  jsonFile.writeFileSync(file, data)
}

me.outputJson = function(file, data, callback) {
  var dir = path.dirname(file)

  fs.exists(dir, function(itDoes) {
    if (itDoes) return jsonFile.writeFile(file, data, callback)

    mkdir.mkdirs(dir, function(err) {
      if (err) return callback(err)
      jsonFile.writeFile(file, data, callback)
    })
  })
}