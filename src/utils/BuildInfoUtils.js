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
/*global define, $ */

/**
 * Utilities for determining the current "build number" / version
 */
define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem    = require("file/NativeFileSystem"),
        FileUtils           = require("file/FileUtils");
    
    
    var _bracketsSHA = null;
    var _bracketsAppSHA = null;
    
    /**
     * @return {?string} the Git SHA of the brackets submodule at the time when Brackets launched,
     *      or null if no Git metadata was found on disk.
     */
    function getBracketsSHA() {
        return _bracketsSHA;
    }
    
    /**
     * @return {?string} the Git SHA of the brackets-app module at the time when Brackets launched,
     *      or null if no Git metadata was found on disk.
     */
    function getBracketsAppSHA() {
        return _bracketsAppSHA;
    }
    
    
    /**
     * Loads a SHA from Git metadata file. If the file contains a symbolic ref name, follows the ref
     * and loads the SHA from that file in turn.
     */
    function _loadSHA(path, callback) {
        var fileEntry = new NativeFileSystem.FileEntry(path);
        var reader = new NativeFileSystem.FileReader();
        
        var result = new $.Deferred();
        
        // HEAD contains a SHA in detached-head mode; otherwise it contains a relative path
        // to a file in /refs which in turn contains the SHA
        fileEntry.file(function (file) {
            reader.onload = function (event) {
                var text = event.target.result;
                
                if (text.indexOf("ref: ") === 0) {
                    var basePath = path.substr(0, path.lastIndexOf("/"));
                    var refRelPath = text.substr(5).trim();
                    _loadSHA(basePath + "/" + refRelPath, callback)
                        .pipe(result.resolve, result.reject);
                } else {
                    result.resolve(text);
                }
            };
            reader.onerror = function (event) {
                result.reject();
            };
            
            reader.readAsText(file, "utf8");
        });
        
        return result.promise();
    }
    
    function init() {
        // Look for Git metadata on disk to load the SHAs for 'brackets' and 'brackets-app'. Done on
        // startup instead of on demand because the version that's currently running is what was
        // loaded at startup (the src on disk may be updated to a different version later).
        // Git metadata may be missing (e.g. in the per-sprint ZIP builds) - silently ignore if so.
        var bracketsSrc = FileUtils.getNativeBracketsDirectoryPath();
        var bracketsGitRoot = bracketsSrc + "/../../.git/";
        var bracketsSubmoduleRoot_inParent = bracketsGitRoot + "modules/brackets/";
        var bracketsSubmoduleRoot_inSubmodule = bracketsSrc + "/../.git/";
        
        _loadSHA(bracketsGitRoot + "HEAD")
            .done(function (text) {
                _bracketsAppSHA = text;
            });
        
        // brackets submodule metadata may be in brackets/.git OR a subfolder of brackets-app/.git,
        // so try both locations
        _loadSHA(bracketsSubmoduleRoot_inSubmodule + "HEAD")
            .done(function (text) {
                _bracketsSHA = text;
            })
            .fail(function () {
                _loadSHA(bracketsSubmoduleRoot_inParent + "HEAD")
                    .done(function (text) {
                        _bracketsSHA = text;
                    });
            });
    }
    
    
    // Define public API
    exports.init                = init;
    exports.getBracketsSHA      = getBracketsSHA;
    exports.getBracketsAppSHA   = getBracketsAppSHA;
});