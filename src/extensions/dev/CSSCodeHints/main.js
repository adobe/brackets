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
        this.alphabet = "abcdefghijklmnopqrstuvwxyz";
        
        this.cssMode = "";
    }
    
    CssAttrHints.prototype.hasHints = function (editor, cursor) {
        var query       = {queryStr: null},
            pos         = $.extend({}, cursor),
            ctx         = TokenUtils.getInitialContext(editor._codeMirror, pos),
            styleblocks = HTMLUtils.findStyleBlocks(editor),
            selector    = CSSUtils.findSelectorAtDocumentPos(editor, cursor),
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
        if (csscontext && selector !== "") {
            console.log(CSSUtils.getInfoAtPos(editor, cursor));
            query.queryStr = ctx.token.string;
            if (query.queryStr !== null) {
                query.queryStr = query.queryStr.trim();
                //if (query.queryStr === "") {
                    //TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
                    //query.queryStr = ctx.token.string;
                //}
                
                if (TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx)) {
                    query.prevStr = ctx.token.string;
                }
            }
            
            /* notes: we need some contextinformation around cursor, 2-3 tokens to determine if we need to show attrs or values */
            this.cssMode = "attr";
            if (query.queryStr === "{" || query.queryStr === ";") {
                /* cssattribute context */
                query.queryStr = "";
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
/*
        TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx);
        console.log(ctx.token.string);
        TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
*/      
        if (ctx.token !== null) {            
            if (this.cssMode === "value") {
                closure = ";";
            } else if (this.cssMode === "attr") {
                closure = ": ";
            }
            
            if (len == completion.length) {
                closure = "";
            }
            
            /* if token is special char, 'len' will be wrong, since a wrong token is used, set token directly to be the empty string */
            if (ctx.token.string === "{" || ctx.token.string === ":" || ctx.token.string === ";") {
                ctx.token.string = "";
            }
            
            var len  = ctx.token.string.trim().length;
            completion = completion.substr(len) + closure;
        }
        
        editor.document.replaceRange(completion, cursor);
        if (this.cssMode === "attr") {
            this.cssMode = "";
            return false;
        }

        this.cssMode = "";
        return true;
    };

    /**
     * Check whether to select the first item in the list by default
     * @return {boolean} return true to highlight the first item.
     */
    CssAttrHints.prototype.wantInitialSelection = function () {
        return true;
    };    
    
    /**
     * Check whether to show hints on a specific key.
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    CssAttrHints.prototype.shouldShowHintsOnKey = function (key) {
        return (this.alphabet.indexOf(key) !== -1);
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
    // CodeHintManager.registerHintProvider(cssAttrHints);
    CodeHintManager.registerHintProvider(cssAttrHints, ["css"], 0);
    
    // For unit testing
    exports.attrHintProvider = cssAttrHints;
    
});