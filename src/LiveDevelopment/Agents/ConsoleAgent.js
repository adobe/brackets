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