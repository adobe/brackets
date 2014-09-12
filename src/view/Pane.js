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

 /**
  * Pane objects host views of files, editors, etc... Clients cannot access
  * Pane objects directly. Instead the implementation is protected by the 
  * MainViewManager -- however View Factories are given a Pane object which 
  * they can use to add views.  References to Pane objects should not be kept
  * as they may be destroyed and removed from the DOM.
  * 
  * To get a custom view, there are two components:
  * 
  *  1) A View Factory   
  *  2) A View Object  
  *
  * View objects are anonymous object that have a particular interface. 
  *
  * Views can be added to a pane but do not have to exist in the Pane object's view list.  
  * Such views are "temporary views".  Temporary views are not serialized with the Pane state
  * or reconstituted when the pane is serialized from disk.  They are destroyed at the earliest
  * opportunity.
  *
  * Temporary views are added by calling `Pane.showView()` and passing it the view object. The view 
  * will be destroyed when the next view is shown, the pane is mereged with another pane or the "Close All"
  * command is exectuted on the Pane.  Temporary Editor Views do not contain any modifications and are
  * added to the workingset (and are no longer tempoary views) once the document has been modified. They 
  * will remain in the working set until closed from that point on.
  *
  * Views that have a longer life span are added by calling addView to associate the view with a 
  * filename in the _views object.  These views are not destroyed until they are removed from the pane
  * by calling one of the following: removeView, removeViews, or _reset
  *
  * Pane Object Events:  
  *
  *  - viewListChange - Whenever there is a file change to a file in the working set.  These 2 events: `DocumentManger.pathRemove` 
  *  and `DocumentManger.fileNameChange` will cause a `viewListChange` event so the WorkingSetView can update.
  *
  *  - currentViewChange - triggered whenever the current view changes.
  *             (e, newView:View, oldView:View)
  *
  * View Interface:  
  *
  * The view is an anonymous object which has the following method signatures. see ImageViewer for an example or the sample
  * provided with Brackets `src/extensions/samples/BracketsConfigCentral`  
  *
  *     {
  *         $el:jQuery 
  *         getFile: function ():!File 
  *         updateLayout: function(forceRefresh:boolean) 
  *         destroy: function()
  *         getScrollPos: function():*=
  *         adjustScrollPos: function(state:Object=, heightDelta:number)=
  *         notifyContainerChange: function()=
  *         notifyVisibilityChange: function(boolean)=
  *     }
  *  
  * When views are created they can be added to the pane by calling `pane.addView()`.  
  * Views can be created and parented by attaching directly  to `pane.$el` 
  *
  *     this._codeMirror = new CodeMirror(pane.$el, ...)
  *
  * Factories can create a view that's initially hidden by calling `pane.addView(view)` and passing `false` for the show parameter.
  * Hidden views can be later shown by calling `pane.showView(view)`
  *
  * `$el:jQuery!`
  *
  *  property that stores the jQuery wrapped DOM element of the view. All views must have one so pane objects can manipulate the DOM
  *  element when necessary (e.g. `showView`, `_reparent`, etc...)
  *
  * `getFile():File!`
  *
  *  Called throughout the life of a View when the current file is queried by the system.
  *
  * `updateLayout(forceRefresh:boolean)`
  *  
  *  Called to notify the view that it should be resized to fit its parent container.  This may be called several times
  *  or only once.  Views can ignore the `forceRefresh` flag. It is used for editor views to force a relayout of the editor
  *  which probably isn't necessary for most views.  Views should implement their html to be dynamic and not rely on this
  *  function to be called whenever possible.
  *
  * `destroy()`
  *
  *  Views must implement a destroy method to remove their DOM element at the very least.  There is no default
  *  implementation and views are hidden before this method is called. The Pane object doesn't make assumptions
  *  about when it is safe to remove a node. In some instances other cleanup  must take place before a the DOM 
  *  node is destroyed so the implementation details are left to the view.  
  *
  *  Views can implement a simple destroy by calling 
  *
  *      this.$el.remove()
  *
  *  These members are optional and need not be implemented by Views 
  *
  *      getScrollPos()
  *      adjustScrollPos()
  *
  *  The system at various times will want to save and restore a view's scroll position.  The data returned by `getScrollPos()`
  *  is specific to the view and will be passed back to `adjustScrollPos()` when the scroll position needs to be restored.
  *
  *  When Modal Bars are invoked, the system calls `getScrollPos()` so that the current scroll psotion of all visible Views can be cached.
  *  That cached scroll position is later passed to `adjustScrollPos()` along with a height delta.  The height delta is used to
  *  scroll the view so that it doesn't appear to have "jumped" when invoking the Modal Bar.  
  *
  *  Height delta will be a positive when the Modal Bar is being shown and negative number when the Modal Bar is being hidden.  
  *
  *  `getViewState()` is another optional member that is used to cache a view's state when hiding or destroying a view or closing the project.
  *  The data returned by this member is stored in `ViewStateManager` and is saved with the project.  
  *
  *  Views or View Factories are responsible for restoring the view state when the view of that file is created by recalling the cached state 
  *  
  *      var view = createIconView(file, pane);
  *      view.restoreViewState(ViewStateManager.getViewState(file.fullPath));
  *
  *  Notifications
  *  The following optional methods receive notifications from the Pane object when certain events take place which affect the view:
  *
  * `notifyContainerChange()` 
  *
  *  Optional Notification callback called when the container changes. The view can perform any synchronization or state update
  *  it needs to do when its parent container changes.
  *  
  * `notifyVisiblityChange()`
  * 
  *  Optional Notification callback called when the view's vsibility changes.  The view can perform any synchronization or
  *  state update it needs to do when its visiblity state changes.
  */
