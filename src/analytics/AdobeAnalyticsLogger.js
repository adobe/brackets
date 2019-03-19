/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*
 * The core search functionality used by Find in Files and single-file Replace Batch.
 */

define(function (require, exports, module) {
    "use strict";

    var PreferencesManager    = require("preferences/PreferencesManager"),
        NodeDomain            = require("utils/NodeDomain"),
        FileUtils             = require("file/FileUtils");

    var _bracketsPath            = FileUtils.getNativeBracketsDirectoryPath(),
        _modulePath              = FileUtils.getNativeModuleDirectoryPath(module),
        _nodePath                = "node/AdobeAnalyticsLoggerDomain",
        _domainPath              = [_bracketsPath, _modulePath, _nodePath].join("/"),
        adobeAanalyticsDomain    = new NodeDomain("LogAdobeAnalytics", _domainPath),
        argsForAnalytics         = {},
        defaultEventParams = {
            eventCategory: "pingData",
            eventSubCategory: "",
            eventType: "",
            eventSubType: ""
        };

    function logToAdobeAnalytics(eventParams) {

        if (eventParams == null) {
            console.log("Ping Data received Snchit");
            eventParams = defaultEventParams;
        }
        if(argsForAnalytics) {
            setAnalyticsArguments();
        }
        var dataToLog = {generics: argsForAnalytics, eventParams: eventParams};

        adobeAanalyticsDomain.exec("aggregateLogs", dataToLog);
    }

    function setAnalyticsArguments() {
        argsForAnalytics = {
            ingestURL: brackets.config.analyticsDataServerURL,
            ingestKey: brackets.config.serviceKey,
            project: brackets.config.serviceKey,
            environment: brackets.config.environment,
            userGuid: PreferencesManager.getViewState("OlderUUID") || PreferencesManager.getViewState("UUID"),
            userAgent: window.navigator.userAgent || "",
            language: brackets.app.language,
            name: brackets.metadata.version,
            platform: brackets.platform,
            version: brackets.metadata.version,
            unsentEventFileLocation: brackets.app.getApplicationSupportDirectory() + "/unsentEventFile.txt"
        };
    }

    // Public exports
    exports.logToAdobeAnalytics  = logToAdobeAnalytics;

});
