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
/*jslint nomen:true */
/*global module, require, process */
module.exports = function (grunt) {
    "use strict";

    var common      = {},
        path        = require("path"),
        _platform;
        
    function writeJSON(grunt, path, obj) {
        grunt.file.write(path, JSON.stringify(obj, null, "    "));
    }

    function resolve(relPath) {
        return path.resolve(process.cwd(), relPath);
    }
        
    function platform() {
        if (!_platform) {
            if (process.platform === "darwin") {
                _platform = "mac";
            } else if (process.platform === "win32") {
                _platform = "win";
            } else {
                _platform = "linux";
            }
        }

        return _platform;
    }

    common.writeJSON    = writeJSON;
    common.resolve      = resolve;
    common.platform     = platform;

    return common;
};
