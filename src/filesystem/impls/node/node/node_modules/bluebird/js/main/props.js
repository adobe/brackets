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
module.exports = function( Promise, PromiseArray ) {
    var PropertiesPromiseArray = require("./properties_promise_array.js")(
        Promise, PromiseArray);
    var util = require( "./util.js" );
    var isPrimitive = util.isPrimitive;

    function Promise$_Props( promises, useBound, caller ) {
        var ret;
        if( isPrimitive( promises ) ) {
            ret = Promise.fulfilled( promises, caller );
        }
        else if( Promise.is( promises ) ) {
            ret = promises._then( Promise.props, void 0, void 0,
                            void 0, void 0, caller );
        }
        else {
            ret = new PropertiesPromiseArray(
                promises,
                caller,
                useBound === true ? promises._boundTo : void 0
            ).promise();
            useBound = false;
        }
        if( useBound === true ) {
            ret._boundTo = promises._boundTo;
        }
        return ret;
    }

    Promise.prototype.props = function Promise$props() {
        return Promise$_Props( this, true, this.props );
    };

    Promise.props = function Promise$Props( promises ) {
        return Promise$_Props( promises, false, Promise.props );
    };
};