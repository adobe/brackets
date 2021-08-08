define(["module", "exports"], function(module, exports) {
    var isEqual = module.exports === exports;
    module.exports.name = 'adder';
    module.exports.isEqual = isEqual;
});
