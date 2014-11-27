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

var config = {};

(function () {
    "use strict";
    
    var MessageIds, HintUtils2;
    var Tern, Infer;
    require(["./MessageIds", "./HintUtils2"], function (messageIds, hintUtils2) {
        MessageIds = messageIds;
        HintUtils2 = hintUtils2;
        var ternRequire = require.config({baseUrl: "./thirdparty"});
        ternRequire(["tern/lib/tern", "tern/lib/infer", "tern/plugin/requirejs", "tern/plugin/doc_comment", "tern/plugin/angular"], function (tern, infer, requirejs, docComment) {
            Tern = tern;
            Infer = infer;

            var ternServer  = null,
                inferenceTimeout;
        
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
             * Send a log message back from the worker to the main thread
             * @private
             * @param {string} msg - the log message
             */
            function _log(msg) {
                self.postMessage({log: msg });
            }
            
            /**
             * Report exception
             * @private
             * @param {Error} e - the error object
             */
            function _reportError(e, file) {
                if (e instanceof Infer.TimedOut) {
                    // Post a message back to the main thread with timedout info
                    self.postMessage({
                        type: MessageIds.TERN_INFERENCE_TIMEDOUT,
                        file: file
                    });
                } else {
                    _log("Error thrown in tern_worker:" + e.message + "\n" + e.stack);
                }
            }
            
            /**
             * Handle a response from the main thread providing the contents of a file
             * @param {string} file - the name of the file
             * @param {string} text - the contents of the file
             */
            function handleGetFile(file, text) {
                var next = fileCallBacks[file];
                if (next) {
                    try {
                        next(null, text);
                    } catch (e) {
                        _reportError(e, file);
                    }
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
                    plugins: {requirejs: {}, doc_comment: true, angular: true}
                };
                ternServer = new Tern.Server(ternOptions);
                
                files.forEach(function (file) {
                    ternServer.addFile(file);
                });
                
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
                query.types = true;
                query.expandWordForward = false;
                query.lineCharPositions = true;

                var request = {query: query, files: [], offset: offset, timeout: inferenceTimeout};
                if (fileInfo.type !== MessageIds.TERN_FILE_INFO_TYPE_EMPTY) {
                    request.files.push(fileInfo);
                }

                return request;
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
                
                try {
                    ternServer.request(request, function (error, data) {
                        if (error) {
                            _log("Error returned from Tern 'definition' request: " + error);
                            self.postMessage({type: MessageIds.TERN_JUMPTODEF_MSG, file: fileInfo.name, offset: offset});
                            return;
                        }
                        var response = {type: MessageIds.TERN_JUMPTODEF_MSG,
                                              file: fileInfo.name,
                                              resultFile: data.file,
                                              offset: offset,
                                              start: data.start,
                                              end: data.end
                                             };

                        request = buildRequest(fileInfo, "type", offset);
                        // See if we can tell if the reference is to a Function type
                        ternServer.request(request, function (error, data) {
                            if (!error) {
                                response.isFunction = data.type.length > 2 && data.type.substring(0, 2) === "fn";
                            }

                            // Post a message back to the main thread with the definition
                            self.postMessage(response);
                        });

                    });
                } catch (e) {
                    _reportError(e, fileInfo.name);
                }
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
                try {
                    ternServer.request(request, function (error, data) {
                        var properties = [];
                        if (error) {
                            _log("Error returned from Tern 'properties' request: " + error);
                        } else {
                            //_log("tern properties: completions = " + data.completions.length);
                            for (i = 0; i < data.completions.length; ++i) {
                                var property = data.completions[i];
                                properties.push({value: property, type: property.type, guess: true});
                            }
                        }

                        // Post a message back to the main thread with the completions
                        self.postMessage({type: type,
                                          file: fileInfo.name,
                                          offset: offset,
                                          properties: properties
                            });
                    });
                } catch (e) {
                    _reportError(e, fileInfo.name);
                }
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
                try {
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
                } catch (e) {
                    _reportError(e, fileInfo.name);
                }
            }

            /**
             *  Given a Tern type object, convert it to an array of Objects, where each object describes
             *  a parameter.
             *
             * @param {!Infer.Fn} inferFnType - type to convert.
             * @return {Array<{name: string, type: string, isOptional: boolean}>} where each entry in the array is a parameter.
             */
            function getParameters(inferFnType) {

                // work around define functions before use warning.
                var recordTypeToString, inferTypeToString, processInferFnTypeParameters, inferFnTypeToString;

                /**
                 *  Convert an infer array type to a string.
                 *
                 *  Formatted using google closure style. For example:
                 *
                 *  "Array.<string, number>"
                 *
                 * @param {Infer.Arr} inferArrType
                 *
                 * @return {string} - array formatted in google closure style.
                 *
                 */
                function inferArrTypeToString(inferArrType) {
                    var result = "Array.<";

                    inferArrType.props["<i>"].types.forEach(function (value, i) {
                        if (i > 0) {
                            result += ", ";
                        }
                        result += inferTypeToString(value);
                    });

                    // workaround case where types is zero length
                    if (inferArrType.props["<i>"].types.length === 0) {
                        result += "Object";
                    }
                    result += ">";

                    return result;
                }

                /**
                 * Convert properties to a record type annotation.
                 *
                 * @param {Object} props
                 * @return {string} - record type annotation
                 */
                recordTypeToString = function (props) {
                    var result = "{",
                        first = true,
                        prop;

                    for (prop in props) {
                        if (Object.prototype.hasOwnProperty.call(props, prop)) {
                            if (!first) {
                                result += ", ";
                            }

                            first = false;
                            result += prop + ": " + inferTypeToString(props[prop]);
                        }
                    }

                    result += "}";

                    return result;
                };

                /**
                 *  Convert an infer type to a string.
                 *
                 * @param {*} inferType - one of the Infer's types; Infer.Prim, Infer.Arr, Infer.ANull. Infer.Fn functions are
                 * not handled here.
                 *
                 * @return {string}
                 *
                 */
                inferTypeToString = function (inferType) {
                    var result;

                    if (inferType instanceof Infer.AVal) {
                        inferType = inferType.types[0];
                    }

                    if (inferType instanceof Infer.Prim) {
                        result = inferType.toString();
                        if (result === "string") {
                            result = "String";
                        } else if (result === "number") {
                            result = "Number";
                        } else if (result === "boolean") {
                            result = "Boolean";
                        }
                    } else if (inferType instanceof Infer.Arr) {
                        result = inferArrTypeToString(inferType);
                    } else if (inferType instanceof Infer.Fn) {
                        result = inferFnTypeToString(inferType);
                    } else if (inferType instanceof Infer.Obj) {
                        if (inferType.name === undefined) {
                            result = recordTypeToString(inferType.props);
                        } else {
                            result = inferType.name;
                        }
                    } else {
                        result = "Object";
                    }

                    return result;
                };

                /**
                 * Convert an infer function type to a Google closure type string.
                 *
                 * @param {Infer.Fn} inferType - type to convert.
                 * @return {string} - function type as a string.
                 */
                inferFnTypeToString = function (inferType) {
                    var result = "function(",
                        params = processInferFnTypeParameters(inferType);

                    result += HintUtils2.formatParameterHint(params, null, null, true);
                    if (inferType.retval) {
                        result += "):";
                        result += inferTypeToString(inferType.retval);
                    }

                    return result;
                };

                /**
                 * Convert an infer function type to string.
                 *
                 * @param {*} inferType - one of the Infer's types; Infer.Fn, Infer.Prim, Infer.Arr, Infer.ANull
                 * @return {Array<{name: string, type: string, isOptional: boolean}>} where each entry in the array is a parameter.
                 */
                processInferFnTypeParameters = function (inferType) {
                    var params = [],
                        i;

                    for (i = 0; i < inferType.args.length; i++) {
                        var param = {},
                            name = inferType.argNames[i],
                            type = inferType.args[i];

                        if (!name) {
                            name = "param" + (i + 1);
                        }

                        if (name[name.length - 1] === "?") {
                            name = name.substring(0, name.length - 1);
                            param.isOptional = true;
                        }

                        param.name = name;
                        param.type = inferTypeToString(type);
                        params.push(param);
                    }

                    return params;
                };

                return processInferFnTypeParameters(inferFnType);
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
                var request = buildRequest(fileInfo, "type", offset),
                    error;
                    
                request.query.preferFunction = true;

                var fnType = "";
                try {
                    ternServer.request(request, function (ternError, data) {
                        
                        if (ternError) {
                            _log("Error for Tern request: \n" + JSON.stringify(request) + "\n" + ternError);
                            error = ternError.toString();
                        } else {
                            var file = ternServer.findFile(fileInfo.name);
    
                            // convert query from partial to full offsets
                            var newOffset = offset;
                            if (fileInfo.type === MessageIds.TERN_FILE_INFO_TYPE_PART) {
                                newOffset = {line: offset.line + fileInfo.offsetLines, ch: offset.ch};
                            }
    
                            request = buildRequest(createEmptyUpdate(fileInfo.name), "type", newOffset);
    
                            var expr = Tern.findQueryExpr(file, request.query);
                            Infer.resetGuessing();
                            var type = Infer.expressionType(expr);
                            type = type.getFunctionType() || type.getType();
                            
                            if (type) {
                                fnType = getParameters(type);
                            } else {
                                ternError = "No parameter type found";
                                _log(ternError);
                            }
                        }
                    });
                } catch (e) {
                    _reportError(e, fileInfo.name);
                }

                // Post a message back to the main thread with the completions
                self.postMessage({type: MessageIds.TERN_CALLED_FUNC_TYPE_MSG,
                    file: fileInfo.name,
                    offset: offset,
                    fnType: fnType,
                    error: error
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
                var fileInfo = createEmptyUpdate(path),
                    request = buildRequest(fileInfo, "completions", {line: 0, ch: 0});
                
                try {
                    ternServer.request(request, function (error, data) {
                        // Post a message back to the main thread
                        self.postMessage({type: MessageIds.TERN_PRIME_PUMP_MSG,
                            path: path
                            });
                    });
                } catch (e) {
                    _reportError(e, path);
                }
            }
            
            /**
             * Updates the configuration, typically for debugging purposes.
             *
             * @param {Object} configUpdate new configuration
             */
            function setConfig(configUpdate) {
                config = configUpdate;
            }
            
            self.addEventListener("message", function (e) {
                var file, text, offset,
                    request = e.data,
                    type = request.type;
                
                if (config.debug) {
                    _log("Message received " + type);
                }
                
                if (type === MessageIds.TERN_INIT_MSG) {
                    
                    var env     = request.env,
                        files   = request.files;
                    inferenceTimeout = request.timeout;
                    
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
                } else if (type === MessageIds.SET_CONFIG) {
                    setConfig(request.config);
                } else {
                    _log("Unknown message: " + JSON.stringify(request));
                }
            });
            // tell the main thread we're ready to start processing messages
            self.postMessage({type: MessageIds.TERN_WORKER_READY});
        });
    });

}());
