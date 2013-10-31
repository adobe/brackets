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
/*global define, $, window */

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
 * project tree.
 * 
 * Because caches act as persistent listeners, they MUST be dispose()'ed to avoid memory leaks!
 */
define(function (require, exports, module) {
    "use strict";
    
    var DocumentManager     = require("document/DocumentManager"),
        Document            = require("document/Document"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils           = require("file/FileUtils"),
        CollectionUtils     = require("utils/CollectionUtils");
    
    function Cache() {
        this._invalidateDoc = this._invalidateDoc.bind(this);
        this._invalidatePath = this._invalidatePath.bind(this);
        this._handleWholesaleChange = this._handleWholesaleChange.bind(this);
        
        $(DocumentManager).on("pathDeleted", this._invalidatePath);
        $(DocumentManager).on("fileNameChange", this._invalidatePath);
        $(Document).on("documentChange", this._invalidateDoc);
        
        $(window).on("focus", this._handleWholesaleChange);
    }
    
    Cache.prototype.dispose = function () {
        $(DocumentManager).off("pathDeleted", this._invalidatePath);
        $(DocumentManager).off("fileNameChange", this._invalidatePath);
        $(Document).off("documentChange", this._invalidateDoc);
        
        $(window).off("focus", this._handleWholesaleChange);
        
        this._clear();  // reduce memory leaks in case anyone still holds onto a reference to our instance
    };
    
    Cache.prototype._storage = {};
    Cache.prototype._generation = 0;
    
    Cache.prototype._handleWholesaleChange = function (event) {
        this._generation++;
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
    
    /**
     * Returns a result immediately. Use the async getOrCreate() whereever possible. Compared to
     * getOrCreate(), getSync() requires two compromises:
     *  (a) May return null if value not cached
     *  (b) If it's unclear whether the cached value is stale or not, you must either ignore it
     *      (less efficient than getOrCreate()) or use it without checking whether it's stale
     *      (less accurate than getOrCreate()).
     */
    Cache.prototype.getSync = function (docOrPath, acceptStale) {
        var key = docOrPath.file ? docOrPath.file.fullPath : docOrPath,
            cached = this._storage[key];
        
        if (acceptStale || cached.generation === this._generation) {
            return cached.data;
        }
        return null;
    };
    
    
    function _getDoc(docOrPath, cb) {
        if (docOrPath.file) {
            return new $.Deferred().resolve(docOrPath);
        } else {
            return DocumentManager.getDocumentForPath(docOrPath);  // TODO: use getDocumentText() w/ fs branch
        }
    }
    
    Cache.prototype._create = function (docOrPath, createFn) {
        var promise = _getDoc(docOrPath);
        var self = this;
        promise.done(function (doc) {
            var value = createFn(doc.getText());
            self.put(docOrPath, doc.diskTimestamp, value);
        });
        return promise;
    };
    
    /**
     * Compared to using get(), checking the results, reading the file, computing values, and calling
     * put(), this function: (a) allows for more succint code, and (b) supports more efficient caching.
     * @param {!Document|string} docOrPath
     * @param {!function(string):Object} createFn
     * @return {$.Promise} Resolved with cached data, or resolved (by createFn()) with fresh data
     *      (which is added to the cache immediately), or rejected if the file could not be read.
     *      createFn() is called with the results of DocumentManager.getDocumentText().
     */
    Cache.prototype.getOrCreate = function (docOrPath, createFn) {
        var self = this;
        var cached = this.getSync(docOrPath, true);
        if (cached) {
            if (cached.generation === this._generation) {
                return new $.Deferred().resolve(cached.data);
            } else {
                // Check timestamp to see if cache is still valid
                var result = new $.Deferred();
                var file = new NativeFileSystem.FileEntry(docOrPath.file ? docOrPath.file.fullPath : docOrPath);
                file.getMetadata(
                    function (metadata) {
                        if (cached.timestamp.getTime() === metadata.modificationTime.getTime()) {
                            result.resolve(cached.data);
                        } else {
                            self._create(docOrPath, createFn).pipe(result.resolve, result.reject);
                        }
                    },
                    function (error) {
                        self._create(docOrPath, createFn).pipe(result.resolve, result.reject);
                    }
                );
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