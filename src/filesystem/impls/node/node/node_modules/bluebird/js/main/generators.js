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
module.exports = function( Promise, apiRejection ) {
    var PromiseSpawn = require( "./promise_spawn.js" )(Promise);
    var errors = require( "./errors.js");
    var TypeError = errors.TypeError;

    Promise.coroutine = function Promise$Coroutine( generatorFunction ) {
        if( typeof generatorFunction !== "function" ) {
            throw new TypeError( "generatorFunction must be a function" );
        }
        var PromiseSpawn$ = PromiseSpawn;
        return function anonymous() {
            var generator = generatorFunction.apply( this, arguments );
            var spawn = new PromiseSpawn$( void 0, void 0, anonymous );
            spawn._generator = generator;
            spawn._next( void 0 );
            return spawn.promise();
        };
    };

    Promise.spawn = function Promise$Spawn( generatorFunction ) {
        if( typeof generatorFunction !== "function" ) {
            return apiRejection( "generatorFunction must be a function" );
        }
        var spawn = new PromiseSpawn( generatorFunction, this, Promise.spawn );
        var ret = spawn.promise();
        spawn._run( Promise.spawn );
        return ret;
    };
};
