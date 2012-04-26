/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global require: false, define: false, $: false, beforeEach: false, afterEach: false */

// Set the baseUrl to brackets/src
require.config({
    baseUrl: "../src"
});

define(function (require, exports, module) {
    'use strict';
    
    // Utility dependency
    var SpecRunnerUtils = require("spec/SpecRunnerUtils.js");

    // Load test specs
    require("spec/LowLevelFileIO-test.js");
    require("spec/DocumentCommandHandlers-test.js");
    require("spec/NativeFileSystem-test.js");
    require("spec/PreferencesManager-test.js");
    require("spec/Editor-test.js");
    require("spec/ProjectManager-test.js");
    require("spec/WorkingSetView-test.js");
    require("spec/KeyMap-test.js");
    require("spec/FileIndexManager-test.js");
    require("spec/CodeHintUtils-test.js");
    require("spec/CSSUtils-test.js");
    require("spec/InlineEditorProviders-test.js");
    require("spec/CSSInlineEditor-test.js");
    require("spec/LiveDevelopment-test.js");
    require("spec/ViewUtils-test.js");
    
    beforeEach(function () {
        // Unique key for unit testing
        localStorage.setItem("preferencesKey", SpecRunnerUtils.TEST_PREFERENCES_KEY);
    });
    
    afterEach(function () {
        // Clean up preferencesKey
        localStorage.removeItem("preferencesKey");
    });
});
