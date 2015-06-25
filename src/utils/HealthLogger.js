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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, jQuery*/

/**
 *  Utilities functions related to Health data loggig
 */
define(function (require, exports, module) {
    "use strict";

    var PreferencesManager          = require("preferences/PreferencesManager"),
        LanguageManager             = require("language/LanguageManager"),
        FileUtils                   = require("file/FileUtils"),
        PerfUtils                   = require("utils/PerfUtils"),

        HEALTH_DATA_STATE_KEY       = "HealthData.Logs",
        logHealthData               = true;

    /**
     * Init: creates the health log preference keys in the state.json file
     */
    function init() {
        PreferencesManager.stateManager.definePreference(HEALTH_DATA_STATE_KEY, "object", {});
    }

    /**
     * Return the Performance related data
     * @returns {Object} Performance Data aggregated till now
     */
    function getPerformanceData() {
        var perfData = PerfUtils.getHealthReport();
        return perfData;
    }

    /**
     * Return the aggregate of all health data logged till now from all sources
     * @returns {Object} Health Data aggregated till now
     */
    function getAggregatedHealthData() {
        var healthData = PreferencesManager.getViewState(HEALTH_DATA_STATE_KEY);
        jQuery.extend(healthData, getPerformanceData());
        return healthData;
    }

    /**
     * Return all health data logged till now stored in the state prefs
     * @returns {Object} Health Data aggregated till now
     */
    function getHealthData() {
        var healthData = PreferencesManager.getViewState(HEALTH_DATA_STATE_KEY);
        return healthData;
    }

    /**
     * Sets the health data
     * @returns {Object} The object to be stored as health data
     */
    function setHealthData(dataObject) {
        PreferencesManager.setViewState(HEALTH_DATA_STATE_KEY, dataObject);
    }

    /**
     * Clears all the health data recorded till now
     */
    function clearHealthData() {
        PreferencesManager.setViewState(HEALTH_DATA_STATE_KEY, {});
        //clear the preformance relaed health data also
        PerfUtils.clear();
    }

    /**
     * Enable or disable health data logs
     * @param {Boolean} enabled true to enable health logs
     */
    function setHealthLogsEnabled(enabled) {
        logHealthData = enabled;
        if (!enabled) {
            clearHealthData();
        }
    }

    /**
     * All the logging functions should be disabled if this returns false
     * @returns {Boolean} true if health data can be logged
     */
    function shouldLogHealthData() {
        return logHealthData;
    }

    /**
     * When ever a file is opened call this function. The function will record the number of times
     * the standard file types have been opened. We only log the standard filetypes
     * @param {String} filePath          The path of the file to be registered
     * @param {Boolean} addedToWorkingSet set to true if extensions of files added to the
     *                                    working set needs to be logged
     */
    function fileOpened(filePath, addedToWorkingSet) {
        if (!shouldLogHealthData()) {
            return;
        }
        var fileextension = FileUtils.getFileExtension(filePath),
            language = LanguageManager.getLanguageForPath(filePath),
            healthData = getHealthData();
        healthData.fileStats = healthData.fileStats || {
            openedFileExt     : {},
            workingSetFileExt : {}
        };
        if (language.getId() !== "unknown") {
            if (addedToWorkingSet) {
                healthData.fileStats.workingSetFileExt[fileextension] = healthData.fileStats.workingSetFileExt[fileextension] ? healthData.fileStats.workingSetFileExt[fileextension] + 1 : 1;
            } else {
                healthData.fileStats.openedFileExt[fileextension] = healthData.fileStats.openedFileExt[fileextension] ? healthData.fileStats.openedFileExt[fileextension] + 1 : 1;
            }
            setHealthData(healthData);
        }
    }

    // Define public API
    exports.getHealthData             = getHealthData;
    exports.getAggregatedHealthData   = getAggregatedHealthData;
    exports.clearHealthData           = clearHealthData;
    exports.fileOpened                = fileOpened;
    exports.setHealthLogsEnabled      = setHealthLogsEnabled;
    exports.init                      = init;
});
