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


/*jslint vars: true, plusplus: true, devel: true, node: true, nomen: true,
indent: 4, maxerr: 50 */

"use strict";

var semver   = require("semver"),
    path     = require("path"),
    request  = require("request"),
    fs       = require("fs-extra"),
    temp     = require("temp"),
    validate = require("./package-validator").validate;

// Automatically clean up temp files on exit
temp.track();

var Errors = {
    API_NOT_COMPATIBLE: "API_NOT_COMPATIBLE",
    MISSING_REQUIRED_OPTIONS: "MISSING_REQUIRED_OPTIONS",
    DOWNLOAD_ID_IN_USE: "DOWNLOAD_ID_IN_USE",
    BAD_HTTP_STATUS: "BAD_HTTP_STATUS",             // {0} is the HTTP status code
    NO_SERVER_RESPONSE: "NO_SERVER_RESPONSE",
    CANNOT_WRITE_TEMP: "CANNOT_WRITE_TEMP",
    CANCELED: "CANCELED"
};

var Statuses = {
    FAILED: "FAILED",
    INSTALLED: "INSTALLED",
    ALREADY_INSTALLED: "ALREADY_INSTALLED",
    SAME_VERSION: "SAME_VERSION",
    OLDER_VERSION: "OLDER_VERSION",
    NEEDS_UPDATE: "NEEDS_UPDATE",
    DISABLED: "DISABLED"
};

/**
 * Maps unique download ID to info about the pending download. No entry if download no longer pending.
 * outStream is only present if we've started receiving the body.
 * @type {Object.<string, {request:!http.ClientRequest, callback:!function(string, string), localPath:string, outStream:?fs.WriteStream}>}
 */
var pendingDownloads = {};

/**
 * Private function to remove the installation directory if the installation fails.
 * This does not call any callbacks. It's assumed that the callback has already been called
 * and this cleanup routine will do its best to complete in the background. If there's
 * a problem here, it is simply logged with console.error.
 *
 * @param {string} installDirectory Directory to remove
 */
function _removeFailedInstallation(installDirectory) {
    fs.remove(installDirectory, function (err) {
        if (err) {
            console.error("Error while removing directory after failed installation", installDirectory, err);
        }
    });
}

/**
 * Private function to unzip to the correct directory.
 *
 * @param {string} Absolute path to the package zip file
 * @param {string} Absolute path to the destination directory for unzipping
 * @param {Object} the return value with the useful information for the client
 * @param {Function} callback function that is called at the end of the unzipping
 */
function _performInstall(packagePath, installDirectory, validationResult, callback) {
    validationResult.installedTo = installDirectory;

    fs.mkdirs(installDirectory, function (err) {
        if (err) {
            callback(err);
            return;
        }
        var sourceDir = path.join(validationResult.extractDir, validationResult.commonPrefix);

        fs.copy(sourceDir, installDirectory, function (err) {
            if (err) {
                _removeFailedInstallation(installDirectory);
                callback(err, null);
            } else {
                // The status may have already been set previously (as in the
                // DISABLED case.
                if (!validationResult.installationStatus) {
                    validationResult.installationStatus = Statuses.INSTALLED;
                }
                callback(null, validationResult);
            }
        });
    });
}

/**
 * Private function to remove the target directory and then install.
 *
 * @param {string} Absolute path to the package zip file
 * @param {string} Absolute path to the destination directory for unzipping
 * @param {Object} the return value with the useful information for the client
 * @param {Function} callback function that is called at the end of the unzipping
 */
function _removeAndInstall(packagePath, installDirectory, validationResult, callback) {
    // If this extension was previously installed but disabled, we will overwrite the
    // previous installation in that directory.
    fs.remove(installDirectory, function (err) {
        if (err) {
            callback(err);
            return;
        }
        _performInstall(packagePath, installDirectory, validationResult, callback);
    });
}

