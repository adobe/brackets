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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

/**
 * Initializes the global "brackets" variable and it's properties.
 * Modules should not access the global.brackets object until either
 * (a) the module requires this module, i.e. require("utils/Global") or
 * (b) the module receives a "ready" callback from the utils/AppReady module.
 */
define(function (require, exports, module) {
    "use strict";
    
    var packageJSON = require("text!package.json");
    
    // Define core brackets namespace if it isn't already defined
    //
    // We can't simply do 'brackets = {}' to define it in the global namespace because
    // we're in "use strict" mode. Most likely, 'window' will always point to the global
    // object when this code is running. However, in case it isn't (e.g. if we're running 
    // inside Node for CI testing) we use this trick to get the global object.
    //
    // Taken from:
    //   http://stackoverflow.com/questions/3277182/how-to-get-the-global-object-in-javascript
    var Fn = Function, global = (new Fn("return this"))();
    if (!global.brackets) {
        global.brackets = {};
    }
    
    // Parse src/config.json
    try {
        global.brackets.metadata = JSON.parse(packageJSON);
        global.brackets.config = global.brackets.metadata.config;
    } catch (err) {
        console.log(err);
    }
        
    // Uncomment the following line to force all low level file i/o routines to complete
    // asynchronously. This should only be done for testing/debugging.
    // NOTE: Make sure this line is commented out again before committing!
    //brackets.forceAsyncCallbacks = true;

    // Load native shell when brackets is run in a native shell rather than the browser
    // TODO: (issue #266) load conditionally
    global.brackets.shellAPI = require("utils/ShellAPI");
    
    global.brackets.inBrowser = !global.brackets.hasOwnProperty("fs");
    
    global.brackets.platform = (global.navigator.platform === "MacIntel" || global.navigator.platform === "MacPPC") ? "mac" : "win";
    
    // Loading extensions requires creating new require.js contexts, which
    // requires access to the global 'require' object that always gets hidden
    // by the 'require' in the AMD wrapper. We store this in the brackets
    // object here so that the ExtensionLoader doesn't have to have access to
    // the global object.
    global.brackets.libRequire = global.require;

    // Also store our current require.js context (the one that loads brackets
    // core modules) so that extensions can use it.
    // Note: we change the name to "getModule" because this won't do exactly
    // the same thing as 'require' in AMD-wrapped modules. The extension will
    // only be able to load modules that have already been loaded once.
    global.brackets.getModule = require;
    
    exports.global = global;
});