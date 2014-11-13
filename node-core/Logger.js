/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var fs           = require("fs"),
        util         = require("util"),
        EventEmitter = require("events").EventEmitter;
    
    /** 
     * @constructor
     * The Logger module is a singleton object used for logging.
     * Logger inherits from the EventEmitter class and exports itself
     * as the module.
     */
    var Logger = module.exports = new EventEmitter();
    
    /**
     * @private
     * @type{?string}
     * Filename to append all log data to.
     */
    var _logFilename = null;

    /**
     * @private
     * @type{Array.<{level: string, timestamp: Date, message: string}>}
     * Complete log history
     */
    var _logHistory = [];
    
    /**
     * @private
     * Helper function for logging functions. Handles string formatting.
     * @param {string} level Log level ("log", "info", etc.)
     * @param {Array.<Object>} Array of objects for logging. Works identically
     *    to how objects can be passed to console.log. Uses util.format to
     *    format into a single string.
     */
    function logReplacement(level, args) {
        var message = util.format.apply(null, args);
        var timestamp = new Date();
        if (_logFilename) {
            try {
                var timestampString =
                    "[" + level + ": " +
                    timestamp.toLocaleTimeString() + "] ";

                fs.appendFileSync(_logFilename,
                                  timestampString + message + "\n");
            } catch (e) { }
        }
        _logHistory.push({
            level: level,
            timestamp: timestamp,
            message: message
        });
        Logger.emit("log", level, timestamp, message);
    }
    
    /**
     * Log a "log" message
     * @param {...Object} log arguments as in console.log etc.
     *    First parameter can be a "format" string.
     */
    function log() { logReplacement("log", arguments); }

    /**
     * Log an "info" message
     * @param {...Object} log arguments as in console.log etc.
     *    First parameter can be a "format" string.
     */
    function info() { logReplacement("info", arguments); }

    /**
     * Log a "warn" message
     * @param {...Object} log arguments as in console.log etc.
     *    First parameter can be a "format" string.
     */
    function warn() { logReplacement("warn", arguments); }

    /**
     * Log an "error" message
     * @param {...Object} log arguments as in console.log etc.
     *    First parameter can be a "format" string.
     */
    function error() { logReplacement("error", arguments); }

    /**
     * Log a "dir" message
     * @param {...Object} log arguments as in console.dir
     *    Note that (just like console.dir) this does NOT do string
     *    formatting using the first argument.
     */
    function dir() {
        // dir does not do optional string formatting
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift("%s");
        logReplacement("dir", args);
    }
    
    /**
     * Remaps the console.log, etc. functions to the logging functions
     * defined in this module. Useful so that modules can simply call
     * console.log to call into this Logger (since client doesn't have)
     * access to stdout.
     */
    function remapConsole() {
        // Reassign logging functions to our logger
        // NOTE: console.timeEnd uses console.log and console.trace uses
        // console.error, so we don't need to change it explicitly
        console.log   = log;
        console.info  = info;
        console.warn  = warn;
        console.error = error;
        console.dir   = dir;
    }
    
    /**
     * Retrieves the entire log history
     * @return {Array.<{level: string, timestamp: Date, message: string}>}
     */
    function getLogHistory(count) {
        if (count === null) {
            count = 0;
        }
        return _logHistory.slice(-count);
    }
    
    /**
     * Sets the filename to which the log messages are appended.
     * Specifying a null filename will turn off logging to a file.
     * @param {?string} filename The filename.
     */
    function setLogFilename(filename) {
        _logFilename = filename;
    }
    
    // Public interface
    Logger.log            = log;
    Logger.info           = info;
    Logger.warn           = warn;
    Logger.error          = error;
    Logger.dir            = dir;
    Logger.remapConsole   = remapConsole;
    Logger.getLogHistory  = getLogHistory;
    Logger.setLogFilename = setLogFilename;
    
}());
