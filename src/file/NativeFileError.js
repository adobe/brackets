/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global define */

define(function () {
    "use strict";
   
    /**
     * Implementation of w3 DOMError interface
     *  http://www.w3.org/TR/2012/WD-dom-20120105/#interface-domerror
     *
     * NativeFileError describes possible errors occurred during NativeFileSystem
     * operations. It is inteneded to be used in error handling through other means
     * than exceptions.
     * @constructor
     * @implements {DOMError}
     *
     */
    var NativeFileError = function (name) {

        /**
         * The name of the error
         * @const
         * @type {string}
         */
        Object.defineProperty(this, "name", {
            value: name,
            writable: false
        });
    };
    
    /**
     * Possible error name constants for NativeFileSystem operations. For details check:
     *   http://www.w3.org/TR/file-system-api/#definitions
     *   http://dev.w3.org/2009/dap/file-system/file-writer.html#definitions
     */
    NativeFileError.NOT_FOUND_ERR = "NotFoundError";
    NativeFileError.SECURITY_ERR = "SecurityError";
    NativeFileError.ABORT_ERR = "AbortError";
    NativeFileError.NOT_READABLE_ERR = "NotReadableError";
    NativeFileError.NO_MODIFICATION_ALLOWED_ERR = "NoModificationAllowedError";
    NativeFileError.INVALID_STATE_ERR = "InvalidStateError";
    NativeFileError.SYNTAX_ERR = "SyntaxError";
    NativeFileError.INVALID_MODIFICATION_ERR = "InvalidModificationError";
    NativeFileError.QUOTA_EXCEEDED_ERR = "QuotaExceededError";
    NativeFileError.TYPE_MISMATCH_ERR = "TypeMismatchError";
    NativeFileError.PATH_EXISTS_ERR = "PathExistsError";
    
    // Define public API
    return NativeFileError;
});