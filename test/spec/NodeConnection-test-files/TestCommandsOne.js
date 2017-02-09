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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    /**
     * @private
     * @type {DomainManager}
     * The DomainManager passed in at init.
     */
    var _domainManager = null;
    
    /**
     * @private
     * Handler for test.reverse command. Reverses the specified string
     * @param {string} s String to reverse.
     * @return {string} Reversed string
     */
    function cmdTestReverse(s) {
        return s.split("").reverse().join("");
    }

    /**
     * @private
     * Handler for test.log command. Calls console.log.
     * @param {string} s String to log
     */
    function cmdTestLog(s) {
        console.log(s);
    }

    /**
     * @private
     * Handler for test.raiseException command. Raises an exception.
     * @param {string} m Message for the Error object that is raised.
     */
    function cmdRaiseException(m) {
        throw new Error(m);
    }

    /**
     * @private
     * Emit eventOne
     */
    function emitEventOne() {
        _domainManager.emitEvent("test", "eventOne", ["foo", "bar"]);
    }

    /**
     * @private
     * Emit eventTwo
     */
    function emitEventTwo() {
        _domainManager.emitEvent("test", "eventOne", ["foo", "bar"]);
    }
    
    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} DomainManager The DomainManager for the server
     */
    function init(DomainManager) {
        _domainManager = DomainManager;
        if (!_domainManager.hasDomain("test")) {
            _domainManager.registerDomain("test", {major: 0, minor: 1});
        }
        _domainManager.registerCommand(
            "test",
            "reverse",
            cmdTestReverse,
            false,
            "reverses the specified string",
            [{name: "s", type: "string"}],
            [{name: "reversedString", type: "string"}]
        );
        _domainManager.registerCommand(
            "test",
            "log",
            cmdTestLog,
            false,
            "calls console.log with the specified message",
            [{name: "message", type: "string"}],
            [] // no return
        );
        _domainManager.registerCommand(
            "test",
            "raiseException",
            cmdRaiseException,
            false,
            "raises a new exception with the specified message",
            [{name: "message", type: "string"}],
            [] // no return
        );
        _domainManager.registerEvent(
            "test",
            "eventOne",
            [
                {name: "argOne", type: "string"},
                {name: "argTwo", type: "string"}
            ]
        );
        _domainManager.registerEvent(
            "test",
            "eventTwo",
            [
                {name: "argOne", type: "boolean"},
                {name: "argTwo", type: "boolean"}
            ]
        );
        _domainManager.registerCommand(
            "test",
            "emitEventOne",
            emitEventOne,
            false,
            "emit eventOne"
        );
        _domainManager.registerCommand(
            "test",
            "emitEventTwo",
            emitEventTwo,
            false,
            "emit eventTwo"
        );
    }
    
    exports.init = init;
    
}());
