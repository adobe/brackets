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
        this.secondaryTriggerKeys = "#.[:";
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
        
        if (implicitChar === null && this.info.context === CSSUtils.SELECTOR) {
            return true;
        } else {
            return (this.primaryTriggerKeys.indexOf(implicitChar) !== -1) ||
                   (this.secondaryTriggerKeys.indexOf(implicitChar) !== -1);
        }
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
            result = [];

        if (this.info.context === CSSUtils.SELECTOR) {
            if (this.info.offset >= 0) {
                if (_isSelectorStartChar(selector[0])) {
                    if (selector[0] === "[") {
                        query = selector.substr(1, this.info.offset - 1);
                        result = $.map(attributes, function (value, key) {
                            if (key.indexOf(query) === 0) {
                                return key;
                            }
                        }).sort();
                    } else if (selector[0] === ":") {
                        query = selector.substr(0, this.info.offset);
                        result = $.map(pseudoSelectors, function (value, key) {
                            if (key.indexOf(query) === 0) {
                                return key;
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
            offset = 0;

        this.info = CSSUtils.getInfoAtPos(this.editor, cursor);
        offset = this.info.offset;
        if (this.info.context !== CSSUtils.SELECTOR) {
            return false;
        }

        charCount = this.info.name.length;
        end.line = start.line = cursor.line;
        if (offset && charCount && this.info.name[0] === "[") {
            offset--;
        }
        start.ch = cursor.ch - offset;
        end.ch = start.ch + charCount;

        if (hint !== this.info.name) {
            if (start.ch !== end.ch) {
                this.editor.document.replaceRange(hint, start, end);
            } else {
                this.editor.document.replaceRange(hint, start);
            }
        }

        return false;
    };
    
    AppInit.appReady(function () {
        tags = HintsCollector.getCodeHints(HintsCollector.HTML_TAG);
        attributes = HintsCollector.getCodeHints(HintsCollector.HTML_ATTRIBUTE);
        pseudoSelectors = HintsCollector.getCodeHints(HintsCollector.PSEUDO_SELECTOR);
    
        var cssSelectorHints = new CssSelectorHints();
        CodeHintManager.registerHintProvider(cssSelectorHints, ["css"], 10);
    
        // For unit testing
        exports.cssSelectorHintProvider = cssSelectorHints;
    });
    
});