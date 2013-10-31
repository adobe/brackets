/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $ */

/**
 * Utility for caching information on a per-file basis. Cached data is thrown away whenever:
 *   * the user edits the file (even if changes are still unsaved)
 *   * Brackets detects than an external app has changed the file
 * 
 * External changes may not be detected immediately. (Currently, if external changes happen while
 * Brackets has focus, they won't be detected until the user switches away from Brackets and then
 * back).
 * 
 * Files do not need to be currently open in Brackets: you can store info for any file in the Brackets
 * project tree. You may use either Documents or fullPaths as the cache keys.
 * 
 * Because caches act as persistent listeners, they MUST be dispose()'ed to avoid memory leaks!
 */
define(function (require, exports, module) {
    "use strict";
    
    var DocumentManager     = require("document/DocumentManager"),
        Document            = require("document/Document"),
        FileSystem          = require("filesystem/FileSystem"),
        FileUtils           = require("file/FileUtils"),
        CollectionUtils     = require("utils/CollectionUtils");
    
    function Cache() {
        this._invalidateDoc = this._invalidateDoc.bind(this);
        this._invalidatePath = this._invalidatePath.bind(this);
        this._handleFSChange = this._handleFSChange.bind(this);
        
        $(DocumentManager).on("pathDeleted", this._invalidatePath);
        $(DocumentManager).on("fileNameChange", this._invalidatePath);
        $(Document).on("documentChange", this._invalidateDoc);
        
        $(FileSystem).on("change", this._handleFSChange);
    }
    
    Cache.prototype.dispose = function () {
        $(DocumentManager).off("pathDeleted", this._invalidatePath);
        $(DocumentManager).off("fileNameChange", this._invalidatePath);
        $(Document).off("documentChange", this._invalidateDoc);
        
        $(FileSystem).off("change", this._handleFSChange);
        
        this._clear();  // reduce memory leaks in case anyone still holds onto a reference to our instance
    };
    
    Cache.prototype._storage = {};
    Cache.prototype._generation = 0;
    
    Cache.prototype._handleFSChange = function (event, item) {
        if (!item) {
            // We don't know what's changed. Rather than throw out the whole cache, invalidate all the old
            // entries to ensure we check the timestamp on disk before using them.
            this._generation++;
        }
        // other FS events are ignored for now: anything else will come from within Brackets, and
        // we already hear about those via documentChange, pathDeleted & fileNameChange
    };
    
    Cache.prototype._invalidateDoc = function (event, doc) {
        delete this._storage[doc.file.fullPath];
    };
    
    /** Invalidate everything with the given path prefix */
    Cache.prototype._invalidatePath = function (event, path, newPath) {
        var self = this;
        CollectionUtils.forEach(function (data, fullPath) {
            // TODO: if newPath truthy (rename case), move over to new key insead of losing...
            if (FileUtils.isAffectedWhenRenaming(fullPath, path)) {
                delete self._storage[fullPath];
            }
        });
    };
    
    
    Cache.prototype.put = function (docOrPath, timestamp, data) {
        var key = docOrPath.file ? docOrPath.file.fullPath : docOrPath;
        this._storage[key] = { data: data, generation: this._generation, timestamp: timestamp };
    };
    
    Cache.prototype._rawGet = function (docOrPath) {
        var key = docOrPath.file ? docOrPath.file.fullPath : docOrPath;
        return this._storage[key];
    };

    /**
     * Returns a result immediately. Use the async getOrCreate() whereever possible. Compared to
     * getOrCreate(), getSync() requires two compromises:
     *  (a) May return null if value not cached
     *  (b) If it's unclear whether the cached value is stale or not, you must either ignore it
     *      (less efficient than getOrCreate()) or use it without checking whether it's stale
     *      (less accurate than getOrCreate()).
     */
    Cache.prototype.getSync = function (docOrPath, acceptStale) {
        var cached = this._rawGet(docOrPath);
        
        if (cached && (acceptStale || cached.generation === this._generation)) {
            return cached.data;
        }
        return null;
    };
    
    
    Cache.prototype._create = function (docOrPath, createFn) {
        var result = new $.Deferred();
        var self = this;
        function finishCreate(text, fullPath, timestamp) {
            var value = createFn(text, fullPath);
            self.put(docOrPath, timestamp, value);
            result.resolve(value);
        }
        
        if (docOrPath.file) {
            finishCreate(docOrPath.getText(), docOrPath.fullPath, docOrPath.diskTimestamp);
        } else {
            DocumentManager.getDocumentText(FileSystem.getFileForPath(docOrPath))
                .done(function (text, mtime) {
                    finishCreate(text, docOrPath, mtime);
                })
                .fail(function (err) {
                    result.reject(err);
                });
        }
        return result;
    };
    
    /**
     * Compared to using get(), checking the results, reading the file, computing values, and calling
     * put(), this function: (a) allows for more succint code, and (b) supports more efficient caching.
     * @param {!Document|string} docOrPath
     * @param {!function(string, string):Object} createFn  Passed the file's Document text and fullPath
     * @return {$.Promise} Resolved with cached data, or resolved (by createFn()) with fresh data
     *      (which is added to the cache immediately), or rejected if the file could not be read.
     *      createFn() is called with the results of DocumentManager.getDocumentText().
     */
    Cache.prototype.getOrCreate = function (docOrPath, createFn) {
        var self = this;
        var cached = this._rawGet(docOrPath);
        if (cached) {
            if (cached.generation === this._generation) {
                return new $.Deferred().resolve(cached.data);
            } else {
                // Check timestamp to see if cache is still valid
                // TODO: if we already have an active Document, assume it's up to date?
                var result = new $.Deferred();
                var file = FileSystem.getFileForPath(docOrPath.file ? docOrPath.file.fullPath : docOrPath);
                file.stat(function (err, metadata) {
                    if (!err) {
                        if (cached.timestamp.getTime() === metadata.mtime.getTime()) {
                            // Yep, still valid
                            cached.generation = self._generation;  // mark cache entry as 'definitely up to date' again
                            result.resolve(cached.data);
                        } else {
                            // Nope, file has changed
                            self._create(docOrPath, createFn).pipe(result.resolve, result.reject);
                        }
                    } else {
                        // Unable to stat() the file - may have been moved/deleted; cache definitely invalid
                        self._create(docOrPath, createFn).pipe(result.resolve, result.reject);
                    }
                });
                return result.promise();
            }
        } else {
            return self._create(docOrPath, createFn);
        }
    };
    
    Cache.prototype.clear = function () {
        this._storage = {};
        this._generation = 0;
    };
    
    
    exports.Cache = Cache;
});