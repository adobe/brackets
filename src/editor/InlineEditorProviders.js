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
    var HTMLUtils           = require("language/HTMLUtils"),
        CSSUtils            = require("language/CSSUtils"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        FileUtils           = require("file/FileUtils"),
        ProjectManager      = require("project/ProjectManager");

    // track divs to re-position manually
    var _htmlToCSSProviderContent   = [];
    
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
     * Respond to dirty flag change event. If the dirty flag is associated with an inline editor,
     * show (or hide) the dirty indicator.
     * @private
     */
    function _dirtyFlagChangeHandler(event, doc) {
        
        _htmlToCSSProviderContent.forEach(function (value) {
            var $filenameDiv = $(value).find(".filename");
            // This only checks filename here. If there are multiple documents with the same filename
            // (in different directories), this test will fail.
            // TODO: This needs to be fixed by connecting this method with a specific inline editor's state
            if ($filenameDiv.text() === doc.file.name) {
                _showDirtyIndicator($filenameDiv.find(".dirty-indicator"), doc.isDirty);
            }
        });
    }
    
    /**
     * Stops tracking an editor after being removed from the document.
     * @private
     */
    function _inlineEditorRemoved(inlineContent) {
        var indexOf = _htmlToCSSProviderContent.indexOf(inlineContent);
        
        if (indexOf >= 0) {
            _htmlToCSSProviderContent.splice(indexOf, 1);
        }
        
        // stop listening for resize when all inline editors are closed
        if (_htmlToCSSProviderContent.length === 0) {
            $(DocumentManager).off("dirtyFlagChange", _dirtyFlagChangeHandler);
        }
    }

    /**
     * Create an inline Editor UI showing a range of text within the given Document
     * 
     * @param {!Editor} parentEditor The parent editor that will contain the inline editor
     * @param {!Document} doc Document for the inline content
     * @param {!Number} startLine The first line to be shown in the inline editor 
     * @param {!Number} endLine The last line to be shown in the inline editor
     */
    function _showTextRangeInInlineEditor(parentEditor, doc, startLine, endLine) {
        var range = {
            startLine: startLine,
            endLine: endLine
        };
        
        var inlineInfo = EditorManager.createInlineEditorForDocument(parentEditor, doc, range);
        
        return inlineInfo;
    }
    
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
     * Create the shadowing and filename tab for an inline editor.
     * TODO (issue #424): move to createInlineEditorFromText()
     * @private
     */
    function _createInlineEditorDecorations(inlineEditor, doc) {
        var $filename = $(document.createElement("div")).addClass("filename");
        $filename.text(doc.file.name);
        $filename.append('<div class="dirty-indicator" style="width:4px"/>');
        $(inlineEditor.htmlContent).prepend($filename);

        // update the current inline editor immediately
        // use setTimeout to allow filenameDiv to render first
        setTimeout(function () {
            _showDirtyIndicator($filename.find(".dirty-indicator"), doc.isDirty);
        }, 0);
    }
    
    function InlineEditor() {
    }
    
    // TODO (jasonsj): need to save inline id to InlineEditor so that editors can control the widget size inside the host editor
    //                 this code should be refactored from EditorManager afterAdded()
    InlineEditor.prototype._inlineId = 0;
    // TODO (jasonsj): stubbed out existing inline editor properties
    InlineEditor.prototype.htmlContent = null;
    InlineEditor.prototype.height = 0;
    InlineEditor.prototype.onClosed = function () {};
    InlineEditor.prototype.onAdded = function () {};
    InlineEditor.prototype.load = function () {};
    
    function CSSInlineEditor(rules) {
        this._rules = rules;
        this._currentInlineInfo = null;
    }
    CSSInlineEditor.prototype = new InlineEditor();
    
    CSSInlineEditor.prototype.load = function (hostEditor) {
        var self = this,
            $htmlContent = $(document.createElement("div")).addClass("inlineEditor"),
            $relatedContainer = $(document.createElement("div")).addClass("relatedContainer"),
            $related = $(document.createElement("div")).appendTo($relatedContainer).addClass("related"),
            $ruleList = $(document.createElement("ul")).appendTo($related),
            $ruleItem,
            $location;
        
        // create rule list
        this._rules.forEach(function (rule, i) {
            $ruleItem = $(document.createElement("li")).appendTo($ruleList);
            $ruleItem.text(rule.selector + " ");
            $ruleItem.click(function () {
                self.setSelectedRule(i);
            });
            
            // select first rule
            if (i === 0) {
                $ruleItem.addClass("selected");
            }
            
            $location = $(document.createElement("span")).appendTo($ruleItem);
            $location.addClass("location");
            $location.text(rule.document.file.name + ":" + rule.lineStart);
        });
        
        // load first rule
        var rule = this._rules[0];
        
        // create an editor for the first rule
        var inlineInfo = _showTextRangeInInlineEditor(hostEditor, rule.document, rule.lineStart, rule.lineEnd);
        $htmlContent.append(inlineInfo.content);
        $htmlContent.append($relatedContainer);
        
        // wrapper div for inline editor
        this.htmlContent = $htmlContent[0];
        
        // TODO (jasonsj): handle multiple editors
        this.height = inlineInfo.height;
        this.onAdded = inlineInfo.onAdded;
        this.onClose = inlineInfo.onClose;
        
        // track inlineEditor content removal
        var origOnClosed = inlineInfo.onClosed;
        inlineInfo.onClosed = function () {
            origOnClosed();
            _inlineEditorRemoved(inlineInfo.content);
        };
        
        // TODO (jasonsj): XD
        _createInlineEditorDecorations(this, rule.document);
        
        _htmlToCSSProviderContent.push(this.htmlContent);
        
        if (_htmlToCSSProviderContent.length > 0) {
            $(DocumentManager).on("dirtyFlagChange", _dirtyFlagChangeHandler);
        }
        
        // TODO (jasonsj): refactor auto size code from EditorManager sizeInlineEditorToContents
        
        return (new $.Deferred()).resolve();
    };
    
    CSSInlineEditor.prototype.getRules = function () {
    };
    
    CSSInlineEditor.prototype.getSelectedRule = function () {
    };
    
    CSSInlineEditor.prototype.setSelectedRule = function (index) {
        console.log("setSelectedRule " + index);
    };
    
    CSSInlineEditor.prototype.nextRule = function () {
    };
    
    CSSInlineEditor.prototype.previousRule = function () {
    };
    
    function FindInFilesInline() {
    }
    FindInFilesInline.prototype = new InlineEditor();
    
    /**
     * When cursor is on an HTML tag name, class attribute, or id attribute, find associated
     * CSS rules and show (one/all of them) in an inline editor.
     *
     * @param {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {$.Promise} a promise that will be resolved with:
     *      {{content:DOMElement, height:Number, onAdded:function(inlineId:Number), onClosed:function()}}
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


    /** Initialize: register listeners */
    function init() {
        EditorManager.registerInlineEditProvider(htmlToCSSProvider);
    }
    
    // Define public API
    exports.init = init;
});
