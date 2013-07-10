/*global define, $, window */

define(function (require, exports, module) {
    "use strict";

    exports.init = function () {
        var deferred = new $.Deferred();

        window.setTimeout(function () { deferred.resolve(); }, 1000);

        return deferred.promise();
    };
});