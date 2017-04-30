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

/**
 * Utilities for determining the git SHA from an optional repository or from the
 * installed copy of Brackets.
 */
define(function (require, exports, module) {
    "use strict";

    var FileSystem  = require("filesystem/FileSystem"),
        FileUtils   = require("file/FileUtils");

    // make sure the global brackets variable is loaded
    require("utils/Global");

    /**
     * Loads a SHA from Git metadata file. If the file contains a symbolic ref name, follows the ref
     * and loads the SHA from that file in turn.
     */
    function _loadSHA(path, callback) {
        var result = new $.Deferred();

        if (brackets.inBrowser) {
            result.reject();
        } else {
            // HEAD contains a SHA in detached-head mode; otherwise it contains a relative path
            // to a file in /refs which in turn contains the SHA
            var file = FileSystem.getFileForPath(path);
            FileUtils.readAsText(file).done(function (text) {
                if (text.indexOf("ref: ") === 0) {
                    // e.g. "ref: refs/heads/branchname"
                    var basePath    = path.substr(0, path.lastIndexOf("/")),
                        refRelPath  = text.substr(5).trim(),
                        branch      = text.substr(16).trim();

                    _loadSHA(basePath + "/" + refRelPath, callback).done(function (data) {
                        result.resolve({ branch: branch, sha: data.sha.trim() });
                    }).fail(function () {
                        result.resolve({ branch: branch });
                    });
                } else {
                    result.resolve({ sha: text });
                }
            }).fail(function () {
                result.reject();
            });
        }

        return result.promise();
    }

    /**
     * @return {$.Promise} A promise resolved with the git branch and SHA
     *     of a local copy of a repository or the branch and SHA
     *     embedded at build-time in the package.json repository metadata.
     */
    function getBracketsSHA() {
        var result = new $.Deferred();

        // Look for Git metadata on disk to load the SHAs for 'brackets'. Done on
        // startup instead of on demand because the version that's currently running is what was
        // loaded at startup (the src on disk may be updated to a different version later).
        // Git metadata may be missing (e.g. in the release builds) - silently ignore if so.
        var bracketsSrc = FileUtils.getNativeBracketsDirectoryPath();

        // Assumes Brackets is a standalone repo and not a submodule (prior to brackets-shell,
        // brackets-app was setup this way)
        var bracketsGitRoot = bracketsSrc.substr(0, bracketsSrc.lastIndexOf("/")) + "/.git/HEAD";

        _loadSHA(bracketsGitRoot).done(function (data) {
            // Found a repository
            result.resolve(data.branch || "HEAD", data.sha || "unknown", true);
        }).fail(function () {
            // If package.json has repository data, Brackets is running from the installed /www folder
            result.resolve(brackets.metadata.repository.branch, brackets.metadata.repository.SHA, false);
        });

        return result.promise();
    }

    exports.getBracketsSHA      = getBracketsSHA;

    // FIXME (jasonsanjose): Since the move to brackets-shell, can't reliably get SHA for shell.
    // exports._getBracketsShellSHA = getBracketsShellSHA;
});
