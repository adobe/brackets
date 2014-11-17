/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2014 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
"use strict";
module.exports = (function(){
var AssertionError = (function() {
    function AssertionError(a) {
        this.constructor$(a);
        this.message = a;
        this.name = "AssertionError";
    }
    AssertionError.prototype = new Error();
    AssertionError.prototype.constructor = AssertionError;
    AssertionError.prototype.constructor$ = Error;
    return AssertionError;
})();

function getParams(args) {
    var params = [];
    for (var i = 0; i < args.length; ++i) params.push("arg" + i);
    return params;
}

function nativeAssert(callName, args, expect) {
    try {
        var params = getParams(args);
        var constructorArgs = params;
        constructorArgs.push("return " +
                callName + "("+ params.join(",") + ");");
        var fn = Function.apply(null, constructorArgs);
        return fn.apply(null, args);
    } catch (e) {
        if (!(e instanceof SyntaxError)) {
            throw e;
        } else {
            return expect;
        }
    }
}

return function assert(boolExpr, message) {
    if (boolExpr === true) return;

    if (typeof boolExpr === "string" &&
        boolExpr.charAt(0) === "%") {
        var nativeCallName = boolExpr;
        var $_len = arguments.length;var args = new Array($_len - 2); for(var $_i = 2; $_i < $_len; ++$_i) {args[$_i - 2] = arguments[$_i];}
        if (nativeAssert(nativeCallName, args, message) === message) return;
        message = (nativeCallName + " !== " + message);
    }

    var ret = new AssertionError(message);
    if (Error.captureStackTrace) {
        Error.captureStackTrace(ret, assert);
    }
    if (console && console.error) {
        console.error(ret.stack + "");
    }
    throw ret;

};
})();
