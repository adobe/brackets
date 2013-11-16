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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";
    
    var FileSystemEntry     = require("filesystem/FileSystemEntry");
    
    /*
     * @constructor
     * Model for a file system Directory.
     *
     * This class should *not* be instantiated directly. Use FileSystem.getDirectoryForPath,
     * FileSystem.resolve, or Directory.getContents to create an instance of this class.
     *
     * Note: Directory.fullPath always has a trailing slash.
     *
     * See the FileSystem class for more details.
     *
     * @param {!string} fullPath The full path for this Directory.
     * @param {!FileSystem} fileSystem The file system associated with this Directory.
     */
    function Directory(fullPath, fileSystem) {
        this._isDirectory = true;
        FileSystemEntry.call(this, fullPath, fileSystem);
    }
    
    Directory.prototype = Object.create(FileSystemEntry.prototype);
    Directory.prototype.constructor = Directory;
    Directory.prototype.parentClass = FileSystemEntry.prototype;
    
    /**
     * The contents of this directory. This "private" property is used by FileSystem.
     * @type {Array<FileSystemEntry>}
     */
    Directory.prototype._contents = null;

    /**
     * The stats for the contents of this directory, such that this._contentsStats[i]
     * corresponds to this._contents[i].
     * @type {Array.<FileSystemStats>}
     */
    Directory.prototype._contentsStats = null;
    
    /**
     * The stats errors for the contents of this directory.
     * @type {object.<string: string>} fullPaths are mapped to FileSystemError strings
     */
    Directory.prototype._contentsStatsErrors = null;
    
    /**
     * Clear any cached data for this directory
     * @private
     */
    Directory.prototype._clearCachedData = function () {
        this.parentClass._clearCachedData.apply(this);
        this._contents = undefined;
        this._contentsStats = undefined;
        this._contentsStatsErrors = undefined;
    };
    
    /**
     * Read the contents of a Directory. 
     *
     * @param {Directory} directory Directory whose contents you want to get
     * @param {function (?string, Array.<FileSystemEntry>=, Array.<FileSystemStats>=, object.<string: string>=)} callback
     *          Callback that is passed an error code or the stat-able contents
     *          of the directory along with the stats for these entries and a
     *          fullPath-to-FileSystemError string map of unstat-able entries
     *          and their stat errors. If there are no stat errors then the last
     *          parameter shall remain undefined.
     */
    Directory.prototype.getContents = function (callback) {
        if (this._contentsCallbacks) {
            // There is already a pending call for this directory's contents.
            // Push the new callback onto the stack and return.
            this._contentsCallbacks.push(callback);
            return;
        }
        
        if (this._contents) {
            // Return cached contents
            // Watchers aren't guaranteed to fire immediately, so it's possible this will be somewhat stale. But
            // unlike file contents, we're willing to tolerate directory contents being stale. It should at least
            // be up-to-date with respect to changes made internally (by this filesystem).
            callback(null, this._contents, this._contentsStats, this._contentsStatsErrors);
            return;
        }
        
        this._contentsCallbacks = [callback];
        
        this._impl.readdir(this.fullPath, function (err, entries, stats) {
            var contents = [],
                contentsStats = [],
                contentsStatsErrors;
            
            if (err) {
                this._clearCachedData();
            } else {
                entries.forEach(function (name, index) {
                    var entryPath = this.fullPath + name,
                        entry;
                    
                    if (this._fileSystem._indexFilter(entryPath, name)) {
                        var entryStats = stats[index];
                        
                        // Note: not all entries necessarily have associated stats.
                        if (typeof entryStats === "string") {
                            // entryStats is an error string
                            if (contentsStatsErrors === undefined) {
                                contentsStatsErrors = {};
                            }
                            contentsStatsErrors[entryPath] = entryStats;
                        } else {
                            // entryStats is a FileSystemStats object
                            if (entryStats.isFile) {
                                entry = this._fileSystem.getFileForPath(entryPath);
                                
                                // If file already existed, its cache may now be invalid (a change
                                // to file content may be messaged EITHER as a watcher change 
                                // directly on that file, OR as a watcher change to its parent dir)
                                // TODO: move this to FileSystem._handleWatchResult()?
                                entry._clearCachedData();
                            } else {
                                entry = this._fileSystem.getDirectoryForPath(entryPath);
                            }
                            
                            if (entry._isWatched) {
                                entry._stat = entryStats;
                            }
                            
                            contents.push(entry);
                            contentsStats.push(entryStats);
                        }
                    
                    }
                }, this);
                
                if (this._isWatched) {
                    this._contents = contents;
                    this._contentsStats = contentsStats;
                    this._contentsStatsErrors = contentsStatsErrors;
                }
            }
            
            // Reset the callback list before we begin calling back so that
            // synchronous reentrant calls are handled correctly.
            var currentCallbacks = this._contentsCallbacks;
            
            this._contentsCallbacks = null;
            
            // Invoke all saved callbacks
            currentCallbacks.forEach(function (cb) {
                try {
                    cb(err, contents, contentsStats, contentsStatsErrors);
                } catch (ex) {
                    console.warn("Unhandled exception in callback: ", ex);
                }
            }, this);
        }.bind(this));
    };
    
    /**
     * Create a directory
     *
     * @param {function (?string, FileSystemStats=)=} callback Callback resolved with a
     *      FileSystemError string or the stat object for the created directory.
     */
    Directory.prototype.create = function (callback) {
        callback = callback || function () {};
        this._impl.mkdir(this._path, function (err, stat) {
            if (err) {
                this._clearCachedData();
                callback(err);
                return;
            }
            
            if (this._isWatched) {
                this._stat = stat;
            }

            callback(null, stat);
        }.bind(this));
    };
    
    // Export this class
    module.exports = Directory;
});
