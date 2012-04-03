/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var DocumentManager     = require("document/DocumentManager"),
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
     * @extends {InlineWidget}
     */
    function CSSInlineEditor(rules) {
        InlineTextEditor.call(this);
        this._rules = rules;
        this._selectedRuleIndex = -1;
    }
    CSSInlineEditor.prototype = new InlineTextEditor();
    CSSInlineEditor.prototype.constructor = CSSInlineEditor;
    CSSInlineEditor.prototype.parentClass = InlineTextEditor.prototype;
    CSSInlineEditor.prototype.$editorsDiv = null;
    CSSInlineEditor.prototype.$relatedContainer = null;

    /** 
     * @override
     * @param {!Editor} hostEditor  Outer Editor instance that inline editor will sit within.
     * 
     */
    CSSInlineEditor.prototype.load = function (hostEditor) {
        this.parentClass.load.call(this, hostEditor);
        
        // Container to hold all editors
        var self = this,
            hostScroller = hostEditor._codeMirror.getScrollerElement(),
            $ruleItem,
            $location;

        // Bind event handlers
        this._updateRelatedContainer = this._updateRelatedContainer.bind(this);

        // Create DOM to hold editors and related list
        this.$editorsDiv = $(document.createElement('div')).addClass("inlineEditorHolder");
        
        // Outer container for border-left and scrolling
        this.$relatedContainer = $(document.createElement("div")).addClass("relatedContainer");
        // Position immediately to the left of the main editor's scrollbar.
        var rightOffset = $(document.body).outerWidth() - ($(hostScroller).offset().left + $(hostScroller).get(0).clientWidth);
        this.$relatedContainer.css("right", rightOffset + "px");
        
        // List "selection" highlight
        this.$selectedMarker = $(document.createElement("div")).appendTo(this.$relatedContainer).addClass("selection");
        
        // Inner container
        var $related = $(document.createElement("div")).appendTo(this.$relatedContainer).addClass("related");
        
        // Rule list
        var $ruleList = $(document.createElement("ul")).appendTo($related);
        
        // create rule list
        this._ruleItems = [];
        this._rules.forEach(function (rule, i) {
            $ruleItem = $(document.createElement("li")).appendTo($ruleList);
            $ruleItem.text(rule.selector + " ");
            $ruleItem.click(function () {
                self.setSelectedRule(i);
            });
            
            $location = $(document.createElement("span")).appendTo($ruleItem);
            $location.addClass("location");
            $location.text(rule.document.file.name + ":" + (rule.lineStart + 1));
            
            self._ruleItems.push($ruleItem);
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
        
        // Listen to the editor's scroll event to reposition the relatedContainer.
        $(this.hostEditor).on("scroll", this._updateRelatedContainer);

        return (new $.Deferred()).resolve();
    };

    /**
     *
     *
     */
    CSSInlineEditor.prototype.setSelectedRule = function (index) {
        var newIndex = Math.min(Math.max(0, index), this._rules.length - 1);
        
        this._selectedRuleIndex = newIndex;
        var $ruleItem = this._ruleItems[this._selectedRuleIndex];

        this._ruleItems[this._selectedRuleIndex].toggleClass("selected", true);

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
        this.createInlineEditorFromText(rule.document, rule.lineStart, rule.lineEnd, this.$editorsDiv.get(0), extraKeys);
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
     * Called any time inline was closed, whether manually (via closeThisInline()) or automatically
     */
    CSSInlineEditor.prototype.onClosed = function () {
        this.parentClass.onClosed.call(this); // super.onClosed()
        
        // remove resize handlers for relatedContainer
        $(this.hostEditor).off("change", this._updateRelatedContainer);
        $(this.editors[0]).off("change", this._updateRelatedContainer);
        $(this.hostEditor).off("scroll", this._updateRelatedContainer);
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
            scrollerTop = $(hostScroller).offset().top,
            scrollerBottom = scrollerTop + hostScroller.clientHeight;
        if (rcTop < scrollerTop || rcBottom > scrollerBottom) {
            this.$relatedContainer.css("clip", "rect(" + Math.max(scrollerTop - rcTop, 0) + "px, auto, " +
                                       (rcHeight - Math.max(rcBottom - scrollerBottom, 0)) + "px, auto)");
        } else {
            this.$relatedContainer.css("clip", "");
        }
    };

    /**
     *
     *
     */
    CSSInlineEditor.prototype.getRules = function () {
        return this._rules;
    };

    /**
     *
     *
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
        this.hostEditor.setInlineWidgetHeight(this.inlineId, widgetHeight, true);

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

        CSSUtils.findMatchingRules(selectorName)
            .done(function (rules) {
                if (rules && rules.length > 0) {
                    var cssInlineEditor = new CSSInlineEditor(rules);
                    
                    cssInlineEditor.load(hostEditor).done(function () {
                        result.resolve(cssInlineEditor);
                    }).fail(function () {
                        result.reject();
                    });
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
