/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CodeHintUtils   = require("CodeHintUtils"),
        EditorManager   = require("EditorManager");
    
    /**
     * @private
     * Test functions to see if the hinting is working
     * @param {CodeMirror} editor An instance of a CodeMirror editor
     */
    function _triggerClassHint(editor, pos, tagInfo) {
        //console.log("_triggerClassHint called for tag: " + tagInfo.tagName + " and attr value: " + tagInfo.attr.value);
    }
    
    function _triggerIdHint(editor, pos, tagInfo) {
        //console.log("_triggerIdHint called called for tag: " + tagInfo.tagName + " and attr value: " + tagInfo.attr.value);
    }
    
    /**
     * @private
     * Checks to see if this is an attribute value we can hint
     * @param {CodeMirror} editor An instance of a CodeMirror editor
     */
    function _checkForHint(editor) {
        var pos = editor.getCursor();
        var tagInfo = CodeHintUtils.getTagInfo(editor, pos);
        if (tagInfo.editing.token === CodeHintUtils.ATTR_VALUE) {
            if (tagInfo.attr.name === "class") {
                _triggerClassHint(editor, pos, tagInfo);
            } else if (tagInfo.attr.name === "id") {
                _triggerIdHint(editor, pos, tagInfo);
            }
        }
    }
    
    /**
     * @private
     * Called whenever a CodeMirror editor gets a key event
     * @param {object} event the jQuery event for onKeyEvent
     * @param {CodeMirror} editor An instance of a CodeMirror editor
     * @param {object} keyboardEvent  the raw keyboard event that CM is handling
     */
    function _onKeyEvent(event, editor, keyboardEvent) {
        if (keyboardEvent.type !== "keypress") {
            return;
        }
        var char = String.fromCharCode(keyboardEvent.charCode);
        setTimeout(function () { _checkForHint(editor); }, 40);
    }
    
     // Register our listeners
    $(EditorManager).on("onKeyEvent", _onKeyEvent);
    
    // Define public API
});
