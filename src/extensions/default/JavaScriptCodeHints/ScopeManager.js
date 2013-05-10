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
        HintUtils           = require("HintUtils");
    
    var ternEnvironment     = [],
        pendingTernRequests = {},
        builtinFiles       = ["ecma5.json", "browser.json", "jquery.json"],
        builtinLibraryNames = [],
        rootTernDir         = null,
        projectRoot         = null,
        ternPromise         = null,
        addFilesPromise     = null,
        numDirectoriesLeft  = 0,        // number of directories to process
        resolvedFiles       = {},       // file -> resolved file
        initialFiles        = [],
        numResolvedFiles    = 0,
        numAddedFiles       = 0,
        stopAddingFiles     = false,
        allowSkipTernInit   = false,
        excludedFilesRegEx  = [/require\.js$/, /jquery-[\d]\.[\d]\.js$/, /\.min\.js$/],
        _ternWorker         = (function () {
            var path = ExtensionUtils.getModulePath(module, "tern-worker.js");
            return new Worker(path);
        }());

    var MAX_TEXT_LENGTH     = 1000000, // about 1MB
        MAX_FILES_IN_DIR    = 100,
        MAX_FILES_IN_PROJECT = 2;

    /**
     * Create a new tern server.
     */
    function initTernServer(dir, files) {
        numResolvedFiles = 0;
        numAddedFiles = 0;
        stopAddingFiles = false;

        _ternWorker.postMessage({
            type        : HintUtils.TERN_INIT_MSG,
            dir         : dir,
            files       : files,
            env         : ternEnvironment
        });
        rootTernDir = dir + "/";
        initialFiles = files;
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

            console.log("addFilesToTern: " + files);

            _ternWorker.postMessage({
                type        : HintUtils.TERN_ADD_FILES_MSG,
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
     * @returns {Array} - array of library  names.
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
     *
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
     *  Get a list of files in a given directory.
     *
     * @param {string} dir - directory to list of files of.
     * @param {function(Array.<string>)} successCallback - callback with
     * array of file path names.
     */
    function getFilesInDirectory(dir, successCallback) {
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
            files.push(path);
        }

        forEachFileInDirectory(dir, doneCallback, fileCallback);
    }

    /**
     *  Add the files in the directory and subdirectories of a given directory
     *  to tern.
     *
     * @param {string} dir - the directory to add
     * be included.
     * @param {function()} successCallback - callback when
     * done processing files.
     */
    function addAllFilesRecursively(dir, successCallback) {

        var files = [],
            dirs = [];

        console.log("addFiles: dir = " + dir + " numDirectoriesLeft = " + numDirectoriesLeft);

        function doneCallback() {
            numDirectoriesLeft--;
            console.log("doneCallback: dir = " + dir + " numDirectoriesLeft = " + numDirectoriesLeft);

            if (!stopAddingFiles && files.length > 0 &&
                    dir !== rootTernDir) {
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
            var includeFile = excludedFilesRegEx.every(function (regEx) {
                    return path.search(regEx) === -1;
                });

            if (includeFile) {
                files.push(path);
            } else {
                console.log("excluded " + path);
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

        forEachFileInDirectory(dir, doneCallback, fileCallback, directoryCallback);
    }

    /**
     *  Add the files in the directory and subdirectories of a given directory
     *  to tern.
     *
     * @param {string} dir - the directory to add
     * be included.
     * @param {function ()} doneCallback - called when all files have been
     * added to tern.
     */
    function addAllFilesAndSubdirectories(dir, doneCallback) {

        numDirectoriesLeft = 1;
        addAllFilesRecursively(dir, function () {
            doneCallback();
        });
    }


    /**
     *  Determine whether the current set of files are using modules to pull in
     *  other additional files.
     *
     * @returns {boolean} - true if more files than the current directory have
     * been read in.
     */
    function usingModules() {
        return initialFiles.length !== numResolvedFiles;
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
     * Get a Promise for the completions from TernJS, for the file & offset passed in.
     * @param {string} dir - the directory the file is in
     * @param {string} file - the name of the file
     * @param {number} offset - the offset in the file the hints should be calculate at
     * @param {string} text - the text of the file
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
     * @param {string} dir - the directory the file is in
     * @param {string} file - the name of the file
     * @param {number} offset - the offset in the file the hints should be calculate at
     * @param {string} text - the text of the file
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
     * @param {Session} session - the active hinting session
     * @param {Document} document - the document for which scope info is 
     *      desired
     * @param {number} offset - the offset into the document at which scope
     *      info is desired
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
            propsPromise,
            text = session.getJavascriptText(),
            offset = session.getOffset();
        
        hintPromise = getTernHints(dir, path, offset, text);
        var sessionType = session.getType();
        if (sessionType.property) {
            propsPromise = getTernProperties(dir, path, offset, text);
        } else {
            var $propsDeferred = $.Deferred();
            propsPromise = $propsDeferred.promise();
            $propsDeferred.resolveWith(null);
        }

        if (sessionType.showFunctionType) {
            // Show function sig
            fnTypePromise = getTernFunctionType(dir, path, sessionType.functionCallPos, offset, text);
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

            if (txt === "") {
                console.log("file not found " + name);
            }

            _postMessageByPass({
                type: HintUtils.TERN_GET_FILE_MSG,
                file: name,
                text: txt
            });
        }

        var name = request.file,
            bangName = name;

//        if (name.search(/^(i18n|text)!/) === 0) {
//            bangName = name.substring(name.indexOf("!") + 1);
//        }

        console.log("handleTernGetFile: " + name);

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
            var fileName = HintUtils.splitPath(bangName).file;
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

        getDocText(bangName).fail(function () {
            getDocText(rootTernDir + bangName).fail(function () {
                // check relative to project root
                getDocText(projectRoot + bangName)
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
            type        : HintUtils.TERN_PRIME_PUMP_MSG,
            path        : path,
            text        : text
        });

        return addPendingRequest(path, 0, HintUtils.TERN_PRIME_PUMP_MSG);
    }

    /**
     * Handle the response from the tern web worker when
     * it responds.
     *
     * @param {{path:string, type: string}} response - the response from the worker
     */
    function handlePrimePumpCompletion(response) {

        var file = response.path,
            type = response.type,
            $deferredHints = getPendingRequest(file, 0, type);

        if ($deferredHints) {
            $deferredHints.resolve();
        }
    }

    /**
     *  We can skip tern initialization if we are opening a file in the same
     *  project as before and we have read all the directories of that project.
     *  If we haven't read all the directories then we reinitialize tern in
     *  case we haven't read the new directory (we could track all the track all the
     *  processed directories or go through the list of resolved files if we
     *  really need to but it seems like an edge case at this point).
     *
     *  We also re-initialize tern if we are reading a file that is outside of
     *  the project and is not the current tern root.
     *
     * @param {string} dir - directory of file to open
     * @param {string} oldProjectRoot - path of project root before opening the
     * current file.
     * @returns {boolean|null|boolean|Number}
     */
    function canSkipTernInitialization(dir, oldProjectRoot) {

        if (!allowSkipTernInit) {
            return false;
        }

        var pr  = ProjectManager.getProjectRoot() ? ProjectManager.getProjectRoot().fullPath : null;
            
        dir = dir + "/";

        if (!rootTernDir || !pr) {
            return false;
        } else if (stopAddingFiles) {
            return false;
        } else if (pr !== oldProjectRoot) {
            // re-init if the project root has changed
            return false;
        } else if (dir.indexOf(rootTernDir) === 0 ||
                (dir.indexOf(pr) === 0  && rootTernDir.indexOf(pr) === 0)) {
            // current directory is a subdirectory of the tern root or
            // the current directory is a subdirectory of the project
            // root and the tern root is as well.
            return true;
        }

        return false;
    }

    /**
     * Called each time a new editor becomes active. Refreshes the outer scopes
     * of the given file as well as of the other files in the given directory.
     *
     * @param {Session} session - the active hinting session
     * @param {Document} document - the document of the editor that has changed
     * @param {boolean} shouldPrimePump - true if the pump should be primed.
     */
    function handleEditorChange(session, document, shouldPrimePump) {
        var path        = document.file.fullPath,
            split       = HintUtils.splitPath(path),
            dir         = split.dir,
            files       = [],
            file        = split.file,
            pr;

        pr = ProjectManager.getProjectRoot() ? ProjectManager.getProjectRoot().fullPath : null;

        // if we hit our limit of file last time and we are opening a file
        // in a different directory, then re-initialize tern with those
        // files, unless we have already read that directory.
        if (canSkipTernInitialization(dir, projectRoot)) {
            // skipping initializing tern
            console.log("skipping tern init");
            return;
        }

        var ternDeferred     = $.Deferred(),
            addFilesDeferred = $.Deferred();

        ternPromise = ternDeferred.promise();
        addFilesPromise = addFilesDeferred.promise();
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
                        // if changing to a directory outside of the project
                        // root then read the subdirs of dir, not the project root.
                        var targetDir;

                        if (!projectRoot || (dir + "/").indexOf(projectRoot) !== 0) {
                            targetDir = dir;
                        } else {
                            targetDir = projectRoot;
                        }
                        console.log("dir = " + dir);
                        console.log("projectRoot = " + projectRoot);
                        console.log("targetDir = " + targetDir);
                        addAllFilesAndSubdirectories(targetDir, function () {
                            addFilesDeferred.resolveWith(null, [_ternWorker]);

                            // prime the pump again but this time don't wait
                            // for completion.
                            primePump(path, document.getText());
                        });
                    } else {
                        console.log("using modules");
                        addFilesDeferred.resolveWith(null, [_ternWorker]);
                    }
                });
            } else {
                addFilesDeferred.resolveWith(null, [_ternWorker]);
            }

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
        } else if (type === HintUtils.TERN_PRIME_PUMP_MSG) {
            handlePrimePumpCompletion(response);
        } else {
            console.log("Worker: " + (response.log || response));
        }
    });

    exports.getBuiltins = getBuiltins;
    exports.getResolvedPath = getResolvedPath;
    exports.getTernHints = getTernHints;
    exports.usingModules = usingModules;
    exports.handleEditorChange = handleEditorChange;
    exports.handleFileChange = handleFileChange;
    exports.requestHints = requestHints;
    exports.requestJumptoDef = requestJumptoDef;
});
