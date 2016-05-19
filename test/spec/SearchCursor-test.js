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
        });

        afterEach(function () {
            SpecRunnerUtils.destroyMockEditor(editor.document);
            editor = null;
        });

        describe("scanDocumentForMatches", function () {
            it("should select a word bounded by whitespace from a pos in the middle of the word", function () {
                var results = [];
                BracketsSearchCursor.scanDocumentForMatches({
                    document: editor.document,
                    searchQuery: "foo",
                    ignoreCase: true,
                    fnEachMatch: function (startPosition, endPosition, matchArray) {
                        results.push(startPosition);
                    }
                });
                expect(results).toEqual([ {line : 2, ch : 8}, {line : 2, ch : 31}, {line : 6, ch : 17}, {line : 8, ch : 8}]);
            });
        });
    });
});
