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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, window, $, brackets, Mustache */
/*unittests: ExtensionManager*/

define(function (require, exports, module) {
    "use strict";
    
    /**
     * @constructor
     * The model for the DropboxChooserView. 
     *  manages sorting/filtering them. Must be disposed with dispose() when done.
     */
    function DropboxChooserViewModel() {
    }
    
        
    /**
     * Unregisters listeners when we're done.
     */
    DropboxChooserViewModel.prototype.dispose = function () {
    };
    

    /**
     * @private
     * Sets up the initial filtered set based on the sorted full set.
     */
    DropboxChooserViewModel.prototype._setInitialFilter = function () {
        // Initial filtered list is the same as the sorted list.
        this.filterSet = this.sortedFullSet.slice(0);
        $(this).triggerHandler("filter");
    };
    
    /**
     * @private
     * Re-sorts the current full set based on the source we're viewing.
     */
    DropboxChooserViewModel.prototype._sortFullSet = function () {
        var self = this;
        
//        // Currently, we never need to re-sort the registry view since it's always sorted when we
//        // grab it, and items are never added to the view. That might change in the future.
//        if (this.source === ExtensionManagerViewModel.SOURCE_INSTALLED) {
//            this.sortedFullSet = this.sortedFullSet.sort(function (key1, key2) {
//                var metadata1 = self.extensions[key1].installInfo.metadata,
//                    metadata2 = self.extensions[key2].installInfo.metadata,
//                    id1 = (metadata1.title || metadata1.name).toLowerCase(),
//                    id2 = (metadata2.title || metadata2.name).toLowerCase();
//                if (id1 < id2) {
//                    return -1;
//                } else if (id1 === id2) {
//                    return 0;
//                } else {
//                    return 1;
//                }
//            });
//        }
    };
    
    DropboxChooserViewModel.prototype._mapEntries = function (entries) {
        var i,
            j = 0,
            self = this,
            result = new $.Deferred();
        
        var mapEntry = function (name) {
            brackets.fs.stat((self._startingFolder || "/") + name, function (error, obj) {
                self.mappedEntries[name] = obj;
                if (++j === entries.length) {
                    result.resolve();
                }
            });
        };
        
        this.mappedEntries = {};

        for (i = 0; i < entries.length; i++) {
            mapEntry(entries[i]);
        }
        
        return result;
    };
    
    /**
     * Initializes the model from the set of locally installed extensions, sorted
     * alphabetically by id (or name of the extension folder for legacy extensions).
     * @return {$.Promise} a promise that's resolved when we're done initializing.
     */
    DropboxChooserViewModel.prototype._initializeFromDropBox = function () {
        var self = this,
            result = new $.Deferred();
        delete this.fullSet;
        brackets.fs.readdir(this._startingFolder || "/", function (error, entries) {
            if (error === brackets.fs.NO_ERROR) {
                self._mapEntries(entries).done(function () {
                    self.sortedFullSet = Object.keys(self.mappedEntries)
                        .filter(function (key) {
                            if (self._foldersOnly && !self.mappedEntries[key].isDirectory()) {
                                return false;
                            }
                            return true;
                        });
                    self._sortFullSet();
                    self._setInitialFilter();
                    result.resolve();
                });
            } else {
                result.reject(error);
            }
        });
        return result;
    };
    
    /**
     * Initializes the model from the given source.
     * @param {string} source One of the SOURCE_* constants above.
     */
    DropboxChooserViewModel.prototype.initialize = function (folder, foldersOnly) {
        this._startingFolder = folder;
        this._foldersOnly = foldersOnly;
        return (this._initializeFromDropBox());
    };
    
    /**
     * @private
     * Searches for the given query in the current extension list and updates the filter set,
     * dispatching a filter event.
     * @param {string} query The string to search for.
     * @param {boolean} force If true, always filter starting with the full set, not the last
     *     query's filter.
     */
    DropboxChooserViewModel.prototype.filter = function (query, force) {
//        var self = this, initialList, newFilterSet = [];
//        if (!force && this._lastQuery && query.indexOf(this._lastQuery) === 0) {
//            // This is the old query with some new letters added, so we know we can just
//            // search in the current filter set.
//            initialList = this.filterSet;
//        } else {
//            // This is a new query, so start with the full list.
//            initialList = this.sortedFullSet;
//        }
//        
//        query = query.toLowerCase();
//        initialList.forEach(function (id) {
//            var entry = self.extensions[id];
//            if (entry) {
//                entry = (self.source === ExtensionManagerViewModel.SOURCE_INSTALLED ? entry.installInfo : entry.registryInfo);
//            }
//            if (entry && self._entryMatchesQuery(entry, query)) {
//                newFilterSet.push(id);
//            }
//        });
//        
//        this._lastQuery = query;
//        this.filterSet = newFilterSet;
//        $(this).triggerHandler("filter");
    };
    
    /**
     * @private
     * Tests if the given entry matches the query.
     * @param {Object} entry The extension entry to test.
     * @param {string} query The query to match against.
     * @return {boolean} Whether the query matches.
     */
    DropboxChooserViewModel.prototype._entryMatchesQuery = function (entry, query) {
        return true;
    };
    

    exports.DropboxChooserViewModel = DropboxChooserViewModel;
});