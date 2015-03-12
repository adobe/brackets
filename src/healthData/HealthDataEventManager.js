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
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";
    
    var PreferencesManager = require("preferences/PreferencesManager"),
        EventDispatcher    = require("utils/EventDispatcher"),
        HealthDataManager  = require("healthData/HealthDataManager"),
        HealthDataUtils    = require("healthData/HealthDataUtils"),
        GUIDGenerator      = require("utils/GUIDGenerator");
    
    var prefs = PreferencesManager.getExtensionPrefs("healthData");
    var localBuffer = {},
        eventMaps   = {};
    
    var PERSIST_TIME = 60 * 1000;
    
    var persistLocalIntervalId;
    
    function log(sourceObject, targetObject, key) {
        targetObject[key] = sourceObject[key];
    }
    
    function add(sourceObject, targetObject, key) {
        if (typeof sourceObject[key] === "number") {
            targetObject[key] += sourceObject[key];
        } else if (Array.isArray(sourceObject[key])) {
            targetObject[key] = targetObject[key] || [];
            targetObject[key].concat(sourceObject[key]);
        } else {
            targetObject[key] = sourceObject[key];
        }
    }
    
    function mergeEvents(sourceObject, targetObject) {
        var key;
        for (key in sourceObject) {
            if (sourceObject.hasOwnProperty(key)) {
                if (!targetObject[key]) {
                    targetObject[key] = sourceObject[key];
                } else {
                    
                    switch (eventMaps[key]) {
                            
                    case "add":
                        add(sourceObject, targetObject, key);
                        break;
                    
                    case "log":
                        log(sourceObject, targetObject, key);
                        break;
                            
                    default:
                        if (sourceObject[key] instanceof Array) {
                            targetObject[key] = sourceObject[key];
                        } else if (sourceObject[key] instanceof Object) {
                            mergeEvents(sourceObject[key], targetObject[key]);
                        }
                    }
                }
            }
        }
    }
    
    function persistLocalData() {
        if (!$.isEmptyObject(localBuffer)) {
			
			HealthDataUtils.createFileIfNotExists(HealthDataManager.healthDataFilePath)
				.done(function () {
					HealthDataUtils.readHealthDataFile(HealthDataManager.healthDataFilePath)
						.done(function (jsonObject) {
							mergeEvents(localBuffer, jsonObject);

							HealthDataUtils.writeHealthDataFile(localBuffer, HealthDataManager.healthDataFilePath)
								.done(function () {
									localBuffer = {};
								})
								.fail(function () {

								});

						})
						.fail(function () {
						});
				});
      
        }
    }
    
    persistLocalIntervalId = window.setInterval(persistLocalData, PERSIST_TIME);
    
    //Used to handle the logs which will be send once before we send the health data file to the server
    function handleOneTimeData() {
        localBuffer.snapshotTime = (new Date()).getTime();
        localBuffer.os = brackets.platform;
        localBuffer.osLanguage = brackets.app.language;
        localBuffer.bracketsLanguage = brackets.getLocale();
        localBuffer.bracketsVersion = brackets.metadata.version;
    }
    
    function handleAddGUID(obj) {
        if (!obj.guid) {
            var guid = GUIDGenerator.getGUID();
            localBuffer.guid = guid;
        }
    }
    
    function getExtensionInstalledEventMap() {
        var eventMap = {
            "name" : "log",
            "version" : "log"
        };
        return eventMap;
    }
            
    function getLivePreviewEventMap() {
        return {"click" : "add", "fileName" : "log"};
    }
            
    function getMultiBrowserLPEventMap() {
        return {"clicks" : "add"};
    }
    
    function handleClickLivePreview(params) {
        eventMaps[params.key] = getLivePreviewEventMap;
        mergeEvents(params, localBuffer);
    }
    
    function handleClickMultiBrowserLP(params) {
        eventMaps[params.key] = getMultiBrowserLPEventMap;
        mergeEvents(params, localBuffer);
    }
    
    function handleExtensionInstalled(params) {
        eventMaps[params.key] = getExtensionInstalledEventMap;
        mergeEvents(params, localBuffer);
    }
    
    var eventFunctionMaps = {
        "addGUID" : handleAddGUID,
        "oneTimeData" : handleOneTimeData,
        "clickLivePreview" : handleClickLivePreview,
        "multiBrowserLPClick" : handleClickMultiBrowserLP,
        "extensionInstalled" : handleExtensionInstalled
    };
    
    prefs.definePreference("healthDataTracking", "boolean", true);
    
    function logEvent(e, eventName, params) {
        if (eventFunctionMaps[eventName] && eventFunctionMaps[eventName] instanceof Function) {
            eventFunctionMaps[eventName](params);
        }
    }
    
    function manageEventsTracking() {
        var isHDTracking = prefs.get("healthDataTracking");
        if (isHDTracking) {
            exports.on("logEvent", logEvent);
            persistLocalIntervalId = window.setInterval(persistLocalData, PERSIST_TIME);
        } else {
            exports.off("logEvent", logEvent);
            window.clearInterval(persistLocalIntervalId);
            
        }
    }
    
    prefs.on("change", "healthDataTracking", function () {
        manageEventsTracking();
    });
       
            
/*    function getGUIDEventMap() {
        return {"guid" : "log"};
    }
    
    function getSnapShotTimeEventMap() {
        return {"snapShotTime" : "log"};
    }
            
    function getOSVersionEventMap() {
        return {"osVersion" : "log"};
    }*/
    
    EventDispatcher.makeEventDispatcher(exports);
    
    exports.on("logEvent", logEvent);
    exports.mergeEvents       = mergeEvents;
	exports.localBuffer		  = localBuffer;
});