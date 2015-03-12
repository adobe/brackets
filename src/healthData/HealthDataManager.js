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
        HealthDataEventManager = require("healthData/HealthDataEventManager");
    
    var prefs = PreferencesManager.getExtensionPrefs("healthData");
    var queueStorageBuffer = {},
        persistedStorage   = {};
	
	var localStorageBuffer = HealthDataEventManager.localBuffer;
    
    var HEALTH_DATA_FILE = "healthdata.json";
    var healthDataFilePath = brackets.app.getApplicationSupportDirectory() + "/" + HEALTH_DATA_FILE;
    
    var ONE_DAY = 2 * 60 * 1000;
    
    var timeoutVar;
    
    function sendDataToServer(data) {
        var result = new $.Deferred();
        
        //ajax call 
        
        return result.promise();
    }
    
    function sendHealthDataToServer() {
		HealthDataUtils.createFileIfNotExists(healthDataFilePath)
			.done(function () {
				HealthDataUtils.readHealthDataFile(healthDataFilePath)
					.done(function (jsonData) {
                        HealthDataEventManager.trigger("logEvent", "oneTimeData");
                        HealthDataEventManager.trigger("logEvent", "addGUID", jsonData);
						HealthDataEventManager.mergeEvents(localStorageBuffer, jsonData);

						sendDataToServer(jsonData)
							.done(function () {
								HealthDataUtils.writeHealthDataFile({}, healthDataFilePath);
							})
							.fail(function () {
								HealthDataUtils.writeHealthDataFile(jsonData, healthDataFilePath);
							});

					});
			});
		

    }
    
    function checkHealthDataExport() {
        var lastTimeSend = PreferencesManager.getViewState("lastTimeSendHealthData") || 0,
            currentTime  = (new Date()).getTime();
        
        if ((new Date()).getTime() >= lastTimeSend + ONE_DAY) {
            sendHealthDataToServer();
            timeoutVar = window.setTimeout(checkHealthDataExport, ONE_DAY);
        } else {
            timeoutVar = window.setTimeout(checkHealthDataExport, lastTimeSend + ONE_DAY - currentTime);
        }
    }
    
    prefs.on("change", "healthDataTracking", function () {
        var isHDTracking = prefs.get("healthDataTracking");
        
        if (isHDTracking) {
            checkHealthDataExport();
        } else {
            window.clearTimeout(timeoutVar);
        }
    });
    
    AppInit.appReady(function () {
        var lastTimeSend = PreferencesManager.getViewState("lastTimeSendHealthData");

        if (lastTimeSend) {
            checkHealthDataExport();
        } else {
			window.setTimeout(checkHealthDataExport, ONE_DAY);
		}
		
    });
    
 
    exports.queueStorageBuffer    = queueStorageBuffer;
    exports.persistedStorage      = persistedStorage;
    exports.healthDataFilePath    = healthDataFilePath;
});