/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, $ */
/*unittests: ExtensionManager*/

define(function (require, exports, module) {
    "use strict";

    var _ = require("thirdparty/lodash");

    var ExtensionManager = require("extensibility/ExtensionManager"),
        registry_utils   = require("extensibility/registry_utils"),
        EventDispatcher = require("utils/EventDispatcher"),
        Strings          = require("strings");

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
     * The base model for the ExtensionManagerView. Keeps track of the extensions that are currently visible
     * and manages sorting/filtering them. Must be disposed with dispose() when done.
     * Events:
     * - change - triggered when the data for a given extension changes. Second parameter is the extension id.
     * - filter - triggered whenever the filtered set changes (including on initialize).
     *
     * @constructor
     */
    function ExtensionManagerViewModel() {
        this._handleStatusChange = this._handleStatusChange.bind(this);

        // Listen for extension status changes.
        ExtensionManager
            .on("statusChange." + this.source, this._handleStatusChange)
            .on("registryUpdate." + this.source, this._handleStatusChange);
    }
    EventDispatcher.makeEventDispatcher(ExtensionManagerViewModel.prototype);

    /**
     * @type {string}
     * Constant indicating that this model/view should initialize from the main extension registry.
     */
    ExtensionManagerViewModel.prototype.SOURCE_REGISTRY = "registry";

    /**
     * @type {string}
     * Constant indicating that this model/view should initialize from the main extension registry with only themes.
     */
    ExtensionManagerViewModel.prototype.SOURCE_THEMES = "themes";

    /**
     * @type {string}
     * Constant indicating that this model/view should initialize from the list of locally installed extensions.
     */
    ExtensionManagerViewModel.prototype.SOURCE_INSTALLED = "installed";

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
    ExtensionManagerViewModel.prototype.sortedFullSet = null;

    /**
     * @private
     * @type {string}
     * The last query we filtered by. Used to optimize future searches.
     */
    ExtensionManagerViewModel.prototype._lastQuery = null;

    /**
     * @type {string}
     * Info message to display to the user when listing extensions
     */
    ExtensionManagerViewModel.prototype.infoMessage = null;

    /**
     * @type {string}
     * An optional message to display to the user
     */
    ExtensionManagerViewModel.prototype.message = null;

    /**
     * @type {number}
     * Number to show in tab's notification icon. No icon shown if 0.
     */
    ExtensionManagerViewModel.prototype.notifyCount = 0;

    /**
     * @private {$.Promise}
     * Internal use only to track when initialization fails, see usage in _updateMessage.
     */
    ExtensionManagerViewModel.prototype._initializeFromSourcePromise = null;

    /**
     * Unregisters listeners when we're done.
     */
    ExtensionManagerViewModel.prototype.dispose = function () {
        ExtensionManager.off("." + this.source);
    };

    /**
     * @private
     * Sets up the initial filtered set based on the sorted full set.
     */
    ExtensionManagerViewModel.prototype._setInitialFilter = function () {
        // Initial filtered list is the same as the sorted list.
        this.filterSet = _.clone(this.sortedFullSet);
        this.trigger("filter");
    };

    /**
     * @private
     * Re-sorts the current full set based on the source we're viewing.
     * The base implementation does nothing.
     */
    ExtensionManagerViewModel.prototype._sortFullSet = function () { };

    /**
     * Initializes the model from the source.
     */
    ExtensionManagerViewModel.prototype.initialize = function () {
        var self = this;

        this._initializeFromSourcePromise = this._initializeFromSource().always(function () {
            self._updateMessage();
        });

        return this._initializeFromSourcePromise;
    };

    /**
     * @private
     * Updates the initial set and filter as necessary when the status of an extension changes,
     * and notifies listeners of the change.
     * @param {$.Event} e The jQuery event object.
     * @param {string} id The id of the extension whose status changed.
     */
    ExtensionManagerViewModel.prototype._handleStatusChange = function (e, id) {
        this.trigger("change", id);
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
        var self = this, initialList;
        if (!force && this._lastQuery && query.indexOf(this._lastQuery) === 0) {
            // This is the old query with some new letters added, so we know we can just
            // search in the current filter set. (This is true even if query has spaces).
            initialList = this.filterSet;
        } else {
            // This is a new query, so start with the full list.
            initialList = this.sortedFullSet;
        }

        var keywords = query.toLowerCase().split(/\s+/);

        // Takes 'extensionList' and returns a version filtered to only those that match 'keyword'
        function filterForKeyword(extensionList, word) {
            var filteredList = [];
            extensionList.forEach(function (id) {
                var entry = self._getEntry(id);
                if (entry && self._entryMatchesQuery(entry, word)) {
                    filteredList.push(id);
                }
            });
            return filteredList;
        }

        // "AND" the keywords together: successively filter down the result set by each keyword in turn
        var i, currentList = initialList;
        for (i = 0; i < keywords.length; i++) {
            currentList = filterForKeyword(currentList, keywords[i]);
        }

        this._lastQuery = query;
        this.filterSet = currentList;

        this._updateMessage();

        this.trigger("filter");
    };

    /**
     * @private
     * Updates an optional message displayed to the user along with the extension list.
     */
    ExtensionManagerViewModel.prototype._updateMessage = function () {
        if (this._initializeFromSourcePromise && this._initializeFromSourcePromise.state() === "rejected") {
            this.message = Strings.EXTENSION_MANAGER_ERROR_LOAD;
        } else if (this.filterSet && this.filterSet.length === 0) {
            this.message = this.sortedFullSet && this.sortedFullSet.length ? Strings.NO_EXTENSION_MATCHES : Strings.NO_EXTENSIONS;
        } else {
            this.message = null;
        }
    };

    /**
     * @private
     * This is to be overridden by subclasses to provide the metadata for the extension
     * with the provided `id`.
     *
     * @param {string} id of the extension
     * @return {Object?} extension metadata or null if there's no matching extension
     */
    ExtensionManagerViewModel.prototype._getEntry = function (id) {
        return null;
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
                } else if (fieldSpec[fieldSpec.length - 1] === "owner") {
                    // Special handling: ignore the authentication source when querying,
                    // since it's not useful to search on
                    var components = cur.split(":");
                    if (components[1].toLowerCase().indexOf(query) !== -1) {
                        return true;
                    }
                } else if (cur.toLowerCase().indexOf(query) !== -1) {
                    return true;
                }
            });
    };

    /**
     * The model for the ExtensionManagerView that is responsible for handling registry-based extensions.
     * This extends ExtensionManagerViewModel.
     * Must be disposed with dispose() when done.
     *
     * Events:
     * - change - triggered when the data for a given extension changes. Second parameter is the extension id.
     * - filter - triggered whenever the filtered set changes (including on initialize).
     *
     * @constructor
     */
    function RegistryViewModel() {
        ExtensionManagerViewModel.call(this);
        this.infoMessage = Strings.REGISTRY_SANITY_CHECK_WARNING;
    }

    RegistryViewModel.prototype = Object.create(ExtensionManagerViewModel.prototype);
    RegistryViewModel.prototype.constructor = RegistryViewModel;

    /**
     * @type {string}
     * RegistryViewModels always have a source of SOURCE_REGISTRY.
     */
    RegistryViewModel.prototype.source = ExtensionManagerViewModel.prototype.SOURCE_REGISTRY;

    /**
     * Initializes the model from the remote extension registry.
     * @return {$.Promise} a promise that's resolved with the registry JSON data
     * or rejected if the server can't be reached.
     */
    RegistryViewModel.prototype._initializeFromSource = function () {
        var self = this;
        return ExtensionManager.downloadRegistry()
            .done(function () {
                self.extensions = ExtensionManager.extensions;

                // Sort the registry by last published date and store the sorted list of IDs.
                self.sortedFullSet = registry_utils.sortRegistry(self.extensions, "registryInfo")
                    .filter(function (entry) {
                        return entry.registryInfo !== undefined && entry.registryInfo.metadata.theme === undefined;
                    })
                    .map(function (entry) {
                        return entry.registryInfo.metadata.name;
                    });
                self._setInitialFilter();
            })
            .fail(function () {
                self.extensions = [];
                self.sortedFullSet = [];
                self.filterSet = [];
            });
    };

    /**
     * @private
     * Finds the extension metadata by id. If there is no extension matching the given id,
     * this returns `null`.
     * @param {string} id of the extension
     * @return {Object?} extension metadata or null if there's no matching extension
     */
    RegistryViewModel.prototype._getEntry = function (id) {
        var entry = this.extensions[id];
        if (entry) {
            return entry.registryInfo;
        }
        return entry;
    };

    /**
     * The model for the ExtensionManagerView that is responsible for handling previously-installed extensions.
     * This extends ExtensionManagerViewModel.
     * Must be disposed with dispose() when done.
     *
     * Events:
     * - change - triggered when the data for a given extension changes. Second parameter is the extension id.
     * - filter - triggered whenever the filtered set changes (including on initialize).
     *
     * @constructor
     */
    function InstalledViewModel() {
        ExtensionManagerViewModel.call(this);

        // when registry is downloaded, sort extensions again - those with updates will be before others
        var self = this;
        ExtensionManager.on("registryDownload." + this.source, function () {
            self._sortFullSet();
            self._setInitialFilter();
        });
    }

    InstalledViewModel.prototype = Object.create(ExtensionManagerViewModel.prototype);
    InstalledViewModel.prototype.constructor = InstalledViewModel;

    /**
     * @type {string}
     * InstalledViewModels always have a source of SOURCE_INSTALLED.
     */
    InstalledViewModel.prototype.source = ExtensionManagerViewModel.prototype.SOURCE_INSTALLED;

    /**
     * Initializes the model from the set of locally installed extensions, sorted
     * alphabetically by id (or name of the extension folder for legacy extensions).
     * @return {$.Promise} a promise that's resolved when we're done initializing.
     */
    InstalledViewModel.prototype._initializeFromSource = function () {
        var self = this;
        this.extensions = ExtensionManager.extensions;
        this.sortedFullSet = Object.keys(this.extensions)
            .filter(function (key) {
                return self.extensions[key].installInfo &&
                    self.extensions[key].installInfo.locationType !== ExtensionManager.LOCATION_DEFAULT;
            });
        this._sortFullSet();
        this._setInitialFilter();
        this._countUpdates();

        return new $.Deferred().resolve().promise();
    };

    /**
     * @private
     * Re-sorts the current full set
     */
    InstalledViewModel.prototype._sortFullSet = function () {
        var self = this;

        this.sortedFullSet = this.sortedFullSet.sort(function (key1, key2) {
            // before sorting by name, put first extensions that have updates
            var ua1 = self.extensions[key1].installInfo.updateAvailable,
                ua2 = self.extensions[key2].installInfo.updateAvailable;

            if (ua1 && !ua2) {
                return -1;
            } else if (!ua1 && ua2) {
                return 1;
            }

            var metadata1 = self.extensions[key1].installInfo.metadata,
                metadata2 = self.extensions[key2].installInfo.metadata,
                id1 = (metadata1.title || metadata1.name).toLocaleLowerCase(),
                id2 = (metadata2.title || metadata2.name).toLocaleLowerCase();

            return id1.localeCompare(id2);
        });
    };

    /**
     * @private
     * Updates notifyCount based on number of extensions with an update available
     */
    InstalledViewModel.prototype._countUpdates = function () {
        var self = this;
        this.notifyCount = 0;
        this.sortedFullSet.forEach(function (key) {
            if (self.extensions[key].installInfo.updateCompatible && !ExtensionManager.isMarkedForUpdate(key)) {
                self.notifyCount++;
            }
        });
    };

    /**
     * @private
     * Updates the initial set and filter as necessary when the status of an extension changes,
     * and notifies listeners of the change.
     * @param {$.Event} e The jQuery event object.
     * @param {string} id The id of the extension whose status changed.
     */
    InstalledViewModel.prototype._handleStatusChange = function (e, id) {
        var index = this.sortedFullSet.indexOf(id),
            refilter = false;
        if (index !== -1 && !this.extensions[id].installInfo) {
            // This was in our set, but was uninstalled. Remove it.
            this.sortedFullSet.splice(index, 1);
            this._countUpdates();  // may also affect update count
            refilter = true;
        } else if (index === -1 && this.extensions[id].installInfo) {
            // This was not in our set, but is now installed. Add it and resort.
            this.sortedFullSet.push(id);
            this._sortFullSet();
            refilter = true;
        }
        if (refilter) {
            this.filter(this._lastQuery || "", true);
        }

        if (this.extensions[id].installInfo) {
            // If our count of available updates may have been affected, re-count
            this._countUpdates();
        }

        ExtensionManagerViewModel.prototype._handleStatusChange.call(this, e, id);
    };

    /**
     * @private
     * Finds the extension metadata by id. If there is no extension matching the given id,
     * this returns `null`.
     * @param {string} id of the extension
     * @return {Object?} extension metadata or null if there's no matching extension
     */
    InstalledViewModel.prototype._getEntry = function (id) {
        var entry = this.extensions[id];
        if (entry) {
            return entry.installInfo;
        }
        return entry;
    };

    /**
     * The model for the ExtensionManagerView that is responsible for handling registry-based theme extensions.
     * This extends ExtensionManagerViewModel.
     * Must be disposed with dispose() when done.
     *
     * Events:
     * - change - triggered when the data for a given extension changes. Second parameter is the extension id.
     * - filter - triggered whenever the filtered set changes (including on initialize).
     *
     * @constructor
     */
    function ThemesViewModel() {
        ExtensionManagerViewModel.call(this);
    }

    // Inheritance setup
    ThemesViewModel.prototype = Object.create(ExtensionManagerViewModel.prototype);
    ThemesViewModel.prototype.constructor = ThemesViewModel;

    /**
     * @type {string}
     * ThemeViewModels always have a source of SOURCE_THEMES.
     */
    ThemesViewModel.prototype.source = ExtensionManagerViewModel.prototype.SOURCE_THEMES;

    /**
     * Initializes the model from the remote extension registry.
     * @return {$.Promise} a promise that's resolved with the registry JSON data.
     */
    ThemesViewModel.prototype._initializeFromSource = function () {
        var self = this;
        return ExtensionManager.downloadRegistry()
            .done(function () {
                self.extensions = ExtensionManager.extensions;

                // Sort the registry by last published date and store the sorted list of IDs.
                self.sortedFullSet = registry_utils.sortRegistry(self.extensions, "registryInfo")
                    .filter(function (entry) {
                        return entry.registryInfo !== undefined && entry.registryInfo.metadata.theme;
                    })
                    .map(function (entry) {
                        return entry.registryInfo.metadata.name;
                    });
                self._setInitialFilter();
            })
            .fail(function () {
                self.extensions = [];
                self.sortedFullSet = [];
                self.filterSet = [];
            });
    };

    /**
     * @private
     * Finds the theme extension metadata by id. If there is no theme extension matching the given id,
     * this returns `null`.
     * @param {string} id of the theme extension
     * @return {Object?} extension metadata or null if there's no matching extension
     */
    ThemesViewModel.prototype._getEntry = function (id) {
        var entry = this.extensions[id];
        if (entry) {
            return entry.registryInfo;
        }
        return entry;
    };

    exports.RegistryViewModel = RegistryViewModel;
    exports.ThemesViewModel = ThemesViewModel;
    exports.InstalledViewModel = InstalledViewModel;
});
