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
indent: 4, maxerr: 50, regexp: true */

"use strict";

var DecompressZip = require("decompress-zip"),
    semver        = require("semver"),
    path          = require("path"),
    temp          = require("temp"),
    fs            = require("fs-extra");

// Track and cleanup files at exit
temp.track();

var Errors = {
    NOT_FOUND_ERR: "NOT_FOUND_ERR",                       // {0} is path where ZIP file was expected
    INVALID_ZIP_FILE: "INVALID_ZIP_FILE",                 // {0} is path to ZIP file
    INVALID_PACKAGE_JSON: "INVALID_PACKAGE_JSON",         // {0} is JSON parse error, {1} is path to ZIP file
    MISSING_PACKAGE_NAME: "MISSING_PACKAGE_NAME",         // {0} is path to ZIP file
    BAD_PACKAGE_NAME: "BAD_PACKAGE_NAME",                 // {0} is the name
    MISSING_PACKAGE_VERSION: "MISSING_PACKAGE_VERSION",   // {0} is path to ZIP file
    INVALID_VERSION_NUMBER: "INVALID_VERSION_NUMBER",     // {0} is version string in JSON, {1} is path to ZIP file
    MISSING_MAIN: "MISSING_MAIN",                         // {0} is path to ZIP file
    MISSING_PACKAGE_JSON: "MISSING_PACKAGE_JSON",         // {0} is path to ZIP file
    INVALID_BRACKETS_VERSION: "INVALID_BRACKETS_VERSION", // {0} is the version string in JSON, {1} is the path to the zip file,
    DISALLOWED_WORDS: "DISALLOWED_WORDS"                  // {0} is the field with the word, {1} is a string list of words that were in violation, {2} is the path to the zip file
};

/*
 * Directories to ignore when determining whether the contents of an extension are
 * in a subfolder.
 */
var ignoredFolders = [ "__MACOSX" ];

/**
 * Returns true if the name presented is acceptable as a package name. This enforces the
 * requirement as presented in the CommonJS spec: http://wiki.commonjs.org/wiki/Packages/1.0
 * which states:
 *
 * "This must be a unique, lowercase alpha-numeric name without spaces. It may include "." or "_" or "-" characters."
 *
 * We add the additional requirement that the first character must be a letter or number
 * (there's a security implication to allowing a name like "..", because the name is
 * used in directory names).
 *
 * @param {string} name to test
 * @return {boolean} true if the name is valid
 */
function validateName(name) {
    if (/^[a-z0-9][a-z0-9._\-]*$/.exec(name)) {
        return true;
    }
    return false;
}

// Parses strings of the form "name <email> (url)" where email and url are optional
var _personRegex = /^([^<\(]+)(?:\s+<([^>]+)>)?(?:\s+\(([^\)]+)\))?$/;

/**
 * Normalizes person fields from package.json.
 *
 * These fields can be an object with name, email and url properties or a
 * string of the form "name <email> <url>". This does a tolerant parsing of
 * the data to try to return an object with name and optional email and url.
 * If the string does not match the format, the string is returned as the
 * name on the resulting object.
 *
 * If an object other than a string is passed in, it's returned as is.
 *
 * @param <String|Object> obj to normalize
 * @return {Object} person object with name and optional email and url
 */
function parsePersonString(obj) {
    if (typeof (obj) === "string") {
        var parts = _personRegex.exec(obj);

        // No regex match, so we just synthesize an object with an opaque name string
        if (!parts) {
            return {
                name: obj
            };
        } else {
            var result = {
                name: parts[1]
            };
            if (parts[2]) {
                result.email = parts[2];
            }
            if (parts[3]) {
                result.url = parts[3];
            }
            return result;
        }
    } else {
        // obj is not a string, so return as is
        return obj;
    }
}

/**
 * Determines if any of the words in wordlist appear in str.
 *
 * @param {String[]} wordlist list of words to check
 * @param {String} str to check for words
 * @return {String[]} words that matched
 */
function containsWords(wordlist, str) {
    var i;
    var matches = [];
    for (i = 0; i < wordlist.length; i++) {
        var re = new RegExp("\\b" + wordlist[i] + "\\b", "i");
        if (re.exec(str)) {
            matches.push(wordlist[i]);
        }
    }
    return matches;
}

/**
 * Finds the common prefix, if any, for the files in a package file.
 *
 * In some package files, all of the files are contained in a subdirectory, and this function
 * will identify that directory if it exists.
 *
 * @param {string} extractDir directory into which the package was extracted
 * @param {function(Error, string)} callback function to accept err, commonPrefix (which will be "" if there is none)
 */
