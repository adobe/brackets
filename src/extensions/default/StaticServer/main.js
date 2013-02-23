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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global $, define, brackets */

define(function (require, exports, module) {
    "use strict";

    var AppInit             = brackets.getModule("utils/AppInit"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        HttpServerManager   = brackets.getModule("LiveDevelopment/HttpServerManager"),
        NodeConnection      = brackets.getModule("utils/NodeConnection"),
        ProjectManager      = brackets.getModule("project/ProjectManager");

    /**
     * @private
     * @type{NodeConnection}
     * Connection to node
     */
    var _nodeConnection = null,
        baseUrlMap      = {};

    /**
     * @private
     * Handler for "Serve Project Directory" menu item.
     * Calls connect.startServer to start a new server at the project root
     */
    function startServer() {
        if (_nodeConnection) {
            var projectPath = ProjectManager.getProjectRoot().fullPath;
            _nodeConnection.domains.connect.startServer(
                projectPath
            ).then(function (address) {
                // TODO: need to make protocol configurable?
                baseUrlMap[projectPath] = "http://" + address.address + ":" + address.port + "/";
            });
        }
    }

    
    /**
     * @constructor
     */
    function StaticHttpServerProvider() {}
    
    /**
     * Determines whether we can serve file type.
     * 
     * @param {String} url 
     * A url to file being served.
     *
     * @return {Boolean} 
     * true for yes, otherwise false.
     */
    StaticHttpServerProvider.prototype.canServe = function (url) {
        // url ending in / implies default file, which is usually
        // index.html, so HttpServerManager we can server it
        if (url.match(/\/$/)) {
            return true;
        }
        
        // TODO: do a MIME Type lookup on file extension
        return FileUtils.isStaticHtmlFileExt(url);
    };
       
    /**
     * Returns a base url for current project. 
     *
     * @return {String}
     * Base url for current project.
     */
    StaticHttpServerProvider.prototype.getBaseUrl = function () {
        return baseUrlMap[ProjectManager.getProjectRoot().fullPath];
    };

    // TODO: instead of opening a server for every project, should we
    // close old one so there's only 1 open?
    function _projectOpen() {
        if (!baseUrlMap[ProjectManager.getProjectRoot().fullPath]) {
            startServer();
        }
    }

    AppInit.appReady(function () {
        // Create a new node connection and register our "connect" domain
        _nodeConnection = new NodeConnection();
        _nodeConnection.connect(true).then(function () {
            _nodeConnection.loadDomains(
                [ExtensionUtils.getModulePath(module, "node/ConnectDomain")],
                true
            ).then(
                startServer,
                function () { console.error(arguments); }
            );
        });

        // Register as http server provider
        var staticHttpServerProvider = new StaticHttpServerProvider();
        HttpServerManager.registerProvider(staticHttpServerProvider, 5);
    });

    $(ProjectManager).on("projectOpen", _projectOpen);
});
