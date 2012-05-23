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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

 /**
  * Manages global application commands that can be called from menu items, key bindings, or subparts
  * of the application.
  */
define(function (require, exports, module) {
    'use strict';
    
    var _commands = {};

    /**
     * TODO
     *
     * Events:
     *      commandEnabledStateChanged
     */
    function Command(id, command, enabledCallback) {
        this._id = id;
        this._command = command;
        this._checked = undefined;
        this._enabled = true;
        this._enabledCallback = enabledCallback;

    }

    Command.prototype.getID = function () {
        return this._id;
    };

    Command.prototype.execute = function () {
        if (this._command) {
            if (this._command._enabledCallback && !this._command._enabledCallback()) {
                return (new $.Deferred()).reject().promise();
            }

            var result = this._command.apply(this, arguments);
            if (!result) {
                return (new $.Deferred()).resolve().promise();
            } else {
                return result;
            }
        } else {
            return (new $.Deferred()).reject().promise();
        }
    };

    Command.prototype.getEnabled = function () {
        return this._enabled;
    };

    Command.prototype.setEnabled = function (enabled) {
        this._enabled = enabled;

        $(this).triggerHandler("commandEnabledStateChanged");
    };

    Command.prototype.getChecked = function () {
        return this._checked;
    };

    Command.prototype.setChecked = function (checked) {
        this._checked = checked;

        $(this).triggerHandler("commandCheckedStateChanged");
    };

    /**
     * Registers a global command.
     *
     * @param {string} id The ID of the command.
     * @param {function(...)} command The function to call when the command is executed. Any arguments passed to
     *     execute() (after the id) are passed as arguments to the function. If the function is asynchronous,
     *     it must return a jQuery promise that is resolved when the command completes. Otherwise, the
     *     CommandManager will assume it is synchronous, and return a promise that is already resolved.
     * @return {Command}
     */
    function register(id, command) {
        if (_commands[id]) {
            throw new Error("Attempting to register an already-registered command: " + id);
        }
        if (!id || !command) {
            throw new Error("Attempting to register a command with a bad id or function");
        }

        var commandObj = new Command(id, command);
        _commands[id] = commandObj;
        return commandObj;
    }

    /**
     * Retrieves a Command object by id
     * @param {string} id
     * @return {Command}
     */
    function get(id) {
        return _commands[id];
    }

    /**
     * Runs a global command. Additional arguments are passed to the command.
     *
     * @param {string} id The ID of the command to run.
     * @return {$.Promise} a jQuery promise that will be resolved when the command completes.
     */
    function execute(id) {
        var command = _commands[id];
        if (command) {
            return command.execute.apply(command, Array.prototype.slice.call(arguments, 1));
        } else {
            return (new $.Deferred()).reject().promise();
        }
    }

    // Define public API
    exports.register = register;
    exports.execute = execute;
    exports.get = get;
    exports.Command = Command;
});