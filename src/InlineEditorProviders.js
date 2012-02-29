/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

/**
 * InlineEditorProviders contains providers for Brackets' various built-in code editors. "Provider"
 * essentially means "a function that you pass to EditorManager.registerInlineEditProvider()".
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CodeHintUtils       = require("CodeHintUtils"),
        CSSManager          = require("CSSManager"),
        EditorManager       = require("EditorManager"),
        FileUtils           = require("FileUtils"),
        ProjectManager      = require("ProjectManager");

    var _htmlToCSSProviders = [];

    /**
     * Show a range of text in an inline editor.
     * 
     * @param {!CodeMirror} parentEditor The parent editor that will contain the inline editor
     * @param {!FileEntry} fileEntry File containing inline content
     * @param {!Number} startLine The first line to be shown in the inline editor 
     * @param {!Number} endLine The last line to be shown in the inline editor
     */
    function _showTextRangeInInlineEditor(parentEditor, fileEntry, startLine, endLine) {
        var result = new $.Deferred();
        
        FileUtils.readAsText(fileEntry)
            .done(function (text) {
                var range = {
                    startLine: startLine,
                    endLine: endLine - 1   // rule.lineEnd is exclusive, range.endLine is inclusive
                };
                var inlineInfo = EditorManager.createInlineEditorFromText(parentEditor, text, range, fileEntry.fullPath);
                
                var inlineEditor = inlineInfo.editor;
                
                // For Sprint 4, editor is a read-only view
                inlineEditor.setOption("readOnly", true);
                
                result.resolve(inlineInfo);
            })
            .fail(function (fileError) {
                console.log("Error reading as text: ", fileError);
                result.reject();
            });
    
        return result.promise();
    }
    
    /**
     * When cursor is on an HTML tag name, class attribute, or id attribute, find associated
     * CSS rules and show (one/all of them) in an inline editor.
     *
     * @param {!CodeMirror} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {$.Promise} a promise that will be resolved with:
     *      {{content:DOMElement, height:Number, onAdded:function(inlineId:Number)}}
     *      or null if we're not going to provide anything.
     */
    function htmlToCSSProvider(editor, pos) {
        // Only provide a CSS editor when cursor is in HTML content
        if (editor.getOption("mode") !== "htmlmixed") {
            return null;
        }
        var htmlmixedState = editor.getTokenAt(pos).state;
        if (htmlmixedState.mode !== "html") {
            return null;
        }
        
        // Only provide CSS editor if the selection is an insertion point
        var selStart = editor.getCursor(false),
            selEnd = editor.getCursor(true);
        
        if (selStart.line !== selEnd.line || selStart.ch !== selEnd.ch) {
            return null;
        }
                
        var tagInfo = CodeHintUtils.getTagInfo(editor, pos),
            selectorName = "";
        
        if (tagInfo.position.tokenType === CodeHintUtils.TAG_NAME) {
            // Type selector
            selectorName = tagInfo.tagName;
        } else if (tagInfo.position.tokenType === CodeHintUtils.ATTR_VALUE) {
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
        
        if (selectorName === "") {
            return null;
        }

        var result = new $.Deferred();

        CSSManager.findMatchingRules(selectorName)
            .done(function (rules) {
                if (rules && rules.length > 0) {
                    var rule = rules[0];  // For Sprint 4 we use the first match only
                    
                    _showTextRangeInInlineEditor(editor, rule.source, rule.lineStart, rule.lineEnd)
                        .done(function (inlineInfo) {

                            $(inlineInfo.content).find(".CodeMirror-scroll").append('<div class="filename">' + fileEntry.name + '</div>');
                            $(inlineInfo.content).append('<div class="shadow top"/>');
                            $(inlineInfo.content).append('<div class="shadow bottom"/>');
                
                            result.resolve(inlineInfo);
                        })
                        .fail(function () {
                            result.reject();
                        });
                } else {
                    // No matching rules were found.
                    result.reject();
                }
            })
            .fail(function () {
                console.log("Error in CSSManager.findMatchingRules()");
                result.reject();
            });
        
        return result.promise();
    }


    /** Initialize: register listeners */
    function init() {
        EditorManager.registerInlineEditProvider(htmlToCSSProvider);
    }
    
    // Define public API
    exports.init = init;
});
