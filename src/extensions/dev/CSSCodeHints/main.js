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
                    if (item.start.line < cursor.line && item.end.line > cursor.line) {
                        /* TODO: add other cases for cursor and styleblock */
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
            }
            
            if (query.queryStr === "{") {
                query.queryStr = "";
            }
        }

        
        return query;
    }
    
    CssAttrHints.prototype.search = function(query) {
        var result = [];
        var filter = query.queryStr;
        
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
        return result;
    }    
    
    CssAttrHints.prototype.handleSelect = function (completion, editor, cursor) {
        console.log('csscodehint - handleSelect');
        return true;
    }
         
    /**
     * Check whether to show hints on a specific key.
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    CssAttrHints.prototype.shouldShowHintsOnKey = function (key) {
        return (key === "{" || key === "\t"); /* only popup after brackets, else this will always trigger */
        //return (key === " " || key === "{" );
    };
    
    
    var cssAttrHints = new CssAttrHints();
    CodeHintManager.registerHintProvider(cssAttrHints);
    
    // For unit testing
    exports.attrHintProvider = cssAttrHints;
    
});