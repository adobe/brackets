/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    var CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        TokenUtils          = brackets.getModule("utils/TokenUtils"),
        CSSAttributes       = require("text!CSSAttributes.json"),
        attributes          = JSON.parse(CSSAttributes);

    
    function CssAttrHints() {
        this.triggerkeys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ- ";
    }
    
    CssAttrHints.prototype.hasHints = function (editor, implicitChar) {
        this.editor = editor;
        var cursor = this.editor.getCursorPos();

        this.info = CSSUtils.getInfoAtPos(editor, cursor);
        // console.log(this.info);
        
        if (implicitChar === null) {
            if (this.info.context === CSSUtils.PROP_NAME || this.info.context === CSSUtils.PROP_VALUE) {
                return true;
            }
        } else {
            return (this.triggerkeys.indexOf(implicitChar) !== -1);
        }
        
        return false;
    };
    
    CssAttrHints.prototype.getHints = function (implicitChar) {
        this.info = CSSUtils.getInfoAtPos(this.editor, this.editor.getCursorPos());

        var needle = this.info.name,
            valueNeedle = "",
            context = this.info.context,
            result,
            selectInitial = true;
            
        
        if (implicitChar === " ") {
            selectInitial = false;
        }
        
        var list = null;
        if (context === CSSUtils.PROP_VALUE) {
            if (!attributes[needle]) {
                return null;
            } else {
                
                if (this.info.values.length > 0) {
                    valueNeedle = this.info.values[this.info.values.length - 1].trim();
                }
                
                result = $.map(attributes[needle].values, function (pvalue, pindex) {
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
            result = $.map(attributes, function (pvalues, pname) {
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
    
    CssAttrHints.prototype.insertHint = function (hint) {
        var offset = this.info.offset,
            cursor = this.editor.getCursorPos(),
            closure = "",
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            keepHints = false;
        
        if (this.info.context === CSSUtils.PROP_NAME) {
            closure = ": ";
            keepHints = true;
        } else if (this.info.context === CSSUtils.PROP_VALUE) {
            closure = ";";
        }
        
        hint = hint + closure;
        
        start.line = end.line = cursor.line;
        start.ch = cursor.ch - offset;
        end.ch = start.ch + hint.length;
        
        this.editor.document.replaceRange(hint, start, end);
        
        return keepHints;
    };
    
    var cssAttrHints = new CssAttrHints();
    // CodeHintManager.registerHintProvider(cssAttrHints);
    CodeHintManager.registerHintProvider(cssAttrHints, ["css"], 0);
    
    // For unit testing
    exports.attrHintProvider = cssAttrHints;
    
});