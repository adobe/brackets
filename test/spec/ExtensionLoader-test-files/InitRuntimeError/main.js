/*global define, $ */

define(function (require, exports, module) {
    "use strict";

    exports.init = function () {
        // runtime error
        isNotDefined();

        return new $.Deferred();
    };
});