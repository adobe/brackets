/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

define(function(require, exports, module) {
    
    /**
     * Manages global application commands that can be called from menu items, key bindings, or subparts
     * of the application.
     */
    var CommandManager = {};

    CommandManager._commands = {};

    /**
     * Registers a global command.
     *
     * @param {string} id The ID of the command.
     * @param {function} command The function to call when the command is executed. Any arguments passed to
     *     execute() (after the id) are passed as arguments to the function. If the function is asynchronous,
     *     it must return a jQuery Deferred that is resolved when the command completes. Otherwise, the
     *     CommandManager will assume it is synchronous, and return a Deferred that is already resolved.
     */
    CommandManager.register = function(id, command) {
        if (CommandManager._commands[id]) {
            throw new Error("Attempting to register an already-registered command: " + id);
        }
        CommandManager._commands[id] = command;
    }

    /**
     * Runs a global command. Additional arguments are passed to the command.
     *
     * @param {string} id The ID of the command to run.
     * @return {Deferred} a jQuery Deferred that will be resolved when the command completes.
     */
    CommandManager.execute = function(id) {
        var command = CommandManager._commands[id];
        if (command) {
            var result = command.apply(null, Array.prototype.slice.call(arguments, 1));
            if (result === undefined) {
                return (new $.Deferred()).resolve();
            }
            else {
                return result;
            }
        }
        else {
            console.log("Attempted to call unregistered command: " + id);
            return (new $.Deferred()).reject();
        }
    }
    
    exports.CommandManager = CommandManager;
});