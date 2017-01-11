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

/**
 * Utilities for dealing with animations in the UI.
 */
define(function (require, exports, module) {
    "use strict";

    var _     = require("thirdparty/lodash"),
        Async = require("utils/Async");

    /**
     * @private
     * Detect the browser's supported transitionend event.
     * @return {string} The supported transitionend event name.
     */
    function _detectTransitionEvent() {
        var event, el = window.document.createElement("fakeelement");

        var transitions = {
            "OTransition"     : "oTransitionEnd",
            "MozTransition"   : "transitionend",
            "WebkitTransition": "webkitTransitionEnd",
            "transition"      : "transitionend",
        };

        _.forEach(transitions, function (value, key) {
            if (el.style[key] !== undefined) {
                event = value;
            }
        });
        return event;
    }

    var _transitionEvent = _detectTransitionEvent();

    /**
     * Start an animation by adding the given class to the given target. When the
     * animation is complete, removes the class, clears the event handler we attach
     * to watch for the animation to finish, and resolves the returned promise.
     *
     * @param {Element} target The DOM node to animate.
     * @param {string} animClass The class that applies the animation/transition to the target.
     * @param {number=} timeoutDuration Time to wait in ms before rejecting promise. Default is 400.
     * @return {$.Promise} A promise that is resolved when the animation completes. Never rejected.
     */
    function animateUsingClass(target, animClass, timeoutDuration) {
        var result  = new $.Deferred(),
            $target = $(target);

        timeoutDuration = timeoutDuration || 400;

        function finish(e) {
            if (e.target === target) {
                result.resolve();
            }
        }

        function cleanup() {
            $target
                .removeClass(animClass)
                .off(_transitionEvent, finish);
        }

        if ($target.is(":hidden")) {
            // Don't do anything if the element is hidden because transitionEnd wouldn't fire
            result.resolve();
        } else {
            // Note that we can't just use $.one() here because we only want to remove
            // the handler when we get the transition end event for the correct target (not
            // a child).
            $target
                .addClass(animClass)
                .on(_transitionEvent, finish);
        }

        // Use timeout in case transition end event is not sent
        return Async.withTimeout(result.promise(), timeoutDuration, true)
            .done(cleanup);
    }

    exports.animateUsingClass = animateUsingClass;
});
