/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

/**
 * FileSystemError describes the errors that can occur when using the FileSystem, File,
 * and Directory modules.
 *
 * Error values are strings. Any "falsy" value: null, undefined or "" means "no error".
 */
define(function (require, exports, module) {
    "use strict";

    /**
     * Enumerated File System Errors
     * @enum {string}
     */
    module.exports = {
        UNKNOWN                     : "Unknown",
        INVALID_PARAMS              : "InvalidParams",
        NOT_FOUND                   : "NotFound",
        NOT_READABLE                : "NotReadable",
        UNSUPPORTED_ENCODING        : "UnsupportedEncoding",
        NOT_SUPPORTED               : "NotSupported",
        NOT_WRITABLE                : "NotWritable",
        OUT_OF_SPACE                : "OutOfSpace",
        TOO_MANY_ENTRIES            : "TooManyEntries",
        ALREADY_EXISTS              : "AlreadyExists",
        CONTENTS_MODIFIED           : "ContentsModified",
        ROOT_NOT_WATCHED            : "RootNotBeingWatched",
        EXCEEDS_MAX_FILE_SIZE       : "ExceedsMaxFileSize",
        NETWORK_DRIVE_NOT_SUPPORTED : "NetworkDriveNotSupported"

        // FUTURE: Add remote connection errors: timeout, not logged in, connection err, etc.
    };
});
