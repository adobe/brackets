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
    XMLHttpRequest          = require("xmlhttprequest").XMLHttpRequest,
    xhr                     = new XMLHttpRequest();

process.on('message', function(dataToLog) {

    var dataToWrite = JSON.parse(dataToLog);

    sendOrSaveAnalyticsData(dataToWrite);
});


function sendOrSaveAnalyticsData(jsonDataToLog) {

    if (jsonDataToLog.eventParams.eventCategory === "pingData") {
        /* means this is a ping data which we receive every 24 hrs.
            we should send all the data from the event file
        */
        sendAllEvents(jsonDataToLog);
    }else {
        rejectOrSaveEventToDisk(jsonDataToLog);
    }
}

/*
 * Check whether the event received is already saved to file.
 * The file can contain the same event for previous day, but not for the same date
 * To ensure the event is sent only once perday we are saving eventName and Date in the map
*/

function rejectOrSaveEventToDisk(jsonDataToLog) {
    var eventKey = jsonDataToLog.eventParams.eventName + "_" + getCurrentDate();

    if(!(eventKey in savedEventMap)){
        savedEventMap[eventKey] = true;
        var analyticsData = JSON.stringify(getAnalyticsData(jsonDataToLog)) + " , ";
        //process.send(analyticsData);
        fs.appendFileSync(jsonDataToLog.generics.unsentEventFileLocation, analyticsData, 'utf8');
    }
}

/*
 * Read the unsent file if exists add those to ping data and send as a single json request
 * If there is a failure scenario write the data back to disk
*/

function sendAllEvents(jsonDataToLog) {

    var analyticsData = JSON.stringify(getAnalyticsData(jsonDataToLog)),
        dataToSend = "",
        content = "";


    if (fs.existsSync( jsonDataToLog.generics.unsentEventFileLocation )) {
        content = fs.readFileSync(jsonDataToLog.generics.unsentEventFileLocation, "utf8").toString();
        fs.unlinkSync(jsonDataToLog.generics.unsentEventFileLocation); // deleting the file immediately after read.
        //changing date timestamp to time right now
        dataToSend = (defaultStartOfEventJson + content + analyticsData + defaultEndOfEventJson).
                            replace(timeToBeReplacedRegex, new Date().toISOString());
    }else {
        //changing date timestamp to time right now
        dataToSend = (defaultStartOfEventJson + analyticsData + defaultEndOfEventJson).
                            replace(timeToBeReplacedRegex, new Date().toISOString());
    }
    //process.send(dataToSend);
    sendData(jsonDataToLog, dataToSend, analyticsData, content);
}


function sendData(jsonDataToLog, dataToSend, content, analyticsData) {

    process.send(dataToSend);

    xhr.open("POST", "https://cc-api-data-stage.adobe.io/ingest/", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("x-api-key", "brackets-service");

    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                savedEventMap = {};
                process.send("Data Sent");
            } else {
                process.send("not200" + xhr.status);
                fs.appendFileSync(jsonDataToLog.generics.unsentEventFileLocation, content + "," + analyticsData, 'utf8');
            }
        }else {
            process.send("failed xhr");
            fs.appendFileSync(jsonDataToLog.generics.unsentEventFileLocation, content + "," + analyticsData, 'utf8');
        }
    };

    xhr.onerror = function (e) {
        process.send("error" + xhr.statusText);
        fs.appendFileSync(jsonDataToLog.generics.unsentEventFileLocation, content + "," + analyticsData, 'utf8');
    };

    xhr.send(dataToSend);
}


function getCurrentDate() {
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) { month = '0' + month; }
    if (day.length < 2)  { day = '0' + day; }

    return [year, month, day].join('-');
}


/**
 *@param{Object} eventParams contails Event Data
 * will return complete Analyics Data in Json Format
 */
function getAnalyticsData(jsonDataToLog) {
    return {
        project: jsonDataToLog.generics.project,
        environment: jsonDataToLog.generics.environment,
        time: timeToBeReplaced,
        ingesttype: "dunamis",
        data: {
            "event.guid": uuid.v4(),
            "event.user_guid": jsonDataToLog.generics.userGuid,
            "event.dts_end": new Date().toISOString(),
            "event.category": jsonDataToLog.eventParams.eventCategory,
            "event.subcategory": jsonDataToLog.eventParams.eventSubCategory,
            "event.type": jsonDataToLog.eventParams.eventType,
            "event.subtype": jsonDataToLog.eventParams.eventSubType,
            "event.user_agent": jsonDataToLog.generics.userAgent,
            "event.language": jsonDataToLog.generics.language,
            "source.name": jsonDataToLog.generics.version,
            "source.platform": jsonDataToLog.generics.platform,
            "source.version": jsonDataToLog.generics.version
        }
    };
}
