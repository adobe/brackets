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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/**
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    var FileUtils   = require("file/FileUtils"),
        NodeDomain  = require("utils/NodeDomain"),
        StringUtils = require("utils/StringUtils");
    
    var _bracketsPath   = FileUtils.getNativeBracketsDirectoryPath(),
        _modulePath     = FileUtils.getNativeModuleDirectoryPath(module),
        _nodePath       = "node/ChildProcessDomain",
        _domainPath     = [_bracketsPath, _modulePath, _nodePath].join("/"),
        _nodeDomain     = new NodeDomain("childProcess", _domainPath);
    
    var _processes = {};
    
    // TODO If the connection closes, notify all?
    $(_nodeDomain.connection).on("close", function (event, promise) {
        console.log(event);
    });
    
    function ChildProcess(command, args, options) {
        this._command = command;
        this._args = args;
        this._options = options;
    }
    
    // Add "fullPath", "name", "parent", "id", "isFile" and "isDirectory" getters
    Object.defineProperties(ChildProcess.prototype, {
        "connected": {
            get: function () { return this._connected; },
            set: function () { throw new Error("Cannot set connected"); }
        },
        "command": {
            get: function () { return this._command; },
            set: function () { throw new Error("Cannot set command"); }
        },
        "args": {
            get: function () { return this._args; },
            set: function () { throw new Error("Cannot args command"); }
        },
        "options": {
            get: function () { return this._options; },
            set: function () { throw new Error("Cannot set options"); }
        },
        "pid": {
            get: function () { return this._pid; },
            set: function () { throw new Error("Cannot set pid"); }
        }
    });
    
    ChildProcess.prototype._pid = null;
    ChildProcess.prototype._connected = false;
    
    ChildProcess.prototype.kill = function (signal) {
        _nodeDomain.exec("kill", this.pid, signal);
    };

    function _initChildProcess(cp) {
        // Create callback for fileWatcher.execFile
        return function (pid) {
            cp._pid = pid;
            cp._connected = true;

            // map PID to ChildProcess
            _processes[pid] = cp;
        };
    }
    
    function execFile(command, args, options) {
        var cp = new ChildProcess(command, args, options);

        _nodeDomain.exec("execFile", cp.command, cp.args, cp.options)
            .done(_initChildProcess(cp));

        return cp;
    }
    
    function exec(command, args, options) {
        var argsString      = Array.isArray(args) ? args.join(" ") : args,
            commandString   = command + " " + argsString,
            cp              = new ChildProcess(command, args, options);

        _nodeDomain.exec("exec", commandString, cp.options)
            .done(_initChildProcess(cp));

        return cp;
    }
    
    function _childProcessExitHandler(event, pid, code, signal) {
        var cp = _processes[pid];
        
        if (!cp) {
            return;
        }
        
        delete _processes[pid];
        
        cp._connected = false;
        $(cp).triggerHandler(event.type, [code, signal]);
    }
    
    function _childProcessErrorHandler(event, pid, error) {
        var cp = _processes[pid];
        
        if (!cp) {
            return;
        }

        $(cp).triggerHandler("error", [error]);
    }

    function findAppByKey(key) {
        return _nodeDomain.exec("findAppByKey", key);
    }

    // Setup the exit handler. This only needs to happen once.
    $(_nodeDomain).on("exit", _childProcessExitHandler);
    $(_nodeDomain).on("close", _childProcessExitHandler);
    $(_nodeDomain).on("error", _childProcessErrorHandler);

    exports.execFile = execFile;
    exports.exec = exec;
    exports.findAppByKey = findAppByKey;
});