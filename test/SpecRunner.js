define(function(require, exports, module) {
    // Utility dependency
    require("spec/SpecRunnerUtils");
    
    // Load test specs
    require("spec/Editor-test");
    require("spec/NativeFileSystem-test");
    require("spec/LowLevelFileIO-test");
});