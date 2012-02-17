/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

define(function (require, exports, module) {
    'use strict';
    
    function _movePrevToken(state) {
        if (state.pos.ch === 0 || state.token.start === 0) {
            //move up a line
            if (state.pos.line === 0) {
                return false; //at the top already
            }
            state.pos.line--;
            state.pos.ch = state.editor.getLine(state.pos.line).length;
        } else {
            state.pos.ch = state.token.start;
        }
        state.token = state.editor.getTokenAt(state.pos);
        return true;
    }
    
    function _getInitialState(editor, pos) {
        return {
            "editor": editor,
            "pos": pos,
            "token": editor.getTokenAt(pos)
        };
    }
    
    /**
     * If a token is in an attribute value, it returns the attribute name.
     * If it's not in an attribute value it returns an empty string.
     * An example token stream for this tag is <span id="open-files-disclosure-arrow"></span> : 
     *      className:tag       string:"<span"
     *      className:          string:" "
     *      className:attribute string:"id"
     *      className:          string:"="
     *      className:string    string:""open-files-disclosure-arrow""
     *      className:tag       string:"></span>"
     * @param {CodeMirror} editor An instance of a CodeMirror editor
     * @param {{ch: number, ling: number}} pos  A CM pos (likely from editor.getCursor())
     * @return {string} A string with the attribute name or an empty string
     */
    function getAttrNameForValueHint(editor, pos) {
        var state = _getInitialState(editor, pos);
        
        //Move to the prev token, and check if it's "="
        if (!_movePrevToken(state)) {
            return "";
        }
        if (state.token.string !== "=") {
            return "";
        }
        
        //Move to the prev token, and check if it's an attribute
        if (!_movePrevToken(state)) {
            return "";
        }
        if (state.token.className !== "attribute") {
            return "";
        }
 
        //We're good. 
        return state.token.string;
    }

    
    // Define public API
    exports.getAttrNameForValueHint = getAttrNameForValueHint;
});