function findCommonPrefix(extractDir, callback) {
    fs.readdir(extractDir, function (err, files) {
        ignoredFolders.forEach(function (folder) {
            var index = files.indexOf(folder);
            if (index !== -1) {
                files.splice(index, 1);
            }
        });
        if (err) {
            callback(err);
        } else if (files.length === 1) {
            var name = files[0];
            if (fs.statSync(path.join(extractDir, name)).isDirectory()) {
                callback(null, name);
            } else {
                callback(null, "");
            }
        } else {
            callback(null, "");
        }
    });
}

/**
 * Validates the contents of package.json.
 *
 * @param {string} path path to package file (used in error reporting)
 * @param {string} packageJSON path to the package.json file to check
 * @param {Object} options validation options passed to `validate()`
 * @param {function(Error, Array.<Array.<string, ...>>, Object)} callback function to call with array of errors and metadata
 */
function validatePackageJSON(path, packageJSON, options, callback) {
    var errors = [];
    if (fs.existsSync(packageJSON)) {
        fs.readFile(packageJSON, {
            encoding: "utf8"
        }, function (err, data) {
            if (err) {
                callback(err, null, null);
                return;
            }

            var metadata;

            try {
                metadata = JSON.parse(data);
            } catch (e) {
                errors.push([Errors.INVALID_PACKAGE_JSON, e.toString(), path]);
                callback(null, errors, undefined);
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

            // normalize the author
            if (metadata.author) {
                metadata.author = parsePersonString(metadata.author);
            }

            // contributors should be an array of people.
            // normalize each entry.
            if (metadata.contributors) {
                if (metadata.contributors.map) {
                    metadata.contributors = metadata.contributors.map(function (person) {
                        return parsePersonString(person);
                    });
                } else {
                    metadata.contributors = [
                        parsePersonString(metadata.contributors)
                    ];
                }
            }

            if (metadata.engines && metadata.engines.brackets) {
                var range = metadata.engines.brackets;
                if (!semver.validRange(range)) {
                    errors.push([Errors.INVALID_BRACKETS_VERSION, range, path]);
                }
            }

            if (options.disallowedWords) {
                ["title", "description", "name"].forEach(function (field) {
                    var words = containsWords(options.disallowedWords, metadata[field]);
                    if (words.length > 0) {
                        errors.push([Errors.DISALLOWED_WORDS, field, words.toString(), path]);
                    }
                });
            }
            callback(null, errors, metadata);
        });
    } else {
        if (options.requirePackageJSON) {
            errors.push([Errors.MISSING_PACKAGE_JSON, path]);
        }
        callback(null, errors, null);
    }
}

/**
 * Extracts the package into the given directory and then validates it.
 *
 * @param {string} zipPath path to package zip file
 * @param {string} extractDir directory to extract package into
 * @param {Object} options validation options
 * @param {function(Error, {errors: Array, metadata: Object, commonPrefix: string, extractDir: string})} callback function to call with the result
 */
function extractAndValidateFiles(zipPath, extractDir, options, callback) {
    var unzipper = new DecompressZip(zipPath);
    unzipper.on("error", function (err) {
        // General error to report for problems reading the file
        callback(null, {
            errors: [[Errors.INVALID_ZIP_FILE, zipPath, err]]
        });
        return;
    });

    unzipper.on("extract", function (log) {
        findCommonPrefix(extractDir, function (err, commonPrefix) {
            if (err) {
                callback(err, null);
                return;
            }
            var packageJSON = path.join(extractDir, commonPrefix, "package.json");
            validatePackageJSON(zipPath, packageJSON, options, function (err, errors, metadata) {
                if (err) {
                    callback(err, null);
                    return;
                }
                var mainJS  = path.join(extractDir, commonPrefix, "main.js"),
                    isTheme = metadata && metadata.theme;

                // Throw missing main.js file only for non-theme extensions
                if (!isTheme && !fs.existsSync(mainJS)) {
                    errors.push([Errors.MISSING_MAIN, zipPath, mainJS]);
                }
                callback(null, {
                    errors: errors,
                    metadata: metadata,
                    commonPrefix: commonPrefix,
                    extractDir: extractDir
                });
            });
        });
    });

    unzipper.extract({
        path: extractDir,
        filter: function (file) {
            return file.type !== "SymbolicLink";
        }
    });
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
 * @param {string} path Absolute path to the package zip file
 * @param {{requirePackageJSON: ?boolean, disallowedWords: ?Array.<string>}} options for validation
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
        temp.mkdir("bracketsPackage_", function _tempDirCreated(err, extractDir) {
            if (err) {
                callback(err, null);
                return;
            }
            extractAndValidateFiles(path, extractDir, options, callback);
        });
    });
}

// exported for unit testing
exports._parsePersonString = parsePersonString;

exports.errors = Errors;
exports.validate = validate;
