/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    var CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        TokenUtils          = brackets.getModule("utils/TokenUtils"),
        CSSAttributes       = require("text!CSSAttributes.json"),
        attributes          = JSON.parse(CSSAttributes);

    
    function CssAttrHints() {
        this.cssMode = "";
    }
    
    CssAttrHints.prototype.getQueryInfo = function (editor, cursor) {
        var query       = {queryStr: null},
            pos         = $.extend({}, cursor),
            ctx         = TokenUtils.getInitialContext(editor._codeMirror, pos),
            styleblocks = HTMLUtils.findStyleBlocks(editor),
            csscontext  = false;
          
        /* first: check overall context - is this a css-valid context */
        if (editor.getModeForSelection() === "css") {
            // we know we are dealing with a .css file or the cursor is inside a <style/> tag, but we don't know if we are actually
            // inside a set of rules { } or between two or in a selector
            // we only need to check if we hit a { and return true, or } and return false, if we hit a ; it's okay, but not sufficent
            do {
                if (ctx.token.string === "{") {
                    /* first relevant symbol, everything fine */
                    csscontext = true;
                    ctx = TokenUtils.getInitialContext(editor._codeMirror, cursor);
                    break;
                } else if (ctx.token.string === "}") {
                    /* cursor is outside of set of rules */
                    csscontext = false;
                    break;
                }
            } while (TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx));
        }
        
        
        /* third: determine queryStr based on characters around cursor if actually in csscontext */
        if (csscontext) {
            query.queryStr = ctx.token.string;
            if (query.queryStr !== null) {
                query.queryStr = query.queryStr.trim();
                if (query.queryStr === "") {
                    TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
                    query.queryStr = ctx.token.string;
                }
                
                if (TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx)) {
                    query.prevStr = ctx.token.string;
                }
            }
            /* notes: we need some contextinformation around cursor, 2-3 tokens to determine if we need to show attrs or values */
            
            if (query.queryStr === "{" || query.queryStr === ";") {
                /* cssattribute context */
                query.queryStr = "";
                this.cssMode = "attr";
            } else if (query.queryStr === ":") {
                /* cssattrvalue context */
                /* move token 1 step back to get attibutename */
                query.queryStr = "";
                query.attrName = query.prevStr;
                this.cssMode = "value";

            } else if (query.prevStr === ":") {
                TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
                query.attrName = ctx.token.string;
                this.cssMode = "value";
            }
        }
        return query;
    };
    
    CssAttrHints.prototype.search = function (query) {
        var result = [],
            filter = query.queryStr,
            attrName = query.attrName;
        
        if (attrName) {
            if (!attributes[attrName]) {
                return result;
            }
            result = $.map(attributes[attrName].values, function (value, index) {
                if (value.indexOf(filter) === 0) {
                    return value;
                }
            });
        } else {
            if (filter === "") {
                result = $.map(attributes, function (obj, name) {
                    return name;
                });
            } else {
                result = $.map(attributes, function (obj, name) {
                    if (name.indexOf(filter) === 0) {
                        return name;
                    }
                });
            }
        }
        return result;
    };
    
    CssAttrHints.prototype.handleSelect = function (completion, editor, cursor) {
        var ctx  = TokenUtils.getInitialContext(editor._codeMirror, cursor),
            closure = "";
        
        if (ctx.token !== null) {
            if (this.cssMode === "value") {
                closure = ";";
            } else if (this.cssMode === "attr") {
                closure = ": ";
            }
            
            /* if token is special char, 'len' will be wrong, since a wrong token is used, set token directly to be the empty string */
            if (ctx.token.string === "{" || ctx.token.string === ":" || ctx.token.string === ";") {
                ctx.token.string = "";
            }
            
            var len  = ctx.token.string.trim().length;
            completion = completion.substr(len) + closure;
        }
        editor.document.replaceRange(completion, cursor);
        this.cssMode = "";

        return true;
    };
         
    /**
     * Check whether to show hints on a specific key.
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    CssAttrHints.prototype.shouldShowHintsOnKey = function (key) {
        var alphabet = "abcdefghijklmnopqrstuvwxyz";
        return (alphabet.indexOf(key) !== -1);
        // return (key === "{" || key === ";"); /* only popup after brackets, else this will always trigger */
        // return (key === " " || key === "{" );
    };
    
    
                
    CssAttrHints.prototype._cursorInRange = function (cursor, start, end) {
        var afterStart = false,
            beforeEnd  = false;
        
        if (start.line < cursor.line || (start.line <= cursor.line && start.ch <= cursor.ch)) {
            afterStart = true;
        }
        if (end.line > cursor.line || (end.line >= cursor.line && end.ch >= cursor.ch)) {
            beforeEnd = true;
        }
        
        return (afterStart && beforeEnd);
    };
                
                
                
    var cssAttrHints = new CssAttrHints();
    CodeHintManager.registerHintProvider(cssAttrHints);
    
    // For unit testing
    exports.attrHintProvider = cssAttrHints;
    
});