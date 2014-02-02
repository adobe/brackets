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


/*global define, $, JSLINT, brackets */

/**
 * Provides JSLint results via the core linting extension point
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load JSLint, a non-module lib
    require("thirdparty/jslint/jslint");
    
    // Load dependent modules
    var CodeInspection     = brackets.getModule("language/CodeInspection"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        Strings            = brackets.getModule("strings"),
        _                  = brackets.getModule("thirdparty/lodash");
    
    var prefs = PreferencesManager.getExtensionPrefs("jslint");
    
    /**
     * @private
     * 
     * Used to keep track of the last options JSLint was run with to avoid running
     * again when there were no changes.
     */
    var _lastRunOptions;
    
    prefs.definePreference("options", "object")
        .on("change", function (e, data) {
            var options = prefs.get("options");
            if (!_.isEqual(options, _lastRunOptions)) {
                CodeInspection.requestRun(Strings.JSLINT_NAME);
            }
        });
    
    // Predefined environments understood by JSLint.
    var ENVIRONMENTS = ["browser", "node", "couch", "rhino"];
    
    /**
     * Run JSLint on the current document. Reports results to the main UI. Displays
     * a gold star when no errors are found.
     */
    function lintOneFile(text, fullPath) {
        // If a line contains only whitespace, remove the whitespace
        // This should be doable with a regexp: text.replace(/\r[\x20|\t]+\r/g, "\r\r");,
        // but that doesn't work.
        var i, arr = text.split("\n");
        for (i = 0; i < arr.length; i++) {
            if (!arr[i].match(/\S/)) {
                arr[i] = "";
            }
        }
        text = arr.join("\n");
        
        var options = prefs.get("options");

        if (!options) {
            options = {};
        } else {
            options = _.clone(options);
        }
        
        if (!options.indent) {
            // default to using the same indentation value that the editor is using
            options.indent = PreferencesManager.get("spaceUnits");
        }
        
        // If the user has not defined the environment, we use browser by default.
        var hasEnvironment = _.some(ENVIRONMENTS, function (env) {
            return options[env] !== undefined;
        });
        
        if (!hasEnvironment) {
            options.browser = true;
        }

        _lastRunOptions = _.clone(options);
        
        var jslintResult = JSLINT(text, options);
        
        if (!jslintResult) {
            // Remove any trailing null placeholder (early-abort indicator)
            var errors = JSLINT.errors.filter(function (err) { return err !== null; });
            
            errors = errors.map(function (jslintError) {
                return {
                    // JSLint returns 1-based line/col numbers
                    pos: { line: jslintError.line - 1, ch: jslintError.character - 1 },
                    message: jslintError.reason,
                    type: CodeInspection.Type.WARNING
                };
            });
            
            var result = { errors: errors };

            // If array terminated in a null it means there was a stop notice
            if (errors.length !== JSLINT.errors.length) {
                result.aborted = true;
                errors[errors.length - 1].type = CodeInspection.Type.META;
            }
            
            return result;
        }
        return null;
    }
    
    // Register for JS files
    CodeInspection.register("javascript", {
        name: Strings.JSLINT_NAME,
        scanFile: lintOneFile
    });
});
