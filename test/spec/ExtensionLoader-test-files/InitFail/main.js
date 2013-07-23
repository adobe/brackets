/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    exports.initExtension = function () {
        // promise is rejected immediately
        return new $.Deferred().reject();
    };
});