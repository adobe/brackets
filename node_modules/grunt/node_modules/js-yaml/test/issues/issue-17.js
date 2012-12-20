'use strict';


require('../../lib/js-yaml');


var Assert = require('assert');
var source = __dirname + '/data/issue-17.yml';


module.exports = require('../helper').issue({
  title: "#17: Non-specific `!` tags should resolve to !!str",
  fixed: true,
  test: function () {
    var str = require(source);
    Assert.equal('string', typeof str);
  }
});
