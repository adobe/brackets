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
        FileIndexManager    = brackets.getModule("project/FileIndexManager"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem;
    
    // Return an Array with names and offsets for all functions in the specified text
    function _findAllFunctionsInText(text) {
        var result = [];
        var regexA = new RegExp(/(function\b)(.+)\b\(.*?\)/gi);  // recognizes the form: function functionName()
        var regexB = new RegExp(/(\w+)\s*=\s*function\s*(\(.*?\))/gi); // recognizes the form: functionName = function()
        var regexC = new RegExp(/((\w+)\s*:\s*function\s*\(.*?\))/gi); // recognizes the form: functionName: function()
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
        
        while ((match = regexC.exec(text)) !== null) {
            result.push({
                functionName: match[2].trim(),
                offset: match.index
            });
        }
        
        return result;
    }
    
    // Simple scanner to determine the end offset for the function (the closing "}") 
    function _getFunctionEndOffset(text, offsetStart) {
        var curOffset = text.indexOf("{", offsetStart) + 1;
        var length = text.length;
        var blockCount = 1;
        
        // Brute force scan to look for closing curly match
        // NOTE: This does *not* handle comments.
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
    
    function _offsetToLineNum(text, offset) {
        return text.substr(0, offset).split("\n").length - 1;
    }
    
    // Search function list for a specific function. If found, extract info about the function
    // (line start, line end, etc.) and return.
    function _findAllMatchingFunctions(fileInfo, functions, functionName) {
        var result = new $.Deferred();
        var foundMatch = false;
        
        functions.forEach(function (funcEntry) {
            if (funcEntry.functionName === functionName) {
                var matchingFunctions = [];
                
                DocumentManager.getDocumentForPath(fileInfo.fullPath)
                    .done(function (doc) {
                        var text = doc.getText();
                        
                        functions.forEach(function (funcEntry) {
                            if (funcEntry.functionName === functionName) {
                                var endOffset = _getFunctionEndOffset(text, funcEntry.offset);
                                matchingFunctions.push({
                                    document: doc,
                                    name: funcEntry.functionName,
                                    lineStart: _offsetToLineNum(text, funcEntry.offset),
                                    lineEnd: _offsetToLineNum(text, endOffset)
                                });
                            }
                        });
                        
                        result.resolve(matchingFunctions);
                    })
                    .fail(function (error) {
                        result.reject(error);
                    });
            }
        });
        
        if (!foundMatch) {
            result.resolve([]);
        }
        
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
     * @return {$.Promise} that will be resolved with an Array of objects containing the
     *      source document, start line, and end line (0-based, inclusive range) for each matching function list.
     *      Does not addRef() the documents returned in the array.
     */
    function findMatchingFunctions(functionName) {
        var result          = new $.Deferred(),
            resultFunctions = [],
            jsFilesResult   = FileIndexManager.getFileInfoList("all");
        
        // Load index of all CSS files; then process each CSS file in turn (see above)
        jsFilesResult.done(function (fileInfos) {
            Async.doInParallel(fileInfos, function (fileInfo, number) {
                return _getMatchingFunctionsInFile(fileInfo, functionName, resultFunctions);
            })
                .done(function () {
                    result.resolve(resultFunctions);
                })
                .fail(function (error) {
                    result.reject(error);
                });
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
        
        allFunctions.forEach(function (funcEntry) {
            if (funcEntry.functionName === functionName) {
                var endOffset = _getFunctionEndOffset(text, funcEntry.offset);
                result.push({
                    name: funcEntry.functionName,
                    lineStart: _offsetToLineNum(text, funcEntry.offset),
                    lineEnd: _offsetToLineNum(text, endOffset)
                });
            }
        });
        
        return result;
    }

    exports._findAllMatchingFunctionsInText = _findAllMatchingFunctionsInText; // For testing only
    exports.findMatchingFunctions = findMatchingFunctions;
});
