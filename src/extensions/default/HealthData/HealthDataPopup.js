/*
 * Copyright (c) 2015 - present Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets, define, Mustache, $*/


define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var MainViewManager             = brackets.getModule("view/MainViewManager"),
        Dialogs                     = brackets.getModule("widgets/Dialogs"),
        Strings                     = brackets.getModule("strings"),
        HealthDataNotificationHtml  = require("text!htmlContent/healthdata-popup.html");

    function closeCallout() {
        var $callout = $("#healthdata-firstlaunch-popup");

        if (!$callout.hasClass("animateOpen")) {
            return;
        }

        // Animate out
        $callout.removeClass("animateOpen");
        $callout
            .addClass("animateClose")
            .one("webkitTransitionEnd", function () {
                // Normally we'd use AnimationUtils for this, but due to an apparent Chrome bug, calling .is(":hidden")
                // causes the animation not to play (even though it returns false and that early-exit branch isn't taken).
                $callout.removeClass("animateClose");
                $callout.remove();
            });
    }

    function showFirstLaunchTooltip() {
        var TOP_MARGIN = 7,
            popupTop = $("#editor-holder").offset().top + TOP_MARGIN,
            result = new $.Deferred(),
            $firstLaunchPopup = $(Mustache.render(HealthDataNotificationHtml, {"Strings": Strings}));

        Dialogs.addLinkTooltips($firstLaunchPopup);

        $firstLaunchPopup.appendTo("body").hide()
                         .css("top", popupTop)
                         .find(".healthdata-popup-close-button").click(function () {
                closeCallout();
                MainViewManager.focusActivePane();
                result.resolve();
            });
        $firstLaunchPopup.show();

        // Animate in
        // Must wait a cycle for the "display: none" to drop out before CSS transitions will work
        setTimeout(function () {
            $("#healthdata-firstlaunch-popup").addClass("animateOpen");
        }, 0);

        return result.promise();
    }

    exports.showFirstLaunchTooltip          = showFirstLaunchTooltip;
});
