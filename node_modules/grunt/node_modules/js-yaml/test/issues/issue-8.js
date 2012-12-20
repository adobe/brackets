'use strict';


require('../../lib/js-yaml');


var Assert = require('assert');
var source = __dirname + '/data/issue-8.yml';


module.exports = require('../helper').issue({
  title: "#8: Parse failed when no document start present",
  fixed: true,
  test: function () {
    Assert.doesNotThrow(function () {
      require(source);
    }, TypeError);
  }
});
