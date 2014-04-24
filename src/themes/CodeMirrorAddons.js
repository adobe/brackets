/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function () {
    "use strict";

    var CodeMirror = require("thirdparty/CodeMirror2/lib/codemirror");

    function initAddons() {
        // Set some default value for codemirror...
        CodeMirror.defaults.highlightSelectionMatches = true;
        CodeMirror.defaults.styleSelectedText = true;
    }

    function init() {
        var deferred = $.Deferred();

        /**
        *  This is where is all starts to load up...
        */
        require([
            "thirdparty/CodeMirror2/addon/selection/mark-selection",
            "thirdparty/CodeMirror2/addon/search/match-highlighter"
        ], deferred.resolve);

        return deferred.done(initAddons).promise();
    }

    return {
        ready: init()
    };
});

