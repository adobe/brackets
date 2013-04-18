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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global self, importScripts, require */

importScripts("thirdparty/requirejs/require.js");

(function () {
    "use strict";
    
    var HintUtils;
    var Tern;
    require(["./HintUtils"], function (hintUtils) {
        HintUtils = hintUtils;
        var ternRequire = require.config({baseUrl: "./thirdparty"});
        ternRequire(["tern/lib/tern", "tern/plugin/requirejs"], function (tern, requirejs) {
            Tern = tern;
        });
    });

    var ternServer  = null;

    // Save the tern callbacks for when we get the contents of the file
    var fileCallBacks = {};
    
    /**
     * Provide the contents of the requested file to tern
     */
    function getFile(name, next) {
        // save the callback
        fileCallBacks[name] = next;
        
        // post a message back to the main thread to get the file contents 
        self.postMessage({
            type: HintUtils.TERN_GET_FILE_MSG,
            file: name
        });
    }

    /**
     * Handle a response from the main thread providing the contents of a file
     * @param {string} file - the name of the file
     * @param {string} text - the contents of the file
     */
    function handleGetFile(file, text) {
        var next = fileCallBacks[file];
        if (next) {
            next(null, text);
        }
        delete fileCallBacks[file];
    }
    
    /**
     * Create a new tern server.
     */
    function initTernServer(env, dir, files) {
        var ternOptions = {
            defs: env,
            async: true,
            getFile: getFile,
            plugins: {requirejs: {}}
        };
        ternServer = new Tern.Server(ternOptions);
        
        files.forEach(function (file) {
            ternServer.addFile(file);
        });
        
    }

    function buildRequest(dir, file, query, offset, text) {
        query = {type: query};
        query.start = offset;
        query.end = offset;
        query.file = file;
        query.filter = false;
        query.sort = false;
        query.depths = true;
        query.guess = true;
        query.origins = true;
        query.expandWordForward = true;

        var request = {query: query, files: [], offset: offset};
        request.files.push({type: "full", name: file, text: text});

        return request;
    }

    /**
     * Send a log message back from the worker to the main thread
     * 
     * @param {string} msg - the log message
     */
    function _log(msg) {
        self.postMessage({log: msg });
    }
    
    /**
     * Get definition location
     * @param {string} dir      - the directory
     * @param {string} file     - the file name
     * @param {number} offset   - the offset into the file for cursor
     * @param {string} text     - the text of the file
     */
    function getJumptoDef(dir, file, offset, text) {
        
        var request = buildRequest(dir, file, "definition", offset, text);
        request.query.lineCharPositions = true;
        ternServer.request(request, function (error, data) {
            if (error) {
                _log("Error returned from Tern 'definition' request: " + error);
                self.postMessage({type: HintUtils.TERN_JUMPTODEF_MSG});
                return;
            }
            
            // Post a message back to the main thread with the definition
            self.postMessage({type: HintUtils.TERN_JUMPTODEF_MSG,
                              file: file,
                              resultFile: data.file,
                              offset: offset,
                              start: data.start,
                              end: data.end
                             });
        });
    }
    
    
    /**
     * Get the completions for the given offset
     * @param {string} dir      - the directory
     * @param {string} file     - the file name
     * @param {number} offset   - the offset into the file where we want completions for
     * @param {string} text     - the text of the file
     */
    function getTernHints(dir, file, offset, text) {
        
        var request = buildRequest(dir, file, "completions", offset, text),
            i;
        //_log("request " + dir + " " + file + " " + offset /*+ " " + text */);
        ternServer.request(request, function (error, data) {
            var completions = [];
            if (error) {
                _log("Error returned from Tern 'completions' request: " + error);
            } else {
                //_log("found " + data.completions.length + " for " + file + "@" + offset);
                for (i = 0; i < data.completions.length; ++i) {
                    var completion = data.completions[i];
                    completions.push({value: completion.name, type: completion.type, depth: completion.depth,
                        guess: completion.guess, origin: completion.origin});
                }
            }

            // Post a message back to the main thread with the completions
            self.postMessage({type: HintUtils.TERN_COMPLETIONS_MSG,
                              dir: dir,
                              file: file,
                              offset: offset,
                              completions: completions
                             });
        });
    }

    /**
     * Get all the known properties for guessing.
     *
     * @param {string} dir      - the directory
     * @param {string} file     - the file name
     * @param {string} text     - the text of the file
     */
    function handleGetProperties(dir, file, offset, text) {

        var request = buildRequest(dir, file, "properties", undefined, text),
            i;
        //_log("request " + request.type + dir + " " + file);
        ternServer.request(request, function (error, data) {
            var properties = [];
            if (error) {
                _log("Error returned from Tern 'properties' request: " + error);
            } else {
                //_log("completions = " + data.completions.length);
                for (i = 0; i < data.completions.length; ++i) {
                    var property = data.completions[i];
                    properties.push({value: property, guess: true});
                }
            }

            // Post a message back to the main thread with the completions
            self.postMessage({type: HintUtils.TERN_GET_PROPERTIES_MSG,
                              dir: dir,
                              file: file,
                              offset: offset,
                              properties: properties
                });
        });
    }

    /**
     * Get the function type for the given offset
     * @param {string} dir      - the directory
     * @param {string} file     - the file name
     * @param {number} offset   - the offset into the file where we want completions for
     * @param {string} text     - the text of the file
     */
    function handleFunctionType(dir, file, pos, offset, text) {
        
        var request = buildRequest(dir, file, "type", pos, text);
            
        request.preferFunction = true;
        
        //_log("request " + dir + " " + file + " " + offset /*+ " " + text */);
        ternServer.request(request, function (error, data) {
            var fnType = "";
            if (error) {
                _log("Error returned from Tern 'type' request: " + error);
            } else {
                fnType = data.type;
            }

            // Post a message back to the main thread with the completions
            self.postMessage({type: HintUtils.TERN_CALLED_FUNC_TYPE_MSG,
                              dir: dir,
                              file: file,
                              offset: offset,
                              fnType: fnType
                             });
        });
    }
    
    self.addEventListener("message", function (e) {
        var dir, file, text, offset,
            request = e.data,
            type = request.type;

        if (type === HintUtils.TERN_INIT_MSG) {
            
            dir         = request.dir;
            var env     = request.env,
                files   = request.files;
            initTernServer(env, dir, files);
            
        } else if (type === HintUtils.TERN_COMPLETIONS_MSG) {
            dir = request.dir;
            file = request.file;
            text    = request.text;
            offset  = request.offset;
            getTernHints(dir, file, offset, text);
        } else if (type === HintUtils.TERN_GET_PROPERTIES_MSG) {
            file    = request.file;
            dir     = request.dir;
            text    = request.text;
            offset  = request.offset;
            handleGetProperties(dir, file, offset, text);
        } else if (type === HintUtils.TERN_GET_FILE_MSG) {
            file = request.file;
            text = request.text;
            handleGetFile(file, text);
        } else if (type === HintUtils.TERN_CALLED_FUNC_TYPE_MSG) {
            dir     = request.dir;
            file    = request.file;
            text    = request.text;
            offset  = request.offset;
            var pos = request.pos;
            handleFunctionType(dir, file, pos, offset, text);
        } else if (type === HintUtils.TERN_JUMPTODEF_MSG) {
            file    = request.file;
            dir     = request.dir;
            text    = request.text;
            offset  = request.offset;
            getJumptoDef(dir, file, offset, text);
        } else {
            _log("Unknown message: " + JSON.stringify(request));
        }
    });

}());
