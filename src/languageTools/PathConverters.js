/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
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

/* eslint-disable indent */
define(function (require, exports, module) {
    "use strict";

    var PathUtils = require("thirdparty/path-utils/path-utils"),
        FileUtils = require("file/FileUtils");

    function uriToPath(uri) {
        var url = PathUtils.parseUrl(uri);
        if (url.protocol !== 'file:' || url.pathname === undefined) {
            return uri;
        }

        let filePath = decodeURIComponent(url.pathname);
        if (brackets.platform === 'win') {
            if (filePath && filePath.length > 1 && filePath[0] === '/' && filePath[1] !== '/') {
                filePath = filePath.substr(1);
            }
            return filePath;
        }
        return filePath;
    }

    function pathToUri(filePath) {
        var newPath = convertWinToPosixPath(filePath);
        if (newPath[0] !== '/') {
            newPath = `/${newPath}`;
        }
        return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
    }

    function convertToWorkspaceFolders(paths) {
        var workspaceFolders = paths.map(function (folderPath) {
            var uri = pathToUri(folderPath),
                name = FileUtils.getBasename(folderPath);

            return {
                uri: uri,
                name: name
            };
        });

        return workspaceFolders;
    }

    function convertPosixToWinPath(path) {
        return path.replace(/\//g, '\\');
    }

    function convertWinToPosixPath(path) {
        return path.replace(/\\/g, '/');
    }

    exports.uriToPath = uriToPath;
    exports.pathToUri = pathToUri;
    exports.convertPosixToWinPath = convertPosixToWinPath;
    exports.convertPosixToWinPath = convertPosixToWinPath;
    exports.convertToWorkspaceFolders = convertToWorkspaceFolders;
});
