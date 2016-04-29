/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/*global define */

define(function (require, exports, module) {
    "use strict";

    var FileUtils       = require("file/FileUtils"),
        EventDispatcher = require("utils/EventDispatcher"),
        FindUtils       = require("search/FindUtils"),
        MainViewManager = require("view/MainViewManager");

    /**
     * @constructor
     * Manages a set of search query and result data.
     * Dispatches these events:
     *      "change" - whenever the results have been updated. Note that it's up to people who
     *      edit the model to call fireChange() when necessary - it doesn't automatically fire.
     */
    function SearchModel() {
        this.clear();
    }
    EventDispatcher.makeEventDispatcher(SearchModel.prototype);

    /** @const Constant used to define the maximum results found.
     *  Note that this is a soft limit - we'll likely go slightly over it since
     *  we always add all the searches in a given file.
     */
    SearchModel.MAX_TOTAL_RESULTS = 100000;

    /**
     * The current set of results.
     * @type {Object.<fullPath: string, {matches: Array.<Object>, collapsed: boolean, timestamp: Date}>}
     */
    SearchModel.prototype.results = null;

    /**
     * The query that generated these results.
     * @type {{query: string, caseSensitive: boolean, isRegexp: boolean}}
     */
    SearchModel.prototype.queryInfo = null;

    /**
     * The compiled query, expressed as a regexp.
     * @type {RegExp}
     */
    SearchModel.prototype.queryExpr = null;

    /**
     * Whether this is a find/replace query.
     * @type {boolean}
     */
    SearchModel.prototype.isReplace = false;

    /**
     * The replacement text specified for this query, if any.
     * @type {string}
     */
    SearchModel.prototype.replaceText = null;

    /**
     * The file/folder path representing the scope that this query was performed in.
     * @type {FileSystemEntry}
     */
    SearchModel.prototype.scope = null;

    /**
     * A file filter (as returned from FileFilters) to apply within the main scope.
     * @type {string}
     */
    SearchModel.prototype.filter = null;

    /**
     * The total number of matches in the model.
     * @type {number}
     */
    SearchModel.prototype.numMatches = 0;

    /**
     * Whether or not we hit the maximum number of results for the type of search we did.
     * @type {boolean}
     */
    SearchModel.prototype.foundMaximum = false;

    /**
     * Whether or not we exceeded the maximum number of results in the search we did.
     * @type {boolean}
     */
    SearchModel.prototype.exceedsMaximum = false;

    /**
     * Clears out the model to an empty state.
     */
    SearchModel.prototype.clear = function () {
        this.results = {};
        this.queryInfo = null;
        this.queryExpr = null;
        this.isReplace = false;
        this.replaceText = null;
        this.scope = null;
        this.numMatches = 0;
        this.foundMaximum = false;
        this.exceedsMaximum = false;
        this.fireChanged();
    };

    /**
     * Sets the given query info and stores a compiled RegExp query in this.queryExpr.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo
     * @return {boolean} true if the query was valid and properly set, false if it was
     *      invalid or empty.
     */
    SearchModel.prototype.setQueryInfo = function (queryInfo) {
        var parsedQuery = FindUtils.parseQueryInfo(queryInfo);
        if (parsedQuery.valid) {
            this.queryInfo = queryInfo;
            this.queryExpr = parsedQuery.queryExpr;
            return true;
        } else {
            return false;
        }
    };

    /**
     * Sets the list of matches for the given path, removing the previous match info, if any, and updating
     * the total match count. Note that for the count to remain accurate, the previous match info must not have
     * been mutated since it was set.
     * @param {string} fullpath Full path to the file containing the matches.
     * @param {!{matches: Object, timestamp: Date, collapsed: boolean=}} resultInfo Info for the matches to set:
     *      matches - Array of matches, in the format returned by FindInFiles._getSearchMatches()
     *      timestamp - The timestamp of the document at the time we searched it.
     *      collapsed - Optional: whether the results should be collapsed in the UI (default false).
     */
    SearchModel.prototype.setResults = function (fullpath, resultInfo) {
        this.removeResults(fullpath);

        if (this.foundMaximum || !resultInfo.matches.length) {
            return;
        }

        // Make sure that the optional `collapsed` property is explicitly set to either true or false,
        // to avoid logic issues later with comparing values.
        resultInfo.collapsed = !!resultInfo.collapsed;

        this.results[fullpath] = resultInfo;
        this.numMatches += resultInfo.matches.length;
        if (this.numMatches >= SearchModel.MAX_TOTAL_RESULTS) {
            this.foundMaximum = true;

            // Remove final result if there have been over MAX_TOTAL_RESULTS found
            if (this.numMatches > SearchModel.MAX_TOTAL_RESULTS) {
                this.results[fullpath].matches.pop();
                this.numMatches--;
                this.exceedsMaximum = true;
            }
        }
    };

    /**
     * Removes the given result's matches from the search results and updates the total match count.
     * @param {string} fullpath Full path to the file containing the matches.
     */
    SearchModel.prototype.removeResults = function (fullpath) {
        if (this.results[fullpath]) {
            this.numMatches -= this.results[fullpath].matches.length;
            delete this.results[fullpath];
        }
    };

    /**
     * @return {boolean} true if there are any results in this model.
     */
    SearchModel.prototype.hasResults = function () {
        return Object.keys(this.results).length > 0;
    };

    /**
     * Counts the total number of matches and files
     * @return {{files: number, matches: number}}
     */
    SearchModel.prototype.countFilesMatches = function () {
        return {files: (this.numFiles || Object.keys(this.results).length), matches: this.numMatches};
    };

    /**
     * Prioritizes the open file and then the working set files to the starting of the list of files
     * If node search is disabled, we sort the files too- Sorting is computation intensive, and our
     * ProjectManager.getAllFiles with the sort flag is not working properly : TODO TOFIX
     * @param {?string} firstFile If specified, the path to the file that should be sorted to the top.
     * @return {Array.<string>}
     */
    SearchModel.prototype.prioritizeOpenFile = function (firstFile) {
        var workingSetFiles = MainViewManager.getWorkingSet(MainViewManager.ALL_PANES),
            workingSetFileFound = {},
            fileSetWithoutWorkingSet = [],
            startingWorkingFileSet = [],
            propertyName = "",
            i = 0;

        if (FindUtils.isNodeSearchDisabled()) {
            return Object.keys(this.results).sort(function (key1, key2) {
                if (firstFile === key1) {
                    return -1;
                } else if (firstFile === key2) {
                    return 1;
                }
                return FileUtils.comparePaths(key1, key2);
            });
        }

        firstFile = firstFile || "";

        // Create a working set path map which indicates if a file in working set is found in file list
        for (i = 0; i < workingSetFiles.length; i++) {
            workingSetFileFound[workingSetFiles[i].fullPath] = false;
        }

        // Remove all the working set files from the filtration list
        fileSetWithoutWorkingSet = Object.keys(this.results).filter(function (key) {
            if (workingSetFileFound[key] !== undefined) {
                workingSetFileFound[key] = true;
                return false;
            }
            return true;
        });

        //push in the first file
        if (workingSetFileFound[firstFile] === true) {
            startingWorkingFileSet.push(firstFile);
            workingSetFileFound[firstFile] = false;
        }
        //push in the rest of working set files already present in file list
        for (propertyName in workingSetFileFound) {
            if (workingSetFileFound.hasOwnProperty(propertyName) && workingSetFileFound[propertyName]) {
                startingWorkingFileSet.push(propertyName);
            }
        }
        return startingWorkingFileSet.concat(fileSetWithoutWorkingSet);
    };

    /**
     * Notifies listeners that the set of results has changed. Must be called after the
     * model is changed.
     * @param {boolean} quickChange Whether this type of change is one that might occur
     *      often, meaning that the view should buffer updates.
     */
    SearchModel.prototype.fireChanged = function (quickChange) {
        this.trigger("change", quickChange);
    };

    // Public API
    exports.SearchModel = SearchModel;
});
