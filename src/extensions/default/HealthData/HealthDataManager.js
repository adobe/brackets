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

/*global define, $, brackets, console, appshell */
define(function (require, exports, module) {
    "use strict";
    var AppInit             = brackets.getModule("utils/AppInit"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        HealthLogger        = brackets.getModule("utils/HealthLogger"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        UrlParams           = brackets.getModule("utils/UrlParams").UrlParams,
        Strings             = brackets.getModule("strings"),
        HealthDataUtils     = require("HealthDataUtils"),
        uuid                = require("thirdparty/uuid"),
        prefs               = PreferencesManager.getExtensionPrefs("healthData"),
        params              = new UrlParams(),
        ONE_MINUTE          = 60 * 1000,
        ONE_DAY             = 24 * 60 * ONE_MINUTE,
        FIRST_LAUNCH_SEND_DELAY = 30 * ONE_MINUTE,
        timeoutVar;

    prefs.definePreference("healthDataTracking", "boolean", true, {
        description: Strings.DESCRIPTION_HEALTH_DATA_TRACKING
    });

    params.parse();

    /**
     * Get the Health Data which will be sent to the server. Initially it is only one time data.
     */
    function getHealthData() {
        var result = new $.Deferred(),
            oneTimeHealthData = {};

        oneTimeHealthData.snapshotTime = Date.now();
        oneTimeHealthData.os = brackets.platform;
        oneTimeHealthData.userAgent = window.navigator.userAgent;
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
                        var userUuid  = PreferencesManager.getViewState("UUID");
                        var olderUuid = PreferencesManager.getViewState("OlderUUID");

                        if (userUuid && olderUuid) {
                            oneTimeHealthData.uuid      = userUuid;
                            oneTimeHealthData.olderuuid = olderUuid;
                            return result.resolve(oneTimeHealthData);
                        } else {

                            // So we are going to get the Machine hash in either of the cases.
                            if (appshell.app.getMachineHash) {
                                appshell.app.getMachineHash(function (err, macHash) {

                                    var generatedUuid;
                                    if (err) {
                                        generatedUuid = uuid.v4();
                                    } else {
                                        generatedUuid = macHash;
                                    }

                                    if (!userUuid) {
                                        // Could be a new user. In this case
                                        // both will remain the same.
                                        userUuid = olderUuid = generatedUuid;
                                    } else {
                                        // For existing user, we will still cache
                                        // the older uuid, so that we can improve
                                        // our reporting in terms of figuring out
                                        // the new users accurately.
                                        olderUuid = userUuid;
                                        userUuid  = generatedUuid;
                                    }

                                    PreferencesManager.setViewState("UUID", userUuid);
                                    PreferencesManager.setViewState("OlderUUID", olderUuid);

                                    oneTimeHealthData.uuid      = userUuid;
                                    oneTimeHealthData.olderuuid = olderUuid;
                                    return result.resolve(oneTimeHealthData);
                                });
                            } else {
                                // Probably running on older shell, in which case we will
                                // assign the same uuid to olderuuid.
                                if (!userUuid) {
                                    oneTimeHealthData.uuid = oneTimeHealthData.olderuuid = uuid.v4();
                                } else {
                                    oneTimeHealthData.olderuuid = userUuid;
                                }

                                PreferencesManager.setViewState("UUID",      oneTimeHealthData.uuid);
                                PreferencesManager.setViewState("OlderUUID", oneTimeHealthData.olderuuid);
                                return result.resolve(oneTimeHealthData);
                            }
                        }
                    });

            });
        return result.promise();
    }

    /**
     *@param{Object} eventParams contails Event Data
     * will return complete Analyics Data in Json Format
     */
    function getAnalyticsData(eventParams) {
        var userUuid = PreferencesManager.getViewState("UUID"),
            olderUuid = PreferencesManager.getViewState("OlderUUID");

        //Create default Values
        var defaultEventParams = {
            eventCategory: "pingData",
            eventSubCategory: "",
            eventType: "",
            eventSubType: ""
        };
        //Override with default values if not present
        if (!eventParams) {
            eventParams = defaultEventParams;
        } else {
            var e;
            for (e in defaultEventParams) {
                if (defaultEventParams.hasOwnProperty(e) && !eventParams[e]) {
                    eventParams[e] = defaultEventParams[e];
                }
            }
        }

        return {
            project: brackets.config.serviceKey,
            environment: brackets.config.environment,
            time: new Date().toISOString(),
            ingesttype: "dunamis",
            data: {
                "event.guid": uuid.v4(),
                "event.user_guid": olderUuid || userUuid,
                "event.dts_end": new Date().toISOString(),
                "event.category": eventParams.eventCategory,
                "event.subcategory": eventParams.eventSubCategory,
                "event.type": eventParams.eventType,
                "event.subtype": eventParams.eventSubType,
                "event.user_agent": window.navigator.userAgent || "",
                "event.language": brackets.app.language,
                "source.name": brackets.metadata.version,
                "source.platform": brackets.platform,
                "source.version": brackets.metadata.version
            }
        };
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

    // Send Analytics data to Server
    function sendAnalyticsDataToServer(eventParams, serverUrl) {
        var result = new $.Deferred(),
            url = serverUrl || brackets.config.analyticsDataServerURL;

        var analyticsData = getAnalyticsData(eventParams),
            ajaxParams = {
                url: url,
                type: "POST",
                data: JSON.stringify({events: [analyticsData]})
            };

        if(serverUrl) {
            ajaxParams.dataType = "text";
            ajaxParams.contentType = "text/plain";
        } else {
            ajaxParams.headers =  {
                "Content-Type": "application/json",
                "x-api-key": brackets.config.serviceKey
            };
        }

        $.ajax(ajaxParams)
            .done(function () {
                result.resolve();
            })
            .fail(function (jqXHR, status, errorThrown) {
                console.error("Error in sending Adobe Analytics Data. Response : " + jqXHR.responseText + ". Status : " + status + ". Error : " + errorThrown);
                result.reject();
            });

        return result.promise();
    }

    /*
     * Check if the Health Data is to be sent to the server. If the user has enabled tracking, Health Data will be sent once every 24 hours.
     * Send Health Data to the server if the period is more than 24 hours.
     * We are sending the data as soon as the user launches brackets. The data will be sent to the server only after the notification dialog
     * for opt-out/in is closed.
     @param forceSend Flag for sending analytics data for testing purpose
     */
    function checkHealthDataSend(forceSend) {
        var result         = new $.Deferred(),
            isHDTracking   = prefs.get("healthDataTracking"),
            nextTimeToSend,
            currentTime;

        HealthLogger.setHealthLogsEnabled(isHDTracking);
        window.clearTimeout(timeoutVar);
        if (isHDTracking) {
            nextTimeToSend = PreferencesManager.getViewState("nextHealthDataSendTime");
            currentTime    = Date.now();

            // Never send data before FIRST_LAUNCH_SEND_DELAY has ellapsed on a fresh install. This gives the user time to read the notification
            // popup, learn more, and opt out if desired
            if (!nextTimeToSend) {
                nextTimeToSend = currentTime + FIRST_LAUNCH_SEND_DELAY;
                PreferencesManager.setViewState("nextHealthDataSendTime", nextTimeToSend);
                // don't return yet though - still want to set the timeout below
            }

            if (currentTime >= nextTimeToSend || forceSend) {
                // Bump up nextHealthDataSendTime at the begining of chaining to avoid any chance of sending data again before 24 hours, // e.g. if the server request fails or the code below crashes
                PreferencesManager.setViewState("nextHealthDataSendTime", currentTime + ONE_DAY);
                sendHealthDataToServer().always(function() {
                    sendAnalyticsDataToServer()
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

    /**
     * Check if the Analytic Data is to be sent to the server.
     * If the user has enabled tracking, Analytic Data will be sent once per session
     * Send Analytic Data to the server if the Data associated with the given Event is not yet sent in this session.
     * We are sending the data as soon as the user triggers the event.
     * The data will be sent to the server only after the notification dialog
     * for opt-out/in is closed.
     * @param{Object} event event object
     * @param{Object} Eventparams Object Containg Data to be sent to Server
     * @param{boolean} forceSend Flag for sending analytics data for testing purpose
     **/
    function checkAnalyticsDataSend(event, Eventparams, forceSend) {
        var result         = new $.Deferred(),
            isHDTracking   = prefs.get("healthDataTracking"),
            isEventDataAlreadySent,
            url = brackets.config.healthDataServerURL,
            sendFailed = false;

        var options = {
            location: {
                scope: "default"
            }
        };

        if (isHDTracking) {
            isEventDataAlreadySent = PreferencesManager.getViewState(Eventparams.eventName);
            PreferencesManager.setViewState(Eventparams.eventName, 1, options);
            if (!isEventDataAlreadySent || forceSend) {
                sendAnalyticsDataToServer(Eventparams)
                    .always(function () {
                        sendAnalyticsDataToServer(Eventparams, url)
                           .done(function () {
                               result.resolve();
                           })
                           .fail(function () {
                               if(sendFailed) {
                                   PreferencesManager.setViewState(Eventparams.eventName, 0, options);
                               } else {
                                   sendFailed = true;
                               }
                               result.reject();
                           });
                    })
                    .fail( function () {
                        if(sendFailed) {
                            PreferencesManager.setViewState(Eventparams.eventName, 0, options);
                        } else {
                            sendFailed = true;
                        }
                    });
            } else {
                result.reject();
            }
        } else {
            result.reject();
        }

        return result.promise();
    }

    // Expose a command to test data sending capability, but limit it to dev environment only
    CommandManager.register("Sends health data and Analytics data for testing purpose", "sendHealthData", function() {
        if (brackets.config.environment === "stage") {
            return checkHealthDataSend(true);
        } else {
            return $.Deferred().reject().promise();
        }
    });

    prefs.on("change", "healthDataTracking", function () {
        checkHealthDataSend();
    });

    HealthLogger.on("SendAnalyticsData", checkAnalyticsDataSend);

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
    exports.getAnalyticsData = getAnalyticsData;
    exports.checkHealthDataSend = checkHealthDataSend;
});
