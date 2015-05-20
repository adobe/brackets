/**
 * QUnit testing dropin with the slowparse qunit tests
 */
var Slowparse = require("./slowparse.js"),
    window = {},
    jsdom = require("jsdom").jsdom,
    document = jsdom("<!doctype html><html><head></head><body></body></html>"),
    validators = require("./test/node/qunit-shim.js")(Slowparse, jsdom);

console.log("Testing Slowparse library:");
var failureCount = require("./test/test-slowparse.js")(Slowparse, window, document, validators);
if (failureCount > 0) { console.log(failureCount + " tests failed."); }

process.exit(failureCount);
