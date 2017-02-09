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

define(function (require, exports, module) {
    "use strict";

    var AppInit                      = brackets.getModule("utils/AppInit"),
        PreferencesManager           = brackets.getModule("preferences/PreferencesManager"),
        UrlParams                    = brackets.getModule("utils/UrlParams").UrlParams,
        HealthDataPreview            = require("HealthDataPreview"),
        HealthDataPopup              = require("HealthDataPopup");

    // Parse URL params
    var params = new UrlParams();

    function handleHealthDataStatistics() {
        HealthDataPreview.previewHealthData();
    }

    AppInit.appReady(function () {
        params.parse();
        // Check whether the notification dialog should be shown. It will be shown one time. Does not check in testing environment.
        if (!params.get("testEnvironment")) {
            var alreadyShown = PreferencesManager.getViewState("healthDataNotificationShown");
            var prefs = PreferencesManager.getExtensionPrefs("healthData");
            if (!alreadyShown && prefs.get("healthDataTracking")) {
                HealthDataPopup.showFirstLaunchTooltip()
                    .done(function () {
                        PreferencesManager.setViewState("healthDataNotificationShown", true);
                    });
            }
        }
    });


    exports.handleHealthDataStatistics       = handleHealthDataStatistics;
});
