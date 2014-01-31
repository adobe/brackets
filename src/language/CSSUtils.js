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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, CodeMirror, _parseRuleList: true */

// JSLint Note: _parseRuleList() is cyclical dependency, not a global function.
// It was added to this list to prevent JSLint warning about being used before being defined.

/**
 * Set of utilities for simple parsing of CSS text.
 */
define(function (require, exports, module) {
    "use strict";
    
    var Async               = require("utils/Async"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        HTMLUtils           = require("language/HTMLUtils"),
        ProjectManager      = require("project/ProjectManager"),
        TokenUtils          = require("utils/TokenUtils");

    // Constants
    var SELECTOR   = "selector",
        PROP_NAME  = "prop.name",
        PROP_VALUE = "prop.value",
        IMPORT_URL = "import.url";

    var RESERVED_FLOW_NAMES = ["content", "element"],
        INVALID_FLOW_NAMES = ["none", "inherit", "default", "auto", "initial"],
        IGNORED_FLOW_NAMES = RESERVED_FLOW_NAMES.concat(INVALID_FLOW_NAMES);
    
    
    /**
     * @private
     * Checks if the current cursor position is inside the property name context
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {boolean} true if the context is in property name
     */
    function _isInPropName(ctx) {
        var state,
            lastToken;
        if (!ctx || !ctx.token || !ctx.token.state || ctx.token.type === "comment") {
            return false;
        }

        state = ctx.token.state.localState || ctx.token.state;
        
        if (!state.context) {
            return false;
        }
        
        lastToken = state.context.type;
        return (lastToken === "{" || lastToken === "rule" || lastToken === "block");
    }
    
    /**
     * @private
     * Checks if the current cursor position is inside the property value context
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {boolean} true if the context is in property value
     */
    function _isInPropValue(ctx) {
        var state;
        if (!ctx || !ctx.token || !ctx.token.state || ctx.token.type === "comment") {
            return false;
        }

        state = ctx.token.state.localState || ctx.token.state;
        
        if (!state.context || !state.context.prev) {
            return false;
        }
        return ((state.context.type === "prop" &&
                    (state.context.prev.type === "rule" || state.context.prev.type === "block")) ||
                    (state.context.type === "parens" && state.context.prev.type === "prop"));
    }
    
    /**
     * @private
     * Checks if the current cursor position is inside an at-rule
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {boolean} true if the context is in property value
     */
    function _isInAtRule(ctx) {
        var state;
        if (!ctx || !ctx.token || !ctx.token.state) {
            return false;
        }

        state = ctx.token.state.localState || ctx.token.state;
        
        if (!state.context) {
            return false;
        }
        return (state.context.type === "at");
    }

    /**
     * @private
     * Creates a context info object
     * @param {string=} context A constant string 
     * @param {number=} offset The offset of the token for a given cursor position
     * @param {string=} name Property name of the context 
     * @param {number=} index The index of the property value for a given cursor position
     * @param {Array.<string>=} values An array of property values 
     * @param {boolean=} isNewItem If this is true, then the value in index refers to the index at which a new item  
     *     is going to be inserted and should not be used for accessing an existing value in values array. 
     * @return {{context: string,
     *           offset: number,
     *           name: string,
     *           index: number,
     *           values: Array.<string>,
     *           isNewItem: boolean}} A CSS context info object.
     */
    function createInfo(context, offset, name, index, values, isNewItem) {
        var ruleInfo = { context: context || "",
                         offset: offset || 0,
                         name: name || "",
                         index: -1,
                         values: [],
                         isNewItem: (isNewItem) ? true : false };
        
        if (context === PROP_VALUE || context === SELECTOR || context === IMPORT_URL) {
            ruleInfo.index = index;
            ruleInfo.values = values;
        }
        
        return ruleInfo;
    }

    /**
     * @private
     * Scans backwards from the current context and returns the name of the property if there is 
     * a valid one. 
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {string} the property name of the current rule.
     */
    function _getPropNameStartingFromPropValue(ctx) {
        var ctxClone = $.extend({}, ctx);
        do {
            // If we're no longer in the property value before seeing a colon, then we don't
            // have a valid property name. Just return an empty string.
            if (ctxClone.token.string !== ":" && !_isInPropValue(ctxClone)) {
                return "";
            }
        } while (ctxClone.token.string !== ":" && TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctxClone));
        
        if (ctxClone.token.string === ":" && TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctxClone) &&
                (ctxClone.token.type === "property" || ctxClone.token.type === "property error")) {
            return ctxClone.token.string;
        }
        
        return "";
    }
    
    /**
     * @private
     * Gets all of the space/comma seperated tokens before the the current cursor position.
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {?Array.<string>} An array of all the space/comma seperated tokens before the
     *    current cursor position
     */
    function _getPrecedingPropValues(ctx) {
        var lastValue = "",
            curValue,
            propValues = [];
        while (ctx.token.string !== ":" && TokenUtils.movePrevToken(ctx)) {
            if (ctx.token.string === ":" || !_isInPropValue(ctx)) {
                break;
            }

            curValue = ctx.token.string;
            if (lastValue !== "") {
                curValue += lastValue;
            }

            if ((ctx.token.string.length > 0 && !ctx.token.string.match(/\S/)) ||
                    ctx.token.string === ",") {
                lastValue = curValue;
            } else {
                lastValue = "";
                if (propValues.length === 0 || curValue.match(/,\s*$/)) {
                    // stack is empty, or current value ends with a comma
                    // (and optional whitespace), so push it on the stack
                    propValues.push(curValue);
                } else {
                    // current value does not end with a comma (and optional ws) so prepend
                    // to last stack item (e.g. "rgba(50" get broken into 2 tokens)
                    propValues[propValues.length - 1] = curValue + propValues[propValues.length - 1];
                }
            }
        }
        if (propValues.length > 0) {
            propValues.reverse();
        }
        
        return propValues;
    }
    
    /**
     * @private
     * Gets all of the space/comma seperated tokens after the the current cursor position.
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @param {string} currentValue The token string at the current cursor position
     * @return {?Array.<string>} An array of all the space/comma seperated tokens after the
     *    current cursor position
     */
    function _getSucceedingPropValues(ctx, currentValue) {
        var lastValue = currentValue,
            curValue,
            propValues = [];
        
        while (ctx.token.string !== ";" && ctx.token.string !== "}" && TokenUtils.moveNextToken(ctx)) {
            if (ctx.token.string === ";" || ctx.token.string === "}") {
                break;
            }
            if (!_isInPropValue(ctx)) {
                lastValue = "";
                break;
            }
            
            if (lastValue === "") {
                lastValue = ctx.token.string.trim();
            } else if (lastValue.length > 0) {
                if (ctx.token.string.length > 0 && !ctx.token.string.match(/\S/)) {
                    lastValue += ctx.token.string;
                    propValues.push(lastValue);
                    lastValue = "";
                } else if (ctx.token.string === ",") {
                    lastValue += ctx.token.string;
                } else if (lastValue && lastValue.match(/,$/)) {
                    propValues.push(lastValue);
                    if (ctx.token.string.length > 0) {
                        lastValue = ctx.token.string;
                    } else {
                        lastValue = "";
                    }
                } else {
                    // e.g. "rgba(50" gets broken into 2 tokens
                    lastValue += ctx.token.string;
                }
            }
        }
        if (lastValue.length > 0) {
            propValues.push(lastValue);
        }

        return propValues;
    }
    
    /**
     * @private
     * Returns a context info object for the current CSS style rule
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @param {!Editor} editor
     * @return {{context: string,
     *           offset: number,
     *           name: string,
     *           index: number,
     *           values: Array.<string>,
     *           isNewItem: boolean}} A CSS context info object.
     */
    function _getRuleInfoStartingFromPropValue(ctx, editor) {
        var propNamePos = $.extend({}, ctx.pos),
            backwardPos = $.extend({}, ctx.pos),
            forwardPos  = $.extend({}, ctx.pos),
            propNameCtx = TokenUtils.getInitialContext(editor._codeMirror, propNamePos),
            backwardCtx,
            forwardCtx,
            lastValue = "",
            propValues = [],
            index = -1,
            offset = TokenUtils.offsetInToken(ctx),
            canAddNewOne = false,
            testPos = {ch: ctx.pos.ch + 1, line: ctx.pos.line},
            testToken = editor._codeMirror.getTokenAt(testPos, true),
            propName;
        
        // Get property name first. If we don't have a valid property name, then 
        // return a default rule info.
        propName = _getPropNameStartingFromPropValue(propNameCtx);
        if (!propName) {
            return createInfo();
        }
        
        // Scan backward to collect all preceding property values
        backwardCtx = TokenUtils.getInitialContext(editor._codeMirror, backwardPos);
        propValues = _getPrecedingPropValues(backwardCtx);

        lastValue = "";
        if (ctx.token.string === ":") {
            index = 0;
            canAddNewOne = true;
        } else {
            index = propValues.length - 1;
            if (ctx.token.string === ",") {
                propValues[index] += ctx.token.string;
                index++;
                canAddNewOne = true;
            } else {
                index = (index < 0) ? 0 : index + 1;
                if (ctx.token.string.match(/\S/)) {
                    lastValue = ctx.token.string;
                } else {
                    // Last token is all whitespace
                    canAddNewOne = true;
                    if (index > 0) {
                        // Append all spaces before the cursor to the previous value in values array
                        propValues[index - 1] += ctx.token.string.substr(0, offset);
                    }
                }
            }
        }
        
        if (canAddNewOne) {
            offset = 0;

            // If pos is at EOL, then there's implied whitespace (newline).
            if (editor.document.getLine(ctx.pos.line).length > ctx.pos.ch  &&
                    (testToken.string.length === 0 || testToken.string.match(/\S/))) {
                canAddNewOne = false;
            }
        }
        
        // Scan forward to collect all succeeding property values and append to all propValues.
        forwardCtx = TokenUtils.getInitialContext(editor._codeMirror, forwardPos);
        propValues = propValues.concat(_getSucceedingPropValues(forwardCtx, lastValue));
        
        // If current index is more than the propValues size, then the cursor is 
        // at the end of the existing property values and is ready for adding another one.
        if (index === propValues.length) {
            canAddNewOne = true;
        }
        
        return createInfo(PROP_VALUE, offset, propName, index, propValues, canAddNewOne);
    }
    
    /**
     * @private
     * Returns a context info object for the current CSS import rule
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @param {!Editor} editor
     * @return {{context: string,
     *           offset: number,
     *           name: string,
     *           index: number,
     *           values: Array.<string>,
     *           isNewItem: boolean}} A CSS context info object.
     */
    function _getImportUrlInfo(ctx, editor) {
        var propNamePos = $.extend({}, ctx.pos),
            backwardPos = $.extend({}, ctx.pos),
            forwardPos  = $.extend({}, ctx.pos),
            backwardCtx,
            forwardCtx,
            index = 0,
            propValues = [],
            offset = TokenUtils.offsetInToken(ctx),
            testPos = {ch: ctx.pos.ch + 1, line: ctx.pos.line},
            testToken = editor._codeMirror.getTokenAt(testPos, true);

        // Currently only support url. May be null if starting to type
        if (ctx.token.className && ctx.token.className !== "string") {
            return createInfo();
        }

        // Move backward to @import and collect data as we go. We return propValues
        // array, but we can only have 1 value, so put all data in first item
        backwardCtx = TokenUtils.getInitialContext(editor._codeMirror, backwardPos);
        propValues[0] = backwardCtx.token.string;

        while (TokenUtils.movePrevToken(backwardCtx)) {
            if (backwardCtx.token.className === "def" && backwardCtx.token.string === "@import") {
                break;
            }
            
            if (backwardCtx.token.className && backwardCtx.token.className !== "tag" && backwardCtx.token.string !== "url") {
                // Previous token may be white-space
                // Otherwise, previous token may only be "url("
                break;
            }
            
            propValues[0] = backwardCtx.token.string + propValues[0];
            offset += backwardCtx.token.string.length;
        }
        
        if (backwardCtx.token.className !== "def" || backwardCtx.token.string !== "@import") {
            // Not in url
            return createInfo();
        }

        // Get value after cursor up until closing paren or newline
        forwardCtx = TokenUtils.getInitialContext(editor._codeMirror, forwardPos);
        do {
            if (!TokenUtils.moveNextToken(forwardCtx)) {
                if (forwardCtx.token.string === "(") {
                    break;
                } else {
                    return createInfo();
                }
            }
            propValues[0] += forwardCtx.token.string;
        } while (forwardCtx.token.string !== ")" && forwardCtx.token.string !== "");
        
        return createInfo(IMPORT_URL, offset, "", index, propValues, false);
    }

    /**
     * Returns a context info object for the given cursor position
     * @param {!Editor} editor
     * @param {{ch: number, line: number}} constPos  A CM pos (likely from editor.getCursor())
     * @return {{context: string,
     *           offset: number,
     *           name: string,
     *           index: number,
     *           values: Array.<string>,
     *           isNewItem: boolean}} A CSS context info object.
     */
    function getInfoAtPos(editor, constPos) {
        // We're going to be changing pos a lot, but we don't want to mess up
        // the pos the caller passed in so we use extend to make a safe copy of it.	
        var pos = $.extend({}, constPos),
            ctx = TokenUtils.getInitialContext(editor._codeMirror, pos),
            offset = TokenUtils.offsetInToken(ctx),
            propName = "",
            mode = editor.getModeForSelection();
        
        // Check if this is inside a style block or in a css/less document.
        if (mode !== "css" && mode !== "text/x-scss" && mode !== "text/x-less") {
            return createInfo();
        }

        if (_isInPropName(ctx)) {
            if (ctx.token.type === "property" || ctx.token.type === "property error" || ctx.token.type === "tag") {
                propName = ctx.token.string;
            } else {
                var testPos = {ch: ctx.pos.ch + 1, line: ctx.pos.line},
                    testToken = editor._codeMirror.getTokenAt(testPos, true);
                
                if (testToken.type === "property" || testToken.type === "property error" || testToken.type === "tag") {
                    propName = testToken.string;
                    offset = 0;
                }
            }
            
            // If we're in property name context but not in an existing property name, 
            // then reset offset to zero.
            if (propName === "") {
                offset = 0;
            }
            
            return createInfo(PROP_NAME, offset, propName);
        }
        
        if (_isInPropValue(ctx)) {
            return _getRuleInfoStartingFromPropValue(ctx, editor);
        }

        if (_isInAtRule(ctx)) {
            return _getImportUrlInfo(ctx, editor);
        }
        
        return createInfo();
    }
    
    /**
     * Extracts all CSS selectors from the given text
     * Returns an array of selectors. Each selector is an object with the following properties:
         selector:                 the text of the selector (note: comma separated selector groups like 
                                   "h1, h2" are broken into separate selectors)
         ruleStartLine:            line in the text where the rule (including preceding comment) appears
         ruleStartChar:            column in the line where the rule (including preceding comment) starts
         selectorStartLine:        line in the text where the selector appears
         selectorStartChar:        column in the line where the selector starts
         selectorEndLine:          line where the selector ends
         selectorEndChar:          column where the selector ends
         selectorGroupStartLine:   line where the comma-separated selector group (e.g. .foo, .bar, .baz)
                                   starts that this selector (e.g. .baz) is part of. Particularly relevant for
                                   groups that are on multiple lines.
         selectorGroupStartChar:   column in line where the selector group starts.
         selectorGroup:            the entire selector group containing this selector, or undefined if there 
                                   is only one selector in the rule.
         declListStartLine:        line where the declaration list for the rule starts
         declListStartChar:        column in line where the declaration list for the rule starts
         declListEndLine:          line where the declaration list for the rule ends
         declListEndChar:          column in the line where the declaration list for the rule ends
     * @param text {!string} CSS text to extract from
     * @return {Array.<Object>} Array with objects specifying selectors.
     */
    function extractAllSelectors(text) {
        var selectors = [];
        var mode = CodeMirror.getMode({indentUnit: 2}, "css");
        var state, lines, lineCount;
        var token, style, stream, line;
        var currentSelector = "";
        var ruleStartChar = -1, ruleStartLine = -1;
        var selectorStartChar = -1, selectorStartLine = -1;
        var selectorGroupStartLine = -1, selectorGroupStartChar = -1;
        var declListStartLine = -1, declListStartChar = -1;
        var escapePattern = new RegExp("\\\\[^\\\\]+", "g");
        var validationPattern = new RegExp("\\\\([a-f0-9]{6}|[a-f0-9]{4}(\\s|\\\\|$)|[a-f0-9]{2}(\\s|\\\\|$)|.)", "i");
        
        // implement _firstToken()/_nextToken() methods to
        // provide a single stream of tokens
        
        function _hasStream() {
            while (stream.eol()) {
                line++;
                if (line >= lineCount) {
                    return false;
                }
                if (currentSelector.match(/\S/)) {
                    // If we are in a current selector and starting a newline,
                    // make sure there is whitespace in the selector
                    currentSelector += " ";
                }
                stream = new CodeMirror.StringStream(lines[line]);
            }
            return true;
        }
        
        function _firstToken() {
            state = CodeMirror.startState(mode);
            lines = CodeMirror.splitLines(text);
            lineCount = lines.length;
            if (lineCount === 0) {
                return false;
            }
            line = 0;
            stream = new CodeMirror.StringStream(lines[line]);
            if (!_hasStream()) {
                return false;
            }
            style = mode.token(stream, state);
            token = stream.current();
            return true;
        }
        
        function _nextToken() {
            // advance the stream past this token
            stream.start = stream.pos;
            if (!_hasStream()) {
                return false;
            }
            style = mode.token(stream, state);
            token = stream.current();
            return true;
        }
        
        function _firstTokenSkippingWhitespace() {
            if (!_firstToken()) {
                return false;
            }
            while (!token.match(/\S/)) {
                if (!_nextToken()) {
                    return false;
                }
            }
            return true;
        }
        
        function _nextTokenSkippingWhitespace() {
            if (!_nextToken()) {
                return false;
            }
            while (!token.match(/\S/)) {
                if (!_nextToken()) {
                    return false;
                }
            }
            return true;
        }

        function _isStartComment() {
            return (token.match(/^\/\*/));
        }
        
        function _parseComment() {
            while (!token.match(/\*\/$/)) {
                if (!_nextToken()) {
                    break;
                }
            }
        }

        function _nextTokenSkippingComments() {
            if (!_nextToken()) {
                return false;
            }
            while (_isStartComment()) {
                _parseComment();
                if (!_nextToken()) {
                    return false;
                }
            }
            return true;
        }

        function _parseSelector(start) {
            
            currentSelector = "";
            selectorStartChar = start;
            selectorStartLine = line;
            
            // Everything until the next ',' or '{' is part of the current selector
            while (token !== "," && token !== "{") {
                currentSelector += token;
                if (!_nextTokenSkippingComments()) {
                    return false; // eof
                }
            }
            
            // Unicode character replacement as defined in http://www.w3.org/TR/CSS21/syndata.html#characters
            if (/\\/.test(currentSelector)) {
                // Double replace in case of pattern overlapping (regex improvement?)
                currentSelector = currentSelector.replace(escapePattern, function (escapedToken) {
                    return escapedToken.replace(validationPattern, function (unicodeChar) {
                        unicodeChar = unicodeChar.substr(1);
                        if (unicodeChar.length === 1) {
                            return unicodeChar;
                        } else {
                            if (parseInt(unicodeChar, 16) < 0x10FFFF) {
                                return String.fromCharCode(parseInt(unicodeChar, 16));
                            } else { return String.fromCharCode(0xFFFD); }
                        }
                    });
                });
            }
            
            currentSelector = currentSelector.trim();
            var startChar = (selectorGroupStartLine === -1) ? selectorStartChar : selectorStartChar + 1;
            var selectorStart = (stream.string.indexOf(currentSelector, selectorStartChar) !== -1) ? stream.string.indexOf(currentSelector, selectorStartChar - currentSelector.length) : startChar;

            if (currentSelector !== "") {
                selectors.push({selector: currentSelector,
                                ruleStartLine: ruleStartLine,
                                ruleStartChar: ruleStartChar,
                                selectorStartLine: selectorStartLine,
                                selectorStartChar: selectorStart,
                                declListEndLine: -1,
                                selectorEndLine: line,
                                selectorEndChar: selectorStart + currentSelector.length,
                                selectorGroupStartLine: selectorGroupStartLine,
                                selectorGroupStartChar: selectorGroupStartChar
                               });
                currentSelector = "";
            }
            selectorStartChar = -1;

            return true;
        }
        
        function _parseSelectorList() {
            selectorGroupStartLine = (stream.string.indexOf(",") !== -1) ? line : -1;
            selectorGroupStartChar = stream.start;

            if (!_parseSelector(stream.start)) {
                return false;
            }

            while (token === ",") {
                if (!_nextTokenSkippingComments()) {
                    return false; // eof
                }
                if (!_parseSelector(stream.start)) {
                    return false;
                }
            }

            return true;
        }

        function _parseDeclarationList() {

            var j;
            declListStartLine = Math.min(line, lineCount - 1);
            declListStartChar = stream.start;
            
            // Extract the entire selector group we just saw.
            var selectorGroup, sgLine;
            if (selectorGroupStartLine !== -1) {
                selectorGroup = "";
                for (sgLine = selectorGroupStartLine; sgLine <= declListStartLine; sgLine++) {
                    var startChar = 0, endChar = lines[sgLine].length;
                    if (sgLine === selectorGroupStartLine) {
                        startChar = selectorGroupStartChar;
                    } else {
                        selectorGroup += " "; // replace the newline with a single space
                    }
                    if (sgLine === declListStartLine) {
                        endChar = declListStartChar;
                    }
                    selectorGroup += lines[sgLine].substring(startChar, endChar);
                }
                selectorGroup = selectorGroup.trim();
            }

            // Since we're now in a declaration list, that means we also finished
            // parsing the whole selector group. Therefore, reset selectorGroupStartLine
            // so that next time we parse a selector we know it's a new group
            selectorGroupStartLine = -1;
            selectorGroupStartChar = -1;
            ruleStartLine = -1;
            ruleStartChar = -1;

            // Skip everything until the next '}'
            while (token !== "}") {
                if (!_nextTokenSkippingComments()) {
                    break;
                }
            }
            
            // assign this declaration list position and selector group to every selector on the stack
            // that doesn't have a declaration list start and end line
            for (j = selectors.length - 1; j >= 0; j--) {
                if (selectors[j].declListEndLine !== -1) {
                    break;
                } else {
                    selectors[j].declListStartLine = declListStartLine;
                    selectors[j].declListStartChar = declListStartChar;
                    selectors[j].declListEndLine = line;
                    selectors[j].declListEndChar = stream.pos - 1; // stream.pos actually points to the char after the }
                    if (selectorGroup) {
                        selectors[j].selectorGroup = selectorGroup;
                    }
                }
            }
        }
        
        function includeCommentInNextRule() {
            if (ruleStartChar !== -1) {
                return false;       // already included
            }
            if (stream.start > 0 && lines[line].substr(0, stream.start).indexOf("}") !== -1) {
                return false;       // on same line as '}', so it's for previous rule
            }
            return true;
        }
        
        function _isStartAtRule() {
            return (token.match(/^@/));
        }
        
        function _parseAtRule() {

            // reset these fields to ignore comments preceding @rules
            ruleStartLine = -1;
            ruleStartChar = -1;
            selectorStartLine = -1;
            selectorStartChar = -1;
            selectorGroupStartLine = -1;
            selectorGroupStartChar = -1;
            
            if (token.match(/@media/i)) {
                // @media rule holds a rule list
                
                // Skip everything until the opening '{'
                while (token !== "{") {
                    if (!_nextTokenSkippingComments()) {
                        return; // eof
                    }
                }

                // skip past '{', to next non-ws token
                if (!_nextTokenSkippingWhitespace()) {
                    return; // eof
                }

                // Parse rules until we see '}'
                _parseRuleList("}");

            } else if (token.match(/@(charset|import|namespace)/i)) {
                
                // This code handles @rules in this format:
                //   @rule ... ;
                // Skip everything until the next ';'
                while (token !== ";") {
                    if (!_nextTokenSkippingComments()) {
                        return; // eof
                    }
                }
                
            } else {
                // This code handle @rules that use this format:
                //    @rule ... { ... }
                // such as @page, @keyframes (also -webkit-keyframes, etc.), and @font-face.
                // Skip everything until the next '}'
                while (token !== "}") {
                    if (!_nextTokenSkippingComments()) {
                        return; // eof
                    }
                }
            }
        }

        // parse a style rule
        function _parseRule() {
            if (!_parseSelectorList()) {
                return false;
            }

            _parseDeclarationList();
        }
        
        function _parseRuleList(escapeToken) {
            
            while ((!escapeToken) || token !== escapeToken) {
                if (_isStartAtRule()) {
                    // @rule
                    _parseAtRule();
    
                } else if (_isStartComment()) {
                    // comment - make this part of style rule
                    if (includeCommentInNextRule()) {
                        ruleStartChar = stream.start;
                        ruleStartLine = line;
                    }
                    _parseComment();
    
                } else {
                    // Otherwise, it's style rule
                    if (ruleStartChar === -1) {
                        ruleStartChar = stream.start;
                        ruleStartLine = line;
                    }
                    _parseRule();
                }
                
                if (!_nextTokenSkippingWhitespace()) {
                    break;
                }
            }
        }
        
        // Do parsing

        if (_firstTokenSkippingWhitespace()) {

            // Style sheet is a rule list
            _parseRuleList();
        }

        return selectors;
    }
    
    /*
     * This code can be used to create an "independent" HTML document that can be passed to jQuery
     * calls. Allows using jQuery's CSS selector engine without actually putting anything in the browser's DOM
     *
    var _htmlDoctype = document.implementation.createDocumentType('html',
        '-//W3C//DTD XHTML 1.0 Strict//EN',
        'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
    );
    var _htmlDocument = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', _htmlDoctype);

    function checkIfSelectorSelectsHTML(selector, theHTML) {
        $('html', _htmlDocument).html(theHTML);
        return ($(selector, _htmlDocument).length > 0);
    }
    */
    
    /**
     * Finds all instances of the specified selector in "text".
     * Returns an Array of Objects with start and end properties.
     *
     * For Sprint 4, we only support simple selectors. This function will need to change
     * dramatically to support full selectors.
     *
     * FUTURE: (JRB) It would be nice to eventually use the browser/jquery to do the selector evaluation.
     * One way to do this would be to take the user's HTML, add a special attribute to every tag with a UID,
     * and then construct a DOM (using the commented out code above). Then, give this DOM and the selector to 
     * jquery and ask what matches. If the node that the user's cursor is in comes back from jquery, then 
     * we know the selector applies.
     *
     * @param text {!string} CSS text to search
     * @param selector {!string} selector to search for
     * @return {Array.<{selectorGroupStartLine:number, declListEndLine:number, selector:string}>}
     *      Array of objects containing the start and end line numbers (0-based, inclusive range) for each
     *      matched selector.
     */
    function _findAllMatchingSelectorsInText(text, selector) {
        var allSelectors = extractAllSelectors(text);
        var result = [];
        var i;
        
        // For sprint 4 we only match the rightmost simple selector, and ignore 
        // attribute selectors and pseudo selectors
        var classOrIdSelector = selector[0] === "." || selector[0] === "#";
        var prefix = "";
        
        // Escape initial "." in selector, if present.
        if (selector[0] === ".") {
            selector = "\\" + selector;
        }
        
        if (!classOrIdSelector) {
            // Tag selectors must have nothing, whitespace, or a combinator before it.
            selector = "(^|[\\s>+~])" + selector;
        }
        
        var re = new RegExp(selector + "(\\[[^\\]]*\\]|:{1,2}[\\w-()]+|\\.[\\w-]+|#[\\w-]+)*\\s*$", classOrIdSelector ? "" : "i");
        allSelectors.forEach(function (entry) {
            if (entry.selector.search(re) !== -1) {
                result.push(entry);
            } else if (!classOrIdSelector) {
                // Special case for tag selectors - match "*" as the rightmost character
                if (entry.selector.trim().search(/\*$/) !== -1) {
                    result.push(entry);
                }
            }
        });
        
        return result;
    }
    
    
    /**
     * Converts the results of _findAllMatchingSelectorsInText() into a simpler bag of data and
     * appends those new objects to the given 'resultSelectors' Array.
     * @param {Array.<{document:Document, lineStart:number, lineEnd:number}>} resultSelectors
     * @param {Array.<{selectorGroupStartLine:number, declListEndLine:number, selector:string}>} selectorsToAdd
     * @param {!Document} sourceDoc
     * @param {!number} lineOffset Amount to offset all line number info by. Used if the first line
     *          of the parsed CSS text is not the first line of the sourceDoc.
     */
    function _addSelectorsToResults(resultSelectors, selectorsToAdd, sourceDoc, lineOffset) {
        selectorsToAdd.forEach(function (selectorInfo) {
            resultSelectors.push({
                name: selectorInfo.selector,
                document: sourceDoc,
                lineStart: selectorInfo.ruleStartLine + lineOffset,
                lineEnd: selectorInfo.declListEndLine + lineOffset,
                selectorGroup: selectorInfo.selectorGroup
            });
        });
    }
    
    /** Finds matching selectors in CSS files; adds them to 'resultSelectors' */
    function _findMatchingRulesInCSSFiles(selector, resultSelectors) {
        var result          = new $.Deferred();
        
        // Load one CSS file and search its contents
        function _loadFileAndScan(fullPath, selector) {
            var oneFileResult = new $.Deferred();
            
            DocumentManager.getDocumentForPath(fullPath)
                .done(function (doc) {
                    // Find all matching rules for the given CSS file's content, and add them to the
                    // overall search result
                    var oneCSSFileMatches = _findAllMatchingSelectorsInText(doc.getText(), selector);
                    _addSelectorsToResults(resultSelectors, oneCSSFileMatches, doc, 0);
                    
                    oneFileResult.resolve();
                })
                .fail(function (error) {
                    oneFileResult.reject(error);
                });
        
            return oneFileResult.promise();
        }
        
        ProjectManager.getAllFiles(ProjectManager.getLanguageFilter("css"))
            .done(function (cssFiles) {
                // Load index of all CSS files; then process each CSS file in turn (see above)
                Async.doInParallel(cssFiles, function (fileInfo, number) {
                    return _loadFileAndScan(fileInfo.fullPath, selector);
                })
                    .then(result.resolve, result.reject);
            });
        
        return result.promise();
    }
    
    /** Finds matching selectors in the <style> block of a single HTML file; adds them to 'resultSelectors' */
    function _findMatchingRulesInStyleBlocks(htmlDocument, selector, resultSelectors) {
        // HTMLUtils requires a real CodeMirror instance; make sure we can give it the right Editor
        var htmlEditor = EditorManager.getCurrentFullEditor();
        if (htmlEditor.document !== htmlDocument) {
            console.error("Cannot search for <style> blocks in HTML file other than current editor");
            return;
        }
        
        // Find all <style> blocks in the HTML file
        var styleBlocks = HTMLUtils.findStyleBlocks(htmlEditor);
        
        styleBlocks.forEach(function (styleBlockInfo) {
            // Search this one <style> block's content, appending results to 'resultSelectors'
            var oneStyleBlockMatches = _findAllMatchingSelectorsInText(styleBlockInfo.text, selector);
            _addSelectorsToResults(resultSelectors, oneStyleBlockMatches, htmlDocument, styleBlockInfo.start.line);
        });
    }
    
    /**
     * Return all rules matching the specified selector.
     * For Sprint 4, we only look at the rightmost simple selector. For example, searching for ".foo" will 
     * match these rules:
     *  .foo {}
     *  div .foo {}
     *  div.foo {}
     *  div .foo[bar="42"] {}
     *  div .foo:hovered {}
     *  div .foo::first-child
     * but will *not* match these rules:
     *  .foobar {}
     *  .foo .bar {}
     *  div .foo .bar {}
     *  .foo.bar {}
     *
     * @param {!string} selector The selector to match. This can be a tag selector, class selector or id selector
     * @param {?Document} htmlDocument An HTML file for context (so we can search <style> blocks)
     * @return {$.Promise} that will be resolved with an Array of objects containing the
     *      source document, start line, and end line (0-based, inclusive range) for each matching declaration list.
     *      Does not addRef() the documents returned in the array.
     */
    function findMatchingRules(selector, htmlDocument) {
        var result          = new $.Deferred(),
            resultSelectors = [];
        
        // Synchronously search for matches in <style> blocks
        if (htmlDocument) {
            _findMatchingRulesInStyleBlocks(htmlDocument, selector, resultSelectors);
        }
        
        // Asynchronously search for matches in all the project's CSS files
        // (results are appended together in same 'resultSelectors' array)
        _findMatchingRulesInCSSFiles(selector, resultSelectors)
            .done(function () {
                result.resolve(resultSelectors);
            })
            .fail(function (error) {
                result.reject(error);
            });
        
        return result.promise();
    }
    
    /**
     * Returns the selector(s) of the rule at the specified document pos, or "" if the position is 
     * is not within a style rule.
     *
     * @param {!Editor} editor Editor to search
     * @param {!{line: number, ch: number}} pos Position to search
     * @return {string} Selector(s) for the rule at the specified position, or "" if the position
     *          is not within a style rule. If the rule has multiple selectors, a comma-separated
     *          selector string is returned.
     */
    function findSelectorAtDocumentPos(editor, pos) {
        var cm = editor._codeMirror;
        var ctx = TokenUtils.getInitialContext(cm, $.extend({}, pos));
        var selector = "", inSelector = false, foundChars = false;

        function _stripAtRules(selector) {
            selector = selector.trim();
            if (selector.indexOf("@") === 0) {
                return "";
            }
            return selector;
        }
        
        // Parse a selector. Assumes ctx is pointing at the opening
        // { that is after the selector name.
        function _parseSelector(ctx) {
            var selector = "";
            
            // Skip over {
            TokenUtils.movePrevToken(ctx);
            
            while (true) {
                if (ctx.token.type !== "comment") {
                    // Stop once we've reached a {, }, or ;
                    if (/[\{\}\;]/.test(ctx.token.string)) {
                        break;
                    }
                    
                    // Stop once we've reached a <style ...> tag
                    if (ctx.token.string === "<style") {
                        // Remove everything up to end-of-tag from selector
                        var eotIndex = selector.indexOf(">");
                        if (eotIndex !== -1) {
                            selector = selector.substring(eotIndex + 1);
                        }
                        break;
                    }
                    
                    selector = ctx.token.string + selector;
                }
                if (!TokenUtils.movePrevToken(ctx)) {
                    break;
                }
            }
            
            return selector;
        }
        
        // scan backwards to see if the cursor is in a rule
        while (true) {
            if (ctx.token.type !== "comment") {
                if (ctx.token.string === "}") {
                    break;
                } else if (ctx.token.string === "{") {
                    selector = _parseSelector(ctx);
                    break;
                } else {
                    if (ctx.token.string.trim() !== "") {
                        foundChars = true;
                    }
                }
            }
            
            if (!TokenUtils.movePrevToken(ctx)) {
                break;
            }
        }
        
        selector = _stripAtRules(selector);
        
        // Reset the context to original scan position
        ctx = TokenUtils.getInitialContext(cm, $.extend({}, pos));
        
        // special case - we aren't in a selector and haven't found any chars,
        // look at the next immediate token to see if it is non-whitespace
        if (!selector && !foundChars) {
            if (TokenUtils.moveNextToken(ctx) && ctx.token.type !== "comment" && ctx.token.string.trim() !== "") {
                foundChars = true;
                ctx = TokenUtils.getInitialContext(cm, $.extend({}, pos));
            }
        }
        
        // At this point if we haven't found a selector, but have seen chars when
        // scanning, assume we are in the middle of a selector.
        if (!selector && foundChars) {
            // scan forward to see if the cursor is in a selector
            while (true) {
                if (ctx.token.type !== "comment") {
                    if (ctx.token.string === "{") {
                        selector = _parseSelector(ctx);
                        break;
                    } else if (ctx.token.string === "}" || ctx.token.string === ";") {
                        break;
                    }
                }
                if (!TokenUtils.moveNextToken(ctx)) {
                    break;
                }
            }
        }
        
        return _stripAtRules(selector);
    }
    
    /**
     * removes CSS comments from the content 
     * @param {!string} content to reduce
     * @return {string} reduced content 
     */
    function _removeComments(content) {
        return content.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\//g, "");
    }
    
    /**
     * removes strings from the content 
     * @param {!string} content to reduce
     * @return {string} reduced content 
     */
    function _removeStrings(content) {
        return content.replace(/[^\\]\"(.*)[^\\]\"|[^\\]\'(.*)[^\\]\'+/g, "");
    }
    
    /**
     * Reduces the style sheet by removing comments and strings 
     * so that the content can be parsed using a regular expression
     * @param {!string} content to reduce
     * @return {string} reduced content 
     */
    function reduceStyleSheetForRegExParsing(content) {
        return _removeStrings(_removeComments(content));
    }
    
    /**
     * Extracts all named flow instances
     * @param {!string} text to extract from
     * @return {Array.<string>} array of unique flow names found in the content (empty if none)
     */
    function extractAllNamedFlows(text) {
        var namedFlowRegEx = /(?:flow\-(into|from)\:\s*)([\w\-]+)(?:\s*;)/gi,
            result = [],
            names = {},
            thisMatch;
        
        // Reduce the content so that matches 
        // inside strings and comments are ignored 
        text = reduceStyleSheetForRegExParsing(text);

        // Find the first match
        thisMatch = namedFlowRegEx.exec(text);
        
        // Iterate over the matches and add them to result
        while (thisMatch) {
            var thisName = thisMatch[2];
            
            if (IGNORED_FLOW_NAMES.indexOf(thisName) === -1 && !names.hasOwnProperty(thisName)) {
                names[thisName] = result.push(thisName);
            }
            thisMatch = namedFlowRegEx.exec(text);
        }
        
        return result;
    }
    
    /**
     * Adds a new rule to the end of the given document, and returns the range of the added rule
     * and the position of the cursor on the indented blank line within it. Note that the range will
     * not include all the inserted text (we insert extra newlines before and after the rule).
     * @param {Document} doc The document to insert the rule into.
     * @param {string} selector The selector to use for the given rule.
     * @param {boolean} useTabChar Whether to indent with a tab.
     * @param {number} indentUnit If useTabChar is false, how many spaces to indent with.
     * @return {{range: {from: {line: number, ch: number}, to: {line: number, ch: number}}, pos: {line: number, ch: number}}}
     *     The range of the inserted rule and the location where the cursor should be placed.
     */
    function addRuleToDocument(doc, selector, useTabChar, indentUnit) {
        var newRule = "\n" + selector + " {\n",
            blankLineOffset;
        if (useTabChar) {
            newRule += "\t";
            blankLineOffset = 1;
        } else {
            var i;
            for (i = 0; i < indentUnit; i++) {
                newRule += " ";
            }
            blankLineOffset = indentUnit;
        }
        newRule += "\n}\n";
        
        var docLines = doc.getText().split("\n"),
            lastDocLine = docLines.length - 1,
            lastDocChar = docLines[docLines.length - 1].length;
        doc.replaceRange(newRule, {line: lastDocLine, ch: lastDocChar});
        return {
            range: {
                from: {line: lastDocLine + 1, ch: 0},
                to: {line: lastDocLine + 3, ch: 1}
            },
            pos: {line: lastDocLine + 2, ch: blankLineOffset}
        };
    }
    
    /**
     * 
     * In the given rule array (as returned by `findMatchingRules()`), if multiple rules in a row 
     * refer to the same rule (because there were multiple matching selectors), eliminate the redundant 
     * rules. Also, always use the selector group if available instead of the original matching selector.
     */
    function consolidateRules(rules) {
        var newRules = [], lastRule;
        rules.forEach(function (rule) {
            if (rule.selectorGroup) {
                rule.name = rule.selectorGroup;
            }
            // Push the entry unless it refers to the same rule as the previous entry.
            if (!(lastRule &&
                     rule.document === lastRule.document &&
                     rule.lineStart === lastRule.lineStart &&
                     rule.lineEnd === lastRule.lineEnd &&
                     rule.selectorGroup === lastRule.selectorGroup)) {
                newRules.push(rule);
            }
            lastRule = rule;
        });
        return newRules;
    }
    
    /**
     * Given a TextRange, extracts the selector(s) for the rule in the range and returns it.
     * Assumes the range only contains one rule; if there's more than one, it will return the
     * selector(s) for the first rule.
     * @param {TextRange} range The range to extract the selector(s) from.
     * @return {string} The selector(s) for the rule in the range.
     */
    function getRangeSelectors(range) {
        // There's currently no immediate way to access a given line in a Document, because it's just
        // stored as a string. Eventually, we should have Documents cache the lines in the document
        // as well, or make them use CodeMirror documents which do the same thing.
        var i, startIndex = 0, endIndex, text = range.document.getText();
        for (i = 0; i < range.startLine; i++) {
            startIndex = text.indexOf("\n", startIndex) + 1;
        }
        endIndex = startIndex;
        // Go one line past the end line. We'll extract text up to but not including the last newline.
        for (i = range.startLine + 1; i <= range.endLine + 1; i++) {
            endIndex = text.indexOf("\n", endIndex) + 1;
        }
        var allSelectors = extractAllSelectors(text.substring(startIndex, endIndex));
        
        // There should only be one rule in the range, and if there are multiple selectors for
        // the first rule, they'll all be recorded in the "selectorGroup" for the first selector,
        // so we only need to look at the first one.
        return (allSelectors.length ? allSelectors[0].selectorGroup || allSelectors[0].selector : "");
    }
        
    exports._findAllMatchingSelectorsInText = _findAllMatchingSelectorsInText; // For testing only
    exports.findMatchingRules = findMatchingRules;
    exports.extractAllSelectors = extractAllSelectors;
    exports.extractAllNamedFlows = extractAllNamedFlows;
    exports.findSelectorAtDocumentPos = findSelectorAtDocumentPos;
    exports.reduceStyleSheetForRegExParsing = reduceStyleSheetForRegExParsing;
    exports.addRuleToDocument = addRuleToDocument;
    exports.consolidateRules = consolidateRules;
    exports.getRangeSelectors = getRangeSelectors;

    exports.SELECTOR = SELECTOR;
    exports.PROP_NAME = PROP_NAME;
    exports.PROP_VALUE = PROP_VALUE;
    exports.IMPORT_URL = IMPORT_URL;
    
    exports.getInfoAtPos = getInfoAtPos;

    // The createInfo is really only for the unit tests so they can make the same  
    // structure to compare results with.
    exports.createInfo = createInfo;
});
