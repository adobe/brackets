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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";
    
    var Q = require("Q");
        
    var QFileSystemEntry = require("filesystem/FileSystemEntry");
    
    function QDirectory(entry) {
        QFileSystemEntry.call(this, entry);
    }
    
    QDirectory.prototype = Object.create(QFileSystemEntry.prototype);
    QDirectory.prototype.constructor = QDirectory;
    QDirectory.prototype.parentClass = QFileSystemEntry.prototype;
    
    QDirectory.prototype.isDirectory = function () {
        return this._cbEntry.isDirectory();
    };
    
    /**
     * Create a directory
     *
     * @param {int=} mode The mode for the directory.
     *
     * @return {Q.Promise} Promise that is resolved with the stat from the new directory.
     */
    QDirectory.prototype.create = function (mode) {
        // TODO: support mode
        
        var result = Q.defer();
        
        this._cbEntry.create(mode, function (err, stat) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve(stat);
            }
        });

        return result.promise;
    };
    
    /**
     * Read the contents of a Directory. 
     *
     * @param {QDirectory} directory Directory whose contents you want to get
     *
     * @return {Q.Promise} Promise that is resolved with the contents of the directory.
     *         Contents is an Array of File and Directory objects.
     */
    QDirectory.prototype.getContents = function () {
        var result = Q.defer();
        
        this._cbEntry.getContents(function (err, contents) {
            if (err) {
                result.reject(err);
            } else {
                result.resolve(contents);
            }
        });

        return result.promise;
    };
    
    // Export this class
    module.exports = QDirectory;
});
