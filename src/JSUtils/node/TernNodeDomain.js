/*
 * Copyright (c) 2017 - present Adobe Systems Incorporated. All rights reserved.
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

/*eslint-env node */
/*jslint node: true */
/*global setImmediate */



"use strict";

var config = {};
var _domainManager;
var MessageIds;
var ternOptions;
var self = {
    postMessage: function (data) {
        _domainManager.emitEvent("TernNodeDomain", "data", [data]);
    }
};

var Tern = require("tern"),
    Infer = require("tern/lib/infer");
    
require("tern/plugin/requirejs");
require("tern/plugin/doc_comment");
require("tern/plugin/angular");


var ExtractContent = require("./ExtractFileContent");

var ternServer  = null,
    isUntitledDoc = false,
    inferenceTimeout;

// Save the tern callbacks for when we get the contents of the file
var fileCallBacks = {};

/**
 * Send a log message back from the node to the main thread
 * @private
 * @param {string} msg - the log message
 */
function _log(msg) {
    console.log(msg);
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
        _log("Error thrown in tern_node domain:" + e.message + "\n" + e.stack);
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

function _getNormalizedFilename(fileName) {
    if (!isUntitledDoc && ternServer.projectDir && fileName.indexOf(ternServer.projectDir) === -1) {
        fileName = ternServer.projectDir + fileName;
    }
    return fileName;
}

function _getDenormalizedFilename(fileName) {
    if (!isUntitledDoc && ternServer.projectDir && fileName.indexOf(ternServer.projectDir) === 0) {
        fileName = fileName.slice(ternServer.projectDir.length);
    }
    return fileName;
}

/**
 * Callback handle to request contents of a file from the main thread
 * @param {string} file - the name of the file
 */
function _requestFileContent(name) {
    self.postMessage({
        type: MessageIds.TERN_GET_FILE_MSG,
        file: name
    });
}

/**
 * Provide the contents of the requested file to tern
 * @param {string} name - the name of the file
 * @param {Function} next - the function to call with the text of the file
 *  once it has been read in.
 */
function getFile(name, next) {
    // save the callback
    fileCallBacks[name] = next;

    setImmediate(function () {
        try {
            ExtractContent.extractContent(name, handleGetFile, _requestFileContent);
        } catch (error) {
            console.log(error);
        }
    });
}

/**
 * Create a new tern server.
 *
 * @param {Object} env - an Object with the environment, as read in from
 *  the json files in thirdparty/tern/defs
 * @param {Array.<string>} files - a list of filenames tern should be aware of
 */
function initTernServer(env, files) {
    ternOptions = {
        defs: env,
        async: true,
        getFile: getFile,
        plugins: {requirejs: {}, commonjs: true, doc_comment: true, angular: true}
    };

    // If a server is already created just reset the analysis data before marking it for GC
    if (ternServer) {
        ternServer.reset();
        Infer.resetGuessing();
    }
        
    ternServer = new Tern.Server(ternOptions);

    files.forEach(function (file) {
        ternServer.addFile(file);
    });

}

/**
 * Resets an existing tern server.
 */
function resetTernServer() {
    // If a server is already created just reset the analysis data 
    if (ternServer) {
        ternServer.reset();
        Infer.resetGuessing();
        // tell the main thread we're ready to start processing again
        self.postMessage({type: MessageIds.TERN_WORKER_READY});
    }
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
    query.docs = true;
    query.urls = true;

    var request = {query: query, files: [], offset: offset, timeout: inferenceTimeout};
    if (fileInfo.type !== MessageIds.TERN_FILE_INFO_TYPE_EMPTY) {
        // Create a copy to mutate ahead
        var fileInfoCopy = JSON.parse(JSON.stringify(fileInfo));
        request.files.push(fileInfoCopy);
    }

    return request;
}


/**
 * Get all References location
 * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
 * - type of update, name of file, and the text of the update.
 * For "full" updates, the whole text of the file is present. For "part" updates,
 * the changed portion of the text. For "empty" updates, the file has not been modified
 * and the text is empty.
 * @param {{line: number, ch: number}} offset - the offset into the
 * file for cursor
 */
 function getRefs(fileInfo, offset) {
    var request = buildRequest(fileInfo, "refs", offset);
    try {
        ternServer.request(request, function (error, data) {
            if (error) {
                _log("Error returned from Tern 'refs' request: " + error);
                var response = {
                    type: MessageIds.TERN_REFS,
                    error: error.message
                };
                self.postMessage(response);
                return;
            }
            var response = {
                type: MessageIds.TERN_REFS,
                file: fileInfo.name,
                offset: offset,
                references: data
            };
            // Post a message back to the main thread with the results
            self.postMessage(response);
        });
    } catch (e) {
        _reportError(e, fileInfo.name);
    }
}

/**
 * Get scope at the offset in the file
 * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
 * - type of update, name of file, and the text of the update.
 * For "full" updates, the whole text of the file is present. For "part" updates,
 * the changed portion of the text. For "empty" updates, the file has not been modified
 * and the text is empty.
 * @param {{line: number, ch: number}} offset - the offset into the
 * file for cursor
 */
function getScopeData(fileInfo, offset) {
    // Create a new tern Server
    // Existing tern server resolves all the required modules which might take time
    // We only need to analyze single file for getting the scope
    ternOptions.plugins = {};
    var ternServer = new Tern.Server(ternOptions);
    ternServer.addFile(fileInfo.name, fileInfo.text);

    var error;
    var request = buildRequest(fileInfo, "completions", offset); // for primepump

    try {
        // primepump
        ternServer.request(request, function (ternError, data) {
            if (ternError) {
                _log("Error for Tern request: \n" + JSON.stringify(request) + "\n" + ternError);
                error = ternError.toString();
            } else {
                var file = ternServer.findFile(fileInfo.name);
                var scope = Infer.scopeAt(file.ast, Tern.resolvePos(file, offset), file.scope);

                if (scope) {
                    // Remove unwanted properties to remove cycles in the object
                    scope = JSON.parse(JSON.stringify(scope, function(key, value) {
                        if (["proto", "propertyOf", "onNewProp", "sourceFile", "maybeProps"].includes(key)) {
                            return undefined;
                        }
                        else if (key === "fnType") {
                             return value.name || "FunctionExpression";
                        }
                        else if (key === "props") {
                            for (var key in value) {
                                value[key] = value[key].propertyName;
                            }
                            return value;
                        } else if (key === "originNode") {
                            return value && {
                                start: value.start,
                                end: value.end
                            };
                        }

                        return value;
                    }));
                }

                self.postMessage({
                    type: MessageIds.TERN_SCOPEDATA_MSG,
                    file: _getNormalizedFilename(fileInfo.name),
                    offset: offset,
                    scope: scope
                });
            }
        });
    } catch (e) {
        _reportError(e, fileInfo.name);
    } finally {
        ternServer.reset();
        Infer.resetGuessing();
    }
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
            var response = {
                type: MessageIds.TERN_JUMPTODEF_MSG,
                file: _getNormalizedFilename(fileInfo.name),
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
                properties = data.completions.map(function (completion) {
                    return {value: completion, type: completion.type, guess: true};
                });
            }
            // Post a message back to the main thread with the completions
            self.postMessage({type: type,
                              file: _getNormalizedFilename(fileInfo.name),
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
                //_log("found " + data.completions + " for " + file + "@" + offset);
                completions = data.completions.map(function (completion) {
                    return {value: completion.name, type: completion.type, depth: completion.depth,
                        guess: completion.guess, origin: completion.origin, doc: completion.doc, url: completion.url};
                });
            }

            if (completions.length > 0 || !isProperty) {
                // Post a message back to the main thread with the completions
                self.postMessage({type: MessageIds.TERN_COMPLETIONS_MSG,
                    file: _getNormalizedFilename(fileInfo.name),
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

        result += inferArrType.props["<i>"].types.map(inferTypeToString).join(", ");

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

        result += Object.keys(props).map(function (key) {
            return key + ": " + inferTypeToString(props[key]);
        }).join(", ");

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
     * Format the given parameter array. Handles separators between
     * parameters, syntax for optional parameters, and the order of the
     * parameter type and parameter name.
     *
     * @param {!Array.<{name: string, type: string, isOptional: boolean}>} params -
     * array of parameter descriptors
     * @param {function(string)=} appendSeparators - callback function to append separators.
     * The separator is passed to the callback.
     * @param {function(string, number)=} appendParameter - callback function to append parameter.
     * The formatted parameter type and name is passed to the callback along with the
     * current index of the parameter.
     * @param {boolean=} typesOnly - only show parameter types. The
     * default behavior is to include both parameter names and types.
     * @return {string} - formatted parameter hint
     */
    function formatParameterHint(params, appendSeparators, appendParameter, typesOnly) {
        var result = "",
            pendingOptional = false;

        params.forEach(function (value, i) {
            var param = value.type,
                separators = "";

            if (value.isOptional) {
                // if an optional param is following by an optional parameter, then
                // terminate the bracket. Otherwise enclose a required parameter
                // in the same bracket.
                if (pendingOptional) {
                    separators += "]";
                }

                pendingOptional = true;
            }

            if (i > 0) {
                separators += ", ";
            }

            if (value.isOptional) {
                separators += "[";
            }

            if (appendSeparators) {
                appendSeparators(separators);
            }

            result += separators;

            if (!typesOnly) {
                param += " " + value.name;
            }

            if (appendParameter) {
                appendParameter(param, i);
            }

            result += param;

        });

        if (pendingOptional) {
            if (appendSeparators) {
                appendSeparators("]");
            }

            result += "]";
        }

        return result;
    }

    /**
     * Convert an infer function type to a Google closure type string.
     *
     * @param {Infer.Fn} inferType - type to convert.
     * @return {string} - function type as a string.
     */
    inferFnTypeToString = function (inferType) {
        var result = "function(",
            params = processInferFnTypeParameters(inferType);

        result += /*HintUtils2.*/formatParameterHint(params, null, null, true);
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
        file: _getNormalizedFilename(fileInfo.name),
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
    Infer.resetGuessing();
}

/**
 *  Make a completions request to tern to force tern to resolve files
 *  and create a fast first lookup for the user.
 * @param {string} path     - the path of the file
 */
function handlePrimePump(path) {
    var fileName = _getDenormalizedFilename(path);
    var fileInfo = createEmptyUpdate(fileName),
        request = buildRequest(fileInfo, "completions", {line: 0, ch: 0});

    try {
        ternServer.request(request, function (error, data) {
            // Post a message back to the main thread
            self.postMessage({type: MessageIds.TERN_PRIME_PUMP_MSG,
                path: _getNormalizedFilename(path)
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

function _requestTernServer(commandConfig) {
    var file, text, offset,
        request = commandConfig,
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
    } else if (type === MessageIds.TERN_REFS) {
        offset  = request.offset;
        getRefs(request.fileInfo, offset);
    } else if (type === MessageIds.TERN_SCOPEDATA_MSG) {
        offset  = request.offset;
        getScopeData(request.fileInfo, offset);
    } else if (type === MessageIds.TERN_ADD_FILES_MSG) {
        handleAddFiles(request.files);
    } else if (type === MessageIds.TERN_PRIME_PUMP_MSG) {
        isUntitledDoc = request.isUntitledDoc;
        handlePrimePump(request.path);
    } else if (type === MessageIds.TERN_GET_GUESSES_MSG) {
        offset  = request.offset;
        getTernProperties(request.fileInfo, offset, MessageIds.TERN_GET_GUESSES_MSG);
    } else if (type === MessageIds.TERN_UPDATE_FILE_MSG) {
        handleUpdateFile(request.path, request.text);
    } else if (type === MessageIds.SET_CONFIG) {
        setConfig(request.config);
    } else if (type === MessageIds.TERN_UPDATE_DIRTY_FILE) {
        ExtractContent.updateFilesCache(request.name, request.action);
    } else if (type === MessageIds.TERN_CLEAR_DIRTY_FILES_LIST) {
        ExtractContent.clearFilesCache();
    } else {
        _log("Unknown message: " + JSON.stringify(request));
    }
}

function invokeTernCommand(commandConfig) {
    try {
        _requestTernServer(commandConfig);
    } catch (error) {
        console.warn(error);
    }
}

function setInterface(msgInterface) {
    MessageIds = msgInterface.messageIds;
}

function checkInterfaceAndReInit() {
    if (!MessageIds) {
        // WTF - Worse than failure
        // We are here as node process got restarted 
        // Request for ReInitialization of interface and Tern Server
        self.postMessage({
            type: "RE_INIT_TERN"
        });
    }
}

 /**
 * Initialize the test domain with commands and events related to find in files.
 * @param {DomainManager} domainManager The DomainManager for the TernNodeDomain
 */
function init(domainManager) {
    if (!domainManager.hasDomain("TernNodeDomain")) {
        domainManager.registerDomain("TernNodeDomain", {major: 0, minor: 1});
    }

    _domainManager = domainManager;

    domainManager.registerCommand(
        "TernNodeDomain",       // domain name
        "invokeTernCommand",    // command name
        invokeTernCommand,   // command handler function
        false,          // this command is synchronous in Node
        "Invokes a tern command on node",
        [{name: "commandConfig", // parameters
            type: "object",
            description: "Object containing tern command configuration"}]
    );

    domainManager.registerCommand(
        "TernNodeDomain",       // domain name
        "setInterface",    // command name
        setInterface,   // command handler function
        false,          // this command is synchronous in Node
        "Sets the shared message interface",
        [{name: "msgInterface", // parameters
            type: "object",
            description: "Object containing messageId enums"}]
    );

    domainManager.registerCommand(
        "TernNodeDomain",       // domain name
        "resetTernServer",    // command name
        resetTernServer,   // command handler function
        true,          // this command is synchronous in Node
        "Resets an existing tern server"
    );

    domainManager.registerEvent(
        "TernNodeDomain",     // domain name
        "data",   // event name
        [
            {
                name: "data",
                type: "Object",
                description: "data to be returned to main thread"
            }
        ]
    );
    setTimeout(checkInterfaceAndReInit, 1000);
}

exports.init = init;
