'use strict';

var grunt = require('grunt');
var jshint = require('../tasks/lib/jshint').init(grunt);

exports['jshint'] = function(test) {
  test.expect(1);
  grunt.log.muted = true;

  test.doesNotThrow(function() {
    jshint.lint(grunt.file.read('test/fixtures/lint.txt'));
  }, 'It should not blow up if an error occurs on character 0.');

  test.done();
};
