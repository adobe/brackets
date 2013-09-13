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
/*global define, $, window, brackets  */

/**
 * WorkingSetView generates the UI for the list of the files user is editing based on the model provided by EditorManager.
 * The UI allows the user to see what files are open/dirty and allows them to close files and specify the current editor.
 *
 */
define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var DocumentManager       = require("document/DocumentManager"),
        CommandManager        = require("command/CommandManager"),
        Commands              = require("command/Commands"),
        Menus                 = require("command/Menus"),
        FileViewController    = require("project/FileViewController"),
        CollectionUtils       = require("utils/CollectionUtils"),
        ViewUtils             = require("utils/ViewUtils");
    
    
    /** @const @type {number} Constants for event.which values */
    var LEFT_BUTTON = 1,
        MIDDLE_BUTTON = 2;
    
    /** Each list item in the working set stores a references to the related document in the list item's data.  
     *  Use listItem.data(_FILE_KEY) to get the document reference
     */
    var _FILE_KEY = "file",
        $workingSetHeader,
        $openFilesContainer,
        $openFilesList;
    
    /**
     * @private
     * Internal flag to suppress redrawing the Working Set after a workingSetSort event.
     * @type {boolean}
     */
    var _suppressSortRedraw = false;
    
    
    /**
     * @private
     * Redraw selection when list size changes or DocumentManager currentDocument changes.
     */
    function _fireSelectionChanged() {
        // redraw selection
        $openFilesList.trigger("selectionChanged");

        // in-lieu of resize events, manually trigger contentChanged to update scroll shadows
        $openFilesContainer.triggerHandler("contentChanged");
    }

    /**
     * @private
     * adds the style 'vertical-scroll' if a vertical scroll bar is present
     */
    function _adjustForScrollbars() {
        if ($openFilesContainer[0].scrollHeight > $openFilesContainer[0].clientHeight) {
            if (!$openFilesContainer.hasClass("vertical-scroll")) {
                $openFilesContainer.addClass("vertical-scroll");
            }
        } else {
            $openFilesContainer.removeClass("vertical-scroll");
        }
    }
    
    /**
     * @private
     * Adds directory names to elements representing passed files in working tree
     * @param {Array.<FileEntry>} filesList - list of FileEntries with the same filename
     */
    function _addDirectoryNamesToWorkingTreeFiles(filesList) {
        // filesList must have at least two files in it for this to make sense
        if (filesList.length <= 1) {
            return;
        }

        // First collect paths from the list of files and fill map with them
        var map = {}, filePaths = [], displayPaths = [];
        filesList.forEach(function (file, index) {
            var fp = file.fullPath.split("/");
            fp.pop(); // Remove the filename itself
            displayPaths[index] = fp.pop();
            filePaths[index] = fp;

            if (!map[displayPaths[index]]) {
                map[displayPaths[index]] = [index];
            } else {
                map[displayPaths[index]].push(index);
            }
        });

        // This function is used to loop through map and resolve duplicate names
        var processMap = function (map) {
            var didSomething = false;
            CollectionUtils.forEach(map, function (arr, key) {
                // length > 1 means we have duplicates that need to be resolved
                if (arr.length > 1) {
                    arr.forEach(function (index) {
                        if (filePaths[index].length !== 0) {
                            displayPaths[index] = filePaths[index].pop() + "/" + displayPaths[index];
                            didSomething = true;

                            if (!map[displayPaths[index]]) {
                                map[displayPaths[index]] = [index];
                            } else {
                                map[displayPaths[index]].push(index);
                            }
                        }
                    });
                }
                delete map[key];
            });
            return didSomething;
        };

        var repeat;
        do {
            repeat = processMap(map);
        } while (repeat);

        // Go through open files and add directories to appropriate entries
        $openFilesContainer.find("ul > li").each(function () {
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
    }

    /**
     * @private
     * Looks for files with the same name in the working set
     * and adds a parent directory name to them
     */
    function _checkForDuplicatesInWorkingTree() {
        var map = {},
            fileList = DocumentManager.getWorkingSet();

        // We need to always clear current directories as files could be removed from working tree.
        $openFilesContainer.find("ul > li > a > span.directory").remove();

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
        CollectionUtils.forEach(map, function (value) {
            if (value.length > 1) {
                _addDirectoryNamesToWorkingTreeFiles(value);
            }
        });
    }

    /**
     * @private
     * Shows/Hides open files list based on working set content.
     */
    function _redraw() {
        if (DocumentManager.getWorkingSet().length === 0) {
            $openFilesContainer.hide();
            $workingSetHeader.hide();
        } else {
            $openFilesContainer.show();
            $workingSetHeader.show();
            _checkForDuplicatesInWorkingTree();
        }
        _adjustForScrollbars();
        _fireSelectionChanged();
    }
    
    /**
     * Starts the drag and drop working set view reorder.
     * @private
     * @param {!Event} event - jQuery event
     * @paran {!HTMLLIElement} $listItem - jQuery element
     * @param {?bool} fromClose - true if reorder was called from the close icon
     */
    function _reorderListItem(event, $listItem, fromClose) {
        var $prevListItem   = $listItem.prev(),
            $nextListItem   = $listItem.next(),
            selected        = $listItem.hasClass("selected"),
            prevSelected    = $prevListItem.hasClass("selected"),
            nextSelected    = $nextListItem.hasClass("selected"),
            index           = DocumentManager.findInWorkingSet($listItem.data(_FILE_KEY).fullPath),
            height          = $listItem.height(),
            startPageY      = event.pageY,
            listItemTop     = startPageY - $listItem.offset().top,
            listItemBottom  = $listItem.offset().top + height - startPageY,
            offsetTop       = $openFilesContainer.offset().top,
            scrollElement   = $openFilesContainer.get(0),
            containerHeight = scrollElement.clientHeight,
            maxScroll       = scrollElement.scrollHeight - containerHeight,
            hasScroll       = scrollElement.scrollHeight > containerHeight,
            hasBottomShadow = scrollElement.scrollHeight > scrollElement.scrollTop + containerHeight,
            addBottomShadow = false,
            interval        = false,
            moved           = false;
        
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
                        DocumentManager.swapWorkingSetIndexes(index, --index);
                    // If moving down, place the next item before the moving item
                    } else {
                        $nextListItem.insertBefore($listItem);
                        startPageY += height;
                        top = top - height;
                        DocumentManager.swapWorkingSetIndexes(index, ++index);
                    }
                    
                    // Update the selection when the previows or next element were selected
                    if (!selected && ((top > 0 && prevSelected) || (top < 0 && nextSelected))) {
                        _fireSelectionChanged();
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
                        ViewUtils.removeScrollerShadow($openFilesContainer[0], null);
                        ViewUtils.addScrollerShadow($openFilesContainer[0], null, false);
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
                _fireSelectionChanged();
            }
            
            // Once the movement is greater than 3 pixels, it is assumed that the user wantes to reorder files and not open
            if (!moved && Math.abs(top) > 3) {
                Menus.closeAll();
                moved = true;
                
                // Don't redraw the working set for the next events
                _suppressSortRedraw = true;
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
                    var scrollTop = $openFilesContainer.scrollTop();
                    // End scroll if there isn't more to scroll
                    if ((dir === -1 && scrollTop <= 0) || (dir === 1 && scrollTop >= maxScroll)) {
                        endScroll();
                    // Scroll and drag list item
                    } else {
                        $openFilesContainer.scrollTop(scrollTop + 7 * dir);
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
                    CommandManager.execute(Commands.FILE_CLOSE, {file: $listItem.data(_FILE_KEY)});
                } else {
                    // Normal right and left click - select the item
                    FileViewController.openAndSelectDocument($listItem.data(_FILE_KEY).fullPath, FileViewController.WORKING_SET_VIEW);
                }
            
            } else {
                // Update the file selection
                if (selected) {
                    _fireSelectionChanged();
                    ViewUtils.scrollElementIntoView($openFilesContainer, $listItem, false);
                }
                
                // Restore the shadow
                if (addBottomShadow) {
                    ViewUtils.addScrollerShadow($openFilesContainer[0], null, true);
                }
                
                // The drag is done, so set back to the default
                _suppressSortRedraw = false;
            }
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
                
        // Envent Handlers
        $openFilesContainer.on("mousemove.workingSet", function (e) {
            if (hasScroll) {
                scroll(e);
            }
            drag(e);
        });
        $openFilesContainer.on("mouseup.workingSet mouseleave.workingSet", function (e) {
            $openFilesContainer.off("mousemove.workingSet mouseup.workingSet mouseleave.workingSet");
            drop();
        });
    }
    
    /** 
     * Updates the appearance of the list element based on the parameters provided
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {bool} isDirty 
     * @param {bool} canClose
     */
    function _updateFileStatusIcon(listElement, isDirty, canClose) {
        var $fileStatusIcon = listElement.find(".file-status-icon");
        var showIcon = isDirty || canClose;

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
                    _reorderListItem(e, $(this).parent(), true);
                    
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
    }
    
    /** 
     * Updates the appearance of the list element based on the parameters provided.
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {?Document} selectedDoc
     */
    function _updateListItemSelection(listItem, selectedDoc) {
        var shouldBeSelected = (selectedDoc && $(listItem).data(_FILE_KEY).fullPath === selectedDoc.file.fullPath);
        
        ViewUtils.toggleClass($(listItem), "selected", shouldBeSelected);
    }

    function isOpenAndDirty(file) {
        // working set item might never have been opened; if so, then it's definitely not dirty
        var docIfOpen = DocumentManager.getOpenDocumentForPath(file.fullPath);
        return (docIfOpen && docIfOpen.isDirty);
    }
    
    /** 
     * Builds the UI for a new list item and inserts in into the end of the list
     * @private
     * @param {FileEntry} file
     * @return {HTMLLIElement} newListItem
     */
    function _createNewListItem(file) {
        var curDoc = DocumentManager.getCurrentDocument();

        // Create new list item with a link
        var $link = $("<a href='#'></a>").html(ViewUtils.getFileEntryDisplay(file));
        var $newItem = $("<li></li>")
            .append($link)
            .data(_FILE_KEY, file);

        $openFilesContainer.find("ul").append($newItem);
        
        // Update the listItem's apperance
        _updateFileStatusIcon($newItem, isOpenAndDirty(file), false);
        _updateListItemSelection($newItem, curDoc);

        $newItem.mousedown(function (e) {
            _reorderListItem(e, $(this));
            e.preventDefault();
        });
        
        $newItem.hover(
            function () {
                _updateFileStatusIcon($(this), isOpenAndDirty(file), true);
            },
            function () {
                _updateFileStatusIcon($(this), isOpenAndDirty(file), false);
            }
        );
    }
    
    /** 
     * Deletes all the list items in the view and rebuilds them from the working set model
     * @private
     */
    function _rebuildWorkingSet(forceRedraw) {
        $openFilesContainer.find("ul").empty();

        DocumentManager.getWorkingSet().forEach(function (file) {
            _createNewListItem(file);
        });

        if (forceRedraw) {
            _redraw();
        }
    }

    /**
     * Finds the listItem item assocated with the file. Returns null if not found.
     * @private
     * @param {!FileEntry} file
     * @return {HTMLLIItem}
     */
    function _findListItemFromFile(file) {
        var result = null;

        if (file) {
            var items = $openFilesContainer.find("ul").children();
            items.each(function () {
                var $listItem = $(this);
                if ($listItem.data(_FILE_KEY).fullPath === file.fullPath) {
                    result = $listItem;
                    return false;
                    // breaks each
                }
            });
        }

        return result;
    }

    /**
     * @private
     */
    function _scrollSelectedDocIntoView() {
        if (FileViewController.getFileSelectionFocus() !== FileViewController.WORKING_SET_VIEW) {
            return;
        }

        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        var $selectedDoc = _findListItemFromFile(doc.file);
        if (!$selectedDoc) {
            return;
        }

        ViewUtils.scrollElementIntoView($openFilesContainer, $selectedDoc, false);
    }

    /** 
     * @private
     */
    function _updateListSelection() {
        var doc;
        if (FileViewController.getFileSelectionFocus() === FileViewController.WORKING_SET_VIEW) {
            doc = DocumentManager.getCurrentDocument();
        } else {
            doc = null;
        }
            
        // Iterate through working set list and update the selection on each
        var items = $openFilesContainer.find("ul").children().each(function () {
            _updateListItemSelection(this, doc);
        });

        // Make sure selection is in view
        _scrollSelectedDocIntoView();

        _fireSelectionChanged();
    }

    /** 
     * @private
     */
    function _handleFileAdded(file, index) {
        if (index === DocumentManager.getWorkingSet().length - 1) {
            // Simple case: append item to list
            _createNewListItem(file);
            _redraw();
        } else {
            // Insertion mid-list: just rebuild whole list UI
            _rebuildWorkingSet(true);
        }
    }

    /**
     * @private
     */
    function _handleFileListAdded(files) {
        files.forEach(function (file) {
            _createNewListItem(file);
        });
        _redraw();
    }

    /** 
     * @private
     * @param {FileEntry} file
     * @param {boolean=} suppressRedraw If true, suppress redraw
     */
    function _handleFileRemoved(file, suppressRedraw) {
        if (!suppressRedraw) {
            var $listItem = _findListItemFromFile(file);
            if ($listItem) {
                // Make the next file in the list show the close icon, 
                // without having to move the mouse, if there is a next file.
                var $nextListItem = $listItem.next();
                if ($nextListItem && $nextListItem.length > 0) {
                    var canClose = ($listItem.find(".can-close").length === 1);
                    var isDirty = isOpenAndDirty($nextListItem.data(_FILE_KEY));
                    _updateFileStatusIcon($nextListItem, isDirty, canClose);
                }
                $listItem.remove();
            }
            
            _redraw();
        }
    }

    function _handleRemoveList(removedFiles) {
        removedFiles.forEach(function (file) {
            var $listItem = _findListItemFromFile(file);
            if ($listItem) {
                $listItem.remove();
            }
        });

        _redraw();
    }
    
    /**
     * @private
     */
    function _handleWorkingSetSort() {
        if (!_suppressSortRedraw) {
            _rebuildWorkingSet(true);
        }
    }

    /** 
     * @private
     * @param {Document} doc 
     */
    function _handleDirtyFlagChanged(doc) {
        var listItem = _findListItemFromFile(doc.file);
        if (listItem) {
            var canClose = $(listItem).find(".can-close").length === 1;
            _updateFileStatusIcon(listItem, doc.isDirty, canClose);
        }

    }

    /**
     * @private
     * @param {string} oldName
     * @param {string} newName
     */
    function _handleFileNameChanged(oldName, newName) {
        // Rebuild the working set if any file or folder name changed.
        // We could be smarter about this and only update the
        // nodes that changed, if needed...
        _rebuildWorkingSet(true);
    }
    
    function refresh() {
        _redraw();
    }
    
    function create(element) {
        // Init DOM element
        $openFilesContainer = element;
        $workingSetHeader = $("#working-set-header");
        $openFilesList = $openFilesContainer.find("ul");
        
        // Register listeners
        $(DocumentManager).on("workingSetAdd", function (event, addedFile) {
            _handleFileAdded(addedFile);
        });

        $(DocumentManager).on("workingSetAddList", function (event, addedFiles) {
            _handleFileListAdded(addedFiles);
        });

        $(DocumentManager).on("workingSetRemove", function (event, removedFile, suppressRedraw) {
            _handleFileRemoved(removedFile, suppressRedraw);
        });

        $(DocumentManager).on("workingSetRemoveList", function (event, removedFiles) {
            _handleRemoveList(removedFiles);
        });
        
        $(DocumentManager).on("workingSetSort", function (event) {
            _handleWorkingSetSort();
        });

        $(DocumentManager).on("dirtyFlagChange", function (event, doc) {
            _handleDirtyFlagChanged(doc);
        });
    
        $(DocumentManager).on("fileNameChange", function (event, oldName, newName) {
            _handleFileNameChanged(oldName, newName);
        });
        
        $(FileViewController).on("documentSelectionFocusChange fileViewFocusChange", _updateListSelection);
        
        // Show scroller shadows when open-files-container scrolls
        ViewUtils.addScrollerShadow($openFilesContainer[0], null, true);
        ViewUtils.sidebarList($openFilesContainer);
        
        // Disable horizontal scrolling until WebKit bug #99379 is fixed
        $openFilesContainer.css("overflow-x", "hidden");
        
        _redraw();
    }
    
    exports.create  = create;
    exports.refresh = refresh;
});
