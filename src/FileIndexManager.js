/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, brackets */

/*
 * Manages a collection of FileIndexes where each index maintains a list of information about
 * files that meet the criteria specified by the index. The indexes are created lazily when
 * they are queried and marked dirty when Brackets becomes active.
 *
 */


define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        PerfUtils           = require("PerfUtils"),
        ProjectManager      = require("ProjectManager"),
        Strings             = require("strings");

    /**
     * All the indexes are stored in this object. The key is the name of the index
     * and the value is a FileIndex. 
     */
    var _indexList = {};

    /**
     * Tracks whether _indexList should be considered dirty and invalid. Calls that access
     * any data in _indexList should call syncFileIndex prior to accessing the data.
     * @type {boolean}
     */
    var _indexListDirty = true;

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
            throw new Error("Duplicate index name");
        }
        if (typeof filterFunction !== "function") {
            throw new Error("Invalid arguments");
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
        var fileInfo = new FileInfo(entry);


        var filterAndAdd = function (index, entry, fileInfo) {
            if (index.filterFunction(entry)) {
                index.fileInfos.push(fileInfo);
            }
        };
  
        $.each(_indexList, function (indexName, index) {
            filterAndAdd(index, entry, fileInfo);
        });
    }
    
  /**
    * Error dialog when max files in index is hit
    */
    function _showMaxFilesDialog() {
        return brackets.showModalDialog(
            brackets.DIALOG_ID_ERROR,
            Strings.ERROR_MAX_FILES_TITLE,
            Strings.ERROR_MAX_FILES
        );
    }

    /* Recursively visits all files that are descendent of dirEntry and adds
    * files files to each index when the file matches the filter critera
    * @private
    * @param {!DirectoryEntry} dirEntry
    * @param {number} counts total files added. Defaults to zero if undefined
    * @param {$.Promise}
    */
    function _scanDirectorySubTree(dirEntry) {
        if (!dirEntry) {
            throw new Error("Bad dirEntry passed to _scanDirectorySubTree");
        }

        // keep track of directories as they are asynchronously read. We know we are done
        // when dirInProgress becomes empty again.
        var state = { fileCount: 0,
                      dirInProgress: {},    // directory names that are in progress of being read
                      dirError: {},         // directory names with read errors. key=dir path, value=error
                      maxFilesHit: false    // used to show warning dialog only once
                    };

        var deferred = new $.Deferred();

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

        // inner helper function
        function _scanDirectoryRecurse(dirEntry) {
            if (state.fileCount === 10000) {
                if (!state.maxFilesHit) {
                    state.maxFilesHit = true;
                    _showMaxFilesDialog();
                }

                return;
            }

            dirEntry.createReader().readEntries(
                // success callback
                function (entries) {
                    // inspect all children of dirEntry
                    var entry;
                    entries.forEach(function (entry) {
                        if (entry.isFile) {
                            _addFileToIndexes(entry);
                            state.fileCount++;
                            //console.log(entry.name);
                        } else if (entry.isDirectory) {
                            state.dirInProgress[entry.fullPath] = true;
                            _scanDirectoryRecurse(entry);
                        }
                    });
                },
                // error callback
                function (error) {
                    state.dirError[dirEntry.fullPath] = error;
                    delete state.dirInProgress[dirEntry.fullPath];
                }
            );

            // done reading this dir, remove from inProgress map
            delete state.dirInProgress[dirEntry.fullPath];

            if (_dirScanDone()) {
                // console.log( "done reading dir subtree" + dirEntry.fullPath);
                deferred.resolve();
            }
        }

        state.dirInProgress[dirEntry.fullPath] = true;
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
    * Clears the fileInfo array for all the indexes in _indexList
    * @private
    */
    function _clearIndexes() {
        $.each(_indexList, function (indexName, index) {
            index.fileInfos = [];
        });
    }

    /**
     * Markes all file indexes dirty
     */
    function markDirty() {
        _indexListDirty = true;
    }

    /**
    * Clears and rebuilds all of the fileIndexes and sets _indexListDirty to false
    * @param {$.Promise}
    */
    function syncFileIndex() {
        if (_indexListDirty) {
            PerfUtils.markStart("FileIndexManager.syncFileIndex()");

            _clearIndexes();

            return _scanDirectorySubTree(ProjectManager.getProjectRoot())
                .done(function () {
                    PerfUtils.addMeasurement("FileIndexManager.syncFileIndex()");
                    _indexListDirty = false;
                });
        } else {
            return $.Deferred().resolve();
        }

        //_logFileList(_indexList["all"].fileInfos);
        //_logFileList(_indexList["css"].fileInfos);
    }

    /**
    * Returns the FileInfo array for the specified index
    * @param {!string} indexname
    * @param {function({Array.<FileInfo>}) resultCallback
    */
    function getFileInfoList(indexName, resultCallback) {
        if (!_indexList.hasOwnProperty(indexName)) {
            throw new Error("indexName not found");
        }

        syncFileIndex()
            .done(function () {
                resultCallback(_indexList[indexName].fileInfos);
            });
    }
    
    /**
     * Calls the filterFunction on every in the index specified by indexName
     * and return a a new list of FileInfo's
     * @param {!string}
     * @param {function({string})} filterFunction
     * @param {function(Array.<FileInfo>}) resultCallback
     */
    function getFilteredList(indexName, filterFunction, resultCallback) {
        syncFileIndex()
            .done(function () {
                var results = [];
                getFileInfoList(indexName, function (fileList) {
                    fileList.forEach(function (fileInfo) {
                        if (filterFunction(fileInfo.name)) {
                            results.push(fileInfo);
                        }
                    });

                    resultCallback(results);
                });
            });
    }
    
    /**
     * returns an array of fileInfo's that match the filename parameter
     * @param {!string} indexName
     * @param {!filename}
     * @param {function(Array.<FileInfo>}) resultCallback
     */
    function getFilenameMatches(indexName, filename, resultCallback) {
        getFilteredList(indexName,
            function (item) { return item === filename; },
            resultCallback);
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
            var filename = entry.name;
            return filename.slice(filename.length - 4, filename.length) === ".css";
        }
    );
    
    $(ProjectManager).on("projectRootChanged", function (event, projectRoot) {
        markDirty();
    });

    exports.markDirty = markDirty;
    exports.getFilteredList = getFilteredList;
    exports.getFileInfoList = getFileInfoList;
    exports.getFilenameMatches = getFilenameMatches;


});