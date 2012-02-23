/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global require: false, define: false, $: false */

// Set the baseUrl to brackets/src
require.config({
    baseUrl: "../src"
});

define(function (require, exports, module) {
    'use strict';
    
    // Utility dependency
    var SpecRunnerUtils = require("spec/SpecRunnerUtils.js");

    // Unique key for unit testing
    localStorage.setItem("preferencesKey", SpecRunnerUtils.TEST_PREFERENCES_KEY);

     // Load test specs
    require("spec/LowLevelFileIO-test.js");
    require("spec/FileCommandHandlers-test.js");
    require("spec/NativeFileSystem-test.js");
    require("spec/PreferencesManager-test.js");
    require("spec/Editor-test.js");
    require("spec/ProjectManager-test.js");
    require("spec/WorkingSetView-test.js");
    require("spec/KeyMap-test.js");
    require("spec/CodeHintUtils-test.js");
    require("spec/CSSManager-test.js");

    // Clean up preferencesKey
    $(window).unload(function () {
        localStorage.removeItem("preferencesKey");
    });
});
