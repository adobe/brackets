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
    var EditorManager       = require("EditorManager"),
        FileUtils           = require("FileUtils"),
        ProjectManager      = require("ProjectManager"),
        NativeFileSystem    = require("NativeFileSystem").NativeFileSystem;
    
    
    /**
     * Today: When cursor is within any HTML content, open a dummy CSS 'file' in an inline editor.
     * TODO: When cursor is on an HTML tag name, class attribute, or id attribute, find associated
     * CSS rules and show (one/all of them) in an inline editor.
     *
     * @param {!CodeMirror} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {$.Promise} a promise that will be resolved with:
     *      {{inlineContent:DOMElement, height:Number, onAdded:function(inlineId:Number)}}
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
        
        var result = new $.Deferred();
        
        // TODO: use 'pos' to form a CSSManager query, and go find an actual relevant CSS rule
        
        // Load a project file at random
        var arbitraryFile = "todos.css";
        var fileEntry = new NativeFileSystem.FileEntry(ProjectManager.getProjectRoot().fullPath + arbitraryFile);
        FileUtils.readAsText(fileEntry)
            .done(function (text) {
                // var dummyRange = { startLine: 18, endLine: 22 };    // small rule
                var dummyRange = { startLine: 218, endLine: 255 };    // tall rule
                var inlineInfo = EditorManager.createInlineEditorFromText(editor, text, dummyRange, arbitraryFile);
                
                var inlineEditor = inlineInfo.editor;
                
                // For Sprint 4, editor is a read-only view
                inlineEditor.setOption("readOnly", true);
                
                result.resolve(inlineInfo);
            })
            .fail(function (fileError) {
                console.log("Error in dummy htmlToCSSProvider(): ", fileError);
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
