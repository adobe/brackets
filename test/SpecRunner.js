// Set the baseUrl to brackets/src
require.config({
    baseUrl: "../src"
});

define(function(require, exports, module) {
    // Utility dependency
    var SpecRunnerUtils = require("spec/SpecRunnerUtils.js");

    // Unique key for unit testing
    var PreferencesManager = require("PreferencesManager");
    PreferencesManager.setStorageKey( SpecRunnerUtils.TEST_PREFERENCES_KEY );

    // Load test specs
    require("spec/Editor-test.js");
    require("spec/NativeFileSystem-test.js");
    require("spec/LowLevelFileIO-test.js");
    require("spec/ProjectManager-test.js");
    //require("spec/WorkingSetView-test.js");
    require("spec/FileCommandHandlers-test.js");
    require("spec/PreferencesManager-test.js");

});
