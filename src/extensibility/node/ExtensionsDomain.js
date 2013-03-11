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
    var foundPackageJSON = false;
    fs.createReadStream(path)
        .pipe(unzip.Parse())
        .on("entry", function (entry) {
            var fileName = entry.path;
            if (fileName === "package.json") {
                var packageJSON = "";
                entry.on("data", function (data) {
                    packageJSON += data.toString("utf8");
                });
                entry.on("end", function () {
                    var metadata = JSON.parse(packageJSON);
                    foundPackageJSON = true;
                    callback(null, [[], metadata]);
                });
            }
        })
        .on("end", function () {
            if (!foundPackageJSON) {
                callback(null, [[["MISSING_PACKAGE_JSON", path]], null]);
            }
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
