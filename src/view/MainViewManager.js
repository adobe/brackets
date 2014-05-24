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
        WorkspaceManager    = require("view/WorkspaceManager"),
        EditorManager       = require("editor/EditorManager"),
        CommandManager      = require("command/CommandManager"),
//        DocumentManager     = require("document/DocumentManager"),
        Commands            = require("command/Commands"),
        Strings             = require("strings");
    
    var ALL_PANES           = "ALL_PANES",
        FOCUSED_PANE        = "FOCUSED_PANE";
    
    /**
     * @private
     * @see DocumentManager.getCurrentDocument()
     */
    var _currentDocument = null;
        
    
    /**
     * @private
     * @type {Array.<File>}
     * @see DocumentManager.getWorkingSet()
     */
    var _paneViewList = [];
    
    /**
     * @private
     * Contains the same set of items as _paneViewList, but ordered by how recently they were _currentDocument (0 = most recent).
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
     * Returns a list of items in the working set in UI list order. May be 0-length, but never null.
     *
     * When a file is added this list, DocumentManager dispatches a "paneViewListAdd" event.
     * When a file is removed from list, DocumentManager dispatches a "paneViewListRemove" event.
     * To listen for ALL changes to this list, you must listen for both events.
     *
     * Which items belong in the working set is managed entirely by DocumentManager. Callers cannot
     * (yet) change this collection on their own.
     *
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
    
    function _setCurrentDocument(doc) {
        _currentDocument = doc;
    }
    
    function _reset(paneId) {
        _paneViewList = [];
        _paneViewListMRUOrder = [];
        _paneViewListAddedOrder = [];
    }
    
    /**
     * Returns the index of the file matching fullPath in the working set.
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
    
    function findInPaneViewListAddedOrder(paneId, fullPath) {
        return _.findIndex(_paneViewListAddedOrder, function (file, i) {
            return file.fullPath === fullPath;
        });
    }
    
    function findInPaneViewListMRUOrder(paneId, fullPath) {
        return _.findIndex(_paneViewListMRUOrder, function (file, i) {
            return file.fullPath === fullPath;
        });
    }
    
    function _onWorkspaceAreaResize(event, editorAreaHt, refreshFlag) {
        
    }
    
    
    function _canOpenFile(file) {
        return !EditorManager.getCustomViewerForPath(file.fullPath);
    }
    
    $(WorkspaceManager).on("workspaceAreaResize",  _onWorkspaceAreaResize);
    
    /* 
     * Public API
     */
    
    /**
     * Adds the given file to the end of the working set list, if it is not already in the list
     * and it does not have a custom viewer.
     * Does not change which document is currently open in the editor. Completes synchronously.
     * @param {!string} paneId
     * @param {!File} file
     * @param {number=} index  Position to add to list (defaults to last); -1 is ignored
     * @param {boolean=} forceRedraw  If true, a working set change notification is always sent
     *    (useful if suppressRedraw was used with removeFromWorkingSet() earlier)
     */
    function addToPaneViewList(paneId, file, index, forceRedraw) {
        var indexRequested = (index !== undefined && index !== null && index !== -1);
        
        // If the file has a custom viewer, then don't add it to the working set.
        if (!_canOpenFile(file)) {
            return;
        }
            
        // If doc is already in working set, don't add it again
        var curIndex = findInPaneViewList(paneId, file.fullPath);
        if (curIndex !== -1) {
            // File is in working set, but not at the specifically requested index - only need to reorder
            if (forceRedraw || (indexRequested && curIndex !== index)) {
                var entry = _paneViewList.splice(curIndex, 1)[0];
                _paneViewList.splice(index, 0, entry);
                $(exports).triggerHandler("paneViewListSort");
            }
            return;
        }

        if (!indexRequested) {
            // If no index is specified, just add the file to the end of the working set.
            _paneViewList.push(file);
        } else {
            // If specified, insert into the working set list at this 0-based index
            _paneViewList.splice(index, 0, file);
        }
        
        // Add to MRU order: either first or last, depending on whether it's already the current doc or not
        var currentDocument = _currentDocument;//DocumentManager.getCurrentDocument();
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
     * Adds the given file list to the end of the working set list.
     * If a file in the list has its own custom viewer, then it 
     * is not added into the working set.
     * Does not change which document is currently open in the editor.
     * More efficient than calling addToWorkingSet() (in a loop) for
     * a list of files because there's only 1 redraw at the end
     * @param {!Array.<File>} fileList
     */
    function addListToPaneViewList(paneId, fileList) {
        var uniqueFileList = [];

        // Process only files not already in working set
        fileList.forEach(function (file, index) {
            // If doc has a custom viewer, then don't add it to the working set.
            // Or if doc is already in working set, don't add it again.
            if (_canOpenFile(file) && findInPaneViewList(paneId, file.fullPath) === -1) {
                uniqueFileList.push(file);

                // Add
                _paneViewList.push(file);

                // Add to MRU order: either first or last, depending on whether it's already the current doc or not
                if (_currentDocument && _currentDocument.file.fullPath === file.fullPath) {
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
     * Removes the given file from the working set list, if it was in the list. Does not change
     * the current editor even if it's for this file. Does not prompt for unsaved changes.
     * @param {!File} file
     * @param {boolean=} true to suppress redraw after removal
     */
    function removeFromPaneViewList(paneId, file, suppressRedraw) {
        // If doc isn't in working set, do nothing
        var index = findInPaneViewList(paneId, file.fullPath);
        if (index === -1) {
            return;
        }
        
        // Remove
        _paneViewList.splice(index, 1);
        _paneViewListMRUOrder.splice(findInPaneViewListMRUOrder(paneId, file.fullPath), 1);
        _paneViewListAddedOrder.splice(findInPaneViewListAddedOrder(paneId, file.fullPath), 1);
        
        // Dispatch event
        $(exports).triggerHandler("paneViewListRemove", [file, suppressRedraw]);
    }
    
    
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
        
        $(exports).triggerHandler("paneViewListRemoveList", [fileList]);
    }
    
    /**
     * Removes all files from the working set list.
     */
    function removeAllFromPaneViewList(paneId) {
        var fileList = getPaneViewList(paneId);

        _reset(paneId);
        
        // Dispatch event
        $(exports).triggerHandler("paneViewListRemoveList", [fileList]);
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
        
    
    // Refactoring exports...
    exports._getPaneViewList        = _getPaneViewList;
    exports._getPaneViewListMRU     = _getPaneViewListMRU;
    exports._getPaneViewListAdded   = _getPaneViewListAdded;

    // Scaffolding
    exports._setCurrentDocument = _setCurrentDocument;
    
    // API Exports
    exports.addToPaneViewList                = addToPaneViewList;
    exports.addListToPaneViewList            = addListToPaneViewList;
    exports.findInPaneViewList               = findInPaneViewList;
    exports.findInPaneViewListAddedOrder     = findInPaneViewListAddedOrder;
    exports.findInPaneViewListMRUOrder       = findInPaneViewListMRUOrder;
    exports.getPaneViewList                  = getPaneViewList;
    exports.removeAllFromPaneViewList        = removeAllFromPaneViewList;
    exports.removeFromPaneViewList           = removeFromPaneViewList;
    exports.removeListFromPaneViewList       = removeListFromPaneViewList;
    exports.sortPaneViewList                 = sortPaneViewList;
    
    // Constants
    exports.ALL_PANES                    = ALL_PANES;
    exports.FOCUSED_PANE                 = FOCUSED_PANE;
});
