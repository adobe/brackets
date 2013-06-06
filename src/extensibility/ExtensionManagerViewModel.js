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
        Async            = require("utils/Async"),
        Package          = require("extensibility/Package"),
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
     * and manages sorting/filtering them. Must be disposed with dispose() when done.
     * Events:
     *     change - triggered when the data for a given extension changes. Second parameter is the extension id.
     *     filter - triggered whenever the filtered set changes (including on initialize).
     */
    function ExtensionManagerViewModel() {
        this._handleStatusChange = this._handleStatusChange.bind(this);
        this._idsToRemove = {};
        this._idsToUpdate = {};
        
        // Listen for extension status changes.
        $(ExtensionManager).on("statusChange", this._handleStatusChange);
    }
    
    /**
     * @type {string}
     * Constant indicating that this model/view should initialize from the main extension registry.
     */
    ExtensionManagerViewModel.SOURCE_REGISTRY = "registry";
    
    /**
     * @type {string}
     * Constant indicating that this model/view should initialize from the list of locally installed extensions.
     */
    ExtensionManagerViewModel.SOURCE_INSTALLED = "installed";
    
    /**
     * @type {Object}
     * The current set of extensions managed by this model. Same as ExtensionManager.extensions.
     */
    ExtensionManagerViewModel.prototype.extensions = null;
    
    /**
     * @type {string}
     * The current source for the model; one of the SOURCE_* keys above.
     */
    ExtensionManagerViewModel.prototype.source = null;
    
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
     * @type {Object.<string, boolean>}
     * Map of extensions marked for removal when the view is closed.
     */
    ExtensionManagerViewModel.prototype._idsToRemove = null;
        
    /**
     * @private
     * @type {Object.<string, boolean>}
     * Map of extensions marked for update when the view is closed.
     */
    ExtensionManagerViewModel.prototype._idsToUpdate = null;
        
    /**
     * Unregisters listeners when we're done.
     */
    ExtensionManagerViewModel.prototype.dispose = function () {
        $(ExtensionManager).off("statusChange", this._handleStatusChange);
    };
    
    /**
     * Deletes any temporary files left behind by extensions that
     * were marked for update.
     */
    ExtensionManagerViewModel.prototype.cleanupUpdates = function () {
        Object.keys(this._idsToUpdate).forEach(function (id) {
            var filename = this._idsToUpdate[id].localPath;
            if (filename) {
                brackets.fs.unlink(filename, function () { });
            }
        }.bind(this));
    };

    /**
     * @private
     * Sets up the initial filtered set based on the sorted full set.
     */
    ExtensionManagerViewModel.prototype._setInitialFilter = function () {
        // Initial filtered list is the same as the sorted list.
        this.filterSet = this._sortedFullSet.slice(0);
        $(this).triggerHandler("filter");
    };
    
    /**
     * Initializes the model from the remote extension registry.
     * @return {$.Promise} a promise that's resolved with the registry JSON data
     * or rejected if the server can't be reached.
     */
    ExtensionManagerViewModel.prototype._initializeFromRegistry = function () {
        var self = this;
        return ExtensionManager.downloadRegistry()
            .done(function () {
                self.extensions = ExtensionManager.extensions;
                
                // Sort the registry by last published date and store the sorted list of IDs.
                self._sortedFullSet = registry_utils.sortRegistry(self.extensions, "registryInfo")
                    .filter(function (entry) {
                        return entry.registryInfo !== undefined;
                    })
                    .map(function (entry) {
                        return entry.registryInfo.metadata.name;
                    });
                self._setInitialFilter();
            });
    };
    
    /**
     * @private
     * Re-sorts the current full set based on the source we're viewing.
     */
    ExtensionManagerViewModel.prototype._sortFullSet = function () {
        var self = this;
        
        // Currently, we never need to re-sort the registry view since it's always sorted when we
        // grab it, and items are never added to the view. That might change in the future.
        if (this.source === ExtensionManagerViewModel.SOURCE_INSTALLED) {
            this._sortedFullSet = this._sortedFullSet.sort(function (key1, key2) {
                var metadata1 = self.extensions[key1].installInfo.metadata,
                    metadata2 = self.extensions[key2].installInfo.metadata,
                    id1 = (metadata1.title || metadata1.name).toLowerCase(),
                    id2 = (metadata2.title || metadata2.name).toLowerCase();
                if (id1 < id2) {
                    return -1;
                } else if (id1 === id2) {
                    return 0;
                } else {
                    return 1;
                }
            });
        }
    };
    
    /**
     * Initializes the model from the set of locally installed extensions, sorted
     * alphabetically by id (or name of the extension folder for legacy extensions).
     * @return {$.Promise} a promise that's resolved when we're done initializing.
     */
    ExtensionManagerViewModel.prototype._initializeFromInstalledExtensions = function () {
        var self = this;
        this.extensions = ExtensionManager.extensions;
        this._sortedFullSet = Object.keys(this.extensions)
            .filter(function (key) {
                return self.extensions[key].installInfo &&
                    self.extensions[key].installInfo.locationType !== ExtensionManager.LOCATION_DEFAULT;
            });
        this._sortFullSet();
        this._setInitialFilter();
        return new $.Deferred().resolve();
    };
    
    /**
     * Initializes the model from the given source.
     * @param {string} source One of the SOURCE_* constants above.
     */
    ExtensionManagerViewModel.prototype.initialize = function (source) {
        this.source = source;
        return (source === ExtensionManagerViewModel.SOURCE_INSTALLED ?
                this._initializeFromInstalledExtensions() :
                this._initializeFromRegistry());
    };
    
    /**
     * @private
     * Updates the initial set and filter as necessary when the status of an extension changes,
     * and notifies listeners of the change.
     * @param {$.Event} e The jQuery event object.
     * @param {string} id The id of the extension whose status changed.
     */
    ExtensionManagerViewModel.prototype._handleStatusChange = function (e, id) {
        // If we're looking at local extensions, then we might need to add or
        // remove this extension from the full set. If the full set has changed,
        // then we also need to refilter.
        if (this.source === ExtensionManagerViewModel.SOURCE_INSTALLED) {
            var index = this._sortedFullSet.indexOf(id),
                refilter = false;
            if (index !== -1 && !this.extensions[id].installInfo) {
                // This was in our set, but was uninstalled. Remove it.
                this._sortedFullSet.splice(index, 1);
                refilter = true;
            } else if (index === -1 && this.extensions[id].installInfo) {
                // This was not in our set, but is now installed. Add it and resort.
                this._sortedFullSet.push(id);
                this._sortFullSet();
                refilter = true;
            }
            if (refilter) {
                this.filter(this._lastQuery || "", true);
            }
        }
        $(this).triggerHandler("change", id);
    };
    
    /**
     * @private
     * Searches for the given query in the current extension list and updates the filter set,
     * dispatching a filter event.
     * @param {string} query The string to search for.
     * @param {boolean} force If true, always filter starting with the full set, not the last
     *     query's filter.
     */
    ExtensionManagerViewModel.prototype.filter = function (query, force) {
        var self = this, initialList, newFilterSet = [];
        if (!force && this._lastQuery && query.indexOf(this._lastQuery) === 0) {
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
            if (entry) {
                entry = (self.source === ExtensionManagerViewModel.SOURCE_INSTALLED ? entry.installInfo : entry.registryInfo);
            }
            if (entry && self._entryMatchesQuery(entry, query)) {
                newFilterSet.push(id);
            }
        });
        
        this._lastQuery = query;
        this.filterSet = newFilterSet;
        $(this).triggerHandler("filter");
    };
    
    /**
     * @private
     * Tests if the given entry matches the query.
     * @param {Object} entry The extension entry to test.
     * @param {string} query The query to match against.
     * @return {boolean} Whether the query matches.
     */
    ExtensionManagerViewModel.prototype._entryMatchesQuery = function (entry, query) {
        return query === "" ||
            _searchFields.some(function (fieldSpec) {
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
    
    /**
     * Marks an extension for later removal, or unmarks an extension previously marked.
     * @param {string} id The id of the extension to mark for removal.
     * @param {boolean} mark Whether to mark or unmark it.
     */
    ExtensionManagerViewModel.prototype.markForRemoval = function (id, mark) {
        if (mark) {
            this._idsToRemove[id] = true;
        } else {
            delete this._idsToRemove[id];
        }
        $(this).triggerHandler("change", [id]);
    };
    
    /**
     * Returns true if an extension is marked for removal.
     * @param {string} id The id of the extension to check.
     * @return {boolean} true if it's been marked for removal, false otherwise.
     */
    ExtensionManagerViewModel.prototype.isMarkedForRemoval = function (id) {
        return !!(this._idsToRemove[id]);
    };
    
    /**
     * Returns true if there are any extensions marked for removal.
     * @return {boolean} true if there are extensions to remove
     */
    ExtensionManagerViewModel.prototype.hasExtensionsToRemove = function () {
        return Object.keys(this._idsToRemove).length > 0;
    };
    
    /**
     * If a downloaded package appears to be an update, mark the extension for update.
     * If an extension was previously marked for removal, marking for update will
     * turn off the removal mark.
     * @param {Object} installationResult info about the install provided by the Package.download function
     */
    ExtensionManagerViewModel.prototype.updateFromDownload = function (installationResult) {
        var installationStatus = installationResult.installationStatus;
        if (installationStatus === Package.InstallationStatuses.ALREADY_INSTALLED ||
                installationStatus === Package.InstallationStatuses.NEEDS_UPDATE ||
                installationStatus === Package.InstallationStatuses.SAME_VERSION ||
                installationStatus === Package.InstallationStatuses.OLDER_VERSION) {
            var id = installationResult.name;
            delete this._idsToRemove[id];
            this._idsToUpdate[id] = installationResult;
            $(this).triggerHandler("change", [id]);
        }
    };
    
    /**
     * Removes the mark for an extension to be updated on restart. Also deletes the
     * downloaded package file.
     * @param {string} id The id of the extension for which the update is being removed
     */
    ExtensionManagerViewModel.prototype.removeUpdate = function (id) {
        var installationResult = this._idsToUpdate[id];
        if (!installationResult) {
            return;
        }
        if (installationResult.localPath) {
            brackets.fs.unlink(installationResult.localPath, function () {
            });
        }
        delete this._idsToUpdate[id];
        $(this).triggerHandler("change", [id]);
    };
    
    /**
     * Returns true if an extension is marked for update.
     * @param {string} id The id of the extension to check.
     * @return {boolean} true if it's been marked for update, false otherwise.
     */
    ExtensionManagerViewModel.prototype.isMarkedForUpdate = function (id) {
        return !!(this._idsToUpdate[id]);
    };
    
    /**
     * Returns true if there are any extensions marked for update.
     * @return {boolean} true if there are extensions to update
     */
    ExtensionManagerViewModel.prototype.hasExtensionsToUpdate = function () {
        return Object.keys(this._idsToUpdate).length > 0;
    };
    
    /**
     * Removes extensions previously marked for removal.
     * @return {$.Promise} A promise that's resolved when all extensions are removed, or rejected
     *     if one or more extensions can't be removed. When rejected, the argument will be an
     *     array of error objects, each of which contains an "item" property with the id of the
     *     failed extension and an "error" property with the actual error.
     */
    ExtensionManagerViewModel.prototype.removeMarkedExtensions = function () {
        return Async.doInParallel_aggregateErrors(
            Object.keys(this._idsToRemove),
            function (id) {
                return ExtensionManager.remove(id);
            }
        );
    };
    
    /**
     * Updates extensions previously marked for update.
     * @return {$.Promise} A promise that's resolved when all extensions are updated, or rejected
     *     if one or more extensions can't be updated. When rejected, the argument will be an
     *     array of error objects, each of which contains an "item" property with the id of the
     *     failed extension and an "error" property with the actual error.
     */
    ExtensionManagerViewModel.prototype.updateExtensions = function () {
        var self = this;
        return Async.doInParallel_aggregateErrors(
            Object.keys(self._idsToUpdate),
            function (id) {
                var installationResult = self._idsToUpdate[id];
                return ExtensionManager.update(installationResult.name, installationResult.localPath);
            }
        );
    };

    exports.ExtensionManagerViewModel = ExtensionManagerViewModel;
});