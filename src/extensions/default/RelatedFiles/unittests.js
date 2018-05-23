/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, expect, beforeEach, afterEach, spyOn */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        testHtmlContent     = require("text!unittest-files/test.html"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        RelatedFiles        = require("main");

    var absPathPrefix = (brackets.platform === "win" ? "c:/" : "/");
    var testWindow, testDocument;

    var testObj = [
        [absPathPrefix + "_unitTestDummyPath_" + "/index.css", "index.css", "true", false],
        [absPathPrefix + "_unitTestDummyPath_" + "/css/bootstrap-4.0.0.css", "bootstrap-4.0.0.css", true, false],
        ["https://code.jquery.com/jquery-3.3.1.js", "code.jquery.com", false, true],
        ["http://www.google.com", "www.google.com", false, true]
    ];

    describe("RealtedFiles", function () {
        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                testWindow = w;
            });
            var mock = SpecRunnerUtils.createMockEditor(testHtmlContent, "html");
            testDocument = mock.doc;
        });

        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
        });

        // Creates object for expected output of test.html file.
        function createExpetcedSearchResults() {
            var expectedFiles = [];

            for (var i = 0; i < testObj.length; i++){
                var searchResult = new StringMatch.SearchResult(testObj[i][0]);
                searchResult.fullPath = testObj[i][0];
                searchResult.label = testObj[i][1];
                searchResult.stringRanges = [{
                    text: testObj[i][0],
                    matched: false,
                    includesLastSegment: testObj[i][2],
                    includesFirstSegment: testObj[i][3]
                }];
                expectedFiles.push(searchResult);
            }

            return expectedFiles;
        }

        describe("test parseHTML", function () {
            spyOn(DocumentManager, "getCurrentDocument").andReturn(testDocument);

            // Test to see if the given html (test.html) is parsed as expected.
            //It compares the output of this file with expected output.
            it("should parse given html", function() {
                var expectedOutput = createExpetcedSearchResults();
                var actualOutput = RelatedFiles.relatedFiles.getRelatedFiles(testDocument);
                for (var i = 0; i < actualOutput.length; i++) {
                    expect(expectedOutput[i].fullPath).toBe(actualOutput[i].fullPath);
                    expect(expectedOutput[i].label).toBe(actualOutput[i].label);
                    expect(expectedOutput[i].stringRanges.text).toBe(actualOutput[i].stringRanges.text);
                    expect(expectedOutput[i].stringRanges.matched).toBe(actualOutput[i].stringRanges.matched);
                    expect(expectedOutput[i].stringRanges.includesLastSegment).
                        toBe(actualOutput[i].stringRanges.includesLastSegment);
                    expect(expectedOutput[i].stringRanges.includesFirstSegment).
                        toBe(actualOutput[i].stringRanges.includesFirstSegment);
                }
            });
        });
    });
});
