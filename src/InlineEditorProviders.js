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
        CSSUtils            = require("CSSUtils"),
        DocumentManager     = require("DocumentManager"),
        EditorManager       = require("EditorManager"),
        FileUtils           = require("FileUtils"),
        ProjectManager      = require("ProjectManager");

    // track divs to re-position manually
    var _htmlToCSSProviderContent   = [];
    
    /**
     * Reposition a .inlineCodeEditor .filename div { right: 20px; }
     * @private
     */
    function _updateInlineEditorFilename(holderWidth, filenameDiv) {
        var filenameWidth = $(filenameDiv).outerWidth();
        $(filenameDiv).css("left", holderWidth - filenameWidth - 40);
    }
    
    /**
     * Shows or hides the dirty indicator
     * @private
     */
    function _showDirtyIndicator($indicatorDiv, isDirty) {
        // Show or hide the dirty indicator by adjusting
        // the width of the div. The "hidden" width is 
        // 4 pixels to make the padding look correct.
        $indicatorDiv.css("width", isDirty ? 16 : 4);
    }
    
    /**
     * Returns editor holder width (not CodeMirror's width).
     * @private
     */
    function _editorHolderWidth() {
        return $("#editorHolder").width();
    }
    
    /**
     * Reposition all filename divs after a window resize.
     * @private
     */
    function _updateAllFilenames() {
        var holderWidth = _editorHolderWidth();
        
        _htmlToCSSProviderContent.forEach(function (value) {
            var filenameDiv = $(value).find(".filename");
            _updateInlineEditorFilename(holderWidth, filenameDiv);
        });
    }
    
    /**
     * Respond to dirty flag change event. If the dirty flag is associated with an inline editor,
     * show (or hide) the dirty indicator.
     * @private
     */
    function _dirtyFlagChangeHandler(event, doc) {
        
        _htmlToCSSProviderContent.forEach(function (value) {
            var $filenameDiv = $(value).find(".filename");
            // This only checks filename here. If there are multiple documents with the same filename
            // (in different directories), this test will fail.
            // This needs to be fixed once we have proper document<-->editor mapping.
            if ($filenameDiv.text() === doc.file.name) {
                _showDirtyIndicator($filenameDiv.find(".dirty-indicator"), doc.isDirty);
            }
        });
    }
    
    /**
     * Stops tracking an editor after being removed from the document.
     * @private
     */
    function _inlineEditorRemoved(event) {
        var indexOf = _htmlToCSSProviderContent.indexOf(event.target);
        
        if (indexOf >= 0) {
            _htmlToCSSProviderContent.splice(indexOf, 1);
        }
        
        // stop listening for resize when all inline editors are closed
        if (_htmlToCSSProviderContent.length === 0) {
            $(window).off("resize", _updateAllFilenames);
            $(DocumentManager).off("dirtyFlagChange", _dirtyFlagChangeHandler);
        }
    }

    /**
     * Show a range of text in an inline editor.
     * 
     * @param {!Editor} parentEditor The parent editor that will contain the inline editor
     * @param {!FileEntry} fileEntry File containing inline content
     * @param {!Number} startLine The first line to be shown in the inline editor 
     * @param {!Number} endLine The last line to be shown in the inline editor
     */
    function _showTextRangeInInlineEditor(parentEditor, fileEntry, startLine, endLine) {
        var result = new $.Deferred();
        
        DocumentManager.getDocumentContents(fileEntry.fullPath)
            .done(function (text) {
                var range = {
                    startLine: startLine,
                    endLine: endLine
                };
                var inlineInfo = EditorManager.createInlineEditorFromText(parentEditor, text, range, fileEntry);
                
                result.resolve(inlineInfo);
            })
            .fail(function (fileError) {
                console.log("Error getting document contents: ", fileError);
                result.reject();
            });

        return result.promise();
    }
    
    /**
     * Given a position in an HTML editor, returns the relevant selector for the attribute/tag
     * surrounding that position, or "" if none is found.
     * @param {!Editor} editor
     * @private
     */
    function _getSelectorName(editor, pos) {
        var tagInfo = CodeHintUtils.getTagInfo(editor, pos),
            selectorName = "";
        
        if (tagInfo.position.tokenType === CodeHintUtils.TAG_NAME) {
            // Type selector
            selectorName = tagInfo.tagName;
        } else if (tagInfo.position.tokenType === CodeHintUtils.ATTR_NAME ||
                   tagInfo.position.tokenType === CodeHintUtils.ATTR_VALUE) {
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
     * Create the shadowing and filename tab for an inline editor.
     * TODO (issue #424): move to createInlineEditorFromText()
     * @private
     */
    function _createInlineEditorDecorations(editor, fileEntry) {
        // create the filename div
        var filenameDiv = $('<div class="filename" style="visibility: hidden"/>')
            .append('<div class="dirty-indicator"/>')
            .append(fileEntry.name);
        
        // add inline editor styling
        $(editor.getScrollerElement())
            .append('<div class="shadow top"/>')
            .append('<div class="shadow bottom"/>')
            .append(filenameDiv);

        // update the current inline editor immediately
        // use setTimeout to allow filenameDiv to render first
        setTimeout(function () {
            var document = DocumentManager.getDocumentForFile(fileEntry);
            _updateInlineEditorFilename(_editorHolderWidth(), filenameDiv);
            _showDirtyIndicator(filenameDiv.find(".dirty-indicator"), document ? document.isDirty : false);
            filenameDiv.css("visibility", "");
        }, 0);
    }
    
    /**
     * When cursor is on an HTML tag name, class attribute, or id attribute, find associated
     * CSS rules and show (one/all of them) in an inline editor.
     *
     * @param {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {$.Promise} a promise that will be resolved with:
     *      {{content:DOMElement, height:Number, onAdded:function(inlineId:Number)}}
     *      or null if we're not going to provide anything.
     */
    function htmlToCSSProvider(editor, pos) {
        // Only provide a CSS editor when cursor is in HTML content
        if (editor._codeMirror.getOption("mode") !== "htmlmixed") {
            return null;
        }
        var htmlmixedState = editor._codeMirror.getTokenAt(pos).state;
        if (htmlmixedState.mode !== "html") {
            return null;
        }
        
        // Only provide CSS editor if the selection is an insertion point
        var sel = editor.getSelection(false);
        if (sel.start.line !== sel.end.line || sel.start.ch !== sel.end.ch) {
            return null;
        }
        
        var selectorName = _getSelectorName(editor, pos);
        if (selectorName === "") {
            return null;
        }

        var result = new $.Deferred();

        CSSUtils.findMatchingRules(selectorName)
            .done(function (rules) {
                if (rules && rules.length > 0) {
                    var rule = rules[0];  // For Sprint 4 we use the first match only
                    
                    _showTextRangeInInlineEditor(editor, rule.source, rule.lineStart, rule.lineEnd)
                        .done(function (inlineInfo) {
                            // track inlineEditor content removal
                            inlineInfo.content.addEventListener("DOMNodeRemovedFromDocument", _inlineEditorRemoved);
                            _createInlineEditorDecorations(inlineInfo.editor, rule.source);
                            
                            _htmlToCSSProviderContent.push(inlineInfo.content);
                            
                            // Manaully position filename div's. Can't use CSS positioning in this case
                            // since the label is relative to the window boundary, not CodeMirror.
                            if (_htmlToCSSProviderContent.length > 0) {
                                $(window).on("resize", _updateAllFilenames);
                                $(DocumentManager).on("dirtyFlagChange", _dirtyFlagChangeHandler);
                            }
                            
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
                console.log("Error in findMatchingRules()");
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
