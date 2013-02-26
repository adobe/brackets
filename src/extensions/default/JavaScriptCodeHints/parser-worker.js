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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global self, importScripts, setTimeout */

/**
 * Loads a file that contains an AMD module definition using the web worker
 * importScripts global function.
 *
 * @param {string} url - the URL of the module to load
 * @return {Object} - the module imported from the aforementioned URL
 */
function require(url) {
    "use strict";

    var exports     = {},
        oldDefine   = self.define;

    /*
     * The following function is called by AMD modules when loaded with
     * importScripts. CommonJS-style modules will only pass a wrapper function
     * as a single argument; proper AMD-style modules may additionally pass an
     * array of bindings, which are ignored. In the former case, the wrapper
     * function expects require, exports and module arguments; in the latter
     * case, the wrapper function expects only an exports arguments.
     * 
     * @param {?Array.<string>} bindings - an optional list of resources 
     *      required by the module
     * @param {Function} wrapper - the function that defines the module
     */
    self.define = function (bindings, wrapper) {
        var module = { exports: exports },
            require = null;

        if (typeof bindings === "function") {
            wrapper = bindings;
        } else {
            require = module.exports;
        }

        wrapper(require, module.exports, module);
        exports = module.exports;
    };
    self.define.amd = true;
    importScripts(url);
    self.define = oldDefine;
    return exports;
}

