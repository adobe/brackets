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
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        FileIndexManager    = brackets.getModule("project/FileIndexManager"),
        HintUtils           = require("HintUtils"),
        MessageIds          = require("MessageIds");
    
    var ternEnvironment     = [],
        pendingTernRequests = {},
        builtinFiles       = ["ecma5.json", "browser.json", "jquery.json"],
        builtinLibraryNames = [],
        rootTernDir         = null,
        projectRoot         = null,
        ternPromise         = null,
        addFilesPromise     = null,
        resolvedFiles       = {},       // file -> resolved file
        numInitialFiles     = 0,
        numResolvedFiles    = 0,
        numAddedFiles       = 0,
        stopAddingFiles     = false,
        // exclude require and jquery since we have special knowledge of those
        // temporarily exclude less*min.js because it is causing instability in tern.
        excludedFilesRegEx  = /require\.js$|jquery[\w.\-]*\.js$|less[\w.\-]*\.min\.js$/,
        isDocumentDirty     = false,
        _ternWorker         = (function () {
            var path = ExtensionUtils.getModulePath(module, "tern-worker.js");
            return new Worker(path);
        }());

    var MAX_TEXT_LENGTH     = 1000000, // about 1MB
        MAX_FILES_IN_DIR    = 100,
        MAX_FILES_IN_PROJECT = 100;

    /**
     * Create a new tern server.
     */
    function initTernServer(dir, files) {
        numResolvedFiles = 0;
        numAddedFiles = 0;
        stopAddingFiles = false;
        numInitialFiles = files.length;

        _ternWorker.postMessage({
            type        : MessageIds.TERN_INIT_MSG,
            dir         : dir,
            files       : files,
            env         : ternEnvironment
        });
        rootTernDir = dir + "/";
    }

    /**
     *  Add new files to tern, keeping any previous files.
     *  The tern server must be initialized before making
     *  this call.
     *
     * @param {Array.<string>} files - array of file to add to tern.
     * @return {boolean} - true if more files may be added, false if maximum has been reached.
     */
    function addFilesToTern(files) {
        // limit the number of files added to tern.
        if (numResolvedFiles + numAddedFiles < MAX_FILES_IN_PROJECT) {
            var available = MAX_FILES_IN_PROJECT - numResolvedFiles - numAddedFiles;

            if (available < files.length) {
                files = files.slice(0, available);
            }

            numAddedFiles += files.length;
            _ternWorker.postMessage({
                type        : MessageIds.TERN_ADD_FILES_MSG,
                files       : files
            });

        } else {
            stopAddingFiles = true;
        }

        return stopAddingFiles;
    }

    /**
     *  An array of library names that contain JavaScript builtins definitions.
     *
     * @returns {Array.<string>} - array of library  names.
     */
    function getBuiltins() {
        return builtinLibraryNames;
    }

    /**
     * Read in the json files that have type information for the builtins, dom,etc
     */
    function initTernEnv() {
        var path = ExtensionUtils.getModulePath(module, "thirdparty/tern/defs/"),
            files = builtinFiles,
            library;

        files.forEach(function (i) {
            NativeFileSystem.resolveNativeFileSystemPath(path + i, function (fileEntry) {
                FileUtils.readAsText(fileEntry).done(function (text) {
                    library = JSON.parse(text);
                    builtinLibraryNames.push(library["!name"]);
                    ternEnvironment.push(library);
                }).fail(function (error) {
                    console.log("failed to read tern config file " + i);
                });
            }, function (error) {
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
        addFilesPromise.done(function (ternWorker) {
            ternWorker.postMessage(msg);
        });
    }

    /**
     * Send a message to the tern worker - this is only for messages that
     * need to be sent before and while the addFilesPromise is being resolved.
     */
    function _postMessageByPass(msg) {
        ternPromise.done(function (ternWorker) {
            ternWorker.postMessage(msg);
        });
    }

    /**
     *  For each file in a directory get a callback with the path of the javascript
     *  file or directory.
     *
     *  dotfiles are ignored.
     *
     * @param {string} dir - directory in which to list the files.
     * @param {function()} doneCallback - called after all of the files have
     * been listed.
     * @param {function(string)} fileCallback - callback for javascript files.
     * The function is passed the full path name of the file.
     * @param {!function(string)=} directoryCallback - callback for directory
     * files. The function is passed the full path name of the file (optional).
     * @param {!function(string)=} errorCallback - Callback for errors (optional).
     */
    function forEachFileInDirectory(dir, doneCallback, fileCallback, directoryCallback, errorCallback) {
        var files = [];

        NativeFileSystem.resolveNativeFileSystemPath(dir, function (dirEntry) {
            var reader = dirEntry.createReader();

            reader.readEntries(function (entries) {
                entries.slice(0, MAX_FILES_IN_DIR).forEach(function (entry) {
                    var path    = entry.fullPath,
                        split   = HintUtils.splitPath(path),
                        file    = split.file;

                    if (fileCallback && entry.isFile) {

                        if (file.indexOf(".") > 0) { // ignore .dotfiles
                            var languageID = LanguageManager.getLanguageForPath(path).getId();
                            if (languageID === HintUtils.LANGUAGE_ID) {
                                fileCallback(path);
                            }
                        }
                    } else if (directoryCallback && entry.isDirectory) {
                        var dirName = HintUtils.splitPath(split.dir).file;
                        if (dirName.indexOf(".") !== 0) { // ignore .dotfiles
                            directoryCallback(entry.fullPath);
                        }
                    }
                });
                doneCallback();
            }, function (err) {
                if (errorCallback) {
                    errorCallback(err);
                }
                console.log("Unable to refresh directory: " + err);
            });
        }, function (err) {
            if (errorCallback) {
                errorCallback(err);
            }
            console.log("Directory \"%s\" does not exist", dir);
        });
    }

    /**
     *  Get a list of javascript files in a given directory.
     *
     * @param {string} dir - directory to list the files of.
     * @param {function(Array.<string>)} successCallback - callback with
     * array of file path names.
     * @param {function(Array.<string>)} errorCallback - callback for
     * when an error occurs.
     */
    function getFilesInDirectory(dir, successCallback, errorCallback) {
        var files = []; // file names without paths.

        /**
         *  Call the success callback with all of the found files.
         */
        function doneCallback() {
            successCallback(files);
        }

        /**
         *  Add files to global list.
         *
         * @param path - full path of file.
         */
        function fileCallback(path) {
            if (!excludedFilesRegEx.test(path)) {
                files.push(path);
            }
        }

        forEachFileInDirectory(dir, doneCallback, fileCallback, null, errorCallback);
    }

    /**
     *  Add the files in the directory and subdirectories of a given directory
     *  to tern.
     *
     * @param {string} dir - the root directory to add.
     * @param {function ()} doneCallback - called when all files have been
     * added to tern.
     */
    function addAllFilesAndSubdirectories(dir, doneCallback) {

        var numDirectoriesLeft = 1;        // number of directories to process

        /**
         *  Add the files in the directory and subdirectories of a given directory
         *  to tern, excluding the rootTernDir).
         *
         * @param {string} dir - the root directory to add.
         * @param {function()} successCallback - callback when
         * done processing files.
         */
        function addAllFilesRecursively(dir, successCallback) {

            var files = [],
                dirs = [];

            function doneCallback() {
                numDirectoriesLeft--;

                if (!stopAddingFiles && files.length > 0 &&
                        (dir + "/") !== rootTernDir) {
                    addFilesToTern(files);
                }

                if (!stopAddingFiles) {
                    dirs.forEach(function (path) {
                        var dir = HintUtils.splitPath(path).dir;
                        if (!stopAddingFiles) {
                            numDirectoriesLeft++;
                            addAllFilesRecursively(dir, successCallback);
                        }
                    });
                }

                if (numDirectoriesLeft === 0) {
                    successCallback();
                }
            }

            /**
             *  Add files to global list.
             *
             * @param path - full path of file.
             */
            function fileCallback(path) {
                if (!excludedFilesRegEx.test(path)) {
                    files.push(path);
                }
            }

            /**
             *  For each directory, add all the files in its subdirectory.
             *
             * @param path
             */
            function directoryCallback(path) {
                if (path !== rootTernDir) {
                    dirs.push(path);
                }
            }

            dir = FileUtils.canonicalizeFolderPath(dir);
            forEachFileInDirectory(dir, doneCallback, fileCallback, directoryCallback);
        }

        addAllFilesRecursively(dir, function () {
            doneCallback();
        });
    }

    /**
     *  Determine whether the current set of files are using modules to pull in
     *  additional files.
     *
     * @returns {boolean} - true if more files than the current directory have
     * been read in.
     */
    function usingModules() {
        return numInitialFiles !== numResolvedFiles;
    }

    /**
     * Add a pending request waiting for the tern-worker to complete.
     *
     * @param {string} file - the name of the file
     * @param {number} offset - the offset into the file the request is for
     * @param {string} type - the type of request
     * @return {jQuery.Promise} - the promise for the request  
     */
    function addPendingRequest(file, offset, type) {
        var requests,
            key = file + "@" + offset,
            $deferredRequest;
        if (CollectionUtils.hasProperty(pendingTernRequests, key)) {
            requests = pendingTernRequests[key];
        } else {
            requests = {};
            pendingTernRequests[key] = requests;
        }

        if (CollectionUtils.hasProperty(requests, type)) {
            $deferredRequest = requests[type];
        } else {
            requests[type] = $deferredRequest = $.Deferred();
        }
        return $deferredRequest.promise();
    }

    /**
     * Get any pending $.Deferred object waiting on the specified file and request type
     * @param {string} file - the file
     * @param {number} offset - the offset in the file the request was at
     * @param {string} type - the type of request
     * @return {jQuery.Deferred} - the $.Deferred for the request     
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
     * @param {string} file a relative path
     * @return {string} returns the path we resolved when we tried to parse the file, or undefined
     */
    function getResolvedPath(file) {
        return resolvedFiles[file];
    }

    /**
     * Get a Promise for the definition from TernJS, for the file & offset passed in.
     * @return {jQuery.Promise} - a promise that will resolve to definition when
     *      it is done
     */
    function getJumptoDef(dir, file, offset, text) {
        postMessage({
            type: MessageIds.TERN_JUMPTODEF_MSG,
            dir: dir,
            file: file,
            offset: offset,
            text: text
        });

        return addPendingRequest(file, offset, MessageIds.TERN_JUMPTODEF_MSG);
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
        
        var ternPromise = getJumptoDef(dir, path, offset, session.getJavascriptText());
        
        return {promise: ternPromise};
    }

    /**
     * Handle the response from the tern web worker when
     * it responds with the definition
     *
     * @param response - the response from the worker
     */
    function handleJumptoDef(response) {
        
        var file = response.file,
            offset = response.offset;
        
        var $deferredJump = getPendingRequest(file, offset, MessageIds.TERN_JUMPTODEF_MSG);
        
        if ($deferredJump) {
            response.fullPath = getResolvedPath(response.resultFile);
            $deferredJump.resolveWith(null, [response]);
        }
    }

    /**
     * Get a Promise for the completions from TernJS, for the file & offset passed in.
     * @param {string} dir - the directory the file is in
     * @param {string} file - the name of the file
     * @param {number} offset - the offset in the file the hints should be calculate at
     * @param {string} text - the text of the file
     * @param {boolean} isProperty - true if getting a property hint,
     * otherwise getting an identifier hint.
     * @return {jQuery.Promise} - a promise that will resolve to an array of completions when
     *      it is done
     */
    function getTernHints(dir, file, offset, text, isProperty) {
        postMessage({
            type: MessageIds.TERN_COMPLETIONS_MSG,
            dir: dir,
            file: file,
            offset: offset,
            text: text,
            isProperty: isProperty
        });
        
        return addPendingRequest(file, offset, MessageIds.TERN_COMPLETIONS_MSG);
    }

    /**
     * Get a Promise for the function type from TernJS.
     * @param {string} dir - the directory the file is in
     * @param {string} file - the name of the file
     * @param {{line:number, ch:number}} pos - the line, column info for what we want the function type of. 
     *      Unfortunately tern requires line/col for this request instead of offset, but we cache all the request
     *      promises by file & offset, so we need the pos and offset for this method
     * @param {number} offset - the offset in the file the hints should be calculate at
     * @param {string} text - the text of the file
     * @return {jQuery.Promise} - a promise that will resolve to the function type of the function being called.
     */
    function getTernFunctionType(dir, file, pos, offset, text) {
        postMessage({
            type: MessageIds.TERN_CALLED_FUNC_TYPE_MSG,
            dir: dir,
            file: file,
            pos: pos,
            offset: offset,
            text: text
        });

        return addPendingRequest(file, offset, MessageIds.TERN_CALLED_FUNC_TYPE_MSG);
    }
    
    
    /**
     * Request hints from Tern.
     *
     * Note that successive calls to getScope may return the same objects, so
     * clients that wish to modify those objects (e.g., by annotating them based
     * on some temporary context) should copy them first. See, e.g.,
     * Session.getHints().
     * 
     * @param {Session} session - the active hinting session
     * @param {Document} document - the document for which scope info is 
     *      desired
     * @return {jQuery.Promise} - The promise will not complete until the tern
     *      hints have completed.
     */
    function requestHints(session, document) {
        var path    = document.file.fullPath,
            split   = HintUtils.splitPath(path),
            dir     = split.dir,
            file    = split.file;
        
        var $deferredHints = $.Deferred(),
            hintPromise,
            fnTypePromise,
            text = session.getJavascriptText(),
            offset = session.getOffset();

        var sessionType = session.getType();
        hintPromise = getTernHints(dir, path, offset, text, sessionType.property);

        if (sessionType.showFunctionType) {
            // Show function sig
            fnTypePromise = getTernFunctionType(dir, path, sessionType.functionCallPos, offset, text);
        } else {
            var $fnTypeDeferred = $.Deferred();
            fnTypePromise = $fnTypeDeferred.promise();
            $fnTypeDeferred.resolveWith(null);
        }

        $.when(hintPromise, fnTypePromise).done(
            function (completions, fnType) {
                if (completions.completions) {
                    session.setTernHints(completions.completions);
                    session.setGuesses(null);
                } else {
                    session.setTernHints([]);
                    session.setGuesses(completions.properties);
                }

                session.setFnType(fnType);
                $deferredHints.resolveWith(null);
            }
        );
        return {promise: $deferredHints.promise()};
    }

    /**
     * Get a Promise for all of the known properties from TernJS, for the directory and file.
     * The properties will be used as guesses in tern.
     * @param {Session} session - the active hinting session
     * @param {Document} document - the document for which scope info is
     *      desired
     * @return {jQuery.Promise} - The promise will not complete until the tern
     *      request has completed.
     */
    function requestGuesses(session, document) {
        var path    = document.file.fullPath,
            text    = session.getJavascriptText(),
            offset  = session.getOffset(),
            $deferred = $.Deferred();

        postMessage({
            type: MessageIds.TERN_GET_GUESSES_MSG,
            dir: "",
            file: path,
            offset: offset,
            text: text
        });

        var promise = addPendingRequest(path, offset, MessageIds.TERN_GET_GUESSES_MSG);
        promise.done(function (guesses) {
            session.setGuesses(guesses);
            $deferred.resolve();
        });

        return $deferred.promise();
    }

    /**
     * Handle the response from the tern web worker when
     * it responds with the list of completions
     *
     * @param {{dir:string, file:string, offset:number, completions:Array.<string>,
     *          properties:Array.<string>}} response - the response from the worker
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
                $deferredHints.resolveWith(null, [{completions: completions}]);
            } else if (properties) {
                $deferredHints.resolveWith(null, [{properties: properties}]);
            } else if (fnType) {
                $deferredHints.resolveWith(null, [fnType]);
            }
        }
    }

    /**
     * Handle a request from the worker for text of a file
     *
     * @param {{file:string}} request - the request from the worker.  Should be an Object containing the name
     *      of the file tern wants the contents of 
     */
    function handleTernGetFile(request) {

        function replyWith(name, txt) {
            _postMessageByPass({
                type: MessageIds.TERN_GET_FILE_MSG,
                file: name,
                text: txt
            });
        }

        var name = request.file;

        /**
         * Helper function to get the text of a given document and send it to tern.
         * If we successfully get the document from the DocumentManager then the text of 
         * the document will be sent to the tern worker.
         * The Promise for getDocumentForPath is returned so that custom fail functions can be
         * used.
         *
         * @param {string} filePath - the path of the file to get the text of
         * @return {jQuery.Promise} - the Promise returned from DocumentMangaer.getDocumentForPath 
         */
        function getDocText(filePath) {
            return DocumentManager.getDocumentForPath(filePath).done(function (document) {
                resolvedFiles[name] = filePath;
                numResolvedFiles++;
                replyWith(name, document.getText());
            });
        }
        
        /**
         * Helper function to find any files in the project that end with the
         * name we are looking for.  This is so we can find requirejs modules 
         * when the baseUrl is unknown, or when the project root is not the same
         * as the script root (e.g. if you open the 'brackets' dir instead of 'brackets/src' dir).
         */
        function findNameInProject() {
            // check for any files in project that end with the right path.
            var fileName = HintUtils.splitPath(name).file;
            FileIndexManager.getFilenameMatches("all", fileName)
                .done(function (files) {
                    var file;
                    files = files.filter(function (file) {
                        var pos = file.fullPath.length - name.length;
                        return pos === file.fullPath.lastIndexOf(name);
                    });
                    
                    if (files.length === 1) {
                        file = files[0];
                    }
                    if (file) {
                        getDocText(file.fullPath).fail(function () {
                            replyWith(name, "");
                        });
                    } else {
                        replyWith(name, "");
                    }
                    
                })
                .fail(function () {
                    replyWith(name, "");
                });
        }

        getDocText(name).fail(function () {
            getDocText(rootTernDir + name).fail(function () {
                // check relative to project root
                getDocText(projectRoot + name)
                    // last look for any files that end with the right path
                    // in the project
                    .fail(findNameInProject);
            });
        });
    }

    /**
     *  Prime the pump for a fast first lookup.
     *
     * @param {string} path - full path of file
     * @param {string} text - text of file
     * @return {jQuery.Promise} - the promise for the request
     */
    function primePump(path, text) {
        _postMessageByPass({
            type        : MessageIds.TERN_PRIME_PUMP_MSG,
            path        : path,
            text        : text
        });

        return addPendingRequest(path, 0, MessageIds.TERN_PRIME_PUMP_MSG);
    }

    /**
     * Handle the response from the tern web worker when
     * it responds to the prime pump message.
     *
     * @param {{path:string, type: string}} response - the response from the worker
     */
    function handlePrimePumpCompletion(response) {

        var path = response.path,
            type = response.type,
            $deferredHints = getPendingRequest(path, 0, type);

        if ($deferredHints) {
            $deferredHints.resolve();
        }
    }

    /**
     * Handle the response from the tern web worker when
     * it responds to the get guesses message.
     *
     * @param {{file:string, type: string, offset: number, properties: Array.<string>}} response -
     *      the response from the worker contains the guesses for a
     *      property lookup.
     */
    function handleGetGuesses(response) {
        var path = response.file,
            type = response.type,
            offset = response.offset,
            $deferredHints = getPendingRequest(path, offset, type);

        if ($deferredHints) {
            $deferredHints.resolveWith(null, [response.properties]);
        }
    }

    /**
     *  Update tern with the new contents of a given file.
     *
     * @param {Document} document - the document to update
     * @return {jQuery.Promise} - the promise for the request
     */
    function updateTernFile(document) {
        var path  = document.file.fullPath;

        _postMessageByPass({
            type       : MessageIds.TERN_UPDATE_FILE_MSG,
            path       : path,
            text       : document.getText()
        });

        return addPendingRequest(path, 0, MessageIds.TERN_UPDATE_FILE_MSG);
    }

    /**
     * Handle the response from the tern web worker when
     * it responds to the update file message.
     *
     * @param {{path:string, type: string}} response - the response from the worker
     */
    function handleUpdateFile(response) {

        var path = response.path,
            type = response.type,
            $deferredHints = getPendingRequest(path, 0, type);

        if ($deferredHints) {
            $deferredHints.resolve();
        }
    }

    /**
     *  We can skip tern initialization if we are opening a file that has
     *  already been added to tern.
     *
     * @param {string} newFile - full path of new file being opened in the editor.
     * @returns {boolean} - true if tern initialization should be skipped,
     * false otherwise.
     */
    function canSkipTernInitialization(newFile) {
        return resolvedFiles[newFile] !== undefined;
    }


    /**
     *  Do the work to initialize a code hinting session.
     *
     * @param {Session} session - the active hinting session
     * @param {Document} document - the document the editor has changed to
     * @param {Document} previousDocument - the document the editor has changed from
     * @param {boolean} shouldPrimePump - true if the pump should be primed.
     */
    function doEditorChange(session, document, previousDocument, shouldPrimePump) {
        var path        = document.file.fullPath,
            split       = HintUtils.splitPath(path),
            dir         = split.dir,
            files       = [],
            file        = split.file,
            pr;

        var ternDeferred     = $.Deferred(),
            addFilesDeferred = $.Deferred();

        ternPromise = ternDeferred.promise();
        addFilesPromise = addFilesDeferred.promise();
        pr = ProjectManager.getProjectRoot() ? ProjectManager.getProjectRoot().fullPath : null;

        // avoid re-initializing tern if possible.
        if (canSkipTernInitialization(path)) {
            // skipping initializing tern
            ternDeferred.resolveWith(null, [_ternWorker]);

            // update the previous document in tern to prevent stale files.
            if (isDocumentDirty && previousDocument) {
                var updateFilePromise = updateTernFile(previousDocument);
                updateFilePromise.done(function () {
                    primePump(path, document.getText());
                    addFilesDeferred.resolveWith(null, [_ternWorker]);
                });
            } else {
                addFilesDeferred.resolveWith(null, [_ternWorker]);
            }

            isDocumentDirty = false;
            return;
        }

        isDocumentDirty = false;
        pendingTernRequests = [];
        resolvedFiles = {};

        projectRoot = pr;
        getFilesInDirectory(dir, function (files) {
            initTernServer(dir, files);
            ternDeferred.resolveWith(null, [_ternWorker]);

            if (shouldPrimePump) {
                var hintsPromise = primePump(path, document.getText());
                hintsPromise.done(function () {
                    if (!usingModules()) {
                        // Read the subdirectories of the new file's directory.
                        // Read them first in case there are too many files to
                        // read in the project.
                        addAllFilesAndSubdirectories(dir, function () {
                            // If the file is in the project root, then read
                            // all the files under the project root.
                            var currentDir = (dir + "/");
                            if (projectRoot && currentDir !== projectRoot &&
                                    currentDir.indexOf(projectRoot) === 0) {
                                addAllFilesAndSubdirectories(projectRoot, function () {
                                    // prime the pump again but this time don't wait
                                    // for completion.
                                    primePump(path, document.getText());

                                    addFilesDeferred.resolveWith(null, [_ternWorker]);
                                });
                            } else {
                                addFilesDeferred.resolveWith(null, [_ternWorker]);
                            }
                        });
                    } else {
                        addFilesDeferred.resolveWith(null, [_ternWorker]);
                    }
                });
            } else {
                addFilesDeferred.resolveWith(null, [_ternWorker]);
            }

        }, function () {
            addFilesDeferred.resolveWith(null);
        });
    }

    /**
     * Called each time a new editor becomes active.
     *
     * @param {Session} session - the active hinting session
     * @param {Document} document - the document of the editor that has changed
     * @param {Document} previousDocument - the document of the editor is changing from
     * @param {boolean} shouldPrimePump - true if the pump should be primed.
     */
    function handleEditorChange(session, document, previousDocument, shouldPrimePump) {
        if (addFilesPromise === null) {
            doEditorChange(session, document, previousDocument, shouldPrimePump);
        } else {
            addFilesPromise.done(function () {
                doEditorChange(session, document, previousDocument, shouldPrimePump);
            });
        }
    }

    /*
     * Called each time the file associated with the active editor changes.
     * Marks the file as being dirty.
     *
     * @param {Document} document - the document that has changed
     */
    function handleFileChange(document) {
        isDocumentDirty = true;
    }

    _ternWorker.addEventListener("message", function (e) {
        var response = e.data,
            type = response.type;

        if (type === MessageIds.TERN_COMPLETIONS_MSG ||
                type === MessageIds.TERN_CALLED_FUNC_TYPE_MSG) {
            // handle any completions the worker calculated
            handleTernCompletions(response);
        } else if (type === MessageIds.TERN_GET_FILE_MSG) {
            // handle a request for the contents of a file
            handleTernGetFile(response);
        } else if (type === MessageIds.TERN_JUMPTODEF_MSG) {
            handleJumptoDef(response);
        } else if (type === MessageIds.TERN_PRIME_PUMP_MSG) {
            handlePrimePumpCompletion(response);
        } else if (type === MessageIds.TERN_GET_GUESSES_MSG) {
            handleGetGuesses(response);
        } else if (type === MessageIds.TERN_UPDATE_FILE_MSG) {
            handleUpdateFile(response);
        } else {
            console.log("Worker: " + (response.log || response));
        }
    });

    exports.getBuiltins = getBuiltins;
    exports.getResolvedPath = getResolvedPath;
    exports.getTernHints = getTernHints;
    exports.handleEditorChange = handleEditorChange;
    exports.requestGuesses = requestGuesses;
    exports.handleFileChange = handleFileChange;
    exports.requestHints = requestHints;
    exports.requestJumptoDef = requestJumptoDef;
});
