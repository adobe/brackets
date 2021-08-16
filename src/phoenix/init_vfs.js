/*
 * Copyright (c) 2021 - present core.ai . All rights reserved.
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

// jshint ignore: start
/*global fs, Phoenix*/
/*eslint-env es6*/
/*eslint no-console: 0*/
/*eslint strict: ["error", "global"]*/
"use strict";


/** Setup virtual file system. This happens before any code of phoenix is loaded.
 * The virtual file system is rooted at /
 * Application support folder that stores app data is /app/
 * Local user storage space is mounted at path /local/
 *
 * This module should be functionally as light weight as possible with minimal deps as it is a shell component.
 * **/
Phoenix.VFS = {
    getRootDir: () => '/',
    getAppDir: () => '/app/',
    getLocalDir: () => '/local/',
    getDefaultProjectDir: () => '/local/default project/',
    ensureExistsDir : function (path, cb) {
        fs.mkdir(path, function(err) {
            if (err && err.code !== 'EEXIST') {
                cb(err);
            }
            cb();
        });
    },
    fs: window.Filer.fs,
    path: window.Filer.path
};

(function () {
    // init vfs
    let vfs = Phoenix.VFS;
    let FS_ERROR_MESSAGE = 'Oops. Phoenix could not be started due to missing file system library.';

    let alertError = function (message, err){
        window.alert(message);
        throw new Error(err || message);
    };

    if(!window.fs){
        alertError(FS_ERROR_MESSAGE);
    }

    let errorCb = function (err){
        if(err) {
            alertError(FS_ERROR_MESSAGE, err);
        }
    };

    // Create phoenix app dirs
    vfs.ensureExistsDir(vfs.getRootDir(), errorCb);
    vfs.ensureExistsDir(vfs.getAppDir(), errorCb);
    vfs.ensureExistsDir(vfs.getLocalDir(), errorCb);

    // Create Phoenix default project if it doesnt exist
    fs.stat(vfs.getDefaultProjectDir(), function (err){
        if (err && err.code === 'ENOENT') {
            let projectDir = vfs.getDefaultProjectDir();
            let indexFile = vfs.path.normalize(`${projectDir}/index.html`);
            vfs.ensureExistsDir(vfs.getDefaultProjectDir(), errorCb);
            let html = `<!DOCTYPE html>
<html>
    <head>
        <title>Page Title</title>
    </head>
 
    <body>
        <h1>This is a Heading</h1>
        <p>This is a paragraph.</p>
    </body>
</html>`;
            fs.writeFile(indexFile, html, 'utf8', errorCb);
        }
    });
}());

