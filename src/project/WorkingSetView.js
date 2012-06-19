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
/*global define, $  */

/**
 * WorkingSetView generates the UI for the list of the files user is editing based on the model provided by EditorManager.
 * The UI allows the user to see what files are open/dirty and allows them to close files and specify the current editor.
 */
define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var DocumentManager       = require("document/DocumentManager"),
        CommandManager        = require("command/CommandManager"),
        Commands              = require("command/Commands"),
        EditorManager         = require("editor/EditorManager"),
        FileViewController    = require("project/FileViewController"),
        NativeFileSystem      = require("file/NativeFileSystem"),
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
                .click(function () {
                    // Clicking the "X" button is equivalent to File > Close; it doesn't merely
                    // remove a file from the working set
                    var file = listElement.data(_FILE_KEY);
                    CommandManager.execute(Commands.FILE_CLOSE, {file: file});
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

        $newItem.mousedown(function () {
            FileViewController.openAndSelectDocument(file.fullPath, FileViewController.WORKING_SET_VIEW);
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
    function _handleDocumentSelectionChange() {
        _updateListSelection();
    }

    /** 
     * @private
     * @param {FileEntry} file 
     */
    function _handleFileRemoved(file) {
        var $listItem = _findListItemFromFile(file);
        if ($listItem) {
            $listItem.remove();
        }

        _redraw();
    }

    /** 
     * @private
     * @param {Document} doc 
     */
    function _handleDirtyFlagChanged(doc) {
        var listItem = _findListItemFromFile(doc.file);
        if (listItem) {
            var canClose = $(listItem).find("can-close").length === 1;
            _updateFileStatusIcon(listItem, doc.isDirty, canClose);
        }

    }

    function create(element) {
        // Init DOM element
        $openFilesContainer = element;
        $openFilesList = $openFilesContainer.find("ul");
        
        // Register listeners
        $(DocumentManager).on("workingSetAdd", function (event, addedFile) {
            _handleFileAdded(addedFile);
        });
    
        $(DocumentManager).on("workingSetRemove", function (event, removedFile) {
            _handleFileRemoved(removedFile);
        });
    
        $(DocumentManager).on("dirtyFlagChange", function (event, doc) {
            _handleDirtyFlagChanged(doc);
        });
    
        $(FileViewController).on("documentSelectionFocusChange", function (event, eventTarget) {
            _handleDocumentSelectionChange();
            _fireSelectionChanged();
        });
        
        // Show scroller shadows when open-files-container scrolls
        ViewUtils.addScrollerShadow($openFilesContainer[0], null, true);
        ViewUtils.sidebarList($openFilesContainer);
        
        _redraw();
    }
    
    exports.create = create;
});
