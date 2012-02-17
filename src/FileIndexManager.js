/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */


define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        ProjectManager      = require("ProjectManager");

    var _indexList = {};

    /**
     * @constructor
     * TODO
     */
    function FileIndex(indexName, filterFunction) {
        this.name = indexName;
        this.fileInfos = [];
        this.filterFunction = filterFunction;
    }

    function FileInfo(entry) {
        this.name = entry.name;
        this.fullPath = entry.fullPath;
    }


    /* return value is read only list */
    function getFileInfoList(indexName) {
        if (!_indexList.hasOwnProperty(indexName)) {
            throw new Error("indexName not found");
        }

        return _indexList[indexName].filesInfos;
    }


    function addIndex(indexName, filterFunction) {
        if (_indexList.hasOwnProperty(indexName)) {
            throw new Error("Duplicate index name");
        }
        if (typeof filterFunction !== "function") {
            throw new Error("Invalid arguments");
        }

        _indexList[indexName] = new FileIndex(indexName, filterFunction);
    }

    // TODO: replace with $.each
    function _forEachIndex(callback) {
        var indexName;
        var fileIndex;
        for (indexName in _indexList) {
            if (_indexList.hasOwnProperty(indexName)) {
                fileIndex = _indexList[indexName];
                callback(fileIndex);
            }
        }
    }

    // future use when files are incrementally added
    //
    function _addFileToIndexes(entry) {
        var fileInfo = new FileInfo(entry);
        $.each( _indexList, function (name, index, fileInfo) {
            if (index.filterFunction(entry)) {
                index.fileInfos.push(fileInfo);
            }
        });
    }

    
    // TODO (issue ##) - update FileIndexManager incrementally
    // function _removeFileFromIndexes(entry) {}

    /* Recursively visits all files that are descendent of dirEntry and adds
     * any files found to _fileList
     * @private
     * @param {!DirectoryEntry} dirEntry
     */
    function _scanDirectoryRecurse(dirEntry) {
        if (!dirEntry) {
            return;
        }

		dirEntry.createReader().readEntries(
            function (entries) {
                var entry;
                entries.forEach(function (entry) {
                    if (entry.isFile) {
                        _addFileToIndexes(entry);
                        //console.log(entry.name);
                    } else if (entry.isDirectory) {
                        _scanDirectoryRecurse(entry);
                    }
                });
            },
            function (error) {
                // TODO
            }
        );
    }


    // todo: rename
    function getMatches(indexName, filename) {
        return getFilteredList(indexName, function (item) {
            return item === filename;
        });
    }


    // todo, rename to similiar JS function name
    function getFilteredList(indexName, filterFunction) {
        var results = [];
        var fileList = getFileInfoList(indexName);

        fileList.forEach(function (fileInfo) {
            if (filterFunction(fileInfo.name)) {
                results.push(fileInfo);
            }
        });

        return results;
    }
    
    // debug only
    function _logFileList(list) {
        list.forEach(function (fileInfo) {
            console.log(fileInfo.name);
        });
    }
    
    $(ProjectManager).on("projectRootChanged", function (event, projectRoot) {
        syncFileIndex();
    });
    


    function _clearIndexes() {
        _forEachIndex(function (index) {
            index.filesInfos = [];
        });
    }

    function syncFileIndex() {
        _clearIndexes();
        _scanDirectoryRecurse(ProjectManager.getProjectRoot());

        _logFileList(getFileInfoList("all"));
        //_logFileList(getFileInfoList("css"));
    }

    addIndex(
        "all",
        function (entry) {
            return true;
        }
    );

    addIndex(
        "css",
        function (entry) {
            var filename = entry.name;
            return filename.slice(filename.length - 4, filename.length) === ".css";
        }
    );

    exports.syncFileIndex = syncFileIndex;
    exports.getFilteredList = getFilteredList;
    exports.getFileInfoList = getFileInfoList;
    exports.getMatches = getMatches;


});