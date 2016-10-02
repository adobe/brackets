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

/*jslint regexp: true */

/**
 * Set of utilities for simple parsing of CSS text.
 */
define(function (require, exports, module) {
    "use strict";

    var CodeMirror          = require("thirdparty/CodeMirror/lib/codemirror"),
        Async               = require("utils/Async"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        HTMLUtils           = require("language/HTMLUtils"),
        LanguageManager     = require("language/LanguageManager"),
        ProjectManager      = require("project/ProjectManager"),
        TokenUtils          = require("utils/TokenUtils"),
        _                   = require("thirdparty/lodash");

    // Constants
    var SELECTOR   = "selector",
        PROP_NAME  = "prop.name",
        PROP_VALUE = "prop.value",
        IMPORT_URL = "import.url";

    var RESERVED_FLOW_NAMES = ["content", "element"],
        INVALID_FLOW_NAMES = ["none", "inherit", "default", "auto", "initial"],
        IGNORED_FLOW_NAMES = RESERVED_FLOW_NAMES.concat(INVALID_FLOW_NAMES);

    /**
     * List of all bracket pairs that is keyed by opening brackets, and the inverted list
     * that is keyed by closing brackets.
     * @type {{string: string}}
     */
    var _bracketPairs = { "{": "}",
                          "[": "]",
                          "(": ")" },
        _invertedBracketPairs = _.invert(_bracketPairs);

    /**
     * Determines if the given path is a CSS preprocessor file that CSSUtils supports.
     * @param {string} filePath Absolute path to the file.
     * @return {boolean} true if LanguageManager identifies filePath as less or scss language.
     */
    function isCSSPreprocessorFile(filePath) {
        var languageId = LanguageManager.getLanguageForPath(filePath).getId();
        return (languageId === "less" || languageId === "scss");
    }

    /**
     * @private
     * Helper function to check whether the given text string has any non whitespace character.
     * @param {!string} text
     * @return {boolean} true if text has any non whitespace character
     */
    function _hasNonWhitespace(text) {
        return (/\S/.test(text));
    }

    /**
     * @private
     * Returns state of a context
     * @param {{editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}}} ctx
     * @return {{tokenize:function, state:string, stateArg:string, context:Object}}
     */
    function _getContextState(ctx) {
        if (!ctx || !ctx.token) {
            return null;
        }
        var state = ctx.token.state.localState || ctx.token.state;
        if (!state.context && ctx.token.state.html && ctx.token.state.html.localState) {
            state = ctx.token.state.html.localState;
        }
        return state;
    }

    /**
     * @private
     * Checks if the current cursor position is inside the property name context
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {boolean} true if the context is in property name
     */
    function _isInPropName(ctx) {
        var state = _getContextState(ctx),
            lastToken;
        if (!state || !state.context || ctx.token.type === "comment") {
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

        function isInsideParens(context) {
            if (context.type !== "parens" || !context.prev) {
                return false;
            }

            if (context.prev.type === "prop") {
                return true;
            }

            return isInsideParens(context.prev);
        }

        var state = _getContextState(ctx);
        if (!state || !state.context || !state.context.prev || ctx.token.type === "comment") {
            return false;
        }

        return ((state.context.type === "prop" &&
                    (state.context.prev.type === "rule" || state.context.prev.type === "block")) ||
                    isInsideParens(state.context));
    }

    /**
     * @private
     * Checks if the current cursor position is inside an at-rule
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {boolean} true if the context is in property value
     */
    function _isInAtRule(ctx) {
        var state = _getContextState(ctx);
        if (!state || !state.context) {
            return false;
        }
        return (state.context.type === "atBlock_parens");
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
     * @param {{start: {line: number, ch: number},
     *          end: {line: number, ch: number}}=} range A range object with a start position and an end position
     * @return {{context: string,
     *           offset: number,
     *           name: string,
     *           index: number,
     *           values: Array.<string>,
     *           isNewItem: boolean,
     *           range: {start: {line: number, ch: number},
     *                   end: {line: number, ch: number}}}} A CSS context info object.
     */
    function createInfo(context, offset, name, index, values, isNewItem, range) {
        var ruleInfo = { context: context || "",
                         offset: offset || 0,
                         name: name || "",
                         index: -1,
                         values: [],
                         isNewItem: (isNewItem === true),
                         range: range };

        if (context === PROP_VALUE || context === SELECTOR || context === IMPORT_URL) {
            ruleInfo.index = index;
            ruleInfo.values = values;
        }

        return ruleInfo;
    }

    /**
     * @private
     * Scan backwards to check for any prefix if the current context is property name.
     * If the current context is in a prefix (either 'meta' or '-'), then scan forwards
     * to collect the entire property name. Return the name of the property in the CSS
     * context info object if there is one that seems to be valid. Return an empty context
     * info when we find an invalid one.
     *
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} ctx  context
     * @return {{context: string,
     *           offset: number,
     *           name: string,
     *           index: number,
     *           values: Array.<string>,
     *           isNewItem: boolean,
     *           range: {start: {line: number, ch: number},
     *                   end: {line: number, ch: number}}}} A CSS context info object.
     */
    function _getPropNameInfo(ctx) {
        var propName = "",
            offset = TokenUtils.offsetInToken(ctx),
            tokenString = ctx.token.string,
            excludedCharacters = [";", "{", "}"];

        if (ctx.token.type === "property" || ctx.token.type === "property error" ||
                ctx.token.type === "tag") {
            propName = tokenString;
            if (TokenUtils.movePrevToken(ctx) && _hasNonWhitespace(ctx.token.string) &&
                    excludedCharacters.indexOf(ctx.token.string) === -1) {
                propName = ctx.token.string + tokenString;
                offset += ctx.token.string.length;
            }
        } else if (ctx.token.type === "meta" || tokenString === "-") {
            propName = tokenString;
            if (TokenUtils.moveNextToken(ctx) &&
                    (ctx.token.type === "property" || ctx.token.type === "property error" ||
                    ctx.token.type === "tag")) {
                propName += ctx.token.string;
            }
        } else if (_hasNonWhitespace(tokenString) && excludedCharacters.indexOf(tokenString) === -1) {
            // We're not inside the property name context.
            return createInfo();
        } else {
            var testPos = {ch: ctx.pos.ch + 1, line: ctx.pos.line},
                testToken = ctx.editor.getTokenAt(testPos, true);

            if (testToken.type === "property" || testToken.type === "property error" ||
                    testToken.type === "tag") {
                propName = testToken.string;
                offset = 0;
            } else if (testToken.type === "meta" || testToken.string === "-") {
                ctx.pos = testPos;
                ctx.token = testToken;
                return _getPropNameInfo(ctx);
            }
        }

        // If we're in the property name context but not in an existing property name,
        // then reset offset to zero.
        if (propName === "") {
            offset = 0;
        }

        return createInfo(PROP_NAME, offset, propName);
    }

    /**
     * @private
     * Scans backwards from the current context and returns the name of the property if there is
     * a valid one.
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {string} the property name of the current rule.
     */
    function _getPropNameStartingFromPropValue(ctx) {
        var ctxClone = $.extend({}, ctx),
            propName = "";
        do {
            // If we're no longer in the property value before seeing a colon, then we don't
            // have a valid property name. Just return an empty string.
            if (ctxClone.token.string !== ":" && !_isInPropValue(ctxClone)) {
                return "";
            }
        } while (ctxClone.token.string !== ":" && TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctxClone));

        if (ctxClone.token.string === ":" && TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctxClone) &&
                (ctxClone.token.type === "property" || ctxClone.token.type === "property error")) {
            propName = ctxClone.token.string;
            if (TokenUtils.movePrevToken(ctxClone) && ctxClone.token.type === "meta") {
                propName = ctxClone.token.string + propName;
            }
        }

        return propName;
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
     * Return a range object with a start position and an end position after
     * skipping any whitespaces and all separators used before and after a
     * valid property value.
     *
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} startCtx context
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} endCtx context
     * @return {{start: {line: number, ch: number},
     *           end: {line: number, ch: number}}} A range object.
     */
    function _getRangeForPropValue(startCtx, endCtx) {
        var range = { "start": {},
                      "end": {} };

        // Skip the ":" and any leading whitespace
        while (TokenUtils.moveNextToken(startCtx)) {
            if (_hasNonWhitespace(startCtx.token.string)) {
                break;
            }
        }

        // Skip the trailing whitespace and property separators.
        while (endCtx.token.string === ";" || endCtx.token.string === "}" ||
                !_hasNonWhitespace(endCtx.token.string)) {
            TokenUtils.movePrevToken(endCtx);
        }

        range.start = _.clone(startCtx.pos);
        range.start.ch = startCtx.token.start;

        range.end = _.clone(endCtx.pos);
        range.end.ch = endCtx.token.end;

        return range;
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
     *           isNewItem: boolean,
     *           range: {start: {line: number, ch: number},
     *                   end: {line: number, ch: number}}}} A CSS context info object.
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
            propName,
            range;

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

        if (propValues.length) {
            range = _getRangeForPropValue(backwardCtx, forwardCtx);
        } else {
            // No property value, so just return the cursor pos as range
            range = { "start": _.clone(ctx.pos),
                      "end": _.clone(ctx.pos) };
        }

        // If current index is more than the propValues size, then the cursor is
        // at the end of the existing property values and is ready for adding another one.
        if (index === propValues.length) {
            canAddNewOne = true;
        }

        return createInfo(PROP_VALUE, offset, propName, index, propValues, canAddNewOne, range);
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
     *           isNewItem: boolean,
     *           range: {start: {line: number, ch: number},
     *                   end: {line: number, ch: number}}}} A CSS context info object.
     */
    function _getImportUrlInfo(ctx, editor) {
        var backwardPos = $.extend({}, ctx.pos),
            forwardPos  = $.extend({}, ctx.pos),
            backwardCtx,
            forwardCtx,
            index = 0,
            propValues = [],
            offset = TokenUtils.offsetInToken(ctx);

        // Currently only support url. May be null if starting to type
        if (ctx.token.type && ctx.token.type !== "string") {
            return createInfo();
        }

        // Move backward to @import and collect data as we go. We return propValues
        // array, but we can only have 1 value, so put all data in first item
        backwardCtx = TokenUtils.getInitialContext(editor._codeMirror, backwardPos);
        propValues[0] = backwardCtx.token.string;

        while (TokenUtils.movePrevToken(backwardCtx)) {
            if (backwardCtx.token.type === "def" && backwardCtx.token.string === "@import") {
                break;
            }

            if (backwardCtx.token.type && backwardCtx.token.type !== "atom" && backwardCtx.token.string !== "url") {
                // Previous token may be white-space
                // Otherwise, previous token may only be "url("
                break;
            }

            propValues[0] = backwardCtx.token.string + propValues[0];
            offset += backwardCtx.token.string.length;
        }

        if (backwardCtx.token.type !== "def" || backwardCtx.token.string !== "@import") {
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
     * @param {{ch: number, line: number}} constPos  A CM pos (likely from editor.getCursorPos())
     * @return {{context: string,
     *           offset: number,
     *           name: string,
     *           index: number,
     *           values: Array.<string>,
     *           isNewItem: boolean,
     *           range: {start: {line: number, ch: number},
     *                   end: {line: number, ch: number}}}} A CSS context info object.
     */
    function getInfoAtPos(editor, constPos) {
        // We're going to be changing pos a lot, but we don't want to mess up
        // the pos the caller passed in so we use extend to make a safe copy of it.
        var pos = $.extend({}, constPos),
            ctx = TokenUtils.getInitialContext(editor._codeMirror, pos),
            mode = editor.getModeForSelection();

        // Check if this is inside a style block or in a css/less document.
        if (mode !== "css" && mode !== "text/x-scss" && mode !== "text/x-less") {
            return createInfo();
        }

        if (_isInPropName(ctx)) {
            return _getPropNameInfo(ctx, editor);
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
     * Return a string that shows the literal parent hierarchy of the selector
     * in info.
     *
     * @param {!SelectorInfo} info
     * @param {boolean=} useGroup true to append selectorGroup instead of selector
     * @return {string} the literal parent hierarchy of the selector
     */
    function getCompleteSelectors(info, useGroup) {
        if (info.parentSelectors) {
            // Show parents with / separators.
            var completeSelectors = info.parentSelectors + " / ";
            if (useGroup && info.selectorGroup) {
                completeSelectors += info.selectorGroup;
            } else {
                completeSelectors += info.selector;
            }
            return completeSelectors;
        } else if (useGroup && info.selectorGroup) {
            return info.selectorGroup;
        }

        return info.selector;
    }

    /**
     * @typedef {{selector: !string,
     *            ruleStartLine: number,
     *            ruleStartChar: number,
     *            selectorStartLine: number,
     *            selectorStartChar: number,
     *            selectorEndLine: number,
     *            selectorEndChar: number,
     *            selectorGroupStartLine: number,
     *            selectorGroupStartChar: number,
     *            selectorGroup: ?string,
     *            declListStartLine: number,
     *            declListStartChar: number,
     *            declListEndLine: number,
     *            declListEndChar: number,
     *            level: number,
     *            parentSelectors: ?string}} SelectorInfo
     */

    /**
     * Extracts all CSS selectors from the given text
     * Returns an array of SelectorInfo. Each SelectorInfo is an object with the following properties:
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
         level:                    the level of the current selector including any containing @media block in the
                                   nesting level count. Use this property with caution since it is primarily for internal
                                   parsing use. For example, two sibling selectors may have different levels if one
                                   of them is nested inside an @media block and it should not be used for sibling info.
         parentSelectors:          all ancestor selectors separated with '/' if the current selector is a nested one
     * @param {!string} text CSS text to extract from
     * @param {?string} documentMode language mode of the document that text belongs to, default to css if undefined.
     * @return {Array.<SelectorInfo>} Array with objects specifying selectors.
     */
    function extractAllSelectors(text, documentMode) {
        var state, lines, lineCount,
            token, style, stream, line,
            selectors              = [],
            mode                   = CodeMirror.getMode({indentUnit: 2}, documentMode || "css"),
            currentSelector        = "",
            currentLevel           = 0,
            ruleStartChar          = -1,
            ruleStartLine          = -1,
            selectorStartChar      = -1,
            selectorStartLine      = -1,
            selectorGroupStartLine = -1,
            selectorGroupStartChar = -1,
            declListStartLine      = -1,
            declListStartChar      = -1,
            escapePattern          = new RegExp("\\\\[^\\\\]+", "g"),
            validationPattern      = new RegExp("\\\\([a-f0-9]{6}|[a-f0-9]{4}(\\s|\\\\|$)|[a-f0-9]{2}(\\s|\\\\|$)|.)", "i"),
            _parseRuleList;

        // implement _firstToken()/_nextToken() methods to
        // provide a single stream of tokens

        function _hasStream() {
            while (stream.eol()) {
                line++;
                if (line >= lineCount) {
                    return false;
                }
                if (_hasNonWhitespace(currentSelector)) {
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
            while (!_hasNonWhitespace(token)) {
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
            while (!_hasNonWhitespace(token)) {
                if (!_nextToken()) {
                    return false;
                }
            }
            return true;
        }

        function _isStartComment() {
            // Also check for line comments used in LESS and SASS.
            return (/^\/[\/\*]/.test(token));
        }

        function _parseComment() {
            // If it is a line comment, then do nothing and just return. Unlike block
            // comment, a line comment is just one single token and the caller always
            // has to find the next token by skipping the current token. So leaving
            // it for the caller to skip the current token.
            if (/^\/\//.test(token)) {
                return;
            }
            while (!/\*\/$/.test(token)) {
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

        function _skipToClosingBracket(startChar) {
            var skippedText = "",
                unmatchedBraces = 0;
            if (!startChar) {
                startChar = "{";
            }
            while (true) {
                if (token.indexOf(startChar) !== -1 && token.indexOf(_bracketPairs[startChar]) === -1) {
                    // Found an opening bracket but not the matching closing bracket in the same token
                    unmatchedBraces++;
                } else if (token === _bracketPairs[startChar]) {
                    unmatchedBraces--;
                    if (unmatchedBraces <= 0) {
                        skippedText += token;
                        return skippedText;
                    }
                }
                skippedText += token;

                if (!_nextTokenSkippingComments()) {
                    return skippedText; // eof
                }
            }
        }

        function _maybeProperty() {
            return (/^-(moz|ms|o|webkit)-$/.test(token) ||
                    (state.state !== "top" && state.state !== "block" && state.state !== "pseudo" &&
                    // Has a semicolon as in "rgb(0,0,0);", but not one of those after a LESS
                    // mixin parameter variable as in ".size(@width; @height)"
                    stream.string.indexOf(";") !== -1 && !/\([^)]+;/.test(stream.string)));
        }

        function _skipProperty() {
            var prevToken = "";
            while (token !== ";") {
                // Skip tokens until the closing brace if we find an interpolated variable.
                if (/[#@]\{$/.test(token) || (token === "{" && /[#@]$/.test(prevToken))) {
                    _skipToClosingBracket("{");
                    if (token === "}") {
                        _nextToken();   // Skip the closing brace
                    }
                    if (token === ";") {
                        break;
                    }
                }
                // If there is a '{' or '}' before the ';',
                // then stop skipping.
                if (token === "{" || token === "}") {
                    return false;   // can't tell if the entire property is skipped
                }
                prevToken = token;
                if (!_nextTokenSkippingComments()) {
                    break;
                }
            }
            return true;    // skip the entire property
        }

        function _getParentSelectors() {
            var j;
            for (j = selectors.length - 1; j >= 0; j--) {
                if (selectors[j].declListEndLine === -1 && selectors[j].level < currentLevel) {
                    return getCompleteSelectors(selectors[j], true);
                }
            }
            return "";
        }

        function _parseSelector(start, level) {

            currentSelector = "";
            selectorStartChar = start;
            selectorStartLine = line;

            // Everything until the next ',' or '{' is part of the current selector
            while ((token !== "," && token !== "{") ||
                    (token === "{" && /[#@]$/.test(currentSelector)) ||
                    (token === "," && !_hasNonWhitespace(currentSelector))) {
                if (token === "{") {
                    // Append the interpolated variable to selector
                    currentSelector += _skipToClosingBracket("{");
                    _nextToken();  // skip the closing brace
                } else if (token === "}" &&
                        (!currentSelector || /:\s*\S/.test(currentSelector) || !/[#@]\{.+/.test(currentSelector))) {
                    // Either empty currentSelector or currentSelector is a CSS property
                    // but not a selector that is in the form of #{$class} or @{class}
                    return false;
                }
                // Clear currentSelector if we're in a property, but make sure we don't treat
                // the semicolors inside a parameter as a property separators.
                if ((token === ";" && state.state !== "parens") ||
                        // Make sure that something like `> li > a {` is not identified as a property
                        (state.state === "prop" && !/\{/.test(stream.string))) {
                    currentSelector = "";
                } else if (token === "(") {
                    // Collect everything inside the parentheses as a whole chunk so that
                    // commas inside the parentheses won't be identified as selector separators
                    // by while loop.
                    if (_hasNonWhitespace(currentSelector)) {
                        currentSelector += _skipToClosingBracket("(");
                    } else {
                        // Nothing in currentSelector yet. Skip to the closing parenthesis
                        // without collecting the selector since a selector cannot start with
                        // an opening parenthesis.
                        _skipToClosingBracket("(");
                    }
                } else if (_hasNonWhitespace(token) || _hasNonWhitespace(currentSelector)) {
                    currentSelector += token;
                }
                if (!_nextTokenSkippingComments()) {
                    return false; // eof
                }
            }

            if (!currentSelector) {
                return false;
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
                if (currentLevel < level) {
                    currentLevel++;
                }
                if (ruleStartLine === -1) {
                    ruleStartLine = line;
                    ruleStartChar = stream.start - currentSelector.length;
                }
                var parentSelectors = _getParentSelectors();
                selectors.push({selector: currentSelector,
                                ruleStartLine: ruleStartLine,
                                ruleStartChar: ruleStartChar,
                                selectorStartLine: selectorStartLine,
                                selectorStartChar: selectorStart,
                                declListEndLine: -1,
                                selectorEndLine: line,
                                selectorEndChar: selectorStart + currentSelector.length,
                                selectorGroupStartLine: selectorGroupStartLine,
                                selectorGroupStartChar: selectorGroupStartChar,
                                level: currentLevel,
                                parentSelectors: parentSelectors
                               });
                currentSelector = "";
            }
            selectorStartChar = -1;

            return true;
        }

        function _parseSelectorList(level) {
            selectorGroupStartLine = (stream.string.indexOf(",") !== -1) ? line : -1;
            selectorGroupStartChar = stream.start;

            if (!_parseSelector(stream.start, level)) {
                return false;
            }

            while (token === ",") {
                if (!_nextTokenSkippingComments()) {
                    return false; // eof
                }
                if (!_parseSelector(stream.start, level)) {
                    return false;
                }
            }

            return true;
        }

        function _parseDeclarationList(level) {

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
                    selectorGroup += lines[sgLine].substring(startChar, endChar).trim();
                }
                selectorGroup = selectorGroup.trim();
            }

            // assign this declaration list position and selector group to every selector on the stack
            // that doesn't have a declaration list start and end line
            for (j = selectors.length - 1; j >= 0; j--) {
                if (selectors[j].level === level) {
                    if (selectors[j].declListEndLine !== -1) {
                        break;
                    } else {
                        selectors[j].declListStartLine = declListStartLine;
                        selectors[j].declListStartChar = declListStartChar;
                        if (selectorGroup) {
                            selectors[j].selectorGroup = selectorGroup;
                        }
                    }
                }
            }

            var nested = true;
            do {
                // Since we're now in a declaration list, that means we also finished
                // parsing the whole selector group. Therefore, reset selectorGroupStartLine
                // so that next time we parse a selector we know it's a new group
                selectorGroupStartLine = -1;
                selectorGroupStartChar = -1;
                ruleStartLine = -1;
                ruleStartChar = -1;

                if (!nested) {
                    if (currentLevel > 0 && currentLevel === level) {
                        currentLevel--;
                        // Skip past '}'
                        if (token === "}") {
                            _nextTokenSkippingWhitespace();
                        }
                    }
                }
                // Skip past '{' before parsing nested rule list.
                if (token === "{") {
                    _nextTokenSkippingWhitespace();
                }
                nested = _parseRuleList(undefined, currentLevel + 1);

                // assign this declaration list position to every selector on the stack
                // that doesn't have a declaration list end line
                for (j = selectors.length - 1; j >= 0; j--) {
                    if (selectors[j].level < currentLevel) {
                        break;
                    }
                    if (selectors[j].declListEndLine === -1) {
                        selectors[j].declListEndLine = line;
                        selectors[j].declListEndChar = stream.pos - 1; // stream.pos actually points to the char after the }
                    }
                }
            } while (currentLevel > 0 && currentLevel === level);
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
            // Exclude @mixin from at-rule so that we can parse it like a normal rule list
            return (/^@/.test(token) && !/^@mixin/i.test(token) && token !== "@");
        }

        function _followedByPseudoSelector() {
            return (/\}:(enabled|disabled|checked|indeterminate|link|visited|hover|active|focus|target|lang|root|nth-|first-|last-|only-|empty|not)/.test(stream.string));
        }

        function _isVariableInterpolatedProperty() {
            return (/[@#]\{\S+\}(\s*:|.*;)/.test(stream.string) && !_followedByPseudoSelector());
        }

        function _parseAtRule(level) {

            // reset these fields to ignore comments preceding @rules
            ruleStartLine = -1;
            ruleStartChar = -1;
            selectorStartLine = -1;
            selectorStartChar = -1;
            selectorGroupStartLine = -1;
            selectorGroupStartChar = -1;

            if (/@media/i.test(token)) {
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

                if (currentLevel <= level) {
                    currentLevel++;
                }

                // Parse rules until we see '}'
                // Treat media rule as one nested level by
                // calling _parseRuleList with next level.
                _parseRuleList("}", currentLevel + 1);

                if (currentLevel > 0) {
                    currentLevel--;
                }

            } else {
                // This code handles @rules in this format:
                //   @rule ... ;
                // Or any less variable that starts with @var ... ;
                // Skip everything until the next ';'
                while (token !== ";") {
                    // This code handle @rules that use this format:
                    //    @rule ... { ... }
                    // such as @page, @keyframes (also -webkit-keyframes, etc.), and @font-face.
                    // Skip everything including nested braces until the next matching '}'
                    if (token === "{") {
                        _skipToClosingBracket("{");
                        return;
                    }
                    if (!_nextTokenSkippingComments()) {
                        return; // eof
                    }
                }
            }
        }

        // parse a style rule
        function _parseRule(level) {
            if (!_parseSelectorList(level)) {
                return false;
            }

            _parseDeclarationList(level);
            return true;
        }

        _parseRuleList = function (escapeToken, level) {
            while ((!escapeToken) || token !== escapeToken) {
                if (_isVariableInterpolatedProperty()) {
                    if (!_skipProperty()) {
                        // We found a "{" or "}" while skipping a property. Return false to handle the
                        // opening or closing of a block properly.
                        return false;
                    }
                } else if (_isStartAtRule()) {
                    // @rule
                    _parseAtRule(level);
                } else if (_isStartComment()) {
                    // comment - make this part of style rule
                    if (includeCommentInNextRule()) {
                        ruleStartChar = stream.start;
                        ruleStartLine = line;
                    }
                    _parseComment();
                } else if (_maybeProperty()) {
                    // Skip the property.
                    if (!_skipProperty()) {
                        // We found a "{" or "}" while skipping a property. Return false to handle the
                        // opening or closing of a block properly.
                        return false;
                    }
                } else {
                    // Otherwise, it's style rule
                    if (!_parseRule(level === undefined ? 0 : level) && level > 0) {
                        return false;
                    }
                    if (level > 0) {
                        return true;
                    }
                    // Clear ruleStartChar and ruleStartLine in case we have a comment
                    // at the end of previous rule in level 0.
                    ruleStartChar = -1;
                    ruleStartLine = -1;
                }

                if (!_nextTokenSkippingWhitespace()) {
                    break;
                }
            }

            return true;
        };

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
     * Helper function to remove whitespaces before and after a selector
     * Returns trimmed selector if it is not an at-rule, or null if it starts with @.
     *
     * @param {string} selector
     * @return {string}
     */
    function _stripAtRules(selector) {
        selector = selector.trim();
        if (selector.indexOf("@") === 0) {
            return "";
        }
        return selector;
    }

    /**
     * Converts the given selector array into the actual CSS selectors similar to
     * those generated by a CSS preprocessor.
     *
     * @param {Array.<string>} selectorArray
     * @return {string}
     */
    function _getSelectorInFinalCSSForm(selectorArray) {
        var finalSelectorArray = [""],
            parentSelectorArray = [],
            group = [];
        _.forEach(selectorArray, function (selector) {
            selector = _stripAtRules(selector);
            group = selector.split(",");
            parentSelectorArray = [];
            _.forEach(group, function (cs) {
                var ampersandIndex = cs.indexOf("&");
                _.forEach(finalSelectorArray, function (ps) {
                    if (ampersandIndex === -1) {
                        cs = _stripAtRules(cs);
                        if (ps.length && cs.length) {
                            ps += " ";
                        }
                        ps += cs;
                    } else {
                        // Replace all instances of & with regexp
                        ps = _stripAtRules(cs.replace(/&/g, ps));
                    }
                    parentSelectorArray.push(ps);
                });
            });
            finalSelectorArray = parentSelectorArray;
        });
        return finalSelectorArray.join(", ");
    }

    /**
     * Finds all instances of the specified selector in "text".
     * Returns an Array of Objects with start and end properties.
     *
     * For now, we only support simple selectors. This function will need to change
     * dramatically to support full selectors.
     *
     * FUTURE: (JRB) It would be nice to eventually use the browser/jquery to do the selector evaluation.
     * One way to do this would be to take the user's HTML, add a special attribute to every tag with a UID,
     * and then construct a DOM (using the commented out code above). Then, give this DOM and the selector to
     * jquery and ask what matches. If the node that the user's cursor is in comes back from jquery, then
     * we know the selector applies.
     *
     * @param {!string} text CSS text to search
     * @param {!string} selector selector to search for
     * @param {!string} mode language mode of the document that text belongs to
     * @return {Array.<{selectorGroupStartLine:number, declListEndLine:number, selector:string}>}
     *      Array of objects containing the start and end line numbers (0-based, inclusive range) for each
     *      matched selector.
     */
    function _findAllMatchingSelectorsInText(text, selector, mode) {
        var allSelectors = extractAllSelectors(text, mode);
        var result = [];

        // For now, we only match the rightmost simple selector, and ignore
        // attribute selectors and pseudo selectors
        var classOrIdSelector = selector[0] === "." || selector[0] === "#";

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
            var actualSelector = entry.selector;
            if (entry.selector.indexOf("&") !== -1 && entry.parentSelectors) {
                var selectorArray = entry.parentSelectors.split(" / ");
                selectorArray.push(entry.selector);
                actualSelector = _getSelectorInFinalCSSForm(selectorArray);
            }
            if (actualSelector.search(re) !== -1) {
                result.push(entry);
            } else if (!classOrIdSelector) {
                // Special case for tag selectors - match "*" as the rightmost character
                if (/\*\s*$/.test(actualSelector)) {
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
     * @param {Array.<SelectorInfo>} selectorsToAdd
     * @param {!Document} sourceDoc
     * @param {!number} lineOffset Amount to offset all line number info by. Used if the first line
     *          of the parsed CSS text is not the first line of the sourceDoc.
     */
    function _addSelectorsToResults(resultSelectors, selectorsToAdd, sourceDoc, lineOffset) {
        selectorsToAdd.forEach(function (selectorInfo) {
            resultSelectors.push({
                name: getCompleteSelectors(selectorInfo),
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
                    var oneCSSFileMatches = _findAllMatchingSelectorsInText(doc.getText(), selector, doc.getLanguage().getMode());
                    _addSelectorsToResults(resultSelectors, oneCSSFileMatches, doc, 0);

                    oneFileResult.resolve();
                })
                .fail(function (error) {
                    console.warn("Unable to read " + fullPath + " during CSS rule search:", error);
                    oneFileResult.resolve();  // still resolve, so the overall result doesn't reject
                });

            return oneFileResult.promise();
        }

        ProjectManager.getAllFiles(ProjectManager.getLanguageFilter(["css", "less", "scss"]))
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
     * For now, we only look at the rightmost simple selector. For example, searching for ".foo" will
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
        var selector = "", foundChars = false;
        var isPreprocessorDoc = isCSSPreprocessorFile(editor.document.file.fullPath);
        var selectorArray = [];

        function _skipToOpeningBracket(ctx, startChar) {
            var unmatchedBraces = 0;
            if (!startChar) {
                startChar = "}";
            }
            while (true) {
                if (startChar === ctx.token.string) {
                    unmatchedBraces++;
                } else if (ctx.token.string.match(_invertedBracketPairs[startChar])) {
                    unmatchedBraces--;
                    if (unmatchedBraces <= 0) {
                        return;
                    }
                }

                if (!TokenUtils.movePrevToken(ctx)) {
                    return;
                }
            }
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
                    if (ctx.token.string === "style" && ctx.token.type === "tag") {
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

        var skipPrevSibling = false,
            state           = _getContextState(ctx);

        // If the cursor is inside a non-whitespace token with "block" or "top" state, then it is inside a
        // selector. The only exception is when it is immediately after the '{'.
        if (isPreprocessorDoc && _hasNonWhitespace(ctx.token.string) && ctx.token.string !== "{" &&
                (state.state === "block" || state.state === "top")) {
            foundChars = true;
        }

        // scan backwards to see if the cursor is in a rule
        do {
            if (ctx.token.type !== "comment") {
                if (ctx.token.string === "}") {
                    if (isPreprocessorDoc) {
                        if (state.state === "top") {
                            break;
                        }
                        skipPrevSibling = true;
                        // Skip past the entire preceding block until the matching "{"
                        _skipToOpeningBracket(ctx, "}");
                    } else {
                        break;
                    }
                } else if (ctx.token.string === "{") {
                    selector = _parseSelector(ctx);
                    if (isPreprocessorDoc) {
                        if (!skipPrevSibling && !/^\s*@/.test(selector)) {
                            selectorArray.unshift(selector);
                        }
                        if (skipPrevSibling) {
                            skipPrevSibling = false;
                        }
                    } else {
                        break;
                    }
                } else {
                    if (!isPreprocessorDoc && _hasNonWhitespace(ctx.token.string)) {
                        foundChars = true;
                    }
                    TokenUtils.movePrevToken(ctx);
                }
            } else {
                TokenUtils.movePrevToken(ctx);
            }
        } while (!TokenUtils.isAtStart(ctx));

        selector = _stripAtRules(selector);

        // Reset the context to original scan position
        ctx = TokenUtils.getInitialContext(cm, $.extend({}, pos));

        // special case - we aren't in a selector and haven't found any chars,
        // look at the next immediate token to see if it is non-whitespace.
        // For preprocessor documents we need to move the cursor to next non-whitespace
        // token so that we can collect the current selector if the cursor is inside it.
        if ((!selector && !foundChars && !isPreprocessorDoc) ||
                (isPreprocessorDoc && (ctx.token.string === "" || /\s+/.test(ctx.token.string)))) {
            if (TokenUtils.moveNextToken(ctx) && ctx.token.type !== "comment" && _hasNonWhitespace(ctx.token.string)) {
                foundChars = true;
                ctx = TokenUtils.getInitialContext(cm, $.extend({}, pos));
            }
        }

        // At this point if we haven't found a selector, but have seen chars when
        // scanning, assume we are in the middle of a selector. For a preprocessor
        // document we also need to collect the current selector if the cursor is
        // within the selector or whitespaces immediately before or after it.
        if ((!selector || isPreprocessorDoc) && foundChars) {
            // scan forward to see if the cursor is in a selector
            while (true) {
                if (ctx.token.type !== "comment") {
                    if (ctx.token.string === "{") {
                        selector = _parseSelector(ctx);
                        if (isPreprocessorDoc && !/^\s*@/.test(selector)) {
                            selectorArray.push(selector);
                        }
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

        if (isPreprocessorDoc) {
            return _getSelectorInFinalCSSForm(selectorArray);
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
        // First remove escaped quotes so we can balance unescaped quotes
        // since JavaScript doesn't support negative lookbehind
        var s = content.replace(/\\\"|\\\'/g, "");

        // Now remove strings
        return s.replace(/\"(.*?)\"|\'(.*?)\'/g, "");
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
    exports.getCompleteSelectors = getCompleteSelectors;
    exports.isCSSPreprocessorFile = isCSSPreprocessorFile;

    exports.SELECTOR = SELECTOR;
    exports.PROP_NAME = PROP_NAME;
    exports.PROP_VALUE = PROP_VALUE;
    exports.IMPORT_URL = IMPORT_URL;

    exports.getInfoAtPos = getInfoAtPos;

    // The createInfo is really only for the unit tests so they can make the same
    // structure to compare results with.
    exports.createInfo = createInfo;
});
