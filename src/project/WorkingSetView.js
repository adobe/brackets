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
/*global define, $, window, brackets, Mustache  */

/**
 * WorkingSetView generates the UI for the list of the files user is editing based on the model provided by EditorManager.
 * The UI allows the user to see what files are open/dirty and allows them to close files and specify the current editor.
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var DocumentManager       = require("document/DocumentManager"),
        MainViewManager       = require("view/MainViewManager"),
        CommandManager        = require("command/CommandManager"),
        Commands              = require("command/Commands"),
        Menus                 = require("command/Menus"),
        FileViewController    = require("project/FileViewController"),
        ViewUtils             = require("utils/ViewUtils"),
        KeyEvent              = require("utils/KeyEvent"),
        paneListTemplate      = require("text!htmlContent/working-set.html"),
        Strings               = require("strings"),
        _                     = require("thirdparty/lodash");
    
    
    /**
     * Currently open views
     * @private
     * @type {Array.WorkingSetView}
     * 
     */
    var _views = [];
    
    /**
     * Constants for event.which values
     * @enum {number}
     */
    var LEFT_BUTTON = 1,
        MIDDLE_BUTTON = 2;
    
    /**
     * Each list item in the working set stores a references to the related document in the list item's data.  
     *  Use `listItem.data(_FILE_KEY)` to get the document reference
     * @type {string}
     * @private
     */
    var _FILE_KEY = "file";
    
    /**
     * Constants for hitTest.where 
     * @enum {string}
     */
    var NOMANSLAND = "nomansland",
        ABOVEITEM = "aboveitem",
        BELOWITEM = "belowitem",
        TOPSCROLL = "topscroll",
        BOTSCROLL = "bottomscroll",
        BELOWVIEW = "belowview",
        ABOVEVIEW = "aboveview";
    
    
    /**
     * Refreshes all Pane View List Views
     */
    function refresh(rebuild) {
        _.forEach(_views, function (view) {
            if (rebuild) {
                view._rebuildViewList(true);
            } else {
                view._redraw();
            }
        });
    }
    
    /** 
     * Synchronizes the selection indicator for all views
     */
    function syncSelectionIndicator() {
        _.forEach(_views, function (view) {
            view.$openFilesContainer.triggerHandler("scroll");
        });
    }
    
    /**
     * Updates the appearance of the list element based on the parameters provided.
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {?File} selectedFile
     */
    function _updateListItemSelection(listItem, selectedFile) {
        var shouldBeSelected = (selectedFile && $(listItem).data(_FILE_KEY).fullPath === selectedFile.fullPath);
        
        ViewUtils.toggleClass($(listItem), "selected", shouldBeSelected);
    }


    /**
     * Determines if a file is dirty
     * @private
     * @param {!File} file - file to test
     * @return {boolean} true if the file is dirty, false otherwise
     */
    function _isOpenAndDirty(file) {
        // working set item might never have been opened; if so, then it's definitely not dirty
        var docIfOpen = DocumentManager.getOpenDocumentForPath(file.fullPath);
        return (docIfOpen && docIfOpen.isDirty);
    }
    
    
    /** 
     * Turns on/off the flag which suppresses rebuilding of the working set 
     * when the "workingSetSort" event is dispatched from MainViewManager
     * Only used while dragging things around in the workingset to disable
     * rebuilding the list while dragging.
     * @private
     * @param {boolean} suppress - true suppress, false to allow sort redrawing
     */
    function _suppressSortRedrawForAllViews(suppress) {
        _.forEach(_views, function (view) {
            view.suppressSortRedraw = suppress;
        });
    }
    
    
    /** 
     * Updates the selection index for all views and fires a selection change
     * event on the view if the selection index chnages from the previously 
     * cached value. This synchromizes the "selection" affordance 
     * @private
     * @param {jQuery} $el - the element that was moved
     */
    function _updateSelectionStateForAllViews($el) {
        var currentFile = MainViewManager.getCurrentlyViewedFile();

        _.forEach(_views, function (view) {

            if ($el && $el.data(_FILE_KEY) === currentFile && view.$el.find($el).length) {
                view.$el.addClass("active");
                view.$openFilesContainer.addClass("active");
                view.$el.find("li.selected").removeClass("selected").addClass("reselect");
                $el.addClass("selected").removeClass("reselect");
            } else {
                if (view.paneId !== MainViewManager.getActivePaneId()) {
                    view.$el.removeClass("active");
                }
                
                var paneFile = MainViewManager.getCurrentlyViewedFile(view.paneId);
                view.$el.find("li.selected").removeClass("selected").addClass("reselect");
                var $selected = view._findListItemFromFile(paneFile);
                if ($selected) {
                    $selected.addClass("selected").removeClass("reselect");
                }
            }
            
            view._fireSelectionChanged();
        });
        // update the selection marker
        syncSelectionIndicator();
    }
    
    /** 
     * Finds the WorkingsetView object for the specified element
     * @private
     * @param {jQuery} $el - the element to find the view for
     */
    function _viewFromEl($el) {
        if (!$el.hasClass("working-set-view")) {
            $el = $el.parents(".working-set-view");
        }

        return _.find(_views, function (view) {
            return (view.$el[0] === $el[0]);
        });
    }
    
    /** 
     * Makes the specified element draggable
     * @private
     * @param {jQuery} $el - the element to make draggable
     */
    function _makeDraggable($el) {
        var interval,
            sorceFile = $el.data(_FILE_KEY);

        // turn off the "hover-scroll" 
        function endScroll() {
            if (interval) {
                window.clearInterval(interval);
                interval = undefined;
            }
        }
        
        //  We scroll the list while hovering over the first or last visible list element
        //  in the working set, so that positioning a working set item before or after one
        //  that has been scrolled out of view can be performed.
        // 
        //  This function will call the drag interface repeatedly on an interval to allow
        //  the item to be dragged while scrolling the list until the mouse is moved off 
        //  the first or last item and end scroll is called
        function scroll($el, dir, callback) {
            var el = $el[0],
                maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll && dir && !interval) {
                // Scroll view if the mouse is over the first or last pixels of the container
                interval = window.setInterval(function () {
                    var scrollTop = $el.scrollTop();
                    if ((dir === -1 && scrollTop <= 0) || (dir === 1 && scrollTop >= maxScroll)) {
                        endScroll();
                    } else {
                        $el.scrollTop(scrollTop + 7 * dir);
                        callback();
                    }
                }, 100);
            } else if (!dir && interval) {
                endScroll();
            }
        }
        
        // The mouse down handler pretty much handles everything
        $el.mousedown(function (e) {
            var scrollDir = 0,
                dragged = false,
                startPageY = e.pageY,
                itemHeight = $el.height(),
                tryClosing = $(document.elementFromPoint(e.pageX, e.pageY)).hasClass("can-close"),
                offset = $el.offset(),
                $copy = $el.clone(),
                $ghost = $("<div class='open-files-container wsv-drag-ghost' style='overflow: hidden; display: inline-block;'>").append($("<ul>").append($copy).css("padding", "0")),
                sourceView = _viewFromEl($el),
                isCurrentDocument = ($el.hasClass("selected") && sourceView.paneId === MainViewManager.getActivePaneId()),
                startingIndex = MainViewManager.findInWorkingSet(sourceView.paneId, sorceFile.fullPath),
                currentView = sourceView;



            // Switches the context to the working 
            //  set container and view specfied by $container
            //  and updates the state variables for the container
            function updateContext(hit, $elem) {
                // just set the container and update
                currentView = _viewFromEl(hit.which);
                _updateSelectionStateForAllViews($elem);
                $ghost.find("li").attr("class", $elem.attr("class"));
            }
            
            // Determines where the mouse hit was
            function hitTest(e) {
                var result = {
                        where: NOMANSLAND
                    },
                    $hit,
                    onScroller = false;

                // Turn off the ghost so elementFromPoint ignores it
                $ghost.hide();

                $hit = $(document.elementFromPoint(e.pageX, e.pageY)).closest("#working-set-list-container li");
              
                if (!$hit.length) {
                    $hit = $(document.elementFromPoint(e.pageX, e.pageY + itemHeight)).closest("#working-set-list-container li");
                    onScroller = ($hit.length > 0);
                }

                if (!$hit.length) {
                    $hit = $(document.elementFromPoint(e.pageX, e.pageY - itemHeight)).closest("#working-set-list-container li");
                    onScroller = ($hit.length > 0);
                }
              
                // helper to see if the mouse is above 
                //  or below the specified element
                function mouseIsAbove($elem) {
                    var top = $elem.offset().top,
                        height = $elem.height();
                    
                    return (e.pageY < (top + height / 2));
                }
              
                // We hit an item (li)
                if ($hit.length) {
                    if (mouseIsAbove($hit)) {
                        result = {
                            where: (onScroller) ? TOPSCROLL : ABOVEITEM,
                            which: $hit
                        };
                    } else {
                        result = {
                            where: (onScroller) ? BOTSCROLL : BELOWITEM,
                            which: $hit
                        };
                    }
                } else {
                    // we didn't hit an (li) so look for 
                    //  where the mouse is relative to the view
                    $hit = $(document.elementFromPoint(e.pageX, e.pageY));

                    if ($hit.parent().is(".working-set-view")) {
                        $hit = $hit.parent();
                    }
                    // if we hit a view then we're good to go
                    //  otherwise we'll just return nomansland
                    if ($hit.is(".working-set-view")) {
                        if (mouseIsAbove($hit)) {
                            result = {
                                where: ABOVEVIEW,
                                which: $hit
                            };
                        } else {
                            result = {
                                where: BELOWVIEW,
                                which: $hit
                            };
                        }
                    }
                }

                // turn the ghost back on
                //  and bail with the result
                $ghost.show();
                return result;

            }
   
            // mouse move handler -- this pretty much does
            //  the heavy lifting for dragging the item around
            $(window).on("mousemove.wsvdragging", function (e) {

                function drag(e) {
                    // we've dragged the item so set
                    //  dragged to true so we don't try and open it
                    dragged = true;
                    // reset the scrolling direction to no-scroll
                    scrollDir = 0;
                    // reset start so we don't drag again until the mouse 
                    //  is moved 3 pixels to help prevent jitter
                    startPageY = e.pageY;
                    // Find out where to to drag it to
                    var ht = hitTest(e);
                    
                    if (ht.where !== NOMANSLAND) {
                        switch (ht.where) {
                        case TOPSCROLL:
                        case ABOVEITEM:
                            if (ht.where === TOPSCROLL) {
                                scrollDir = -1;
                            }
                            $el.insertBefore(ht.which);
                            updateContext(ht, $el);
                            break;
                        case BOTSCROLL:
                        case BELOWITEM:
                            if (ht.where === BOTSCROLL) {
                                scrollDir = 1;
                            }
                            $el.insertAfter(ht.which);
                            updateContext(ht, $el);
                            break;
                        case BELOWVIEW:
                            $el.appendTo(ht.which.find("ul"));
                            updateContext(ht, $el);
                            break;
                        case ABOVEVIEW:
                            $el.prependTo(ht.which.find("ul"));
                            updateContext(ht, $el);
                            break;
                        }
                    }

                    // move the drag affordance
                    $ghost.css("top", e.pageY);

                    // we need to scroll
                    if (scrollDir) {
                        // we're in range to scroll
                        scroll(currentView.$openFilesContainer, scrollDir, function () {
                            // as we scroll, recompute the element and insert
                            //  it before/after the item to drag it in to place
                            drag(e);
                        });
                    } else {
                        // we've moved away from the top/bottom "scrolling" region
                        endScroll();
                    }
                }
                
                // if we have't started dragging yet then we wait until
                //  the mouse has moved 3 pixels before we start dragging
                //  to avoid the item moving when clicked or double clicked
                if (Math.abs(e.pageY - startPageY) > 3) {
                    drag(e);
                }

            });
            
            // Close down the drag operation
            function preDropCleanup() {
                endScroll();
                // turn scroll wheel back on
                window.onmousewheel = window.document.onmousewheel = null;
                $(window).off(".wsvdragging");
                $ghost.remove();
                $el.css("opacity", "");
            }
            
            function postDropCleanup() {
                _suppressSortRedrawForAllViews(false);
                refresh(true);
                MainViewManager.focusActivePane();
            }
            
            // Drop
            function drop() {
                preDropCleanup();
                // didn't change position or working set
                if (sourceView.paneId === currentView.paneId && startingIndex === $el.index()) {
                    // if the item was dragged but not moved then don't open or close 
                    if (!dragged) {
                        // Click on close icon, or middle click anywhere - close the item without selecting it first
                        if (tryClosing || e.which === MIDDLE_BUTTON) {
                            CommandManager.execute(Commands.FILE_CLOSE, {file: sorceFile,
                                                                         paneId: sourceView.paneId});
                        } else {
                            // Normal right and left click - select the item
                            FileViewController.openAndSelectDocument(sorceFile.fullPath,
                                                                     FileViewController.WORKING_SET_VIEW,
                                                                     currentView.paneId);
                        }
                    }
                    postDropCleanup();
                } else if (sourceView.paneId === currentView.paneId) {
                    // item was reordered 
                    MainViewManager._moveWorkingSetItem(sourceView.paneId, startingIndex, $el.index());
                    postDropCleanup();
                } else {
                    // item was dragged to another working set
                    MainViewManager._moveView(sourceView.paneId, currentView.paneId, sorceFile, $el.index())
                        .always(function () {
                            // if the current document was dragged to another workingset 
                            //  then reopen it to make it the currently selected file
                            if (isCurrentDocument) {
                                CommandManager
                                    .execute(Commands.FILE_OPEN, {fullPath: sorceFile.fullPath,
                                                                   paneId: currentView.paneId})
                                    .always(function () {
                                        postDropCleanup();
                                    });
                            } else {
                                postDropCleanup();
                            }
                        });
                }
            }

            // initialization
            $(window).on("mouseup.wsvdragging", function (e) {
                drop();
            });
            
            // let escape cancel the drag
            $(window).on("keydown.wsvdragging", function (e) {
                if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                    preDropCleanup();
                    postDropCleanup();
                    e.stopPropagation();
                }
            });
            
            // turn off scroll wheel
            window.onmousewheel = window.document.onmousewheel = function (e) {
                e.preventDefault();
            };

            // close all menus, and disable sorting 
            Menus.closeAll();
            
            _suppressSortRedrawForAllViews(true);
            
            // Dragging only happens with the left mouse button
            //  or (on the Mac) when the ctrl key isn't pressed
            if (e.which !== LEFT_BUTTON || (e.ctrlKey && brackets.platform === "mac")) {
                drop();
                return;
            }
            
            // setup our ghost element as position absolute
            //  so we can put it wherever we want to while dragging
            $ghost.css({position: "absolute",
                            top: offset.top,
                            left: offset.left});
            
            // this will give the element the appearence that it's ghosted if the user
            //  drags the element out of the view and goes off into no mans land
            $el.css("opacity", ".25");
            $ghost.appendTo($("body"));
        });
    }
    
    
    /* 
     * WorkingSetView constructor
     * @constructor
     * @param {!jQuery} $container - owning container
     * @param {!string} paneId - paneId of this view pertains to
     */
    function WorkingSetView($container, paneId) {
        var id = "working-set-list-" + paneId;
        
        this.$header = null;
        this.$openFilesList = null;
        this.$container = $container;
        this.$el = $container.append(Mustache.render(paneListTemplate, _.extend({id: id}, Strings))).find("#" + id);
        this.suppressSortRedraw = false;
        this.paneId = paneId;
        
        this.init();
    }

    /*
     * Hides or shows the WorkingSetView
     */
    WorkingSetView.prototype._updateVisibility = function () {
        var fileList = MainViewManager.getWorkingSet(this.paneId);
        if (MainViewManager.getPaneCount() === 1 && (!fileList || fileList.length === 0)) {
            this.$openFilesContainer.hide();
            this.$workingSetListViewHeader.hide();
        } else {
            this.$openFilesContainer.show();
            this.$workingSetListViewHeader.show();
            this._checkForDuplicatesInWorkingTree();
        }
    };
    
    /*
     * paneLayoutChange event listener
     * @private
     */
    WorkingSetView.prototype._handlePaneLayoutChange = function () {
        var $titleEl = this.$el.find(".working-set-header-title"),
            title = Strings.WORKING_FILES;
        
        this._updateVisibility();
        
        if (MainViewManager.getPaneCount() > 1) {
            title = MainViewManager.getPaneTitle(this.paneId);
        }
        
        $titleEl.text(title);
    };

    /**
     * Finds the listItem item assocated with the file. Returns null if not found.
     * @private
     * @param {!File} file
     * @return {HTMLLIItem} returns the DOM element of the item. null if one could not be found
     */
    WorkingSetView.prototype._findListItemFromFile = function (file) {
        var result = null;

        if (file) {
            var items = this.$openFilesContainer.find("ul").children();
            items.each(function () {
                var $listItem = $(this);
                if ($listItem.data(_FILE_KEY).fullPath === file.fullPath) {
                    result = $listItem;
                    return false; // breaks each
                }
            });
        }

        return result;
    };

    /*
     * creates a name that is namespaced to this pane
     * @param {!string} name - name of the event to create.
     * use an empty string to get just the event name to turn off all events in the namespace
     * @private
     */
    WorkingSetView.prototype._makeEventName = function (name) {
        return name + ".paneList" + this.paneId;
    };
    

    /**
     * Scrolls the selected file into view
     * @private
     */
    WorkingSetView.prototype._scrollSelectedFileIntoView = function () {
        if (FileViewController.getFileSelectionFocus() !== FileViewController.WORKING_SET_VIEW) {
            return;
        }

        var file = MainViewManager.getCurrentlyViewedFile(this.paneId);

        var $selectedFile = this._findListItemFromFile(file);
        if (!$selectedFile) {
            return;
        }

        ViewUtils.scrollElementIntoView(this.$openFilesContainer, $selectedFile, false);
    };

    /**
     * Redraw selection when list size changes or DocumentManager currentDocument changes.
     * @private
     */
    WorkingSetView.prototype._fireSelectionChanged = function () {
        this._scrollSelectedFileIntoView();

        if (FileViewController.getFileSelectionFocus() === FileViewController.WORKING_SET_VIEW && this.$el.hasClass("active")) {
            this.$openFilesList.trigger("selectionChanged");
        } else {
            this.$openFilesList.trigger("selectionHide");
        }
        // in-lieu of resize events, manually trigger contentChanged to update scroll shadows
        this.$openFilesContainer.trigger("contentChanged");
    };

    /**
     * adds the style 'vertical-scroll' if a vertical scroll bar is present
     * @private
     */
    WorkingSetView.prototype._adjustForScrollbars = function () {
        if (this.$openFilesContainer[0].scrollHeight > this.$openFilesContainer[0].clientHeight) {
            if (!this.$openFilesContainer.hasClass("vertical-scroll")) {
                this.$openFilesContainer.addClass("vertical-scroll");
            }
        } else {
            this.$openFilesContainer.removeClass("vertical-scroll");
        }
    };
    
    /**
     * Adds directory names to elements representing passed files in working tree
     * @private
     * @param {Array.<File>} filesList - list of Files with the same filename
     */
    WorkingSetView.prototype._addDirectoryNamesToWorkingTreeFiles = function (filesList) {
        // filesList must have at least two files in it for this to make sense
        if (filesList.length <= 1) {
            return;
        }

        var displayPaths = ViewUtils.getDirNamesForDuplicateFiles(filesList);

        // Go through open files and add directories to appropriate entries
        this.$openFilesContainer.find("ul > li").each(function () {
            var $li = $(this);
            var io = filesList.indexOf($li.data(_FILE_KEY));
            if (io !== -1) {
                var dirSplit = displayPaths[io].split("/");
                if (dirSplit.length > 3) {
                    displayPaths[io] = dirSplit[0] + "/\u2026/" + dirSplit[dirSplit.length - 1];
                }

                var $dir = $("<span class='directory'/>").html(" &mdash; " + displayPaths[io]);
                $li.children("a").append($dir);
            }
        });
    };

    /**
     * Looks for files with the same name in the working set
     * and adds a parent directory name to them
     * @private
     */
    WorkingSetView.prototype._checkForDuplicatesInWorkingTree = function () {
        var self = this,
            map = {},
            fileList = MainViewManager.getWorkingSet(MainViewManager.ALL_PANES);

        // We need to always clear current directories as files could be removed from working tree.
        this.$openFilesContainer.find("ul > li > a > span.directory").remove();

        // Go through files and fill map with arrays of files.
        fileList.forEach(function (file) {
            // Use the same function that is used to create html for file.
            var displayHtml = ViewUtils.getFileEntryDisplay(file);

            if (!map[displayHtml]) {
                map[displayHtml] = [];
            }
            map[displayHtml].push(file);
        });

        // Go through the map and solve the arrays with length over 1. Ignore the rest.
        _.forEach(map, function (value) {
            if (value.length > 1) {
                self._addDirectoryNamesToWorkingTreeFiles(value);
            }
        });
    };

    /**
     * Shows/Hides open files list based on working set content.
     * @private
     */
    WorkingSetView.prototype._redraw = function () {
        this._updateViewState();
        this._updateVisibility();
        this._adjustForScrollbars();
        this._fireSelectionChanged();
    };
    
    /**
     * activePaneChange event handler
     * @private
     */
    WorkingSetView.prototype._handleActivePaneChange = function () {
        this._redraw();
    };
    
    /**
     * Updates the appearance of the list element based on the parameters provided
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {bool} isDirty 
     * @param {bool} canClose
     */
    WorkingSetView.prototype._updateFileStatusIcon = function (listElement, isDirty, canClose) {
        var $fileStatusIcon = listElement.find(".file-status-icon"),
            showIcon = isDirty || canClose;

        // remove icon if its not needed
        if (!showIcon && $fileStatusIcon.length !== 0) {
            $fileStatusIcon.remove();
            $fileStatusIcon = null;
            
        // create icon if its needed and doesn't exist
        } else if (showIcon && $fileStatusIcon.length === 0) {
            
            $fileStatusIcon = $("<div class='file-status-icon'></div>")
                .prependTo(listElement);
        }

        // Set icon's class
        if ($fileStatusIcon) {
            ViewUtils.toggleClass($fileStatusIcon, "dirty", isDirty);
            ViewUtils.toggleClass($fileStatusIcon, "can-close", canClose);
        }
    };
    
    /**
     * Builds the UI for a new list item and inserts in into the end of the list
     * @private
     * @param {File} file
     * @return {HTMLLIElement} newListItem
     */
    WorkingSetView.prototype._createNewListItem = function (file) {
        var self = this,
            selectedFile = MainViewManager.getCurrentlyViewedFile(this.paneId);

        // Create new list item with a link
        var $link = $("<a href='#'></a>").html(ViewUtils.getFileEntryDisplay(file));
        var $newItem = $("<li></li>")
            .append($link)
            .data(_FILE_KEY, file);

        this.$openFilesContainer.find("ul").append($newItem);
        
        // Update the listItem's apperance
        this._updateFileStatusIcon($newItem, _isOpenAndDirty(file), false);
        _updateListItemSelection($newItem, selectedFile);
        _makeDraggable($newItem);
        
        $newItem.hover(
            function () {
                self._updateFileStatusIcon($(this), _isOpenAndDirty(file), true);
            },
            function () {
                self._updateFileStatusIcon($(this), _isOpenAndDirty(file), false);
            }
        );
    };
    
    /**
     * Deletes all the list items in the view and rebuilds them from the working set model
     * @private
     */
    WorkingSetView.prototype._rebuildViewList = function (forceRedraw) {
        var self = this,
            fileList = MainViewManager.getWorkingSet(this.paneId);

        this.$openFilesContainer.find("ul").empty();
        
        fileList.forEach(function (file) {
            self._createNewListItem(file);
        });

        if (forceRedraw) {
            self._redraw();
        }
    };

    /**
     * Updates the pane view's selection state 
     * @private
     */
    WorkingSetView.prototype._updateViewState = function () {
        var paneId = MainViewManager.getActivePaneId();
        if ((FileViewController.getFileSelectionFocus() === FileViewController.WORKING_SET_VIEW) &&
                (paneId === this.paneId)) {
            this.$el.addClass("active");
            this.$openFilesContainer.addClass("active");
        } else {
            this.$el.removeClass("active");
            this.$openFilesContainer.removeClass("active");
        }
    };
    
    /**
     * Updates the pane view's selection marker and scrolls the item into view
     * @private
     */
    WorkingSetView.prototype._updateListSelection = function () {
        var file = MainViewManager.getCurrentlyViewedFile(this.paneId);
        
        this._updateViewState();
        
        // Iterate through working set list and update the selection on each
        this.$openFilesContainer.find("ul").children().each(function () {
            _updateListItemSelection(this, file);
        });

        // Make sure selection is in view
        this._scrollSelectedFileIntoView();
        this._fireSelectionChanged();
    };

    /**
     * workingSetAdd event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!File} fileAdded - the file that was added
     * @param {!number} index - index where the file was added
     * @param {!string} paneId - the id of the pane the item that was to
     */
    WorkingSetView.prototype._handleFileAdded = function (e, fileAdded, index, paneId) {
        if (paneId === this.paneId) {
            this._rebuildViewList(true);
        } else {
            this._checkForDuplicatesInWorkingTree();
        }
    };

    /**
     * workingSetAddList event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!Array.<File>} files - the files that were added
     * @param {!string} paneId - the id of the pane the item that was to
     */
    WorkingSetView.prototype._handleFileListAdded = function (e, files, paneId) {
        if (paneId === this.paneId) {
            this._rebuildViewList(true);
        } else {
            this._checkForDuplicatesInWorkingTree();
        }
    };

    /**
     * workingSetRemove event handler
     * @private 
     * @param {jQuery.Event} e - event object
     * @param {!File} file - the file that was removed
     * @param {?boolean} suppressRedraw If true, suppress redraw
     * @param {!string} paneId - the id of the pane the item that was to
     */
    WorkingSetView.prototype._handleFileRemoved = function (e, file, suppressRedraw, paneId) {
        /* 
         * The suppressRedraw flag is used in cases when we are replacing the working
         * set entry with another one. There are only 2 use cases for this:
         *
         *      1) When an untitled document is being saved.
         *      2) When a file is saved with a new name.
         */
        if (paneId === this.paneId) {
            if (!suppressRedraw) {
                var $listItem = this._findListItemFromFile(file);
                if ($listItem) {
                    // Make the next file in the list show the close icon, 
                    // without having to move the mouse, if there is a next file.
                    var $nextListItem = $listItem.next();
                    if ($nextListItem && $nextListItem.length > 0) {
                        var canClose = ($listItem.find(".can-close").length === 1);
                        var isDirty = _isOpenAndDirty($nextListItem.data(_FILE_KEY));
                        this._updateFileStatusIcon($nextListItem, isDirty, canClose);
                    }
                    $listItem.remove();
                }

                this._redraw();
            }
        } else {
            /*
             * When this event is handled by a pane that is not being updated then 
             * the suppressRedraw flag does not need to be respected.  
             * _checkForDuplicatesInWorkingTree() does not remove any entries so it's
             * safe to call at any time.
             */
            this._checkForDuplicatesInWorkingTree();
        }
    };

    /**
     * workingSetRemoveList event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!Array.<File>} files - the files that were removed
     * @param {!string} paneId - the id of the pane the item that was to
     */
    WorkingSetView.prototype._handleRemoveList = function (e, files, paneId) {
        var self = this;
        if (paneId === this.paneId) {
            files.forEach(function (file) {
                var $listItem = self._findListItemFromFile(file);
                if ($listItem) {
                    $listItem.remove();
                }
            });

            this._redraw();
        } else {
            this._checkForDuplicatesInWorkingTree();
        }
    };
    
    /**
     * workingSetSort event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!string} paneId - the id of the pane to sort
     */
    WorkingSetView.prototype._handleWorkingSetSort = function (e, paneId) {
        if (!this.suppressSortRedraw && paneId === this.paneId) {
            this._rebuildViewList(true);
        }
    };

    /**
     * dirtyFlagChange event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {Document} doc - document whose dirty state has changed
     */
    WorkingSetView.prototype._handleDirtyFlagChanged = function (e, doc) {
        var listItem = this._findListItemFromFile(doc.file);
        if (listItem) {
            var canClose = $(listItem).find(".can-close").length === 1;
            this._updateFileStatusIcon(listItem, doc.isDirty, canClose);
        }
    };
    
    /**
     * workingSetUpdate event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!string} paneId - the id of the pane to update
     */
    WorkingSetView.prototype._handleWorkingSetUpdate = function (e, paneId) {
        if (this.paneId === paneId) {
            this._rebuildViewList(true);
        } else {
            this._checkForDuplicatesInWorkingTree();
        }
    };
    

    /**
     * Initializes the WorkingSetView object
     */
    WorkingSetView.prototype.init = function () {
        this.$openFilesContainer = this.$el.find(".open-files-container");
        this.$workingSetListViewHeader = this.$el.find(".working-set-header");
        
        this.$openFilesList = this.$el.find("ul");
        
        // Register listeners
        $(MainViewManager).on(this._makeEventName("workingSetAdd"), _.bind(this._handleFileAdded, this));
        $(MainViewManager).on(this._makeEventName("workingSetAddList"), _.bind(this._handleFileListAdded, this));
        $(MainViewManager).on(this._makeEventName("workingSetRemove"), _.bind(this._handleFileRemoved, this));
        $(MainViewManager).on(this._makeEventName("workingSetRemoveList"), _.bind(this._handleRemoveList, this));
        $(MainViewManager).on(this._makeEventName("workingSetSort"), _.bind(this._handleWorkingSetSort, this));
        $(MainViewManager).on(this._makeEventName("activePaneChange"), _.bind(this._handleActivePaneChange, this));
        $(MainViewManager).on(this._makeEventName("paneLayoutChange"), _.bind(this._handlePaneLayoutChange, this));
        $(MainViewManager).on(this._makeEventName("workingSetUpdate"), _.bind(this._handleWorkingSetUpdate, this));

        $(DocumentManager).on(this._makeEventName("dirtyFlagChange"), _.bind(this._handleDirtyFlagChanged, this));

        $(FileViewController).on(this._makeEventName("documentSelectionFocusChange") + " " + this._makeEventName("fileViewFocusChange"), _.bind(this._updateListSelection, this));
        
        // Show scroller shadows when open-files-container scrolls
        ViewUtils.addScrollerShadow(this.$openFilesContainer[0], null, true);
        ViewUtils.sidebarList(this.$openFilesContainer);
        
        // Disable horizontal scrolling until WebKit bug #99379 is fixed
        this.$openFilesContainer.css("overflow-x", "hidden");
        
        this.$openFilesContainer.on("contextmenu.workingSetView", function (e) {
            Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_CONTEXT_MENU).open(e);
        });

        this._redraw();
    };

    /**
     * Destroys the WorkingSetView DOM element and removes all event handlers
     */
    WorkingSetView.prototype.destroy = function () {
        this.$openFilesContainer.off(".workingSetView");
        this.$el.remove();
        $(MainViewManager).off(this._makeEventName(""));
        $(DocumentManager).off(this._makeEventName(""));
        $(FileViewController).off(this._makeEventName(""));
    };
    
    /**
     * paneDestroy event handler
     */
    $(MainViewManager).on("paneDestroy", function (e, paneId) {
        var index = _.findIndex(_views, function (workingSetListView) {
            return workingSetListView.paneId === paneId;
        });
        
        if (index >= 0) {
            var views = _views.splice(index, 1);
            _.forEach(views, function (view) {
                view.destroy();
            });
        }
    });

    /**
     * Creates a new WorkingSetView object for the specified pane
     * @param {!jQuery} $container - the WorkingSetView's DOM parent node
     * @param {!string} paneId - the id of the pane the view is being created for
     */
    function createWorkingSetViewForPane($container, paneId) {
        // make sure the pane doesn't already have a view
        var index = _.findIndex(_views, function (workingSetListView) {
            return workingSetListView.paneId === paneId;
        });

        // if there wasn't already a view for the pane then create a new one
        if (index === -1) {
            _views.push(new WorkingSetView($container, paneId));
        }
    }
    
    
    // Public API
    exports.createWorkingSetViewForPane   = createWorkingSetViewForPane;
    exports.refresh                       = refresh;
    exports.syncSelectionIndicator        = syncSelectionIndicator;
});
