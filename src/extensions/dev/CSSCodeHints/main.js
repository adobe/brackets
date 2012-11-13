/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    var CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),        
        CSSAttributes       = require("text!CSSAttributes.json"),
        attributes          = JSON.parse(CSSAttributes);

    
    function AttrHints() {}
    
    
    AttrHints.prototype.getQueryInfo = function (editor, cursor) {
        console.log('csscodehint - getQueryInfo');
        var query = {queryStr: null};
        
        /* notes:
            return query only if a) inside style.tag in regular .html file // b) inside .css file inside { }
        */
        
        
        return query;
    }
    
    AttrHints.prototype.search = function(query) {
        console.log('csscodehint - search');
        var result = [];
        
        return result;
    }    
    
    AttrHints.prototype.handleSelect = function (completion, editor, cursor) {
        console.log('csscodehint - handleSelect');
        return true;
    }
         
    /**
     * Check whether to show hints on a specific key.
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    AttrHints.prototype.shouldShowHintsOnKey = function (key) {
        return (key === "{"); /* only popup after brackets, else this will always trigger */
        return (key === " " || key === "{" );
    };
    
    
    var attrHints = new AttrHints();
    CodeHintManager.registerHintProvider(attrHints);
    
    // For unit testing
    exports.attrHintProvider = attrHints;
    
});