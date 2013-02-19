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
/*global define */

define(function (require, exports, module) {
    "use strict";

    var MODE_NAME       = "javascript",
        SCOPE_MSG_TYPE  = "outerScope",
        SINGLE_QUOTE    = "\'",
        DOUBLE_QUOTE    = "\"";

    function makeToken(value, positions) {
        positions = positions || [];

        return {
            value: value,
            positions: positions
        };
    }

    /**
     * Is the string key perhaps a valid JavaScript identifier?
     */
    function maybeIdentifier(key) {
        return (/[0-9a-z_.\$]/i).test(key) ||
            (key.indexOf(SINGLE_QUOTE) === 0) ||
            (key.indexOf(DOUBLE_QUOTE) === 0);
    }

    /**
     * Is the token's class hintable?
     */
    function hintable(token) {
        switch (token.className) {
        case "comment":
        case "number":
        case "regexp":
            return false;
        default:
            return true;
        }
    }
    
    /**
     * Divide a path into directory and filename parts
     */
    function splitPath(path) {
        var index   = path.lastIndexOf("/"),
            dir     = path.substring(0, index),
            file    = path.substring(index, path.length);
        
        return {dir: dir, file: file };
    }
    
    /*
     * Get a JS-hints-specific event name
     */
    function eventName(name) {
        var EVENT_TAG = "brackets-js-hints";
        return name + "." + EVENT_TAG;
    }

    /*
     * Annotate list of identifiers with their scope level
     */
    function annotateWithScope(identifiers, scope) {
        return identifiers.map(function (t) {
            var level = scope.contains(t.value);

            if (level >= 0) {
                t.level = level;
            } else {
                t.level = -1;
            }
            return t;
        });
    }

    /*
     * Annotate a list of properties with their association level
     */
    function annotateWithAssociation(properties, association) {
        return properties.map(function (t) {
            if (association[t.value] > 0) {
                t.level = 0;
            }
            return t;
        });
    }

    /*
     * Annotate a list of tokens as being global variables
     */
    function annotateGlobals(globals) {
        return globals.map(function (t) {
            t.global = true;
            return t;
        });
    }

    /*
     * Annotate a list of tokens as literals of a particular kind;
     * if string literals, annotate with an appropriate delimiter. 
     */
    function annotateLiterals(literals, kind) {
        return literals.map(function (t) {
            t.literal = true;
            t.kind = kind;
            if (/[\\\\]*[^\\]"/.test(t.value)) {
                t.delimeter = SINGLE_QUOTE;
            } else {
                t.delimeter = DOUBLE_QUOTE;
            }
            return t;
        });
    }

    /* 
     * Annotate a list of tokens as keywords
     */
    function annotateKeywords(keywords) {
        return keywords.map(function (t) {
            t.keyword = true;
            return t;
        });
    }

    /* 
     * Annotate a list of tokens as keywords
     */
    function annotateWithPath(tokens, dir, file) {
        var path = dir + file;

        return tokens.map(function (t) {
            t.path = path;
            return t;
        });
    }

    // TODO 1: The definitions below should be defined in a separate JSON file.
    // TODO 2: Add properties and associations for the builtin globals.

    var KEYWORD_NAMES   = [
        "break", "case", "catch", "continue", "debugger", "default", "delete",
        "do", "else", "finally", "for", "function", "if", "in", "instanceof",
        "new", "return", "switch", "this", "throw", "try", "typeof", "var",
        "void", "while", "with"
    ],
        KEYWORD_TOKENS  = KEYWORD_NAMES.map(function (t) {
            return makeToken(t, []);
        }),
        KEYWORDS        = annotateKeywords(KEYWORD_TOKENS);
    
    var LITERAL_NAMES   = [
        "true", "false", "null", "undefined"
    ],
        LITERAL_TOKENS  = LITERAL_NAMES.map(function (t) {
            return makeToken(t, []);
        }),
        LITERALS        = annotateLiterals(LITERAL_TOKENS);

    var JSL_GLOBAL_NAMES = [
        "clearInterval", "clearTimeout", "document", "event", "frames",
        "history", "Image", "location", "name", "navigator", "Option",
        "parent", "screen", "setInterval", "setTimeout", "window",
        "XMLHttpRequest", "alert", "confirm", "console", "Debug", "opera",
        "prompt", "WSH", "Buffer", "exports", "global", "module", "process",
        "querystring", "require", "__filename", "__dirname", "defineClass",
        "deserialize", "gc", "help", "load", "loadClass", "print", "quit",
        "readFile", "readUrl", "runCommand", "seal", "serialize", "spawn",
        "sync", "toint32", "version", "ActiveXObject", "CScript", "Enumerator",
        "System", "VBArray", "WScript"
    ],
        JSL_GLOBAL_TOKENS = annotateGlobals(JSL_GLOBAL_NAMES.map(function (t) {
            return makeToken(t, []);
        })),
        JSL_GLOBALS = JSL_GLOBAL_TOKENS.reduce(function (prev, curr) {
            prev[curr.value] = curr;
            return prev;
        }, {}); // builds an object from the array of tokens.

    var JSL_GLOBALS_BROWSER = [
            JSL_GLOBALS.clearInterval,
            JSL_GLOBALS.clearTimeout,
            JSL_GLOBALS.document,
            JSL_GLOBALS.event,
            JSL_GLOBALS.frames,
            JSL_GLOBALS.history,
            JSL_GLOBALS.Image,
            JSL_GLOBALS.location,
            JSL_GLOBALS.name,
            JSL_GLOBALS.navigator,
            JSL_GLOBALS.Option,
            JSL_GLOBALS.parent,
            JSL_GLOBALS.screen,
            JSL_GLOBALS.setInterval,
            JSL_GLOBALS.setTimeout,
            JSL_GLOBALS.window,
            JSL_GLOBALS.XMLHttpRequest
        ],
        JSL_GLOBALS_DEVEL = [
            JSL_GLOBALS.alert,
            JSL_GLOBALS.confirm,
            JSL_GLOBALS.console,
            JSL_GLOBALS.Debug,
            JSL_GLOBALS.opera,
            JSL_GLOBALS.prompt,
            JSL_GLOBALS.WSH
        ],
        JSL_GLOBALS_NODE = [
            JSL_GLOBALS.Buffer,
            JSL_GLOBALS.clearInterval,
            JSL_GLOBALS.clearTimeout,
            JSL_GLOBALS.console,
            JSL_GLOBALS.exports,
            JSL_GLOBALS.global,
            JSL_GLOBALS.module,
            JSL_GLOBALS.process,
            JSL_GLOBALS.querystring,
            JSL_GLOBALS.require,
            JSL_GLOBALS.setInterval,
            JSL_GLOBALS.setTimeout,
            JSL_GLOBALS.__filename,
            JSL_GLOBALS.__dirname
        ],
        JSL_GLOBALS_RHINO = [
            JSL_GLOBALS.defineClass,
            JSL_GLOBALS.deserialize,
            JSL_GLOBALS.gc,
            JSL_GLOBALS.help,
            JSL_GLOBALS.load,
            JSL_GLOBALS.loadClass,
            JSL_GLOBALS.print,
            JSL_GLOBALS.quit,
            JSL_GLOBALS.readFile,
            JSL_GLOBALS.readUrl,
            JSL_GLOBALS.runCommand,
            JSL_GLOBALS.seal,
            JSL_GLOBALS.serialize,
            JSL_GLOBALS.spawn,
            JSL_GLOBALS.sync,
            JSL_GLOBALS.toint32,
            JSL_GLOBALS.version
        ],
        JSL_GLOBALS_WINDOWS = [
            JSL_GLOBALS.ActiveXObject,
            JSL_GLOBALS.CScript,
            JSL_GLOBALS.Debug,
            JSL_GLOBALS.Enumerator,
            JSL_GLOBALS.System,
            JSL_GLOBALS.VBArray,
            JSL_GLOBALS.WScript,
            JSL_GLOBALS.WSH
        ];
    
    var JSL_GLOBAL_DEFS = {
        browser : JSL_GLOBALS_BROWSER,
        devel   : JSL_GLOBALS_DEVEL,
        node    : JSL_GLOBALS_NODE,
        rhino   : JSL_GLOBALS_RHINO,
        windows : JSL_GLOBALS_WINDOWS
    };
    
    var BUILTIN_GLOBAL_NAMES = [
        "Array", "Boolean", "Date", "Function", "Iterator", "Number", "Object",
        "RegExp", "String", "ArrayBuffer", "DataView", "Float32Array",
        "Float64Array", "Int16Array", "Int32Array", "Int8Array", "Uint16Array",
        "Uint32Array", "Uint8Array", "Uint8ClampedArray", "Error", "EvalError",
        "InternalError", "RangeError", "ReferenceError", "StopIteration",
        "SyntaxError", "TypeError", "URIError", "decodeURI",
        "decodeURIComponent", "encodeURI", "encodeURIComponent", "eval",
        "isFinite", "isNaN", "parseFloat", "parseInt", "uneval", "Infinity",
        "JSON", "Math", "NaN"
    ],
        BUILTIN_GLOBAL_TOKENS = BUILTIN_GLOBAL_NAMES.map(function (t) {
            return makeToken(t, []);
        }),
        BUILTIN_GLOBALS = annotateGlobals(BUILTIN_GLOBAL_TOKENS);

    exports.makeToken               = makeToken;
    exports.hintable                = hintable;
    exports.maybeIdentifier         = maybeIdentifier;
    exports.splitPath               = splitPath;
    exports.eventName               = eventName;
    exports.annotateWithPath        = annotateWithPath;
    exports.annotateLiterals        = annotateLiterals;
    exports.annotateGlobals         = annotateGlobals;
    exports.annotateWithScope       = annotateWithScope;
    exports.annotateWithAssociation = annotateWithAssociation;
    exports.JSL_GLOBAL_DEFS         = JSL_GLOBAL_DEFS;
    exports.BUILTIN_GLOBALS         = BUILTIN_GLOBALS;
    exports.KEYWORDS                = KEYWORDS;
    exports.LITERALS                = LITERALS;
    exports.MODE_NAME               = MODE_NAME;
    exports.SCOPE_MSG_TYPE          = SCOPE_MSG_TYPE;
    exports.SINGLE_QUOTE            = SINGLE_QUOTE;
    exports.DOUBLE_QUOTE            = DOUBLE_QUOTE;
});
