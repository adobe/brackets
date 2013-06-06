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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true,
indent: 4, maxerr: 50 */
/*global define, $, brackets, PathUtils */

/* Functions for working with extension packages */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit              = require("utils/AppInit"),
        FileUtils            = require("file/FileUtils"),
        StringUtils          = require("utils/StringUtils"),
        Strings              = require("strings"),
        ExtensionLoader      = require("utils/ExtensionLoader"),
        NodeConnection       = require("utils/NodeConnection");
    
    var Errors = {
        ERROR_LOADING: "ERROR_LOADING",
        MALFORMED_URL: "MALFORMED_URL",
        UNSUPPORTED_PROTOCOL: "UNSUPPORTED_PROTOCOL"
    };
    
    var InstallationStatuses = {
        FAILED: "FAILED",
        INSTALLED: "INSTALLED",
        ALREADY_INSTALLED: "ALREADY_INSTALLED",
        SAME_VERSION: "SAME_VERSION",
        OLDER_VERSION: "OLDER_VERSION",
        NEEDS_UPDATE: "NEEDS_UPDATE",
        DISABLED: "DISABLED"
    };

    
    /**
     * @const
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the installer in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 30000; // 30 seconds - TODO: share with StaticServer?
    
    /**
     * @private
     * @type{jQuery.Deferred.<NodeConnection>}
     * A deferred which is resolved with a NodeConnection or rejected if
     * we are unable to connect to Node.
     */
    var _nodeConnectionDeferred = $.Deferred();
    
    /**
     * @type {number} Used to generate unique download ids
     */
    var _uniqueId = 0;
    

    /**
     * TODO: can this go away now that we never call it directly?
     * 
     * Validates the package at the given path. The actual validation is
     * handled by the Node server.
     * 
     * The promise is resolved with an object:
     * { errors: Array.<{string}>, metadata: { name:string, version:string, ... } }
     * metadata is pulled straight from package.json and will be undefined
     * if there are errors or null if the extension did not include package.json.
     *
     * @param {string} Absolute path to the package zip file
     * @param {{requirePackageJSON: ?boolean}} validation options
     * @return {$.Promise} A promise that is resolved with information about the package
     */
    function validate(path, options) {
        var d = new $.Deferred();
        _nodeConnectionDeferred
            .done(function (nodeConnection) {
                if (nodeConnection.connected()) {
                    nodeConnection.domains.extensionManager.validate(path, options)
                        .done(function (result) {
                            d.resolve({
                                errors: result.errors,
                                metadata: result.metadata
                            });
                        })
                        .fail(function (error) {
                            d.reject(error);
                        });
                } else {
                    d.reject();
                }
            })
            .fail(function (error) {
                d.reject(error);
            });
        return d.promise();
    }
    
    /**
     * Validates and installs the package at the given path. Validation and
     * installation is handled by the Node process.
     *
     * The extension will be installed into the user's extensions directory.
     * If the user already has the extension installed, it will instead go
     * into their disabled extensions directory.
     * 
     * The promise is resolved with an object:
     * { errors: Array.<{string}>, metadata: { name:string, version:string, ... },
     * disabledReason:string, installedTo:string, commonPrefix:string }
     * metadata is pulled straight from package.json and is likely to be undefined
     * if there are errors. It is null if there was no package.json.
     * 
     * disabledReason is either null or the reason the extension was installed disabled.
     *
     * @param {string} path Absolute path to the package zip file
     * @param {?string} nameHint Hint for the extension folder's name (used in favor of
     *          path's filename if present, and if no package metadata present).
     * @param {?boolean} _doUpdate private argument used to signal an update
     * @return {$.Promise} A promise that is resolved with information about the package
     *          (which may include errors, in which case the extension was disabled), or
     *          rejected with an error object.
     */
    function install(path, nameHint, _doUpdate) {
        var d = new $.Deferred();
        _nodeConnectionDeferred
            .done(function (nodeConnection) {
                if (nodeConnection.connected()) {
                    var destinationDirectory    = ExtensionLoader.getUserExtensionPath(),
                        disabledDirectory       = destinationDirectory.replace(/\/user$/, "/disabled"),
                        systemDirectory         = FileUtils.getNativeBracketsDirectoryPath() + "/extensions/default/";
                    
                    var operation = _doUpdate ? "update" : "install";
                    nodeConnection.domains.extensionManager[operation](path, destinationDirectory, {
                        disabledDirectory: disabledDirectory,
                        systemExtensionDirectory: systemDirectory,
                        apiVersion: brackets.metadata.apiVersion,
                        nameHint: nameHint
                    })
                        .done(function (result) {
                            // If there were errors or the extension is disabled, we don't
                            // try to load it so we're ready to return
                            if (result.installationStatus !== InstallationStatuses.INSTALLED || _doUpdate) {
                                d.resolve(result);
                            } else {
                                // This was a new extension and everything looked fine.
                                // We load it into Brackets right away.
                                ExtensionLoader.loadExtension(result.name, {
                                    // On Windows, it looks like Node converts Unix-y paths to backslashy paths.
                                    // We need to convert them back.
                                    baseUrl: FileUtils.convertWindowsPathToUnixPath(result.installedTo)
                                }, "main").then(function () {
                                    d.resolve(result);
                                }, function () {
                                    d.reject(Errors.ERROR_LOADING);
                                });
                            }
                        })
                        .fail(function (error) {
                            d.reject(error);
                        });
                } else {
                    d.reject();
                }
            })
            .fail(function (error) {
                d.reject(error);
            });
        return d.promise();
    }
    
    
    
    /**
     * Special case handling to make the common case of downloading from GitHub easier; modifies 'urlInfo' as
     * needed. Converts a bare GitHub repo URL to the corresponding master ZIP URL; or if given a direct
     * master ZIP URL already, sets a nicer download filename (both cases use the repo name).
     * 
     * @param {{url:string, parsed:Array.<string>, filenameHint:string}} urlInfo
     */
    function githubURLFilter(urlInfo) {
        if (urlInfo.parsed.hostname === "github.com" || urlInfo.parsed.hostname === "www.github.com") {
            // Is it a URL to the root of a repo? (/user/repo)
            var match = /^\/[^\/?]+\/([^\/?]+)(\/?)$/.exec(urlInfo.parsed.pathname);
            if (match) {
                if (!match[2]) {
                    urlInfo.url += "/";
                }
                urlInfo.url += "archive/master.zip";
                urlInfo.filenameHint = match[1] + ".zip";
                
            } else {
                // Is it a URL directly to the repo's 'master.zip'? (/user/repo/archive/master.zip)
                match = /^\/[^\/?]+\/([^\/?]+)\/archive\/master.zip$/.exec(urlInfo.parsed.pathname);
                if (match) {
                    urlInfo.filenameHint = match[1] + ".zip";
                }
            }
        }
    }
    
    /**
     * Downloads from the given URL to a temporary location. On success, resolves with the path of the
     * downloaded file (typically in a temp folder) and a hint for the real filename. On failure, rejects
     * with an error object.
     * 
     * @param {string} url URL of the file to be downloaded
     * @param {number} downloadId Unique number to identify this request
     * @return {$.Promise}
     */
    function download(url, downloadId) {
        var d = new $.Deferred();
        _nodeConnectionDeferred
            .done(function (connection) {
                if (connection.connected()) {
                    // Validate URL
                    // TODO: PathUtils fails to parse URLs that are missing the protocol part (e.g. starts immediately with "www...")
                    var parsed = PathUtils.parseUrl(url);
                    if (!parsed.hostname) {  // means PathUtils failed to parse at all
                        d.reject(Errors.MALFORMED_URL);
                        return d.promise();
                    }
                    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                        d.reject(Errors.UNSUPPORTED_PROTOCOL);
                        return d.promise();
                    }
                    
                    var urlInfo = { url: url, parsed: parsed, filenameHint: parsed.filename };
                    githubURLFilter(urlInfo);
                    
                    // Decide download destination
                    var filename = urlInfo.filenameHint;
                    filename = filename.replace(/[^a-zA-Z0-9_\- \(\)\.]/g, "_"); // make sure it's a valid filename
                    if (!filename) {  // in case of URL ending in "/"
                        filename = "extension.zip";
                    }
                    
                    // Download the bits (using Node since brackets-shell doesn't support binary file IO)
                    var r = connection.domains.extensionManager.downloadFile(downloadId, urlInfo.url);
                    r.done(function (result) {
                        d.resolve({ localPath: result, filenameHint: urlInfo.filenameHint });
                    }).fail(function (err) {
                        d.reject(err);
                    });
                    
                } else {
                    d.reject();
                }
            })
            .fail(function (error) {
                d.reject(error);
            });
        return d.promise();
    }
    
    /**
     * Attempts to synchronously cancel the given pending download. This may not be possible, e.g.
     * if the download has already finished.
     * 
     * @param {number} downloadId Identifier previously passed to download()
     */
    function cancelDownload(downloadId) {
        // TODO: if we're still waiting on the NodeConnection, how do we cancel?
        console.assert(_nodeConnectionDeferred.state() === "resolved");
        _nodeConnectionDeferred.done(function (connection) {
            connection.domains.extensionManager.abortDownload(downloadId);
        });
    }
    
    
    /**
     * On success, resolves with an extension metadata object; at that point, the extension has already
     * started running in Brackets. On failure (including validation errors), rejects with an error object.
     * 
     * An error object consists of either a string error code OR an array where the first entry is the error
     * code and the remaining entries are further info. The error code string is one of either
     * ExtensionsDomain.Errors or Package.Errors. Use formatError() to convert an error object to a friendly,
     * localized error message.
     * 
     * The returned cancel() function will *attempt* to cancel installation, but it is not guaranteed to
     * succeed. If cancel() succeeds, the Promise is rejected with a CANCELED error code. If we're unable
     * to cancel, the Promise is resolved or rejected normally, as if cancel() had never been called.
     * 
     * @return {{promise: $.Promise, cancel: function():boolean}}
     */
    function installFromURL(url) {
        var STATE_DOWNLOADING = 1,
            STATE_INSTALLING = 2,
            STATE_SUCCEEDED = 3,
            STATE_FAILED = 4;
        
        var d = new $.Deferred();
        var state = STATE_DOWNLOADING;
        
        var downloadId = (_uniqueId++);
        download(url, downloadId)
            .done(function (downloadResult) {
                state = STATE_INSTALLING;
                
                install(downloadResult.localPath, downloadResult.filenameHint)
                    .done(function (result) {
                        var installationStatus = result.installationStatus;
                        if (installationStatus === InstallationStatuses.ALREADY_INSTALLED ||
                                installationStatus === InstallationStatuses.NEEDS_UPDATE ||
                                installationStatus === InstallationStatuses.SAME_VERSION ||
                                installationStatus === InstallationStatuses.OLDER_VERSION) {
                            // We don't delete the file in this case, because it will be needed
                            // if the user is going to install the update.
                            state = STATE_SUCCEEDED;
                            result.localPath = downloadResult.localPath;
                            d.resolve(result);
                        } else {
                            brackets.fs.unlink(downloadResult.localPath, function (err) {
                                // ignore errors
                            });
                            if (result.errors && result.errors.length > 0) {
                                // Validation errors - for now, only return the first one
                                state = STATE_FAILED;
                                d.reject(result.errors[0]);
                            } else if (result.disabledReason) {
                                // Extension valid but left disabled (wrong API version, extension name collision, etc.)
                                state = STATE_FAILED;
                                d.reject(result.disabledReason);
                            } else {
                                // Success! Extension is now running in Brackets
                                state = STATE_SUCCEEDED;
                                d.resolve(result);
                            }
                        }
                    })
                    .fail(function (err) {
                        // File IO errors, internal error in install()/validate(), or extension startup crashed
                        state = STATE_FAILED;
                        brackets.fs.unlink(downloadResult.localPath, function (err) {
                            // ignore errors
                        });
                        d.reject(err);  // TODO: needs to be err.message ?
                    });
            })
            .fail(function (err) {
                // Download error (the Node-side download code cleans up any partial ZIP file)
                state = STATE_FAILED;
                d.reject(err);
            });
        
        return {
            promise: d.promise(),
            cancel: function () {
                if (state === STATE_DOWNLOADING) {
                    // This will trigger download()'s fail() handler with CANCELED as the err code
                    cancelDownload(downloadId);
                }
                // Else it's too late to cancel; we'll continue on through the done() chain and emit
                // a success result (calling done() handlers) if all else goes well.
            }
        };
    }
    
    /**
     * Converts an error object as returned by install() or installFromURL() into a flattened, localized string.
     * @param {string|Array.<string>} error
     * @return {string}
     */
    function formatError(error) {
        function localize(key) {
            return Strings[key] || Strings.UNKNOWN_ERROR;
        }
        
        if (Array.isArray(error)) {
            error[0] = localize(error[0]);
            return StringUtils.format.apply(window, error);
        } else {
            return localize(error);
        }
    }
    
    /**
     * Removes the extension at the given path.
     *
     * @param {string} path The absolute path to the extension to remove.
     * @return {$.Promise} A promise that's resolved when the extension is removed, or
     *     rejected if there was an error.
     */
    function remove(path) {
        var d = new $.Deferred();
        _nodeConnectionDeferred
            .done(function (connection) {
                if (connection.connected()) {
                    connection.domains.extensionManager.remove(path)
                        .then(d.resolve, d.reject);
                }
            })
            .fail(function (err) {
                d.reject(err);
            });
        return d.promise();
    }
    
    /**
     * Install an extension update located at path.
     * This assumes that the installation was previously attempted
     * and an installationStatus of "ALREADY_INSTALLED", "NEEDS_UPDATE", "SAME_VERSION",
     * or "OLDER_VERSION" was the result.
     *
     * This workflow ensures that there should not generally be validation errors
     * because the first pass at installation the extension looked at the metadata
     * and installed packages.
     *
     * @param {string} path to package file
     * @param {?string} nameHint Hint for the extension folder's name (used in favor of
     *          path's filename if present, and if no package metadata present).
     * @return {$.Promise} A promise that is resolved when the extension is successfully
     *      installed or rejected if there is a problem.
     */
    function installUpdate(path, nameHint) {
        var d = new $.Deferred();
        install(path, nameHint, true)
            .done(function (result) {
                if (result.installationStatus !== InstallationStatuses.INSTALLED) {
                    d.reject(result.errors);
                } else {
                    d.resolve(result);
                }
            })
            .fail(function (error) {
                d.reject(error);
            })
            .always(function () {
                brackets.fs.unlink(path, function () { });
            });
        return d.promise();
    }
        
    /**
     * Allows access to the deferred that manages the node connection. This
     * is *only* for unit tests. Messing with this not in testing will
     * potentially break everything.
     *
     * @private
     * @return {jQuery.Deferred} The deferred that manages the node connection
     */
    function _getNodeConnectionDeferred() {
        return _nodeConnectionDeferred;
    }
    
    // Initializes node connection
    // TODO: duplicates code from StaticServer
    // TODO: can this be done lazily?
    AppInit.appReady(function () {
        // Start up the node connection, which is held in the
        // _nodeConnectionDeferred module variable. (Use 
        // _nodeConnectionDeferred.done() to access it.
        var connectionTimeout = setTimeout(function () {
            console.error("[Extensions] Timed out while trying to connect to node");
            _nodeConnectionDeferred.reject();
        }, NODE_CONNECTION_TIMEOUT);
        
        var _nodeConnection = new NodeConnection();
        _nodeConnection.connect(true).then(function () {
            var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/node/ExtensionManagerDomain";
            
            _nodeConnection.loadDomains(domainPath, true)
                .then(
                    function () {
                        clearTimeout(connectionTimeout);
                        _nodeConnectionDeferred.resolve(_nodeConnection);
                    },
                    function () { // Failed to connect
                        console.error("[Extensions] Failed to connect to node", arguments);
                        clearTimeout(connectionTimeout);
                        _nodeConnectionDeferred.reject();
                    }
                );
        });
    });

    // For unit tests only
    exports._getNodeConnectionDeferred = _getNodeConnectionDeferred;

    exports.installFromURL = installFromURL;
    exports.validate = validate;
    exports.install = install;
    exports.remove = remove;
    exports.installUpdate = installUpdate;
    exports.formatError = formatError;
    exports.InstallationStatuses = InstallationStatuses;
});
