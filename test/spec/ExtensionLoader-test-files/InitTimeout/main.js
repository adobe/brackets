/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    exports.init = function () {
        // promise is never resolved, expect default Async timeout
        return new $.Deferred();
    };
});