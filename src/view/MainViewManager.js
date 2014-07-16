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
        Strings             = require("strings"),
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
        AsyncUtils          = require("utils/Async"),
        Pane                = require("view/Pane").Pane;
        

    var CMD_ID_SPLIT_VERTICALLY = "cmd.splitVertically",
        CMD_ID_SPLIT_HORIZONTALLY = "cmd.splitHorizontally";
    
    var _cmdSplitVertically,
        _cmdSplitHorizontally;
    
    var PREFS_NAME          = "mainView.state",
        OLD_PREFS_NAME      = "project.files";
    
    var ALL_PANES           = "ALL_PANES",
        FOCUSED_PANE        = "FOCUSED_PANE";
        
    var FIRST_PANE          = "first-pane",
        SECOND_PANE         = "second-pane";
    
    var VERTICAL            = "VERTICAL",
        HORIZONTAL          = "HORIZONTAL";
    
    var _paneTitles  = {
    };
    
    var _orientation = null;
    
    var _activePaneId = null;
    
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
    
    
    var _paneStates = {
    };
    
    /**
     *
     */
    var _traversingFileList = false;
    
    function getActivePaneId() {
        return _activePaneId;
    }

    function getSplitOrientation() {
        return _orientation;
    }
    
    function _getPaneFromPaneId(paneId) {
        if (!paneId || paneId === FOCUSED_PANE) {
            paneId = getActivePaneId();
        }
        
        if (_paneViews[paneId]) {
            return _paneViews[paneId];
        }
        
        return null;
    }
    
    function _getActivePane() {
        return _getPaneFromPaneId(_activePaneId);
    }
    
    function forceFocusToActivePaneView() {
        _getActivePane().focus();
    }
    
    
    function setActivePaneId(newPaneId) {
        if (_paneViews.hasOwnProperty(newPaneId) && (newPaneId !== _activePaneId)) {
            var oldPaneId = _activePaneId,
                oldPane = _getActivePane(),
                newPane = _getPaneFromPaneId(newPaneId);
            
            _activePaneId = newPaneId;
            
            $(exports).triggerHandler("activePaneChange", [newPaneId, oldPaneId]);
            $(exports).triggerHandler("currentFileChanged", [_getActivePane().getCurrentlyViewedFile(), newPaneId]);
            
            oldPane.onSetActive(false);
            newPane.onSetActive(true);
        }
        
        forceFocusToActivePaneView();
    }
    
    function _getPaneIdFromContainer($container) {
        var paneId;
        _.forEach(_paneViews, function (pane) {
            if (pane.$el === $container) {
                paneId = pane.id;
                return false;
            }
        });
        return paneId;
    }
    
    function getCurrentlyViewedFileForPane(paneId) {
        var pane = _getPaneFromPaneId(paneId);
        if (pane) {
            return pane.getCurrentlyViewedFile();
        }
    }
 
    function getCurrentlyViewedPathForPane(paneId) {
        var file = getCurrentlyViewedFileForPane(paneId);
        return file ? file.fullPath : null;
    }
    
    function getCurrentlyViewedFile() {
        return _getActivePane().getCurrentlyViewedFile();
    }
    
    function getCurrentlyViewedPath() {
        var file = getCurrentlyViewedFile();
        return file ? file.fullPath : null;
    }
    
    function _activeEditorChange(e, current) {
        if (current) {
            var $container = current.getContainer(),
                newPaneId = _getPaneIdFromContainer($container);

            // Ignore active editor changes for inline editors
            if (newPaneId) {
                if (newPaneId !== _activePaneId) {
                    setActivePaneId(newPaneId);
                } else {
                    var currentFile = getCurrentlyViewedFile();
                    if (currentFile !== current.getFile()) {
                        $(exports).triggerHandler("currentFileChanged", [current.getFile(), _activePaneId]);
                        forceFocusToActivePaneView();
                    }
                }
            }
        }
    }
    
    function savePaneScrollState(paneId) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
                _paneStates[pane.id] = pane.getPaneScrollState();
            });
        } else {
            var pane = _getPaneFromPaneId(paneId);
            if (pane) {
                _paneStates[pane.id] = pane.getPaneScrollState();
            }
        }
    }
    
    function adjustPaneScrollState(paneId, heightDelta) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
                if (_paneStates.hasOwnProperty(pane.id)) {
                    pane.adjustPaneScrollState(_paneStates[pane.id], heightDelta);
                }
            });
            _paneStates = {};
        } else {
            var pane = _getPaneFromPaneId(paneId);
            if (pane && _paneStates.hasOwnProperty(pane.id)) {
                pane.adjustPaneScrollState(_paneStates[pane.id], heightDelta);
                delete _paneStates[pane.id];
            }
        }
    }
        
    
    /**
     * Retrieves the PaneViewList for the given PaneId
     * @param {!string} paneId this will identify which Pane the caller wants a View List
     * @return {Array.<File>}
     */
    function getPaneViewList(paneId) {
        if (paneId === ALL_PANES) {
            var result = [];
            
            _.forEach(_paneViews, function (pane) {
                var viewList = pane.getViewList();
                result = _.union(result, viewList);
            });
            
            return result;
        } else {
            var pane = _getPaneFromPaneId(paneId);
            if (pane) {
                return pane.getViewList();
            }
        }
        return null;
    }
    
    function getAllOpenFiles() {
        var result = getPaneViewList(ALL_PANES);
        _.forEach(_paneViews, function (pane) {
            var file = pane.getCurrentlyViewedFile();
            if (file) {
                result = _.union(result, [file]);
            }
        });
        return result;
    }
    
    function getPaneIdList() {
        return Object.keys(_paneViews);
    }
    
    function getPaneViewListSize(paneId) {
        var result = 0;
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
                result += pane.getViewListSize();
            });
        } else {
            var pane = _getPaneFromPaneId(paneId);
            if (pane) {
                result += pane.getViewListSize();
            }
        }
        return result;
    }
    
    function getPaneTitle(paneId) {
        return _paneTitles[paneId][_orientation];
    }
    
    function getPaneCount() {
        return Object.keys(_paneViews).length;
    }
    
    function _doFindInViewList(paneId, fullPath, method) {
        if (paneId === ALL_PANES) {
            var index,
                result = -1;
            
            _.forEach(_paneViews, function (pane) {
                index = pane[method].call(pane, fullPath);
                if (index >= 0) {
                    result = {paneId: pane.id, index: index};
                    return false;
                }
            });
            
            return result;
        } else {
            var pane = _getPaneFromPaneId(paneId);
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

    
    function getPaneIdForPath(fullPath) {
        // Search all working sets
        var info = findInPaneViewList(ALL_PANES, fullPath);

        // Look for a view that has not been added to a working set
        if (info === -1) {
            _.forEach(_paneViews, function (pane) {
                if (pane.getCurrentlyViewedPath() === fullPath) {
                    info = {paneId: pane.id};
                    return false;
                }
            });
        }

        if (info === -1) {
            return null;
        }

        return info.paneId;
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
        if (!file) {
            return;
        }
        
        var pane = _getPaneFromPaneId(paneId);

        if (!pane || !EditorManager.canOpenFile(file.fullPath) || (findInPaneViewList(ALL_PANES, file.fullPath) !== -1)) {
            return;
        }
        
        var result = pane.reorderItem(file, index, force);
        if (result === pane.ITEM_FOUND_NEEDS_SORT) {
            $(exports).triggerHandler("paneViewListSort", [pane.id]);
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
        
        $(exports).triggerHandler("paneViewListAddList", [uniqueFileList, pane.id]);
    }
    
    function _removeFromPaneViewList(paneId, file, suppressRedraw) {
        var pane = _getPaneFromPaneId(paneId);

        if (pane && pane.removeFromViewList(file)) {
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
            _.forEach(_paneViews, function (pane) {
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
        
        $(exports).triggerHandler("paneViewListRemoveList", [fileList, pane.id]);
    }

    function removeListFromPaneViewList(paneId, list) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
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
        $(exports).triggerHandler("paneViewListRemoveList", [fileList, pane.id]);
    }
    
    
    
    /**
     * Warning: low level API - use FILE_CLOSE_ALL command in most cases.
     * Removes all files for the given pane
     * @param {!string} paneId
     */
    function removeAllFromPaneViewList(paneId) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
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

        if (pane && !_traversingFileList) {
            pane.makeViewMostRecent(file);
        }
    }
    
    /**
     * Sorts `MainViewManager._paneViewList` using the compare function
     * @param {!string} paneId this will identify which Pane with which the caller wants to sort
     * @param {function(File, File): number} compareFn see: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
     */
    function sortPaneViewList(paneId, compareFn) {
        var doSort = function (pane) {
            if (pane) {
                pane.sortViewList(compareFn);
                $(exports).triggerHandler("paneViewListSort", [pane.id]);
            }
        };
        
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
                doSort(pane);
            });
        } else {
            doSort(_getPaneFromPaneId(paneId));
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

    
    /**
     * Indicate that changes to currentDocument are temporary for now, and should not update the MRU
     * ordering of the working set. Useful for next/previous keyboard navigation (until Ctrl is released)
     * or for incremental-search style document preview like Quick Open will eventually have.
     * Can be called any number of times, and ended by a single finalizeDocumentNavigation() call.
     */
    function beginTraversal() {
        _traversingFileList = true;
    }
    
    /**
     * Un-freezes the MRU list after one or more beginDocumentNavigation() calls. Whatever document is
     * current is bumped to the front of the MRU list.
     */
    function endTraversal() {
        var pane = _getActivePane();
        
        if (_traversingFileList) {
            _traversingFileList = false;
            
            makePaneViewMostRecent(pane.id, pane.getCurrentlyViewedFile());
        }
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
        
        _.forEach(_paneViews, function (pane) {
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
            
            pane.updateLayout(refreshHint);
        });
        
        
    }
    
    function _updateCommandState() {
        if (_cmdSplitVertically && _cmdSplitHorizontally) {
            _cmdSplitVertically.setChecked(_orientation === VERTICAL);
            _cmdSplitHorizontally.setChecked(_orientation === HORIZONTAL);
        }
    }
    
    function _doUnsplit() {
        if (_paneViews.hasOwnProperty(SECOND_PANE)) {
            var firstPane = _paneViews[FIRST_PANE],
                secondPane = _paneViews[SECOND_PANE],
                fileList = secondPane.getViewList(),
                lastViewed = getCurrentlyViewedFile();
            
            firstPane.mergeWith(secondPane);
        
            $(exports).triggerHandler("paneViewListRemoveList", [fileList, secondPane.id]);

            setActivePaneId(firstPane.id);
            
            secondPane.$el.off(".mainview");
            $(secondPane).off(".mainview");

            secondPane.destroy();
            delete _paneViews[SECOND_PANE];
            $(exports).triggerHandler("paneDestroyed", secondPane.id);
            $(exports).triggerHandler("paneViewListAddList", [fileList, firstPane.id]);

            _orientation = null;
            _updateLayout();
            _updateCommandState();
            $(exports).triggerHandler("paneLayoutChange", [_orientation]);

            if (getCurrentlyViewedFile() !== lastViewed) {
                exports.doOpen(firstPane.id, lastViewed);
            }
        }
    }

    
    function _createPaneIfNecessary(paneId) {
        var pane;
        
        if (!_paneViews.hasOwnProperty(paneId)) {
            pane = new Pane(paneId, _$container);
            _paneViews[paneId] = pane;
            
            $(exports).triggerHandler("paneCreated", [pane.id]);
            
            pane.$el.on("click.mainview", function () {
                setActivePaneId(pane.id);
            });
            $(pane).on("viewListChanged.mainview", function () {
                $(exports).triggerHandler("paneViewListUpdated", [pane.id]);
            });
        }
        
        return _paneViews[paneId];
    }
    
    function _doSplit(orientation) {
        _createPaneIfNecessary(SECOND_PANE);
        _orientation = orientation;
        _updateLayout();
        _updateCommandState();
        $(exports).triggerHandler("paneLayoutChange", [_orientation]);
        
    }
    
    function doEdit(paneId, doc) {
        var currentPaneId = getPaneIdForPath(doc.file.fullPath);

        if (currentPaneId) {
            paneId = currentPaneId;
            setActivePaneId(paneId);
        }
        
        var pane = _getPaneFromPaneId(paneId);
        
        if (!pane) {
            return;
        }

        // If file is untitled or otherwise not within project tree, add it to
        // working set right now (don't wait for it to become dirty)
        if (doc.isUntitled() || !ProjectManager.isWithinProject(doc.file.fullPath)) {
            addToPaneViewList(paneId, doc.file);
        }
        
        EditorManager.doOpenDocument(doc, pane);

        if (pane.id === _activePaneId) {
            $(exports).triggerHandler("currentFileChanged", [doc.file, pane.id]);
        }

        makePaneViewMostRecent(paneId, doc.file);
    }
    
    function doOpen(paneId, file) {
        var result = new $.Deferred();
        
        if (!file) {
            return result.reject("bad argument");
        }

        var doc = DocumentManager.getOpenDocumentForPath(file.fullPath),
            currentPaneId = getPaneIdForPath(file.fullPath);

        if (currentPaneId) {
            paneId = currentPaneId;
            setActivePaneId(paneId);
        }
        

        // TODO: If the file is in the working set but not yet 
        //          open then we need to create the document editor for it
        
        if (doc) {
            doEdit(paneId, doc);
            result.resolve(doc);
        } else if (EditorManager.canOpenFile(file.fullPath)) {
            DocumentManager.getDocumentForPath(file.fullPath)
                .done(function (doc) {
                    doEdit(paneId, doc);
                    result.resolve(doc);
                })
                .fail(function (fileError) {
                    result.reject(fileError);
                });
        } else {
            result.reject("custom viewers not yet implemented with split view. check back later.");
        }
        
        return result;
    }

    function doClose(paneId, file) {
        if (!file) {
            return;
        }
        
        if (paneId === ALL_PANES) {
            // search in the list of files in each pane's workingset list
            paneId = getPaneIdForPath(file.fullPath);
        }

        var pane = _getPaneFromPaneId(paneId);
        
        if (pane.doRemoveView(file)) {
            $(exports).triggerHandler("paneViewListRemove", [file, false, pane.id]);
        
            if (pane.id === _activePaneId) {
                $(exports).triggerHandler("currentFileChanged", [_getActivePane().getCurrentlyViewedFile(), paneId]);
            }
        }
    }

    function doCloseList(paneId, fileList) {
        var closedList,
            currentFile = _getActivePane().getCurrentlyViewedFile(),
            currentFileClosed = currentFile ? (fileList.indexOf(currentFile) !== -1) : false;

        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
                closedList = pane.doRemoveViews(fileList);
                $(exports).triggerHandler("paneViewListRemoveList", [closedList, pane.id]);
            });
        } else {
            var pane = _getPaneFromPaneId(paneId);
            closedList = pane.doRemoveViews(fileList);
            $(exports).triggerHandler("paneViewListRemoveList", [closedList, pane.id]);
        }
        
        if (currentFileClosed) {
            $(exports).triggerHandler("currentFileChanged", [_getActivePane().getCurrentlyViewedFile(), _activePaneId]);
        }
    }
    
    
    function doCloseAll(paneId) {
        var fileList;
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
                fileList = pane.getViewList();
                pane.doRemoveAllViews();
                $(exports).triggerHandler("paneViewListRemoveList", [fileList, pane.id]);
            });
        } else {
            var pane = _getPaneFromPaneId(paneId);
            fileList = pane.getViewList();
            pane.doRemoveAllViews();
            $(exports).triggerHandler("paneViewListRemoveList", [fileList, pane.id]);
        }
        
        if (paneId === _activePaneId || paneId === FOCUSED_PANE || paneId === ALL_PANES) {
            $(exports).triggerHandler("currentFileChanged", [null, _activePaneId]);
        }
        
        _doUnsplit();
    }

    
    /**
     *
     */
    function _findPaneForDocument(document) {
        if (!document || !document.file) {
            return;
        }
        // First check for an editor view of the document 
        var paneId = _getPaneIdFromContainer(document._masterEditor.getContainer()),
            pane = _paneViews[paneId];
        
        if (!paneId) {
            // No view of the document, it may be in a working set and not yet opened
            var info = findInPaneViewList(ALL_PANES, document.file.fullPath);
            if (info !== -1) {
                pane = _paneViews[info.paneId];
            }
        }
        
        return pane;
    }
    
    
    function destroyEditorIfNotNeeded(document) {
        if (!(document instanceof DocumentManager.Document)) {
            throw new Error("_destroyEditorIfUnneeded() should be passed a Document");
        }
        if (document._masterEditor) {
            var pane = _findPaneForDocument(document);
            
            if (pane) {
                pane.destroyViewIfNotNeeded(document._masterEditor);
            } else {
                // not referenced in a working set or current view
                document._masterEditor.destroy();
            }
        }
    }
    
    function _convertViewState() {
        var files = [],
            context = { location : { scope: "user",
                                     layer: "project" } };
        
        files = PreferencesManager.getViewState(OLD_PREFS_NAME, context);
        
        if (!files) {
            return;
        }

        var result = {
            orientation: null,
            activePaneId: FIRST_PANE,
            panes: {
                "first-pane": []
            }
        };
        
        // Add all files to the pane view list without verifying that
        // they still exist on disk (for faster project switching)
        files.forEach(function (value) {
            result.panes[FIRST_PANE].push(value);
        });

        return result;
    }
    
    /**
     * Loads the pane view list state
     * @private
     */
    function _loadViewState(e) {
        // file root is appended for each project
        var panes,
            filesToOpen,
            viewStates,
            activeFile,
            promises = [],
            context = { location : { scope: "user",
                                     layer: "project" } },
            state = PreferencesManager.getViewState(PREFS_NAME, context);

        if (!state) {
            // not converted yet
            state = _convertViewState();
        }

        // reset
        _doUnsplit();
        EditorManager.resetViewStates();
        
        if (state) {

            panes = Object.keys(state.panes);
            _orientation = (panes.length > 1) ? state.orientation : null;

            _.forEach(state.panes, function (paneState, paneId) {
                var pane = _createPaneIfNecessary(paneId);
                promises.push(pane.loadState(paneState));
                $(exports).triggerHandler("paneViewListAddList", [pane.getViewList(), pane.id]);
            });
        
            AsyncUtils.waitForAll(promises).then(function () {
                setActivePaneId(state.activePaneId);
                _updateLayout();
                _updateCommandState();
                if (_orientation) {
                    $(exports).triggerHandler("paneLayoutChange", _orientation);
                }
            });
        }
    }
    
    /**
     * Saves the pane view list state
     * @private
     */
    function _saveViewState() {
        var projectRoot     = ProjectManager.getProjectRoot(),
            context         = { location : { scope: "user",
                                         layer: "project",
                                         layerID: projectRoot.fullPath } },
            state = {
                orientation: _orientation,
                activePaneId: getActivePaneId(),
                panes: {
                }
            };
        

        if (!projectRoot) {
            return;
        }
        
        _.forEach(_paneViews, function (pane) {
            state.panes[pane.id] = pane.saveState();
        });

        PreferencesManager.setViewState(PREFS_NAME, state, context);
    }
    
    function _initialize($container) {
        if (!_activePaneId) {
            _$container = $container;
            _createPaneIfNecessary(FIRST_PANE);
            _activePaneId = FIRST_PANE;
            _paneViews[FIRST_PANE].onSetActive(true);
            _updateLayout();
        }
    }
    
    AppInit.htmlReady(function () {
        _initialize($("#editor-holder"));
    });
    
    // Event handlers
    $(ProjectManager).on("projectOpen",                       _loadViewState);
    $(ProjectManager).on("beforeProjectClose beforeAppClose", _saveViewState);
    $(WorkspaceManager).on("workspaceUpdateLayout",           _updateLayout);
    $(EditorManager).on("activeEditorChange",                 _activeEditorChange);
    
    function _handleSplitVertically() {
        if (_orientation === VERTICAL) {
            _doUnsplit();
        } else {
            _doSplit(VERTICAL);
        }
    }
    
    function _handleSplitHorizontially() {
        if (_orientation === HORIZONTAL) {
            _doUnsplit();
        } else {
            _doSplit(HORIZONTAL);
        }
    }
    
    AppInit.appReady(function () {
        _cmdSplitVertically = CommandManager.register("Split Vertically", CMD_ID_SPLIT_VERTICALLY,   _handleSplitVertically);
        _cmdSplitHorizontally = CommandManager.register("Split Horizontally", CMD_ID_SPLIT_HORIZONTALLY, _handleSplitHorizontially);

        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        if (menu) {
            menu.addMenuDivider();
            menu.addMenuItem(CMD_ID_SPLIT_VERTICALLY);
            menu.addMenuItem(CMD_ID_SPLIT_HORIZONTALLY);
        }
        
        _updateCommandState();
    });

    // Init
    _paneTitles[FIRST_PANE] = {};
    _paneTitles[SECOND_PANE] = {};
    _paneTitles[FIRST_PANE][VERTICAL] = Strings.LEFT;
    _paneTitles[FIRST_PANE][HORIZONTAL] = Strings.TOP;
    _paneTitles[SECOND_PANE][VERTICAL] = Strings.RIGHT;
    _paneTitles[SECOND_PANE][HORIZONTAL] = Strings.BOTTOM;
    
    // Unit Test Helpers
    exports._initialize                     = _initialize;
    
    
    // PaneView Management
    exports.addToPaneViewList                = addToPaneViewList;
    exports.addListToPaneViewList            = addListToPaneViewList;
    exports.findInPaneViewList               = findInPaneViewList;
    exports.findInPaneViewListAddedOrder     = findInPaneViewListAddedOrder;
    exports.findInPaneViewListMRUOrder       = findInPaneViewListMRUOrder;
    exports.getPaneViewListSize              = getPaneViewListSize;
    exports.getPaneViewList                  = getPaneViewList;
    exports.getAllOpenFiles                  = getAllOpenFiles;
    exports.makePaneViewMostRecent           = makePaneViewMostRecent;
    exports.removeAllFromPaneViewList        = removeAllFromPaneViewList;
    exports.removeFromPaneViewList           = removeFromPaneViewList;
    exports.removeListFromPaneViewList       = removeListFromPaneViewList;
    exports.sortPaneViewList                 = sortPaneViewList;
    exports.swapPaneViewListIndexes          = swapPaneViewListIndexes;
    exports.traversePaneViewListByMRU        = traversePaneViewListByMRU;
    exports.forceFocusToActivePaneView       = forceFocusToActivePaneView;
    
    // Pane state
    exports.savePaneScrollState              = savePaneScrollState;
    exports.adjustPaneScrollState            = adjustPaneScrollState;
    
    // Traversal
    exports.beginTraversal                   = beginTraversal;
    exports.endTraversal                     = endTraversal;
    
    // PaneView Attributes
    exports.getActivePaneId                  = getActivePaneId;
    exports.setActivePaneId                  = setActivePaneId;
    exports.getPaneIdList                    = getPaneIdList;
    exports.getPaneTitle                     = getPaneTitle;
    exports.getPaneCount                     = getPaneCount;
    exports.getPaneIdForPath                 = getPaneIdForPath;
    
    // Explicit stuff
    exports.destroyEditorIfNotNeeded         = destroyEditorIfNotNeeded;
    exports.doEdit                           = doEdit;
    exports.doOpen                           = doOpen;
    exports.doClose                          = doClose;
    exports.doCloseAll                       = doCloseAll;
    exports.doCloseList                      = doCloseList;
    
    // Convenience
    exports.getCurrentlyViewedFile           = getCurrentlyViewedFile;
    exports.getCurrentlyViewedPath           = getCurrentlyViewedPath;
    exports.getCurrentlyViewedFileForPane    = getCurrentlyViewedFileForPane;
    exports.getCurrentlyViewedPathForPane    = getCurrentlyViewedPathForPane;
    
    // Constants
    exports.ALL_PANES                        = ALL_PANES;
    exports.FOCUSED_PANE                     = FOCUSED_PANE;
});
