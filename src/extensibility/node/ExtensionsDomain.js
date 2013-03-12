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

var unzip = require("unzip"),
    fs    = require("fs");

function _cmdValidate(path, callback) {
    fs.exists(path, function (doesExist) {
        if (!doesExist) {
            callback(null, [[["NOT_FOUND_ERR"]], null]);
            return;
        }
        var callbackCalled = false;
        var metadata = null;
        var errors = [];
        
        fs.createReadStream(path)
            .pipe(unzip.Parse())
            .on("error", function (exception) {
                errors.push(["INVALID_ZIP_FILE", path]);
                callback(null, [errors, null]);
                callbackCalled = true;
            })
            .on("entry", function (entry) {
                var fileName = entry.path;
                if (fileName === "package.json") {
                    var packageJSON = "";
                    entry
                        .on("data", function (data) {
                            packageJSON += data.toString("utf8");
                        })
                        .on("error", function (exception) {
                            callback(exception, null);
                            callbackCalled = true;
                        })
                        .on("end", function () {
                            try {
                                metadata = JSON.parse(packageJSON);
                            } catch (e) {
                                errors.push(["INVALID_PACKAGE_JSON", e.toString(), path]);
                                return;
                            }
                            
                            if (!metadata.name) {
                                errors.push(["MISSING_PACKAGE_NAME", path]);
                            }
                            if (!metadata.version) {
                                errors.push(["MISSING_PACKAGE_VERSION", path]);
                            }
                        });
                }
            })
            .on("end", function () {
                if (callbackCalled) {
                    return;
                }
                if (errors.length > 0) {
                    callback(null, [errors, null]);
                } else if (metadata === null) {
                    callback(null, [[["MISSING_PACKAGE_JSON", path]], null]);
                } else {
                    callback(null, [[], metadata]);
                }
            });
    });
}

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
        [{
            name: "errors",
            type: "[[string name, optional format arguments], ...]",
            description: "error with the package, if any"
        }, {
            name: "metadata",
            type: "{name: string, version: string}",
            description: "all package.json metadata"
        }]
    );
}

exports._cmdValidate = _cmdValidate;

exports.init = init;
