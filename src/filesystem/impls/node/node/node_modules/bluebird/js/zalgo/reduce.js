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

    function Promise$_reducer( fulfilleds, initialValue ) {
        var fn = this;
        var receiver = void 0;
        if( typeof fn !== "function" )  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        var len = fulfilleds.length;
        var accum = void 0;
        var startIndex = 0;

        if( initialValue !== void 0 ) {
            accum = initialValue;
            startIndex = 0;
        }
        else {
            startIndex = 1;
            if( len > 0 ) {
                for( var i = 0; i < len; ++i ) {
                    if( fulfilleds[i] === void 0 &&
                        !(i in fulfilleds) ) {
                        continue;
                    }
                    accum = fulfilleds[i];
                    startIndex = i + 1;
                    break;
                }
            }
        }
        if( receiver === void 0 ) {
            for( var i = startIndex; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                accum = fn( accum, fulfilleds[i], i, len );
            }
        }
        else {
            for( var i = startIndex; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                accum = fn.call( receiver, accum, fulfilleds[i], i, len );
            }
        }
        return accum;
    }

    function Promise$_unpackReducer( fulfilleds ) {
        var fn = this.fn;
        var initialValue = this.initialValue;
        return Promise$_reducer.call( fn, fulfilleds, initialValue );
    }

    function Promise$_slowReduce(
        promises, fn, initialValue, useBound, caller ) {
        return initialValue._then( function callee( initialValue ) {
            return Promise$_Reduce(
                promises, fn, initialValue, useBound, callee );
        }, void 0, void 0, void 0, void 0, caller);
    }

    function Promise$_Reduce( promises, fn, initialValue, useBound, caller ) {
        if( typeof fn !== "function" ) {
            return apiRejection( "fn is not a function" );
        }

        if( useBound === true ) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        if( initialValue !== void 0 ) {
            if( Promise.is( initialValue ) ) {
                if( initialValue.isFulfilled() ) {
                    initialValue = initialValue._resolvedValue;
                }
                else {
                    return Promise$_slowReduce( promises,
                        fn, initialValue, useBound, caller );
                }
            }

            return Promise$_All( promises, PromiseArray, caller,
                useBound === true ? promises._boundTo : void 0 )
                .promise()
                ._then( Promise$_unpackReducer, void 0, void 0, {
                    fn: fn,
                    initialValue: initialValue
                }, void 0, Promise.reduce );
        }
        return Promise$_All( promises, PromiseArray, caller,
                useBound === true ? promises._boundTo : void 0 ).promise()
            ._then( Promise$_reducer, void 0, void 0, fn, void 0, caller );
    }


    Promise.reduce = function Promise$Reduce( promises, fn, initialValue ) {
        return Promise$_Reduce( promises, fn,
            initialValue, false, Promise.reduce);
    };

    Promise.prototype.reduce = function Promise$reduce( fn, initialValue ) {
        return Promise$_Reduce( this, fn, initialValue,
                                true, this.reduce );
    };
};
