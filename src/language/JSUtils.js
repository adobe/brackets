/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, CodeMirror */

/**
 * Set of utilities for simple parsing of JS text.
 */
define(function (require, exports, module) {
    "use strict";
    
    var _ = require("lodash");
    
    // Load brackets modules
    var Async                   = require("utils/Async"),
        DocumentManager         = require("document/DocumentManager"),
        PerFileCache            = require("document/PerFileCache"),
        FileUtils               = require("file/FileUtils"),
        NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
        PerfUtils               = require("utils/PerfUtils"),
        StringUtils             = require("utils/StringUtils");

    /** Cached results so we don't reload & rescan files unless thay've changed */
    var _cache = new PerFileCache.Cache();
    
    /**
     * Function matching regular expression. Recognizes the forms:
     * "function functionName()", "functionName = function()", and
     * "functionName: function()".
     *
     * Note: JavaScript identifier matching is not strictly to spec. This
     * RegExp matches any sequence of characters that is not whitespace.
     * @type {RegExp}
     */
    var _functionRegExp = /(function\s+([$_A-Za-z\u007F-\uFFFF][$_A-Za-z0-9\u007F-\uFFFF]*)\s*(\([^)]*\)))|(([$_A-Za-z\u007F-\uFFFF][$_A-Za-z0-9\u007F-\uFFFF]*)\s*[:=]\s*function\s*(\([^)]*\)))/g;
    
    /**
     * @private
     * Return an object mapping function name to offset info for all functions in the specified text.
     * Offset info is an array, since multiple functions of the same name can exist.
     * @param {!string} text Document text
     * @return {Object.<string, Array.<{offsetStart: number, offsetEnd: number}>}
     */
    function _findAllFunctionsInText(text) {
        var results = {},
            functionName,
            match;
        
        PerfUtils.markStart(PerfUtils.JSUTILS_REGEXP);
        
        while ((match = _functionRegExp.exec(text)) !== null) {
            functionName = (match[2] || match[5]).trim();
            
            if (!Array.isArray(results[functionName])) {  // can't just check truthiness since functionName might be in Object.prototype
                results[functionName] = [];
            }
            
            results[functionName].push({offsetStart: match.index});
        }
        
        PerfUtils.addMeasurement(PerfUtils.JSUTILS_REGEXP);
        
        return results;
    }
    
    // Given the start offset of a function definition (before the opening brace), find
    // the end offset for the function (the closing "}"). Returns the position one past the
    // close brace. Properly ignores braces inside comments, strings, and regexp literals.
    function _getFunctionEndOffset(text, offsetStart) {
        var mode = CodeMirror.getMode({}, "javascript");
        var state = CodeMirror.startState(mode), stream, style, token;
        var curOffset = offsetStart, length = text.length, blockCount = 0, lineStart;
        var foundStartBrace = false;
        
        // Get a stream for the next line, and update curOffset and lineStart to point to the 
        // beginning of that next line. Returns false if we're at the end of the text.
        function nextLine() {
            if (stream) {
                curOffset++; // account for \n
                if (curOffset >= length) {
                    return false;
                }
            }
            lineStart = curOffset;
            var lineEnd = text.indexOf("\n", lineStart);
            if (lineEnd === -1) {
                lineEnd = length;
            }
            stream = new CodeMirror.StringStream(text.slice(curOffset, lineEnd));
            return true;
        }
        
        // Get the next token, updating the style and token to refer to the current
        // token, and updating the curOffset to point to the end of the token (relative
        // to the start of the original text).
        function nextToken() {
            if (curOffset >= length) {
                return false;
            }
            if (stream) {
                // Set the start of the next token to the current stream position.
                stream.start = stream.pos;
            }
            while (!stream || stream.eol()) {
                if (!nextLine()) {
                    return false;
                }
            }
            style = mode.token(stream, state);
            token = stream.current();
            curOffset = lineStart + stream.pos;
            return true;
        }

        while (nextToken()) {
            if (style !== "comment" && style !== "regexp" && style !== "string") {
                if (token === "{") {
                    foundStartBrace = true;
                    blockCount++;
                } else if (token === "}") {
                    blockCount--;
                }
            }

            // blockCount starts at 0, so we don't want to check if it hits 0
            // again until we've actually gone past the start of the function body.
            if (foundStartBrace && blockCount <= 0) {
                return curOffset;
            }
        }
        
        // Shouldn't get here, but if we do, return the end of the text as the offset.
        return length;
    }

    /**
     * @private
     * Computes function offsetEnd, lineStart and lineEnd. Appends a result record to rangeResults.
     * @param {!Document} doc
     * @param {!string} functionName
     * @param {!Array.<{offsetStart: number, offsetEnd: number}>} functions
     * @param {!Array.<{document: Document, name: string, lineStart: number, lineEnd: number}>} rangeResults
     */
    function _computeOffsets(doc, functionName, functions, rangeResults) {
        var text    = doc.getText(),
            lines   = StringUtils.getLines(text);
        
        functions.forEach(function (funcEntry) {
            if (!funcEntry.offsetEnd) {
                PerfUtils.markStart(PerfUtils.JSUTILS_END_OFFSET);
                
                funcEntry.offsetEnd = _getFunctionEndOffset(text, funcEntry.offsetStart);
                funcEntry.lineStart = StringUtils.offsetToLineNum(lines, funcEntry.offsetStart);
                funcEntry.lineEnd   = StringUtils.offsetToLineNum(lines, funcEntry.offsetEnd);
                
                PerfUtils.addMeasurement(PerfUtils.JSUTILS_END_OFFSET);
            }
            
            rangeResults.push({
                document:   doc,
                name:       functionName,
                lineStart:  funcEntry.lineStart,
                lineEnd:    funcEntry.lineEnd
            });
        });
    }
    
    /**
     * @private
     * Compute lineStart and lineEnd for each matched function
     * @param {!Array.<{fullPath: !string, functions: Array.<{offsetStart: number, offsetEnd: number}>}>} docEntries
     * @param {!string} functionName
     * @return {$.Promise} A promise resolved with: !Array.<{document: Document, name: string, lineStart: number, lineEnd: number}>
     */
    function _filterAndGetOffsets(docEntries, functionName) {
        var result              = new $.Deferred(),
            matchedEntries      = [],
            rangeResults        = [];
        
        // Filter for documents that contain the named function
        matchedEntries = docEntries.filter(function (docEntry) {
            // Can't use docEntry.functions.hasOwnProperty() since the docEntry.functions map could have
            // a key "hasOwnProperty" which shadows the original function.
            return _.has(docEntry.functions, functionName);
        });
        
        // Find end offsets for all matching functions & convert to MultiRangeInlineEditor-compatible result objects
        Async.doInParallel(matchedEntries, function (docEntry) {
            // Need to create a real Document for each file containing matches, since our caller needs Documents
            // to pass to MultiRangeInlineEditor
            var oneResult = DocumentManager.getDocumentForPath(docEntry.fullPath)
                .done(function (fetchedDoc) {
                    _computeOffsets(fetchedDoc, functionName, docEntry.functions, rangeResults);
                });
            return oneResult;
        }).done(function () {
            result.resolve(rangeResults);
        });
        
        return result.promise();
    }
    
    /**
     * @private
     * Get all functions for each FileInfo.
     * @param {Array.<FileInfo>} fileInfos
     * @return {$.Promise} A promise resolved with: !Array.<{fullPath: string, functions: Array.<{offsetStart: number, offsetEnd: number}>}>
     *   (i.e. an array of objects each containing a fullPaths and its _findAllFunctionsInText() return value)
     */
    function _getFunctionsInFiles(fileInfos) {
        var result          = new $.Deferred(),
            docEntries      = [];
        
        PerfUtils.markStart(PerfUtils.JSUTILS_GET_ALL_FUNCTIONS);
        
        Async.doInParallel(fileInfos, function (fileInfo) {
            var oneResult = _cache.getOrCreate(fileInfo.fullPath,
                function (text) {
                    return { fullPath: fileInfo.fullPath, functions: _findAllFunctionsInText(text) };
                });
            oneResult.done(function (docInfo) {
                docEntries.push(docInfo);
            });
            return oneResult.promise();
            
        }, false)   // don't fail fast: if one file fails, continue searching others anyway
            .always(function () {
                PerfUtils.addMeasurement(PerfUtils.JSUTILS_GET_ALL_FUNCTIONS);
                result.resolve(docEntries);
            });
        
        return result.promise();
    }
    
    /**
     * Return all functions that have the specified name, searching across all the given files.
     *
     * @param {!String} functionName The name to match.
     * @param {!Array.<FileIndexManager.FileInfo>} fileInfos The array of files to search.
     * @param {boolean=} keepAllFiles If true, don't ignore non-javascript files.
     * @return {$.Promise} that will be resolved with an Array of objects containing the
     *      source document, start line, and end line (0-based, inclusive range) for each matching function list.
     *      Does not addRef() the documents returned in the array.
     */
    function findMatchingFunctions(functionName, fileInfos, keepAllFiles) {
        var result          = new $.Deferred(),
            jsFiles         = [],
            docEntries      = [];
        
        if (!keepAllFiles) {
            // Filter fileInfos for .js files
            jsFiles = fileInfos.filter(function (fileInfo) {
                return FileUtils.getFileExtension(fileInfo.fullPath).toLowerCase() === "js";
            });
        } else {
            jsFiles = fileInfos;
        }
        
        // RegExp search (or cache lookup) for all functions in the project
        _getFunctionsInFiles(jsFiles).done(function (docEntries) {
            // Compute offsets for all matched functions
            _filterAndGetOffsets(docEntries, functionName).done(function (rangeResults) {
                result.resolve(rangeResults);
            });
        });
        
        return result.promise();
    }

    /**
     * Finds all instances of the specified searchName in "text".
     * Returns an Array of Objects with start and end properties.
     *
     * @param text {!String} JS text to search
     * @param searchName {!String} function name to search for
     * @return {Array.<{offset:number, functionName:string}>}
     *      Array of objects containing the start offset for each matched function name.
     */
    function findAllMatchingFunctionsInText(text, searchName) {
        var allFunctions = _findAllFunctionsInText(text);
        var result = [];
        var lines = text.split("\n");
        
        _.forEach(allFunctions, function (functions, functionName) {
            if (functionName === searchName || searchName === "*") {
                functions.forEach(function (funcEntry) {
                    var endOffset = _getFunctionEndOffset(text, funcEntry.offsetStart);
                    result.push({
                        name: functionName,
                        lineStart: StringUtils.offsetToLineNum(lines, funcEntry.offsetStart),
                        lineEnd: StringUtils.offsetToLineNum(lines, endOffset)
                    });
                });
            }
        });
         
        return result;
    }
    
    PerfUtils.createPerfMeasurement("JSUTILS_GET_ALL_FUNCTIONS", "Parallel file search across project");
    PerfUtils.createPerfMeasurement("JSUTILS_REGEXP", "RegExp search for all functions");
    PerfUtils.createPerfMeasurement("JSUTILS_END_OFFSET", "Find end offset for a single matched function");

    exports.findAllMatchingFunctionsInText = findAllMatchingFunctionsInText;
    exports._getFunctionEndOffset = _getFunctionEndOffset; // For testing only
    exports.findMatchingFunctions = findMatchingFunctions;
});
