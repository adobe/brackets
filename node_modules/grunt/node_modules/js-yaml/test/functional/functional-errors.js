'use strict';


var Assert = require('assert');
var Fs = require('fs');
var JsYaml = require('../../lib/js-yaml');
var YAMLError = require('../../lib/js-yaml/errors').YAMLError;
var Helper = require('../helper');


module.exports = {
  "Test errors loading all documents from file resource": Helper.functional({
    dirname: __dirname + '/data',
    files: ['.loader-error'],
    test: function (errorFilename) {
      Assert.throws(function () {
        var fd = Fs.openSync(errorFilename, 'r');
        JsYaml.loadAll(fd, function () {});
        Fs.closeSync(fd);
      }, YAMLError);
    }
  }),

  "Test errors loading all documents from the string": Helper.functional({
    dirname: __dirname + '/data',
    files: ['.loader-error'],
    test: function (errorFilename) {
      Assert.throws(function () {
        var str = Fs.readFileSync(errorFilename, 'utf8');
        JsYaml.loadAll(str, function () {});
      }, YAMLError);
    }
  }),

  "Test errors loading single documents from the string": Helper.functional({
    dirname: __dirname + '/data',
    files: ['.single-loader-error'],
    test: function (errorFilename) {
      Assert.throws(function () {
        JsYaml.load(Fs.readFileSync(errorFilename, 'utf8'));
      }, YAMLError);
    }
  })
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
