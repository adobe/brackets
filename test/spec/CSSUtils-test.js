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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem        = require("file/NativeFileSystem").NativeFileSystem,
        Async                   = require("utils/Async"),
        FileUtils               = require("file/FileUtils"),
        CSSUtils                = require("language/CSSUtils"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils");
    
    var testPath                = SpecRunnerUtils.getTestPath("/spec/CSSUtils-test-files"),
        simpleCssFileEntry      = new NativeFileSystem.FileEntry(testPath + "/simple.css"),
        universalCssFileEntry   = new NativeFileSystem.FileEntry(testPath + "/universal.css"),
        groupsFileEntry         = new NativeFileSystem.FileEntry(testPath + "/groups.css"),
        offsetsCssFileEntry     = new NativeFileSystem.FileEntry(testPath + "/offsets.css"),
        bootstrapCssFileEntry   = new NativeFileSystem.FileEntry(testPath + "/bootstrap.css"),
        escapesCssFileEntry     = new NativeFileSystem.FileEntry(testPath + "/escaped-identifiers.css");
    
    
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
        spec.fileCssContent = null;
        
        if (fileEntry) {
            spec.addMatchers({toMatchSelector: toMatchSelector});
            
            var doneLoading = false;
            
            runs(function () {
                FileUtils.readAsText(fileEntry)
                    .done(function (text) {
                        spec.fileCssContent = text;
                    });
            });
            
            waitsFor(function () { return (spec.fileCssContent !== null); }, 1000);
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
            function expectRuleRanges(spec, cssCode, selector, ranges) {
                var result = CSSUtils._findAllMatchingSelectorsInText(cssCode, selector);
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
            function expectGroupRanges(spec, cssCode, selector, ranges) {
                var result = CSSUtils._findAllMatchingSelectorsInText(cssCode, selector);
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
                    expectRuleRanges(this, this.fileCssContent, "html", [ {start: 0, end: 2}, {start: 4, end: 6 }]);
                    expectRuleRanges(this, this.fileCssContent, ".firstGrade", [ {start: 8, end: 10} ]);
                    expectRuleRanges(this, this.fileCssContent, "#brack3ts",
                        [ {start: 16, end: 18} ]);
                });
            });
            
            it("should handle rules on adjacent lines", function () {
                runs(function () {
                    init(this, offsetsCssFileEntry);
                });
                
                runs(function () {
                    expectRuleRanges(this, this.fileCssContent, "a", [
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
                    expectGroupRanges(this, this.fileCssContent, ".a", [{start: 24, end: 29}]);
                    expectGroupRanges(this, this.fileCssContent, ".b", [{start: 24, end: 29}]);
                    expectGroupRanges(this, this.fileCssContent, ".c", [{start: 24, end: 29}]);
                    expectGroupRanges(this, this.fileCssContent, ".d", [{start: 24, end: 29}]);
                    
                    expectGroupRanges(this, this.fileCssContent, ".f", [{start: 31, end: 31}]);
                    expectGroupRanges(this, this.fileCssContent, ".g", [{start: 31, end: 34}]);
                    expectGroupRanges(this, this.fileCssContent, ".h", [{start: 31, end: 34}]);
                    
                });
            });
        });
        
        describe("with the universal selector", function () {
        
            beforeEach(function () {
                init(this, universalCssFileEntry);
            });
            
            it("should match a tag name not referenced anywhere in the CSS", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, "blockquote");
                expect(matches.length).toEqual(1);
                expect(matches[0]).toMatchSelector("*");
            });
            it("should match a tag name also referenced elsewhere in the CSS", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, "p");
                
                expect(matches.length).toEqual(2);
                expect(matches[0]).toMatchSelector("*");
                expect(matches[1]).toMatchSelector("p");
            });
        });
        
        describe("with sprint 4 exemptions", function () {
        
            beforeEach(function () {
                var sprint4exemptions = new NativeFileSystem.FileEntry(testPath + "/sprint4.css");
                init(this, sprint4exemptions);
            });
            
            it("should match a class selector (right-most only, no pseudo or attr selectors)", function () {
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, ".message");
                
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
                var matches = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, "h4");
                
                expect(matches.length).toEqual(5);
            });
        });
        
        describe("with real-world Bootstrap CSS code", function () {
            
            beforeEach(function () {
                init(this, bootstrapCssFileEntry);
            });
            
            it("should find the first instance of the h2 selector", function () {
                var selectors = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, "h2");
                expect(selectors).not.toBe(null);
                expect(selectors.length).toBeGreaterThan(0);
                
                expect(selectors[0]).not.toBe(null);
                expect(selectors[0].selectorStartLine).toBe(292);
                expect(selectors[0].declListEndLine).toBe(301);
            });
            
            it("should find all instances of the h2 selector", function () {
                var selectors = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, "h2");
                expect(selectors.length).toBe(2);
                
                expect(selectors[0].selectorStartLine).toBe(292);
                expect(selectors[0].declListEndLine).toBe(301);
                expect(selectors[1].selectorStartLine).toBe(318);
                expect(selectors[1].declListEndLine).toBe(321);
            });
            
            it("should return an empty array when findAllMatchingSelectors() can't find any matches", function () {
                var selectors = CSSUtils._findAllMatchingSelectorsInText(this.fileCssContent, "NO-SUCH-SELECTOR");
                expect(selectors.length).toBe(0);
            });
        });
        
        
        describe("escapes", function () {
            
            beforeEach(function () {
                init(this, escapesCssFileEntry);
            });
            
            it("should remove simple backslashes for simple characters", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[0].selector).toEqual(".simple");
            });
            
            it("should remove simple backslashes with escaped characters", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[1].selector).toEqual(".not\\so|simple?");
            });
            
            it("should parse '\\XX ' as a single character", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[2].selector).toEqual(".twodigits");
            });
            
            it("should parse '\\XXXX ' as a single character", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[3].selector).toEqual(".fourdigits");
            });
            
            it("should parse '\\XXXXXX' as a single character", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[4].selector).toEqual(".sixdigits");
            });
            
            it("should not trim end spaces", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[5].selector).toEqual(".two-digit-endspace");
                
                selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[6].selector).toEqual(".four-digit-endspace");
                
                selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[7].selector).toEqual(".six-digit-endspace");
            });
            
            it("should detect all combinations", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[8].selector).toEqual(".mixin-it-all");
            });
            
            it("should parse '\\AX' as AX", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[9].selector).toEqual(".two-wi74out-space");
            });
            
            it("should parse '\\AXXX' as AXXX", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[10].selector).toEqual(".four-n0085-space");
            });
            
            it("should replace out of range characters with U+FFFD", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
                expect(selectors[11].selector).toEqual(".\uFFFDut\uFFFDfrange");
            });
            
            it("should parse everything less does", function () {
                var selectors = CSSUtils.extractAllSelectors(this.fileCssContent);
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
                    editor = SpecRunnerUtils.createMockEditor(this.fileCssContent, "css").editor;
                });
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
                    editor = SpecRunnerUtils.createMockEditor(this.fileCssContent, "css").editor;
                });
            });
            
            it("should ignore rules inside comments", function () {
                var selector = CSSUtils.findSelectorAtDocumentPos(editor, {line: 45, ch: 22});
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
                    editor = SpecRunnerUtils.createMockEditor(this.fileCssContent, "css").editor;
                });
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
                    editor = SpecRunnerUtils.createMockEditor(this.fileCssContent, "css").editor;
                });
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
                    editor = SpecRunnerUtils.createMockEditor(this.fileCssContent, "css").editor;
                });
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
        
    }); // describe("CSSUtils")

    
    describe("CSS Parsing: ", function () {
        
        var lastCssCode,
            match,
            expectParseError;
        
        function _findMatchingRules(cssCode, tagInfo) {
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
                return CSSUtils._findAllMatchingSelectorsInText(cssCode, selector);
            } else {
                // If !tagInfo, we don't care about results; only making sure parse/search doesn't crash
                CSSUtils._findAllMatchingSelectorsInText(cssCode, "dummy");
                return null;
            }
        }
        
        /**
         * Test helper function; tagInfo object contains one of: tag, id, clazz. Tests against only
         * the given cssCode string in isolation (no CSS files are loaded). If tagInfo not specified,
         * returns no results; only tests that parsing plus a simple search won't crash.
         */
        var _match = function (cssCode, tagInfo) {
            lastCssCode = cssCode;
            try {
                return _findMatchingRules(cssCode, tagInfo);
            } catch (e) {
                this.fail(e.message + ": " + cssCode);
                return [];
            }
        };
        
        /** Tests against the same CSS text as the last call to match() */
        function matchAgain(tagInfo) {
            return match(lastCssCode, tagInfo);
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


        describe("Simple selectors: ", function () {
        
            it("should match a lone type selector given a type", function () {
                var result = match("div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                
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
                result = matchAgain({ tag: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "bar" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ clazz: "div" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "bar" });
                expect(result.length).toBe(0);
                
                result = matchAgain({ id: "div" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
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
                
        }); // describe("Simple selectors")
        
        
        describe("Combinators", function () {
            it("should ignore descendant combinators", function () {
                var result = match("h4 .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                
                result = match("p h4 div { color:red }", { tag: "p" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ tag: "div" });
                expect(result.length).toBe(1);
                
                result = match(".foo h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                
                result = match("div div { color:red }", { tag: "div" });
                expect(result.length).toBe(1);
                result = match(".foo .foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ tag: "foo" });
                expect(result.length).toBe(0);
            });
            
            it("should ignore other combinators", function () {
                var result = match("h4 > .foo { color:red }", { tag: "h4" });
                expect(result.length).toBe(0);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                
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
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                
                // Comma only
                result = match("h4,.foo,#bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                
                // Newline-separated
                result = match("h4,\n.foo,\r\n#bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(1);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                
                // Space-separated with a space combinator
                result = match("h4, .foo #bar { color:red }", { tag: "h4" });
                expect(result.length).toBe(1);
                result = matchAgain({ clazz: "foo" });
                expect(result.length).toBe(0);
                result = matchAgain({ id: "bar" });
                expect(result.length).toBe(1);
                
                // Test items of each type in all positions (first, last, middle)
                result = match("h4, h4, h4 { color:red }", { tag: "h4" });
                expect(result.length).toBe(3);
                result = match(".foo, .foo, .foo { color:red }", { clazz: "foo" });
                expect(result.length).toBe(3);
                result = match("#bar, #bar, #bar { color:red }", { id: "bar" });
                expect(result.length).toBe(3);
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


        describe("Working with real public CSSUtils API", function () {
            var CSSUtils;
            
            beforeEach(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                    // Load module instances from brackets.test
                    CSSUtils = testWindow.brackets.test.CSSUtils;
                    
                    // Load test project
                    var testPath = SpecRunnerUtils.getTestPath("/spec/CSSUtils-test-files");
                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
            });
            afterEach(function () {
                SpecRunnerUtils.closeTestWindow();
            });
            
            it("should include comment preceding selector (issue #403)", function () {
                var rules;
                runs(function () {
                    CSSUtils.findMatchingRules("#issue403")
                        .done(function (result) { rules = result; });
                });
                waitsFor(function () { return rules !== undefined; }, "CSSUtils.findMatchingRules() timeout", 1000);
                
                runs(function () {
                    expect(rules.length).toBe(1);
                    expect(rules[0].lineStart).toBe(4);
                    expect(rules[0].lineEnd).toBe(7);
                });
            });
            
        });
        
        
        describe("Working with unsaved changes", function () {
            var testPath = SpecRunnerUtils.getTestPath("/spec/CSSUtils-test-files"),
                CSSUtils,
                DocumentManager,
                FileViewController,
                ProjectManager,
                brackets;
    
            beforeEach(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (testWindow) {
                    // Load module instances from brackets.test
                    brackets            = testWindow.brackets;
                    CSSUtils            = testWindow.brackets.test.CSSUtils;
                    DocumentManager     = testWindow.brackets.test.DocumentManager;
                    FileViewController  = testWindow.brackets.test.FileViewController;
                    ProjectManager      = testWindow.brackets.test.ProjectManager;

                    SpecRunnerUtils.loadProjectInTestWindow(testPath);
                });
            });

            afterEach(function () {
                SpecRunnerUtils.closeTestWindow();
            });
            
            it("should return the correct offsets if the file has changed", function () {
                var didOpen = false,
                    gotError = false;
                
                runs(function () {
                    FileViewController.openAndSelectDocument(testPath + "/simple.css", FileViewController.PROJECT_MANAGER)
                        .done(function () { didOpen = true; })
                        .fail(function () { gotError = true; });
                });
                
                waitsFor(function () { return didOpen && !gotError; }, "FileViewController.addToWorkingSetAndSelect() timeout", 1000);
                
                var rules = null;
                
                runs(function () {
                    var doc = DocumentManager.getCurrentDocument();
                    
                    // Add several blank lines at the beginning of the text
                    doc.setText("\n\n\n\n" + doc.getText());
                    
                    // Look for ".FIRSTGRADE"
                    CSSUtils.findMatchingRules(".FIRSTGRADE")
                        .done(function (result) { rules = result; });
                });
                
                waitsFor(function () { return rules !== null; }, "CSSUtils.findMatchingRules() timeout", 1000);
                
                runs(function () {
                    expect(rules.length).toBe(1);
                    expect(rules[0].lineStart).toBe(16);
                    expect(rules[0].lineEnd).toBe(18);
                });
            });
            
            it("should return a newly created rule in an unsaved file", function () {
                var didOpen = false,
                    gotError = false;
                
                runs(function () {
                    FileViewController.openAndSelectDocument(testPath + "/simple.css", FileViewController.PROJECT_MANAGER)
                        .done(function () { didOpen = true; })
                        .fail(function () { gotError = true; });
                });
                
                waitsFor(function () { return didOpen && !gotError; }, "FileViewController.addToWorkingSetAndSelect() timeout", 1000);
                
                var rules = null;
                
                runs(function () {
                    var doc = DocumentManager.getCurrentDocument();
                    
                    // Add a new selector to the file
                    doc.setText(doc.getText() + "\n\n.TESTSELECTOR {\n    font-size: 12px;\n}\n");
                    
                    // Look for the selector we just created
                    CSSUtils.findMatchingRules(".TESTSELECTOR")
                        .done(function (result) { rules = result; });
                });
                
                waitsFor(function () { return rules !== null; }, "CSSUtils.findMatchingRules() timeout", 1000);
                
                runs(function () {
                    expect(rules.length).toBe(1);
                    expect(rules[0].lineStart).toBe(24);
                    expect(rules[0].lineEnd).toBe(26);
                });
            });
        });
    }); //describe("CSS Parsing")
    
});
