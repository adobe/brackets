/*global define, $, window */

define(function (require, exports, module) {
    "use strict";

    exports.initExtension = function () {
        var deferred = new $.Deferred();

        window.setTimeout(function () { deferred.resolve(); }, 100);

        return deferred.promise();
    };
});