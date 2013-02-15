/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        HintsCollector      = brackets.getModule("codehint/HintsCollector"),
        tags,
        attributes,
        pseudoSelectors;

    /**
     * @constructor
     */
    function CssSelectorHints() {
        this.primaryTriggerKeys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-";
        this.secondaryTriggerKeys = "#.[:='\"";
    }

    /**
     * Determines whether CSS selector hints are available in the current editor
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
     * the given editor context and, in case implicitChar is non-null,
     * whether it is appropriate to do so.
     */
    CssSelectorHints.prototype.hasHints = function (editor, implicitChar) {
        var cursor = editor.getCursorPos();

        this.editor = editor;
        this.info = CSSUtils.getInfoAtPos(editor, cursor);
        
        if (this.info.context !== CSSUtils.SELECTOR) {
            return false;
        }
        
        if (implicitChar) {
            return (this.primaryTriggerKeys.indexOf(implicitChar) !== -1) ||
                   (this.secondaryTriggerKeys.indexOf(implicitChar) !== -1);
        }
        
        return true;
    };

    /**
     * @private
     * Checks if the given character is one of the characters used for attribute selectors or
     *     pseudo selectors or class selectors or ID selectors.
     * @param {string} a single character string
     * @return {boolean} true if the given characters is one of the start characters used for 
     *     CSS selectors.
     */
    function _isSelectorStartChar(c) {
        return (c === "[" || c === ":" || c === "." || c === "#");
    }
    
    /**
     * Returns a list of availble CSS selector hints if possible for the current
     * editor context. 
     * 
     * @param {Editor} implicitChar 
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {Object<hints: Array<(String + jQuery.Obj)>, match: String, 
     *      selectInitial: Boolean>}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides 
     * 1. a sorted array hints that consists of strings
     * 2. a string match that is used by the manager to emphasize matching 
     *    substrings when rendering the hint list 
     * 3. a boolean that indicates whether the first result, if one exists, should be 
     *    selected by default in the hint list window.
     */
    CssSelectorHints.prototype.getHints = function (implicitChar) {
        this.info = CSSUtils.getInfoAtPos(this.editor, this.editor.getCursorPos());

        var selector = this.info.name,
            query,
            result = [],
            attrName,
            attrInfo,
            equalIndex,
            quoteIndex,
            quote = "'";

        if (this.info.context === CSSUtils.SELECTOR) {
            if (this.info.offset >= 0) {
                if (_isSelectorStartChar(selector[0])) {
                    if (selector[0] === "[") {
                        equalIndex = selector.indexOf("=");
                        if (equalIndex === -1) {
                            query = selector.slice(1, this.info.offset);
                            result = $.map(attributes, function (value, key) {
                                // Exclude those that have tagName/attrName as their key.
                                if (key.indexOf(query) === 0 && key.indexOf("/") === -1) {
                                    return key;
                                }
                            }).sort();
                        } else if (this.info.offset > equalIndex) {
                            // The cursor is after the equal sign. So get hints for attribute values.
                            quoteIndex = selector.indexOf("'", equalIndex);
                            if (quoteIndex === -1) {
                                quoteIndex = selector.indexOf("\"", equalIndex);
                                quote = (quoteIndex === -1) ? null : "\"";
                            }
                            if (quote) {
                                query = selector.slice(quoteIndex + 1, this.info.offset);
                                query = query.trim();
                                if (query.length && query[query.length - 1] === quote) {
                                    // If the cursor is after the closing quote, return null.
                                    // Otherwise, remove the closing quote from query string.
                                    if (this.info.offset === this.info.name.length) {
                                        return null;
                                    } else {
                                        query = query.slice(0, query.length - 1);
                                    }
                                }
                            } else {
                                query = selector.slice(equalIndex + 1, this.info.offset);
                            }
                            attrName = selector.slice(1, equalIndex);
                            attrName = attrName.replace(/[~|\|]/, "");
                            attrInfo = attributes[attrName];
                            if (attrInfo) {
                                if (attrInfo.type === "boolean") {
                                    result = ["false", "true"];
                                } else if (attrInfo.attribOption) {
                                    result = attrInfo.attribOption;
                                    if (result instanceof Array && result.length) {
                                        result = $.map(result, function (item) {
                                            if (item.indexOf(query) === 0) {
                                                return item;
                                            }
                                        }).sort();
                                    }
                                }
                            }
                        }
                    } else if (selector[0] === ":") {
                        query = selector.slice(0, this.info.offset);
                        result = $.map(pseudoSelectors, function (item) {
                            if (item.indexOf(query) === 0) {
                                return item;
                            }
                        }).sort();
                    }
                } else {
                    query = selector.slice(0, this.info.offset);
                    result = $.map(tags, function (value, key) {
                        if (key.indexOf(query) === 0) {
                            return key;
                        }
                    }).sort();
                }
            }
            
            return {
                hints: result,
                match: query,
                selectInitial: true
            };
        }
        
        return null;
    };
    
    /**
     * Inserts a given CSS selector hint into the current editor context. 
     * 
     * @param {String} hint 
     * The hint to be inserted into the editor context.
     * 
     * @return {Boolean} 
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    CssSelectorHints.prototype.insertHint = function (hint) {
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            cursor = this.editor.getCursorPos(),
            charCount = 0,
            offset = 0,
            selector,
            quoteIndex,
            equalIndex,
            bracketIndex,
            quote = "'";

        this.info = CSSUtils.getInfoAtPos(this.editor, cursor);
        offset = this.info.offset;
        selector = this.info.name;
        if (this.info.context !== CSSUtils.SELECTOR) {
            return false;
        }

        charCount = selector.length;
        end.line = start.line = cursor.line;
        if (offset && charCount && this.info.name[0] === "[") {
            equalIndex = selector.indexOf("=");
            if (equalIndex === -1) {
                // We're handling attribute name.
                // Adjust offset and charCount to exclude the leading '['.
                offset--;
                charCount--;
            } else {
                // We're handling attribute value here. 
                // Check whether it has quote and whether it is single or double.
                quoteIndex = selector.indexOf("'", equalIndex);
                if (quoteIndex === -1) {
                    quoteIndex = selector.indexOf("\"", equalIndex);
                    quote = (quoteIndex === -1) ? null : "\"";
                }
                if (quote) {
                    if (offset >= (quoteIndex + 1)) {
                        offset -= (quoteIndex + 1);
                        charCount -= (quoteIndex + 1);
                    } else {
                        offset = 0;
                        charCount = (charCount > offset) ? (charCount - offset) : 0;
                    }
                    // If we have the closing quote, then subtract one to avoid overwriting it.
                    if (charCount && quoteIndex !== (selector.length - 1) && selector[selector.length - 1] === quote) {
                        charCount--;
                    } else {
                        if (charCount) {
                            // We're inside an unclosed string. So make sure we don't replace the string past the closing bracket.
                            bracketIndex = selector.indexOf("]", selector.length - charCount);
                            if (bracketIndex !== -1) {
                                charCount = bracketIndex - (quoteIndex + 1);
                            }
                        }
                        // Auto append the closing quote.
                        hint += quote;
                    }
                } else {
                    offset -= (equalIndex + 1);
                    charCount -= (equalIndex + 1);
                }
            }
        }
        start.ch = cursor.ch - offset;
        end.ch = start.ch + charCount;

        if (hint !== this.info.name) {
            if (start.ch !== end.ch) {
                this.editor._codeMirror.replaceRange(hint, start, end);
            } else {
                this.editor._codeMirror.replaceRange(hint, start);
            }
            if (hint[0] === ":" && hint[hint.length - 1] === ")") {
                this.editor.setCursorPos(start.line, start.ch + hint.length - 1);
            }
        }

        return false;
    };
    
    AppInit.appReady(function () {
        tags = HintsCollector.getCodeHints(HintsCollector.HTML_TAG);
        attributes = HintsCollector.getCodeHints(HintsCollector.HTML_ATTRIBUTE);
        pseudoSelectors = HintsCollector.getCodeHints(HintsCollector.PSEUDO_SELECTOR);
    
        var cssSelectorHints = new CssSelectorHints();
        CodeHintManager.registerHintProvider(cssSelectorHints, ["css", "less"], 10);
    
        // For unit testing
        exports.cssSelectorHintProvider = cssSelectorHints;
    });
});