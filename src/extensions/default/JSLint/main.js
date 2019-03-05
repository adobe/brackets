/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*property
    DESCRIPTION_JSLINT_OPTIONS, DESCRIPTION_JSLINT_OPTIONS_ASS,
    DESCRIPTION_JSLINT_OPTIONS_BITWISE, DESCRIPTION_JSLINT_OPTIONS_BROWSER,
    DESCRIPTION_JSLINT_OPTIONS_CLOSURE, DESCRIPTION_JSLINT_OPTIONS_CONTINUE,
    DESCRIPTION_JSLINT_OPTIONS_COUCH, DESCRIPTION_JSLINT_OPTIONS_DEBUG,
    DESCRIPTION_JSLINT_OPTIONS_DEVEL, DESCRIPTION_JSLINT_OPTIONS_EQEQ,
    DESCRIPTION_JSLINT_OPTIONS_ES6, DESCRIPTION_JSLINT_OPTIONS_EVIL,
    DESCRIPTION_JSLINT_OPTIONS_FORIN, DESCRIPTION_JSLINT_OPTIONS_INDENT,
    DESCRIPTION_JSLINT_OPTIONS_MAXERR, DESCRIPTION_JSLINT_OPTIONS_MAXLEN,
    DESCRIPTION_JSLINT_OPTIONS_NEWCAP, DESCRIPTION_JSLINT_OPTIONS_NODE,
    DESCRIPTION_JSLINT_OPTIONS_NOMEN, DESCRIPTION_JSLINT_OPTIONS_PASSFAIL,
    DESCRIPTION_JSLINT_OPTIONS_PLUSPLUS, DESCRIPTION_JSLINT_OPTIONS_REGEXP,
    DESCRIPTION_JSLINT_OPTIONS_RHINO, DESCRIPTION_JSLINT_OPTIONS_SLOPPY,
    DESCRIPTION_JSLINT_OPTIONS_STUPID, DESCRIPTION_JSLINT_OPTIONS_SUB,
    DESCRIPTION_JSLINT_OPTIONS_TODO, DESCRIPTION_JSLINT_OPTIONS_UNPARAM,
    DESCRIPTION_JSLINT_OPTIONS_VARS, DESCRIPTION_JSLINT_OPTIONS_WHITE, Editor,
    JSLINT_NAME, Type, WARNING, ass, bitwise, browser, ch, clone, closure,
    column, continue, couch, debug, definePreference, description, devel, eqeq,
    errors, es6, evil, forin, get, getExtensionPrefs, getModule, getSpaceUnits,
    getTabSize, getUseTabChar, indent, initial, isEqual, keys, line, log, map,
    maxerr, maxlen, message, name, newcap, node, nomen, ok, on, passfail,
    plusplus, pos, predef, regexp, register, replace, requestRun, rhino,
    scanFile, sloppy, some, stop, stupid, sub, todo, type, unparam, vars,
    warnings, white
*/

/**
 * Provides JSLint results via the core linting extension point
 */
