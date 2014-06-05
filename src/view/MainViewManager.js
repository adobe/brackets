/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, window, $, brackets */
define(function (require, exports, module) {
    "use strict";
    
    var _                   = require("thirdparty/lodash"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        EditorManager       = require("editor/EditorManager"),
        FileSystem          = require("filesystem/FileSystem"),
        DocumentManager     = require("document/DocumentManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        ProjectManager      = require("project/ProjectManager"),
        WorkspaceManager    = require("view/WorkspaceManager"),
        InMemoryFile        = require("document/InMemoryFile"),
        Strings             = require("strings");
    
    var ALL_PANES           = "ALL_PANES",
        FOCUSED_PANE        = "FOCUSED_PANE";
    
    
    /**
     * @private
     * @type {Array.<File>}
     */
    var _paneViewList = [];
    
    /**
     * @private
     * Contains the same set of items as _paneViewList, but ordered by how recently they were viewed
     * @type {Array.<File>}
     */
    var _paneViewListMRUOrder = [];
    
    /**
     * @private
     * Contains the same set of items as _paneViewList, but ordered in the way they where added to _paneViewList (0 = last added).
     * @type {Array.<File>}
     */
    var _paneViewListAddedOrder = [];
    
    
    /**
     * Returns a list of items in the pane view list in UI list order. May be 0-length, but never null.
     *
     * When a file is added a paneViewList, a "paneViewListAdd" event is dispatched
     * When a file is removed a paneViewList, a "paneViewListRemove" is dispatched.
     */
    
    /*
     * @param {!string} paneId
     * @return {Array.<File>}
     */
    function getPaneViewList(paneId) {
        return _.clone(_paneViewList);
    }
    
    function _getPaneViewList() {
        return _paneViewList;
    }

    function _getPaneViewListMRU() {
        return _paneViewListMRUOrder;
    }
    
    function _getPaneViewListAdded() {
        return _paneViewListAddedOrder;
    }
    
    function _reset(paneId) {
        _paneViewList = [];
        _paneViewListMRUOrder = [];
        _paneViewListAddedOrder = [];
    }
    
    /**
     * Returns the index of the file matching fullPath in the pane view list.
     * Returns -1 if not found.
     * @param {!string} paneId
     * @param {!string} fullPath
     * @param {Array.<File>=} list Pass this arg to search a different array of files. Internal
     *          use only.
     * @returns {number} index
     */
    function findInPaneViewList(paneId, fullPath) {
        return _.findIndex(_paneViewList, function (file, i) {
            return file.fullPath === fullPath;
        });
    }
    
    /**
     * Returns the index of the file matching fullPath in the pane view added order list
     * Returns -1 if not found.
     * @param {!string} paneId
     * @param {!string} fullPath
     * @param {Array.<File>=} list Pass this arg to search a different array of files. Internal
     *          use only.
     * @returns {number} index
     */
    function findInPaneViewListAddedOrder(paneId, fullPath) {
        return _.findIndex(_paneViewListAddedOrder, function (file, i) {
            return file.fullPath === fullPath;
        });
    }
    
    /**
     * Returns the index of the file matching fullPath in the pane view MRU list
     * Returns -1 if not found.
     * @param {!string} paneId
     * @param {!string} fullPath
     * @param {Array.<File>=} list Pass this arg to search a different array of files. Internal
     *          use only.
     * @returns {number} index
     */
    function findInPaneViewListMRUOrder(paneId, fullPath) {
        return _.findIndex(_paneViewListMRUOrder, function (file, i) {
            return file.fullPath === fullPath;
        });
    }
    
    function _canOpenFile(file) {
        return !EditorManager.getCustomViewerForPath(file.fullPath);
    }
    
    /* 
     * Public API
     */
    
    /**
     * Adds the given file to the end of the pane view list, if it is not already in the list
     * and it does not have a custom viewer.
     * Does not change which document is currently open in the editor. Completes synchronously.
     * @param {!string} paneId
     * @param {!File} file
     * @param {number=} index  Position to add to list (defaults to last); -1 is ignored
     * @param {boolean=} forceRedraw  If true, a pane view list change notification is always sent
     *    (useful if suppressRedraw was used with removeFromWorkingSet() earlier)
     */
    function addToPaneViewList(paneId, file, index, forceRedraw) {
        var indexRequested = (index !== undefined && index !== null && index !== -1);
        
        // If the file has a custom viewer, then don't add it to the pane view list.
        if (!_canOpenFile(file)) {
            return;
        }
            
        // If doc is already in pane view list, don't add it again
        var curIndex = findInPaneViewList(paneId, file.fullPath);
        if (curIndex !== -1) {
            // File is in pane view list, but not at the specifically requested index - only need to reorder
            if (forceRedraw || (indexRequested && curIndex !== index)) {
                var entry = _paneViewList.splice(curIndex, 1)[0];
                _paneViewList.splice(index, 0, entry);
                $(exports).triggerHandler("paneViewListSort");
            }
            return;
        }

        if (!indexRequested) {
            // If no index is specified, just add the file to the end of the pane view list.
            _paneViewList.push(file);
        } else {
            // If specified, insert into the pane view list at this 0-based index
            _paneViewList.splice(index, 0, file);
        }
        
        // Add to MRU order: either first or last, depending on whether it's already the current doc or not
        var currentDocument = DocumentManager.getCurrentDocument();
        if (currentDocument && currentDocument.file.fullPath === file.fullPath) {
            _paneViewListMRUOrder.unshift(file);
        } else {
            _paneViewListMRUOrder.push(file);
        }
        
        // Add first to Added order
        _paneViewListAddedOrder.unshift(file);
        
        // Dispatch event
        if (!indexRequested) {
            index = _paneViewList.length - 1;
        }
        $(exports).triggerHandler("paneViewListAdd", [file, index]);
    }
            
    
    /**
     * Adds the given file list to the end of the pane view list.
     * If a file in the list has its own custom viewer, then it 
     * is not added into the pane view list.
     * Does not change which document is currently open in the editor.
     * More efficient than calling addToWorkingSet() (in a loop) for
     * a list of files because there's only 1 redraw at the end
     * @param {!string} paneId
     * @param {!Array.<File>} fileList
     */
    function addListToPaneViewList(paneId, fileList) {
        var currentDocument = DocumentManager.getCurrentDocument(),
            uniqueFileList = [];

        // Process only files not already in pane view list
        fileList.forEach(function (file, index) {
            // If doc has a custom viewer, then don't add it to the pane view list.
            // Or if doc is already in pane view list, don't add it again.
            if (_canOpenFile(file) && findInPaneViewList(paneId, file.fullPath) === -1) {
                uniqueFileList.push(file);

                // Add
                _paneViewList.push(file);

                // Add to MRU order: either first or last, depending on whether it's already the current doc or not
                if (currentDocument && currentDocument.file.fullPath === file.fullPath) {
                    _paneViewListMRUOrder.unshift(file);
                } else {
                    _paneViewListMRUOrder.push(file);
                }
                
                
                // Add first to Added order
                _paneViewListAddedOrder.splice(index, 1, file);
            }
        });

        // Dispatch event
        $(exports).triggerHandler("paneViewListAddList", [uniqueFileList]);
    }

    /**
     * Warning: low level API - use FILE_CLOSE command in most cases.
     * Removes the given file from the pane view list, if it was in the list. Does not change
     * the current editor even if it's for this file. Does not prompt for unsaved changes.
     * @param {!string} paneId
     * @param {!File} file
     * @param {boolean=} true to suppress redraw after removal
     */
    function removeFromPaneViewList(paneId, file, suppressRedraw) {
        // If doc isn't in pane view list, do nothing
        var index = findInPaneViewList(paneId, file.fullPath);
        if (index === -1) {
            return;
        }
        
        // Remove
        _paneViewList.splice(index, 1);
        _paneViewListMRUOrder.splice(findInPaneViewListMRUOrder(paneId, file.fullPath), 1);
        _paneViewListAddedOrder.splice(findInPaneViewListAddedOrder(paneId, file.fullPath), 1);
        
        // Dispatch event
        EditorManager.notifyPathRemovedFromPaneList(paneId, file);
        $(exports).triggerHandler("paneViewListRemove", [file, suppressRedraw]);
    }
    
    
    /**
     * Warning: low level API - use FILE_CLOSE command in most cases.
     * Removes the given file list from the pane view list, if it was in the list. Does not change
     * the current editor even if it's for this file. Does not prompt for unsaved changes.
     * @param {!string} paneId
     * @param {!File} file
     * @param {boolean=} true to suppress redraw after removal
     */
    function removeListFromPaneViewList(paneId, list) {
        var fileList = [], index;
        
        if (!list) {
            return;
        }
        
        list.forEach(function (file) {
            var index = findInPaneViewList(paneId, file.fullPath);
            if (index === -1) {
                return;
            }
            
            fileList.push(file);
            
            // Remove
            _paneViewList.splice(index, 1);
            _paneViewListMRUOrder.splice(findInPaneViewListMRUOrder(paneId, file.fullPath), 1);
            _paneViewListAddedOrder.splice(findInPaneViewListAddedOrder(paneId, file.fullPath), 1);

        });
        
        EditorManager.notifyPathRemovedFromPaneList(paneId, fileList);
        $(exports).triggerHandler("paneViewListRemoveList", [fileList]);
    }
    
    /**
     * Warning: low level API - use FILE_CLOSE_ALL command in most cases.
     * Removes all files for the given pane
     * @param {!string} paneId
     */
    function removeAllFromPaneViewList(paneId) {
        var fileList = getPaneViewList(paneId);

        _reset(paneId);
        
        // Dispatch event
        EditorManager.notifyPathRemovedFromPaneList(paneId, fileList);
        $(exports).triggerHandler("paneViewListRemoveList", [fileList]);
    }
    
    /**
     * Makes the file the most recent for the selected pane's view list
     * @param {!string} paneId
     * @param {!File} file to make most recent
     */
    function makePaneViewMostRecent(paneId, file) {
        var index = findInPaneViewListMRUOrder(file.fullpath);
        if (index !== -1) {
            _paneViewListMRUOrder.splice(index, 1);
            _paneViewListMRUOrder.unshift(file);
        }
    }
    

    
    
    /**
     * Sorts MainViewManager._paneViewList using the compare function
     * @param {function(File, File): number} compareFn  The function that will be used inside JavaScript's
     *      sort function. The return a value should be >0 (sort a to a lower index than b), =0 (leaves a and b
     *      unchanged with respect to each other) or <0 (sort b to a lower index than a) and must always returns
     *      the same value when given a specific pair of elements a and b as its two arguments.
     *      Documentation: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
     */
    function sortPaneViewList(paneId, compareFn) {
        _paneViewList.sort(compareFn);
        $(exports).triggerHandler("paneViewListSort");
    }

    /**
     * Mutually exchanges the files at the indexes passed by parameters.
     * @param {number} index  Old file index
     * @param {number} index  New file index
     */
    function swapPaneViewListIndexes(paneId, index1, index2) {
        var length = _paneViewList.length - 1;
        var temp;
        
        if (index1 >= 0 && index2 <= length && index1 >= 0 && index2 <= length) {
            temp = _paneViewList[index1];
            _paneViewList[index1] = _paneViewList[index2];
            _paneViewList[index2] = temp;
            
            $(exports).triggerHandler("paneViewListSort");
            $(exports).triggerHandler("paneViewListDisableAutoSorting");
        }
    }
    
    /**
     * Get the next or previous file in the pane view list, in MRU order (relative to currentDocument). May
     * return currentDocument itself if pane view list is length 1.
     * @param {number} inc  -1 for previous, +1 for next; no other values allowed
     * @return {?File}  null if pane view list empty
     */
    function traversePaneViewListByMRU(paneId, direction) {
        if (Math.abs(direction) !== 1) {
            console.error("traversePaneViewList called with unsupported direction: " + direction.toString());
            return null;
        }
        
        if (EditorManager.getCurrentlyViewedPath()) {
            var index = findInPaneViewListMRUOrder(paneId, EditorManager.getCurrentlyViewedPath());
            if (index === -1) {
                // If doc not in pane view list, return most recent pane view list item
                if (_paneViewListMRUOrder.length > 0) {
                    return _paneViewListMRUOrder[0];
                }
            } else {
                // If doc is in pane view list, return next/prev item with wrap-around
                index += direction;
                if (index >= _paneViewListMRUOrder.length) {
                    index = 0;
                } else if (index < 0) {
                    index = _paneViewListMRUOrder.length - 1;
                }
                
                return _paneViewListMRUOrder[index];
            }
        }
        
        // If no doc open or pane view list empty, there is no "next" file
        return null;
    }

    /* 
     * TODO: This is scaffolding for now.  Need to figure out how 
     *          notifyPathDeleted is being used because there are two of them (3 now)
     *       I've refactored projectManager to always call DocumentManager's implementation
     *          instead of deciding if it should call DocumentManager's or EditorManager's
     *          Impl based on whether or not the DocumentManager has an open document
     *      The DocumentCammandCommandHandler's doOpen function has _cleanUp code that
     *          uses this calls this to remove the custom viewer and open the next 
     *          document in the MRU list if the document that couldn't be opened is an image
     *          is another impl in DocumentManager does something I'm not familiar with and is
     *          only called from ProjectManager.  I've redirected it to this function when
     *          the conditions that ProjectManager was using exist.  
     *      That will all need to be refactored when we allow images in Pane View Lists 
     *      This is here to avoid a circular dependency on EditorManager and calls to EditorManager's
     *          Impl have been redirected to this function so that the EditorManager can
     *          traverse to the next open document when closing the deleted document.
     */
    function notifyPathDeleted(fullpath) {
        var fileToOpen = traversePaneViewListByMRU(FOCUSED_PANE, 1);
        EditorManager.notifyPathDeleted(fullpath, fileToOpen);
    }
    
    /**
     * @private
     * Initializes the working set.
     */
    function _loadViewState(e) {
        // file root is appended for each project
        var projectRoot = ProjectManager.getProjectRoot(),
            files = [],
            context = { location : { scope: "user",
                                     layer: "project" } };
        
        files = PreferencesManager.getViewState("project.files", context);
        
        console.assert(_paneViewList.length === 0);

        if (!files) {
            return;
        }

        var filesToOpen = [],
            viewStates = {},
            activeFile;

        // Add all files to the working set without verifying that
        // they still exist on disk (for faster project switching)
        files.forEach(function (value, index) {
            filesToOpen.push(FileSystem.getFileForPath(value.file));
            if (value.active) {
                activeFile = value.file;
            }
            if (value.viewState) {
                viewStates[value.file] = value.viewState;
            }
        });
        
        addListToPaneViewList(FOCUSED_PANE, filesToOpen);
        
        // Allow for restoring saved editor UI state
        EditorManager._resetViewStates(viewStates);

        if (!activeFile) {
            activeFile = (_paneViewList.length > 0) ? _paneViewList[0].fullPath : undefined;
        }

        if (activeFile) {
            var promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: activeFile });
            // Add this promise to the event's promises to signal that this handler isn't done yet
            e.promises.push(promise);
        }
    }
    
    function _saveViewState() {
    
        var files           = [],
            isActive        = false,
            paneViewList    = getPaneViewList(ALL_PANES),
            currentDoc      = DocumentManager.getCurrentDocument(),
            projectRoot     = ProjectManager.getProjectRoot(),
            context         = { location : { scope: "user",
                                             layer: "project",
                                             layerID: projectRoot.fullPath } };

        if (!projectRoot) {
            return;
        }

        paneViewList.forEach(function (file, index) {
            // Do not persist untitled document paths
            if (!(file instanceof InMemoryFile)) {
                // flag the currently active editor
                isActive = currentDoc && (file.fullPath === currentDoc.file.fullPath);
                
                // save editor UI state for just the working set
                var viewState = EditorManager._getViewState(file.fullPath);
                
                files.push({
                    file: file.fullPath,
                    active: isActive,
                    viewState: viewState
                });
            }
        });

        // Writing out working set files using the project layer specified in 'context'.
        PreferencesManager.setViewState("project.files", files, context);
    }
    
    $(ProjectManager).on("projectOpen", _loadViewState);
    $(ProjectManager).on("beforeProjectClose beforeAppClose", _saveViewState);
    
    // API Exports
    exports.addToPaneViewList                = addToPaneViewList;
    exports.addListToPaneViewList            = addListToPaneViewList;
    exports.findInPaneViewList               = findInPaneViewList;
    exports.findInPaneViewListAddedOrder     = findInPaneViewListAddedOrder;
    exports.findInPaneViewListMRUOrder       = findInPaneViewListMRUOrder;
    exports.getPaneViewList                  = getPaneViewList;
    exports.makePaneViewMostRecent           = makePaneViewMostRecent;
    exports.notifyPathDeleted                = notifyPathDeleted;
    exports.removeAllFromPaneViewList        = removeAllFromPaneViewList;
    exports.removeFromPaneViewList           = removeFromPaneViewList;
    exports.removeListFromPaneViewList       = removeListFromPaneViewList;
    exports.sortPaneViewList                 = sortPaneViewList;
    exports.swapPaneViewListIndexes          = swapPaneViewListIndexes;
    exports.traversePaneViewListByMRU        = traversePaneViewListByMRU;
    
    // Constants
    exports.ALL_PANES                    = ALL_PANES;
    exports.FOCUSED_PANE                 = FOCUSED_PANE;
});
