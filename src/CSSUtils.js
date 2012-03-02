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
        
        var currentSelector = "", currentPosition = -1, selectorStartLine;
        var token, style, stream, i, j;

        var inRules = false;

        for (i = 0; i < lineCount; ++i) {
            if (currentSelector.trim() !== "") {
                // If we are in a current selector and starting a newline, make sure there is whitespace in the selector
                currentSelector += " ";
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
                        selectorStartLine = i;
                    }
                    currentSelector += token;
                } else { // we aren't parsing a selector
                    if (currentSelector.trim() !== "") { // we have a selector, and we parsed something that is not part of a selector, so we just finished parsing a selector
                        selectors.push({selector: currentSelector.trim(), line: selectorStartLine, character: currentPosition});
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
                                selectors[j].ruleEndChar = stream.pos;
                            }
                        }
                    }
                }

                // advance the stream past this token
                stream.start = stream.pos;
            }
        }

        return selectors;
    }
    
    /**
     * Finds all instances of the specified selector in "text".
     * Returns an Array of Objects with start and end properties.
     *
     * For Sprint 4, we only support simple selectors. This function will need to change
     * dramatically to support full selectors.
     *
     * @param text {!String} CSS text to search
     * @param selector {!String} selector to search for
     * @return {Array.<Object>} Array of objects containing the start and end offsets for
     *  each matched selector.
     */
    function _findAllMatchingSelectorsInText(text, selector) {
        var allSelectors = _extractAllSelectors(text);
        var result = [];
        var i;
        
        // For sprint 4 we only match the rightmost simple selector, and ignore 
        // attribute selectors and pseudo selectors
        var classOrIdSelector = selector[0] === "." || selector[0] === "#";
        var prefix = "";
        
        // Escape initial "." in selector, if present.
        if (selector[0] === ".") {
            selector = "\\" + selector;
        }
        
        if (!classOrIdSelector) {
            // Tag selectors must have nothing or whitespace before it.
            selector = "(^\\s*|\\s+)" + selector;
        }
        
        var re = new RegExp(selector + "(\\[[^\\]]*\\]|:{1,2}[\\w-]+|\\.[\\w-]+)*\\s*$", classOrIdSelector ? "" : "i");
        for (i = 0; i < allSelectors.length; i++) {
            if (allSelectors[i].selector.search(re) !== -1) {
                result.push(allSelectors[i]);
            }
        }
        
        return result;
    }
    
    /**
     * Return all rules matching the specified selector.
     * For Sprint 4, we only look at the rightmost simple selector. For example, searching for ".foo" will 
     * match these rules:
     *  .foo {}
     *  div .foo {}
     *  div.foo {}
     *  div .foo[bar="42"] {}
     *  div .foo:hovered {}
     *  div .foo::first-child
     * but will *not* match these rules:
     *  .foobar {}
     *  .foo .bar {}
     *  div .foo .bar {}
     *  .foo.bar {}
     *
     * @param {!String} selector The selector to match. This can be a tag selector, class selector or id selector
     * @return {Array<Object>} Array of objects containing the source (FileEntry), lineStart (Number), and 
     *  lineEnd (Number) for each matching rule.
     */
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
                    var localResults = _findAllMatchingSelectorsInText(content, selector);
                    
                    localResults.forEach(function (value) {
                        selectors.push({
                            source: fileEntry,
                            lineStart: value.line,
                            lineEnd: value.ruleEndLine
                        });
                    });
                    
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
    
    exports._findAllMatchingSelectorsInText = _findAllMatchingSelectorsInText; // For testing only
    exports.findMatchingRules = findMatchingRules;
});
