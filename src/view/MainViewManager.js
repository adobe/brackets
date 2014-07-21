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
 * MainViewManager Manages the arrangement of all open panes. Each panes contain one or more views wich are 
 * are created by a view factory and inserted into a pane list. There may be several panes managed
 * by the MainViewManager with each pane containing a list of views.  The panes are always visible and 
 * the layout is determined by the MainViewManager and the user.  Currently we support only 2 panes.
 *
 * All of the PaneViewList APIs take a paneId Argument.  This can be an actual pane Id, ALL_PANES (in most cases) 
 * or FOCUSED_PANE. 
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
        

    /** 
     * @const
     * @private
     */
    var CMD_ID_SPLIT_VERTICALLY = "cmd.splitVertically";

    /** 
     * @const
     * @private
     */
    var CMD_ID_SPLIT_HORIZONTALLY = "cmd.splitHorizontally";
    
    /** 
     * @const
     * @private
     */
    var PREFS_NAME          = "mainView.state";
    
    /** 
     * @const
     * @private
     */
    var OLD_PREFS_NAME      = "project.files";
    
    /** @const **/
    var ALL_PANES           = "ALL_PANES";

    /** @const **/
    var FOCUSED_PANE        = "FOCUSED_PANE";
        
    /** 
     * @const
     * @private
     */
    var FIRST_PANE          = "first-pane";

    /** 
     * @const
     * @private
     */
    var SECOND_PANE         = "second-pane";
    
    /** 
     * @const
     * @private
     */
    var VERTICAL            = "VERTICAL";

    /** 
     * @const
     * @private
     */
    var HORIZONTAL          = "HORIZONTAL";
    

    /**
     * Command Object for splitting vertically
     * @type {!Command}
     * @private
     */
    var _cmdSplitVertically;

    /**
     * Command Object for splitting horizontally
     * @type {!Command} 
     * @private
     */
    var _cmdSplitHorizontally;
    
    /**
     * localized pane titles 
     * @type {Object.{FIRST_PANE|SECOND_PANE, <VERTICAL.string, HORIZONTAL.string}}}
     *  Localized string for first and second panes in the current orientation.  
     * @see {@link getPaneTitle()} for more information
     * @private
     */
    var _paneTitles  = {
    };
    
    /**
     * current orientation (null, VERTICAL or HORIZONTAL)
     * @type {string=} 
     * @private
     */
    var _orientation = null;
    
    /**
     * current orientation. May not be null
     * @type {!string}
     * @private
     */
    var _activePaneId = null;
    
    /**
     * Container we live in
     * @type {jQuery}
     * @private
     */
    var _$container;
    
    /**
     * map of panes
     * @type {Object.map<string, Pane>} 
     * @private
     */
    var _paneViews = {
    };
    
    
    /**
     * map of pane scroll states
     * @type {Object.map<string, *>} 
     * @private
     */
    var _paneScrollStates = {
    };
    
    /**
     * flag indicating if traversing is currently taking place
     * When True, changes the current pane's MRU list will not be updated. 
     * Useful for next/previous keyboard navigation (until Ctrl is released)
     * or for incremental-search style document preview like Quick Open will eventually have.
     * @type {!boolean}
     * @private
     */
    var _traversingFileList = false;
    
    /**
     * Retrieves the currently active Pane Id
     * @return {!string} Active Pane's ID.
     */
    function getActivePaneId() {
        return _activePaneId;
    }
    
    /**
     * Retrieves the Pane object for the given paneId
     * @param {!string} paneId - id of the pane to retrieve
     * @return {?Pane} the Pane object or null if a pane object doesn't exist for the pane
     * @private
     */
    function _getPaneFromPaneId(paneId) {
        if (!paneId || paneId === FOCUSED_PANE) {
            paneId = getActivePaneId();
        }
        
        if (_paneViews[paneId]) {
            return _paneViews[paneId];
        }
        
        return null;
    }
    
    /**
     * Retrieves the Pane object for the given paneId
     * @return {!Pane} the Pane object of the currently active pane. Cannot be null
     * @private
     */
    function _getActivePane() {
        return _getPaneFromPaneId(_activePaneId);
    }
    
    
    /**
     * Forces focus to the current pane or the current pane's view
     */
    function forceFocusToActivePaneView() {
        _getActivePane().focus();
    }
    
    
    /**
     * Switch active pane to the id of the pane specified
     * @param {!string} paneId - the id of the pane to activate
     */
    function setActivePaneId(newPaneId) {
        if (_paneViews.hasOwnProperty(newPaneId) && (newPaneId !== _activePaneId)) {
            var oldPaneId = _activePaneId,
                oldPane = _getActivePane(),
                newPane = _getPaneFromPaneId(newPaneId);
            
            _activePaneId = newPaneId;
            
            $(exports).triggerHandler("activePaneChanged", [newPaneId, oldPaneId]);
            $(exports).triggerHandler("currentFileChanged", [_getActivePane().getCurrentlyViewedFile(), newPaneId, oldPane.getCurrentlyViewedFile(), oldPaneId]);
            
            oldPane.notifySetActive(false);
            newPane.notifySetActive(true);
        }
        
        forceFocusToActivePaneView();
    }
    
    /**
     * Retrieves the Pane ID for the container specified
     * @param {!jQuery} $container - the container of the item to fetch
     * @return {?string} the id of the pane that matches the container or undefined if a pane doesn't exist for that container
     */
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
    
    /**
     * Retrieves the currently viewed file of the pane specified by paneId
     * @param {!string} paneId - the id of the pane in which to retrieve the currently viewed file
     * @return {?File} File object of the currently viewed file, null if there isn't one or undefined if there isn't a matching pane
     */
    function getCurrentlyViewedFileForPane(paneId) {
        var pane = _getPaneFromPaneId(paneId);
        if (pane) {
            return pane.getCurrentlyViewedFile();
        }
    }
 
    /**
     * Retrieves the currently viewed path of the pane specified by paneId
     * @param {!string} paneId - the id of the pane in which to retrieve the currently viewed path
     * @return {?string} the path of the currently viewed file or null if there isn't one
     */
    function getCurrentlyViewedPathForPane(paneId) {
        var file = getCurrentlyViewedFileForPane(paneId);
        return file ? file.fullPath : null;
    }
    
    /**
     * Retrieves the currently viewed file of the focused pane
     * @return {?File} File object of the currently viewed file, null if there isn't one or undefined if there isn't a matching pane
     */
    function getCurrentlyViewedFile() {
        return getCurrentlyViewedFileForPane(FOCUSED_PANE);
    }
    
    /**
     * Retrieves the currently viewed path of the focused pane
     * @return {?string} the path of the currently viewed file or null if there isn't one
     */
    function getCurrentlyViewedPath() {
        return getCurrentlyViewedPathForPane(FOCUSED_PANE);
    }
    
    /**
     * EditorManager.activeEditorChange handler 
     *   Activates the pane that the active editor belongs to
     * @private
     * @param {!jQuery.Event} e - jQuery Event object
     * @param {Editor=} current - editor being made the current editor
     */
    function _activeEditorChange(e, current) {
        if (current) {
            var $container = current.getContainer(),
                newPaneId = _getPaneIdFromContainer($container);

            // Ignore active editor changes for inline editors
            if (newPaneId) {
                if (newPaneId !== _activePaneId) {
                    // we just need to set the active pane in this case
                    //  it will dispatch the currentFileChanged message as well
                    //  as dispatching other events when the active pane changes
                    setActivePaneId(newPaneId);
                } else {
                    // TODO: This may not be necessary anymore
                    var currentFile = getCurrentlyViewedFile();
                    if (currentFile !== current.getFile()) {
                        $(exports).triggerHandler("currentFileChanged", [current.getFile(), _activePaneId, currentFile, _activePaneId]);
                        forceFocusToActivePaneView();
                    }
                }
            }
        }
    }
    
    /**
     * caches the specified pane's current scroll state
     * @param {!string} paneId - id of the pane in which to cache the scroll state, ALL_PANES or FOCUSED_PANE
     */
    function savePaneScrollState(paneId) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
                _paneScrollStates[pane.id] = pane.getPaneScrollState();
            });
        } else {
            var pane = _getPaneFromPaneId(paneId);
            if (pane) {
                _paneScrollStates[pane.id] = pane.getPaneScrollState();
            }
        }
    }
    
    /**
     * reads the scroll state from the scroll state cache and passes it back to the pane to restore the 
     * scroll state and applies the heightData to the scroll. This is used primarily when a modal bar
     * is opened to keep the editor from scrolling the current page out of view in order to maintain the appearance
     * that the difference in size isn't affecting the state of the current document
     * @param {!string} paneId - id of the pane in which to adjust the scroll state, ALL_PANES or FOCUSED_PANE
     * @param {!number} heightDelta - delta H to apply to the scroll state
     */
    function adjustPaneScrollState(paneId, heightDelta) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
                if (_paneScrollStates.hasOwnProperty(pane.id)) {
                    pane.adjustPaneScrollState(_paneScrollStates[pane.id], heightDelta);
                }
            });
            _paneScrollStates = {};
        } else {
            var pane = _getPaneFromPaneId(paneId);
            if (pane && _paneScrollStates.hasOwnProperty(pane.id)) {
                pane.adjustPaneScrollState(_paneScrollStates[pane.id], heightDelta);
                delete _paneScrollStates[pane.id];
            }
        }
    }
        
    
    /**
     * Retrieves the PaneViewList for the given PaneId
     * @param {!string} paneId - id of the pane in which to get the view list, ALL_PANES or FOCUSED_PANE
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
    
    
    /**
     * Retrieves the list of all open files
     * @return {array.<File>} the list of all open files in all open panes
     */
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
    
    /**
     * Retrieves the list of all open pane ids
     * @return {array.<string>} the list of all open panes
     */
    function getPaneIdList() {
        return Object.keys(_paneViews);
    }
    
    /**
     * Retrieves the size of the selected pane's view list
     * @param {!string} paneId - id of the pane in which to get the pane view list size, ALL_PANES or FOCUSED_PANE
     * @return {!number} the number of items in the specified pane 
     */
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
    
    /**
     * Retrieves the title to display in the pane view list view
     * @param {!string} paneId - id of the pane in which to get the title
     * @return {?string} title
     */
    function getPaneTitle(paneId) {
        return _paneTitles[paneId][_orientation];
    }
    
    /**
     * Retrieves the number of panes
     * @return {number} 
     */
    function getPaneCount() {
        return Object.keys(_paneViews).length;
    }
    
    /**
     * @todo
     * @private
     */
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
     * @param {!string} paneId - id of the pane in which to search or ALL_PANES or FOCUSED_PANE
     * @param {!string} fullPath - full path of the file to search for
     * @return {number} index, -1 if not found.
     */
    function findInPaneViewList(paneId, fullPath) {
        return _doFindInViewList(paneId, fullPath, "findInViewList");
    }
    
    /**
     * Gets the index of the file matching fullPath in the added order pane view list
     * @param {!string} paneId - id of the pane in which to search or ALL_PANES or FOCUSED_PANE
     * @param {!string} fullPath - full path of the file to search for
     * @return {number} index, -1 if not found.
     */
    function findInPaneViewListAddedOrder(paneId, fullPath) {
        return _doFindInViewList(paneId, fullPath, "findInViewListAddedOrder");
    }
    
    /**
     * Gets the index of the file matching fullPath in the MRU order pane view list
     * @param {!string} paneId - id of the pane in which to search or ALL_PANES or FOCUSED_PANE
     * @param {!string} fullPath - full path of the file to search for
     * @return {number} index, -1 if not found.
     */
    function findInPaneViewListMRUOrder(paneId, fullPath) {
        return _doFindInViewList(paneId, fullPath, "findInViewListMRUOrder");
    }

    /**
     * Retrieves pane id where the specified file has been opened
     * @param {!string} fullPath - full path of the file to search for
     * @return {?string} pane id where the file has been opened or null if it wasn't found
     */
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
     * @param {!string} paneId - The id of the pane in which to add the file object to or FOCUSED_PANE
     * @param {!File} file - The File object to add
     * @param {number=} index - Position to add to list (defaults to last); -1 is ignored
     * @param {boolean=} forceRedraw - If true, a pane view list change notification is always sent
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
     * @param {!string} paneId - The id of the pane in which to add the file object to or FOCUSED_PANE
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
    
    /**
     * @todo
     * @private
     */
    function _removeFromPaneViewList(paneId, file, suppressRedraw) {
        var pane = _getPaneFromPaneId(paneId);

        if (pane && pane.removeFromViewList(file)) {
            $(exports).triggerHandler("paneViewListRemove", [file, suppressRedraw, pane.id]);
        }
    }
    
    /**
     * @see {link doClose()} use doClose instead
     * Removes the specified file from the pane view list, if it was in the list. 
     *   Will show the interstitial page if the current file is closed 
     *       even if there are  other files in which to show
     *   Does not prompt for unsaved changes
     * @param {!string} paneId - the  Pane with which the caller wants to remove, ALL_PANES or FOCUSED_PANE
     * @param {File} file - file to close 
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
     * Remove list helper
     * @param {!string} paneId - the  Pane with which the caller wants to remove, ALL_PANES or FOCUSED_PANE
     * @param {Array.<File>} file list
     * @private
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

    /**
     * @see {link doCloseList()} use doCloseList instead
     * Removes the specified file list from the pane view list, if it was in the list. 
     *   Will show the interstitial page if the current file is closed 
     *       even if there are  other files in which to show
     *   Does not prompt for unsaved changes
     * @param {!string} paneId - the  Pane with which the caller wants to remove, ALL_PANES or FOCUSED_PANE
     * @param {Array.<File>} file list
     */
    function removeListFromPaneViewList(paneId, list) {
        if (paneId === ALL_PANES) {
            _.forEach(_paneViews, function (pane) {
                _removeListFromPaneViewList(pane.id, list);
            });
        } else {
            _removeListFromPaneViewList(paneId, list);
        }
    }
        
   
    /**
     * Removew All helper
     * @param {!string} paneId - the id of the pane with which to remove all from
     * @private
     */
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
     * @see {link doCloseAll()} use doCloseList instead
     * Removes the specified file list from the pane view list, if it was in the list. 
     *   Will show the interstitial page if the current file is closed 
     *       even if there are  other files in which to show
     *   Does not prompt for unsaved changes
     * @param {!string} paneId - id of the pane to remove all, ALL_PANES or FOCUSED_PANE
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
     * @param {!string} paneId - id of the pane to mae th file most recent or FOCUSED_PANE
     * @param {!File} file - File object to make most recent
     */
    function _makePaneViewMostRecent(paneId, file) {
        var pane = _getPaneFromPaneId(paneId);

        if (pane && !_traversingFileList) {
            pane.makeViewMostRecent(file);
        }
    }
    
    /**
     * sorts the pane's view list 
     * @param {!string} paneId - id of the pane to sort, ALL_PANES or FOCUSED_PANE
     * @param {sortFunctionCallback} compareFn - callback to determine sort order (called on each item)
     * @see {@link Pane.sortViewList()} for more information
     * @see {@link https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort|Sort Array - MDN}
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
     * @param {!string} paneId - id of the pane to swap indices or FOCUSED_PANE
     * @param {!number} index1 - the index on the left
     * @param {!number} index2 - the index on the rigth
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
     * @return {?File} null if pane view list empty
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
     * Indicates that traversal has begun. 
     * Can be called any number of times.
     */
    function beginTraversal() {
        _traversingFileList = true;
    }
    
    /**
     * Un-freezes the MRU list after one or more beginTraversal() calls.
     * Whatever file is current is bumped to the front of the MRU list.
     */
    function endTraversal() {
        var pane = _getActivePane();
        
        if (_traversingFileList) {
            _traversingFileList = false;
            
            _makePaneViewMostRecent(pane.id, pane.getCurrentlyViewedFile());
        }
    }
    
    /**
     * Event handler for "workspaceUpdateLayout" to update the layout
     * @param {jQuery.Event} event object
     * @param {number} viewAreaHeight
     * @param {*} refresh hint data
     * @private
     */
    function _updateLayout(event, viewAreaHeight, refreshHint) {
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
    
    /**
     * Updates the command check states of the split vertical and split horizontal commands
     * @private
     */
    function _updateCommandState() {
        if (_cmdSplitVertically && _cmdSplitHorizontally) {
            _cmdSplitVertically.setChecked(_orientation === VERTICAL);
            _cmdSplitHorizontally.setChecked(_orientation === HORIZONTAL);
        }
    }
    
    /**
     * Merges second pane into first pane and opens the current file
     * @private
     */
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
            $(exports).triggerHandler("paneLayoutChanged", [_orientation]);

            if (getCurrentlyViewedFile() !== lastViewed) {
                exports.doOpen(firstPane.id, lastViewed);
            }
        }
    }

    /**
     * Creates a pane for paneId if one doesn't already exist
     * @param {!string} paneId - id of the pane to create
     * @private
     * @return {Pane} - the pane object of the pane 
     */
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
    
    /**
     * Creates a split for the specified orientation
     * @private
     * @param {!string} orientation (VERTICAL|HORIZONTAL)
     */
    function _doSplit(orientation) {
        _createPaneIfNecessary(SECOND_PANE);
        _orientation = orientation;
        _updateLayout();
        _updateCommandState();
        $(exports).triggerHandler("paneLayoutChanged", [_orientation]);
        
    }
    
    /**
     * Edits a document in the specified pane
     * @param {!string} paneId - id of the pane in which to open the document
     * @param {!Document} doc - document to edit
     */
    function doEdit(paneId, doc) {
        
        var currentPaneId = getPaneIdForPath(doc.file.fullPath),
            oldPane = _getActivePane(),
            oldFile = oldPane.getCurrentlyViewedFile();

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
            $(exports).triggerHandler("currentFileChanged", [doc.file, pane.id, oldFile, pane.id]);
        }

        _makePaneViewMostRecent(paneId, doc.file);
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

        var pane = _getPaneFromPaneId(paneId),
            oldFile = pane.getCurrentlyViewedFile();

        
        if (pane.doRemoveView(file)) {
            $(exports).triggerHandler("paneViewListRemove", [file, false, pane.id]);
        
            if (pane.id === _activePaneId) {
                $(exports).triggerHandler("currentFileChanged", [pane.getCurrentlyViewedFile(), pane.id, oldFile, pane.id]);
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
            $(exports).triggerHandler("currentFileChanged", [_getActivePane().getCurrentlyViewedFile(), _activePaneId, currentFile, _activePaneId]);
        }
    }
    
    
    function doCloseAll(paneId) {
        var fileList,
            currentFile = _getActivePane().getCurrentlyViewedFile();
        
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
            $(exports).triggerHandler("currentFileChanged", [null, _activePaneId, currentFile, _activePaneId]);
        }
        
        _doUnsplit();
    }

    
    /**
     * @private
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


        /* convert the view state data */
        var convertViewState = function () {
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
        };
        
        
        if (!state) {
            // not converted yet
            state = convertViewState();
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
                    $(exports).triggerHandler("paneLayoutChanged", _orientation);
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
    
    /**
     * Initializes the MainViewManager's view state
     * @param {jQuery} $container - the container where the main view will live
     * @private
     */
    function _initialize($container) {
        if (!_activePaneId) {
            _$container = $container;
            _createPaneIfNecessary(FIRST_PANE);
            _activePaneId = FIRST_PANE;
            _paneViews[FIRST_PANE].notifySetActive(true);
            _updateLayout();
        }
    }
    
    // Setup a ready event to initialize ourself
    AppInit.htmlReady(function () {
        _initialize($("#editor-holder"));
    });
    
    // Event handlers
    $(ProjectManager).on("projectOpen",                       _loadViewState);
    $(ProjectManager).on("beforeProjectClose beforeAppClose", _saveViewState);
    $(WorkspaceManager).on("workspaceUpdateLayout",           _updateLayout);
    $(EditorManager).on("activeEditorChange",                 _activeEditorChange);
    
    /** 
     * handles the split vertically command
     * @private
     */
    function _handleSplitVertically() {
        if (_orientation === VERTICAL) {
            _doUnsplit();
        } else {
            _doSplit(VERTICAL);
        }
    }
    
    /** 
     * handles the split horizontally command
     * @private
     */
    function _handleSplitHorizontially() {
        if (_orientation === HORIZONTAL) {
            _doUnsplit();
        } else {
            _doSplit(HORIZONTAL);
        }
    }
    
    /** 
     * Changes the layout scheme
     * @param {!number} rows (may be 1 or 2)
     * @param {!number} columns (may be 1 or 2) 
     * @summay Rows or Columns may be 1 or 2 but both cannot be 2. 1x2, 2x1 or 1x1 are the legal values
     */
    function setLayoutScheme(rows, columns) {
        if ((rows < 1) || (rows > 2) || (columns < 1) || (columns > 2) || (columns === rows === 2)) {
            console.error("setLayoutScheme unsupported layout " + rows + ", " + columns);
            return false;
        }
        
        if (rows === columns) {
            _doUnsplit();
        } else if (rows > columns) {
            _doSplit(HORIZONTAL);
        } else {
            _doSplit(VERTICAL);
        }
        return true;
    }
    
    /** 
     * Retrieves the current layout scheme
     * @return {Object.{rows: number, columns: number}}
     */
    function getLayoutScheme() {
        var result = {
            rows: 1,
            columns: 1
        };

        if (_orientation === HORIZONTAL) {
            result.rows = 2;
        } else if (_orientation === VERTICAL) {
            result.columns = 2;
        }
        
        return result;
    }
    
    /** 
     * Add an app ready callback to register global commands. 
     */
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
    exports._getPaneFromPaneId              = _getPaneFromPaneId;
    
    // PaneView Management
    exports.addToPaneViewList                = addToPaneViewList;
    exports.addListToPaneViewList            = addListToPaneViewList;
    exports.findInPaneViewList               = findInPaneViewList;
    exports.findInPaneViewListAddedOrder     = findInPaneViewListAddedOrder;
    exports.findInPaneViewListMRUOrder       = findInPaneViewListMRUOrder;
    exports.getPaneViewListSize              = getPaneViewListSize;
    exports.getPaneViewList                  = getPaneViewList;
    exports.getAllOpenFiles                  = getAllOpenFiles;
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
    
    // Layout
    exports.setLayoutScheme                  = setLayoutScheme;
    exports.getLayoutScheme                  = getLayoutScheme;
    
    // Convenience
    exports.getCurrentlyViewedFile           = getCurrentlyViewedFile;
    exports.getCurrentlyViewedPath           = getCurrentlyViewedPath;
    exports.getCurrentlyViewedFileForPane    = getCurrentlyViewedFileForPane;
    exports.getCurrentlyViewedPathForPane    = getCurrentlyViewedPathForPane;
    
    // Constants
    exports.ALL_PANES                        = ALL_PANES;
    exports.FOCUSED_PANE                     = FOCUSED_PANE;
});
