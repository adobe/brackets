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
    
    var MessageIds;
    var Tern;
    require(["./MessageIds"], function (messageIds) {
        MessageIds = messageIds;
        var ternRequire = require.config({baseUrl: "./thirdparty"});
        ternRequire(["tern/lib/tern", "tern/plugin/requirejs", "tern/plugin/doc_comment"], function (tern, requirejs, docComment) {
            Tern = tern;

            var ternServer  = null;
        
            // Save the tern callbacks for when we get the contents of the file
            var fileCallBacks = {};
            
            /**
             * Provide the contents of the requested file to tern
             * @param {string} name - the name of the file
             * @param {Function} next - the function to call with the text of the file
             *  once it has been read in.
             */
            function getFile(name, next) {
                // save the callback
                fileCallBacks[name] = next;
                
                // post a message back to the main thread to get the file contents 
                self.postMessage({
                    type: MessageIds.TERN_GET_FILE_MSG,
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
             *
             * @param {Object} env - an Object with the environment, as read in from
             *  the json files in thirdparty/tern/defs
             * @param {Array.<string>} files - a list of filenames tern should be aware of
             */
            function initTernServer(env, files) {
                var ternOptions = {
                    defs: env,
                    async: true,
                    getFile: getFile,
                    plugins: {requirejs: {}, doc_comment: true}
                };
                ternServer = new Tern.Server(ternOptions);
                
                files.forEach(function (file) {
                    ternServer.addFile(file);
                });
                
            }

            /**
             * Create a "full" update object.
             *
             * @param {string} path - full path of the file.
             * @param {string} text - full text of the file.
             * @return {{type: string, name: string, offsetLines: number, text: string}} -
             * "full" update.

             */
            function createFullUpdate(path, text) {
                return {type: MessageIds.TERN_FILE_INFO_TYPE_FULL,
                        name: path,
                        offsetLines: 0,
                        text: text};
            }

            /**
             * Create a "empty" update object.
             *
             * @param {string} path - full path of the file.
             * @return {{type: string, name: string, offsetLines: number, text: string}} -
             * "empty" update.

             */
            function createEmptyUpdate(path) {
                return {type: MessageIds.TERN_FILE_INFO_TYPE_EMPTY,
                    name: path,
                    offsetLines: 0,
                    text: ""};
            }

            /**
             * Build an object that can be used as a request to tern.
             *
             * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
             * - type of update, name of file, and the text of the update.
             * For "full" updates, the whole text of the file is present. For "part" updates,
             * the changed portion of the text. For "empty" updates, the file has not been modified
             * and the text is empty.
             * @param {string} query - the type of request being made
             * @param {{line: number, ch: number}} offset -
             */
            function buildRequest(fileInfo, query, offset) {
                query = {type: query};
                query.start = offset;
                query.end = offset;
                query.file = (fileInfo.type === MessageIds.TERN_FILE_INFO_TYPE_PART) ? "#0" : fileInfo.name;
                query.filter = false;
                query.sort = false;
                query.depths = true;
                query.guess = true;
                query.origins = true;
                query.expandWordForward = false;
                query.lineCharPositions = true;

                var request = {query: query, files: [], offset: offset};
                if (fileInfo.type !== MessageIds.TERN_FILE_INFO_TYPE_EMPTY) {
                    request.files.push(fileInfo);
                }

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
             * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
             * - type of update, name of file, and the text of the update.
             * For "full" updates, the whole text of the file is present. For "part" updates,
             * the changed portion of the text. For "empty" updates, the file has not been modified
             * and the text is empty.
             * @param {{line: number, ch: number}} offset - the offset into the
             * file for cursor
             */
            function getJumptoDef(fileInfo, offset) {
                var request = buildRequest(fileInfo, "definition", offset);
                // request.query.typeOnly = true;       // FIXME: tern doesn't work exactly right yet.
                ternServer.request(request, function (error, data) {
                    if (error) {
                        _log("Error returned from Tern 'definition' request: " + error);
                        self.postMessage({type: MessageIds.TERN_JUMPTODEF_MSG, file: fileInfo.name, offset: offset});
                        return;
                    }
                    
                    // Post a message back to the main thread with the definition
                    self.postMessage({type: MessageIds.TERN_JUMPTODEF_MSG,
                                      file: fileInfo.name,
                                      resultFile: data.file,
                                      offset: offset,
                                      start: data.start,
                                      end: data.end
                                     });
                });
            }
        
            /**
             * Get all the known properties for guessing.
             *
             * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
             * - type of update, name of file, and the text of the update.
             * For "full" updates, the whole text of the file is present. For "part" updates,
             * the changed portion of the text. For "empty" updates, the file has not been modified
             * and the text is empty.
             * @param {{line: number, ch: number}} offset -
             * the offset into the file where we want completions for
             * @param {string} type     - the type of the message to reply with.
             */
            function getTernProperties(fileInfo, offset, type) {
        
                var request = buildRequest(fileInfo, "properties", offset),
                    i;
                //_log("tern properties: request " + request.type + dir + " " + file);
                ternServer.request(request, function (error, data) {
                    var properties = [];
                    if (error) {
                        _log("Error returned from Tern 'properties' request: " + error);
                    } else {
                        //_log("tern properties: completions = " + data.completions.length);
                        for (i = 0; i < data.completions.length; ++i) {
                            var property = data.completions[i];
                            properties.push({value: property, guess: true});
                        }
                    }
        
                    // Post a message back to the main thread with the completions
                    self.postMessage({type: type,
                                      file: fileInfo.name,
                                      offset: offset,
                                      properties: properties
                        });
                });
            }
                
            /**
             * Get the completions for the given offset
             *
             * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
             * - type of update, name of file, and the text of the update.
             * For "full" updates, the whole text of the file is present. For "part" updates,
             * the changed portion of the text. For "empty" updates, the file has not been modified
             * and the text is empty.
             * @param {{line: number, ch: number}} offset -
             * the offset into the file where we want completions for
             * @param {boolean} isProperty - true if getting a property hint,
             * otherwise getting an identifier hint.
             */
            function getTernHints(fileInfo, offset, isProperty) {
                
                var request = buildRequest(fileInfo, "completions", offset),
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
        
                    if (completions.length > 0 || !isProperty) {
                        // Post a message back to the main thread with the completions
                        self.postMessage({type: MessageIds.TERN_COMPLETIONS_MSG,
                            file: fileInfo.name,
                            offset: offset,
                            completions: completions
                            });
                    } else {
                        // if there are no completions, then get all the properties
                        getTernProperties(fileInfo, offset, MessageIds.TERN_COMPLETIONS_MSG);
                    }
                });
            }
        
            /**
             * Get the function type for the given offset
             *
             * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
             * - type of update, name of file, and the text of the update.
             * For "full" updates, the whole text of the file is present. For "part" updates,
             * the changed portion of the text. For "empty" updates, the file has not been modified
             * and the text is empty.
             * @param {{line: number, ch: number}} offset -
             * the offset into the file where we want completions for
             */
            function handleFunctionType(fileInfo, offset) {
                
                var request = buildRequest(fileInfo, "type", offset);
                    
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
                    self.postMessage({type: MessageIds.TERN_CALLED_FUNC_TYPE_MSG,
                                      file: fileInfo.name,
                                      offset: offset,
                                      fnType: fnType
                                     });
                });
            }
        
            /**
             *  Add an array of files to tern.
             *
             * @param {Array.<string>} files - each string in the array is the full
             * path of a file.
             */
            function handleAddFiles(files) {
                files.forEach(function (file) {
                    ternServer.addFile(file);
                });
            }
        
            /**
             *  Update the context of a file in tern.
             *
             * @param {string} path - full path of file.
             * @param {string} text - content of the file.
             */
            function handleUpdateFile(path, text) {
        
                ternServer.addFile(path, text);
        
                self.postMessage({type: MessageIds.TERN_UPDATE_FILE_MSG,
                    path: path
                    });
        
                // reset to get the best hints with the updated file.
                ternServer.reset();
            }
        
            /**
             *  Make a completions request to tern to force tern to resolve files
             *  and create a fast first lookup for the user.
             * @param {string} path     - the path of the file
             */
            function handlePrimePump(path) {
                var fileInfo = createEmptyUpdate(path);
                var request = buildRequest(fileInfo, "completions", {line: 0, ch: 0});
        
                ternServer.request(request, function (error, data) {
                    // Post a message back to the main thread
                    self.postMessage({type: MessageIds.TERN_PRIME_PUMP_MSG,
                        path: path
                        });
                });
            }
            
            self.addEventListener("message", function (e) {
                var file, text, offset,
                    request = e.data,
                    type = request.type;
                
                if (type === MessageIds.TERN_INIT_MSG) {
                    
                    var env     = request.env,
                        files   = request.files;
                    initTernServer(env, files);
                } else if (type === MessageIds.TERN_COMPLETIONS_MSG) {
                    offset  = request.offset;
                    getTernHints(request.fileInfo, offset, request.isProperty);
                } else if (type === MessageIds.TERN_GET_FILE_MSG) {
                    file = request.file;
                    text = request.text;
                    handleGetFile(file, text);
                } else if (type === MessageIds.TERN_CALLED_FUNC_TYPE_MSG) {
                    offset  = request.offset;
                    handleFunctionType(request.fileInfo, offset);
                } else if (type === MessageIds.TERN_JUMPTODEF_MSG) {
                    offset  = request.offset;
                    getJumptoDef(request.fileInfo, offset);
                } else if (type === MessageIds.TERN_ADD_FILES_MSG) {
                    handleAddFiles(request.files);
                } else if (type === MessageIds.TERN_PRIME_PUMP_MSG) {
                    handlePrimePump(request.path);
                } else if (type === MessageIds.TERN_GET_GUESSES_MSG) {
                    offset  = request.offset;
                    getTernProperties(request.fileInfo, offset, MessageIds.TERN_GET_GUESSES_MSG);
                } else if (type === MessageIds.TERN_UPDATE_FILE_MSG) {
                    handleUpdateFile(request.path, request.text);
                } else {
                    _log("Unknown message: " + JSON.stringify(request));
                }
            });
            // tell the main thread we're ready to start processing messages
            self.postMessage({type: MessageIds.TERN_WORKER_READY});
        });
    });

}());
