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

(function () {
    "use strict";
    
    var fs              = require('fs'),
        path            = require('path'),
        events          = require('events');
    
    var childProcess    = null,
        retrieveChild   = null,
        forceExit       = false,
        pathToCPSource  = path.join(path.dirname(module.filename), "FindInFilesWorker.js"),
        eventEmitter    = new events.EventEmitter();

    
    function onChildProcessExit() {
        if (retrieveChild) {
            //fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " Child Process is exiting : " + retrieveChild.pid, function (err) {});
            retrieveChild.removeListener('exit', onChildProcessExit);
            retrieveChild = null;
        }

        if (!forceExit) {
            // send message to Brackets about child Process exit. Either restart the query or fallback to previous search.     
        }
    }
    
    function killChildProcess(status) {
       // fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " Killing Child Process from Parent Process " + status + "..", function (err) {});
        var data,
            forceExit = status;
        if (retrieveChild) {
            data = {
                "msg" : "shutDown"
            };
            retrieveChild.send(data);
        }
    }
    
    function onProcessExit() {
        killChildProcess(true);
    }
    
    function _init() {
        childProcess = require("child_process");
        console.log("in Init " + process.execPath);
        retrieveChild = childProcess.spawn(process.execPath, [pathToCPSource], {stdio: ['ipc']});
        //fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', "Child Process Created with PID " + retrieveChild.pid + " at " + (new Date()).getTime(), function (err) {});
        console.log("Child Process Created with PID " + retrieveChild.pid);
        retrieveChild.on('exit', onChildProcessExit);
        retrieveChild.on('message', processMessageFromChildProcess);
    }
    

    
    function restartChildNodeProcess(callback, asyncCallback) {
        var data;
        if (retrieveChild) {
            data = {
                "msg" : "shutDown"
            };
           // fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " In MainProcess: ChildProcess restart " + retrieveChild.pid + " and sending exit message", function (err) {});
            killChildProcess(false);
            retrieveChild.once('exit', function (code) {
              //  fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " In MainProcess: ChildProcess exited with code : " + code + ".. ", function (err) {});
                _init();
                callback(asyncCallback);
            });
        } else {
            _init();
            callback(asyncCallback);
        }
        
    }
    
    function initCache(fileList, callback) {
        console.log('calling init cache from parent');
        restartChildNodeProcess(function (callback) {
            var data = {
                "msg" : "initCache",
                "fileList" : fileList
            };
            
            console.log('First callback in initCache');
        
            retrieveChild.send(data);
            eventEmitter.once('cacheComplete', function (msg) {
                console.log('second callback in initcache');
                //fs.appendFile('C://Users//vaishnav//Desktop//nodeLog.txt', " Receive Message on Parent from Child Process.. ", function (err) {});
                    callback(null, msg.result);
            });
        }, callback);
    }
    
     //Receive result from initCache
    
    function doSearch(searchObject, callback) {
        var data = {
            "msg" : "doSearch",
            "searchObject" : searchObject
        };
        
        if (!retrieveChild) {
            _init();
        }
        
        retrieveChild.send(data);
        eventEmitter.once('searchComplete', function (msg) {
            console.log("Received search complete Message from Child Process");
                callback(null, msg.result);
        });
    }
    
    function getNextPageofSearchResults(callback) {
        var data = {
            "msg" : "getNextPage"
        };
        
        if (!retrieveChild) {
            console.log('No child proces found. Should never happen!!');
            _init();
        }
        
        retrieveChild.send(data);
        eventEmitter.once('receivedNextPage', function (msg) {
            console.log("Received next page Message from Child Process");
                callback(null, msg.result);
        });
    }
    
    function getFirstPageofSearchResults(callback) {
        var data = {
            "msg" : "getFirstPage"
        };
        
        if (!retrieveChild) {
            console.log('No child proces found. Should never happen!!');
            _init();
        }
        
        retrieveChild.send(data);
        eventEmitter.once('receivedFirstPage', function (msg) {
            console.log("Received first page Message from Child Process");
                callback(null, msg.result);
        });
    }
    
    function getPrevPageofSearchResults(callback) {
        var data = {
            "msg" : "getPrevPage"
        };
        
        if (!retrieveChild) {
            console.log('No child proces found. Should never happen!!');
            _init();
        }
        
        retrieveChild.send(data);
        eventEmitter.once('receivedPrevPage', function (msg) {
            console.log("Received prev page Message from Child Process");
                callback(null, msg.result);
        });
    }
    
    function getLastPageofSearchResults(callback) {
        var data = {
            "msg" : "getLastPage"
        };
        
        if (!retrieveChild) {
            console.log('No child proces found. Should never happen!!');
            _init();
        }
        
        retrieveChild.send(data);
        eventEmitter.once('receivedLastPage', function (msg) {
            console.log("Received last page Message from Child Process");
                callback(null, msg.result);
        });
    }
    
    function processMessageFromChildProcess(msg) {
        console.log("Received Message from Child Process");
        if (msg) {
            switch (msg.msg) {
            case 'receivedLastPage':
                eventEmitter.emit('receivedLastPage', msg);
                break;
            case 'receivedPrevPage':
                eventEmitter.emit('receivedPrevPage', msg);
                break;
            case 'receivedFirstPage':
                eventEmitter.emit('receivedFirstPage', msg);
                break;
            case 'receivedNextPage':
                eventEmitter.emit('receivedNextPage', msg);
                break;
            case 'searchComplete':
                eventEmitter.emit('searchComplete', msg);
                break;
            case 'cacheComplete':
                eventEmitter.emit('cacheComplete', msg);
                break;
            default:
                console.log('Unidentified message');
                break;
            }
        }
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
            "nextPage",    // command name
            getNextPageofSearchResults,   // command handler function
            true,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "firstPage",    // command name
            getFirstPageofSearchResults,   // command handler function
            true,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "prevPage",    // command name
            getPrevPageofSearchResults,   // command handler function
            true,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "lastPage",    // command name
            getLastPageofSearchResults,   // command handler function
            true,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [],
            [{name: "searchResults", // return values
                type: "string",
                description: "Object containing results of the search"}]
        );
        
    }
    
    exports.init = init;
    
}());
