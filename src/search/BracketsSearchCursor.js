/*
 * Copyright (c) 2016 - present Adobe Systems Incorporated. All rights reserved.
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
 * DEALINGS IN THE
 SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, WeakMap, Uint32Array */

define(function (require, exports, module) {
    "use strict";
    var StringUtils = require("utils/StringUtils");
    var _           = require("thirdparty/lodash");

    // store document text and index
    // key: CodeMirror.Doc
    // value: {text, index, generation}
    // text = The text of the document
    // index = The document line index for lookups
    // generation = the document history generation number
    var _documentMap = new WeakMap();

    /**
     * determine if the current document has changed since we last stored the docInfo
     * @param {CodeMirror.Doc} doc
     * @return boolean
     */
    function _needToIndexDocument(doc) {
        var docInfo = _documentMap.get(doc);

        // lastmodtime is not changed when undo is invoked.
        // so we will use the generation count to determine if the document has changed
        if ((docInfo) && (docInfo.generation === doc.history.generation)) {
            // document has not changed since we indexed
            return false;
        }
        return true;
    }

    /**
     * Create an array which stores the sum of all characters in the document
     * up to the point of each line.
     * This is needed to efficiently convert character index offsets to position objects of line and character offset.
     * @param {String} text The string to index
     * @param {String} lineSeparator The ending character that splits lines
     */
    function _createLineCharacterCountIndex(text, lineSeparator) {
        var lineNumber;
        console.time('_createLineCharacterCountIndex');
        // splitting is actually faster than using doc.getLine()
        var lines = text.split(lineSeparator);
        var lineSeparatorLength = lineSeparator.length;
        var lineCharacterCountIndex = new Uint32Array(lines.length);
        var lineCount = lines.length;
        var totalCharacterCount = 0;
        for (lineNumber = 0; lineNumber < lineCount; lineNumber++) {
            totalCharacterCount += lines[lineNumber].length + lineSeparatorLength;
            lineCharacterCountIndex[lineNumber] = totalCharacterCount;
        }
        console.timeEnd('_createLineCharacterCountIndex');
        return lineCharacterCountIndex;
    }

    /**
     * Create the document index and store in our map
     */
    function _indexDocument(doc) {
        var docText = doc.getValue();
        var docLineIndex = _createLineCharacterCountIndex(docText, doc.lineSeparator());
        _documentMap.set(doc, {text: docText, index: docLineIndex, generation: doc.history.generation});
    }

    /**
     * Get the document index
     */
    function _getDocumentIndex(doc) {
        return _documentMap.get(doc).index;
    }

    /**
     * Get the document text
     */
    function _getDocumentText(doc) {
        return _documentMap.get(doc).text;
    }


    /**
     * Convert plain text query into regular expression
     * If already regular expression, then just set the flags as appropriate
     */
    function _convertToRegularExpression(stringOrRegex, ignoreCase) {
        if (typeof stringOrRegex === "string") {
            return new RegExp(StringUtils.regexEscape(stringOrRegex), ignoreCase ? "igm" : "gm");
        } else {
            return new RegExp(stringOrRegex.source, ignoreCase ? "igm" : "gm");
        }
    }

    /**
     * From the character offset from the beginning of the document
     * create an object which has the position information in the form of:
     * @return {{line: number, ch: number}} line and character offsets
     */
    function _createPosFromIndex(lineCharacterCountIndexArray, startSearchingWithLine, indexWithinDoc) {
        var lineNumber;
        var lineCount = lineCharacterCountIndexArray.length;
        // linear search for line number turns out to be usually faster than binary search
        // as matches tend to come relatively close together and we can boost the linear
        // search performance using starting position since we often know our progress through the document.
        for (lineNumber = startSearchingWithLine; lineNumber < lineCount; lineNumber++) {
            // If the total character count at this line is greater than the index
            // then the index must be somewhere on this line
            if (lineCharacterCountIndexArray[lineNumber] > indexWithinDoc) {
                var previousLineEndingCharacterIndex = lineNumber > 0 ? lineCharacterCountIndexArray[lineNumber - 1] : 0;
                // create a Pos with the line number and the character offset relative to the beginning of this line
                return {line: lineNumber, ch: indexWithinDoc - previousLineEndingCharacterIndex };
            }
        }
    }

    /**
     * Scan entire document and callback with each match found.
     * Uses the documentIndex to more efficiently create the position objects on found matches.
     */
    function _scanDocumentUsingRegularExpression(documentIndex, documentText, regex, fnEachMatch) {
        var matchArray;
        var lastMatchedLine = 0;
        while ((matchArray = regex.exec(documentText)) !== null) {
            var startPosition = _createPosFromIndex(documentIndex, lastMatchedLine, matchArray.index);
            var endPosition = _createPosFromIndex(documentIndex, startPosition.line, regex.lastIndex);
            lastMatchedLine = endPosition.line;

            fnEachMatch(startPosition, endPosition, matchArray);
            // This is to stop infinite loop.  Some regular expressions can return 0 length match
            // which will not advance the lastindex property.  Ex ".*"
            if (matchArray.index === regex.lastIndex) {
                regex.lastIndex++;
            }
        }
    }


    /**
     * Returns the character offset from the beginning of the document based on
     * object properties as pos.from.line and pos.from.ch
     * where line is the line number in the document and ch is the character offset on the line
     */
    function _indexFromPos(lineCharacterCountIndexArray, pos) {
        var indexAtStartOfLine = 0;
        if (pos.from.line > 0) {
            // Start with the sum of the character count at the end of previous line
            indexAtStartOfLine = lineCharacterCountIndexArray[pos.from.line - 1];
        }
        // Add the number of characters offset from the start and return
        return indexAtStartOfLine + pos.from.ch;
    }

    /**
     * Return an object that indicates the beginning and end of a match from the search
     *
     */
    function _createSearchResult(docLineIndex, indexStart, indexEnd, startLine) {
        if (typeof startLine === 'undefined') {
            startLine = 0;
        }

        var fromPos = _createPosFromIndex(docLineIndex, startLine, indexStart);
        var toPos   = _createPosFromIndex(docLineIndex, fromPos.line, indexEnd);

        return {from: fromPos, to: toPos};
    }

    /**
     * comparison function for binary search of index positions within document
     */
    function _compareMatchResultToPos(matchIndex, posIndex) {
        if (matchIndex === posIndex) {
            return 0;
        } else if (matchIndex < posIndex) {
            return -1;
        } else {
            return 1;
        }
    }

    /**
     * Finds the result that is at or nearest the position passed to function.
     * If a match result is not at the position, it will then locate the closest
     * match result which is in the search direction.
     * If there is no match found before the end or beginning of the document
     * then this function returns false.
     * @param {!Object} regexIndexer instance of the regex indexer. see _createRegexIndexer
     * @param {!{to: {line: number, ch: number} pos Starting position to search from
     * @param {boolean} reverse direction to search.
     * @param {function(number, number)} fnCompare function to compare positions for binary search
     */
    function _findResultIndexNearPos(regexIndexer, pos, reverse, fnCompare) {
        var compare;
        console.time("findNext");

        var length = regexIndexer.getItemCount();
        var upperBound = length - 1;
        var lowerBound = 0;
        var searchIndex;
        while (lowerBound <= upperBound) {
            searchIndex = Math.floor((upperBound + lowerBound) / 2);
            compare = fnCompare(regexIndexer.getMatchIndexStart(searchIndex), pos);
            if (compare === 0) {
                console.timeEnd("findNext");
                return searchIndex;
            } else if (compare === -1) {
                lowerBound = searchIndex + 1;
            } else {
                upperBound = searchIndex - 1;
            }
        }
        console.timeEnd("findNext");
        // no exact match, we are at the lower bound
        // if going forward return the next index
        if ((compare === -1) && (!reverse)) {
            searchIndex += 1;
        }
        // no exact match, we are at the upper bound
        // if going reverse return the next lower index
        if ((compare === 1) && (reverse)) {
            searchIndex -= 1;
        }

        // If we went beyond the length or start, there was no match and no next index to match
        if ((searchIndex < 0) || (searchIndex >= length)) {
            return false;
        }
        // no exact match, we are already at the closest match in the search direction
        return searchIndex;
    }

    /**
     * enhance array with functions which facilitate managing the array contents
     * by groups of items.
     * This is useful for both performance and memory consumption to store the indexes
     * of the match result beginning and ending locations.
     * @param {Array} array The array to enhance
     * @param {number} groupSize The number of indices that belong to a group
     */
    function _makeGroupArray(array, groupSize) {
        var _currentGroupIndex = -groupSize;
        _.assign(array, {
            nextGroupIndex: function () {
                if (_currentGroupIndex < array.length - groupSize) {
                    _currentGroupIndex += groupSize;
                } else {
                    _currentGroupIndex = -groupSize;
                    return false;
                }
                return _currentGroupIndex;
            },
            prevGroupIndex: function () {
                if (_currentGroupIndex - groupSize > -1) {
                    _currentGroupIndex -= groupSize;
                } else {
                    _currentGroupIndex = -groupSize;
                    return false;
                }
                return _currentGroupIndex;
            },
            setCurrentGroup: function (groupNumber) {_currentGroupIndex = groupNumber * groupSize; },

            getGroupIndex: function (groupNumber) { return groupSize * groupNumber; },
            getGroupValue: function (groupNumber, valueIndexWithinGroup) {return array[(groupSize * groupNumber) + valueIndexWithinGroup]; },
            currentGroupIndex: function () { return _currentGroupIndex; },
            currentGroupNumber: function () { return _currentGroupIndex / groupSize; },
            groupSize: function () { return groupSize; },
            itemCount: function () { return array.length / groupSize; },

        });
        return array;
    }

    /**
     * Creates the regex indexer which finds all matches within supplied text using the search query.
     * Uses a lookup index to efficiently map regular expression result indexes to position used by Brackets
     * @param {String} docText the text to search for matches
     * @param {Array} docLineIndex array used to map indexes to positions
     * @param {RegExp} query a regular expression used to find matches
     */
    function _createRegexIndexer(docText, docLineIndex, query) {
        // Start and End index of each match stored in array as:
        // [0] = start index of first match
        // [1] = end index of first match
        // ...
        // Each pair of start and end is considered a group when using the group array
        var _startEndIndexArray = _makeGroupArray([], 2);

        function nextMatch() {
            var currentMatchIndex = _startEndIndexArray.nextGroupIndex();
            if (currentMatchIndex === false) {
                return false;
            }
            // TODO potentially could be optimized if we could pass in the prev match line for starting search
            // However, seems very fast already for current use case
            return _createSearchResult(docLineIndex, _startEndIndexArray[currentMatchIndex], _startEndIndexArray[currentMatchIndex + 1]);
        }

        function prevMatch() {
            var currentMatchIndex = _startEndIndexArray.prevGroupIndex();
            if (currentMatchIndex === false) {
                return false;
            }
            return _createSearchResult(docLineIndex, _startEndIndexArray[currentMatchIndex], _startEndIndexArray[currentMatchIndex + 1]);
        }

        function getItemByMatchNumber(matchNumber) {
            var groupIndex = _startEndIndexArray.getGroupIndex(matchNumber);
            return _createSearchResult(docLineIndex, _startEndIndexArray[groupIndex], _startEndIndexArray[groupIndex + 1]);
        }

        function forEachMatch(fnMatch) {
            var index;
            var length = _startEndIndexArray.itemCount();
            var lastLine = 0;
            for (index = 0; index < length; index++) {
                var groupIndex = _startEndIndexArray.getGroupIndex(index);
                var fromPos = _createPosFromIndex(docLineIndex, lastLine, _startEndIndexArray[groupIndex]);
                var toPos = _createPosFromIndex(docLineIndex, fromPos.line, _startEndIndexArray[groupIndex + 1]);
                lastLine = toPos.line;
                fnMatch(fromPos, toPos);
            }
        }

        function getItemCount() {
            return _startEndIndexArray.itemCount();
        }

        function getCurrentMatch() {
            var currentMatchIndex = _startEndIndexArray.currentGroupIndex();
            if (currentMatchIndex > -1) {
                return _createSearchResult(docLineIndex, _startEndIndexArray[currentMatchIndex], _startEndIndexArray[currentMatchIndex + 1]);
            }
        }

        function getMatchIndexStart(matchNumber) {
            return _startEndIndexArray.getGroupValue(matchNumber, 0);
        }

        function getMatchIndexEnd(matchNumber) {
            return _startEndIndexArray.getGroupValue(matchNumber, 1);
        }

        function setCurrentMatchNumber(number) {
            _startEndIndexArray.setCurrentGroup(number);
        }

        function getCurrentMatchNumber() {
            return _startEndIndexArray.currentGroupNumber();
        }

        function getFullResultInfo(matchNumber, query, docText) {
            var groupIndex = _startEndIndexArray.getGroupIndex(matchNumber);
            query.lastIndex = _startEndIndexArray[groupIndex];
            var matchInfo = query.exec(docText);
            var currentMatch = getCurrentMatch();
            currentMatch.match = matchInfo;
            return currentMatch;
        }

        function _createSearchResults(docText, query) {
            console.time("exec");
            var matchArray;
            var index = 0;
            while ((matchArray = query.exec(docText)) !== null) {
                _startEndIndexArray[index++] = matchArray.index;
                _startEndIndexArray[index++] = query.lastIndex;
                // This is to stop infinite loop.  Some regular expressions can return 0 length match
                // which will not advance the lastindex property.  Ex ".*"
                if (matchArray.index === query.lastIndex) {
                    query.lastIndex++;
                }
            }
            console.timeEnd("exec");
            return _startEndIndexArray;
        }
        _createSearchResults(docText, query);
        return {nextMatch : nextMatch,
                prevMatch : prevMatch,
                getItemByMatchNumber : getItemByMatchNumber,
                getItemCount : getItemCount,
                getCurrentMatch : getCurrentMatch,
                setCurrentMatchNumber : setCurrentMatchNumber,
                getMatchIndexStart : getMatchIndexStart,
                getMatchIndexEnd : getMatchIndexEnd,
                getCurrentMatchNumber : getCurrentMatchNumber,
                getFullResultInfo : getFullResultInfo,
                forEachMatch : forEachMatch
            };
    }


    /**
     * Create a regular expression cursor object that this module will provide to consumers
     **/
    function _createCursor() {
        function _findNext(cursor) {
            var match = cursor.regexIndexer.nextMatch();
            if (!match) {
                cursor.atOccurrence = false;
                cursor.currentMatch = {line: cursor.doc.lineCount(), ch: 0};
                return false;
            }
            return match;
        }
        function _findPrevious(cursor) {
            var match = cursor.regexIndexer.prevMatch();
            if (!match) {
                cursor.atOccurrence = false;
                cursor.currentMatch = {line: 0, ch: 0};
                return false;
            }
            return match;
        }

        function _updateResultsIfNeeded(cursor) {
            if (_needToIndexDocument(cursor.doc)) {
                _indexDocument(cursor.doc);
                cursor.resultsCurrent = false;
            }
            if (!cursor.resultsCurrent) {
                cursor.scanDocumentAndStoreResultsInCursor();
            }
        }
        function _setQuery(cursor, query) {
            var newRegexQuery = _convertToRegularExpression(query, cursor.ignoreCase);
            if ((cursor.query) && (cursor.query.source !== newRegexQuery.source)) {
                // query has changed
                cursor.resultsCurrent = false;
            }
            cursor.query = newRegexQuery;
        }
        /**
         * Set the location of where the search cursor should be located
         * @param {!Object} cursor The search cursor
         * @param {!{line: number, ch: number}} pos The search cursor location
         */
        function _setPos(cursor, pos) {
            pos = pos || {line: 0, ch: 0};
            cursor.currentMatch = {from: pos, to: pos};
        }

        // Return all public functions for the cursor
        return _.assign(Object.create(null), {
            /**
             * Set or update the document and query properties
             * @param {!{document: CodeMirror.Doc, searchQuery: string|RegExp, position: {line: number, ch: number}, ignoreCase: boolean}} properties
             */
            setSearchDocumentAndQuery: function (properties) {
                this.atOccurrence = false;
                if (properties.ignoreCase) {this.ignoreCase = properties.ignoreCase; }
                if (properties.document) {this.doc = properties.document; }
                if (properties.searchQuery) {_setQuery(this, properties.searchQuery); }
                if (properties.position) {_setPos(this, properties.position); }
            },

            /**
             * Get the total number of characters in the document
             * @return {number}
             */
            getDocCharacterCount: function () {
                _updateResultsIfNeeded(this);
                var docLineIndex = _getDocumentIndex(this.doc);
                return docLineIndex[docLineIndex.length - 1];
            },

            /**
             * Get the total number of matches
             * @return {number}
             */
            getMatchCount: function () {
                _updateResultsIfNeeded(this);
                return this.regexIndexer.getItemCount();
            },

            /**
             * Get the current match number counting from the first match.
             * @return {number}
             */
            getCurrentMatchNumber: function () {
                _updateResultsIfNeeded(this);
                return this.regexIndexer.getCurrentMatchNumber();
            },

            /**
             * Find the next match in the indicated search direction
             * @param {boolean} reverse true searches backwards. false searches forwards
             * @return {{to: {line: number, ch: number}, from: {line: number, ch: number}}}
             */
            find: function (reverse) {
                _updateResultsIfNeeded(this);
                var foundPosition;
                if (!this.regexIndexer.getCurrentMatch()) {
                    // There is currently no match position
                    // This is our first time or we hit the top or end of document using next or prev
                    var docLineIndex = _getDocumentIndex(this.doc);
                    var matchIndex = _findResultIndexNearPos(this.regexIndexer, _indexFromPos(docLineIndex, this.currentMatch), reverse, _compareMatchResultToPos);
                    if (matchIndex) {
                        this.regexIndexer.setCurrentMatchNumber(matchIndex);
                        foundPosition = this.regexIndexer.getCurrentMatch();
                    }
                }
                if (!foundPosition) {
                    foundPosition = reverse ? _findPrevious(this) : _findNext(this);
                }
                if (foundPosition) {
                    this.currentMatch = foundPosition;
                    this.atOccurrence = !(!foundPosition);
                }
                return foundPosition;
            },

            /**
             * Iterate over each result from searching the document calling the function with the start and end positions of each match
             * @param {function({line: number, ch: number}, {line: number, ch: number})} fnResult
             */
            forEachMatch: function (fnResult) {
                _updateResultsIfNeeded(this);
                this.regexIndexer.forEachMatch(fnResult);
            },

            /**
             * Get the start and end positions plus the regular expression match array data
             * @return {{to: {line: number, ch: number}, from: {line: number, ch: number}, match: Array}} returns start and end of match with the array of results
             */
            getFullInfoForCurrentMatch: function () {
                var docText = _getDocumentText(this.doc);
                return this.regexIndexer.getFullResultInfo(this.regexIndexer.getCurrentMatchNumber(), this.query, docText);
            },

            /**
             * Find the indexes of all matches based on the current search query
             * The matches can then be navigated and retrieved using the functions of the search cursor.
             *
             * @return {number} the count of matches found.
             */
            scanDocumentAndStoreResultsInCursor: function () {
                if (_needToIndexDocument(this.doc)) {
                    _indexDocument(this.doc);
                }
                var docText = _getDocumentText(this.doc);
                var docLineIndex = _getDocumentIndex(this.doc);
                this.regexIndexer = _createRegexIndexer(docText, docLineIndex, this.query);
                this.resultsCurrent = true;
                return this.getMatchCount();
            }
        });
    }

    /**
     * Creates an updatable search cursor which can be used to navigate forward and backward through the results.
     *
     * @param {!{document: CodeMirror.Doc, searchQuery: string|RegExp, position: {line: number, ch: number}, ignoreCase: boolean}} properties
     * @return {Object} The search cursor object
     */
    function createSearchCursor(properties) {
        console.log("creating new search cursor");
        var searchCursor = _createCursor();
        searchCursor.setSearchDocumentAndQuery(properties);
        return searchCursor;
    }

    /**
     * Scans the entire document for regular expression matches and calls fnEachMatch for each found match.
     * Unlike the search cursor, this creates no retained results to be used for back and forward navigation.
     * This is provided for consumers who wish to leverage the speed provided by the document index, but do
     * not need to use the features of a cursor.
     *
     * @param {!{document: CodeMirror.Doc, searchQuery: string|RegExp, ignoreCase: boolean, fnEachMatch: function}} properties
     */
    function scanDocumentForMatches(properties) {
        if (_needToIndexDocument(properties.document)) {
            _indexDocument(properties.document);
        }
        var regex = _convertToRegularExpression(properties.searchQuery, properties.ignoreCase);
        _scanDocumentUsingRegularExpression(_getDocumentIndex(properties.document), _getDocumentText(properties.document), regex, properties.fnEachMatch);
    }

    exports.createSearchCursor = createSearchCursor;
    exports.scanDocumentForMatches = scanDocumentForMatches;
});
