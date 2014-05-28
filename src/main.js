/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/**
 * The boostrapping module for brackets. This module sets up the require 
 * configuration and loads the brackets module.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, window, brackets, navigator */

require.config({
    paths: {
        "text"              : "thirdparty/text/text",
        "i18n"              : "thirdparty/i18n/i18n",
        
        // The file system implementation. Change this value to use different 
        // implementations (e.g. cloud-based storage).
        "fileSystemImpl"    : "filesystem/impls/appshell/AppshellFileSystem",
        
        // The application shell implementation. Brackets-shell provides an
        // instance of brackets.app, it will be used and the default value
        // points to a void implementation. However, when running Brackets in a
        // different environment, use this to load your implementation. For the
        // definition of the interface, see appshell.app namespace at
        // https://github.com/adobe/brackets-shell/blob/master/appshell/appshell_extensions.js
        // Change this value to load custom implementation to run brackets in
        // something else than Brackets shell (e.g. in a browser).
        "appShellImpl"      : "shellImpl/InBrowserShell"
    }
});

if (window.location.search.indexOf("testEnvironment") > -1) {
    require.config({
        paths: {
            "preferences/PreferencesImpl": "../test/TestPreferencesImpl"
        }
    });
}

// hack for r.js optimization, move locale to another config call

// Use custom brackets property until CEF sets the correct navigator.language
// NOTE: When we change to navigator.language here, we also should change to
// navigator.language in ExtensionLoader (when making require contexts for each
// extension).
require.config({
    locale: window.localStorage.getItem("locale") || (typeof (brackets) !== "undefined" ? brackets.app.language : navigator.language)
});

define(function (require, exports, module) {
    "use strict";
    
    // Load the brackets module. This is a self-running module that loads and runs the entire application.
    require("brackets");
});
