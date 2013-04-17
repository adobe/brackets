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

/*
 * Throughout this file, the term "outer scope" is used to refer to the outer-
 * most/global/root Scope objects for particular file. The term "inner scope"
 * is used to refer to a Scope object that is reachable via the child relation
 * from an outer scope.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, Worker */

define(function (require, exports, module) {
    "use strict";

    var DocumentManager     = brackets.getModule("document/DocumentManager"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        CollectionUtils     = brackets.getModule("utils/CollectionUtils"),
        HintUtils           = require("HintUtils");
    
    var ternEnvironment     = [],
        pendingTernRequests = {},
        _builtins            = ["ecma5.json", "browser.json"],
        rootTernDir         = null,
        projectRoot         = null,
        ternPromise         = null,
        resolvedFiles       = {},       // file -> resolved file
        _ternWorker          = (function () {
            var path = module.uri.substring(0, module.uri.lastIndexOf("/") + 1);
            return new Worker(path + "tern-worker.js");
        }());

    var MAX_TEXT_LENGTH     = 1000000, // about 1MB
        MAX_FILES_IN_DIR    = 100;

    /**
     * Create a new tern server.
     */
    function initTernServer(dir, files) {
        _ternWorker.postMessage({
            type        : HintUtils.TERN_INIT_MSG,
            dir         : dir,
            files       : files,
            env         : ternEnvironment
        });
        rootTernDir = dir + "/";
    }

    /**
     *  An array of JSON files names contain JavaScript builtins definitions.
     *
     * @returns {Array} - array of filenames.
     */
    function getBuiltins() {
        return _builtins;
    }

    /**
     * Read in the json files that have type information for the builtins, dom,etc
     */
    function initTernEnv() {
        var path = module.uri.substring(0, module.uri.lastIndexOf("/") + 1) + "thirdparty/tern/defs/";
        var files = getBuiltins();

        files.forEach(function (i) {
            DocumentManager.getDocumentForPath(path + i).done(function (document) {
                ternEnvironment.push(JSON.parse(document.getText()));
            }).fail(function (error) {
                console.log("failed to read tern config file " + i);
            });
        });
    }

    initTernEnv();
    
    /**
     * Send a message to the tern worker - if the worker is being initialized,
     * the message will not be posted until initialization is complete
     */
    function postMessage(msg) {
        ternPromise.done(function (ternWorker) {
            ternWorker.postMessage(msg);
        });
    }
    

    /**
     * Get a Promise for the definition from TernJS, for the file & offset passed in.
     * @return {jQuery.Promise} - a promise that will resolve to definition when
     *      it is done
     */
    function getJumptoDef(dir, file, offset, text) {
        postMessage({
            type: HintUtils.TERN_JUMPTODEF_MSG,
            dir: dir,
            file: file,
            offset: offset,
            text: text
        });

        var $deferredJump = $.Deferred();
        pendingTernRequests[file] = $deferredJump;
        return $deferredJump.promise();
    }

    /**
     * Request Jump-To-Definition from Tern.
     *
     * @param {session} session - the session
     * @param {Document} document - the document
     * @param {number} offset - the offset into the document
     * @return {jQuery.Promise} - The promise will not complete until tern
     *      has completed.
     */
    function requestJumptoDef(session, document, offset) {
        var path    = document.file.fullPath,
            split   = HintUtils.splitPath(path),
            dir     = split.dir,
            file    = split.file;
        
        var ternPromise = getJumptoDef(dir, file, offset, document.getText());
        
        return {promise: ternPromise};
    }

    /**
     * Handle the response from the tern web worker when
     * it responds with the definition
     *
     * @param response - the response from the worker
     */
    function handleJumptoDef(response) {
        
        var file = response.file;
        var $deferredJump = pendingTernRequests[file];
        
        pendingTernRequests[file] = null;
        
        if ($deferredJump) {
            $deferredJump.resolveWith(null, [response]);
        }
    }

    /**
     * Add a pending request waiting for the tern-worker to complete.
     *
     * @param {string} file - the name of the file
     * @param {string} type - the type of request
     * @param {jQuery.Deferred} deferredRequest - the $.Deferred object to save     
     */
    function addPendingRequest(file, offset, type) {
        var requests,
            key = file + "@" + offset,
            $deferredRequest;
        if (Object.prototype.hasOwnProperty.call(pendingTernRequests, key)) {
            requests = pendingTernRequests[key];
        } else {
            requests = {};
            pendingTernRequests[key] = requests;
        }

        if (Object.prototype.hasOwnProperty.call(requests, type)) {
            $deferredRequest = requests[type];
        } else {
            requests[type] = $deferredRequest = $.Deferred();
        }
        return $deferredRequest.promise();
    }
    
    /**
     * Get a Promise for the completions from TernJS, for the file & offset passed in.
     * @return {jQuery.Promise} - a promise that will resolve to an array of completions when
     *      it is done
     */
    function getTernHints(dir, file, offset, text) {
        postMessage({
            type: HintUtils.TERN_COMPLETIONS_MSG,
            dir: dir,
            file: file,
            offset: offset,
            text: text
        });
        
        return addPendingRequest(file, offset, HintUtils.TERN_COMPLETIONS_MSG);
    }

    /**
     * Get a Promise for all of the known properties from TernJS, for the directory and file.
     * The properties will be used as guesses in tern.
     *
     * @return {jQuery.Promise} - a promise that will resolve to an array of properties when
     *      it is done
     */
    function getTernProperties(dir, file, offset, text) {
        postMessage({
            type: HintUtils.TERN_GET_PROPERTIES_MSG,
            dir: dir,
            file: file,
            offset: offset,
            text: text
        });

        return addPendingRequest(file, offset, HintUtils.TERN_GET_PROPERTIES_MSG);
    }

    /**
     * Get a Promise for the function type from TernJS.
     * @return {jQuery.Promise} - a promise that will resolve to the function type of the function being called.
     */
    function getTernFunctionType(dir, file, pos, offset, text) {
        postMessage({
            type: HintUtils.TERN_CALLED_FUNC_TYPE_MSG,
            dir: dir,
            file: file,
            pos: pos,
            offset: offset,
            text: text
        });

        return addPendingRequest(file, offset, HintUtils.TERN_CALLED_FUNC_TYPE_MSG);
    }
    
    
    /**
     * Request hints from Tern.
     *
     * Note that successive calls to getScope may return the same objects, so
     * clients that wish to modify those objects (e.g., by annotating them based
     * on some temporary context) should copy them first. See, e.g.,
     * Session.getHints().
     * 
     * @param {Document} document - the document for which scope info is 
     *      desired
     * @param {number} offset - the offset into the document at which scope
     *      info is desired
     * @return {jQuery.Promise} - The promise will not complete until the tern
     *      hints have completed.
     */
    function requestHints(session, document, offset) {
        var path    = document.file.fullPath,
            split   = HintUtils.splitPath(path),
            dir     = split.dir,
            file    = split.file;
        
        var $deferredHints = $.Deferred(),
            hintPromise,
            fnTypePromise,
            propsPromise;
        
        hintPromise = getTernHints(dir, file, offset, document.getText());
        var sessionType = session.getType();
        if (sessionType.property) {
            propsPromise = getTernProperties(dir, file, offset, document.getText());
        } else {
            var $propsDeferred = $.Deferred();
            propsPromise = $propsDeferred.promise();
            $propsDeferred.resolveWith(null);
        }

        if (sessionType.showFunctionType) {
            // Show function sig
            fnTypePromise = getTernFunctionType(dir, file, sessionType.functionCallPos, offset, document.getText());
        } else {
            var $fnTypeDeferred = $.Deferred();
            fnTypePromise = $fnTypeDeferred.promise();
            $fnTypeDeferred.resolveWith(null);
        }
        $.when(hintPromise, fnTypePromise, propsPromise).done(
            function (completions, fnType, properties) {
                session.setTernHints(completions);
                session.setFnType(fnType);
                session.setTernProperties(properties);

                $deferredHints.resolveWith(null);
            }
        );
        return {promise: $deferredHints.promise()};
    }

    /**
     * Get any pending $.Deferred object waiting on the specified file and request type
     * @param {string} file - the file
     * @param {string} type - the type of request
     * @param {jQuery.Deferred} - the $.Deferred for the request     
     */
    function getPendingRequest(file, offset, type) {
        var key = file + "@" + offset;
        if (CollectionUtils.hasProperty(pendingTernRequests, key)) {
            var requests = pendingTernRequests[key],
                requestType = requests[type];

            delete pendingTernRequests[key][type];

            if (!Object.keys(requests).length) {
                delete pendingTernRequests[key];
            }

            return requestType;
        }
    }
    
    /**
     * Handle the response from the tern web worker when
     * it responds with the list of completions
     *
     * @param {{dir:string, file:string, offset:number, completions:Array.<string>}} response - the response from the worker
     */
    function handleTernCompletions(response) {
        
        var file = response.file,
            offset = response.offset,
            completions = response.completions,
            properties = response.properties,
            fnType  = response.fnType,
            type = response.type,
            $deferredHints = getPendingRequest(file, offset, type);
        
        if ($deferredHints) {
            if (completions) {
                $deferredHints.resolveWith(null, [completions]);
            } else if (properties) {
                $deferredHints.resolveWith(null, [properties]);
            } else if (fnType) {
                $deferredHints.resolveWith(null, [fnType]);
            }
        }
    }
    
    /**
     * @param {string} file a relative path
     * @return {string} returns the path we resolved when we tried to parse the file, or undefined
     */
    function getResolvedPath(file) {
        return resolvedFiles[file];
    }

    /**
     * Handle a request from the worker for text of a file
     *
     * @param {{file:string}} request - the request from the worker.  Should be an Object containing the name
     *      of the file tern wants the contents of 
     */
    function handleTernGetFile(request) {

        function replyWith(name, txt) {
            postMessage({
                type: HintUtils.TERN_GET_FILE_MSG,
                file: name,
                text: txt
            });
        }

        var name = request.file;
        DocumentManager.getDocumentForPath(rootTernDir + name).done(function (document) {
            resolvedFiles[name] = rootTernDir + name;
            replyWith(name, document.getText());
        })
            .fail(function () {
                if (projectRoot) {
                    // Try relative to project root
                    DocumentManager.getDocumentForPath(projectRoot + name).done(function (document) {
                        resolvedFiles[name] = projectRoot + name;
                        replyWith(name, document.getText());
                    })
                        .fail(function () {
                            replyWith(name, "");
                        });
                } else {
                    // Need to send something back to tern - it will wait
                    // until all the files have been retrieved before doing its calculations
                    replyWith(name, "");
                }
            });
    }
    
    /**
     * Called each time a new editor becomes active. Refreshes the outer scopes
     * of the given file as well as of the other files in the given directory.
     * 
     * @param {Document} document - the document of the editor that has changed
     */
    function handleEditorChange(document) {
        var path        = document.file.fullPath,
            split       = HintUtils.splitPath(path),
            dir         = split.dir,
            files       = [],
            file        = split.file;

        var ternDeferred = $.Deferred();
        ternPromise = ternDeferred.promise();
        pendingTernRequests = [];
        resolvedFiles = {};
        projectRoot = ProjectManager.getProjectRoot() ? ProjectManager.getProjectRoot().fullPath : null;

        NativeFileSystem.resolveNativeFileSystemPath(dir, function (dirEntry) {
            var reader = dirEntry.createReader();

            reader.readEntries(function (entries) {
                entries.slice(0, MAX_FILES_IN_DIR).forEach(function (entry) {
                    if (entry.isFile) {
                        var path    = entry.fullPath,
                            split   = HintUtils.splitPath(path),
                            dir     = split.dir,
                            file    = split.file;
                        
                        if (file.indexOf(".") > 1) { // ignore /.dotfiles
                            var languageID = LanguageManager.getLanguageForPath(entry.fullPath).getId();
                            if (languageID === HintUtils.LANGUAGE_ID) {
                                files.push(file);
                            }
                        }
                    }
                });
                initTernServer(dir, files);
                ternDeferred.resolveWith(null, [_ternWorker]);
            }, function (err) {
                console.log("Unable to refresh directory: " + err);
            });
        }, function (err) {
            console.log("Directory \"%s\" does not exist", dir);
        });
        
    }

    /*
     * Called each time the file associated with the active editor changes.
     * Marks the file as being dirty and refresh its outer scope.
     * 
     * @param {Document} document - the document that has changed
     */
    function handleFileChange(document) {
    }

    _ternWorker.addEventListener("message", function (e) {
        var response = e.data,
            type = response.type;

        if (type === HintUtils.TERN_COMPLETIONS_MSG ||
                type === HintUtils.TERN_CALLED_FUNC_TYPE_MSG ||
                type === HintUtils.TERN_GET_PROPERTIES_MSG) {
            // handle any completions the worker calculated
            handleTernCompletions(response);
        } else if (type === HintUtils.TERN_GET_FILE_MSG) {
            // handle a request for the contents of a file
            handleTernGetFile(response);
        } else if (type === HintUtils.TERN_JUMPTODEF_MSG) {
            handleJumptoDef(response);
        } else {
            console.log("Worker: " + (response.log || response));
        }
    });
    
    exports.getBuiltins = getBuiltins;
    exports.handleEditorChange = handleEditorChange;
    exports.handleFileChange = handleFileChange;
    exports.requestJumptoDef = requestJumptoDef;
    exports.requestHints = requestHints;
    exports.getTernHints = getTernHints;
    exports.getResolvedPath = getResolvedPath;
});
