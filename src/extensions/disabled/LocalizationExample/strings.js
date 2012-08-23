
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

/**
 * This file provides the interface to user visible strings in Brackets. Code that needs
 * to display strings should should load this module by calling var Strings = require("strings").
 * The i18n plugin will dynamically load the strings for the right locale and populate
 * the exports variable. See src\nls\strings.js for the master file of English strings.
 */
define(function (require, exports, module) {
    "use strict";

    module.exports = require("i18n!nls/strings");

});