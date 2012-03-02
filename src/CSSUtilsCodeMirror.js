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

    /*
    var _htmlDoctype = document.implementation.createDocumentType('html',
        '-//W3C//DTD XHTML 1.0 Strict//EN',
        'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
    );
    var _htmlDocument = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', _htmlDoctype);

    function checkIfSelectorSelectsHTML(selector, theHTML) {
        $('html', _htmlDocument).html(theHTML);
        return ($(selector, _htmlDocument).length > 0);
    }
    */

    /*
    function printer(one, two, three, four, five) {
        var string = "parse output: " + one + " | " + two + " | " + three + " | " + four + " | ";
        if (five.length === 0) {
            string += "0:[]";
        } else {
            string += five.length + ":" + five[five.length-1];
        }
        console.log(string);
    }
    */

    function _addCumulativeCharCountToParsedSelectors(text, selectors) {
        var lines = text.split("\n");
        var cumulative = []; // element i holds characters already seen at the *start* of line i
        var counter = 0, i;

        cumulative[0] = 0;
        for (i = 1; i < lines.length; i++) {
            cumulative[i] = cumulative[i-1] + lines[i-1].length + 1; // add one for the newline char we split on
        }

        for (i = 0; i < selectors.length; i++) {
            selectors[i].start = cumulative[selectors[i].line] + selectors[i].character;
            selectors[i].end = selectors[i].start + selectors[i].selector.length;
        }

    }

    function _extractAllSelectors(text) {
        var selectors = [];
        var mode = CodeMirror.getMode({indentUnit: 2}, "css");
        var state = CodeMirror.startState(mode);

        var lines = CodeMirror.splitLines(text)
        var lineCount = lines.length;
        
        var currentSelector = "", currentPosition = -1;
        var token, style, stream, i;

        for (i = 0; i < lineCount; ++i) {
            if (currentSelector.trim() !== "") { // we got to a new line with a current selector, so save it and start parsing a new selector
                selectors.push({selector: currentSelector.trim(), line: i-1, character: currentPosition});
                currentSelector = "";
                currentPosition = -1;
            }

            stream = new CodeMirror.StringStream(lines[i]);
            while (!stream.eol()) {
                style = mode.token(stream, state);
                token = stream.current();

                // printer(token, style, i, stream.start, state.stack);

                if (state.stack.indexOf("{") === -1 && // not in a rule
                    (state.stack.length === 0 || state.stack[state.stack.length-1] !== "@media") && // not parsing a media query
                    ((style === null && token !== "{" && token !== "}" && token !== ",") || (style !== null && style !== "comment" && style !== "meta"))) { // not at a non-selector token
                    // we're parsing a selector!
                    if (currentPosition < 0) { // start of a new selector
                        currentPosition = stream.start;
                    }
                    currentSelector += token;
                } else if (currentSelector.trim() !== "") { // we have a selector, and we parsed something that is not part of a selector
                    selectors.push({selector: currentSelector.trim(), line: i, character: currentPosition});
                    currentSelector = "";
                    currentPosition = -1;
                } 

                // advance the stream past this token
                stream.start = stream.pos;
            }
        }

        // we've got all the selectors, now compute the char offset in file
        // TODO: If we use this method, we'll want to just return the line numbers long term since that's what we use anyway
        _addCumulativeCharCountToParsedSelectors(text, selectors);

        return selectors;
    }

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
        var allSelectors = _extractAllSelectors(text);
        var result = null;
        var i;

        for (i = 0; i < allSelectors.length; i++) {
            if (allSelectors[i].selector.lastIndexOf(selector) === (allSelectors[i].selector.length - selector.length)) {
                result = allSelectors[i];
                break;
            }
        }

        return result;
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
        var allSelectors = _extractAllSelectors(text);
        var result = [];
        var i;

        for (i = 0; i < allSelectors.length; i++) {
            if (allSelectors[i].selector.lastIndexOf(selector) === (allSelectors[i].selector.length - selector.length)) {
                result.push(allSelectors[i]);
            }
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
