/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, require: false, brackets: false, less: false, FileError: false */

/**
 * CSSManager
 */
define(function (require, exports, module) {
    'use strict';
    
    // Dependencies
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        FileIndexManager    = require("FileIndexManager"),
        Async               = require("Async"),
        Strings             = require("strings"),
        FileUtils           = require("FileUtils");
    
    /**
     * Regex to match selector element values for ID '#', pseudo ':',
     * class name '.', attribute start '[' or digit.
     */
    var IDENTIFIER_REGEX = /^[#:\.\[\d]/;
    
    /**
     * CSSManager instance for the current project
     */
    var _cssManager;
    
    /**
     * Track CSS file modification times
     */
    var _cssFileMetadataMap = {};
    
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
        } else if (ruleset.selectors.length > 0) {
            // only add rules with selectors
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
        var input = text.replace(/\r\n/g, '\n').trimRight();
        
        // rulesets is an in-order traversal of the AST
        // work backwards to establish offset start and end values
        var i               = rulesets.length - 1,
            current         = null,
            offsetEnd       = input.length, // offset last non-white space char
            elements        = null,
            firstElement    = null,
            temp            = null,
            lines           = input;        // start with complete file content, truncating starting at EOF
        
        while (i >= 0) {
            current = rulesets[i];
            elements = current.ruleset.selectors[0].elements;
            
            // get offset end from the previous rule's offsetStart
            current.offsetEnd   = offsetEnd;
            
            // HACK - Work backwards from the first element
            // Example: "div { color:red }"
            // The "div" Selector Element index returns 4 instead of 0
            firstElement = elements[0];
            
            // search for the first selector element's offset
            temp = lines.substring(0, firstElement.index);
            current.offsetStart = temp.lastIndexOf(firstElement.value);
            
            // split the input up to the offset to find the lineStart and lineEnd
            current.lineEnd = _computeLineNumber(lines, current.offsetEnd);
            lines = lines.substr(0, current.offsetEnd).trimRight();
            
            current.lineStart = _computeLineNumber(lines, current.offsetStart);
            
            // the next rule (moving towards the top of the file) ends
            // with the first non-whitespace char before this rule's offsetStart
            lines = lines.substr(0, current.offsetStart).trimRight();
            offsetEnd = lines.length;
            
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
        // TODO (jasonsj): Strategy for inline <style> blocks?
        var result = new $.Deferred(),
            textResult = FileUtils.readAsText(fileEntry),
            self = this,
            rulesets = [];
        
        textResult.done(function (text) {
            try {
                self._parse(rulesets, text, fileEntry);
            
                // resolve with rules from this file
                result.resolve(rulesets);
            } catch (err) {
                result.reject(err);
            }
        });
        
        return result.promise();
    };
    
    /**
     * Remove a file from cache
     */
    CSSManager.prototype.removeFile = function (fullPath) {
        delete this._rules[fullPath];
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
    
    /*
     * Check for CSS file deltas. Load and remove files as necessary.
     */
    function _syncFiles(cssFiles) {
        // TODO (jasonsj): should FileIndexManager trigger add/change/remove events?
        var deferred        = new $.Deferred(),
            filesToLoad     = [],
            filesToRemove   = {};
        
        // Copy the current loaded files into a new map. Remove keys
        // from the map when the file is or will be loaded.
        $.each(_cssFileMetadataMap, function (fullPath, value) {
            filesToRemove[fullPath] = true;
        });
        
        var compareFileTimestamp = function (fileInfo) {
            var oneDeferred = new $.Deferred(),
                fileEntry;
            
            var metadataSuccess = function (metadata) {
                // compare to last timestamp
                var previous = !_cssFileMetadataMap[fileInfo.fullPath],
                    current = metadata.modificationTime;
                
                if ((previous === undefined) || (current !== previous)) {
                    // new or changed file, load it
                    filesToLoad.push(fileEntry);
                }
                
                // update the timestamp
                _cssFileMetadataMap[fileInfo.fullPath] = current;
            
                delete filesToRemove[fileInfo.fullPath];
                
                oneDeferred.resolve();
            };
            
            var metadataError = function (fileError) {
                // An entry will be left in currentFileMap
                if (fileError.code !== FileError.NOT_FOUND_ERR) {
                    // try to reload the file for any other errors
                    filesToLoad.push(fileEntry);
                    
                    delete filesToRemove[fileInfo.fullPath];
                }
                
                oneDeferred.resolve();
            };
            
            // TODO (jasonsj): work with Ty to add FileEntry property to FileInfo
            fileEntry = new NativeFileSystem.FileEntry(fileInfo.fullPath);
            fileEntry.getMetadata(metadataSuccess, metadataError);
            
            return oneDeferred.promise();
        };
        
        var compareResult = Async.doInParallel(cssFiles, compareFileTimestamp, false);
        compareResult.done(function () {
            // remove files
            $.each(filesToRemove, function (fullPath) {
                _cssManager.removeFile(fullPath);
            });
            
            // load new/changed files
            var loadFilesResult = Async.doInParallel_aggregateErrors(
                filesToLoad,
                function (value, index) {
                    return _cssManager.loadFile(value);
                }
            );
            
            loadFilesResult.done(function () {
                deferred.resolve();
            });
            
            // show a dialog when parsing fails
            // TODO (jasonsj): log parsing errors in a panel?
            loadFilesResult.fail(function (errors) {
                var files = "<ul>";
                
                errors.forEach(function (value, index) {
                    files += "<li>" + value.error.message +
                        " " + value.item.fullPath + " line " + value.error.line +
                        "</li>";
                });
                
                files += "</ul>";
                
                var dialog = brackets.showModalDialog(
                    brackets.DIALOG_ID_ERROR,
                    Strings.ERROR_PARSE_TITLE,
                    files
                );
                
                dialog.done(function () {
                    deferred.resolve();
                });
            });
        });
        
        return deferred.promise();
    }
    
    /**
     * Finds matching CSS rules in the current project, based on the tag,
     * id and/or class name specified in the selectorString parameter. 
     * @param {!string} selectorString A string formatted as a type name
     *  "body", identifier "#myID" or class name ".myClass".
     * @return {Array.<ResultSetInfo>}
     */
    function findMatchingRules(selectorString) {
        var deferred        = new $.Deferred(),
            cssFilesResult  = FileIndexManager.getFileInfoList("css");
        
        cssFilesResult.done(function (fileInfos) {
            _syncFiles(fileInfos).done(function () {
                deferred.resolve(_cssManager.findMatchingRules(selectorString));
            });
        });
        
        return deferred.promise();
    }
    
    /*
     * Extract line text for each rule from the associated source file.
     */
    function _getTextForInfos(infos) {
        var results = [],
            deferred = new $.Deferred();
        
        var masterPromise = Async.doInParallel(infos, function (info) {
            var oneFileResult = new $.Deferred();
            var textResult = FileUtils.readAsText(info.source);
        
            textResult.done(function (content) {
                content = content.replace(/\r\n/g, '\n');
                var lines = content.split("\n").slice(info.lineStart, info.lineEnd + 1);
                
                results.push(lines.join("\n"));
                oneFileResult.resolve();
            });
            
            return oneFileResult;
        });
        
        masterPromise.done(function () {
            deferred.resolve(results);
        });
        
        return deferred.promise();
    }
    
    function _logQuery(selectorString) {
        var ruleInfo;

        findMatchingRules(selectorString).done(function (ruleInfos) {
            _getTextForInfos(ruleInfos).done(function (texts) {
                texts.forEach(function (value, index) {
                    ruleInfo = ruleInfos[index];
                    console.log("result[" + index + "] line " +
                        (ruleInfo.lineStart + 1) + ": " +
                        ruleInfo.source.fullPath + "\n" + value);
                });
            });
        });
    }
    
    // Init
    (function () {
        _cssManager = new CSSManager();
    }());
    
    exports.findMatchingRules   = findMatchingRules;
    exports._CSSManager         = CSSManager;
    exports._getTextForInfos    = _getTextForInfos;
    exports._logQuery           = _logQuery;
});
