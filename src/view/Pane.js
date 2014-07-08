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
    
    function Pane(id, $container) {
        this.$container = $container;
        this.id = id;
        this.viewList = [];
        this.viewListMRUOrder = [];
        this.viewListAddedOrder = [];
        this.currentView = null;
        this.$el = $container.append(Mustache.render(paneTemplate, {id: id})).find("#" + id);
        this.views = {};
        
        $(DocumentManager).on(this._makeEventName("fileNameChange"),  _.bind(this._handleFileNameChange, this));
        $(DocumentManager).on(this._makeEventName("pathDeleted"), _.bind(this._handleFileDeleted, this));
    }
    
    Pane.prototype.ITEM_NOT_FOUND = -1;
    Pane.prototype.ITEM_FOUND_NO_SORT = 0;
    Pane.prototype.ITEM_FOUND_NEEDS_SORT = 1;

    Pane.prototype._makeEventName = function (name) {
        return name + ".pane" + this.paneId;
    };
    
    Pane.prototype.mergeWith = function (other) {
        this.viewList = _.union(this.viewList, other.viewList);
        this.viewListMRUOrder = _.union(this.viewListMRUOrder, other.viewListMRUOrder);
        this.viewListAddedOrder = _.union(this.viewListAddedOrder, other.viewListAddedOrder);

        other.showInterstitial(true);
        
        var self = this,
            viewsToDestroy = [];
        
        _.forEach(other.views, function (view) {
            // We don't copy temporary views
            if (other.findInViewList(view.getFullPath()) !== -1) {
                view.switchContainers(self.$el);
            } else {
                viewsToDestroy.push(view);
            }
        });
        
        _.forEach(viewsToDestroy, function (view) {
            view.destroy();
        });
        
        other.views = {};
        other.viewList = [];
        other.viewListMRUOrder = [];
        other.viewListAddedOrder = [];
    };
    
    Pane.prototype.destroy = function () {
        $(DocumentManager).off(this._makeEventName(""));
        this.$container.find("#" + this.id).remove();
    };
    
    Pane.prototype.getViewList = function () {
        return _.clone(this.viewList);
    };
    
    Pane.prototype.getViewListSize = function () {
        return this.viewList.length;
    };
    
    Pane.prototype.findInViewList = function (fullPath) {
        return _.findIndex(this.viewList, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
    Pane.prototype.findInViewListAddedOrder = function (fullPath) {
        return _.findIndex(this.viewListAddedOrder, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
    Pane.prototype.findInViewListMRUOrder = function (fullPath) {
        return _.findIndex(this.viewListMRUOrder, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
    Pane.prototype.getInitialViewFilePath = function () {
        return (this.viewList.length > 0) ? this.viewList[0].fullPath : null;
    };
    
    Pane.prototype.reorderItem = function (file, index, force) {
        var indexRequested = (index !== undefined && index !== null && index >= 0),
            curIndex = this.findInViewList(file.fullPath);
        
        if (curIndex !== -1) {
            // File is in view list, but not at the specifically requested index - only need to reorder
            if (force || (indexRequested && curIndex !== index)) {
                var entry = this.viewList.splice(curIndex, 1)[0];
                this.viewList.splice(index, 0, entry);
                return this.ITEM_FOUND_NEEDS_SORT;
            }
            return this.ITEM_FOUND_NO_SORT;
        }
        
        return this.ITEM_NOT_FOUND;
    };
    
    Pane.prototype._addToViewList = function (file, inPlace) {
        if (!((file instanceof File) || (file instanceof InMemoryFile))) {
            return;
        }
        
        if (inPlace && inPlace.indexRequested) {
            // If specified, insert into the pane view list at this 0-based index
            this.viewList.splice(inPlace.index, 0, file);
        } else {
            // If no index is specified, just add the file to the end of the pane view list.
            this.viewList.push(file);
        }
        
        // Add to MRU order: either first or last, depending on whether it's already the current doc or not
        var currentPath = this.getCurrentlyViewedPath();
        if (currentPath && currentPath === file.fullPath) {
            this.viewListMRUOrder.unshift(file);
        } else {
            this.viewListMRUOrder.push(file);
        }
        
        // Add first to Added order
        this.viewListAddedOrder.unshift(file);
    };
    
    Pane.prototype.addToViewList = function (file, index) {
        var indexRequested = (index !== undefined && index !== null && index >= 0);

        this._addToViewList(file, {indexRequested: indexRequested, index: index});
        
        if (!indexRequested) {
            index = this.viewList.length - 1;
        }
        
        return index;
    };
            
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
    
    Pane.prototype._removeFromViewList = function (file) {
        // If doc isn't in view list, do nothing
        var index = this.findInViewList(file.fullPath);
        
        if (index === -1) {
            return false;
        }
        
        // Remove
        this.viewList.splice(index, 1);
        this.viewListMRUOrder.splice(this.findInViewListMRUOrder(file.fullPath), 1);
        this.viewListAddedOrder.splice(this.findInViewListAddedOrder(file.fullPath), 1);

        // Destroy the view
        var view = this.views[file.fullPath];

        if (view) {
            if (this.currentView === view) {
                this.showInterstitial(true);
            }
            delete this.views[file.fullPath];
            view.destroy();
        }
        
        return true;
    };

    Pane.prototype.removeFromViewList = function (file) {
        return this._removeFromViewList(file);
    };
    
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
    
    Pane.prototype.removeAllFromViewList = function () {
        var fileList = this.getViewList();
        this.reset();
        return fileList;
    };
    
    Pane.prototype.makeViewMostRecent = function (file) {
        var index = this.findInViewListMRUOrder(file.fullPath);
        if (index !== -1) {
            this.viewListMRUOrder.splice(index, 1);
            this.viewListMRUOrder.unshift(file);
        }
    };
    
    Pane.prototype.sortViewList = function (compareFn) {
        this.viewList.sort(compareFn);
    };

    Pane.prototype._isViewListIndexInRange = function (index) {
        var length = this.viewList.length;
        return index !== undefined && index !== null && index >= 0 && index < length;
    };
    
    Pane.prototype.swapViewListIndexes = function (index1, index2) {
        if (this._isViewListIndexInRange(index1) && this._isViewListIndexInRange(index2)) {
            var temp = this.viewList[index1];
            this.viewList[index1] = this.viewList[index2];
            this.viewList[index2] = temp;
            return true;
        }
        return false;
    };
    
    Pane.prototype.traverseViewListByMRU = function (direction, current) {
        if (Math.abs(direction) !== 1) {
            console.error("traverseViewList called with unsupported direction: " + direction.toString());
            return null;
        }

        if (!current && this.currentView) {
            current = this.getPathForView(this.currentView);
        }
        
        var index = this.findInViewListMRUOrder(current);
        if (index === -1) {
            // If doc not in view list, return most recent view list item
            if (this.viewListMRUOrder.length > 0) {
                return this.viewListMRUOrder[0];
            }
        } else if (this.viewListMRUOrder.length > 1) {
            // If doc is in view list, return next/prev item with wrap-around
            index += direction;
            if (index >= this.viewListMRUOrder.length) {
                index = 0;
            } else if (index < 0) {
                index = this.viewListMRUOrder.length - 1;
            }

            return this.viewListMRUOrder[index];
        }
        
        // If no doc open or view list empty, there is no "next" file
        return null;
    };
    
    Pane.prototype._handleFileNameChange = function (e, oldname, newname) {
        if (this.findInViewList(newname) >= 0) {
            if (this.views.hasOwnProperty(oldname)) {
                var view = this.views[oldname];

                this.views[newname] = view;
                delete this.views[oldname];
            }
            $(this).triggerHandler("viewListChanged");
        }
    };

    Pane.prototype._handleFileDeleted = function (e, fullPath) {
        if (this.findInViewList(fullPath) >= 0) {
            this.doRemoveView({fullPath: fullPath});
            $(this).triggerHandler("viewListChanged");
        }
    };
    
    Pane.prototype.showInterstitial = function (show) {
        if (this.currentView) {
            this.currentView.setVisible(false);
            this.currentView = null;
        }
        this.$el.find(".not-editor").css("display", (show) ? "" : "none");
    };
    
    Pane.prototype.getViewForPath = function (path) {
        return this.views[path];
    };
    
    Pane.prototype.getPathForView = function (view) {
        return view.getFile().fullPath;
    };
    
    Pane.prototype.addView = function (path, view, show) {
        this.views[path] = view;
        if (show) {
            this.showView(view);
        }
    };
    
    Pane.prototype.showView = function (view) {
        if (!view) {
            return;
        }
        
        var oldView = this.currentView,
            oldPath = oldView ? oldView.getFullPath() : undefined;
        
        if (this.currentView) {
            this.currentView.setVisible(false);
        } else {
            this.showInterstitial(false);
        }
        
        this.currentView = view;
        this.currentView.setVisible(true);
        
        this.updateLayout();
        
        if (oldPath) {
            // Destroy any view that was currently shown
            //  that is not in the view pane list 
            if (this.findInViewList(oldPath) === -1) {
                delete this.views[oldPath];
                oldView.destroy();
            }
        }
    };
    
    Pane.prototype.updateLayout = function (hint) {
        if (this.currentView) {
            this.currentView.resizeToFit(hint);
        }
    };
    
    Pane.prototype.isViewNeeded = function (view) {
        if (!view) {
            return false;
        }
        var path = view.getFullPath();
        return ((this.currentView && this.currentView.getFullPath() === path) || (this.findInViewList(path) !== -1));
    };
    
    Pane.prototype.getCurrentlyViewedFile = function () {
        return this.currentView ? this.currentView.getFile() : null;
    };
    
    Pane.prototype.getCurrentlyViewedPath = function () {
        var file = this.getCurrentlyViewedFile();
        return file ? file.fullPath : null;
    };
    
    Pane.prototype.destroyViewIfNotNeeded = function (view) {
        if (view && !this.isViewNeeded(view)) {
            delete this.views[view.getFullPath()];
            view.destroy();
        }
    };
    
    Pane.prototype.doRemoveAllViews = function () {
        this.viewList = [];
        this.viewListMRUOrder = [];
        this.viewListAddedOrder = [];
        this.showInterstitial(true);
        this.currentView = null;
        
        _.forEach(this._views, function (view) {
            delete this.views[view.getFullPath()];
            view.destroy();
        });
    };
    
    Pane.prototype.doRemoveViews = function (fileList) {
        var result = this.removeListFromViewList(fileList);
        
        var viewNeedsClosing = function (fullPath) {
            return _.findIndex(this.viewListAddedOrder, function (file) {
                return file.fullPath === fullPath;
            });
        };
        
        _.forEach(this._views, function (view) {
            var viewPath = view.getFullPath();
            if (viewNeedsClosing(viewPath)) {
                delete this.views[viewPath];
                view.destroy();
            }
        });
        
        return result;
    };
    
    Pane.prototype.doRemoveView = function (file) {
        var nextFile = this.traverseViewListByMRU(1, file.fullPath);
        if (nextFile) {
            if (this.views.hasOwnProperty(nextFile)) {
                this.showView(this.views[nextFile]);
            } else {
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: nextFile.fullPath,
                                                             paneId: this.id});
            }
        }
        this._removeFromViewList(file);
    };
    
    Pane.prototype.focus = function () {
        if (this.currentView && (!this.currentView.hasFocus() && !this.currentView.childHasFocus())) {
            this.currentView.focus();
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
            activeFile;
        
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
        
        // TODO: Do we want EditorManager to manage the view state
        //          for files that it doesn't actually manage?
        EditorManager.addViewStates(viewStates);
        
        activeFile = activeFile || this.getInitialViewFilePath();
        
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
        
        this.viewList.forEach(function (file) {
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
    
    exports.Pane = Pane;
});