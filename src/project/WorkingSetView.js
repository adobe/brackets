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
/*global define, $, window  */

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
        ViewUtils             = require("utils/ViewUtils");
    
    
    /** Each list item in the working set stores a references to the related document in the list item's data.  
     *  Use listItem.data(_FILE_KEY) to get the document reference
     */
    var _FILE_KEY = "file",
        $openFilesContainer,
        $openFilesList;
    
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
     * Shows/Hides open files list based on working set content.
     */
    function _redraw() {
        if (DocumentManager.getWorkingSet().length === 0) {
            $openFilesContainer.hide();
        } else {
            $openFilesContainer.show();
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
            
            // If file wasnt moved open or close it
            if (!moved) {
                if (!fromClose) {
                    FileViewController.openAndSelectDocument($listItem.data(_FILE_KEY).fullPath, FileViewController.WORKING_SET_VIEW);
                } else {
                    CommandManager.execute(Commands.FILE_CLOSE, {file: $listItem.data(_FILE_KEY)});
                }
            } else if (moved) {
                if (selected) {
                    // Update the file selection
                    _fireSelectionChanged();
                    ViewUtils.scrollElementIntoView($openFilesContainer, $listItem, false);
                }
                if (addBottomShadow) {
                    // Restore the shadows
                    ViewUtils.addScrollerShadow($openFilesContainer[0], null, true);
                }
            }
        }
        
        
        // Only drag with the left mouse button, end the drop in other cases
        if (event.which !== 1) {
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
            // cast to Boolean needed because toggleClass() distinguishes true/false from truthy/falsy
            $fileStatusIcon.toggleClass("dirty", Boolean(isDirty));
            $fileStatusIcon.toggleClass("can-close", Boolean(canClose));
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
        
        // cast to Boolean needed because toggleClass() distinguishes true/false from truthy/falsy
        $(listItem).toggleClass("selected", Boolean(shouldBeSelected));
    }

    function isOpenAndDirty(file) {
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
        var $link = $("<a href='#'></a>").text(file.name);
        var $newItem = $("<li></li>")
            .append($link)
            .data(_FILE_KEY, file);

        $openFilesContainer.find("ul").append($newItem);
        
        // working set item might never have been opened; if so, then it's definitely not dirty

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
    function _rebuildWorkingSet() {
        $openFilesContainer.find("ul").empty();

        DocumentManager.getWorkingSet().forEach(function (file) {
            _createNewListItem(file);
        });

        _redraw();
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
    function _handleFileAdded(file) {
        _createNewListItem(file);
        _redraw();
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
     */
    function _handleDocumentSelectionChange() {
        _updateListSelection();
        _fireSelectionChanged();
    }

    /** 
     * @private
     * @param {FileEntry} file 
     */
    function _handleFileRemoved(file) {
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
        _rebuildWorkingSet();
        _scrollSelectedDocIntoView();
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
        _rebuildWorkingSet();
    }
    
    function create(element) {
        // Init DOM element
        $openFilesContainer = element;
        $openFilesList = $openFilesContainer.find("ul");
        
        // Register listeners
        $(DocumentManager).on("workingSetAdd", function (event, addedFile) {
            _handleFileAdded(addedFile);
        });

        $(DocumentManager).on("workingSetAddList", function (event, addedFiles) {
            _handleFileListAdded(addedFiles);
        });

        $(DocumentManager).on("workingSetRemove", function (event, removedFile) {
            _handleFileRemoved(removedFile);
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
        
        $(FileViewController).on("documentSelectionFocusChange fileViewFocusChange", _handleDocumentSelectionChange);
        
        // Show scroller shadows when open-files-container scrolls
        ViewUtils.addScrollerShadow($openFilesContainer[0], null, true);
        ViewUtils.sidebarList($openFilesContainer);
        
        // Disable horizontal scrolling until WebKit bug #99379 is fixed
        $openFilesContainer.css("overflow-x", "hidden");
        
        _redraw();
    }
    
    exports.create = create;
});
