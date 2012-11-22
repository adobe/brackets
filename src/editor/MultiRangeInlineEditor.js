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

// FUTURE: Merge part (or all) of this class with InlineTextEditor

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, window */

/**
 * An inline editor for displaying and editing multiple text ranges. Each range corresponds to a 
 * contiguous set of lines in a file. 
 * 
 * In the current implementation, only one range is visible at a time. A list on the right side
 * of the editor allows the user to select which range is visible. 
 *
 * This module does not dispatch any events.
 */

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var TextRange           = require("document/TextRange").TextRange,
        InlineTextEditor    = require("editor/InlineTextEditor").InlineTextEditor,
        EditorManager       = require("editor/EditorManager"),
        Commands            = require("command/Commands"),
        Strings             = require("strings"),
        CommandManager      = require("command/CommandManager"),
        PerfUtils           = require("utils/PerfUtils");

    /**
     * Remove trailing "px" from a style size value.
     * @param {!JQuery} $target Element in DOM
     * @param {!string} styleName Style name to query
     * @return {number} Style value converted from string to number, removing "px" units
     */
    function _parseStyleSize($target, styleName) {
        return parseInt($target.css(styleName), 10);
    }
    
    
    /**
     * @constructor
     * Stores one search result: its source file, line range, etc. plus the DOM node representing it
     * in the results list.
     */
    function SearchResultItem(rangeResult) {
        this.name = rangeResult.name;
        this.textRange = new TextRange(rangeResult.document, rangeResult.lineStart, rangeResult.lineEnd);
        // this.$listItem is assigned in load()
    }
    SearchResultItem.prototype.name = null;
    SearchResultItem.prototype.textRange = null;
    SearchResultItem.prototype.$listItem = null;
    
    function _updateRangeLabel(listItem, range) {
        var text = range.name + " " + range.textRange.document.file.name + " : " + (range.textRange.startLine + 1);
        listItem.text(text);
        listItem.attr("title", text);
    }
    
    /**
     * @constructor
     * @param {Array.<{name:String,document:Document,lineStart:number,lineEnd:number}>} ranges The text ranges to display.
     * @extends {InlineTextEditor}
     */
    function MultiRangeInlineEditor(ranges) {
        InlineTextEditor.call(this);
        
        // Store the results to show in the range list. This creates TextRanges bound to the Document,
        // which will stay up to date automatically (but we must be sure to detach them later)
        this._ranges = ranges.map(function (rangeResult) {
            return new SearchResultItem(rangeResult);
        });
        
        this._selectedRangeIndex = -1;
    }
    MultiRangeInlineEditor.prototype = new InlineTextEditor();
    MultiRangeInlineEditor.prototype.constructor = MultiRangeInlineEditor;
    MultiRangeInlineEditor.prototype.parentClass = InlineTextEditor.prototype;
    
    MultiRangeInlineEditor.prototype.$editorsDiv = null;
    MultiRangeInlineEditor.prototype.$relatedContainer = null;
    MultiRangeInlineEditor.prototype.$selectedMarker = null;
    
    /** @type {Array.<SearchResultItem>} */
    MultiRangeInlineEditor.prototype._ranges = null;
    MultiRangeInlineEditor.prototype._selectedRangeIndex = null;

    /** 
     * @override
     * @param {!Editor} hostEditor  Outer Editor instance that inline editor will sit within.
     * 
     */
    MultiRangeInlineEditor.prototype.load = function (hostEditor) {
        this.parentClass.load.call(this, hostEditor);
        
        // Container to hold all editors
        var self = this;

        // Bind event handlers
        this._updateRelatedContainer = this._updateRelatedContainer.bind(this);
        this._ensureCursorVisible = this._ensureCursorVisible.bind(this);
        this._handleChange = this._handleChange.bind(this);
        this._onClick = this._onClick.bind(this);

        // Create DOM to hold editors and related list
        this.$editorsDiv = $(window.document.createElement("div")).addClass("inlineEditorHolder");
        
        // Outer container for border-left and scrolling
        this.$relatedContainer = $(window.document.createElement("div")).addClass("related-container");
        this._relatedContainerInserted = false;
        this._relatedContainerInsertedHandler = this._relatedContainerInsertedHandler.bind(this);
        
        // FIXME (jasonsj): deprecated event http://www.w3.org/TR/DOM-Level-3-Events/
        this.$relatedContainer.on("DOMNodeInserted", this._relatedContainerInsertedHandler);
        
        // List "selection" highlight
        this.$selectedMarker = $(window.document.createElement("div")).appendTo(this.$relatedContainer).addClass("selection");
        
        // Inner container
        var $related = $(window.document.createElement("div")).appendTo(this.$relatedContainer).addClass("related");
        
        // Range list
        var $rangeList = $(window.document.createElement("ul")).appendTo($related);
        
        // create range list & add listeners for range textrange changes
        var rangeItemText;
        this._ranges.forEach(function (range) {
            // Create list item UI
            var $rangeItem = $(window.document.createElement("li")).appendTo($rangeList);
            _updateRangeLabel($rangeItem, range);
            $rangeItem.mousedown(function () {
                self.setSelectedIndex(self._ranges.indexOf(range));
            });

            range.$listItem = $rangeItem;
            
            // Update list item as TextRange changes
            $(range.textRange).on("change", function () {
                _updateRangeLabel($rangeItem, range);
            });
            
            // If TextRange lost sync, remove it from the list (and close the widget if no other ranges are left)
            $(range.textRange).on("lostSync", function () {
                self._removeRange(range);
            });
        });
        
        // select the first range
        self.setSelectedIndex(0);
        
        // attach to main container
        this.$htmlContent.append(this.$editorsDiv).append(this.$relatedContainer);
        
        // initialize position based on the main #editor-holder
        window.setTimeout(this._updateRelatedContainer, 0);
        
        // Changes to the host editor should update the relatedContainer
        // Note: normally it's not kosher to listen to changes on a specific editor,
        // but in this case we're specifically concerned with changes in the given
        // editor, not general document changes.
        $(this.hostEditor).on("change", this._updateRelatedContainer);
        
        // Update relatedContainer when this widget's position changes
        $(this).on("offsetTopChanged", this._updateRelatedContainer);
        
        // Listen to the window resize event to reposition the relatedContainer
        // when the hostEditor's scrollbars visibility changes
        $(window).on("resize", this._updateRelatedContainer);
        
        // Listen for clicks directly on us, so we can set focus back to the editor
        this.$htmlContent.on("click", this._onClick);
    };

    /**
     * Specify the range that is shown in the editor.
     *
     * @param {!number} index The index of the range to select.
     */
    MultiRangeInlineEditor.prototype.setSelectedIndex = function (index) {
        var newIndex = Math.min(Math.max(0, index), this._ranges.length - 1);
        
        if (newIndex === this._selectedRangeIndex) {
            return;
        }

        // Remove selected class(es)
        var $previousItem = (this._selectedRangeIndex >= 0) ? this._ranges[this._selectedRangeIndex].$listItem : null;
        
        if ($previousItem) {
            $previousItem.toggleClass("selected", false);
        }
        
        this._selectedRangeIndex = newIndex;
        
        var $rangeItem = this._ranges[this._selectedRangeIndex].$listItem;
        
        this._ranges[this._selectedRangeIndex].$listItem.toggleClass("selected", true);

        // Remove previous editors
        $(this.editors[0]).off("change", this._updateRelatedContainer);

        this.editors.forEach(function (editor) {
            editor.destroy(); //release ref on Document
        });
        
        this.editors = [];
        this.$editorsDiv.children().remove();

        // Add new editor
        var range = this._getSelectedRange();
        this.createInlineEditorFromText(range.textRange.document, range.textRange.startLine, range.textRange.endLine, this.$editorsDiv.get(0));
        this.editors[0].focus();

        // Changes in size to the inline editor should update the relatedContainer
        // Note: normally it's not kosher to listen to changes on a specific editor,
        // but in this case we're specifically concerned with changes in the given
        // editor, not general document changes.
        $(this.editors[0]).on("change", this._handleChange);
        
        // Cursor activity in the inline editor may cause us to horizontally scroll.
        $(this.editors[0]).on("cursorActivity", this._ensureCursorVisible);

        
        this.editors[0].refresh();
        
        // ensureVisibility is set to false because we don't want to scroll the main editor when the user selects a view
        this.sizeInlineWidgetToContents(true, false);
        this._updateRelatedContainer();

        this._updateSelectedMarker();
    };

    MultiRangeInlineEditor.prototype._removeRange = function (range) {
        // If this is the last range, just close the whole widget
        if (this._ranges.length <= 1) {
            this.close();
            return;
        }

        // Now we know there is at least one other range -> found out which one this is
        var index = this._ranges.indexOf(range);
        
        // If the range to be removed is the selected one, first switch to another one
        if (index === this._selectedRangeIndex) {
            // If possible, select the one below, else select the one above
            if (index + 1 < this._ranges.length) {
                this.setSelectedIndex(index + 1);
            } else {
                this.setSelectedIndex(index - 1);
            }
        }

        // Now we can remove this range
        range.$listItem.remove();
        range.textRange.dispose();
        this._ranges.splice(index, 1);

        // If the selected range is below, we need to update the index
        if (index < this._selectedRangeIndex) {
            this._selectedRangeIndex--;
            this._updateSelectedMarker();
        }
    };

    MultiRangeInlineEditor.prototype._updateSelectedMarker = function () {
        var $rangeItem = this._ranges[this._selectedRangeIndex].$listItem;
        
        // scroll the selection to the rangeItem, use setTimeout to wait for DOM updates
        var self = this;
        window.setTimeout(function () {
            var containerHeight = self.$relatedContainer.height(),
                itemTop = $rangeItem.position().top,
                scrollTop = self.$relatedContainer.scrollTop();
            
            self.$selectedMarker.css("top", itemTop);
            self.$selectedMarker.height($rangeItem.outerHeight());
            
            if (containerHeight <= 0) {
                return;
            }
            
            var paddingTop = _parseStyleSize($rangeItem.parent(), "paddingTop");
            
            if ((itemTop - paddingTop) < scrollTop) {
                self.$relatedContainer.scrollTop(itemTop - paddingTop);
            } else {
                var itemBottom = itemTop + $rangeItem.height() + _parseStyleSize($rangeItem.parent(), "paddingBottom");
                
                if (itemBottom > (scrollTop + containerHeight)) {
                    self.$relatedContainer.scrollTop(itemBottom - containerHeight);
                }
            }
        }, 0);
    };

    /**
     * Called any time inline is closed, whether manually (via closeThisInline()) or automatically
     */
    MultiRangeInlineEditor.prototype.onClosed = function () {
        // Superclass onClosed() destroys editor
        this.parentClass.onClosed.call(this);
        
        // remove resize handlers for relatedContainer
        $(this.hostEditor).off("change", this._updateRelatedContainer);
        $(this.editors[0]).off("change", this._handleChange);
        $(this.editors[0]).off("cursorActivity", this._ensureCursorVisible);
        $(this).off("offsetTopChanged", this._updateRelatedContainer);
        $(window).off("resize", this._updateRelatedContainer);
        
        // de-ref all the Documents in the search results
        this._ranges.forEach(function (searchResult) {
            searchResult.textRange.dispose();
        });
    };
    
    /**
     * @private
     * Set _relatedContainerInserted flag once the $relatedContainer is inserted in the DOM.
     */
    MultiRangeInlineEditor.prototype._relatedContainerInsertedHandler = function () {
        this.$relatedContainer.off("DOMNodeInserted", this._relatedContainerInsertedHandler);
        this._relatedContainerInserted = true;
    };
    
    /**
     * Prevent clicks in the dead areas of the inlineWidget from changing the focus and insertion point in the editor.
     * This is done by detecting clicks in the inlineWidget that are not inside the editor or the range list and
     * restoring focus and the insertion point.
     */
    MultiRangeInlineEditor.prototype._onClick = function (event) {
        var childEditor = this.editors[0],
            editorRoot = childEditor.getRootElement(),
            editorPos = $(editorRoot).offset();
        
        function containsClick($parent) {
            return $parent.find(event.target) > 0 || $parent[0] === event.target;
        }
        
        // Ignore clicks in editor and clicks on filename link
        if (!containsClick($(editorRoot)) && !containsClick($(".filename", this.$editorsDiv))) {
            childEditor.focus();
            // Only set the cursor if the click isn't in the range list.
            if (!containsClick(this.$relatedContainer)) {
                if (event.pageY < editorPos.top) {
                    childEditor.setCursorPos(0, 0);
                } else if (event.pageY > editorPos.top + $(editorRoot).height()) {
                    var lastLine = childEditor.getLastVisibleLine();
                    childEditor.setCursorPos(lastLine, childEditor.document.getLine(lastLine).length);
                }
            }
        }
    };
    
    /**
     * Set the size, position, and clip rect of the range list.
     */
    MultiRangeInlineEditor.prototype._updateRelatedContainer = function () {
        var borderThickness = (this.$htmlContent.outerHeight() - this.$htmlContent.innerHeight()) / 2;
        this.$relatedContainer.css("top", this.$htmlContent.offset().top + borderThickness);
        this.$relatedContainer.height(this.$htmlContent.height());
        
        // Because we're using position: fixed, we need to explicitly clip the range list if it crosses
        // out of the top or bottom of the scroller area.
        var hostScroller = this.hostEditor.getScrollerElement(),
            rcTop = this.$relatedContainer.offset().top,
            rcHeight = this.$relatedContainer.outerHeight(),
            rcBottom = rcTop + rcHeight,
            scrollerOffset = $(hostScroller).offset(),
            scrollerTop = scrollerOffset.top,
            scrollerBottom = scrollerTop + hostScroller.clientHeight,
            scrollerLeft = scrollerOffset.left,
            rightOffset = $(window.document.body).outerWidth() - (scrollerLeft + hostScroller.clientWidth);
        if (rcTop < scrollerTop || rcBottom > scrollerBottom) {
            this.$relatedContainer.css("clip", "rect(" + Math.max(scrollerTop - rcTop, 0) + "px, auto, " +
                                       (rcHeight - Math.max(rcBottom - scrollerBottom, 0)) + "px, auto)");
        } else {
            this.$relatedContainer.css("clip", "");
        }
        
        // Constrain relatedContainer width to half of the scroller width
        var relatedContainerWidth = this.$relatedContainer.width();
        if (this._relatedContainerInserted) {
            if (this._relatedContainerDefaultWidth === undefined) {
                this._relatedContainerDefaultWidth = relatedContainerWidth;
            }
            
            var halfWidth = Math.floor(hostScroller.clientWidth / 2);
            relatedContainerWidth = Math.min(this._relatedContainerDefaultWidth, halfWidth);
            this.$relatedContainer.width(relatedContainerWidth);
        }
        
        // Position immediately to the left of the main editor's scrollbar.
        this.$relatedContainer.css("right", rightOffset + "px");

        // Add extra padding to the right edge of the widget to account for the range list.
        this.$htmlContent.css("padding-right", this.$relatedContainer.outerWidth() + "px");
        
        // Set the minimum width of the widget (which doesn't include the padding) to the width
        // of CodeMirror's linespace, so that the total width will be at least as large as the
        // width of the host editor's code plus the padding for the range list. We need to do this
        // rather than just setting min-width to 100% because adding padding for the range list
        // actually pushes out the width of the container, so we would end up continuously
        // growing the overall width.
        // This is a bit of a hack since it relies on knowing some detail about the innards of CodeMirror.
        var lineSpace = this.hostEditor._getLineSpaceElement(),
            minWidth = $(lineSpace).offset().left - this.$htmlContent.offset().left + lineSpace.scrollWidth;
        this.$htmlContent.css("min-width", minWidth + "px");
    };
    
    /**
     * Based on the position of the cursor in the inline editor, determine whether we need to change the
     * scroll position of the host editor to ensure that the cursor is visible.
     */
    MultiRangeInlineEditor.prototype._ensureCursorVisible = function () {
        if ($.contains(this.editors[0].getRootElement(), window.document.activeElement)) {
            var cursorCoords = this.editors[0]._codeMirror.cursorCoords(),
                lineSpaceOffset = $(this.editors[0]._getLineSpaceElement()).offset(),
                rangeListOffset = this.$relatedContainer.offset();
            // If we're off the left-hand side, we just want to scroll it into view normally. But
            // if we're underneath the range list on the right, we want to ask the host editor to 
            // scroll far enough that the current cursor position is visible to the left of the range 
            // list. (Because we always add extra padding for the range list, this is always possible.)
            if (cursorCoords.x >= rangeListOffset.left) {
                cursorCoords.x += this.$relatedContainer.outerWidth();
            }
            
            // Vertically, we want to set the scroll position relative to the overall host editor, not
            // the lineSpace of the widget itself. Also, we can't use the lineSpace here, because its top
            // position just corresponds to whatever CodeMirror happens to have rendered at the top. So
            // we need to figure out our position relative to the top of the virtual scroll area, which is
            // the top of the actual scroller minus the scroll position.
            var scrollerTop = $(this.hostEditor.getScrollerElement()).offset().top - this.hostEditor.getScrollPos().y;
            this.hostEditor._codeMirror.scrollIntoView(cursorCoords.x - lineSpaceOffset.left,
                                                       cursorCoords.y - scrollerTop,
                                                       cursorCoords.x - lineSpaceOffset.left,
                                                       cursorCoords.yBot - scrollerTop);
        }
    };
    
    /**
     * Handle a change event from the editor. Update the related container and make sure the
     * cursor is visible.
     */
    MultiRangeInlineEditor.prototype._handleChange = function () {
        this._updateRelatedContainer();
        this._ensureCursorVisible();
    };

    /**
     * Overwrite InlineTextEditor's _onLostContent to do nothing if the document's file is deleted
     * (deletes are handled via TextRange's lostSync).
     */
    MultiRangeInlineEditor.prototype._onLostContent = function (event, cause) {
        // Ignore when the editor's content got lost due to a deleted file
        if (cause && cause.type === "deleted") { return; }
        // Else yield to the parent's implementation
        return this.parentClass._onLostContent.apply(this, arguments);
    };

    /**
     * @return {Array.<SearchResultItem>}
     */
    MultiRangeInlineEditor.prototype._getRanges = function () {
        return this._ranges;
    };

    /**
     * @return {!SearchResultItem}
     */
    MultiRangeInlineEditor.prototype._getSelectedRange = function () {
        return this._ranges[this._selectedRangeIndex];
    };

    /**
     * Display the next range in the range list
     */
    MultiRangeInlineEditor.prototype._selectNextRange = function () {
        this.setSelectedIndex(this._selectedRangeIndex + 1);
    };
    
    /**
     *  Display the previous range in the range list
     */
    MultiRangeInlineEditor.prototype._selectPreviousRange = function () {
        this.setSelectedIndex(this._selectedRangeIndex - 1);
    };

    /**
     * Sizes the inline widget height to be the maximum between the range list height and the editor height
     * @override 
     * @param {boolean} force the editor to resize
     * @param {boolean} ensureVisibility makes the parent editor scroll to display the inline editor. Default true.
     */
    MultiRangeInlineEditor.prototype.sizeInlineWidgetToContents = function (force, ensureVisibility) {
        // Size the code mirror editors height to the editor content
        this.parentClass.sizeInlineWidgetToContents.call(this, force);
        // Size the widget height to the max between the editor content and the related ranges list
        var widgetHeight = Math.max(this.$relatedContainer.find(".related").height(), this.$editorsDiv.height());
        this.hostEditor.setInlineWidgetHeight(this, widgetHeight, ensureVisibility);

        // The related ranges container size itself based on htmlContent which is set by setInlineWidgetHeight above.
        // Use setTimeout to trigger a layout update before accessing positions, heights, etc.
        window.setTimeout(this._updateRelatedContainer);
    };
    
    /**
     * Refreshes the height of the inline editor and all child editors.
     * @override
     */
    MultiRangeInlineEditor.prototype.refresh = function () {
        this.sizeInlineWidgetToContents(true);
        this._updateRelatedContainer();
        this.editors.forEach(function (editor, j, arr) {
            editor.refresh();
        });
    };

    /**
     * Returns the currently focused MultiRangeInlineEditor.
     * @returns {MultiRangeInlineEditor}
     */
    function _getFocusedMultiRangeInlineEditor() {
        
        var focusedMultiRangeInlineEditor = null,
            result = EditorManager.getFocusedInlineWidget();
        
        if (result) {
            var focusedWidget = result.widget;
            if (focusedWidget && focusedWidget instanceof MultiRangeInlineEditor) {
                focusedMultiRangeInlineEditor = focusedWidget;
            }
        }
        
        return focusedMultiRangeInlineEditor;
    }

    /**
     * Previous Range command handler
     */
    function _previousRange() {
        var focusedMultiRangeInlineEditor = _getFocusedMultiRangeInlineEditor();
        if (focusedMultiRangeInlineEditor) {
            focusedMultiRangeInlineEditor._selectPreviousRange();
        }
    }
    
    /**
     * Next Range command handler
     */
    function _nextRange() {
        var focusedMultiRangeInlineEditor = _getFocusedMultiRangeInlineEditor();
        if (focusedMultiRangeInlineEditor) {
            focusedMultiRangeInlineEditor._selectNextRange();
        }
    }
    
    CommandManager.register(Strings.CMD_QUICK_EDIT_PREV_MATCH,      Commands.QUICK_EDIT_PREV_MATCH, _previousRange);
    CommandManager.register(Strings.CMD_QUICK_EDIT_NEXT_MATCH,      Commands.QUICK_EDIT_NEXT_MATCH, _nextRange);

    exports.MultiRangeInlineEditor = MultiRangeInlineEditor;
});