define(function (require, exports, module) {
    "use strict";
        
    var _                   = require("thirdparty/lodash"),
        FileSystem          = require("filesystem/FileSystem"),
        File                = require("filesystem/File"),
        InMemoryFile        = require("document/InMemoryFile"),
        ViewStateManager    = require("view/ViewStateManager"),
        MainViewManager     = require("view/MainViewManager"),
        DocumentManager     = require("document/DocumentManager"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        Strings             = require("strings"),
        ViewUtils           = require("utils/ViewUtils"),
        paneTemplate        = require("text!htmlContent/pane.html");
    
    
    /**
     * @typedef {!$el: jQuery, getFile:function():!File, updateLayout:function(forceRefresh:boolean), destroy:function(),  getScrollPos:function():?,  adjustScrollPos:function(state:Object=, heightDelta:number)=, getViewState:function():?*=, restoreViewState:function(viewState:!*)=, notifyContainerChange:function()=, notifyVisibilityChange:function(boolean)=} View
     */
    
    /**
     * Pane Objects are constructed by the MainViewManager object when a Pane view is needed
     * @see {@link MainViewManager} for more information
     *
     * @constructor
     * @param {!string} id - The id to use to identify this pane
     * @param {!JQuery} $container - The parent $container to place the pane view
     */
    function Pane(id, $container) {
        this._initialize();
        
        // Setup the container and the element we're inserting
        var self = this,
            $el = $container.append(Mustache.render(paneTemplate, {id: id})).find("#" + id),
            $header  = $el.find(".pane-header"),
            $content = $el.find(".pane-content");
        
        $el.on("focusin.pane", function (e) {
            self._lastFocusedElement = e.target;
        });

        this._lastFocusedElement = $el[0];
        
        // Make these properties read only
        Object.defineProperty(this,  "id", {
            get: function () {
                return id;
            },
            set: function () {
                console.error("cannot change the id of a working pane");
            }
        });

        Object.defineProperty(this,  "$el", {
            get: function () {
                return $el;
            },
            set: function () {
                console.error("cannot change the DOM node of a working pane");
            }
        });

        Object.defineProperty(this,  "$header", {
            get: function () {
                return $header;
            },
            set: function () {
                console.error("cannot change the DOM node of a working pane");
            }
        });

        Object.defineProperty(this,  "$content", {
            get: function () {
                return $content;
            },
            set: function () {
                console.error("cannot change the DOM node of a working pane");
            }
        });

        Object.defineProperty(this,  "$container", {
            get: function () {
                return $container;
            },
            set: function () {
                console.error("cannot change the DOM node of a working pane");
            }
        });

        this._updateHeaderText();

        // Listen to document events so we can update ourself
        $(DocumentManager).on(this._makeEventName("fileNameChange"),  _.bind(this._handleFileNameChange, this));
        $(DocumentManager).on(this._makeEventName("pathDeleted"), _.bind(this._handleFileDeleted, this));
        $(MainViewManager).on(this._makeEventName("activePaneChange"), _.bind(this._handleActivePaneChange, this));
    }

    /**
     * id of the pane
     * @readonly
     * @type {!string}
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
     * the wrapped DOM node that contains name of current view, or informational string if there is no view
     * @readonly
     * @type {JQuery}
     */
    Pane.prototype.$header = null;
  
    /**
     * the wrapped DOM node that contains views
     * @readonly
     * @type {JQuery}
     */
    Pane.prototype.$content = null;
  
    /**
     * The list of files views
     * @type {Array.<File>}
     */
    Pane.prototype._viewList = [];

    /**
     * The list of files views in MRU order
     * @type {Array.<File>}
     */
    Pane.prototype._viewListMRUOrder = [];

    /**
     * The list of files views in Added order
     * @type {Array.<File>}
     */
    Pane.prototype._viewListAddedOrder = [];
    
    /**
     * Dictionary mapping fullpath to view
     * @type {Object.<!string, !View>}
     * @private
     */
    Pane.prototype._views = {};

    /**
     * The current view
     * @type {?View}
     * @private
     */
    Pane.prototype._currentView = null;
    
    /**
     * The last thing that received a focus event
     * @type {?DomElement}
     * @private
     */
    Pane.prototype._lastFocusedElement = null;
    
    /**
     * Initializes the Pane to its default state
     * @private
     */
    Pane.prototype._initialize = function () {
        this._viewList = [];
        this._viewListMRUOrder = [];
        this._viewListAddedOrder = [];
        this._views = {};
        this._currentView = null;
        this.showInterstitial(true);
    };
    
   /**
     * Creates a pane event namespaced to this pane
     * (pass an empty string to generate just the namespace key to pass to jQuery to turn off all events handled by this pane)
     * @private
     * @param {!string} name - the name of the event to namespace 
     * @return {string} an event namespaced to this pane
     */
    Pane.prototype._makeEventName = function (name) {
        return name + ".pane-" + this.id;
    };

   /**
     * Reparents a view to this pane
     * @private
     * @param {!View} view - the view to reparent
     */
    Pane.prototype._reparent = function (view) {
        view.$el.appendTo(this.$content);
        this._views[view.getFile().fullPath] = view;
        if (view.notifyContainerChange) {
            view.notifyContainerChange();
        }
    };
    
    /**
     * Hides the current view if there is one, shows the 
     *  interstitial screen and notifies that the view changed
     */
    Pane.prototype._hideCurrentView = function () {
        if (this._currentView) {
            var currentView = this._currentView;
            this._setViewVisibility(this._currentView, false);
            this.showInterstitial(true);
            this._currentView = null;
            this._notifyCurrentViewChange(null, currentView);
        }
    };
    
    /**
     * Merges the another Pane object's contents into this Pane 
     * @param {!Pane} Other - Pane from which to copy 
     */
    Pane.prototype.mergeFrom = function (other) {
        // save this because we're setting it to null and we
        //  may need to destroy it if it's a temporary view
        var otherCurrentView = other._currentView;
        
        // Hide the current view while we 
        //  merge the 2 panes together
        other._hideCurrentView();
        
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
                self._reparent(view);
            } else {
                // We don't copy temporary views so destroy them
                viewsToDestroy.push(view);
            }
        });

        // 1-off views 
        if (otherCurrentView && !other._isViewNeeded(otherCurrentView) && viewsToDestroy.indexOf(otherCurrentView) === -1) {
            viewsToDestroy.push(otherCurrentView);
        }
        
        // Destroy temporary views
        _.forEach(viewsToDestroy, function (view) {
            view.destroy();
        });

        // this _reset all internal data structures
        //  and will set the current view to null 
        other._initialize();
    };
    
    /**
     * Removes the DOM node for the Pane, removes all 
     *  event handlers and _resets all internal data structures
     */
    Pane.prototype.destroy = function () {
        if (this._currentView ||
                Object.keys(this._views).length > 0 ||
                this._viewList.length > 0) {
            console.warn("destroying a pane that isn't empty");
        }

        this._reset();
        
        $(DocumentManager).off(this._makeEventName(""));
        $(MainViewManager).off(this._makeEventName(""));

        this.$el.off(".pane");
        this.$el.remove();
    };
    
   /**
     * Returns a copy of the view file list
     * @return {!Array.<File>} 
     */
    Pane.prototype.getViewList = function () {
        return _.clone(this._viewList);
    };
    
    /**
     * Returns the number of entries in the view file list
     * @return {number} 
     */
    Pane.prototype.getViewListSize = function () {
        return this._viewList.length;
    };
    
    /**
     * Returns the index of the item in the view file list 
     * @param {!string} fullPath the full path of the item to look for 
     * @return {number} index of the item or -1 if not found
     */
    Pane.prototype.findInViewList = function (fullPath) {
        return _.findIndex(this._viewList, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
    /**
     * Returns the order in which the item was added
     * @param {!string} fullPath the full path of the item to look for 
     * @return {number} order of the item or -1 if not found
     */
    Pane.prototype.findInViewListAddedOrder = function (fullPath) {
        return _.findIndex(this._viewListAddedOrder, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
   /**
     * Returns the order in which the item was last used
     * @param {!string} fullPath the full path of the item to look for 
     * @return {number} order of the item or -1 if not found. 
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
     * and the workingset does not need to be resorted
     * @see {@link reorderItem()}
     * @const 
     */
    Pane.prototype.ITEM_FOUND_NO_SORT = 0;
    
    /** 
     * Return value from reorderItem when the Item was found and reindexed 
     * and the workingset needs to be resorted
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
     * Determines if a file can be added to our file list
     * @private
     * @param {!File} file - file object to test
     * @return {boolean} true if it can be added, false if not
     */
    Pane.prototype._canAddFile = function (file) {
        return ((this._views.hasOwnProperty(file.fullPath) && this.findInViewList(file.fullPath) === -1) ||
                    (!MainViewManager._getPaneIdForPath(file.fullPath)));
    };
    
    /**
     * Adds the given file to the end of the workingset, if it is not already in the list
     * @private
     * @param {!File} file
     * @param {Object=} inPlace record with inPlace add data (index, indexRequested). Used internally
     */
    Pane.prototype._addToViewList = function (file, inPlace) {
        if (inPlace && inPlace.indexRequested) {
            // If specified, insert into the workingset at this 0-based index
            this._viewList.splice(inPlace.index, 0, file);
        } else {
            // If no index is specified, just add the file to the end of the workingset.
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
     * Adds the given file to the end of the workingset, if it is not already in the list
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
     * Adds the given file list to the end of the workingset. 
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
    
    Pane.prototype._notifyCurrentViewChange = function (newView, oldView) {
        this._updateHeaderText();
        
        $(this).triggerHandler("currentViewChange", [newView, oldView]);
    };
    
    /**
     * Removes the specifed file from all internal lists, destroys the view of the file (if there is one)
     *  and shows the interstitial page if the current view is destroyed
     * @private
     * @param {!File} file - file to remove
     * @param {boolean} preventViewChange - false to hide the current view if removing the current view, true 
     *                                      to prevent the current view from changing.
     *
     * When passing true for preventViewChange, it is assumed that the caller will perform an OPEN_FILE op
     * to show the next file in line to view.  Since the file was removed from the workingset in _doRemove
     * its view is now considered to be a temporary view and the call to showView for the OPEN_FILE op 
     * will destroy the view. the caller needs to handle the reject case in the event of failure
     *
     * @return {boolean} true if removed, false if the file was not found either in a list or view
     */
    Pane.prototype._doRemove = function (file, preventViewChange) {
        
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
            if (!preventViewChange) {
                if (this._currentView === view) {
                    // if we're removing the current
                    //  view then we need to hide the view
                    this._hideCurrentView();
                }
                delete this._views[file.fullPath];
                view.destroy();
            }
        }
        
        return ((index > -1) || Boolean(view));
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
     * Sorts items in the pane's view list
     * @param {function(paneId:!string, left:!string, right:!string):number} compareFn - the function used to compare items in the viewList
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
        var temp = this._viewList[index1];
        this._viewList[index1] = this._viewList[index2];
        this._viewList[index2] = temp;
        return true;
    };
    
    /**
     * Traverses the list and returns the File object of the next item in the MRU order
     * @param {!number} direction - Must be 1 or -1 to traverse forward or backward
     * @param {string=} current - the fullPath of the item where traversal is to start. 
     *                              If this paramater is ommitted then the path of the current view is used.
     *                              If the current view is a temporary view then the first item in the MRU list is returned
     * @return {?File}  The File object of the next item in the travesal order or null if there isn't one.
     */
    Pane.prototype.traverseViewListByMRU = function (direction, current) {
        if (!current && this._currentView) {
            var file = this._currentView.getFile();
            current = file && file.fullPath;
        }
        
        var index = current ? this.findInViewListMRUOrder(current) : -1;
        return ViewUtils.traverseViewArray(this._viewListMRUOrder, index, direction);
    };
    
    /**
     * Updates text in pane header
     * @private
     */
    Pane.prototype._updateHeaderText = function () {
        var file = this.getCurrentlyViewedFile();
        if (file) {
            this.$header.text(file.name);
        } else {
            this.$header.html(Strings.EMPTY_VIEW_HEADER);
        }
    };
    
    /**
     * Event handler when a file changes name
     * @private
     * @param {!JQuery.Event} e - jQuery event object
     * @param {!string} oldname - path of the file that was renamed
     * @param {!string} newname - the new path to the file
     */
    Pane.prototype._handleFileNameChange = function (e, oldname, newname) {
        // Check to see if we need to dispatch a viewListChange event
        // The list contains references to file objects and, for a rename event, 
        // the File object's name has changed by the time we've gotten the event.
        // So, we need to look for the file by its new name to determine if
        // if we need to dispatch the event which may look funny
        var dispatchEvent = (this.findInViewList(newname) >= 0);
        
        // rename the view 
        if (this._views.hasOwnProperty(oldname)) {
            var view = this._views[oldname];

            this._views[newname] = view;
            delete this._views[oldname];
        }
        
        this._updateHeaderText();
        
        // dispatch the change event
        if (dispatchEvent) {
            $(this).triggerHandler("viewListChange");
        }
    };

    /**
     * Event handler when a file is deleted
     * @private
     * @param {!JQuery.Event} e - jQuery event object
     * @param {!string} fullPath - path of the file that was deleted
     */
    Pane.prototype._handleFileDeleted = function (e, fullPath) {
        if (this.removeView({fullPath: fullPath})) {
            $(this).triggerHandler("viewListChange");
        }
    };
    
    /**
     * Shows the pane's interstitial page
     * @param {boolean} show - show or hide the interstitial page
     */
    Pane.prototype.showInterstitial = function (show) {
        if (this.$content) {
            this.$content.find(".not-editor").css("display", (show) ? "" : "none");
        }
    };
    
    /**
     * retrieves the view object for the given path
     * @param {!string}  path - the fullPath of the view to retrieve
     * @return {boolean} show - show or hide the interstitial page
     */
    Pane.prototype.getViewForPath = function (path) {
        return this._views[path];
    };
    
    /**
     * Adds a view to the pane
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
        
        if (view.$el.parent() !== this.$content) {
            this._reparent(view);
        } else {
            this._views[path] = view;
        }

        
        if (show) {
            this.showView(view);
        }
    };
    
    /**
     * Shows or hides a view
     * @param {!View} view - the to show or hide
     * @param {boolean} visible - true to show the view, false to hide it
     * @private
     */
    Pane.prototype._setViewVisibility = function (view, visible) {
        view.$el.css("display", (visible ? "" : "none"));
        if (view.notifyVisibilityChange) {
            view.notifyVisibilityChange(visible);
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
            this._setViewVisibility(this._currentView, true);
            this.updateLayout(true);
            return;
        }
        
        var file = view.getFile(),
            newPath = file && file.fullPath,
            oldView = this._currentView;
        
        if (this._currentView) {
            if (this._currentView.getFile()) {
                ViewStateManager.updateViewState(this._currentView);
            }
            this._setViewVisibility(this._currentView, false);
        } else {
            this.showInterstitial(false);
        }
        
        this._currentView = view;
        this._setViewVisibility(this._currentView, true);
        this.updateLayout();
        
        this._notifyCurrentViewChange(view, oldView);
        
        if (oldView) {
            this.destroyViewIfNotNeeded(oldView);
        }
        
        if (!this._views.hasOwnProperty(newPath)) {
            console.error(newPath + " found in pane working set but pane.addView() has not been called for the view created for it");
        }
    };
    
    /**
     * Update header and content height
     */
    Pane.prototype._updateHeaderHeight = function () {
        var paneContentHeight = this.$el.height();
        
        // Adjust pane content height for header
        if (MainViewManager.getPaneCount() > 1) {
            this.$header.show();
            paneContentHeight -= this.$header.outerHeight();
        } else {
            this.$header.hide();
        }
        
        this.$content.height(paneContentHeight);
    };
    
    /**
     * Sets pane content height. Updates the layout causing the current view to redraw itself
     * @param {boolean} forceRefresh - true to force a resize and refresh of the current view,
     * false if just to resize forceRefresh is only used by Editor views to force a relayout
     * of all editor DOM elements. Custom View implementations should just ignore this flag.
     */
    Pane.prototype.updateLayout = function (forceRefresh) {
        this._updateHeaderHeight();
        if (this._currentView) {
            this._currentView.updateLayout(forceRefresh);
        }
    };

    /**
     * Determines if the view can be disposed of
     * @private
     * @param {!View} view - the View object to test
     * @return {boolean}} true if the view can be disposed, false if not
     */
    Pane.prototype._isViewNeeded = function (view) {
        var path = view.getFile().fullPath,
            currentPath = this.getCurrentlyViewedPath();
        
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
        if (!this._isViewNeeded(view)) {
            var file = view.getFile(),
                path = file && file.fullPath;
            delete this._views[path];
            view.destroy();
        }
    };
    
    /**
     * _resets the pane to an empty state
     * @private
     */
    Pane.prototype._reset = function () {
        var views = [],
            view = this._currentView;

        _.forEach(this._views, function (_view) {
            views.push(_view);
        });
        
        // If the current view is a temporary view,
        //  add it to the destroy list to dispose of
        if (this._currentView && views.indexOf(this._currentView) === -1) {
            views.push(this._currentView);
        }
        
        // This will reinitialize the object back to 
        //  the default state
        this._initialize();
        
        if (view) {
            this._notifyCurrentViewChange(null, view);
        }

        // Now destroy the views
        views.forEach(function (_view) {
            _view.destroy();
        });
    };
    
    /**
     * Executes a FILE_OPEN command to open a file
     * @param  {!string} fullPath - path of the file to open
     * @return {jQuery.promise} promise that will resolve when the file is opened
     */
    Pane.prototype._execOpenFile = function (fullPath) {
        return CommandManager.execute(Commands.FILE_OPEN, { fullPath: fullPath, paneId: this.id});
    };
    
    /**
     * Removes the view and opens the next view
     * @param {File} file - the file to close
     * @param {boolean} suppressOpenNextFile - suppresses opening the next file in MRU order
     * @return {boolean} true if the file was removed from the working set
     *  This function will remove a temporary view of a file but will return false in that case
     */
    Pane.prototype.removeView = function (file, suppressOpenNextFile) {
        var nextFile = !suppressOpenNextFile && this.traverseViewListByMRU(1, file.fullPath);
        if (nextFile && nextFile.fullPath !== file.fullPath && this.getCurrentlyViewedPath() === file.fullPath) {
            var self = this,
                fullPath = nextFile.fullPath,
                needOpenNextFile = this.findInViewList(fullPath) !== -1;
            
            if (this._doRemove(file, needOpenNextFile)) {
                if (needOpenNextFile) {
                    this._execOpenFile(fullPath)
                        .fail(function () {
                            // the FILE_OPEN op failed so
                            //  we need to cleanup by hiding and destroying the current view
                            self._hideCurrentView();
                            var view = self._views[file.fullPath];
                            delete self._views[file.fullPath];
                            view.destroy();
                        });
                }
                return true;
            } else {
                // Nothing was removed so don't try to remove it again
                return false;
            }
        } else {
            return this._doRemove(file);
        }
    };
    
    /**
     * Removes the specifed file from all internal lists, destroys the view of the file (if there is one)
     *  and shows the interstitial page if the current view is destroyed. 
     * @param {!Array.<File>}  list - Array of files to remove
     * @return {!Array.<File>} Array of File objects removed from the working set. 
     *  This function will remove temporary views but the file objects for those views will not be found
     *  in the result set.  Only the file objects removed from the working set are returned.
     */
    Pane.prototype.removeViews = function (list) {
        var self = this;
        
        return list.filter(function (file) {
            return (self.removeView(file));
        });
    };
    
    /**
     * Gives focus to the last thing that had focus, the current view or the pane in that order
     */
    Pane.prototype.focus = function () {
        // Blur the currently focused element which will move focus to the BODY tag
        //  If the element we want to focus below cannot receive the input focus such as an ImageView
        //  This will remove focus from the current view which is important if the current view is 
        //  a codemirror view. 
        document.activeElement.blur();
        
        if (this._lastFocusedElement && $(this._lastFocusedElement).is(":visible")) {
            $(this._lastFocusedElement).focus();
        } else if (this._currentView) {
            this._currentView.$el.focus();
        } else {
            this.$el.focus();
        }
    };
    
    /**
     * MainViewManager.activePaneChange handler
     * @param {jQuery.event} e - event data
     * @param {!string} activePaneId - the new active pane id
     */
    Pane.prototype._handleActivePaneChange = function (e, activePaneId) {
        this.$el.toggleClass("active-pane", Boolean(activePaneId === this.id));
    };
    
    
    
    /**
     * serializes the pane state from JSON
     * @param {!Object} state - the state to load 
     * @return {jQuery.Promise} A promise which resolves to 
     *              {fullPath:string, paneId:string} 
     *              which can be passed as command data to FILE_OPEN
     */
    Pane.prototype.loadState = function (state) {
        var filesToAdd = [],
            viewStates = {},
            activeFile,
            data,
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
        
        ViewStateManager.addViewStates(viewStates);
        
        activeFile = activeFile || getInitialViewFilePath();
       
        if (activeFile) {
            data = {paneId: self.id, fullPath: activeFile};
        }
        
        return new $.Deferred().resolve(data);
    };
    
    /**
     * Returns the JSON-ified state of the object so it can be serialize
     * @return {!Object} state - the state to save 
     */
    Pane.prototype.saveState = function () {
        var view,
            result = [],
            currentlyViewedPath = this.getCurrentlyViewedPath();

        // Save the current view state first
        if (this._currentView && this._currentView.getFile()) {
            // We save the view state of the current view before 
            //  hiding the view and showing to a different file
            // But the current view's view state may not be
            //  up to date in the view state cache so update it
            //  before we save so we don't JSON-ify stale data.
            ViewStateManager.updateViewState(this._currentView);
        }
        
        // walk the list of views and save
        this._viewList.forEach(function (file) {
            // Do not persist untitled document paths
            if (!(file instanceof InMemoryFile)) {
                result.push({
                    file: file.fullPath,
                    active: (file.fullPath === currentlyViewedPath),
                    viewState:  ViewStateManager.getViewState(file)
                });
            }
        });
        
        return result;
    };
    
    /**
     * gets the current view's scroll state data
     * @return {Object=} scroll state - the current scroll state
     */
    Pane.prototype.getScrollState = function () {
        if (this._currentView && this._currentView.getScrollPos) {
            return {scrollPos: this._currentView.getScrollPos()};
        }
    };
    
    /**
     * tells the current view to restore its scroll state from cached data and apply a height delta
     * @param {Object=} state - the current scroll state
     * @param {number=} heightDelta - the amount to add or subtract from the state
     */
    Pane.prototype.restoreAndAdjustScrollState = function (state, heightDelta) {
        if (this._currentView && state && state.scrollPos && this._currentView.adjustScrollPos) {
            this._currentView.adjustScrollPos(state.scrollPos, heightDelta);
        }
    };
    
    exports.Pane = Pane;
});