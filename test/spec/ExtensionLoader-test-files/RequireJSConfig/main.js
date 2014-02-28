/*global define */

define(function (require, exports, module) {
    "use strict";
    
    // aliased to bar
    var foo = require("foo");
    
    // print "bar_exported"
    console.log(foo.bar);
});