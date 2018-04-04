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
        UpdateBarHtml       = require("text!htmlContent/updateBar.html"),
        Strings             = brackets.getModule("strings");

    /** Event triggered when Restart button is clicked on the update bar
    */
    var RESTART_BTN_CLICKED = "restartBtnClicked";

    /** Event triggered when Later button is clicked on the update bar
    */
    var LATER_BTN_CLICKED = "laterBtnClicked";

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
        if($updateBar.length > 0) {
            $updateBar.remove();
        }
        $(window.document).off("keydown.AutoUpdate");
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
            $heading = $updateBar.find('#heading'),
            $description = $updateBar.find('#description'),
            $restart = $updateBar.find('#update-btn-restart'),
            $later = $updateBar.find('#update-btn-later'),
            $closeIcon = $updateBar.find('#close-icon');

        if($updateContent.length > 0) {
            if ($updateContent[0].scrollWidth > $updateContent.innerWidth()) {
            //Text has over-flown, show the update content as tooltip message
                if($contentContainer.length > 0 &&
                   $heading.length > 0 &&
                   $description.length > 0) {
                    $contentContainer.attr("title", $heading.text() + $description.text());
                }
            }
        }

        //Event handlers on the Update Bar

        if($restart.length > 0) {
            $restart.click(function () {
                cleanUpdateBar();
                MainViewManager.trigger(exports.RESTART_BTN_CLICKED);
            });

            $restart.keyup(function (e) {
                if (e.which === 32) { //32 is the keycode for space key
                // Keyboard input of space key on Restart button triggers a click
                    $restart.trigger('click');
                }
            });
        }

        if($later.length > 0) {
            $later.click(function () {
                cleanUpdateBar();
                MainViewManager.focusActivePane();
                MainViewManager.trigger(exports.LATER_BTN_CLICKED);
            });

            $later.keyup(function (e) {
                if (e.which === 32) { //32 is the keycode for space key
                // Keyboard input of space key on Later button triggers a click
                    $later.trigger('click');
                }
            });
        }

        if($closeIcon.length > 0) {
            $closeIcon.click(function () {
                cleanUpdateBar();
                MainViewManager.focusActivePane();
            });

            $closeIcon.keyup(function (e) {
                if (e.which === 32) { //32 is the keycode for space key
                // Keyboard input of space key on close icon triggers a click
                    $closeIcon.trigger('click');
                }
            });
        }
        $(window.document).on("keydown.AutoUpdate", function (e) {
            var code = e.which;
            if (code === 27) { // escape key maps to keycode `27`
                // Keyboard input of Esc key on Update Bar dismisses and removes the bar
                cleanUpdateBar();
                MainViewManager.focusActivePane();
                e.stopImmediatePropagation();
            }
        });
    }
    exports.showUpdateBar = showUpdateBar;
    exports.RESTART_BTN_CLICKED = RESTART_BTN_CLICKED;
    exports.LATER_BTN_CLICKED = LATER_BTN_CLICKED;
});
