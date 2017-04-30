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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
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
     * Handler for test.reverseAsync command. Reverses the specified string
     * and then returns the result asynconously.
     * @param {string} s String to reverse.
     * @param {Function} cb Callback function of the form cb(err, response)
     */
    function cmdTestReverseAsync(s, cb) {
        var result = s.split("").reverse().join("");
        process.nextTick(function () {
            cb(null, result);
        });
    }
    
    /**
     * @private
     * Handler for test.reverseAsyncWithProgress command. Reverses the specified string
     * and then returns the result asynconously, but launches progress event before that.
     * @param {string} s String to reverse.
     * @param {Function} cb Callback function of the form cb(err, response)
     * @param {Function} pcb Progress callback function of the form pcb(message)
     */
    function cmdTestReverseAsyncWithProgress(s, cb, pcb) {
        var result = s.split("").reverse().join("");
        process.nextTick(function () {
            pcb("progress");
            process.nextTick(function () {
                cb(null, result);
            });
        });
    }

    /**
     * Initializes the test domain with an additional test command.
     * @param {DomainManager} DomainManager The DomainManager for the server
     */
    function init(DomainManager) {
        _domainManager = DomainManager;
        if (!_domainManager.hasDomain("test")) {
            _domainManager.registerDomain("test", {major: 0, minor: 1});
        }
        _domainManager.registerCommand(
            "test",
            "reverseAsync",
            cmdTestReverseAsync,
            true,
            "reverses the specified string using an async call on the server",
            [{name: "s", type: "string"}],
            [{name: "reversedString", type: "string"}]
        );
        _domainManager.registerCommand(
            "test",
            "reverseAsyncWithProgress",
            cmdTestReverseAsyncWithProgress,
            true,
            "reverses the specified string using an async call on the server and calls a progress event before",
            [{name: "s", type: "string"}],
            [{name: "reversedString", type: "string"}]
        );
    }
    
    exports.init = init;
    
}());
