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

var tar      = require("tar"),
    zlib     = require("zlib"),
    semver   = require("semver"),
    path     = require("path"),
    http     = require("http"),
    request  = require("request"),
    os       = require("os"),
    fs       = require("fs-extra"),
    validate = require("./package-validator").validate;


var Errors = {
    API_NOT_COMPATIBLE: "API_NOT_COMPATIBLE",
    MISSING_REQUIRED_OPTIONS: "MISSING_REQUIRED_OPTIONS",
    ALREADY_INSTALLED: "ALREADY_INSTALLED",
    DOWNLOAD_ID_IN_USE: "DOWNLOAD_ID_IN_USE",
    BAD_HTTP_STATUS: "BAD_HTTP_STATUS",             // {0} is the HTTP status code
    NO_SERVER_RESPONSE: "NO_SERVER_RESPONSE",
    CANNOT_WRITE_TEMP: "CANNOT_WRITE_TEMP",
    CANCELED: "CANCELED"
};

/**
 * Maps unique download ID to info about the pending download. No entry if download no longer pending.
 * outStream is only present if we've started receiving the body.
 * @type {Object.<string, {request:!http.ClientRequest, callback:!function(string, string), localPath:string, outStream:?fs.WriteStream}>}
 */
var pendingDownloads = {};


/**
 * Private function to uncompress to the correct directory.
 *
 * @param {string} Absolute path to the package file
 * @param {string} Absolute path to the destination directory for uncompressing
 * @param {Object} the return value with the useful information for the client
 * @param {Function} callback function that is called at the end of the uncompression
 */
function _performInstall(packagePath, installDirectory, validationResult, callback) {
    validationResult.installedTo = installDirectory;
    
    var callbackCalled = false;
    
    fs.mkdirs(installDirectory, function (err) {
        if (err) {
            callback(err);
            return;
        }
        
        var strip;
        if (validationResult.commonPrefix) {
            strip = validationResult.commonPrefix.split("/").length;
        } else {
            strip = 0;
        }
        
        var readStream = fs.createReadStream(packagePath);
        var gunzipStream = zlib.createGunzip();
        var untarStream = tar.Extract({
            path: installDirectory,
            strip: strip
        });
        
        function errorHandler(exc) {
            if (!callbackCalled) {
                callback(exc);
                callbackCalled = true;
                readStream.destroy();
            }
        }
        
        readStream.pipe(gunzipStream)
            .on("error", errorHandler)
            .pipe(untarStream)
            .on("error", errorHandler)
            .on("end", function () {
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
 * @param {string} Absolute path to the package file
 * @param {string} Absolute path to the destination directory for uncompression
 * @param {Object} the return value with the useful information for the client
 * @param {Function} callback function that is called at the end of the uncompression
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

var basenameRegexp = /(\.tgz|\.tar\.gz)$/;

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
 * The extension is uncompressed into a directory in destinationDirectory with
 * the name of the extension (the name is derived either from package.json
 * or the name of the package file).
 *
 * The destinationDirectory will be created if it does not exist.
 * 
 * @param {string} Absolute path to the package file
 * @param {string} the destination directory
 * @param {{disabledDirectory: !string, apiVersion: !string, nameHint: ?string, 
 *      systemExtensionDirectory: !string}} additional settings to control the installation
 * @param {function} callback (err, result)
 */
function _cmdInstall(packagePath, destinationDirectory, options, callback) {
    if (!options || !options.disabledDirectory || !options.apiVersion || !options.systemExtensionDirectory) {
        callback(new Error(Errors.MISSING_REQUIRED_OPTIONS), null);
        return;
    }
    
    var validateCallback = function (err, validationResult) {
        // If there was trouble at the validation stage, we stop right away.
        if (err || validationResult.errors.length > 0) {
            callback(err, validationResult);
            return;
        }
        
        // Prefers the package.json name field, but will take the package
        // file's name if that's all that's available.
        var extensionName;
        if (validationResult.metadata) {
            extensionName = validationResult.metadata.name;
        } else if (options.nameHint) {
            extensionName = path.basename(options.nameHint).replace(basenameRegexp, "");
        } else {
            extensionName = path.basename(packagePath).replace(basenameRegexp, "");
        }
        validationResult.name = extensionName;
        var installDirectory = path.join(destinationDirectory, extensionName),
            systemInstallDirectory = path.join(options.systemExtensionDirectory, extensionName);
        
        if (validationResult.metadata && validationResult.metadata.engines &&
                validationResult.metadata.engines.brackets) {
            var compatible = semver.satisfies(options.apiVersion,
                                              validationResult.metadata.engines.brackets);
            if (!compatible) {
                installDirectory = path.join(options.disabledDirectory, extensionName);
                validationResult.disabledReason = Errors.API_NOT_COMPATIBLE;
                _removeAndInstall(packagePath, installDirectory, validationResult, callback);
                return;
            }
        }
        
        // If the extension is already there, at this point we will not overwrite
        // a running extension. Instead, we uncompress into the disabled directory.
        if (fs.existsSync(installDirectory) || fs.existsSync(systemInstallDirectory)) {
            validationResult.disabledReason  = Errors.ALREADY_INSTALLED;
            installDirectory = path.join(options.disabledDirectory, extensionName);
            _removeAndInstall(packagePath, installDirectory, validationResult, callback);
        } else {
            // Regular installation with no conflicts.
            validationResult.disabledReason = null;
            _performInstall(packagePath, installDirectory, validationResult, callback);
        }
    };
    
    validate(packagePath, {}, validateCallback);
}


/**
 * Creates a uniquely-named file in the OS temp directory and opens it for writing.
 * @return {{localPath: string, outStream: WriteStream}}
 */
function _createTempFile() {
    var root = os.tmpDir();
    var pathPrefix = root + "/brackets.download";
    var suffix = 1;
    while (fs.existsSync(pathPrefix + suffix) && suffix < 100) {
        suffix++;
    }
    if (suffix === 100) {
        return null;
    }
    
    var localPath = pathPrefix + suffix;
    var outStream = fs.createWriteStream(localPath);
    return { outStream: outStream, localPath: localPath };
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
function _cmdDownloadFile(downloadId, url, callback) {
    if (pendingDownloads[downloadId]) {
        callback(Errors.DOWNLOAD_ID_IN_USE, null);
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
            
            var tempFileInfo = _createTempFile();
            if (!tempFileInfo) {
                _endDownload(downloadId, Errors.CANNOT_WRITE_TEMP);
                return;
            }
            pendingDownloads[downloadId].localPath = tempFileInfo.localPath;
            pendingDownloads[downloadId].outStream = tempFileInfo.outStream;
            
            tempFileInfo.outStream.write(body);
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
function _cmdRemove(extensionDir, callback) {
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
        "Verifies that the contents of the given package file are a valid Brackets extension package",
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
            name: "installedTo",
            type: "string",
            description: "absolute path where the extension was installed to"
        }, {
            name: "commonPrefix",
            type: "string",
            description: "top level directory in the package file which contains all of the files"
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

// used to load the domain
exports.init = init;
