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
    var NativeFileSystem = require("NativeFileSystem"),
        FileUtils        = require("FileUtils");
    
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
     * Computes the line number of the offset in the given text.
     * @returns {number}
     */
    function _computeLineNumber(text, offset) {
        var lines = text.substr(0, offset);
        return lines.split("\n").length - 1;
    }
    
    /**
     * Computes character offsets and line numbers for all RuleSetInfo objects
     * derived from the input text.
     */
    function _computeOffsets(rulesets, text) {
        // FIXME (jasonsj): issue #310
        // To be consistent with LESS, strip CR.
        // Remove this workaround and patch LESS parser to save accurate offset info.
        // There are current issues with CRLF replacement and token trimming.
        var input = text.replace(/\r\n/g, '\n');
        
        // rulesets is an in-order traversal of the AST
        // work backwards to establish offset start and end values
        var i               = rulesets.length - 1,
            current         = null,
            offsetEnd       = input.length,
            firstElement    = null,
            lines           = input;
        
        while (i >= 0) {
            current = rulesets[i];
            
            // get offset end from the previous rule's offsetStart
            current.offsetEnd   = offsetEnd;
            
            // HACK - Work backwards from the first element
            // Example: "div { color:red }"
            // The "div" Selector Element index returns 4 instead of 0
            firstElement = current.ruleset.selectors[0].elements[0];
            current.offsetStart = firstElement.index - firstElement.value.length - firstElement.combinator.value.length;
            
            // split the input up to the offset to find the lineStart and lineEnd
            current.lineEnd = _computeLineNumber(lines, current.offsetEnd);
            lines = lines.substr(0, current.offsetEnd);
            
            current.lineStart = _computeLineNumber(lines, current.offsetStart);
            lines = lines.substr(0, current.offsetStart);
            
            offsetEnd = current.offsetStart - 1;
            
            i--;
        }
    }
                
    function _isTypeSelector(str) {
        return (str.search(IDENTIFIER_REGEX) !== 0);
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
     * @param {Array.<ResultSetInfo>} rulesets Result storage
     * @param {string} text CSS text to parse
     * @param {?FileEntry} source Optional. FileEntry source of CSS text.
     */
    CSSManager.prototype._parse = function (rulesets, text, source) {
        var self = this;
        
        this._parser.parse(text, function (error, root) {
            if (error) {
                throw error;
            }
            
            _addRuleset(rulesets, root, source);
            _computeOffsets(rulesets, text);

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
    CSSManager.prototype._loadString = function (str) {
        var rulesets = [],
            self = this;
        
        this._parse(rulesets, str);
        
        return rulesets;
    };
    
    /**
     * Parse CSS rules from a file and cache the results. Asynchronous.
     *
     * @param {!FileEntry} fileEntry
     * @return {Promise} A promise that is resolved with an Array of RuleSetInfo
     *  objects for all rules parsed from the file.
     */
    CSSManager.prototype.loadFile = function (fileEntry) {
        var result = new $.Deferred(),
            textResult = FileUtils.readAsText(fileEntry),
            self = this,
            rulesets = [];
        
        textResult.done(function (text) {
            self._parse(rulesets, text, fileEntry);
            
            // resolve with rules from this file
            result.resolve(rulesets);
        });
        
        return result.promise();
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
        this._rules = {};
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
                    
                    if (selector.elements.length === 0) {
                        return false;
                    }
                    
                    // The rightmost type selector must be a full match, and can contain
                    // any other simple selectors (ID, attribute, class, etc.)
                    var element,
                        elementIndex        = selector.elements.length - 1,
                        elementValue        = null,
                        query               = selectorString,
                        isTypeSelectorQuery = false,
                        match               = false;
                    
                    // type selectors are not case sensitive
                    if (_isTypeSelector(query)) {
                        isTypeSelectorQuery = true;
                        query = query.toLowerCase();
                    }
                    
                    // match any element, right-to-left, up to a combinator
                    while (elementIndex >= 0) {
                        element = selector.elements[elementIndex];
                        elementValue = element.value;
                        
                        if (_isTypeSelector(elementValue)) {
                            // type matches are not case sensitive
                            elementValue = elementValue.toLowerCase();
                        }
                        
                        match = (elementValue === query);
                        
                        if (match) {
                            break;
                        }
                        
                        var comb = (element.combinator.value);
                            
                        // Only scan backwards if there is no combinator.
                        // Special case for pseudo elements...
                        //   pseudeo element "::" is treated as a combinator but pseude class ":" is not
                        if ((comb.length === 0) || (comb === "::")) {
                            elementIndex--;
                        } else {
                            break;
                        }
                    }
                    
                    // Always match a lone universal selector (sprint 4)
                    if (!match && isTypeSelectorQuery) {
                        if ((elementValue === "*") &&
                                (selector.elements.length === 1)) {
                            return true;
                        }
                        
                        return elementValue === query;
                    }
                    
                    return match;
                });
            });
            
            Array.prototype.push.apply(matches, fileMatches);
        });
        
        return matches;
    };
    
    exports.CSSManager = CSSManager;
});
