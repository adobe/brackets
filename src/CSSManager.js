/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, require: false, CSSParser: false, Slick: false */

/**
 * CSSManager
 */
define(function (require, exports, module) {
    'use strict';
    
    require("thirdparty/JSCSSP/cssParser");
    require("thirdparty/slick/Source/Slick.Parser");
    
    var DocumentManager = require("DocumentManager");
    
    // Adapted from Slick.Finder.js to work without a DOM tree
    function matchSelector(tagInfo, tag, id, classes, attributes, pseudos) {
        if (tag) {
            var nodeName = tagInfo.tag.toLowerCase();
            if (tag === '*') {
                if (nodeName < '@') {
                    return false; // Fix for comment nodes and closed nodes
                }
            } else {
                if (nodeName !== tag) {
                    return false;
                }
            }
        }
    
        if (id && tagInfo.id !== id) {
            return false;
        }
    
        var part, cls;
        if (classes) {
            var matchingClass = classes.some(function (cls, i) {
                if ((tagInfo.clazz && cls.regexp.test(tagInfo.clazz))) {
                    return true;
                }
            });
            
            if (!matchingClass) {
                return false;
            }
        }
        /*
        if (attributes) for (i = attributes.length; i--;){
            part = attributes[i];
            if (part.operator ? !part.test(this.getAttribute(node, part.key)) : !this.hasAttribute(node, part.key)) return false;
        }
        if (pseudos) for (i = pseudos.length; i--;){
            part = pseudos[i];
            if (!this.matchPseudo(node, part.key, part.value)) return false;
        }
        */
        return true;
    }
    
    // Adapted from Slick.Finder.js
    function matchNode(selector, tagInfo) {
        // simple (single) selectors
        var expressions = selector.expressions,
            simpleExpCounter = 0,
            i;
        
        return expressions.some(function (currentExpression) {
            if (currentExpression.length === 1) {
                var exp = currentExpression[0];
                if (matchSelector(tagInfo, exp.tag, exp.id, exp.classes, exp.attributes, exp.pseudos)) {
                    return true;
                }
                simpleExpCounter++;
            }
        });
    }
    
    function CSSManager() {
        this._rules = [];
    }
    
    /**
     * 
     */
    CSSManager.prototype.getStyleRules = function () {
        return [].concat(this._rules);
    };
    
    /**
     * Read CSS rules from a file
     */
    CSSManager.prototype.loadFile = function (fileEntry) {
        var result = new $.Deferred();
        var textResult = DocumentManager.readAsText(fileEntry);
        
        // DEBUG
        var self = this;
        
        textResult.done(function (text) {
            var parser = new CSSParser(),
                sheet = parser.parse(text.toLowerCase(), false, true),
                styleRules = [],
                selector = null;
            
            // post process style rules only
            sheet.cssRules.forEach(function (value, index) {
                if (value.selectorText) {
                    // add a selector property using Slick's selector parsing
                    selector = Slick.parse(value.selectorText());
                    value.selector = selector;
                    
                    // note the file for this rule
                    value.fileEntry = fileEntry;
                    
                    styleRules.push(value);
                }
            });
            
            // collect rules from each file
            self._rules = self._rules.concat(styleRules);
        
            // resolve with rules from this file
            result.resolve(styleRules);
        });
        
        return result;
    };
    
    CSSManager.prototype.removeFile = function (fileEntry) {
    };
    
    /**
     * Reset all rules
     */
    CSSManager.prototype.clear = function () {
        this._rules = [];
    };
    
    /**
     * Finds matching CSS rules based on the tag, id and/or classes
     */
    // after sprint 4 we should make this more robust
    CSSManager.prototype.findMatchingRules = function (tagInfo) {
        function matches(element, index, array) {
            return matchNode(element.selector, tagInfo);
        }
        
        return this._rules.filter(matches);
    };
    
    exports.CSSManager = CSSManager;
});