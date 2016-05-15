/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, $ */

/**
 * MainViewManager manages the arrangement of all open panes as well as provides the controller
 * logic behind all views in the MainView (e.g. ensuring that a file doesn't appear in 2 lists)
 *
 * Each pane contains one or more views wich are created by a view factory and inserted into a pane list.
 * There may be several panes managed by the MainViewManager with each pane containing a list of views.
 * The panes are always visible and the layout is determined by the MainViewManager and the user.
 *
 * Currently we support only 2 panes.
 *
 * All of the WorkingSet APIs take a paneId Argument.  This can be an actual pane Id, ALL_PANES (in most cases)
 * or ACTIVE_PANE. ALL_PANES may not be supported for some APIs.  See the API for details.
 *
 * This module dispatches several events:
 *
 *    - activePaneChange - When the active pane changes.  There will always be an active pane.
 *          (e, newPaneId:string, oldPaneId:string)
 *    - currentFileChange -- When the user has switched to another pane, file, document. When the user closes a view
 *      and there are no other views to show the current file will be null.
 *          (e, newFile:File, newPaneId:string, oldFile:File, oldPaneId:string)
 *    - paneLayoutChange -- When Orientation changes.
 *          (e, orientation:string)
 *    - paneCreate -- When a pane is created
 *          (e, paneId:string)
 *    - paneDestroy -- When a pane is destroyed
 *          (e, paneId:string)
 *
 *
 *    To listen for working set changes, you must listen to *all* of these events:
 *    - workingSetAdd -- When a file is added to the working set
 *          (e, fileAdded:File, index:number, paneId:string)
 *    - workingSetAddList -- When multiple files are added to the working set
 *          (e, fileAdded:Array.<File>, paneId:string)
 *    - workingSetMove - When a File has moved to a different working set
 *          (e, File:FILE, sourcePaneId:string, destinationPaneId:string)
 *    - workingSetRemove -- When a file is removed from the working set
 *          (e, fileRemoved:File, suppressRedraw:boolean, paneId:string)
 *    - workingSetRemoveList -- When multiple files are removed from the working set
 *          (e, filesRemoved:Array.<File>, paneId:string)
 *    - workingSetSort -- When a pane's view array is reordered without additions or removals.
 *          (e, paneId:string)
 *    - workingSetUpdate -- When changes happen due to system events such as a file being deleted.
 *                              listeners should discard all working set info and rebuilt it from the pane
 *                              by calling getWorkingSet()
 *          (e, paneId:string)
 *    - _workingSetDisableAutoSort -- When the working set is reordered by manually dragging a file.
 *          (e, paneId:string) For Internal Use Only.
 *
 * To listen for events, do something like this: (see EventDispatcher for details on this pattern)
 *    `MainViewManager.on("eventname", handler);`
 */
