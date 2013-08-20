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
    MultiRangeInlineEditor.prototype = Object.create(InlineTextEditor.prototype);
    MultiRangeInlineEditor.prototype.constructor = MultiRangeInlineEditor;
    MultiRangeInlineEditor.prototype.parentClass = InlineTextEditor.prototype;
    
    MultiRangeInlineEditor.prototype.$editorsDiv = null;
    MultiRangeInlineEditor.prototype.$relatedContainer = null;
    MultiRangeInlineEditor.prototype.$related = null;
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
        MultiRangeInlineEditor.prototype.parentClass.load.apply(this, arguments);
        
        // Container to hold all editors
        var self = this;

        // Create DOM to hold editors and related list
        this.$editorsDiv = $(window.document.createElement("div")).addClass("inlineEditorHolder");
        
        // Prevent touch scroll events from bubbling up to the parent editor.
        this.$editorsDiv.on("mousewheel.MultiRangeInlineEditor", function (e) {
            e.stopPropagation();
        });

        // Outer container for border-left and scrolling
        this.$relatedContainer = $(window.document.createElement("div")).addClass("related-container");
        
        // List "selection" highlight
        this.$selectedMarker = $(window.document.createElement("div")).appendTo(this.$relatedContainer).addClass("selection");

        // Inner container
        this.$related = $(window.document.createElement("div")).appendTo(this.$relatedContainer).addClass("related");
        
        // Range list
        var $rangeList = $(window.document.createElement("ul")).appendTo(this.$related);
        
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
        
        if (this._ranges.length > 1) {      // attach to main container
            this.$htmlContent.append(this.$relatedContainer);
        }
        this.$htmlContent.append(this.$editorsDiv);
                
        // Listen for clicks directly on us, so we can set focus back to the editor
        var clickHandler = this._onClick.bind(this);
        this.$htmlContent.on("click.MultiRangeInlineEditor", clickHandler);
        // Also handle mouseup in case the user drags a little bit
        this.$htmlContent.on("mouseup.MultiRangeInlineEditor", clickHandler);
    };
    
    /**
     * @override
     */
    MultiRangeInlineEditor.prototype.onAdded = function () {
        var self = this;
        
        // Before setting the inline widget height, force a height on the
        // floating related-container in order for CodeMirror to layout and
        // compute scrollbars
        this.$relatedContainer.height(this.$related.height());

        // Update the position of the selected marker now that we're laid out, and then
        // set it to animate for future updates.
        this._updateSelectedMarker().done(function () {
            self.$selectedMarker.addClass("animate");
        });

        // Call super
        MultiRangeInlineEditor.prototype.parentClass.onAdded.apply(this, arguments);

        // Editor must be at least as tall as the related list
        this._updateEditorMinHeight();
    };

    /**
     * Specify the range that is shown in the editor.
     *
     * @param {!number} index The index of the range to select.
     */
    MultiRangeInlineEditor.prototype.setSelectedIndex = function (index) {
        var newIndex = Math.min(Math.max(0, index), this._ranges.length - 1),
            self = this;
        
        if (newIndex === this._selectedRangeIndex) {
            return;
        }

        // Remove selected class(es)
        var $previousItem = (this._selectedRangeIndex >= 0) ? this._ranges[this._selectedRangeIndex].$listItem : null;
        
        if ($previousItem) {
            $previousItem.removeClass("selected");
        }
        
        this._selectedRangeIndex = newIndex;
        
        var $rangeItem = this._ranges[this._selectedRangeIndex].$listItem;
        
        this._ranges[this._selectedRangeIndex].$listItem.addClass("selected");

        // Remove previous editors
        this.editors.forEach(function (editor) {
            $(self.editors[0]).off(".MultiRangeInlineEditor");
            editor.destroy(); //release ref on Document
        });
        
        this.editors = [];
        this.$editorsDiv.children().remove();

        // Add new editor
        var range = this._getSelectedRange();
        this.createInlineEditorFromText(range.textRange.document, range.textRange.startLine, range.textRange.endLine, this.$editorsDiv.get(0));
        this.editors[0].focus();

        this._updateEditorMinHeight();
        this.editors[0].refresh();
        
        // Ensure the cursor position is visible in the host editor as the user is arrowing around.
        $(this.editors[0]).on("cursorActivity.MultiRangeInlineEditor", this._ensureCursorVisible.bind(this));

        // ensureVisibility is set to false because we don't want to scroll the main editor when the user selects a view
        this.sizeInlineWidgetToContents(true, false);

        this._updateSelectedMarker();
    };
    
    /**
     * Ensures that the editor's min-height is set so it never gets shorter than the rule list.
     * This is necessary to make sure the editor's horizontal scrollbar stays at the bottom of the
     * widget.
     */
    MultiRangeInlineEditor.prototype._updateEditorMinHeight = function () {
        // Set the scroller's min-height to the natural height of the rule list, so the editor
        // always stays at least as tall as the rule list.
        var ruleListNaturalHeight = this.$related.outerHeight(),
            headerHeight = $(".inline-editor-header", this.$htmlContent).outerHeight();

        // If the widget isn't fully loaded yet, bail--we'll get called again in onAdded().
        if (!ruleListNaturalHeight || !headerHeight) {
            return;
        }
        
        // We have to set this on the scroller instead of the wrapper because:
        // * we want the wrapper's actual height to remain "auto"
        // * if we set a min-height on the wrapper, the scroller's height: 100% doesn't
        //   respect it (height: 100% doesn't seem to work properly with min-height on the parent)
        $(this.editors[0].getScrollerElement())
            .css("min-height", (ruleListNaturalHeight - headerHeight) + "px");
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
        var result = new $.Deferred(),
            $rangeItem = this._ranges[this._selectedRangeIndex].$listItem;
        
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
            
            result.resolve();
        }, 0);
        
        return result.promise();
    };

    /**
     * Called any time inline is closed, whether manually (via closeThisInline()) or automatically
     */
    MultiRangeInlineEditor.prototype.onClosed = function () {
        // Superclass onClosed() destroys editor
        MultiRangeInlineEditor.prototype.parentClass.onClosed.apply(this, arguments);

        // de-ref all the Documents in the search results
        this._ranges.forEach(function (searchResult) {
            searchResult.textRange.dispose();
        });

        // Remove event handlers
        this.$htmlContent.off(".MultiRangeInlineEditor");
        this.$editorsDiv.off(".MultiRangeInlineEditor");
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
     * Based on the position of the cursor in the inline editor, determine whether we need to change the
     * vertical scroll position of the host editor to ensure that the cursor is visible.
     */
    MultiRangeInlineEditor.prototype._ensureCursorVisible = function () {
        if ($.contains(this.editors[0].getRootElement(), window.document.activeElement)) {
            var hostScrollPos = this.hostEditor.getScrollPos(),
                cursorCoords = this.editors[0]._codeMirror.cursorCoords();
            
            // Vertically, we want to set the scroll position relative to the overall host editor, not
            // the lineSpace of the widget itself. We don't want to modify the horizontal scroll position.
            var scrollerTop = this.hostEditor.getVirtualScrollAreaTop();
            this.hostEditor._codeMirror.scrollIntoView({
                left: hostScrollPos.x,
                top: cursorCoords.top - scrollerTop,
                right: hostScrollPos.x,
                bottom: cursorCoords.bottom - scrollerTop
            });
        }
    };

    /**
     * Overwrite InlineTextEditor's _onLostContent to do nothing if the document's file is deleted
     * (deletes are handled via TextRange's lostSync).
     */
    MultiRangeInlineEditor.prototype._onLostContent = function (event, cause) {
        // Ignore when the editor's content got lost due to a deleted file
        if (cause && cause.type === "deleted") { return; }
        // Else yield to the parent's implementation
        return MultiRangeInlineEditor.prototype.parentClass._onLostContent.apply(this, arguments);
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
        // We use "call" rather than "apply" here since ensureVisibility was an argument added just for this override.
        MultiRangeInlineEditor.prototype.parentClass.sizeInlineWidgetToContents.call(this, force);
        
        // Size the widget height to the max between the editor content and the related ranges list
        var widgetHeight = Math.max(this.$related.height(), this.$editorsDiv.height());

        if (widgetHeight) {
            this.hostEditor.setInlineWidgetHeight(this, widgetHeight, ensureVisibility);
        }
    };
    
    /**
     * Refreshes the height of the inline editor and all child editors.
     * @override
     */
    MultiRangeInlineEditor.prototype.refresh = function () {
        MultiRangeInlineEditor.prototype.parentClass.refresh.apply(this, arguments);
        this.sizeInlineWidgetToContents(true);
        this.editors.forEach(function (editor) {
            editor.refresh();
        });
    };

    /**
     * Returns the currently focused MultiRangeInlineEditor.
     * @returns {MultiRangeInlineEditor}
     */
    function _getFocusedMultiRangeInlineEditor() {
        var focusedWidget = EditorManager.getFocusedInlineWidget();
        if (focusedWidget instanceof MultiRangeInlineEditor) {
            return focusedWidget;
        } else {
            return null;
        }
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
