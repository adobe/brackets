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

/**
 * MainViewManager Manages the arrangement all open panes. Each panes contain one or more views wich are 
 * are created by a view factory and inserted into a pane list. There may be several panes managed
 * by the MainViewManager with each pane containing a list of views.  The panes are always visible and 
 * the layout is determined by the MainViewManager and the user.  Currently we support only 1 pane.
 *
 * All of the PaneViewList APIs take a paneId Argument.  This can be an actual pane Id, ALL_PANES (in most cases) 
 * or FOCUSED_PANE.  Currently we only support 1 pane so this argument is ignored but will be supported 
 * when multiple panes are implemented
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    var _                   = require("thirdparty/lodash"),
        AppInit             = require("utils/AppInit"),
        CommandManager      = require("command/CommandManager"),
        Menus               = require("command/Menus"),
        Commands            = require("command/Commands"),
        EditorManager       = require("editor/EditorManager"),
        FileSystem          = require("filesystem/FileSystem"),
        DocumentManager     = require("document/DocumentManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        ProjectManager      = require("project/ProjectManager"),
        WorkspaceManager    = require("view/WorkspaceManager"),
        InMemoryFile        = require("document/InMemoryFile"),
        Pane                = require("view/Pane").Pane;
        
    
    var ALL_PANES           = "ALL_PANES",
        FOCUSED_PANE        = "FOCUSED_PANE",
        FIRST_PANE          = "first-pane",
        SECOND_PANE         = "second-pane",
        VERTICAL            = "VERTICAL",
        HORIZONTAL          = "HORIZONTAL";
    
    
    
    var _orientation = HORIZONTAL;
    
    /**
     * Container we live in
     * @private
     */
    var _$container;
    
    /**
     *
     */
    var _paneViews = {
        
    };
    
    function _getActivePaneId() {
        // TODO
        return FIRST_PANE; 
    }

    function _getPaneFromPaneId(paneId) {
        if (paneId === FOCUSED_PANE) {
            paneId = _getActivePaneId();
        }
        
        if (_paneViews[paneId]) {
            return _paneViews[paneId];
        }
        
        return null;
    }
    
    
    /**
     * Retrieves the PaneViewList for the given PaneId
     * @param {!string} paneId this will identify which Pane the caller wants a View List
     * @return {Array.<File>}
     */
    function getPaneViewList(paneId) {
        if (paneId === ALL_PANES) {
            // TODO combine all panes
            return getPaneViewList(FIRST_PANE);
        } else {
            var pane = _getPaneFromPaneId(paneId);
            if (pane) {
                return pane.getViewList();
            }
        } 
        return null;
    }

   
    function _doFindInViewList(paneId, fullPath, method) {
        var pane, 
            index;
        if (paneId === ALL_PANES) {
            for (var property in _paneViews) {
                if (_paneViews.hasOwnProperty(property)) {
                    pane =  _paneViews[property];
                    index = pane[method].call(pane, fullPath);
                    if (index >= 0) {
                        return index;
                    }
                }
            }
            // not found
            return -1; 
        } else {
            pane = getPaneViewList(paneId);
            if (pane) {
                return pane[method].call(pane, fullPath);
            }
        }
    }

    
    /**
     * Gets the index of the file matching fullPath in the pane view list
     * @param {!string} paneId this will identify which Pane the caller wants to search
     * @param {!string} fullPath
     * @return {number} index, -1 if not found.
     */
    function findInPaneViewList(paneId, fullPath) {
        return _doFindInViewList(paneId, fullPath, "findInViewList");
    }
    
    /**
     * Gets the index of the file matching fullPath in the added order pane view list
     * @param {!string} paneId this will identify which Pane the caller wants to search
     * @param {!string} fullPath
     * @return {number} index, -1 if not found.
     */
    function findInPaneViewListAddedOrder(paneId, fullPath) {
        return _doFindInViewList(paneId, fullPath, "findInViewListAddedOrder");
    }
    
    /**
     * Gets the index of the file matching fullPath in the MRU order pane view list
     * @param {!string} paneId Identifies which Pane the caller wants to search
     * @param {!string} fullPath
     * @return {number} index, -1 if not found.
     */
    function findInPaneViewListMRUOrder(paneId, fullPath) {
        return _doFindInViewList(paneId, fullPath, "findInViewListMRUOrder");
    }

    /**
     * Adds the given file to the end of the pane view list, if it is not already in the list
     * and it does not have a custom viewer.
     * Does not change which document is currently open in the editor. Completes synchronously.
     * @param {!string} paneId this will identify which Pane with which the caller wants to add
     * @param {!File} file
     * @param {number=} index  Position to add to list (defaults to last); -1 is ignored
     * @param {boolean=} forceRedraw  If true, a pane view list change notification is always sent
     *    (useful if suppressRedraw was used with removeFromPaneViewList() earlier)
     */
    function addToPaneViewList(paneId, file, index, force) {
        var pane = _getPaneFromPaneId(paneId);

        if (!pane || !EditorManager.canOpenFile(file.fullPath)) {
            return;
        }
        
        var result = pane.reorderItem(file, index, force);
        if (result === pane.ITEM_FOUND_NEEDS_SORT) {
            $(exports).triggerHandler("paneViewListSort", pane.id);
        } else if (result === pane.ITEM_NOT_FOUND) {
            index = pane.addToViewList(file, index);
            $(exports).triggerHandler("paneViewListAdd", [file, index, pane.id]);
        }
    }
            
    
    /**
     * Adds the given file list to the end of the pane view list.
     * If a file in the list has its own custom viewer, then it 
     * is not added into the pane view list.
     * Does not change which document is currently open in the editor.
     * More efficient than calling addToPaneViewList() (in a loop) for
     * a list of files because there's only 1 redraw at the end
     * @param {!string} paneId this will identify which Pane with which the caller wants to add
     * @param {!Array.<File>} fileList
     */
    function addListToPaneViewList(paneId, fileList) {
        var uniqueFileList,
            pane = _getPaneFromPaneId(paneId);

        if (!pane) {
            return;
        }
        
        uniqueFileList = pane.addListToViewList(fileList);
        
        // Dispatch event
        $(exports).triggerHandler("paneViewListAddList", [uniqueFileList, pane.id]);
    }
    
    function _removeFromPaneViewList(paneId, file, suppressRedraw) {
        var pane = _getPaneFromPaneId(paneId);

        if (pane && pane.removeFromViewList(file)) {
            
            if (pane.getViewListSize() === 0) {
                pane.showInterstitial(true);
            }
            
            // Dispatch event
            EditorManager.notifyPathRemovedFromPaneList(pane.id, file);
            $(exports).triggerHandler("paneViewListRemove", [file, suppressRedraw, pane.id]);
        }
    }
    
    /**
     * Warning: low level API - use FILE_CLOSE command in most cases.
     * Removes the given file from the pane view list, if it was in the list. Does not change
     * the current editor even if it's for this file. Does not prompt for unsaved changes.
     * @param {!string} paneId this will identify which Pane with which the caller wants to remove
     * @param {!File} file
     * @param {boolean=} supporessRedraw true to suppress redraw after removal, false if not
     */
    function removeFromPaneViewList(paneId, file, suppressRedraw) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function(pane) {
                _removeFromPaneViewList(pane.id, file, suppressRedraw);
            });
        } else {
            _removeFromPaneViewList(paneId, file, suppressRedraw);
        }
    }
    
    
    /**
     * Warning: low level API - use FILE_CLOSE command in most cases.
     * Removes the given file list from the pane view list, if it was in the list. Does not change
     * the current editor even if it's for this file. Does not prompt for unsaved changes.
     * @param {!string} paneId this will identify which Pane with which the caller wants to remove
     * @param {!File} file
     * @param {boolean=} true to suppress redraw after removal
     */
    function _removeListFromPaneViewList(paneId, list) {
        var pane = _getPaneFromPaneId(paneId),
            fileList;
        
        if (!pane) {
            return;
        }
        fileList = pane.removeListFromViewList(list);
        
        if (!fileList) {
            return;
        }
        
        if (pane.getViewListSize() === 0) {
            pane.showInterstitial(true);
        }
        
        EditorManager.notifyPathRemovedFromPaneList(pane.id, fileList);
        $(exports).triggerHandler("paneViewListRemoveList", [fileList, pane.id]);
    }

    function removeListFromPaneViewList(paneId, list) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function(pane) {
                _removeListFromPaneViewList(pane.id, list);
            });
        } else {
            _removeListFromPaneViewList(paneId, list);
        }
    }
        
    function _removeAllFromPaneViewList(paneId) {
        var pane = _getPaneFromPaneId(paneId),
            fileList;

        if (!pane) {
            return;
        }

        fileList = pane.removeAllFromViewList();

        if (!fileList) {
            return;
        }
        pane.showInterstitial(true);
        EditorManager.notifyPathRemovedFromPaneList(paneId, fileList);
        $(exports).triggerHandler("paneViewListRemoveList", [fileList, pane.id]);
    }
    
    
    
    /**
     * Warning: low level API - use FILE_CLOSE_ALL command in most cases.
     * Removes all files for the given pane
     * @param {!string} paneId
     */
    function removeAllFromPaneViewList(paneId) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function(pane) {
                _removeAllFromPaneViewList(pane.id);
            });
        } else {
            _removeAllFromPaneViewList(paneId);
        }
    }
    
    /**
     * Makes the file the most recent for the selected pane's view list
     * @param {!string} paneId this will identify which Pane with which the caller wants to change
     * @param {!File} file to make most recent
     */
    function makePaneViewMostRecent(paneId, file) {
        var pane = _getPaneFromPaneId(paneId);

        if (pane) {
            pane.makeViewMostRecent(file);
        }
    }
    
    /**
     * Sorts `MainViewManager._paneViewList` using the compare function
     * @param {!string} paneId this will identify which Pane with which the caller wants to sort
     * @param {function(File, File): number} compareFn see: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
     */
    function sortPaneViewList(paneId, compareFn) {
        var pane = _getPaneFromPaneId(paneId);

        if (pane) {
            pane.sortViewList(compareFn);
            $(exports).triggerHandler("paneViewListSort", [pane.id]);
        }
    }

    /**
     * Mutually exchanges the files at the indexes passed by parameters.
     * @param {!string} paneId this will identify which Pane with which the caller wants to change
     * @param {!number} index1 Old file index
     * @param {!number} index2 New file index
     */
    function swapPaneViewListIndexes(paneId, index1, index2) {
        var pane = _getPaneFromPaneId(paneId);

        if (pane) {
            pane.swapViewListIndexes(index1, index2);
            $(exports).triggerHandler("paneViewListSort", [pane.id]);
            $(exports).triggerHandler("paneViewListDisableAutoSorting", [pane.id]);
        }
    }
    
    /**
     * Get the next or previous file in the pane view list, in MRU order (relative to currentDocument). May
     * return currentDocument itself if pane view list is length 1.
     * @param {!string} paneId this will identify which Pane with which the caller wants to traverse
     * @param {number} inc  -1 for previous, +1 for next; no other values allowed
     * @return {?File}  null if pane view list empty
     */
    function traversePaneViewListByMRU(paneId, direction) {
        var pane = _getPaneFromPaneId(paneId);

        if (pane) {
            return pane.traverseViewListByMRU(direction);
        }
        
        // If no doc open or pane view list empty, there is no "next" file
        return null;
    }

    /* 
     * TODO: This is scaffolding for now.  
     * There were 2 different impls of notifyPathDeleted and depending on who caught the 
     *  operation, it called a different API
     *
     * I've refactored projectManager to always call DocumentManager's implementation
     *  instead of deciding if it should call DocumentManager's or EditorManager's
     *  Impl based on whether or not the DocumentManager has an open document. This reduces
     *  the dependency on EditorManager and the decision on whether a document is open.
     *
     * The DocumentCammandCommandHandler's doOpen function has _cleanUp code that
     *  now calls this function to remove the custom viewer and open the next document 
     *  in the MRU list 
     *
     * The impl in DocumentManager  does something I'm not familiar with by calling syncOpenDocuments
     *  I've redirected it to this function when there isn't an open document so that editorManager
     *  can release whatever references it had to the document and tear down the editor for it.
     *
     * This avoids a circular dependency between EditorManager and DocumentManager (at least for this API)
     */

    /**
     * finds the next file to move into view and notifies the editor manager
     * of the file that's being deleted and the file to replace it with.
     * @param {!string} fullpath path of the file that is being deleted
     */
    function notifyPathDeleted(fullpath) {
        var fileToOpen = traversePaneViewListByMRU(FOCUSED_PANE, 1);
        EditorManager.notifyPathDeleted(fullpath, fileToOpen);
    }
    
    /**
     * Loads the pane view list state
     * @private
     */
    function _loadViewState(e) {
/*        
        // file root is appended for each project
        var files = [],
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

        // Add all files to the pane view list without verifying that
        // they still exist on disk (for faster project switching)
        files.forEach(function (value) {
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

        if (!activeFile && _paneViewList.length > 0) {
            activeFile = _paneViewList[0].fullPath;
        }
        
        if (activeFile) {
            var promise = CommandManager.execute(Commands.FILE_OPEN, { fullPath: activeFile });
            // Add this promise to the event's promises to signal that this handler isn't done yet
            e.promises.push(promise);
        }
*/
    }
    
    /**
     * Saves the pane view list state
     * @private
     */
    function _saveViewState() {
/*    
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

        paneViewList.forEach(function (file) {
            // Do not persist untitled document paths
            if (!(file instanceof InMemoryFile)) {
                // flag the currently active editor
                isActive = currentDoc && (file.fullPath === currentDoc.file.fullPath);
                
                // save editor UI state for just the pane view list
                var viewState = EditorManager._getViewState(file.fullPath);
                
                files.push({
                    file: file.fullPath,
                    active: isActive,
                    viewState: viewState
                });
            }
        });

        // Writing out pane view list files using the project layer specified in 'context'.
        PreferencesManager.setViewState("project.files", files, context);
*/
    }

    /**
     * Event handler for "workspaceUpdateLayout" to update the layout
     * @param {Event} event 
     * @param {number} editorAreaHt
     * @param {string=} refreshFlag For internal use. see `EditorManager.refresh()`
     */
    function _updateLayout(event, editorAreaHeight, refreshHint) {
        var panes = Object.keys(_paneViews),
            size = 100 / panes.length;
        
        _.forEach(_paneViews, function(pane) {
            if (_orientation === VERTICAL) {
                pane.$el.css({height: "100%", 
                              width: size + "%", 
                              float: "left"
                             });
            } else {
                pane.$el.css({height: size + "%", 
                              width: "100%", 
                              float: "none"
                             });
            }
        });
        
        EditorManager.resizeAllToFit(refreshHint);
    }
    
    
    function createDocumentEditor(document, paneId) {
        var pane = _getPaneFromPaneId(paneId);
        
        if (!pane) {
            return;
        }
        
        pane.$el.find(".not-editor").css({display: "none"});
        EditorManager._createFullEditorForDocument(document, pane.$el);
    }

    
    /**
     *
     */
    function _openDocument(event, doc) {
        var pane = _getPaneFromPaneId(FOCUSED_PANE);
        
        if (!pane) {
            return;
        }

        pane.showInterstitial(false);
        EditorManager.doOpenDocument(doc, pane.$el);
    }
    
    
    function _createPaneIfNecessary(paneId) {
        _$container = $("#editor-holder");
        if (!_paneViews.hasOwnProperty(paneId)) {
            _paneViews[paneId] = new Pane(paneId, _$container);    
        }
        
    
    }
    
    AppInit.htmlReady(function() {
        _createPaneIfNecessary(FIRST_PANE);
        _updateLayout();
    });
    
    // Event handlers
    $(ProjectManager).on("projectOpen",                       _loadViewState);
    $(ProjectManager).on("beforeProjectClose beforeAppClose", _saveViewState);
    $(WorkspaceManager).on("workspaceUpdateLayout",           _updateLayout);
    $(DocumentManager).on("currentDocumentChange",            _openDocument);

    
    var CMD_SPLIT_VERTICALLY = "cmd.splitVertically";
    var CMD_SPLIT_HORIZONTALLY = "cmd.splitHorizontally";
    
    
    function handleSplitVertically() {
        _orientation = VERTICAL;
        _createPaneIfNecessary(SECOND_PANE);
        _updateLayout();
    }
    
    function handleSplitHorizontially () {
        _orientation = HORIZONTAL;
        _createPaneIfNecessary(SECOND_PANE);
        _updateLayout();
    }
    
    AppInit.appReady(function() {
        CommandManager.register("Split Vertically", CMD_SPLIT_VERTICALLY,   handleSplitVertically);
        CommandManager.register("Split Horizontally", CMD_SPLIT_HORIZONTALLY, handleSplitHorizontially);

        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        if (menu) {
            menu.addMenuDivider();
            menu.addMenuItem(CMD_SPLIT_VERTICALLY);    
            menu.addMenuItem(CMD_SPLIT_HORIZONTALLY);
        }
    });

    
    // PaneView Management
    exports.addToPaneViewList                = addToPaneViewList;
    exports.addListToPaneViewList            = addListToPaneViewList;
    exports.findInPaneViewList               = findInPaneViewList;
    exports.findInPaneViewListAddedOrder     = findInPaneViewListAddedOrder;
    exports.findInPaneViewListMRUOrder       = findInPaneViewListMRUOrder;
    exports.getPaneViewList                  = getPaneViewList;
    exports.makePaneViewMostRecent           = makePaneViewMostRecent;
    exports.removeAllFromPaneViewList        = removeAllFromPaneViewList;
    exports.removeFromPaneViewList           = removeFromPaneViewList;
    exports.removeListFromPaneViewList       = removeListFromPaneViewList;
    exports.sortPaneViewList                 = sortPaneViewList;
    exports.swapPaneViewListIndexes          = swapPaneViewListIndexes;
    exports.traversePaneViewListByMRU        = traversePaneViewListByMRU;
    
    // Explicit stuff
    exports.createDocumentEditor             = createDocumentEditor;

    // Migration helpers
    exports.notifyPathDeleted                = notifyPathDeleted;
    
    // Constants
    exports.ALL_PANES                        = ALL_PANES;
    exports.FOCUSED_PANE                     = FOCUSED_PANE;
});
