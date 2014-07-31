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
    
    /**
     * Pane objects host views of files, editors, etc... 
     * 
     * To get a custom view, there are two components:
     * 
     *  1) A view provider (which will be implemented later
     *  2) A view object
     *
     * View objects can be added to a pane and do not have to exist in the Pane object's view list.  
     * These are "temporary views".  These views do not show up in the PaneViewList and, as such, 
     * are not serialized with the Pane state and reconstituted when the pane is serialized from disk.
     *
     * These views are added by calling Pane.showView() and passing it the view object. The view 
     * will be destroyed when the next view is shown, the pane is mereged with another pane or the "Close All"
     * command is exectuted on the Pane.
     *
     * Pane Object Events:
     * viewListChanged - triggered whenever there is a change the the pane's view state
     *
     * View Intereface:
     *
     * {
     *      getFile: function () @return {!File} File object that belongs to the view (may return null)
     *      setVisible: function(visible:boolean) - shows ore hides the view 
     *      resizeToFit: function(forceRefresh:boolean) - tells the view to resize its content 
     *      destroy: function() - called when the view is no longer needed. 
     *      hasFocus:  function() - called to determine if the view has focus.  
     *      childHasFocus: function() - called to determine if a child component of the view has focus.  
     *      focus: function() - called to tell the view to take focus
     *      getScrollPos: function() - called to get the current view scroll state. @return {Object=}
     *      adjustScrollPos: function(state:Object=, heightDelta:number) - called to restore the scroll state and adjust the height by heightDelta
     *      switchContainers: function($newContainer:jQuery} - called to reparent the view to a new container
     *      getContainer: function() - called to get the current container @return {!jQuery} - the view's parent container
     * }
     *  
     * getFile()
     *
     *  Called throughout the life of a View when the current file is queried by the system.  Can be NULL
     *
     * setVisible()
     *
     *  Called when the view is shown or hidden.  When temporary views are hidden their destroy() method is called.
     *
     * resizeToFit(forceRefresh:boolean)
     *  
     *  Called to notify the view that it should be resized to fit its parent container.  This may be called several times
     *  or only once.  Views can ignore the forceRefresh flag. It is used for editor views to force a relayout of the editor 
     *  which probably isn't necessary for most views.  Views should implement their html to be dynamic and not rely on this
     *  function to be called whenever possible.
     *
     * hasFocus()
     *
     *  Called throughout the life of the View to determine if the view has focus.
     *
     * childHasFocus()
     *
     *  Called throughout the life of the View to determine if a child compontent of the view has focus.  If the view has no child
     *  component then the view should just return false when this function is called.
     *
     * focus()
     *
     *  Called to tell the View to take focus.
     * 
     * getScrollPos()
     * adjustScrollPos()
     * 
     *  The system at various times may want to save and restore the view's scroll position.  The data returned by getScrollPos() is 
     *  specific to your view.  It will only be saved and passed back to adjustScrollPos() when the system wants the view to restore
     *  its scroll position.
     *
     *  When Modal Bars are invoked, the system calls getScrollPos() so that the current scroll psotion of all visible Views can be cahced. 
     *  Later, the cached scroll position data is passed to adjustScrollPos() along with a height delta.  The height delta is used to 
     *  scroll the view so that it doesn't appear to have "jumped" when invoking a modal bar. 
     *
     *  Height delta will be a positivewhen the Modal Bar is being shown and negative number when the Modal Bar is being hidden.  
     *  
     * switchContainers($newContainer)
     * 
     *  called when a Pane is being merged with another Pane.  
     * 
     *      `view.$el.detach().appendTo($newContainer);`
     *  
     *
     * getContainer()
     *
     *  Called to determine which Pane a View belongs to by MainViewManager.
     *
     *
     */
    
    /**
     * @typedef {getFile:function(), setVisible:function(visible:boolean), resizeToFit:function(forceRefresh:boolean), destroy:function(), hasFocus:function(), childHasFocus:function(), focus:function(), getScrollPos:function(),  adjustScrollPos:function(state:Object=, heightDelta:number), switchContainers: function($newContainer:jQuery}, getContainer: function()} View 
     */
    
    /*
     * Pane Objects are constructed by the MainViewManager object when a Pane view is needed
     * @see {@link MainViewManager} for more information
     *
     * @constructor
     * @param {@return {} id - The id to use to identify this pane
     * @param {!JQuery} $container - The parent $container to place the pane view
     */
    function Pane(id, $container) {
        this._id = id;
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
     * @readonly
     * @type {@return {}
     */
    Pane.prototype.id = null;
    
    /**
     * container where the pane lives
     * @readonly
     * @type {JQuery}
     */
    Pane.prototype.$container = null;
    
    /**
     * the wrapped DOM node of this pane
     * @readonly
     * @type {JQuery}
     */
    Pane.prototype.$el = null;
  
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
     * Creates a pane event namespaced to this pane
     * @private
     * @param {@return {} name - the name of the event to namespace (pass an empty string to generate just the namespace key to pass to jQuery to turn off all events handled by this pane)
     * @return {string} an event namespaced to this pane
     */
    Pane.prototype._makeEventName = function (name) {
        return name + ".pane" + this.paneId;
    };
    
    /**
     * Merges the another Pane object's contents into this Pane 
     * @param {!Pane} Other - Pane from which to copy 
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
            
            var file = view.getFile(),
                fullPath = file && file.fullPath;
            if (fullPath && other.findInViewList(fullPath) !== -1) {
                // switch the container to this Pane
                view.switchContainers(self.$el);
                self._views[fullPath] = view;
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
     * @returns {!Array.<File>} 
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
     * determines if the specified input paramater is in range of the view file list 
     * @param {number} 
     * @private
     */
    Pane.prototype._isViewListIndexInRange = function (index) {
        var length = this._viewList.length;
        return index !== undefined && index !== null && index >= 0 && index < length;
    };
    
    /**
     * Returns the index of the item in the view file list 
     * @param {@return {} fullPath the full path of the item to look for 
     * @returns {number} index of the item or -1 if not found
     */
    Pane.prototype.findInViewList = function (fullPath) {
        return _.findIndex(this._viewList, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
    /**
     * Returns the order in which the item was added
     * @param {@return {} fullPath the full path of the item to look for 
     * @returns {number} order of the item or -1 if not found
     */
    Pane.prototype.findInViewListAddedOrder = function (fullPath) {
        return _.findIndex(this._viewListAddedOrder, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
   /**
     * Returns the order in which the item was last used
     * @param {@return {} fullPath the full path of the item to look for 
     * @returns {number} order of the item or -1 if not found. 
     *      0 indicates most recently used, followed by 1 and so on...
     */
    Pane.prototype.findInViewListMRUOrder = function (fullPath) {
        return _.findIndex(this._viewListMRUOrder, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
    /** 
     * Return value from reorderItem when the Item was not found 
     * @see {@link reorderItem()}
     * @const 
     */
    Pane.prototype.ITEM_NOT_FOUND = -1;
    
    /** 
     * Return value from reorderItem when the Item was found at its natural index 
     * and the pane view list does not need to be resorted
     * @see {@link reorderItem()}
     * @const 
     */
    Pane.prototype.ITEM_FOUND_NO_SORT = 0;
    
    /** 
     * Return value from reorderItem when the Item was found and reindexed 
     * and the pane view list needs to be resorted
     * @see {@link reorderItem()}
     * @const 
     */
    Pane.prototype.ITEM_FOUND_NEEDS_SORT = 1;

    /**
     * reorders the specified file in the view list to the desired position
     *
     * @param {File} file - the file object of the item to reorder
     * @param {number=} index - the new position of the item
     * @param {boolean=} force - true to force the item into that position, false otherwise.  (Requires an index be requested)
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
     * @param {Object=} inPlace record with inPlance add data (index, indexRequested). Used internally
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
     * Determines if a file can be added to our file list
     * @private
     * @param {!File} file - file object to test
     * @return {boolean} true if it can be added, false if not
     */
    Pane.prototype._canAddFile = function (file) {
        return ((this._views.hasOwnProperty(file.fullPath) && this.findInViewList(file.fullPath) === -1) ||
                    (EditorManager.canOpenFile(file.fullPath) && !MainViewManager.getPaneIdForPath(file.fullPath)));
    };
                
    /**
     * Adds the given file to the end of the pane view list, if it is not already in the list
     * Does not change which document is currently open in the editor. Completes synchronously.
     * @param {!File} file - file to add
     * @param {number=} index - position where to add the item
     * @return {number} index of where the item was added
     */
    Pane.prototype.addToViewList = function (file, index) {
        var indexRequested = (index !== undefined && index !== null && index >= 0 && index < this._viewList.length);

        this._addToViewList(file, {indexRequested: indexRequested, index: index});
        
        if (!indexRequested) {
            index = this._viewList.length - 1;
        }
        
        return index;
    };
    

    /**
     * Adds the given file list to the end of the pane view list. 
     * @param {!Array.<File>} fileList
     * @return {!Array.<File>} list of files added to the list
     */
    Pane.prototype.addListToViewList = function (fileList) {
        var self = this,
            uniqueFileList = [];

        // Process only files not already in view list
        fileList.forEach(function (file) {
            if (self._canAddFile(file)) {
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
     * @param {!File} file - file to remove
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
                this._currentView = null;
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
     * @param {!Array.<File>}  list - Array of files to remove
     * @return {!Array.<File>} Array of File objects removed 
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
     * This function only destroys the files that are open, if there is a temporary 
     *  view of a file (a view that has been constructed and viewed but not added to the working set)
     *  then it will not be destroyed. To destroy all Views call doRemoveAllViews()
     * @param {!File} file
     * @return {!Array.<File>} Array of File objecgts removed 
     */
    Pane.prototype.removeAllFromViewList = function () {
        var fileList = this.getViewList();
        this.removeListFromViewList(fileList);
        return fileList;
    };
    
    /**
     * Moves the specified file to the front of the MRU list
     * @param {!File} file
     */
    Pane.prototype.makeViewMostRecent = function (file) {
        var index = this.findInViewListMRUOrder(file.fullPath);
        if (index !== -1) {
            this._viewListMRUOrder.splice(index, 1);
            this._viewListMRUOrder.unshift(file);
        }
    };
    
    /**
     * @callback sortFunctionCallback
     * @param {@return {} the id of the pane object
     * @param {!File} The first item to compare
     * @param {!File} the second item to compare
     * @return {number} 0 if the two params are equal, -1 if the first is to come before the seond and 1 if the second comes before the first
     */
    
    /**
     * invokes Array.sort method on the internal view list. 
     * @param {sortFunctionCallback} compareFn - the function to call to determine if the 
     */
    Pane.prototype.sortViewList = function (compareFn) {
        this._viewList.sort(_.partial(compareFn, this.id));
    };

    /**
     * Swaps two items in the file view list (used while dragging items in the working set view)
     * @param {number} index1 - the index of the first item to swap
     * @param {number} index2 - the index of the second item to swap
     * @return {boolean}} true 
     */
    Pane.prototype.swapViewListIndexes = function (index1, index2) {
        if (this._isViewListIndexInRange(index1) && this._isViewListIndexInRange(index2)) {
            var temp = this._viewList[index1];
            this._viewList[index1] = this._viewList[index2];
            this._viewList[index2] = temp;
            return true;
        }
        return false;
    };
    
    /**
     * Traverses the list and returns the File object of the next item in the MRU order
     * @param {@return {}} direction - Must be 1 or -1 to traverse forward or backward
     * @param {string=} current - the fullPath of the item where traversal is to start. 
     *                              If this paramater is ommitted then the path of the current view is used.
     *                              If the current view is a temporary view then the first item in the MRU list is returned
     * @return {?File} The File object of the next item in the travesal order or null if there isn't one.
     */
    Pane.prototype.traverseViewListByMRU = function (direction, current) {
        if (Math.abs(direction) !== 1) {
            console.error("traverseViewList called with unsupported direction: " + direction.toString());
            return null;
        }

        if (!current && this._currentView) {
            var file = this._currentView.getFile();
            current = file && file.fullPath;
        }
        
        var index = current ? this.findInViewListMRUOrder(current) : -1;
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
    
    /**
     * Event handler when a file changes name
     * @private
     * @param {!JQuery.Event} e - jQuery event object
     * @return {@return {} oldname - path of the file that was renamed
     * @return {@return {} newname - the new path to the file
     */
    Pane.prototype._handleFileNameChange = function (e, oldname, newname) {
        // because we store the File objects then   we don't really need to 
        // rename the file in the view map and dispatch a change event if we 
        // had a file object that was renamed so that our listeners can update 
        var dispatchEvent = (this.findInViewList(newname) >= 0);
        
        // rename the view 
        if (this._views.hasOwnProperty(oldname)) {
            var view = this._views[oldname];

            this._views[newname] = view;
            delete this._views[oldname];
        }
        
        // dispatch the change event
        if (dispatchEvent) {
            $(this).triggerHandler("viewListChanged");
        }
    };

    /**
     * Event handler when a file is deleted
     * @private
     * @param {!JQuery.Event} e - jQuery event object
     * @return {@return {} fullPath - path of the file that was deleted
     */
    Pane.prototype._handleFileDeleted = function (e, fullPath) {
        if (this.doRemoveView({fullPath: fullPath})) {
            $(this).triggerHandler("viewListChanged");
        }
    };
    
    /**
     * Shows the pane's interstitial page
     * @param {boolean} show - show or hide the interstitial page
     */
    Pane.prototype.showInterstitial = function (show) {
        if (this.$el) {
            this.$el.find(".not-editor").css("display", (show) ? "" : "none");
        }
    };
    
    /**
     * retrieves the view object for the given path
     * @param {@return {} path - the fullPath of the view to retrieve
     * @return {boolean} show - show or hide the interstitial page
     */
    Pane.prototype.getViewForPath = function (path) {
        return this._views[path];
    };
    
    /**
     * Adds a view to the pane
     * @param {@return {} path - the fullpath of the view object to add
     * @param {!View} view - the View object to add 
     * @param {boolean} show - true to show the view right away, false otherwise
     */
    Pane.prototype.addView = function (view, show) {
        var file = view.getFile(),
            path = file && file.fullPath;
        
        if (!path) {
            console.error("cannot add a view that does not have a fullPath");
            return;
        }
        
        this._views[path] = view;
        if (show) {
            this.showView(view);
        }
    };
    
    /**
     * Swaps the current view with the requested view. 
     * If the interstitial page is shown, it is hidden. 
     * If the currentView is a temporary view, it is destroyed.
     * @param {!View} view - the to show
     */
    Pane.prototype.showView = function (view) {
        if (this._currentView && this._currentView === view) {
            this._currentView.setVisible(true);
            this.updateLayout(true);
            return;
        }
        
        var file = view.getFile(),
            newPath = file && file.fullPath,
            oldView = this._currentView,
            oldPath = oldView && oldView.getFile() ? oldView.getFile().fullPath : null;
        
        if (this._currentView) {
            if (this._currentView.hasOwnProperty("document")) {
                EditorManager._saveEditorViewState(this._currentView);
            }
            this._currentView.setVisible(false);
        } else {
            this.showInterstitial(false);
        }
        
        this._currentView = view;
        this._currentView.setVisible(true);
        this.updateLayout();
        
        if (oldPath) {
            // The old view is a temporary view because it 
            //  we not found in our view list
            if (this.findInViewList(oldPath) === -1) {
                delete this._views[oldPath];
                oldView.destroy();
            }
        } else if (oldView) {
            // Views that do not have a fullPath are always temporary views
            //  which are destroyed after the view has been hidden
            oldView.destroy();
        }
        
        if (newPath && (this.findInViewList(newPath) !== -1) && (!this._views.hasOwnProperty(newPath))) {
            console.error(newPath + " found in pane working set but pane.addView() has not been called for the view created for it");
        }
    };
    
    /**
     * Updates the layout causing the current view to redraw itself
     * @param {boolean} forceRefresh - true to force a resize and refresh of the current view, false if just to resize
     */
    Pane.prototype.updateLayout = function (forceRefresh) {
        if (this._currentView) {
            this._currentView.resizeToFit(forceRefresh);
        }
    };
    
    /**
     * Determines if the view can be disposed of
     * @private
     * @param {!View} view - the View object to test
     * @return {boolean}} true if the view can be disposed, false if not
     */
    Pane.prototype._isViewNeeded = function (view) {
        var file = view.getFile(),
            path = file && file.fullPath,
            currentPath = this.getCurrentlyViewedPath();
        
        if (!path) {
            return false;
        }
        return ((this._currentView && currentPath === path) || (this.findInViewList(path) !== -1));
    };
    
    
    /**
     * Retrieves the File object of the current view
     * @return {?File} the File object of the current view or null if there isn't one
     */
    Pane.prototype.getCurrentlyViewedFile = function () {
        return this._currentView ? this._currentView.getFile() : null;
    };
    
    /**
     * Retrieves the path of the current view
     * @return {?string} the path of the current view or null if there isn't one
     */
    Pane.prototype.getCurrentlyViewedPath = function () {
        var file = this.getCurrentlyViewedFile();
        return file ? file.fullPath : null;
    };
    
    /**
     * destroys the view if it isn't needed
     * @param {View} view - the view to destroy
     */
    Pane.prototype.destroyViewIfNotNeeded = function (view) {
        if (view && !this._isViewNeeded(view)) {
            var file = view.getFile(),
                path = file && file.fullPath;
            delete this._views[path];
            view.destroy();
        }
    };
    
    /**
     * Destroys all views and resets the state of the pane
     */
    Pane.prototype.doRemoveAllViews = function () {
        var views = _.extend({}, this._views);
        
        this._reset();
        
        _.forEach(views, function (view) {
            view.destroy();
        });
    };
    
    /**
     * Destroys the requested views 
     * @param {Array.<File>} fileList - the list of files to close
     * @return {!Array.<File>} the list of files actually close
     */
    Pane.prototype.doRemoveViews = function (fileList) {
        return this.removeListFromViewList(fileList);
    };
    
    
    /**
     * Executes a FILE_OPEN command to open a file
     * @param {@return {} fullPath - path of the file to open
     * @return {jQuery.promise} promise that will resolve when the file is opened
     */
    Pane.prototype._execOpenFile = function (fullPath) {
        return CommandManager.execute(Commands.FILE_OPEN, { fullPath: fullPath, paneId: this.id});
    };
    
    /**
     * Destroys the requested view
     * @param {File} file - the file to close
     * @param {boolean} openNextFile - open the next in MRU order
     * @return {boolean} true if removed, false if the file was not found either in a list or view
     */
    Pane.prototype.doRemoveView = function (file, openNextFile) {
        var nextFile = openNextFile && this.traverseViewListByMRU(1, file.fullPath);
        if (nextFile && nextFile.fullPath !== file.fullPath) {
            var fullPath = nextFile.fullPath,
                needOpenNextFile = this._views.hasOwnProperty(fullPath);
            
            if (this._removeFromViewList(file)) {
                if (needOpenNextFile) {
                    this._execOpenFile(fullPath);
                }
                return true;
            }
            return false;
        }
        return this._removeFromViewList(file);
    };
    
    /**
     * Gives focus to the current view if there is one or the pane if there isn't
     */
    Pane.prototype.focus = function () {
        if (this._currentView) {
            if (!this._currentView.hasFocus() && !this._currentView.childHasFocus()) {
                this._currentView.focus();
            }
        } else {
            this.$el.focus();
        }
    };
    
    /**
     * Called when the pane becomes the active pane
     * @param {boolean=} true if the pane is active, false if not
     */
    Pane.prototype.notifySetActive = function (active) {
        this.$el.toggleClass("active-pane", !!active);
    };
    
    /**
     * serializes the pane state
     * @param {!Object} state - the state to load 
     */
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
        EditorManager._addViewStates(viewStates);
        
        activeFile = activeFile || getInitialViewFilePath();
        
        if (activeFile) {
            return this._execOpenFile(activeFile);
        }
        
        return new $.Deferred().resolve();
    };
    
    /**
     * serializes the pane state
     * @return {!Object} state - the state to save 
     */
    Pane.prototype.saveState = function () {
        var view,
            result = [],
            currentlyViewedPath = this.getCurrentlyViewedPath();

        // Save the current view state first
        if (this._currentView && this._currentView.hasOwnProperty("document")) {
            EditorManager._saveEditorViewState(this._currentView);
        }
        
        this._viewList.forEach(function (file) {
            // Do not persist untitled document paths
            if (!(file instanceof InMemoryFile)) {
                result.push({
                    file: file.fullPath,
                    active: (file.fullPath === currentlyViewedPath),
                    viewState:  EditorManager._getViewState(file.fullPath)
                });
            }
        });
        
        return result;
    };
    
    /**
     * gets the current view's scroll state data
     * @return {!Object} scroll state - the current scroll state
     */
    
    Pane.prototype.getScrollState = function () {
        if (this._currentView) {
            return {scrollPos: this._currentView.getScrollPos()};
        }
    };
    
    /**
     * serializes from disk the pane state
     * @param {!Object} state - the current scroll state
     * @param {@return {}} heightDelta - the amount to add or subtract from the state
     */
    Pane.prototype.restoreAndAdjustScrollState = function (state, heightDelta) {
        if (this._currentView && state && state.scrollPos) {
            this._currentView.adjustScrollPos(state.scrollPos, heightDelta);
        }
    };
    
    exports.Pane = Pane;
});