define(["require", "exports", "module", "test","a/b/c/d"], function(require, exports, module) {
var test = require('test');
test.assert(require('a/b/c/d').foo() == 1, 'nested module identifier');
test.print('DONE', 'info');

});
