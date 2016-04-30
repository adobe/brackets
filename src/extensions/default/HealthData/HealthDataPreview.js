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
/*global define, Mustache, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var _                       = brackets.getModule("thirdparty/lodash"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        Strings                 = brackets.getModule("strings"),
        Dialogs                 = brackets.getModule("widgets/Dialogs"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),

        HealthDataPreviewDialog = require("text!htmlContent/healthdata-preview-dialog.html"),
        HealthDataManager       = require("HealthDataManager");

    var prefs = PreferencesManager.getExtensionPrefs("healthData");

    ExtensionUtils.loadStyleSheet(module, "styles.css");

    /**
     * Show the dialog for previewing the Health Data that will be sent.
     */
    function previewHealthData() {
        var result = new $.Deferred();

        HealthDataManager.getHealthData().done(function (healthDataObject) {
            var content = JSON.stringify(healthDataObject, null, 4);
            content = _.escape(content);
            content = content.replace(/ /g, "&nbsp;");
            content = content.replace(/(?:\r\n|\r|\n)/g, "<br />");

            var hdPref   = prefs.get("healthDataTracking"),
                template = Mustache.render(HealthDataPreviewDialog, {Strings: Strings, content: content, hdPref: hdPref}),
                $template = $(template);

            Dialogs.addLinkTooltips($template);

            Dialogs.showModalDialogUsingTemplate($template).done(function (id) {

                if (id === "save") {
                    var newHDPref = $template.find("[data-target]:checkbox").is(":checked");
                    if (hdPref !== newHDPref) {
                        prefs.set("healthDataTracking", newHDPref);
                    }
                }
            });

            return result.resolve();
        });

        return result.promise();
    }

    exports.previewHealthData = previewHealthData;
});