function _checkExistingInstallation(validationResult, installDirectory, systemInstallDirectory, callback) {
    // If the extension being installed does not have a package.json, we can't
    // do any kind of version comparison, so we just signal to the UI that
    // it already appears to be installed.
    if (!validationResult.metadata) {
        validationResult.installationStatus = Statuses.ALREADY_INSTALLED;
        callback(null, validationResult);
        return;
    }

    fs.readJson(path.join(installDirectory, "package.json"), function (err, packageObj) {
        // if the package.json is unreadable, we assume that the new package is an update
        // that is the first to include a package.json.
        if (err) {
            validationResult.installationStatus = Statuses.NEEDS_UPDATE;
        } else {
            // Check to see if the version numbers signal an update.
            if (semver.lt(packageObj.version, validationResult.metadata.version)) {
                validationResult.installationStatus = Statuses.NEEDS_UPDATE;
            } else if (semver.gt(packageObj.version, validationResult.metadata.version)) {
                // Pass a message back to the UI that the new package appears to be an older version
                // than what's installed.
                validationResult.installationStatus = Statuses.OLDER_VERSION;
                validationResult.installedVersion = packageObj.version;
            } else {
                // Signal to the UI that it looks like the user is re-installing the
                // same version.
                validationResult.installationStatus = Statuses.SAME_VERSION;
            }
        }
        callback(null, validationResult);
    });
}

/**
 * A "legacy package" is an extension that was installed based on the GitHub name without
 * a package.json file. Checking for the presence of these legacy extensions will help
 * users upgrade if the extension developer puts a different name in package.json than
 * the name of the GitHub project.
 *
 * @param {string} legacyDirectory directory to check for old-style extension.
 */
function legacyPackageCheck(legacyDirectory) {
    return fs.existsSync(legacyDirectory) && !fs.existsSync(path.join(legacyDirectory, "package.json"));
}

/**
 * Implements the "install" command in the "extensions" domain.
 *
 * There is no need to call validate independently. Validation is the first
 * thing that is done here.
 *
 * After the extension is validated, it is installed in destinationDirectory
 * unless the extension is already present there. If it is already present,
 * a determination is made about whether the package being installed is
 * an update. If it does appear to be an update, then result.installationStatus
 * is set to NEEDS_UPDATE. If not, then it's set to ALREADY_INSTALLED.
 *
 * If the installation succeeds, then result.installationStatus is set to INSTALLED.
 *
 * The extension is unzipped into a directory in destinationDirectory with
 * the name of the extension (the name is derived either from package.json
 * or the name of the zip file).
 *
 * The destinationDirectory will be created if it does not exist.
 *
 * @param {string} Absolute path to the package zip file
 * @param {string} the destination directory
 * @param {{disabledDirectory: !string, apiVersion: !string, nameHint: ?string,
 *      systemExtensionDirectory: !string}} additional settings to control the installation
 * @param {function} callback (err, result)
 * @param {function} pCallback (msg) callback for notifications about operation progress
 * @param {boolean} _doUpdate  private argument to signal that an update should be performed
 */
