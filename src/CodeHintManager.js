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
    
    function _triggerClassHint(editor, pos) {
        console.log("_triggerClassHint called");
    }
    
    function _triggerIdHint(editor, pos) {
        console.log("_triggerIdHint called");
    }
    
    function _checkForAttributeValueHint(editor) {
        var pos = editor.getCursor();
        var attrName = CodeHintUtils.getAttrNameForValueHint(editor, pos);
        if (attrName === "class") {
            _triggerClassHint(editor, pos);
        } else if (attrName === "id") {
            _triggerIdHint(editor, pos);
        }
    }
    
    function _onKeyEvent(event, editor, keyboardEvent) {
        if (keyboardEvent.type !== "keypress") {
            return;
        }
        var char = String.fromCharCode(keyboardEvent.charCode);
        if (char === "'" || char === '"') {
            //this is a quote char, check for a code hint after it's entered
            setTimeout(function () { _checkForAttributeValueHint(editor); }, 40);
        }
    }
    
     // Register our listeners
    $(EditorManager).on("onKeyEvent", _onKeyEvent);
    
    // Define public API
    //exports.getAttrNameForValueHint = getAttrNameForValueHint;
});
