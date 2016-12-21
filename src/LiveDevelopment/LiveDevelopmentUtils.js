/*
 * Copyright (c) 2015 Adobe Systems Incorporated. All rights reserved.
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
/*global define */

/**
 * Set of utilities for working with files and text content.
 */
define(function (require, exports, module) {
    "use strict";

    var LanguageManager = require("language/LanguageManager"),
        ProjectManager  = require("project/ProjectManager");

    /**
     * File extensions - hard-coded for now, but may want to make these preferences
     * @const {Array.<string>}
     */
    var _staticHtmlFileExts = ["htm", "html", "xhtml"],
        _serverHtmlFileExts = ["php", "php3", "php4", "php5", "phtm", "phtml", "cfm", "cfml", "asp", "aspx", "jsp", "jspx", "shtm", "shtml"];

    /**
     * Determine if file extension is a static html file extension.
     * @param {string} filePath could be a path, a file name or just a file extension
     * @return {boolean} Returns true if fileExt is in the list
     */
    function isStaticHtmlFileExt(filePath) {
        if (!filePath) {
            return false;
        }

        return (_staticHtmlFileExts.indexOf(LanguageManager.getLanguageForPath(filePath).getId()) !== -1);
    }

    /**
     * Determine if file extension is a server html file extension.
     * @param {string} filePath could be a path, a file name or just a file extension
     * @return {boolean} Returns true if fileExt is in the list
     */
    function isServerHtmlFileExt(filePath) {
        if (!filePath) {
            return false;
        }

        return (_serverHtmlFileExts.indexOf(LanguageManager.getLanguageForPath(filePath).getId()) !== -1);
    }

    /**
     * Returns true if we think the given extension is for an HTML file.
     * @param {string} ext The extension to check.
     * @return {boolean} true if this is an HTML extension.
     */
    function isHtmlFileExt(ext) {
        return (isStaticHtmlFileExt(ext) ||
                (ProjectManager.getBaseUrl() && isServerHtmlFileExt(ext)));
    }

    // Define public API
    exports.isHtmlFileExt       = isHtmlFileExt;
    exports.isStaticHtmlFileExt = isStaticHtmlFileExt;
    exports.isServerHtmlFileExt = isServerHtmlFileExt;
});
