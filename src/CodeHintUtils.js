/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

define(function (require, exports, module) {
    'use strict';
    
    /**
     * @private
     * moves the current context backwards by one token
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} ctx
     * @return {boolean} whether the context changed
     */
    function _movePrevToken(ctx) {
        if (ctx.pos.ch === 0 || ctx.token.start === 0) {
            //move up a line
            if (ctx.pos.line === 0) {
                return false; //at the top already
            }
            ctx.pos.line--;
            ctx.pos.ch = ctx.editor.getLine(ctx.pos.line).length;
        } else {
            ctx.pos.ch = ctx.token.start;
        }
        ctx.token = ctx.editor.getTokenAt(ctx.pos);
        return true;
    }

   /**
     * @private
     * creates a context object
     * @param {CodeMirror} editor
     * @param {{ch:{string}, line:{number}} pos
     * @return {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}}
     */
    function _getInitialContext(editor, pos) {
        return {
            "editor": editor,
            "pos": pos,
            "token": editor.getTokenAt(pos)
        };
    }
 
   /**
     * @private
     * Sometimes as attr values are getting typed, if the quotes aren't balanced yet
     * some extra 'non attribute value' text gets included in the token. This attempts
     * to assure the attribute value we grab is always good
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {string}
     */
    function _extractAttrVal(ctx) {
        var attrValue = ctx.token.string;
        var startChar = attrValue.charAt(0);
        var endChar = attrValue.charAt(attrValue.length - 1);
        
        //If this is a fully quoted value, return the whole
        //thing regardless of position
        if (attrValue.length > 1 &&
                (startChar === "'" || startChar === '"') &&
                endChar === startChar) {
            //strip the quotes and return;
            return attrValue.substring(1, attrValue.length - 1);
        }
        
        //The att value it getting edit in progress. There is possible extra
        //stuff in this token state since the quote isn't closed, so we assume
        //the stuff from the quote to the current pos is definitely in the attribute 
        //value.
        var posInTokenStr = ctx.pos.ch - ctx.token.start;
        if (posInTokenStr < 0) {
            console.log("CodeHintUtils: _extractAttrVal - Invalid context: the pos what not in the current token!");
        } else {
            attrValue = attrValue.substring(0, posInTokenStr);
        }
        
        //If the attrValue start with a quote, trim that now
        startChar = attrValue.charAt(0);
        if (startChar === "'" || startChar === '"') {
            attrValue = attrValue.substring(1);
        }
        
        return attrValue;
    }
    
    /**
     * Creates a tagInfo object and assures all the values are entered or are empty strings
     * @param {string} tagName The name of the tag
     * @param {string} attrName The name of the attribute
     * @param {string} attrValue The value of the attribute
     * @return {{tagName:string, attr{name:string, value:string}} A tagInfo object with some context
     *              about the current tag hint. 
     */
    function createTagInfo(tagName, attrName, attrValue) {
        return { tagName: (tagName || ""),
                attr:
                    { name: attrName || "",
                     value: attrValue || ""} };
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
     * @return {{tagName:string, attr{name:string, value:string}} A tagInfo object with some context
     *              about the current tag hint. 
     */
    function getTagInfoForValueHint(editor, pos) {
        var tagName = "",
            attrName = "",
            attrVal = "",
            ctx = _getInitialContext(editor, pos);
        
        //Initial ctx should start off inside the attr value. We'll validate
        //this as we go back
        attrVal = _extractAttrVal(ctx);
        
        //Move to the prev token, and check if it's "="
        if (!_movePrevToken(ctx)) {
            return createTagInfo();
        }
        if (ctx.token.string !== "=") {
            return createTagInfo();
        }
        
        //Move to the prev token, and check if it's an attribute
        if (!_movePrevToken(ctx)) {
            return createTagInfo();
        }
        if (ctx.token.className !== "attribute") {
            return createTagInfo();
        }
        
        attrName = ctx.token.string;
        if (ctx.token.state.tagName) {
            tagName = ctx.token.state.tagName; //XML mode
        } else {
            tagName = ctx.token.state.htmlState.tagName; //HTML mode
        }
 
        //We're good. 
        return createTagInfo(tagName, attrName, attrVal);
    }

    
    // Define public API
    exports.getTagInfoForValueHint = getTagInfoForValueHint;
    exports.createTagInfo = createTagInfo;
});
