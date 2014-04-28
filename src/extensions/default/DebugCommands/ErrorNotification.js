/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, brackets, window, document */

define(function (require, exports, module) {
    "use strict";

    var Strings = brackets.getModule("strings");

    var $span      = null,
        errorCount = 0,
        _attached  = false,
        _windowOnError,
        _consoleError;

    function showDeveloperTools() {
        try {
            brackets.app.showDeveloperTools();
        } catch (err) {
            console.error(err);
        }
    }

    function refreshIcon() {
        // never show 0 errors
        if (errorCount === 0) {
            return;
        }

        // update span if it was created before
        if ($span) {
            $span.parent().toggle(_attached);
            $span.text(errorCount);
            return;
        }

        // create the span
        $span = $("<span>").text(errorCount);
        $("<div>")
            .addClass("error")
            .text(Strings.ERRORS + ": ")
            .append($span)
            .on("click", showDeveloperTools)
            .prependTo("#status-bar .dynamic-indicators");
    }

    function incErrorCount() {
        errorCount++;
        refreshIcon();
    }

    function attachFunctions() {
        if (_attached) { return; }

        _attached      = true;
        _windowOnError = window.onerror;
        _consoleError  = window.console.error;

        // https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers.onerror
        window.onerror = function (errorMsg, url, lineNumber) {
            incErrorCount();
            if (_windowOnError) {
                return _windowOnError(errorMsg, url, lineNumber);
            }
            // return false means that we didn't handle this error and it should run the default handler
            return false;
        };

        window.console.error = function () {
            incErrorCount();
            return _consoleError.apply(window.console, arguments);
        };
    }

    function detachFunctions() {
        if (!_attached) { return; }

        _attached            = false;
        window.onerror       = _windowOnError;
        window.console.error = _consoleError;
    }

    function toggle(bool) {
        if (bool) { attachFunctions(); } else { detachFunctions(); }
        refreshIcon();
    }

    // Public API
    exports.toggle = toggle;

});
