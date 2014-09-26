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
     * Icon Providers
     * @see {@link WorkingSetView#addIconProvider()}
     * @private
     */
    var _iconProviders = [];
    
    /**
     * Class Providers
     * @see {@link WorkingSetView#addClassProvider()}
     * @private
     */
    var _classProviders = [];
        

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
        this._updateItemClasses();
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
     * Starts the drag and drop working set view reorder.
     * @private
     * @param {!Event} event - jQuery event
     * @param {!HTMLLIElement} $listItem - jQuery element
     * @param {?bool} fromClose - true if reorder was called from the close icon
     */
    WorkingSetView.prototype._reorderListItem = function (event, $listItem, fromClose) {
        var self            = this,
            $prevListItem   = $listItem.prev(),
            $nextListItem   = $listItem.next(),
            selected        = $listItem.hasClass("selected"),
            prevSelected    = $prevListItem.hasClass("selected"),
            nextSelected    = $nextListItem.hasClass("selected"),
            index           = MainViewManager.findInWorkingSet(self.paneId, $listItem.data(_FILE_KEY).fullPath),
            height          = $listItem.height(),
            startPageY      = event.pageY,
            listItemTop     = startPageY - $listItem.offset().top,
            listItemBottom  = $listItem.offset().top + height - startPageY,
            offsetTop       = this.$openFilesContainer.offset().top,
            scrollElement   = this.$openFilesContainer.get(0),
            containerHeight = scrollElement.clientHeight,
            maxScroll       = scrollElement.scrollHeight - containerHeight,
            hasScroll       = scrollElement.scrollHeight > containerHeight,
            hasBottomShadow = scrollElement.scrollHeight > scrollElement.scrollTop + containerHeight,
            addBottomShadow = false,
            interval        = false,
            moved           = false;
        
        // Don't redraw the working set for the next events
        self.suppressSortRedraw = true;
        
        function drag(e) {
            var top = e.pageY - startPageY;
            
            // Drag if the item is not the first and moving it up or
            // if the item is not the last and moving down
            if (($prevListItem.length && top < 0) || ($nextListItem.length && top > 0)) {
                // Reorder the list once the item is halfway to the new position
                if (Math.abs(top) > height / 2) {
                    // If moving up, place the previows item after the moving item
                    if (top < 0) {
                        $prevListItem.insertAfter($listItem);
                        startPageY -= height;
                        top = top + height;
                        MainViewManager._swapWorkingSetListIndexes(self.paneId, index, --index);
                    // If moving down, place the next item before the moving item
                    } else {
                        $nextListItem.insertBefore($listItem);
                        startPageY += height;
                        top = top - height;
                        MainViewManager._swapWorkingSetListIndexes(self.paneId, index, ++index);
                    }
                    
                    // Update the selection when the previows or next element were selected
                    if (!selected && ((top > 0 && prevSelected) || (top < 0 && nextSelected))) {
                        self._fireSelectionChanged();
                    }
                    
                    // Update the previows and next items
                    $prevListItem = $listItem.prev();
                    $nextListItem = $listItem.next();
                    prevSelected  = $prevListItem.hasClass("selected");
                    nextSelected  = $nextListItem.hasClass("selected");

                    // If the last item of the list was selected and the previows was moved to its location, then
                    // the it will show a bottom shadow even if it shouldnt because of the way the scrollHeight is 
                    // handle with relative position. This will remove that shadow and add it on drop. 
                    if (!addBottomShadow && !hasBottomShadow && !$nextListItem.length && prevSelected) {
                        ViewUtils.removeScrollerShadow(self.$openFilesContainer[0], null);
                        ViewUtils.addScrollerShadow(self.$openFilesContainer[0], null, false);
                        addBottomShadow = true;
                    }
                }
            // Set the top to 0 as the event probably didnt fired at the exact start/end of the list 
            } else {
                top = 0;
            }
            
            // Move the item
            $listItem.css("top", top + "px");
            
            // Update the selection position
            if (selected) {
                self._fireSelectionChanged();
            }
            
            // Once the movement is greater than 3 pixels, it is assumed that the user wantes to reorder files and not open
            if (!moved && Math.abs(top) > 3) {
                Menus.closeAll();
                moved = true;
                
                // Don't redraw the working set for the next events
                self.suppressSortRedraw = true;
            }
        }
        
        function endScroll() {
            window.clearInterval(interval);
            interval = false;
        }
        
        function scroll(e) {
            var dir = 0;
            // Mouse over the first visible pixels and moving up
            if (e.pageY - listItemTop < offsetTop + 7) {
                dir = -1;
            // Mouse over the last visible pixels and moving down
            } else if (e.pageY + listItemBottom > offsetTop + containerHeight - 7) {
                dir = 1;
            }
            
            if (dir && !interval) {
                // Scroll view if the mouse is over the first or last pixels of the container
                interval = window.setInterval(function () {
                    var scrollTop = self.$openFilesContainer.scrollTop();
                    // End scroll if there isn't more to scroll
                    if ((dir === -1 && scrollTop <= 0) || (dir === 1 && scrollTop >= maxScroll)) {
                        endScroll();
                    // Scroll and drag list item
                    } else {
                        self.$openFilesContainer.scrollTop(scrollTop + 7 * dir);
                        startPageY -= 7 * dir;
                        drag(e);
                    }
                }, 100);
            } else if (!dir && interval) {
                endScroll();
            }
        }
        
        function drop() {
            // Enable Mousewheel
            window.onmousewheel = window.document.onmousewheel = null;
            
            // Removes the styles, placing the item in the chosen place
            $listItem.removeAttr("style");
            
            // End the scrolling if needed
            if (interval) {
                window.clearInterval(interval);
            }
            
            // If item wasn't dragged, treat as a click
            if (!moved) {
                // Click on close icon, or middle click anywhere - close the item without selecting it first
                if (fromClose || event.which === MIDDLE_BUTTON) {
                    CommandManager.execute(Commands.FILE_CLOSE, {file: $listItem.data(_FILE_KEY),
                                                                 paneId: self.paneId});
                } else {
                    // Normal right and left click - select the item
                    FileViewController.openAndSelectDocument($listItem.data(_FILE_KEY).fullPath,
                                                             FileViewController.WORKING_SET_VIEW,
                                                             self.paneId);
                }
            
            } else {
                // Update the file selection
                if (selected) {
                    self._fireSelectionChanged();
                    ViewUtils.scrollElementIntoView(self.$openFilesContainer, $listItem, false);
                }
                
                // Restore the shadow
                if (addBottomShadow) {
                    ViewUtils.addScrollerShadow(self.$openFilesContainer[0], null, true);
                }
            }
            // The drag is done, so set back to the default
            self.suppressSortRedraw = false;
        }
        
        
        // Only drag with the left mouse button, and control key is not down
        // on Mac, end the drop in other cases
        if (event.which !== LEFT_BUTTON || (event.ctrlKey && brackets.platform === "mac")) {
            drop();
            return;
        }
        
        // Disable Mousewheel while dragging
        window.onmousewheel = window.document.onmousewheel = function (e) {
            e.preventDefault();
        };
        
        // Style the element
        $listItem.css("position", "relative").css("z-index", 1);
        
        var $holder = $(window);
        
        // Event Handlers
        $holder.on(self._makeEventName("mousemove"), function (e) {
            if (hasScroll) {
                scroll(e);
            }
            drag(e);
        });
        $holder.on(self._makeEventName("mouseup"), function (e) {
            $holder.off(self._makeEventName(""));
            drop();
        });
    };
    
    /** 
     * Updates the appearance of the list element based on the parameters provided
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {bool} isDirty 
     * @param {bool} canClose
     */
    WorkingSetView.prototype._updateFileStatusIcon = function (listElement, isDirty, canClose) {
        var self = this,
            $fileStatusIcon = listElement.find(".file-status-icon"),
            showIcon = isDirty || canClose;

        // remove icon if its not needed
        if (!showIcon && $fileStatusIcon.length !== 0) {
            $fileStatusIcon.remove();
            $fileStatusIcon = null;
            
        // create icon if its needed and doesn't exist
        } else if (showIcon && $fileStatusIcon.length === 0) {
            
            $fileStatusIcon = $("<div class='file-status-icon'></div>")
                .prependTo(listElement)
                .mousedown(function (e) {
                    // Try to drag if that is what is wanted if not it will be the equivalent to File > Close;
                    // it doesn't merely remove a file from the working set
                    self._reorderListItem(e, $(this).parent(), true);
                    
                    // stopPropagation of mousedown for fileStatusIcon so the parent <LI> item, which
                    // selects documents on mousedown, doesn't select the document in the case 
                    // when the click is on fileStatusIcon
                    e.stopPropagation();
                });
        }

        // Set icon's class
        if ($fileStatusIcon) {
            ViewUtils.toggleClass($fileStatusIcon, "dirty", isDirty);
            ViewUtils.toggleClass($fileStatusIcon, "can-close", canClose);
        }
    };
    
    /** 
     * Updates the working set item class list
     * @private
     */
    WorkingSetView.prototype._updateItemClasses = function () {
        if (_classProviders.length > 0) {
            this.$openFilesContainer.find("ul > li").each(function () {
                var $li = $(this),
                    file = $li.data(_FILE_KEY),
                    data = {fullPath: file.fullPath,
                            name: file.name,
                            isFile: file.isFile};
                $li.removeAttr("class");
                _classProviders.forEach(function (provider) {
                    $li.addClass(provider(data));
                });
            });
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
            selectedFile = MainViewManager.getCurrentlyViewedFile(this.paneId),
            data = {fullPath: file.fullPath,
                    name: file.name,
                    isFile: file.isFile};

        // Create new list item with a link
        var $link = $("<a href='#'></a>").html(ViewUtils.getFileEntryDisplay(file));
           
        _iconProviders.forEach(function (provider) {
            var icon = provider(data);
            if (icon) {
                $link.prepend($(icon));
            }
        });
        
        var $newItem = $("<li></li>")
            .append($link)
            .data(_FILE_KEY, file);

        this.$openFilesContainer.find("ul").append($newItem);
        
        _classProviders.forEach(function (provider) {
            $newItem.addClass(provider(data));
        });
        
        // Update the listItem's apperance
        this._updateFileStatusIcon($newItem, _isOpenAndDirty(file), false);
        _updateListItemSelection($newItem, selectedFile);

        $newItem.mousedown(function (e) {
            self._reorderListItem(e, $(this));
            e.preventDefault();
        });
        
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

  /** 
     * Refreshes all Pane View List Views
     * @param {boolean=} reconstruct - completely rebuilds the view list
     */
    function refresh(reconstruct) {
        _.forEach(_views, function (view) {
            if (reconstruct) {
                view._rebuildViewList();
            } else {
                view._redraw();
            }
        });
    }
    
    /** 
     * adds an icon provider to the view.  
     * Icon providers are called when a working set item is created
     * @param {!function(!{fullPath:string, name:string, isFile:boolean}):?string|jQuery} callback - the function to call for each item
     * The callback must return the html to place before the link of each WSV item. 
     *  The return value can be a string representing the HTML, a jQuery object or undefined.
     * if a falsy value is returned then nothing is prepended to the list item
     */
    function addIconProvider(callback) {
        if (!callback) {
            return;
        }
        _iconProviders.push(callback);
        // build all views so the provider has a chance to add icons
        //    to all items that have already been created
        refresh(true);
    }
    
    /** 
     * adds a list item class provider to the view.  
     * Class providers are called when a working set item is created
     * @param {!function(!{fullPath:string, name:string, isFile:boolean}):?string} callback - the function to call for each item
     * The callback can return a string that contains the class (or classes) to add to the list item
     */
    function addClassProvider(callback) {
        if (!callback) {
            return;
        }
        _classProviders.push(callback);
        // build all views so the provider has a chance to style
        //    all items that have already been created
        refresh(true);
    }
    
    /** 
     * Synchronizes the selection indicator for all views
     */
    function syncSelectionIndicator() {
        _.forEach(_views, function (workingSetListView) {
            workingSetListView.$openFilesContainer.triggerHandler("scroll");
        });
    }
    
    // Public API
    exports.createWorkingSetViewForPane   = createWorkingSetViewForPane;
    exports.refresh                       = refresh;
    exports.addIconProvider               = addIconProvider;
    exports.addClassProvider              = addClassProvider;
    exports.syncSelectionIndicator        = syncSelectionIndicator;
});
