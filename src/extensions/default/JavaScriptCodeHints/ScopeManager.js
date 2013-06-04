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
/*global define, brackets, CodeMirror, $, Worker, setTimeout */

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
        // exclude require and jquery since we have special knowledge of those
        // temporarily exclude less*min.js because it is causing instability in tern.
        // exclude ember*.js as it is currently causing problems
        excludedFilesRegEx  = /require\.js$|jquery[\w.\-]*\.js$|less[\w.\-]*\.min\.js$|ember[\w.\-]*\.js$/,
        isDocumentDirty     = false,
        _hintCount          = 0,
        _lastPrimePump      = false,
        currentWorker       = null,
        documentChanges     = null;     // bounds of document changes

    var MAX_TEXT_LENGTH      = 512 * 1024,
        MAX_FILES_IN_DIR     = 100,
        MAX_FILES_IN_PROJECT = 100,
        // how often to reset the tern server
        MAX_HINTS           = 30,
        LARGE_LINE_CHANGE    = 100,
        LARGE_LINE_COUNT     = 250,
        OFFSET_ZERO          = {line: 0, ch: 0};

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
        currentWorker.postMessage(msg);
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
     * Add a pending request waiting for the tern-worker to complete.
     *
     * @param {string} file - the name of the file
     * @param {{line: number, ch: number}} offset - the offset into the file the request is for
     * @param {string} type - the type of request
     * @return {jQuery.Promise} - the promise for the request  
     */
    function addPendingRequest(file, offset, type) {
        var requests,
            key = file + "@" + offset.line + "@" + offset.ch,
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
     * @param {{line: number, ch: number}} offset - the offset into the file the request is for
     * @param {string} type - the type of request
     * @return {jQuery.Deferred} - the $.Deferred for the request     
     */
    function getPendingRequest(file, offset, type) {
        var key = file + "@" + offset.line + "@" + offset.ch;
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
        return currentWorker.getResolvedPath(file);
    }

    /**
     * Get a Promise for the definition from TernJS, for the file & offset passed in.
     * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
     * - type of update, name of file, and the text of the update.
     * For "full" updates, the whole text of the file is present. For "part" updates,
     * the changed portion of the text. For "empty" updates, the file has not been modified
     * and the text is empty.
     * @param {{line: number, ch: number}} offset - the offset in the file the hints should be calculate at
     * @return {jQuery.Promise} - a promise that will resolve to definition when
     *      it is done
     */
    function getJumptoDef(fileInfo, offset) {
        postMessage({
            type: MessageIds.TERN_JUMPTODEF_MSG,
            fileInfo: fileInfo,
            offset: offset
        });

        return addPendingRequest(fileInfo.name, offset, MessageIds.TERN_JUMPTODEF_MSG);
    }

    /**
     * check to see if the text we are sending to Tern is too long.
     * @param {string} the text to check
     * @return {string} the text, or the empty text if the original was too long
     */
    function filterText(text) {
        var newText = text;
        if (text.length > MAX_TEXT_LENGTH) {
            newText = "";
        }
        return newText;
    }
    
    /**
     * Get the text of a document, applying any size restrictions
     * if necessary
     * @param {Document} document - the document to get the text from
     */
    function getTextFromDocument(document) {
        var text = document.getText();
        text = filterText(text);
        return text;
    }
    
    
    
    /**
     * Request Jump-To-Definition from Tern.
     *
     * @param {session} session - the session
     * @param {Document} document - the document
     * @param {{line: number, ch: number}} offset - the offset into the document
     * @return {jQuery.Promise} - The promise will not complete until tern
     *      has completed.
     */
    function requestJumptoDef(session, document, offset) {
        var path    = document.file.fullPath,
            fileInfo = {type: MessageIds.TERN_FILE_INFO_TYPE_FULL,
                name: path,
                offsetLines: 0,
                text: filterText(session.getJavascriptText())};
        
        var ternPromise = getJumptoDef(fileInfo, offset);
        
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
     *
     * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
     * - type of update, name of file, and the text of the update.
     * For "full" updates, the whole text of the file is present. For "part" updates,
     * the changed portion of the text. For "empty" updates, the file has not been modified
     * and the text is empty.
     * @param {{line: number, ch: number}} offset - the offset in the file the hints should be calculate at
     * @param {boolean} isProperty - true if getting a property hint,
     * otherwise getting an identifier hint.
     * @return {jQuery.Promise} - a promise that will resolve to an array of completions when
     *      it is done
     */
    function getTernHints(fileInfo, offset, isProperty) {

        /**
         *  If the document is large and we have modified a small portions of it that
         *  we are asking hints for, then send a partial document.
         */
        postMessage({
            type: MessageIds.TERN_COMPLETIONS_MSG,
            fileInfo: fileInfo,
            offset: offset,
            isProperty: isProperty
        });
        
        return addPendingRequest(fileInfo.name, offset, MessageIds.TERN_COMPLETIONS_MSG);
    }

    /**
     * Get a Promise for the function type from TernJS.
     * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
     * - type of update, name of file, and the text of the update.
     * For "full" updates, the whole text of the file is present. For "part" updates,
     * the changed portion of the text. For "empty" updates, the file has not been modified
     * and the text is empty.
     * @param {{line:number, ch:number}} offset - the line, column info for what we want the function type of.
     * @return {jQuery.Promise} - a promise that will resolve to the function type of the function being called.
     */
    function getTernFunctionType(fileInfo, offset) {
        postMessage({
            type: MessageIds.TERN_CALLED_FUNC_TYPE_MSG,
            fileInfo: fileInfo,
            offset: offset
        });

        return addPendingRequest(fileInfo.name, offset, MessageIds.TERN_CALLED_FUNC_TYPE_MSG);
    }


    /**
     *  Given a starting and ending position, get a code fragment that is self contained
     *  enough to be compiled.
     *
     * @param {!Session} session - the current session
     * @param {{line: number, ch: number}} start - the starting position of the changes
     * @returns {{type: string, name: string, offsetLines: number, text: string}}
     */
    function getFragmentAround(session, start) {
        var minIndent = null,
            minLine   = null,
            endLine,
            cm        = session.editor._codeMirror,
            tabSize   = cm.getOption("tabSize"),
            document  = session.editor.document,
            p,
            min,
            indent;

        // expand range backwards
        for (p = start.line - 1, min = Math.max(0, p - 50); p >= min; --p) {
            var line = session.getLine(p),
                fn = line.search(/\bfunction\b/);
            if (fn >= 0) {
                indent = CodeMirror.countColumn(line, null, tabSize);
                if (minIndent === null || minIndent > indent) {
                    if (session.getToken({line: p, ch: fn + 1}).type === "keyword") {
                        minIndent = indent;
                        minLine = p;
                    }
                }
            }
        }

        if (minIndent === null) {
            minIndent = 0;
        }

        if (minLine === null) {
            minLine = min;
        }

        var max = Math.min(cm.lastLine(), start.line + 90);
        for (endLine = start.line + 1; endLine < max; ++endLine) {
            indent = CodeMirror.countColumn(cm.getLine(endLine), null, tabSize);
            if (indent <= minIndent) {
                break;
            }
        }

        var from = {line: minLine, ch: 0},
            to   = {line: endLine, ch: 0};

        return {type: MessageIds.TERN_FILE_INFO_TYPE_PART,
            name: document.file.fullPath,
            offsetLines: from.line,
            text: document.getRange(from, to)};
    }


    /**
     * Get an object that describes what tern needs to know about the updated
     * file to produce a hint. As a side-effect of this calls the document
     * changes are reset.
     *
     * @param {!Session} session - the current session
     * @returns {{type: string, name: {string}, offsetLines: {number}, text: {string}}
     */
    function getFileInfo(session) {
        var start = session.getCursor(),
            end = start,
            document = session.editor.document,
            path = document.file.fullPath,
            isHtmlFile = LanguageManager.getLanguageForPath(path).getId() === "html",
            result;

        if (isHtmlFile) {
            result = {type: MessageIds.TERN_FILE_INFO_TYPE_FULL,
                name: path,
                text: session.getJavascriptText()};
        } else if (!documentChanges) {
            result = {type: MessageIds.TERN_FILE_INFO_TYPE_EMPTY,
                name: path,
                text: ""};
        } else if (session.editor.lineCount() > LARGE_LINE_COUNT &&
                (documentChanges.to - documentChanges.from < LARGE_LINE_CHANGE) &&
                documentChanges.from <= start.line &&
                documentChanges.to > end.line) {
            result = getFragmentAround(session, start);
        } else {
            result = {type: MessageIds.TERN_FILE_INFO_TYPE_FULL,
                name: path,
                text: getTextFromDocument(document)};
        }

        documentChanges = null;
        return result;
    }

    /**
     *  Get the current offset. The offset is adjusted for "part" updates.
     *
     * @param {!Session} session - the current session
     * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
     * - type of update, name of file, and the text of the update.
     * For "full" updates, the whole text of the file is present. For "part" updates,
     * the changed portion of the text. For "empty" updates, the file has not been modified
     * and the text is empty.
     * @param {{line: number, ch: number}=} offset - the default offset (optional). Will
     * use the cursor if not provided.
     * @returns {{line: number, ch: number}}
     */
    function getOffset(session, fileInfo, offset) {
        var newOffset = offset || session.getCursor();

        if (fileInfo.type === MessageIds.TERN_FILE_INFO_TYPE_PART) {
            newOffset.line = Math.max(0, newOffset.line - fileInfo.offsetLines);
        }

        return newOffset;
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
        var $deferred = $.Deferred(),
            fileInfo = getFileInfo(session),
            offset = getOffset(session, fileInfo);

        postMessage({
            type: MessageIds.TERN_GET_GUESSES_MSG,
            fileInfo: fileInfo,
            offset: offset
        });

        var promise = addPendingRequest(fileInfo.name, offset, MessageIds.TERN_GET_GUESSES_MSG);
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
     * @param {{file: string, offset: {line: number, ch: number}, completions:Array.<string>,
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
     * Handle the response from the tern web worker when
     * it responds to the get guesses message.
     *
     * @param {{file: string, type: string, offset: {line: number, ch: number},
     *      properties: Array.<string>}} response -
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
     * Handle the response from the tern web worker when
     * it responds to the update file message.
     *
     * @param {{path:string, type: string}} response - the response from the worker
     */
    function handleUpdateFile(response) {

        var path = response.path,
            type = response.type,
            $deferredHints = getPendingRequest(path, OFFSET_ZERO, type);

        if ($deferredHints) {
            $deferredHints.resolve();
        }
    }

    /**
     * Encapsulate all the logic to talk to the worker thread.  This will create
     * a new instance of a TernWorker, which the rest of the hinting code can use to talk
     * to the worker, without worrying about initialization, priming the pump, etc.
     *
     */
    function TernWorker() {
        var ternPromise         = null,
            addFilesPromise     = null,
            rootTernDir         = null,
            projectRoot         = null,
            stopAddingFiles     = false,
            resolvedFiles       = {},       // file -> resolved file
            numInitialFiles     = 0,
            numResolvedFiles    = 0,
            numAddedFiles       = 0,
            _ternWorker         = null;

        /**
         * @param {string} file a relative path
         * @return {string} returns the path we resolved when we tried to parse the file, or undefined
         */
        function getResolvedPath(file) {
            return resolvedFiles[file];
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
                text       : getTextFromDocument(document)
            });

            return addPendingRequest(path, OFFSET_ZERO, MessageIds.TERN_UPDATE_FILE_MSG);
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
                    replyWith(name, getTextFromDocument(document));
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
         * @return {jQuery.Promise} - the promise for the request
         */
        function primePump(path) {
            _postMessageByPass({
                type        : MessageIds.TERN_PRIME_PUMP_MSG,
                path        : path
            });
    
            return addPendingRequest(path, OFFSET_ZERO, MessageIds.TERN_PRIME_PUMP_MSG);
        }

        /**
         * Handle the response from the tern web worker when
         * it responds to the prime pump message.
         *
         * @param {{path: string, type: string}} response - the response from the worker
         */
        function handlePrimePumpCompletion(response) {

            var path = response.path,
                type = response.type,
                $deferredHints = getPendingRequest(path, OFFSET_ZERO, type);

            if ($deferredHints) {
                $deferredHints.resolve();
            }
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
                ternPromise.done(function (worker) {
                    worker.postMessage({
                        type        : MessageIds.TERN_ADD_FILES_MSG,
                        files       : files
                    });
                });
    
            } else {
                stopAddingFiles = true;
            }
    
            return stopAddingFiles;
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
         * Init the web worker that does all the code hinting work.
         *
         * If a worker already exists, then this will terminate that worker and
         * start a new worker - this helps alleviate leaks that may be ocurring in 
         * the code that the worker runs.  
         */
        function initTernWorker() {
            if (_ternWorker) {
                _ternWorker.terminate();
            }
            var workerDeferred = $.Deferred();
            ternPromise = workerDeferred.promise();
            var path = ExtensionUtils.getModulePath(module, "tern-worker.js");
            _ternWorker = new Worker(path);
    
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
                } else if (type === MessageIds.TERN_WORKER_READY) {
                    workerDeferred.resolveWith(null, [_ternWorker]);
                } else {
                    console.log("Worker: " + (response.log || response));
                }
            });
            
        }
        /**
         * Create a new tern server.
         */
        function initTernServer(dir, files) {
            initTernWorker();
            numResolvedFiles = 0;
            numAddedFiles = 0;
            stopAddingFiles = false;
            numInitialFiles = files.length;
    
            ternPromise.done(function (worker) {
                worker.postMessage({
                    type        : MessageIds.TERN_INIT_MSG,
                    dir         : dir,
                    files       : files,
                    env         : ternEnvironment
                });
            });
            rootTernDir = dir + "/";
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
    
            var addFilesDeferred = $.Deferred();
    
            _lastPrimePump = shouldPrimePump;
            
            addFilesPromise = addFilesDeferred.promise();
            pr = ProjectManager.getProjectRoot() ? ProjectManager.getProjectRoot().fullPath : null;
    
            // avoid re-initializing tern if possible.
            if (canSkipTernInitialization(path)) {
    
                // update the previous document in tern to prevent stale files.
                if (isDocumentDirty && previousDocument) {
                    var updateFilePromise = updateTernFile(previousDocument);
                    updateFilePromise.done(function () {
                        primePump(path);
                        addFilesDeferred.resolveWith(null, [_ternWorker]);
                    });
                } else {
                    addFilesDeferred.resolveWith(null, [_ternWorker]);
                }
    
                isDocumentDirty = false;
                return;
            }
    
            isDocumentDirty = false;
            
            resolvedFiles = {};
    
            projectRoot = pr;
            getFilesInDirectory(dir, function (files) {
                initTernServer(dir, files);
    
                if (shouldPrimePump) {
                    var hintsPromise = primePump(path);
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
                                        primePump(path);
    
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

        /**
         * Do some cleanup when a project is closed.
         *
         * We can clean up the web worker we use to calculate hints now, since
         * we know we will need to re-init it in any new project that is opened.  
         */
        function closeWorker() {
            function terminateWorker() {
                var worker = _ternWorker;
                setTimeout(function () {
                    // give pending requests a chance to finish
                    worker.terminate();
                    worker = null;
                }, 1000);
                _ternWorker = null;
                resolvedFiles = {};
            }
            
            if (_ternWorker) {
                if (addFilesPromise) {
                    // If we're in the middle of added files, don't terminate 
                    // until we're done or we might get NPEs
                    addFilesPromise.done(terminateWorker).fail(terminateWorker);
                } else {
                    terminateWorker();
                }
            }
        }

        function whenReady(func) {
            addFilesPromise.done(func);
        }
        
        this.closeWorker = closeWorker;
        this.handleEditorChange = handleEditorChange;
        this.postMessage = postMessage;
        this.getResolvedPath = getResolvedPath;
        this.whenReady = whenReady;
        
        return this;
    }

    var reseting = false;

    /**
     * reset the tern worker thread, if necessary.  
     *
     * To avoid memory leaks in the worker thread we periodically kill
     * the web worker instance, and start a new one.  To avoid a performance
     * hit when we do this we start up a new worker, and don't kill the old
     * one unitl the new one is initialized.
     */
    function maybeReset(session, document) {
        var newWorker;
        // if we're in the middle of a reset, don't have to check
        // the new worker will be online soon
        if (!reseting) {
            if (++_hintCount > MAX_HINTS) {
                reseting = true;
                newWorker = new TernWorker();
                newWorker.handleEditorChange(session, document, null, _lastPrimePump);
                newWorker.whenReady(function () {
                    // tell the old worker to shut down
                    currentWorker.closeWorker();
                    currentWorker = newWorker;
                    // all done reseting
                    reseting = false;
                });
                _hintCount = 0;
            }
        }
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
        var $deferredHints = $.Deferred(),
            hintPromise,
            fnTypePromise,
            sessionType = session.getType(),
            fileInfo = getFileInfo(session),
            offset = getOffset(session, fileInfo,
                            sessionType.showFunctionType ? sessionType.functionCallPos : null);

        maybeReset(session, document);

        hintPromise = getTernHints(fileInfo, offset, sessionType.property);

        if (sessionType.showFunctionType) {
            // Show function sig
            fnTypePromise = getTernFunctionType(fileInfo, offset);
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
     *  Track the update area of the current document so we can tell if we can send
     *  partial updates to tern or not.
     *
     * @param {{from: {line:number, ch: number}, to: {line:number, ch: number},
     * text: Array<string>}} changeList - the document changes (since last change or cumlative?)
     */
    function trackChange(changeList) {
        var changed = documentChanges;
        if (changed === null) {
            documentChanges = changed = {from: changeList.from.line, to: changeList.from.line};
        }

        var end = changeList.from.line + (changeList.text.length - 1);
        if (changeList.from.line < changed.to) {
            changed.to = changed.to - (changeList.to.line - end);
        }

        if (end >= changed.to) {
            changed.to = end + 1;
        }

        if (changed.from > changeList.from.line) {
            changed.from = changeList.from.line;
        }
    }

    /*
     * Called each time the file associated with the active editor changes.
     * Marks the file as being dirty.
     *
     * @param {from: {line:number, ch: number}, to: {line:number, ch: number}}
     */
    function handleFileChange(changeList) {
        isDocumentDirty = true;
        trackChange(changeList);
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

        if (!currentWorker) {
            currentWorker = new TernWorker();
        }
        return currentWorker.handleEditorChange(session, document, previousDocument, shouldPrimePump);
    }

    /**
     * Do some cleanup when a project is closed.
     *
     * We can clean up the web worker we use to calculate hints now, since
     * we know we will need to re-init it in any new project that is opened.  
     */
    function handleProjectClose() {
        if (currentWorker) {
            currentWorker.closeWorker();
            currentWorker = null;
        }
    }

    exports.getBuiltins = getBuiltins;
    exports.getResolvedPath = getResolvedPath;
    exports.getTernHints = getTernHints;
    exports.handleEditorChange = handleEditorChange;
    exports.requestGuesses = requestGuesses;
    exports.handleFileChange = handleFileChange;
    exports.requestHints = requestHints;
    exports.requestJumptoDef = requestJumptoDef;
    exports.handleProjectClose = handleProjectClose;
});
