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
/*global define, $, brackets, console */

define(function (require, exports, module) {
    "use strict";

    var AppInit             = brackets.getModule("utils/AppInit"),
        HealthLogger        = brackets.getModule("utils/HealthLogger"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        UrlParams           = brackets.getModule("utils/UrlParams").UrlParams,
        Strings             = brackets.getModule("strings"),
        HealthDataUtils     = require("HealthDataUtils"),
        uuid                = require("thirdparty/uuid");

    var prefs      = PreferencesManager.getExtensionPrefs("healthData");

    prefs.definePreference("healthDataTracking", "boolean", true, {
        description: Strings.DESCRIPTION_HEALTH_DATA_TRACKING
    });

    var ONE_MINUTE = 60 * 1000,
        ONE_DAY = 24 * 60 * ONE_MINUTE,
        FIRST_LAUNCH_SEND_DELAY = 30 * ONE_MINUTE,
        timeoutVar;

    var params = new UrlParams();
    params.parse();

    /**
     * Get the Health Data which will be sent to the server. Initially it is only one time data.
     */
    function getHealthData() {
        var result = new $.Deferred(),
            oneTimeHealthData = {};

        var userUuid = PreferencesManager.getViewState("UUID");

        if (!userUuid) {
            userUuid = uuid.v4();
            PreferencesManager.setViewState("UUID", userUuid);
        }

        oneTimeHealthData.uuid = userUuid;
        oneTimeHealthData.snapshotTime = Date.now();
        oneTimeHealthData.os = brackets.platform;
        oneTimeHealthData.userAgent = navigator.userAgent;
        oneTimeHealthData.osLanguage = brackets.app.language;
        oneTimeHealthData.bracketsLanguage = brackets.getLocale();
        oneTimeHealthData.bracketsVersion = brackets.metadata.version;
        $.extend(oneTimeHealthData, HealthLogger.getAggregatedHealthData());

        HealthDataUtils.getUserInstalledExtensions()
            .done(function (userInstalledExtensions) {
                oneTimeHealthData.installedExtensions = userInstalledExtensions;
            })
            .always(function () {
                HealthDataUtils.getUserInstalledTheme()
                    .done(function (bracketsTheme) {
                        oneTimeHealthData.bracketsTheme = bracketsTheme;
                    })
                    .always(function () {
                        return result.resolve(oneTimeHealthData);
                    });

            });

        return result.promise();
    }

    /**
     * Send data to the server
     */
    function sendHealthDataToServer() {
        var result = new $.Deferred();

        getHealthData().done(function (healthData) {

            var url = brackets.config.healthDataServerURL,
                data = JSON.stringify(healthData);

            $.ajax({
                url: url,
                type: "POST",
                data: data,
                dataType: "text",
                contentType: "text/plain"
            })
                .done(function () {
                    result.resolve();
                })
                .fail(function (jqXHR, status, errorThrown) {
                    console.error("Error in sending Health Data. Response : " + jqXHR.responseText + ". Status : " + status + ". Error : " + errorThrown);
                    result.reject();
                });
        })
            .fail(function () {
                result.reject();
            });

        return result.promise();
    }

    /*
     * Check if the Health Data is to be sent to the server. If the user has enabled tracking, Health Data will be sent once every 24 hours.
     * Send Health Data to the server if the period is more than 24 hours.
     * We are sending the data as soon as the user launches brackets. The data will be sent to the server only after the notification dialog
     * for opt-out/in is closed.
     */
    function checkHealthDataSend() {
        var result = new $.Deferred(),
            isHDTracking = prefs.get("healthDataTracking");
        HealthLogger.setHealthLogsEnabled(isHDTracking);
        window.clearTimeout(timeoutVar);
        if (isHDTracking) {
            var nextTimeToSend = PreferencesManager.getViewState("nextHealthDataSendTime"),
                currentTime = Date.now();

            // Never send data before FIRST_LAUNCH_SEND_DELAY has ellapsed on a fresh install. This gives the user time to read the notification
            // popup, learn more, and opt out if desired
            if (!nextTimeToSend) {
                nextTimeToSend = currentTime + FIRST_LAUNCH_SEND_DELAY;
                PreferencesManager.setViewState("nextHealthDataSendTime", nextTimeToSend);
                // don't return yet though - still want to set the timeout below
            }

            if (currentTime >= nextTimeToSend) {
                // Bump up nextHealthDataSendTime now to avoid any chance of sending data again before 24 hours, e.g. if the server request fails
                // or the code below crashes
                PreferencesManager.setViewState("nextHealthDataSendTime", currentTime + ONE_DAY);

                sendHealthDataToServer()
                    .done(function () {
                        // We have already sent the health data, so can clear all health data
                        // Logged till now
                        HealthLogger.clearHealthData();
                        result.resolve();
                    })
                    .fail(function () {
                        result.reject();
                    })
                    .always(function () {
                        timeoutVar = setTimeout(checkHealthDataSend, ONE_DAY);
                    });

            } else {
                timeoutVar = setTimeout(checkHealthDataSend, nextTimeToSend - currentTime);
                result.reject();
            }
        } else {
            result.reject();
        }

        return result.promise();
    }

    prefs.on("change", "healthDataTracking", function () {
        checkHealthDataSend();
    });

    window.addEventListener("online", function () {
        checkHealthDataSend();
    });

    window.addEventListener("offline", function () {
        window.clearTimeout(timeoutVar);
    });

    AppInit.appReady(function () {
        checkHealthDataSend();
    });

    exports.getHealthData = getHealthData;
    exports.checkHealthDataSend = checkHealthDataSend;
});
