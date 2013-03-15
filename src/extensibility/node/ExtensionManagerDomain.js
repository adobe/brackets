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


/*jslint vars: true, plusplus: true, devel: true, node: true, nomen: true,
indent: 4, maxerr: 50 */

"use strict";

var unzip   = require("unzip"),
    semver  = require("semver"),
    path    = require("path"),
    http    = require("http"),
    request = require("request"),
    fs      = require("fs-extra");


var Errors = {
    NOT_FOUND_ERR: "NOT_FOUND_ERR",
    INVALID_ZIP_FILE: "INVALID_ZIP_FILE",           // {0} is path to ZIP file
    INVALID_PACKAGE_JSON: "INVALID_PACKAGE_JSON",   // {0} is JSON parse error, {1} is path to ZIP file
    MISSING_PACKAGE_NAME: "MISSING_PACKAGE_NAME",   // {0} is path to ZIP file
    BAD_PACKAGE_NAME: "BAD_PACKAGE_NAME",           // {0} is the name
    MISSING_PACKAGE_VERSION: "MISSING_PACKAGE_VERSION",  // {0} is path to ZIP file
    INVALID_VERSION_NUMBER: "INVALID_VERSION_NUMBER",    // {0} is version string in JSON, {1} is path to ZIP file
    API_NOT_COMPATIBLE: "API_NOT_COMPATIBLE",
    MISSING_MAIN: "MISSING_MAIN",                   // {0} is path to ZIP file
    NO_DISABLED_DIRECTORY: "NO_DISABLED_DIRECTORY",
    ALREADY_INSTALLED: "ALREADY_INSTALLED",
    DOWNLOAD_ID_IN_USE: "DOWNLOAD_ID_IN_USE",
    DOWNLOAD_TARGET_EXISTS: "DOWNLOAD_TARGET_EXISTS",   // {0} is the download target file
    BAD_HTTP_STATUS: "BAD_HTTP_STATUS",             // {0} is the HTTP status code
    NO_SERVER_RESPONSE: "NO_SERVER_RESPONSE",
    CANCELED: "CANCELED"
};

/**
 * Maps unique download ID to info about the pending download. No entry if download no longer pending.
 * outStream is only present if we've started receiving the body.
 * @type {Object.<string, {request:!http.ClientRequest, callback:!function(string, string), localPath:string, outStream:?fs.WriteStream}>}
 */
var pendingDownloads = {};

/**
 * Returns true if the name presented is acceptable as a package name. This enforces the
 * requirement as presented in the CommonJS spec: http://wiki.commonjs.org/wiki/Packages/1.0
 *
 * @param {string} Name to test
 * @return {boolean} true if the name is valid
 */
function validateName(name) {
    // "This must be a unique, lowercase alpha-numeric name without spaces. It may include "." or "_" or "-" characters."
    if (/^[a-z._\-]+$/.exec(name)) {
        return true;
    }
    return false;
}

/**
 * Implements the "validate" command in the "extensions" domain.
 * Validates the zipped package at path.
 *
 * The "err" parameter of the callback is only set if there was an
 * unexpected error. Otherwise, errors are reported in the result.
 *
 * The result object has an "errors" property. It is an array of
 * arrays of strings. Each array in the array is a set of parameters
 * that can be passed to StringUtils.format for internationalization.
 * The array will be empty if there are no errors.
 *
 * The result will have a "metadata" property if the metadata was
 * read successfully from package.json in the zip file.
 *
 * @param {string} Absolute path to the package zip file
 * @param {function} callback (err, result)
 */
