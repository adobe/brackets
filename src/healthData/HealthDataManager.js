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
    
    var AppInit             = require("utils/AppInit"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        HealthDataUtils     = require("healthData/HealthDataUtils");
    
    var localStorageBuffer = {},
        queueStorageBuffer = {},
        persistedStorage   = {};
    
    var HEALTH_DATA_FILE = "healthdata.json";
    var healthDataFilePath = brackets.app.getApplicationSupportDirectory() + "/" + HEALTH_DATA_FILE;
    
    var ONE_DAY = 24 * 60 * 60 * 1000;
    var ONE_MINUTE = 60 * 60 * 1000;
    
    var timeoutVar;
    
    function sendHealthDataToServer() {
        var lastTimeSend = PreferencesManager.getViewState("lastTimeSendHealthData"),
            currentTime  = (new Date()).getTime();
        if (!lastTimeSend) {
            timeoutVar = window.setTimeout(sendHealthDataToServer, ONE_DAY);
            return;
        }
        
        if ((new Date()).getTime() >= lastTimeSend + ONE_DAY) {
            persistedStorage = HealthDataUtils.readHealthDataFile(healthDataFilePath);
            var newData;//Merge localStorageBuffer with PersistedStorage. Get it in new Data
            //Send newData to the server
            //If sucess remove the contents of file except GUID
            
            //If failure write all newData to the file
            HealthDataUtils.writeHealthDataFile(newData, healthDataFilePath);
            
            timeoutVar = window.setTimeout(sendHealthDataToServer, ONE_DAY);
            
        } else {
            timeoutVar = window.setTimeout(sendHealthDataToServer, lastTimeSend + ONE_DAY - currentTime);
        }
    }
    
    PreferencesManager.on("change", "healthDataTracking", function () {
        var isHDTracking = PreferencesManager.get("healthDataTracking");
        
        if (isHDTracking) {
            sendHealthDataToServer();
        } else {
            window.clearTimeout(timeoutVar);
        }
    });
    
    AppInit.addReady(function () {
        var lastTimeSend = PreferencesManager.getViewState("lastTimeSendHealthData");

        sendHealthDataToServer();
    });
    
    
    
    exports.localStorageBuffer    = localStorageBuffer;
    exports.queueStorageBuffer    = queueStorageBuffer;
    exports.persistedStorage      = persistedStorage;
    exports.healthDataFilePath    = healthDataFilePath;
});