/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        TokenUtils          = brackets.getModule("utils/TokenUtils"),
        CSSProperties       = require("text!CSSProperties.json"),
        properties          = JSON.parse(CSSProperties);
    
    /**
     * @constructor
     */
    function CssPropHints() {
        this.primaryTriggerKeys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-()";
        this.secondaryTriggerKeys = ":";
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
        
        if (this.info.context !== CSSUtils.PROP_NAME && this.info.context !== CSSUtils.PROP_VALUE) {
            return false;
        }
        
        if (implicitChar) {
            return (this.primaryTriggerKeys.indexOf(implicitChar) !== -1) ||
                   (this.secondaryTriggerKeys.indexOf(implicitChar) !== -1);
        }
        
        return true;
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
            }
            
            // Cursor is in an existing property value or partially typed value
            if (!this.info.isNewItem && this.info.index !== -1) {
                valueNeedle = this.info.values[this.info.index].trim();
                valueNeedle = valueNeedle.substr(0, this.info.offset);
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
        } else if (context === CSSUtils.PROP_NAME) {
            needle = needle.substr(0, this.info.offset);
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
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            keepHints = false,
            adjustCursor = false,
            newCursor,
            ctx;
        
        if (this.info.context !== CSSUtils.PROP_NAME && this.info.context !== CSSUtils.PROP_VALUE) {
            return false;
        }
        
        start.line = end.line = cursor.line;
        start.ch = cursor.ch - offset;

        if (this.info.context === CSSUtils.PROP_NAME) {
            keepHints = true;
            if (this.info.name.length === 0) {
                // It's a new insertion, so append a colon and set keepHints
                // to show property value hints.
                hint += ":";
                end.ch = start.ch;
            } else {
                // It's a replacement of an existing one or just typed in property.
                // So we need to check whether there is an existing colon following 
                // the current property name. If a colon already exists, then we also 
                // adjust the cursor position and show code hints for property values.
                end.ch = start.ch + this.info.name.length;
                ctx = TokenUtils.getInitialContext(this.editor._codeMirror, cursor);
                if (ctx.token.string.length > 0 && !ctx.token.string.match(/\S/)) {
                    // We're at the very beginning of a property name. So skip it 
                    // before we locate the colon following it.
                    TokenUtils.moveNextToken(ctx);
                }
                if (TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx) && ctx.token.string === ":") {
                    adjustCursor = true;
                    newCursor = { line: cursor.line,
                                  ch: cursor.ch + (hint.length - this.info.name.length) };
                } else {
                    hint += ":";
                }
            }
        } else if (!this.info.isNewItem && this.info.index !== -1) {
            // Replacing an existing property value or partially typed value
            end.ch = start.ch + this.info.values[this.info.index].length;
        } else {
            // Inserting a new property value
            end.ch = start.ch;
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
        CodeHintManager.registerHintProvider(cssPropHints, ["css"], 0);
        
        // For unit testing
        exports.cssPropHintProvider = cssPropHints;
    });
});