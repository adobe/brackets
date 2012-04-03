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
    
    var Async               = require("utils/Async"),
        DocumentManager     = require("document/DocumentManager"),
        FileIndexManager    = require("project/FileIndexManager"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem;

    /**
     * Extracts all CSS selectors from the given text
     * Returns an array of selectors. Each selector is an object with the following properties:
         selector:                 the text of the selector (note: comma separated selector groups like 
                                   "h1, h2" are broken into separate selectors)
         ruleStartLine:            line in the text where the rule (including preceding comment) appears
         ruleStartChar:            column in the line where the rule (including preceding comment) starts
         selectorStartLine:        line in the text where the selector appears
         selectorStartChar:        column in the line where the selector starts
         selectorEndLine:          line where the selector ends
         selectorEndChar:          column where the selector ends
         selectorGroupStartLine:   line where the comma-separated selector group (e.g. .foo, .bar, .baz)
                                   starts that this selector (e.g. .baz) is part of. Particularly relevant for
                                   groups that are on multiple lines.
         selectorGroupStartChar:   column in line where the selector group starts.
         declListStartLine:        line where the declaration list for the rule starts
         declListStartChar:        column in line where the declaration list for the rule starts
         declListEndLine:          line where the declaration list for the rule ends
         declListEndChar:          column in the line where the declaration list for the rule ends
     * @param text {!String} CSS text to extract from
     * @return {Array.<Object>} Array with objects specifying selectors.
     */
    function extractAllSelectors(text) {
        var selectors = [];
        var mode = CodeMirror.getMode({indentUnit: 2}, "css");
        var state = CodeMirror.startState(mode);

        var lines = CodeMirror.splitLines(text);
        var lineCount = lines.length;
        
        var currentSelector = "";
        var ruleStartChar = -1, ruleStartLine = -1;
        var selectorStartChar = -1, selectorStartLine = -1;
        var token, style, stream, i, j;

        var inDeclList = false, inAtRule = false;
        var selectorGroupStartLine = -1, selectorGroupStartChar = -1;
        var declListStartLine = -1, declListStartChar = -1;

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

                if (state.stack.indexOf("{") === -1 && // not in a declaration list
                        (state.stack.length === 0 || state.stack[state.stack.length - 1] !== "@media") && // not parsing a media query
                        ((style === null && token !== "{" && token !== "}" && token !== ",") || (style !== null))) { // not at a non-selector token

                    // check for these special cases:
                    if (inAtRule) {
                        // once we're in at @rule, consume tokens until next semi-colon
                        if (token === ";") {
                            inAtRule = false;
                        }
                    } else if (token.match(/@(charset|import|namespace)/i)) {
                        // This code only handles @rules in this format:
                        //   @rule ... ;
                        //
                        // This code does not handle @rules that use this format:
                        //    @rule ... { ... }
                        // such as @media (which is handled elsewhere) @page,
                        // @keyframes (also -webkit-keyframes, etc.), and @font-face.
                        inAtRule = true;
                        ruleStartLine = -1;  // reset so we don't get @rules following comments
                        selectorStartChar = -1;
                        selectorGroupStartLine = -1;
                    } else {
                        // detect non-crlf whitespace, comments on same line as '}'
                        if (ruleStartLine < 0 && (token.trim() !== "") &&
                                !(style === "comment" && stream.start > 0 && lines[i].substr(0, stream.start).indexOf('}') !== -1)) {
                             
                            // start of a new selector, or comment above selector
                            ruleStartChar = stream.start;
                            ruleStartLine = i;
                        }

                        if (selectorStartChar < 0 && (token.trim() !== "") && style !== "comment") {
                             
                            // start of a new selector, or comment above selector
                            currentSelector = "";
                            selectorStartChar = stream.start;
                            selectorStartLine = i;
                            if (selectorGroupStartLine < 0) {
                                // this is the start of a new comma-separated selector group
                                // (whenever we start parsing a declaration list, we set selectorGroupStartLine to -1)
                                selectorGroupStartLine = selectorStartLine;
                                selectorGroupStartChar = selectorStartChar;
                            }
                        }
                        if (selectorStartChar !== -1) {
                            currentSelector += token;
                        }
                    }
                } else { // we aren't parsing a selector
                    if (currentSelector.trim() !== "") { // we have a selector, and we parsed something that is not part of a selector, so we just finished parsing a selector
                        selectors.push({selector: currentSelector.trim(),
                                        ruleStartLine: ruleStartLine,
                                        ruleStartChar: ruleStartChar,
                                        selectorStartLine: selectorStartLine,
                                        selectorStartChar: selectorStartChar,
                                        declListEndLine: -1,
                                        selectorEndLine: i,
                                        selectorEndChar: stream.start - 1, // stream.start points to the first char of the non-selector token
                                        selectorGroupStartLine: selectorGroupStartLine,
                                        selectorGroupStartChar: selectorGroupStartChar
                                       });
                    }
                    currentSelector = "";
                    selectorStartChar = -1;

                    if (!inDeclList) {
                        if (state.stack.indexOf("{") > -1) { // just started parsing a declaration list
                            inDeclList = true;
                            declListStartLine = i;
                            declListStartChar = stream.start;
    
                            // Since we're now in a declartion list, that means we also finished parsing the whole selector group.
                            // Therefore, reset selectorGroupStartLine so that next time we parse a selector we know it's a new group
                            selectorGroupStartLine = -1;
                            selectorGroupStartChar = -1;
                            ruleStartLine = -1;
                            ruleStartChar = -1;
                        } else if (token === "@media") {
                            // ignore comments preceding @rules
                            ruleStartLine = -1;
                            ruleStartChar = -1;
                        }
                    } else if (inDeclList && state.stack.indexOf("{") === -1) {  // just finished parsing a declaration list
                        inDeclList = false;
                        // assign this declaration list position to every selector on the stack that doesn't have a declaration list start and end line
                        for (j = selectors.length - 1; j >= 0; j--) {
                            if (selectors[j].declListEndLine !== -1) {
                                break;
                            } else {
                                selectors[j].declListStartLine = declListStartLine;
                                selectors[j].declListStartChar = declListStartChar;
                                selectors[j].declListEndLine = i;
                                selectors[j].declListEndChar = stream.pos - 1; // stream.pos actually points to the char after the }
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
    
    /**
     * Finds all instances of the specified selector in "text".
     * Returns an Array of Objects with start and end properties.
     *
     * For Sprint 4, we only support simple selectors. This function will need to change
     * dramatically to support full selectors.
     *
     * FUTURE: (JRB) It would be nice to eventually use the browser/jquery to do the selector evaluation.
     * One way to do this would be to take the user's HTML, add a special attribute to every tag with a UID,
     * and then construct a DOM (using the commented out code above). Then, give this DOM and the selector to 
     * jquery and ask what matches. If the node that the user's cursor is in comes back from jquery, then 
     * we know the selector applies.
     *
     * @param text {!String} CSS text to search
     * @param selector {!String} selector to search for
     * @return {Array.<{line:number, declListEndLine:number}>} Array of objects containing the start
     *      and end line numbers (0-based, inclusive range) for each matched selector.
     */
    function _findAllMatchingSelectorsInText(text, selector) {
        var allSelectors = extractAllSelectors(text);
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
            selector = "(^|\\s)" + selector;
        }
        
        var re = new RegExp(selector + "(\\[[^\\]]*\\]|:{1,2}[\\w-()]+|\\.[\\w-]+|#[\\w-]+)*\\s*$", classOrIdSelector ? "" : "i");
        allSelectors.forEach(function (entry) {
            if (entry.selector.search(re) !== -1) {
                result.push(entry);
            } else if (!classOrIdSelector) {
                // Special case for tag selectors - match "*" as the rightmost character
                if (entry.selector.trim().search(/\*$/) !== -1) {
                    result.push(entry);
                }
            }
        });
        
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
     * @return {$.Promise} that will be resolved with an Array of objects containing the
     *      source document, start line, and end line (0-based, inclusive range) for each matching declaration list.
     *      Does not addRef() the documents returned in the array.
     */
    function findMatchingRules(selector) {
        var result          = new $.Deferred(),
            cssFilesResult  = FileIndexManager.getFileInfoList("css"),
            selectors       = [];
        
        function _loadFileAndScan(fullPath, selector) {
            var result = new $.Deferred();
            
            DocumentManager.getDocumentForPath(fullPath)
                .done(function (doc) {
                    var localResults = _findAllMatchingSelectorsInText(doc.getText(), selector);
                    
                    localResults.forEach(function (value) {
                        selectors.push({
                            selector: value.selector,
                            document: doc,
                            lineStart: value.ruleStartLine,
                            lineEnd: value.declListEndLine
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
    exports.extractAllSelectors = extractAllSelectors;
});
