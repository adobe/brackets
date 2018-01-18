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

/*eslint-env node */
/*jslint node: true */

"use strict";

var fs = require("fs-extra");

function remove(path, cb) {
    fs.remove(path, cb);
}

function copy(src, dest, cb) {
    fs.copy(src, dest, cb);
}

function rename(src, dest, cb) {
    fs.rename(src, dest, cb);
}

/**
 * Initialize the "testing" domain.
 * The testing domain provides utilities for tests.
 */
function init(domainManager) {
    if (!domainManager.hasDomain("testing")) {
        domainManager.registerDomain("testing", {major: 0, minor: 1});
    }
    domainManager.registerCommand(
        "testing",
        "remove",
        remove,
        true,
        "Remove the directory at the path",
        [{
            name: "path",
            type: "string",
            description: "path to the directory to remove"
        }]
    );
    domainManager.registerCommand(
        "testing",
        "copy",
        copy,
        true,
        "Copy a file or directory. The directory can have contents. Like cp -r.",
        [
            {
                name: "src",
                type: "string",
                description: "directory source to copy"
            },
            {
                name: "dest",
                type: "string",
                description: "destination directory"
            }
        ]
    );
    domainManager.registerCommand(
        "testing",
        "rename",
        rename,
        true,
        "Rename a file or directory.",
        [
            {
                name: "src",
                type: "string",
                description: "source path"
            },
            {
                name: "dest",
                type: "string",
                description: "destination path"
            }
        ]
    );
}

exports.init = init;
