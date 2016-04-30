/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
 * Defines a ChangedDocumentTracker class to monitor changes to files in the current project.
 */
define(function (require, exports, module) {
    "use strict";

    var DocumentManager = require("document/DocumentManager"),
        ProjectManager  = require("project/ProjectManager");

    /**
     * Tracks "change" events on opened Documents. Used to monitor changes
     * to documents in-memory and update caches. Assumes all documents have
     * changed when the Brackets window loses and regains focus. Does not
     * read timestamps of files on disk. Clients may optionally track file
     * timestamps on disk independently.
     * @constructor
     */
    function ChangedDocumentTracker() {
        var self = this;

        this._changedPaths = {};
        this._windowFocus = true;
        this._addListener = this._addListener.bind(this);
        this._removeListener = this._removeListener.bind(this);
        this._onChange = this._onChange.bind(this);
        this._onWindowFocus = this._onWindowFocus.bind(this);

        DocumentManager.on("afterDocumentCreate", function (event, doc) {
            // Only track documents in the current project
            if (ProjectManager.isWithinProject(doc.file.fullPath)) {
                self._addListener(doc);
            }
        });

        DocumentManager.on("beforeDocumentDelete", function (event, doc) {
            // In case a document somehow remains loaded after its project
            // has been closed, unconditionally attempt to remove the listener.
            self._removeListener(doc);
        });

        $(window).focus(this._onWindowFocus);
    }

    /**
     * @private
     * Assumes all files are changed when the window loses and regains focus.
     */
    ChangedDocumentTracker.prototype._addListener = function (doc) {
        doc.on("change", this._onChange);
    };

    /**
     * @private
     */
    ChangedDocumentTracker.prototype._removeListener = function (doc) {
        doc.off("change", this._onChange);
    };

    /**
     * @private
     * Assumes all files are changed when the window loses and regains focus.
     */
    ChangedDocumentTracker.prototype._onWindowFocus = function (event, doc) {
        this._windowFocus = true;
    };

    /**
     * @private
     * Tracks changed documents.
     */
    ChangedDocumentTracker.prototype._onChange = function (event, doc) {
        // if it was already changed, and the client hasn't reset the tracker,
        // then leave it changed.
        this._changedPaths[doc.file.fullPath] = true;
    };

    /**
     * Empty the set of dirty paths. Begin tracking new dirty documents.
     */
    ChangedDocumentTracker.prototype.reset = function () {
        this._changedPaths = {};
        this._windowFocus = false;
    };

    /**
     * Check if a file path is dirty.
     * @param {!string} file path
     * @return {!boolean} Returns true if the file was dirtied since the last reset.
     */
    ChangedDocumentTracker.prototype.isPathChanged = function (path) {
        return this._windowFocus || this._changedPaths[path];
    };

    /**
     * Get the set of changed paths since the last reset.
     * @return {Array.<string>} Changed file paths
     */
    ChangedDocumentTracker.prototype.getChangedPaths = function () {
        return $.makeArray(this._changedPaths);
    };

    module.exports = ChangedDocumentTracker;
});
