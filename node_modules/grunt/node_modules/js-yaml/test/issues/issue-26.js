'use strict';


require('../../lib/js-yaml');


var Assert = require('assert');
var source = __dirname + '/data/issue-26.yml';


module.exports = require('../helper').issue({
  title: "#26: should convert new line into white space",
  fixed: true,
  test: function () {
    var doc = require(source);
    Assert.equal(doc.test, 'a b c\n');
  }
});
