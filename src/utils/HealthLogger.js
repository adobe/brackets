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

/**
 *  Utilities functions related to Health Data logging
 */
define(function (require, exports, module) {
    "use strict";

    var PreferencesManager          = require("preferences/PreferencesManager"),
        LanguageManager             = require("language/LanguageManager"),
        FileUtils                   = require("file/FileUtils"),
        PerfUtils                   = require("utils/PerfUtils"),
        FindUtils                   = require("search/FindUtils"),
        StringUtils                 = require("utils/StringUtils"),

        HEALTH_DATA_STATE_KEY       = "HealthData.Logs",
        logHealthData               = true;

    /**
     * Init: creates the health log preference keys in the state.json file
     */
    function init() {
        PreferencesManager.stateManager.definePreference(HEALTH_DATA_STATE_KEY, "object", {});
    }

    /**
     * All the logging functions should be disabled if this returns false
     * @return {boolean} true if health data can be logged
     */
    function shouldLogHealthData() {
        return logHealthData;
    }

    /**
     * Return all health data logged till now stored in the state prefs
     * @return {Object} Health Data aggregated till now
     */
    function getStoredHealthData() {
        var storedData = PreferencesManager.getViewState(HEALTH_DATA_STATE_KEY) || {};
        return storedData;
    }

    /**
     * Return the aggregate of all health data logged till now from all sources
     * @return {Object} Health Data aggregated till now
     */
    function getAggregatedHealthData() {
        var healthData = getStoredHealthData();
        $.extend(healthData, PerfUtils.getHealthReport());
        $.extend(healthData, FindUtils.getHealthReport());
        return healthData;
    }

    /**
     * Sets the health data
     * @param {Object} dataObject The object to be stored as health data
     */
    function setHealthData(dataObject) {
        if (!shouldLogHealthData()) {
            return;
        }
        PreferencesManager.setViewState(HEALTH_DATA_STATE_KEY, dataObject);
    }

    /**
     * Returns health data logged for the given key
     * @return {Object} Health Data object for the key or undefined if no health data stored
     */
    function getHealthDataLog(key) {
        var healthData = getStoredHealthData();
        return healthData[key];
    }

    /**
     * Sets the health data for the given key
     * @param {Object} dataObject The object to be stored as health data for the key
     */
    function setHealthDataLog(key, dataObject) {
        var healthData = getStoredHealthData();
        healthData[key] = dataObject;
        setHealthData(healthData);
    }

    /**
     * Clears all the health data recorded till now
     */
    function clearHealthData() {
        PreferencesManager.setViewState(HEALTH_DATA_STATE_KEY, {});
        //clear the performance related health data also
        PerfUtils.clear();
    }

    /**
     * Enable or disable health data logs
     * @param {boolean} enabled true to enable health logs
     */
    function setHealthLogsEnabled(enabled) {
        logHealthData = enabled;
        if (!enabled) {
            clearHealthData();
        }
    }

    /**
     * Whenever a file is opened call this function. The function will record the number of times
     * the standard file types have been opened. We only log the standard filetypes
     * @param {String} filePath          The path of the file to be registered
     * @param {boolean} addedToWorkingSet set to true if extensions of files added to the
     *                                    working set needs to be logged
     */
    function fileOpened(filePath, addedToWorkingSet) {
        if (!shouldLogHealthData()) {
            return;
        }
        var fileExtension = FileUtils.getFileExtension(filePath),
            language = LanguageManager.getLanguageForPath(filePath),
            healthData = getStoredHealthData(),
            fileExtCountMap = [];
        healthData.fileStats = healthData.fileStats || {
            openedFileExt     : {},
            workingSetFileExt : {}
        };
        if (language.getId() !== "unknown") {
            fileExtCountMap = addedToWorkingSet ? healthData.fileStats.workingSetFileExt : healthData.fileStats.openedFileExt;
            if (!fileExtCountMap[fileExtension]) {
                fileExtCountMap[fileExtension] = 0;
            }
            fileExtCountMap[fileExtension]++;
            setHealthData(healthData);
        }
    }

    /**
     * Sets the project details(a probably unique prjID, number of files in the project and the node cache size) in the health log
     * The name of the project is never saved into the health data log, only the hash(name) is for privacy requirements.
     * @param {string} projectName The name of the project
     * @param {number} numFiles    The number of file in the project
     * @param {number} cacheSize   The node file cache memory consumed by the project
     */
    function setProjectDetail(projectName, numFiles, cacheSize) {
        var projectNameHash = StringUtils.hashCode(projectName),
            FIFLog = getHealthDataLog("ProjectDetails");
        if (!FIFLog) {
            FIFLog = {};
        }
        FIFLog["prj" + projectNameHash] = {
            numFiles : numFiles,
            cacheSize : cacheSize
        };
        setHealthDataLog("ProjectDetails", FIFLog);
    }

    /**
     * Increments health log count for a particular kind of search done
     * @param {string} searchType The kind of search type that needs to be logged- should be a js var compatible string
     */
    function searchDone(searchType) {
        var searchDetails = getHealthDataLog("searchDetails");
        if (!searchDetails) {
            searchDetails = {};
        }
        if (!searchDetails[searchType]) {
            searchDetails[searchType] = 0;
        }
        searchDetails[searchType]++;
        setHealthDataLog("searchDetails", searchDetails);
    }

    // Define public API
    exports.getHealthDataLog          = getHealthDataLog;
    exports.setHealthDataLog          = setHealthDataLog;
    exports.getAggregatedHealthData   = getAggregatedHealthData;
    exports.clearHealthData           = clearHealthData;
    exports.fileOpened                = fileOpened;
    exports.setProjectDetail          = setProjectDetail;
    exports.searchDone                = searchDone;
    exports.setHealthLogsEnabled      = setHealthLogsEnabled;
    exports.shouldLogHealthData       = shouldLogHealthData;
    exports.init                      = init;

    // constants
    // searchType for searchDone()
    exports.SEARCH_INSTANT            = "searchInstant";
    exports.SEARCH_ON_RETURN_KEY      = "searchOnReturnKey";
    exports.SEARCH_REPLACE_ALL        = "searchReplaceAll";
    exports.SEARCH_NEXT_PAGE          = "searchNextPage";
    exports.SEARCH_PREV_PAGE          = "searchPrevPage";
    exports.SEARCH_LAST_PAGE          = "searchLastPage";
    exports.SEARCH_FIRST_PAGE         = "searchFirstPage";
    exports.SEARCH_REGEXP             = "searchRegExp";
    exports.SEARCH_CASE_SENSITIVE     = "searchCaseSensitive";
    // A new search context on search bar up-Gives an idea of number of times user did a discrete search
    exports.SEARCH_NEW                = "searchNew";
});
