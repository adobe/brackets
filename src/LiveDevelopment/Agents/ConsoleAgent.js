/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 * @author Jonathan Diehl <jdiehl@adobe.com>
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define */

/**
 * ConsoleAgent forwards all console message from the remote console to the
 * local console.
 */
define(function ConsoleAgent(require, exports, module) {
    'use strict';

    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    var _lastMessage; // {Console.ConsoleMessage} the last received message

    /** Log a remote message to the local console
     * @param {Console.ConsoleMessage} message
     */
    function _log(message) {
        var level = message.level;
        if (level === "warning") {
            level = "warn";
        }
        var text = "ConsoleAgent: " + message.text;
        if (message.stackTrace) {
            var callFrame = message.stackTrace[0];
            text += " in " + callFrame.functionName + ":" + callFrame.columnNumber;
        }
        console[level](text);
    }

    // WebInspector Event: Console.messageAdded
    function _onMessageAdded(res) {
        // res = {message}
        _lastMessage = res.message;
        _log(_lastMessage);
    }

    // WebInspector Event: Console.messageRepeatCountUpdated
    function _onMessageRepeatCountUpdated(res) {
        // res = {count}
        if (_lastMessage) {
            _log(_lastMessage);
        }
    }

    // WebInspector Event: Console.messagesCleared
    function _onMessagesCleared(res) {
        // res = {}
    }

    /** Initialize the agent */
    function load() {
        Inspector.Console.enable();
        Inspector.on("Console.messageAdded", _onMessageAdded);
        Inspector.on("Console.messageRepeatCountUpdated", _onMessageRepeatCountUpdated);
        Inspector.on("Console.messagesCleared", _onMessagesCleared);
    }

    /** Clean up */
    function unload() {
        Inspector.off("Console.messageAdded", _onMessageAdded);
        Inspector.off("Console.messageRepeatCountUpdated", _onMessageRepeatCountUpdated);
        Inspector.off("Console.messagesCleared", _onMessagesCleared);
    }

    // Export public functions
    exports.load = load;
    exports.unload = unload;
});