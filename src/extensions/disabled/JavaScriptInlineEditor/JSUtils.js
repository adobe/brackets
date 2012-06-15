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
/*global define, $, brackets, PathUtils */

/**
 * Set of utilities for simple parsing of JS text.
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load brackets modules
    var Async               = brackets.getModule("utils/Async"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        PerfUtils           = brackets.getModule("utils/PerfUtils"),
        StringUtils         = brackets.getModule("utils/StringUtils");

    /**
     * Tracks dirty documents between invocations of findMatchingFunctions.
     * @type {DirtyDocumentTracker}
     */
    var _dirtyDocumentTracker = DocumentManager.createDirtyDocumentTracker();
    
    /**
     * Function matching regular expression. Recognizes the forms:
     * "function functionName()", "functionName = function()", and "functionName: function()"
     * @type {RegExp}
     */
    var _functionRegExp = /((function\b)([^)]+)\b\([^)]*\))|((\w+)\s*[:=]\s*function\s*(\([^)]*\)))/g;
    
    /**
     * @private
     * Return an Array with names and offsets for all functions in the specified text
     * @param {!string} text Document text
     * @return {Object.<string, Array.<{offsetStart: number, offsetEnd: number}>}
     */
    function _findAllFunctionsInText(text) {
        var results = {},
            functionName,
            match;
        
        PerfUtils.markStart(PerfUtils.JSUTILS_REGEXP);
        
        while ((match = _functionRegExp.exec(text)) !== null) {
            functionName = (match[3] || match[5]).trim();
            
            if (!Array.isArray(results[functionName])) {
                results[functionName] = [];
            }
            
            results[functionName].push({offsetStart: match.index, offsetEnd: -1});
        }
        
        PerfUtils.addMeasurement(PerfUtils.JSUTILS_REGEXP);
        
        return results;
    }
    
    // Simple scanner to determine the end offset for the function (the closing "}")
    function _getFunctionEndOffset(text, offsetStart) {
        var curOffset = text.indexOf("{", offsetStart) + 1;
        var length = text.length;
        var blockCount = 1;
        
        // Brute force scan to look for closing curly match
        // NOTE: This does *not* handle comments, strings, or regexp literals.
        while (curOffset < length) {
            if (text[curOffset] === "{") {
                blockCount++;
            } else if (text[curOffset] === "}") {
                blockCount--;
            }
            
            curOffset++;
            
            if (blockCount <= 0) {
                return curOffset;
            }
        }
        
        // Shouldn't get here, but if we do, return the end of the text as the offset
        return length;
    }

    /**
     * @private
     * Computes function offsetEnd, lineStart and lineEnd. Appends a result record to rangeResults.
     * @param {!Document} doc
     * @param {!string} functionName
     * @param {!Array.<{offsetStart: number, offsetEnd: number}>} functions
     * @param {!Array} rangeResults
     */
    function _computeOffsets(doc, functionName, functions, rangeResults) {
        var text    = doc.getText(),
            lines   = StringUtils.getLines(text);
        
        functions.forEach(function (funcEntry) {
            if (funcEntry.offsetEnd < 0) {
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
     * Read a file and build a function list. Result is cached in fileInfo.
     * @param {!FileInfo} fileInfo File to parse
     * @param {!Deferred} result Deferred to resolve with all functions found and the document
     */
    function _readFileAndGetFunctionList(fileInfo, result) {
        DocumentManager.getDocumentForPath(fileInfo.fullPath)
            .done(function (doc) {
                var allFunctions = _findAllFunctionsInText(doc.getText());
                
                // Cache the result in the fileInfo object
                fileInfo.JSUtils = {};
                fileInfo.JSUtils.functions = allFunctions;
                fileInfo.JSUtils.timestamp = doc.diskTimestamp;
                
                result.resolve({doc: doc, functions: allFunctions});
            })
            .fail(function (error) {
                result.reject(error);
            });
    }
    
    function _getOrReadFunctionList(fileInfo, useCache, result) {
        if (useCache) {
            // Return cached data 
            result.resolve({doc: undefined, fileInfo: fileInfo, functions: fileInfo.JSUtils.functions});
        } else {
            _readFileAndGetFunctionList(fileInfo, result);
        }
    }
    
    /**
     * Resolves with an record containg the Document or FileInfo and an Array of all
     * function names with offsets for the specified file. Results may be cached.
     * @param {FileInfo} fileInfo
     */
    function _getFunctionListForFile(fileInfo) {
        var result = new $.Deferred(),
            isDirty = _dirtyDocumentTracker.isPathDirty(fileInfo.fullPath),
            useCache = false;
        
        if (isDirty && fileInfo.JSUtils) {
            // If a cache exists, check the timestamp on disk
            var file = new NativeFileSystem.FileEntry(fileInfo.fullPath);
            
            file.getMetadata(
                function (metadata) {
                    useCache = fileInfo.JSUtils.timestamp === metadata.diskTimestamp;
                    _getOrReadFunctionList(fileInfo, useCache, result);
                },
                function (error) {
                    result.reject(error);
                }
            );
        } else {
            useCache = !isDirty && fileInfo.JSUtils;
            _getOrReadFunctionList(fileInfo, useCache, result);
        }

        return result.promise();
    }
    
    /**
     * @private
     * Get all functions for each FileInfo. Stores the results in allDocuments.
     * @param {Array.<FileInfo>} fileInfos
     * @param {Array.<{doc: Document, fileInfo: FileInfo, functions: Array.<offsetStart: number, offsetEnd: number>}>} allDocuments
     */
    function _getAllFunctions(fileInfos, allDocuments) {
        PerfUtils.markStart(PerfUtils.JSUTILS_GET_ALL_FUNCTIONS);
        
        return Async.doInParallel(fileInfos, function (fileInfo) {
            var result = new $.Deferred();
            
            _getFunctionListForFile(fileInfo)
                .done(function (docInfo) {
                    allDocuments.push(docInfo);
                })
                .always(function (error) {
                    // If one file fails, continue to search
                    result.resolve();
                });
            
            return result.promise();
        })
            .always(function () {
                PerfUtils.addMeasurement(PerfUtils.JSUTILS_GET_ALL_FUNCTIONS);
            });
    }
    
    /**
     * @private
     * Compute lineStart and lineEnd for each matched function
     * @param {!Array.<{doc: Document, fileInfo: FileInfo, functions: Array.<offsetStart: number, offsetEnd: number>}>} docEntries
     * @param {!string} functionName
     * @param {!Array.<document: Document, name: string, lineStart: number, lineEnd: number>} rangeResults
     */
    function _getOffsets(docEntries, functionName, rangeResults) {
        return Async.doInParallel(docEntries, function (docEntry) {
            var doc = docEntry.doc,
                result = new $.Deferred();
            
            // doc will be undefined if we hit the cache
            if (!doc) {
                DocumentManager.getDocumentForPath(docEntry.fileInfo.fullPath)
                    .done(function (fetchedDoc) {
                        _computeOffsets(fetchedDoc, functionName, docEntry.functions, rangeResults);
                        result.resolve();
                    })
                    .fail(function (error) {
                        result.reject(error);
                    });
            } else {
                _computeOffsets(doc, functionName, docEntry.functions, rangeResults);
                result.resolve();
            }
            
            return result.promise();
        });
    }
    
    /**
     * Return all functions that have the specified name.
     *
     * @param {!String} functionName The name to match.
     * @param {!Array.<FileIndexManager.FileInfo>} fileInfos The array of files to search.
     * @return {$.Promise} that will be resolved with an Array of objects containing the
     *      source document, start line, and end line (0-based, inclusive range) for each matching function list.
     *      Does not addRef() the documents returned in the array.
     */
    function findMatchingFunctions(functionName, fileInfos) {
        var result          = new $.Deferred(),
            jsFiles         = [],
            allDocuments    = [],
            docEntries      = [],
            rangeResults    = [];
        
        // Filter fileInfos for .js files
        jsFiles = fileInfos.filter(function (fileInfo) {
            return (/^\.js/i).test(PathUtils.filenameExtension(fileInfo.fullPath));
        });
        
        // RegExp search (or cache lookup) for all functions in the project
        _getAllFunctions(jsFiles, allDocuments)
            .done(function () {
                // Filter for documents with matching functions
                allDocuments.forEach(function (docEntry) {
                    var functionsInDocument = docEntry.functions[functionName];
                    
                    if (functionsInDocument) {
                        docEntry.functions = functionsInDocument;
                        docEntries.push(docEntry);
                    }
                });
                
                // Compute offsets for all matched functions
                _getOffsets(docEntries, functionName, rangeResults).done(function () {
                    result.resolve(rangeResults);
                });
            })
            .always(function () {
                // Reset DirtyDocumentTracker now that the cache is up to date.
                _dirtyDocumentTracker.reset();
            });
        
        return result.promise();
    }

    /**
     * Finds all instances of the specified functionName in "text".
     * Returns an Array of Objects with start and end properties.
     *
     * @param text {!String} JS text to search
     * @param functionName {!String} function name to search for
     * @return {Array.<{offset:number, functionName:string}>}
     *      Array of objects containing the start offset for each matched function name.
     */
    function _findAllMatchingFunctionsInText(text, functionName) {
        var allFunctions = _findAllFunctionsInText(text);
        var result = [];
        var lines = text.split("\n");
        
        $.each(allFunctions, function (index, functions) {
            if (index === functionName || functionName === "*") {
                functions.forEach(function (funcEntry) {
                    var endOffset = _getFunctionEndOffset(text, funcEntry.offsetStart);
                    result.push({
                        name: index,
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

    exports._findAllMatchingFunctionsInText = _findAllMatchingFunctionsInText; // For testing only
    exports.findMatchingFunctions = findMatchingFunctions;
});
