/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var BaseServer           = require("LiveDevelopment/Servers/BaseServer").BaseServer,
        LiveDevelopmentUtils = require("LiveDevelopment/LiveDevelopmentUtils");

    // The path on Windows starts with a drive letter (e.g. "C:").
    // In order to make it a valid file: URL we need to add an
    // additional slash to the prefix.
    var PREFIX = (brackets.platform === "win") ? "file:///" : "file://";

    /**
     * Server for file: URLs
     *
     * Configuration parameters for this server:
     * - baseUrl      - Optional base URL (populated by the current project)
     * - pathResolver - Function to covert absolute native paths to project relative paths
     * - root         - Native path to the project root (and base URL)
     *
     * @constructor
     * @param {!{baseUrl: string, root: string, pathResolver: function(string): string}} config
     * @extends {BaseServer}
     */
    function FileServer(config) {
        BaseServer.call(this, config);
    }

    FileServer.prototype = Object.create(BaseServer.prototype);
    FileServer.prototype.constructor = FileServer;

    /**
     * Determines whether we can serve local file.
     * @param {string} localPath A local path to file being served.
     * @return {boolean} true for yes, otherwise false.
     */
    FileServer.prototype.canServe = function (localPath) {
        // FileServer requires that the base URL is undefined and static HTML files
        return (!this._baseUrl && LiveDevelopmentUtils.isStaticHtmlFileExt(localPath));
    };

    /**
     * Convert a file: URL to a absolute file path
     * @param {string} url
     * @return {?string} The absolute path for given file: URL or null if the path is
     *  not a descendant of the project.
     */
    FileServer.prototype.urlToPath = function (url) {
        if (url.indexOf(PREFIX) === 0) {
            // Convert a file URL to local file path
            return decodeURI(url.slice(PREFIX.length));
        }

        return null;
    };

    /**
     * Returns a file: URL for a given absolute path
     * @param {string} path Absolute path to covert to a file: URL
     * @return {string} Converts an absolute path within the project root to a file: URL.
     */
    FileServer.prototype.pathToUrl = function (path) {
        return encodeURI(PREFIX + path);
    };

    exports.FileServer = FileServer;
});
