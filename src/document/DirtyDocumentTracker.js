/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window */

/**
 * Defines a DirtyDocumentTracker class to monitor changes to files in the current project.
 */
define(function (require, exports, module) {
    'use strict';
    
    var DocumentManager = require("document/DocumentManager");
    
    /**
     * Tracks dirtyFlagChange events on opened Documents. Used to monitor changes
     * to documents and update caches.
     */
    function DirtyDocumentTracker() {
        this._windowFocus = true;
        this._initOpenDocuments();
        
        $(DocumentManager).on("dirtyFlagChange", this._onDirtyFlagChange.bind(this));
        $(window).focus(this._onWindowFocus.bind(this));
    }
    
    /**
     * @private
     * Resets all dirty paths. Populates dirty paths with the dirty documents in the working set.
     */
    DirtyDocumentTracker.prototype._initOpenDocuments = function () {
        this._dirtyPaths = {};
        
        DocumentManager.getAllOpenDocuments().forEach(function (doc) {
            this._onDirtyFlagChange(null, doc);
        }, this);
    };
    
    /**
     * @private
     * Assumes all files are dirty when the window loses and regains focus.
     */
    DirtyDocumentTracker.prototype._onWindowFocus = function (event, doc) {
        this._windowFocus = true;
    };
    
    /**
     * @private
     * Tracks dirty files.
     */
    DirtyDocumentTracker.prototype._onDirtyFlagChange = function (event, doc) {
        // if it was already dirty, and the client hasn't reset the tracker,
        // then leave it dirty.
        if (!this._dirtyPaths[doc.file.fullPath]) {
            if (doc.isDirty) {
                this._dirtyPaths[doc.file.fullPath] = true;
            } else {
                delete this._dirtyPaths[doc.file.fullPath];
            }
        }
    };
    
    /**
     * Empty the set of dirty paths. Begin tracking new dirty documents. 
     */
    DirtyDocumentTracker.prototype.reset = function () {
        this._windowFocus = false;
        this._initOpenDocuments();
    };
    
    /**
     * Check if a file path is dirty.
     * @param {!string} file path
     * @return {!boolean} Returns true if the file was dirtied since the last reset.
     */
    DirtyDocumentTracker.prototype.isPathDirty = function (path) {
        return this._windowFocus || this._dirtyPaths[path];
    };
    
    /**
     * Get the set of dirty paths since the last reset.
     * @return {Array.<string>} Dirty file paths
     */
    DirtyDocumentTracker.prototype.getDirtyPaths = function () {
        return $.makeArray(this.dirtyPaths);
    };

    exports.DirtyDocumentTracker = DirtyDocumentTracker;
});