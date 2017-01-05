/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */
define(function (require, exports, module) {
    "use strict";
    
    function Cup() {
        this.empty = true;
    }

    Cup.prototype.fill = function () {
        this.empty = false;
    };

    Cup.prototype.emptyIt = function () {
    };

    Cup.prototype.full = function () {
    };

    Cup.prototype.empty = function () {
    };

    exports.Cup = Cup;
});