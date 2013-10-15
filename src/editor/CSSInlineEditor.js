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
/*global define, $, CodeMirror, window, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var CSSUtils                = require("language/CSSUtils"),
        DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager"),
        Editor                  = require("editor/Editor").Editor,
        FileIndexManager        = require("project/FileIndexManager"),
        HTMLUtils               = require("language/HTMLUtils"),
        Menus                   = require("command/Menus"),
        MultiRangeInlineEditor  = require("editor/MultiRangeInlineEditor").MultiRangeInlineEditor,
        PopUpManager            = require("widgets/PopUpManager"),
        Strings                 = require("strings");

    var StylesheetsMenuTemplate = require("text!htmlContent/stylesheets-menu.html");

    /**
     * Given a position in an HTML editor, returns the relevant selector for the attribute/tag
     * surrounding that position, or "" if none is found.
     * @param {!Editor} editor
     * @private
     */
    function _getSelectorName(editor, pos) {
        var tagInfo = HTMLUtils.getTagInfo(editor, pos),
            selectorName = "";
        
        if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME || tagInfo.position.tokenType === HTMLUtils.CLOSING_TAG) {
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
     * @private
     * Create the list of stylesheets in the dropdown menu.
     * @return {string} The html content
     */
    function _renderList(cssFileInfos) {
        var templateVars   = {
                styleSheetList : cssFileInfos
            };

        return Mustache.render(StylesheetsMenuTemplate, templateVars);
    }

    /**
     * @private
     * Add a new rule for the given selector to the given document, then add the rule to the
     * given inline editor.
     * @param {string} selectorName The selector to create a rule for.
     * @param {MultiRangeInlineEditor} inlineEditor The inline editor to display the new rule in.
     * @param {Document} styleDoc The document the rule should be inserted in.
     */
    function _addRule(selectorName, inlineEditor, styleDoc) {
        var newRuleInfo = CSSUtils.addRuleToDocument(styleDoc, selectorName, Editor.getUseTabChar(), Editor.getSpaceUnits());
        inlineEditor.addAndSelectRange(selectorName, styleDoc, newRuleInfo.range.from.line, newRuleInfo.range.to.line);
        inlineEditor.editor.setCursorPos(newRuleInfo.pos.line, newRuleInfo.pos.ch);
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
        if (hostEditor.getLanguageForSelection().getId() !== "html") {
            return null;
        }
        
        // Only provide CSS editor if the selection is within a single line
        var sel = hostEditor.getSelection();
        if (sel.start.line !== sel.end.line) {
            return null;
        }
        
        // Always use the selection start for determining selector name. The pos
        // parameter is usually the selection end.
        var selectorName = _getSelectorName(hostEditor, sel.start);
        if (selectorName === "") {
            return null;
        }

        var result = new $.Deferred(),
            cssInlineEditor,
            cssFileInfos = [],
            $newRuleButton,
            $dropdown,
            $dropdownItem;

        /**
         * @private
         * Close the dropdown.
         */
        function _closeDropdown() {
            // Since we passed "true" for autoRemove to addPopUp(), this will
            // automatically remove the dropdown from the DOM. Also, PopUpManager
            // will call _cleanupDropdown().
            if ($dropdown) {
                PopUpManager.removePopUp($dropdown);
            }
        }
        
        /**
         * @private
         * Remove the various event handlers that close the dropdown. This is called by the
         * PopUpManager when the dropdown is closed.
         */
        function _cleanupDropdown() {
            $("html").off("click", _closeDropdown);
            $dropdown.off("click mouseenter mouseleave");
            $dropdown = null;
    
            EditorManager.focusEditor();
        }

        /**
         * Adds the click and mouse enter/leave events to the dropdown
         */
        function _handleListEvents() {
            $dropdown
                .on("click", "a", function () {
                    var $link = $(this),
                        path  = $link.data("path");

                    if (path) {
                        DocumentManager.getDocumentForPath(path).done(function (styleDoc) {
                            _addRule(selectorName, cssInlineEditor, styleDoc);
                        });
                        _closeDropdown();
                    }
                })
                .on("mouseenter", "a", function () {
                    if ($dropdownItem) {
                        $dropdownItem.removeClass("selected");
                    }
                    $dropdownItem = $(this).addClass("selected");
                })
                .on("mouseleave", "a", function () {
                    var $link = $(this).removeClass("selected");
                    
                    if ($link.get(0) === $dropdownItem.get(0)) {
                        $dropdownItem = null;
                    }
                });
        }

        /**
         * @private
         * Show or hide the stylesheets dropdown.
         */
        function _showDropdown() {
            // If the dropdown is already visible, just return (so the root click handler on html
            // will close it).
            if ($dropdown) {
                return;
            }
            
            Menus.closeAll();
            
            $dropdown = $(_renderList(cssFileInfos));
            
            var toggleOffset = $newRuleButton.offset();
            $dropdown
                .css({
                    left: toggleOffset.left,
                    top: toggleOffset.top + $newRuleButton.outerHeight()
                })
                .appendTo($("body"));
            
            PopUpManager.addPopUp($dropdown, _cleanupDropdown, true);
            
            $("html").on("click", _closeDropdown);
    
            _handleListEvents();
        }
    
        /**
         * @private
         * Display list of stylesheets in project, then create a new rule in the given stylesheet and
         * add it to the given inline editor.
         * @param {string} selectorName The selector to create a rule for.
         * @param {MultiRangeInlineEditor} inlineEditor The inline editor to display the new rule in.
         */
        function _handleNewRule() {
            _showDropdown();
        }

        CSSUtils.findMatchingRules(selectorName, hostEditor.document)
            .done(function (rules) {
                cssInlineEditor = new MultiRangeInlineEditor(rules || []);
                cssInlineEditor.load(hostEditor);

                var $header = $(".inline-editor-header", cssInlineEditor.$htmlContent);
                $newRuleButton = $("<button class='stylesheet-button btn btn-mini disabled'/>")
                    .text(Strings.BUTTON_NEW_RULE)
                    .on("click", function (e) {
                        if (!$newRuleButton.hasClass("disabled")) {
                            _handleNewRule();
                        }
                        e.stopPropagation();
                    });
                $header.append($newRuleButton);
                
                result.resolve(cssInlineEditor);

                // Now that dialog has been built, collect list of stylesheets
                FileIndexManager.getFileInfoList("css")
                    .done(function (fileInfos) {
                        cssFileInfos = fileInfos;
                        
                        // "New Rule" button is disabled by default and gets enabled
                        // here if there are any stylesheets in project
                        if (cssFileInfos.length > 0) {
                            $newRuleButton.removeClass("disabled");
                        }
                    });
            })
            .fail(function () {
                console.log("Error in findMatchingRules()");
                result.reject();
            });
        
        return result.promise();
    }

    EditorManager.registerInlineEditProvider(htmlToCSSProvider);

});
