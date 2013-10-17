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
/*global define, window, $, brackets, semver */
/*unittests: ExtensionManager*/

/**
 * The ExtensionManager fetches/caches the extension registry and provides
 * information about the status of installed extensions. ExtensionManager raises the 
 * following events:
 *     statusChange - indicates that an extension has been installed/uninstalled or
 *         its status has otherwise changed. Second parameter is the id of the
 *         extension.
 *     registryUpdate - indicates that an existing extension was synchronized
 *         with new data from the registry.
 */

define(function (require, exports, module) {
    "use strict";
    
    var FileUtils        = require("file/FileUtils"),
        Package          = require("extensibility/Package"),
        Async            = require("utils/Async"),
        ExtensionLoader  = require("utils/ExtensionLoader"),
        FileSystem       = require("filesystem/FileSystem"),
        Strings          = require("strings"),
        StringUtils      = require("utils/StringUtils");
    
    // semver isn't a proper AMD module, so it will just load into the global namespace.
    var semver = require("extensibility/node/node_modules/semver/semver.browser");
    
    /**
     * Extension status constants.
     */
    var ENABLED      = "enabled",
        START_FAILED = "startFailed";
    
    /**
     * Extension location constants.
     */
    var LOCATION_DEFAULT = "default",
        LOCATION_DEV     = "dev",
        LOCATION_USER    = "user",
        LOCATION_UNKNOWN = "unknown";
    
    /**
     * @private
     * @type {Object.<string, {metadata: Object, path: string, status: string}>}
     * The set of all known extensions, both from the registry and locally installed. 
     * The keys are either "name" from package.json (for extensions that have package metadata) 
     * or the last segment of local file paths (for installed legacy extensions 
     * with no package metadata). The fields of each record are:
     *     registryInfo: object containing the info for this id from the main registry (containing metadata, owner,
     *         and versions). This will be null for legacy extensions.
     *     installInfo: object containing the info for a locally-installed extension:
     *         metadata: the package metadata loaded from the local package.json, or null if it's a legacy extension.
     *             This will be different from registryInfo.metadata if there's a newer version in the registry.
     *         path: the local path to the extension folder on disk
     *         locationType: general type of installation; one of the LOCATION_* constants above
     *         status: the current status, one of the status constants above
     */
    var extensions = {};
    
    /**
     * Requested changes to the installed extensions.
     */
    var _idsToRemove = [],
        _idsToUpdate = [];
        
    /**
     * @private
     * Synchronizes the information between the public registry and the installed
     * extensions. Specifically, this makes the `owner` available in each and sets
     * an `updateAvailable` flag.
     *
     * @param {string} id of the extension to synchronize
     */
    function synchronizeEntry(id) {
        var entry = extensions[id];
        
        // Do nothing if we only have one set of data
        if (!entry || !entry.installInfo || !entry.registryInfo) {
            return;
        }
        
        entry.installInfo.owner = entry.registryInfo.owner;
        if (entry.installInfo.metadata && entry.installInfo.metadata.version && semver.lt(entry.installInfo.metadata.version, entry.registryInfo.metadata.version)) {
            entry.registryInfo.updateAvailable = true;
            entry.installInfo.updateAvailable = true;
        } else {
            entry.installInfo.updateAvailable = false;
            entry.registryInfo.updateAvailable = false;
        }

        $(exports).triggerHandler("registryUpdate", [id]);
    }

    /**
     * @private
     * Sets our data. For unit testing only.
     */
    function _setExtensions(newExtensions) {
        exports.extensions = extensions = newExtensions;
        Object.keys(extensions).forEach(function (id) {
            synchronizeEntry(id);
        });
    }

    /**
     * @private
     * Clears out our existing data. For unit testing only.
     */
    function _reset() {
        exports.extensions = extensions = {};
        _idsToRemove = [];
        _idsToUpdate = [];
    }
    
    /**
     * Downloads the registry of Brackets extensions and stores the information in our
     * extension info.
     *
     * @return {$.Promise} a promise that's resolved with the registry JSON data
     * or rejected if the server can't be reached.
     */
    function downloadRegistry() {
        var result = new $.Deferred();
        $.ajax({
            url: brackets.config.extension_registry,
            dataType: "json",
            cache: false
        })
            .done(function (data) {
                Object.keys(data).forEach(function (id) {
                    if (!extensions[id]) {
                        extensions[id] = {};
                    }
                    extensions[id].registryInfo = data[id];
                    synchronizeEntry(id);
                });
                result.resolve();
            })
            .fail(function () {
                result.reject();
            });
        return result.promise();
    }
    
    /**
     * @private
     * Loads the package.json file in the given extension folder.
     * @param {string} folder The extension folder.
     * @return {$.Promise} A promise object that is resolved with the parsed contents of the package.json file,
     *     or rejected if there is no package.json or the contents are not valid JSON.
     */
    function _loadPackageJson(folder) {
        var file = FileSystem.getFileForPath(folder + "/package.json"),
            result = new $.Deferred();
        FileUtils.readAsText(file)
            .done(function (text) {
                try {
                    var json = JSON.parse(text);
                    result.resolve(json);
                } catch (e) {
                    result.reject();
                }
            })
            .fail(function () {
                result.reject();
            });
        return result.promise();
    }
    
    /**
     * @private
     * When an extension is loaded, fetches the package.json and stores the extension in our map.
     * @param {$.Event} e The event object
     * @param {string} path The local path of the loaded extension's folder.
     */
    function _handleExtensionLoad(e, path) {
        function setData(id, metadata) {
            var locationType,
                userExtensionPath = ExtensionLoader.getUserExtensionPath();
            if (path.indexOf(userExtensionPath) === 0) {
                locationType = LOCATION_USER;
            } else {
                var segments = path.split("/"), parent;
                if (segments.length > 2) {
                    parent = segments[segments.length - 2];
                }
                if (parent === "dev") {
                    locationType = LOCATION_DEV;
                } else if (parent === "default") {
                    locationType = LOCATION_DEFAULT;
                } else {
                    locationType = LOCATION_UNKNOWN;
                }
            }
            if (!extensions[id]) {
                extensions[id] = {};
            }
            extensions[id].installInfo = {
                metadata: metadata,
                path: path,
                locationType: locationType,
                status: (e.type === "loadFailed" ? START_FAILED : ENABLED)
            };
            synchronizeEntry(id);
            $(exports).triggerHandler("statusChange", [id]);
        }
        
        _loadPackageJson(path)
            .done(function (metadata) {
                setData(metadata.name, metadata);
            })
            .fail(function () {
                // If there's no package.json, this is a legacy extension. It was successfully loaded,
                // but we don't have an official ID or metadata for it, so we just create an id and
                // "title" for it (which is the last segment of its pathname) 
                // and record that it's enabled.
                var match = path.match(/\/([^\/]+)$/),
                    name = (match && match[1]) || path,
                    metadata = { name: name, title: name };
                setData(name, metadata);
            });
    }
        
    /**
     * Returns information about whether the given entry is compatible with the given Brackets API version.
     * @param {Object} entry The registry entry to check.
     * @param {string} apiVersion The Brackets API version to check against.
     * @return {{isCompatible: boolean, requiresNewer}} Result contains an
     *      "isCompatible" member saying whether it's compatible. If not compatible, then
     *      "requiresNewer" says whether it requires an older or newer version of Brackets.
     */
    function getCompatibilityInfo(entry, apiVersion) {
        var requiredVersion = entry.metadata.engines && entry.metadata.engines.brackets,
            result = {};
        result.isCompatible = !requiredVersion || semver.satisfies(apiVersion, requiredVersion);
        if (!result.isCompatible) {
            if (requiredVersion.charAt(0) === '<') {
                result.requiresNewer = false;
            } else if (requiredVersion.charAt(0) === '>') {
                result.requiresNewer = true;
            } else if (requiredVersion.charAt(0) === "~") {
                var compareVersion = requiredVersion.slice(1);
                // Need to add .0s to this style of range in order to compare (since valid version
                // numbers must have major/minor/patch).
                if (compareVersion.match(/^[0-9]+$/)) {
                    compareVersion += ".0.0";
                } else if (compareVersion.match(/^[0-9]+\.[0-9]+$/)) {
                    compareVersion += ".0";
                }
                result.requiresNewer = semver.lt(apiVersion, compareVersion);
            }
        }
        return result;
    }
    
    /**
     * Given an extension id and version number, returns the URL for downloading that extension from
     * the repository. Does not guarantee that the extension exists at that URL.
     * @param {string} id The extension's name from the metadata.
     * @param {string} version The version to download.
     * @return {string} The URL to download the extension from.
     */
    function getExtensionURL(id, version) {
        return StringUtils.format(brackets.config.extension_url, id, version);
    }
    
    /**
     * Removes the installed extension with the given id.
     * @param {string} id The id of the extension to remove.
     * @return {$.Promise} A promise that's resolved when the extension is removed or
     *     rejected with an error if there's a problem with the removal.
     */
    function remove(id) {
        var result = new $.Deferred();
        if (extensions[id] && extensions[id].installInfo) {
            Package.remove(extensions[id].installInfo.path)
                .done(function () {
                    extensions[id].installInfo = null;
                    result.resolve();
                    $(exports).triggerHandler("statusChange", [id]);
                })
                .fail(function (err) {
                    result.reject(err);
                });
        } else {
            result.reject(StringUtils.format(Strings.EXTENSION_NOT_INSTALLED, id));
        }
        return result.promise();
    }
    
    /**
     * Updates an installed extension with the given package file.
     * @param {string} id of the extension
     * @param {string} packagePath path to the package file
     * @return {$.Promise} A promise that's resolved when the extension is updated or
     *     rejected with an error if there's a problem with the update.
     */
    function update(id, packagePath) {
        return Package.installUpdate(packagePath, id);
    }

    /**
     * Deletes any temporary files left behind by extensions that
     * were marked for update.
     */
    function cleanupUpdates() {
        Object.keys(_idsToUpdate).forEach(function (id) {
            var filename = _idsToUpdate[id].localPath;
            if (filename) {
                FileSystem.getFileForPath(filename).unlink();
            }
        });
        _idsToUpdate = {};
    }
    
    /**
     * Unmarks all extensions marked for removal.
     */
    function unmarkAllForRemoval() {
        _idsToRemove = {};
    }

    /**
     * Marks an extension for later removal, or unmarks an extension previously marked.
     * @param {string} id The id of the extension to mark for removal.
     * @param {boolean} mark Whether to mark or unmark it.
     */
    function markForRemoval(id, mark) {
        if (mark) {
            _idsToRemove[id] = true;
        } else {
            delete _idsToRemove[id];
        }
        $(exports).triggerHandler("statusChange", [id]);
    }
    
    /**
     * Returns true if an extension is marked for removal.
     * @param {string} id The id of the extension to check.
     * @return {boolean} true if it's been marked for removal, false otherwise.
     */
    function isMarkedForRemoval(id) {
        return !!(_idsToRemove[id]);
    }
    
    /**
     * Returns true if there are any extensions marked for removal.
     * @return {boolean} true if there are extensions to remove
     */
    function hasExtensionsToRemove() {
        return Object.keys(_idsToRemove).length > 0;
    }
    
    /**
     * If a downloaded package appears to be an update, mark the extension for update.
     * If an extension was previously marked for removal, marking for update will
     * turn off the removal mark.
     * @param {Object} installationResult info about the install provided by the Package.download function
     */
    function updateFromDownload(installationResult) {
        var installationStatus = installationResult.installationStatus;
        if (installationStatus === Package.InstallationStatuses.ALREADY_INSTALLED ||
                installationStatus === Package.InstallationStatuses.NEEDS_UPDATE ||
                installationStatus === Package.InstallationStatuses.SAME_VERSION ||
                installationStatus === Package.InstallationStatuses.OLDER_VERSION) {
            var id = installationResult.name;
            delete _idsToRemove[id];
            _idsToUpdate[id] = installationResult;
            $(exports).triggerHandler("statusChange", [id]);
        }
    }
    
    /**
     * Removes the mark for an extension to be updated on restart. Also deletes the
     * downloaded package file.
     * @param {string} id The id of the extension for which the update is being removed
     */
    function removeUpdate(id) {
        var installationResult = _idsToUpdate[id];
        if (!installationResult) {
            return;
        }
        if (installationResult.localPath) {
            FileSystem.getFileForPath(installationResult.localPath).unlink();
        }
        delete _idsToUpdate[id];
        $(exports).triggerHandler("statusChange", [id]);
    }
    
    /**
     * Returns true if an extension is marked for update.
     * @param {string} id The id of the extension to check.
     * @return {boolean} true if it's been marked for update, false otherwise.
     */
    function isMarkedForUpdate(id) {
        return !!(_idsToUpdate[id]);
    }
    
    /**
     * Returns true if there are any extensions marked for update.
     * @return {boolean} true if there are extensions to update
     */
    function hasExtensionsToUpdate() {
        return Object.keys(_idsToUpdate).length > 0;
    }
    
    /**
     * Removes extensions previously marked for removal.
     * @return {$.Promise} A promise that's resolved when all extensions are removed, or rejected
     *     if one or more extensions can't be removed. When rejected, the argument will be an
     *     array of error objects, each of which contains an "item" property with the id of the
     *     failed extension and an "error" property with the actual error.
     */
    function removeMarkedExtensions() {
        return Async.doInParallel_aggregateErrors(
            Object.keys(_idsToRemove),
            function (id) {
                return remove(id);
            }
        );
    }
    
    /**
     * Updates extensions previously marked for update.
     * @return {$.Promise} A promise that's resolved when all extensions are updated, or rejected
     *     if one or more extensions can't be updated. When rejected, the argument will be an
     *     array of error objects, each of which contains an "item" property with the id of the
     *     failed extension and an "error" property with the actual error.
     */
    function updateExtensions() {
        return Async.doInParallel_aggregateErrors(
            Object.keys(_idsToUpdate),
            function (id) {
                var installationResult = _idsToUpdate[id];
                return update(installationResult.name, installationResult.localPath);
            }
        );
    }
    
    // Listen to extension load and loadFailed events
    $(ExtensionLoader)
        .on("load", _handleExtensionLoad)
        .on("loadFailed", _handleExtensionLoad);

    // Public exports
    exports.downloadRegistry = downloadRegistry;
    exports.getCompatibilityInfo = getCompatibilityInfo;
    exports.getExtensionURL = getExtensionURL;
    exports.remove = remove;
    exports.update = update;
    exports.extensions = extensions;
    exports.cleanupUpdates = cleanupUpdates;
    exports.markForRemoval = markForRemoval;
    exports.isMarkedForRemoval = isMarkedForRemoval;
    exports.unmarkAllForRemoval = unmarkAllForRemoval;
    exports.hasExtensionsToRemove = hasExtensionsToRemove;
    exports.updateFromDownload = updateFromDownload;
    exports.removeUpdate = removeUpdate;
    exports.isMarkedForUpdate = isMarkedForUpdate;
    exports.hasExtensionsToUpdate = hasExtensionsToUpdate;
    exports.removeMarkedExtensions = removeMarkedExtensions;
    exports.updateExtensions = updateExtensions;
    
    exports.ENABLED = ENABLED;
    exports.START_FAILED = START_FAILED;
    
    exports.LOCATION_DEFAULT = LOCATION_DEFAULT;
    exports.LOCATION_DEV = LOCATION_DEV;
    exports.LOCATION_USER = LOCATION_USER;
    exports.LOCATION_UNKNOWN = LOCATION_UNKNOWN;

    // For unit testing only
    exports._reset = _reset;
    exports._setExtensions = _setExtensions;
});