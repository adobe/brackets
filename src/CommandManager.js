/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

var CommandManager = {};

CommandManager._commands = {};

/**
 * Registers a global command.
 *
 * @param {string} id The ID of the command.
 * @param {function} command The function to call when the command is executed. Any arguments passed to
 *     execute() (after the id) are passed as arguments to the function.
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
 */
CommandManager.execute = function(id) {
    var command = CommandManager._commands[id];
    if (command) {
        command.apply(null, Array.prototype.slice.call(arguments, 1));
    }
    else {
        console.log("Attempted to call unregistered command: " + id);
    }
}
