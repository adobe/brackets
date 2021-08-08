define(["require", "exports", "module", "system"], function(require, exports, module) {

exports.print = function () {
    var system = require("system");
    var stdio = system.stdio;
    stdio.print.apply(stdio, arguments);
};

exports.assert = function (guard, message) {
    if (guard) {
        console.log('PASS ' + message, 'pass');
    } else {
        console.error('FAIL ' + message, 'fail');
    }
};


});
