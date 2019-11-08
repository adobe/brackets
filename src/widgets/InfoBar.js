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

    var MainViewManager     = require("view/MainViewManager"),
        Mustache            = require("thirdparty/mustache/mustache"),
        EventDispatcher     = require("utils/EventDispatcher"),
        UpdateBarHtml       = require("text!htmlContent/infoBar-template.html"),
        _                  =  require("thirdparty/lodash");

    EventDispatcher.makeEventDispatcher(exports);

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
            $iconContainer = $updateBar.find('#icon-container'),
            $closeIconContainer = $updateBar.find('#close-icon-container'),
            $heading = $updateBar.find('#heading'),
            $description = $updateBar.find('#description'),
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
        // Content Container Width between Icon Container and Button Container or Close Icon Container
        // will be assigned when window will be rezied.
        var resizeContentContainer = function () {
            if($updateContent.length > 0 && $contentContainer.length > 0 && $updateBar.length > 0) {
                var newWidth = $updateBar.outerWidth() - 38;
                if($iconContainer.length > 0) {
                    newWidth = newWidth - $iconContainer.outerWidth();
                }
                if($closeIconContainer.length > 0) {
                    newWidth = newWidth - $closeIconContainer.outerWidth();
                }

                $contentContainer.css({
                    "maxWidth": newWidth
                });
            }
        };

        resizeContentContainer();
        $(window).on('resize.AutoUpdateBar', _.debounce(resizeContentContainer, 150));

        //Event handlers on the Update Bar
        // Click and key handlers on Close button
        if ($closeIcon.length > 0) {
            $closeIcon.click(function () {
                cleanUpdateBar();
                MainViewManager.focusActivePane();
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
});
