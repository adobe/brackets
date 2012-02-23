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
    function RuleSetInfo(ruleset, source) {
        this.ruleset = ruleset;
        this.source = source;
        
        // FIXME (jasonsj): Patch LESS parser to track whitespace, maintain CRLF
        //this.offsetStart = ...
        //this.offsetEnd = ...
        //this.lineStart = ...; 
        //this.lineEnd = ...;
    }
    
    // Use the LESS parser for both .less and .css files.
    // Current support is CSS only, so we only consider leaf rulesets
    function _addRuleset(results, ruleset, source) {
        var children = ruleset.rulesets();
        
        // depth-first search for leaf rulesets
        if (children.length > 0) {
            children.forEach(function (value, index) {
                _addRuleset(results, value, source);
            });
        } else {
            results.push(new RuleSetInfo(ruleset, source));
        }
    }
    
    /**
     * CSSManager loads CSS content from files (or strings) and parses
     * the content into an abstract syntax tree using the LESS Parser.
     * This manager maintains parsed CSS rules in-memory to provide 
     * fast lookups of rules based on selector criteria.
     */
    function CSSManager() {
        this._rules = {};
        this._parser = new less.Parser();
    }
    
    /**
     * Returns all style rules loaded for this CSSManager instance.
     *
     * @return {Array.<ResultSetInfo>}
     */
    CSSManager.prototype.getStyleRules = function () {
        var allRules = [];
        
        $.each(this._rules, function (index, value) {
            Array.prototype.push.apply(allRules, value);
        });
        
        return allRules;
    };
    
    /**
     * Recursively parse CSS rules from a string. Map the cached results 
     * based on the FileEntry fullPath.
     *
     * @param rulesets {Array.<ResultSetInfo>} Result storage
     * @param text {string} CSS text to parse
     * @param source {?FileEntry} Optional. FileEntry source of CSS text.
     */
    CSSManager.prototype._parse = function (rulesets, text, source) {
        var self = this;
        
        this._parser.parse(text, function (error, root) {
            if (error) {
                throw error;
            }
            
            _addRuleset(rulesets, root, source);
            
            if (source && source.fullPath) {
                // map file path to rules
                self._rules[source.fullPath] = rulesets;
            } else {
                self._rules["<from string>"] = rulesets;
            }
        });
    };
    
    /**
     * Parse CSS rules from a string - for testing only. Parsed rules are returned
     * AND added to this CSSManager's cache for querying. Synchronous.
     *
     * @param {!string} str
     * @return {Array.<ResultSetInfo>}
     */
    CSSManager.prototype.loadString = function (str) {
        var rulesets = [],
            self = this;
        
        this._parse(rulesets, str);
        
        return rulesets;
    };
    
    /**
     * Parse CSS rules from a file and cache the results. Asynchronous.
     *
     * @param {!FileEntry} fileEntry
     * @return {Deferred} A promise that is resolved with an Array of RuleSetInfo
     *  objects for all rules parsed from the file.
     */
    CSSManager.prototype.loadFile = function (fileEntry) {
        var result = new $.Deferred(),
            textResult = DocumentManager.readAsText(fileEntry),
            self = this,
            rulesets = [];
        
        textResult.done(function (text) {
            self._parse(rulesets, text, fileEntry);
            
            // resolve with rules from this file
            result.resolve(rulesets);
        });
        
        return result;
    };
    
    /**
     * Remove a file from cache
     */
    CSSManager.prototype.removeFile = function (fileEntry) {
        delete this._rules[fileEntry.fullPath];
    };
    
    /**
     * Clear all rules from cache.
     */
    CSSManager.prototype.clearCache = function () {
        this._rules = [];
    };
    
    /**
     * Finds matching CSS rules based on the tag, id and/or class name 
     * specified in the selectorString parameter. 
     * @param {!string} selectorString A string formatted as a type name
     *  "body", identifier "#myID" or class name ".myClass".
     * @return {Array.<ResultSetInfo>}
     */
    // after sprint 4 we should make this more robust
    CSSManager.prototype.findMatchingRules = function (selectorString) {
        var matches = [];
        
        $.each(this._rules, function (fullPath, rulesArr) {
            var fileMatches = rulesArr.filter(function (rulesetInfo, index, array) {
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
                                
                                // only scan backwards if there is no combinator
                                if (element.combinator.value.length === 0) {
                                    elementIndex--;
                                } else {
                                    break;
                                }
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
            
            Array.prototype.push.apply(matches, fileMatches);
        });
        
        return matches;
    };
    
    exports.CSSManager = CSSManager;
});
