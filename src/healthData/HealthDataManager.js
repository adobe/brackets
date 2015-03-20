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
/*global define, $, brackets, console */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit                = require("utils/AppInit"),
        PreferencesManager     = require("preferences/PreferencesManager"),
        HealthDataUtils        = require("healthData/HealthDataUtils"),
        uuid                   = require("thirdparty/uuid");
    
    var prefs = PreferencesManager.getExtensionPrefs("healthData");
    
    prefs.definePreference("healthDataTracking", "boolean", true);

    var ONE_DAY = 24 * 60 * 60 * 1000,
        timeoutVar;
    
    /*
    * Making ajax call to send the health data to the server
    */
    function sendDataToServer(data) {
        var result = new $.Deferred();
        
        $.ajax({
            url: brackets.config.healthDataServer,
            type: "POST",
            data: data,
            dataType: "text",
            contentType: "text/plain"
        })
            .fail(function (jqXHR, status, errorThrown) {
                console.error("Error in sending health data. Response : " + jqXHR.responseText + ". Status : " + status + ". Error : " + errorThrown);
            })
            .always(function () {
                result.resolve();
            });
        
        return result.promise();
    }
    
    /*
    * Get the health data which will be send to the server. Initially it is only one time data.
    */
    function getHealthData() {
        var result = new $.Deferred(),
            oneTimeHealthData = {};
        
        var guid = PreferencesManager.getViewState("GUID");
        
        if (!guid) {
            guid = uuid.v4();
            PreferencesManager.setViewState("GUID", guid);
        }
        
        oneTimeHealthData.guid = guid;
        oneTimeHealthData.snapshotTime = (new Date()).getTime();
        oneTimeHealthData.os = brackets.platform;
        oneTimeHealthData.osVersion = HealthDataUtils.getOSVersion();
        oneTimeHealthData.osLanguage = brackets.app.language;
        oneTimeHealthData.bracketsLanguage = brackets.getLocale();
        oneTimeHealthData.bracketsVersion = brackets.metadata.version;
        
        HealthDataUtils.getInstalledExtensions()
            .done(function (userInstalledExtensions) {
                oneTimeHealthData.installedExtensions = userInstalledExtensions;
            })
            .always(function () {
                return result.resolve(oneTimeHealthData);
            });
        
        return result.promise();
    }
    
    function sendHealthDataToServer() {
        var result = new $.Deferred();
        
        getHealthData().done(function (jsonData) {
            sendDataToServer(jsonData)
                .always(function () {
                    PreferencesManager.setViewState("lastTimeSendHealthData", (new Date()).getTime());
                    result.resolve();
                });
        });
        
        return result.promise();
    }
    
    /*
    * Check if health data is to be send to the server. If user has enable the tracking, health data will be send for every 24 hours. 
    * If 24 hours or more than that has been passed, then send health data to the server
    */
    function checkHealthDataExport() {
        var isHDTracking = prefs.get("healthDataTracking");
        clearTimeout(timeoutVar);
        
        if (isHDTracking) {
             
            var lastTimeSend = PreferencesManager.getViewState("lastTimeSendHealthData"),
                currentTime  = (new Date()).getTime();

            if (!lastTimeSend) {
                var randomTime = Math.floor(Math.random() * 86400000);
                lastTimeSend = currentTime + randomTime;
                PreferencesManager.setViewState("lastTimeSendHealthData", lastTimeSend);
            }

            if ((new Date()).getTime() >= lastTimeSend + ONE_DAY) {
                sendHealthDataToServer()
                    .always(function () {
                        timeoutVar = setTimeout(checkHealthDataExport, ONE_DAY);
                    });

            } else {
                timeoutVar = setTimeout(checkHealthDataExport, lastTimeSend + ONE_DAY - currentTime);
            }
        }
    }
    
    prefs.on("change", "healthDataTracking", function () {
        checkHealthDataExport();
    });
    
    window.addEventListener("online", function () {
        checkHealthDataExport();
    });
    
    window.addEventListener("offline", function () {
        clearTimeout(timeoutVar);
    });
    
    AppInit.appReady(function () {
        checkHealthDataExport();
    });

    exports.getHealthData   = getHealthData;
});