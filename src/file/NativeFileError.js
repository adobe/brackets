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

/**
 * @deprecated
 * This is a compatibility shim for legacy Brackets APIs that will be removed soon. These
 * error codes are *never* returned anymore. Use error codes in FileSystemError instead.
 */
define(function () {
    "use strict";
   
    /**
     * @deprecated
     */
    var NativeFileError = {};
    
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
    
    return NativeFileError;
});