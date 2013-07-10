/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    exports.init = function () {
        // promise is rejected immediately
        return new $.Deferred().reject();
    };
});