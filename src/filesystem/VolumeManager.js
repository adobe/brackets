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
/*global define, $, appshell */

define(function (require, exports, module) {
    "use strict";
    
    var FileSystem          = require("filesystem/FileSystem"),
        Trie                = require("utils/Trie");
    
    // File system impls. These should be mixed in instead of being hard-coded here.
    var appshellFileSystem  = require("filesystem/impls/appshell/AppshellFileSystem"),
        dropboxFileSystem   = require("filesystem/impls/dropbox/DropboxFileSystem");
    
    var _volumes = new Trie("/");

    function attachVolume(path, volume) {
        if (_volumes.containsPath(path)) {
            throw new Error("Volume already attached at path: ", path);
        } else if (_volumes.containsPrefix(path)) {
            throw new Error("Volume already attached below path: ", path);
        }
        
        var node = _volumes.addWord(path);
        node.volume = volume;
    }
    
    function detachVolume(path) {
        var node = _volumes.getWord(path);
        if (!node) {
            throw new Error("No volume attached at path: ", path);
        } else if (node.hasChildren()) {
            throw new Error("Cannot detach volume at path with attached children: ", path);
        }
        
        _volumes.removeWord(path);
    }
    
    function getVolumeForPath(path) {
        var node = _volumes.getPrefix(path);
        
        if (!node) {
            throw new Error("No volume for path: ", path);
        }
        
        return node.volume;
    }
    
    function resolve(path) {
        var volume = getVolumeForPath(path);
        return volume.resolve(path);
    }

    exports.attachVolume = attachVolume;
    exports.detachVolume = detachVolume;
    exports.getVolumeForPath = getVolumeForPath;
    exports.resolve = resolve;
});
