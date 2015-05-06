/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var app = require("./app");
var fs = require("fs-extra");
var fsAdditions = require("./fs-additions");

module.exports = {
    app: app,
    fs: _.extend({}, fs, fsAdditions)
};
