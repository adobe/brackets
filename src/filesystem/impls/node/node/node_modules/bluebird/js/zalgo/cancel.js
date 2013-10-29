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
    var errors = require( "./errors.js" );
    var async = require( "./async.js" );
    var CancellationError = errors.CancellationError;

    Promise.prototype.cancel = function Promise$cancel() {
        if( !this.isCancellable() ) return this;
        var cancelTarget = this;
        while( cancelTarget._cancellationParent !== void 0 ) {
            cancelTarget = cancelTarget._cancellationParent;
        }
        if( cancelTarget === this ) {
            var err = new CancellationError();
            this._attachExtraTrace( err );
            this._reject( err );
        }
        else {
            cancelTarget.cancel((void 0));
        }
        return this;
    };

    Promise.prototype.uncancellable = function Promise$uncancellable() {
        var ret = new Promise();
        ret._setTrace( this.uncancellable, this );
        ret._unsetCancellable();
        ret._assumeStateOf( this, true );
        ret._boundTo = this._boundTo;
        return ret;
    };

    Promise.prototype.fork =
    function Promise$fork( didFulfill, didReject, didProgress ) {
        var ret = this._then( didFulfill, didReject, didProgress,
            void 0, void 0, this.fork );
        ret._cancellationParent = void 0;
        return ret;
    };
};
