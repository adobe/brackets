/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, window, Mustache */

define(function (require, exports, module) {
    "use strict";
        
    var _                   = require("thirdparty/lodash"),
        FileSystem          = require("filesystem/FileSystem"),
        File                = require("filesystem/File"),
        InMemoryFile        = require("document/InMemoryFile"),
        EditorManager       = require("editor/EditorManager"),
        MainViewManager     = require("view/MainViewManager"),
        DocumentManager     = require("document/DocumentManager"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        paneTemplate        = require("text!htmlContent/pane.html");
    
    /*
     * View of a Pane 
     *
     * Pane View Objects are constructed by the MainViewManager object when a Pane view is needed
     * See MainViewManager for more information
     *
     * @constructor
     * @param {!string} The id to use to identify this pane
     * @param {!JQuery} The parent $container to place the pane view
     */
    function Pane(id, $container) {
        this._id = id;
        // Make sure that all properties
        //  are copied from the prototype into "this" otherwise
        //  some of the lodash functions don't work right
        this._reset();
        
        // Setup the container and the element we're inserting
        this._$container = $container;
        this._$el = $container.append(Mustache.render(paneTemplate, {id: id})).find("#" + id);
        
        // Listen to document events so we can update ourself
        $(DocumentManager).on(this._makeEventName("fileNameChange"),  _.bind(this._handleFileNameChange, this));
        $(DocumentManager).on(this._makeEventName("pathDeleted"), _.bind(this._handleFileDeleted, this));

        // Make these properties read only
        this.__defineGetter__("id", function () {
            return this._id;
        });
        this.__defineSetter__("id", function () {
            console.error("cannot change the id of a working pane");
        });
        this.__defineGetter__("$el", function () {
            return this._$el;
        });
        this.__defineSetter__("$el", function () {
            console.error("cannot change the DOM of a working pane");
        });
        this.__defineGetter__("$container", function () {
            return this.$_container;
        });
        this.__defineSetter__("$container", function () {
            console.error("cannot change the DOM of a working pane");
        });
    }

    /**
     * id of the pane
     * @type {!string}
     */
    Pane.prototype.id = null;
    
    /**
     * container where the pane lives
     * @type {JQuery}
     */
    Pane.prototype.$container = null;
    
    /**
     * container where the pane lives
     * @type {JQuery}
     */
    Pane.prototype.$container = null;

    
   /**
     * List of FILES in the Pane's working set
     * @private
     * @type {?Array.<File>}
     */
    Pane.prototype._viewList = [];

   /**
     * List of FILES in the Pane's working set maintained in MRU order
     * @private
     * @type {?Array.<File>}
     */
    Pane.prototype._viewListMRUOrder = [];

   /**
     * List of FILES in the Pane's working set maintained in added order
     * @private
     * @type {?Array.<File>}
     */
    Pane.prototype._viewListAddedOrder = [];

   /**
     * views of files (Editors, ImageViewers, etc...)
     * @private
     * @type {!Object.<string, {getFullPath: function() !string, getFile: function() !File, setVisible: function(@boolean), resizeToFit: function(@Object), destroy: function(), hasFocus: function() !boolean, childHasFocus: function() !boolean, focus: function(), getScrollPaneState: function() !Object, adjustScrollPaneState(!Object, number), switchContainer(JQuery)}>}
     */
    Pane.prototype._views = {};
    
   /**
     * current view (Editor, ImageView, etc...)
     * @private
     * @type {!Object.<string, {getFullPath: function() !string, getFile: function() !File, setVisible: function(@boolean), resizeToFit: function(@Object), destroy: function(), hasFocus: function() !boolean, childHasFocus: function() !boolean, focus: function(), getScrollPaneState: function() !Object, adjustScrollPaneState(!Object, number), switchContainer(JQuery)}>}
     */
    Pane.prototype._currentView = null;
    
   /**
     * Resets the Pane back to its default state
     * @private
     */
    Pane.prototype._reset = function () {
        this._viewList = [];
        this._viewListMRUOrder = [];
        this._viewListAddedOrder = [];
        this._views = {};
        this._currentView = null;
        this.showInterstitial(true);
    };
    
   /**
     * Creates a pane event name
     * @private
     */
    Pane.prototype._makeEventName = function (name) {
        return name + ".pane" + this.paneId;
    };
    
    
   /**
     * Merges the another Pane object's contents into this Pane 
     * @param {!Pane} Pane from which to copy 
     */
    Pane.prototype.mergeWith = function (other) {
        // hide the current views and show the interstitial page
        other.showInterstitial(true);

        // Copy the File lists
        this._viewList = _.union(this._viewList, other._viewList);
        this._viewListMRUOrder = _.union(this._viewListMRUOrder, other._viewListMRUOrder);
        this._viewListAddedOrder = _.union(this._viewListAddedOrder, other._viewListAddedOrder);
        
        var self = this,
            viewsToDestroy = [];

        // Copy the views
        _.forEach(other._views, function (view) {
            if (other.findInViewList(view.getFullPath()) !== -1) {
                // tell the view about their new home
                view.switchContainers(self.$el);
                self._views[view.getFile().fullPath] = view;
            } else {
                // We don't copy temporary views so destroy them
                viewsToDestroy.push(view);
            }
        });
        
        // Destroy temporary views
        _.forEach(viewsToDestroy, function (view) {
            view.destroy();
        });

        other._reset();
    };
    
   /**
     * Removes the DOM node for the Pane view
     */
    Pane.prototype.destroy = function () {
        $(DocumentManager).off(this._makeEventName(""));
        this.$el.remove();
    };
    
   /**
     * Returns a copy of the view file list
     * @returns {Array.<File>} 
     */
    Pane.prototype.getViewList = function () {
        return _.clone(this._viewList);
    };
    
   /**
     * Returns the number of entries in the view file list
     * @returns {number} 
     */
    Pane.prototype.getViewListSize = function () {
        return this._viewList.length;
    };
    
   /**
     * Returns the index of the item in the view file list 
     * @param {!string} fullPath the full path of the item to look for 
     * @returns {number} index of the item or -1 if not found
     */
    Pane.prototype.findInViewList = function (fullPath) {
        return _.findIndex(this._viewList, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
   /**
     * Returns the order in which the item was added
     * @param {!string} fullPath the full path of the item to look for 
     * @returns {number} order of the item or -1 if not found
     */
    Pane.prototype.findInViewListAddedOrder = function (fullPath) {
        return _.findIndex(this._viewListAddedOrder, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
   /**
     * Returns the order in which the item was last used
     * @param {!string} fullPath the full path of the item to look for 
     * @returns {number} order of the item or -1 if not found. 
     *      0 indicates most recently used, followed by 1 and so on...
     */
    Pane.prototype.findInViewListMRUOrder = function (fullPath) {
        return _.findIndex(this._viewListMRUOrder, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
    /** @const */
    Pane.prototype.ITEM_NOT_FOUND = -1;
    
    /** @const */
    Pane.prototype.ITEM_FOUND_NO_SORT = 0;
    
    /** @const */
    Pane.prototype.ITEM_FOUND_NEEDS_SORT = 1;

   /**
     * reorders the specified file in the view list to the desired position
     *
     * @param {File} file object of the item to reorder
     * @param {number} index the new position
     * @param {boolean} force the item into that position
     * @return {number} this function returns one of the following manifest constants:
     *            ITEM_NOT_FOUND        : The request file object was not found
     *            ITEM_FOUND_NO_SORT    : The request file object was found but it was already at the requested index
     *            ITEM_FOUND_NEEDS_SORT : The request file object was found and moved to a new index and the list should be resorted
     */
    Pane.prototype.reorderItem = function (file, index, force) {
        var indexRequested = (index !== undefined && index !== null && index >= 0),
            curIndex = this.findInViewList(file.fullPath);
        
        if (curIndex !== -1) {
            // File is in view list, but not at the specifically requested index - only need to reorder
            if (force || (indexRequested && curIndex !== index)) {
                var entry = this._viewList.splice(curIndex, 1)[0];
                this._viewList.splice(index, 0, entry);
                return this.ITEM_FOUND_NEEDS_SORT;
            }
            return this.ITEM_FOUND_NO_SORT;
        }
        
        return this.ITEM_NOT_FOUND;
    };
    
    /**
     * Adds the given file to the end of the pane view list, if it is not already in the list
     * @private
     * @param {!File} file
     * @param {Object} inPlace record with inPlance add data (index, indexRequested). Used internally
     */
    Pane.prototype._addToViewList = function (file, inPlace) {
        if (inPlace && inPlace.indexRequested) {
            // If specified, insert into the pane view list at this 0-based index
            this._viewList.splice(inPlace.index, 0, file);
        } else {
            // If no index is specified, just add the file to the end of the pane view list.
            this._viewList.push(file);
        }
        
        // Add to MRU order: either first or last, depending on whether it's already the current doc or not
        var currentPath = this.getCurrentlyViewedPath();
        if (currentPath && currentPath === file.fullPath) {
            this._viewListMRUOrder.unshift(file);
        } else {
            this._viewListMRUOrder.push(file);
        }
        
        // Add first to Added order
        this._viewListAddedOrder.unshift(file);
    };
    
    /**
     * Adds the given file to the end of the pane view list, if it is not already in the list
     * Does not change which document is currently open in the editor. Completes synchronously.
     * @param {!File} file
     * @param {number} index of where to add the item
     * @return {number} index of where the item was added
     */
    Pane.prototype.addToViewList = function (file, index) {
        var indexRequested = (index !== undefined && index !== null && index >= 0);

        this._addToViewList(file, {indexRequested: indexRequested, index: index});
        
        if (!indexRequested) {
            index = this._viewList.length - 1;
        }
        
        return index;
    };
            
    /**
     * Adds the given file list to the end of the pane view list. 
     * @param {!Array.<File>} fileList
     * @return {Array.<File>} list of files added to the list
     */
    Pane.prototype.addListToViewList = function (fileList) {
        var self = this,
            uniqueFileList = [];

        // Process only files not already in view list
        fileList.forEach(function (file) {
            if (EditorManager.canOpenFile(file.fullPath) && self.findInViewList(file.fullPath) === -1 && !MainViewManager.getPaneIdForPath(file.fullPath)) {
                self._addToViewList(file);
                uniqueFileList.push(file);
            }
        });

        return uniqueFileList;
    };
    
    /**
     * Removes the specifed file from all internal lists, destroys the view of the file (if there is one)
     *  and shows the interstitial page if the current view is destroyed
     * @private
     * @param {!File} file
     * @return {boolean} true if removed, false if the file was not found either in a list or view
     */
    Pane.prototype._removeFromViewList = function (file) {
        
        // If it's in the view list then we need to remove it 
        var index = this.findInViewList(file.fullPath);
        
        if (index > -1) {
            // Remove it from all 3 view lists
            this._viewList.splice(index, 1);
            this._viewListMRUOrder.splice(this.findInViewListMRUOrder(file.fullPath), 1);
            this._viewListAddedOrder.splice(this.findInViewListAddedOrder(file.fullPath), 1);
        }
        
        // Destroy the view
        var view = this._views[file.fullPath];

        if (view) {
            if (this._currentView === view) {
                this.showInterstitial(true);
            }
            delete this._views[file.fullPath];
            view.destroy();
        }
        
        return ((index > -1) || !!view);
    };

    /**
     * Removes the specifed file from all internal lists, destroys the view of the file (if there is one)
     *  and shows the interstitial page if the current view is destroyed
     * @param {!File} file
     * @return {boolean} true if removed, false if the file was not found either in a list or view
     */
    Pane.prototype.removeFromViewList = function (file) {
        return this._removeFromViewList(file);
    };
    
    
    /**
     * Removes the specifed file from all internal lists, destroys the view of the file (if there is one)
     *  and shows the interstitial page if the current view is destroyed
     * @param {!File} file
     * @return {array.<File>} array of File objecgts removed 
     */
    Pane.prototype.removeListFromViewList = function (list) {
        var self = this,
            fileList = [];
        
        if (!list) {
            return;
        }
        
        list.forEach(function (file) {
            if (self._removeFromViewList(file)) {
                fileList.push(file);
            }
        });
        
        return fileList;
    };
    
    /**
     * Removes all files from all internal lists, destroys the view of those files
     *  and shows the interstitial page if the current view is destroyed.  
     * This function only destroys the files that are open, if there is a temporary view of a file (a view that has been constructed 
     *  and viewed but not added to the working set) then it will not be destroyed and it will 
     * @param {!File} file
     * @return {array.<File>} array of File objecgts removed 
     */
    Pane.prototype.removeAllFromViewList = function () {
        var fileList = this.getViewList();
        this.removeListFromViewList(fileList);
        return fileList;
    };
    
    Pane.prototype.makeViewMostRecent = function (file) {
        var index = this.findInViewListMRUOrder(file.fullPath);
        if (index !== -1) {
            this._viewListMRUOrder.splice(index, 1);
            this._viewListMRUOrder.unshift(file);
        }
    };
    
    Pane.prototype.sortViewList = function (compareFn) {
        this._viewList.sort(_.partial(compareFn, this.id));
    };

    Pane.prototype._isViewListIndexInRange = function (index) {
        var length = this._viewList.length;
        return index !== undefined && index !== null && index >= 0 && index < length;
    };
    
    Pane.prototype.swapViewListIndexes = function (index1, index2) {
        if (this._isViewListIndexInRange(index1) && this._isViewListIndexInRange(index2)) {
            var temp = this._viewList[index1];
            this._viewList[index1] = this._viewList[index2];
            this._viewList[index2] = temp;
            return true;
        }
        return false;
    };
    
    Pane.prototype.traverseViewListByMRU = function (direction, current) {
        if (Math.abs(direction) !== 1) {
            console.error("traverseViewList called with unsupported direction: " + direction.toString());
            return null;
        }

        if (!current && this._currentView) {
            current = this._currentView.getFullPath();
        }
        
        var index = this.findInViewListMRUOrder(current);
        if (index === -1) {
            // If doc not in view list, return most recent view list item
            if (this._viewListMRUOrder.length > 0) {
                return this._viewListMRUOrder[0];
            }
        } else if (this._viewListMRUOrder.length > 1) {
            // If doc is in view list, return next/prev item with wrap-around
            index += direction;
            if (index >= this._viewListMRUOrder.length) {
                index = 0;
            } else if (index < 0) {
                index = this._viewListMRUOrder.length - 1;
            }

            return this._viewListMRUOrder[index];
        }
        
        // If no doc open or view list empty, there is no "next" file
        return null;
    };
    
    Pane.prototype._handleFileNameChange = function (e, oldname, newname) {
        var dispatchEvent = (this.findInViewList(newname) >= 0);
        
        if (this._views.hasOwnProperty(oldname)) {
            var view = this._views[oldname];

            this._views[newname] = view;
            delete this._views[oldname];
        }
        
        if (dispatchEvent) {
            $(this).triggerHandler("viewListChanged");
        }
    };

    Pane.prototype._handleFileDeleted = function (e, fullPath) {
        if (this.doRemoveView({fullPath: fullPath})) {
            $(this).triggerHandler("viewListChanged");
        }
    };
    
    Pane.prototype.showInterstitial = function (show) {
        if (this._currentView) {
            this._currentView.setVisible(false);
            this._currentView = null;
        }
        if (this.$el) {
            this.$el.find(".not-editor").css("display", (show) ? "" : "none");
        }
    };
    
    Pane.prototype.getViewForPath = function (path) {
        return this._views[path];
    };
    
    Pane.prototype.addView = function (path, view, show) {
        this._views[path] = view;
        if (show) {
            this.showView(view);
        }
    };
    
    Pane.prototype.showView = function (view) {
        if (!view) {
            return;
        }
        
        if (this._currentView && this._currentView === view) {
            this._currentView.setVisible(true);
            this.updateLayout();
            return;
        }
        
        var newPath = view.getFullPath(),
            oldView = this._currentView,
            oldPath = oldView ? oldView.getFullPath() : undefined;
        
        if (this._currentView) {
            this._currentView.setVisible(false);
        } else {
            this.showInterstitial(false);
        }
        
        this._currentView = view;
        this._currentView.setVisible(true);
        
        this.updateLayout();
        
        if (oldPath) {
            // Destroy any view that was currently shown
            //  that is not in the view pane list 
            if (this.findInViewList(oldPath) === -1) {
                delete this._views[oldPath];
                oldView.destroy();
            }
        }
        
        if ((this.findInViewList(newPath) !== -1) && (!this._views.hasOwnProperty(newPath))) {
            console.error(newPath + " found in pane working set but pane.addView() has not been called for the view created for it");
        }
    };
    
    Pane.prototype.updateLayout = function (hint) {
        if (this._currentView) {
            this._currentView.resizeToFit(hint);
        }
    };
    
    Pane.prototype.isViewNeeded = function (view) {
        if (!view) {
            return false;
        }
        var path = view.getFullPath();
        return ((this._currentView && this._currentView.getFullPath() === path) || (this.findInViewList(path) !== -1));
    };
    
    Pane.prototype.getCurrentlyViewedFile = function () {
        return this._currentView ? this._currentView.getFile() : null;
    };
    
    Pane.prototype.getCurrentlyViewedPath = function () {
        var file = this.getCurrentlyViewedFile();
        return file ? file.fullPath : null;
    };
    
    Pane.prototype.destroyViewIfNotNeeded = function (view) {
        if (view && !this.isViewNeeded(view)) {
            delete this._views[view.getFullPath()];
            view.destroy();
        }
    };
    
    Pane.prototype.doRemoveAllViews = function () {
        var self = this,
            views = _.extend({}, this._views);
        
        this._reset();
        
        _.forEach(views, function (view) {
            view.destroy();
        });
    };
    
    Pane.prototype.doRemoveViews = function (fileList) {
        return this.removeListFromViewList(fileList);
    };
    
    Pane.prototype.doRemoveView = function (file) {
        var nextFile = this.traverseViewListByMRU(1, file.fullPath);
        if (nextFile && nextFile.fullPath !== file.fullPath) {
            var fullPath = nextFile.fullPath;
            if (this._views.hasOwnProperty(fullPath)) {
                this.showView(this._views[fullPath]);
            } else {
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: fullPath,
                                                             paneId: this.id});
            }
        }
        return this._removeFromViewList(file);
    };
    
    Pane.prototype.focus = function () {
        if (this._currentView) {
            if (!this._currentView.hasFocus() && !this._currentView.childHasFocus()) {
                this._currentView.focus();
            }
        } else {
            this.$el.focus();
        }
    };
    
    Pane.prototype.onSetActive = function (active) {
        this.$el.toggleClass("active-pane", !!active);
    };
    
    Pane.prototype.loadState = function (state) {
        var filesToAdd = [],
            viewStates = {},
            activeFile,
            self = this;
        
        var getInitialViewFilePath = function () {
            return (self._viewList.length > 0) ? self._viewList[0].fullPath : null;
        };

        _.forEach(state, function (entry) {
            filesToAdd.push(FileSystem.getFileForPath(entry.file));
            if (entry.active) {
                activeFile = entry.file;
            }
            if (entry.viewState) {
                viewStates[entry.file] = entry.viewState;
            }
        });
        
        this.addListToViewList(filesToAdd);
        
        /*
         * @todo: Implement a ViewStateManager
         */
        EditorManager.addViewStates(viewStates);
        
        activeFile = activeFile || getInitialViewFilePath();
        
        if (activeFile) {
            return CommandManager.execute(Commands.FILE_OPEN, { fullPath: activeFile,
                                                         paneId: this.id});
        }
        
        return new $.Deferred().resolve();
    };
    
    Pane.prototype.saveState = function () {
        var view,
            result = [],
            currentlyViewedPath = this.getCurrentlyViewedPath();
        
        this._viewList.forEach(function (file) {
            // Do not persist untitled document paths
            if (!(file instanceof InMemoryFile)) {
                result.push({
                    file: file.fullPath,
                    active: (file.fullPath === currentlyViewedPath),
                    viewState:  EditorManager.getViewState(file.fullPath)
                });
            }
        });
        
        return result;
    };
    
    Pane.prototype.getPaneScrollState = function () {
        if (this._currentView) {
            return {scrollPos: this._currentView.getScrollPos()};
        }
    };
    
    Pane.prototype.adjustPaneScrollState = function (state, heightDelta) {
        if (this._currentView && state && state.scrollPos) {
            this._currentView.adjustScrollPos(state.scrollPos, heightDelta);
        }
    };
    
    exports.Pane = Pane;
});