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
/*global define, window, $, brackets, Mustache */
/*unittests: ExtensionManager*/

define(function (require, exports, module) {
    "use strict";
    
    var Strings                = require("strings"),
        NativeApp              = require("utils/NativeApp"),
        ExtensionManager       = require("extensibility/ExtensionManager"),
        InstallExtensionDialog = require("extensibility/InstallExtensionDialog"),
        registry_utils         = require("extensibility/registry_utils"),
        itemTemplate           = require("text!htmlContent/extension-manager-view-item.html");
    
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
    function Model() {
    }
    
    /**
     * @type {Object}
     * The current registry as fetched by ExtensionManager.
     */
    Model.prototype.registry = null;
    
    /**
     * @type {Array.<Object>}
     * The list of IDs of items matching the current query and sorted with the current sort.
     */
    Model.prototype.filterSet = null;
    
    /**
     * @type {Object}
     * The list of all ids from the registry, sorted with the current sort.
     */
    Model.prototype._sortedFullSet = null;
    
    /**
     * @private
     * @type {string}
     * The last query we filtered by. Used to optimize future searches.
     */
    Model.prototype._lastQuery = null;
    
    /**
     * Initializes the model, fetching the main extension registry.
     * @return {$.Promise} a promise that's resolved with the registry JSON data
     * or rejected if the server can't be reached.
     */
    Model.prototype.initialize = function () {
        var self = this;
        return ExtensionManager.getRegistry(true)
            .done(function (registry) {
                self.registry = registry;
                
                // Sort the registry by last published date and store the sorted list of IDs.
                self._sortedFullSet = registry_utils.sortRegistry(registry).map(function (entry) {
                    return entry.metadata.name;
                });
                
                // Initial filtered list is the same as the sorted list.
                self.filterSet = self._sortedFullSet.slice(0);
                $(self).triggerHandler("filterChange");
            });
    };
    
    /**
     * @private
     * Searches for the given query in the current registry list and updates the filter set,
     * dispatching a filterChange event.
     * @param {string} query The string to search for.
     */
    Model.prototype.filter = function (query) {
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
            var entry = self.registry[id];
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
     * Tests if the given entry matches the query. See `filterRegistry()` for criteria.
     * @param {Object} entry The registry entry to test.
     * @param {string} query The query to match against.
     * @return {boolean} Whether the query matches.
     */
    Model.prototype._entryMatchesQuery = function (entry, query) {
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
    
    /**
     * @constructor
     * Creates a view enabling the user to install and manage extensions.
     * Events:
     *     "render": whenever the view fully renders itself.
     */
    function ExtensionManagerView() {
        var self = this;
        this.model = new Model();
        this._itemTemplate = Mustache.compile(itemTemplate);
        this.$el = $("<div class='extension-list'/>");
        this._$table = $("<table class='table'/>").appendTo(this.$el);
        
        // Show the busy spinner and access the registry.
        var $spinner = $("<div class='spinner large spin'/>")
            .appendTo(this.$el);
        this.model.initialize().done(function (registry) {
            self._setupEventHandlers();
            self._render();
        }).fail(function () {
            $("<div class='alert-message error load-error'/>")
                .text(Strings.EXTENSION_MANAGER_ERROR_LOAD)
                .appendTo(self.$el);
        }).always(function () {
            $spinner.remove();
        });
    }
    
    /**
     * @type {jQueryObject}
     * The root of the view's DOM tree.
     */
    ExtensionManagerView.prototype.$el = null;
    
    /**
     * @type {Model}
     * The view's model. Handles sorting and filtering of items in the view.
     */
    ExtensionManagerView.prototype.model = null;
    
    /**
     * @private
     * @type {jQueryObject}
     * The root of the table inside the view.
     */
    ExtensionManagerView.prototype._$table = null;
    
    /**
     * @private
     * @type {function} The compiled template we use for rendering items in the registry list.
     */
    ExtensionManagerView.prototype._itemTemplate = null;
    
    /**
     * @private
     * @type {Object.<string, jQueryObject>}
     * The individual views for each item, keyed by the extension ID.
     */
    ExtensionManagerView.prototype._itemViews = {};
    
    /**
     * @private
     * Attaches our event handlers. We wait to do this until we've fully fetched the registry.
     */
    ExtensionManagerView.prototype._setupEventHandlers = function () {
        var self = this;
        
        // Listen for model filter changes.
        $(this.model).on("filterChange", function () {
            self._render();
        });
        
        // Listen for extension status changes.
        $(ExtensionManager).on("statusChange", function (e, id, status) {
            // Re-render the registry item.
            // FUTURE: later on, some of these views might be for installed extensions that aren't 
            // in the registry, e.g. legacy extensions or local dev extensions.
            var registry = self.model.registry;
            if (registry[id]) {
                var $oldItem = self._itemViews[id],
                    $newItem = self._renderItem(registry[id]);
                if ($oldItem) {
                    $oldItem.replaceWith($newItem);
                    self._itemViews[id] = $newItem;
                }
            }
        });
        
        // UI event handlers
        $(this.$el)
            // Intercept clicks on external links to open in the native browser.
            .on("click", "a", function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                NativeApp.openURLInDefaultBrowser($(e.target).attr("href"));
            })
            // Handle install button clicks
            .on("click", "button.install", function (e) {
                // "this" is correct here (it's the button)
                self._installUsingDialog($(this).attr("data-extension-id"));
            });
    };
    
    /**
     * @private
     * Renders the view for a single registry entry.
     * @param {Object} entry The registry entry to render.
     * @return {jQueryObject} The rendered node as a jQuery object.
     */
    ExtensionManagerView.prototype._renderItem = function (entry) {
        // Create a Mustache context object containing the entry data and our helper functions.
        var context = $.extend({}, entry),
            status = ExtensionManager.getStatus(entry.metadata.name);
        
        // Normally we would merge the strings into the context we're passing into the template,
        // but since we're instantiating the template for every item, it seems wrong to take the hit
        // of copying all the strings into the context, so we just make it a subfield.
        context.Strings = Strings;
        
        context.isInstalled = (status === ExtensionManager.ENABLED);
        
        var compatInfo = ExtensionManager.getCompatibilityInfo(entry, brackets.metadata.apiVersion);
        context.isCompatible = compatInfo.isCompatible;
        context.requiresNewer = compatInfo.requiresNewer;
        
        context.allowInstall = context.isCompatible && !context.isInstalled;
        
        ["lastVersionDate", "ownerLink", "formatUserId"].forEach(function (helper) {
            context[helper] = registry_utils[helper];
        });
        return $(this._itemTemplate(context));
    };
    
    /**
     * @private
     * Renders the registry entries in the model's current filter list.
     */
    ExtensionManagerView.prototype._render = function () {
        var self = this,
            $item;
        this._$table.empty();
        this.model.filterSet.forEach(function (id) {
            var $item = self._itemViews[id];
            if (!$item) {
                $item = self._renderItem(self.model.registry[id]);
                self._itemViews[id] = $item;
            }
            $item.appendTo(self._$table);
        });
        $(this).triggerHandler("render");
    };
    
    /**
     * @private
     * Install the extension with the given ID using the install dialog.
     * @param {string} id ID of the extension to install.
     */
    ExtensionManagerView.prototype._installUsingDialog = function (id) {
        var entry = this.model.registry[id];
        if (entry) {
            var url = ExtensionManager.getExtensionURL(id, entry.metadata.version);
            InstallExtensionDialog.installUsingDialog(url);
        }
    };
    
    exports.ExtensionManagerView = ExtensionManagerView;
    
    // For unit test only
    exports.Model = Model;
});