/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, $ */

/**
 * Set of utilities for simple parsing of JS text.
 */
define(function (require, exports, module) {
    "use strict";

    var _ = require("thirdparty/lodash");

    // Load brackets modules
    var CodeMirror              = require("thirdparty/CodeMirror/lib/codemirror"),
        Async                   = require("utils/Async"),
        DocumentManager         = require("document/DocumentManager"),
        ChangedDocumentTracker  = require("document/ChangedDocumentTracker"),
        FileSystem              = require("filesystem/FileSystem"),
        FileUtils               = require("file/FileUtils"),
        PerfUtils               = require("utils/PerfUtils"),
        StringUtils             = require("utils/StringUtils");

    /**
     * Tracks dirty documents between invocations of findMatchingFunctions.
     * @type {ChangedDocumentTracker}
     */
    var _changedDocumentTracker = new ChangedDocumentTracker();

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

            if (!Array.isArray(results[functionName])) {
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
     * Read a file and build a function list. Result is cached in fileInfo.
     * @param {!FileInfo} fileInfo File to parse
     * @param {!$.Deferred} result Deferred to resolve with all functions found and the document
     */
    function _readFile(fileInfo, result) {
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

    /**
     * Determines if the document function cache is up to date.
     * @param {FileInfo} fileInfo
     * @return {$.Promise} A promise resolved with true with true when a function cache is available for the document. Resolves
     *   with false when there is no cache or the cache is stale.
     */
    function _shouldGetFromCache(fileInfo) {
        var result = new $.Deferred(),
            isChanged = _changedDocumentTracker.isPathChanged(fileInfo.fullPath);

        if (isChanged && fileInfo.JSUtils) {
            // See if it's dirty and in the working set first
            var doc = DocumentManager.getOpenDocumentForPath(fileInfo.fullPath);

            if (doc && doc.isDirty) {
                result.resolve(false);
            } else {
                // If a cache exists, check the timestamp on disk
                var file = FileSystem.getFileForPath(fileInfo.fullPath);

                file.stat(function (err, stat) {
                    if (!err) {
                        result.resolve(fileInfo.JSUtils.timestamp.getTime() === stat.mtime.getTime());
                    } else {
                        result.reject(err);
                    }
                });
            }
        } else {
            // Use the cache if the file did not change and the cache exists
            result.resolve(!isChanged && fileInfo.JSUtils);
        }

        return result.promise();
    }

    /**
     * @private
     * Compute lineStart and lineEnd for each matched function
     * @param {!Array.<{doc: Document, fileInfo: FileInfo, functions: Array.<offsetStart: number, offsetEnd: number>}>} docEntries
     * @param {!string} functionName
     * @param {!Array.<document: Document, name: string, lineStart: number, lineEnd: number>} rangeResults
     * @return {$.Promise} A promise resolved with an array of document ranges to populate a MultiRangeInlineEditor.
     */
    function _getOffsetsForFunction(docEntries, functionName) {
        // Filter for documents that contain the named function
        var result              = new $.Deferred(),
            matchedDocuments    = [],
            rangeResults        = [];

        docEntries.forEach(function (docEntry) {
            // Need to call _.has here since docEntry.functions could have an
            // entry for "hasOwnProperty", which results in an error if trying
            // to invoke docEntry.functions.hasOwnProperty().
            if (_.has(docEntry.functions, functionName)) {
                var functionsInDocument = docEntry.functions[functionName];
                matchedDocuments.push({doc: docEntry.doc, fileInfo: docEntry.fileInfo, functions: functionsInDocument});
            }
        });

        Async.doInParallel(matchedDocuments, function (docEntry) {
            var doc         = docEntry.doc,
                oneResult   = new $.Deferred();

            // doc will be undefined if we hit the cache
            if (!doc) {
                DocumentManager.getDocumentForPath(docEntry.fileInfo.fullPath)
                    .done(function (fetchedDoc) {
                        _computeOffsets(fetchedDoc, functionName, docEntry.functions, rangeResults);
                    })
                    .always(function () {
                        oneResult.resolve();
                    });
            } else {
                _computeOffsets(doc, functionName, docEntry.functions, rangeResults);
                oneResult.resolve();
            }

            return oneResult.promise();
        }).done(function () {
            result.resolve(rangeResults);
        });

        return result.promise();
    }

    /**
     * Resolves with a record containing the Document or FileInfo and an Array of all
     * function names with offsets for the specified file. Results may be cached.
     * @param {FileInfo} fileInfo
     * @return {$.Promise} A promise resolved with a document info object that
     *   contains a map of all function names from the document and each function's start offset.
     */
    function _getFunctionsForFile(fileInfo) {
        var result = new $.Deferred();

        _shouldGetFromCache(fileInfo)
            .done(function (useCache) {
                if (useCache) {
                    // Return cached data. doc property is undefined since we hit the cache.
                    // _getOffsets() will fetch the Document if necessary.
                    result.resolve({/*doc: undefined,*/fileInfo: fileInfo, functions: fileInfo.JSUtils.functions});
                } else {
                    _readFile(fileInfo, result);
                }
            }).fail(function (err) {
                result.reject(err);
            });

        return result.promise();
    }

    /**
     * @private
     * Get all functions for each FileInfo.
     * @param {Array.<FileInfo>} fileInfos
     * @return {$.Promise} A promise resolved with an array of document info objects that each
     *   contain a map of all function names from the document and each function's start offset.
     */
    function _getFunctionsInFiles(fileInfos) {
        var result      = new $.Deferred(),
            docEntries  = [];

        PerfUtils.markStart(PerfUtils.JSUTILS_GET_ALL_FUNCTIONS);

        Async.doInParallel(fileInfos, function (fileInfo) {
            var oneResult = new $.Deferred();

            _getFunctionsForFile(fileInfo)
                .done(function (docInfo) {
                    docEntries.push(docInfo);
                })
                .always(function (error) {
                    // If one file fails, continue to search
                    oneResult.resolve();
                });

            return oneResult.promise();
        }).always(function () {
            // Reset ChangedDocumentTracker now that the cache is up to date.
            _changedDocumentTracker.reset();

            PerfUtils.addMeasurement(PerfUtils.JSUTILS_GET_ALL_FUNCTIONS);
            result.resolve(docEntries);
        });

        return result.promise();
    }

    /**
     * Return all functions that have the specified name, searching across all the given files.
     *
     * @param {!String} functionName The name to match.
     * @param {!Array.<File>} fileInfos The array of files to search.
     * @param {boolean=} keepAllFiles If true, don't ignore non-javascript files.
     * @return {$.Promise} that will be resolved with an Array of objects containing the
     *      source document, start line, and end line (0-based, inclusive range) for each matching function list.
     *      Does not addRef() the documents returned in the array.
     */
    function findMatchingFunctions(functionName, fileInfos, keepAllFiles) {
        var result  = new $.Deferred(),
            jsFiles = [];

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
            _getOffsetsForFunction(docEntries, functionName).done(function (rangeResults) {
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
