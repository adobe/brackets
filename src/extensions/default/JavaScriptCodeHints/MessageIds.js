/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var TERN_ADD_FILES_MSG          = "AddFiles",
        TERN_UPDATE_FILE_MSG        = "UpdateFile",
        TERN_INIT_MSG               = "Init",
        TERN_JUMPTODEF_MSG          = "JumptoDef",
        TERN_COMPLETIONS_MSG        = "Completions",
        TERN_GET_FILE_MSG           = "GetFile",
        TERN_CALLED_FUNC_TYPE_MSG   = "FunctionType",
        TERN_PRIME_PUMP_MSG         = "PrimePump",
        TERN_GET_GUESSES_MSG        = "GetGuesses",
        TERN_WORKER_READY           = "WorkerReady",
        TERN_INFERENCE_TIMEDOUT     = "InferenceTimedOut",
        SET_CONFIG                  = "SetConfig";

    // Message parameter constants
    var TERN_FILE_INFO_TYPE_PART    = "part",
        TERN_FILE_INFO_TYPE_FULL    = "full",
        TERN_FILE_INFO_TYPE_EMPTY   = "empty";


    exports.TERN_ADD_FILES_MSG          = TERN_ADD_FILES_MSG;
    exports.TERN_JUMPTODEF_MSG          = TERN_JUMPTODEF_MSG;
    exports.TERN_COMPLETIONS_MSG        = TERN_COMPLETIONS_MSG;
    exports.TERN_INIT_MSG               = TERN_INIT_MSG;
    exports.TERN_GET_FILE_MSG           = TERN_GET_FILE_MSG;
    exports.TERN_CALLED_FUNC_TYPE_MSG   = TERN_CALLED_FUNC_TYPE_MSG;
    exports.TERN_PRIME_PUMP_MSG         = TERN_PRIME_PUMP_MSG;
    exports.TERN_GET_GUESSES_MSG        = TERN_GET_GUESSES_MSG;
    exports.TERN_UPDATE_FILE_MSG        = TERN_UPDATE_FILE_MSG;
    exports.TERN_WORKER_READY           = TERN_WORKER_READY;
    exports.TERN_FILE_INFO_TYPE_PART    = TERN_FILE_INFO_TYPE_PART;
    exports.TERN_FILE_INFO_TYPE_FULL    = TERN_FILE_INFO_TYPE_FULL;
    exports.TERN_FILE_INFO_TYPE_EMPTY   = TERN_FILE_INFO_TYPE_EMPTY;
    exports.TERN_INFERENCE_TIMEDOUT     = TERN_INFERENCE_TIMEDOUT;
    exports.SET_CONFIG                  = SET_CONFIG;
});