define(function (require, exports, module) {
    "use strict";

    // Load JSLint, a non-module lib
    // this will be added as a global
    require("thirdparty/jslint/jslint");

    // Load dependent modules
    var CodeInspection     = brackets.getModule("language/CodeInspection"),
        Editor             = brackets.getModule("editor/Editor").Editor,
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

    // The current list is available from http://jslint.com/help.html
    // - bitwise
    // - browser
    // - convert
    // - couch
    // - devel
    // - eval
    // - for
    // - fudge
    // - getset
    // - maxerr
    // - maxlen
    // - multivar
    // - node
    // - single
    // - this
    // - white
    prefs.definePreference("options", "object", undefined, {
        description: Strings.DESCRIPTION_JSLINT_OPTIONS,
        keys: {
            ass: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_ASS,
                initial: false
            },
            bitwise: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_BITWISE,
                initial: false
            },
            browser: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_BROWSER,
                initial: false
            },
            closure: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_CLOSURE,
                initial: false
            },
            "continue": {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_CONTINUE,
                initial: false
            },
            couch: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_COUCH,
                initial: false
            },
            debug: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_DEBUG,
                initial: false
            },
            devel: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_DEVEL,
                initial: false
            },
            eqeq: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_EQEQ,
                initial: false
            },
            es6: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_ES6,
                initial: false
            },
            evil: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_EVIL,
                initial: false
            },
            forin: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_FORIN,
                initial: false
            },
            indent: {
                type: "number",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_INDENT
            },
            maxerr: {
                type: "number",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_MAXERR
            },
            maxlen: {
                type: "number",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_MAXLEN
            },
            newcap: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_NEWCAP,
                initial: false
            },
            node: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_NODE,
                initial: false
            },
            nomen: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_NOMEN,
                initial: false
            },
            passfail: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_PASSFAIL,
                initial: false
            },
            plusplus: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_PLUSPLUS,
                initial: false
            },
            regexp: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_REGEXP,
                initial: false
            },
            rhino: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_RHINO,
                initial: false
            },
            sloppy: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_SLOPPY,
                initial: false
            },
            stupid: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_STUPID,
                initial: false
            },
            sub: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_SUB,
                initial: false
            },
            todo: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_TODO,
                initial: false
            },
            unparam: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_UNPARAM,
                initial: false
            },
            vars: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_VARS,
                initial: false
            },
            white: {
                type: "boolean",
                description: Strings.DESCRIPTION_JSLINT_OPTIONS_WHITE,
                initial: false
            }
        }
    })
        .on("change", function (e, data) {
            var options = prefs.get("options");
            if (!_.isEqual(options, _lastRunOptions)) {
                CodeInspection.requestRun(Strings.JSLINT_NAME);
            }
        });

    // Predefined environments understood by JSLint.
    var ENVIRONMENTS = ["browser", "node", "couch", "rhino"];

    // gets indentation size depending whether the tabs or spaces are used
    function _getIndentSize(fullPath) {
        return Editor.getUseTabChar(fullPath) ? Editor.getTabSize(fullPath) : Editor.getSpaceUnits(fullPath);
    }

    /**
     * Run JSLint on the current document. Reports results to the main UI. Displays
     * a gold star when no errors are found.
     */
    function lintOneFile(text, fullPath) {
        // If a line contains only whitespace (here spaces or tabs), remove the whitespace
        text = text.replace(/^[\u0020\t]+$/gm, "");

        var options = prefs.get("options");

        _lastRunOptions = _.clone(options);

        if (!options) {
            options = {};
        } else {
            options = _.clone(options);
        }

        if (!options.indent) {
            // default to using the same indentation value that the editor is using
            options.indent = _getIndentSize(fullPath);
        }

        // If the user has not defined the environment, we use browser by default.
        var hasEnvironment = _.some(ENVIRONMENTS, function (env) {
            return options[env] !== undefined;
        });

        if (!hasEnvironment) {
            options.browser = true;
        }

        // TODO(Ingo): die Options werden nicht beachtet
        var jslintResult = jslint(text, options, options.predef);
        console.log(jslintResult);

        if (!jslintResult.ok) {
            // Remove any trailing null placeholder (early-abort indicator)
            //var errors = JSLINT.errors.filter(function (err) { return err !== null; });

            var errors = jslintResult.warnings.map(function (jslintError) {
                return {
                    // JSLint returns 1-based line/col numbers
//                    pos: { line: jslintError.line - 1, ch: jslintError.character - 1 },
                    pos: { line: jslintError.line, ch: jslintError.column },
                    message: jslintError.message,
                    type: CodeInspection.Type.WARNING
                };
            });

            var result = { errors: errors };

            // TODO(Ingo) wann ist das mal false?
            if (jslintResult.stop) {
//                result.aborted = true;
            }

            // If array terminated in a null it means there was a stop notice
//            if (errors.length !== JSLINT.errors.length) {
//                result.aborted = true;
//                errors[errors.length - 1].type = CodeInspection.Type.META;
//            }

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