(function () {
    "use strict";

    var Scope       = require("Scope.js"),
        HintUtils   = require("HintUtils.js"),
        esprima     = require("thirdparty/esprima/esprima.js");

    // maximum number of times a file will be reparsed before failing
    var MAX_RETRIES = 10;

    /**
     * Send a log message back from the worker to the main thread
     * 
     * @param {string} msg - the log message
     */
    function _log(msg) {
        self.postMessage({log: msg });
    }

    /**
     * Walk the scope to find all the objects of a given type, along with a
     * list of their positions in the file.
     * 
     * @param {Function} walk - the function used to walk over an implicit scope
     * @param {string} keyProp - the property of the implicit scope to walk over
     * @return {Array.<Object>} - a list of hint tokens for the implicit scope,
     *      including the positions at which they occur.
     */
    function siftPositions(walk, keyProp) {
        var occurrences,
            results = [],
            key,
            token,
            comparator = function (a, b) {
                return a - b;
            };

        occurrences = walk(function (acc, token) {
            if (Object.prototype.hasOwnProperty.call(acc, token[keyProp])) {
                acc[token[keyProp]].push(token.range[0]);
            } else {
                acc[token[keyProp]] = [token.range[0]];
            }
            return acc;
        }, {});

        for (key in occurrences) {
            if (Object.prototype.hasOwnProperty.call(occurrences, key)) {
                token = HintUtils.makeToken(key, occurrences[key].sort(comparator));
                results.push(token);
            }
        }
        return results;
    }

    /**
     * Walk the scope to compute all available association objects
     * 
     * @param {Function} walk - the function used to walk over an implicit scope
     * @return {Object} - a set of association objects: each property is a
     *      property name; each value is an association, which indicates the
     *      number of times the property occurs w.r.t. to a particular lookup
     *      context.
     */
    function siftAssociations(walk) {
        return walk(function (acc, assoc) {
            var obj     = assoc.object,
                prop    = assoc.property;
            
            if (Object.prototype.hasOwnProperty.call(acc, obj.name)) {
                if (Object.prototype.hasOwnProperty.call(acc[obj.name], prop.name)) {
                    acc[obj.name][prop.name]++;
                } else {
                    acc[obj.name][prop.name] = 1;
                }
            } else {
                acc[obj.name] = {};
                acc[obj.name][prop.name] = 1;
            }
            return acc;
        }, {});
    }

    /**
     * Parse JSLint globals annotations from an array of JavaScript comments
     * 
     * @param {Array.<string>} comments - list of JavaScript comments
     * @return {Array.<Object>} - a list of global hint objects as described by
     *      JSLint annotations found in the comments.
     */
    function extractGlobals(comments) {
        var globals = [];

        if (comments) {
            comments.forEach(function (comment) {
                if (comment.type === "Block" && comment.value) {
                    var val = comment.value;
                    if (val.indexOf("global") === 0) {
                        val.substring(7).split(",").forEach(function (global) {
                            var index = global.indexOf(":");

                            if (index >= 0) {
                                global = global.substring(0, index);
                            }
                            globals.push(HintUtils.makeToken(global.trim()));
                        });
                    } else if (val.indexOf("jslint") === 0) {
                        val.substring(7).split(",").forEach(function (ann) {
                            var index   = ann.indexOf(":"),
                                aKey    = (index >= 0) ? ann.substring(0, index).trim() : "",
                                aVal    = (index >= 0) ? ann.substring(index + 1, ann.length).trim() : "";

                            if (aVal === "true" && HintUtils.JSL_GLOBAL_DEFS.hasOwnProperty(aKey)) {
                                globals = globals.concat(HintUtils.JSL_GLOBAL_DEFS[aKey]);
                            }
                        });
                    }
                }
            });
        }
        return globals;
    }

    /**
     * Send the scope and associated parse information back to the caller.
     * Called by the parse function below. 
     * 
     * @param {string} dir - the directory name of the parsed file
     * @param {string} file - the file name of the parsed file
     * @param {number} length - the length of the parsed file
     * @param {Object} parseObj - scope and token data from the parsed file
     */
    function respond(dir, file, length, parseObj) {
        var success     = !!parseObj,
            response    = {
                type            : HintUtils.SCOPE_MSG_TYPE,
                dir             : dir,
                file            : file,
                length          : length,
                success         : success
            };

        if (success) {
            var scope           = parseObj.scope,
                globals         = parseObj.globals,
                identifiers     = siftPositions(scope.walkDownIdentifiers.bind(scope), "name"),
                properties      = siftPositions(scope.walkDownProperties.bind(scope), "name"),
                literals        = siftPositions(scope.walkDownLiterals.bind(scope), "value"),
                associations    = siftAssociations(scope.walkDownAssociations.bind(scope));

            response.scope = scope;
            response.globals = HintUtils.annotateGlobals(globals);
            response.identifiers = identifiers;
            response.properties = HintUtils.annotateWithPath(properties, dir, file);
            response.literals = HintUtils.annotateLiterals(literals, "string");
            response.associations = associations;
        }

        self.postMessage(response);
    }

    /**
     * Parse a JavaScript text with Esprima. This function is intended to be
     * called asynchronously; the respond function above is called with the 
     * results of parsing.
     * 
     * @param {string} dir - the directory name of the file to parse
     * @param {string} file - the file name of the file to parse
     * @param {string} text - the text of the file to parse
     * @param {number} retries - the number of times an unparseable text should
     *      be retried, after blanking whatever lines are causing the parsing
     *      errors.
     */
    function parse(dir, file, text, retries) {
        try {
            var ast = esprima.parse(text, {
                range       : true,
                tolerant    : true,
                comment     : true
            });

            var scope           = new Scope(ast),
                definedGlobals  = extractGlobals(ast.comments),
                builtinGlobals  = HintUtils.BUILTIN_GLOBALS,
                allGlobals      = definedGlobals.concat(builtinGlobals),
                comparator      = function (a, b) { return a.value < b.value; };

            respond(dir, file, text.length, {
                scope   : scope,
                globals : allGlobals.sort(comparator)
            });
        } catch (err) {
            // If parsing fails, we can try again after blanking out the line
            // that caused the parse error. This is unreliable though, because
            // the line number on which the parser fails is not necessarily the
            // best line to remove. Some errors will cause the entire remainder
            // of the file to be blanked out, never resulting in a parseable
            // file. Consequently, this is attempted only when necessary; i.e.,
            // when the request.force flag is set. 
            // Inspired by fuckit.js: https://github.com/mattdiamond/fuckitjs

            // _log("Parsing failed: " + err + " at " + err.index);
            if (retries > 0) {
                var lines = text.split("\n"),
                    lineno = Math.min(lines.length, err.lineNumber) - 1,
                    newline,
                    removed;

                // Blank the offending line and start over
                if (-1 < lineno < lines.length) {
                    newline = lines[lineno].replace(/./g, " ");
                    if (newline !== lines[lineno]) {
                        removed = lines.splice(lineno, 1, newline);
                        if (removed && removed.length > 0) {
                            setTimeout(function () {
                                parse(dir, file, lines.join("\n"), --retries);
                            }, 0);
                            return;
                        }
                    }
                }
            }
            respond(dir, file, text.length, null);
        }
    }
    
    self.addEventListener("message", function (e) {
        var request = e.data,
            type = request.type;

        if (type === HintUtils.SCOPE_MSG_TYPE) {
            var dir     = request.dir,
                file    = request.file,
                text    = request.text,
                retries = request.force ? MAX_RETRIES : 0;
            setTimeout(function () { parse(dir, file, text, retries); }, 0);
        } else {
            _log("Unknown message: " + JSON.stringify(request));
        }
    });
}());
