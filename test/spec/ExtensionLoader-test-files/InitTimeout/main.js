/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    exports.initExtension = function () {
        // promise is never resolved, expect default Async timeout
        return new $.Deferred();
    };
});