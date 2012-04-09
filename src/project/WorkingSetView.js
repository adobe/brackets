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
    var DocumentManager       = require("document/DocumentManager"),
        CommandManager        = require("command/CommandManager"),
        Commands              = require("command/Commands"),
        EditorManager         = require("editor/EditorManager"),
        FileViewController    = require("project/FileViewController"),
        NativeFileSystem      = require("file/NativeFileSystem").NativeFileSystem,
        ViewUtils             = require("utils/ViewUtils");
    
    
    /** Each list item in the working set stores a references to the related document in the list item's data.  
     *  Use listItem.data(_FILE_KEY) to get the document reference
     */
    var _FILE_KEY = "file";

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
        
        ViewUtils.updateChildrenToParentScrollwidth($("#open-files-container"));
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
                    // Clicking the "X" button is equivalent to File > Close; it doesn't merely
                    // remove a file from the working set
                    var file = listElement.data(_FILE_KEY);
                    CommandManager.execute(Commands.FILE_CLOSE, {file: file});
                });
        }

        // Set icon's class
        if (fileStatusIcon) {
            // cast to Boolean needed because toggleClass() distinguishes true/false from truthy/falsy
            fileStatusIcon.toggleClass("dirty", Boolean(isDirty));
            fileStatusIcon.toggleClass("canClose", Boolean(canClose));
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
        var link = $("<a href='#'></a>").text(file.name);
        var newItem = $("<li></li>")
            .append(link)
            .data(_FILE_KEY, file);

        $("#open-files-container > ul").append(newItem);
        
        // working set item might never have been opened; if so, then it's definitely not dirty

        // Update the listItem's apperance
        _updateFileStatusIcon(newItem, isOpenAndDirty(file), false);
        _updateListItemSelection(newItem, curDoc);

        newItem.click(function () {
            FileViewController.openAndSelectDocument(file.fullPath, FileViewController.WORKING_SET_VIEW);
        });

        newItem.hover(
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
        $("#open-files-container > ul").empty();

        DocumentManager.getWorkingSet().forEach(function (file) {
            _createNewListItem(file);
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
    function _handleFileAdded(file) {
        _createNewListItem(file);
        _hideShowOpenFileHeader();
    }
    
    /** 
     * @private
     */
    function _handleDocumentSelectionChange() {
        _updateListSelection();
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
            var items = $("#open-files-container > ul").children();
            items.each(function () {
                var listItem = $(this);
                if (listItem.data(_FILE_KEY).fullPath === file.fullPath) {
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
     * @param {FileEntry} file 
     */
    function _handleFileRemoved(file) {
        var listItem = _findListItemFromFile(file);
        if (listItem) {
            listItem.remove();
        }

        _hideShowOpenFileHeader();
    }

    /** 
     * @private
     * @param {Document} doc 
     */
    function _handleDirtyFlagChanged(doc) {
        var listItem = _findListItemFromFile(doc.file);
        if (listItem) {
            var canClose = $(listItem).find("canClose").length === 1;
            _updateFileStatusIcon(listItem, doc.isDirty, canClose);
        }

    }
    
    // Initialize: register listeners
    $(DocumentManager).on("workingSetAdd", function (event, addedFile) {
        //console.log("Working set ++ " + addedFile);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
        _handleFileAdded(addedFile);
    });

    $(DocumentManager).on("workingSetRemove", function (event, removedFile) {
        //console.log("Working set -- " + removedFile);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
        _handleFileRemoved(removedFile);
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
