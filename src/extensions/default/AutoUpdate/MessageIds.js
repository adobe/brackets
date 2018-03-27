/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

    exports.DOWNLOAD_INSTALLER              = "node.downloadInstaller";
    exports.PERFORM_CLEANUP                 = "node.performCleanup";
    exports.VALIDATE_INSTALLER              = "node.validateInstaller";
    exports.INITIALIZE_STATE                = "node.initializeState";
    exports.SHOW_STATUS_INFO                = "brackets.showStatusInfo";
    exports.NOTIFY_DOWNLOAD_SUCCESS         = "brackets.notifyDownloadSuccess";
    exports.SHOW_ERROR_MESSAGE              = "brackets.showErrorMessage";
    exports.NOTIFY_DOWNLOAD_FAILURE         = "brackets.notifyDownloadFailure";
    exports.NOTIFY_SAFE_TO_DOWNLOAD         = "brackets.notifySafeToDownload";
    exports.NOTIFY_INITIALIZATION_COMPLETE  = "brackets.notifyinitializationComplete";
    exports.NOTIFY_VALIDATION_STATUS        = "brackets.notifyvalidationStatus";
    exports.REGISTER_BRACKETS_FUNCTIONS     = "brackets.registerBracketsFunctions";
    exports.REGISTER_BRACKETS_FUNCTIONS_AND_UTILS     = "brackets.registerBracketsFunctionsAndUtils";
});
