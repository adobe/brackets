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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, require, describe, it, expect, beforeEach, afterEach, waitsFor, runs, waitsForDone */
/*unittests: LiveJS */

define(function (require, exports, module) {
    "use strict";
    
    var NativeFileSystem = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils        = require("file/FileUtils"),
        SpecRunnerUtils  = require("spec/SpecRunnerUtils"),
        LiveJS           = require("LiveDevelopment/Documents/LiveJS");
    
    describe("LiveJS", function () {
        
        describe("Instrumentation", function () {
            
            beforeEach(function () {
                this.addMatchers({
                    toEqualIgnoringWhitespace: function (expected) {
                        function collapseWhitespace(str) {
                            return str.replace(/(\n|\s)+/g, " ");
                        }
                        console.log("actual: " + collapseWhitespace(this.actual));
                        console.log("expected: " + collapseWhitespace(expected));
                        return collapseWhitespace(this.actual) === collapseWhitespace(expected);
                    }
                });
                LiveJS._resetId();
            });
            
            function testInstrument(instrFn, filename) {
                var testContent;
                runs(function () {
                    waitsForDone(
                        FileUtils.readAsText(new NativeFileSystem.FileEntry(SpecRunnerUtils.getTestPath("/spec/LiveJS-test-files/" + filename + ".js")))
                            .done(function (content) {
                                testContent = content;
                            })
                    );
                });
                runs(function () {
                    var match = testContent.match(/^\/\/ before\n((?:.|\n)+)\n\/\/ after\n((?:.|\n)+)$/),
                        sourceWithOffsets = SpecRunnerUtils.parseOffsetsFromText(match[1]),
                        idMap = {},
                        result = instrFn(sourceWithOffsets.text, idMap);
                    expect(result).toEqualIgnoringWhitespace(match[2]);
                    Object.keys(idMap).forEach(function (key) {
                        expect(idMap[key].start).toEqual(sourceWithOffsets.offsets[key * 2]);
                        expect(idMap[key].end).toEqual(sourceWithOffsets.offsets[(key * 2) + 1]);
                    });
                });
            }
            
            it("should return the source from a given AST range", function () {
                var src = "line 1\nline 2\nline 3\nline 4\nline 5";
                // slice from middle
                expect(LiveJS.getSourceFromRange(src, {line: 2, column: 3}, {line: 4, column: 5}))
                    .toEqual("e 2\nline 3\nline ");
                // slice at edges
                expect(LiveJS.getSourceFromRange(src, {line: 1, column: 0}, {line: 5, column: 6}))
                    .toEqual(src);
                // slice in the same line
                expect(LiveJS.getSourceFromRange(src, {line: 3, column: 2}, {line: 3, column: 5}))
                    .toEqual("ne ");
            });
            
            it("should find the first node of a given type", function () {
                var grandKid = { type: "Literal" },
                    kid = { type: "BlockStatement", body: [{ type: "Identifier" }, grandKid] },
                    root = { type: "Program", body: [kid] };
                expect(LiveJS.findFirst(root, ["Program"])).toBe(root);
                expect(LiveJS.findFirst(root, ["BlockStatement"])).toBe(kid);
                expect(LiveJS.findFirst(root, ["Literal"])).toBe(grandKid);
                expect(LiveJS.findFirst(root, ["BlockStatement", "Literal"])).toBe(kid);
            });
            
            it("should instrument a top-level JS function for replacement using a template", function () {
                testInstrument(LiveJS.instrumentFunction, "simpleTopLevelFn");
            });
            
            it("should instrument a JS file with multiple top-level functions, leaving non-functions untouched", function () {
                testInstrument(LiveJS.instrument, "simpleJSFile");
            });

            it("should instrument a JS file with nested functions in depth-first order", function () {
                testInstrument(LiveJS.instrument, "nestedFns");
            });
        });
        
    });
});