function _cmdInstall(packagePath, destinationDirectory, options, callback, pCallback, _doUpdate) {
    if (!options || !options.disabledDirectory || !options.apiVersion || !options.systemExtensionDirectory) {
        callback(new Error(Errors.MISSING_REQUIRED_OPTIONS), null);
        return;
    }

    var validateCallback = function (err, validationResult) {
        validationResult.localPath = packagePath;

        // This is a wrapper for the callback that will delete the temporary
        // directory to which the package was unzipped.
        function deleteTempAndCallback(err) {
            if (validationResult.extractDir) {
                fs.remove(validationResult.extractDir);
                delete validationResult.extractDir;
            }
            callback(err, validationResult);
        }

        // If there was trouble at the validation stage, we stop right away.
        if (err || validationResult.errors.length > 0) {
            validationResult.installationStatus = Statuses.FAILED;
            deleteTempAndCallback(err, validationResult);
            return;
        }

        // Prefers the package.json name field, but will take the zip
        // file's name if that's all that's available.
        var extensionName, guessedName;
        if (options.nameHint) {
            guessedName = path.basename(options.nameHint, ".zip");
        } else {
            guessedName = path.basename(packagePath, ".zip");
        }
        if (validationResult.metadata) {
            extensionName = validationResult.metadata.name;
        } else {
            extensionName = guessedName;
        }

        validationResult.name = extensionName;
        var installDirectory = path.join(destinationDirectory, extensionName),
            legacyDirectory = path.join(destinationDirectory, guessedName),
            systemInstallDirectory = path.join(options.systemExtensionDirectory, extensionName);

        if (validationResult.metadata && validationResult.metadata.engines &&
                validationResult.metadata.engines.brackets) {
            var compatible = semver.satisfies(options.apiVersion,
                                              validationResult.metadata.engines.brackets);
            if (!compatible) {
                installDirectory = path.join(options.disabledDirectory, extensionName);
                validationResult.installationStatus = Statuses.DISABLED;
                validationResult.disabledReason = Errors.API_NOT_COMPATIBLE;
                _removeAndInstall(packagePath, installDirectory, validationResult, deleteTempAndCallback);
                return;
            }
        }

        // The "legacy" stuff should go away after all of the commonly used extensions
        // have been upgraded with package.json files.
        var hasLegacyPackage = validationResult.metadata && legacyPackageCheck(legacyDirectory);

        // If the extension is already there, we signal to the front end that it's already installed
        // unless the front end has signaled an intent to update.
        if (hasLegacyPackage || fs.existsSync(installDirectory) || fs.existsSync(systemInstallDirectory)) {
            if (_doUpdate === true) {
                if (hasLegacyPackage) {
                    // When there's a legacy installed extension, remove it first,
                    // then also remove any new-style directory the user may have.
                    // This helps clean up if the user is in a state where they have
                    // both legacy and new extensions installed.
                    fs.remove(legacyDirectory, function (err) {
                        if (err) {
                            deleteTempAndCallback(err, validationResult);
                            return;
                        }
                        _removeAndInstall(packagePath, installDirectory, validationResult, deleteTempAndCallback);
                    });
                } else {
                    _removeAndInstall(packagePath, installDirectory, validationResult, deleteTempAndCallback);
                }
            } else if (hasLegacyPackage) {
                validationResult.installationStatus = Statuses.NEEDS_UPDATE;
                validationResult.name = guessedName;
                deleteTempAndCallback(null, validationResult);
            } else {
                _checkExistingInstallation(validationResult, installDirectory, systemInstallDirectory, deleteTempAndCallback);
            }
        } else {
            // Regular installation with no conflicts.
            validationResult.disabledReason = null;
            _performInstall(packagePath, installDirectory, validationResult, deleteTempAndCallback);
        }
    };

    validate(packagePath, {}, validateCallback);
}

/**
 * Implements the "update" command in the "extensions" domain.
 *
 * Currently, this just wraps _cmdInstall, but will remove the existing directory
 * first.
 *
 * There is no need to call validate independently. Validation is the first
 * thing that is done here.
 *
 * After the extension is validated, it is installed in destinationDirectory
 * unless the extension is already present there. If it is already present,
 * a determination is made about whether the package being installed is
 * an update. If it does appear to be an update, then result.installationStatus
 * is set to NEEDS_UPDATE. If not, then it's set to ALREADY_INSTALLED.
 *
 * If the installation succeeds, then result.installationStatus is set to INSTALLED.
 *
 * The extension is unzipped into a directory in destinationDirectory with
 * the name of the extension (the name is derived either from package.json
 * or the name of the zip file).
 *
 * The destinationDirectory will be created if it does not exist.
 *
 * @param {string} Absolute path to the package zip file
 * @param {string} the destination directory
 * @param {{disabledDirectory: !string, apiVersion: !string, nameHint: ?string,
 *      systemExtensionDirectory: !string}} additional settings to control the installation
 * @param {function} callback (err, result)
 * @param {function} pCallback (msg) callback for notifications about operation progress
 */
function _cmdUpdate(packagePath, destinationDirectory, options, callback, pCallback) {
    _cmdInstall(packagePath, destinationDirectory, options, callback, pCallback, true);
}

