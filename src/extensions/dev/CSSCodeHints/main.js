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

    
    function CssAttrHints() {}
    
    CssAttrHints.prototype.getQueryInfo = function (editor, cursor) {
        var query       = {queryStr: null},
            ctx         = TokenUtils.getInitialContext(editor._codeMirror, cursor),
            styleblocks = HTMLUtils.findStyleBlocks(editor),
            csscontext  = false;
          
        /* first: check overall context - is this a css-valid context */
        if(editor.getModeForDocument() === "css") {
            csscontext = true;
        } else {
            
            /* check whether the cursor is inside any <style> block in the document */
            if (styleblocks.length > 0) {
                var insideStyleBlock = false,
                    item = null;
                // styleblocks.forEach(function(index, item) {
                for(var i=0; i < styleblocks.length; i++) {
                    item = styleblocks[i];
                    if (this._cursorInRange(cursor, item.start, item.end)) {
                        csscontext = true;
                        break;
                    }
                }
                
                /*
                if (insideStyleBlock) {
                    query.queryStr = ctx.token.string;
                }
                */
            }      
        }
        
        /* second: determine queryStr based on characters around cursor if actually in csscontext */
        if (csscontext) {
            query.queryStr = ctx.token.string;
            if (query.queryStr !== null) {
                query.queryStr = query.queryStr.trim();
                if(query.queryStr === "") {
                    TokenUtils.movePrevToken(ctx);
                    query.queryStr = ctx.token.string;
                }
                
                if (TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx)) {
                    query.prevStr = ctx.token.string;
                }
            } 
            /* notes: we need some contextinformation around cursor, 2-3 tokens to determine if we need to show attrs or values */
            console.log("cssdebug: pS='"+query.prevStr+"' followed by qS='"+query.queryStr+"'");
            
            
            if (query.queryStr === "{" || query.queryStr === ";") {
                /* cssattribute context */
                query.queryStr = "";
            } else if (query.queryStr === ":") {
                /* cssattrvalue context */
                /* move token 1 step back to get attibutename */
                query.queryStr = "";
                query.attrName = query.prevStr;
            } else if (query.prevStr === ":") {
                TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx);
                query.attrName = ctx.token.string;
            }
        }
        console.log(query);
        
        return query;
    }
    
    CssAttrHints.prototype.search = function(query) {
        var result = [],
            filter = query.queryStr,
            attrName = query.attrName;
        
        if(attrName) {
            result = $.map(attributes[attrName].values, function(value, index) {
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
                result = $.map(attributes, function(obj, name) {
                    if (name.indexOf(filter) === 0) {
                        return name;
                    }
                });
            }
        }
        return result;
    }    
    
    CssAttrHints.prototype.handleSelect = function (completion, editor, cursor) {
/*
        var ctx  = TokenUtils.getInitialContext(editor._codeMirror, cursor);
        
        if (ctx.token !== null) {
            var len  = ctx.token.end - ctx.token.start;
            completion = completion.substr(len) + ": ";
        }
        
        editor.document.replaceRange(completion, cursor);
*/
        return true;

    }
         
    /**
     * Check whether to show hints on a specific key.
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    CssAttrHints.prototype.shouldShowHintsOnKey = function (key) {
        return (key === "{" || key === ";"); /* only popup after brackets, else this will always trigger */
        // return (key === " " || key === "{" );
    };
    
    
                
    CssAttrHints.prototype._cursorInRange = function (cursor, start, end) {
        var afterStart = false,
            beforeEnd  = false;
        
        if( start.line < cursor.line || start.line <= cursor.line && start.ch <= cursor.ch) {
            afterStart = true;
        }
        if( end.line > cursor.line || end.line >= cursor.line && end.ch >= cursor.ch) {
            beforeEnd = true;
        }
        
        return (afterStart && beforeEnd);
    }
                
                
                
    var cssAttrHints = new CssAttrHints();
    CodeHintManager.registerHintProvider(cssAttrHints);
    
    // For unit testing
    exports.attrHintProvider = cssAttrHints;
    
});