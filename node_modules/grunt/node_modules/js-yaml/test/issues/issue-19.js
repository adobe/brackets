'use strict';


require('../../lib/js-yaml');


var Assert = require('assert');
var source = __dirname + '/data/issue-19.yml';


module.exports = require('../helper').issue({
  title: "#19: Timestamp parsing is one month off",
  fixed: true,
  test: function () {
    var doc = require(source), expected = Date.UTC(2011, 11, 24);

    // JS month starts with 0 (0 => Jan, 1 => Feb, ...)
    Assert.equal(doc.xmas.getTime(), expected);
  }
});
