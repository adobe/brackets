/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, PathUtils */

/**
 * PreferencesDialogs
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    require("thirdparty/path-utils/path-utils.min");

    var Dialogs             = require("widgets/Dialogs"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        ProjectManager      = require("project/ProjectManager"),
        StringUtils         = require("utils/StringUtils"),
        Strings             = require("strings");

    /**
     * Validate that text string is a valid base url which should map to a server folder
     * @param {String} url
     * @return {String} empty string if valid, otherwise error string
     */
    function _validateBaseUrl(url) {
        var result = "";
        // empty url means "no server mapping; use file directly"
        if (url === "") {
            return result;
        }

        var obj = PathUtils.parseUrl(url);
        if (!obj) {
            result = Strings.BASEURL_ERROR_UNKOWN_ERROR;
        } else if (obj.protocol !== "http:"  && obj.protocol !== "https:") {
            result = StringUtils.format(Strings.BASEURL_ERROR_INVALID_PROTOCOL, obj.protocol);
        } else if (obj.search !== "") {
            result = StringUtils.format(Strings.BASEURL_ERROR_SEARCH_DISALLOWED, obj.search);
        } else if (obj.hash !== "") {
            result = StringUtils.format(Strings.BASEURL_ERROR_HASH_DISALLOWED, obj.hash);
        } else {
            var index = url.search(/[ \^\[\]\{\}<>\\"\?]+/);
            if (index !== -1) {
                result = StringUtils.format(Strings.BASEURL_ERROR_INVALID_CHAR, url[index]);
            }
        }

        return result;
    }

    /**
     * Show a dialog that shows the project preferences
     * @param {String} baseUrl - initial value
     * @param {String} errorMessage - error to display
     * @return {$.Promise} A promise object that will be resolved when user successfully enters
     *          project settings and clicks OK, or rejected if user clicks Cancel.
     */
    function showProjectPreferencesDialog(baseUrl, errorMessage) {

        var $dlg,
            $title,
            $baseUrlControl,
            promise;

        promise = Dialogs.showModalDialog(Dialogs.DIALOG_ID_PROJECT_SETTINGS)
            .done(function (id) {
                if (id === Dialogs.DIALOG_BTN_OK) {
                    var baseUrlValue = $baseUrlControl.val();
                    var result = _validateBaseUrl(baseUrlValue);
                    if (result === "") {
                        ProjectManager.setBaseUrl(baseUrlValue);
                    } else {
                        // Re-invoke dialog with result (error message)
                        showProjectPreferencesDialog(baseUrlValue, result);
                    }
                }
            });

        // Populate project settings
        $dlg = $(".project-settings-dialog.instance");

        // Title
        $title = $dlg.find(".dialog-title");
        var projectName = "",
            projectRoot = ProjectManager.getProjectRoot(),
            title;
        if (projectRoot) {
            projectName = projectRoot.name;
        }
        title = StringUtils.format(Strings.PROJECT_SETTINGS_TITLE, projectName);
        $title.text(title);

        // Base URL
        $baseUrlControl = $dlg.find(".base-url");
        if (baseUrl) {
            $baseUrlControl.val(baseUrl);
        }

        // Error message
        if (errorMessage) {
            $dlg.find(".settings-list").append("<div class='alert-message' style='margin-bottom: 0'>" + errorMessage + "</div>");
        }

        // Give focus to first control
        $baseUrlControl.focus();

        return promise;
    }

    // For unit testing
    exports._validateBaseUrl                = _validateBaseUrl;

    exports.showProjectPreferencesDialog    = showProjectPreferencesDialog;
});
