/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, brackets */

/*
 * Manages a collection of FileIndexes where each index maintains a list of information about
 * files that meet the criteria specified by the index. The indexes are created lazily when
 * they are queried and marked dirty when Brackets becomes active.
 *
 * TODO (issue 325 ) - FileIndexer doesn't currently add a file to the index when the user createa
 * a new file within brackets.
 *
 */


define(function (require, exports, module) {
    "use strict";
    
    var PerfUtils           = require("utils/PerfUtils"),
        ProjectManager      = require("project/ProjectManager"),
        FileUtils           = require("file/FileUtils"),
        Dialogs             = require("widgets/Dialogs"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        CollectionUtils     = require("utils/CollectionUtils"),
        Strings             = require("strings");

    /**
     * All the indexes are stored in this object. The key is the name of the index
     * and the value is a FileIndex. 
     */
    var _indexList = {};

    /**
     * Tracks whether _indexList should be considered dirty and invalid. Calls that access
     * any data in _indexList should call syncFileIndex prior to accessing the data.
     * Note that if _scanDeferred is non-null, the index is dirty even if _indexListDirty is false.
     * @type {boolean}
     */
    var _indexListDirty = true;
    
    /**
     * A serial number that we use to figure out if a scan has been restarted. When this
     * changes, any outstanding async callbacks for previous scans should no-op.
     * @type {number}
     */
    var _scanID = 0;

    /**
     * Store whether the index manager has exceeded the limit so the warning dialog only
     * appears once.
     * @type {boolean}
     */
    var _maxFileDialogDisplayed = false;

    /** class FileIndex
     *
     * A FileIndex contains an array of fileInfos that meet the criteria specified by
     * the filterFunction. FileInfo's in the fileInfo array should unique map to one file.
     *  
     * @constructor
     * @param {!string} indexname
     * @param {function({!entry})} filterFunction returns true to indicate the entry
     *                             should be included in the index
     */
    function FileIndex(indexName, filterFunction) {
        this.name = indexName;
        this.fileInfos = [];
        this.filterFunction = filterFunction;
    }

    /** class FileInfo
     * 
     *  Class to hold info about a file that a FileIndex wishes to retain.
     *
     * @constructor
     * @param {!string}
     */
    function FileInfo(entry) {
        this.name = entry.name;
        this.fullPath = entry.fullPath;
    }


    /**
     * Adds a new index to _indexList and marks the list dirty 
     *
     * A future performance optimization is to only build the new index rather than 
     * marking them all dirty
     *
     * @private
     * @param {!string} indexName must be unque
     * @param {!function({entry} filterFunction should return true to include an
     *   entry in the index
     */
    function _addIndex(indexName, filterFunction) {
        if (_indexList.hasOwnProperty(indexName)) {
            console.error("Duplicate index name");
            return;
        }
        if (typeof filterFunction !== "function") {
            console.error("Invalid arguments");
            return;
        }

        _indexList[indexName] = new FileIndex(indexName, filterFunction);

        _indexListDirty = true;
    }


    /**
     * Checks the entry against the filterFunction for each index and adds
     * a fileInfo to the index if the entry meets the criteria. FileInfo's are
     * shared between indexes.
     *
     * @private
     * @param {!entry} entry to be added to the indexes
     */
    // future use when files are incrementally added
    //
    function _addFileToIndexes(entry) {

        // skip invisible files
        if (!ProjectManager.shouldShow(entry)) {
            return;
        }
        
        var fileInfo = new FileInfo(entry);
        
        // skip zipped/binary files
        if (ProjectManager.isBinaryFile(fileInfo.name)) {
            return;
        }
        
        //console.log(entry.name);
  
        CollectionUtils.forEach(_indexList, function (index, indexName) {
            if (index.filterFunction(entry)) {
                index.fileInfos.push(fileInfo);
            }
        });
    }
    
    /**
     * Error dialog when max files in index is hit
     * @return {Dialog}
     */
    function _showMaxFilesDialog() {
        return Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.ERROR_MAX_FILES_TITLE,
            Strings.ERROR_MAX_FILES
        );
    }

    /**
     * Clears the fileInfo array for all the indexes in _indexList
     * @private
     */
    function _clearIndexes() {
        CollectionUtils.forEach(_indexList, function (index, indexName) {
            index.fileInfos = [];
        });
    }

    /* Recursively visits all files that are descendent of dirEntry and adds
     * files files to each index when the file matches the filter criteria.
     * If a scan is already in progress when this is called, the existing scan
     * is aborted and its promise will never resolve.
     * @private
     * @param {!DirectoryEntry} dirEntry
     * @returns {$.Promise}
     */
    function _scanDirectorySubTree(dirEntry) {
        if (!dirEntry) {
            console.error("Bad dirEntry passed to _scanDirectorySubTree");
            return;
        }
        
        // Clear out our existing data structures.
        _clearIndexes();
        
        // Increment the scan ID, so any callbacks from a previous scan will know not to do anything.
        _scanID++;

        // keep track of directories as they are asynchronously read. We know we are done
        // when dirInProgress becomes empty again.
        var state = { fileCount: 0,
                      dirInProgress: {},    // directory names that are in progress of being read
                      dirError: {},         // directory names with read errors. key=dir path, value=error
                      maxFilesHit: false    // used to show warning dialog only once
                    };

        var deferred = new $.Deferred(),
            curScanID = _scanID;

        // inner helper function
        function _dirScanDone() {
            var key;
            for (key in state.dirInProgress) {
                if (state.dirInProgress.hasOwnProperty(key)) {
                    return false;
                }
            }
            return true;
        }

        function _finishDirScan(dirEntry) {
            //console.log("finished: " + dirEntry.fullPath);
            delete state.dirInProgress[dirEntry.fullPath];

            if (_dirScanDone()) {
                //console.log("dir scan completly done");
                deferred.resolve();
            }
        }

        // inner helper function
        function _scanDirectoryRecurse(dirEntry) {
            // skip invisible directories
            if (!ProjectManager.shouldShow(dirEntry)) {
                return;
            }

            state.dirInProgress[dirEntry.fullPath] = true;
            //console.log("started dir: " + dirEntry.fullPath);

            dirEntry.createReader().readEntries(
                // success callback
                function (entries) {
                    if (curScanID !== _scanID) {
                        // We're a callback for an aborted scan. Do nothing.
                        return;
                    }
                    
                    // inspect all children of dirEntry
                    entries.forEach(function (entry) {
                        // For now limit the number of files that are indexed by preventing adding files
                        // or scanning additional directories once a max has been hit. Also notify the 
                        // user once via a dialog. This limit could be increased
                        // if files were indexed in a worker thread so scanning didn't block the UI
                        if (state.fileCount > 16000) {
                            if (!state.maxFilesHit) {
                                state.maxFilesHit = true;
                                if (!_maxFileDialogDisplayed) {
                                    _showMaxFilesDialog();
                                    _maxFileDialogDisplayed = true;
                                } else {
                                    console.warn("The maximum number of files have been indexed. Actions " +
                                                 "that lookup files in the index may function incorrectly.");
                                }
                            }
                            return;
                        }

                        if (entry.isFile) {
                            _addFileToIndexes(entry);
                            state.fileCount++;

                        } else if (entry.isDirectory) {
                            _scanDirectoryRecurse(entry);
                        }
                    });
                    _finishDirScan(dirEntry);
                },
                // error callback
                function (error) {
                    state.dirError[dirEntry.fullPath] = error;
                    _finishDirScan(dirEntry);
                }
            );
        }

        _scanDirectoryRecurse(dirEntry);

        return deferred.promise();
    }
    
    // debug 
    function _logFileList(list) {
        list.forEach(function (fileInfo) {
            console.log(fileInfo.name);
        });
        console.log("length: " + list.length);
    }

    /**
     * Used by syncFileIndex function to prevent reentrancy
     * @private
     */
    var _scanDeferred = null;

    /**
     * Clears and rebuilds all of the fileIndexes and sets _indexListDirty to false
     * @return {$.Promise} resolved when index has been updated
     */
    function syncFileIndex() {
        if (_indexListDirty) {
            _indexListDirty = false;

            // If we already had an existing scan going, we want to use its deferred for
            // notifying when the new scan is complete (so existing callers will get notified),
            // and we don't want to start a new measurement.
            if (!_scanDeferred) {
                _scanDeferred = new $.Deferred();
                PerfUtils.markStart(PerfUtils.FILE_INDEX_MANAGER_SYNC);
            }
            
            // If there was already a scan running, this will abort it and start a new
            // scan. The old scan's promise will never resolve, so the net result is that
            // the `done` handler below will only execute when the final scan actually
            // completes.
            _scanDirectorySubTree(ProjectManager.getProjectRoot())
                .done(function () {
                    PerfUtils.addMeasurement(PerfUtils.FILE_INDEX_MANAGER_SYNC);
                    _scanDeferred.resolve();
                    _scanDeferred = null;

                    //_logFileList(_indexList["all"].fileInfos);
                    //_logFileList(_indexList["css"].fileInfos);
                });
            return _scanDeferred.promise();
        } else {
            // If we're in the middle of a scan, return its promise, otherwise resolve immediately.
            return _scanDeferred ? _scanDeferred.promise() : new $.Deferred().resolve().promise();
        }
    }

    /**
     * Markes all file indexes dirty
     */
    function markDirty() {
        _indexListDirty = true;
        
        // If there's a scan already in progress, abort and restart it.
        if (_scanDeferred) {
            syncFileIndex();
        }
    }

    /**
     * Returns the FileInfo array for the specified index
     * @param {!string} indexname
     * @return {$.Promise} a promise that is resolved with an Array of FileInfo's
     */
    function getFileInfoList(indexName) {
        var result = new $.Deferred();

        if (!_indexList.hasOwnProperty(indexName)) {
            console.error("indexName not found");
            return;
        }

        syncFileIndex()
            .done(function () {
                result.resolve(_indexList[indexName].fileInfos);
            });

        return result.promise();
    }
    
    /**
     * Calls the filterFunction on every in the index specified by indexName
     * and return a a new list of FileInfo's
     * @param {!string}
     * @param {function({string})} filterFunction
     * @return {$.Promise} a promise that is resolved with an Array of FileInfo's
     */
    function getFilteredList(indexName, filterFunction) {
        var result = new $.Deferred();

        if (!_indexList.hasOwnProperty(indexName)) {
            console.error("indexName not found");
            return;
        }

        syncFileIndex()
            .done(function () {
                var resultList = [];
                getFileInfoList(indexName)
                    .done(function (fileList) {
                        resultList = fileList.filter(function (fileInfo) {
                            return filterFunction(fileInfo.name);
                        });

                        result.resolve(resultList);
                    });
            });

        return result.promise();
    }
    
    /**
     * returns an array of fileInfo's that match the filename parameter
     * @param {!string} indexName
     * @param {!filename}
     * @return {$.Promise} a promise that is resolved with an Array of FileInfo's
     */
    function getFilenameMatches(indexName, filename) {
        return getFilteredList(indexName, function (item) {
            return item === filename;
        });
    }
    
    /**
     * Add the indexes
     */

    _addIndex(
        "all",
        function (entry) {
            return true;
        }
    );

    _addIndex(
        "css",
        function (entry) {
            return FileUtils.getFileExtension(entry.name) === "css";
        }
    );

    /**
     * When a new project is opened set the flag for index exceeding maximum
     * warning back to false. 
     */
    $(ProjectManager).on("projectOpen", function (event, projectRoot) {
        _maxFileDialogDisplayed = false;
        markDirty();
    });
    
    $(ProjectManager).on("projectFilesChange", function (event, projectRoot) {
        markDirty();
    });

    PerfUtils.createPerfMeasurement("FILE_INDEX_MANAGER_SYNC", "syncFileIndex");

    exports.markDirty = markDirty;
    exports.getFileInfoList = getFileInfoList;
    exports.getFilenameMatches = getFilenameMatches;


});
