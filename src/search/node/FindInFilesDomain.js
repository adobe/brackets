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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    
    'use strict';
    var fs = require('fs');
    var childProcess = null,
        retrieveChild = null,
        forceExit = false;
    
    function onChildProcessExit() {
        if (retrieveChild) {
            fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " Child Process is exiting : " + retrieveChild.pid, function (err) {});
            retrieveChild.removeListener('exit', onChildProcessExit);
            retrieveChild = null;
        }

        if (!forceExit) {
            // send message to Brackets about child Process exit. Either restart the query or fallback to previous search.     
        }
    }
    
    function onProcessExit() {
        killChildProcess(true);
    }
    
    function _init() {
        childProcess = require("child_process");
        retrieveChild = childProcess.spawn(process.execPath, ["C://Users//vaishnav//Desktop//Adobe//git//brackets//src//search//node//ChildFIF.js"], {stdio: ['ipc']});
        fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', "Child Process Created with PID " + retrieveChild.pid + " at " + (new Date()).getTime(), function (err) {});
        console.log("Child Process Created with PID " + retrieveChild.pid);
        retrieveChild.on('exit', onChildProcessExit);
    }
    
    function killChildProcess(status) {
        fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " Killing Child Process from Parent Process " + status + "..", function (err) {});
        var data,
            forceExit = status;
        if (retrieveChild) {
            data = {
                "msg" : "shutDown"
            };
            retrieveChild.send(data);
        }
    }
    
    function restartChildNodeProcess(callback, asyncCallback) {
        var data;
        if (retrieveChild) {
            data = {
                "msg" : "shutDown"
            };
            fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " In MainProcess: ChildProcess restart " + retrieveChild.pid + " and sending exit message", function (err) {});
            killChildProcess(false);
            retrieveChild.once('exit', function (code) {
                fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " In MainProcess: ChildProcess exited with code : " + code + ".. ", function (err) {});
                _init();
                callback(asyncCallback);
            });
        } else {
            _init();
            callback(asyncCallback);
        }
        
    }
    
    function initCache(fileList, callback) {
        restartChildNodeProcess(function (callback) {
            var data = {
                "msg" : "initCache",
                "fileList" : fileList
            };
        
            retrieveChild.send(data);
            retrieveChild.on('message', function (msg) {
                fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " Receive Message on Parent from Child Process.. ", function (err) {});
                if (msg.msg === "cacheComplete") {
                    callback(null, msg.result);
                }
            });
        }, callback);
    }
    
     //Receive result from initCache
    
    function doSearch(searchObject, callback) {
        fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " Receive Message on Parent from Brackets for doSearch at " + (new Date()).getTime(), function (err) {});
        var data = {
            "msg" : "doSearch",
            "searchObject" : searchObject
        };
        
        if (!retrieveChild) {
            _init();
        }
        
        retrieveChild.send(data);
        retrieveChild.on('message', function (msg) {
            fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " Receive Message on Parent.. ", function (err) {});
            if (msg.msg === "searchComplete") {
                callback(null, msg.result);
            }
        });
    }
    
    //Receive result from doSearch
    
    process.on('exit', onProcessExit);
    
    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("FindInFiles")) {
            domainManager.registerDomain("FindInFiles", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "doSearch",    // command name
            doSearch,   // command handler function
            true,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [{name: "search_object", // parameters
                type: "object",
                description: "Object containing search data"}],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "initCache",    // command name
            initCache,   // command handler function
            true,          // this command is synchronous in Node
            "Caches the project for find in files in node",
            [{name: "fileList", // parameters
                type: "Array",
                description: "List of all project files - Path only"}],
            [{name: "sdf", // return values
                type: "boolean",
                description: "don't know yet"}]
        );
    }
    
    exports.init = init;
    
}());
