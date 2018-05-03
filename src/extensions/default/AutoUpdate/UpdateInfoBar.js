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

    var MainViewManager     = brackets.getModule("view/MainViewManager"),
        Mustache            = brackets.getModule("thirdparty/mustache/mustache"),
        EventDispatcher     = brackets.getModule("utils/EventDispatcher"),
        UpdateBarHtml       = require("text!htmlContent/updateBar.html"),
        Strings             = brackets.getModule("strings");

    EventDispatcher.makeEventDispatcher(exports);

    /** Event triggered when Restart button is clicked on the update bar
    */
    var RESTART_BTN_CLICKED = "restartBtnClicked";

    /** Event triggered when Later button is clicked on the update bar
    */
    var LATER_BTN_CLICKED = "laterBtnClicked";

    // Key handlers for buttons in UI
    var SPACE_KEY = 32, // keycode for space key
        ESC_KEY   = 27; // keycode for escape key

    /**
     * Generates the json to be used by Mustache for rendering
     * @param   {object}   msgObj - json object containing message information to be displayed
     * @returns {object} - the generated json object
     */
    function generateJsonForMustache(msgObj) {
        var msgJsonObj = {};
        if (msgObj.type) {
            msgJsonObj.type = "'" + msgObj.type + "'";
        }
        msgJsonObj.title = msgObj.title;
        msgJsonObj.description = msgObj.description;
        if (msgObj.needButtons) {
            msgJsonObj.buttons = [{
                "id": "restart",
                "value": Strings.RESTART_BUTTON,
                "tIndex": "'0'"
            }, {
                "id": "later",
                "value": Strings.LATER_BUTTON,
                "tIndex": "'0'"
            }];
            msgJsonObj.needButtons = msgObj.needButtons;
        }
        return msgJsonObj;
    }

    /**
     * Removes and cleans up the update bar from DOM
     */
    function cleanUpdateBar() {
        var $updateBar = $('#update-bar');
        if ($updateBar.length > 0) {
            $updateBar.remove();
        }
        $(window.document).off("keydown.AutoUpdate");
        $(window).off('resize.AutoUpdateBar');
    }

    /**
     * Displays the Update Bar UI
     * @param   {object} msgObj - json object containing message info to be displayed
     *
     */
    function showUpdateBar(msgObj) {
        var jsonToMustache = generateJsonForMustache(msgObj),
            $updateBarElement = $(Mustache.render(UpdateBarHtml, jsonToMustache));

        cleanUpdateBar(); //Remove an already existing update bar, if any
        $updateBarElement.prependTo(".content");

        var $updateBar = $('#update-bar'),
            $updateContent = $updateBar.find('#update-content'),
            $contentContainer = $updateBar.find('#content-container'),
            $buttonContainer = $updateBar.find('#button-container'),
            $heading = $updateBar.find('#heading'),
            $description = $updateBar.find('#description'),
            $restart = $updateBar.find('#update-btn-restart'),
            $later = $updateBar.find('#update-btn-later'),
            $closeIcon = $updateBar.find('#close-icon');

        if ($updateContent.length > 0) {
            if ($updateContent[0].scrollWidth > $updateContent.innerWidth()) {
            //Text has over-flown, show the update content as tooltip message
                if ($contentContainer.length > 0 &&
                        $heading.length > 0 &&
                        $description.length > 0) {
                    $contentContainer.attr("title", $heading.text() + $description.text());
                }
            }
        }
        var resizeContentContainer = function resizeContentContainer() {
            if($updateContent.length > 0) {
                var newWidth = $updateBar.width() - $buttonContainer.width() - 78;
                $contentContainer.css({
                    "maxWidth": newWidth
                });
            }
        };

        resizeContentContainer();
        $(window).on('resize.AutoUpdateBar', resizeContentContainer);

        //Event handlers on the Update Bar

        // Click and key handlers on Restart button
        if ($restart.length > 0) {
            $restart.click(function () {
                cleanUpdateBar();
                exports.trigger(exports.RESTART_BTN_CLICKED);
            });

            $restart.keyup(function (event) {
                if (event.which === SPACE_KEY) {
                    $restart.trigger('click');
                }
            });
        }

        // Click and key handlers on Later button
        if ($later.length > 0) {
            $later.click(function () {
                cleanUpdateBar();
                MainViewManager.focusActivePane();
                exports.trigger(exports.LATER_BTN_CLICKED);
            });

            $later.keyup(function (event) {
                if (event.which === SPACE_KEY) {
                    $later.trigger('click');
                }
            });
        }

        // Click and key handlers on Close button
        if ($closeIcon.length > 0) {
            $closeIcon.click(function () {
                cleanUpdateBar();
                MainViewManager.focusActivePane();
            });

            $closeIcon.keyup(function (event) {
                if (event.which === SPACE_KEY) {
                    $closeIcon.trigger('click');
                }
            });
        }
        $(window.document).on("keydown.AutoUpdate", function (event) {
            var code = event.which;
            if (code === ESC_KEY) {
                // Keyboard input of Esc key on Update Bar dismisses and removes the bar
                cleanUpdateBar();
                MainViewManager.focusActivePane();
                event.stopImmediatePropagation();
            }
        });
    }
    exports.showUpdateBar = showUpdateBar;
    exports.RESTART_BTN_CLICKED = RESTART_BTN_CLICKED;
    exports.LATER_BTN_CLICKED = LATER_BTN_CLICKED;
});