/**
 * Wrap up after the given download has terminated (successfully or not). Closes connections, calls back the
 * client's callback, and IF there was an error, delete any partially-downloaded file.
 *
 * @param {string} downloadId Unique id originally passed to _cmdDownloadFile()
 * @param {?string} error If null, download was treated as successful
 */
function _endDownload(downloadId, error) {
    var downloadInfo = pendingDownloads[downloadId];
    delete pendingDownloads[downloadId];

    if (error) {
        // Abort the download if still pending
        // Note that this will trigger response's "end" event
        downloadInfo.request.abort();

        // Clean up any partially-downloaded file
        // (if no outStream, then we never got a response back yet and never created any file)
        if (downloadInfo.outStream) {
            downloadInfo.outStream.end(function () {
                fs.unlink(downloadInfo.localPath);
            });
        }

        downloadInfo.callback(error, null);

    } else {
        // Download completed successfully. Flush stream to disk and THEN signal completion
        downloadInfo.outStream.end(function () {
            downloadInfo.callback(null, downloadInfo.localPath);
        });
    }
}

/**
 * Implements "downloadFile" command, asynchronously.
 */
function _cmdDownloadFile(downloadId, url, proxy, callback, pCallback) {
    // Backwards compatibility check, added in 0.37
    if (typeof proxy === "function") {
        callback = proxy;
        proxy = undefined;
    }

    if (pendingDownloads[downloadId]) {
        callback(Errors.DOWNLOAD_ID_IN_USE, null);
        return;
    }

    var req = request.get({
        url: url,
        encoding: null,
        proxy: proxy
    },
        // Note: we could use the traditional "response"/"data"/"end" events too if we wanted to stream data
        // incrementally, limit download size, etc. - but the simple callback is good enough for our needs.
        function (error, response, body) {
            if (error) {
                // Usually means we never got a response - server is down, no DNS entry, etc.
                _endDownload(downloadId, Errors.NO_SERVER_RESPONSE);
                return;
            }
            if (response.statusCode !== 200) {
                _endDownload(downloadId, [Errors.BAD_HTTP_STATUS, response.statusCode]);
                return;
            }

            var stream = temp.createWriteStream("brackets");
            if (!stream) {
                _endDownload(downloadId, Errors.CANNOT_WRITE_TEMP);
                return;
            }
            pendingDownloads[downloadId].localPath = stream.path;
            pendingDownloads[downloadId].outStream = stream;

            stream.write(body);
            _endDownload(downloadId);
        });

    pendingDownloads[downloadId] = { request: req, callback: callback };
}

/**
 * Implements "abortDownload" command, synchronously.
 */
function _cmdAbortDownload(downloadId) {
    if (!pendingDownloads[downloadId]) {
        // This may mean the download already completed
        return false;
    } else {
        _endDownload(downloadId, Errors.CANCELED);
        return true;
    }
}

/**
 * Implements the remove extension command.
 */
