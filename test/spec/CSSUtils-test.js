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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waitsForDone, runs, beforeFirst, afterLast */

define(function (require, exports, module) {
    "use strict";

    var FileSystem                 = require("filesystem/FileSystem"),
        FileUtils                  = require("file/FileUtils"),
        CSSUtils                   = require("language/CSSUtils"),
        HTMLUtils                  = require("language/HTMLUtils"),
        SpecRunnerUtils            = require("spec/SpecRunnerUtils"),
        TextRange                  = require("document/TextRange").TextRange;

    var testPath                   = SpecRunnerUtils.getTestPath("/spec/CSSUtils-test-files"),
        simpleCssFileEntry         = FileSystem.getFileForPath(testPath + "/simple.css"),
        universalCssFileEntry      = FileSystem.getFileForPath(testPath + "/universal.css"),
        propListCssFileEntry       = FileSystem.getFileForPath(testPath + "/property-list.css"),
        groupsFileEntry            = FileSystem.getFileForPath(testPath + "/groups.css"),
        offsetsCssFileEntry        = FileSystem.getFileForPath(testPath + "/offsets.css"),
        bootstrapCssFileEntry      = FileSystem.getFileForPath(testPath + "/bootstrap.css"),
        escapesCssFileEntry        = FileSystem.getFileForPath(testPath + "/escaped-identifiers.css"),
        embeddedHtmlFileEntry      = FileSystem.getFileForPath(testPath + "/embedded.html"),
        cssRegionsFileEntry        = FileSystem.getFileForPath(testPath + "/regions.css"),
        nestedGroupsFileEntry      = FileSystem.getFileForPath(testPath + "/panels.less");


    var contextTestCss             = require("text!spec/CSSUtils-test-files/contexts.css"),
        selectorPositionsTestCss   = require("text!spec/CSSUtils-test-files/selector-positions.css"),
        rangesTestCss              = require("text!spec/CSSUtils-test-files/ranges.css"),
        simpleTestCss              = require("text!spec/CSSUtils-test-files/simple.css"),
        mediaTestScss              = require("text!spec/CSSUtils-test-files/navbar.scss"),
        mediaTestLess              = require("text!spec/CSSUtils-test-files/print.less"),
        mixinTestScss              = require("text!spec/CSSUtils-test-files/table&button.scss"),
        mixinTestLess              = require("text!spec/CSSUtils-test-files/mixins.less"),
        includeMixinTestScss       = require("text!spec/CSSUtils-test-files/include-mixin.scss"),
        parentSelectorTestLess     = require("text!spec/CSSUtils-test-files/parent-selector.less"),
        varInterpolationTestScss   = require("text!spec/CSSUtils-test-files/variables.scss"),
        varInterpolationTestLess   = require("text!spec/CSSUtils-test-files/variables.less");

    /**
     * Verifies whether one of the results returned by CSSUtils._findAllMatchingSelectorsInText()
     * came from the expected selector string or not. String is the complete compound selector, not
     * the larger selector group or the smaller rightmost-simple-selector. E.g. if some rule
     * "div, foo .bar { ... }" matches a search for ".bar", the selector will be "foo .bar"
     */
    var toMatchSelector = function (expected) {
        return this.actual.selector.trim() === expected;
    };

    function init(spec, fileEntry) {
        spec.fileContent = null;

        if (fileEntry) {
            spec.addMatchers({toMatchSelector: toMatchSelector});

            runs(function () {
                var promise = FileUtils.readAsText(fileEntry)
                    .done(function (text) {
                        spec.fileContent = text;
                    });
                waitsForDone(promise);
            });
        }
    }


    describe("CSSUtils", function () {

        beforeEach(function () {
            init(this);
        });

        describe("basics", function () {

            it("should parse an empty string", function () {
                runs(function () {
                    var result = CSSUtils._findAllMatchingSelectorsInText("", { tag: "div" });
                    expect(result.length).toEqual(0);
                });
            });

            it("should parse an empty string with less mode", function () {
                runs(function () {
                    var result = CSSUtils._findAllMatchingSelectorsInText("", { tag: "div" }, "text/x-less");
                    expect(result.length).toEqual(0);
                });
            });

            it("should parse an empty string with scss mode", function () {
                runs(function () {
                    var result = CSSUtils._findAllMatchingSelectorsInText("", { tag: "div" }, "text/x-scss");
                    expect(result.length).toEqual(0);
                });
            });

            // it("should parse simple selectors from more than one file", function () {
            //     // TODO: it'd be nice to revive this test by shimming FileIndexManager.getFileInfoList() or something
            // });
        });

        describe("line offsets", function () {

            /**
             * Checks the lines ranges of the results returned by CSSUtils. Expects the numbers of
             * results to equal the length of 'ranges'; each entry in range gives the {start, end}
             * of the expected line range for that Nth result.
             */
            function expectRuleRanges(spec, cssCode, selector, ranges, mode) {
                var result = CSSUtils._findAllMatchingSelectorsInText(cssCode, selector, mode);
                spec.expect(result.length).toEqual(ranges.length);
                ranges.forEach(function (range, i) {
                    spec.expect(result[i].ruleStartLine).toEqual(range.start);
                    spec.expect(result[i].declListEndLine).toEqual(range.end);
                });
            }

            /**
             * Similar to the above function, but instead checks the lines ranges for the entire selector *group*
             * of the results returned by CSSUtils. For example, if a rule looks like ".foo,[newline].bar"
             * and the caller asks for selector ".bar", this function checks against the entire range
             * starting with the line ".foo. is on.
             *
             * Expects the numbers of results to equal the length of 'ranges'; each entry in range gives
             * the {start, end} of the expected line range for that Nth result.
             */
            function expectGroupRanges(spec, cssCode, selector, ranges, mode) {
                var result = CSSUtils._findAllMatchingSelectorsInText(cssCode, selector, mode);
                spec.expect(result.length).toEqual(ranges.length);
                ranges.forEach(function (range, i) {
                    spec.expect(result[i].selectorGroupStartLine).toEqual(range.start);
                    spec.expect(result[i].declListEndLine).toEqual(range.end);
                });
            }

            it("should return correct start and end line numbers for simple rules", function () {
                runs(function () {
                    init(this, simpleCssFileEntry);
                });

                runs(function () {
                    expectRuleRanges(this, this.fileContent, "html", [ {start: 0, end: 2}, {start: 4, end: 6 }]);
                    expectRuleRanges(this, this.fileContent, ".firstGrade", [ {start: 8, end: 10} ]);
                    expectRuleRanges(this, this.fileContent, "#brack3ts",
                        [ {start: 16, end: 18} ]);
                });
            });

            it("should handle rules on adjacent lines", function () {
                runs(function () {
                    init(this, offsetsCssFileEntry);
                });

                runs(function () {
                    expectRuleRanges(this, this.fileContent, "a", [
                        {start:  0, end:  2}, {start:  3, end:  5}, {start:  7, end:  7},
                        {start:  8, end:  8}, {start: 10, end: 10}, {start: 10, end: 10},
                        {start: 16, end: 19}, {start: 23, end: 25}, {start: 29, end: 32},
                        {start: 33, end: 35}, {start: 38, end: 41}
                    ]);
                });
            });

            it("should return correct group range when selector group spans multiple lines", function () {
                runs(function () {
                    init(this, groupsFileEntry);
                });

                runs(function () {
                    expectGroupRanges(this, this.fileContent, ".a", [{start: 24, end: 29}]);
                    expectGroupRanges(this, this.fileContent, ".b", [{start: 24, end: 29}]);
                    expectGroupRanges(this, this.fileContent, ".c", [{start: 24, end: 29}]);
                    expectGroupRanges(this, this.fileContent, ".d", [{start: 24, end: 29}]);

                    expectGroupRanges(this, this.fileContent, ".f", [{start: 31, end: 31}]);
                    expectGroupRanges(this, this.fileContent, ".g", [{start: 31, end: 34}]);
                    expectGroupRanges(this, this.fileContent, ".h", [{start: 31, end: 34}]);

                });
            });

            it("should return correct rule ranges for rules with comma separators in property values", function () {
                runs(function () {
                    init(this, propListCssFileEntry);
                });

                runs(function () {
                    // https://github.com/adobe/brackets/issues/9008
                    expectRuleRanges(this, this.fileContent, "h1", [{start:  0, end:  2}]);

                    // https://github.com/adobe/brackets/issues/8966
                    expectRuleRanges(this, this.fileContent, ".alert", [{start:  4, end:  8}]);
                });
            });

            it("should return correct rule range and group range for different nested levels", function () {
                runs(function () {
                    init(this, nestedGroupsFileEntry);
                });

                runs(function () {
                    expectRuleRanges(this, this.fileContent, ".table", [
                        {start: 6, end: 9}, {start: 6, end: 9},
                        {start: 10, end: 26}, {start: 10, end: 26},
                        {start: 27, end: 43}, {start: 27, end: 43},
                        {start: 44, end: 47}
                    ], "text/x-less");
                    expectGroupRanges(this, this.fileContent, ".table", [
                        {start: 6, end: 9}, {start: 6, end: 9},
                        {start: 11, end: 26}, {start: 11, end: 26},
                        {start: 28, end: 43}, {start: 28, end: 43},
                        {start: 44, end: 47}
                    ], "text/x-less");

                    expectRuleRanges(this, this.fileContent, "tbody", [
                        {start: 13, end: 25}, {start: 30, end: 42}, {start: 55, end: 76}
                    ], "text/x-less");
                    expectGroupRanges(this, this.fileContent, "tbody", [
                        {start: 13, end: 25}, {start: 30, end: 42}, {start: 55, end: 76}
                    ], "text/x-less");

                    expectRuleRanges(this, this.fileContent, "thead", [
                        {start: 13, end: 25}, {start: 55, end: 76}
                    ], "text/x-less");
                    expectGroupRanges(this, this.fileContent, "thead", [
                        {start: 13, end: 25}, {start: 55, end: 76}
                    ], "text/x-less");

                    expectRuleRanges(this, this.fileContent, "tr", [
                        {start: 15, end: 24}, {start: 32, end: 41}, {start: 58, end: 75}
                    ], "text/x-less");

                    expectRuleRanges(this, this.fileContent, "th", [
                        {start: 16, end: 19}, {start: 20, end: 23}, {start: 33, end: 36},
                        {start: 37, end: 40}, {start: 48, end: 51}, {start: 59, end: 62},
                        {start: 63, end: 66}, {start: 67, end: 70}, {start: 71, end: 74}
                    ], "text/x-less");
                    expectGroupRanges(this, this.fileContent, "th", [
                        {start: 16, end: 19}, {start: 20, end: 23}, {start: 33, end: 36},
                        {start: 37, end: 40}, {start: 48, end: 51}, {start: 59, end: 62},
                        {start: 63, end: 66}, {start: 67, end: 70}, {start: 71, end: 74}
                    ], "text/x-less");

                });
            });
        });

        describe("with the universal selector", function () {

            beforeEach(function () {
                init(this, universalCssFileEntry);
            });

            it("should match a tag name not referenced anywhere in the CSS", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileContent, "blockquote");
                expect(matches.length).toEqual(1);
                expect(matches[0]).toMatchSelector("*");
            });
            it("should match a tag name also referenced elsewhere in the CSS", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileContent, "p");

                expect(matches.length).toEqual(2);
                expect(matches[0]).toMatchSelector("*");
                expect(matches[1]).toMatchSelector("p");
            });
        });

        describe("with sprint 4 exemptions", function () {

            beforeEach(function () {
                var sprint4exemptions = FileSystem.getFileForPath(testPath + "/sprint4.css");
                init(this, sprint4exemptions);
            });

            it("should match a class selector (right-most only, no pseudo or attr selectors)", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileContent, ".message");

                expect(matches.length).toEqual(7);
                expect(matches[0]).toMatchSelector("div.message");
                expect(matches[1]).toMatchSelector("footer .message");
                expect(matches[2]).toMatchSelector("footer div.message");
                expect(matches[3]).toMatchSelector("h2.message");
                expect(matches[4]).toMatchSelector("div.message:hovered");
                expect(matches[5]).toMatchSelector(".message:hover");
                expect(matches[6]).toMatchSelector(".message[data-attr='42']");
            });

            it("should match a type selector (can terminate with class name, ID, pseudo or attr selectors)", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileContent, "h4");

                expect(matches.length).toEqual(5);
            });
        });

        describe("with real-world Bootstrap CSS code", function () {

            beforeEach(function () {
                init(this, bootstrapCssFileEntry);
            });

            it("should find the first instance of the h2 selector", function () {
                var selectors = CSSUtils._findAllMatchingSelectorsInText(this.fileContent, "h2");
                expect(selectors).toBeTruthy();
                expect(selectors.length).toBeGreaterThan(0);

                expect(selectors[0]).toBeTruthy();
                expect(selectors[0].selectorStartLine).toBe(292);
                expect(selectors[0].declListEndLine).toBe(301);
            });

            it("should find all instances of the h2 selector", function () {
                var selectors = CSSUtils._findAllMatchingSelectorsInText(this.fileContent, "h2");
                expect(selectors.length).toBe(2);

                expect(selectors[0].selectorStartLine).toBe(292);
                expect(selectors[0].declListEndLine).toBe(301);
                expect(selectors[1].selectorStartLine).toBe(318);
                expect(selectors[1].declListEndLine).toBe(321);
            });

            it("should return an empty array when findAllMatchingSelectors() can't find any matches", function () {
                var selectors = CSSUtils._findAllMatchingSelectorsInText(this.fileContent, "NO-SUCH-SELECTOR");
                expect(selectors.length).toBe(0);
            });
        });


        describe("escapes", function () {

            beforeEach(function () {
                init(this, escapesCssFileEntry);
            });

            it("should remove simple backslashes for simple characters", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[0].selector).toEqual(".simple");
            });

            it("should remove simple backslashes with escaped characters", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[1].selector).toEqual(".not\\so|simple?");
            });

            it("should parse '\\XX ' as a single character", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[2].selector).toEqual(".twodigits");
            });

            it("should parse '\\XXXX ' as a single character", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[3].selector).toEqual(".fourdigits");
            });

            it("should parse '\\XXXXXX' as a single character", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[4].selector).toEqual(".sixdigits");
            });

            it("should not trim end spaces", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[5].selector).toEqual(".two-digit-endspace");

                selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[6].selector).toEqual(".four-digit-endspace");

                selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[7].selector).toEqual(".six-digit-endspace");
            });

            it("should detect all combinations", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[8].selector).toEqual(".mixin-it-all");
            });

            it("should parse '\\AX' as AX", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[9].selector).toEqual(".two-wi74out-space");
            });

            it("should parse '\\AXXX' as AXXX", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[10].selector).toEqual(".four-n0085-space");
            });

            it("should replace out of range characters with U+FFFD", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[11].selector).toEqual(".\uFFFDut\uFFFDfrange");
            });

            it("should parse everything less does", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileContent);
                expect(selectors[12].selector).toEqual(".escape|random|char");
                expect(selectors[13].selector).toEqual(".mixin!tUp");
                expect(selectors[14].selector).toEqual(".404");
                expect(selectors[15].selector).toEqual(".404 strong");
                expect(selectors[16].selector).toEqual(".trailingTest+");
                expect(selectors[17].selector).toEqual("blockquote");
            });
        });

        describe("findSelectorAtDocumentPos selector groups", function () {
            var editor;

            beforeEach(function () {
                init(this, groupsFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "css").editor;
                });
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
            });

            it("should find the selector at a document pos", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 9, ch: 0});
                expect(selector).toEqual("h1");
            });

            it("should return empty string if selection is not in a style rule", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 11, ch: 0});
                expect(selector).toEqual("");
            });

            it("should return a comma separated string of all selectors for the rule", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 13, ch: 0});
                expect(selector).toEqual("h3, h2, h1");
            });

            it("should support multiple rules on the same line", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 31, ch: 24});
                expect(selector).toEqual(".g,.h");
            });

            it("should support multiple rules on multiple lines", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 28, ch: 0});
                expect(selector).toEqual(".a,.b, .c,.d");
            });
        });

        describe("findSelectorAtDocumentPos comments", function () {
            var editor;

            beforeEach(function () {
                init(this, offsetsCssFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "css").editor;
                });
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
            });

            it("should ignore rules inside comments", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 45, ch: 22});
                expect(selector).toEqual("");
            });

            // https://github.com/adobe/brackets/issues/9002
            it("should not hang when the cursor is after '{' or '}' inside comments", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 53, ch: 3});   // after {
                expect(selector).toEqual("");

                selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 55, ch: 1}); // after }
                expect(selector).toEqual("");
            });

            it("should find rules adjacent to comments", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 47, ch: 4});
                expect(selector).toEqual("div");
            });

            it("should find rules when the position is inside a nested comment", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 49, ch: 14});
                expect(selector).toEqual("div");
            });

        });

        describe("findSelectorAtDocumentPos pseudo-classes and at-rules", function () {
            var editor;

            beforeEach(function () {
                init(this, offsetsCssFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "css").editor;
                });
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
            });

            it("should find a simple pseudo selector", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 8, ch: 11});
                expect(selector).toEqual("a:visited");
            });

            it("should find a selector with a preceding at-rule", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 18, ch: 0});
                expect(selector).toEqual("a");
            });

            it("should not find a selector when inside an at-rule", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 15, ch: 12});
                expect(selector).toEqual("");

                selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 28, ch: 31});
                expect(selector).toEqual("");

                selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 22, ch: 16});
                expect(selector).toEqual("");
            });
        });

        describe("findSelectorAtDocumentPos complex selectors", function () {
            var editor;

            beforeEach(function () {
                init(this, bootstrapCssFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "css").editor;
                });
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
            });

            it("should find pseudo selectors", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 72, ch: 0});
                expect(selector).toEqual("button::-moz-focus-inner, input::-moz-focus-inner");
            });

            it("should find attribute selectors", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 83, ch: 0});
                expect(selector).toEqual('input[type="search"]');
            });

            it("should find structural pseudo-classes", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 1053, ch: 0});
                expect(selector).toEqual(".table-striped tbody tr:nth-child(odd) td, .table-striped tbody tr:nth-child(odd) th");
            });

            it("should find combinators", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 2073, ch: 0});
                expect(selector).toEqual(".alert-block p + p");
            });

        });

        describe("findSelectorAtDocumentPos beginning, middle and end of selector", function () {
            var editor;

            beforeEach(function () {
                init(this, groupsFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "css").editor;
                });
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
            });

            it("should find selector when pos is at beginning of selector name", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 12, ch: 0});
                expect(selector).toEqual("h3, h2, h1");
            });

            it("should find selector when pos is in the middle of selector name", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 12, ch: 3});
                expect(selector).toEqual('h3, h2, h1');
            });

            it("should find selector when pos is at the end of a selector name", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 12, ch: 10});
                expect(selector).toEqual("h3, h2, h1");
            });

            it("should not find selector when pos is before a selector name", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 11, ch: 0});
                expect(selector).toEqual("");
            });

        });

        describe("find correct positions of selectors", function () {

            it("should find selector positions when whitespace between selector and '{'", function () {
                var selectors = CSSUtils.extractAllSelectors(selectorPositionsTestCss);
                expect([selectors[0].selectorStartChar, selectors[0].selectorEndChar]).toEqual([0, 3]);
            });

            it("should find selector positions when no whitespace between selector and '{'", function () {
                var selectors = CSSUtils.extractAllSelectors(selectorPositionsTestCss);
                expect([selectors[1].selectorStartChar, selectors[1].selectorEndChar]).toEqual([0, 3]);
            });

            it("should find selector positions when '{' on the next line", function () {
                var selectors = CSSUtils.extractAllSelectors(selectorPositionsTestCss);
                expect([selectors[2].selectorStartChar, selectors[2].selectorEndChar]).toEqual([0, 3]);
            });

            it("should find selector positions when '{' on the next line and selector is indented", function () {
                var selectors = CSSUtils.extractAllSelectors(selectorPositionsTestCss);
                expect([selectors[3].selectorStartChar, selectors[3].selectorEndChar]).toEqual([4, 7]);
            });

            it("should find selector positions when '{' on the next line and selector is indented with tabs", function () {
                var selectors = CSSUtils.extractAllSelectors(selectorPositionsTestCss);
                expect([selectors[4].selectorStartChar, selectors[4].selectorEndChar]).toEqual([1, 4]);
            });

            it("should find selector positions in a selector group when '{' on the next line", function () {
                var selectors = CSSUtils.extractAllSelectors(selectorPositionsTestCss),
                    expected = [0, 2, 4, 6, 8, 10],
                    result = [
                        selectors[5].selectorStartChar, selectors[5].selectorEndChar,
                        selectors[6].selectorStartChar, selectors[6].selectorEndChar,
                        selectors[7].selectorStartChar, selectors[7].selectorEndChar
                    ];

                expect(result).toEqual(expected);
            });

            it("should find selector positions in a selector group when '{' on the next line and selector group is indented", function () {
                var selectors = CSSUtils.extractAllSelectors(selectorPositionsTestCss),
                    expected = [4, 6, 8, 10, 12, 14],
                    result = [
                        selectors[8].selectorStartChar, selectors[8].selectorEndChar,
                        selectors[9].selectorStartChar, selectors[9].selectorEndChar,
                        selectors[10].selectorStartChar, selectors[10].selectorEndChar
                    ];

                expect(result).toEqual(expected);
            });
        });

        describe("findSelectorAtDocumentPos in embedded <style> blocks", function () {
            var editor;

            beforeEach(function () {
                init(this, embeddedHtmlFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "html").editor;
                });
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
            });

            // Indexes of external UI are 1-based. Internal indexes are 0-based.
            it("should find the first selector when pos is at beginning of selector name", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 6, ch: 0});
                expect(selector).toEqual("div");
            });

            it("should find the second selector when pos is at beginning of selector name", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 11, ch: 0});
                expect(selector).toEqual(".foo");
            });
        });

        describe("reduceStyleSheetForRegExParsing", function () {
            it("should remove css comment in a line", function () {
                var result = CSSUtils.reduceStyleSheetForRegExParsing(".test { color: #123; /* unbalanced paren :) */ margin: 0; }");
                expect(result).toEqual(".test { color: #123;  margin: 0; }");
            });
            it("should remove css comment across newlines", function () {
                var result = CSSUtils.reduceStyleSheetForRegExParsing(".foo {\n  background-color: rgb(0, 63, 255); /* start of comment\n end of comment */\n  margin: 0;\n}\n");
                expect(result).toEqual(".foo {\n  background-color: rgb(0, 63, 255); \n  margin: 0;\n}\n");
            });
            it("should remove multiple css comments", function () {
                var result = CSSUtils.reduceStyleSheetForRegExParsing(".test { color: hsl(0, 100%, 50%); /* unbalanced paren :) */ margin: 0; } .foo { background-color: orange; /* comment */ margin: 1px; }");
                expect(result).toEqual(".test { color: hsl(0, 100%, 50%);  margin: 0; } .foo { background-color: orange;  margin: 1px; }");
            });
            it("should remove css string with single quotes", function () {
                var result = CSSUtils.reduceStyleSheetForRegExParsing(".test { content: '('; background-image: url('bg.svg'); padding: 0; }");
                expect(result).toEqual(".test { content: ; background-image: url(); padding: 0; }");
            });
            it("should remove css string with double quotes", function () {
                var result = CSSUtils.reduceStyleSheetForRegExParsing('.test-content { border: 0; background-image: url("bg.svg"); content: ">"; }');
                expect(result).toEqual('.test-content { border: 0; background-image: url(); content: ; }');
            });
            it("should remove both comment and css content property", function () {
                var result = CSSUtils.reduceStyleSheetForRegExParsing(".test { color: #123; /* unbalanced paren :-) */ margin: 0; content: ')'; padding: 0; }");
                expect(result).toEqual(".test { color: #123;  margin: 0; content: ; padding: 0; }");
            });
            it("should otherwise not alter stylesheet text", function () {
                var result = CSSUtils.reduceStyleSheetForRegExParsing(".test { color: #1254ef; margin: 0.1em; filter: blur(); }");
                expect(result).toEqual(".test { color: #1254ef; margin: 0.1em; filter: blur(); }");
            });
        });
    }); // describe("CSSUtils")



    describe("CSS Parsing", function () {

        var lastCssCode,
            match,
            expectParseError;

        function _findMatchingRules(cssCode, tagInfo, mode) {
            if (tagInfo) {
                var selector = "";
                if (tagInfo.tag) {
                    selector += tagInfo.tag;
                }
                if (tagInfo.clazz) {
                    selector += "." + tagInfo.clazz;
                }
                if (tagInfo.id) {
                    selector += "#" + tagInfo.id;
                }
                return CSSUtils._findAllMatchingSelectorsInText(cssCode, selector, mode);
            } else {
                // If !tagInfo, we don't care about results; only making sure parse/search doesn't crash
                CSSUtils._findAllMatchingSelectorsInText(cssCode, "dummy", mode);
                return null;
            }
        }

        /**
         * Test helper function; tagInfo object contains one of: tag, id, clazz. Tests against only
         * the given cssCode string in isolation (no CSS files are loaded). If tagInfo not specified,
         * returns no results; only tests that parsing plus a simple search won't crash.
         */
        var _match = function (cssCode, tagInfo, mode) {
            lastCssCode = cssCode;
            try {
                return _findMatchingRules(cssCode, tagInfo, mode);
            } catch (e) {
                this.fail(e.message + ": " + cssCode);
                return [];
            }
        };

        /** Tests against the same CSS text as the last call to match() */
        function matchAgain(tagInfo, mode) {
            return match(lastCssCode, tagInfo, mode);
        }

        function expectCompleteSelectors(selectorInfo, expectedStr) {
            expect(CSSUtils.getCompleteSelectors(selectorInfo)).toBe(expectedStr);
        }

        /**
         * Test helper function: expects CSS parsing to fail at the given 0-based offset within the
         * cssCode string, with the given error message.
         */
        var _expectParseError = function (cssCode, expectedCodeOffset, expectedErrorMessage) {
            try {
                _findMatchingRules(cssCode, null);

                // shouldn't get here since _findMatchingRules() is expected to throw
                this.fail("Expected parse error: " + cssCode);

            } catch (error) {
                expect(error.index).toBe(expectedCodeOffset);
                expect(error.message).toBe(expectedErrorMessage);
            }
        };

        /** To call fail(), these helpers need access to the value of 'this' inside each it() */
        beforeEach(function () {
            match = _match.bind(this);
            expectParseError = _expectParseError.bind(this);
        });


        describe("Simple selectors", function () {

            it("should match a lone type selector given a type", function () {
                var result = match("div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();

                result = matchAgain({ tag: "span" });
                expect(result.length).toBe(0);

                result = matchAgain({ tag: "divfoo" }); //selector is a prefix of search
                expect(result.length).toBe(0);

                result = matchAgain({ tag: "di" });     //search is a prefix of selector
                expect(result.length).toBe(0);
            });

            it("should match a lone class selector given a class", function () {
                var result = match(".foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();

                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(0);

                result = matchAgain({ clazz: "foobar" }); //selector is a prefix of search
                expect(result.length).toBe(0);

                result = matchAgain({ clazz: "fo" });     //search is a prefix of selector
                expect(result.length).toBe(0);

                result = matchAgain({ clazz: ".foo" });   //search has extra '.' (invalid search)
                expect(result.length).toBe(0);
            });

            it("should match a lone id selector given an id", function () {
                var result = match("#foo { color:red }", { id: "foo" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();

                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(0);

                result = matchAgain({ id: "foobar" });
                expect(result.length).toBe(0);

                result = matchAgain({ id: "fo" });
                expect(result.length).toBe(0);

                result = matchAgain({ id: "#foo" });
                expect(result.length).toBe(0);
            });

            it("shouldn't confuse type, class, and id", function () {
                var css = "div { color:red } \n" +
                          ".foo { color:green } \n" +
                          "#bar { color:blue }";

                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();
                result = matchAgain({ tag: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "bar" });
                expect(result.length).toBe(0);

                result = matchAgain({ clazz: "div" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();
                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(0);

                result = matchAgain({ id: "div" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();
            });

            it("should be case-sensitive for all but types", function () {
                var css = "div { color:red } \n" +
                          "DIV { color:red } \n" +
                          ".foo { color:green } \n" +
                          ".Foo { color:black } \n" +
                          "#bar { color:blue } \n" +
                          "#baR { color:white }";

                var result = match(css, { tag: "div" });
                expect(result.length).toBe(2);
                result = matchAgain({ tag: "Div" });
                expect(result.length).toBe(2);

                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "Foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "FOO" });
                expect(result.length).toBe(0);

                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "baR" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "BAR" });
                expect(result.length).toBe(0);
            });

            it("should match permissively", function () {
                var css = "div.foo { color:red } \n" +
                          "div#bar { color:green } \n" +
                          "div.foo#bar { color:blue } \n" +
                          ".foo#bar { color:black } \n" +
                          "div.foo.class2 { color: white } \n" +
                          ".foo.class2 { color: yellow } \n" +
                          ".foo#bar.class2 { color: cyan }";
                // note last line: id selectors don't necessarily need to come last

                var result = match(css, { tag: "div" });   // all selectors including a 'div' type selector
                expect(result.length).toBe(4);

                result = matchAgain({ clazz: "foo" });      // all selectors including a '.foo' class selector
                expect(result.length).toBe(6);

                result = matchAgain({ clazz: "class2" });   // all selectors including a '.class2' class selector
                expect(result.length).toBe(3);

                result = matchAgain({ id: "bar" });         // all selectors including a '#bar' id selector
                expect(result.length).toBe(4);
            });

            it("should allow searching conjunctions of type, class, and id", function () {
                // TODO: not required for Sprint 4

                // var css = "div.foo { color:red } \n" +
                //           "div#bar { color:green } \n" +
                //           "div.foo#bar { color:blue } \n" +
                //           ".foo#bar { color:black } \n" +
                //           "div.foo.class2 { color: white } \n" +
                //           ".foo.class2 { color: yellow } \n" +
                //           ".foo#bar.class2 { color: cyan }";
                // // note last line: id selectors don't necessarily need to come last
                //
                // var result = match(css, { tag: "div", clazz: "foo" });   // all selectors including a 'div' type selector AND a '.foo' class selector
                // expect(result.length).toBe(3);
                //
                // // TODO: any way to search two of the same thing? (e.g. all selectors including a '.foo' AND a '.class2' class selector)
                //
                // result = matchAgain({ clazz: "foo", id: "bar" });   // all selectors including a '.foo' class selector AND a '#bar' id selector
                // expect(result.length).toBe(3);
                //
                // result = matchAgain({ tag: "div", id: "bar" });      // all selectors including a 'div' type selector AND a '#bar' id selector
                // expect(result.length).toBe(2);
                //
                // result = matchAgain({ tag: "div", clazz: "foo", id: "bar" });
                // expect(result.length).toBe(1);
                //
                // result = matchAgain({ tag: "div", clazz: "class2", id: "bar" });
                // expect(result.length).toBe(0);
            });

            it("should match lone '*' given any tag; else ignore", function () {
                var css = "* { color:red } \n" +
                          "*.foo { color:green } \n" +
                          "*#bar { color:blue } \n" +
                          "*.foo#bar { color:yellow }";
                // should be treated the same as: *, .foo, #bar, .foo#bar respectively

                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);

                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(2);

                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(2);

                result = matchAgain({ clazz: "otherClass" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "otherId" });
                expect(result.length).toBe(0);

                result = match("div * { color:red }", { tag: "span"});
                expect(result.length).toBe(1);
                matchAgain({ tag: "div"});      // only because '*' matches 'div'
                expect(result.length).toBe(1);

                result = match(".foo * { color:red }", { tag: "span"});
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo"});
                expect(result.length).toBe(0);

                result = match("#bar * { color:red }", { tag: "span"});
                expect(result.length).toBe(1);
                result = matchAgain({ id: "bar"});
                expect(result.length).toBe(0);
            });

            it("should ignore pseudo-class selectors", function () {
                // Note: not actually required for Sprint 4
                var css = "div:hover { color:red } \n" +
                          ".foo:hover { color:green } \n" +
                          "div.foo:hover { color:blue } \n" +
                          "#bar:hover { color:yellow } \n" +
                          "div#bar:hover { color:black } \n" +
                          ".foo.class2:hover { color:white } \n" +
                          "div:focus:hover { color:cyan } \n" +
                          "div.foo:focus:hover { color:brown } \n" +
                          ".foo:focus:hover { color:pink } \n" +
                          "div:focus.class3:hover { color:purple } \n" +
                          ":focus.class3:hover { color:gray }";

                var result = match(css, { tag: "div" });
                expect(result.length).toBe(6);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(5);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(2);

                result = matchAgain({ clazz: "class3" });
                expect(result.length).toBe(2);

                result = matchAgain({ tag: "hover" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "hover" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "hover" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "focus" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "focus" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "focus" });
                expect(result.length).toBe(0);
            });

            it("should ignore pseudo-elements with arguments", function () {
                // Note: not actually required for Sprint 4
                var css = "div:nth-child(3) { color:red } \n" +
                          ".foo:nth-child(3) { color:green } \n" +
                          "div.foo:nth-child(3) { color:blue } \n" +
                          "#bar:nth-child(3) { color:yellow } \n" +
                          "div#bar:nth-child(3) { color:black } \n" +
                          ".foo.class2:nth-child(3) { color:white } \n" +
                          "div:nth-child(2n):nth-child(3) { color:cyan } \n" +
                          "div.foo:nth-child(2n):nth-child(3) { color:brown } \n" +
                          ".foo:nth-child(2n):nth-child(3) { color:pink } \n" +
                          "div:nth-child(2n).class3:nth-child(3) { color:purple } \n" +
                          ":nth-child(2n).class3:nth-child(3) { color:gray }";

                var result = match(css, { tag: "div" });
                expect(result.length).toBe(6);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(5);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(2);

                result = matchAgain({ clazz: "class3" });
                expect(result.length).toBe(2);

                result = matchAgain({ tag: "hover" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "hover" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "hover" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "focus" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "focus" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "focus" });
                expect(result.length).toBe(0);
            });

            it("should ignore attribute selectors", function () {
                // Note: not actually required for Sprint 4
                var css = "div { color:red } \n" +
                          "div[foo] { color:green } \n" +
                          "h4[div] { color:blue } \n" +
                          "h4[foo] { color:blue } \n" +
                          "h4[title=\"div\"] { color:yellow } \n" +
                          "h4[title=\".foo\"] { color:yellow } \n" +
                          "h4[attr].bar { color:black } \n" +
                          "h4.bar[attr] { color:black }";

                var result = match(css, { tag: "div" });
                expect(result.length).toBe(2);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(6);

                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(2);
            });

            it("should ignore the content of strings", function () {
                // Spaces inside string, single quotes
                var result = match("div[attr='.foo #bar'] {}", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(0);

                // ...double quotes
                result = match("div[attr=\".foo #bar\"] {}", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(0);

                // Quotes nested within quotes
                var css = "div[attr=\"value with \\\"nested double .quotes\\\"\"] { color:red } \n" +
                          "div[attr=\"value with 'single .quotes'\"] { color:green } \n" +
                          "div[attr='value with \\'nested single .quotes\\''] { color:blue } \n" +
                          "div[attr='value with \"double .quotes\"'] { color:blue } \n" +
                          "div[attr='value with \"double .quotes\"'].foo { color:yellow } \n" +
                          "div#bar[attr='value with \"double .quotes\"h4'] { color:white } \n" +
                          "div[attr='value with \"double .quotes\"h4'] .foo { color:black } \n" +
                          ".foo { color:cyan }";

                result = match(css, { tag: "div"});
                expect(result.length).toBe(6);
                result = matchAgain({ clazz: "foo"});
                expect(result.length).toBe(3);
                result = matchAgain({ id: "bar"});
                expect(result.length).toBe(1);

                result = matchAgain({ clazz: "quotes"});
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4"});
                expect(result.length).toBe(0);

                // Braces inside string; string inside rule (not inside selector)
                css = "a::after { content: ' {' attr(href) '}'; } \n" +
                      ".foo { color:red } \n" +
                      "a::after { content: \" {\" attr(href) \"}\"; } \n" +
                      "li::before { content: \"} h4 { color:black }\"; } \n" +
                      "div { color:green }";

                result = match(css, { tag: "a" });
                expect(result.length).toBe(2);
                result = matchAgain({ tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);

                // Quotes AND braces nested inside string
                result = match("div::after { content: \"\\\"}\\\"\"; }\nh4 { color: red}", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);

                result = match("div::after { content: \"\\\"{\"; }\nh4 { color: red}", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);

                css = "@import \"null?\\\"{\"; \n" +   // a real-world CSS hack similar to the above case
                      "div { color: red }";

                result = match(css, { tag: "div" });
                expect(result.length).toBe(1);

                // Newline inside string (escaped)
                result = match("li::before { content: 'foo\\nbar'; } \n div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);

                // Newline inside string (unescaped, with backslash line terminator)
                result = match("li::before { content: 'foo\\\nbar'; } \n div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);

                // Comments inside strings
                // '/*' in a string does not start a comment...
                result = match("div::before { content: \"/*\"; } \n h4 { color: red }", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);

                // If not in a comment, '*/' is also fine...
                result = match("div::before { content: \"/**/\"; } \n h4 { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);

                result = match("div::before { content: \"/*\"; } \n h4::before { content: \"*/\" }", { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);

                // But if already in a comment, '*/' in a string DOES END the comment
                // So the rule below is equivalent to "span::before { content:\"foo\"; }"
                result = match("span::before { content:/*div::before { content: \"*/\"foo\"; } \n h4 { color:red }", { tag: "div" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "span" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(1);
            });

            it("should handle unusual whitespace", function () {
                // This is valid CSS, but both Chrome and FF treat it as invalid
                // It *should* be treated as ".foo .bar" (not ".foo.bar")
                var css = ".foo\n" +
                          ".bar\n" +
                          "{ color: red; }";
                var result = match(css, { clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(1);

                css = ".foo\n" +
                      "{\n" +
                      "    color: red;\n" +
                      "}";

                result = match(css, { clazz: "foo" });
                expect(result.length).toBe(1);
            });

            it("shouldn't crash on CSS3 selectors", function () {
                // See spec: http://www.w3.org/TR/selectors/

                // Attribute selectors
                match("[role] {}");
                match("a[href] {}");
                match(".slider[role] {}");
                match("a[href][nofollow] {}");
                match("[href][nofollow] {}");
                match("[attr='value'] {}");
                match("[attr=\"value\"] {}");
                match("[attr~='value'] {}");
                match("[attr|='value'] {}");
                match("[attr^='value'] {}");
                match("[attr$='value'] {}");
                match("[attr*='value'] {}");
                match("div[attr*='value'].myClass#myId {}");
                match("div#myId[attr*='value'].myClass {}");
                match(":focus[attr=\"value\"].className {}");

                match("tagName[attr2='value'] {}");
                match("tagName[attr2 = 'value'] {}");
                match("tagName[attr2 ='value'] {}");
                match("tagName[attr2= 'value'] {}");
                match("tagName[attr2=\"value\"] {}");
                match("[attr2='value'] {}");
                match("tagName[attr=\"value\"][attr2=\"value2\"] {}");
                match("tagName[attr='value'][attr2='value2'] {}");
                match(":not([attr2=\"value2\"]) {}");

                // Pseudo-classes with complicated syntax
                match(":lang(de) {}");
                match(":lang(en-US) {}");
                match("ul:nth-child(+2n) {}");
                match("ul:nth-child( 2n + 1 ) {}");
                match("ul:nth-child(2n + 1) {}");
                match("ul:nth-child(2n+1) {}");
                match("ul:nth-child(-2n+1) {}");
                match("ul:nth-child(+n+1) {}");
                match("ul:nth-child(n-1) {}");
                match("ul:nth-child(0n+5) {}");
                match("ul:nth-child(-0n+5) {}");
                match("ul:nth-child(n) {}");
                match("ul:nth-child(2) {}");
                match("ul:nth-child(-2) {}");
                match("ul:nth-child(-2)[href^='ftp']#myId.myClass {}");

                // :not is especially nasty
                match(":not(:link) {}");
                match(":not(:link):not(:focus) {}");
                match("tagName:not(.className).className2 {}");
                match(".className:not(tagName) {}");
                match("tagName:not(.className) {}");
                match(":not(tagName.className) {}");
                match("tagName:not([attr=\"value\"]) {}");
                match("tagName:not([attr=\"value\"])[attrB='valueB'] {}");
                match("tagName[attr='value']:not([attrB=\"valueB\"]) {}");

                // Pseudo-elements (can only occur once, and must be after the rightmost combinator)
                match("::first-line {}");
                match("tagName::first-line {}");
                match(".className::first-line {}");
                match("::first-line.className {}"); //spec says this is valid but no browsers seem to support it
                match("p:hover::first-line {}");
                // not valid: :not(::first-line) - because pseudo-elements aren't simple selectors

                // Namespaces
                var nsDecl = "@namespace ns \"http://www.example.com\"\n";
                match("[*|role] {}");
                match("[|role] {}");
                match(nsDecl + "[ns|role] {}");
                match(nsDecl + "[ns|role|='value'] {}");
                match("*|div {}");
                match("|div {}");
                match(nsDecl + "ns|div {}");
                match("*|* {}");
                match("|* {}");
                match(nsDecl + "ns|* {}");
                match("*|*:not(*) {}");      // actual example from W3C spec; 5 points if you can figure out what it means!
            });

            it("shouldn't crash on CSS Animation syntax (@keyframes)", function () {
                var css = "div { color:red } \n" +
                          "@keyframes slide { \n" +
                          "  from { left: 0; } \n" +
                          "  50% { left: 30px; } \n" +
                          "  to { left: 100px; } \n" +
                          "} \n" +
                          ".foo { color:green }";

                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);

                result = matchAgain({ tag: "slide" });
                expect(result.length).toBe(0);

                result = matchAgain({ tag: "from" });
                expect(result.length).toBe(0);
            });

            it("should find selectors that are after a rule starting with a pseudo selector/element", function () {
                var css = ":focus { color:red; } \n" +
                          "div { color:blue; } \n" +
                          "::selection { color:green; } \n" +
                          ".Foo { color:black } \n" +
                          "#bar { color:blue } \n" +
                          "#baR { color:white }";

                var result = match(css, { tag: "div" });
                expect(result.length).toBe(1);

                result = matchAgain({ clazz: "Foo" });
                expect(result.length).toBe(1);

                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);

                result = matchAgain({ id: "baR" });
                expect(result.length).toBe(1);
            });

        }); // describe("Simple selectors")


        describe("Combinators", function () {
            it("should ignore descendant combinators", function () {
                var result = match("h4 .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();

                result = match("p h4 div { color:red }", { tag: "p" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "div" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();

                result = match(".foo h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);

                result = match("div div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();
                result = match(".foo .foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();
                result = matchAgain({ tag: "foo" });
                expect(result.length).toBe(0);
            });

            it("should ignore other combinators", function () {
                var result = match("h4 > .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBeUndefined();

                result = match(".foo > h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);

                result = match("h4 + .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);

                result = match(".foo + h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);

                result = match("p > h4 + div { color:red }", { tag: "p" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "div" });
                expect(result.length).toBe(1);
                result = match("p > h4 div { color:red }", { tag: "p" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);
                result = match("p > h4 div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);

                result = match("h4>.foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = match("h4> .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = match("h4 >.foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);

                result = match("h4+.foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);

                result = match("h4 * .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = match("h4 ~ .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);

            });

            // Issue #1699
            it("should find the target of combinators with no whitespace", function () {
                // Child combinator
                var result = match("foo>section { color: red }", { tag: "section" });
                expect(result.length).toBe(1);
                // Adjacent sibling combinator
                result = match("foo+section { color: red }", { tag: "section" });
                expect(result.length).toBe(1);
                // General sibling combinator
                result = match("foo~section { color: red }", { tag: "section" });
                expect(result.length).toBe(1);
                // Invalid combinator
                result = match("foo!section { color: red }", { tag: "section" });
                expect(result.length).toBe(0);
            });
        }); // describe("Combinators")


        describe("Selector groups", function () {
            it("should match any item in selector group", function () {
                // Comma- and space- separated
                var result = match("h4, .foo, #bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4, .foo, #bar");
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4, .foo, #bar");
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4, .foo, #bar");

                // Comma only
                result = match("h4,.foo,#bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4,.foo,#bar");
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4,.foo,#bar");
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4,.foo,#bar");

                // Newline-separated
                result = match("h4,\n.foo,\r\n#bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4, .foo, #bar");
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4, .foo, #bar");
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4, .foo, #bar");

                // Space-separated with a space combinator
                result = match("h4, .foo #bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4, .foo #bar");
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                expect(result[0].selectorGroup).toBe("h4, .foo #bar");

                // Test items of each type in all positions (first, last, middle)
                result = match("h4, h4, h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(3);
                var i;
                for (i = 0; i < 3; i++) {
                    expect(result[i].selectorGroup).toBe("h4, h4, h4");
                }
                result = match(".foo, .foo, .foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(3);
                for (i = 0; i < 3; i++) {
                    expect(result[i].selectorGroup).toBe(".foo, .foo, .foo");
                }
                result = match("#bar, #bar, #bar { color:red }", { id: "bar" });
                expect(result.length).toBe(3);
                for (i = 0; i < 3; i++) {
                    expect(result[i].selectorGroup).toBe("#bar, #bar, #bar");
                }
            });
        }); // describe("Selector groups")


        describe("At-rules", function () {
            it("should handle @media", function () {
                // TODO - not required for Sprint 4
            });

            it("should handle @page", function () {
                // TODO - not required for Sprint 4
            });
        }); // describe("At-rules")


        // The following tests were for known failures in the LESS parser
        describe("LESS Known Issues", function () {

            it("should handle an empty declaration (extra semi-colon)", function () {
                var result = match("h4 { color:red;; }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = match("div{; color:red}", { tag: "div" });
                expect(result.length).toBe(1);
            });

            it("should handle IE filter syntaxes", function () {
                var result = match("div{opacity:0; filter:alpha(opacity = 0)}", { tag: "div" });
                expect(result.length).toBe(1);
                result = match("div { filter:alpha(opacity = 0) }", { tag: "div" });
                expect(result.length).toBe(1);
                result = match("div { filter:progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr='#92CBE0',EndColorStr='#6B9EBC'); }",
                    { tag: "div" });
                expect(result.length).toBe(1);
            });

            it("should handle unnecessary escape codes", function () {
                var result = match("div { f\\loat: left; }", { tag: "div" });
                expect(result.length).toBe(1);
            });

            it("should handle comments within properties", function () {
                match("div { display/**/: block; }");
                match("div/**/ { display: block; }");
                match("div /**/{ display: block; }");
                match("div {/**/ display: block; }");
                match("div { /**/display: block; }");
                match("div { display:/**/ block; }");
                match("div { display: /**/block; }");
                match("div { display: block/**/; }");
                match("div { display: block /**/; }");
            });

        }); // describe("Known Issues")

        describe("Nested rules defined inside @media (SCSS)", function () {
            var result;
            it("should find all different levels of nested selectors", function () {
                result = match(mediaTestScss, { tag: "a" }, "text/x-scss");
                expect(result.length).toBe(6);

                result = matchAgain({ clazz: "navbar-right" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".navbar-nav / &.navbar-right:last-child");

                result = matchAgain({ clazz: "dropdown-menu" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".navbar-nav / .open .dropdown-menu");

                result = matchAgain({ clazz: "dropdown-header" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".navbar-nav / .open .dropdown-menu / .dropdown-header");

                result = matchAgain({ clazz: "navbar-nav" }, "text/x-scss");
                expect(result.length).toBe(2);
                expectCompleteSelectors(result[0], ".navbar-nav");
                expectCompleteSelectors(result[1], ".navbar-nav / &.navbar-right:last-child");
            });

            it("should find the only one li tag selector that is also the right most of combinators", function () {
                result = matchAgain({ tag: "li" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".navbar-nav / > li");
            });

            it("should not find a nested parent selector of a descendant combinator", function () {
                // Verify that 'open' won't match '.open .dropdown-menu {}' rule
                result = matchAgain({ clazz: "open" }, "text/x-scss");
                expect(result.length).toBe(0);
            });

        }); // describe("Nested rules defined inside @media (SCSS)")

        describe("Nested rules defined inside @media (LESS)", function () {
            var result;
            it("should find all different levels of nested selectors", function () {
                result = match(mediaTestLess, { tag: "a" }, "text/x-less");
                expect(result.length).toBe(6);

                result = matchAgain({ tag: "th" }, "text/x-less");
                expect(result.length).toBe(3);
                expectCompleteSelectors(result[0], "*");
                expectCompleteSelectors(result[1], ".table / th");
                expectCompleteSelectors(result[2], ".table-bordered / th");

                result = matchAgain({ clazz: "btn" }, "text/x-less");
                expect(result.length).toBe(2);
                expectCompleteSelectors(result[0], ".btn");
                expectCompleteSelectors(result[1], ".dropup > .btn");

                result = matchAgain({ clazz: "table" }, "text/x-less");
                expect(result.length).toBe(2);
                expectCompleteSelectors(result[0], ".table");
                expectCompleteSelectors(result[1], ".table");

                result = matchAgain({ clazz: "caret" }, "text/x-less");
                expect(result.length).toBe(1);
                // https://github.com/adobe/brackets/issues/8894
                expectCompleteSelectors(result[0], ".btn, .dropup > .btn / > .caret");
            });

            it("should not find a nested parent selector of a child combinator", function () {
                // Verify that 'dropup' won't match '.dropup > .btn' rule
                result = matchAgain({ clazz: "dropup" }, "text/x-less");
                expect(result.length).toBe(0);
            });

        }); // describe("Nested rules defined inside @media (LESS)")

        describe("Nested rules with SCSS mixins", function () {
            var result;
            it("should find all different levels of nested selectors", function () {
                result = match(mixinTestScss, { clazz: "table" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], "@mixin table-row-variant($state, $background) / .table");

                result = matchAgain({ tag: "th" }, "text/x-scss");
                expect(result.length).toBe(2);
                expectCompleteSelectors(result[0], "@mixin table-row-variant($state, $background) / .table / > thead, > tbody, > tfoot / > .#{$state} > th");
                expectCompleteSelectors(result[1], "@mixin table-row-variant($state, $background) / .table-hover > tbody / > .#{$state}:hover > th");

                result = matchAgain({ clazz: "dropdown-toggle" }, "text/x-scss");
                expect(result.length).toBe(2);
                expectCompleteSelectors(result[0], "@mixin button-variant($color, $background, $border) / .open & / &.dropdown-toggle");
                expectCompleteSelectors(result[1], "@mixin button-variant($color, $background, $border) / .open & / &.dropdown-toggle");

                result = matchAgain({ clazz: "badge" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], "@mixin button-variant($color, $background, $border) / .badge");
            });

            it("should not find a nested parent selector of a descendant combinator", function () {
                result = matchAgain({ tag: "tr" }, "text/x-scss");
                expect(result.length).toBe(0);
            });

        }); // describe("Nested rules with SCSS mixins")

        describe("Nested rules with LESS mixins", function () {
            var result;
            it("should find all different levels of nested selectors", function () {
                result = match(mixinTestLess, { clazz: "panel-body" }, "text/x-less");
                expect(result.length).toBe(2);
                expectCompleteSelectors(result[0], ".panel-variant(@border; @heading-text-color; @heading-bg-color; @heading-border) / & > .panel-heading / + .panel-collapse .panel-body");
                expectCompleteSelectors(result[1], ".panel-variant(@border; @heading-text-color; @heading-bg-color; @heading-border) / & > .panel-footer / + .panel-collapse .panel-body");

                result = matchAgain({ clazz: "panel-heading" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".panel-variant(@border; @heading-text-color; @heading-bg-color; @heading-border) / & > .panel-heading");

                result = matchAgain({ clazz: "panel-footer" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".panel-variant(@border; @heading-text-color; @heading-bg-color; @heading-border) / & > .panel-footer");

                result = matchAgain({ clazz: "input-group-addon" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".form-control-validation(@text-color: #555; @border-color: #ccc; @background-color: #f5f5f5) / .input-group-addon");
            });

            // https://github.com/adobe/brackets/issues/8852
            it("should find the rule that follows the code passing in a ruleset to a mixin", function () {
                result = matchAgain({ clazz: "after-passing-ruleset-to-mixin" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-passing-ruleset-to-mixin");
            });

            // https://github.com/adobe/brackets/issues/8850
            it("should find the rule that succeeds the mixin with multiple parameters having default values and semicolons", function () {
                result = matchAgain({ tag: "div" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], "div");
            });
        }); // describe("Nested rules with LESS mixins")

        describe("Variable interpolation in SCSS", function () {
            var result;
            // https://github.com/adobe/brackets/issues/8870
            it("should find a rule that has a variable interpolated selector", function () {
                // Verify that "#{$name} a" can be searched with "a" tag
                result = match(varInterpolationTestScss, { tag: "a" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".#{$name} a");
            });

            // https://github.com/adobe/brackets/issues/8851
            it("should find rules after a rule with variable interpolated selector", function () {
                result = matchAgain({ clazz: "after-variable-interpolated-selector" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-variable-interpolated-selector");
            });

            // https://github.com/adobe/brackets/issues/8875
            it("should find rules after a rule with variable interpolated property", function () {
                result = matchAgain({ clazz: "after-variable-interpolated-property" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-variable-interpolated-property");
            });

            it("should find rules after a rule with variable interpolated url", function () {
                result = matchAgain({ clazz: "after-variable-interpolated-url" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-variable-interpolated-url");
            });
        }); // describe("Variable interpolation in SCSS")

        describe("Variable interpolation in LESS", function () {
            var result;
            // https://github.com/adobe/brackets/issues/8870
            it("should find rules with variable interpolated selectors", function () {
                result = match(varInterpolationTestLess, { clazz: "@{mySelector}" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".@{mySelector}");
            });

            // https://github.com/adobe/brackets/issues/8851
            it("should find rules after a rule with variable interpolated selector", function () {
                result = matchAgain({ clazz: "after-variable-interpolated-selector" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-variable-interpolated-selector");
            });

            // https://github.com/adobe/brackets/issues/8875
            it("should find rules after a rule with variable interpolated property", function () {
                result = matchAgain({ clazz: "after-variable-interpolated-property" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-variable-interpolated-property");
            });

            it("should find rules after a rule with variable interpolated url", function () {
                result = matchAgain({ clazz: "after-variable-interpolated-url" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-variable-interpolated-url");
            });
        }); // describe("Variable interpolation in LESS")

        describe("Parsing SCSS variable interpolation as LESS", function () {
            var result;
            it("should find a rule that has a variable interpolated selector", function () {
                // Verify that "#{$name} a" can be searched with "a" tag
                result = match(varInterpolationTestScss, { tag: "a" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".#{$name} a");
            });

            it("should find rules after a rule with variable interpolated selector", function () {
                result = matchAgain({ clazz: "after-variable-interpolated-selector" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-variable-interpolated-selector");
            });

            // https://github.com/adobe/brackets/issues/8965
            it("should find rules after a rule with variable interpolated property", function () {
                result = matchAgain({ clazz: "after-variable-interpolated-property" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-variable-interpolated-property");
            });

            it("should find rules after a rule with variable interpolated url", function () {
                result = matchAgain({ clazz: "after-variable-interpolated-url" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".after-variable-interpolated-url");
            });
        }); // describe("Parsing SCSS variable interpolation as LESS")

        describe("Reference parent selector with &", function () {
            var result;
            it("should find rules that are prefixed with &", function () {
                result = match(parentSelectorTestLess, { clazz: "button-custom" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".button / &-custom");

                result = matchAgain({ clazz: "button-ok" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".button / &-ok");
            });

            it("should find rules that prepend a selector to the inherited parent selector using &", function () {
                result = matchAgain({ clazz: "menu" }, "text/x-less");
                expect(result.length).toBe(2);
                expectCompleteSelectors(result[0], ".header / .menu");
                expectCompleteSelectors(result[1], ".header / .menu / .no-borderradius &");
            });

            it("should find rules that have multiple & references to multiple levels of parent selectors", function () {
                result = matchAgain({ clazz: "parent" }, "text/x-less");
                expect(result.length).toBe(5);
                expectCompleteSelectors(result[0], ".grand / .parent");
                expectCompleteSelectors(result[1], ".grand / .parent / & > &");
                expectCompleteSelectors(result[2], ".grand / .parent / & &");
                expectCompleteSelectors(result[3], ".grand / .parent / &&");
                expectCompleteSelectors(result[4], ".grand / .parent / &");

                result = matchAgain({ clazz: "parentish" }, "text/x-less");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".grand / .parent / &ish");
            });

            it("should not find a nested rule that has parent selector & as the rightmost selector", function () {
                // Verify that '.no-borderradius' won't match '.no-borderradius & {}' rule
                result = matchAgain({ clazz: "no-borderradius" }, "text/x-less");
                expect(result.length).toBe(0);
            });
        }); // describe("Reference parent selector with &")

        // https://github.com/adobe/brackets/issues/8945
        describe("Nested rules following an @include block", function () {
            it("should find rules that succeed @include blocks", function () {
                var result = match(includeMixinTestScss, { tag: "h3" }, "text/x-scss");
                expect(result.length).toBe(1);
                expectCompleteSelectors(result[0], ".sidebar / h3");

                result = matchAgain({ tag: "a" }, "text/x-scss");
                expect(result.length).toBe(2);
                expectCompleteSelectors(result[0], ".sidebar / a");
                expectCompleteSelectors(result[1], ".sidebar / a / &:hover");
            });
        }); // describe("Nested rules following an @include block")


        describe("CSS Integration Tests", function () {
            this.category = "integration";

            var testPath = SpecRunnerUtils.getTestPath("/spec/CSSUtils-test-files"),
                testWindow,
                CSSUtils,
                DocumentManager,
                FileViewController;

            beforeFirst(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;

                    // Load module instances from brackets.test
                    CSSUtils            = testWindow.brackets.test.CSSUtils;
                    DocumentManager     = testWindow.brackets.test.DocumentManager;
                    FileViewController  = testWindow.brackets.test.FileViewController;

                    // Load test project
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
            });

            afterLast(function () {
                CSSUtils            = null;
                DocumentManager     = null;
                FileViewController  = null;
                SpecRunnerUtils.closeTestWindow();
            });

            afterEach(function () {
                testWindow.closeAllFiles();
            });


            describe("Working with real public CSSUtils API", function () {

                it("should include comment preceding selector (issue #403)", function () {
                    var rules;
                    runs(function () {
                        var promise = CSSUtils.findMatchingRules("#issue403")
                            .done(function (result) { rules = result; });
                        waitsForDone(promise, "CSSUtils.findMatchingRules()");
                    });

                    runs(function () {
                        expect(rules.length).toBe(1);
                        expect(rules[0].lineStart).toBe(4);
                        expect(rules[0].lineEnd).toBe(7);
                    });
                });

                it("should continue search despite unreadable files (issue #10013)", function () {
                    runs(function () {
                        // Add a nonexistent CSS file to the ProjectManager.getAllFiles() result, which will force a file IO error
                        // when we try to read the file later. Similar errors may arise in real-world for non-UTF files, etc.
                        SpecRunnerUtils.injectIntoGetAllFiles(testWindow, testPath + "/doesNotExist.css");

                        var promise = CSSUtils.findMatchingRules("html");
                        promise.done(function (result) {
                            expect(result.length).toBeGreaterThan(0);
                        });
                        waitsForDone(promise, "CSSUtils.findMatchingRules()");
                    });
                });
            });

            describe("Working with unsaved changes", function () {

                it("should return the correct offsets if the file has changed", function () {
                    runs(function () {
                        var promise = FileViewController.openAndSelectDocument(testPath + "/simple.css", FileViewController.PROJECT_MANAGER);
                        waitsForDone(promise, "FileViewController.openAndSelectDocument()");
                    });

                    var rules = null;

                    runs(function () {
                        var doc = DocumentManager.getCurrentDocument();

                        // Add several blank lines at the beginning of the text
                        doc.setText("\n\n\n\n" + doc.getText());

                        // Look for ".FIRSTGRADE"
                        var promise = CSSUtils.findMatchingRules(".FIRSTGRADE")
                            .done(function (result) { rules = result; });
                        waitsForDone(promise, "CSSUtils.findMatchingRules()");

                        doc = null;
                    });

                    runs(function () {
                        expect(rules.length).toBe(1);
                        expect(rules[0].lineStart).toBe(16);
                        expect(rules[0].lineEnd).toBe(18);
                    });
                });

                it("should return a newly created rule in an unsaved file", function () {
                    runs(function () {
                        var promise = FileViewController.openAndSelectDocument(testPath + "/simple.css", FileViewController.PROJECT_MANAGER);
                        waitsForDone(promise, "FileViewController.openAndSelectDocument()");
                    });

                    var rules = null;

                    runs(function () {
                        var doc = DocumentManager.getCurrentDocument();

                        // Add a new selector to the file
                        doc.setText(doc.getText() + "\n\n.TESTSELECTOR {\n    font-size: 12px;\n}\n");

                        // Look for the selector we just created
                        var promise = CSSUtils.findMatchingRules(".TESTSELECTOR")
                            .done(function (result) { rules = result; });
                        waitsForDone(promise, "CSSUtils.findMatchingRules()");

                        doc = null;
                    });

                    runs(function () {
                        expect(rules.length).toBe(1);
                        expect(rules[0].lineStart).toBe(24);
                        expect(rules[0].lineEnd).toBe(26);
                    });
                });
            });
        });

    }); //describe("CSS Parsing")



    describe("CSSUtils - Other", function () {
        function doAddRuleTest(options) {
            var mock = SpecRunnerUtils.createMockEditor(options.initialText, "css"),
                doc = mock.doc,
                result = CSSUtils.addRuleToDocument(doc, options.selector, options.useTab, options.indentUnit);

            // Normalize line endings so tests pass on all Operating Systems
            var normalizedDocText = FileUtils.translateLineEndings(doc.getText(), FileUtils.LINE_ENDINGS_LF),
                normalizedResText = FileUtils.translateLineEndings(options.resultText, FileUtils.LINE_ENDINGS_LF);

            expect(normalizedDocText).toEqual(normalizedResText);
            expect(result).toEqual(options.result);
            SpecRunnerUtils.destroyMockEditor(doc);
        }

        it("should add a new rule with the given selector to the given document using tab indent and return its range", function () {
            doAddRuleTest({
                initialText: simpleTestCss,
                selector: "#myID",
                useTab: true,
                resultText: simpleTestCss + "\n#myID {\n\t\n}\n",
                result: {
                    range: {
                        from: { line: 23, ch: 0 },
                        to: { line: 25, ch: 1 }
                    },
                    pos: { line: 24, ch: 1 }
                }
            });
        });

        it("should add a new rule with the given selector to the given document using space indent and return its range", function () {
            doAddRuleTest({
                initialText: simpleTestCss,
                selector: "#myID",
                useTab: false,
                indentUnit: 4,
                resultText: simpleTestCss + "\n#myID {\n    \n}\n",
                result: {
                    range: {
                        from: { line: 23, ch: 0 },
                        to: { line: 25, ch: 1 }
                    },
                    pos: { line: 24, ch: 4 }
                }
            });
        });

        it("should add a new rule to an empty document", function () {
            doAddRuleTest({
                initialText: "",
                selector: "#myID",
                useTab: false,
                indentUnit: 4,
                resultText: "\n#myID {\n    \n}\n",
                result: {
                    range: {
                        from: { line: 1, ch: 0 },
                        to: { line: 3, ch: 1 }
                    },
                    pos: { line: 2, ch: 4 }
                }
            });
        });

        it("should consolidate consecutive rules that refer to the same item and replace names with selector groups", function () {
            var doc1 = SpecRunnerUtils.createMockDocument(""),
                doc2 = SpecRunnerUtils.createMockDocument(""),
                rules = [
                    {
                        name: ".foo",
                        doc: doc1,
                        lineStart: 5,
                        lineEnd: 7
                    },
                    {
                        name: ".eek",
                        doc: doc1,
                        lineStart: 10,
                        lineEnd: 12,
                        selectorGroup: "#blah, .eek, .glah"
                    },
                    {
                        name: ".bar",
                        doc: doc2,
                        lineStart: 3,
                        lineEnd: 5
                    },
                    {
                        name: "#baz",
                        doc: doc2,
                        lineStart: 8,
                        lineEnd: 12,
                        selectorGroup: "#baz, h2"
                    },
                    {
                        name: "h2",
                        doc: doc2,
                        lineStart: 8,
                        lineEnd: 12,
                        selectorGroup: "#baz, h2"
                    },
                    {
                        name: ".argle",
                        doc: doc2,
                        lineStart: 15,
                        lineEnd: 20
                    }
                ],
                result = CSSUtils.consolidateRules(rules);

            expect(result).toEqual([
                rules[0],
                {
                    name: "#blah, .eek, .glah",
                    doc: doc1,
                    lineStart: 10,
                    lineEnd: 12,
                    selectorGroup: "#blah, .eek, .glah"
                },
                rules[2],
                {
                    name: "#baz, h2",
                    doc: doc2,
                    lineStart: 8,
                    lineEnd: 12,
                    selectorGroup: "#baz, h2"
                },
                rules[5]
            ]);
        });

        it("should extract selectors at the beginning of a text range", function () {
            var doc = SpecRunnerUtils.createMockDocument(".foo {}\n.bar, #baz {\n    color: #fff;\n}\nh2 {}\n"),
                range = new TextRange(doc, 1, 3);
            expect(CSSUtils.getRangeSelectors(range)).toBe(".bar, #baz");
            range.dispose();
        });

        it("should extract selectors spanning multiple lines at the beginning of a text range, with newlines replaced", function () {
            var doc = SpecRunnerUtils.createMockDocument(".foo {}\n.bar,\n#baz {\n    color: #fff;\n}\nh2 {}\n"),
                range = new TextRange(doc, 1, 3);
            expect(CSSUtils.getRangeSelectors(range)).toBe(".bar, #baz");
            range.dispose();
        });
    });



    // Unit Tests: "HTMLUtils (css)"
    describe("HTMLUtils InlineEditorProviders", function () {
        var editor;

        describe("Embedded <style> blocks: ", function () {
            beforeEach(function () {
                init(this, embeddedHtmlFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "html").editor;
                });
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
            });

            it("should find style blocks", function () {
                var styleBlocks = HTMLUtils.findStyleBlocks(editor);

                expect(styleBlocks.length).toBe(4);

                // Indexes of external UI are 1-based. Internal indexes are 0-based.
                // Style block positions are where embedded style sheet starts/ends.
                expect(styleBlocks[0].start).toEqual({ line:  5, ch: 23 });
                expect(styleBlocks[0].end).toEqual({   line: 17, ch:  1 });

                expect(styleBlocks[1].start).toEqual({ line: 19, ch: 27 });
                expect(styleBlocks[1].end).toEqual({   line: 21, ch:  1 });    // trailing whitespace stripped

                expect(styleBlocks[2].start).toEqual({ line: 23, ch:  7 });
                expect(styleBlocks[2].end).toEqual({   line: 30, ch:  0 });

                expect(styleBlocks[3].start).toEqual({ line: 30, ch: 15 });
                expect(styleBlocks[3].end).toEqual({   line: 34, ch:  0 });
            });
        });
    });



    // These tests are based on the implementation spec at https://github.com/adobe/brackets/wiki/CSS-Context-API-implementation-spec.
    describe("CSS Context Info", function () {
        var contextTest = SpecRunnerUtils.parseOffsetsFromText(contextTestCss),
            testEditor,
            result,
            i;

        beforeEach(function () {
            var mock = SpecRunnerUtils.createMockEditor(contextTest.text, "css");
            testEditor = mock.editor;
        });

        afterEach(function () {
            SpecRunnerUtils.destroyMockEditor(testEditor.document);
            testEditor = null;
        });

        function expectContext(result, expected) {
            expect(result.context).toBe(expected.context === undefined ? "" : expected.context);
            expect(result.name).toBe(expected.name === undefined ? "" : expected.name);
            expect(result.offset).toBe(expected.offset === undefined ? 0 : expected.offset);
            expect(result.isNewItem).toBe(expected.isNewItem === undefined ? false : expected.isNewItem);
            expect(result.index).toBe(expected.index === undefined ? -1 : expected.index);
            expect(result.values).toEqual(expected.values === undefined ? [] : expected.values);
            expect(result.range).toEqual(expected.range);
        }

        function checkInfoAtOffsets(first, last, expected) {
            for (i = first; i <= last; i++) {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[i]);
                expected.offset = contextTest.offsets[i].ch - contextTest.offsets[first].ch;
                expectContext(result, expected);
            }
        }

        function expectEmptyPropName(offsets) {
            offsets.forEach(function (index) {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[index]);
                expectContext(result, { context: CSSUtils.PROP_NAME });
            });
        }

        describe("property names and values", function () {

            it("should return PROP_NAME with empty name immediately after rule start brace", function () {
                expectEmptyPropName([4, 22, 23, 25, 81]);
            });
            it("should return PROP_NAME with empty name immediately before end brace", function () {
                expectEmptyPropName([14, 24, 28, 90]);
            });
            it("should return PROP_NAME with empty name before whitespace before property name", function () {
                expectEmptyPropName([5, 17, 26]);
            });
            it("should return PROP_NAME with empty name in middle of whitespace before property name", function () {
                expectEmptyPropName([29, 30, 31]);
            });
            it("should return PROP_NAME with empty name at end of whitespace in rule with no property name", function () {
                expectEmptyPropName([27]);
            });
            it("should return PROP_NAME with empty name immediately after semicolon", function () {
                expectEmptyPropName([13, 89, 106]);
            });

            it("should return PROP_NAME at beginning/middle/end of a simple property name", function () {
                checkInfoAtOffsets(6, 8, {
                    context: CSSUtils.PROP_NAME,
                    name: "width",
                    index: -1,
                    values: []
                });
                checkInfoAtOffsets(82, 84, {
                    context: CSSUtils.PROP_NAME,
                    name: "width",
                    index: -1,
                    values: []
                });
            });

            it("should return PROP_NAME at beginning/middle/end of a hyphenated property name", function () {
                checkInfoAtOffsets(18, 21, {
                    context: CSSUtils.PROP_NAME,
                    name: "font-size"
                });
            });

            it("should return PROP_VALUE with 'new value' flag set immediately after colon", function () {
                [9, 85].forEach(function (offset) {
                    var range = (offset === 9) ? {start: { line: 1, ch: 11 }, end: { line: 1, ch: 15 }}
                                               : {start: { line: 25, ch: 20 }, end: { line: 25, ch: 24 }};
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[offset]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        offset: 0,
                        name: "width",
                        index: 0,
                        values: ["100%"],
                        isNewItem: true,
                        range: range
                    });
                });
            });

            it("should return PROP_VALUE without 'new value' flag set at beginning/middle/end of a simple property value", function () {
                checkInfoAtOffsets(10, 12, {
                    context: CSSUtils.PROP_VALUE,
                    name: "width",
                    index: 0,
                    values: ["100%"],
                    isNewItem: false,
                    range: {start: { line: 1, ch: 11 }, end: { line: 1, ch: 15 }}
                });
                checkInfoAtOffsets(86, 88, {
                    context: CSSUtils.PROP_VALUE,
                    name: "width",
                    index: 0,
                    values: ["100%"],
                    isNewItem: false,
                    range: {start: { line: 25, ch: 20 }, end: { line: 25, ch: 24 }}
                });
            });

            it("should return PROP_VALUE with correct values at beginning/middle of first multi-value property", function () {
                checkInfoAtOffsets(32, 35, {
                    context: CSSUtils.PROP_VALUE,
                    name: "font-family",
                    index: 0,
                    values: ['"Helvetica Neue", ', 'Arial, ', 'sans-serif'],
                    range: {start: { line: 15, ch: 17 }, end: { line: 15, ch: 52 }}
                });
            });
            it("should return PROP_VALUE with 'new value' flag set at end of double-quoted multi-value property", function () {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[36]);
                expect(result).toEqual({
                    context: CSSUtils.PROP_VALUE,
                    name: "font-family",
                    offset: 0,
                    isNewItem: true,
                    index: 1,
                    values: ['"Helvetica Neue",', 'Arial, ', 'sans-serif'], // whitespace after cursor is deliberately lost
                    range: {start: { line: 15, ch: 17 }, end: { line: 15, ch: 52 }}
                });
            });
            it("should return PROP_VALUE with correct values at beginning/middle of second multi-value property", function () {
                checkInfoAtOffsets(37, 39, {
                    context: CSSUtils.PROP_VALUE,
                    name: "font-family",
                    index: 1,
                    values: ['"Helvetica Neue", ', 'Arial, ', 'sans-serif'],
                    range: {start: { line: 15, ch: 17 }, end: { line: 15, ch: 52 }}
                });
            });
            it("should return PROP_VALUE with 'new value' flag set at end of second multi-value property", function () {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[40]);
                expect(result).toEqual({
                    context: CSSUtils.PROP_VALUE,
                    name: "font-family",
                    offset: 0,
                    isNewItem: true,
                    index: 2,
                    values: ['"Helvetica Neue", ', 'Arial,', 'sans-serif'], // whitespace after cursor is deliberately lost
                    range: {start: { line: 15, ch: 17 }, end: { line: 15, ch: 52 }}
                });
            });
            it("should return PROP_VALUE with correct values at beginning/middle/end of third multi-value property", function () {
                // No "isNew" in case 44 because we're right before the semicolon.
                checkInfoAtOffsets(41, 44, {
                    context: CSSUtils.PROP_VALUE,
                    name: "font-family",
                    index: 2,
                    values: ['"Helvetica Neue", ', 'Arial, ', 'sans-serif'],
                    range: {start: { line: 15, ch: 17 }, end: { line: 15, ch: 52 }}
                });
            });

            describe("multi-line cases", function () {
                it("should return PROP_VALUE with correct values at beginning/middle of first multi-value multi-line property", function () {
                    checkInfoAtOffsets(93, 95, {
                        context: CSSUtils.PROP_VALUE,
                        name: "font-family",
                        index: 0,
                        values: ['"Helvetica Neue",', 'Arial,', 'sans-serif'],
                        range: {start: { line: 20, ch: 8 }, end: { line: 22, ch: 18 }}
                    });
                });
                it("should return PROP_VALUE with 'new value' flag set at end of double-quoted multi-value multi-line property", function () {
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[96]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        name: "font-family",
                        offset: 0,
                        isNewItem: true,
                        index: 1,
                        values: ['"Helvetica Neue",', 'Arial,', 'sans-serif'], // whitespace after cursor is deliberately lost
                        range: {start: { line: 20, ch: 8 }, end: { line: 22, ch: 18 }}
                    });
                });
                it("should return PROP_VALUE with correct values at beginning/middle of second multi-value multi-line property", function () {
                    checkInfoAtOffsets(98, 100, {
                        context: CSSUtils.PROP_VALUE,
                        name: "font-family",
                        index: 1,
                        values: ['"Helvetica Neue",        ', 'Arial,', 'sans-serif'],
                        range: {start: { line: 20, ch: 8 }, end: { line: 22, ch: 18 }}
                    });
                });
                it("should return PROP_VALUE with 'new value' flag set at end of second multi-value multi-line property", function () {
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[101]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        name: "font-family",
                        offset: 0,
                        isNewItem: true,
                        index: 2,
                        values: ['"Helvetica Neue",        ', 'Arial,', 'sans-serif'], // whitespace after cursor is deliberately lost
                        range: {start: { line: 20, ch: 8 }, end: { line: 22, ch: 18 }}
                    });
                });
                it("should return PROP_VALUE with correct values at beginning/middle/end of third multi-value multi-line property", function () {
                    // No "isNew" in case 105 because we're right before the semicolon.
                    checkInfoAtOffsets(103, 105, {
                        context: CSSUtils.PROP_VALUE,
                        name: "font-family",
                        index: 2,
                        values: ['"Helvetica Neue",        ', 'Arial,        ', 'sans-serif'],
                        range: {start: { line: 20, ch: 8 }, end: { line: 22, ch: 18 }}
                    });
                });

                it("should return PROP_VALUE with 'new value' flag and existing values immediately after colon with multi-value multi-line property", function () {
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[91]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        name: "font-family",
                        offset: 0,
                        isNewItem: true,
                        index: 0,
                        values: ['"Helvetica Neue",', 'Arial,', 'sans-serif'],
                        range: {start: { line: 20, ch: 8 }, end: { line: 22, ch: 18 }}
                    });
                });

                it("should return PROP_VALUE with 'new value' flag and existing values at beginning of whitespace before value in multi-line property", function () {
                    for (i = 0; i <= 1; i++) {
                        result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[92 + (i * 5)]);
                        expect(result).toEqual({
                            context: CSSUtils.PROP_VALUE,
                            name: "font-family",
                            offset: 0,
                            isNewItem: true,
                            index: i,
                            values: ['"Helvetica Neue",', 'Arial,', 'sans-serif'],
                            range: {start: { line: 20, ch: 8 }, end: { line: 22, ch: 18 }}
                        });
                    }

                    // Note this test was split out of the previous loop because whitespace differed across cases
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[102]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        name: "font-family",
                        offset: 0,
                        isNewItem: true,
                        index: 2,
                        values: ['"Helvetica Neue",        ', 'Arial,', 'sans-serif'],
                        range: {start: { line: 20, ch: 8 }, end: { line: 22, ch: 18 }}
                    });
                });
            }); // multi-line cases

            it("should return PROP_VALUE with 'new value' flag and existing values immediately after colon with multi-value property", function () {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[45]);
                expect(result).toEqual({
                    context: CSSUtils.PROP_VALUE,
                    name: "font-family",
                    offset: 0,
                    isNewItem: true,
                    index: 0,
                    values: ['"Helvetica Neue", ', 'Arial, ', 'sans-serif'],
                    range: {start: { line: 15, ch: 17 }, end: { line: 15, ch: 52 }}
                });
            });
            it("should return PROP_VALUE with 'new value' flag and existing values at end of line after comma (possibly with whitespace)", function () {
                for (i = 46; i <= 47; i++) {
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[i]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        name: "font-family",
                        offset: 0,
                        isNewItem: true,
                        index: 1,
                        values: ["Arial,"],
                        range: {start: { line: 28 + ((i - 46) * 3), ch: 17 }, end: { line: 28 + ((i - 46) * 3), ch: 23 }}
                    });
                }
                for (i = 48; i <= 49; i++) {
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[i]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        name: "font-family",
                        offset: 0,
                        isNewItem: true,
                        index: 1,
                        values: ["Arial, "],
                        range: {start: { line: 34 + ((i - 48) * 3), ch: 17 }, end: { line: 34 + ((i - 48) * 3), ch: 23 }}
                    });
                }
            });

            it("should return PROP_VALUE with 'new value' flag at end of line when there are no existing values", function () {
                var lineArray = [41, 44, 47, 50, 112],
                    columnArray = [10, 11, 10, 11, 10];
                for (i = 70; i <= 74; i++) {
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[i]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        name: "width",
                        offset: 0,
                        isNewItem: true,
                        index: 0,
                        values: [],
                        range: {start: { line: lineArray[i - 70], ch: columnArray[i - 70] },
                                end: { line: lineArray[i - 70], ch: columnArray[i - 70] }}
                    });
                }
            });

            // This isn't ideal, but it's as spec'ed.
            it("should treat a value like rgba(0, 0, 0, 0) as separate tokens", function () {
                for (i = 0; i <= 1; i++) {
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[75 + i]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        name: "color",
                        offset: 0,
                        index: i,
                        values: ["rgba(50, ", "100, ", "200, ", "0.3)"],
                        isNewItem: false,
                        range: {start: { line: 54, ch: 11 }, end: { line: 54, ch: 34 }}
                    });
                }
            });

            it("should return a separate token for each param in a functional value notation", function () {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[109]);
                expect(result).toEqual({
                    context: CSSUtils.PROP_VALUE,
                    name: "background",
                    offset: 1,
                    index: 1,
                    values: ["linear-gradient(to ", "right, ", "rgba(255,", "255,", "0), ", "#fff)"],
                    isNewItem: false,
                    range: {start: { line: 71, ch: 16 }, end: { line: 71, ch: 64 }}
                });
            });

            it("should return PROP_VALUE when inside functional value notation - simple", function () {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[107]);
                expect(result).toEqual({
                    context: CSSUtils.PROP_VALUE,
                    name: "shape-inside",
                    offset: 1,
                    index: 1,
                    values: ["polygon(", "0 ", "0)"],
                    isNewItem: false,
                    range: {start: { line: 58, ch: 18 }, end: { line: 58, ch: 30 }}
                });
            });

            it("should return PROP_VALUE when inside functional value notation with modifier", function () {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[108]);
                expect(result).toEqual({
                    context: CSSUtils.PROP_VALUE,
                    name: "shape-inside",
                    offset: 1,
                    index: 1,
                    values: ["polygon(", "nonzero, ", "0 ", "0)"],
                    isNewItem: false,
                    range: {start: { line: 62, ch: 18 }, end: { line: 62, ch: 39 }}
                });
            });

            it("should return unprefixed PROP_NAME", function () {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[111]);
                expect(result).toEqual({
                    context: CSSUtils.PROP_NAME,
                    name: "transform",
                    offset: 1,
                    index: -1,
                    values: [],
                    isNewItem: false
                });
            });

            it("should return prefixed PROP_NAME when inside a prefixed property name", function () {
                result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[110]);
                expect(result).toEqual({
                    context: CSSUtils.PROP_NAME,
                    name: "-webkit-transform",
                    offset: 1,
                    index: -1,
                    values: [],
                    isNewItem: false
                });
            });
        });


        describe("quoting", function () {

            it("should properly parse a value with single quotes", function () {
                checkInfoAtOffsets(50, 54, {
                    context: CSSUtils.PROP_VALUE,
                    name: "font-family",
                    index: 0,
                    values: ["'Helvetica Neue', ", "Arial"],
                    isNewItem: false,
                    range: {start: { line: 75, ch: 17 }, end: { line: 75, ch: 40 }}
                });
            });
            it("should properly parse values with special characters", function () {
                var values = ['"my:font"', '"my,font"', '"my, font"', '"my\'font"', "'my\"font'", '"my;font"', '"my{font"', '"my}font"'];
                for (i = 0; i < values.length; i++) {
                    result = CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[i + 55]);
                    expect(result).toEqual({
                        context: CSSUtils.PROP_VALUE,
                        offset: 6,
                        name: "font-family",
                        index: 0,
                        values: [values[i]],
                        isNewItem: false,
                        range: {start: { line: 79 + i, ch: 17 }, end: { line: 79 + i, ch: 17 + values[i].length }}
                    });
                }
            });

        });


        describe("invalid contexts", function () {

            var emptyInfo = {
                context: "",
                offset: 0,
                name: "",
                index: -1,
                values: [],
                isNewItem: false
            };

            function expectEmptyInfo(offset) {
                expect(CSSUtils.getInfoAtPos(testEditor, contextTest.offsets[offset]))
                    .toEqual(emptyInfo);
            }

            it("should return empty context for a non-css document", function () {
                var nonCSSEditor = SpecRunnerUtils.createMockEditor("function () {}", "javascript").editor;
                expect(CSSUtils.getInfoAtPos(nonCSSEditor, {line: 0, ch: 2}))
                    .toEqual(emptyInfo);
                SpecRunnerUtils.destroyMockEditor(nonCSSEditor.document);
            });

            // Selector context is currently unsupported. This unit test should fail once we implement selectors.
            it("should return empty context for unsupported context", function () {
                for (i = 63; i < 68; i++) {
                    expectEmptyInfo(i);
                }
            });

            it("should return empty context for comment", function () {
                expectEmptyInfo(69);
            });

            it("should return empty context for comment in declaration", function () {
                expectEmptyInfo(80);
            });
        });
    });



    // These are tests related to Shapes editor requirements for determining the start/end range of a css property
    describe("CSS Context Info Ranges", function () {

        // NOTE: check ranges for simple cases without whitespace is
        describe("ranging for getInfoAtPos results with whitespace", function () {
            var testEditor,
                result;

            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(rangesTestCss, "css");
                testEditor = mock.editor;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testEditor.document);
                testEditor = null;
            });

            it("should return the correct range of a prop when cursor is on whitespace between function args", function () {
                result = CSSUtils.getInfoAtPos(testEditor, {ch: 20, line: 4});
                expect(result.range.start).toEqual({
                    ch: 18,
                    line: 3
                });
                expect(result.range.end).toEqual({
                    ch: 5,
                    line: 6
                });
            });

            it("should return the correct range of a prop when cursor is between characters in function args", function () {
                result = CSSUtils.getInfoAtPos(testEditor, {ch: 26, line: 9});
                expect(result.range.start).toEqual({
                    ch: 18,
                    line: 8
                });
                expect(result.range.end).toEqual({
                    ch: 5,
                    line: 13
                });
            });
            it("should return the correct range of a prop when cursor is between characters in prop name with function args with whitespace", function () {
                result = CSSUtils.getInfoAtPos(testEditor, {ch: 21, line: 15});
                expect(result.range.start).toEqual({
                    ch: 18,
                    line: 15
                });
                expect(result.range.end).toEqual({
                    ch: 5,
                    line: 22
                });
            });
            it("should return the correct range of a prop when cursor is on function arg delimiter with whitespace", function () {
                result = CSSUtils.getInfoAtPos(testEditor, {ch: 29, line: 30});
                expect(result.range.start).toEqual({
                    ch: 0,
                    line: 26
                });
                expect(result.range.end).toEqual({
                    ch: 41,
                    line: 36
                });
            });
            it("should return the correct range of a prop when cursor is between value and unit with whitespace", function () {
                result = CSSUtils.getInfoAtPos(testEditor, {ch: 85, line: 49});
                expect(result.range.start).toEqual({
                    ch: 12,
                    line: 49
                });
                expect(result.range.end).toEqual({
                    ch: 90,
                    line: 50
                });
            });

            it("should return the correct range of a prop when cursor is at the start of whitespace of a vendor prop value w/whitespace", function () {
                result = CSSUtils.getInfoAtPos(testEditor, {ch: 13, line: 49});
                expect(result.range.start).toEqual({
                    ch: 12,
                    line: 49
                });
                expect(result.range.end).toEqual({
                    ch: 90,
                    line: 50
                });
            });
        });
    });



    describe("CSS Regions", function () {
        beforeEach(function () {
            init(this, cssRegionsFileEntry);
        });

        it("should find named flows", function () {
            var namedFlows = CSSUtils.extractAllNamedFlows(this.fileContent);
            expect(namedFlows.length).toBe(5);
            expect(namedFlows).toContain("main");
            expect(namedFlows).toContain("jeff");
            expect(namedFlows).toContain("randy");
            expect(namedFlows).toContain("lim");
            expect(namedFlows).toContain("edge-code_now_shipping");
            expect(namedFlows).not.toContain("inherit");
            expect(namedFlows).not.toContain("content");
        });

    });
});
