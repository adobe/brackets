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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

 /**
  * Manages global application commands that can be called from menu items, key bindings, or subparts
  * of the application.
  *
  * This module dispatches these event(s):
  *    - commandRegistered  -- when a new command is registered
  *    - beforeExecuteCommand -- before dispatching a command
  */
define(function (require, exports, module) {
    "use strict";

    var EventDispatcher = require("utils/EventDispatcher");


    /**
     * Map of all registered global commands
     * @type {Object.<commandID: string, Command>}
     */
    var _commands = {};

    /**
     * Temporary copy of commands map for restoring after testing
     * TODO (issue #1039): implement separate require contexts for unit tests
     * @type {Object.<commandID: string, Command>}
     */
    var _commandsOriginal = {};

    /**
     * Events:
     * - enabledStateChange
     * - checkedStateChange
     * - keyBindingAdded
     * - keyBindingRemoved
     *
     * @constructor
     * @private
     * @param {string} name - text that will be displayed in the UI to represent command
     * @param {string} id
     * @param {function} commandFn - the function that is called when the command is executed.
     *
     * TODO: where should this be triggered, The Command or Exports?
     */
    function Command(name, id, commandFn) {
        this._name = name;
        this._id = id;
        this._commandFn = commandFn;
        this._checked = undefined;
        this._enabled = true;
    }
    EventDispatcher.makeEventDispatcher(Command.prototype);

    /**
     * Get command id
     * @return {string}
     */
    Command.prototype.getID = function () {
        return this._id;
    };

    /**
     * Executes the command. Additional arguments are passed to the executing function
     *
     * @return {$.Promise} a jQuery promise that will be resolved when the command completes.
     */
    Command.prototype.execute = function () {
        if (!this._enabled) {
            return (new $.Deferred()).reject().promise();
        }

        var result = this._commandFn.apply(this, arguments);
        if (!result) {
            // If command does not return a promise, assume that it handled the
            // command and return a resolved promise
            return (new $.Deferred()).resolve().promise();
        } else {
            return result;
        }
    };

    /**
     * Is command enabled?
     * @return {boolean}
     */
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
            this.trigger("enabledStateChange");
        }
    };

    /**
     * Sets enabled state of Command and dispatches "checkedStateChange"
     * when the enabled state changes.
     * @param {boolean} checked
     */
    Command.prototype.setChecked = function (checked) {
        var changed = this._checked !== checked;
        this._checked = checked;

        if (changed) {
            this.trigger("checkedStateChange");
        }
    };

    /**
     * Is command checked?
     * @return {boolean}
     */
    Command.prototype.getChecked = function () {
        return this._checked;
    };

    /**
     * Sets the name of the Command and dispatches "nameChange" so that
     * UI that reflects the command name can update.
     *
     * Note, a Command name can appear in either HTML or native UI
     * so HTML tags should not be used. To add a Unicode character,
     * use \uXXXX instead of an HTML entity.
     *
     * @param {string} name
     */
    Command.prototype.setName = function (name) {
        var changed = this._name !== name;
        this._name = name;

        if (changed) {
            this.trigger("nameChange");
        }
    };

    /**
     * Get command name
     * @return {string}
     */
    Command.prototype.getName = function () {
        return this._name;
    };



    /**
     * Registers a global command.
     * @param {string} name - text that will be displayed in the UI to represent command
     * @param {string} id - unique identifier for command.
     *      Core commands in Brackets use a simple command title as an id, for example "open.file".
     *      Extensions should use the following format: "author.myextension.mycommandname".
     *      For example, "lschmitt.csswizard.format.css".
     * @param {function(...)} commandFn - the function to call when the command is executed. Any arguments passed to
     *     execute() (after the id) are passed as arguments to the function. If the function is asynchronous,
     *     it must return a jQuery promise that is resolved when the command completes. Otherwise, the
     *     CommandManager will assume it is synchronous, and return a promise that is already resolved.
     * @return {?Command}
     */
    function register(name, id, commandFn) {
        if (_commands[id]) {
            console.log("Attempting to register an already-registered command: " + id);
            return null;
        }
        if (!name || !id || !commandFn) {
            console.error("Attempting to register a command with a missing name, id, or command function:" + name + " " + id);
            return null;
        }

        var command = new Command(name, id, commandFn);
        _commands[id] = command;

        exports.trigger("commandRegistered", command);

        return command;
    }

    /**
     * Registers a global internal only command.
     * @param {string} id - unique identifier for command.
     *      Core commands in Brackets use a simple command title as an id, for example "app.abort_quit".
     *      Extensions should use the following format: "author.myextension.mycommandname".
     *      For example, "lschmitt.csswizard.format.css".
     * @param {function(...)} commandFn - the function to call when the command is executed. Any arguments passed to
     *     execute() (after the id) are passed as arguments to the function. If the function is asynchronous,
     *     it must return a jQuery promise that is resolved when the command completes. Otherwise, the
     *     CommandManager will assume it is synchronous, and return a promise that is already resolved.
     * @return {?Command}
     */
    function registerInternal(id, commandFn) {
        if (_commands[id]) {
            console.log("Attempting to register an already-registered command: " + id);
            return null;
        }
        if (!id || !commandFn) {
            console.error("Attempting to register an internal command with a missing id, or command function: " + id);
            return null;
        }

        var command = new Command(null, id, commandFn);
        _commands[id] = command;

        exports.trigger("commandRegistered", command);

        return command;
    }

    /**
     * Clear all commands for unit testing, but first make copy of commands so that
     * they can be restored afterward
     */
    function _testReset() {
        _commandsOriginal = _commands;
        _commands = {};
    }

    /**
     * Restore original commands after test and release copy
     */
    function _testRestore() {
        _commands = _commandsOriginal;
        _commandsOriginal = {};
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
     * Returns the ids of all registered commands
     * @return {Array.<string>}
     */
    function getAll() {
        return Object.keys(_commands);
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
            try {
                exports.trigger("beforeExecuteCommand", id);
            } catch (err) {
                console.error(err);
            }

            return command.execute.apply(command, Array.prototype.slice.call(arguments, 1));
        } else {
            return (new $.Deferred()).reject().promise();
        }
    }

    EventDispatcher.makeEventDispatcher(exports);

    // Define public API
    exports.register            = register;
    exports.registerInternal    = registerInternal;
    exports.execute             = execute;
    exports.get                 = get;
    exports.getAll              = getAll;
    exports._testReset          = _testReset;
    exports._testRestore        = _testRestore;
});
