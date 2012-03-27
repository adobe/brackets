/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var DocumentManager     = require("document/DocumentManager"),
    	EditorManager       = require("editor/EditorManager"),
    	InlineEditor 		= require("editor/InlineEditor");


   /**
     * Create the shadowing and filename tab for an inline editor.
     * TODO (issue #424): move to createInlineEditorFromText()
     * @private
     */
    function _createInlineEditorDecorations(editor, doc) {
        // create the filename div
        var filenameDiv = $('<div class="filename" style="visibility: hidden"/>')
            .append('<div class="dirty-indicator"/>')
            .append(doc.file.name);
        
        // add inline editor styling
        // FIXME (jasonsj): #424, shadow only seems to work on scroller element and not on wrapper div
        $(editor.getScrollerElement())
            .append('<div class="shadow top"/>')
            .append('<div class="shadow bottom"/>')
            .append(filenameDiv);

        // update the current inline editor immediately
        // use setTimeout to allow filenameDiv to render first
        setTimeout(function () {
            _updateInlineEditorFilename(_editorHolderWidth(), filenameDiv);
            _showDirtyIndicator(filenameDiv.find(".dirty-indicator"), doc.isDirty);
            filenameDiv.css("visibility", "");
        }, 0);
    }

    /**
     * @constructor
     *
     */
    function CSSInlineEditor(rules) {
        this._rules = rules;
    }
    CSSInlineEditor.prototype = new InlineEditor.InlineEditor();
    CSSInlineEditor.prototype.constructor = CSSInlineEditor;
    CSSInlineEditor.prototype.parentClass = InlineEditor.InlineEditor;
    
    // TY TODO: rename load?
    /** @param {!Editor} hostEditor  Outer Editor instance that inline editor will sit within.
    */
    CSSInlineEditor.prototype.load = function (hostEditor) {
        this.hostEditor = hostEditor;
        var self = this;
        var htmlContent = document.createElement("div"),
            ruleList = $("<ul class='pills pills-vertical pull-right'/>");
        
        // create rule list
        this._rules.forEach(function (rule) {
            ruleList.append("<li><a>" + rule.document.file.name + "</a></li>");
        });
        
        // load first rule
        var rule = this._rules[0];
        
        // create an editor for the first rule
        var range = {
            startLine: rule.lineStart,
            endLine: rule.lineEnd
        };
        var inlineInfo = EditorManager.createInlineEditorForDocument(rule.document, range, function(inlineEditor) {
            self.closeEditor(inlineEditor);
        });

        // TY TODO: better way to do this than return two types and assign?
        this.htmlContent = inlineInfo.content;
        this.editor = inlineInfo.editor;

        var $htmlContent = $(htmlContent);
        $htmlContent.append(inlineInfo.content);
        $htmlContent.append(ruleList);
        
        // wrapper div for inline editor
        this.htmlContent = htmlContent;

        // TY TODO: this probably belongs on Editor, but it needs to assigned after this.editor is valid
        // When text is edited, auto-resize UI and sync changes to a backing full-size editor
        $(this.editor).on("change", function () {
            self.sizeInlineEditorToContents();
        });
        
        // TODO (jasonsj): XD
        // TODO TY: where should this go?
        _createInlineEditorDecorations(inlineInfo.editor, rule.document);
        
        _htmlToCSSProviderContent.push(inlineInfo.content);
        
        // Manually position filename div's. Can't use CSS positioning in this case
        // since the label is relative to the window boundary, not CodeMirror.
        if (_htmlToCSSProviderContent.length > 0) {
            $(window).on("resize", _updateAllFilenames);
            $(DocumentManager).on("dirtyFlagChange", _dirtyFlagChangeHandler);
        }
        
        return (new $.Deferred()).resolve();
    };

    CSSInlineEditor.prototype.onClosed = function () {
        this.parentClass.prototype.onClosed.call(this); // call super.onClosed()
        _inlineEditorRemoved(this.content);
    }
    
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

    exports.CSSInlineEditor = CSSInlineEditor;

});