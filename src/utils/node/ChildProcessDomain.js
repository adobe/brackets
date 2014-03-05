/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, node: true, nomen: true, indent: 4, maxerr: 50 */

"use strict";

var child_process  = require("child_process"),
    util           = require("util");

var _domainManager,
    _processes = {};

function _initChildProcess(cp, command) {
    _processes[cp.pid] = cp;
    
    cp.on("error", function (err) {
        console.log("child_process error event for \"" + command + "\": " + err);
        _domainManager.emitEvent("childProcess", "error", [cp.pid, err]);
        delete _processes[cp.pid];
    });
    
    cp.on("exit", function (code, signal) {
        _domainManager.emitEvent("childProcess", "exit", [cp.pid, code, signal]);
        delete _processes[cp.pid];
    });
    
    cp.on("close", function (code, signal) {
        _domainManager.emitEvent("childProcess", "close", [cp.pid, code, signal]);
        delete _processes[cp.pid];
    });
    
    return cp.pid;
}

/**
 * 
 */
function exec(command, options) {
    var cp = child_process.exec(command, options, function (error, stdout, stderr) {
        if (error) {
            console.log("child_process exec error for \"" + command + "\": " + error);
        }
    });

    return _initChildProcess(cp, command);
}

/**
 * 
 */
function execFile(command, args, options) {
    console.log(command, args);

    var cp = child_process.execFile(command, args, options, function (error, stdout, stderr) {
        if (error) {
            console.log("child_process execFile error for \"" + command + "\": " + error);
        }
    });

    return _initChildProcess(cp, command);
}

/**
 * 
 */
function kill(pid, signal) {
    var cp = _processes[pid];
    
    if (cp) {
        cp.kill(signal);
    }
}

var WIN_REG_QUERY = "REG QUERY \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\%s\" /ve",
    WIN_RE_VALUE  = /REG_SZ\s+(.*)/;

function _findAppByKeyWindows(key, callback) {
    var winRegQuery = util.format(WIN_REG_QUERY, key);
    child_process.exec(winRegQuery, null, function (error, stdout, stderr) {
        var exec = stdout && WIN_RE_VALUE.exec(stdout),
            path = exec && exec[1];

        if (!path) {
            error = util.format("Could not find %s in Windows registry", key);
        }

        callback(error, path);
    });
}

var MAC_MDFIND_QUERY    = "mdfind \"kMDItemCFBundleIdentifier == '%s'\"",
    MAC_CODESIGN_QUERY  = "codesign --display \"%s\"",
    MAC_RE_VALUE        = /Executable=(.*)/;

function _findAppByKeyMac(key, callback) {
    var macMdfindQuery = util.format(MAC_MDFIND_QUERY, key);

    child_process.exec(macMdfindQuery, null, function (error, stdout, stderr) {
        if (!stdout) {
            callback(util.format("Could not find application with bundle ID %s", key));
            return;
        } else if (error) {
            callback(error);
            return;
        }

        var pathToBundle = stdout.trim(),
            macCodesignQuery = util.format(MAC_CODESIGN_QUERY, pathToBundle);

        child_process.exec(macCodesignQuery, null, function (error, stdout, stderr) {
            var pathToBinary = stderr && stderr.trim(),   // codesign writes to stderr
                exec = pathToBinary && MAC_RE_VALUE.exec(pathToBinary),
                path = exec && exec[1];

            if (!path) {
                error = util.format("Could not find binary in application bundle %s", pathToBundle);
            }

            // Surround path with quotes
            callback(error, util.format("\"%s\"", path));
        });
    });
}

function _findAppByKeyLinux(key, callback) {
    // We assume they key is in $PATH
    callback(null, key);
}

function findAppByKey() {
    var platformFind = _findAppByKeyLinux;

    if (process.platform === "win32") {
        platformFind = _findAppByKeyWindows;
    } else if (process.platform === "darwin") {
        platformFind = _findAppByKeyMac;
    }

    return function (key, callback) {
        platformFind(key, callback);
    };
}

/**
 * Initialize the "childProcess" domain.
 * The fileWatcher domain handles watching and un-watching directories.
 */
function init(domainManager) {
    if (!domainManager.hasDomain("childProcess")) {
        domainManager.registerDomain("childProcess", {major: 0, minor: 1});
    }
    
    domainManager.registerCommand(
        "childProcess",
        "findAppByKey",
        findAppByKey(),
        true,
        "Returns the path to an application",
        [
            {
                name: "key",
                type: "string",
                description: ""
            }
        ]
    );
    domainManager.registerCommand(
        "childProcess",
        "exec",
        exec,
        false,
        "Runs a command in a shell and buffers the output.",
        [
            {
                name: "command",
                type: "string",
                description: "The command to run, with space-separated arguments"
            },
            {
                name: "options",
                type: "object",
                description: ""
            }
        ]
    );
    domainManager.registerCommand(
        "childProcess",
        "execFile",
        execFile,
        false,
        "Runs a command in a shell and buffers the output.",
        [
            {
                name: "command",
                type: "string",
                description: "The command to run, with space-separated arguments"
            },
            {
                name: "args",
                type: "array",
                description: "The command to run, with space-separated arguments"
            },
            {
                name: "options",
                type: "object",
                description: ""
            }
        ]
    );
    domainManager.registerCommand(
        "childProcess",
        "kill",
        kill,
        false,
        "Send a signal to the child process.",
        [
            {
                name: "pid",
                type: "number",
                description: ""
            },
            {
                name: "signal",
                type: "string",
                description: ""
            }
        ]
    );
    domainManager.registerEvent(
        "childProcess",
        "exit",
        [
            {name: "pid", type: "number"},
            {name: "code", type: "number"},
            {name: "signal", type: "string"}
        ]
    );
    domainManager.registerEvent(
        "childProcess",
        "error",
        [
            {name: "pid", type: "number"},
            {name: "error", type: "string"}
        ]
    );
    domainManager.registerEvent(
        "childProcess",
        "close",
        [
            {name: "pid", type: "number"},
            {name: "code", type: "number"},
            {name: "signal", type: "string"}
        ]
    );
    
    _domainManager = domainManager;
}

exports.init = init;
