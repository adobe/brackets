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
    
    function sendDataToServer(data) {
        var result = new $.Deferred();
        
        //ajax call to save data to server
        
        return result.promise();
    }
    
    function getHealthData() {
        var oneTimeHealthData = {};
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
        oneTimeHealthData.installedExtensions = HealthDataUtils.getInstalledExtensions();
        return oneTimeHealthData;
    }
    
    function sendHealthDataToServer() {
        var jsonData = getHealthData();

		sendDataToServer(jsonData)
            .always(function () {
                PreferencesManager.setViewState("lastTimeSendHealthData", (new Date()).getTime());
            });
    }
    
    function checkHealthDataExport() {
        clearTimeout(timeoutVar);
        var lastTimeSend = PreferencesManager.getViewState("lastTimeSendHealthData") || 0,
            currentTime  = (new Date()).getTime();
        
        if ((new Date()).getTime() >= lastTimeSend + ONE_DAY) {
            sendHealthDataToServer();
            timeoutVar = setTimeout(checkHealthDataExport, ONE_DAY);
        } else {
            timeoutVar = setTimeout(checkHealthDataExport, lastTimeSend + ONE_DAY - currentTime);
        }
    }
    
    prefs.on("change", "healthDataTracking", function () {
        var isHDTracking = prefs.get("healthDataTracking");
        
        if (isHDTracking) {
            checkHealthDataExport();
        } else {
            clearTimeout(timeoutVar);
        }
    });
    
    AppInit.appReady(function () {
        var lastTimeSend = PreferencesManager.getViewState("lastTimeSendHealthData");

        if (lastTimeSend) {
            checkHealthDataExport();
        } else {
            var randomTime = Math.floor(Math.random() * 86400000);
            PreferencesManager.setViewState("lastTimeSendHealthData", (new Date()).getTime() + randomTime);
			timeoutVar = setTimeout(checkHealthDataExport, (new Date()).getTime() + randomTime);
		}
		
    });

    exports.getHealthData   = getHealthData;
});