/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/*global Worker */

define(function (require, exports, module) {
    "use strict";

    var _ = brackets.getModule("thirdparty/lodash");

    var CodeMirror          = brackets.getModule("thirdparty/CodeMirror/lib/codemirror"),
        DefaultDialogs      = brackets.getModule("widgets/DefaultDialogs"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileSystem          = brackets.getModule("filesystem/FileSystem"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        Strings             = brackets.getModule("strings"),
        StringUtils         = brackets.getModule("utils/StringUtils");

    var HintUtils           = require("HintUtils"),
        MessageIds          = require("MessageIds"),
        Preferences         = require("Preferences");

    var ternEnvironment     = [],
        pendingTernRequests = {},
        builtinFiles        = ["ecmascript.json", "browser.json", "jquery.json"],
        builtinLibraryNames = [],
        isDocumentDirty     = false,
        _hintCount          = 0,
        currentWorker       = null,
        documentChanges     = null,     // bounds of document changes
        preferences         = null,
        deferredPreferences = null;

    var MAX_HINTS           = 30,  // how often to reset the tern server
        LARGE_LINE_CHANGE   = 100,
        LARGE_LINE_COUNT    = 10000,
        OFFSET_ZERO         = {line: 0, ch: 0};

    var config = {};

    /**
     *  An array of library names that contain JavaScript builtins definitions.
     *
     * @return {Array.<string>} - array of library  names.
     */
    function getBuiltins() {
        return builtinLibraryNames;
    }

    /**
     * Read in the json files that have type information for the builtins, dom,etc
     */
    function initTernEnv() {
        var path = ExtensionUtils.getModulePath(module, "node_modules/tern/defs/"),
            files = builtinFiles,
            library;

        files.forEach(function (i) {
            FileSystem.resolve(path + i, function (err, file) {
                if (!err) {
                    FileUtils.readAsText(file).done(function (text) {
                        library = JSON.parse(text);
                        builtinLibraryNames.push(library["!name"]);
                        ternEnvironment.push(library);
                    }).fail(function (error) {
                        console.log("failed to read tern config file " + i);
                    });
                } else {
                    console.log("failed to read tern config file " + i);
                }
            });
        });
    }

    initTernEnv();

    /**
     *  Init preferences from a file in the project root or builtin
     *  defaults if no file is found;
     *
     *  @param {string=} projectRootPath - new project root path. Only needed
     *  for unit tests.
     */
    function initPreferences(projectRootPath) {

        // Reject the old preferences if they have not completed.
        if (deferredPreferences && deferredPreferences.state() === "pending") {
            deferredPreferences.reject();
        }

        deferredPreferences = $.Deferred();
        var pr = ProjectManager.getProjectRoot();

        // Open preferences relative to the project root
        // Normally there is a project root, but for unit tests we need to
        // pass in a project root.
        if (pr) {
            projectRootPath = pr.fullPath;
        } else if (!projectRootPath) {
            console.log("initPreferences: projectRootPath has no value");
        }

        var path = projectRootPath + Preferences.FILE_NAME;

        FileSystem.resolve(path, function (err, file) {
            if (!err) {
                FileUtils.readAsText(file).done(function (text) {
                    var configObj = null;
                    try {
                        configObj = JSON.parse(text);
                    } catch (e) {
                        // continue with null configObj which will result in
                        // default settings.
                        console.log("Error parsing preference file: " + path);
                        if (e instanceof SyntaxError) {
                            console.log(e.message);
                        }
                    }
                    preferences = new Preferences(configObj);
                    deferredPreferences.resolve();
                }).fail(function (error) {
                    preferences = new Preferences();
                    deferredPreferences.resolve();
                });
            } else {
                preferences = new Preferences();
                deferredPreferences.resolve();
            }
        });
    }

    /**
     * Will initialize preferences only if they do not exist.
     *
     */
    function ensurePreferences() {
        if (!deferredPreferences) {
            initPreferences();
        }
    }

    /**
     * Send a message to the tern worker - if the worker is being initialized,
     * the message will not be posted until initialization is complete
     */
    function postMessage(msg) {
        if (currentWorker) {
            currentWorker.postMessage(msg);
        }
    }

    /**
     * Test if the directory should be excluded from analysis.
     *
     * @param {!string} path - full directory path.
     * @return {boolean} true if excluded, false otherwise.
     */
    function isDirectoryExcluded(path) {
        var excludes = preferences.getExcludedDirectories();

        if (!excludes) {
            return false;
        }

        var testPath = ProjectManager.makeProjectRelativeIfPossible(path);
        testPath = FileUtils.stripTrailingSlash(testPath);

        return excludes.test(testPath);
    }

    /**
     * Test if the file path is in current editor
     *
     * @param {string} filePath file path to test for exclusion.
     * @return {boolean} true if in editor, false otherwise.
     */
    function isFileBeingEdited(filePath) {
        var currentEditor   = EditorManager.getActiveEditor(),
            currentDoc      = currentEditor && currentEditor.document;

        return (currentDoc && currentDoc.file.fullPath === filePath);
    }

    /**
     * Test if the file path is an internal exclusion.
     *
     * @param {string} path file path to test for exclusion.
     * @return {boolean} true if excluded, false otherwise.
     */
    function isFileExcludedInternal(path) {
        // The detectedExclusions are files detected to be troublesome with current versions of Tern.
        // detectedExclusions is an array of full paths.
        var detectedExclusions = PreferencesManager.get("jscodehints.detectedExclusions") || [];
        if (detectedExclusions && detectedExclusions.indexOf(path) !== -1) {
            return true;
        }

        return false;
    }

    /**
     * Test if the file should be excluded from analysis.
     *
     * @param {!File} file - file to test for exclusion.
     * @return {boolean} true if excluded, false otherwise.
     */
    function isFileExcluded(file) {
        if (file.name[0] === ".") {
            return true;
        }

        var languageID = LanguageManager.getLanguageForPath(file.fullPath).getId();
        if (languageID !== HintUtils.LANGUAGE_ID) {
            return true;
        }

        var excludes = preferences.getExcludedFiles();
        if (excludes && excludes.test(file.name)) {
            return true;
        }

        if (isFileExcludedInternal(file.fullPath)) {
            return true;
        }

        return false;
    }

    /**
     * Add a pending request waiting for the tern-worker to complete.
     * If file is a detected exclusion, then reject request.
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

        // Reject detected exclusions
        if (isFileExcludedInternal(file)) {
            return (new $.Deferred()).reject().promise();
        }

        if (_.has(pendingTernRequests, key)) {
            requests = pendingTernRequests[key];
        } else {
            requests = {};
            pendingTernRequests[key] = requests;
        }

        if (_.has(requests, type)) {
            $deferredRequest = requests[type];
        } else {
            requests[type] = $deferredRequest = new $.Deferred();
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
        if (_.has(pendingTernRequests, key)) {
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
        if (text.length > preferences.getMaxFileSize()) {
            newText = "";
        }
        return newText;
    }

    /**
     * Get the text of a document, applying any size restrictions
     * if necessary
     * @param {Document} document - the document to get the text from
     * @return {string} the text, or the empty text if the original was too long
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
     * @return {{type: string, name: string, offsetLines: number, text: string}}
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
            indent,
            line;

        // expand range backwards
        for (p = start.line - 1, min = Math.max(0, p - 100); p >= min; --p) {
            line = session.getLine(p);
            var fn = line.search(/\bfunction\b/);

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

        var max = Math.min(cm.lastLine(), start.line + 100),
            endCh = 0;

        for (endLine = start.line + 1; endLine < max; ++endLine) {
            line = cm.getLine(endLine);

            if (line.length > 0) {
                indent = CodeMirror.countColumn(line, null, tabSize);
                if (indent <= minIndent) {
                    endCh = line.length;
                    break;
                }
            }
        }

        var from = {line: minLine, ch: 0},
            to   = {line: endLine, ch: endCh};

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
     * @param {boolean=} preventPartialUpdates - if true, disallow partial updates.
     * Optional, defaults to false.
     * @return {{type: string, name: string, offsetLines: number, text: string}}
     */
    function getFileInfo(session, preventPartialUpdates) {
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
        } else if (!preventPartialUpdates && session.editor.lineCount() > LARGE_LINE_COUNT &&
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
     * @return {{line: number, ch: number}}
     */
    function getOffset(session, fileInfo, offset) {
        var newOffset;

        if (offset) {
            newOffset = {line: offset.line, ch: offset.ch};
        } else {
            newOffset = session.getCursor();
        }

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
        }).fail(function () {
            $deferred.reject();
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
            error = response.error,
            $deferredHints = getPendingRequest(file, offset, type);

        if ($deferredHints) {
            if (error) {
                $deferredHints.reject();
            } else if (completions) {
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
     * @param {{path: string, type: string}} response - the response from the worker
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
     * Handle timed out inference
     *
     * @param {{path: string, type: string}} response - the response from the worker
     */
    function handleTimedOut(response) {

        var detectedExclusions  = PreferencesManager.get("jscodehints.detectedExclusions") || [],
            filePath            = response.file;

        // Don't exclude the file currently being edited
        if (isFileBeingEdited(filePath)) {
            return;
        }

        // Handle file that is already excluded
        if (detectedExclusions.indexOf(filePath) !== -1) {
            console.log("JavaScriptCodeHints.handleTimedOut: file already in detectedExclusions array timed out: " + filePath);
            return;
        }

        // Save detected exclusion in project prefs so no further time is wasted on it
        detectedExclusions.push(filePath);
        PreferencesManager.set("jscodehints.detectedExclusions", detectedExclusions, { location: { scope: "project" } });

        // Show informational dialog
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_INFO,
            Strings.DETECTED_EXCLUSION_TITLE,
            StringUtils.format(
                Strings.DETECTED_EXCLUSION_INFO,
                StringUtils.breakableUrl(filePath)
            ),
            [
                {
                    className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id        : Dialogs.DIALOG_BTN_OK,
                    text      : Strings.OK
                }
            ]
        );
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
         * @return {boolean} - true if more files than the current directory have
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
                // If an error came up during file handling, bail out now
                if (!ternWorker) {
                    return;
                }

                if (config.debug) {
                    console.debug("Sending message", msg);
                }
                ternWorker.postMessage(msg);
            });
        }

        /**
         * Send a message to the tern worker - this is only for messages that
         * need to be sent before and while the addFilesPromise is being resolved.
         */
        function _postMessageByPass(msg) {
            ternPromise.done(function (ternWorker) {
                if (config.debug) {
                    console.debug("Sending message", msg);
                }
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
             * If DocumentManager successfully gets the file's text then we'll send it to the tern worker.
             * The Promise for getDocumentText() is returned so that custom fail functions can be used.
             *
             * @param {string} filePath - the path of the file to get the text of
             * @return {jQuery.Promise} - the Promise returned from DocumentMangaer.getDocumentText()
             */
            function getDocText(filePath) {
                if (!FileSystem.isAbsolutePath(filePath) || // don't handle URLs
                        filePath.slice(0, 2) === "//") { // don't handle protocol-relative URLs like //example.com/main.js (see #10566)
                    return (new $.Deferred()).reject().promise();
                }

                var file = FileSystem.getFileForPath(filePath),
                    promise = DocumentManager.getDocumentText(file);

                promise.done(function (docText) {
                    resolvedFiles[name] = filePath;
                    numResolvedFiles++;
                    replyWith(name, filterText(docText));
                });
                return promise;
            }

            /**
             * Helper function to find any files in the project that end with the
             * name we are looking for.  This is so we can find requirejs modules
             * when the baseUrl is unknown, or when the project root is not the same
             * as the script root (e.g. if you open the 'brackets' dir instead of 'brackets/src' dir).
             */
            function findNameInProject() {
                // check for any files in project that end with the right path.
                var fileName = name.substring(name.lastIndexOf("/") + 1);

                function _fileFilter(entry) {
                    return entry.name === fileName;
                }

                ProjectManager.getAllFiles(_fileFilter).done(function (files) {
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
                });
            }

            if (!isFileExcludedInternal(name)) {
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
            var maxFileCount = preferences.getMaxFileCount();
            if (numResolvedFiles + numAddedFiles < maxFileCount) {
                var available = maxFileCount - numResolvedFiles - numAddedFiles;

                if (available < files.length) {
                    files = files.slice(0, available);
                }

                numAddedFiles += files.length;
                ternPromise.done(function (worker) {
                    var msg = {
                        type        : MessageIds.TERN_ADD_FILES_MSG,
                        files       : files
                    };

                    if (config.debug) {
                        console.debug("Sending message", msg);
                    }
                    worker.postMessage(msg);
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
            FileSystem.resolve(dir, function (err, directory) {
                function visitor(entry) {
                    if (entry.isFile) {
                        if (!isFileExcluded(entry)) { // ignore .dotfiles and non-.js files
                            addFilesToTern([entry.fullPath]);
                        }
                    } else {
                        return !isDirectoryExcluded(entry.fullPath) &&
                            entry.name.indexOf(".") !== 0 &&
                            !stopAddingFiles;
                    }
                }

                if (err) {
                    return;
                }

                if (dir === FileSystem.getDirectoryForPath(rootTernDir)) {
                    doneCallback();
                    return;
                }

                directory.visit(visitor, doneCallback);
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
                if (config.debug) {
                    console.debug("Message received", e);
                }

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
                } else if (type === MessageIds.TERN_INFERENCE_TIMEDOUT) {
                    handleTimedOut(response);
                } else if (type === MessageIds.TERN_WORKER_READY) {
                    workerDeferred.resolveWith(null, [_ternWorker]);
                } else {
                    console.log("Worker: " + (response.log || response));
                }
            });

            // Set the initial configuration for the worker
            _ternWorker.postMessage({
                type: MessageIds.SET_CONFIG,
                config: config
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
                var msg = {
                    type        : MessageIds.TERN_INIT_MSG,
                    dir         : dir,
                    files       : files,
                    env         : ternEnvironment,
                    timeout     : PreferencesManager.get("jscodehints.inferenceTimeout")
                };

                if (worker) {
                    if (config.debug) {
                        console.debug("Sending message", msg);
                    }
                    worker.postMessage(msg);
                } else {
                    if (config.debug) {
                        console.debug("Worker null. Cannot send message", msg);
                    }
                }
            });
            rootTernDir = dir + "/";
        }

        /**
         *  We can skip tern initialization if we are opening a file that has
         *  already been added to tern.
         *
         * @param {string} newFile - full path of new file being opened in the editor.
         * @return {boolean} - true if tern initialization should be skipped,
         * false otherwise.
         */
        function canSkipTernInitialization(newFile) {
            return resolvedFiles[newFile] !== undefined;
        }


        /**
         *  Do the work to initialize a code hinting session.
         *
         * @param {Session} session - the active hinting session (TODO: currently unused)
         * @param {!Document} document - the document the editor has changed to
         * @param {?Document} previousDocument - the document the editor has changed from
         */
        function doEditorChange(session, document, previousDocument) {
            var file        = document.file,
                path        = file.fullPath,
                dir         = file.parentPath,
                pr;

            var addFilesDeferred = $.Deferred();

            documentChanges = null;
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

            ensurePreferences();
            deferredPreferences.done(function () {
                FileSystem.resolve(dir, function (err, directory) {
                    if (err) {
                        console.error("Error resolving", dir);
                        addFilesDeferred.resolveWith(null);
                        return;
                    }

                    directory.getContents(function (err, contents) {
                        if (err) {
                            console.error("Error getting contents for", directory);
                            addFilesDeferred.resolveWith(null);
                            return;
                        }

                        var files = contents
                            .filter(function (entry) {
                                return entry.isFile && !isFileExcluded(entry);
                            })
                            .map(function (entry) {
                                return entry.fullPath;
                            });

                        initTernServer(dir, files);

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
                    });
                });
            });
        }

        /**
         * Called each time a new editor becomes active.
         *
         * @param {Session} session - the active hinting session (TODO: currently unused by doEditorChange())
         * @param {!Document} document - the document of the editor that has changed
         * @param {?Document} previousDocument - the document of the editor is changing from
         */
        function handleEditorChange(session, document, previousDocument) {
            if (addFilesPromise === null) {
                doEditorChange(session, document, previousDocument);
            } else {
                addFilesPromise.done(function () {
                    doEditorChange(session, document, previousDocument);
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

                // Worker can be null if an error condition came up previously
                if (!worker) {
                    return;
                }
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

    var resettingDeferred = null;

    /**
     * reset the tern worker thread, if necessary.
     *
     * To avoid memory leaks in the worker thread we periodically kill
     * the web worker instance, and start a new one.  To avoid a performance
     * hit when we do this we start up a new worker, and don't kill the old
     * one unitl the new one is initialized.
     *
     * During debugging, you can turn this automatic resetting behavior off
     * by running this in the console:
     * brackets._configureJSCodeHints({ noReset: true })
     *
     * This function is also used in unit testing with the "force" flag to
     * reset the worker for each test to start with a clean environment.
     *
     * @param {Session} session
     * @param {Document} document
     * @param {boolean} force true to force a reset regardless of how long since the last one
     * @return {Promise} Promise resolved when the worker is ready.
     *                   The new (or current, if there was no reset) worker is passed to the callback.
     */
    function _maybeReset(session, document, force) {
        var newWorker;
        // if we're in the middle of a reset, don't have to check
        // the new worker will be online soon
        if (!resettingDeferred) {

            // We don't reset if the debugging flag is set
            // because it's easier to debug if the worker isn't
            // getting shut down all the time.
            if (force || (!config.noReset && ++_hintCount > MAX_HINTS)) {
                if (config.debug) {
                    console.debug("Resetting tern worker");
                }

                resettingDeferred = new $.Deferred();
                newWorker = new TernWorker();
                newWorker.handleEditorChange(session, document, null);
                newWorker.whenReady(function () {
                    // tell the old worker to shut down
                    currentWorker.closeWorker();
                    currentWorker = newWorker;
                    resettingDeferred.resolve(currentWorker);
                    // all done reseting
                    resettingDeferred = null;
                });
                _hintCount = 0;
            } else {
                var d = new $.Deferred();
                d.resolve(currentWorker);
                return d.promise();
            }
        }

        return resettingDeferred.promise();
    }

    /**
     * Request a parameter hint from Tern.
     *
     * @param {Session} session - the active hinting session
     * @param {{line: number, ch: number}} functionOffset - the offset of the function call.
     * @return {jQuery.Promise} - The promise will not complete until the
     *      hint has completed.
     */
    function requestParameterHint(session, functionOffset) {
        var $deferredHints = $.Deferred(),
            fileInfo = getFileInfo(session, true),
            offset = getOffset(session, fileInfo, functionOffset),
            fnTypePromise = getTernFunctionType(fileInfo, offset);

        $.when(fnTypePromise).done(
            function (fnType) {
                session.setFnType(fnType);
                session.setFunctionCallPos(functionOffset);
                $deferredHints.resolveWith(null, [fnType]);
            }
        ).fail(function () {
            $deferredHints.reject();
        });

        return $deferredHints.promise();
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
            sessionType = session.getType(),
            fileInfo = getFileInfo(session),
            offset = getOffset(session, fileInfo, null);

        _maybeReset(session, document);

        hintPromise = getTernHints(fileInfo, offset, sessionType.property);

        $.when(hintPromise).done(
            function (completions, fnType) {
                if (completions.completions) {
                    session.setTernHints(completions.completions);
                    session.setGuesses(null);
                } else {
                    session.setTernHints([]);
                    session.setGuesses(completions.properties);
                }

                $deferredHints.resolveWith(null);
            }
        ).fail(function () {
            $deferredHints.reject();
        });

        return $deferredHints.promise();
    }

    /**
     *  Track the update area of the current document so we can tell if we can send
     *  partial updates to tern or not.
     *
     * @param {Array.<{from: {line:number, ch: number}, to: {line:number, ch: number},
     *     text: Array<string>}>} changeList - the document changes from the current change event
     */
    function trackChange(changeList) {
        var changed = documentChanges, i;
        if (changed === null) {
            documentChanges = changed = {from: changeList[0].from.line, to: changeList[0].from.line};
            if (config.debug) {
                console.debug("ScopeManager: document has changed");
            }
        }

        for (i = 0; i < changeList.length; i++) {
            var thisChange = changeList[i],
                end = thisChange.from.line + (thisChange.text.length - 1);
            if (thisChange.from.line < changed.to) {
                changed.to = changed.to - (thisChange.to.line - end);
            }

            if (end >= changed.to) {
                changed.to = end + 1;
            }

            if (changed.from > thisChange.from.line) {
                changed.from = thisChange.from.line;
            }
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
     * @param {?Document} previousDocument - the document of the editor is changing from
     */
    function handleEditorChange(session, document, previousDocument) {

        if (!currentWorker) {
            currentWorker = new TernWorker();
        }
        return currentWorker.handleEditorChange(session, document, previousDocument);
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

    /**
     *  Read in project preferences when a new project is opened.
     *  Look in the project root directory for a preference file.
     *
     *  @param {string=} projectRootPath - new project root path(optional).
     *  Only needed for unit tests.
     */
    function handleProjectOpen(projectRootPath) {
        initPreferences(projectRootPath);
    }

    /** Used to avoid timing bugs in unit tests */
    function _readyPromise() {
        return deferredPreferences;
    }

    /**
     * @private
     *
     * Update the configuration in the worker.
     */
    function _setConfig(configUpdate) {
        config = brackets._configureJSCodeHints.config;
        postMessage({
            type: MessageIds.SET_CONFIG,
            config: configUpdate
        });
    }

    exports._setConfig = _setConfig;
    exports._maybeReset = _maybeReset;
    exports.getBuiltins = getBuiltins;
    exports.getResolvedPath = getResolvedPath;
    exports.getTernHints = getTernHints;
    exports.handleEditorChange = handleEditorChange;
    exports.requestGuesses = requestGuesses;
    exports.handleFileChange = handleFileChange;
    exports.requestHints = requestHints;
    exports.requestJumptoDef = requestJumptoDef;
    exports.requestParameterHint = requestParameterHint;
    exports.handleProjectClose = handleProjectClose;
    exports.handleProjectOpen = handleProjectOpen;
    exports._readyPromise = _readyPromise;

});
