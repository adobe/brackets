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

var unzip  = require("unzip"),
    semver = require("semver"),
    path   = require("path"),
    http   = require("http"),
    fs     = require("fs");

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
                errors: [["NOT_FOUND_ERR", path]]
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
                errors.push(["INVALID_ZIP_FILE", path]);
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
                                errors.push(["INVALID_PACKAGE_JSON", e.toString(), path]);
                                return;
                            }
                            
                            // confirm required fields in the metadata
                            if (!metadata.name) {
                                errors.push(["MISSING_PACKAGE_NAME", path]);
                            }
                            if (!metadata.version) {
                                errors.push(["MISSING_PACKAGE_VERSION", path]);
                            } else if (!semver.valid(metadata.version)) {
                                errors.push(["INVALID_VERSION_NUMBER", metadata.version, path]);
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
                    errors.push(["MISSING_MAIN", path]);
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
                callback(exc);
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
                    readStream.pause();
                    fs.mkdirs(installDirectory + "/" + installpath, function (err) {
                        if (err) {
                            callback(err);
                            readStream.close();
                            return;
                        }
                        readStream.resume();
                    });
                } else {
                    entry.pipe(fs.createWriteStream(installDirectory + "/" + installpath))
                        .on("error", function (err) {
                            callback(err);
                        });
                }
                
            })
            .on("close", function () {
                callback(null, validationResult);
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
    fs.remove(installDirectory, function () {
        _performInstall(packagePath, installDirectory, validationResult, callback);
    });
}


// TODO: use 3rd-party "request" module instead? supports https & redirects...
//  https://github.com/mikeal/request

var DOWNLOAD_LIMIT = 0x100000; // 1 MB

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
                    callback("NO_DISABLED_DIRECTORY", null);
                    return;
                }
                installDirectory = path.join(options.disabledDirectory, extensionName);
                validationResult.disabledReason = "API_NOT_COMPATIBLE";
                _removeAndInstall(packagePath, installDirectory, validationResult, callback);
                return;
            }
        }
        
        // If the extension is already there, at this point we will not overwrite
        // a running extension. Instead, we unzip into the disabled directory.
        fs.exists(installDirectory, function (installDirectoryExists) {
            if (installDirectoryExists) {
                validationResult.disabledReason  = "ALREADY_INSTALLED";
                if (!options || !options.disabledDirectory) {
                    callback("NO_DISABLED_DIRECTORY", null);
                    return;
                }
                installDirectory = path.join(options.disabledDirectory, extensionName);
                _removeAndInstall(packagePath, installDirectory, validationResult, callback);
            } else {
                // Regular installation with no conflicts.
                validationResult.disabledReason = null;
                _performInstall(packagePath, installDirectory, validationResult, callback);
            }
        });
    };
    
    _cmdValidate(packagePath, validateCallback);
}

/**
 * @param {function(error, result)} callback
 */
function _cmdDownloadFile(hostname, hostPath, localPath, callback) {
    if (fs.existsSync(localPath)) {
        callback("Error: file already exists", null);
        return;
    }
    
    // req will be a ClientRequest object
    var req = http.get({
        hostname: hostname,
        path: hostPath,
        encoding: null  // allow binary content
        
    }, function (response) { // response is an IncomingMessage object
        // Make sure we're actually getting the file contents and not an error page
        if (response.statusCode !== 200) {
            callback("Unexpected HTTP response " + response.statusCode, null);
            req.abort();
            return;
        }
        
        // Begin downloading to local file
        var outFile = fs.createWriteStream(localPath);
        var totalSize = 0;
        response.on("data", function (chunk) { // chunk is a Buffer object
            // Enforce max size limit
            totalSize += chunk.length;
            if (totalSize > DOWNLOAD_LIMIT) {
                outFile.end();
                fs.unlink(localPath);
                callback("Error: download size exceeded " + DOWNLOAD_LIMIT, null);
                req.abort();
            } else {
                // Stream the downloaded bits to disk
                outFile.write(chunk);
            }
        });
        response.on("end", function () {
            callback(null, "Download succeeded");
            outFile.end();
        });
    });
    req.on("error", function (err) {
        callback("Download request error: " + err, null);
    });
}

/**
 * Initialize the "extensions" domain.
 * The extensions domain handles downloading, unpacking/verifying, and installing extensions.
 */
function init(domainManager) {
    if (!domainManager.hasDomain("extensions")) {
        domainManager.registerDomain("extensions", {major: 0, minor: 1});
    }
    domainManager.registerCommand(
        "extensions",
        "validate",
        true,
        "Verifies that the contents of the given ZIP file are a valid Brackets extension package",
        _cmdValidate,
        [{
            name: "path",
            type: "string",
            description: "absolute filesystem path of the extension package"
        }],
        {
            errors: {
                type: "[[string name, optional format arguments], ...]",
                description: "error with the package, if any"
            },
            metadata: {
                type: "{name: string, version: string}",
                description: "all package.json metadata (null if there's no package.json)"
            }
        }
    );
    domainManager.registerCommand(
        "extensions",
        "install",
        _cmdInstall,
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
                type: "[[string name, optional format arguments], ...]",
                description: "error with the package, if any"
            },
            metadata: {
                type: "{name: string, version: string}",
                description: "all package.json metadata (null if there's no package.json)"
            },
            disabledReason: {
                type: "string",
                description: "reason this extension was installed disabled, none if it was enabled"
            }
        }
    );
    domainManager.registerCommand(
        "extensions",
        "downloadFile",
        _cmdDownloadFile,
        true,
        "Downloads the file at the given URL, saving it to the given local path",
        [{
            name: "hostname",
            type: "string",
            description: "Hostname of URL to download from. Must support http on port 80."
        }, {
            name: "hostPath",
            type: "string",
            description: "Path or URL to download from (starting with '/')"
        }, {
            name: "path",
            type: "string",
            description: "absolute filesystem path of the extension package"
        }],
        {
            error: {
                type: "string",
                description: "download error, if any; one of: FILE_TOO_LARGE, CANNOT_WRITE, CANNOT_DOWNLOAD"
            }
        }
    );
}

// used in unit tests
exports._cmdValidate = _cmdValidate;
exports._cmdInstall = _cmdInstall;

// used to load the domain
exports.init = init;
