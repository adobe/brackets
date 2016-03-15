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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var AppInit              = brackets.getModule("utils/AppInit"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        LiveDevServerManager = brackets.getModule("LiveDevelopment/LiveDevServerManager"),
        NodeDomain           = brackets.getModule("utils/NodeDomain"),
        ProjectManager       = brackets.getModule("project/ProjectManager"),
        StaticServer         = require("StaticServer");

    /**
     * @private
     * @type {string} fullPath of the StaticServerDomain implementation
     */
    var _domainPath = ExtensionUtils.getModulePath(module, "node/StaticServerDomain");

    /**
     * @private
     * @type {NodeDomain}
     */
    var _nodeDomain = new NodeDomain("staticServer", _domainPath);

    /**
     * @private
     * @return {StaticServerProvider} The singleton StaticServerProvider initialized
     * on app ready.
     */
    function _createStaticServer() {
        var config = {
            nodeDomain      : _nodeDomain,
            pathResolver    : ProjectManager.makeProjectRelativeIfPossible,
            root            : ProjectManager.getProjectRoot().fullPath
        };

        return new StaticServer(config);
    }

    AppInit.appReady(function () {
        LiveDevServerManager.registerServer({ create: _createStaticServer }, 5);
    });

    // For unit tests only
    exports._getStaticServerProvider = _createStaticServer;
    exports._nodeDomain = _nodeDomain;
});
