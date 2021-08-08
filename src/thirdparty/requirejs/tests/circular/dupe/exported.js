define(function(require, exports) {
    exports.makeMessage = function (title) {
        return 'hello ' + title + ' ' + require('func').suffix;
    };

    exports.justSuffix = function() {
        return require('func').suffix;
    };
});