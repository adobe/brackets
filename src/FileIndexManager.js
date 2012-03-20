/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, brackets, PathUtils */

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
    'use strict';
    
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        PerfUtils           = require("PerfUtils"),
        ProjectManager      = require("ProjectManager"),
        DocumentManager     = require("DocumentManager"),
        Dialogs             = require("Dialogs"),
        Strings             = require("strings");

    /**
     * All the indexes are stored in this object. The key is the name of the index
     * and the value is a FileIndex. 
     */
    var _indexList = {};

    // @type {Object.<key, fileInfo>}
    var _fileInfoMap = {};

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

        /** 
         * Clients can cache private data pertaining to a file in the dataMap
         * of a FileInfo. The dataMap is marked dirty when the file is modified
         * @type {Object.<data, dirty>}
         * @private
         */
        this._dataMap = {};
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
    function _addFileToIndexes(entry) {

        // skip invisible files on mac
        if (brackets.platform === "mac" && entry.name.charAt(0) === ".") {
            return;
        }

        // Paths should be unique
        if (_fileInfoMap.hasOwnProperty(entry.fullPath)) {
            throw new Error("Duplicate file added to file index");
        }

        var fileInfo = new FileInfo(entry);
        //console.log(entry.name);
        _fileInfoMap[entry.fullPath] = fileInfo;
  
        $.each(_indexList, function (indexName, index) {
            if (index.filterFunction(entry)) {
                index.fileInfos.push(fileInfo);
            }
        });
    }
    
  /**
    * Error dialog when max files in index is hit
    */
    function _showMaxFilesDialog() {
        return Dialogs.showModalDialog(
            Dialogs.DIALOG_ID_ERROR,
            Strings.ERROR_MAX_FILES_TITLE,
            Strings.ERROR_MAX_FILES
        );
    }

    /* Recursively visits all files that are descendent of dirEntry and adds
     * files files to each index when the file matches the filter critera
     * @private
     * @param {!DirectoryEntry} dirEntry
     * @returns {$.Promise}
     */
    function _scanDirectorySubTree(dirEntry) {
        if (!dirEntry) {
            throw new Error("Bad dirEntry passed to _scanDirectorySubTree");
        }

        // Clears the fileInfo array for all the indexes in _indexList
        $.each(_indexList, function (indexName, index) {
            index.fileInfos = [];
        });

        // Remember files we saw in the last scan so the dataMap for each fileInfo can be
        // retained between separate directory scans
        var old_fileInfoMap = _fileInfoMap;
        _fileInfoMap = {};

        // keep track of directories as they are asynchronously read. We know we are done
        // when dirInProgress becomes empty again.
        var state = { fileCount: 0,
                      dirInProgress: {},    // directory names that are in progress of being read
                      dirError: {},         // directory names with read errors. key=dir path, value=error
                      maxFilesHit: false,    // used to show warning dialog only once
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
            // skip invisible directories on mac
            if (brackets.platform === "mac" && dirEntry.name.charAt(0) === ".") {
                return;
            }

            state.dirInProgress[dirEntry.fullPath] = true;
            //console.log("started dir: " + dirEntry.fullPath);

            dirEntry.createReader().readEntries(
                // success callback
                function (entries) {
                    // inspect all children of dirEntry
                    entries.forEach(function (entry) {
                        // For now limit the number of files that are indexed by preventing adding files
                        // or scanning additional directories once a max has been hit. Also notify the 
                        // user once via a dialog. This limit could be increased
                        // if files were indexed in a worker thread so scanning didn't block the UI
                        if (state.fileCount > 10000) {
                            if (!state.maxFilesHit) {
                                state.maxFilesHit = true;
                                _showMaxFilesDialog();
                            }
                            return;
                        }

                        if (entry.isFile) {
                            _addFileToIndexes(entry);
                            state.fileCount++;

                            // Retain dataMap between different calls of _scanDirectoryRecurse by copying over
                            // the dataMap for files that still exist
                            if (old_fileInfoMap.hasOwnProperty(entry.fullPath)){
                                _fileInfoMap[entry.fullPath]._dataMap = old_fileInfoMap[entry.fullPath]._dataMap;
                            }

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
     * Markes all file indexes dirty.
     */
    function markIndexesDirty() {
        _indexListDirty = true;
    }

    /**
     * Used by syncFileIndex function to prevent reentrancy
     * @private
     */
    var _syncFileIndexReentracyGuard = false;

    /**
     * Clears and rebuilds all of the fileIndexes and sets _indexListDirty to false
     * @return {$.Promise} resolved when index has been updated
     */
    function syncFileIndex() {

        // TODO (issue 330) - allow multiple calls to syncFileIndex to be batched up so that this code isn't necessary
        if (_syncFileIndexReentracyGuard) {
            throw new Error("syncFileIndex cannot be called Recursively");
        }

        _syncFileIndexReentracyGuard = true;

        var rootDir = ProjectManager.getProjectRoot();
        if (_indexListDirty) {
            PerfUtils.markStart("FileIndexManager.syncFileIndex(): " + rootDir.fullPath);

            return _scanDirectorySubTree(rootDir)
                .done(function () {
                    PerfUtils.addMeasurement("FileIndexManager.syncFileIndex(): " + rootDir.fullPath);
                    _indexListDirty = false;
                    _syncFileIndexReentracyGuard = false;

                    //_logFileList(_indexList["all"].fileInfos);
                    //_logFileList(_indexList["css"].fileInfos);
                });
        } else {
            _syncFileIndexReentracyGuard = false;
            return $.Deferred().resolve().promise();
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
            throw new Error("indexName not found");
        }

        syncFileIndex()
            .done(function () {
                result.resolve(_indexList[indexName].fileInfos);
            });

        return result.promise();
    }

    /**
     * Retrieves the FileInfo record associated with the fullPath
     * @param {String} fullPath
     * @returns {FileInfo}
     */
    function getFileInfo(fullPath) {
        return _fileInfoMap[fullPath];
    }

    /**
     * Allows client to cache file specific information on a FileInfo. Data is
     * marked dirty when the file is changed
     * 
     * @param {FileInfo} fileInfo
     * @param {String} key
     * @param {Object} data
     */
    function setFileInfoData(fileInfo, key, data) {
        fileInfo._dataMap[key] = {data: data, dirty: false};
    }

    /**
     * Retrieves the catched data for teh fileInfo based on the key. Clients
     * should inspect the dirty attribute of the data object before using the data.
     * 
     * @param {FileInfo} fileInfo
     * @param {String} key
     * @returns {data:Object, dirty:boolean}
     */
    function getFileInfoData(fileInfo, key) {
        return fileInfo._dataMap[key];
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
            throw new Error("indexName not found");
        }

        syncFileIndex()
            .done(function () {
                var resultList = [];
                getFileInfoList(indexName)
                    .done(function (fileList) {
                        resultList = fileList.filter(function (fileInfo) {
                            return filterFunction(fileInfo);
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
        return getFilteredList(indexName, function (fileInfo) {
            return fileInfo.name === filename;
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
            var filename = entry.name;
            return PathUtils.filenameExtension(filename) === ".css";
        }
    );
    
    $(ProjectManager).on("projectRootChanged", function (event, projectRoot) {
        markIndexesDirty();
    });

    $(DocumentManager).on("dirtyFlagChange", function (event, doc) {
        var fileInfo = getFileInfo(doc.file.fullPath);
        if (fileInfo) {
            $.each(fileInfo._dataMap, function (key, data) {
                data.dirty = true;
            });
        }
    });


    exports.markIndexesDirty = markIndexesDirty;
    exports.getFileInfoList = getFileInfoList;
    exports.getFilenameMatches = getFilenameMatches;
    exports.getFileInfo = getFileInfo;
    exports.getFileInfoData = getFileInfoData;
    exports.setFileInfoData = setFileInfoData;


});