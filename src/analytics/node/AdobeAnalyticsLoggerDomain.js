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

var _domainManager;
var ChildProcess = require('child_process');

var AdobeAnalyticsWorker = null;

function aggregateLogs (dataToLog){

    // Send child process some work
    //console.log("inside aggregateLogs: " + JSON.stringify(dataToLog));
    
    AdobeAnalyticsWorker.send(JSON.stringify(dataToLog));
    AdobeAnalyticsWorker.on('message', function(m) {
        console.log('received: ' + m);
        return m;
    });

    console.log("hello analytics");
}

function init(domainManager) {
    if (!domainManager.hasDomain("LogAdobeAnalytics")) {
        domainManager.registerDomain("LogAdobeAnalytics", {major: 0, minor: 1});
    }

    _domainManager = domainManager;

    domainManager.registerCommand(
        "LogAdobeAnalytics",       // domain name
        "aggregateLogs",    // command name
        aggregateLogs,   // command handler function
        false,          // this command is synchronous in Node
        "Searches in project files and returns matches",
        [{name: "dataToLog", // parameters
            type: "object",
            description: "Object containing event data"}]
    );

    AdobeAnalyticsWorker = ChildProcess.fork(__dirname + '/AdobeAnalyticsWorker');
}

exports.init = init;
