/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

/**
 * Set of utilities for simple parsing of CSS text.
 */
define(function (require, exports, module) {
    'use strict';
    
    var Async               = require("Async"),
        FileIndexManager    = require("FileIndexManager"),
        FileUtils           = require("FileUtils"),
        NativeFileSystem    = require("NativeFileSystem").NativeFileSystem;
    
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
        var re = new RegExp(".*[\\s|,|\\.#]" + selector + "\\s*[,\\{][^\\}]*\\}", "i");
        var startPos = text.search(re);
        
        if (startPos !== -1) {
            var selectorText = re.exec(text)[0];
            // trim off any preceding whitespace
            startPos += selectorText.search(/\S/);
            var endPos = startPos + re.exec(text)[0].length - 1;
            
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
    
    function findMatchingRules(selector) {
        var result          = new $.Deferred(),
            cssFilesResult  = FileIndexManager.getFileInfoList("css"),
            selectors       = [];
    
        function _loadFileAndScan(fullPath, selector) {
            var fileEntry = new NativeFileSystem.FileEntry(fullPath),
                result = new $.Deferred();
            
            FileUtils.readAsText(fileEntry)
                .done(function (content) {
                    // Scan for selectors
                    var localResults = findAllMatchingSelectors(content, selector);
                    
                    function lineNum(text, offset) {
                        return text.substr(0, offset).split("\n").length - 1; // 0-based linenum
                    }
                    
                    if (localResults.length > 0) {
                        $.each(localResults, function (index, value) {
                            selectors.push({
                                source: fileEntry,
                                lineStart: lineNum(content, localResults[index].start),
                                lineEnd: lineNum(content, localResults[index].end)
                            });
                        });
                    }
                    
                    result.resolve();
                })
                .fail(function (error) {
                    result.reject(error);
                });
            
            return result.promise();
        }
        
        cssFilesResult.done(function (fileInfos) {
            Async.doInParallel(fileInfos, function (fileInfo, number) {
                return _loadFileAndScan(fileInfo.fullPath, selector);
            })
                .done(function () {
                    result.resolve(selectors);
                })
                .fail(function (error) {
                    console.log("Error reading CSS files.");
                    result.reject(error);
                });
        });
        
        return result.promise();
    }
    
    exports.findSelector = findSelector;
    exports.findAllMatchingSelectors = findAllMatchingSelectors;
    exports.findMatchingRules = findMatchingRules;
});
