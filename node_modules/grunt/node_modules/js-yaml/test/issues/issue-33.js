'use strict';


require('../../lib/js-yaml');


var Assert = require('assert');
var source = __dirname + '/data/issue-33.yml';


module.exports = require('../helper').issue({
  title: "#33: refactor compact variant of MarkedYAMLError.toString",
  fixed: true,
  test: function () {
    try {
      require(source);
    } catch (err) {
      Assert.equal(
        err.toString(true),
        'Error on line 1, col 12: expected <block end>, but found undefined'
      );
    }
  }
});
