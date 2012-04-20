/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var DocumentManager     = require("document/DocumentManager"),
        TextRange           = require("document/TextRange").TextRange,
        HTMLUtils           = require("language/HTMLUtils"),
        CSSUtils            = require("language/CSSUtils"),
        EditorManager       = require("editor/EditorManager"),
        InlineTextEditor    = require("editor/InlineTextEditor").InlineTextEditor,
        Commands            = require("command/Commands"),
        CommandManager      = require("command/CommandManager");

    /**
     * Remove trailing "px" from a style size value.
     * @param {!JQuery} $target Element in DOM
     * @param {!string} styleName Style name to query
     * @return {number} Style value converted from string to number, removing "px" units
     */
    function parseStyleSize($target, styleName) {
        return parseInt($target.css(styleName), 10);
    }
    
    
    /**
     * @constructor
     * Stores one search result: its source file, line range, etc. plus the DOM node representing it
     * in the results list.
     */
    function SearchResultItem(ruleResult) {
        this.selector = ruleResult.selector;
        this.textRange = new TextRange(ruleResult.document, ruleResult.lineStart, ruleResult.lineEnd);
        // this.$listItem is assigned in load()
    }
    SearchResultItem.prototype.selector = null;
    SearchResultItem.prototype.textRange = null;
    SearchResultItem.prototype.$listItem = null;
    
    function updateRuleLabel(listItem, rule) {
        var text = rule.selector + " " + rule.textRange.document.file.name + " : " + (rule.textRange.startLine + 1);
        listItem.text(text);
        listItem.attr("title", text);
    }
    /**
     * @constructor
     * @extends {InlineWidget}
     */
    function CSSInlineEditor(rules) {
        InlineTextEditor.call(this);
        
        // Store the results to show in the rule list. This creates TextRanges bound to the Document,
        // which will stay up to date automatically (but we must be sure to detach them later)
        this._rules = rules.map(function (ruleResult) {
            return new SearchResultItem(ruleResult);
        });
        
        this._selectedRuleIndex = -1;
    }
    CSSInlineEditor.prototype = new InlineTextEditor();
    CSSInlineEditor.prototype.constructor = CSSInlineEditor;
    CSSInlineEditor.prototype.parentClass = InlineTextEditor.prototype;
    
    CSSInlineEditor.prototype.$editorsDiv = null;
    CSSInlineEditor.prototype.$relatedContainer = null;
    CSSInlineEditor.prototype.$selectedMarker = null;
    
    /** @type {Array.<SearchResultItem>} */
    CSSInlineEditor.prototype._rules = null;
    CSSInlineEditor.prototype._selectedRuleIndex = null;

    /** 
     * @override
     * @param {!Editor} hostEditor  Outer Editor instance that inline editor will sit within.
     * 
     */
    CSSInlineEditor.prototype.load = function (hostEditor) {
        this.parentClass.load.call(this, hostEditor);
        
        // Container to hold all editors
        var self = this;

        // Bind event handlers
        this._updateRelatedContainer = this._updateRelatedContainer.bind(this);
        this._ensureCursorVisible = this._ensureCursorVisible.bind(this);
        this._onClick = this._onClick.bind(this);

        // Create DOM to hold editors and related list
        this.$editorsDiv = $(document.createElement('div')).addClass("inlineEditorHolder");
        
        // Outer container for border-left and scrolling
        this.$relatedContainer = $(document.createElement("div")).addClass("relatedContainer");
        this._relatedContainerInserted = false;
        this._relatedContainerInsertedHandler = this._relatedContainerInsertedHandler.bind(this);
        
        // FIXME (jasonsj): deprecated event http://www.w3.org/TR/DOM-Level-3-Events/
        this.$relatedContainer.on("DOMNodeInserted", this._relatedContainerInsertedHandler);
        
        // List "selection" highlight
        this.$selectedMarker = $(document.createElement("div")).appendTo(this.$relatedContainer).addClass("selection");
        
        // Inner container
        var $related = $(document.createElement("div")).appendTo(this.$relatedContainer).addClass("related");
        
        // Rule list
        var $ruleList = $(document.createElement("ul")).appendTo($related);
        
        // create rule list & add listeners for rule textrange changes
        var ruleItemText;
        this._rules.forEach(function (rule, i) {
            // Create list item UI
            var $ruleItem = $(document.createElement("li")).appendTo($ruleList);
            updateRuleLabel($ruleItem, rule);
            $ruleItem.mousedown(function () {
                self.setSelectedRule(i);
            });

            self._rules[i].$listItem = $ruleItem;
            
            // Update list item as TextRange changes
            $(self._rules[i].textRange).on("change", function () {
                updateRuleLabel($ruleItem, rule);
            });
            
            // If TextRange lost sync, react just as we do for an inline Editor's lostContent event:
            // close the whole inline widget
            $(self._rules[i].textRange).on("lostSync", function () {
                self.close();
            });
        });
        
        // select the first rule
        self.setSelectedRule(0);
        
        // attach to main container
        this.$htmlContent.append(this.$editorsDiv).append(this.$relatedContainer);
        
        // initialize position based on the main #editorHolder
        setTimeout(this._updateRelatedContainer, 0);
        
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
     *
     *
     */
    CSSInlineEditor.prototype.setSelectedRule = function (index) {
        var newIndex = Math.min(Math.max(0, index), this._rules.length - 1);
        
        if (newIndex === this._selectedRuleIndex) {
            return;
        }

        // Remove selected class(es)
        var previousItem = (this._selectedRuleIndex >= 0) ? this._rules[this._selectedRuleIndex].$listItem : null;
        
        if (previousItem) {
            previousItem.toggleClass("selected", false);
        }
        
        this._selectedRuleIndex = newIndex;
        var $ruleItem = this._rules[this._selectedRuleIndex].$listItem;
        
        this._rules[this._selectedRuleIndex].$listItem.toggleClass("selected", true);

        // Remove previous editors
        $(this.editors[0]).off("change", this._updateRelatedContainer);

        this.editors.forEach(function (editor) {
            editor.destroy(); //release ref on Document
        });
        
        this.editors = [];
        this.$editorsDiv.children().remove();

        // Add new editor
        var rule = this.getSelectedRule();
        this.createInlineEditorFromText(rule.textRange.document, rule.textRange.startLine, rule.textRange.endLine, this.$editorsDiv.get(0));
        this.editors[0].focus();

        // Changes in size to the inline editor should update the relatedContainer
        // Note: normally it's not kosher to listen to changes on a specific editor,
        // but in this case we're specifically concerned with changes in the given
        // editor, not general document changes.
        $(this.editors[0]).on("change", this._updateRelatedContainer);
        
        // Cursor activity in the inline editor may cause us to horizontally scroll.
        $(this.editors[0]).on("cursorActivity", this._ensureCursorVisible);

        
        this.editors[0].refresh();
        // ensureVisibility is set to false because we don't want to scroll the main editor when the user selects a view
        this.sizeInlineWidgetToContents(true, false);
        this._updateRelatedContainer();

        // scroll the selection to the ruleItem, use setTimeout to wait for DOM updates
        var self = this;
        setTimeout(function () {
            var containerHeight = self.$relatedContainer.height(),
                itemTop = $ruleItem.position().top,
                scrollTop = self.$relatedContainer.scrollTop();
            
            self.$selectedMarker.css("top", itemTop);
            self.$selectedMarker.height($ruleItem.outerHeight());
            
            if (containerHeight <= 0) {
                return;
            }
            
            var paddingTop = parseStyleSize($ruleItem.parent(), "paddingTop");
            
            if ((itemTop - paddingTop) < scrollTop) {
                self.$relatedContainer.scrollTop(itemTop - paddingTop);
            } else {
                var itemBottom = itemTop + $ruleItem.height() + parseStyleSize($ruleItem.parent(), "paddingBottom");
                
                if (itemBottom > (scrollTop + containerHeight)) {
                    self.$relatedContainer.scrollTop(itemBottom - containerHeight);
                }
            }
        }, 0);
    };

    /**
     * Called any time inline is closed, whether manually (via closeThisInline()) or automatically
     */
    CSSInlineEditor.prototype.onClosed = function () {
        this.parentClass.onClosed.call(this); // super.onClosed()
        
        // remove resize handlers for relatedContainer
        $(this.hostEditor).off("change", this._updateRelatedContainer);
        $(this.editors[0]).off("change", this._updateRelatedContainer);
        $(this.editors[0]).off("cursorActivity", this._ensureCursorVisible);
        $(this).off("offsetTopChanged", this._updateRelatedContainer);
        $(window).off("resize", this._updateRelatedContainer);
        
        // de-ref all the Documents in the search results
        this._rules.forEach(function (searchResult) {
            searchResult.textRange.dispose();
        });
    };
    
    /**
     * @private
     * Set _relatedContainerInserted flag once the $relatedContainer is inserted in the DOM.
     */
    CSSInlineEditor.prototype._relatedContainerInsertedHandler = function () {
        this.$relatedContainer.off("DOMNodeInserted", this._relatedContainerInsertedHandler);
        this._relatedContainerInserted = true;
    };
    
    /**
     * Prevent clicks in the dead areas of the inlineWidget from changing the focus and insertion point in the editor.
     * This is done by detecting clicks in the inlineWidget that are not inside the editor or the rule list and
     * restoring focus and the insertion point.
     */
    CSSInlineEditor.prototype._onClick = function (event) {
        var childEditor = this.editors[0],
            editorRoot = childEditor.getRootElement(),
            editorPos = $(editorRoot).offset();
        if ($(editorRoot).find(event.target).length === 0) {
            childEditor.focus();
            // Only set the cursor if the click isn't in the rule list.
            if (this.$relatedContainer.find(event.target).length === 0) {
                if (event.pageY < editorPos.top) {
                    childEditor.setCursorPos(0, 0);
                } else if (event.pageY > editorPos.top + $(editorRoot).height()) {
                    var lastLine = childEditor.getLastVisibleLine();
                    childEditor.setCursorPos(lastLine, childEditor.getLineText(lastLine).length);
                }
            }
        }
    };
    
    /**
     *
     *
     */
    CSSInlineEditor.prototype._updateRelatedContainer = function () {
        var borderThickness = (this.$htmlContent.outerHeight() - this.$htmlContent.innerHeight()) / 2;
        this.$relatedContainer.css("top", this.$htmlContent.offset().top + borderThickness);
        this.$relatedContainer.height(this.$htmlContent.height());
        
        // Because we're using position: fixed, we need to explicitly clip the rule list if it crosses
        // out of the top or bottom of the scroller area.
        var hostScroller = this.hostEditor.getScrollerElement(),
            rcTop = this.$relatedContainer.offset().top,
            rcHeight = this.$relatedContainer.outerHeight(),
            rcBottom = rcTop + rcHeight,
            scrollerOffset = $(hostScroller).offset(),
            scrollerTop = scrollerOffset.top,
            scrollerBottom = scrollerTop + hostScroller.clientHeight,
            scrollerLeft = scrollerOffset.left,
            rightOffset = $(document.body).outerWidth() - (scrollerLeft + hostScroller.clientWidth);
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

        // Add extra padding to the right edge of the widget to account for the rule list.
        this.$htmlContent.css("padding-right", this.$relatedContainer.outerWidth() + "px");
        
        // Set the minimum width of the widget (which doesn't include the padding) to the width
        // of CodeMirror's linespace, so that the total width will be at least as large as the
        // width of the host editor's code plus the padding for the rule list. We need to do this
        // rather than just setting min-width to 100% because adding padding for the rule list
        // actually pushes out the width of the container, so we would end up continuously
        // growing the overall width.
        // This is a bit of a hack since it relies on knowing some detail about the innards of CodeMirror.
        var lineSpace = this.hostEditor._getLineSpaceElement(),
            minWidth = $(lineSpace).offset().left - this.$htmlContent.offset().left + $(lineSpace).width();
        this.$htmlContent.css("min-width", minWidth + "px");
    };
    
    /**
     * Based on the position of the cursor in the inline editor, determine whether we need to change the
     * scroll position of the host editor to ensure that the cursor is visible.
     */
    CSSInlineEditor.prototype._ensureCursorVisible = function () {
        if ($.contains(this.editors[0].getRootElement(), document.activeElement)) {
            var cursorCoords = this.editors[0]._codeMirror.cursorCoords(),
                lineSpaceOffset = $(this.editors[0]._getLineSpaceElement()).offset(),
                ruleListOffset = this.$relatedContainer.offset();
            // If we're off the left-hand side, we just want to scroll it into view normally. But
            // if we're underneath the rule list on the right, we want to ask the host editor to 
            // scroll far enough that the current cursor position is visible to the left of the rule 
            // list. (Because we always add extra padding for the rule list, this is always possible.)
            if (cursorCoords.x >= ruleListOffset.left) {
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
     * @return {Array.<SearchResultItem>}
     */
    CSSInlineEditor.prototype.getRules = function () {
        return this._rules;
    };

    /**
     * @return {!SearchResultItem}
     */
    CSSInlineEditor.prototype.getSelectedRule = function () {
        return this._rules[this._selectedRuleIndex];
    };

    /**
     * Display the next css rule in the rule list
     */
    CSSInlineEditor.prototype.nextRule = function () {
        this.setSelectedRule(this._selectedRuleIndex + 1);
    };
    
    /**
     *  Display the previous css rule in the rule list
     */
    CSSInlineEditor.prototype.previousRule = function () {
        this.setSelectedRule(this._selectedRuleIndex - 1);
    };

    /**
     * Sizes the inline widget height to be the maximum between the rule list height and the editor height
     * @override 
     * @param {boolean} force the editor to resize
     * @param {boolean} ensureVisibility makes the parent editor scroll to display the inline editor. Default true.
     */
    CSSInlineEditor.prototype.sizeInlineWidgetToContents = function (force, ensureVisibility) {
        // Size the code mirror editors height to the editor content
        this.parentClass.sizeInlineWidgetToContents.call(this, force);
        // Size the widget height to the max between the editor content and the related rules list
        var widgetHeight = Math.max(this.$relatedContainer.find(".related").height(), this.$editorsDiv.height());
        this.hostEditor.setInlineWidgetHeight(this, widgetHeight, ensureVisibility);

        // The related rules container size itself based on htmlContent which is set by setInlineWidgetHeight above.
        this._updateRelatedContainer();
    };


    /**
     * Given a position in an HTML editor, returns the relevant selector for the attribute/tag
     * surrounding that position, or "" if none is found.
     * @param {!Editor} editor
     * @private
     */
    function _getSelectorName(editor, pos) {
        var tagInfo = HTMLUtils.getTagInfo(editor, pos),
            selectorName = "";
        
        if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
            // Type selector
            selectorName = tagInfo.tagName;
        } else if (tagInfo.position.tokenType === HTMLUtils.ATTR_NAME ||
                   tagInfo.position.tokenType === HTMLUtils.ATTR_VALUE) {
            if (tagInfo.attr.name === "class") {
                // Class selector. We only look for the class name
                // that includes the insertion point. For example, if
                // the attribute is: 
                //   class="error-dialog modal hide"
                // and the insertion point is inside "modal", we want ".modal"
                var attributeValue = tagInfo.attr.value;
                var startIndex = attributeValue.substr(0, tagInfo.position.offset).lastIndexOf(" ");
                var endIndex = attributeValue.indexOf(" ", tagInfo.position.offset);
                selectorName = "." +
                    attributeValue.substring(
                        startIndex === -1 ? 0 : startIndex + 1,
                        endIndex === -1 ? attributeValue.length : endIndex
                    );
                
                // If the insertion point is surrounded by space, selectorName is "."
                // Check for that here
                if (selectorName === ".") {
                    selectorName = "";
                }
            } else if (tagInfo.attr.name === "id") {
                // ID selector
                selectorName = "#" + tagInfo.attr.value;
            }
        }
        
        return selectorName;
    }

    /**
     * This function is registered with EditManager as an inline editor provider. It creates a CSSInlineEditor
     * when cursor is on an HTML tag name, class attribute, or id attribute, find associated
     * CSS rules and show (one/all of them) in an inline editor.
     *
     * @param {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {$.Promise} a promise that will be resolved with an InlineWidget
     *      or null if we're not going to provide anything.
     */
    function htmlToCSSProvider(hostEditor, pos) {
        // Only provide a CSS editor when cursor is in HTML content
        if (hostEditor._codeMirror.getOption("mode") !== "htmlmixed") {
            return null;
        }
        var htmlmixedState = hostEditor._codeMirror.getTokenAt(pos).state;
        if (htmlmixedState.mode !== "html") {
            return null;
        }
        
        // Only provide CSS editor if the selection is an insertion point
        var sel = hostEditor.getSelection(false);
        if (sel.start.line !== sel.end.line || sel.start.ch !== sel.end.ch) {
            return null;
        }
        
        var selectorName = _getSelectorName(hostEditor, pos);
        if (selectorName === "") {
            return null;
        }

        var result = new $.Deferred();

        CSSUtils.findMatchingRules(selectorName, hostEditor.document)
            .done(function (rules) {
                if (rules && rules.length > 0) {
                    var cssInlineEditor = new CSSInlineEditor(rules);
                    cssInlineEditor.load(hostEditor);
                    
                    result.resolve(cssInlineEditor);
                } else {
                    // No matching rules were found.
                    result.reject();
                }
            })
            .fail(function () {
                console.log("Error in findMatchingRules()");
                result.reject();
            });
        
        return result.promise();
    }

    /**
     * Returns the currently focused CSSInlineEditor.
     * @returns {CSSInlineEditor}
     */
    function _getFocusedCSSInlineEditor() {
        
        var focusedCSSInlineEditor = null,
            result = EditorManager.getFocusedInlineWidget();
        
        if (result) {
            var focusedWidget = result.widget;
            if (focusedWidget && focusedWidget instanceof CSSInlineEditor) {
                focusedCSSInlineEditor = focusedWidget;
            }
        }
        
        return focusedCSSInlineEditor;
    }

    /**
     * Previous Rule command handler
     */
    function _previousRule() {
        var focusedCSSInlineEditor = _getFocusedCSSInlineEditor();
        if (focusedCSSInlineEditor) {
            focusedCSSInlineEditor.previousRule();
        }
    }
    
    /**
     * Next Rule command handler
     */
    function _nextRule() {
        var focusedCSSInlineEditor = _getFocusedCSSInlineEditor();
        if (focusedCSSInlineEditor) {
            focusedCSSInlineEditor.nextRule();
        }
    }

    EditorManager.registerInlineEditProvider(htmlToCSSProvider);
    
    CommandManager.register(Commands.PREVIOUS_CSS_RULE, _previousRule);
    CommandManager.register(Commands.NEXT_CSS_RULE, _nextRule);

    exports.CSSInlineEditor = CSSInlineEditor;

});
