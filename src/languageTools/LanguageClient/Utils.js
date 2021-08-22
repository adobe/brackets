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

/*eslint-env es6, node*/


var nodeURL = require("url"),
    path = require("path");

function pathToUri(filePath) {
    var newPath = convertWinToPosixPath(filePath);
    if (newPath[0] !== '/') {
        newPath = `/${newPath}`;
    }
    return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
}

function uriToPath(uri) {
    var url = nodeURL.URL.parse(uri);
    if (url.protocol !== 'file:' || url.path === undefined) {
        return uri;
    }

    let filePath = decodeURIComponent(url.path);
    if (process.platform === 'win32') {
        if (filePath[0] === '/') {
            filePath = filePath.substr(1);
        }
        return filePath;
    }
    return filePath;
}

function convertPosixToWinPath(filePath) {
    return filePath.replace(/\//g, '\\');
}

function convertWinToPosixPath(filePath) {
    return filePath.replace(/\\/g, '/');
}

function convertToLSPPosition(pos) {
    return {
        line: pos.line,
        character: pos.ch
    };
}

function convertToWorkspaceFolders(paths) {
    var workspaceFolders = paths.map(function (folderPath) {
        var uri = pathToUri(folderPath),
            name = path.basename(folderPath);

        return {
            uri: uri,
            name: name
        };
    });

    return workspaceFolders;
}

exports.uriToPath = uriToPath;
exports.pathToUri = pathToUri;
exports.convertPosixToWinPath = convertPosixToWinPath;
exports.convertWinToPosixPath = convertWinToPosixPath;
exports.convertToLSPPosition = convertToLSPPosition;
exports.convertToWorkspaceFolders = convertToWorkspaceFolders;
