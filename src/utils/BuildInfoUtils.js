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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/**
 * Utilities for determining the git SHA from an optional repository or from the
 * installed copy of Brackets.
 */
define(function (require, exports, module) {
    "use strict";
    
    var Global              = require("utils/Global"),
        FileUtils           = require("file/FileUtils"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem;
    
    var _bracketsSHA;
    
    /**
     * Loads a SHA from Git metadata file. If the file contains a symbolic ref name, follows the ref
     * and loads the SHA from that file in turn.
     */
    function _loadSHA(path, callback) {
        var fileEntry = new NativeFileSystem.FileEntry(path),
            result = new $.Deferred();
        
        // HEAD contains a SHA in detached-head mode; otherwise it contains a relative path
        // to a file in /refs which in turn contains the SHA
        FileUtils.readAsText(fileEntry).done(function (text) {
            if (text.indexOf("ref: ") === 0) {
                var basePath = path.substr(0, path.lastIndexOf("/"));
                var refRelPath = text.substr(5).trim();
                _loadSHA(basePath + "/" + refRelPath, callback)
                    .pipe(result.resolve, result.reject);
            } else {
                result.resolve(text);
            }
        }).fail(function () {
            result.reject();
        });
        
        return result.promise();
    }
    
    /**
     * @return {$.Promise} A promise resolved with the git repository SHA or the SHA
     *                     defined in the package.json repository metadata.
     */
    function getBracketsSHA() {
        var result = new $.Deferred();
        
        // Look for Git metadata on disk to load the SHAs for 'brackets'. Done on
        // startup instead of on demand because the version that's currently running is what was
        // loaded at startup (the src on disk may be updated to a different version later).
        // Git metadata may be missing (e.g. in the per-sprint ZIP builds) - silently ignore if so.
        var bracketsSrc = FileUtils.getNativeBracketsDirectoryPath();
        var bracketsGitRoot = bracketsSrc.substr(0, bracketsSrc.lastIndexOf("/")) + "/.git/HEAD";
        
        _loadSHA(bracketsGitRoot).done(function (sha) {
            // Found a repository
            result.resolve(sha);
        }).fail(function () {
            // If package.json has a SHA, Brackets is running from the installed /www folder
            result.resolve(brackets.metadata.repository.SHA);
        });
        
        return result.promise();
    }

    exports.getBracketsSHA      = getBracketsSHA;
    
    // FIXME (jasonsanjose): Since the move to brackets-shell, can't reliably get SHA for shell.
    // exports._getBracketsShellSHA = getBracketsShellSHA;
});