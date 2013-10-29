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
module.exports = function( Promise, Promise$_All, PromiseArray, apiRejection ) {

    var ASSERT = require( "./assert.js" );

    function Promise$_mapper( fulfilleds ) {
        var fn = this;
        var receiver = void 0;

        if( typeof fn !== "function" )  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        var shouldDefer = false;

        if( receiver === void 0 ) {
            for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                var fulfill = fn( fulfilleds[ i ], i, len );
                if( !shouldDefer && Promise.is( fulfill ) ) {
                    if( fulfill.isFulfilled() ) {
                        fulfilleds[i] = fulfill._resolvedValue;
                        continue;
                    }
                    else {
                        shouldDefer = true;
                    }
                }
                fulfilleds[i] = fulfill;
            }
        }
        else {
            for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                var fulfill = fn.call( receiver, fulfilleds[ i ], i, len );
                if( !shouldDefer && Promise.is( fulfill ) ) {
                    if( fulfill.isFulfilled() ) {
                        fulfilleds[i] = fulfill._resolvedValue;
                        continue;
                    }
                    else {
                        shouldDefer = true;
                    }
                }
                fulfilleds[i] = fulfill;
            }
        }
        return shouldDefer
            ? Promise$_All( fulfilleds, PromiseArray,
                Promise$_mapper, void 0 ).promise()
            : fulfilleds;
    }

    function Promise$_Map( promises, fn, useBound, caller ) {
        if( typeof fn !== "function" ) {
            return apiRejection( "fn is not a function" );
        }

        if( useBound === true ) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        return Promise$_All(
            promises,
            PromiseArray,
            caller,
            useBound === true ? promises._boundTo : void 0
        ).promise()
        ._then(
            Promise$_mapper,
            void 0,
            void 0,
            fn,
            void 0,
            caller
        );
    }

    Promise.prototype.map = function Promise$map( fn ) {
        return Promise$_Map( this, fn, true, this.map );
    };

    Promise.map = function Promise$Map( promises, fn ) {
        return Promise$_Map( promises, fn, false, Promise.map );
    };
};
