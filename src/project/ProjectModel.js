/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

/* unittests: ProjectModel */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";
    
    var InMemoryFile        = require("document/InMemoryFile"),
        FileUtils           = require("file/FileUtils"),
        _                   = require("thirdparty/lodash");
    
    // Constants
    var CHANGE = "change";
    
    /**
     * @private
     * File and folder names which are not displayed or searched
     * TODO: We should add the rest of the file names that TAR excludes:
     *    http://www.gnu.org/software/tar/manual/html_section/exclude.html
     * TODO: This should be user configurable
     *    https://github.com/adobe/brackets/issues/6781
     * @type {RegExp}
     */
    var _exclusionListRegEx = /\.pyc$|^\.git$|^\.gitmodules$|^\.svn$|^\.DS_Store$|^Thumbs\.db$|^\.hg$|^CVS$|^\.hgtags$|^\.idea$|^\.c9revisions$|^\.SyncArchive$|^\.SyncID$|^\.SyncIgnore$|\~$/;

    /**
     * @private
     * See shouldShow
     */
    function _shouldShowName(name) {
        return !name.match(_exclusionListRegEx);
    }

    /**
     * Returns false for files and directories that are not commonly useful to display.
     *
     * @param {FileSystemEntry} entry File or directory to filter
     * @return boolean true if the file should be displayed
     */
    function shouldShow(entry) {
        return _shouldShowName(entry.name);
    }

    function ProjectModel(initial) {
        if (initial && initial.projectRoot) {
            this.projectRoot = initial.projectRoot;
        }
    }

    /**
     * @private
     * @see getProjectRoot()
     * @type {Directory}
     */
    ProjectModel.prototype.projectRoot = null;

    /**
     * @private
     * Encoded URL
     * @ see getBaseUrl(), setBaseUrl()
     */
    ProjectModel.prototype.projectBaseUrl = "";

    /**
     * @private
     * Promise for generating the cache of all files
     * @type {jQuery.Promise}
     */
    ProjectModel.prototype.projectBaseUrl = null;
    
    /**
     * @private
     * RegEx to validate if a filename is not allowed even if the system allows it.
     * This is done to prevent cross-platform issues.
     */

    var _illegalFilenamesRegEx = /^(\.+|com[1-9]|lpt[1-9]|nul|con|prn|aux|)$|\.+$/i;

    /**
     * @private
     * @type {?jQuery.Promise.<Array<File>>}
     * A promise that is resolved with an array of all project files. Used by 
     * ProjectManager.getAllFiles().
     */
    ProjectModel.prototype._allFilesCachePromise = null;

    /**
     * Sets the encoded Base URL of the currently loaded project.
     * @param {String}
     */
    ProjectModel.prototype.setBaseUrl = function setBaseUrl(projectBaseUrl) {
        // Ensure trailing slash to be consistent with projectRoot.fullPath
        // so they're interchangable (i.e. easy to convert back and forth)
        if (projectBaseUrl.length > 0 && projectBaseUrl[projectBaseUrl.length - 1] !== "/") {
            projectBaseUrl += "/";
        }
        
        this.projectBaseUrl = projectBaseUrl;
        return projectBaseUrl;
    };
    
    /**
     * Returns true if absPath lies within the project, false otherwise.
     * Does not support paths containing ".."
     * @param {string|FileSystemEntry} absPathOrEntry
     * @return {boolean}
     */
    ProjectModel.prototype.isWithinProject = function isWithinProject(absPathOrEntry) {
        var absPath = absPathOrEntry.fullPath || absPathOrEntry;
        return (this.projectRoot && absPath.indexOf(this.projectRoot.fullPath) === 0);
    };

    /**
     * If absPath lies within the project, returns a project-relative path. Else returns absPath
     * unmodified.
     * Does not support paths containing ".."
     * @param {!string} absPath
     * @return {!string}
     */
    ProjectModel.prototype.makeProjectRelativeIfPossible = function makeProjectRelativeIfPossible(absPath) {
        if (this.isWithinProject(absPath)) {
            return absPath.slice(this.projectRoot.fullPath.length);
        }
        return absPath;
    };
    
    /**
     * Returns a promise that resolves with a cached copy of all project files.
     * Used by ProjectManager.getAllFiles(). Ensures that at most one un-cached
     * directory traversal is active at a time, which is useful at project load
     * time when watchers (and hence filesystem-level caching) has not finished
     * starting up. The cache is cleared on every filesystem change event, and
     * also on project load and unload.
     * 
     * @private
     * @return {jQuery.Promise.<Array.<File>>}
     */
    ProjectModel.prototype._getAllFilesCache = function _getAllFilesCache() {
        if (!this._allFilesCachePromise) {
            var deferred = new $.Deferred(),
                allFiles = [],
                allFilesVisitor = function (entry) {
                    if (shouldShow(entry)) {
                        if (entry.isFile) {
                            allFiles.push(entry);
                        }
                        return true;
                    }
                    return false;
                };

            this._allFilesCachePromise = deferred.promise();

            this.projectRoot.visit(allFilesVisitor, function (err) {
                if (err) {
                    deferred.reject();
                    this._allFilesCachePromise = null;
                } else {
                    deferred.resolve(allFiles);
                }
            }.bind(this));
        }

        return this._allFilesCachePromise;
    };

    /**
     * Returns an Array of all files for this project, optionally including
     * files in the working set that are *not* under the project root. Files filtered
     * out by shouldShow().
     *
     * @param {function (File, number):boolean=} filter Optional function to filter
     *          the file list (does not filter directory traversal). API matches Array.filter().
     * @param {Array.<File>=} additionalFiles Additional files to include (for example, the WorkingSet)
     *          Only adds files that are *not* under the project root or untitled documents.
     *
     * @return {$.Promise} Promise that is resolved with an Array of File objects.
     */
    ProjectModel.prototype.getAllFiles = function getAllFiles(filter, additionalFiles) {
        // The filter and includeWorkingSet params are both optional.
        // Handle the case where filter is omitted but includeWorkingSet is
        // specified.
        if (additionalFiles === undefined && typeof (filter) !== "function") {
            additionalFiles = filter;
            filter = null;
        }

        var filteredFilesDeferred = new $.Deferred();

        // First gather all files in project proper
        this._getAllFilesCache().done(function (result) {
            // Add working set entries, if requested
            if (additionalFiles) {
                additionalFiles.forEach(function (file) {
                    if (result.indexOf(file) === -1 && !(file instanceof InMemoryFile)) {
                        result.push(file);
                    }
                });
            }

            // Filter list, if requested
            if (filter) {
                result = result.filter(filter);
            }

            // If a done handler attached to the returned filtered files promise
            // throws an exception that isn't handled here then it will leave
            // _allFilesCachePromise in an inconsistent state such that no
            // additional done handlers will ever be called!
            try {
                filteredFilesDeferred.resolve(result);
            } catch (e) {
                console.warn("Unhandled exception in getAllFiles handler: ", e);
            }
        });

        return filteredFilesDeferred.promise();
    };
    
    /**
     * @private
     * 
     * Resets the all files cache.
     */
    ProjectModel.prototype._resetCache = function _resetCache() {
        this._allFilesCachePromise = null;
    };
    
    ProjectModel.prototype.on = function (event, handler) {
        $(this).on(event, handler);
    };
    
    ProjectModel.prototype.off = function (event, handler) {
        $(this).off(event, handler);
    };
    
    /**
     * Although Brackets is generally standardized on folder paths with a trailing "/", some APIs here
     * receive project paths without "/" due to legacy preference storage formats, etc.
     * @param {!string} fullPath  Path that may or may not end in "/"
     * @return {!string} Path that ends in "/"
     */
    function _ensureTrailingSlash(fullPath) {
        if (fullPath[fullPath.length - 1] !== "/") {
            return fullPath + "/";
        }
        return fullPath;
    }

    /** 
     * @private
     * 
     * Returns the full path to the welcome project, which we open on first launch.
     * 
     * @param {string} sampleUrl URL for getting started project
     * @param {string} initialPath Path to Brackets directory (see FileUtils.getNativeBracketsDirectoryPath())
     * @return {!string} fullPath reference
     */
    function _getWelcomeProjectPath(sampleUrl, initialPath) {
        if (sampleUrl) {
            // Back up one more folder. The samples folder is assumed to be at the same level as
            // the src folder, and the sampleUrl is relative to the samples folder.
            initialPath = initialPath.substr(0, initialPath.lastIndexOf("/")) + "/samples/" + sampleUrl;
        }

        return _ensureTrailingSlash(initialPath); // paths above weren't canonical
    }

    /**
     * Adds the path to the list of welcome projects we've ever seen, if not on the list already.
     * 
     * @param {string} path Path to possibly add
     * @param {=Array.<string>} currentProjects Array of current welcome projects
     * @return {Array.<string>} New array of welcome projects with the additional project added
     */
    function _addWelcomeProjectPath(path, currentProjects) {
        var pathNoSlash = FileUtils.stripTrailingSlash(path);  // "welcomeProjects" pref has standardized on no trailing "/"
        
        var newProjects;
        
        if (currentProjects) {
            newProjects = _.clone(currentProjects);
        } else {
            newProjects = [];
        }

        if (newProjects.indexOf(pathNoSlash) === -1) {
            newProjects.push(pathNoSlash);
        }
        return newProjects;
    }
    
    /**
     * Returns true if the given path is the same as one of the welcome projects we've previously opened,
     * or the one for the current build.
     * 
     * @param {string} path Path to check to see if it's a welcome project
     * @param {string} welcomeProjectPath Current welcome project path
     * @param {Array.<string>=} welcomeProjects All known welcome projects
     */
    function _isWelcomeProjectPath(path, welcomeProjectPath, welcomeProjects) {
        if (path === welcomeProjectPath) {
            return true;
        }
        
        // No match on the current path, and it's not a match if there are no previously known projects
        if (!welcomeProjects) {
            return false;
        }
        
        var pathNoSlash = FileUtils.stripTrailingSlash(path);  // "welcomeProjects" pref has standardized on no trailing "/"
        return welcomeProjects.indexOf(pathNoSlash) !== -1;
    }
    
    /**
     * Returns true if this matches valid filename specifications.
     * 
     * TODO This likely belongs in FileUtils.
     * 
     * @param {string} filename to check
     * @param {string} invalidChars List of characters that are disallowed
     * @return {boolean} true if the filename is valid
     */
    function isValidFilename(filename, invalidChars) {
        // Validate file name
        // Checks for valid Windows filenames:
        // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
        return !((filename.search(new RegExp("[" + invalidChars + "]+")) !== -1) ||
                filename.match(_illegalFilenamesRegEx));
    }
    
    exports.ProjectModel = ProjectModel;
    exports._getWelcomeProjectPath = _getWelcomeProjectPath;
    exports._addWelcomeProjectPath = _addWelcomeProjectPath;
    exports._isWelcomeProjectPath = _isWelcomeProjectPath;
    exports._ensureTrailingSlash = _ensureTrailingSlash;
    exports.isValidFilename = isValidFilename;
    exports._shouldShowName = _shouldShowName;
    exports.shouldShow = shouldShow;
    exports.CHANGE = CHANGE;
});