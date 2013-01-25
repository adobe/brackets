/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    var CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        CSSProperties       = require("text!CSSProperties.json"),
        properties          = JSON.parse(CSSProperties);
    
    /**
     * @constructor
     */
    function CssPropHints() {
        this.primaryTriggerKeys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-()";
        this.secondaryTriggerKeys = " :;\t\n\r";
    }

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

        this.info = CSSUtils.getInfoAtPos(editor, cursor);
        
        if (implicitChar === null) {
            if (this.info.context === CSSUtils.PROP_NAME || this.info.context === CSSUtils.PROP_VALUE) {
                return true;
            }
        } else {
            return (this.primaryTriggerKeys.indexOf(implicitChar) !== -1) ||
                   (this.secondaryTriggerKeys.indexOf(implicitChar) !== -1);
        }
        
        return false;
    };
       
    /**
     * Returns a list of availble CSS protertyname or -value hints if possible for the current
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
    CssPropHints.prototype.getHints = function (implicitChar) {
        this.info = CSSUtils.getInfoAtPos(this.editor, this.editor.getCursorPos());

        var needle = this.info.name,
            valueNeedle = "",
            context = this.info.context,
            result,
            selectInitial = false;
            
        
        if (this.primaryTriggerKeys.indexOf(implicitChar) !== -1) {
            selectInitial = true;
        }
        
        if (context === CSSUtils.PROP_VALUE) {
            if (!properties[needle]) {
                return null;
            } else {
                
                if (this.info.values.length > 0) {
                    valueNeedle = this.info.values[this.info.values.length - 1].trim();
                }
                
                result = $.map(properties[needle].values, function (pvalue, pindex) {
                    if (pvalue.indexOf(valueNeedle) === 0) {
                        return pvalue;
                    }
                }).sort();
                
                return {
                    hints: result,
                    match: valueNeedle,
                    selectInitial: selectInitial
                };
            }
        } else if (context === CSSUtils.PROP_NAME) {
            result = $.map(properties, function (pvalues, pname) {
                if (pname.indexOf(needle) === 0) {
                    return pname;
                }
            }).sort();
            
            return {
                hints: result,
                match: needle,
                selectInitial: selectInitial
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
            closure = "",
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            keepHints = true;
        
        if (this.info.context === CSSUtils.PROP_NAME) {
            closure = ":";
        } else if (this.info.context !== CSSUtils.PROP_VALUE) {
            return false;
        }
        
        hint = hint + closure;
        
        start.line = end.line = cursor.line;
        start.ch = cursor.ch - offset;
        end.ch = start.ch + hint.length;
        
        this.editor.document.replaceRange(hint, start, end);
        
        return keepHints;
    };
    
    var cssPropHints = new CssPropHints();
    CodeHintManager.registerHintProvider(cssPropHints, ["css"], 0);
    
    // For unit testing
    exports.cssPropHintProvider = cssPropHints;
    
});