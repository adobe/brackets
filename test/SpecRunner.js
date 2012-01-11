// Set the baseUrl to brackets/src
require.config({
    baseUrl: "../src"
});

define(function(require, exports, module) {
    // Utility dependency
    require("spec/SpecRunnerUtils.js");

    // FIXME (jasonsj): PreferencesManager mock persistent storage

    // Load test specs
    require("spec/Editor-test.js");
    require("spec/NativeFileSystem-test.js");
    require("spec/LowLevelFileIO-test.js");
    require("spec/ProjectManager-test.js");
    require("spec/FileCommandHandlers-test.js");
    require("spec/PreferencesManager-test.js");
});