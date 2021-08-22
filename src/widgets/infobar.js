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


    var MainViewManager     = require("view/MainViewManager"),
        Mustache            = require("thirdparty/mustache/mustache"),
        EventDispatcher     = require("utils/EventDispatcher"),
        InfoBarHtml         = require("text!htmlContent/infobar-template.html"),
        _                   =  require("thirdparty/lodash");

    EventDispatcher.makeEventDispatcher(exports);

    // Key handlers for buttons in UI
    var ESC_KEY   = 27; // keycode for escape key

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
     * Removes and cleans up the info bar from DOM
     */
    function cleanInfoBar() {
        var $infoBar = $('#info-bar-template');
        if ($infoBar.length > 0) {
            $infoBar.remove();
        }
        $(window.document).off("keydown.InfoBarTemplateDoc");
        $(window).off('resize.InfoBarTemplate');
    }

    /**
     * Displays the Info Bar UI
     * @param   {object} msgObj - json object containing message info to be displayed
     *
     */
    function showInfoBar(msgObj) {
        var jsonToMustache = generateJsonForMustache(msgObj),
            $infoBarElement = $(Mustache.render(InfoBarHtml, jsonToMustache));

        cleanInfoBar(); //Remove an already existing info bar, if any
        $infoBarElement.prependTo(".content");

        var $infoBar = $('#info-bar-template'),
            $infoContent = $infoBar.find('#info-content'),
            $contentContainer = $infoBar.find('#content-container'),
            $iconContainer = $infoBar.find('#icon-container'),
            $closeIconContainer = $infoBar.find('#close-icon-container'),
            $heading = $infoBar.find('#heading'),
            $description = $infoBar.find('#description'),
            $closeIcon = $infoBar.find('#close-icon');

        if ($infoContent.length > 0) {
            if ($infoContent[0].scrollWidth > $infoContent.innerWidth()) {
            //Text has over-flown, show the info content as tooltip message
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
            if($infoContent.length > 0 && $contentContainer.length > 0 && $infoBar.length > 0) {
                var newWidth = $infoBar.outerWidth() - 38;
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
        $(window).on('resize.InfoBarTemplate', _.debounce(resizeContentContainer, 150));

        //Event handlers on the Info Bar
        // Click and key handlers on Close button
        if ($closeIcon.length > 0) {
            $closeIcon.click(function () {
                cleanInfoBar();
                MainViewManager.focusActivePane();
            });
        }
        $(window.document).on("keydown.InfoBarTemplateDoc", function (event) {
            var code = event.which;
            if (code === ESC_KEY) {
                // Keyboard input of Esc key on Info Bar dismisses and removes the bar
                cleanInfoBar();
                MainViewManager.focusActivePane();
                event.stopImmediatePropagation();
            }
        });
    }
    exports.showInfoBar = showInfoBar;
});
