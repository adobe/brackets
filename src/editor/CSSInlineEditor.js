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
        InlineEditor        = require("editor/InlineEditor");


    /**
     * @constructor
     * @extends {InlineEditor}
     */
    function CSSInlineEditor(rules) {
        this._rules = rules;
    }
    CSSInlineEditor.prototype = new InlineEditor.InlineEditor();
    CSSInlineEditor.prototype.constructor = CSSInlineEditor;

    /** 
     * @override
     * @param {!Editor} hostEditor  Outer Editor instance that inline editor will sit within.
     * 
    */
    CSSInlineEditor.prototype.load = function (hostEditor) {
        this.hostEditor = hostEditor;

        // load first rule
        var rule = this._rules[0];

        // Container to hold editor & render its stylized frame
        var inlineContent = document.createElement('div');
        $(inlineContent).addClass("inlineCodeEditor");
       
        this.createInlineEditorFromText(rule.document, rule.lineStart, rule.lineEnd, inlineContent);

        // TY TODO: part of sprint 6
        // Starter code for rule list navigation. Disabled until it's further along
        // var inlineviewNavigator = document.createElement("div");
        
        // create rule list
        // var ruleList = $("<ul class='pills pills-vertical pull-right'/>");
        // this._rules.forEach(function (rule) {
        //     ruleList.append("<li><a>" + rule.document.file.name + "</a></li>");
        // });
        
        //var $inlineviewNavigator = $(inlineviewNavigator);
        //$inlineviewNavigator.append(this.content);
        //$inlineviewNavigator.append(ruleList);
        
        // wrapper div for inline editor
        //this.htmlContent = inlineviewNavigator;

        return (new $.Deferred()).resolve();
    };
    

    // TY TODO: part of sprint 6
    CSSInlineEditor.prototype.getRules = function () {
    };
    
    CSSInlineEditor.prototype.getSelectedRule = function () {
    };
    
    CSSInlineEditor.prototype.setSelectedRule = function () {
    };
    
    CSSInlineEditor.prototype.nextRule = function () {
    };
    
    CSSInlineEditor.prototype.previousRule = function () {
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
     * @return {$.Promise} a promise that will be resolved with an InlineEditor
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
