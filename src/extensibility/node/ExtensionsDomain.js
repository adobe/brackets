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
    fs     = require("fs-extra");

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
                    callback(null, {
                        errors: [],
                        metadata: null
                    });
                } else {
                    callback(null, {
                        errors: errors,
                        metadata: metadata
                    });
                }
            });
    });
}

function _performInstall(packagePath, installDirectory, validationResult, callback) {
    validationResult.installedTo = installDirectory;
    
    fs.mkdirs(installDirectory, function (err) {
        if (err) {
            callback(err);
            return;
        }
        var readStream = fs.createReadStream(packagePath);
        var extractStream = unzip.Extract({ path: installDirectory });
        readStream.pipe(extractStream)
            .on("error", function (exc) {
                callback(exc);
            })
            .on("close", function () {
                callback(null, validationResult);
            });
    });
}

function _cmdInstall(packagePath, destinationDirectory, options, callback) {
    var validateCallback = function (err, validationResult) {
        if (err || validationResult.errors.length > 0) {
            callback(err, validationResult);
            return;
        }
        
        var extensionName;
        if (validationResult.metadata) {
            extensionName = validationResult.metadata.name;
        } else {
            extensionName = path.basename(packagePath, ".zip");
        }
        validationResult.name = extensionName;
        var installDirectory = path.join(destinationDirectory, extensionName);
        
        fs.exists(installDirectory, function (installDirectoryExists) {
            if (installDirectoryExists) {
                validationResult.disabledReason  = "ALREADY_INSTALLED";
                if (!options || !options.disabledDirectory) {
                    callback("NO_DISABLED_DIRECTORY", null);
                    return;
                }
                installDirectory = path.join(options.disabledDirectory, validationResult.metadata.name);
                fs.remove(installDirectory, function () {
                    _performInstall(packagePath, installDirectory, validationResult, callback);
                });
            } else {
                validationResult.disabledReason = null;
                _performInstall(packagePath, installDirectory, validationResult, callback);
            }
        });
    };
    _cmdValidate(packagePath, validateCallback);
}

/**
 * Initialize the "extensions" domain.
 * The extensions domain contains the validate function.
 */
function init(domainManager) {
    if (!domainManager.hasDomain("extensions")) {
        domainManager.registerDomain("extensions", {major: 0, minor: 1});
    }
    domainManager.registerCommand(
        "extensions",
        "validate",
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
}

// used in unit tests
exports._cmdValidate = _cmdValidate;
exports._cmdInstall = _cmdInstall;

// used to load the domain
exports.init = init;
