/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: true  */

/**
 * WorkingSetView generates the UI for the list of the files user is editing based on the model provided by EditorManager.
 * The UI allows the user to see what files are open/dirty and allows them to close files and specify the current editor.
 */
define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var DocumentManager       = require("DocumentManager"),
        CommandManager        = require("CommandManager"),
        Commands              = require("Commands"),
        EditorManager         = require("EditorManager"),
        FileViewController    = require("FileViewController"),
        NativeFileSystem      = require("NativeFileSystem").NativeFileSystem;
    
    
    /** Each list item in the working set stores a references to the related document in the list item's data.  
     *  Use listItem.data(_DOCUMENT_KEY) to get the document reference
     */
    var _DOCUMENT_KEY = "document";

    /** Since the parent div has overflow:auto, we set the width of the first child to have
     * the scrollWidth of the parent. This makes the child widths more sane. Otherwise they
     * would use the width of the showing div and would look wierd as you scrolled to the 
     * overflow area of the div
     */
    function _updateListWidth() {
        var $parent = $("#open-files-container");
        var $firstChild = $parent.children().first();
        //clear the width first so we get the natural scrollWidth below
        $firstChild.width("");
        
        var targetWidth = $parent[0].scrollWidth -
            parseInt($parent.css("paddingLeft"), 10) -
            parseInt($parent.css("paddingRight"), 10);
        
        $firstChild.width(targetWidth);
    }

    function _hideShowOpenFileHeader() {
        if (DocumentManager.getWorkingSet().length === 0) {
            $("#open-files-header").hide();
            $("#open-files-container").hide();
            $("#open-files-divider").hide();
        } else {
            $("#open-files-header").show();
            $("#open-files-container").show();
            $("#open-files-divider").show();
        }
        
        _updateListWidth();
    }
    
    /** 
     * Updates the appearance of the list element based on the parameters provided
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {bool} isDirty 
     * @param {bool} canClose
     */
    function _updateFileStatusIcon(listElement, isDirty, canClose) {
        var fileStatusIcon = listElement.find(".file-status-icon");
        var showIcon = isDirty || canClose;

        // remove icon if its not needed
        if (!showIcon && fileStatusIcon.length !== 0) {
            fileStatusIcon.remove();
            fileStatusIcon = null;
            
        // create icon if its needed and doesn't exist
        } else if (showIcon && fileStatusIcon.length === 0) {
            
            fileStatusIcon = $("<div class='file-status-icon'></div>")
                .prependTo(listElement)
                .click(function () {
                    var doc = listElement.data(_DOCUMENT_KEY);
                    CommandManager.execute(Commands.FILE_CLOSE, {doc: doc});
                });
        }

        // Set icon's class
        if (fileStatusIcon) {
            fileStatusIcon.toggleClass("dirty", isDirty);
            fileStatusIcon.toggleClass("canClose", canClose);
        }
    }
    
    /** 
     * Updates the appearance of the list element based on the parameters provided.
    * @private
    * @param {HTMLLIElement} listElement
    * @param {Document} curDoc 
    */
    function _updateListItemSelection(listItem, curDoc) {
        $(listItem).toggleClass("selected", ($(listItem).data(_DOCUMENT_KEY) === curDoc));
    }

    /** 
     * Builds the UI for a new list item and inserts in into the end of the list
     * @private
     * @param {Document} document
     * @return {HTMLLIElement} newListItem
     */
    function _createNewListItem(doc) {
        var curDoc = DocumentManager.getCurrentDocument();

        // Create new list item with a link
        var link = $("<a href='#'></a>").text(doc.file.name);
        var newItem = $("<li></li>")
            .append(link)
            .data(_DOCUMENT_KEY, doc);

        $("#open-files-container > ul").append(newItem);

        // Update the listItem's apperance
        _updateFileStatusIcon(newItem, doc.isDirty, false);
        _updateListItemSelection(newItem, curDoc);

        newItem.click(function () {
            FileViewController.openAndSelectDocument(doc.file.fullPath, FileViewController.WORKING_SET_VIEW);
        });

        newItem.hover(
            function () {
                _updateFileStatusIcon($(this), doc.isDirty, true);
            },
            function () {
                _updateFileStatusIcon($(this), doc.isDirty, false);
            }
        );
    }
    
    /** 
     * Deletes all the list items in the view and rebuilds them from the working set model
     * @private
     */
    function _rebuildWorkingSet() {
        $("#open-files-container > ul").empty();

        DocumentManager.getWorkingSet().forEach(function (item) {
            _createNewListItem(item);
        });

        _hideShowOpenFileHeader();
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
        var items = $("#open-files-container > ul").children().each(function () {
            _updateListItemSelection(this, doc);
        });
    }

    /** 
    * @private
    */
    function _handleDocumentAdded(doc) {
        _createNewListItem(doc);
        _hideShowOpenFileHeader();
    }
    
    /** 
    * @private
    */
    function _handleDocumentSelectionChange() {
        _updateListSelection();
    }



    /** 
     * @private
     * @param {Document} curDoc 
     */
    function _closeDoc(doc) {
        CommandManager.execute(Commands.FILE_CLOSE, {doc: doc});
    }


    /** 
     * Finds the listItem item assocated with the doc. Returns null if not found.
    * @private
    * @param {Document} curDoc 
    * @return {HTMLLIItem}
    */
    function _findListItemFromDocument(doc) {
        var result = null;

        if (doc) {
            var items = $("#open-files-container > ul").children();
            items.each(function () {
                var listItem = $(this);
                if (listItem.data(_DOCUMENT_KEY) === doc) {
                    result = listItem;
                    return false;
                    // breaks each
                }
            });
        }

        return result;
    }

    /** 
    * @private
    * @param {Document} curDoc 
    */
    function _handleDocumentRemoved(doc) {
        var listItem = _findListItemFromDocument(doc);
        if (listItem) {
            listItem.remove();
        }

        _hideShowOpenFileHeader();
    }

    /** 
     * @private
     * @param {Document} curDoc 
     */
    function _handleDirtyFlagChanged(doc) {
        var listItem = _findListItemFromDocument(doc);
        if (listItem) {
            var canClose = $(listItem).find("canClose").length === 1;
            _updateFileStatusIcon(listItem, doc.isDirty, canClose);
        }

    }
    
    // Initialize: register listeners
    $(DocumentManager).on("workingSetAdd", function (event, addedDoc) {
        //console.log("Working set ++ " + addedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
        _handleDocumentAdded(addedDoc);
    });

    $(DocumentManager).on("workingSetRemove", function (event, removedDoc) {
        //console.log("Working set -- " + removedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
        _handleDocumentRemoved(removedDoc);
    });

    $(DocumentManager).on("dirtyFlagChange", function (event, doc) {
        //console.log("Dirty flag change: " + doc);
        _handleDirtyFlagChanged(doc);
    });

    $(FileViewController).on("documentSelectionFocusChange", function (event, eventTarget) {
        _handleDocumentSelectionChange();
    });

    _hideShowOpenFileHeader();


});
