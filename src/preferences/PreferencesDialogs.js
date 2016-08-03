/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, PathUtils, Mustache */

/**
 * PreferencesDialogs
 *
 */
define(function (require, exports, module) {
    "use strict";

    require("thirdparty/path-utils/path-utils.min");

    var Dialogs                = require("widgets/Dialogs"),
        ProjectManager         = require("project/ProjectManager"),
        StringUtils            = require("utils/StringUtils"),
        Strings                = require("strings"),
        SettingsDialogTemplate = require("text!htmlContent/project-settings-dialog.html");

    /**
     * Validate that text string is a valid base url which should map to a server folder
     * @param {string} url
     * @return {string} Empty string if valid, otherwise error string
     */
    function _validateBaseUrl(url) {
        var result = "";
        // Empty url means "no server mapping; use file directly"
        if (url === "") {
            return result;
        }

        var obj = PathUtils.parseUrl(url);
        if (!obj) {
            result = Strings.BASEURL_ERROR_UNKNOWN_ERROR;
        } else if (obj.href.search(/^(http|https):\/\//i) !== 0) {
            result = StringUtils.format(Strings.BASEURL_ERROR_INVALID_PROTOCOL, obj.href.substring(0, obj.href.indexOf("//")));
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
     * @param {string} baseUrl Initial value
     * @param {string} errorMessage Error to display
     * @return {Dialog} A Dialog object with an internal promise that will be resolved with the ID
     *      of the clicked button when the dialog is dismissed. Never rejected.
     */
    function showProjectPreferencesDialog(baseUrl, errorMessage) {
        var $baseUrlControl,
            dialog;

        // Title
        var projectName = "",
            projectRoot = ProjectManager.getProjectRoot(),
            title;
        if (projectRoot) {
            projectName = projectRoot.name;
        }
        title = StringUtils.format(Strings.PROJECT_SETTINGS_TITLE, projectName);

        var templateVars = {
            title        : title,
            baseUrl      : baseUrl,
            errorMessage : errorMessage,
            Strings      : Strings
        };

        dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(SettingsDialogTemplate, templateVars));

        dialog.done(function (id) {
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

        // Give focus to first control
        $baseUrlControl = dialog.getElement().find(".url");
        $baseUrlControl.focus();

        return dialog;
    }

    // For unit testing
    exports._validateBaseUrl                = _validateBaseUrl;

    exports.showProjectPreferencesDialog    = showProjectPreferencesDialog;
});
