/*
 * Copyright (c) 2017 - present Adobe Systems Incorporated. All rights reserved.
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
        
var fs = require("fs"),
    _dirtyFilesCache = {};

/**
 * Clears the cache for dirty file paths
 */
function clearDirtyFilesCache() {
    _dirtyFilesCache = {};
}

/**
 * Updates the files cache with fullpath when dirty flag changes for a document
 * If the doc is being marked as dirty then an entry is created in the cache
 * If the doc is being marked as clean then the corresponsing entry gets cleared from cache
 *
 * @param {String} name - fullpath of the document
 * @param {boolean} action - whether the document is dirty
 */
function updateDirtyFilesCache(name, action) {
    if (action) {
        _dirtyFilesCache[name] = true;
    } else {
        if (_dirtyFilesCache[name]) {
            delete _dirtyFilesCache[name];
        }
    }
}

/**
 * Extract content locally from the file system used fs.readFile()
 *
 * @param {String} fileName - fullpath of the document
 * @param {Function} callback - callback handle to post the content back
 */
function _readFile(fileName, callback) {
    fs.readFile(fileName, "utf8", function (err, data) {
        var content = "";
        if (!err) {
            content = data;
        }
        callback.apply(null, [fileName, content]);
    });
}

/**
 * Extracts file content for the given file name(1st param) and invokes the callback handle(2nd param) with 
 * extracted file content. Content can be extracted locally from the file system used fs.readFile()
 * or conditionally from main context(brackets main thread) by using the 3rd param 
 *
 * @param {String} fileName - fullpath of the document
 * @param {Function} callback - callback handle to post the content back
 * @param {Object} extractFromMainContext - content request handle wrapper from main thread
 */
function extractContent(fileName, callback, extractFromMainContext) {
    // Ask the main thread context to provide the updated file content
    // We can't yet use node io to read, to utilize shells encoding detection
    extractFromMainContext.apply(null, [fileName]);
}

exports.extractContent = extractContent;
exports.clearFilesCache = clearDirtyFilesCache;
exports.updateFilesCache = updateDirtyFilesCache;

