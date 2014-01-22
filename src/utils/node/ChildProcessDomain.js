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

var child_process = require("child_process");

var _domainManager,
    _processes = {};

function _initChildProcess(cp) {
    _processes[cp.pid] = cp;
    
    cp.on("error", function (err) {
        console.log("child_process error event for \"" + command + "\": " + err);
        _domainManager.emitEvent("childProcess", "exit", [cp.pid, code, signal]);
        delete _processes[cp.pid];
    });
    
    cp.on("exit", function (code, signal) {
        _domainManager.emitEvent("childProcess", "exit", [cp.pid, code, signal]);
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

    return _initChildProcess(cp);
}

/**
 * 
 */
function execFile(command, args, options) {
    var cp = child_process.execFile(command, args, options, function (error, stdout, stderr) {
        if (error) {
            console.log("child_process execFile error for \"" + command + "\": " + error);
        }
    });

    return _initChildProcess(cp);
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
    
    _domainManager = domainManager;
}

exports.init = init;
