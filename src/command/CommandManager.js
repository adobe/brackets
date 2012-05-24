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
    
    /**
     * Map of all registered global commands
     * @type Object.<string, Command>
     */
    var _commands = {};

    /**
     * @constructor
     * @private
     *
     * @param {string} name - text that will be displayed in the UI to represent command
     * @param {string} id
     * @param {function} commandFn - the function that is called when the command is executed.
     * @param {?function} isEnabledFn - callback function that returns true when 
     *      the command is enabled.
     *
     * Events:
     *      enabledStateChange
     *      checkedStateChange
     */
    function Command(name, id, commandFn, isEnabledFn) {
        this._name = name;
        this._id = id;
        this._commandFn = commandFn;
        this._checked = undefined;
        this._enabled = true;
        this._isEnabledFn = isEnabledFn;

    }

    /** @return {Command} */
    Command.prototype.getID = function () {
        return this._id;
    };

    /**
     * Executes the command. Additional arguments are passed to the executing function
     *
     * @return {$.Promise} a jQuery promise that will be resolved when the command completes.
     */
    Command.prototype.execute = function () {
        if (this._commandFn) {
            if (this._isEnabledFn && !this._isEnabledFn()) {
                return (new $.Deferred()).reject().promise();
            }

            var result = this._commandFn.apply(this, arguments);
            if (!result) {
                return (new $.Deferred()).resolve().promise();
            } else {
                return result;
            }
        } else {
            return (new $.Deferred()).reject().promise();
        }
    };

    /** @return {bollean} */
    Command.prototype.getEnabled = function () {
        return this._enabled;
    };

    /** 
     * Sets enabled state of Command and dispatches "enabledStateChange"
     * when the enabled state changes.
     * @param {boolean} enabled
     */
    Command.prototype.setEnabled = function (enabled) {
        var changed = this._enabled !== enabled;
        this._enabled = enabled;

        if (changed) {
            $(this).triggerHandler("enabledStateChange");
        }
    };

    /** @return {boolean} */
    Command.prototype.getChecked = function () {
        return this._checked;
    };

    /**
     * Sets the name of the Command and dispatches "nameChange" so that
     * UI that reflects the command name can update.
     * @param {string} name
     */
    Command.prototype.setName = function (name) {
        var changed = this._enabled !== enabled;
        this._name = name;

        if (changed) {
            $(this).triggerHandler("nameChange");
        }
    }

    /** @return {string} */
    Command.prototype.getName = function () {
        return this._name;
    }

    /** 
     * Sets enabled state of Command and dispatches "checkedStateChange"
     * when the enabled state changes.
     * @param {boolean} checked
     */
    Command.prototype.setChecked = function (checked) {
        var changed = this._checked !== checked;
        this._checked = checked;

        if (changed) {
            $(this).triggerHandler("checkedStateChange");
        }
    };

    /**
     * Registers a global command.
     * @param {string} name - text that will be displayed in the UI to represent command
     * @param {string} id - unique identifier for command. Plugins should use the 
     *      following format"author-myplugin-mycommandname".
     * @param {function(...)} commandFn - the function to call when the command is executed. Any arguments passed to
     *     execute() (after the id) are passed as arguments to the function. If the function is asynchronous,
     *     it must return a jQuery promise that is resolved when the command completes. Otherwise, the
     *     CommandManager will assume it is synchronous, and return a promise that is already resolved.
     * @return {Command}
     */
    function register( name, id, commandFn) {
        if (_commands[id]) {
            throw new Error("Attempting to register an already-registered command: " + id);
        }
        if (!name || !id || !commandFn) {
            throw new Error("Attempting to register a command with a missing name, id, or command function");
        }

        var command = new Command(name, id, commandFn);
        _commands[id] = command;
        return command;
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
     * Looks up and runs a global command. Additional arguments are passed to the command.
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
});