define(function (require, exports, module) {
    "use strict";

    var _                   = require("thirdparty/lodash"),
        EventDispatcher     = require("utils/EventDispatcher"),
        Strings             = require("strings"),
        AppInit             = require("utils/AppInit"),
        CommandManager      = require("command/CommandManager"),
        MainViewFactory     = require("view/MainViewFactory"),
        ViewStateManager    = require("view/ViewStateManager"),
        Commands            = require("command/Commands"),
        EditorManager       = require("editor/EditorManager"),
        FileSystemError     = require("filesystem/FileSystemError"),
        DocumentManager     = require("document/DocumentManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        ProjectManager      = require("project/ProjectManager"),
        WorkspaceManager    = require("view/WorkspaceManager"),
        AsyncUtils          = require("utils/Async"),
        ViewUtils           = require("utils/ViewUtils"),
        Resizer             = require("utils/Resizer"),
        Pane                = require("view/Pane").Pane;

    /**
     * Preference setting name for the MainView Saved State
     * @const
     * @private
     */
    var PREFS_NAME          = "mainView.state";

    /**
     * Legacy Preference setting name used to migrate old preferences
     * @const
     * @private
     */
    var OLD_PREFS_NAME      = "project.files";

    /**
     * Special paneId shortcut that can be used to specify that
     * all panes should be targeted by the API.
     * Not all APIs support this constnant.
     * Check the API documentation before use.
     * @const
     */
    var ALL_PANES           = "ALL_PANES";

    /**
     * Special paneId shortcut that can be used to specify that
     * the API should target the focused pane only.
     * All APIs support this shortcut.
     * @const
     */
    var ACTIVE_PANE        = "ACTIVE_PANE";

    /**
     * Internal pane id
     * @const
     * @private
     */
    var FIRST_PANE          = "first-pane";

    /**
     * Internal pane id
     * @const
     * @private
     */
    var SECOND_PANE         = "second-pane";

    /*
     * NOTE: The following commands and constants will change
     *        when implementing the UX UI Treatment @larz0
     */

    /**
     * Vertical layout state name
     * @const
     * @private
     */
    var VERTICAL            = "VERTICAL";

    /**
     * Horizontal layout state name
     * @const
     * @private
     */
    var HORIZONTAL          = "HORIZONTAL";

    /**
     * The minimum width or height that a pane can be
     * @const
     * @private
     */
    var MIN_PANE_SIZE      = 75;

    /**
     * current orientation (null, VERTICAL or HORIZONTAL)
     * @type {string=}
     * @private
     */
    var _orientation = null;

    /**
     * current pane id. May not be null
     * @type {!string}
     * @private
     */
    var _activePaneId = null;

    /**
     * DOM element hosting the Main View.
     * @type {jQuery}
     * @private
     */
    var _$el;

    /**
     * Maps paneId to Pane objects
     * @type {Object.<string, Pane>}
     * @private
     */
    var _panes = {};


    /**
     * map of pane scroll states
     * @type {Object.map<string, *>}
     * @private
     */
    var _paneScrollStates = {};


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
     * The global MRU list (for traversing)
     * @type {Array.<file:File, paneId:string>}
     */
    var _mruList = [];

    /**
     * localized pane titles
     * @type {Object.<FIRST_PANE|SECOND_PANE, <VERTICAL.string, HORIZONTAL.string>}}
     *  Localized string for first and second panes in the current orientation.
     * @see {@link #getPaneTitle} for more information
     * @private
     */
    var _paneTitles  = {};

    /*
     * Initialize _paneTitles
     */
    _paneTitles[FIRST_PANE] = {};
    _paneTitles[SECOND_PANE] = {};

    _paneTitles[FIRST_PANE][VERTICAL]     = Strings.LEFT;
    _paneTitles[FIRST_PANE][HORIZONTAL]   = Strings.TOP;
    _paneTitles[SECOND_PANE][VERTICAL]    = Strings.RIGHT;
    _paneTitles[SECOND_PANE][HORIZONTAL]  = Strings.BOTTOM;

    /**
     * Makes a MRU List Entry
     * @param {!File} File - the file
     * @param {!string} paneId - the paneId
     * @return {{file:File, paneId:string}}
     * @private
     */
    function _makeMRUListEntry(file, paneId) {
        return {file: file, paneId: paneId};
    }

    /**
     * Locates the first  MRU entry of a file for the requested pane
     * @param {!string} paneId - the paneId
     * @param {!File} File - the file
     * @return {{file:File, paneId:string}}
     * @private
     */
    function _findFileInMRUList(paneId, file) {
        return _.findIndex(_mruList, function (record) {
            return (record.file.fullPath === file.fullPath && record.paneId === paneId);
        });
    }

    /**
     * Checks whether a file is listed exclusively in the provided pane
     * @param {!File} File - the file
     * @return {{file:File, paneId:string}}
     */
    function isExclusiveToPane(file, paneId) {
        paneId = paneId === ACTIVE_PANE && _activePaneId ? _activePaneId : paneId;
        var index = _.findIndex(_mruList, function (record) {
            return (record.file.fullPath === file.fullPath && record.paneId !== paneId);
        });
        return index === -1;
    }


    /**
     * Retrieves the currently active Pane Id
     * @return {!string} Active Pane's ID.
     */
    function getActivePaneId() {
        return _activePaneId;
    }

    /**
     * Resolve paneId to actual pane.
     * @param {?string} paneId - id of the desired pane. May be symbolic or null (to indicate current pane)
     * @return {string} id of the pane in which to open the document
     */
    function _resolvePaneId(paneId) {
        if (!paneId || paneId === ACTIVE_PANE) {
            return getActivePaneId();
        }
        return paneId;
    }

    /**
     * Retrieves the Pane object for the given paneId
     * @param {!string} paneId - id of the pane to retrieve
     * @return {?Pane} the Pane object or null if a pane object doesn't exist for the pane
     * @private
     */
    function _getPane(paneId) {
        paneId = _resolvePaneId(paneId);

        if (_panes[paneId]) {
            return _panes[paneId];
        }

        return null;
    }

    /**
     * Focuses the current pane. If the current pane has a current view, then the pane will focus the view.
     */
    function focusActivePane() {
        _getPane(ACTIVE_PANE).focus();
    }

    /**
     * Determines if the pane id is a special pane id
     * @param {!string} paneId - the id to test
     * @return {boolean} true if the pane id is a special identifier, false if not
     */
    function _isSpecialPaneId(paneId) {
        return paneId === ACTIVE_PANE || paneId === ALL_PANES;
    }

    /**
     * Makes the file the most recent for the pane and the global mru lists
     * @param {!string} paneId - id of the pane to mae th file most recent or ACTIVE_PANE
     * @param {!File} file - File object to make most recent
     * @private
     */
    function _makeFileMostRecent(paneId, file) {
        var index,
            entry,
            pane = _getPane(paneId);

        if (!_traversingFileList) {
            pane.makeViewMostRecent(file);

            index = _.findIndex(_mruList, function (record) {
                return (record.file === file && record.paneId === pane.id);
            });

            entry = _makeMRUListEntry(file, pane.id);

            if (index !== -1) {
                _mruList.splice(index, 1);
            }

            if (_findFileInMRUList(pane.id, file) !== -1) {
                console.log(file.fullPath + " duplicated in mru list");
            }

            // add it to the front of the list
            _mruList.unshift(entry);
        }
    }

    /**
     * Makes the Pane's current file the most recent
     * @param {!string} paneId - id of the pane to make the file most recent, or ACTIVE_PANE
     * @param {!File} file - File object to make most recent
     * @private
     */
    function _makePaneMostRecent(paneId) {
        var pane = _getPane(paneId);

        if (pane.getCurrentlyViewedFile()) {
            _makeFileMostRecent(paneId, pane.getCurrentlyViewedFile());
        }
    }

    /**
     * Switch active pane to the specified pane id (or ACTIVE_PANE/ALL_PANES, in which case this
     * call does nothing).
     * @param {!string} paneId - the id of the pane to activate
     */
    function setActivePaneId(newPaneId) {
        if (!_isSpecialPaneId(newPaneId) && newPaneId !== _activePaneId) {
            var oldPaneId = _activePaneId,
                oldPane = _getPane(ACTIVE_PANE),
                newPane = _getPane(newPaneId);

            if (!newPane) {
                throw new Error("invalid pane id: " + newPaneId);
            }

            _activePaneId = newPaneId;

            exports.trigger("activePaneChange", newPaneId, oldPaneId);
            exports.trigger("currentFileChange", _getPane(ACTIVE_PANE).getCurrentlyViewedFile(),
                                                            newPaneId,
                                                            oldPane.getCurrentlyViewedFile(),
                                                            oldPaneId);

            _makePaneMostRecent(_activePaneId);
            focusActivePane();
        }
    }

    /**
     * Retrieves the Pane ID for the specified container
     * @param {!jQuery} $el - the element of the pane to fetch
     * @return {?string} the id of the pane that matches the container or undefined if a pane doesn't exist for that container
     */
    function _getPaneFromElement($el) {
        return _.find(_panes, function (pane) {
            if (pane.$el[0] === $el[0]) {
                return pane;
            }
        });
    }

    /**
     * Retrieves the currently viewed file of the specified paneId
     * @param {?string} paneId - the id of the pane in which to retrieve the currently viewed file
     * @return {?File} File object of the currently viewed file, or null if there isn't one or there's no such pane
     */
    function getCurrentlyViewedFile(paneId) {
        var pane = _getPane(paneId);
        return pane ? pane.getCurrentlyViewedFile() : null;
    }

    /**
     * Retrieves the currently viewed path of the pane specified by paneId
     * @param {?string} paneId - the id of the pane in which to retrieve the currently viewed path
     * @return {?string} the path of the currently viewed file or null if there isn't one
     */
    function getCurrentlyViewedPath(paneId) {
        var file = getCurrentlyViewedFile(paneId);
        return file ? file.fullPath : null;
    }

    /**
     * EditorManager.activeEditorChange handler
     *   This event is triggered when an visible editor gains focus
     *   Therefore we need to Activate the pane that the active editor belongs to
     * @private
     * @param {!jQuery.Event} e - jQuery Event object
     * @param {Editor=} current - editor being made the current editor
     */
    function _activeEditorChange(e, current) {
        if (current) {
            var $container = current.$el.parent().parent(),
                pane = _getPaneFromElement($container);

            if (pane) {
                // Editor is a full editor
                if (pane.id !== _activePaneId) {
                    // we just need to set the active pane in this case
                    //  it will dispatch the currentFileChange message as well
                    //  as dispatching other events when the active pane changes
                    setActivePaneId(pane.id);
                }
            } else {
                // Editor is an inline editor, find the parent pane
                var parents = $container.parents(".view-pane");
                if (parents.length === 1) {
                    $container = $(parents[0]);
                    pane = _getPaneFromElement($container);
                    if (pane) {
                        if (pane.id !== _activePaneId) {
                            // activate the pane which will put focus in the pane's doc
                            setActivePaneId(pane.id);
                            // reset the focus to the inline editor
                            current.focus();
                        }
                    }
                }
            }
        }
    }


    /**
     * Iterates over the pane or ALL_PANES and calls the callback function for each.
     * @param {!string} paneId - id of the pane in which to adjust the scroll state, ALL_PANES or ACTIVE_PANE
     * @param {!function(!pane:Pane):boolean} callback - function to callback on to perform work.
     * The callback will receive a Pane and should return false to stop iterating.
     * @private
     */
    function _forEachPaneOrPanes(paneId, callback) {
        if (paneId === ALL_PANES) {
            _.forEach(_panes, callback);
        } else {
            callback(_getPane(paneId));
        }
    }

    /**
     * Caches the specified pane's current scroll state
     * If there was already cached state for the specified pane, it is discarded and overwritten
     * @param {!string} paneId - id of the pane in which to cache the scroll state,
     *                            ALL_PANES or ACTIVE_PANE
     */
    function cacheScrollState(paneId) {
        _forEachPaneOrPanes(paneId, function (pane) {
            _paneScrollStates[pane.id] = pane.getScrollState();
        });
    }


    /**
     * Restores the scroll state from cache and applies the heightDelta
     * The view implementation is responsible for applying or ignoring the heightDelta.
     * This is used primarily when a modal bar opens to keep the editor from scrolling the current
     * page out of view in order to maintain the appearance.
     * The state is removed from the cache after calling this function.
     * @param {!string} paneId - id of the pane in which to adjust the scroll state,
     *                              ALL_PANES or ACTIVE_PANE
     * @param {!number} heightDelta - delta H to apply to the scroll state
     */
    function restoreAdjustedScrollState(paneId, heightDelta) {
        _forEachPaneOrPanes(paneId, function (pane) {
            pane.restoreAndAdjustScrollState(_paneScrollStates[pane.id], heightDelta);
            delete _paneScrollStates[pane.id];
        });
    }


    /**
     * Retrieves the WorkingSet for the given paneId not including temporary views
     * @param {!string} paneId - id of the pane in which to get the view list, ALL_PANES or ACTIVE_PANE
     * @return {Array.<File>}
     */
    function getWorkingSet(paneId) {
        var result = [];

        _forEachPaneOrPanes(paneId, function (pane) {
            var viewList = pane.getViewList();
            result = _.union(result, viewList);
        });

        return result;
    }


    /**
     * Retrieves the list of all open files including temporary views
     * @return {array.<File>} the list of all open files in all open panes
     */
    function getAllOpenFiles() {
        var result = getWorkingSet(ALL_PANES);
        _.forEach(_panes, function (pane) {
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
        return Object.keys(_panes);
    }

    /**
     * Retrieves the size of the selected pane's view list
     * @param {!string} paneId - id of the pane in which to get the workingset size.
     *      Can use `ALL_PANES` or `ACTIVE_PANE`
     * @return {!number} the number of items in the specified pane
     */
    function getWorkingSetSize(paneId) {
        var result = 0;
        _forEachPaneOrPanes(paneId, function (pane) {
            result += pane.getViewListSize();
        });
        return result;
    }

    /**
     * Retrieves the title to display in the workingset view
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
        return Object.keys(_panes).length;
    }

    /**
     * Helper to abastract the common working set search functions
     * @param {!string} paneId - id of the pane to search or ALL_PANES to search all panes
     * @param {!string} fullPath - path of the file to locate
     * @param {!string} method - name of the method to use for searching
     *       "findInViewList", "findInViewListAddedOrder" or "FindInViewListMRUOrder"
     *
     * @private
     */
    function _doFindInWorkingSet(paneId, fullPath, method) {
        var result = -1;
        _forEachPaneOrPanes(paneId, function (pane) {
            var index = pane[method].call(pane, fullPath);
            if (index >= 0) {
                result = index;
                return false;
            }
        });
        return result;
    }

    /**
     * Finds all instances of the specified file in all working sets.
     * If there is a temporary view of the file, it is not part of the result set
     * @param {!string} fullPath - path of the file to find views of
     * @return {Array.<{pane:string, index:number}>} an array of paneId/index records
     */
    function findInAllWorkingSets(fullPath) {
        var index,
            result = [];

        _.forEach(_panes, function (pane) {
            index = pane.findInViewList(fullPath);
            if (index >= 0) {
                result.push({paneId: pane.id, index: index});
            }
        });

        return result;
    }

    /**
     * Gets the index of the file matching fullPath in the workingset
     * @param {!string} paneId - id of the pane in which to search or ALL_PANES or ACTIVE_PANE
     * @param {!string} fullPath - full path of the file to search for
     * @return {number} index, -1 if not found.
     */
    function findInWorkingSet(paneId, fullPath) {
        return _doFindInWorkingSet(paneId, fullPath, "findInViewList");
    }

    /**
     * Gets the index of the file matching fullPath in the added order workingset
     * @param {!string} paneId - id of the pane in which to search or ALL_PANES or ACTIVE_PANE
     * @param {!string} fullPath - full path of the file to search for
     * @return {number} index, -1 if not found.
     */
    function findInWorkingSetByAddedOrder(paneId, fullPath) {
        return _doFindInWorkingSet(paneId, fullPath, "findInViewListAddedOrder");
    }

    /**
     * Gets the index of the file matching fullPath in the MRU order workingset
     * @param {!string} paneId - id of the pane in which to search or ALL_PANES or ACTIVE_PANE
     * @param {!string} fullPath - full path of the file to search for
     * @return {number} index, -1 if not found.
     */
    function findInWorkingSetByMRUOrder(paneId, fullPath) {
        return _doFindInWorkingSet(paneId, fullPath, "findInViewListMRUOrder");
    }

    /**
     * @private
     * Retrieves pane id where the specified file has been opened. Used to ensure that a file
     *  is open in only one pane so this will change once support for multiple views is added
     * The result includes panes with a temporary view of the file not just working set instances
     * @param {!string} fullPath - full path of the file to search for
     * @return {?string} pane id where the file has been opened or null if it wasn't found
     */
    function _getPaneIdForPath(fullPath) {
        // Search all working sets and pull off the first one
        var info = findInAllWorkingSets(fullPath).shift();

        // Look for a view that has not been added to a working set
        if (!info) {
            _.forEach(_panes, function (pane) {
                if (pane.getCurrentlyViewedPath() === fullPath) {
                    info = {paneId: pane.id};
                    return false;
                }
            });
        }

        if (!info) {
            return null;
        }

        return info.paneId;
    }

    /**
     * Adds the given file to the end of the workingset, if it is not already there.
     *  This API does not create a view of the file, it just adds it to the working set
     * Views of files in the working set are persisted and are not destroyed until the user
     *  closes the file using FILE_CLOSE; Views are created using FILE_OPEN and, when opened, are
     *  made the current view. If a File is already opened then the file is just made current
     *  and its view is shown.
     * @param {!string} paneId - The id of the pane in which to add the file object to or ACTIVE_PANE
     * @param {!File} file - The File object to add to the workingset
     * @param {number=} index - Position to add to list (defaults to last); -1 is ignored
     * @param {boolean=} forceRedraw - If true, a workingset change notification is always sent
     *    (useful if suppressRedraw was used with removeView() earlier)
     */
    function addToWorkingSet(paneId, file, index, force) {
        // look for the file to have already been added to another pane
        var pane = _getPane(paneId);
        if (!pane) {
            throw new Error("invalid pane id: " + paneId);
        }

        var result = pane.reorderItem(file, index, force),
            entry = _makeMRUListEntry(file, pane.id);


        // handles the case of save as so that the file remains in the
        //  the same location in the working set as the file that was renamed
        if (result === pane.ITEM_FOUND_NEEDS_SORT) {
            console.warn("pane.reorderItem returned pane.ITEM_FOUND_NEEDS_SORT which shouldn't happen " + file);
            exports.trigger("workingSetSort", pane.id);
        } else if (result === pane.ITEM_NOT_FOUND) {
            index = pane.addToViewList(file, index);

            if (_findFileInMRUList(pane.id, file) === -1) {
                // Add to or update the position in MRU
                if (pane.getCurrentlyViewedFile() === file) {
                    _mruList.unshift(entry);
                } else {
                    _mruList.push(entry);
                }
            }

            exports.trigger("workingSetAdd", file, index, pane.id);
        }
    }

    /**
     * Adds the given file list to the end of the workingset.
     * @param {!string} paneId - The id of the pane in which to add the file object to or ACTIVE_PANE
     * @param {!Array.<File>} fileList - Array of files to add to the pane
     */
    function addListToWorkingSet(paneId, fileList) {
        var uniqueFileList,
            pane = _getPane(paneId);

        uniqueFileList = pane.addListToViewList(fileList);

        uniqueFileList.forEach(function (file) {
            if (_findFileInMRUList(pane.id, file) !== -1) {
                console.log(file.fullPath + " duplicated in mru list");
            }
            _mruList.push(_makeMRUListEntry(file, pane.id));
        });

        exports.trigger("workingSetAddList", uniqueFileList, pane.id);

        //  find all of the files that could be added but were not
        var unsolvedList = fileList.filter(function (item) {
            // if the file open in another pane, then add it to the list of unsolvedList
            return (pane.findInViewList(item.fullPath) === -1 && _getPaneIdForPath(item.fullPath));
        });

        // Use the pane id of the first one in the list for pane id and recurse
        //  if we add more panes, then this will recurse until all items in the list are satisified
        if (unsolvedList.length) {
            addListToWorkingSet(_getPaneIdForPath(unsolvedList[0].fullPath), unsolvedList);
        }
    }

    /**
     * Removes a file from the global MRU list. Future versions of this
     *  implementation may support the ALL_PANES constant but FOCUS_PANE is not allowed
     * @param {!string} paneId - Must be a valid paneId (not a shortcut e.g. ALL_PANES)
     @ @param {File} file The file object to remove.
     * @private
     */
    function _removeFileFromMRU(paneId, file) {
        var index,
            compare = function (record) {
                return (record.file === file && record.paneId === paneId);
            };

        // find and remove all instances
        do {
            index = _.findIndex(_mruList, compare);
            if (index !== -1) {
                _mruList.splice(index, 1);
            }
        } while (index !== -1);
    }

    /**
     * Removes a file the specified pane
     * @param {!string} paneId - Must be a valid paneId (not a shortcut e.g. ALL_PANES)
     * @param {!File} file - the File to remove
     * @param {boolean=} suppressRedraw - true to tell listeners not to redraw
     *          Use the suppressRedraw flag when calling this function along with many changes to prevent flicker
     * @private
     */
    function _removeView(paneId, file, suppressRedraw) {
        var pane = _getPane(paneId);

        if (pane.removeView(file)) {
            _removeFileFromMRU(pane.id, file);
            exports.trigger("workingSetRemove", file, suppressRedraw, pane.id);
        }
    }

    /**
     * moves a view from one pane to another
     * @param {!string} sourcePaneId - id of the source pane
     * @param {!string} destinationPaneId - id of the destination pane
     * @param {!File} file - the File to move
     * @param {Number} destinationIndex - the working set index of the file in the destination pane
     * @return {jQuery.Promise} a promise that resolves when the move has completed.
     * @private
     */
    function _moveView(sourcePaneId, destinationPaneId, file, destinationIndex) {
        var result = new $.Deferred(),
            sourcePane = _getPane(sourcePaneId),
            destinationPane = _getPane(destinationPaneId);

        sourcePane.moveView(file, destinationPane, destinationIndex)
            .done(function () {
                // remove existing entry from mrulist for the same document if present 
                _removeFileFromMRU(destinationPane.id, file);
                // update the mru list
                _mruList.every(function (record) {
                    if (record.file === file && record.paneId === sourcePane.id) {
                        record.paneId = destinationPane.id;
                        return false;
                    }
                    return true;
                });
                exports.trigger("workingSetMove", file, sourcePane.id, destinationPane.id);
                result.resolve();
            });

        return result.promise();
    }

    /**
     * DocumentManager.pathDeleted Event handler to remove a file
     * from the MRU list
     * @param {!jQuery.event} e -
     * @param {!string} fullPath - path of the file to remove
     * @private
     */
    function _removeDeletedFileFromMRU(e, fullPath) {
        var index,
            compare = function (record) {
                return (record.file.fullPath === fullPath);
            };

        // find and remove all instances
        do {
            index = _.findIndex(_mruList, compare);
            if (index !== -1) {
                _mruList.splice(index, 1);
            }
        } while (index !== -1);
    }

    /**
     * sorts the pane's view list
     * @param {!string} paneId - id of the pane to sort, ALL_PANES or ACTIVE_PANE
     * @param {sortFunctionCallback} compareFn - callback to determine sort order (called on each item)
     * @see {@link Pane#sortViewList} for more information
     * @see {@link https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort|Sort Array - MDN}
     * @private
     */
    function _sortWorkingSet(paneId, compareFn) {
        _forEachPaneOrPanes(paneId, function (pane) {
            pane.sortViewList(compareFn);
            exports.trigger("workingSetSort", pane.id);
        });
    }

    /**
     * moves a working set item from one index to another shifting the items
     * after in the working set up and reinserting it at the desired location
     * @param {!string} paneId - id of the pane to sort
     * @param {!number} fromIndex - the index of the item to move
     * @param {!number} toIndex - the index to move to
     * @private
     */
    function _moveWorkingSetItem(paneId, fromIndex, toIndex) {
        var pane = _getPane(paneId);

        pane.moveWorkingSetItem(fromIndex, toIndex);
        exports.trigger("workingSetSort", pane.id);
        exports.trigger("_workingSetDisableAutoSort", pane.id);
    }

    /**
     * Mutually exchanges the files at the indexes passed by parameters.
     * @param {!string} paneId - id of the pane to swap indices or ACTIVE_PANE
     * @param {!number} index1 - the index on the left
     * @param {!number} index2 - the index on the rigth
     * @private
     */
    function _swapWorkingSetListIndexes(paneId, index1, index2) {
        var pane = _getPane(paneId);

        pane.swapViewListIndexes(index1, index2);
        exports.trigger("workingSetSort", pane.id);
        exports.trigger("_workingSetDisableAutoSort", pane.id);
    }

    /**
     * Get the next or previous file in the MRU list.
     * @param {!number} direction - Must be 1 or -1 to traverse forward or backward
     * @return {?{file:File, paneId:string}} The File object of the next item in the traversal order or null if there aren't any files to traverse.
     *                                       May return current file if there are no other files to traverse.
     */
    function traverseToNextViewByMRU(direction) {
        var file = getCurrentlyViewedFile(),
            paneId = getActivePaneId(),
            index = _.findIndex(_mruList, function (record) {
                return (record.file === file && record.paneId === paneId);
            });

        return ViewUtils.traverseViewArray(_mruList, index, direction);
    }

    /**
     * Get the next or previous file in list order.
     * @param {!number} direction - Must be 1 or -1 to traverse forward or backward
     * @return {?{file:File, paneId:string}} The File object of the next item in the traversal order or null if there aren't any files to traverse.
     *                                       May return current file if there are no other files to traverse.
     */
    function traverseToNextViewInListOrder(direction) {
        var file = getCurrentlyViewedFile(),
            curPaneId = getActivePaneId(),
            allFiles = [],
            index;

        getPaneIdList().forEach(function (paneId) {
            var paneFiles = getWorkingSet(paneId).map(function (file) {
                return { file: file, pane: paneId };
            });
            allFiles = allFiles.concat(paneFiles);
        });

        index = _.findIndex(allFiles, function (record) {
            return (record.file === file && record.pane === curPaneId);
        });

        return ViewUtils.traverseViewArray(allFiles, index, direction);
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
        var pane = _getPane(ACTIVE_PANE);

        if (_traversingFileList) {
            _traversingFileList = false;

            _makeFileMostRecent(pane.id, pane.getCurrentlyViewedFile());
        }
    }

    /**
     * Synchronizes the pane's sizer element, updates the pane's resizer maxsize value
     *   and tells the pane to update its layout
     * @param {boolean} forceRefresh - true to force a resize and refresh of the entire view
     * @private
     */
    function _synchronizePaneSize(pane, forceRefresh) {
        var available;

        if (_orientation === VERTICAL) {
            available = _$el.innerWidth();
        } else {
            available = _$el.innerHeight();
        }

        // Update the pane's sizer element if it has one and update the max size
        Resizer.resyncSizer(pane.$el);
        pane.$el.data("maxsize", available - MIN_PANE_SIZE);
        pane.updateLayout(forceRefresh);
    }


    /**
     * Event handler for "workspaceUpdateLayout" to update the layout
     * @param {jQuery.Event} event - jQuery event object
     * @param {number} viewAreaHeight - unused
     * @param {boolean} forceRefresh - true to force a resize and refresh of the entire view
     * @private
     */
    function _updateLayout(event, viewAreaHeight, forceRefresh) {
        var available;

        if (_orientation === VERTICAL) {
            available = _$el.innerWidth();
        } else {
            available = _$el.innerHeight();
        }

        _.forEach(_panes, function (pane) {
            // For VERTICAL orientation, we set the second pane to be width: auto
            //  so that it resizes to fill the available space in the containing div
            // unfortunately, that doesn't work in the HORIZONTAL orientation so we
            //  must update the height and convert it into a percentage
            if (pane.id === SECOND_PANE && _orientation === HORIZONTAL) {
                var percentage = ((_panes[FIRST_PANE].$el.height() + 1) / available);
                pane.$el.css("height", 100 - (percentage * 100) + "%");
            }

            _synchronizePaneSize(pane, forceRefresh);
        });
    }

    /**
     * Sets up the initial layout so panes are evenly distributed
     * This also sets css properties that aid in the layout when _updateLayout is called
     * @param {boolean} forceRefresh - true to force a resize and refresh of the entire view
     * @private
     */
    function _initialLayout(forceRefresh) {
        var panes = Object.keys(_panes),
            size = 100 / panes.length;

        _.forEach(_panes, function (pane) {
            if (pane.id === FIRST_PANE) {
                if (_orientation === VERTICAL) {
                    pane.$el.css({height: "100%",
                                  width: size + "%",
                                  float: "left"
                                 });
                } else {
                    pane.$el.css({ height: size + "%",
                                   width: "100%"
                                 });
                }
            } else {
                if (_orientation === VERTICAL) {
                    pane.$el.css({  height: "100%",
                                    width: "auto",
                                    float: "none"
                                 });
                } else {
                    pane.$el.css({ width: "100%",
                                   height: "50%"
                                 });
                }
            }

            _synchronizePaneSize(pane, forceRefresh);
        });
    }

    /**
     * Updates the header text for all panes
     */
    function _updatePaneHeaders() {
        _forEachPaneOrPanes(ALL_PANES, function (pane) {
            pane.updateHeaderText();
        });

    }

    /**
     * Creates a pane for paneId if one doesn't already exist
     * @param {!string} paneId - id of the pane to create
     * @private
     * @return {?Pane} - the pane object of the new pane, or undefined if no pane created
     */
    function _createPaneIfNecessary(paneId) {
        var newPane;

        if (!_panes.hasOwnProperty(paneId)) {
            newPane = new Pane(paneId, _$el);
            _panes[paneId] = newPane;

            exports.trigger("paneCreate", newPane.id);

            newPane.$el.on("click.mainview dragover.mainview", function () {
                setActivePaneId(newPane.id);
            });

            newPane.on("viewListChange.mainview", function () {
                _updatePaneHeaders();
                exports.trigger("workingSetUpdate", newPane.id);
            });
            newPane.on("currentViewChange.mainview", function (e, newView, oldView) {
                _updatePaneHeaders();
                if (_activePaneId === newPane.id) {
                    exports.trigger("currentFileChange",
                                               newView && newView.getFile(),
                                               newPane.id, oldView && oldView.getFile(),
                                               newPane.id);
                }
            });
            newPane.on("viewDestroy.mainView", function (e, view) {
                _removeFileFromMRU(newPane.id, view.getFile());
            });
        }

        return newPane;
    }

    /**
     * Makes the first pane resizable
     * @private
     */
    function _makeFirstPaneResizable() {
        var firstPane = _panes[FIRST_PANE];
        Resizer.makeResizable(firstPane.$el,
                              _orientation === HORIZONTAL ? Resizer.DIRECTION_VERTICAL : Resizer.DIRECTION_HORIZONTAL,
                              _orientation === HORIZONTAL ? Resizer.POSITION_BOTTOM : Resizer.POSITION_RIGHT,
                              MIN_PANE_SIZE, false, false, false, true, true);

        firstPane.$el.on("panelResizeUpdate", function () {
            _updateLayout();
        });
    }


    /**
     * Creates a split for the specified orientation
     * @private
     * @param {!string} orientation (VERTICAL|HORIZONTAL)
     */
    function _doSplit(orientation) {
        var firstPane, newPane;

        if (orientation === _orientation) {
            return;
        }

        firstPane = _panes[FIRST_PANE];
        Resizer.removeSizable(firstPane.$el);

        if (_orientation) {
            _$el.removeClass("split-" + _orientation.toLowerCase());
        }
        _$el.addClass("split-" + orientation.toLowerCase());

        _orientation = orientation;
        newPane = _createPaneIfNecessary(SECOND_PANE);
        _makeFirstPaneResizable();

        // reset the layout to 50/50 split
        // if we changed orientation then
        //  the percentages are reset as well
        _initialLayout();

        exports.trigger("paneLayoutChange", _orientation);

        // if new pane was created, and original pane is not empty, make new pane the active pane
        if (newPane && getCurrentlyViewedFile(firstPane.id)) {
            setActivePaneId(newPane.id);
        }
    }

    /**
     * Edits a document in the specified pane.
     * This function is only used by:
     *  - Unit Tests (which construct Mock Document objects),
     *  - by File > New  because there is yet to be an established File object
     *  - by Find In Files which needs to open documents synchronously in some cases
     * Do not use this API it is for internal use only
     * @param {!string} paneId - id of the pane in which to open the document
     * @param {!Document} doc - document to edit
     * @param {{noPaneActivate:boolean=}=} optionsIn - options
     * @private
     */
    function _edit(paneId, doc, optionsIn) {
        var options = optionsIn || {};

        var pane = _getPane(paneId);

        // If file is untitled or otherwise not within project tree, add it to
        // working set right now (don't wait for it to become dirty)
        if (doc.isUntitled() || !ProjectManager.isWithinProject(doc.file.fullPath)) {
            addToWorkingSet(paneId, doc.file);
        }

        // open document will show the editor if there is one already
        EditorManager.openDocument(doc, pane, options);
        _makeFileMostRecent(paneId, doc.file);

        if (!options.noPaneActivate) {
            setActivePaneId(paneId);
        }
    }

    /**
     * Opens a file in the specified pane this can be used to open a file with a custom viewer
     * or a document for editing.  If it's a document for editing, edit is called on the document
     * @param {!string} paneId - id of the pane in which to open the document
     * @param {!File} file - file to open
     * @param {{noPaneActivate:boolean=}=} optionsIn - options
     * @return {jQuery.Promise}  promise that resolves to a File object or
     *                           rejects with a File error or string
     */
    function _open(paneId, file, optionsIn) {
        var result = new $.Deferred(),
            options = optionsIn || {};

        function doPostOpenActivation() {
            if (!options.noPaneActivate) {
                setActivePaneId(paneId);
            }
        }

        if (!file || !_getPane(paneId)) {
            return result.reject("bad argument").promise();
        }


        // See if there is already a view for the file
        var pane = _getPane(paneId);

        // See if there is a factory to create a view for this file
        //  we want to do this first because, we don't want our internal
        //  editor to edit files for which there are suitable viewfactories
        var factory = MainViewFactory.findSuitableFactoryForPath(file.fullPath);

        if (factory) {
            file.exists(function (fileError, fileExists) {
                if (fileExists) {
                    // let the factory open the file and create a view for it
                    factory.openFile(file, pane)
                        .done(function () {
                            // if we opened a file that isn't in the project
                            //  then add the file to the working set
                            if (!ProjectManager.isWithinProject(file.fullPath)) {
                                addToWorkingSet(paneId, file);
                            }
                            doPostOpenActivation();
                            result.resolve(file);
                        })
                        .fail(function (fileError) {
                            result.reject(fileError);
                        });
                } else {
                    result.reject(fileError || FileSystemError.NOT_FOUND);
                }
            });
        } else {
            DocumentManager.getDocumentForPath(file.fullPath)
                .done(function (doc) {
                    _edit(paneId, doc, $.extend({}, options, {
                        noPaneActivate: true
                    }));
                    doPostOpenActivation();
                    result.resolve(doc.file);
                })
                .fail(function (fileError) {
                    result.reject(fileError);
                });
        }

        result.done(function () {
            _makeFileMostRecent(paneId, file);
        });

        return result;
    }

    /**
     * Merges second pane into first pane and opens the current file
     * @private
     */
    function _mergePanes() {
        if (_panes.hasOwnProperty(SECOND_PANE)) {

            var firstPane = _panes[FIRST_PANE],
                secondPane = _panes[SECOND_PANE],
                fileList = secondPane.getViewList(),
                lastViewed = getCurrentlyViewedFile();

            Resizer.removeSizable(firstPane.$el);
            firstPane.mergeFrom(secondPane);

            exports.trigger("workingSetRemoveList", fileList, secondPane.id);

            setActivePaneId(firstPane.id);

            secondPane.$el.off(".mainview");
            secondPane.off(".mainview");

            secondPane.destroy();
            delete _panes[SECOND_PANE];
            exports.trigger("paneDestroy", secondPane.id);
            exports.trigger("workingSetAddList", fileList, firstPane.id);

            _mruList.forEach(function (record) {
                if (record.paneId === secondPane.id) {
                    record.paneId = firstPane.id;
                }
            });

            _$el.removeClass("split-" + _orientation.toLowerCase());
            _orientation = null;
            // this will set the remaining pane to 100%
            _initialLayout();

            exports.trigger("paneLayoutChange", _orientation);

            // if the current view before the merger was in the pane
            //  that went away then reopen it so that it's now the current view again
            if (lastViewed && getCurrentlyViewedFile() !== lastViewed) {
                exports._open(firstPane.id, lastViewed);
            }
        }
    }

    /**
     * Closes a file in the specified pane or panes
     * @param {!string} paneId - id of the pane in which to open the document
     * @param {!File} file - file to close
     * @param {Object={noOpenNextFile:boolean}} optionsIn - options
     * This function does not fail if the file is not open
     */
    function _close(paneId, file, optionsIn) {
        var options = optionsIn || {};
        _forEachPaneOrPanes(paneId, function (pane) {
            if (pane.removeView(file, options.noOpenNextFile) && (paneId === ACTIVE_PANE || pane.id === paneId)) {
                _removeFileFromMRU(pane.id, file);
                exports.trigger("workingSetRemove", file, false, pane.id);
                return false;
            }
        });
    }

    /**
     * Closes a list of file in the specified pane or panes
     * @param {!string} paneId - id of the pane in which to open the document
     * @param {!Array.<File>} fileList - files to close
     * This function does not fail if the file is not open
     */
    function _closeList(paneId, fileList) {
        _forEachPaneOrPanes(paneId, function (pane) {
            var closedList = pane.removeViews(fileList);
            closedList.forEach(function (file) {
                _removeFileFromMRU(pane.id, file);
            });

            exports.trigger("workingSetRemoveList", closedList, pane.id);
        });
    }

    /**
     * Closes all files in the specified pane or panes
     * @param {!string} paneId - id of the pane in which to open the document
     * This function does not fail if the file is not open
     */
    function _closeAll(paneId) {
        _forEachPaneOrPanes(paneId, function (pane) {
            var closedList = pane.getViewList();
            closedList.forEach(function (file) {
                _removeFileFromMRU(pane.id, file);
            });

            pane._reset();
            exports.trigger("workingSetRemoveList", closedList, pane.id);
        });
    }


    /**
     * Finds which pane a document belongs to
     * @param {!Document} document - the document to locate
     * @return {?Pane} the pane where the document lives or NULL if it isn't in a pane
     * @private
     */
    function _findPaneForDocument(document) {
        // First check for an editor view of the document
        var pane = _getPaneFromElement($(document._masterEditor.$el.parent().parent()));

        if (!pane) {
            // No view of the document, it may be in a working set and not yet opened
            var info = findInAllWorkingSets(document.file.fullPath).shift();
            if (info) {
                pane = _panes[info.paneId];
            }
        }

        return pane;
    }

    /**
     * Destroys an editor object if a document is no longer referenced
     * @param {!Document} doc - document to destroy
     */
    function _destroyEditorIfNotNeeded(document) {
        if (!(document instanceof DocumentManager.Document)) {
            throw new Error("_destroyEditorIfUnneeded() should be passed a Document");
        }
        if (document._masterEditor) {
            // findPaneForDocument tries to locate the pane in which the document
            //  is either opened or will be opened (in the event that the document is
            //  in a working set but has yet to be opened) and then asks the pane
            //  to destroy the view if it doesn't need it anymore
            var pane = _findPaneForDocument(document);

            if (pane) {
                // let the pane deceide if it wants to destroy the view if it's no needed
                pane.destroyViewIfNotNeeded(document._masterEditor);
            } else {
                // in this case, the document isn't referenced at all so just destroy it
                document._masterEditor.destroy();
            }
        }
    }


    /**
     * Loads the workingset state
     * @private
     */
    function _loadViewState(e) {
        // file root is appended for each project
        var panes,
            promises = [],
            context = { location : { scope: "user",
                                     layer: "project" } },
            state = PreferencesManager.getViewState(PREFS_NAME, context);

        function convertViewState() {
            var context = { location : { scope: "user",
                                         layer: "project" } },
                files = PreferencesManager.getViewState(OLD_PREFS_NAME, context);

            if (!files) {
                // nothing to convert
                return;
            }

            var result = {
                orientation: null,
                activePaneId: FIRST_PANE,
                panes: {
                    "first-pane": []
                }
            };

            // Add all files to the workingset without verifying that
            // they still exist on disk (for faster project switching)
            files.forEach(function (value) {
                result.panes[FIRST_PANE].push(value);
            });

            return result;
        }

        if (!state) {
            // not converted yet
            state = convertViewState();
        }

        // reset
        _mergePanes();
        _mruList = [];
        ViewStateManager.reset();

        if (state) {

            panes = Object.keys(state.panes);
            _orientation = (panes.length > 1) ? state.orientation : null;

            _.forEach(state.panes, function (paneState, paneId) {
                _createPaneIfNecessary(paneId);
                promises.push(_panes[paneId].loadState(paneState));
            });

            AsyncUtils.waitForAll(promises).then(function (opensList) {

                // this will set the default layout of 50/50 or 100
                //  based on the number of panes
                _initialLayout();

                // More than 1 pane, then make it resizable
                //  and layout the panes from serialized state
                if (panes.length > 1) {
                    _makeFirstPaneResizable();

                    // If the split state was serialized correctly
                    //  then setup the splits according to was serialized
                    // Avoid a zero and negative split percentages
                    if ($.isNumeric(state.splitPercentage) && state.splitPercentage > 0) {
                        var prop;
                        if (_orientation === VERTICAL) {
                            prop = "width";
                        } else {
                            prop = "height";
                        }

                        _panes[FIRST_PANE].$el.css(prop, state.splitPercentage * 100 + "%");
                        _updateLayout();
                    }
                }

                if (_orientation) {
                    _$el.addClass("split-" + _orientation.toLowerCase());
                    exports.trigger("paneLayoutChange", _orientation);
                }

                _.forEach(_panes, function (pane) {
                    var fileList = pane.getViewList();

                    fileList.forEach(function (file) {
                        if (_findFileInMRUList(pane.id, file) !== -1) {
                            console.log(file.fullPath + " duplicated in mru list");
                        }
                        _mruList.push(_makeMRUListEntry(file, pane.id));
                    });
                    exports.trigger("workingSetAddList", fileList, pane.id);
                });

                promises = [];

                opensList.forEach(function (openData) {
                    if (openData) {
                        promises.push(CommandManager.execute(Commands.FILE_OPEN, openData));
                    }
                });

                // finally set the active pane
                AsyncUtils.waitForAll(promises).then(function () {
                    setActivePaneId(state.activePaneId);
                });
            });
        }
    }

    /**
     * Saves the workingset state
     * @private
     */
    function _saveViewState() {
        function _computeSplitPercentage() {
            var available,
                used;

            if (getPaneCount() === 1) {
                // just short-circuit here and
                //  return 100% to avoid any rounding issues
                return 1;
            } else {
                if (_orientation === VERTICAL) {
                    available = _$el.innerWidth();
                    used = _panes[FIRST_PANE].$el.width();
                } else {
                    available = _$el.innerHeight();
                    used = _panes[FIRST_PANE].$el.height();
                }

                return used / available;
            }
        }

        var projectRoot     = ProjectManager.getProjectRoot(),
            context         = { location : { scope: "user",
                                         layer: "project",
                                         layerID: projectRoot.fullPath } },

            state = {
                orientation: _orientation,
                activePaneId: getActivePaneId(),
                splitPercentage: _computeSplitPercentage(),
                panes: {
                }
            };


        if (!projectRoot) {
            return;
        }

        _.forEach(_panes, function (pane) {
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
        if (_activePaneId) {
            throw new Error("MainViewManager has already been initialized");
        }

        _$el = $container;
        _createPaneIfNecessary(FIRST_PANE);
        _activePaneId = FIRST_PANE;
        // One-time init so the pane has the "active" appearance
        _panes[FIRST_PANE]._handleActivePaneChange(undefined, _activePaneId);
        _initialLayout();

        // This ensures that unit tests that use this function
        //  get an event handler for workspace events and we don't listen
        //  to the event before we've been initialized
        WorkspaceManager.on("workspaceUpdateLayout", _updateLayout);
    }

    /**
     * Changes the layout scheme
     * @param {!number} rows (may be 1 or 2)
     * @param {!number} columns (may be 1 or 2)
     * @summay Rows or Columns may be 1 or 2 but both cannot be 2. 1x2, 2x1 or 1x1 are the legal values
     */
    function setLayoutScheme(rows, columns) {
        if ((rows < 1) || (rows > 2) || (columns < 1) || (columns > 2) || (columns === 2 && rows === 2)) {
            console.error("setLayoutScheme unsupported layout " + rows + ", " + columns);
            return false;
        }

        if (rows === columns) {
            _mergePanes();
        } else if (rows > columns) {
            _doSplit(HORIZONTAL);
        } else {
            _doSplit(VERTICAL);
        }
        return true;
    }

    /**
     * Retrieves the current layout scheme
     * @return {!{rows: number, columns: number>}}
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
     * Setup a ready event to initialize ourself
     */
    AppInit.htmlReady(function () {
        _initialize($("#editor-holder"));
    });

    // Event handlers - not safe to call on() directly, due to circular dependencies
    EventDispatcher.on_duringInit(ProjectManager, "projectOpen",                       _loadViewState);
    EventDispatcher.on_duringInit(ProjectManager, "beforeProjectClose beforeAppClose", _saveViewState);
    EventDispatcher.on_duringInit(EditorManager, "activeEditorChange",                 _activeEditorChange);
    EventDispatcher.on_duringInit(DocumentManager, "pathDeleted",                      _removeDeletedFileFromMRU);


    EventDispatcher.makeEventDispatcher(exports);

    // Unit Test Helpers
    exports._initialize                   = _initialize;
    exports._getPane                      = _getPane;

    // Private Helpers
    exports._removeView                   = _removeView;
    exports._moveView                     = _moveView;

    // Private API
    exports._sortWorkingSet               = _sortWorkingSet;
    exports._moveWorkingSetItem           = _moveWorkingSetItem;
    exports._swapWorkingSetListIndexes    = _swapWorkingSetListIndexes;
    exports._destroyEditorIfNotNeeded     = _destroyEditorIfNotNeeded;
    exports._edit                         = _edit;
    exports._open                         = _open;
    exports._close                        = _close;
    exports._closeAll                     = _closeAll;
    exports._closeList                    = _closeList;
    exports._getPaneIdForPath             = _getPaneIdForPath;

    // WorkingSet Management
    exports.addToWorkingSet               = addToWorkingSet;
    exports.addListToWorkingSet           = addListToWorkingSet;
    exports.getWorkingSetSize             = getWorkingSetSize;
    exports.getWorkingSet                 = getWorkingSet;

    // Pane state
    exports.cacheScrollState              = cacheScrollState;
    exports.restoreAdjustedScrollState    = restoreAdjustedScrollState;

    // Searching
    exports.findInWorkingSet              = findInWorkingSet;
    exports.findInWorkingSetByAddedOrder  = findInWorkingSetByAddedOrder;
    exports.findInWorkingSetByMRUOrder    = findInWorkingSetByMRUOrder;
    exports.findInAllWorkingSets          = findInAllWorkingSets;

    // Traversal
    exports.beginTraversal                = beginTraversal;
    exports.endTraversal                  = endTraversal;
    exports.traverseToNextViewByMRU       = traverseToNextViewByMRU;
    exports.traverseToNextViewInListOrder = traverseToNextViewInListOrder;

    // PaneView Attributes
    exports.getActivePaneId               = getActivePaneId;
    exports.setActivePaneId               = setActivePaneId;
    exports.getPaneIdList                 = getPaneIdList;
    exports.getPaneTitle                  = getPaneTitle;
    exports.getPaneCount                  = getPaneCount;
    exports.isExclusiveToPane             = isExclusiveToPane;

    exports.getAllOpenFiles               = getAllOpenFiles;
    exports.focusActivePane               = focusActivePane;

    // Layout
    exports.setLayoutScheme               = setLayoutScheme;
    exports.getLayoutScheme               = getLayoutScheme;

    // Convenience
    exports.getCurrentlyViewedFile        = getCurrentlyViewedFile;
    exports.getCurrentlyViewedPath        = getCurrentlyViewedPath;

    // Constants
    exports.ALL_PANES                     = ALL_PANES;
    exports.ACTIVE_PANE                   = ACTIVE_PANE;
    exports.FIRST_PANE                    = FIRST_PANE;
    exports.SECOND_PANE                   = SECOND_PANE;
});
