/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/**
 *  Utilities functions to display deprecation warning in the console.
 *
 */
define(function (require, exports, module) {
    "use strict";

    var EventDispatcher = require("utils/EventDispatcher");


    var displayedWarnings = {};

    /**
     * Trim the stack so that it does not have the call to this module,
     * and all the calls to require.js to load the extension that shows
     * this deprecation warning.
     */
    function _trimStack(stack) {
        var indexOfFirstRequireJSline;

        // Remove everything in the stack up to the end of the line that shows this module file path
        stack = stack.substr(stack.indexOf(")\n") + 2);

        // Find the very first line of require.js in the stack if the call is from an extension.
        // Remove all those lines from the call stack.
        indexOfFirstRequireJSline = stack.indexOf("requirejs/require.js");
        if (indexOfFirstRequireJSline !== -1) {
            indexOfFirstRequireJSline = stack.lastIndexOf(")", indexOfFirstRequireJSline) + 1;
            stack = stack.substr(0, indexOfFirstRequireJSline);
        }

        return stack;
    }

    /**
     * Show deprecation warning with the call stack if it
     * has never been displayed before.
     * @param {!string} message The deprecation message to be displayed.
     * @param {boolean=} oncePerCaller If true, displays the message once for each unique call location.
     *     If false (the default), only displays the message once no matter where it's called from.
     *     Note that setting this to true can cause a slight performance hit (because it has to generate
     *     a stack trace), so don't set this for functions that you expect to be called from performance-
     *     sensitive code (e.g. tight loops).
     * @param {number=} callerStackPos Only used if oncePerCaller=true. Overrides the `Error().stack` depth
     *     where the client-code caller can be found. Only needed if extra shim layers are involved.
     */
    function deprecationWarning(message, oncePerCaller, callerStackPos) {
        // If oncePerCaller isn't set, then only show the message once no matter who calls it.
        if (!message || (!oncePerCaller && displayedWarnings[message])) {
            return;
        }

        // Don't show the warning again if we've already gotten it from the current caller.
        // The true caller location is the fourth line in the stack trace:
        // * 0 is the word "Error"
        // * 1 is this function
        // * 2 is the caller of this function (the one throwing the deprecation warning)
        // * 3 is the actual caller of the deprecated function.
        var stack = new Error().stack,
            callerLocation = stack.split("\n")[callerStackPos || 3];
        if (oncePerCaller && displayedWarnings[message] && displayedWarnings[message][callerLocation]) {
            return;
        }

        console.warn(message + "\n" + _trimStack(stack));
        if (!displayedWarnings[message]) {
            displayedWarnings[message] = {};
        }
        displayedWarnings[message][callerLocation] = true;
    }


    /**
     * Show a deprecation warning if there are listeners for the event
     *
     * ```
     *    DeprecationWarning.deprecateEvent(exports,
     *                                      MainViewManager,
     *                                      "workingSetAdd",
     *                                      "workingSetAdd",
     *                                      "DocumentManager.workingSetAdd",
     *                                      "MainViewManager.workingSetAdd");
     * ```
     *
     * @param {Object} outbound - the object with the old event to dispatch
     * @param {Object} inbound - the object with the new event to map to the old event
     * @param {string} oldEventName - the name of the old event
     * @param {string} newEventName - the name of the new event
     * @param {string=} canonicalOutboundName - the canonical name of the old event
     * @param {string=} canonicalInboundName - the canonical name of the new event
     */
    function deprecateEvent(outbound, inbound, oldEventName, newEventName, canonicalOutboundName, canonicalInboundName) {
        // Mark deprecated so EventDispatcher.on() will emit warnings
        EventDispatcher.markDeprecated(outbound, oldEventName, canonicalInboundName);

        // create an event handler for the new event to listen for
        inbound.on(newEventName, function () {
            // Dispatch the event in case anyone is still listening
            EventDispatcher.triggerWithArray(outbound, oldEventName, Array.prototype.slice.call(arguments, 1));
        });
    }


    /**
     * Create a deprecation warning and action for updated constants
     * @param {!string} old Menu Id
     * @param {!string} new Menu Id
     */
    function deprecateConstant(obj, oldId, newId) {
        var warning     = "Use Menus." + newId + " instead of Menus." + oldId,
            newValue    = obj[newId];

        Object.defineProperty(obj, oldId, {
            get: function () {
                deprecationWarning(warning, true);
                return newValue;
            }
        });
    }

    // Define public API
    exports.deprecationWarning   = deprecationWarning;
    exports.deprecateEvent       = deprecateEvent;
    exports.deprecateConstant      = deprecateConstant;
});
