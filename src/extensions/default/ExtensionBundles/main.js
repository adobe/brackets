/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var FileSystem       = brackets.getModule("filesystem/FileSystem"),
        Menus            = brackets.getModule("command/Menus"),
        CommandManager   = brackets.getModule("command/CommandManager"),
        FileUtils        = brackets.getModule("file/FileUtils"),
        _                = brackets.getModule("thirdparty/lodash"),
        ExtensionManager = brackets.getModule("extensibility/ExtensionManager"),
        Package          = brackets.getModule("extensibility/Package"),
        Async            = brackets.getModule("utils/Async"),
        AppInit          = brackets.getModule("utils/AppInit");

    // semver.browser is an AMD-compatible module
    var semver = require("node_modules/semver/semver.browser"),
        Promise = require("node_modules/bluebird/js/browser/bluebird");

    /**
     * extension bundles folder
     */
    var FOLDER_EXTENSION_BUNDLES = "extension-bundles";

    // Extension Bundle Support
    function _getExtensionBundles(pathToExtensionBundles) {
        return new Promise(function(resolve, reject) {
            FileSystem.getDirectoryForPath(pathToExtensionBundles).getContents(function (err, contents) {
                if (err) {
                    reject(err);
                }

                var bundles = contents.filter(function (dirEntry) {
                    return (dirEntry.isFile && FileUtils.getFileExtension(dirEntry.fullPath) === "json");
                });

                resolve(bundles);
            });
        });
    }

    function _validateAndFixDownloadURLForExtensionBundle(extensionBundle) {
        var extensionURLsToInstall = [],
            extensions = ExtensionManager.extensions;

        _.forEach(extensionBundle.extensions, function (bundleInfo, key) {
            if (! bundleInfo.url) {
                var version = bundleInfo.version;

                if (!version) {
                    version = extensions[bundleInfo.name].registryInfo.metadata.version;
                }

                bundleInfo.url = ExtensionManager.getExtensionURL(bundleInfo.name, version);
            }

            extensionURLsToInstall.push(bundleInfo.url);
        });

        return extensionURLsToInstall;
    }

    function _filterExtensionsToInstall(extensionBundle) {
        var extensionBundlesToInstall = _.filter(extensionBundle.extensions, function (extension) {
            var extensionInfo = ExtensionManager.extensions[extension.name],
                installedVersion = extensionInfo && extensionInfo.installInfo && extensionInfo.installInfo.metadata.version;

            if (installedVersion) {
                return extension.version && semver.lt(extension.version, installedVersion);
            }

            return true;
        });

        return {extensions: extensionBundlesToInstall};
    }

    function _validateExtensionBundle(bundle) {
        return new Promise(function(resolve, reject) {
            var result = true,
                reason,
                validatedExtensionBundle;

            if (! _.size(bundle)) {
                reject("This is an empty object");
            } else {
                if (!bundle.name) {
                    result = false;
                    reason = "name attribute missing";
                } else {
                    if (!bundle.extensions) {
                        result = false;
                        reason = "no extensions attribute defined";
                    } else {
                        if (! bundle.extensions.length) {
                            result = false;
                            reason = "no extensions defined";
                        }
                    }
                }

                if (result) {
                    for(var i = 0; i < bundle.extensions.length; i++) {
                        if (! bundle.extensions[i].name) {
                            result = false;
                            reason = "Extension #" + i + " doesn't have a name";
                            break;
                        }
                    }
                }

                if (result) {
                    resolve(validatedExtensionBundle);
                } else {
                    reject("bundle format is wrong: " + reason);
                }
            }
        });
    }

    function _extensionExistsInRegistry(extensionInfo) {
        return ExtensionManager.extensions[extensionInfo.name] !== undefined && ExtensionManager.getExtensionURL(extensionInfo.name, ExtensionManager.extensions[extensionInfo.name].registryInfo.metadata.version) === extensionInfo.url;
    }

    function _installExtensionBundles() {
        var extensionBundlesDir = FileUtils.getDirectoryPath(FileUtils.getNativeBracketsDirectoryPath()) + FOLDER_EXTENSION_BUNDLES + "/";

        ExtensionManager.downloadRegistry().done(function () {
            _getExtensionBundles(extensionBundlesDir).then(function (bundleFiles) {
                _.forEach(bundleFiles, function (bundleFile) {
                    FileUtils.readAsText(bundleFile).then(function (content) {
                        var bundleJSON = JSON.parse(content);
                        _validateExtensionBundle(bundleJSON).then(function () {
                            var extensionsToInstall = _filterExtensionsToInstall(bundleJSON);
                            var extensionURLsToInstall = _validateAndFixDownloadURLForExtensionBundle(extensionsToInstall);

                            var installPromise = Async.doSequentially(extensionURLsToInstall, function (extensionURL) {
                                return Package.installFromURL(extensionURL).promise;
                            });

                            installPromise.fail(function (err) {
                                console.error("Error installing extensions: " + err);
                            });
                        }).catch(function (err) {
                            console.error("Error validating extension bundle: " + err);
                        });
                    });
                });
            }).catch(function (err) {
                console.error("Extension Bundle installation failed: " + err);
            });
        });
    }

    function generateExtensionBundle() {
        var installedExtensions = _.filter(ExtensionManager.extensions, function (extension) {
            return extension.installInfo && extension.installInfo.locationType === 'user' && extension.installInfo.status === 'enabled';
        });

        var extensionBundlesDir = FileUtils.getDirectoryPath(FileUtils.getNativeBracketsDirectoryPath()) + FOLDER_EXTENSION_BUNDLES + "/",
            timestamp = new Date().toDateString();

        var ebDir = FileSystem.getDirectoryForPath(extensionBundlesDir);
        ebDir.create(function (err, data) {
            if (err) {
                console.error("Error generating Extension Bundle " + err);
            }
            else {
                var ebFile = FileSystem.getFileForPath(extensionBundlesDir + "/" + "extension-bundle-" + timestamp + ".json"),
                    ebContent = {"name": timestamp};

                ebContent.extensions = _.map(installedExtensions, function (extension) {
                    return {
                        name: extension.installInfo.metadata.name,
                        version: extension.installInfo.metadata.version
                    };
                });

                ebFile.write(JSON.stringify(ebContent), function (err, data) {
                    if (err) {
                        console.error("Error writing Extension Bundle " + err);
                    }
                });
            }
        });
    }

    function _setup() {
        // First, register a command - a UI-less object associating an id to a handler
        var MY_COMMAND_ID = 'help.generateExtensionBundle';   // package-style naming to avoid collisions
        CommandManager.register('Generate Extension Bundle', MY_COMMAND_ID, generateExtensionBundle);

        var menu = Menus.getMenu(Menus.AppMenuBar.HELP_MENU);
        menu.addMenuItem(MY_COMMAND_ID);

        AppInit.appReady(function () {
            _installExtensionBundles();
        });
    }

    _setup();

    // For unit testing only
    exports._getExtensionBundles          = _getExtensionBundles;
    exports._validateExtensionBundle      = _validateExtensionBundle;
    exports._extensionExistsInRegistry    = _extensionExistsInRegistry;
    exports._validateAndFixDownloadURLForExtensionBundle    = _validateAndFixDownloadURLForExtensionBundle;
});
