'use strict';


require('../../lib/js-yaml');


var Assert = require('assert');
var source = __dirname + '/data/issue-46.yml';


module.exports = require('../helper').issue({
  title: "#46: Timestamps are incorrectly parsed in local time",
  fixed: true,
  test: function () {
    var data = require(source);

    var d1 = data.date1; // date1: 2010-10-20T20:45:00Z
    Assert.equal(d1.getUTCFullYear(), 2010, 'year');
    Assert.equal(d1.getUTCMonth(), 9, 'month');
    Assert.equal(d1.getUTCDate(), 20, 'date');
    Assert.equal(d1.getUTCHours(), 20);
    Assert.equal(d1.getUTCMinutes(), 45);
    Assert.equal(d1.getUTCSeconds(), 0);

    var d2 = data.date2; // date2: 2010-10-20T20:45:00+0100
    Assert.equal(d2.getUTCFullYear(), 2010, 'year');
    Assert.equal(d2.getUTCMonth(), 9, 'month');
    Assert.equal(d2.getUTCDate(), 20, 'date');
    Assert.equal(d2.getUTCHours(), 19);
    Assert.equal(d2.getUTCMinutes(), 45);
    Assert.equal(d2.getUTCSeconds(), 0);
  }
});
