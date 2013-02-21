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
        EditorUtils         = brackets.getModule("editor/EditorUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        HintUtils           = require("HintUtils"),
        Scope               = require("Scope");

    var pendingRequest      = null,     // information about a deferred scope request
        fileState           = {},       // directory -> file -> state
        outerScopeWorker    = (function () {
            var path = module.uri.substring(0, module.uri.lastIndexOf("/") + 1);
            return new Worker(path + "parser-worker.js");
        }());

    var MAX_TEXT_LENGTH     = 1000000, // about 1MB
        MAX_FILES_IN_DIR    = 100;

    /* 
     * Initialize state for a given directory and file name
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
                
                // send text to the parser worker
                outerScopeWorker.postMessage({
                    type        : HintUtils.SCOPE_MSG_TYPE,
                    dir         : dir,
                    file        : file,
                    text        : text,
                    force       : !state.scope
                });
            }
        }
    }

    /**
     * Recompute the inner scope for a given cursor position, if necessary
     */
    function refreshInnerScope(dir, file, offset) {

        /*
         * Filter a list of tokens using a given scope object
         */
        function filterByScope(tokens, scope) {
            return tokens.filter(function (id) {
                var level = scope.contains(id.value);
                return (level >= 0);
            });
        }
        
        /*
         * Combine a set of sets using the add operation
         */
        function merge(sets, property, add) {
            var combinedSet = {},
                nextSet,
                file;

            for (file in sets) {
                if (sets.hasOwnProperty(file)) {
                    nextSet = sets[file][property];
                    if (nextSet) {
                        add(combinedSet, nextSet);
                    }
                }
            }

            return combinedSet;
        }

        /*
         * Combine properties from files in the current file's directory into
         * one sorted list. 
         */
        function mergeProperties(dir) {
            
            function addPropObjs(obj1, obj2) {
                function addToObj(obj, token) {
                    if (!Object.prototype.hasOwnProperty.call(obj, token.value)) {
                        obj[token.value] = token;
                    }
                }

                obj2.forEach(function (token) {
                    addToObj(obj1, token);
                });
            }
            
            var stateMap    = getFileState(dir),
                propObj     = merge(stateMap, "properties", addPropObjs),
                propList    = [],
                propName;

            for (propName in propObj) {
                if (Object.prototype.hasOwnProperty.call(propObj, propName)) {
                    propList.push(propObj[propName]);
                }
            }

            return propList;
        }

        /* 
         * Combine association objects from multiple files
         */
        function mergeAssociations(dir) {
            function addAssocSets(list1, list2) {
                var name;

                function addAssocObjs(assoc1, assoc2) {
                    var name;

                    for (name in assoc2) {
                        if (Object.prototype.hasOwnProperty.call(assoc2, name)) {
                            if (Object.prototype.hasOwnProperty.call(assoc1, name)) {
                                assoc1[name] = assoc1[name] + assoc2[name];
                            } else {
                                assoc1[name] = assoc2[name];
                            }
                        }
                    }
                }

                for (name in list2) {
                    if (Object.prototype.hasOwnProperty.call(list2, name)) {
                        if (Object.prototype.hasOwnProperty.call(list1, name)) {
                            addAssocObjs(list1[name], list2[name]);
                        } else {
                            list1[name] = list2[name];
                        }
                    }
                }
            }

            var stateMap = getFileState(dir);

            return merge(stateMap, "associations", addAssocSets);
        }

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
     * outer scope for the given file, a deferred object will be returned
     * instead.
     *
     * Note that successive calls to getScope may return the same objects, so
     * clients that wish to modify those objects (e.g., by annotating them based
     * on some temporary context) should copy them first. See, e.g.,
     * Session.getHints().
     */
    function getScopeInfo(document, offset) {
        var path    = document.file.fullPath,
            split   = HintUtils.splitPath(path),
            dir     = split.dir,
            file    = split.file;
        
        return refreshInnerScope(dir, file, offset);
    }

    /**
     * Is the inner scope dirty? (It is if the outer scope has changed since
     * the last inner scope request)
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
     * Mark a file as dirty, which causes an outer scope request to trigger
     * a reparse request. 
     */
    function markFileDirty(dir, file) {
        var state = getFileState(dir, file);

        state.dirtyFile = true;
    }

    /**
     * Refresh the outer scopes of the given file as well as of the other files
     * in the given directory.
     */
    function handleEditorChange(document) {
        var path        = document.file.fullPath,
            split       = HintUtils.splitPath(path),
            dir         = split.dir,
            file        = split.file,
            dirEntry    = new NativeFileSystem.DirectoryEntry(dir),
            reader      = dirEntry.createReader();
        
        markFileDirty(dir, file);

        reader.readEntries(function (entries) {
            entries.slice(0, MAX_FILES_IN_DIR).forEach(function (entry) {
                if (entry.isFile) {
                    var path    = entry.fullPath,
                        split   = HintUtils.splitPath(path),
                        dir     = split.dir,
                        file    = split.file;
                    
                    if (file.indexOf(".") > 1) { // ignore /.dotfiles
                        var mode = EditorUtils.getModeFromFileExtension(entry.fullPath);
                        if (mode === HintUtils.MODE_NAME) {
                            DocumentManager.getDocumentForPath(path).done(function (document) {
                                refreshOuterScope(dir, file, document.getText());
                            });
                        }
                    }
                }
            });
        }, function (err) {
            console.log("Unable to refresh directory: " + err);
            refreshOuterScope(dir, file, document.getText());
        });
    }

    /*
     * When a file changes, mark it as being dirty and refresh its outer scope.
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
     * Receive an outer scope object from the parser worker
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

    outerScopeWorker.addEventListener("message", function (e) {
        var response = e.data,
            type = response.type;

        if (type === HintUtils.SCOPE_MSG_TYPE) {
            handleOuterScope(response);
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
        
                /*
                 * Move property obj[olddir][oldfile] to obj[newdir][newfile]
                 */
                function moveProp(obj) {
                    if (obj.hasOwnProperty(oldDir) && obj[oldDir].hasOwnProperty(oldFile)) {
                        if (!obj.hasOwnProperty(newDir)) {
                            obj[newDir] = {};
                        }
                        obj[newDir][newFile] = obj[oldDir][oldFile];
                        delete obj[oldDir][oldFile];
                    }
                }
                
                moveProp(fileState);
            });
    
    exports.handleEditorChange = handleEditorChange;
    exports.handleFileChange = handleFileChange;
    exports.getScopeInfo = getScopeInfo;
    exports.isScopeDirty = isScopeDirty;

});
