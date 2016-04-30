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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var BaseServer             = require("LiveDevelopment/Servers/BaseServer").BaseServer,
        LiveDevelopmentUtils   = require("LiveDevelopment/LiveDevelopmentUtils");

    /**
     * Live preview server for user specified server as defined with Live Preview Base Url
     * Project setting. In a clean installation of Brackets, this is the highest priority
     * server provider, if defined.
     *
     * Configuration parameters for this server:
     * - baseUrl      - Optional base URL (populated by the current project)
     * - pathResolver - Function to covert absolute native paths to project relative paths
     * - root         - Native path to the project root (and base URL)
     *
     * @constructor
     * @param {!{baseUrl: string, root: string, pathResolver: function(string)}} config
     * @extends {BaseServer}
     */
    function UserServer(config) {
        BaseServer.call(this, config);
    }

    UserServer.prototype = Object.create(BaseServer.prototype);
    UserServer.prototype.constructor = UserServer;

    /**
     * Determines whether we can serve local file.
     * @param {string} localPath A local path to file being served.
     * @return {boolean} true for yes, otherwise false.
     */
    UserServer.prototype.canServe = function (localPath) {
        // UserServer can only function when the project specifies a base URL
        if (!this._baseUrl) {
            return false;
        }

        // If we can't transform the local path to a project relative path,
        // the path cannot be served
        if (localPath === this._pathResolver(localPath)) {
            return false;
        }

        return LiveDevelopmentUtils.isStaticHtmlFileExt(localPath) ||
            LiveDevelopmentUtils.isServerHtmlFileExt(localPath);
    };

    exports.UserServer = UserServer;
});
