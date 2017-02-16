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

    /**
     * List of constants for the default dialogs IDs.
     */
    exports.DIALOG_ID_ERROR             = "error-dialog";
    exports.DIALOG_ID_INFO              = "error-dialog"; // uses the same template for now--could be different in future
    exports.DIALOG_ID_SAVE_CLOSE        = "save-close-dialog";
    exports.DIALOG_ID_EXT_CHANGED       = "ext-changed-dialog";
    exports.DIALOG_ID_EXT_DELETED       = "ext-deleted-dialog";
    exports.DIALOG_ID_LIVE_DEVELOPMENT  = "live-development-error-dialog";
    exports.DIALOG_ID_CHANGE_EXTENSIONS = "change-marked-extensions";
});
