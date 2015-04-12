/*
 * Copyright (c) 2015 Adobe Systems Incorporated. All rights reserved.
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
    
    var AppInit                      = brackets.getModule("utils/AppInit"),
        PreferencesManager           = brackets.getModule("preferences/PreferencesManager"),
        Strings                      = brackets.getModule("strings"),
        Dialogs                      = brackets.getModule("widgets/Dialogs"),
        UrlParams                    = brackets.getModule("utils/UrlParams").UrlParams,
        HealthDataPreview            = require("HealthDataPreview"),
        HealthDataManager            = require("HealthDataManager"),
        HealthDataNotificationDialog = require("text!htmlContent/healthdata-notification-dialog.html");
    
    PreferencesManager.definePreference("healthDataNotificationShown", "boolean", false);
    
    var prefs = PreferencesManager.getExtensionPrefs("healthData");
    
    // Parse URL params
    var params = new UrlParams();
    /**
     * Show dialog for first time to the user regarding data capturing by Brackets
     */
    function showDialogHealthDataNotification() {
        var hdPref   = prefs.get("healthDataTracking"),
            template = Mustache.render(HealthDataNotificationDialog, {"Strings": Strings, "hdPref": hdPref}),
            $template = $(template),
            newHDPref = hdPref,
            result = new $.Deferred();

        Dialogs.showModalDialogUsingTemplate($template).done(function (id) {
            PreferencesManager.setViewState("healthDataNotificationShown", true);
     
            if (id === "save") {
                newHDPref = $template.find("[data-target]:checkbox").is(":checked");
                if (hdPref !== newHDPref) {
                    prefs.set("healthDataTracking", newHDPref);
                }
            }
            
            result.resolve();
        });
        return result.promise();
    }

    function handleHealthDataStatistics() {
        var hdPref = prefs.get("healthDataTracking");
        
        if (hdPref) {
            HealthDataPreview.previewHealthData();
        } else {
            showDialogHealthDataNotification();
        }
    }
    
    AppInit.appReady(function () {
        params.parse();
        // Check whether the notification dialog should be shown. It will be shown one time. Does not check in testing environment.
        if (!params.get("testEnvironment")) {
            var isShown = PreferencesManager.getViewState("healthDataNotificationShown");

            if (!isShown) {
                showDialogHealthDataNotification()
                    .done(function () {
                        HealthDataManager.checkHealthDataSend();
                    });
            }
        }
    });
    
    exports.showDialogHealthDataNotification = showDialogHealthDataNotification;
    exports.handleHealthDataStatistics       = handleHealthDataStatistics;
});
