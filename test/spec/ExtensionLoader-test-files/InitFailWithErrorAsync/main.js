/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    exports.initExtension = function () {
        var deferred = new $.Deferred();

        window.setTimeout(function () { deferred.reject("Didn't work"); }, 100);

        return deferred.promise();
    };
});