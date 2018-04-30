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
var fs 					    = require("fs"),
    uuid                    = require("uuid").v4,
    savedEventMap           = {},
    timeToBeReplaced 	    = "Snchit",
    timeToBeReplacedRegex   = new RegExp(timeToBeReplaced, 'g'),
    defaultStartOfEventJson = "{\"events\": [",
    defaultEndOfEventJson   = "]}",
    XMLHttpRequest          = require("xmlhttprequest").XMLHttpRequest,
    xhr                     = new XMLHttpRequest();

process.on('message', function(dataToLog) {

    var dataToWrite = JSON.parse(dataToLog);

    rejectOrSendOrSaveAnalyticsData(dataToWrite);

    //results back to parent process
    //process.send("Success");
});


function rejectOrSendOrSaveAnalyticsData(jsonDataToLog) {

    var unsentEventsFileLocation = jsonDataToLog.generics.unsentEventFileLocation;
    // if file doesn't exist, write the json open array

    if (!fs.existsSync( unsentEventsFileLocation )) {
        process.send("File doesn't exist creating the file");
        fs.writeFileSync(unsentEventsFileLocation, defaultStartOfEventJson, 'utf8');
    }

    if (jsonDataToLog.eventParams.eventCategory === "pingData") {
        /* means this is a ping data which we receive every 24 hrs.
            we should send all the data from the event file
        */
        process.send("Ping Data receivd");
        sendAllEvents(jsonDataToLog, unsentEventsFileLocation);
    }else {
        var eventKey = jsonDataToLog.eventParams.eventName + "_" + getCurrentDate();
        if(!(eventKey in savedEventMap)){
            process.send("Normal Data receivd");
            saveEventToDisk(jsonDataToLog, unsentEventsFileLocation);
        }
    }
}

function saveEventToDisk(jsonDataToLog, unsentEventsFileLocation) {
    // Saving the event+currentDate in the map
    // This will insure that event is stored only once in a day

    var eventKey = jsonDataToLog.eventParams.eventName + "_" + getCurrentDate();
    savedEventMap[eventKey] = true;

    var analyticsData = JSON.stringify(getAnalyticsData(jsonDataToLog)) + " , ";

    process.send(analyticsData);

    fs.appendFileSync(unsentEventsFileLocation, analyticsData, 'utf8');

    process.send(JSON.stringify(savedEventMap));
}

function sendAllEvents(jsonDataToLog, unsentEventsFileLocation) {

    var analyticsData = JSON.stringify(getAnalyticsData(jsonDataToLog));

    var content = fs.readFileSync(unsentEventsFileLocation, "utf8");
    fs.unlinkSync(unsentEventsFileLocation); // deleting the file immediately after read.

    var dataToSend = (content + analyticsData + defaultEndOfEventJson).
                        replace(timeToBeReplacedRegex, new Date().toISOString());
    
    // changing date timestamp to time right now
    // xhr.open("POST", "https://cc-api-data-stage.adobe.io/ingest/", true);
    // xhr.setRequestHeader("Content-Type", "application/json");
    // xhr.setRequestHeader("x-api-key", "brackets-service");

    // xhr.onreadystatechange = function() {
    //     if ((this.status === 200)) {
    //         savedEventMap = {};
    //         process.send("Data Sent");
    //    } else {
    //     process.send("Unable to send data" + this.status);
    //    }
    // };
    // process.send(dataToSend);
    // xhr.send(dataToSend);

    $.ajax({
        url: jsonDataToLog.generics.ingestURL,
        type: "POST",
        data: dataToSend,
        headers: {
            "Content-Type": "application/json",
            "x-api-key": jsonDataToLog.generics.ingestKey
        }
    }).done(function () {
        savedEventMap = {};
        process.send("Data Sent");
    }).fail(function (jqXHR, status, errorThrown) {
        // write analyticsData + content back to file
        process.send("Data Send Failed");
        fs.appendFileSync(unsentEventsFileLocation, analyticsData + content + " , ", 'utf8');
        console.error("Error in sending Adobe Analytics Data. Response : " + jqXHR.responseText + ". Status : " + status + ". Error : " + errorThrown);
    });
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
            "event.dts_end": timeToBeReplaced,
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