function _cmdValidate(path, callback) {
    fs.exists(path, function (doesExist) {
        if (!doesExist) {
            callback(null, {
                errors: [[Errors.NOT_FOUND_ERR, path]]
            });
            return;
        }
        var callbackCalled = false;
        var metadata;
        var foundMain = false;
        var errors = [];
        var commonPrefix = null;
        
        fs.createReadStream(path)
            .pipe(unzip.Parse())
            .on("error", function (exception) {
                // General error to report for problems reading the file
                errors.push([Errors.INVALID_ZIP_FILE, path]);
                callback(null, {
                    errors: errors
                });
                callbackCalled = true;
            })
            .on("entry", function (entry) {
                // look for the metadata
                var fileName = entry.path;
                
                var slash = fileName.indexOf("/");
                if (slash > -1) {
                    var prefix = fileName.substring(0, slash);
                    if (commonPrefix === null) {
                        commonPrefix = prefix;
                    } else if (prefix !== commonPrefix) {
                        commonPrefix = "";
                    }
                    if (commonPrefix) {
                        fileName = fileName.substring(commonPrefix.length + 1);
                    }
                } else {
                    commonPrefix = "";
                }
                
                if (fileName === "package.json") {
                    // This handles an edge case where we found a package.json in a
                    // nested directory that we thought was a commonPrefix but
                    // actually wasn't. We reset as if we never read that first
                    // package.json
                    if (metadata) {
                        metadata = undefined;
                        errors = [];
                    }
                    
                    var packageJSON = "";
                    entry
                        .on("data", function (data) {
                            // We're assuming utf8 encoding here, which is pretty safe
                            // Note that I found that .setEncoding on the stream
                            // would fail, so I convert the buffer to a string here.
                            packageJSON += data.toString("utf8");
                        })
                        .on("error", function (exception) {
                            // general exception handler. It is unknown what kinds of
                            // errors we can get here.
                            callback(exception, null);
                            callbackCalled = true;
                        })
                        .on("end", function () {
                            // attempt to parse the metadata
                            try {
                                metadata = JSON.parse(packageJSON);
                            } catch (e) {
                                errors.push([Errors.INVALID_PACKAGE_JSON, e.toString(), path]);
                                return;
                            }
                            
                            // confirm required fields in the metadata
                            if (!metadata.name) {
                                errors.push([Errors.MISSING_PACKAGE_NAME, path]);
                            } else if (!validateName(metadata.name)) {
                                errors.push([Errors.BAD_PACKAGE_NAME, metadata.name]);
                            }
                            if (!metadata.version) {
                                errors.push([Errors.MISSING_PACKAGE_VERSION, path]);
                            } else if (!semver.valid(metadata.version)) {
                                errors.push([Errors.INVALID_VERSION_NUMBER, metadata.version, path]);
                            }
                        });
                } else if (fileName === "main.js") {
                    foundMain = true;
                }
            })
            .on("end", function () {
                // Reached the end of the zipfile
                // Report results
                
                // generally, if we hit an exception, we've already called the callback
                if (callbackCalled) {
                    return;
                }
                
                if (!foundMain) {
                    errors.push([Errors.MISSING_MAIN, path]);
                }
                
                // No errors and no metadata means that we never found the metadata
                if (errors.length === 0 && !metadata) {
                    metadata = null;
                }
                
                callback(null, {
                    errors: errors,
                    metadata: metadata,
                    commonPrefix: commonPrefix
                });
            });
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
    
    var callbackCalled = false;
    
    fs.mkdirs(installDirectory, function (err) {
        if (err) {
            callback(err);
            return;
        }
        var readStream = fs.createReadStream(packagePath);
        var extractStream = unzip.Parse();
        var prefixlength = validationResult.commonPrefix ? validationResult.commonPrefix.length : 0;
        
        readStream.pipe(extractStream)
            .on("error", function (exc) {
                if (!callbackCalled) {
                    callback(exc);
                    callbackCalled = true;
                }
            })
            .on("entry", function (entry) {
                var installpath = entry.path;
                if (prefixlength) {
                    installpath = installpath.substring(prefixlength + 1);
                }
                
                if (entry.type === "Directory") {
                    if (installpath === "") {
                        return;
                    }
                    extractStream.pause();
                    fs.mkdirs(installDirectory + "/" + installpath, function (err) {
                        if (err) {
                            if (!callbackCalled) {
                                callback(err);
                                callbackCalled = true;
                            }
                            extractStream.close();
                            return;
                        }
                        extractStream.resume();
                    });
                } else {
                    entry.pipe(fs.createWriteStream(installDirectory + "/" + installpath))
                        .on("error", function (err) {
                            if (!callbackCalled) {
                                callback(err);
                                callbackCalled = true;
                            }
                        });
                }
                
            })
            .on("close", function () {
                if (!callbackCalled) {
                    callback(null, validationResult);
                    callbackCalled = true;
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

/**
 * Implements the "install" command in the "extensions" domain.
 *
 * There is no need to call validate independently. Validation is the first
 * thing that is done here.
 *
 * After the extension is validated, it is installed in destinationDirectory
 * unless the extension is already present there. If it is, you must
 * specify a disabledDirectory in options and the extension will be installed
 * there. (options is an object that currently only has disabledDirectory.
 * As we expand out the extension manager, there will likely be additional
 * options added.)
 *
 * The extension is unzipped into a directory in destinationDirectory with
 * the name of the extension (the name is derived either from package.json
 * or the name of the zip file).
 *
 * The destinationDirectory will be created if it does not exist.
 * 
 * @param {string} Absolute path to the package zip file
 * @param {string} the destination directory
 * @param {{disabledDirectory:string}} additional settings to control the installation
 * @param {function} callback (err, result)
 */
function _cmdInstall(packagePath, destinationDirectory, options, callback) {
    
    var validateCallback = function (err, validationResult) {
        // If there was trouble at the validation stage, we stop right away.
        if (err || validationResult.errors.length > 0) {
            callback(err, validationResult);
            return;
        }
        
        // Prefers the package.json name field, but will take the zip
        // file's name if that's all that's available.
        var extensionName;
        if (validationResult.metadata) {
            extensionName = validationResult.metadata.name;
        } else {
            extensionName = path.basename(packagePath, ".zip");
        }
        validationResult.name = extensionName;
        var installDirectory = path.join(destinationDirectory, extensionName);
        
        if (options && options.apiVersion && validationResult.metadata && validationResult.metadata.engines &&
                validationResult.metadata.engines.brackets) {
            var compatible = semver.satisfies(options.apiVersion,
                                              validationResult.metadata.engines.brackets);
            if (!compatible) {
                if (!options || !options.disabledDirectory) {
                    callback(new Error(Errors.NO_DISABLED_DIRECTORY), null);
                    return;
                }
                installDirectory = path.join(options.disabledDirectory, extensionName);
                validationResult.disabledReason = Errors.API_NOT_COMPATIBLE;
                _removeAndInstall(packagePath, installDirectory, validationResult, callback);
                return;
            }
        }
        
        // If the extension is already there, at this point we will not overwrite
        // a running extension. Instead, we unzip into the disabled directory.
        if (fs.existsSync(installDirectory)) {
            validationResult.disabledReason  = Errors.ALREADY_INSTALLED;
            if (!options || !options.disabledDirectory) {
                callback(new Error(Errors.NO_DISABLED_DIRECTORY), null);
                return;
            }
            installDirectory = path.join(options.disabledDirectory, extensionName);
            _removeAndInstall(packagePath, installDirectory, validationResult, callback);
        } else {
            // Regular installation with no conflicts.
            validationResult.disabledReason = null;
            _performInstall(packagePath, installDirectory, validationResult, callback);
        }
    };
    
    _cmdValidate(packagePath, validateCallback);
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
            downloadInfo.callback(null, null);
        });
    }
}

/**
 * Implements "downloadFile" command, asynchronously.
 */
function _cmdDownloadFile(downloadId, url, localPath, callback) {
    if (pendingDownloads[downloadId]) {
        callback(Errors.DOWNLOAD_ID_IN_USE, null);
        return;
    }
    
    if (fs.existsSync(localPath)) {
        callback([Errors.DOWNLOAD_TARGET_EXISTS, localPath], null);
        return;
    }
    
    var req = request.get({
        url: url,
        encoding: null
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
            
            var outStream = fs.createWriteStream(localPath);
            pendingDownloads[downloadId].outStream = outStream;
            outStream.write(body);
            _endDownload(downloadId);
        });
    
    pendingDownloads[downloadId] = { request: req, callback: callback, localPath: localPath };
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
        _cmdValidate,
        true,
        "Verifies that the contents of the given ZIP file are a valid Brackets extension package",
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the extension package"
        }],
        {
            errors: {
                type: "string|Array.<string>",
                description: "download error, if any; first string is error code (one of Errors.*); subsequent strings are additional info"
            },
            metadata: {
                type: "{name: string, version: string}",
                description: "all package.json metadata (null if there's no package.json)"
            }
        }
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
            type: "{string disabledDirectory}",
            description: "installation options. disabledDirectory should be set so that extensions can be installed disabled."
        }],
        {
            errors: {
                type: "string|Array.<string>",
                description: "download error, if any; first string is error code (one of Errors.*); subsequent strings are additional info"
            },
            metadata: {
                type: "{name: string, version: string}",
                description: "all package.json metadata (null if there's no package.json)"
            },
            disabledReason: {
                type: "string",
                description: "reason this extension was installed disabled (one of Errors.*), none if it was enabled"
            },
            installedTo: {
                type: "string",
                description: "absolute path where the extension was installed to"
            },
            commonPrefix: {
                type: "string",
                description: "top level directory in the package zip which contains all of the files"
            }
        }
    );
    domainManager.registerCommand(
        "extensionManager",
        "downloadFile",
        _cmdDownloadFile,
        true,
        "Downloads the file at the given URL, saving it to the given local path",
        [{
            name: "downloadId",
            type: "string",
            description: "Unique identifier for this download 'session'"
        }, {
            name: "url",
            type: "string",
            description: "URL to download from"
        }, {
            name: "localPath",
            type: "string",
            description: "absolute filesystem path of the extension package"
        }],
        {
            error: {
                type: "string|Array.<string>",
                description: "download error, if any; first string is error code (one of Errors.*); subsequent strings are additional info"
            }
        }
    );
    domainManager.registerCommand(
        "extensionManager",
        "abortDownload",
        _cmdAbortDownload,
        false,
        "Aborts any pending download with the given id. Error if no download pending (may be already complete).",
        [{
            name: "downloadId",
            type: "string",
            description: "Unique identifier for this download 'session', previously pased to downloadFile"
        }],
        {
            result: {
                type: "boolean",
                description: "True if the download was pending and able to be canceled; false otherwise"
            }
        }
    );
}

// used in unit tests
exports._cmdValidate = _cmdValidate;
exports._cmdInstall = _cmdInstall;

// used to load the domain
exports.init = init;
