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
        EditorManager       = require("editor/EditorManager"),
        DocumentManager     = require("Document/DocumentManager"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        paneTemplate        = require("text!htmlContent/pane.html");
    
    function Pane(id, $container) {
        this.$container = $container;
        this.id = id;
        this._viewList = [];
        this._viewListMRUOrder = [];
        this._viewListAddedOrder = [];
        this._currentView = null;
        this.$el = $container.append(Mustache.render(paneTemplate, {id: id})).find("#" + id);
        this.views = {
        };
        
        $(DocumentManager).on("fileNameChange",  this._handleFileNameChange);
        $(DocumentManager).on("pathDeleted", this._handleFileDeleted);
    }

    Pane.prototype.ITEM_NOT_FOUND = -1;
    Pane.prototype.ITEM_FOUND_NO_SORT = 0;
    Pane.prototype.ITEM_FOUND_NEEDS_SORT = 1;
    
    Pane.prototype.destroy = function () {
        $(DocumentManager).off("fileNameChange",  this._handleFileNameChange);
        this.$container.find("#" + this.id).remove();
    };
    
    Pane.prototype.getViewList = function () {
        return _.clone(this._viewList);
    };
    
    Pane.prototype.getViewListSize = function () {
        return this._viewList.length;
    };
    
    Pane.prototype.findInViewList = function (fullPath) {
        return _.findIndex(this._viewList, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
    Pane.prototype.findInViewListAddedOrder = function (fullPath) {
        return _.findIndex(this._viewListAddedOrder, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
    Pane.prototype.findInViewListMRUOrder = function (fullPath) {
        return _.findIndex(this._viewListMRUOrder, function (file) {
            return file.fullPath === fullPath;
        });
    };
    
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
    
    Pane.prototype._addToViewList = function (file, inPlace) {
        if (inPlace && inPlace.indexRequested) {
            // If specified, insert into the pane view list at this 0-based index
            this._viewList.splice(inPlace.index, 0, file);
        } else {
            // If no index is specified, just add the file to the end of the pane view list.
            this._viewList.push(file);
        }
        
        // Add to MRU order: either first or last, depending on whether it's already the current doc or not
        var currentPath = EditorManager.getCurrentlyViewedPath();
        if (currentPath && currentPath === file.fullPath) {
            this._viewListMRUOrder.unshift(file);
        } else {
            this._viewListMRUOrder.push(file);
        }
        
        // Add first to Added order
        this._viewListAddedOrder.unshift(file);
    };
    
    Pane.prototype.addToViewList = function (file, index) {
        var indexRequested = (index !== undefined && index !== null && index >= 0);

        this._addToViewList(file, {indexRequested: indexRequested, index: index});
        
        if (!indexRequested) {
            index = this._viewList.length - 1;
        }
        
        return index;
    };
            
    Pane.prototype.addListToViewList = function (fileList) {
        var self = this,
            uniqueFileList = [];

        // Process only files not already in view list
        fileList.forEach(function (file) {
            if (EditorManager.canOpenFile(file.fullPath) && this.findInViewList(file.fullPath) === -1) {
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
        this._viewList.splice(index, 1);
        this._viewListMRUOrder.splice(this.findInViewListMRUOrder(file.fullPath), 1);
        this._viewListAddedOrder.splice(this.findInViewListAddedOrder(file.fullPath), 1);

        // Destroy the view
        var view = this.views[file.fullPath];

        if (view) {
            if (this._currentView === view) {
                this._currentView = null;
            }
            delete this.views[file.fullPath];
            view.destroy();
        }
        
        // No views to display?
        if (Object.keys(this.views).length === 0) {
            this.showInterstitial(true);
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
            this._viewListMRUOrder.splice(index, 1);
            this._viewListMRUOrder.unshift(file);
        }
    };
    
    Pane.prototype.sortViewList = function (compareFn) {
        this._viewList.sort(compareFn);
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

        if (!current) {
            current = this.getPathForView(this._currentView);
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
        var updateList = function (list) {
            var index = _.indexOf(list, oldname);

            if (index >= 0) {
                list[index] = newname;
            }
        };

        if (this.views.hasOwnProperty(oldname)) {
            var view = this.views[oldname];
            
            this.views[newname] = view;
            delete this.views[oldname];
        }

        updateList(this._viewList);
        updateList(this._viewListMRUOrder);
        updateList(this._viewListAddedOrder);
    };

    Pane.prototype._handleFileDeleted = function (e, file) {
        this.doRemoveFile(file);
    };
    
    Pane.prototype.showInterstitial = function (show) {
        this.$el.find(".not-editor").css("display", (show) ? "" : "none");
    };
    
    Pane.prototype.removeCustomViewer = function () {
        // TODO
    };
    
    Pane.prototype.getViewForPath = function (path) {
        return this.views[path];
    };
    
    Pane.prototype.getPathForView = function (view) {
        return this.views[_.findKey(this.views, function (val) {
            return val === view;
        })];
    };
    
    
    Pane.prototype.addView = function (path, view, show) {
        this.views[path] = view;
        if (show) {
            this.showView(view);
        }
    };
    
    Pane.prototype.showView = function (view) {
        var oldView = this._currentView,
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
            if (!this.findInViewList(oldPath)) {
                delete this.views[oldPath];
                oldView.destroy();
            }
        }
    };
    
    Pane.prototype.doRemoveViewOf = function (file) {
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
    
    Pane.prototype.updateLayout = function (hint) {
        if (this._currentView) {
            this._currentView.resizeToFit(hint);
        }
    };
    
    Pane.prototype.isViewNeeded = function (file) {
        return (this._currentView.getFullPath === file.fullPath ||
                this.findInViewList(file.fullPath));
    };
    
    Pane.prototype.getCurrentlyViewedFile = function () {
        return this._currentView ? this._currentView.getFile() : null;
    };
    
    Pane.prototype.destroyViewIfNotNeeded = function (view) {
        var path = view.getFullPath();
        if (!this.isViewNeeded(path)) {
            delete this.views[path];
            view.destroy();
        }
    };
    
    Pane.prototype.doRemoveAllViews = function () {
        this._viewList = [];
        this._viewListMRUOrder = [];
        this._viewListAddedOrder = [];
        this.showInterstitial(true);
        this._currentView = null;
        
        _.forEach(this._views, function (view) {
            delete this.views[view.getFullPath()];
            view.destroy();
        });
    };
    
    exports.Pane = Pane;
});