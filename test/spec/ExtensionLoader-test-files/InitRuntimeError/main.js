/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    exports.initExtension = function () {
        // runtime error
        isNotDefined();

        return new $.Deferred();
    };
});