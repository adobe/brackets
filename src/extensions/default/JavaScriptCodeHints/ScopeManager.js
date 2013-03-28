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
        FileUtils           = brackets.getModule("file/FileUtils"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        HintUtils           = require("HintUtils"),
        Scope               = require("Scope"),
        Tern                = require("tern/tern");

    var pendingRequest      = null,     // information about a deferred scope request
        fileState           = {},       // directory -> file -> state
        ternEnvironment     = [],
        pendingTernRequests = {},
        rootTernDir             = null,
        ternWorker          = (function () {
            var path = module.uri.substring(0, module.uri.lastIndexOf("/") + 1);
            return new Worker(path + "tern-worker.js");
        }());

    var MAX_TEXT_LENGTH     = 1000000, // about 1MB
        MAX_FILES_IN_DIR    = 100;

    /**
     * Create a new tern server.
     */
    function initTernServer(dir, files) {
        ternWorker.postMessage({
                    type        : HintUtils.TERN_INIT_MSG,
                    dir         : dir,
                    files       : files,
                    env         : ternEnvironment
                });
        rootTernDir = dir;
    }
    
    /**
     * Read in the json files that have type information for the builtins, dom,etc
     */
    function initTernEnv() {
        var path = module.uri.substring(0, module.uri.lastIndexOf("/") + 1) + "tern/defs/";
        var files = ["ecma5.json"];//, "browser.json", "plugin/requirejs/requirejs.json", "jquery.json"];
        
        var dirEntry    = new NativeFileSystem.DirectoryEntry(path),
            reader      = dirEntry.createReader();
        
        files.forEach(function(i) {
            DocumentManager.getDocumentForPath(path + i).done(function(document){
                ternEnvironment.push(JSON.parse(document.getText()));
            }).fail(function(error){
                console.log("failed to read tern config file " + i);
            });
        });
    }

    initTernEnv();
    
    /** 
     * Initialize state for a given directory and file name
     *
     * @param {string} dir - the directory name to initialize
     * @param {string} file - the file name to initialize
     */
    function initFileState(dir, file) {
        // initialize outerScope, etc. at dir
        if (!fileState.hasOwnProperty(dir)) {
            fileState[dir] = {};
        }

        if (file !== undefined) {
            if (!fileState[dir].hasOwnProperty(file)) {
                fileState[dir][file] = {
                    // global scope object for this file
                    scope           : null,

                    // has the file changed since the scope was updated?
                    dirtyFile       : true,

                    // has the scope changed since the last inner scope request?
                    dirtyScope      : true,

                    // is the parser worker active for this file?
                    active          : false,

                    // all variable and parameter names defined in this file
                    identifiers     : null,

                    // all property names found in this file
                    properties      : null,

                    // all globals defined in this file
                    globals         : null,

                    // all string literals found in this file
                    literals        : null,

                    // all context-property associations found in this file
                    associations    : null
                };
            }
        }
    }

    /**
     * Get the file state for a given path. If just the directory is given
     * instead of the whole path, a set of file states is returned, one for
     * each (known) file in the directory.
     * 
     * @param {string} dir - the directory name for which state is desired
     * @param {string=} file - the file name for which state is desired
     * @return {Object} - a file state object (as documented within 
     *      intializeFileState above), or a set of file state objects if
     *      file is omitted.
     */
    function getFileState(dir, file) {
        initFileState(dir, file);

        if (file === undefined) {
            return fileState[dir];
        } else {
            return fileState[dir][file];
        }
    }

    /**
     * Request a new outer scope object from the parser worker, if necessary
     *
     * @param {string} dir - the directory name for which the outer scope is to
     *      be refreshed
     * @param {string} file - the file name for which the outer scope is to be
     *      refreshed
     * @param {string} text - the text of the file for which the outer scope is
     *      to be refreshed
     */
    function refreshOuterScope(dir, file, text) {

        if (text.length > MAX_TEXT_LENGTH) {
            return;
        }

        var state = getFileState(dir, file);
       
        // if there is not yet an outer scope or if the file has changed then
        // we might need to update the outer scope
        if (state.scope === null || state.dirtyFile) {
            if (!state.active) {
                var path    = dir + file,
                    entry   = new NativeFileSystem.FileEntry(path);
                
                // the outer scope worker is about to be active
                state.active = true;
                
                // the file will be clean since the last outer scope request
                state.dirtyFile = false;
            }
        }
        state.text = text;
    }

    /**
     * Get inner scope information for a given file and offset if a suitable
     * global scope object is availble; otherwise, return a promise for such
     * information, resolved when a suitable global scope object becomes 
     * available.
     *
     * @param {string} dir - the directory name for which the inner scope is to
     *      be refreshed
     * @param {string} file - the file name for which the inner scope is to be
     *      refreshed
     * @param {number} offset - offset into the text at which the inner scope
     *      is to be refreshed
     * @return {Object + jQuery.Promise} - inner scope information, or a promise
     *      for such information, including the local scope object and lists of
     *      identifiers, properties, globals, literals and associations.
     */
    function refreshInnerScope(dir, file, offset) {

        var state = getFileState(dir, file);
        
        // If there is no outer scope, the inner scope request is deferred. 
        if (!state.scope) {
            if (pendingRequest && pendingRequest.deferred.state() === "pending") {
                pendingRequest.deferred.reject();
            }

            pendingRequest = {
                dir         : dir,
                file        : file,
                offset      : offset,
                deferred    : $.Deferred()
            };
            
            // Request the outer scope from the parser worker.
            DocumentManager.getDocumentForPath(dir + file).done(function (document) {
                refreshOuterScope(dir, file, document.getText());
            });
            return { promise: pendingRequest.deferred.promise() };
        } else {
            // The inner scope will be clean after this
            state.dirtyScope = false;
            
            // Try to find an inner scope from the current outer scope
            var innerScope = state.scope.findChild(offset);
            
            if (!innerScope) {
                // we may have failed to find a child scope because a 
                // character was added to the end of the file, outside of
                // the (now out-of-date and currently-being-updated) 
                // outer scope. Hence, if offset is greater than the range
                // of the outerScope, we manually set innerScope to the
                // outerScope
                innerScope = state.scope;
            }
            
            // FIXME: This could be more efficient if instead of filtering
            // the entire list of identifiers we just used the identifiers
            // in the scope of innerScope, but that list doesn't have the
            // accumulated position information.
            var identifiersForScope = filterByScope(state.identifiers, innerScope),
                propertiesForFile   = mergeProperties(dir),
                associationsForFile = mergeAssociations(dir);
            
            return {
                scope       : innerScope,
                identifiers : identifiersForScope,
                globals     : state.globals,
                literals    : state.literals,
                properties  : propertiesForFile,
                associations: associationsForFile
            };
        }
    }
    
    /**
     * Get a new inner scope and related info, if possible. If there is no
     * outer scope for the given file, a promise will be returned instead. 
     * (See refreshInnerScope above.)
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
     * @return {jQuery.Promise} - A promise that will resolve to the inner scope info.
     *      The promise will not complete until the scope info is refreshed, and tern has
     *      computed completions.
     */
    function getScopeInfo(session, document, offset) {
        var path    = document.file.fullPath,
            split   = HintUtils.splitPath(path),
            dir     = split.dir,
            file    = split.file;
        
        var $deferredHints = $.Deferred(),
            ternPromise = getTernHints(dir, file, offset, document.getText());
        
        $.when(ternPromise).done(
            function(ternHints){
                session.setTernHints(ternHints);
                $deferredHints.resolveWith(null);
            });
        return {promise:$deferredHints.promise()};
    }

    /**
     * Get a Promise for the completions from TernJS, for the file & offset passed in.
     * @return {jQuery.Promise} - a promise that will resolve to an array of completions when
     *      it is done
     */
    function getTernHints(dir, file, offset, text) {
        ternWorker.postMessage({
            type: HintUtils.TERN_COMPLETIONS_MSG,
            dir:dir,
            file:file,
            offset:offset,
            text:text
        });

        var $deferredHints = $.Deferred();
        pendingTernRequests[file] = $deferredHints;
        return $deferredHints.promise();
    }
    
    /**
     * Handle the response from the tern web worker when
     * it responds with the list of completions
     *
     * @param {{dir:string, file:string, offset:number, completions:Array.<string>}} response - the response from the worker
     */
    function handleTernCompletions(response) {
        
        var dir = response.dir,
            file = response.file,
            offset = response.offset,
            completions = response.completions,
            $deferredHints = pendingTernRequests[file];
        
        pendingTernRequests[file] = null;
        
        if( $deferredHints ) { 
            $deferredHints.resolveWith(null, [completions]);
        }
    }
    
    /**
     * Handle a request from the worker for text of a file
     *
     * @param {{file:string}} request - the request from the worker.  Should be an Object containing the name
     *      of the file tern wants the contents of 
     */
    function handleTernGetFile(request) {
        var name = request.file;
        DocumentManager.getDocumentForPath(rootTernDir + name).done(function(document){
            ternWorker.postMessage({
                type:HintUtils.TERN_GET_FILE_MSG,
                file:name, 
                text:document.getText()
            });
        })

    }
    
    /**
     * Is the inner scope dirty? (It is if the outer scope has changed since
     * the last inner scope request)
     * 
     * @param {Document} document - the document for which the last requested
     *      inner scope may or may not be dirty
     * @return {boolean} - is the inner scope dirty?
     */
    function isScopeDirty(document) {
        var path    = document.file.fullPath,
            split   = HintUtils.splitPath(path),
            dir     = split.dir,
            file    = split.file,
            state   = getFileState(dir, file);
        
        return state.dirtyScope;
    }

    /**
     * Mark a file as dirty, which may cause a later outer scope request to
     * trigger a reparse request. 
     * 
     * @param {string} dir - the directory name of the file to be marked dirty
     * @param {string} file - the file name of the file to be marked dirty
     */
    function markFileDirty(dir, file) {
        var state = getFileState(dir, file);

        state.dirtyFile = true;
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
            file        = split.file,
            dirEntry    = new NativeFileSystem.DirectoryEntry(dir),
            reader      = dirEntry.createReader(),
            files       = [];
        
        markFileDirty(dir, file);


        reader.readEntries(function (entries) {
            entries.slice(0, MAX_FILES_IN_DIR).forEach(function (entry) {
                if (entry.isFile) {
                    var path    = entry.fullPath,
                        split   = HintUtils.splitPath(path),
                        dir     = split.dir,
                        file    = split.file;
                    
                    if (file.indexOf(".") > 1) { // ignore /.dotfiles
                        var mode = LanguageManager.getLanguageForPath(entry.fullPath).getMode();
                        if (mode === HintUtils.MODE_NAME) {
                            DocumentManager.getDocumentForPath(path).done(function (document) {
                                refreshOuterScope(dir, file, document.getText());
                            });
                            files.push(file);    
                        }
                    }
                }
            });
            initTernServer(dir, files);
        }, function (err) {
            console.log("Unable to refresh directory: " + err);
            refreshOuterScope(dir, file, document.getText());
        });
        
    }

    /*
     * Called each time the file associated with the active edtor changes.
     * Marks the file as being dirty and refresh its outer scope.
     * 
     * @param {Document} document - the document that has changed
     */
    function handleFileChange(document) {
        var path    = document.file.fullPath,
            split   = HintUtils.splitPath(path),
            dir     = split.dir,
            file    = split.file;
        
        markFileDirty(dir, file);
        refreshOuterScope(dir, file, document.getText());
    }

    /*
     * Receive an outer scope object from the parser worker and resolves any
     * deferred inner scope requests.
     * 
     * @param {Object} response - the parser response object, which includes 
     *      the global scope and lists of identifiers, properties, globals, 
     *      literals and associations.
     */
    function handleOuterScope(response) {
        var dir     = response.dir,
            file    = response.file,
            path    = dir + file,
            state   = getFileState(dir, file),
            scopeInfo;

        if (state.active) {
            state.active = false;
            if (response.success) {
                state.scope = Scope.rebuild(response.scope);

                // The outer scope should cover the entire file
                state.scope.range.start = 0;
                state.scope.range.end = response.length;

                state.globals = response.globals;
                state.identifiers = response.identifiers;
                state.properties = response.properties;
                state.literals = response.literals;
                state.associations = response.associations;
                
                state.dirtyScope = true;

                if (state.dirtyFile) {
                    DocumentManager.getDocumentForPath(path).done(function (document) {
                        refreshOuterScope(dir, file, document.getText());
                    });
                }

                if (pendingRequest !== null && pendingRequest.dir === dir &&
                        pendingRequest.file === file) {
                    if (pendingRequest.deferred.state() === "pending") {
                        scopeInfo = refreshInnerScope(dir, file, pendingRequest.offset);
                        if (scopeInfo && !scopeInfo.deferred) {
                            pendingRequest.deferred.resolveWith(null, [scopeInfo]);
                            pendingRequest = null;
                        }
                    }
                }
            }
        } else {
            console.log("Expired scope request: " + path);
        }
    }

    ternWorker.addEventListener("message", function (e) {
        var response = e.data,
            type = response.type;
        
        if( type === HintUtils.TERN_COMPLETIONS_MSG) {
            // handle any completions the worker calculated
            handleTernCompletions(response);
        } else if ( type === HintUtils.TERN_GET_FILE_MSG ) {
            // handle a request for the contents of a file
            handleTernGetFile(response);
        } else {
            console.log("Worker: " + (response.log || response));
        }
    });
    
    // reset state on project change
    $(ProjectManager)
        .on(HintUtils.eventName("beforeProjectClose"),
            function (event, projectRoot) {
                fileState = {};
            });
    
    // relocate scope information on file rename
    $(DocumentManager)
        .on(HintUtils.eventName("fileNameChange"),
            function (event, oldName, newName) {
                var oldSplit    = HintUtils.splitPath(oldName),
                    oldDir      = oldSplit.dir,
                    oldFile     = oldSplit.file,
                    newSplit    = HintUtils.splitPath(newName),
                    newDir      = newSplit.dir,
                    newFile     = newSplit.file;
        
                if (fileState.hasOwnProperty(oldDir) &&
                        fileState[oldDir].hasOwnProperty(oldFile)) {
                    if (!fileState.hasOwnProperty(newDir)) {
                        fileState[newDir] = {};
                    }
                    fileState[newDir][newFile] = fileState[oldDir][oldFile];
                    delete fileState[oldDir][oldFile];
                }
            });

    
    exports.handleEditorChange = handleEditorChange;
    exports.handleFileChange = handleFileChange;
    exports.getScopeInfo = getScopeInfo;
    exports.isScopeDirty = isScopeDirty;
    exports.getTernHints = getTernHints;
});
