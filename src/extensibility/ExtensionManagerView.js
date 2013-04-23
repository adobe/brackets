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
        StringUtils            = require("utils/StringUtils"),
        registry_utils         = require("extensibility/registry_utils"),
        itemTemplate           = require("text!htmlContent/extension-manager-view-item.html");
    
    /**
     * @constructor
     * Creates a view enabling the user to install and manage extensions.
     * Events:
     *     "render": whenever the view fully renders itself.
     */
    function ExtensionManagerView() {
        var self = this;
        this._itemTemplate = Mustache.compile(itemTemplate);
        this.$el = $("<div class='extension-list'/>");
        
        // Listen for extension status changes.
        $(ExtensionManager).on("statusChange", function (e, id, status) {
            // Re-render the registry item.
            // FUTURE: later on, some of these views might be for installed extensions that aren't 
            // in the registry, e.g. legacy extensions or local dev extensions.
            ExtensionManager.getRegistry().done(function (registry) {
                if (registry[id]) {
                    var $oldItem = self._itemViews[id],
                        $newItem = self._renderItem(registry[id]);
                    if ($oldItem) {
                        $oldItem.replaceWith($newItem);
                        self._itemViews[id] = $newItem;
                    }
                }
            });
        });
        
        // UI event handlers
        $(this.$el)
            // Intercept clicks on external links to open in the native browser.
            .on("click", "a", function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                NativeApp.openURLInDefaultBrowser($(e.currentTarget).attr("href"));
            })
            // Handle install button clicks
            .on("click", "button.install", function (e) {
                self._installUsingDialog($(this).attr("data-extension-id"));
            });
        
        // Show the busy spinner and access the registry.
        var $spinner = $("<div class='spinner large spin'/>")
            .appendTo(this.$el);
        ExtensionManager.getRegistry(true).done(function (registry) {
            // Display the registry view.
            self._render(registry_utils.sortRegistry(registry));
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
     * Display the given registry data.
     * @param {Array} registry The sorted list of registry entries to show.
     */
    ExtensionManagerView.prototype._render = function (registry) {
        // TODO: localize strings in template
        var self = this,
            $table = $("<table class='table'/>"),
            $item;
        this._itemViews = {};
        registry.forEach(function (entry) {
            var $item = self._renderItem(entry);
            self._itemViews[entry.metadata.name] = $item;
            $item.appendTo($table);
        });
        $table.appendTo(this.$el);
        $(this).triggerHandler("render");
    };
    
    /**
     * @private
     * Install the extension with the given ID using the install dialog.
     * @param {string} id ID of the extension to install.
     */
    ExtensionManagerView.prototype._installUsingDialog = function (id) {
        var self = this;
        ExtensionManager.getRegistry().done(function (registry) {
            var entry = registry[id];
            if (entry) {
                var url = StringUtils.format(brackets.config.extension_url, id, entry.metadata.version);
                InstallExtensionDialog.installUsingDialog(url);
            }
        });
    };
    
    exports.ExtensionManagerView = ExtensionManagerView;
});