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

    var UpdateStatusHtml = require("text!htmlContent/updateStatus.html"),
        ExtensionUtils   = brackets.getModule("utils/ExtensionUtils"),
        Mustache         = brackets.getModule("thirdparty/mustache/mustache"),
        Strings          = brackets.getModule("strings");

    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");

    /**
     * Cleans up status information from Status Bar
     */
    function cleanUpdateStatus() {
        $('#update-status').remove();
    }

    /**
     * Displays the status information on Status Bar
     * @param {string} id - the id of string to display
     */
    function showUpdateStatus(id) {
        cleanUpdateStatus();

        var $updateStatus = $(Mustache.render(UpdateStatusHtml, {"Strings": Strings}));
        $updateStatus.appendTo('#status-bar');
        $('#update-status #' + id).show();
    }

    /**
     * Modifies the status information on Status Bar
     * @param {object} statusObj - json containing status info - {
     *                           target - id of string to modify,
     *                           spans - array of objects of type - {
     *                           id - id of span for modifiable substring,
     *                           val - the new value to modifiable substring }
     *                           }
     */
    function modifyUpdateStatus(statusObj) {
        statusObj.spans.forEach(function (span) {
            $('#update-status #' + statusObj.target + ' #' + span.id).text(span.val);
        });
    }

    /**
     * Displays the progress bar on Status bar, while the download is in progress
     * @param {object} statusObj - json containing status info - {
     *                           target - id of string to modify,
     *                           spans - array of objects of type - {
     *                           id - id of span for modifiable substring,
     *                           val - the new value to modifiable substring }
     *                           }
     */
    function displayProgress(statusObj) {
        statusObj.spans.forEach(function (span) {
            if (span.id === 'percent') {
                var bgval = 'linear-gradient(to right, #1474BF ' + span.val + ', rgba(0, 0, 0) 0%';
                $('#update-status').css('background', bgval);
            }
        });

    }

    exports.showUpdateStatus = showUpdateStatus;
    exports.modifyUpdateStatus = modifyUpdateStatus;
    exports.cleanUpdateStatus = cleanUpdateStatus;
    exports.displayProgress = displayProgress;
});
