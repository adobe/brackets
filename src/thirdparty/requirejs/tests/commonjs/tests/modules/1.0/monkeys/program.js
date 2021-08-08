define(["require", "exports", "module", "a","test"], function(require, exports, module) {
var a = require('a');
var test = require('test');
test.assert(exports.monkey == 10, 'monkeys permitted');
test.print('DONE', 'info');

});
