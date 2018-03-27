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

    var MainViewManager = brackets.getModule("view/MainViewManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        UpdateBarHtml = require("text!htmlContent/updateBar.html");


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
                "value": "Restart",
                "tIndex": "'0'"
            }, {
                "id": "later",
                "value": "Later",
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
        $('#update-bar').remove();
        $(window.document).off("keydown.AutoUpdate");
    }

    /**
     * Displays the Update Bar UI
     * @param   {object} msgObj - json object containing message info to be displayed
     * @returns {$.Deferred} - a deferred jquery promise, that is resolved or rejected with the action performed on the bar UI. 
     */
    function showUpdateBar(msgObj) {
        var jsonToMustache = generateJsonForMustache(msgObj),
            $updateBar = $(Mustache.render(UpdateBarHtml, jsonToMustache)),
            result = new $.Deferred();

        cleanUpdateBar(); //Remove an already existing update bar, if any
        $updateBar.prependTo(".content");

        if ($('#update-bar #content-container #update-content')[0].scrollWidth > $('#update-bar #content-container #update-content').innerWidth()) {
            //Text has over-flown, show the update content as tooltip message
            $('#update-bar #content-container').attr("title", $('#update-bar #content-container #update-content #heading').text() + $('#update-bar #content-container #update-content #description').text());
        }


        //Event handlers on the Update Bar
        $("#update-bar #button-container #update-btn-restart").click(function () {
            //Resolve the promise if user clicked Restart button
            result.resolve(true);
            cleanUpdateBar();
        });

        $("#update-bar #button-container #update-btn-restart").keyup(function (e) {
            if (e.which === 32) { //32 is the keycode for space key
                // Keyboard input of space key on Restart button triggers a click
                $("#update-bar #button-container #update-btn-restart").trigger('click');
            }
        });

        $("#update-bar #button-container #update-btn-later").click(function () {
            // Reject the promise if user clicked Later button
            cleanUpdateBar();
            MainViewManager.focusActivePane();
            result.resolve(false);
        });

        $("#update-bar #button-container #update-btn-later").keyup(function (e) {
            if (e.which === 32) { //32 is the keycode for space key
                // Keyboard input of space key on Later button triggers a click
                $("#update-bar #button-container #update-btn-later").trigger('click');
            }
        });

        $("#update-bar #close-icon-container #close-icon").click(function () {
            // Reject the promise if user clicked on close icon
            cleanUpdateBar();
            MainViewManager.focusActivePane();
            result.resolve(false);
        });

        $("#update-bar #close-icon-container #close-icon").keyup(function (e) {
            if (e.which === 32) { //32 is the keycode for space key
                // Keyboard input of space key on close icon triggers a click
                $("#update-bar #close-icon-container #close-icon").trigger('click');
            }
        });

        $(window.document).on("keydown.AutoUpdate", function (e) {
            var code = e.which;
            if (code === 27) { // escape key maps to keycode `27`
                // Keyboard input of Esc key on Update Bar dismisses and removes the bar
                cleanUpdateBar();
                MainViewManager.focusActivePane();
                e.stopImmediatePropagation();
                result.resolve(false);
            }
        });
        return result.promise();
    }
    exports.showUpdateBar = showUpdateBar;
});
