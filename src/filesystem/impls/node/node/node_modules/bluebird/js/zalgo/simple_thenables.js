/**
 * Copyright (c) 2013 Petka Antonov
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
 */
"use strict";
module.exports = function( Promise ) {
    var util = require( "./util.js" );
    var isPrimitive = util.isPrimitive;
    var async = require( "./async.js" );
    var errorObj = util.errorObj;
    var isObject = util.isObject;
    var tryCatch2 = util.tryCatch2;


    function doThenable( obj, caller ) {
        var resolver = Promise.pending( caller );
        var called = false;
        var ret = tryCatch2( obj.then, obj, function( x ) {
            if( called ) return;
            called = true;
            resolver.fulfill( x );
        }, function( e ) {
            if( called ) return;
            called = true;
            resolver.reject( e );
        });
        if( ret === errorObj && !called ) {
            called = true;
            resolver.reject( ret.e );
        }
        return resolver.promise;
    }

    Promise._couldBeThenable = function( ret ) {
        if( isPrimitive( ret ) ) {
            return false;
        }
        return ("then" in ret);
    };

    function Promise$_Cast( obj, caller ) {
        if( isObject( obj ) ) {
            if( obj instanceof Promise ) {
                return obj;
            }
            else if( typeof obj.then === "function") {
                caller = typeof caller === "function" ? caller : Promise$_Cast;
                return doThenable( obj, caller );
            }
        }
        return obj;
    }

    Promise.prototype._tryThenable = function Promise$_tryThenable( x ) {
        if( typeof x.then !== "function" ) {
            return false;
        }
        this._resolveThenable( x );
        return true;
    };

    Promise.prototype._resolveThenable =
    function Promise$_resolveThenable( x ) {
        var self = this;
        var called = false;

        var ret = tryCatch2(x.then, x, function( x ) {
            if( called ) return;
            called = true;
            self._fulfill(x);
        }, function( e ) {
            if( called ) return;
            called = true;
            self._reject(e);
        });
        if( ret === errorObj && !called ) {
            called = true;
            this._attachExtraTrace( ret.e );
            this._reject( ret.e );
        }
    };

    Promise._cast = Promise$_Cast;
};

