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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

define(function (require, exports, module) {
    "use strict";
    
    var TokenUtils = require("utils/TokenUtils");
    
    //constants
    var TAG_NAME = "tagName",
        ATTR_NAME = "attr.name",
        ATTR_VALUE = "attr.value";
    
   /**
     * @private
     * Sometimes as attr values are getting typed, if the quotes aren't balanced yet
     * some extra 'non attribute value' text gets included in the token. This attempts
     * to assure the attribute value we grab is always good
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return { val:{string}, offset:{number}}
     */
    function _extractAttrVal(ctx) {
        var attrValue = ctx.token.string,
            startChar = attrValue.charAt(0),
            endChar = attrValue.charAt(attrValue.length - 1),
            offset = TokenUtils.offsetInToken(ctx),
            foundEqualSign = false;
        
        //If this is a fully quoted value, return the whole
        //thing regardless of position
        if (attrValue.length > 1 &&
                (startChar === "'" || startChar === '"') &&
                endChar === startChar) {
            
            // Find an equal sign before the end quote. If found, 
            // then the user may be entering an attribute value right before 
            // another attribute and we're getting a false balanced string.
            // An example of this case is <link rel" href="foo"> where the 
            // cursor is right after the first double quote.
            foundEqualSign = (attrValue.match(/\=\s*['"]$/) !== null);
            
            if (!foundEqualSign) {
                //strip the quotes and return;
                attrValue = attrValue.substring(1, attrValue.length - 1);
                offset = offset - 1 > attrValue.length ? attrValue.length : offset - 1;
                return {val: attrValue, offset: offset, quoteChar: startChar, hasEndQuote: true};
            }
        }
        
        if (foundEqualSign) {
            var spaceIndex = attrValue.indexOf(" ");
            attrValue = attrValue.substring(0, (spaceIndex > offset) ? spaceIndex : offset);
        } else if (offset > 0 && (startChar === "'" || startChar === '"')) {
            //The att value is getting edit in progress. There is possible extra
            //stuff in this token state since the quote isn't closed, so we assume
            //the stuff from the quote to the current pos is definitely in the attribute 
            //value.
            attrValue = attrValue.substring(0, offset);
        }
        
        //If the attrValue start with a quote, trim that now
        startChar = attrValue.charAt(0);
        if (startChar === "'" || startChar === '"') {
            attrValue = attrValue.substring(1);
            offset--;
        } else {
            startChar = "";
        }
        
        return {val: attrValue, offset: offset, quoteChar: startChar, hasEndQuote: false};
    }
    
    /**
     * @private
     * Gets the tagname from where ever you are in the currect state
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {string}
     */
    function _extractTagName(ctx) {
        if (ctx.token.state.tagName) {
            return ctx.token.state.tagName;           //XML mode
        } else if (ctx.token.state.htmlState) {
            return ctx.token.state.htmlState.tagName; //HTML mode
        } else if (ctx.token.state.html) {
            return ctx.token.state.html.tagName;      //HTML mode for PHP files
        }
        // Some mixed modes that offer HTML as a nested mode don't actually expose the HTML state
        return null;
    }
    
    /**
     * Creates a tagInfo object and assures all the values are entered or are empty strings
     * @param {string=} tokenType what is getting edited and should be hinted
     * @param {number=} offset where the cursor is for the part getting hinted
     * @param {string=} tagName The name of the tag
     * @param {string=} attrName The name of the attribute
     * @param {string=} attrValue The value of the attribute
     * @return {{tagName:string,
     *           attr:{name:string, value:string, valueAssigned:boolean, quoteChar:string, hasEndQuote:boolean},
     *           position:{tokenType:string, offset:number}
     *         }}
     *         A tagInfo object with some context about the current tag hint.
     */
    function createTagInfo(tokenType, offset, tagName, attrName, attrValue, valueAssigned, quoteChar, hasEndQuote) {
        return { tagName: tagName || "",
                 attr:
                    { name: attrName || "",
                      value: attrValue || "",
                      valueAssigned: valueAssigned || false,
                      quoteChar: quoteChar || "",
                      hasEndQuote: hasEndQuote || false },
                 position:
                    { tokenType: tokenType || "",
                      offset: offset || 0 } };
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
        var attrInfo = _extractAttrVal(ctx),
            attrVal = attrInfo.val,
            offset = attrInfo.offset,
            quoteChar = attrInfo.quoteChar,
            hasEndQuote = attrInfo.hasEndQuote,
            strLength = ctx.token.string.length;
        
        if (ctx.token.className === "string" && ctx.pos.ch === ctx.token.end && strLength > 1) {
            var firstChar = ctx.token.string[0],
                lastChar = ctx.token.string[strLength - 1];
            
            // We get here only when the cursor is immediately on the right of the end quote
            // of an attribute value. So we want to return an empty tag info so that the caller
            // can dismiss the code hint popup if it is still open.
            if (firstChar === lastChar && (firstChar === "'" || firstChar === "\"")) {
                return createTagInfo();
            }
        }
        
        //Move to the prev token, and check if it's "="
        if (!TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx) || ctx.token.string !== "=") {
            return createTagInfo();
        }
        
        //Move to the prev token, and check if it's an attribute
        if (!TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx) || ctx.token.className !== "attribute") {
            return createTagInfo();
        }
        
        var attrName = ctx.token.string;
        var tagName = _extractTagName(ctx);
 
        //We're good. 
        return createTagInfo(ATTR_VALUE, offset, tagName, attrName, attrVal, true, quoteChar, hasEndQuote);
    }

    /**
     * @private
     * Gets the taginfo starting from the attribute name and moving forwards
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @param {boolean} isPriorAttr indicates whether we're getting info for a prior attribute
     * @return {string}
     */
    function _getTagInfoStartingFromAttrName(ctx, isPriorAttr) {
        //Verify We're in the attribute name, move forward and try to extract the rest of
        //the info. If the user it typing the attr the rest might not be here
        if (isPriorAttr === false && ctx.token.className !== "attribute") {
            return createTagInfo();
        }
        
        var tagName = _extractTagName(ctx);
        var attrName = ctx.token.string;
        var offset = TokenUtils.offsetInToken(ctx);
        
        if (!TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx) || ctx.token.string !== "=") {
            // If we're checking for a prior attribute and the next token we get is a tag or an html comment or
            // an undefined token class, then we've already scanned past our original cursor location. 
            // So just return an empty tag info.
            if (isPriorAttr &&
                    (!ctx.token.className ||
                    (ctx.token.className !== "attribute" && ctx.token.string.indexOf("<") !== -1))) {
                return createTagInfo();
            }
            return createTagInfo(ATTR_NAME, offset, tagName, attrName);
        }
        
        if (!TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx)) {
            return createTagInfo(ATTR_NAME, offset, tagName, attrName);
        }
        //this should be the attrvalue
        var attrInfo = _extractAttrVal(ctx),
            attrVal = attrInfo.val,
            quoteChar = attrInfo.quoteChar,
            hasEndQuote = attrInfo.hasEndQuote;
        
        return createTagInfo(ATTR_NAME, offset, tagName, attrName, attrVal, true, quoteChar, hasEndQuote);
    }
    
    /**
     * Figure out if we're in a tag, and if we are return info about it
     * An example token stream for this tag is <span id="open-files-disclosure-arrow"></span> : 
     *      className:tag       string:"<span"
     *      className:          string:" "
     *      className:attribute string:"id"
     *      className:          string:"="
     *      className:string    string:""open-files-disclosure-arrow""
     *      className:tag       string:"></span>"
     * @param {Editor} editor An instance of a Brackets editor
     * @param {{ch: number, line: number}} constPos  A CM pos (likely from editor.getCursor())
     * @return {{tagName:string,
     *           attr:{name:string, value:string, valueAssigned:boolean, quoteChar:string, hasEndQuote:boolean},
     *           position:{tokenType:string, offset:number}
     *         }}
     *         A tagInfo object with some context about the current tag hint.
     */
    function getTagInfo(editor, constPos) {
        // We're going to be changing pos a lot, but we don't want to mess up
        // the pos the caller passed in so we use extend to make a safe copy of it.	
        var pos = $.extend({}, constPos),
            ctx = TokenUtils.getInitialContext(editor._codeMirror, pos),
            tempCtx = null,
            offset = TokenUtils.offsetInToken(ctx),
            tagInfo,
            tokenType;
        
        // check if this is inside a style block.
        if (editor.getModeForSelection() !== "html") {
            return createTagInfo();
        }
        
        //check and see where we are in the tag
        if (ctx.token.string.length > 0 && ctx.token.string.trim().length === 0) {

            // token at (i.e. before) pos is whitespace, so test token at next pos
            //
            // note: getTokenAt() does range checking for ch. If it detects that ch is past
            // EOL, it uses EOL, same token is returned, and the following condition fails,
            // so we don't need to worry about testPos being valid.
            var testPos = {ch: ctx.pos.ch + 1, line: ctx.pos.line},
                testToken = editor._codeMirror.getTokenAt(testPos);

            if (testToken.string.length > 0 && testToken.string.trim().length > 0 &&
                    testToken.string.charAt(0) !== ">") {
                // pos has whitespace before it and non-whitespace after it, so use token after
                ctx.token = testToken;

                if (ctx.token.className === "tag") {
                    // Check to see if the cursor is just before a "<" but not in any tag.
                    if (ctx.token.string.charAt(0) === "<") {
                        return createTagInfo();
                    }
                } else if (ctx.token.className === "attribute") {
                    // Check to see if the user is going to add a new attr before an existing one
                    return _getTagInfoStartingFromAttrName(ctx, false);
                } else if (ctx.token.string === "=") {
                    // We're between a whitespace and  "=", so return an empty tag info.
                    return createTagInfo();
                }
            } else {
                // We get here if ">" or white spaces after testPos.
                // Check if there is an equal sign after testPos by creating a new ctx
                // with the original pos. We can't use the current ctx since we need to 
                // use it to scan backwards if we don't find an equal sign here.
                // Comment out this block to fix issue #1510.
//                if (testToken.string.length > 0 && testToken.string.charAt(0) !== ">") {
//                    tempCtx = TokenUtils.getInitialContext(editor._codeMirror, pos);
//                    if (TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, tempCtx) && tempCtx.token.string === "=") {
//                        // Return an empty tag info since we're between an atribute name and the equal sign.
//                        return createTagInfo();
//                    }
//                }

                // next, see what's before pos
                if (!TokenUtils.movePrevToken(ctx)) {
                    return createTagInfo();
                }

                if (ctx.token.className === "comment") {
                    return createTagInfo();
                } else if (ctx.token.className !== "tag" && ctx.token.string !== "=") {
                    // If it wasn't the tag name, assume it was an attr value
                    // Also we don't handle the "=" here.
                    tagInfo = _getTagInfoStartingFromAttrValue(ctx);

                    // Check to see if this is the closing of a tag (either the start or end)
                    // or a comment tag.
                    if (ctx.token.className === "comment" ||
                            (ctx.token.className === "tag" &&
                            (ctx.token.string === ">" || ctx.token.string === "/>" ||
                                (ctx.token.string.charAt(0) === "<" && ctx.token.string.charAt(1) === "/")))) {
                        return createTagInfo();
                    }
                    
                    // If it wasn't an attr value, assume it was an empty attr (ie. attr with no value)
                    if (!tagInfo.tagName) {
                        tagInfo = _getTagInfoStartingFromAttrName(ctx, true);
                    }

                    // We don't want to give context for the previous attr
                    // and we want it to look like the user is going to add a new attr
                    if (tagInfo.tagName) {
                        return createTagInfo(ATTR_NAME, 0, tagInfo.tagName);
                    }
                    return createTagInfo();
                }
                
                // We know the tag was here, so the user is adding an attr name
                tokenType = ATTR_NAME;
                offset = 0;
            }
        }
        
        if (ctx.token.className === "tag") {
            // Check if the user just typed a white space after "<" that made an existing tag invalid.
            if (ctx.token.string.match(/^<\s+/) && offset !== 1) {
                return createTagInfo();
            }
            
            // Check to see if this is the closing of a tag (either the start or end)
            if (ctx.token.string === ">" || ctx.token.string === "/>" ||
                    (ctx.token.string.charAt(0) === "<" && ctx.token.string.charAt(1) === "/")) {
                return createTagInfo();
            }
            
            if (!tokenType) {
                tokenType = TAG_NAME;
                offset--; //need to take off 1 for the leading "<"
            }
            
            // We're actually in the tag, just return that as we have no relevant 
            // info about what attr is selected
            return createTagInfo(tokenType, offset, _extractTagName(ctx));
        }
        
        if (ctx.token.string === "=") {
            // We could be between the attr and the value
            // Step back and check
            if (!TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx) || ctx.token.className !== "attribute") {
                return createTagInfo();
            }
            
            // The "=" is added, time to hint for values
            tokenType = ATTR_VALUE;
            offset = 0;
        }
        
        if (ctx.token.className === "attribute") {
            tagInfo = _getTagInfoStartingFromAttrName(ctx, false);
            
            // If we're in attr value, then we may need to calculate the correct offset
            // from the beginning of the attribute value. If the cursor position is to 
            // the left of attr value, then the offset is negative.
            // e.g. if the cursor is just to the right of the "=" in <a rel= "rtl", then
            // the offset will be -2.
            if (tagInfo.attr.quoteChar) {
                offset = constPos.ch - ctx.pos.ch;
            } else if (tokenType === ATTR_VALUE && (constPos.ch + 1) < ctx.pos.ch) {
                // The cursor may be right before an unquoted attribute or another attribute name.
                // Since we can't distinguish between them, we will empty the value so that the 
                // caller can just insert a new attribute value.
                tagInfo.attr.value = "";
            }
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
     * @return {Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, text:string}>}
     */
    function findStyleBlocks(editor) {
        // Start scanning from beginning of file
        var ctx = TokenUtils.getInitialContext(editor._codeMirror, {line: 0, ch: 0});
        
        var styleBlocks = [];
        var currentStyleBlock = null;
        var inStyleBlock = false;
        
        while (TokenUtils.moveNextToken(ctx)) {
            if (inStyleBlock) {
                // Check for end of this <style> block
                if (ctx.token.state.mode !== "css") {
                    // currentStyleBlock.end is already set to pos of the last CSS token by now
                    currentStyleBlock.text = editor.document.getRange(currentStyleBlock.start, currentStyleBlock.end);
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
