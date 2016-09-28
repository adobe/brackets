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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, $, it, expect, beforeFirst, afterLast, beforeEach, afterEach, waitsFor, waitsForDone, runs, jasmine */
/*unittests: SearchCursor*/

define(function (require, exports, module) {
    'use strict';

    var BracketsSearchCursor    = require("search/BracketsSearchCursor"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils");

    var defaultContent = "/* Test comment */\n" +
                         "define(function (require, exports, module) {\n" +
                         "    var Foo = require(\"modules/Foo\"),\n" +
                         "        Bar = require(\"modules/Bar\"),\n" +
                         "        Baz = require(\"modules/Baz\");\n" +
                         "    \n" +
                         "    function callFoo() {\n" +
                         "        \n" +
                         "        foo();\n" +
                         "        \n" +
                         "    }\n" +
                         "\n" +
                         "}";

    describe("SearchCursor", function () {
        var editor;

        beforeEach(function () {
            var mocks = SpecRunnerUtils.createMockEditor(defaultContent, "javascript");
            editor = mocks.editor;
            editor.document.getValue = editor.document.getText;
            editor.document.lineSeparator = function () { return '\n'; };
            editor.document.history = {generation: 1};
            editor.document.lineCount = function () { return defaultContent.split('\n').length; };
        });

        afterEach(function () {
            SpecRunnerUtils.destroyMockEditor(editor.document);
            editor = null;
        });

        describe("scanDocumentForMatches", function () {
            it("should match 4 locations of 'foo' ", function () {
                var matchedPositions = [];
                var matchArrays = [];
                BracketsSearchCursor.scanDocumentForMatches({
                    document: editor.document,
                    searchQuery: /(f)oo/,
                    ignoreCase: true,
                    fnEachMatch: function (startPosition, endPosition, matchArray) {
                        matchedPositions.push(startPosition);
                        matchArrays.push(matchArray);
                    }
                });
                expect(matchedPositions).toEqual([ {line : 2, ch : 8}, {line : 2, ch : 31}, {line : 6, ch : 17}, {line : 8, ch : 8}]);
                expect(matchArrays[0][0]).toEqual("Foo");
                expect(matchArrays[0][1]).toEqual("F");
            });
            it("should match 1 locations of 'require' ", function () {
                var matchedPositions = [];
                var matchArrays = [];
                BracketsSearchCursor.scanDocumentForMatches({
                    document: editor.document,
                    searchQuery: /require/,
                    ignoreCase: true,
                    range: {from: {line: 4, ch: 0}, to: {line: 5, ch: 0}},
                    fnEachMatch: function (startPosition, endPosition, matchArray) {
                        matchedPositions.push(startPosition);
                        matchArrays.push(matchArray);
                    }
                });
                expect(matchedPositions).toEqual([ {line : 4, ch : 14} ]);
                expect(matchedPositions.length).toEqual(1);
                expect(matchArrays[0][0]).toEqual("require");
            });
        });

        describe("createSearchCursor", function () {
            var cursor;
            beforeEach(function () {
                cursor = BracketsSearchCursor.createSearchCursor({
                    document: editor.document,
                    searchQuery: /(f)oo/,
                    ignoreCase: true,
                });
            });

            afterEach(function () {
                cursor = null;
            });
            it("should match 4 locations of 'foo' ", function () {
                var results = [];
                cursor.forEachMatch(function (startPosition, endPosition) {
                    results.push(startPosition);
                });
                expect(results).toEqual([ {line : 2, ch : 8}, {line : 2, ch : 31}, {line : 6, ch : 17}, {line : 8, ch : 8}]);
            });

            it("should count 4 matches of 'foo' ", function () {
                expect(cursor.getMatchCount()).toEqual(4);
            });

            it("should have 0 as first match number after first find", function () {
                var firstPosition = cursor.find();
                expect(cursor.getCurrentMatchNumber()).toEqual(0);
            });

            it("should have 1 as first match number after first find and starting position after first match", function () {
                cursor.setSearchDocumentAndQuery({position: {line: 2, ch: 10}});
                var firstPosition = cursor.find();
                expect(cursor.getCurrentMatchNumber()).toEqual(1);
            });

            it("should start search at end if reversing", function () {
                cursor.find(true);
                expect(cursor.getCurrentMatchNumber()).toEqual(3);
            });

            it("should wrap around search reverse direction", function () {
                // find first match
                cursor.find();
                expect(cursor.getCurrentMatchNumber()).toEqual(0);
                // no match top of document
                cursor.find(true);
                expect(cursor.getCurrentMatchNumber()).toEqual(-1);
                // should now wrap around on next reverse
                cursor.find(true);
                expect(cursor.getCurrentMatchNumber()).toEqual(3);
            });

            it("should wrap around search forward direction", function () {
                // find last match
                cursor.find(true);
                expect(cursor.getCurrentMatchNumber()).toEqual(3);
                // no match end of document
                cursor.find();
                expect(cursor.getCurrentMatchNumber()).toEqual(-1);
                // should now wrap around on next forward
                cursor.find();
                expect(cursor.getCurrentMatchNumber()).toEqual(0);
            });

            it("should have correct number of matches when cursor is between begin and end matches", function () {
                cursor.setSearchDocumentAndQuery({position: {line: 4, ch: 0}});
                // find matches
                cursor.find();
                expect(cursor.getMatchCount()).toEqual(4);
            });

            it("should count document characters", function () {
                expect(cursor.getDocCharacterCount()).toEqual(defaultContent.length + 1);
            });

            it("should provide full match info for current match", function () {
                cursor.find();
                var matchInfo = cursor.getFullInfoForCurrentMatch();

                expect(matchInfo.match.index).toEqual(72);
                expect(matchInfo.match[0]).toEqual("Foo");
                expect(matchInfo.match[1]).toEqual("F");
                expect(matchInfo.from).toEqual({line : 2, ch : 8});
                expect(matchInfo.to).toEqual({line: 2, ch: 11});
            });
        });

        describe("createSearchCursorMultiLineSelection", function () {
            var cursor;
            beforeEach(function () {
                cursor = BracketsSearchCursor.createSearchCursor({
                    document: editor.document,
                    searchQuery: /define[\s\S]*callFoo/,
                    ignoreCase: true,
                });
            });

            afterEach(function () {
                cursor = null;
            });
            it("should match with 1 selection of 6 lines", function () {
                var results = [];
                cursor.forEachMatch(function (startPosition, endPosition) {
                    results.push(startPosition);
                    results.push(endPosition);
                });
                expect(results.length).toEqual(2);
                expect(results).toEqual([ { line : 1, ch : 0 }, { line : 6, ch : 20 } ]);
            });
            it("captured lines should contain linefeed", function () {
                var results = [];
                cursor.forEachMatch(function (startPosition, endPosition) {
                    var start = cursor.indexFromPos(startPosition);
                    var end   = cursor.indexFromPos(endPosition);
                    expect(defaultContent.charAt(end) === '\n');
                });
            });

        });
    });
});
