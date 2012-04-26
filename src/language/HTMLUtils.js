/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

define(function (require, exports, module) {
    'use strict';
    
    //constants
    var TAG_NAME = "tagName",
        ATTR_NAME = "attr.name",
        ATTR_VALUE = "attr.value";
    
    /**
     * @private
     * moves the current context backwards by one token
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} ctx
     * @return {boolean} whether the context changed
     */
    function _movePrevToken(ctx) {
        if (ctx.pos.ch <= 0 || ctx.token.start <= 0) {
            //move up a line
            if (ctx.pos.line <= 0) {
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
     * moves the current context forward by one token
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} ctx
     * @return {boolean} whether the context changed
     */
    function _moveNextToken(ctx) {
        var eol = ctx.editor.getLine(ctx.pos.line).length;
        if (ctx.pos.ch >= eol || ctx.token.end >= eol) {
            //move down a line
            if (ctx.pos.line >= ctx.editor.lineCount() - 1) {
                return false; //at the bottom
            }
            ctx.pos.line++;
            ctx.pos.ch = 0;
        } else {
            ctx.pos.ch = ctx.token.end + 1;
        }
        ctx.token = ctx.editor.getTokenAt(ctx.pos);
        return true;
    }
    
   /**
     * @private
     * moves the current context in the given direction, skipping any whitespace it hits
     * @param {function} moveFxn the funciton to move the context
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} ctx
     * @return {boolean} whether the context changed
     */
    function _moveSkippingWhitespace(moveFxn, ctx) {
        if (!moveFxn(ctx)) {
            return false;
        }
        while (!ctx.token.className && ctx.token.string.trim().length === 0) {
            if (!moveFxn(ctx)) {
                return false;
            }
        }
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
     * in the given context, get the character offset of pos from the start of the token
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {number}
     */
    function _offsetInToken(ctx) {
        var offset = ctx.pos.ch - ctx.token.start;
        if (offset < 0) {
            console.log("CodeHintUtils: _offsetInToken - Invalid context: the pos what not in the current token!");
        }
        return offset;
    }
 
   /**
     * @private
     * Sometimes as attr values are getting typed, if the quotes aren't balanced yet
     * some extra 'non attribute value' text gets included in the token. This attempts
     * to assure the attribute value we grab is always good
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return { val:{string}, offset:{number}}
     */
    function _extractAttrVal(ctx) {
        var attrValue = ctx.token.string;
        var startChar = attrValue.charAt(0);
        var endChar = attrValue.charAt(attrValue.length - 1);
        var offset = _offsetInToken(ctx);
        
        //If this is a fully quoted value, return the whole
        //thing regardless of position
        if (attrValue.length > 1 &&
                (startChar === "'" || startChar === '"') &&
                endChar === startChar) {
            //strip the quotes and return;
            attrValue = attrValue.substring(1, attrValue.length - 1);
            offset = offset - 1 > attrValue.length ? attrValue.length : offset - 1;
            return {val: attrValue, offset: offset};
        }
        
        //The att value it getting edit in progress. There is possible extra
        //stuff in this token state since the quote isn't closed, so we assume
        //the stuff from the quote to the current pos is definitely in the attribute 
        //value.
        if (offset > 0) {
            attrValue = attrValue.substring(0, offset);
        }
        
        //If the attrValue start with a quote, trim that now
        startChar = attrValue.charAt(0);
        if (startChar === "'" || startChar === '"') {
            attrValue = attrValue.substring(1);
            offset--;
        }
        
        return {val: attrValue, offset: offset};
    }
    
    /**
     * @private
     * Gets the tagname from where ever you are in the currect state
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {string}
     */
    function _extractTagName(ctx) {
        if (ctx.token.state.tagName) {
            return ctx.token.state.tagName; //XML mode
        } else {
            return ctx.token.state.htmlState.tagName; //HTML mode
        }
    }
    
    /**
     * Creates a tagInfo object and assures all the values are entered or are empty strings
     * @param {string} tokenType what is getting edited and should be hinted
     * @param {number} offset where the cursor is for the part getting hinted
     * @param {string} tagName The name of the tag
     * @param {string} attrName The name of the attribute
     * @param {string} attrValue The value of the attribute
     * @return {{tagName:string, attr{name:string, value:string}, hint:{type:{string}, offset{number}}}}
     *              A tagInfo object with some context about the current tag hint.            
     */
    function createTagInfo(tokenType, offset, tagName, attrName, attrValue) {
        return { tagName: tagName || "",
                 attr:
                    { name: attrName || "",
                      value: attrValue || ""},
                 position:
                    { tokenType: tokenType || "",
                      offset: offset || 0} };
    }
    
    /**
     * @private
     * Gets the taginfo starting from the attribute value and moving backwards
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {string}
     */
    function _getTagInfoStartingFromAttrValue(ctx) {
        // Assume we in the attr value
        // and validate that by going backwards
        var attrInfo = _extractAttrVal(ctx);
        var attrVal = attrInfo.val;
        var offset = attrInfo.offset;
        
        
        //Move to the prev token, and check if it's "="
        if (!_moveSkippingWhitespace(_movePrevToken, ctx) || ctx.token.string !== "=") {
            return createTagInfo();
        }
        
        //Move to the prev token, and check if it's an attribute
        if (!_moveSkippingWhitespace(_movePrevToken, ctx) || ctx.token.className !== "attribute") {
            return createTagInfo();
        }
        
        var attrName = ctx.token.string;
        var tagName = _extractTagName(ctx);
 
        //We're good. 
        return createTagInfo(ATTR_VALUE, offset, tagName, attrName, attrVal);
    }

    /**
     * @private
     * Gets the taginfo starting from the attribute name and moving forwards
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {string}
     */
    function _getTagInfoStartingFromAttrName(ctx) {
        //Verify We're in the attribute name, move forward and try to extract the rest of
        //the info. If the user it typing the attr the rest might not be here
        if (ctx.token.className !== "attribute") {
            return createTagInfo();
        }
        
        var tagName = _extractTagName(ctx);
        var attrName = ctx.token.string;
        var offset = _offsetInToken(ctx);
        
        if (!_moveSkippingWhitespace(_moveNextToken, ctx) || ctx.token.string !== "=") {
            return createTagInfo(ATTR_NAME, offset, tagName, attrName);
        }
        
        if (!_moveSkippingWhitespace(_moveNextToken, ctx)) {
            return createTagInfo(ATTR_NAME, offset, tagName, attrName);
        }
        //this should be the attrvalue
        var attrInfo = _extractAttrVal(ctx);
        var attrVal = attrInfo.val;
        
        return createTagInfo(ATTR_NAME, offset, tagName, attrName, attrVal);
    }
    
    /**
     * Figure out if we're in a tag, and if we are return info about what to hint about it
     * An example token stream for this tag is <span id="open-files-disclosure-arrow"></span> : 
     *      className:tag       string:"<span"
     *      className:          string:" "
     *      className:attribute string:"id"
     *      className:          string:"="
     *      className:string    string:""open-files-disclosure-arrow""
     *      className:tag       string:"></span>"
     * @param {Editor} editor An instance of a Brackets editor
     * @param {{ch: number, line: number}} constPos  A CM pos (likely from editor.getCursor())
     * @return {{tagName:string, attr{name:string, value:string}, hint:{type:{string}, offset{number}}}}
     *              A tagInfo object with some context about the current tag hint.
     */
    function getTagInfo(editor, constPos) {
        //we're going to changing pos a lot, but we don't want to mess up
        //the pos the caller passed in so we use extend to make a safe copy of it.	
        //This is what pass by value in c++ would do.	
        var pos = $.extend({}, constPos),
            ctx = _getInitialContext(editor._codeMirror, pos),
            offset = _offsetInToken(ctx),
            tagInfo,
            tokenType;
        
        //check and see where we are in the tag
        //first check, if we're in an all whitespace token and move back
        //and see what's before us
        if (ctx.token.string.length > 0 && ctx.token.string.trim().length === 0) {
            if (!_movePrevToken(ctx)) {
                return createTagInfo();
            }
            
            if (ctx.token.className !== "tag") {
                //if wasn't the tag name, assume it was an attr value
                tagInfo = _getTagInfoStartingFromAttrValue(ctx);
                //We don't want to give context for the previous attr
                //and we want it to look like the user is going to add a new attr
                if (tagInfo.tagName) {
                    return createTagInfo(ATTR_NAME, 0, tagInfo.tagName);
                }
                return createTagInfo();
            }
            
            //we know the tag was here, so they user is adding an attr name
            tokenType = ATTR_NAME;
            offset = 0;
        }
        
        if (ctx.token.className === "tag") {
            //check to see if this is the closing of a tag (either the start or end)
            if (ctx.token.string === ">" ||
                    (ctx.token.string.charAt(0) === '<' && ctx.token.string.charAt(1) === '/')) {
                return createTagInfo();
            }
            
            if (!tokenType) {
                tokenType = TAG_NAME;
                offset--; //need to take off 1 for the leading "<"
            }
            
            //we're actually in the tag, just return that as we have no relevant 
            //info about what attr is selected
            return createTagInfo(tokenType, offset, _extractTagName(ctx));
        }
        
        if (ctx.token.string === "=") {
            //we could be between the attr and the value
            //step back and check
            if (!_moveSkippingWhitespace(_movePrevToken, ctx) || ctx.token.className !== "attribute") {
                return createTagInfo();
            }
            
            //The "=" is added, time to hint for values
            tokenType = ATTR_VALUE;
            offset = 0;
        }
        
        if (ctx.token.className === "attribute") {
            tagInfo = _getTagInfoStartingFromAttrName(ctx);
        } else {
            // if we're not at a tag, "=", or attribute name, assume we're in the value
            tagInfo = _getTagInfoStartingFromAttrValue(ctx);
        }
        
        if (tokenType && tagInfo.tagName) {
            tagInfo.position.tokenType = tokenType;
            tagInfo.position.offset = offset;
        }
        
        return tagInfo;
    }
    
    
    /**
     * Returns an Array of info about all <style> blocks in the given Editor's HTML document (assumes
     * the Editor contains HTML text).
     * @param {!Editor} editor
     */
    function findStyleBlocks(editor) {
        // Start scanning from beginning of file
        var ctx = _getInitialContext(editor._codeMirror, {line: 0, ch: 0});
        
        var styleBlocks = [];
        var currentStyleBlock = null;
        var inStyleBlock = false;
        
        while (_moveNextToken(ctx)) {
            if (inStyleBlock) {
                // Check for end of this <style> block
                if (ctx.token.state.mode !== "css") {
                    currentStyleBlock.text = editor._codeMirror.getRange(currentStyleBlock.start, currentStyleBlock.end);
                    inStyleBlock = false;
                } else {
                    currentStyleBlock.end = { line: ctx.pos.line, ch: ctx.pos.ch };
                }
            } else {
                // Check for start of a <style> block
                if (ctx.token.state.mode === "css") {
                    currentStyleBlock = {
                        start: { line: ctx.pos.line, ch: ctx.pos.ch }
                    };
                    styleBlocks.push(currentStyleBlock);
                    inStyleBlock = true;
                }
                // else, random token in non-CSS content: ignore
            }
        }
        
        return styleBlocks;
    }
    
    
    // Define public API
    exports.TAG_NAME = TAG_NAME;
    exports.ATTR_NAME = ATTR_NAME;
    exports.ATTR_VALUE = ATTR_VALUE;
    
    exports.getTagInfo = getTagInfo;
    //The createTagInfo is really only for the unit tests so they can make the same structure to 
    //compare results with
    exports.createTagInfo = createTagInfo;
    exports.findStyleBlocks = findStyleBlocks;
});
