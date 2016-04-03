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
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $ */

define(function (require, exports, module) {
    "use strict";
    var CodeMirror = require("thirdparty/CodeMirror/lib/codemirror");

    var Pos = CodeMirror.Pos;

    function createLineCharacterCountIndex(text) {
        console.time('createLineCharacterCountIndex');
        // splitting is actually faster than using doc.getLine()
        var lines = text.split('\n');
        var lineCharacterCountIndex = [];
        var lineCount = lines.length;
        var totalCharacterCount = 0;
        for (var lineNumber = 0; lineNumber < lineCount; lineNumber++) {
            totalCharacterCount += lines[lineNumber].length + 1;  // adding 1 to match the line delimeter that is added when we do doc.getValue()
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
                return Pos(lineNumber, indexWithinDoc - previousLineEndingCharacterIndex  );
            }
        }
    }

    function SearchCursor() {

    }

    SearchCursor.prototype = {
        initialize: function(query, pos, doc) {
            this.atOccurrence = false;
            this.resultArray = [];
            this.currentMatchIndex = 0;
            this.setDoc(doc);
            this.setQuery(query);
            this.setPos(pos);
        },
        setQuery: function(query) {
            if (typeof query != "string") {
                if (!query.global) query = new RegExp(query.source, query.ignoreCase ? "igm" : "gm");
                this.query = query;
            }
        },
        setPos: function(pos) {
            pos = pos ? this.doc.clipPos(pos) : Pos(0, 0);
            this.pos = {
                from: pos,
                to: pos
            };
        },
        setDoc: function(doc) {
            this.doc = doc;
            console.time('getValue');
            this.docText = doc.getValue();
            console.timeEnd('getValue');
            this.docLineIndex = createLineCharacterCountIndex(this.docText);
        },

        getDocCharacterCount: function(){
            return this.docLineIndex[this.docLineIndex.length - 1];
        },
        findNext: function () {
            if ( this.currentMatchIndex < this.resultArray.length ) {
                this.currentMatchIndex++;
            } else {
                this.currentMatchIndex = 0;
            }
            return this.resultArray[this.currentMatchIndex];
        },
        findPrevious: function () {
            if ( this.currentMatchIndex > 0 ) {
                this.currentMatchIndex--;
            } else {
                this.currentMatchIndex = this.resultArray.length;
            }
            return this.resultArray[this.currentMatchIndex];
        },

        from: function () {
            if (this.atOccurrence) return this.pos.from;
        },
        to: function () {
            if (this.atOccurrence) return this.pos.to;
        },

        find: function(reverse) {
            var matchArray = reverse ? this.findPrevious() : this.findNext() ;
            this.pos = matchArray;
            this.atOccurrence = !(!matchArray);
            console.log(this.atOccurrence, this.pos, this.currentMatchIndex);
            return matchArray;
        },

        executeSearch: function () {
            this.resultArray = [];
            this.currentMatchIndex = -1;
            var matchArray;
            console.time("exec");
            var lastMatchedLine = 0;
            var index = 0;
            while ((matchArray = this.query.exec(this.docText)) != null) {
                var fromPos = createPosFromIndex(this.docLineIndex, lastMatchedLine, matchArray.index);
                var toPos   = createPosFromIndex(this.docLineIndex, fromPos.line,    this.query.lastIndex);
                lastMatchedLine = toPos.line;
                this.resultArray[index++] = {from: fromPos, to: toPos};
                // This is to stop infinite loop.  Some regular expressions can return 0 length match
                // which will not advance the lastindex property.  Ex ".*"
                if ( matchArray.index === this.query.lastIndex ) this.query.lastIndex++;
            };
            console.timeEnd("exec");

            return this.resultArray;
        },

        replace: function (newText, origin) {
            if (!this.atOccurrence) return;
            var lines = CodeMirror.splitLines(newText);
            this.doc.replaceRange(lines, this.pos.from, this.pos.to, origin);
            this.pos.to = Pos(this.pos.from.line + lines.length - 1,
                lines[lines.length - 1].length + (lines.length == 1 ? this.pos.from.ch : 0));
        }
    };

    function createSearchCursor(doc, searchState, pos) {
        if (searchState.searchCursor) {
            searchState.searchCursor.setQuery(searchState.parsedQuery);
            searchState.searchCursor.setPos(pos);
            return searchState.searchCursor;
        } else {
            console.log("creating new search cursor");
            searchState.searchCursor = new SearchCursor();
            searchState.searchCursor.initialize(searchState.parsedQuery, pos, doc);
            return searchState.searchCursor;
        }
    }

    exports.createSearchCursor = createSearchCursor;
});
