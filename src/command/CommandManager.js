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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

 /**
  * Manages global application commands that can be called from menu items, key bindings, or subparts
  * of the application.
  */
define(function (require, exports, module) {
    'use strict';
    
    var _commands = {};

    /**
     * Registers a global command.
     *
     * @param {string} id The ID of the command.
     * @param {function(...)} command The function to call when the command is executed. Any arguments passed to
     *     execute() (after the id) are passed as arguments to the function. If the function is asynchronous,
     *     it must return a jQuery Deferred that is resolved when the command completes. Otherwise, the
     *     CommandManager will assume it is synchronous, and return a Deferred that is already resolved.
     */
    function register(id, command) {
        if (_commands[id]) {
            throw new Error("Attempting to register an already-registered command: " + id);
        }
        if (!id || !command) {
            throw new Error("Attempting to register a command with a bad id or function");
        }
        _commands[id] = command;
    }

    /**
     * Runs a global command. Additional arguments are passed to the command.
     *
     * @param {string} id The ID of the command to run.
     * @return {Deferred} a jQuery Deferred that will be resolved when the command completes.
     */
    function execute(id) {
        var command = _commands[id];
        if (command) {
            var result = command.apply(null, Array.prototype.slice.call(arguments, 1));
            if (!result) {
                return (new $.Deferred()).resolve();
            } else {
                return result;
            }
        } else {
            return (new $.Deferred()).reject();
        }
    }

    // Define public API
    exports.register = register;
    exports.execute = execute;
});