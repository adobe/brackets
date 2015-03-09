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
/*global define, $ */

define(function (require, exports, module) {
    "use strict";
    
    var PreferencesManager = require("preferences/PreferencesManager"),
        EventDispatcher    = require("utils/EventDispatcher"),
        HealthDataManager  = require("healthData/HealthDataManager"),
        HealthDataUtils    = require("healthData/HealthDataUtils");
    
    var localBuffer = HealthDataManager.localStorageBuffer;
    
    var PERSIS_TIME = 5 * 60 * 1000;
    
    var persisLocalIntervalId;
    
    function persistLocalData() {
        if (!$.isEmptyObject(localBuffer)) {
            HealthDataUtils.writeHealthDataFile(localBuffer, HealthDataManager.healthDataFilePath).done(function() {
                localBuffer = {};
            });;
        }
    }
    
    persisLocalIntervalId = window.setInterval(persistLocalData, PERSIS_TIME);
    
    //Used to handle the logs which will be send once before we send the health data file to the server
    function handleOneTimeData() {
        
    }
    
    function handleClickLivePreview() {
    }
    
    var eventFunctionMaps = {
        "oneTimeData" : handleOneTimeData,
        "clickLivePreview" : handleClickLivePreview
    };
    
    PreferencesManager.definePreference("healthDataTracking", "boolean", true);
    
    function logEvent(eventName, params) {
        if (eventFunctionMaps[eventName] && typeof eventFunctionMaps[eventName] === "function") {
            eventFunctionMaps[eventName](params);
        }
    }
    
    function manageEventsTracking() {
        var isHDTracking = PreferencesManager.get("healthDataTracking");
        if (isHDTracking) {
            exports.on("logEvent", logEvent);
            persisLocalIntervalId = window.setInterval(persistLocalData, PERSIS_TIME);
        } else {
            exports.off("logEvent", logEvent);
            window.clearInterval(persisLocalIntervalId);
            
        }
    }
    
    PreferencesManager.on("change", "healthDataTracking", function () {
        manageEventsTracking();
    });
    
    
    EventDispatcher.makeEventDispatcher(exports);
    
    exports.on("logEvent", logEvent);
});