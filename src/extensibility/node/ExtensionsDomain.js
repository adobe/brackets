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
                        errors: [["MISSING_PACKAGE_JSON", path]]
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
                description: "all package.json metadata"
            }
        }
    );
}

// used in unit tests
exports._cmdValidate = _cmdValidate;

// used to load the domain
exports.init = init;
