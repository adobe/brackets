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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $ */

define(function (require, exports, module) {
    "use strict";
    var CodeMirror  = require("thirdparty/CodeMirror/lib/codemirror");
    var StringUtils = require("utils/StringUtils");
    var _           = require("thirdparty/lodash");

    var Pos = CodeMirror.Pos;
    // store document text and index
    // key: doc
    // value: {text, index, generation}
    var documentMap = new WeakMap();

    function needToIndexDocument(doc) {
        var docInfo = documentMap.get(doc);

        // lastmodtime is not changed when undo is invoked.
        // so we will use the generation count to determine if the document has changed
        if ((docInfo) && (docInfo.generation === doc.history.generation)) {
            // document has not changed since we indexed
            return false;
        }
        return true;
    }

    function createLineCharacterCountIndex(text, lineSeparator) {
        console.time('createLineCharacterCountIndex');
        // splitting is actually faster than using doc.getLine()
        var lines = text.split(lineSeparator);
        var lineSeparatorLength = lineSeparator.length;
        var lineCharacterCountIndex = [];
        var lineCount = lines.length;
        var totalCharacterCount = 0;
        for (var lineNumber = 0; lineNumber < lineCount; lineNumber++) {
            totalCharacterCount += lines[lineNumber].length + lineSeparatorLength;
            lineCharacterCountIndex[lineNumber] = totalCharacterCount;
        }
        console.timeEnd('createLineCharacterCountIndex');
        return lineCharacterCountIndex;
    }

    function createPosFromIndex(lineCharacterCountIndexArray, startSearchingWithLine, indexWithinDoc) {
        var lineCount = lineCharacterCountIndexArray.length;
        for ( var lineNumber = startSearchingWithLine; lineNumber < lineCount; lineNumber++) {
            // If the total character count at this line is greater than the index
            // then the index must be somewhere on this line
            if (lineCharacterCountIndexArray[lineNumber] > indexWithinDoc) {
                var previousLineEndingCharacterIndex = lineNumber > 0 ? lineCharacterCountIndexArray[lineNumber - 1] : 0;
                // create a Pos with the line number and the character offset relative to the beginning of this line
                return {line: lineNumber, ch: indexWithinDoc - previousLineEndingCharacterIndex };
            }
        }
    }

    function indexFromPos(lineCharacterCountIndexArray, pos) {
        var indexAtStartOfLine = 0;
        if ( pos.from.line > 0) {
            // Start with the sum of the character count at the end of previous line
            indexAtStartOfLine = lineCharacterCountIndexArray[pos.from.line - 1];
        }
        // Add the number of characters offset from the start and return
        return indexAtStartOfLine + pos.from.ch;
    }

    function createSearchResult(docLineIndex, indexStart, indexEnd) {
        // TODO, need to fix the linear search start
        // use binary search when possible
        var fromPos = createPosFromIndex(docLineIndex, 0, indexStart);
        var toPos   = createPosFromIndex(docLineIndex, fromPos.line,    indexEnd);
            //lastMatchedLine = toPos.line;
        return {from: fromPos, to: toPos};
    }

    function compareMatchResultToPos(matchIndex, posIndex) {
        if (matchIndex === posIndex) {
            return 0;
        } else if (matchIndex < posIndex) {
            return -1;
        } else {
            return 1;
        }
    }

    function findResultIndexNearPos(regexIndexer, pos, reverse, fnCompare) {
        console.time("findNext");

        var lowerBound = 0;
        var upperBound = regexIndexer.getItemCount() - 1;
        var searchIndex;
        while(lowerBound <= upperBound) {
            searchIndex = Math.floor((upperBound + lowerBound) / 2);
            var compare = fnCompare(regexIndexer.getMatchIndexStart(searchIndex), pos);
            if (compare === 0) {
                console.timeEnd("findNext");
                return searchIndex;
            }
            else if (compare === -1) {
                lowerBound = searchIndex + 1;
            }
            else {
                upperBound = searchIndex - 1;
            }
        }
        console.timeEnd("findNext");
        // no exact match, we are at the lower bound
        // if going forward return the next index
        if (( compare === -1 ) && (!reverse))
            return searchIndex + 1;
        // no exact match, we are at the upper bound
        // if going reverse return the next lower index
        if (( compare === 1 ) && (reverse))
            return searchIndex - 1;

        // no exact match, we are already at the closest match in the search direction
        return searchIndex;
    }

    function enhanceArray(array, groupSize) {
        var currentGroupIndex = 0;
        _.assign(array, {
            nextGroupIndex: function() {
                if ( currentGroupIndex < array.length - groupSize ) {
                    currentGroupIndex += groupSize;
                } else {
                    currentGroupIndex = -groupSize;
                    return false;
                }
                return currentGroupIndex;
            },
            prevGroupIndex: function() {
                if ( currentGroupIndex - groupSize > -1 ) {
                    currentGroupIndex -= groupSize;
                } else {
                    currentGroupIndex = -groupSize;
                    return false;
                }
                return currentGroupIndex;
            },
            getGroupIndex: function(groupNumber) { return groupSize * groupNumber},
            getGroupValue: function(groupNumber, valueIndexWithinGroup) {return array[(groupSize * groupNumber) + valueIndexWithinGroup]},
            currentGroupIndex: function() { return currentGroupIndex },
            currentGroupNumber: function() { return currentGroupIndex / groupSize},
            setCurrentGroup: function(groupNumber) {currentGroupIndex = groupNumber * groupSize},
            groupSize: function() { return groupSize },
            itemCount: function() { return array.length / groupSize},

        });
        return array;
    }

    function createIndexer(docText, docLineIndex, query) {
        var resultArray = enhanceArray([], 2);

        function nextMatch() {
            var currentMatchIndex = resultArray.nextGroupIndex();
            if (!currentMatchIndex) return false;
            return createSearchResult(docLineIndex, resultArray[currentMatchIndex], resultArray[currentMatchIndex+1]);
        }

        function prevMatch() {
            var currentMatchIndex = resultArray.prevGroupIndex();
            if (!currentMatchIndex) return false;
            return createSearchResult(docLineIndex, resultArray[currentMatchIndex], resultArray[currentMatchIndex+1]);
        }

        function getItemByMatchNumber(matchNumber) {
            var groupIndex = resultArray.getGroupIndex(matchNumber);
            return createSearchResult(docLineIndex, resultArray[groupIndex], resultArray[groupIndex+1]);
        }

        function getItemCount() {
            return resultArray.itemCount();
        }

        function getCurrentMatch() {
            var currentMatchIndex = resultArray.currentGroupIndex();
            if (currentMatchIndex > -1)
                return createSearchResult(docLineIndex, resultArray[currentMatchIndex], resultArray[currentMatchIndex+1]);
        }

        function getMatchIndexStart(matchNumber) {
            return resultArray.getGroupValue(matchNumber, 0);
        }

        function getMatchIndexEnd(matchNumber) {
            return resultArray.getGroupValue(matchNumber, 1);
        }

        function setCurrentMatchNumber(number) {
            resultArray.setCurrentGroup(number);
        }

        function getCurrentMatchNumber() {
            return resultArray.currentGroupNumber();
        }

        function createSearchResults(docText, query) {
            console.time("exec");
            var matchArray;
            var lastMatchedLine = 0;
            var index = 0;
            while ((matchArray = query.exec(docText)) != null) {
                resultArray[index++] = matchArray.index;
                resultArray[index++] = query.lastIndex;
                // This is to stop infinite loop.  Some regular expressions can return 0 length match
                // which will not advance the lastindex property.  Ex ".*"
                if ( matchArray.index === query.lastIndex ) query.lastIndex++;
            };
            console.timeEnd("exec");
            return resultArray;
        }
        createSearchResults(docText, query);
        return {nextMatch:nextMatch,
                prevMatch:prevMatch,
                getItemByMatchNumber:getItemByMatchNumber,
                getItemCount:getItemCount,
                getCurrentMatch:getCurrentMatch,
                setCurrentMatchNumber:setCurrentMatchNumber,
                getMatchIndexStart:getMatchIndexStart,
                getMatchIndexEnd:getMatchIndexEnd,
                getCurentMatchNumber:getCurrentMatchNumber
               }
    }


    function SearchCursor() {

    }

    SearchCursor.prototype = {
        initialize: function(query, pos, doc, ignoreCase) {
            this.atOccurrence = false;
            this.setIgnoreCase(ignoreCase);
            this.setDoc(doc);
            this.setQuery(query);
            this.setPos(pos);
        },
        setIgnoreCase: function(ignoreCase) {
            this.ignoreCase = ignoreCase;
        },
        setQuery: function(query) {
            var newRegexQuery;
            if (typeof query === "string") {
                // transform plain text query into a regular expression
                newRegexQuery = new RegExp(StringUtils.regexEscape(query), this.ignoreCase ? "igm" : "gm");
            } else {
                newRegexQuery = new RegExp(query.source, this.ignoreCase ? "igm" : "gm");
            }
            if ((this.query) && (this.query.source !== newRegexQuery.source)) {
                // query has changed
                this.resultsCurrent = false;
            }
            this.query = newRegexQuery;
        },
        setPos: function(pos) {
            pos = pos ? this.doc.clipPos(pos) : Pos(0, 0);
            this.currentMatch = {
                from: pos,
                to: pos
            };
        },
        setDoc: function(doc) {
            console.time('setDoc');
            this.doc = doc;
            if (needToIndexDocument(doc)) {
                var docText = doc.getValue();
                var docLineIndex = createLineCharacterCountIndex(docText, doc.lineSeparator());
                documentMap.set(doc, {text: docText, index: docLineIndex, generation: doc.history.generation});
                this.resultsCurrent = false;
            }
            console.timeEnd('setDoc');
        },

        getDocCharacterCount: function(){
            var docLineIndex = documentMap.get(this.doc).index;
            return docLineIndex[docLineIndex.length - 1];
        },

        getMatchCount: function() {
            return this.regexIndexer.getItemCount();
        },

        getCurrentMatchIndex: function() {
            return this.regexIndexer.getCurentMatchNumber();
        },

        findNext: function() {
            var match = this.regexIndexer.nextMatch();
            if ( !match ) {
                this.atOccurrence = false;
                this.currentMatch = Pos(this.doc.lineCount(), 0);
                return false;
            }
            return match;
        },
        findPrevious: function() {
            var match = this.regexIndexer.prevMatch();
            if ( !match ) {
                this.atOccurrence = false;
                this.currentMatch = Pos(0,0);
                return false;
            }
            return match;
        },

        from: function () {
            if (this.atOccurrence) return this.currentMatch.from;
        },
        to: function () {
            if (this.atOccurrence) return this.currentMatch.to;
        },

        find: function(reverse) {
            this.updateResultsIfNeeded();
            var matchArray;
            if (!this.regexIndexer.getCurrentMatch()) {
                // There is currently no match position
                // This is our first time or we hit the top or end of document using next or prev
                var docLineIndex = documentMap.get(this.doc).index;
                var matchIndex = findResultIndexNearPos(this.regexIndexer, indexFromPos(docLineIndex, this.currentMatch), reverse, compareMatchResultToPos);
                this.regexIndexer.setCurrentMatchNumber(matchIndex);
                matchArray = regexIndexer.getCurrentMatch();
            }
            if (!matchArray) {
                matchArray = reverse ? this.findPrevious() : this.findNext() ;
            }
            if (matchArray) {
                this.currentMatch = matchArray;
                this.atOccurrence = !(!matchArray);
            }
            return matchArray;
        },

        forEachResultWithGroupArray: function() {
            // TODO provide implementation that returns group arrays
        },

        forEachResult: function(fnResult) {
            var resultIndex = 0;
            var length = this.regexIndexer.getItemCount();
            for(resultIndex = 0; resultIndex < length; resultIndex++) {
                // TODO pass back only the indexes without a new object
                fnResult(this.regexIndexer.getItemByMatchNumber(resultIndex));
            }
        },

        updateResultsIfNeeded: function() {
            if (!this.resultsCurrent) {
                this.executeSearch();
            }
        },

        executeSearch: function () {
            this.currentMatchIndex = -2;
            var docText = documentMap.get(this.doc).text;
            var docLineIndex = documentMap.get(this.doc).index;
            this.regexIndexer = createIndexer(docText, docLineIndex, this.query);
            this.resultsCurrent = true;
            return this.getMatchCount();
        }
    };

    function createSearchCursor(doc, parsedQuery, pos, ignoreCase) {
        console.log("creating new search cursor");
        var searchCursor = new SearchCursor();
        searchCursor.initialize(parsedQuery, pos, doc, ignoreCase);
        return searchCursor;
    }

    exports.createSearchCursor = createSearchCursor;
});
