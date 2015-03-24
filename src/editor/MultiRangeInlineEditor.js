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
/*global define, $, window */

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
    
    var _ = require("thirdparty/lodash");
    
    // Load dependent modules
    var TextRange           = require("document/TextRange").TextRange,
        InlineTextEditor    = require("editor/InlineTextEditor").InlineTextEditor,
        EditorManager       = require("editor/EditorManager"),
        FileUtils           = require("file/FileUtils"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        ProjectManager      = require("project/ProjectManager"),
        Commands            = require("command/Commands"),
        Strings             = require("strings"),
        CommandManager      = require("command/CommandManager");
    
    var _prevMatchCmd, _nextMatchCmd;

    /**
     * Remove trailing "px" from a style size value.
     * @param {!JQuery} $target Element in DOM
     * @param {!string} styleName Style name to query
     * @return {number} Style value converted from string to number, removing "px" units
     */
    function _parseStyleSize($target, styleName) {
        return parseInt($target.css(styleName), 10);
    }
    
    /** Returns a 'context' object for getting/setting project-specific preferences */
    function _getPrefsContext() {
        var projectRoot = ProjectManager.getProjectRoot();  // note: null during unit tests!
        return { location : { scope: "user", layer: "project", layerID: projectRoot && projectRoot.fullPath } };
    }
    
    
    /**
     * Stores one search result: its source file, line range, etc. plus the DOM node representing it
     * in the results list.
     * @constructor
     */
    function SearchResultItem(rangeResult) {
        this.name = rangeResult.name;
        this.textRange = new TextRange(rangeResult.document, rangeResult.lineStart, rangeResult.lineEnd);
        // this.$listItem is assigned in load()
    }
    SearchResultItem.prototype.name = null;
    SearchResultItem.prototype.textRange = null;
    SearchResultItem.prototype.$listItem = null;
    
    function _updateRangeLabel(listItem, range, labelCB) {
        if (labelCB) {
            range.name = labelCB(range.textRange);
        }
        var text = _.escape(range.name) + " <span class='related-file'>:" + (range.textRange.startLine + 1) + "</span>";
        listItem.html(text);
        listItem.attr("title", listItem.text());
    }
    
    
    /**
     * @constructor
     * @param {Array.<{name:String,document:Document,lineStart:number,lineEnd:number}>} ranges The text
     *      ranges to display. Results within the same file are expected to be contiguous in this array.
     * @param {?function(): $.Promise} messageCB Optional; returns a promise resolved with a message to
     *      show when no matches are available. The message should be already-escaped HTML.
     * @param {?function(range): string} labelCB Optional; returns an updated label string for the given
     *      range. Called when we detect that the content of a range has changed. The label is plain
     *      text, not HTML.
     * @param {?function(!File, !File):number} fileComparator Optional comparison function for sorting
     *      the results list (based on range.document.file). Defaults to FileUtils.comparePaths().
     * @extends {InlineTextEditor}
     */
    function MultiRangeInlineEditor(ranges, messageCB, labelCB, fileComparator) {
        InlineTextEditor.call(this);
        
        // Store the results to show in the range list. This creates TextRanges bound to the Document,
        // which will stay up to date automatically (but we must be sure to detach them later)
        this._ranges = ranges.map(function (rangeResult) {
            return new SearchResultItem(rangeResult);
        });
        this._messageCB = messageCB;
        this._labelCB = labelCB;
        
        this._selectedRangeIndex = -1;
        this._collapsedFiles = {};
        
        // Set up list sort order
        this._fileComparator = fileComparator || function defaultComparator(file1, file2) {
            return FileUtils.comparePaths(file1.fullPath, file2.fullPath);
        };
        this._ranges.sort(function (result1, result2) {
            return this._fileComparator(result1.textRange.document.file, result2.textRange.document.file);
        }.bind(this));
    }
    MultiRangeInlineEditor.prototype = Object.create(InlineTextEditor.prototype);
    MultiRangeInlineEditor.prototype.constructor = MultiRangeInlineEditor;
    MultiRangeInlineEditor.prototype.parentClass = InlineTextEditor.prototype;
    
    MultiRangeInlineEditor.prototype.$messageDiv = null;
    MultiRangeInlineEditor.prototype.$relatedContainer = null;
    MultiRangeInlineEditor.prototype.$related = null;
    MultiRangeInlineEditor.prototype.$selectedMarker = null;
    
    /** Includes all the _ranges[i].$listItem items, as well as section headers */
    MultiRangeInlineEditor.prototype.$rangeList = null;
    
    /**
     * List of search results. Section headers are not represented in this list (they are implied before each group of
     * of consecutive results from the same Document).
     * @type {!Array.<SearchResultItem>}
     */
    MultiRangeInlineEditor.prototype._ranges = null;
    
    /** Index into this._ranges - indices do not include section headers */
    MultiRangeInlineEditor.prototype._selectedRangeIndex = null;
    
    /**
     * Map from fullPath to true if collapsed. May not agree with preferences, in cases where multiple inline editors make
     * concurrent changes.
     * @type {!Object.<string, boolean>}
     */
    MultiRangeInlineEditor.prototype._collapsedFiles = null;
    
    MultiRangeInlineEditor.prototype._messageCB = null;
    MultiRangeInlineEditor.prototype._labelCB = null;
    MultiRangeInlineEditor.prototype._fileComparator = null;
    
    /** @type {!Object.<string, jQueryObject>} Map from fullPath to section header DOM node */
    MultiRangeInlineEditor.prototype._$headers = null;
    
    
    /**
     * @private
     * Add a new result item <li> to the range list UI ($rangeList) and saves it in range.$listItem
     * @param {SearchResultItem} range The range to add.
     */
    MultiRangeInlineEditor.prototype._createListItem = function (range) {
        var self = this,
            $rangeItem = $("<li/>");
        
        // Attach filename for unit test use
        $rangeItem.data("filename", range.textRange.document.file.name);
        
        $rangeItem.appendTo(this.$rangeList);
        
        _updateRangeLabel($rangeItem, range);
        $rangeItem.mousedown(function () {
            self.setSelectedIndex(self._ranges.indexOf(range));
        });

        range.$listItem = $rangeItem;
    };
    
    /** Collapses/expands a file section in the range list UI */
    MultiRangeInlineEditor.prototype._toggleSection = function (fullPath, duringInit) {
        var $headerItem = this._$headers[fullPath];
        var $disclosureIcon = $headerItem.find(".disclosure-triangle");
        var isCollapsing = $disclosureIcon.hasClass("expanded");
        $disclosureIcon.toggleClass("expanded");
        $headerItem.nextUntil(".section-header").toggle(!isCollapsing);  // explicit visibility arg, since during load() jQ doesn't think nodes are visible

        // Update instance-specific state...
        this._collapsedFiles[fullPath] = isCollapsing;
        // ...AND persist as per-project view state
        if (!duringInit) {
            var setting = PreferencesManager.getViewState("inlineEditor.collapsedFiles", _getPrefsContext()) || {};
            if (isCollapsing) {
                setting[fullPath] = true;
            } else {
                delete setting[fullPath];
            }
            PreferencesManager.setViewState("inlineEditor.collapsedFiles", setting, _getPrefsContext());
        }

        // Show/hide selection indicator if selection was in collapsed section
        this._updateSelectedMarker(false);
        
        // Changing height of rule list may change ht of overall editor
        this._ruleListHeightChanged();
        
        // If user expands collapsed section and nothing selected yet, select first result in this section
        if (this._selectedRangeIndex === -1 && !isCollapsing && !duringInit) {
            var index = _.findIndex(this._ranges, function (resultItem) {
                return resultItem.textRange.document.file.fullPath === fullPath;
            });
            this.setSelectedIndex(index);
        }
    };
    
    /** Adds a file section header <li> to the range list UI ($rangeList) and adds it to the this._$headers map */
    MultiRangeInlineEditor.prototype._createHeaderItem = function (doc) {
        var $headerItem = $("<li class='section-header'><span class='disclosure-triangle expanded'/><span class='filename'>" + _.escape(doc.file.name) + "</span></li>")
            .attr("title", ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath))
            .appendTo(this.$rangeList);
        
        $headerItem.click(function () {
            this._toggleSection(doc.file.fullPath);
        }.bind(this));
        
        this._$headers[doc.file.fullPath] = $headerItem;
    };
    
    /** Refresh the contents of $rangeList */
    MultiRangeInlineEditor.prototype._renderList = function () {
        this.$rangeList.empty();
        this._$headers = {};
        
        var self = this,
            lastSectionDoc,
            numItemsInSection = 0;
        
        // After seeing all results for a given file, update its header with total # of results
        function finalizeSection() {
            if (lastSectionDoc) {
                self._$headers[lastSectionDoc.file.fullPath].append(" (" + numItemsInSection + ")");
                if (self._collapsedFiles[lastSectionDoc.file.fullPath]) {
                    self._toggleSection(lastSectionDoc.file.fullPath, true);
                }
            }
        }
        
        this._ranges.forEach(function (resultItem) {
            if (lastSectionDoc !== resultItem.textRange.document) {
                // Finalize previous section
                finalizeSection();
                
                // Initialize new section
                lastSectionDoc = resultItem.textRange.document;
                numItemsInSection = 0;
                
                // Create filename header for new section
                this._createHeaderItem(lastSectionDoc);
            }
            numItemsInSection++;
            this._createListItem(resultItem);
        }, this);
        
        // Finalize last section
        finalizeSection();
    };
    
    
    /** 
     * @override
     * @param {!Editor} hostEditor  Outer Editor instance that inline editor will sit within.
     * 
     */
    MultiRangeInlineEditor.prototype.load = function (hostEditor) {
        MultiRangeInlineEditor.prototype.parentClass.load.apply(this, arguments);
        
        // Create the message area
        this.$messageDiv = $("<div/>")
            .addClass("inline-editor-message");
        
        // Prevent touch scroll events from bubbling up to the parent editor.
        this.$editorHolder.on("mousewheel.MultiRangeInlineEditor", function (e) {
            e.stopPropagation();
        });

        // Outer container for border-left and scrolling
        this.$relatedContainer = $("<div/>").addClass("related-container");
        
        // List "selection" highlight
        this.$selectedMarker = $("<div/>").appendTo(this.$relatedContainer).addClass("selection");

        // Inner container
        this.$related = $("<div/>").appendTo(this.$relatedContainer).addClass("related");
        
        // Range list
        this.$rangeList = $("<ul/>").appendTo(this.$related);
        
        // Determine which sections are initially collapsed (the actual collapsing happens after onAdded(),
        // because jQuery.hide() requires the computed value of 'display' to work properly)
        var toCollapse = PreferencesManager.getViewState("inlineEditor.collapsedFiles", _getPrefsContext()) || {};
        Object.keys(toCollapse).forEach(function (fullPath) {
            this._collapsedFiles[fullPath] = true;
        }.bind(this));
        
        // Render list & section headers (matching collapsed state set above)
        this._renderList();
        
        if (this._ranges.length > 1) {      // attach to main container
            this.$wrapper.before(this.$relatedContainer);
        }
                
        // Add TextRange listeners to update UI as text changes
        var self = this;
        this._ranges.forEach(function (range, index) {
            // Update list item as TextRange changes
            range.textRange.on("change", function () {
                _updateRangeLabel(range.$listItem, range);
            }).on("contentChange", function () {
                _updateRangeLabel(range.$listItem, range, self._labelCB);
            });
            
            // If TextRange lost sync, remove it from the list (and close the widget if no other ranges are left)
            range.textRange.on("lostSync", function () {
                self._removeRange(range);
            });
        });
        
        // Initial selection is the first non-collapsed result item
        var indexToSelect = _.findIndex(this._ranges, function (range) {
            return !this._collapsedFiles[range.textRange.document.file.fullPath];
        }.bind(this));
        if (this._ranges.length === 1 && indexToSelect === -1) {
            // If no right-hand rule list shown, select the one result even if it's in a collapsed file (since no way to expand)
            indexToSelect = 0;
        }
        
        if (indexToSelect !== -1) {
            // select the first visible range
            this.setSelectedIndex(indexToSelect);
        } else {
            // force the message div to show
            this.setSelectedIndex(-1);
        }
        
        // Listen for clicks directly on us, so we can set focus back to the editor
        var clickHandler = this._onClick.bind(this);
        this.$htmlContent.on("click.MultiRangeInlineEditor", clickHandler);
        // Also handle mouseup in case the user drags a little bit
        this.$htmlContent.on("mouseup.MultiRangeInlineEditor", clickHandler);
        
        // Update the rule list navigation menu items when we gain/lose focus.
        this.$htmlContent
            .on("focusin.MultiRangeInlineEditor", this._updateCommands.bind(this))
            .on("focusout.MultiRangeInlineEditor", this._updateCommands.bind(this));
    };
    
    /**
     * @private
     * Updates the enablement for the rule list navigation commands.
     */
    MultiRangeInlineEditor.prototype._updateCommands = function () {
        var enabled = (this.hasFocus() && this._ranges.length > 1);
        _prevMatchCmd.setEnabled(enabled && this._selectedRangeIndex > 0);
        _nextMatchCmd.setEnabled(enabled && this._selectedRangeIndex !== -1 && this._selectedRangeIndex < this._ranges.length - 1);
    };
    
    /**
     * @override
     */
    MultiRangeInlineEditor.prototype.onAdded = function () {
        // Set the initial position of the selected marker now that we're laid out.
        this._updateSelectedMarker(false);

        // Call super
        MultiRangeInlineEditor.prototype.parentClass.onAdded.apply(this, arguments);

        // Initially size the inline widget (calls sizeInlineWidgetToContents())
        this._ruleListHeightChanged();
        
        this._updateCommands();
    };

    /**
     * Specify the range that is shown in the editor.
     *
     * @param {!number} index The index of the range to select, or -1 to deselect all. Index into this._ranges,
     *      so section headers are not included in the sequence.
     * @param {boolean} force Whether to re-select the item even if we think it's already selected
     *     (used if the range list has changed).
     */
    MultiRangeInlineEditor.prototype.setSelectedIndex = function (index, force) {
        var newIndex = Math.min(Math.max(-1, index), this._ranges.length - 1),
            self = this;
        
        if (!force && newIndex !== -1 && newIndex === this._selectedRangeIndex) {
            return;
        }

        // Remove selected class(es)
        var $previousItem = (this._selectedRangeIndex >= 0) ? this._ranges[this._selectedRangeIndex].$listItem : null;
        if ($previousItem) {
            $previousItem.removeClass("selected");
        }
        
        // Clear our listeners on the previous editor since it'll be destroyed in setInlineContent().
        if (this.editor) {
            this.editor.off(".MultiRangeInlineEditor");
        }

        this._selectedRangeIndex = newIndex;
        
        if (newIndex === -1) {
            // show the message div
            this.setInlineContent(null);
            var hasHiddenMatches = this._ranges.length > 0;
            if (hasHiddenMatches) {
                this.$messageDiv.text(Strings.INLINE_EDITOR_HIDDEN_MATCHES);
            } else if (this._messageCB) {
                this._messageCB(hasHiddenMatches).done(function (msg) {
                    self.$messageDiv.html(msg);
                });
            } else {
                this.$messageDiv.text(Strings.INLINE_EDITOR_NO_MATCHES);
            }
            this.$htmlContent.append(this.$messageDiv);
            this.sizeInlineWidgetToContents();
        } else {
            this.$messageDiv.remove();
            
            var range = this._getSelectedRange();
            range.$listItem.addClass("selected");
    
            // Add new editor
            this.setInlineContent(range.textRange.document, range.textRange.startLine, range.textRange.endLine);
            this.editor.focus();
    
            this._updateEditorMinHeight();
            this.editor.refresh();
            
            // Ensure the cursor position is visible in the host editor as the user is arrowing around.
            this.editor.on("cursorActivity.MultiRangeInlineEditor", this._ensureCursorVisible.bind(this));
            
            // ensureVisibility is set to false because we don't want to scroll the main editor when the user selects a view
            this.sizeInlineWidgetToContents();
    
            this._updateSelectedMarker(true);
        }
        
        this._updateCommands();
    };
    
    /**
     * Ensures that the editor's min-height is set so it never gets shorter than the rule list.
     * This is necessary to make sure the editor's horizontal scrollbar stays at the bottom of the
     * widget.
     */
    MultiRangeInlineEditor.prototype._updateEditorMinHeight = function () {
        if (!this.editor) {
            return;
        }
        
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
        $(this.editor.getScrollerElement())
            .css("min-height", (ruleListNaturalHeight - headerHeight) + "px");
    };
    
    /** Update inline widget height to reflect changed rule-list height */
    MultiRangeInlineEditor.prototype._ruleListHeightChanged = function () {
        // Editor's min height depends on rule list height
        this._updateEditorMinHeight();
        
        // Overall widget height may have changed too
        this.sizeInlineWidgetToContents();
    };

    MultiRangeInlineEditor.prototype._removeRange = function (range) {
        // If this is the last range, just close the whole widget
        if (this._ranges.length <= 1) {
            this.close();
            return;  // note: the dispose() that would normally happen below is covered by close()
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
        range.textRange.dispose();
        this._ranges.splice(index, 1);
        
        // Re-render list & section headers
        this._renderList();

        // Move selection highlight if deletion affected its position
        if (index < this._selectedRangeIndex) {
            this._selectedRangeIndex--;
            this._updateSelectedMarker(true);
        }
        
        if (this._ranges.length === 1) {
            this.$relatedContainer.remove();
            
            // Refresh the height of the inline editor since we remove
            // the entire selector list.
            if (this.editor) {
                this.editor.refresh();
            }
        }
        
        this._updateCommands();
    };
    
    /**
     * Adds a new range to the inline editor and selects it. The range will be inserted
     * immediately below the last range for the same document, or at the end of the list
     * if there are no other ranges for that document.
     * @param {string} name The label for the new range.
     * @param {Document} doc The document the range is in.
     * @param {number} lineStart The starting line of the range, 0-based, inclusive.
     * @param {number} lineEnd The ending line of the range, 0-based, inclusive.
     */
    MultiRangeInlineEditor.prototype.addAndSelectRange = function (name, doc, lineStart, lineEnd) {
        var newRange = new SearchResultItem({
                name: name,
                document: doc,
                lineStart: lineStart,
                lineEnd: lineEnd
            }),
            i;
        
        // Insert the new range after the last range from the same doc, or at the
        // end of the list.
        for (i = 0; i < this._ranges.length; i++) {
            if (this._fileComparator(this._ranges[i].textRange.document.file, doc.file) > 0) {
                break;
            }
        }
        this._ranges.splice(i, 0, newRange);
        
        // Update rule list display
        this._renderList();
        
        // Ensure rule list is visible if there are now multiple results
        if (this._ranges.length > 1 && !this.$relatedContainer.parent().length) {
            this.$wrapper.before(this.$relatedContainer);
        }
        
        // If added rule is in a collapsed item, expand it for clarity
        if (this._collapsedFiles[doc.file.fullPath]) {
            this._toggleSection(doc.file.fullPath);
        }
        
        // Select new range, showing it in the editor
        this.setSelectedIndex(i, true);  // force, since i might be same as before

        this._updateCommands();
    };

    MultiRangeInlineEditor.prototype._updateSelectedMarker = function (animate) {
        // If no selection or selection is in a collapsed section, just hide the marker
        if (this._selectedRangeIndex < 0 || this._collapsedFiles[this._getSelectedRange().textRange.document.file.fullPath]) {
            this.$selectedMarker.hide();
            return;
        }
        
        var $rangeItem = this._ranges[this._selectedRangeIndex].$listItem;
        
        // scroll the selection to the rangeItem
        var containerHeight = this.$relatedContainer.height(),
            itemTop = $rangeItem.position().top,
            scrollTop = this.$relatedContainer.scrollTop();

        this.$selectedMarker
            .show()
            .toggleClass("animate", animate)
            .css("top", itemTop)
            .height($rangeItem.outerHeight());

        if (containerHeight <= 0) {
            return;
        }

        var paddingTop = _parseStyleSize($rangeItem.parent(), "paddingTop");

        if ((itemTop - paddingTop) < scrollTop) {
            this.$relatedContainer.scrollTop(itemTop - paddingTop);
        } else {
            var itemBottom = itemTop + $rangeItem.height() + _parseStyleSize($rangeItem.parent(), "paddingBottom");

            if (itemBottom > (scrollTop + containerHeight)) {
                this.$relatedContainer.scrollTop(itemBottom - containerHeight);
            }
        }
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
        this.$editorHolder.off(".MultiRangeInlineEditor");
    };
    
    /**
     * Prevent clicks in the dead areas of the inlineWidget from changing the focus and insertion point in the editor.
     * This is done by detecting clicks in the inlineWidget that are not inside the editor or the range list and
     * restoring focus and the insertion point.
     */
    MultiRangeInlineEditor.prototype._onClick = function (event) {
        if (!this.editor) {
            return;
        }
        
        var childEditor = this.editor,
            editorRoot = childEditor.getRootElement(),
            editorPos = $(editorRoot).offset();
        
        function containsClick($parent) {
            return $parent.find(event.target).length > 0 || $parent[0] === event.target;
        }
        
        // Ignore clicks in editor and clicks on filename link
        // Check clicks on filename link in the context of the current inline widget.
        if (!containsClick($(editorRoot)) && !containsClick($(".filename", this.$htmlContent))) {
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
        if (!this.editor) {
            return;
        }
        
        if ($.contains(this.editor.getRootElement(), window.document.activeElement)) {
            var hostScrollPos = this.hostEditor.getScrollPos(),
                cursorCoords = this.editor._codeMirror.cursorCoords();
            
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
        return this._selectedRangeIndex >= 0 ? this._ranges[this._selectedRangeIndex] : null;
    };

    /**
     * Move the selection up or down, skipping any collapsed groups. If selection is currently IN a
     * collapsed group, we expand it first so that other items in the same file are eligible.
     */
    MultiRangeInlineEditor.prototype._selectNextPrev = function (dir) {
        if (this._selectedRangeIndex === -1) {
            return;
        }
        
        // Traverse up or down the list until we find an item eligible for selection
        var origDoc = this._ranges[this._selectedRangeIndex].textRange.document,
            i;
        for (i = this._selectedRangeIndex + dir; i >= 0 && i < this._ranges.length; i += dir) {
            var doc = this._ranges[i].textRange.document;
            
            // If first candidate is in same collapsed group as current selection, expand it
            if (doc === origDoc && this._collapsedFiles[doc.file.fullPath]) {
                this._toggleSection(doc.file.fullPath);
            }
                
            // Only consider expanded groups now
            if (!this._collapsedFiles[doc.file.fullPath]) {
                this.setSelectedIndex(i);
                return;
            }
        }
        // If we got here, we couldn't find any eligible item - so do nothing. Happens if selection is
        // already the first/last item, or if all remaining items above/below the selection are collapsed.
    };
    
    /**
     * Display the next range in the range list
     */
    MultiRangeInlineEditor.prototype._selectNextRange = function () {
        this._selectNextPrev(1);
    };
    
    /**
     *  Display the previous range in the range list
     */
    MultiRangeInlineEditor.prototype._selectPreviousRange = function () {
        this._selectNextPrev(-1);
    };

    /**
     * Sizes the inline widget height to be the maximum between the range list height and the editor height
     * @override 
     */
    MultiRangeInlineEditor.prototype.sizeInlineWidgetToContents = function () {
        // Size the code mirror editors height to the editor content
        MultiRangeInlineEditor.prototype.parentClass.sizeInlineWidgetToContents.call(this);
        
        // Size the widget height to the max between the editor/message content and the related ranges list
        var widgetHeight = Math.max(this.$related.height(),
                                    this.$header.outerHeight() +
                                        (this._selectedRangeIndex === -1 ? this.$messageDiv.outerHeight() : this.$editorHolder.height()));

        if (widgetHeight) {
            this.hostEditor.setInlineWidgetHeight(this, widgetHeight, false);
        }
    };
    
    /**
     * Called when the editor containing the inline is made visible. Updates UI based on
     * state that might have changed while the editor was hidden.
     */
    MultiRangeInlineEditor.prototype.onParentShown = function () {
        MultiRangeInlineEditor.prototype.parentClass.onParentShown.apply(this, arguments);
        this._updateSelectedMarker(false);
    };
    
    /**
     * Refreshes the height of the inline editor and all child editors.
     * @override
     */
    MultiRangeInlineEditor.prototype.refresh = function () {
        MultiRangeInlineEditor.prototype.parentClass.refresh.apply(this, arguments);
        this.sizeInlineWidgetToContents();
        if (this.editor) {
            this.editor.refresh();
        }
    };

    /**
     * Returns the currently focused MultiRangeInlineEditor.
     * @return {MultiRangeInlineEditor}
     */
    function getFocusedMultiRangeInlineEditor() {
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
        var focusedMultiRangeInlineEditor = getFocusedMultiRangeInlineEditor();
        if (focusedMultiRangeInlineEditor) {
            focusedMultiRangeInlineEditor._selectPreviousRange();
        }
    }
    
    /**
     * Next Range command handler
     */
    function _nextRange() {
        var focusedMultiRangeInlineEditor = getFocusedMultiRangeInlineEditor();
        if (focusedMultiRangeInlineEditor) {
            focusedMultiRangeInlineEditor._selectNextRange();
        }
    }
    
    _prevMatchCmd = CommandManager.register(Strings.CMD_QUICK_EDIT_PREV_MATCH, Commands.QUICK_EDIT_PREV_MATCH, _previousRange);
    _prevMatchCmd.setEnabled(false);
    _nextMatchCmd = CommandManager.register(Strings.CMD_QUICK_EDIT_NEXT_MATCH, Commands.QUICK_EDIT_NEXT_MATCH, _nextRange);
    _nextMatchCmd.setEnabled(false);

    exports.MultiRangeInlineEditor = MultiRangeInlineEditor;
    exports.getFocusedMultiRangeInlineEditor = getFocusedMultiRangeInlineEditor;
});
