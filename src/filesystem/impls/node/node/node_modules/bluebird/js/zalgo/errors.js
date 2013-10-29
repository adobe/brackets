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
var global = require("./global.js");
var Objectfreeze = global.Object.freeze;
var util = require( "./util.js");
var inherits = util.inherits;
var isObject = util.isObject;
var notEnumerableProp = util.notEnumerableProp;
var Error = global.Error;

function isStackAttached( val ) {
    return ( val & 1 ) > 0;
}

function isHandled( val ) {
    return ( val & 2 ) > 0;
}

function withStackAttached( val ) {
    return ( val | 1 );
}

function withHandledMarked( val ) {
    return ( val | 2 );
}

function withHandledUnmarked( val ) {
    return ( val & ( ~2 ) );
}

function ensureNotHandled( reason ) {
    var field;
    if( isObject( reason ) &&
        ( ( field = reason["__promiseHandled__"] ) !== void 0 ) ) {
        reason["__promiseHandled__"] = withHandledUnmarked( field );
    }
}

function attachDefaultState( obj ) {
    try {
        notEnumerableProp( obj, "__promiseHandled__", 0 );
        return true;
    }
    catch( e ) {
        return false;
    }
}

function isError( obj ) {
    return obj instanceof Error;
}

function canAttach( obj ) {
    if( isError( obj ) ) {
        var handledState = obj["__promiseHandled__"];
        if( handledState === void 0 ) {
            return attachDefaultState( obj );
        }
        return !isStackAttached( handledState );
    }
    return false;
}

function subError( nameProperty, defaultMessage ) {
    function SubError( message ) {
        this.message = typeof message === "string" ? message : defaultMessage;
        this.name = nameProperty;
        if( Error.captureStackTrace ) {
            Error.captureStackTrace( this, this.constructor );
        }
    }
    inherits( SubError, Error );
    return SubError;
}

var TypeError = global.TypeError;
if( typeof TypeError !== "function" ) {
    TypeError = subError( "TypeError", "type error" );
}
var CancellationError = subError( "CancellationError", "cancellation error" );
var TimeoutError = subError( "TimeoutError", "timeout error" );

function RejectionError( message ) {
    this.name = "RejectionError";
    this.message = message;
    this.cause = message;

    if( message instanceof Error ) {
        this.message = message.message;
        this.stack = message.stack;
    }
    else if( Error.captureStackTrace ) {
        Error.captureStackTrace( this, this.constructor );
    }

}
inherits( RejectionError, Error );

var key = "__BluebirdErrorTypes__";
var errorTypes = global[key];
if( !errorTypes ) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        RejectionError: RejectionError
    });
    notEnumerableProp( global, key, errorTypes );
}

module.exports = {
    Error: Error,
    TypeError: TypeError,
    CancellationError: errorTypes.CancellationError,
    RejectionError: errorTypes.RejectionError,
    TimeoutError: errorTypes.TimeoutError,
    attachDefaultState: attachDefaultState,
    ensureNotHandled: ensureNotHandled,
    withHandledUnmarked: withHandledUnmarked,
    withHandledMarked: withHandledMarked,
    withStackAttached: withStackAttached,
    isStackAttached: isStackAttached,
    isHandled: isHandled,
    canAttach: canAttach
};
