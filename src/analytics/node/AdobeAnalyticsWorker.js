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

/*eslint-env node */
/*jslint node: true */
/*global setImmediate */
"use strict";
var fs                      = require("fs"),
    uuid                    = require("uuid").v4,
    savedEventMap           = {},
    timeToBeReplaced        = "Snchit",
    timeToBeReplacedRegex   = new RegExp(timeToBeReplaced, 'g'),
    defaultStartOfEventJson = "{\"events\": [",
    defaultEndOfEventJson   = "]}",
    XMLHttpRequest          = require("xmlhttprequest").XMLHttpRequest;

/**
 Returns the current date in YYYY-MM-DD format
 @return {string} YYYY-MM-DD
*/
function getCurrentDate() {
    var d = new Date(),
        month = (d.getMonth() + 1),
        day = d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) {
        month = '0' + month;
    }
    if (day.length < 2) {
        day = '0' + day;
    }

    return [year, month, day].join('-');
}

/**
 *@param{Object} eventParams contails Event Data
 * will return complete Analyics Data in Json Format
 */
function getAnalyticsData(dataToLog) {
    return {
        project: dataToLog.generics.project,
        environment: dataToLog.generics.environment,
        time: timeToBeReplaced,
        ingesttype: "dunamis",
        data: {
            "event.guid": uuid.v4(),
            "event.user_guid": dataToLog.generics.userGuid,
            "event.dts_end": new Date().toISOString(),
            "event.category": dataToLog.eventParams.eventCategory,
            "event.subcategory": dataToLog.eventParams.eventSubCategory,
            "event.type": dataToLog.eventParams.eventType,
            "event.subtype": dataToLog.eventParams.eventSubType,
            "event.user_agent": dataToLog.generics.userAgent,
            "event.language": dataToLog.generics.language,
            "source.name": dataToLog.generics.version,
            "source.platform": dataToLog.generics.platform,
            "source.version": dataToLog.generics.version
        }
    };
}

/*
 * Check whether the event received is already saved to file.
 * The file can contain the same event for previous day, but not for the same date
 * To ensure the event is sent only once perday we are saving eventName and Date in the map
*/

function rejectOrSaveEventToDisk(dataToLog) {
    var eventKey = dataToLog.eventParams.eventName + "_" + getCurrentDate();

    if (!(savedEventMap.hasOwnProperty(eventKey))) {
        savedEventMap[eventKey] = true;
        var analyticsData = JSON.stringify(getAnalyticsData(dataToLog)) + " , ";
        fs.appendFileSync(dataToLog.generics.unsentEventFileLocation, analyticsData, 'utf8');
    }
}


function sendData(dataToLog, dataToSend, content, analyticsData) {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", dataToLog.generics.ingestURL, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("x-api-key", dataToLog.generics.ingestKey);

    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                savedEventMap = {};
                process.send("Data Sent");
            } else {
                process.send("XHR failed with status" + xhr.status);
                fs.appendFileSync(dataToLog.generics.unsentEventFileLocation, content + "," + analyticsData, 'utf8');
            }
        } else {
            process.send("failed xhr");
            fs.appendFileSync(dataToLog.generics.unsentEventFileLocation, content + "," + analyticsData, 'utf8');
        }
    };

    xhr.onerror = function (e) {
        process.send("error" + xhr.statusText);
        fs.appendFileSync(dataToLog.generics.unsentEventFileLocation, content + "," + analyticsData, 'utf8');
    };

    xhr.send(dataToSend);
}


/*
 * Read the unsent file if exists add those to ping data and send as a single json request
 * If there is a failure scenario write the data back to disk
*/

function sendAllEvents(dataToLog) {

    var analyticsData = JSON.stringify(getAnalyticsData(dataToLog)),
        dataToSend = "",
        content = "";

    if (fs.existsSync(dataToLog.generics.unsentEventFileLocation)) {
        content = fs.readFileSync(dataToLog.generics.unsentEventFileLocation, "utf8").toString();
        fs.unlinkSync(dataToLog.generics.unsentEventFileLocation); // deleting the file immediately after read.
        //changing date timestamp to time right now
        dataToSend = (defaultStartOfEventJson + content + analyticsData + defaultEndOfEventJson).
                            replace(timeToBeReplacedRegex, new Date().toISOString());
    } else {
        //changing date timestamp to time right now
        dataToSend = (defaultStartOfEventJson + analyticsData + defaultEndOfEventJson).
                            replace(timeToBeReplacedRegex, new Date().toISOString());
    }
    sendData(dataToLog, dataToSend, analyticsData, content);
}


function sendOrSaveAnalyticsData(dataToLog) {

    if (dataToLog.eventParams.eventCategory === "pingData") {
        /* means this is a ping data which we receive every 24 hrs.
            we should send all the data from the event file
        */
        sendAllEvents(dataToLog);
    } else {
        rejectOrSaveEventToDisk(dataToLog);
    }
}

process.on('message', function (dataToLog) {
    sendOrSaveAnalyticsData(JSON.parse(dataToLog));
});