function _cmdRemove(extensionDir, callback, pCallback) {
    fs.remove(extensionDir, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
}

/**
 * Initialize the "extensions" domain.
 * The extensions domain handles downloading, unpacking/verifying, and installing extensions.
 */
function init(domainManager) {
    if (!domainManager.hasDomain("extensionManager")) {
        domainManager.registerDomain("extensionManager", {major: 0, minor: 1});
    }
    domainManager.registerCommand(
        "extensionManager",
        "validate",
        validate,
        true,
        "Verifies that the contents of the given ZIP file are a valid Brackets extension package",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the extension package"
        }, {
            name: "options",
            type: "{requirePackageJSON: ?boolean}",
            description: "options to control the behavior of the validator"
        }],
        [{
            name: "errors",
            type: "string|Array.<string>",
            description: "download error, if any; first string is error code (one of Errors.*); subsequent strings are additional info"
        }, {
            name: "metadata",
            type: "{name: string, version: string}",
            description: "all package.json metadata (null if there's no package.json)"
        }]
    );
    domainManager.registerCommand(
        "extensionManager",
        "install",
        _cmdInstall,
        true,
        "Installs the given Brackets extension if it is valid (runs validation command automatically)",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the extension package"
        }, {
            name: "destinationDirectory",
            type: "string",
            description: "absolute filesystem path where this extension should be installed"
        }, {
            name: "options",
            type: "{disabledDirectory: !string, apiVersion: !string, nameHint: ?string, systemExtensionDirectory: !string}",
            description: "installation options: disabledDirectory should be set so that extensions can be installed disabled."
        }],
        [{
            name: "errors",
            type: "string|Array.<string>",
            description: "download error, if any; first string is error code (one of Errors.*); subsequent strings are additional info"
        }, {
            name: "metadata",
            type: "{name: string, version: string}",
            description: "all package.json metadata (null if there's no package.json)"
        }, {
            name: "disabledReason",
            type: "string",
            description: "reason this extension was installed disabled (one of Errors.*), none if it was enabled"
        }, {
            name: "installationStatus",
            type: "string",
            description: "Current status of the installation (an extension can be valid but not installed because it's an update"
        }, {
            name: "installedTo",
            type: "string",
            description: "absolute path where the extension was installed to"
        }, {
            name: "commonPrefix",
            type: "string",
            description: "top level directory in the package zip which contains all of the files"
        }]
    );
    domainManager.registerCommand(
        "extensionManager",
        "update",
        _cmdUpdate,
        true,
        "Updates the given Brackets extension (for which install was generally previously attemped). Brackets must be quit after this.",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the extension package"
        }, {
            name: "destinationDirectory",
            type: "string",
            description: "absolute filesystem path where this extension should be installed"
        }, {
            name: "options",
            type: "{disabledDirectory: !string, apiVersion: !string, nameHint: ?string, systemExtensionDirectory: !string}",
            description: "installation options: disabledDirectory should be set so that extensions can be installed disabled."
        }],
        [{
            name: "errors",
            type: "string|Array.<string>",
            description: "download error, if any; first string is error code (one of Errors.*); subsequent strings are additional info"
        }, {
            name: "metadata",
            type: "{name: string, version: string}",
            description: "all package.json metadata (null if there's no package.json)"
        }, {
            name: "disabledReason",
            type: "string",
            description: "reason this extension was installed disabled (one of Errors.*), none if it was enabled"
        }, {
            name: "installationStatus",
            type: "string",
            description: "Current status of the installation (an extension can be valid but not installed because it's an update"
        }, {
            name: "installedTo",
            type: "string",
            description: "absolute path where the extension was installed to"
        }, {
            name: "commonPrefix",
            type: "string",
            description: "top level directory in the package zip which contains all of the files"
        }]
    );
    domainManager.registerCommand(
        "extensionManager",
        "remove",
        _cmdRemove,
        true,
        "Removes the Brackets extension at the given path.",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the installed extension folder"
        }],
        {}
    );
    domainManager.registerCommand(
        "extensionManager",
        "downloadFile",
        _cmdDownloadFile,
        true,
        "Downloads the file at the given URL, saving it to a temp location. Callback receives path to the downloaded file.",
        [{
            name: "downloadId",
            type: "string",
            description: "Unique identifier for this download 'session'"
        }, {
            name: "url",
            type: "string",
            description: "URL to download from"
        }, {
            name: "proxy",
            type: "string",
            description: "optional proxy URL"
        }],
        {
            type: "string",
            description: "Local path to the downloaded file"
        }
    );
    domainManager.registerCommand(
        "extensionManager",
        "abortDownload",
        _cmdAbortDownload,
        false,
        "Aborts any pending download with the given id. Ignored if no download pending (may be already complete).",
        [{
            name: "downloadId",
            type: "string",
            description: "Unique identifier for this download 'session', previously pased to downloadFile"
        }],
        {
            type: "boolean",
            description: "True if the download was pending and able to be canceled; false otherwise"
        }
    );
}

// used in unit tests
exports._cmdValidate = validate;
exports._cmdInstall = _cmdInstall;
exports._cmdRemove = _cmdRemove;
exports._cmdUpdate = _cmdUpdate;

// used to load the domain
exports.init = init;
