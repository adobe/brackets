define(function (require, exports) {

    exports.name = 'alpha';
    exports.getGreekName = function () {
        return require('.').name;
    };
});
