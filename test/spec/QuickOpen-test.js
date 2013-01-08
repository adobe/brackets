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
/*global define: false, require: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, jasmine: false */
/*unittests: QuickOpen */

define(function (require, exports, module) {
    'use strict';
    
    var QuickOpen = require("search/QuickOpen");
    
    describe("QuickOpen", function () {
        QuickOpen._setDebugScores(false);
        describe("findSpecialCharacters", function () {
            it("should find the important match characters in the string", function () {
                var fSC = QuickOpen._findSpecialCharacters;
                expect(fSC("src/document/DocumentCommandHandler.js")).toEqual({
                    lastSegmentSpecialsIndex: 4,
                    specials: [0, 3, 4, 12, 13, 21, 28, 35, 36]
                });
                
                expect(fSC("foobar.js")).toEqual({
                    lastSegmentSpecialsIndex: 0,
                    specials: [0, 6, 7]
                });
            });
        });
        
        describe("_lastSegmentSearch", function () {
            it("should compare results in the final segment properly", function () {
                var path = "src/document/DocumentCommandHandler.js";
                var comparePath = path.toLowerCase();
                var _lastSegmentSearch = QuickOpen._lastSegmentSearch;
                var sc = QuickOpen._findSpecialCharacters(path);
                expect(_lastSegmentSearch("d", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "D", matched: true, lastSegment: true },
                        { text: "ocumentCommandHandler.js", matched: false, lastSegment: true }
                    ]
                });
                
                expect(_lastSegmentSearch("do", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "Do", matched: true, lastSegment: true },
                        { text: "cumentCommandHandler.js", matched: false, lastSegment: true }
                    ]
                });
                
                expect(_lastSegmentSearch("doc", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "Doc", matched: true, lastSegment: true },
                        { text: "umentCommandHandler.js", matched: false, lastSegment: true }
                    ]
                });
                
                expect(_lastSegmentSearch("docc", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "Doc", matched: true, lastSegment: true },
                        { text: "ument", matched: false, lastSegment: true },
                        { text: "C", matched: true, lastSegment: true },
                        { text: "ommandHandler.js", matched: false, lastSegment: true }
                    ]
                });

                expect(_lastSegmentSearch("docch", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "Doc", matched: true, lastSegment: true },
                        { text: "ument", matched: false, lastSegment: true },
                        { text: "C", matched: true, lastSegment: true },
                        { text: "ommand", matched: false, lastSegment: true },
                        { text: "H", matched: true, lastSegment: true },
                        { text: "andler.js", matched: false, lastSegment: true }
                    ]
                });
                
                expect(_lastSegmentSearch("docch.js", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "Doc", matched: true, lastSegment: true },
                        { text: "ument", matched: false, lastSegment: true },
                        { text: "C", matched: true, lastSegment: true },
                        { text: "ommand", matched: false, lastSegment: true },
                        { text: "H", matched: true, lastSegment: true },
                        { text: "andler", matched: false, lastSegment: true },
                        { text: ".js", matched: true, lastSegment: true }
                    ]
                });
                
                expect(_lastSegmentSearch("ocu", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "D", matched: false, lastSegment: true },
                        { text: "ocu", matched: true, lastSegment: true },
                        { text: "mentCommandHandler.js", matched: false, lastSegment: true }
                    ]
                });
                
                expect(_lastSegmentSearch("ocuha", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "D", matched: false, lastSegment: true },
                        { text: "ocu", matched: true, lastSegment: true },
                        { text: "mentCommand", matched: false, lastSegment: true },
                        { text: "Ha", matched: true, lastSegment: true },
                        { text: "ndler.js", matched: false, lastSegment: true }
                    ]
                });
                
                expect(_lastSegmentSearch("z", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual(null);
                expect(_lastSegmentSearch("ocuz", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual(null);
                
                expect(_lastSegmentSearch("sdoc", path, comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    matchGoodness: jasmine.any(Number),
                    remainder: "s",
                    ranges: [
                        { text: "Doc", matched: true, lastSegment: true },
                        { text: "umentCommandHandler.js", matched: false, lastSegment: true }
                    ]
                });
            });
            
            it("should handle weird comparisons as well", function () {
                // this is a special case, to ensure that a "special" character following
                // other matched characters doesn't become a match
                // note that the d's in Command and Handler have been removed
                var path = "DocumentCommanHanler.js";
                var comparePath = path.toLowerCase();
                var _lastSegmentSearch = QuickOpen._lastSegmentSearch;
                var sc = QuickOpen._findSpecialCharacters(path);
                expect(_lastSegmentSearch("ocud", path, comparePath, sc.specials, 0)).toEqual(null);
            });
            
            it("should compare matches that don't fit in just the final segment", function () {
                var path = "src/document/DocumentCommandHandler.js";
                var computeMatch = QuickOpen._computeMatch;
                var sc = QuickOpen._findSpecialCharacters(path);
                expect(computeMatch("sdoc", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "s", matched: true, lastSegment: false },
                        { text: "rc/document/", matched: false, lastSegment: false },
                        { text: "Doc", matched: true, lastSegment: true },
                        { text: "umentCommandHandler.js", matched: false, lastSegment: true }
                    ]
                });
                
                expect(computeMatch("doc", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "src/document/", matched: false, lastSegment: false },
                        { text: "Doc", matched: true, lastSegment: true },
                        { text: "umentCommandHandler.js", matched: false, lastSegment: true }
                    ]
                });
                expect(computeMatch("z", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual(null);
                
                expect(computeMatch("docdoc", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "src/", matched: false, lastSegment: false },
                        { text: "doc", matched: true, lastSegment: false },
                        { text: "ument/", matched: false, lastSegment: false },
                        { text: "Doc", matched: true, lastSegment: true },
                        { text: "umentCommandHandler.js", matched: false, lastSegment: true }
                    ]
                });
            });
            
            it("should handle matches that don't fit at all in the final segment", function () {
                var path = "src/extensions/default/QuickOpenCSS/main.js";
                var computeMatch = QuickOpen._computeMatch;
                var sc = QuickOpen._findSpecialCharacters(path);
                expect(computeMatch("quick", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "src/extensions/default/", matched: false, lastSegment: false },
                        { text: "Quick", matched: true, lastSegment: false },
                        { text: "OpenCSS/main.js", matched: false, lastSegment: true }
                    ]
                });
                
                expect(computeMatch("quickopen", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "src/extensions/default/", matched: false, lastSegment: false },
                        { text: "QuickOpen", matched: true, lastSegment: false },
                        { text: "CSS/main.js", matched: false, lastSegment: true }
                    ]
                });
                
                expect(computeMatch("quickopenain", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    matchGoodness: jasmine.any(Number),
                    ranges: [
                        { text: "src/extensions/default/", matched: false, lastSegment: false },
                        { text: "QuickOpen", matched: true, lastSegment: false },
                        { text: "CSS/m", matched: false, lastSegment: true },
                        { text: "ain", matched: true, lastSegment: true },
                        { text: ".js", matched: false, lastSegment: true }
                    ]
                });
            });
        });
        
        describe("stringMatch", function () {
            var stringMatch = QuickOpen.stringMatch;
            
            it("should return appropriate matching ranges", function () {
                var result;
                expect(stringMatch("foo/bar/baz.js", "bingo")).toBeUndefined();
                result = stringMatch("foo/bar/baz.js", "fbb.js");
                expect(result).not.toBeUndefined();
                expect(result.matchGoodness).toBeLessThan(-100);
                var ranges = result.stringRanges;
                expect(ranges.length).toBe(7);
                
                // verify the important bit of the ranges
                var range = ranges.shift();
                expect(range.text).toBe("f");
                expect(range.matched).toBe(true);
                
                range = ranges.shift();
                expect(range.text).toBe("oo/");
                expect(range.matched).toBe(false);
                
                range = ranges.shift();
                expect(range.text).toBe("b");
                expect(range.matched).toBe(true);
                
                result = stringMatch("src/extensions/default/QuickOpenCSS/main.js", "quick");
                ranges = result.stringRanges;
                expect(ranges.length).toBe(3);
                
                expect(stringMatch("src/search/QuickOpen.js", "qo")).toEqual({
                    matchGoodness: jasmine.any(Number),
                    label: "src/search/QuickOpen.js",
                    stringRanges: [
                        { text: "src/search/", matched: false, lastSegment: false },
                        { text: "Q", matched: true, lastSegment: true },
                        { text: "uick", matched: false, lastSegment: true },
                        { text: "O", matched: true, lastSegment: true },
                        { text: "pen.js", matched: false, lastSegment: true }
                    ]
                });
            });
            
            var goodRelativeOrdering = function (query, testStrings) {
                var lastScore = -20000;
                var goodOrdering = true;
                testStrings.forEach(function (str) {
                    var result = stringMatch(str, query);
                    
                    // note that matchGoodness is expressed in negative numbers
                    if (result.matchGoodness < lastScore) {
                        goodOrdering = false;
                    }
                    lastScore = result.matchGoodness;
                });
                return goodOrdering;
            };
            
            it("should place QuickOpen well relative to other quicks", function () {
                expect(goodRelativeOrdering("quick", [
                    "src/search/QuickOpen.js",
                    "test/spec/QuickOpen-test.js",
                    "samples/root/Getting Started/screenshots/brackets-quick-edit.png",
                    "src/extensions/default/QuickOpenCSS/main.js"
                ])).toBe(true);
            });
            it("should find the right spec/live", function () {
                expect(goodRelativeOrdering("spec/live", [
                    "test/spec/LiveDevelopment-test.js",
                    "test/spec/LiveDevelopment-chrome-user-data/Default/VisitedLinks"
                ])).toBe(true);
            });
            it("should find the right samples/index", function () {
                expect(goodRelativeOrdering("samples/index", [
                    "samples/de/Erste Schritte/index.html",
                    "src/thirdparty/CodeMirror2/mode/ntriples/index.html"
                ])).toBe(true);
            });
            it("should find the right Commands", function () {
                expect(goodRelativeOrdering("Commands", [
                    "src/command/Commands.js",
                    "src/command/CommandManager.js"
                ])).toBe(true);
            });
            it("should find the right extensions", function () {
                expect(goodRelativeOrdering("extensions", [
                    "src/utils/ExtensionLoader.js",
                    "src/extensions/default/RecentProjects/styles.css"
                ])).toBe(true);
            });
            it("should find the right EUtil", function () {
                expect(goodRelativeOrdering("EUtil", [
                    "src/editor/EditorUtils.js",
                    "src/utils/ExtensionUtils.js",
                    "src/file/FileUtils.js"
                ]));
            });
        });
        
        describe("scoring", function () {
            beforeEach(function () {
                QuickOpen._setDebugScores(true);
            });
            
            afterEach(function () {
                QuickOpen._setDebugScores(false);
            });
            
            it("should score consecutive matches across the last segment", function () {
                var result1 = QuickOpen.stringMatch("test/spec/LiveDevelopment-test.js", "spec/live");
                var result2 = QuickOpen.stringMatch("test/spec/live/foobar.js", "spec/live");
                expect(result2.scoreDebug.consecutive).toEqual(result1.scoreDebug.consecutive);
            });
            
            it("should boost last segment matches, even when searching the whole string", function () {
                var result = QuickOpen.stringMatch("src/extensions/default/QuickOpenCSS/main.js", "quickopenain");
                expect(result.scoreDebug.lastSegment).toBeGreaterThan(0);
            });
            
            it("should treat the character after _ as a special", function () {
                var result = QuickOpen.stringMatch("src/extensions/default/Quick_Open.js", "o");
                expect(result.scoreDebug.special).toBeGreaterThan(0);
            });
        });
    });
});
