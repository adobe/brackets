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

    var AppInit        = brackets.getModule("utils/AppInit"),
        Menus          = brackets.getModule("command/Menus"),
        Commands       = brackets.getModule("command/Commands"),
        CommandManager = brackets.getModule("command/CommandManager"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection = brackets.getModule("utils/NodeConnection");

    /**
     * @private
     * @type{NodeConnection}
     * Connection to node
     */
    var _nodeConnection = null;

    /**
     * @private
     * Handler for "Serve Project Directory" menu item.
     * Calls connect.startServer to start a new server at the project root
     */
    function startServer() {
        _nodeConnection.domains.connect.startServer(
            ProjectManager.getProjectRoot().fullPath
        ).then(function (address) {
            alert("serving on http://" + address.address + ":" + address.port);
        });
    }

    /**
     * @private
     * Helper function to register commands and add them to the File menu
     * Called after the "connect" domain is successfully registered
     */
    function setupMenu() {
        var ID_CONNECT_SERVE_PROJECT   = "brackets.connect.serveProject";
        var NAME_CONNECT_SERVE_PROJECT = "Serve Project Directory";
        
        CommandManager.register(
            NAME_CONNECT_SERVE_PROJECT,
            ID_CONNECT_SERVE_PROJECT,
            startServer
        );
        
        var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
        menu.addMenuItem(ID_CONNECT_SERVE_PROJECT,
                         null,
                         Menus.BEFORE,
                         Commands.FILE_PROJECT_SETTINGS);
    }
    
    AppInit.appReady(function () {
        // Create a new node connection and register our "connect" domain
        _nodeConnection = new NodeConnection();
        _nodeConnection.connect(true).then(function () {
            _nodeConnection.loadDomains(
                [ExtensionUtils.getModulePath(module, "node/ConnectDomain")],
                true
            ).then(
                setupMenu,
                function () { console.error(arguments); }
            );
        });

    });

});
