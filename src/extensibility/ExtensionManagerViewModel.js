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
    
    var ExtensionManager = require("extensibility/ExtensionManager"),
        registry_utils   = require("extensibility/registry_utils");

    /**
     * @private
     * @type {Array}
     * A list of fields to search when trying to search for a query string in an object. Each field is 
     * represented as an array of keys to recurse downward through the object. We store this here to avoid 
     * doing it for each search call.
     */
    var _searchFields = [["metadata", "name"], ["metadata", "title"], ["metadata", "description"],
                         ["metadata", "author", "name"], ["metadata", "keywords"], ["owner"]];
    /**
     * @constructor
     * The model for the ExtensionManagerView. Keeps track of the extensions that are currently visible
     * and manages sorting/filtering them.
     * Events:
     *     filterChange - triggered whenever the filtered set changes (including on initialize).
     */
    function ExtensionManagerViewModel() {
    }
    
    /**
     * @type {string}
     * Constant indicating that this model/view should initialize from the main extension registry.
     */
    ExtensionManagerViewModel.EXTENSIONS_REGISTRY = "registry";
    
    /**
     * @type {string}
     * Constant indicating that this model/view should initialize from the list of locally installed extensions.
     */
    ExtensionManagerViewModel.EXTENSIONS_LOCAL = "local";
    
    /**
     * @type {Object}
     * The current set of extensions managed by this model. The keys are the IDs of the 
     * extensions, or, for legacy extensions with no ID, the full local path to the extension.
     * Depending on whether a given extension is in the registry or not and whether it's locally 
     * installed or not, each entry might or might not have the following contents:
     *     metadata: the contents of the extension's package.json. Available for all installed and registry extensions.
     *     owner: the ID of the owner who uploaded the extension. Only available for extensions that are in the registry.
     *     versions: the history of versions of the extension. Only available for extensions that are in the registry.
     *     status: the current status of the extension. Only available for installed extensions.
     *     path: the full file path of the extension. Only available for installed extensions.
     *     installType: one of "default", "dev", "user", or "unknown". Only available for installed extensions.
     */
    ExtensionManagerViewModel.prototype.extensions = null;
    
    /**
     * @type {Array.<Object>}
     * The list of IDs of items matching the current query and sorted with the current sort.
     */
    ExtensionManagerViewModel.prototype.filterSet = null;
    
    /**
     * @type {Object}
     * The list of all ids from the extension list, sorted with the current sort.
     */
    ExtensionManagerViewModel.prototype._sortedFullSet = null;
    
    /**
     * @private
     * @type {string}
     * The last query we filtered by. Used to optimize future searches.
     */
    ExtensionManagerViewModel.prototype._lastQuery = null;
    
    /**
     * @private
     * Sets up the initial filtered set based on the sorted full set.
     */
    ExtensionManagerViewModel.prototype._setInitialFilter = function () {
        // Initial filtered list is the same as the sorted list.
        this.filterSet = this._sortedFullSet.slice(0);
        $(this).triggerHandler("filterChange");
    };
    
    /**
     * Initializes the model from the remote extension registry.
     * @return {$.Promise} a promise that's resolved with the registry JSON data
     * or rejected if the server can't be reached.
     */
    ExtensionManagerViewModel.prototype._initializeFromRegistry = function () {
        var self = this;
        return ExtensionManager.getRegistry(true)
            .done(function (registry) {
                self.extensions = registry;
                
                // Sort the registry by last published date and store the sorted list of IDs.
                self._sortedFullSet = registry_utils.sortRegistry(registry).map(function (entry) {
                    return entry.metadata.name;
                });
                self._setInitialFilter();
            });
    };
    
    /**
     * Initializes the model from the set of locally installed extensions, sorted
     * alphabetically by id (or name of the extension folder for legacy extensions).
     * @return {$.Promise} a promise that's resolved with the installed extension JSON data.
     */
    ExtensionManagerViewModel.prototype._initializeFromInstalledExtensions = function () {
        this.extensions = ExtensionManager.loadedExtensions;
        this._sortedFullSet = Object.keys(this.extensions)
            .map(function (key) {
                var match = key.match(/\/([^\/]+)$/);
                return (match && match[1]) || key;
            })
            .sort();
        this._setInitialFilter();
        return new $.Deferred().resolve(this.extensions);
    };
    
    /**
     * Initializes the model from the given source.
     * @param {string} source One of the EXTENSIONS_* constants above.
     */
    ExtensionManagerViewModel.prototype.initialize = function (source) {
        return (source === ExtensionManagerViewModel.EXTENSIONS_LOCAL ?
                this._initializeFromInstalledExtensions() :
                this._initializeFromRegistry());
    };
    
    /**
     * @private
     * Searches for the given query in the current extension list and updates the filter set,
     * dispatching a filterChange event.
     * @param {string} query The string to search for.
     */
    ExtensionManagerViewModel.prototype.filter = function (query) {
        var self = this, initialList, newFilterSet = [];
        if (this._lastQuery && query.indexOf(this._lastQuery) === 0) {
            // This is the old query with some new letters added, so we know we can just
            // search in the current filter set.
            initialList = this.filterSet;
        } else {
            // This is a new query, so start with the full list.
            initialList = this._sortedFullSet;
        }
        
        query = query.toLowerCase();
        initialList.forEach(function (id) {
            var entry = self.extensions[id];
            if (entry && self._entryMatchesQuery(entry, query)) {
                newFilterSet.push(id);
            }
        });
        
        this._lastQuery = query;
        this.filterSet = newFilterSet;
        $(this).trigger("filterChange");
    };
    
    /**
     * @private
     * Tests if the given entry matches the query.
     * @param {Object} entry The extension entry to test.
     * @param {string} query The query to match against.
     * @return {boolean} Whether the query matches.
     */
    ExtensionManagerViewModel.prototype._entryMatchesQuery = function (entry, query) {
        return _searchFields.some(function (fieldSpec) {
            var i, cur = entry;
            for (i = 0; i < fieldSpec.length; i++) {
                // Recurse downward through the specified fields to the leaf value.
                cur = cur[fieldSpec[i]];
                if (!cur) {
                    return false;
                }
            }
            // If the leaf value is an array (like keywords), search each item, otherwise
            // just search in the string.
            if (Array.isArray(cur)) {
                return cur.some(function (keyword) {
                    return keyword.toLowerCase().indexOf(query) !== -1;
                });
            } else if (cur.toLowerCase().indexOf(query) !== -1) {
                return true;
            }
        });
    };
    
    exports.ExtensionManagerViewModel = ExtensionManagerViewModel;
});