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
    
    var Strings                   = require("strings"),
        NativeApp                 = require("utils/NativeApp"),
        ExtensionManagerViewModel = require("extensibility/ExtensionManagerViewModel").ExtensionManagerViewModel,
        ExtensionManager          = require("extensibility/ExtensionManager"),
        Package                   = require("extensibility/Package"),
        registry_utils            = require("extensibility/registry_utils"),
        InstallExtensionDialog    = require("extensibility/InstallExtensionDialog"),
        Dialogs                   = require("widgets/Dialogs"),
        DefaultDialogs            = require("widgets/DefaultDialogs"),
        StringUtils               = require("utils/StringUtils"),
        CommandManager            = require("command/CommandManager"),
        Commands                  = require("command/Commands"),
        itemTemplate              = require("text!htmlContent/extension-manager-view-item.html");
    
    /**
     * @constructor
     * Creates a view enabling the user to install and manage extensions. Must be initialized
     * with initialize(). When the view is closed, dispose() must be called.
     */
    function ExtensionManagerView() {
    }
    
    /**
     * Initializes the view to show a set of extensions.
     * @param {string} source Which set of extensions to view: one of the SOURCE_* constants
     *     in ExtensionsManagerViewModel.
     * @return {$.Promise} a promise that's resolved once the view has been initialized. Never
     *     rejected.
     */
    ExtensionManagerView.prototype.initialize = function (source) {
        var self = this,
            result = new $.Deferred();
        this.model = new ExtensionManagerViewModel();
        this._itemTemplate = Mustache.compile(itemTemplate);
        this._itemViews = {};
        this.$el = $("<div class='extension-list'/>");
        this._$emptyMessage = $("<div class='empty-message'/>")
            .appendTo(this.$el);
        this._$table = $("<table class='table'/>").appendTo(this.$el);
        
        // Show the busy spinner and access the registry.
        var $spinner = $("<div class='spinner large spin'/>")
            .appendTo(this.$el);
        this.model.initialize(source).done(function () {
            self._setupEventHandlers();
            self._render();
        }).fail(function () {
            $("<div class='alert error load-error'/>")
                .text(Strings.EXTENSION_MANAGER_ERROR_LOAD)
                .appendTo(self.$el);
        }).always(function () {
            $spinner.remove();
            result.resolve();
        });
        return result.promise();
    };
    
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
     * @type {jQueryObject}
     * Element showing a message when there are no extensions.
     */
    ExtensionManagerView.prototype._$emptyMessage = null;
    
    /**
     * @private
     * @type {jQueryObject}
     * The root of the table inside the view.
     */
    ExtensionManagerView.prototype._$table = null;
    
    /**
     * @private
     * @type {function} The compiled template we use for rendering items in the extension list.
     */
    ExtensionManagerView.prototype._itemTemplate = null;
    
    /**
     * @private
     * @type {Object.<string, jQueryObject>}
     * The individual views for each item, keyed by the extension ID.
     */
    ExtensionManagerView.prototype._itemViews = null;
    
    /**
     * @private
     * Attaches our event handlers. We wait to do this until we've fully fetched the extension list.
     */
    ExtensionManagerView.prototype._setupEventHandlers = function () {
        var self = this;
        
        // Listen for model data and filter changes.
        $(this.model)
            .on("filter", function () {
                self._render();
            })
            .on("change", function (e, id) {
                var extensions = self.model.extensions,
                    $oldItem = self._itemViews[id];
                self._checkNoExtensions();
                if (self.model.filterSet.indexOf(id) === -1) {
                    // This extension is not in the filter set. Remove it from the view if we
                    // were rendering it previously.
                    if ($oldItem) {
                        $oldItem.remove();
                        delete self._itemViews[id];
                    }
                } else {
                    // Render the item, replacing the old item if we had previously rendered it.
                    var $newItem = self._renderItem(extensions[id]);
                    if ($oldItem) {
                        $oldItem.replaceWith($newItem);
                        self._itemViews[id] = $newItem;
                    }
                }
            });
        
        // UI event handlers
        this.$el
            .on("click", "a", function (e) {
                // Never allow the default behavior for links--we don't want
                // them to navigate out of Brackets!
                e.stopImmediatePropagation();
                e.preventDefault();
                
                var $target = $(e.target);
                if ($target.hasClass("undo-remove")) {
                    self.model.markForRemoval($target.attr("data-extension-id"), false);
                } else if ($target.hasClass("remove")) {
                    self.model.markForRemoval($target.attr("data-extension-id"), true);
                } else if ($target.hasClass("undo-update")) {
                    self.model.removeUpdate($target.attr("data-extension-id"));
                } else {
                    // Open any other link in the external browser.
                    NativeApp.openURLInDefaultBrowser($target.attr("href"));
                }
            })
            .on("click", "button.install", function (e) {
                self._installUsingDialog($(e.target).attr("data-extension-id"));
            })
            .on("click", "button.remove", function (e) {
                self.model.markForRemoval($(e.target).attr("data-extension-id"), true);
            });
    };
    
    /**
     * @private
     * Renders the view for a single extension entry.
     * @param {Object} entry The extension entry to render.
     * @return {jQueryObject} The rendered node as a jQuery object.
     */
    ExtensionManagerView.prototype._renderItem = function (entry) {
        // Create a Mustache context object containing the entry data and our helper functions.
        
        // Start with the basic info from the given entry, either the installation info or the
        // registry info depending on what we're listing.
        var info, context;
        if (this.model.source === ExtensionManagerViewModel.SOURCE_INSTALLED) {
            info = entry.installInfo;
            context = $.extend({}, info);
            // If this is also linked to a registry item, copy over the owner info.
            if (entry.registryInfo) {
                context.owner = entry.registryInfo.owner;
            }
        } else {
            info = entry.registryInfo;
            context = $.extend({}, info);
        }
        
        // Normally we would merge the strings into the context we're passing into the template,
        // but since we're instantiating the template for every item, it seems wrong to take the hit
        // of copying all the strings into the context, so we just make it a subfield.
        context.Strings = Strings;
        
        // Calculate various bools, since Mustache doesn't let you use expressions and interprets
        // arrays as iteration contexts.
        context.isInstalled = !!entry.installInfo;
        context.failedToStart = (entry.installInfo && entry.installInfo.status === ExtensionManager.START_FAILED);
        context.hasVersionInfo = !!info.versions;
                
        var compatInfo = ExtensionManager.getCompatibilityInfo(info, brackets.metadata.apiVersion);
        context.isCompatible = compatInfo.isCompatible;
        context.requiresNewer = compatInfo.requiresNewer;
        
        context.showInstallButton = (this.model.source === ExtensionManagerViewModel.SOURCE_REGISTRY);
        context.allowInstall = context.isCompatible && !context.isInstalled;
        
        context.allowRemove = (entry.installInfo && entry.installInfo.locationType === ExtensionManager.LOCATION_USER);
        context.isMarkedForRemoval = this.model.isMarkedForRemoval(info.metadata.name);
        context.isMarkedForUpdate = this.model.isMarkedForUpdate(info.metadata.name);
        context.removalAllowed = !context.failedToStart && !context.isMarkedForUpdate && !context.isMarkedForRemoval;
        
        // Copy over helper functions that we share with the registry app.
        ["lastVersionDate", "authorInfo"].forEach(function (helper) {
            context[helper] = registry_utils[helper];
        });
        
        return $(this._itemTemplate(context));
    };
    
    /**
     * @private
     * Checks if there are no extensions, and if so shows the "no extensions" message.
     */
    ExtensionManagerView.prototype._checkNoExtensions = function () {
        if (this.model.filterSet.length === 0) {
            this._$emptyMessage.css("display", "block");
            this._$emptyMessage.html(this.model.sortedFullSet && this.model.sortedFullSet.length ? Strings.NO_EXTENSION_MATCHES : Strings.NO_EXTENSIONS);
            this._$table.css("display", "none");
        } else {
            this._$table.css("display", "");
            this._$emptyMessage.css("display", "none");
        }
    };
    
    /**
     * @private
     * Renders the extension entry table based on the model's current filter set. Will create
     * new items for entries that haven't yet been rendered, but will not re-render existing items.
     */
    ExtensionManagerView.prototype._render = function () {
        var self = this,
            $item;
        this._checkNoExtensions();
        this._$table.empty();
        this.model.filterSet.forEach(function (id) {
            var $item = self._itemViews[id];
            if (!$item) {
                $item = self._renderItem(self.model.extensions[id]);
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
        var entry = this.model.extensions[id];
        if (entry && entry.registryInfo) {
            var url = ExtensionManager.getExtensionURL(id, entry.registryInfo.metadata.version);
            // TODO: this should set .done on the returned promise
            // and handle the case where an extension needs an update.
            InstallExtensionDialog.installUsingDialog(url);
        }
    };
    
    /**
     * Filters the contents of the view.
     * @param {string} query The query to filter by.
     */
    ExtensionManagerView.prototype.filter = function (query) {
        this.model.filter(query);
    };
    
    /**
     * Disposes the view. Must be called when the view goes away.
     * @param {boolean} _skipChanges Whether to skip changing of marked extensions. Only for unit testing.
     */
    ExtensionManagerView.prototype.dispose = function (_skipChanges) {
        var self = this;
        
        var hasRemovedExtensions = this.model.hasExtensionsToRemove(),
            hasUpdatedExtensions = this.model.hasExtensionsToUpdate();
        // If an extension was removed or updated, prompt the user to quit Brackets.
        if (!_skipChanges && (hasRemovedExtensions || hasUpdatedExtensions)) {
            var buttonLabel = Strings.CHANGE_AND_QUIT;
            if (hasRemovedExtensions && !hasUpdatedExtensions) {
                buttonLabel = Strings.REMOVE_AND_QUIT;
            } else if (hasUpdatedExtensions && !hasRemovedExtensions) {
                buttonLabel = Strings.UPDATE_AND_QUIT;
            }
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_CHANGE_EXTENSIONS,
                Strings.CHANGE_AND_QUIT_TITLE,
                Strings.CHANGE_AND_QUIT_MESSAGE,
                [
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id        : Dialogs.DIALOG_BTN_CANCEL,
                        text      : Strings.CANCEL
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id        : Dialogs.DIALOG_BTN_OK,
                        text      : buttonLabel
                    }
                ]
            )
                .done(function (buttonId) {
                    if (buttonId === "ok") {
                        self.model.removeMarkedExtensions()
                            .done(function () {
                                self.model.updateExtensions()
                                    .done(function () {
                                        self.model.dispose();
                                        CommandManager.execute(Commands.FILE_QUIT);
                                    })
                                    .fail(function (errorArray) {
                                        self.model.dispose();
                                        
                                        // This error case should be very uncommon.
                                        // Just let the user know that we couldn't update
                                        // this extension and log the errors to the console.
                                        var ids = [];
                                        errorArray.forEach(function (errorObj) {
                                            ids.push(errorObj.item);
                                            if (errorObj.error && errorObj.error.forEach) {
                                                console.error("Errors for ", errorObj.item);
                                                errorObj.error.forEach(function (error) {
                                                    console.error(Package.formatError(error));
                                                });
                                            }
                                        });
                                        Dialogs.showModalDialog(
                                            DefaultDialogs.DIALOG_ID_ERROR,
                                            Strings.EXTENSION_MANAGER_UPDATE,
                                            StringUtils.format(Strings.EXTENSION_MANAGER_UPDATE_ERROR, ids.join(", "))
                                        ).done(function () {
                                            // We still have to quit even if some of the removals failed.
                                            CommandManager.execute(Commands.FILE_QUIT);
                                        });
                                    });
                            })
                            .fail(function (errorArray) {
                                self.model.dispose();
                                self.model.cleanupUpdates();
                                
                                var ids = [];
                                errorArray.forEach(function (errorObj) {
                                    ids.push(errorObj.item);
                                });
                                Dialogs.showModalDialog(
                                    DefaultDialogs.DIALOG_ID_ERROR,
                                    Strings.EXTENSION_MANAGER_REMOVE,
                                    StringUtils.format(Strings.EXTENSION_MANAGER_REMOVE_ERROR, ids.join(", "))
                                ).done(function () {
                                    // We still have to quit even if some of the removals failed.
                                    CommandManager.execute(Commands.FILE_QUIT);
                                });
                            });
                    } else {
                        self.model.cleanupUpdates();
                        self.model.dispose();
                    }
                });
        } else {
            this.model.dispose();
        }
    };
    
    exports.ExtensionManagerView = ExtensionManagerView;
});