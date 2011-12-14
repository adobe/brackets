/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

var CommandManager = {};

CommandManager._commands = {};

/**
 * Registers a global command.
 *
 * @param id {string} The ID of the command.
 * @param command {function} The function to call when the command is executed.
 */
CommandManager.register = function(id, command) {
    CommandManager._commands[id] = command;
}

/**
 * Runs a global command. Additional arguments are passed to the command.
 *
 * @param id {string} The ID of the command to run.
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
