/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

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
     * This code can be used to create an "independent" HTML document that can be passed to jQuery
     * calls. Allows using jQuery's CSS selector engine without actually putting anything in the browser's DOM
     *
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

    /* DEBUG FUNCTION
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

    /**
     * @private
     * Helper function to map line/char pairs to absolute char position in the file
     * NOTE: If we end up using this solution, we probably should convert the callers
     * of this solution to just use line/char pairs.
     *
     * Modifies the passed in "selectors" array directly.
     *
     * @param text {!String} CSS text to search
     * @param selectors {!Array.<Object>} The selectors extracted using _extractAllSelectors 
     */
    function _addCumulativeCharCountToParsedSelectors(text, selectors) {
        var lines = text.split("\n");
        var cumulative = []; // element i holds characters already seen at the *start* of line i
        var counter = 0, i;

        cumulative[0] = 0;
        for (i = 1; i < lines.length; i++) {
            cumulative[i] = cumulative[i - 1] + lines[i - 1].length + 1; // add one for the newline char we split on
        }

        for (i = 0; i < selectors.length; i++) {
            selectors[i].start = cumulative[selectors[i].line] + selectors[i].character;
            selectors[i].end = cumulative[selectors[i].ruleEndLine] + selectors[i].ruleEndChar;
        }

    }

    /**
     * @private
     * Extracts all CSS selectors from the given text
     * Returns an array of selectors. Each selector is an object with the following properties:
         selector: the text of the selector (note: comma separated selectors like "h1, h2" are broken into separate selectors)
         line: zero-indexed line in the text where the selector appears
         character: zero-indexed column in the line where the selector starts
         ruleEndLine: zero-indexed line in the text where the rules for that selector end
         ruleEndCharacter: zero-indexed column in the line where the rules for that selector end
     * @param text {!String} CSS text to extract from
     * @return {Array.<Object>} Array with objects specifying selectors.
     */
    function _extractAllSelectors(text) {
        var selectors = [];
        var mode = CodeMirror.getMode({indentUnit: 2}, "css");
        var state = CodeMirror.startState(mode);

        var lines = CodeMirror.splitLines(text);
        var lineCount = lines.length;
        
        var currentSelector = "", currentPosition = -1;
        var token, style, stream, i, j;

        var inRules = false;

        for (i = 0; i < lineCount; ++i) {
            if (currentSelector.trim() !== "") { // we got to a new line with a current selector, so save it and start parsing a new selector
                selectors.push({selector: currentSelector.trim(), line: i - 1, character: currentPosition});
                currentSelector = "";
                currentPosition = -1;
            }

            stream = new CodeMirror.StringStream(lines[i]);
            while (!stream.eol()) {
                style = mode.token(stream, state);
                token = stream.current();

                // DEBUG STATEMENT -- printer(token, style, i, stream.start, state.stack);

                if (state.stack.indexOf("{") === -1 && // not in a rule
                        (state.stack.length === 0 || state.stack[state.stack.length - 1] !== "@media") && // not parsing a media query
                        ((style === null && token !== "{" && token !== "}" && token !== ",") || (style !== null && style !== "comment" && style !== "meta"))) { // not at a non-selector token
                    // we're parsing a selector!
                    if (currentPosition < 0) { // start of a new selector
                        currentPosition = stream.start;
                    }
                    currentSelector += token;
                } else { // we aren't parsing a selector
                    if (currentSelector.trim() !== "") { // we have a selector, and we parsed something that is not part of a selector, so we just finished parsing a selector
                        selectors.push({selector: currentSelector.trim(), line: i, character: currentPosition});
                        currentSelector = "";
                        currentPosition = -1;
                    }

                    if (!inRules && state.stack.indexOf("{") > -1) { // just started parsing a rule
                        inRules = true;
                    } else if (inRules && state.stack.indexOf("{") === -1) {  // just finished parsing a rule
                        inRules = false;
                        // assign this rule position to every selector on the stack that doesn't have a rule start and end line
                        for (j = selectors.length - 1; j >= 0; j--) {
                            if (selectors[j].ruleEndLine) {
                                break;
                            } else {
                                selectors[j].ruleEndLine = i;
                                selectors[j].ruleEndChar = stream.start;
                            }
                        }
                    }
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
     * Finds all instances of the specified selector in "text".
     * Returns an Array of Objects with start and end properties.
     *
     * TODO: Right now, we only support simple selectors. This function will need to change
     * dramatically to support full selectors.
     *
     * @param text {!String} CSS text to search
     * @param selector {!String} selector to search for
     * @return {Array.<Object>} Array of objects containing the start and end offsets for
     *  each matched selector.
     */
    function findAllMatchingSelectors(text, selector) {
        var allSelectors = _extractAllSelectors(text);
        var result = [];
        var i, loc;

        for (i = 0; i < allSelectors.length; i++) {
            loc = allSelectors[i].selector.toLowerCase().lastIndexOf(selector.toLowerCase());
            if (loc >= 0 && loc === (allSelectors[i].selector.length - selector.length)) {
                if (selector[0] !== "#" && selector[0] !== ".") {
                    // this is a tag selector, so need to make sure we have the exact tag
                    // we don't want to return, e.g., "textarea" (which ends in "a") when matching "a"
                    if (loc === 0 || allSelectors[i].selector[loc - 1].match(/\W/)) {
                        result.push(allSelectors[i]);
                    }
                } else { // is a class or id selector, so safe to push
                    result.push(allSelectors[i]);
                }
            }
        }

        return result;
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
        var matchingSelectors = findAllMatchingSelectors(text, selector);
        if (matchingSelectors.length > 0) {
            return matchingSelectors[0];
        } else {
            return null;
        }
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
