/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    exports.init = function () {
        // promise is rejected immediately with an error
        return new $.Deferred().reject("Didn't work");
    };
});