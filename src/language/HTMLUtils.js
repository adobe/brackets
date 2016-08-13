/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var CodeMirror = require("thirdparty/CodeMirror/lib/codemirror"),
        TokenUtils = require("utils/TokenUtils");

    // Constants
    var TAG_NAME = "tagName",
        CLOSING_TAG = "closingTag",
        ATTR_NAME = "attr.name",
        ATTR_VALUE = "attr.value";

    // Regular expression for token types with "tag" prefixed
    var tagPrefixedRegExp = /^tag/;

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
            var spaceIndex = attrValue.indexOf(" "),
                bracketIndex = attrValue.indexOf(">"),
                upToIndex = (spaceIndex !== -1 && spaceIndex < bracketIndex) ? spaceIndex : bracketIndex;
            attrValue = attrValue.substring(0, (upToIndex > offset) ? upToIndex : offset);
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
            // Make attr value empty and set offset to zero if it has the ">"
            // which is the closing of the tag.
            if (endChar === ">") {
                attrValue = "";
                offset = 0;
            }
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
        var mode = ctx.editor.getMode(),
            innerModeData = CodeMirror.innerMode(mode, ctx.token.state);

        if (ctx.token.type === "tag bracket") {
            return innerModeData.state.tagName;
        }

        // If the ctx is inside the tag name of an end tag, innerModeData.state.tagName is
        // undefined. So return token string as the tag name.
        return innerModeData.state.tagName || ctx.token.string;
    }

    /**
     * Compiles a list of used attributes for a given tag
     * @param {CodeMirror} editor An instance of a CodeMirror editor
     * @param {ch:{string}, line:{number}} pos A CodeMirror position
     * @return {Array.<string>} A list of the used attributes inside the current tag
     */
    function getTagAttributes(editor, pos) {
        var attrs       = [],
            backwardCtx = TokenUtils.getInitialContext(editor._codeMirror, pos),
            forwardCtx  = $.extend({}, backwardCtx);

        if (editor.getModeForSelection() === "html") {
            if (backwardCtx.token && !tagPrefixedRegExp.test(backwardCtx.token.type)) {
                while (TokenUtils.movePrevToken(backwardCtx) && !tagPrefixedRegExp.test(backwardCtx.token.type)) {
                    if (backwardCtx.token.type === "error" && backwardCtx.token.string.indexOf("<") === 0) {
                        break;
                    }
                    if (backwardCtx.token.type === "attribute") {
                        attrs.push(backwardCtx.token.string);
                    }
                }

                while (TokenUtils.moveNextToken(forwardCtx) && !tagPrefixedRegExp.test(forwardCtx.token.type)) {
                    if (forwardCtx.token.type === "attribute") {
                        // If the current tag is not closed, codemirror may return the next opening
                        // tag as an attribute. Stop the search loop in that case.
                        if (forwardCtx.token.string.indexOf("<") === 0) {
                            break;
                        }
                        attrs.push(forwardCtx.token.string);
                    } else if (forwardCtx.token.type === "error") {
                        if (forwardCtx.token.string.indexOf("<") === 0 || forwardCtx.token.string.indexOf(">") === 0) {
                            break;
                        }
                        // If we type the first letter of the next attribute, it comes as an error
                        // token. We need to double check for possible invalidated attributes.
                        if (/\S/.test(forwardCtx.token.string) &&
                                forwardCtx.token.string.indexOf("\"") === -1 &&
                                forwardCtx.token.string.indexOf("'") === -1 &&
                                forwardCtx.token.string.indexOf("=") === -1) {
                            attrs.push(forwardCtx.token.string);
                        }
                    }
                }
            }
        }

        return attrs;
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

        if ((ctx.token.type === "string" || ctx.token.type === "error") &&
                ctx.pos.ch === ctx.token.end && strLength > 1) {
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
        if (!TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx) || ctx.token.type !== "attribute") {
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
        if (isPriorAttr === false && ctx.token.type !== "attribute") {
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
                    (!ctx.token.type ||
                    (ctx.token.type && ctx.token.type !== "attribute" &&
                        ctx.token.type.indexOf("error") === -1 &&
                        ctx.token.string.indexOf("<") !== -1))) {
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
     * @param {{ch: number, line: number}} constPos  A CM pos (likely from editor.getCursorPos())
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
            offset = TokenUtils.offsetInToken(ctx),
            tagInfo,
            tokenType;

        // Check if this is inside a style block.
        if (editor.getModeForSelection() !== "html") {
            return createTagInfo();
        }

        // Check and see where we are in the tag
        if (ctx.token.string.length > 0 && !/\S/.test(ctx.token.string)) {

            // token at (i.e. before) pos is whitespace, so test token at next pos
            //
            // note: getTokenAt() does range checking for ch. If it detects that ch is past
            // EOL, it uses EOL, same token is returned, and the following condition fails,
            // so we don't need to worry about testPos being valid.
            var testPos = {ch: ctx.pos.ch + 1, line: ctx.pos.line},
                testToken = editor._codeMirror.getTokenAt(testPos, true);

            if (testToken.string.length > 0 && /\S/.test(testToken.string) &&
                    testToken.string.charAt(0) !== ">") {
                // pos has whitespace before it and non-whitespace after it, so use token after
                ctx.token = testToken;

                // Check whether the token type is one of the types prefixed with "tag"
                // (e.g. "tag", "tag error", "tag brackets")
                if (tagPrefixedRegExp.test(ctx.token.type)) {
                    // Check to see if the cursor is just before a "<" but not in any tag.
                    if (ctx.token.string.charAt(0) === "<") {
                        return createTagInfo();
                    }
                } else if (ctx.token.type === "attribute") {
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

                if (ctx.token.type === "comment") {
                    return createTagInfo();
                } else if (!tagPrefixedRegExp.test(ctx.token.type) && ctx.token.string !== "=") {
                    // If it wasn't the tag name, assume it was an attr value
                    // Also we don't handle the "=" here.
                    tagInfo = _getTagInfoStartingFromAttrValue(ctx);

                    // Check to see if this is the closing of a tag (either the start or end)
                    // or a comment tag.
                    if (ctx.token.type === "comment" ||
                            (tagPrefixedRegExp.test(ctx.token.type) &&
                            (ctx.token.string === ">" || ctx.token.string === "/>" ||
                                ctx.token.string === "</"))) {
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

        if (tagPrefixedRegExp.test(ctx.token.type)) {
            if (ctx.token.type !== "tag bracket") {
                // Check if the user just typed a white space after "<" that made an existing tag invalid.
                if (TokenUtils.movePrevToken(ctx) && !/\S/.test(ctx.token.string)) {
                    return createTagInfo();
                }

                // Check to see if this is a closing tag
                if (ctx.token.type === "tag bracket" && ctx.token.string === "</") {
                    tokenType = CLOSING_TAG;
                }

                // Restore the original ctx by moving back to next context since we call
                // movePrevToken above to detect "<" or "</".
                TokenUtils.moveNextToken(ctx);
            }

            // Check to see if this is the closing of a start tag or a self closing tag
            if (ctx.token.string === ">" || ctx.token.string === "/>") {
                return createTagInfo();
            }

            // Make sure the cursor is not after an equal sign or a quote before we report the context as a tag.
            if (ctx.token.string !== "=" && ctx.token.string.match(/^["']/) === null) {
                if (!tokenType) {
                    tokenType = TAG_NAME;
                    if (ctx.token.type === "tag bracket") {
                        // Check to see if this is a closing tag
                        if (ctx.token.string === "</") {
                            tokenType = CLOSING_TAG;
                            offset -= 2;
                        } else {
                            offset = 0;
                        }
                        // If the cursor is right after the "<" or "</", then
                        // move context to next one so that _extractTagName
                        // call below can get the tag name if there is one.
                        if (offset === 0) {
                            TokenUtils.moveNextToken(ctx);
                        }
                    }
                }

                // We're actually in the tag, just return that as we have no relevant
                // info about what attr is selected
                return createTagInfo(tokenType, offset, _extractTagName(ctx));
            }
        }

        if (ctx.token.string === "=") {
            // We could be between the attr and the value
            // Step back and check
            if (!TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx) || ctx.token.type !== "attribute") {
                return createTagInfo();
            }

            // The "=" is added, time to hint for values
            tokenType = ATTR_VALUE;
            offset = 0;
        }

        if (ctx.token.type === "attribute") {
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
     * Returns an Array of info about all blocks whose token mode name matches that passed in,
     * in the given Editor's HTML document (assumes the Editor contains HTML text).
     * @param {!Editor} editor - the editor containing the HTML text
     * @param {string} modeName - the mode name of the tokens to look for
     * @return {Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, text:string}>}
     */
    function findBlocks(editor, modeName) {
        // Start scanning from beginning of file
        var ctx = TokenUtils.getInitialContext(editor._codeMirror, {line: 0, ch: 0}),
            blocks = [],
            currentBlock = null,
            inBlock = false,
            outerMode = editor._codeMirror.getMode(),
            tokenModeName,
            previousMode;

        while (TokenUtils.moveNextToken(ctx, false)) {
            tokenModeName = CodeMirror.innerMode(outerMode, ctx.token.state).mode.name;
            if (inBlock) {
                if (!currentBlock.end) {
                    // Handle empty blocks
                    currentBlock.end = currentBlock.start;
                }
                // Check for end of this block
                if (tokenModeName === previousMode) {
                    // currentBlock.end is already set to pos of the last token by now
                    currentBlock.text = editor.document.getRange(currentBlock.start, currentBlock.end);
                    inBlock = false;
                } else {
                    currentBlock.end = { line: ctx.pos.line, ch: ctx.pos.ch };
                }
            } else {
                // Check for start of a block
                if (tokenModeName === modeName) {
                    currentBlock = {
                        start: { line: ctx.pos.line, ch: ctx.pos.ch }
                    };
                    blocks.push(currentBlock);
                    inBlock = true;
                } else {
                    previousMode = tokenModeName;
                }
                // else, random token: ignore
            }
        }

        return blocks;
    }

    /**
     * Returns an Array of info about all <style> blocks in the given Editor's HTML document (assumes
     * the Editor contains HTML text).
     * @param {!Editor} editor
     * @return {Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, text:string}>}
     */
    function findStyleBlocks(editor) {
        return findBlocks(editor, "css");
    }


    // Define public API
    exports.TAG_NAME         = TAG_NAME;
    exports.CLOSING_TAG      = CLOSING_TAG;
    exports.ATTR_NAME        = ATTR_NAME;
    exports.ATTR_VALUE       = ATTR_VALUE;

    exports.getTagInfo       = getTagInfo;
    exports.getTagAttributes = getTagAttributes;
    //The createTagInfo is really only for the unit tests so they can make the same structure to
    //compare results with
    exports.createTagInfo   = createTagInfo;
    exports.findStyleBlocks = findStyleBlocks;
    exports.findBlocks      = findBlocks;
});
