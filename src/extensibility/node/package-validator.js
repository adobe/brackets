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
    os      = require("os"),
    fs      = require("fs-extra");


var Errors = {
    NOT_FOUND_ERR: "NOT_FOUND_ERR",                 // {0} is path where ZIP file was expected
    INVALID_ZIP_FILE: "INVALID_ZIP_FILE",           // {0} is path to ZIP file
    INVALID_PACKAGE_JSON: "INVALID_PACKAGE_JSON",   // {0} is JSON parse error, {1} is path to ZIP file
    MISSING_PACKAGE_NAME: "MISSING_PACKAGE_NAME",   // {0} is path to ZIP file
    BAD_PACKAGE_NAME: "BAD_PACKAGE_NAME",           // {0} is the name
    MISSING_PACKAGE_VERSION: "MISSING_PACKAGE_VERSION",  // {0} is path to ZIP file
    INVALID_VERSION_NUMBER: "INVALID_VERSION_NUMBER",    // {0} is version string in JSON, {1} is path to ZIP file
    MISSING_MAIN: "MISSING_MAIN",                    // {0} is path to ZIP file
    MISSING_PACKAGE_JSON: "MISSING_PACKAGE_JSON"     // {0} is path to ZIP file
};

/*
 * Directories to ignore when computing the common prefix among the entries of
 * a zip file.
 */
var ignoredPrefixes = {
    "__MACOSX": true
};

/**
 * Returns true if the name presented is acceptable as a package name. This enforces the
 * requirement as presented in the CommonJS spec: http://wiki.commonjs.org/wiki/Packages/1.0
 *
 * @param {string} Name to test
 * @return {boolean} true if the name is valid
 */
function validateName(name) {
    // "This must be a unique, lowercase alpha-numeric name without spaces. It may include "." or "_" or "-" characters."
    if (/^[a-z0-9._\-]+$/.exec(name)) {
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
 * @param {{requirePackageJSON: ?boolean}} validation options
 * @param {function} callback (err, result)
 */
function validate(path, options, callback) {
    options = options || {};
    fs.exists(path, function (doesExist) {
        if (!doesExist) {
            callback(null, {
                errors: [[Errors.NOT_FOUND_ERR, path]]
            });
            return;
        }
        var callbackCalled = false;
        var metadata;
        var foundMainIn = null;
        var errors = [];
        var commonPrefix = null;
        
        var readStream = fs.createReadStream(path);
        
        readStream
            .pipe(unzip.Parse())
            .on("error", function (exception) {
                // General error to report for problems reading the file
                errors.push([Errors.INVALID_ZIP_FILE, path]);
                callback(null, {
                    errors: errors
                });
                callbackCalled = true;
                readStream.destroy();
            })
            .on("entry", function (entry) {
                // look for the metadata
                var fileName = entry.path;
                
                var slash = fileName.indexOf("/");
                if (slash > -1) {
                    var prefix = fileName.substring(0, slash);
                    if (!ignoredPrefixes.hasOwnProperty(prefix)) {
                        if (commonPrefix === null) {
                            commonPrefix = prefix;
                        } else if (prefix !== commonPrefix) {
                            commonPrefix = "";
                        }
                        if (commonPrefix) {
                            fileName = fileName.substring(commonPrefix.length + 1);
                        }
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
                            readStream.destroy();
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
                    foundMainIn = commonPrefix;
                }
            })
            .on("end", function () {
                // Reached the end of the zipfile
                // Report results
                
                // generally, if we hit an exception, we've already called the callback
                if (callbackCalled) {
                    return;
                }
                
                if (foundMainIn === null || foundMainIn !== commonPrefix) {
                    errors.push([Errors.MISSING_MAIN, path]);
                }
                
                // No errors and no metadata means that we never found the metadata
                if (errors.length === 0 && !metadata) {
                    metadata = null;
                }
                
                if (metadata === null && options.requirePackageJSON) {
                    errors.push([Errors.MISSING_PACKAGE_JSON, path]);
                }
                
                callback(null, {
                    errors: errors,
                    metadata: metadata,
                    commonPrefix: commonPrefix
                });
            });
    });
}

exports.errors = Errors;
exports.validate = validate;
