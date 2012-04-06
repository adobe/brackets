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
        InlineTextEditor    = require("editor/InlineTextEditor").InlineTextEditor;

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
        this._onClick = this._onClick.bind(this);

        // Create DOM to hold editors and related list
        this.$editorsDiv = $(document.createElement('div')).addClass("inlineEditorHolder");
        
        // Outer container for border-left and scrolling
        this.$relatedContainer = $(document.createElement("div")).addClass("relatedContainer");
        this._relatedContainerInserted = false;
        this._relatedContainerInsertedHandler = this._relatedContainerInsertedHandler.bind(this);
        this.$relatedContainer.on("DOMNodeInserted", this._relatedContainerInsertedHandler);
        
        // List "selection" highlight
        this.$selectedMarker = $(document.createElement("div")).appendTo(this.$relatedContainer).addClass("selection");
        
        // Inner container
        var $related = $(document.createElement("div")).appendTo(this.$relatedContainer).addClass("related");
        
        // Rule list
        var $ruleList = $(document.createElement("ul")).appendTo($related);
        
        // create rule list & add listeners for rule textrange changes
        this._rules.forEach(function (rule, i) {
            // Create list item UI
            var $ruleItem = $(document.createElement("li")).appendTo($ruleList);
            $ruleItem.text(rule.selector + " ");
            
            $ruleItem.click(function () {
                self.setSelectedRule(i);
            });
            
            var $location = $(document.createElement("span")).appendTo($ruleItem)
                    .addClass("location")
                    .text(rule.textRange.document.file.name + ":" + (rule.textRange.startLine + 1));

            self._rules[i].$listItem = $ruleItem;
            
            // Update list item as TextRange changes
            $(self._rules[i].textRange).on("change", function () {
                $location.text(rule.textRange.document.file.name + ":" + (rule.textRange.startLine + 1));
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
        
        this._selectedRuleIndex = newIndex;
        var $ruleItem = this._rules[this._selectedRuleIndex].$listItem;

        $ruleItem.toggleClass("selected", true);

        // Remove previous editors
        this.editors.forEach(function (editor) {
            editor.destroy(); //release ref on Document
        });
        this.editors = [];
        this.$editorsDiv.children().remove();
        $(this.editors[0]).off("change", this._updateRelatedContainer);

        // Keyboard shortcuts
        var extraKeys = {
            "Alt-Up" : $.proxy(this.previousRule, this),
            "Alt-Down" : $.proxy(this.nextRule, this)
        };


        // Add new editor
        var rule = this.getSelectedRule();
        this.createInlineEditorFromText(rule.textRange.document, rule.textRange.startLine, rule.textRange.endLine, this.$editorsDiv.get(0), extraKeys);
        this.editors[0].focus();

        // Changes in size to the inline editor should update the relatedContainer
        // Note: normally it's not kosher to listen to changes on a specific editor,
        // but in this case we're specifically concerned with changes in the given
        // editor, not general document changes.
        $(this.editors[0]).on("change", this._updateRelatedContainer);

        this.sizeInlineWidgetToContents(true);
        this._updateRelatedContainer();

        // scroll the selection to the ruleItem, use setTimeout to wait for DOM updates
        var self = this;
        setTimeout(function () {
            var containerHeight = self.$relatedContainer.height(),
                itemTop = $ruleItem.position().top,
                scrollTop = self.$relatedContainer.scrollTop();
            
            self.$selectedMarker.css("top", itemTop);
            self.$selectedMarker.height($ruleItem.height());
            
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
     * Handle a click outside our child editor by setting focus back to it.
     */
    CSSInlineEditor.prototype._onClick = function (event) {
        var childEditor = this.editors[0],
            editorRoot = childEditor.getRootElement(),
            editorPos = $(editorRoot).offset();
        if (!$.contains(editorRoot, event.target)) {
            childEditor.focus();
            if (event.pageY < editorPos.top) {
                childEditor.setCursorPos(0, 0);
            } else if (event.pageY > editorPos.top + $(editorRoot).height()) {
                var lastLine = childEditor.getLastVisibleLine();
                childEditor.setCursorPos(lastLine, childEditor.getLineText(lastLine).length);
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
        var hostScroller = this.hostEditor._codeMirror.getScrollerElement(),
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
     * @overide 
     */
    CSSInlineEditor.prototype.sizeInlineWidgetToContents = function (force) {
        // Size the code mirror editors height to the editor content
        this.parentClass.sizeInlineWidgetToContents.call(this, force);
        // Size the widget height to the max between the editor content and the related rules list
        var widgetHeight = Math.max(this.$relatedContainer.find(".related").height(), this.$editorsDiv.height());
        this.hostEditor.setInlineWidgetHeight(this, widgetHeight, true);

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


    EditorManager.registerInlineEditProvider(htmlToCSSProvider);
    

    exports.CSSInlineEditor = CSSInlineEditor;

});
