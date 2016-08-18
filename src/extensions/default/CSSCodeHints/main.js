/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var AppInit             = brackets.getModule("utils/AppInit"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        TokenUtils          = brackets.getModule("utils/TokenUtils"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        ColorUtils          = brackets.getModule("utils/ColorUtils"),
        Strings             = brackets.getModule("strings"),
        CSSProperties       = require("text!CSSProperties.json"),
        properties          = JSON.parse(CSSProperties);


    PreferencesManager.definePreference("codehint.CssPropHints", "boolean", true, {
        description: Strings.DESCRIPTION_CSS_PROP_HINTS
    });

    // Context of the last request for hints: either CSSUtils.PROP_NAME,
    // CSSUtils.PROP_VALUE or null.
    var lastContext,
        stringMatcherOptions = { preferPrefixMatches: true };

    /**
     * @constructor
     */
    function CssPropHints() {
        this.primaryTriggerKeys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-()";
        this.secondaryTriggerKeys = ":";
        this.exclusion = null;
    }

    /**
     * Get the CSS style text of the file open in the editor for this hinting session.
     * For a CSS file, this is just the text of the file. For an HTML file,
     * this will be only the text in the <style> tags.
     *
     * @return {string} the "css" text that can be sent to CSSUtils to extract all named flows.
     */
    CssPropHints.prototype.getCssStyleText = function () {
        if (LanguageManager.getLanguageForPath(this.editor.document.file.fullPath).getId() === "html") {
            // Collect text in all style blocks
            var text = "",
                styleBlocks = HTMLUtils.findBlocks(this.editor, "css");

            styleBlocks.forEach(function (styleBlock) {
                text += styleBlock.text;
            });

            return text;
        } else {
            // css file, just return the text
            return this.editor.document.getText();
        }
    };

    /**
     * Extract all the named flows from any "flow-from" or "flow-into" properties
     * in the current document. If we have the cached list of named flows and the
     * cursor is still on the same line as the cached cursor, then the cached list
     * is returned. Otherwise, we recollect all named flows and update the cache.
     *
     * @return {Array.<string>} All named flows available in the current document.
     */
    CssPropHints.prototype.getNamedFlows = function () {
        if (this.namedFlowsCache) {
            // If the cursor is no longer on the same line, then the cache is stale.
            // Delete cache so we can extract all named flows again.
            if (this.namedFlowsCache.cursor.line !== this.cursor.line) {
                this.namedFlowsCache = null;
            }
        }

        if (!this.namedFlowsCache) {
            this.namedFlowsCache = {};
            this.namedFlowsCache.flows = CSSUtils.extractAllNamedFlows(this.getCssStyleText());
            this.namedFlowsCache.cursor = { line: this.cursor.line, ch: this.cursor.ch };
        }

        return this.namedFlowsCache.flows;
    };

    /**
     * Check whether the exclusion is still the same as text after the cursor.
     * If not, reset it to null.
     *
     * @param {boolean} propNameOnly
     * true to indicate that we update the exclusion only if the cursor is inside property name context.
     * Otherwise, we also update exclusion for property value context.
     */
    CssPropHints.prototype.updateExclusion = function (propNameOnly) {
        var textAfterCursor;
        if (this.exclusion && this.info) {
            if (this.info.context === CSSUtils.PROP_NAME) {
                textAfterCursor = this.info.name.substr(this.info.offset);
            } else if (!propNameOnly && this.info.context === CSSUtils.PROP_VALUE) {
                textAfterCursor = this.info.value.substr(this.info.offset);
            }
            if (!CodeHintManager.hasValidExclusion(this.exclusion, textAfterCursor)) {
                this.exclusion = null;
            }
        }
    };

    /**
     * Determines whether CSS propertyname or -name hints are available in the current editor
     * context.
     *
     * @param {Editor} editor
     * A non-null editor object for the active window.
     *
     * @param {String} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {Boolean}
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non- null,
     * whether it is appropriate to do so.
     */
    CssPropHints.prototype.hasHints = function (editor, implicitChar) {
        this.editor = editor;
        var cursor = this.editor.getCursorPos();

        lastContext = null;
        this.info = CSSUtils.getInfoAtPos(editor, cursor);

        if (this.info.context !== CSSUtils.PROP_NAME && this.info.context !== CSSUtils.PROP_VALUE) {
            return false;
        }

        if (implicitChar) {
            this.updateExclusion(false);
            if (this.info.context === CSSUtils.PROP_NAME) {
                // Check if implicitChar is the first character typed before an existing property name.
                if (!this.exclusion && this.info.offset === 1 && implicitChar === this.info.name[0]) {
                    this.exclusion = this.info.name.substr(this.info.offset);
                }
            }

            return (this.primaryTriggerKeys.indexOf(implicitChar) !== -1) ||
                   (this.secondaryTriggerKeys.indexOf(implicitChar) !== -1);
        } else if (this.info.context === CSSUtils.PROP_NAME) {
            if (this.info.offset === 0) {
                this.exclusion = this.info.name;
            } else {
                this.updateExclusion(true);
            }
        }

        return true;
    };

    /**
     * Returns a sorted and formatted list of hints with the query substring
     * highlighted.
     *
     * @param {Array.<Object>} hints - the list of hints to format
     * @param {string} query - querystring used for highlighting matched
     *      portions of each hint
     * @return {Array.jQuery} sorted Array of jQuery DOM elements to insert
     */
    function formatHints(hints, query) {
        var hasColorSwatch = hints.some(function (token) {
            return token.color;
        });

        StringMatch.basicMatchSort(hints);
        return hints.map(function (token) {
            var $hintObj = $("<span>").addClass("brackets-css-hints");

            // highlight the matched portion of each hint
            if (token.stringRanges) {
                token.stringRanges.forEach(function (item) {
                    if (item.matched) {
                        $hintObj.append($("<span>")
                            .text(item.text)
                            .addClass("matched-hint"));
                    } else {
                        $hintObj.append(item.text);
                    }
                });
            } else {
                $hintObj.text(token.value);
            }

            if (hasColorSwatch) {
                $hintObj = ColorUtils.formatColorHint($hintObj, token.color);
            }

            return $hintObj;
        });
    }

    /**
     * Returns a list of availble CSS propertyname or -value hints if possible for the current
     * editor context.
     *
     * @param {Editor} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {jQuery.Deferred|{
     *              hints: Array.<string|jQueryObject>,
     *              match: string,
     *              selectInitial: boolean,
     *              handleWideResults: boolean}}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides:
     * 1. a sorted array hints that consists of strings
     * 2. a string match that is used by the manager to emphasize matching
     *    substrings when rendering the hint list
     * 3. a boolean that indicates whether the first result, if one exists,
     *    should be selected by default in the hint list window.
     * 4. handleWideResults, a boolean (or undefined) that indicates whether
     *    to allow result string to stretch width of display.
     */
    CssPropHints.prototype.getHints = function (implicitChar) {
        this.cursor = this.editor.getCursorPos();
        this.info = CSSUtils.getInfoAtPos(this.editor, this.cursor);

        var needle = this.info.name,
            valueNeedle = "",
            context = this.info.context,
            valueArray,
            type,
            namedFlows,
            result,
            selectInitial = false;

        // Clear the exclusion if the user moves the cursor with left/right arrow key.
        this.updateExclusion(true);

        if (context === CSSUtils.PROP_VALUE) {

            // Always select initial value
            selectInitial = true;

            // We need to end the session and begin a new session if the ( char is typed to
            // get arguments into the list when typing too fast
            if (implicitChar === "(") {
                return true;
            }

            // When switching from a NAME to a VALUE context, restart the session
            // to give other more specialized providers a chance to intervene.
            if (lastContext === CSSUtils.PROP_NAME) {
                return true;
            } else {
                lastContext = CSSUtils.PROP_VALUE;
            }

            if (!properties[needle]) {
                return null;
            }

            // Cursor is in an existing property value or partially typed value
            if (!this.info.isNewItem && this.info.index !== -1) {
                valueNeedle = this.info.values[this.info.index].trim();
                valueNeedle = valueNeedle.substr(0, this.info.offset);
            }

            valueArray = properties[needle].values;
            type = properties[needle].type;
            if (type === "named-flow") {
                namedFlows = this.getNamedFlows();

                if (valueNeedle.length === this.info.offset && namedFlows.indexOf(valueNeedle) !== -1) {
                    // Exclude the partially typed named flow at cursor since it
                    // is not an existing one used in other css rule.
                    namedFlows.splice(namedFlows.indexOf(valueNeedle), 1);
                }

                valueArray = valueArray.concat(namedFlows);
            } else if (type === "color") {
                valueArray = valueArray.concat(ColorUtils.COLOR_NAMES.map(function (color) {
                    return { text: color, color: color };
                }));
                valueArray.push("transparent", "currentColor");
            }

            result = $.map(valueArray, function (pvalue) {
                var result = StringMatch.stringMatch(pvalue.text || pvalue, valueNeedle, stringMatcherOptions);
                if (result) {
                    if (pvalue.color) {
                        result.color = pvalue.color;
                    }

                    return result;
                }
            });

            return {
                hints: formatHints(result, valueNeedle),
                match: null, // the CodeHintManager should not format the results
                selectInitial: selectInitial
            };
        } else if (context === CSSUtils.PROP_NAME) {

            // Select initial property if anything has been typed
            if (this.primaryTriggerKeys.indexOf(implicitChar) !== -1 || needle !== "") {
                selectInitial = true;
            }

            if (lastContext === CSSUtils.PROP_VALUE) {
                // close the session if we're coming from a property value
                // see https://github.com/adobe/brackets/issues/9496
                return null;
            }

            lastContext = CSSUtils.PROP_NAME;
            needle = needle.substr(0, this.info.offset);

            result = $.map(properties, function (pvalues, pname) {
                var result = StringMatch.stringMatch(pname, needle, stringMatcherOptions);
                if (result) {
                    return result;
                }
            });

            return {
                hints: formatHints(result, needle),
                match: null, // the CodeHintManager should not format the results
                selectInitial: selectInitial,
                handleWideResults: false
            };
        }
        return null;
    };

    /**
     * Inserts a given CSS protertyname or -value hint into the current editor context.
     *
     * @param {String} hint
     * The hint to be inserted into the editor context.
     *
     * @return {Boolean}
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    CssPropHints.prototype.insertHint = function (hint) {
        var offset = this.info.offset,
            cursor = this.editor.getCursorPos(),
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            keepHints = false,
            adjustCursor = false,
            newCursor,
            ctx;

        if (hint.jquery) {
            hint = hint.text();
        }

        if (this.info.context !== CSSUtils.PROP_NAME && this.info.context !== CSSUtils.PROP_VALUE) {
            return false;
        }

        start.line = end.line = cursor.line;
        start.ch = cursor.ch - offset;

        if (this.info.context === CSSUtils.PROP_NAME) {
            keepHints = true;
            var textAfterCursor = this.info.name.substr(this.info.offset);
            if (this.info.name.length === 0 || CodeHintManager.hasValidExclusion(this.exclusion, textAfterCursor)) {
                // It's a new insertion, so append a colon and set keepHints
                // to show property value hints.
                hint += ": ";
                end.ch = start.ch;
                end.ch += offset;

                if (this.exclusion) {
                    // Append a space to the end of hint to insert and then adjust
                    // the cursor before that space.
                    hint += " ";
                    adjustCursor = true;
                    newCursor = { line: cursor.line,
                                  ch: start.ch + hint.length - 1 };
                    this.exclusion = null;
                }
            } else {
                // It's a replacement of an existing one or just typed in property.
                // So we need to check whether there is an existing colon following
                // the current property name. If a colon already exists, then we also
                // adjust the cursor position and show code hints for property values.
                end.ch = start.ch + this.info.name.length;
                ctx = TokenUtils.getInitialContext(this.editor._codeMirror, cursor);
                if (ctx.token.string.length > 0 && !/\S/.test(ctx.token.string)) {
                    // We're at the very beginning of a property name. So skip it
                    // before we locate the colon following it.
                    TokenUtils.moveNextToken(ctx);
                }
                if (TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx) && ctx.token.string === ":") {
                    adjustCursor = true;
                    newCursor = { line: cursor.line,
                                  ch: cursor.ch + (hint.length - this.info.name.length) };
                    // Adjust cursor to the position after any whitespace that follows the colon, if there is any.
                    if (TokenUtils.moveNextToken(ctx) && ctx.token.string.length > 0 && !/\S/.test(ctx.token.string)) {
                        newCursor.ch += ctx.token.string.length;
                    }
                } else {
                    hint += ": ";
                }
            }
        } else {
            if (!this.info.isNewItem && this.info.index !== -1) {
                // Replacing an existing property value or partially typed value
                end.ch = start.ch + this.info.values[this.info.index].length;
            } else {
                // Inserting a new property value
                end.ch = start.ch;
            }

            var parenMatch = hint.match(/\(.*?\)/);
            if (parenMatch) {
                // value has (...), so place cursor inside opening paren
                // and keep hints open
                adjustCursor = true;
                newCursor = { line: cursor.line,
                              ch: start.ch + parenMatch.index + 1 };
                keepHints = true;
            }
        }

        // HACK (tracking adobe/brackets#1688): We talk to the private CodeMirror instance
        // directly to replace the range instead of using the Document, as we should. The
        // reason is due to a flaw in our current document synchronization architecture when
        // inline editors are open.
        this.editor._codeMirror.replaceRange(hint, start, end);

        if (adjustCursor) {
            this.editor.setCursorPos(newCursor);
        }

        return keepHints;
    };

    AppInit.appReady(function () {
        var cssPropHints = new CssPropHints();
        CodeHintManager.registerHintProvider(cssPropHints, ["css", "scss", "less"], 0);

        ExtensionUtils.loadStyleSheet(module, "styles/brackets-css-hints.css");

        // For unit testing
        exports.cssPropHintProvider = cssPropHints;
    });
});
