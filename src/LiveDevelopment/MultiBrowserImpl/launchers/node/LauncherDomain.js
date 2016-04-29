/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */

(function () {
    "use strict";

    var open = require("open");

    /**
     * @private
     * The Brackets domain manager for registering node extensions.
     * @type {?DomainManager}
     */
    var _domainManager;

    /**
     * Launch the given URL in the system default browser.
	 * TODO: it now launching just on default browser, add launchers for specific browsers.
     * @param {string} url
     */
    function _cmdLaunch(url) {
        open(url);
    }


    /**
     * Initializes the domain and registers commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        _domainManager = domainManager;
        if (!domainManager.hasDomain("launcher")) {
            domainManager.registerDomain("launcher", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "launcher",      // domain name
            "launch",       // command name
            _cmdLaunch,     // command handler function
            false,          // this command is synchronous in Node
            "Launches a given HTML file in the browser for live development",
            [
                { name: "url", type: "string", description: "file:// url to the HTML file" },
                { name: "browser", type: "string", description: "browser name"}
            ],
            []
        );
    }

    exports.init = init;

}());
