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
/*global define, $, brackets, PathUtils, CodeMirror */

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
    
    // Return an Array with names and offsets for all functions in the specified text
    function _findAllFunctionsInText(text) {
        var result = [];
        var regexA = new RegExp(/(function\b)([^)]+)\b\([^)]*\)/gi);  // recognizes the form: function functionName()
        var regexB = new RegExp(/(\w+)\s*[:=]\s*function\s*(\([^)]*\))/gi); // recognizes functionName = function() and functionName: function()
        var match;
        
        while ((match = regexA.exec(text)) !== null) {
            result.push({
                functionName: match[2].trim(),
                offset: match.index
            });
        }
        
        while ((match = regexB.exec(text)) !== null) {
            result.push({
                functionName: match[1].trim(),
                offset: match.index
            });
        }
        
        return result;
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
    
    // Search function list for a specific function. If found, extract info about the function
    // (line start, line end, etc.) and return.
    function _findAllMatchingFunctions(fileInfo, functions, functionName) {
        var result = new $.Deferred();
        var matchingFunctions = [];
        
        // Filter the list of functions to just the ones that refer to functionName.
        functions = functions.filter(function (funcEntry) {
            return funcEntry.functionName === functionName;
        });
        if (functions.length === 0) {
            return result.resolve([]).promise();
        }
        
        DocumentManager.getDocumentForPath(fileInfo.fullPath)
            .done(function (doc) {
                var text = doc.getText();
                var lines = StringUtils.getLines(text);
                
                functions.forEach(function (funcEntry) {
                    var endOffset = _getFunctionEndOffset(text, funcEntry.offset);
                    matchingFunctions.push({
                        document: doc,
                        name: funcEntry.functionName,
                        lineStart: StringUtils.offsetToLineNum(lines, funcEntry.offset),
                        lineEnd: StringUtils.offsetToLineNum(lines, endOffset)
                    });
                });
                
                result.resolve(matchingFunctions);
            })
            .fail(function (error) {
                result.reject(error);
            });
        
        return result.promise();
    }
    
    // Read a file and build a function list. Result is cached in fileInfo.
    function _readFileAndGetFunctionList(fileInfo, result) {
        DocumentManager.getDocumentForPath(fileInfo.fullPath)
            .done(function (doc) {
                var allFunctions = _findAllFunctionsInText(doc.getText());
                
                // Cache the result in the fileInfo object
                fileInfo.JSUtils = {};
                fileInfo.JSUtils.functions = allFunctions;
                fileInfo.JSUtils.timestamp = doc.diskTimestamp;
                
                result.resolve(allFunctions);
            })
            .fail(function (error) {
                result.reject(error);
            });
    }
    
    // Resolves with an Array of all function names and offsets for the specified file. Results
    // may be cached.
    function _getFunctionListForFile(fileInfo) {
        PerfUtils.markStart(PerfUtils.FUNCTION_LIST_FOR_FILE);
        
        var result = new $.Deferred();
        var needToRead = false;
        
        // Always read if we have no cached data
        if (!fileInfo.JSUtils) {
            needToRead = true;
        }
        
        // If the document is dirty, we need to read it
        if (!needToRead) {
            var openDocs = DocumentManager.getAllOpenDocuments();
            openDocs.forEach(function (doc) {
                if (doc.file.fullPath === fileInfo.fullPath && doc.isDirty) {
                    needToRead = true;
                }
            });
        }
        
        // Finally, see if we have missing or stale cache data
        if (!needToRead) {
            var file = new NativeFileSystem.FileEntry(fileInfo.fullPath);
            
            file.getMetadata(
                function (metadata) {
                    if (fileInfo.JSUtils.timestamp !== metadata.diskTimestamp) {
                        _readFileAndGetFunctionList(fileInfo, result);
                    } else {
                        // Return cached data 
                        result.resolve(fileInfo.JSUtils.functions);
                    }
                },
                function (error) {
                    result.reject(error);
                }
            );
        } else {
            _readFileAndGetFunctionList(fileInfo, result);
        }
        
        result.always(function () {
            PerfUtils.addMeasurement(PerfUtils.FUNCTION_LIST_FOR_FILE);
        });
                        
        return result.promise();
    }
        
    // Search for all matching functions in a file
    function _getMatchingFunctionsInFile(fileInfo, functionName, resultFunctions) {
        var oneFileResult = new $.Deferred();
        var fullPath = fileInfo.fullPath;
        
        // Only scan JS files
        var ext = PathUtils.filenameExtension(fullPath);
        
        if (!/^\.js/i.test(ext)) {
            oneFileResult.resolve();
            return oneFileResult.promise();
        }
        
        _getFunctionListForFile(fileInfo)
            .done(function (functionList) {
                _findAllMatchingFunctions(fileInfo, functionList, functionName)
                    .done(function (matches) {
                        matches.forEach(function (functionInfo) {
                            resultFunctions.push(functionInfo);
                        });
                        oneFileResult.resolve();
                    })
                    .fail(function (error) {
                        oneFileResult.reject(error);
                    });
            })
            .fail(function (error) {
                oneFileResult.reject(error);
            });
    
        return oneFileResult.promise();
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
            resultFunctions = [];
        
        // Process each JS file in turn (see above)
        // FUTURE: when we have async I/O, sort these in a predictable order
        Async.doInParallel(fileInfos, function (fileInfo) {
            return _getMatchingFunctionsInFile(fileInfo, functionName, resultFunctions);
        })
            .done(function () {
                result.resolve(resultFunctions);
            })
            .fail(function (error) {
                result.reject(error);
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
         
        allFunctions.forEach(function (funcEntry) {
            if (funcEntry.functionName === functionName || functionName === "*") {
                var endOffset = _getFunctionEndOffset(text, funcEntry.offset);
                result.push({
                    name: funcEntry.functionName,
                    lineStart: StringUtils.offsetToLineNum(lines, funcEntry.offset),
                    lineEnd: StringUtils.offsetToLineNum(lines, endOffset)
                });
            }
        });
         
        return result;
    }
    
    // init
    PerfUtils.createPerfMeasurement("FUNCTION_LIST_FOR_FILE", "JSUtils - Search 1 File");

    exports._findAllMatchingFunctionsInText = _findAllMatchingFunctionsInText; // For testing only
    exports._getFunctionEndOffset = _getFunctionEndOffset; // For testing only
    exports.findMatchingFunctions = findMatchingFunctions;
});
