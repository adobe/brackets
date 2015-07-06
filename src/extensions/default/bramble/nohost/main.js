/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var LiveDevServerManager = brackets.getModule("LiveDevelopment/LiveDevServerManager");
    var ProjectManager       = brackets.getModule("project/ProjectManager");    
    var HTMLServer           = require("nohost/HTMLServer").HTMLServer;
    var StaticServer         = require("nohost/StaticServer").StaticServer;

    var _HTMLServer;
    var _StaticServer;

    // Server for HTML files only
    function getHTMLServer() {
        if (!_HTMLServer) {
            _HTMLServer = new HTMLServer({
                pathResolver    : ProjectManager.makeProjectRelativeIfPossible,
                root            : ProjectManager.getProjectRoot()
            });
        }
        return _HTMLServer;
    }

    // Server for non-HTML files only
    function _getStaticServer() {
        if (!_StaticServer) {
            _StaticServer = new StaticServer({
                pathResolver    : ProjectManager.makeProjectRelativeIfPossible,
                root            : ProjectManager.getProjectRoot()
            });
        }
        return _StaticServer;
    }

    function init() {
        LiveDevServerManager.registerServer({ create: _getStaticServer }, 9000);
        LiveDevServerManager.registerServer({ create: getHTMLServer    }, 9001);        
    }

    exports.init = init;
    exports.getHTMLServer = getHTMLServer;
});
