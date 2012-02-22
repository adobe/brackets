/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, require: false, less: false */

/**
 * CSSManager
 */
define(function (require, exports, module) {
    'use strict';
    
    var DocumentManager = require("DocumentManager");
    
    /**
     * Adapter for LESS RuleSet
     */
    function RuleSetInfo(ruleset) {
        this.ruleset = ruleset;
        
        // FIXME (jasonsj): Patch LESS parser to keep whitespace and line endings
        // offsetStart = ...
        // offsetEnd = ...
    }
    
    function CSSManager() {
        this._rules = [];
        this._parser = new less.Parser();
    }
    
    /**
     * 
     */
    CSSManager.prototype.getStyleRules = function () {
        return [].concat(this._rules);
    };
    
    /**
     * Read CSS rules from a file. Asynchronous.
     */
    CSSManager.prototype.loadFile = function (fileEntry) {
        var result = new $.Deferred(),
            textResult = DocumentManager.readAsText(fileEntry),
            self = this;
                
        textResult.done(function (text) {
            var rulesets = self.loadString(text);
            
            // resolve with rules from this file
            result.resolve(rulesets);
        });
        
        return result;
    };
    
    /**
     * Read rules from a string. Synchronous.
     * Returns the rules added as a result of this call.
     */
    CSSManager.prototype.loadString = function (cssText) {
        var rulesets = [],
            self = this;
        
        // TODO (jasonsj): handle .less vs. css
        // Use the LESS parser for both .less and .css files.
        // Current support is CSS only, so we only consider leaf rulesets
        function addRuleset(ruleset) {
            var children = ruleset.rulesets();
            
            // depth-first search for leaf rulesets
            if (children.length > 0) {
                children.forEach(function (value, index) {
                    addRuleset(value);
                });
            } else {
                rulesets.push(new RuleSetInfo(ruleset));
            }
        }
        
        self._parser.parse(cssText, function (error, root) {
            // TODO: handle error
            
            addRuleset(root);
        
            self._rules = self._rules.concat(rulesets);
        });
        
        return rulesets;
    }
    
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
    CSSManager.prototype.findMatchingRules = function (selectorString) {
        return this._rules.filter(function (rulesetInfo, index, array) {
            var selectors = rulesetInfo.ruleset.selectors;
            
            // find a matching selector for the input selectorString
            return selectors.some(function (selector) {
                // TODO (jasonsj): Combinators (descendant ' ', child '>', sibling '+')
                //                 Specificity
                
                if (selector.elements.length > 0) {
                    // Use last selector element
                    var element = selector.elements[selector.elements.length - 1];
                    
                    // Always match the universal selector (sprint 4)
                    if (element.value.charAt(0) === '*') {
                        return true;
                    }
                    
                    return element.value.toLowerCase() === selectorString.toLowerCase();
                }
                
                return false;
            });
        });
    };
    
    exports.CSSManager = CSSManager;
});