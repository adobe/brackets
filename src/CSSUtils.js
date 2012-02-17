/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

/**
 * Set of utilities for simple parsing of CSS text.
 */
define(function (require, exports, module) {
    'use strict';
    
    /**
     * Find the first instance of the specified selector in the text.
     * Returns an Object with "start" and "end" properties specifying the character offsets for
     * the selector, or null if no match was found.
     * @param text {!String} CSS text to search
     * @param selector {!String} selector to search for
     * @return {Object} Object with start and end properties specifying the offset of the start
     *  and end of the selector. Returns null if the selector is not found.
     */
    function findSelector(text, selector) {
        var re = new RegExp(".*[\\s|,|\\.]" + selector + "\\s*[,\\{][^\\}]*\\}", "i");
        var startPos = text.search(re);
        
        if (startPos !== -1) {
            var endPos = startPos + re.exec(text)[0].length;
            
            return { start: startPos, end: endPos };
        }
        
        return null;
    }
    
    /**
     * Finds all instances of the specified selector in "text".
     * Returns an Array of Objects with start and end properties.
     * @param text {!String} CSS text to search
     * @param selector {!String} selector to search for
     * @return {Array.<Object>} Array of objects containing the start and end offsets for
     *  each matched selector.
     */
    function findAllMatchingSelectors(text, selector) {
        var result = [];
        var offset = 0;
        var localText = text.substr(offset);
        var selectorPos;
            
        while ((selectorPos = findSelector(localText, selector)) !== null) {
            selectorPos.start += offset;
            selectorPos.end += offset;
            result.push(selectorPos);
            offset += selectorPos.end;
            localText = localText.substr(selectorPos.end);
        }
        
        return result;
    }
    
    exports.findSelector = findSelector;
    exports.findAllMatchingSelectors = findAllMatchingSelectors;
});
