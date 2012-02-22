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
    
    // Dependencies
    var DocumentManager = require("DocumentManager");
    
    /**
     * Regex to match selector element values for ID '#', pseudo ':',
     * class name '.', attribute start '[' or digit.
     */
    var IDENTIFIER_REGEX = /^[#:\.\[\d]/;
    
    /**
     * Adapter for LESS RuleSet
     */
    function RuleSetInfo(ruleset) {
        this.ruleset = ruleset;
        
        // FIXME (jasonsj): Patch LESS parser to keep whitespace and line endings
        // offsetStart = ...
        // offsetEnd = ...
        this.lineStart = 0;
        this.lineEnd = 0;
    }
    
    // TODO (jasonsj): handle .less vs. css
    // Use the LESS parser for both .less and .css files.
    // Current support is CSS only, so we only consider leaf rulesets
    function _addRuleset(results, ruleset) {
        var children = ruleset.rulesets();
        
        // depth-first search for leaf rulesets
        if (children.length > 0) {
            children.forEach(function (value, index) {
                _addRuleset(results, value);
            });
        } else {
            results.push(new RuleSetInfo(ruleset));
        }
    }
    
    /**
     * CSSManager loads CSS content from files (or strings) and parses
     * the content into an abstract syntax tree using the LESS Parser.
     * This manager maintains parsed CSS rules in-memory to provide 
     * fast lookups of rules based on selector criteria.
     */
    function CSSManager() {
        this._rules = [];
        this._parser = new less.Parser();
    }
    
    /**
     * Returns all style rules loaded for this CSSManager instance.
     *
     * @return {Array.<ResultSetInfo>}
     */
    CSSManager.prototype.getStyleRules = function () {
        return [].concat(this._rules);
    };
    
    /**
     * Parse CSS rules from a string
     * @param {!string} str
     */
    CSSManager.prototype._loadString = function (str) {
        var rulesets = [],
            self = this;
        
        this._parser.parse(str, function (error, root) {
            _addRuleset(rulesets, root);
            self._rules = self._rules.concat(rulesets);
        });
        
        return rulesets;
    };
    
    /**
     * Parse CSS rules from a file and cache the results.
     * @param {!FileEntry} fileEntry
     */
    CSSManager.prototype.loadFile = function (fileEntry) {
        var result = new $.Deferred(),
            textResult = DocumentManager.readAsText(fileEntry),
            self = this,
            rulesets = [];
        
        textResult.done(function (text) {
            self._parser.parse(text, function (error, root) {
                _addRuleset(rulesets, root);
            
                // resolve with rules from this file
                result.resolve(rulesets);
                
                self._rules = self._rules.concat(rulesets);
            });
        });
        
        return result;
    };
    
    /**
     * Remove a file from cache
     */
    CSSManager.prototype.removeFile = function (fileEntry) {
        // TODO (jasonsj): integrate with FileIndexManager
    };
    
    /**
     * Clear all rules from cache.
     */
    CSSManager.prototype.clearCache = function () {
        this._rules = [];
    };
    
    /**
     * Finds matching CSS rules based on the tag, id and/or classes
     * @param {!string} selectorString
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
                    var isTypeSelector = function (str) {
                        return (str.search(IDENTIFIER_REGEX) !== 0);
                    };
                    
                    // find the right-most type selector if the input string is a type
                    var element             = null,
                        elementIndex        = selector.elements.length - 1;
                    
                    if (isTypeSelector(selectorString)) {
                        while (elementIndex >= 0) {
                            element = selector.elements[elementIndex];
                            
                            if (isTypeSelector(element.value)) {
                                break;
                            }
                            
                            elementIndex--;
                        }
                    } else {
                        // Use last selector element
                        element = selector.elements[elementIndex];
                    }
                    
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