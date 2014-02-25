/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

/*global define, console */

/**
 *  Utilities functions to display deprecation warning in the console.
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    var displayedWarnings = {};

    /**
     * Trim the stack so that it does not have the call to this module,
     * and all the calls to require.js to load the extension that shows 
     * this deprecation warning.
     */
    function _trimStack(stack) {
        var indexOfFirstRequireJSline;
        
        // Remove everything in the stack up to the end of the line that shows this module file path
        stack = stack.substr(stack.indexOf(")\n") + 2);
        
        // Find the very first line of require.js in the stack if the call is from an extension.
        // Remove all those lines from the call stack.
        indexOfFirstRequireJSline = stack.indexOf("requirejs/require.js");
        if (indexOfFirstRequireJSline !== -1) {
            indexOfFirstRequireJSline = stack.lastIndexOf(")", indexOfFirstRequireJSline) + 1;
            stack = stack.substr(0, indexOfFirstRequireJSline);
        }
        
        return stack;
    }
    
    /**
     * Show deprecation message with the call stack if it 
     * has never been displayed before.
     * @param {!string} message The deprecation message to be displayed.
     */
    function deprecationWarning(message) {
        // If we have displayed this message before, then don't 
        // show it again.
        if (!message || displayedWarnings[message]) {
            return;
        }

        console.warn(message + "\n" + _trimStack(new Error().stack));
        displayedWarnings[message] = true;
    }

    // Define public API
    exports.deprecationWarning = deprecationWarning;
});
