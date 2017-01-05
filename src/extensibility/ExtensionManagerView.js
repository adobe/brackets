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

/*unittests: ExtensionManager*/

define(function (require, exports, module) {
    "use strict";

    var Strings                   = require("strings"),
        EventDispatcher           = require("utils/EventDispatcher"),
        StringUtils               = require("utils/StringUtils"),
        ExtensionManager          = require("extensibility/ExtensionManager"),
        registry_utils            = require("extensibility/registry_utils"),
        InstallExtensionDialog    = require("extensibility/InstallExtensionDialog"),
        LocalizationUtils         = require("utils/LocalizationUtils"),
        LanguageManager           = require("language/LanguageManager"),
        Mustache                  = require("thirdparty/mustache/mustache"),
        PathUtils                 = require("thirdparty/path-utils/path-utils"),
        itemTemplate              = require("text!htmlContent/extension-manager-view-item.html");
        

    /**
     * Create a detached link element, so that we can use it later to extract url details like 'protocol'
     */
    var _tmpLink = window.document.createElement('a');

    /**
     * Creates a view enabling the user to install and manage extensions. Must be initialized
     * with initialize(). When the view is closed, dispose() must be called.
     * @constructor
     */
    function ExtensionManagerView() {
    }
    EventDispatcher.makeEventDispatcher(ExtensionManagerView.prototype);

    /**
     * Initializes the view to show a set of extensions.
     * @param {ExtensionManagerViewModel} model Model object containing extension data to view
     * @return {$.Promise} a promise that's resolved once the view has been initialized. Never
     *     rejected.
     */
    ExtensionManagerView.prototype.initialize = function (model) {
        var self = this,
            result = new $.Deferred();
        this.model = model;
        this._itemTemplate = Mustache.compile(itemTemplate);
        this._itemViews = {};
        this.$el = $("<div class='extension-list tab-pane' id='" + this.model.source + "'/>");
        this._$emptyMessage = $("<div class='empty-message'/>")
            .appendTo(this.$el);
        this._$infoMessage = $("<div class='info-message'/>")
            .appendTo(this.$el).html(this.model.infoMessage);
        this._$table = $("<table class='table'/>").appendTo(this.$el);

        this.model.initialize().done(function () {
            self._setupEventHandlers();
        }).always(function () {
            self._render();
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
     * Toggles between truncated and full length extension descriptions
     * @param {string} id The id of the extension clicked
     * @param {JQueryElement} $element The DOM element of the extension clicked
     * @param {boolean} showFull true if full length description should be shown, false for shortened version.
     */
    ExtensionManagerView.prototype._toggleDescription = function (id, $element, showFull) {
        var description, linkTitle,
            info = this.model._getEntry(id);

        // Toggle between appropriate descriptions and link title,
        // depending on if extension is installed or not
        if (showFull) {
            description = info.metadata.description;
            linkTitle = Strings.VIEW_TRUNCATED_DESCRIPTION;
        } else {
            description = info.metadata.shortdescription;
            linkTitle = Strings.VIEW_COMPLETE_DESCRIPTION;
        }

        $element.data("toggle-desc", showFull ? "trunc-desc" : "expand-desc")
                .attr("title", linkTitle)
                .prev(".ext-full-description").text(description);
    };

    /**
     * @private
     * Attaches our event handlers. We wait to do this until we've fully fetched the extension list.
     */
    ExtensionManagerView.prototype._setupEventHandlers = function () {
        var self = this;

        // Listen for model data and filter changes.
        this.model
            .on("filter", function () {
                self._render();
            })
            .on("change", function (e, id) {
                var extensions = self.model.extensions,
                    $oldItem = self._itemViews[id];
                self._updateMessage();
                if (self.model.filterSet.indexOf(id) === -1) {
                    // This extension is not in the filter set. Remove it from the view if we
                    // were rendering it previously.
                    if ($oldItem) {
                        $oldItem.remove();
                        delete self._itemViews[id];
                    }
                } else {
                    // Render the item, replacing the old item if we had previously rendered it.
                    var $newItem = self._renderItem(extensions[id], self.model._getEntry(id));
                    if ($oldItem) {
                        $oldItem.replaceWith($newItem);
                        self._itemViews[id] = $newItem;
                    }
                }
            });

        // UI event handlers
        this.$el
            .on("click", "a", function (e) {
                var $target = $(e.target);
                if ($target.hasClass("undo-remove")) {
                    ExtensionManager.markForRemoval($target.attr("data-extension-id"), false);
                } else if ($target.hasClass("remove")) {
                    ExtensionManager.markForRemoval($target.attr("data-extension-id"), true);
                } else if ($target.hasClass("undo-update")) {
                    ExtensionManager.removeUpdate($target.attr("data-extension-id"));
                } else if ($target.hasClass("undo-disable")) {
                    ExtensionManager.markForDisabling($target.attr("data-extension-id"), false);
                } else if ($target.data("toggle-desc") === "expand-desc") {
                    this._toggleDescription($target.attr("data-extension-id"), $target, true);
                } else if ($target.data("toggle-desc") === "trunc-desc") {
                    this._toggleDescription($target.attr("data-extension-id"), $target, false);
                }
            }.bind(this))
            .on("click", "button.install", function (e) {
                self._installUsingDialog($(e.target).attr("data-extension-id"));
            })
            .on("click", "button.update", function (e) {
                self._installUsingDialog($(e.target).attr("data-extension-id"), true);
            })
            .on("click", "button.remove", function (e) {
                ExtensionManager.markForRemoval($(e.target).attr("data-extension-id"), true);
            })
            .on("click", "button.disable", function (e) {
                ExtensionManager.markForDisabling($(e.target).attr("data-extension-id"), true);
            })
            .on("click", "button.enable", function (e) {
                ExtensionManager.enable($(e.target).attr("data-extension-id"));
            });
    };

    /**
     * @private
     * Renders the view for a single extension entry.
     * @param {Object} entry The extension entry to render.
     * @param {Object} info The extension's metadata.
     * @return {jQueryObject} The rendered node as a jQuery object.
     */
    ExtensionManagerView.prototype._renderItem = function (entry, info) {
        // Create a Mustache context object containing the entry data and our helper functions.

        // Start with the basic info from the given entry, either the installation info or the
        // registry info depending on what we're listing.
        var context = $.extend({}, info);

        // Normally we would merge the strings into the context we're passing into the template,
        // but since we're instantiating the template for every item, it seems wrong to take the hit
        // of copying all the strings into the context, so we just make it a subfield.
        context.Strings = Strings;

        // Calculate various bools, since Mustache doesn't let you use expressions and interprets
        // arrays as iteration contexts.
        context.isInstalled = !!entry.installInfo;
        context.failedToStart = (entry.installInfo && entry.installInfo.status === ExtensionManager.START_FAILED);
        context.disabled = (entry.installInfo && entry.installInfo.status === ExtensionManager.DISABLED);
        context.hasVersionInfo = !!info.versions;

        if (entry.registryInfo) {
            var latestVerCompatInfo = ExtensionManager.getCompatibilityInfo(entry.registryInfo, brackets.metadata.apiVersion);
            context.isCompatible = latestVerCompatInfo.isCompatible;
            context.requiresNewer = latestVerCompatInfo.requiresNewer;
            context.isCompatibleLatest = latestVerCompatInfo.isLatestVersion;
            if (!context.isCompatibleLatest) {
                var installWarningBase = context.requiresNewer ? Strings.EXTENSION_LATEST_INCOMPATIBLE_NEWER : Strings.EXTENSION_LATEST_INCOMPATIBLE_OLDER;
                context.installWarning = StringUtils.format(installWarningBase, entry.registryInfo.versions[entry.registryInfo.versions.length - 1].version, latestVerCompatInfo.compatibleVersion);
            }
        } else {
            // We should only get here when viewing the Installed tab and some extensions don't exist in the registry
            // (or registry is offline). These flags *should* always be ignored in that scenario, but just in case...
            context.isCompatible = context.isCompatibleLatest = true;
        }

        // Check if extension metadata contains localized content.
        var lang            = brackets.getLocale(),
            shortLang       = lang.split("-")[0];
        if (info.metadata["package-i18n"]) {
            [shortLang, lang].forEach(function (locale) {
                if (info.metadata["package-i18n"].hasOwnProperty(locale)) {
                    // only overlay specific properties with the localized values
                    ["title", "description", "homepage", "keywords"].forEach(function (prop) {
                        if (info.metadata["package-i18n"][locale].hasOwnProperty(prop)) {
                            info.metadata[prop] = info.metadata["package-i18n"][locale][prop];
                        }
                    });
                }
            });
        }

        if (info.metadata.description !== undefined) {
            info.metadata.shortdescription = StringUtils.truncate(info.metadata.description, 200);
        }

        context.isMarkedForRemoval = ExtensionManager.isMarkedForRemoval(info.metadata.name);
        context.isMarkedForDisabling = ExtensionManager.isMarkedForDisabling(info.metadata.name);
        context.isMarkedForUpdate = ExtensionManager.isMarkedForUpdate(info.metadata.name);
        var hasPendingAction = context.isMarkedForDisabling || context.isMarkedForRemoval || context.isMarkedForUpdate;

        context.showInstallButton = (this.model.source === this.model.SOURCE_REGISTRY || this.model.source === this.model.SOURCE_THEMES) && !context.updateAvailable;
        context.showUpdateButton = context.updateAvailable && !context.isMarkedForUpdate && !context.isMarkedForRemoval;

        context.allowInstall = context.isCompatible && !context.isInstalled;

        if (Array.isArray(info.metadata.i18n) && info.metadata.i18n.length > 0) {
            context.translated = true;
            context.translatedLangs =
                info.metadata.i18n.map(function (value) {
                    if (value === "root") {
                        value = "en";
                    }
                    return { name: LocalizationUtils.getLocalizedLabel(value), locale: value };
                })
                .sort(function (lang1, lang2) {
                    // List users language first
                    var locales         = [lang1.locale, lang2.locale],
                        userLangIndex   = locales.indexOf(lang);
                    if (userLangIndex > -1) {
                        return userLangIndex;
                    }
                    userLangIndex = locales.indexOf(shortLang);
                    if (userLangIndex > -1) {
                        return userLangIndex;
                    }

                    return lang1.name.localeCompare(lang2.name);
                })
                .map(function (value) {
                    return value.name;
                })
                .join(", ");
            context.translatedLangs = StringUtils.format(Strings.EXTENSION_TRANSLATED_LANGS, context.translatedLangs);

            // If the selected language is System Default, match both the short (2-char) language code
            // and the long one
            var translatedIntoUserLang =
                (brackets.isLocaleDefault() && info.metadata.i18n.indexOf(shortLang) > -1) ||
                info.metadata.i18n.indexOf(lang) > -1;
            context.extensionTranslated = StringUtils.format(
                translatedIntoUserLang ? Strings.EXTENSION_TRANSLATED_USER_LANG : Strings.EXTENSION_TRANSLATED_GENERAL,
                info.metadata.i18n.length
            );
        }

        var isInstalledInUserFolder = (entry.installInfo && entry.installInfo.locationType === ExtensionManager.LOCATION_USER);
        context.allowRemove = isInstalledInUserFolder;
        context.allowUpdate = context.showUpdateButton && context.isCompatible && context.updateCompatible && isInstalledInUserFolder;
        if (!context.allowUpdate) {
            context.updateNotAllowedReason = isInstalledInUserFolder ? Strings.CANT_UPDATE : Strings.CANT_UPDATE_DEV;
        }

        context.removalAllowed = this.model.source === "installed" &&
            !context.failedToStart && !hasPendingAction;
        context.disablingAllowed = this.model.source === "installed" &&
            !context.disabled && !hasPendingAction;
        context.enablingAllowed = this.model.source === "installed" &&
            context.disabled && !hasPendingAction;

        // Copy over helper functions that we share with the registry app.
        ["lastVersionDate", "authorInfo"].forEach(function (helper) {
            context[helper] = registry_utils[helper];
        });

        // Do some extra validation on homepage url to make sure we don't end up executing local binary
        if (context.metadata.homepage) {
            var parsed = PathUtils.parseUrl(context.metadata.homepage);

            // We can't rely on path-utils because of known problems with protocol identification
            // Falling back to Browsers protocol identification mechanism
            _tmpLink.href = context.metadata.homepage;

            // Check if the homepage refers to a local resource
            if (_tmpLink.protocol === "file:") {
                var language = LanguageManager.getLanguageForExtension(parsed.filenameExtension.replace(/^\./, ''));
                // If identified language for the local resource is binary, don't list it
                if (language && language.isBinary()) {
                    delete context.metadata.homepage;
                }
            }
        }

        return $(this._itemTemplate(context));
    };

    /**
     * @private
     * Display an optional message (hiding the extension list if displayed)
     * @return {boolean} Returns true if a message is displayed
     */
    ExtensionManagerView.prototype._updateMessage = function () {
        if (this.model.message) {
            this._$emptyMessage.css("display", "block");
            this._$emptyMessage.html(this.model.message);
            this._$infoMessage.css("display", "none");
            this._$table.css("display", "none");

            return true;
        } else {
            this._$emptyMessage.css("display", "none");
            this._$infoMessage.css("display", this.model.infoMessage ? "block" : "none");
            this._$table.css("display", "");

            return false;
        }
    };

    /**
     * @private
     * Renders the extension entry table based on the model's current filter set. Will create
     * new items for entries that haven't yet been rendered, but will not re-render existing items.
     */
    ExtensionManagerView.prototype._render = function () {
        var self = this;

        this._$table.empty();
        this._updateMessage();

        this.model.filterSet.forEach(function (id) {
            var $item = self._itemViews[id];
            if (!$item) {
                $item = self._renderItem(self.model.extensions[id], self.model._getEntry(id));
                self._itemViews[id] = $item;
            }
            $item.appendTo(self._$table);
        });

        this.trigger("render");
    };

    /**
     * @private
     * Install the extension with the given ID using the install dialog.
     * @param {string} id ID of the extension to install.
     */
    ExtensionManagerView.prototype._installUsingDialog = function (id, _isUpdate) {
        var entry = this.model.extensions[id];
        if (entry && entry.registryInfo) {
            var compatInfo = ExtensionManager.getCompatibilityInfo(entry.registryInfo, brackets.metadata.apiVersion),
                url = ExtensionManager.getExtensionURL(id, compatInfo.compatibleVersion);

            // TODO: this should set .done on the returned promise
            if (_isUpdate) {
                InstallExtensionDialog.updateUsingDialog(url).done(ExtensionManager.updateFromDownload);
            } else {
                InstallExtensionDialog.installUsingDialog(url);
            }
        }
    };

    /**
     * Filters the contents of the view.
     * @param {string} query The query to filter by.
     */
    ExtensionManagerView.prototype.filter = function (query) {
        this.model.filter(query);
    };

    exports.ExtensionManagerView = ExtensionManagerView;
});
