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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50, regexp: true, evil: true */
/*global define, require, describe, it, expect, beforeEach, afterEach, waitsFor, runs, waitsForDone, Mustache */
/*unittests: JSInstrumentation */

define(function (require, exports, module) {
    "use strict";
    
    var NativeFileSystem  = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils         = require("file/FileUtils"),
        SpecRunnerUtils   = require("spec/SpecRunnerUtils"),
        JSInstrumentation = require("language/JSInstrumentation"),
        escapeTest        = require("text!spec/JSInstrumentation-test-files/escapeTest.js");
    
    describe("JSInstrumentation", function () {
        beforeEach(function () {
            this.addMatchers({
                toEqualIgnoringWhitespace: function (expected) {
                    function collapseWhitespace(str) {
                        return str.replace(/(\n|\s)+/g, " ");
                    }
                    return collapseWhitespace(this.actual) === collapseWhitespace(expected);
                }
            });
        });
        
        describe("Instrumentation", function () {
            var origTemplate,
                unitTestFnTemplate = Mustache.compile("// id = {{id}}\n" +
                                                      "// hasParentId = {{hasParentId}}\n" +
                                                      "// parentId = {{parentId}}\n" +
                                                      "// vars = {{#vars}}{{.}} {{/vars}}\n" +
                                                      "// before body\n" +
                                                      "{{{body}}}\n" +
                                                      "// after body\n");
            
            beforeEach(function () {
                origTemplate = JSInstrumentation._getFunctionTemplate();
                JSInstrumentation._setFunctionTemplate(unitTestFnTemplate);
            });
            
            afterEach(function () {
                JSInstrumentation._setFunctionTemplate(origTemplate);
            });
            
            function testInstrument(instrFn, filename, fnName, skipOuter) {
                var testContent;
                runs(function () {
                    waitsForDone(
                        FileUtils.readAsText(new NativeFileSystem.FileEntry(SpecRunnerUtils.getTestPath("/spec/JSInstrumentation-test-files/" + filename + ".js")))
                            .done(function (content) {
                                testContent = content;
                            })
                    );
                });
                runs(function () {
                    var match = testContent.match(/^\/\/ test_before\n((?:.|\n)+)\n\/\/ test_after nextId=([0-9]+)\n((?:.|\n)+)$/),
                        sourceWithOffsets = SpecRunnerUtils.parseOffsetsFromText(match[1]),
                        rangeList = [],
                        result = instrFn(sourceWithOffsets.text, rangeList, null, null, null, skipOuter);
                    if (match[3] === "null") {
                        expect(result).toBeNull();
                    } else {
                        expect(result.instrumented).toEqualIgnoringWhitespace(match[3]);
                        rangeList.forEach(function (item) {
                            expect(item.start).toEqual(sourceWithOffsets.offsets[item.data * 2]);
                            expect(item.end).toEqual(sourceWithOffsets.offsets[(item.data * 2) + 1]);
                        });
                        expect(result.nextId).toEqual(Number(match[2]));
                    }
                    if (fnName) {
                        expect(result.name).toEqual(fnName);
                    }
                });
            }
            
            it("should return the source from a given AST range", function () {
                var src = "line 1\nline 2\nline 3\nline 4\nline 5";
                // slice from middle
                expect(JSInstrumentation.getSourceFromRange(src, {line: 2, column: 3}, {line: 4, column: 5}))
                    .toEqual("e 2\nline 3\nline ");
                // slice at edges
                expect(JSInstrumentation.getSourceFromRange(src, {line: 1, column: 0}, {line: 5, column: 6}))
                    .toEqual(src);
                // slice in the same line
                expect(JSInstrumentation.getSourceFromRange(src, {line: 3, column: 2}, {line: 3, column: 5}))
                    .toEqual("ne ");
            });
            
            it("should find the first node of a given type", function () {
                var grandKid = { type: "Literal" },
                    kid = { type: "BlockStatement", body: [{ type: "Identifier" }, grandKid] },
                    root = { type: "Program", body: [kid] };
                expect(JSInstrumentation.findFirst(root, ["Program"])).toBe(root);
                expect(JSInstrumentation.findFirst(root, ["BlockStatement"])).toBe(kid);
                expect(JSInstrumentation.findFirst(root, ["Literal"])).toBe(grandKid);
                expect(JSInstrumentation.findFirst(root, ["BlockStatement", "Literal"])).toBe(kid);
            });
            
            it("should instrument a top-level JS function for replacement using a template", function () {
                testInstrument(JSInstrumentation.instrumentFunction, "simpleTopLevelFn", "callMe");
            });
            
            it("should return only the instrumented body if skipOuter is true", function () {
                testInstrument(JSInstrumentation.instrumentFunction, "oneNestedFnBodyOnly", "callMe", true);
            });
            
            it("should instrument a JS file with multiple top-level functions, leaving non-functions untouched", function () {
                testInstrument(JSInstrumentation.instrument, "simpleJSFile");
            });
    
            it("should instrument a JS file with nested functions in depth-first order", function () {
                testInstrument(JSInstrumentation.instrument, "nestedFns");
            });

            it("should properly find variables and function declarations in various scopes", function () {
                testInstrument(JSInstrumentation.instrument, "varDecls");
            });
            
            it("should return null if source is invalid", function () {
                testInstrument(JSInstrumentation.instrument, "invalid");
            });
        });
        
        describe("Replacement", function () {
            it("should properly escape JS so it can be stored in a string", function () {
                var escaped = JSInstrumentation.escapeJS(escapeTest);
                expect(eval('"' + escaped + '"')).toEqual(escapeTest);
                expect(eval("'" + escaped + "'")).toEqual(escapeTest);
            });
            
            it("should extract the body from the function's source", function () {
                var src = "function foo(arg1, arg2) {console.log('this is the body');console.log('another statement');}";
                expect(JSInstrumentation.getFunctionBody(src)).toEqualIgnoringWhitespace("console.log('this is the body');console.log('another statement');");
            });
            
            it("should return null if the function source isn't valid", function () {
                var src = "function foo(arg1, arg2) { function bar ( }";
                expect(JSInstrumentation.getFunctionBody(src)).toBeNull();
            });
        });
    });
});