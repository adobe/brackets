/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, expect, beforeEach, afterEach, runs, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils         = brackets.getModule("spec/SpecRunnerUtils"),
        KeyEvent                = brackets.getModule("utils/KeyEvent"),
        testContentCSS          = require("text!unittest-files/unittests.css"),
        provider                = require("main").inlineTimingFunctionEditorProvider,
        TimingFunctionUtils     = require("TimingFunctionUtils"),
        BezierCurveEditor       = require("BezierCurveEditor").BezierCurveEditor,
        StepEditor              = require("StepEditor").StepEditor;

    describe("Inline Timing Function Editor", function () {

        var testDocument, testEditor, inline;

        /**
         * Creates an inline timing function editor connected to the given cursor position in the test editor.
         * Note that this does *not* actually open it as an inline editor in the test editor.
         * Tests that use this must wrap their contents in a runs() block.
         * @param {!{line:number, ch: number}} cursor Position for which to open the inline editor.
         *    if the provider did not create an inline editor.
         */
        function makeTimingFunctionEditor(cursor) {
            runs(function () {
                var promise = provider(testEditor, cursor);
                if (promise) {
                    promise.done(function (inlineResult) {
                        inlineResult.onAdded();
                        inline = inlineResult;
                    });
                    waitsForDone(promise, "open timing function editor");
                }
            });
        }

        /**
         * Expects arrays to be of specified length and equal.
         * @param {Array} a1 Result to test
         * @param {Array} a2 Expected values.
         * @param {number} len Expected length.
         */
        function expectArraysToBeEqual(a1, a2, len) {
            expect(a2.length).toEqual(a1.length);
            a2.forEach(function (entry, index) {
                expect(entry).toEqual(a1[index]);
            });
        }

        describe("TimingFunctionUtils for bezier curve functions", function () {
            var match;

            /**
             * Expects an invalid steps() function to be corrected the right way, with the right match
             * and originalString given a string to match and an expectation of the output match.
             * @param {string} str The string to match
             * @param {Array} expectedArray The array that should equal the output match.
             */
            function testInvalidBezier(str, expectedArray) {
                var match = TimingFunctionUtils.timingFunctionMatch(str, false);
                runs(function () {
                    expectArraysToBeEqual(match, expectedArray);
                    expect(match.originalString).toEqual(str);
                });
            }

            // Valid cubic-bezier function cases
            it("should match bezier curve function in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("cubic-bezier(.1, .2, .3, .4)", false);
                expect(match).toBeTruthy();
                expectArraysToBeEqual(match, ["cubic-bezier(.1, .2, .3, .4)", ".1", ".2", ".3", ".4"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match bezier curve function in lax mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("cubic-bezier(.1, .2, .3, .4)", true);
                expect(match).toBeTruthy();
                expectArraysToBeEqual(match, ["cubic-bezier(.1, .2, .3, .4)", ".1", ".2", ".3", ".4"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match bezier curve function with negative value", function () {
                match = TimingFunctionUtils.timingFunctionMatch("cubic-bezier(0, -.2, 1, 1.2)", false);
                expectArraysToBeEqual(match, ["cubic-bezier(0, -.2, 1, 1.2)", "0", "-.2", "1", "1.2"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match bezier curve function in full line of longhand css", function () {
                match = TimingFunctionUtils.timingFunctionMatch("    transition-timing-function: cubic-bezier(.37, .28, .83, .94);", false);
                expectArraysToBeEqual(match, ["cubic-bezier(.37, .28, .83, .94)", ".37", ".28", ".83", ".94"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match bezier curve function in full line of shorthand css", function () {
                match = TimingFunctionUtils.timingFunctionMatch("    transition: top 100ms cubic-bezier(.37, .28, .83, .94) 0;", false);
                expectArraysToBeEqual(match, ["cubic-bezier(.37, .28, .83, .94)", ".37", ".28", ".83", ".94"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match bezier curve function with leading zeros", function () {
                match = TimingFunctionUtils.timingFunctionMatch("cubic-bezier(0.1, 0.2, 0.3, 0.4)", false);
                expectArraysToBeEqual(match, ["cubic-bezier(0.1, 0.2, 0.3, 0.4)", "0.1", "0.2", "0.3", "0.4"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match bezier curve function with no optional whitespace", function () {
                match = TimingFunctionUtils.timingFunctionMatch("cubic-bezier(.1,.2,.3,.4)", false);
                expectArraysToBeEqual(match, ["cubic-bezier(.1,.2,.3,.4)", ".1", ".2", ".3", ".4"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match bezier curve function with extra optional whitespace", function () {
                match = TimingFunctionUtils.timingFunctionMatch("cubic-bezier( .1 , .2 , .3 , .4 )", false);
                expectArraysToBeEqual(match, ["cubic-bezier( .1 , .2 , .3 , .4 )", ".1", ".2", ".3", ".4"]);
                expect(match.originalString).toBeFalsy();
            });

            // Valid other functions
            it("should match linear animation function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("animation-timing-function: linear;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("linear");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease animation function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("animation-timing-function: ease;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease-in animation function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("animation-timing-function: ease-in;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease-out animation function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("animation-timing-function: ease-out;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-out");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease-in-out animation function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("animation-timing-function: ease-in-out;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in-out");
                expect(match.originalString).toBeFalsy();
            });

            it("should match linear function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("transition-timing-function: linear;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("linear");
                expect(match.originalString).toBeFalsy();
            });
            it("should match linear function value in lax mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("linear", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("linear");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("transition-timing-function: ease;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease function value in lax mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("ease", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease-in function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("transition-timing-function: ease-in;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease-in function value in lax mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("ease-in", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease-out function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("transition-timing-function: ease-out;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-out");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease-out function value in lax mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("ease-out", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-out");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease-in-out function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("transition-timing-function: ease-in-out;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in-out");
                expect(match.originalString).toBeFalsy();
            });
            it("should match ease-in-out function value in lax mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("ease-in-out", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in-out");
                expect(match.originalString).toBeFalsy();
            });

            // Invalid cubic-beziers - they should be corrected automatically
            it("should correct cubic-bezier function with out-of-range X parameters", function () {
                testInvalidBezier("cubic-bezier(-.2, 0, 1.2, 1)", ["cubic-bezier(0, 0, 1, 1)", "0", "0", "1", "1"]);
            });
            it("should correct cubic-bezier function with Infinity parameters", function () {
                testInvalidBezier("cubic-bezier(0, Infinity, 1, -Infinity)", ["cubic-bezier(0, 0, 1, 1)", "0", "0", "1", "1"]);
            });
            it("should correct cubic-bezier function with non-numeric parameters", function () {
                testInvalidBezier("cubic-bezier(x1, y1, x2, y2)", ["cubic-bezier(.42, 0, .58, 1)", ".42", "0", ".58", "1"]);
            });
            it("should correct cubic-bezier function with no parameters", function () {
                testInvalidBezier("cubic-bezier()", ["cubic-bezier(.42, 0, .58, 1)", ".42", "0", ".58", "1"]);
            });
            it("should correct cubic-bezier function with 3 parameters", function () {
                testInvalidBezier("cubic-bezier(0, 0, 1)", ["cubic-bezier(0, 0, 1, 1)", "0", "0", "1", "1"]);
            });
            it("should correct cubic-bezier function with 5 parameters", function () {
                testInvalidBezier("cubic-bezier(0, 0, 1, 1, 1)", ["cubic-bezier(0, 0, 1, 1)", "0", "0", "1", "1"]);
            });
            it("should correct cubic-bezier function with trailing comma", function () {
                testInvalidBezier("cubic-bezier(.42, 0, .58, .5,)", ["cubic-bezier(.42, 0, .58, .5)", ".42", "0", ".58", ".5"]);
            });

            // Real invalid cubic-beziers - they should NOT be corrected automatically
            it("should not match cubic-bezier function with invalid whitespace", function () {
                match = TimingFunctionUtils.timingFunctionMatch("cubic-bezier (0, 0, 1, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with UPPER-CASE", function () {
                match = TimingFunctionUtils.timingFunctionMatch("CUBIC-BEZIER(0, 0, 1, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match unknown timing function", function () {
                match = TimingFunctionUtils.timingFunctionMatch("ease-out-in", false);
                expect(match).toBeFalsy();
            });
            it("should not match linear when not a timing function", function () {
                match = TimingFunctionUtils.timingFunctionMatch("background: linear-gradient(to bottom, blue, white);", false);
                expect(match).toBeFalsy();
            });
        });

        describe("TimingFunctionUtils for step functions", function () {
            var match;

            /**
             * Expects an invalid steps() function to be corrected the right way, with the right match
             * and originalString given a string to match and an expectation of the output match.
             * @param {string} str The string to match
             * @param {Array} expectedArray The array that should equal the output match.
             */
            function testInvalidStep(str, expectedArray) {
                var match = TimingFunctionUtils.timingFunctionMatch(str, false);
                runs(function () {
                    expectArraysToBeEqual(match, expectedArray);
                    expect(match.originalString).toEqual(str);
                });
            }

            // Valid steps function cases
            it("should match steps function in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps(3, start)", false);
                expect(match).toBeTruthy();
                expectArraysToBeEqual(match, ["steps(3, start)", "3", "start"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function in lax mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps(3, start)", true);
                expect(match).toBeTruthy();
                expectArraysToBeEqual(match, ["steps(3, start)", "3", "start"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function with second parameter of end", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps(12, end)", false);
                expectArraysToBeEqual(match, ["steps(12, end)", "12", "end"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function with only 1 parameter", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps(8)", false);
                expectArraysToBeEqual(match, ["steps(8)", "8", undefined]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function in full line of longhand css", function () {
                match = TimingFunctionUtils.timingFunctionMatch("    transition-timing-function: steps(5, start);", false);
                expectArraysToBeEqual(match, ["steps(5, start)", "5", "start"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function in full line of shorthand css", function () {
                match = TimingFunctionUtils.timingFunctionMatch("    transition: top 100ms steps(10) 0;", false);
                expectArraysToBeEqual(match, ["steps(10)", "10", undefined]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function with leading zeros", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps(04, end)", false);
                expectArraysToBeEqual(match, ["steps(04, end)", "04", "end"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function with no optional whitespace with 1 param", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps(3)", false);
                expectArraysToBeEqual(match, ["steps(3)", "3", undefined]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function with no optional whitespace with 2 params", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps(3,end)", false);
                expectArraysToBeEqual(match, ["steps(3,end)", "3", "end"]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function with extra optional whitespace with 1 param", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps( 7 )", false);
                expectArraysToBeEqual(match, ["steps( 7 )", "7", undefined]);
                expect(match.originalString).toBeFalsy();
            });
            it("should match steps function with extra optional whitespace with 2 params", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps( 8 , start )", false);
                expectArraysToBeEqual(match, ["steps( 8 , start )", "8", "start"]);
                expect(match.originalString).toBeFalsy();
            });

            // Valid other functions
            it("should match step-start function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("transition-timing-function: step-start;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("step-start");
                expect(match.originalString).toBeFalsy();
            });
            it("should match step-start function value in lax mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("step-start", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("step-start");
                expect(match.originalString).toBeFalsy();
            });
            it("should match step-end function in declaration in strict mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("transition-timing-function: step-end;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("step-end");
                expect(match.originalString).toBeFalsy();
            });
            it("should match step-end function value in lax mode", function () {
                match = TimingFunctionUtils.timingFunctionMatch("step-end", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("step-end");
                expect(match.originalString).toBeFalsy();
            });

            // Invalid steps - they should be corrected automatically
            it("should correct steps function with zero steps", function () {
                testInvalidStep("steps(0)", ["steps(5, end)", "5", "end"]);
            });
            it("should correct steps function with a non-integer number of steps", function () {
                testInvalidStep("steps(3.0)", ["steps(3, end)", "3", "end"]);
            });
            it("should correct steps function with a negative number of steps", function () {
                testInvalidStep("steps(-2)", ["steps(5, end)", "5", "end"]);
            });
            it("should correct steps function with an infinite number of steps", function () {
                testInvalidStep("steps(Infinity,)", ["steps(5, end)", "5", "end"]);
            });
            it("should correct steps function with NaN number of steps", function () {
                testInvalidStep("steps(NaN,)", ["steps(5, end)", "5", "end"]);
            });
            it("should correct steps function with non-numeric number of steps", function () {
                testInvalidStep("steps(x)", ["steps(5, end)", "5", "end"]);
            });
            it("should correct steps function with a string-value number of steps", function () {
                testInvalidStep("steps('3')", ["steps(3, end)", "3", "end"]);
            });
            it("should correct steps function with no parameters", function () {
                testInvalidStep("steps()", ["steps(5, end)", "5", "end"]);
            });
            it("should correct steps function with empty second parameter", function () {
                testInvalidStep("steps(1,)", ["steps(1, end)", "1", "end"]);
            });
            it("should correct steps function with undefined second parameter", function () {
                testInvalidStep("steps(1, middle)", ["steps(1, end)", "1", "end"]);
            });
            it("should correct steps function with typo in second parameter", function () {
                testInvalidStep("steps(1, satrt)", ["steps(1, start)", "1", "start"]);
            });
            it("should correct steps function with a string as second parameter", function () {
                testInvalidStep("steps(1, 'start')", ["steps(1, start)", "1", "start"]);
            });
            it("should correct steps function with 3 parameters", function () {
                testInvalidStep("steps(1, start, end)", ["steps(1, start)", "1", "start"]);
            });

            // Real invalid cubic-beziers - they should NOT be corrected automatically
            it("should not match steps function with no parens", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps", false);
                expect(match).toBeFalsy();
            });
            it("should not match steps function with invalid whitespace", function () {
                match = TimingFunctionUtils.timingFunctionMatch("steps (1, end)", false);
                expect(match).toBeFalsy();
            });
            it("should not match steps function with UPPER-CASE", function () {
                match = TimingFunctionUtils.timingFunctionMatch("STEPS(12)", false);
                expect(match).toBeFalsy();
            });
            it("should not match unknown timing function", function () {
                match = TimingFunctionUtils.timingFunctionMatch("step", false);
                expect(match).toBeFalsy();
            });
        });


        describe("Bookmark Timing Function", function () {
            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testContentCSS, "css");
                testDocument = mock.doc;
                testEditor = mock.editor;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
                inline = null;
            });

            /**
             * Expects an inline editor to be opened at the given cursor position and to have the
             * given initial timing function (which should match the timing function at that position).
             * @param {!{line:number, ch:number}} cursor The cursor position to try opening the inline at.
             * @param {number} start The expected start of timing function.
             * @param {number} end The expected end of timing function.
             */
            function testOpenTimingFunction(cursor, start, end) {
                makeTimingFunctionEditor(cursor);
                runs(function () {
                    expect(inline).toBeTruthy();
                    expect(inline._startBookmark.find().ch).toBe(start);
                    expect(inline._endBookmark.find().ch).toBe(end);
                });
            }

            it("should bookmark cubic-bezier() function when opened in inline editor", function () {
                testOpenTimingFunction({line: 3, ch: 34}, 32, 60);
            });
            it("should bookmark linear function when opened in inline editor", function () {
                testOpenTimingFunction({line: 5, ch: 35}, 32, 38);
            });
            it("should bookmark second cubic-bezier() function when opened in inline editor", function () {
                testOpenTimingFunction({line: 13, ch: 80}, 75, 107);
            });
            it("should bookmark steps() function when opened in inline editor", function () {
                testOpenTimingFunction({line: 17, ch: 37}, 32, 45);
            });
            it("should bookmark step-start function when opened in inline editor", function () {
                testOpenTimingFunction({line: 20, ch: 40}, 32, 42);
            });
            it("should bookmark long, invalid cubic-bezier() function when opened in inline editor", function () {
                testOpenTimingFunction({line: 25, ch: 52}, 32, 74);
            });
            it("should bookmark empty, invalid cubic-bezier() function when opened in inline editor", function () {
                testOpenTimingFunction({line: 26, ch: 47}, 32, 46);
            });
            it("should bookmark long, invalid steps() function when opened in inline editor", function () {
                testOpenTimingFunction({line: 30, ch: 44}, 32, 50);
            });
            it("should bookmark empty, invalid steps() function when opened in inline editor", function () {
                testOpenTimingFunction({line: 31, ch: 45}, 32, 39);
            });
        });

        describe("TimingFunction editor UI", function () {
            var timingFuncEditor;

            /**
             * Creates a hidden BezierCurveEditor and appends it to the body. Note that this is a
             * standalone BezierCurveEditor, not inside an InlineTimingFunctionEditor.
             * @param {string} initialTimingFunction The timingFunction that should be initially set
             *     in the BezierCurveEditor.
             * @param {?function} callback An optional callback to be passed as the BezierCurveEditor's
             *     callback. If none is supplied, a dummy function is passed.
             */
            function makeTimingFuncUI(initialTimingFunction, callback) {
                var parent = $(window.document.body),
                    match = TimingFunctionUtils.timingFunctionMatch(initialTimingFunction, true),
                    cb = callback || function () { };

                if (match.isBezier) {
                    timingFuncEditor = new BezierCurveEditor(parent, match, cb);
                } else if (match.isStep) {
                    timingFuncEditor = new StepEditor(parent, match, cb);
                }

                // Hide it
                timingFuncEditor.getRootElement().css("display", "none");
            }

            afterEach(function () {
                timingFuncEditor.getRootElement().remove();
                timingFuncEditor = null;
            });


            describe("Initial Load and External Update", function () {

                it("should load the initial cubic-bezier function correctly", function () {
                    runs(function () {
                        makeTimingFuncUI("cubic-bezier(.2, .3, .4, .5)");
                        expect(timingFuncEditor).toBeTruthy();
                        expect(timingFuncEditor._cubicBezierCoords).toBeTruthy();
                        expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".2", ".3", ".4", ".5"]);
                    });
                });
                it("should load externally updated cubic-bezier function correctly", function () {
                    runs(function () {
                        makeTimingFuncUI("cubic-bezier(.1, .3, .5, .7)");
                        var matchUpdate = TimingFunctionUtils.timingFunctionMatch("cubic-bezier(.2, .4, .6, .8)", true);
                        timingFuncEditor.handleExternalUpdate(matchUpdate);
                        expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".2", ".4", ".6", ".8"]);
                    });
                });
                it("should load the initial steps function correctly", function () {
                    runs(function () {
                        makeTimingFuncUI("steps(5, start)");
                        expect(timingFuncEditor).toBeTruthy();
                        expect(timingFuncEditor._stepParams).toBeTruthy();
                        expect(timingFuncEditor._stepParams.count).toEqual(5);
                        expect(timingFuncEditor._stepParams.timing).toEqual("start");
                    });
                });
                it("should load externally updated steps function correctly", function () {
                    runs(function () {
                        makeTimingFuncUI("steps(5, start)");
                        var matchUpdate = TimingFunctionUtils.timingFunctionMatch("steps(6, end)", true);
                        timingFuncEditor.handleExternalUpdate(matchUpdate);
                        expect(timingFuncEditor._stepParams.count).toEqual(6);
                        expect(timingFuncEditor._stepParams.timing).toEqual("end");
                    });
                });
            });

            describe("Conversions", function () {

                it("should convert linear function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeTimingFuncUI("linear");
                        expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, ["0", "0", "1", "1"]);
                    });
                });
                it("should convert ease function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeTimingFuncUI("ease");
                        expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".25", ".1", ".25", "1"]);
                    });
                });
                it("should convert ease-in function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeTimingFuncUI("ease-in");
                        expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".42", "0", "1", "1"]);
                    });
                });
                it("should convert ease-out function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeTimingFuncUI("ease-out");
                        expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, ["0", "0", ".58", "1"]);
                    });
                });
                it("should convert ease-in-out function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeTimingFuncUI("ease-in-out");
                        expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".42", "0", ".58", "1"]);
                    });
                });
                it("should convert step-start function to steps function parameters", function () {
                    runs(function () {
                        makeTimingFuncUI("step-start");
                        expect(timingFuncEditor).toBeTruthy();
                        expect(timingFuncEditor._stepParams).toBeTruthy();
                        expect(timingFuncEditor._stepParams.count).toEqual(1);
                        expect(timingFuncEditor._stepParams.timing).toEqual("start");
                    });
                });
                it("should convert step-end function to steps function parameters", function () {
                    runs(function () {
                        makeTimingFuncUI("step-end");
                        expect(timingFuncEditor._stepParams.count).toEqual(1);
                        expect(timingFuncEditor._stepParams.timing).toEqual("end");
                    });
                });
            });

            describe("Editing with Mouse", function () {

                /**
                 * Translate from a bezier-curve point (1.0 x 1.0 grid)
                 *           to a canvas element point (150px x 150px grid).
                 * @param  {Array} bezierPoint The bezier point [x, y].
                 * @return {Array} canvas element point in [x, y]
                 */
                function translatePointFromBezierToCanvas(bezierPoint) {
                    return [
                        Math.round(bezierPoint[0] * 150),
                        Math.round(((1 - bezierPoint[1]) * 150) + 75)
                    ];
                }
                /**
                 * Simulate the given event with clientX/clientY specified by the given
                 * offsets by the left/top of the item.
                 * @param {string} event The name of the event to simulate.
                 * @param {object} $item A jQuery object to trigger the event on.
                 * @param {Array.<number>} offsets Numbers the x and y positions of the
                 *      event relative to the item's top and left.
                 */
                function eventAtOffset(event, $item, offsets) {
                    $item.trigger($.Event(event, {
                        pageX: $item.offset().left + offsets[0],
                        pageY: $item.offset().top  + offsets[1],
                        which: 1
                    }));
                }

                /**
                 * Test a mouse down event on the given UI element in a cubic-bezier function.
                 * @param {object} opts The parameters to test:
                 *     item: The (string) name of the member of BezierCurveEditor that
                 *          references the element to test.
                 *     clickAt: An [x, y] array specifying the simulated x/y mouse position as
                 *          an offset of the item's width/height.
                 *     expected: The expected array of values for _cubicBezierCoords.
                 */
                function testCubicBezierClick(opts) {
                    makeTimingFuncUI("cubic-bezier(.42, 0, .58 ,1)");
                    var $item = $(timingFuncEditor[opts.item]);
                    eventAtOffset("click", $item, opts.clickAt);
                    expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, opts.expected);
                }

                /**
                 * Test a drag event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     downItem: The (string) name of the member of BezierCurveEditor
                 *          that references the element to mousedown on to drag.
                 *     clickAt: An [x, y] array specifying the simulated x/y mouse position as an offset of the
                 *          item's width/height.
                 *     dragItem: The (string) name of the member of BezierCurveEditor
                 *          that references the element to drag item to.
                 *     dragTo: An [x, y] array specifying the location to drag to, using the same convention as clickAt.
                 *     expected: The expected array of values for _cubicBezierCoords.
                 */
                function testCubicBezierDrag(opts) {
                    makeTimingFuncUI("cubic-bezier(.42, 0, .58 ,1)");
                    var $downItem = $(timingFuncEditor[opts.downItem]),
                        $dragItem = $(timingFuncEditor[opts.dragItem]);

                    eventAtOffset("mousedown", $downItem, opts.clickAt);
                    eventAtOffset("mousemove", $dragItem, opts.dragTo);
                    $downItem.trigger("mouseup");
                    expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, opts.expected);
                }

                it("should move point P1 on mousedown in curve", function () {
                    testCubicBezierClick({
                        item:      "curve",
                        clickAt:   translatePointFromBezierToCanvas([0.5, 0.1]),
                        expected:  [".5", ".1", ".58", "1"]
                    });
                });
                it("should move point P2 on mousedown in curve", function () {
                    testCubicBezierClick({
                        item:      "curve",
                        clickAt:   translatePointFromBezierToCanvas([0.6, 1.2]),
                        expected:  [".42", "0", ".6", "1.2"]
                    });
                });
                it("should move point P1 on drag", function () {
                    testCubicBezierDrag({
                        downItem:  "P1",        // mouse down on this element
                        clickAt:   [5, 5],
                        dragItem:  "curve",     // drag over this element
                        dragTo:    translatePointFromBezierToCanvas([0.6, -0.1]),
                        expected:  [".6", "-0.1", ".58", "1"]
                    });
                });
                it("should move point P2 on drag", function () {
                    testCubicBezierDrag({
                        downItem:  "P2",        // mouse down on this element
                        clickAt:   [5, 5],
                        dragItem:  "curve",     // drag over this element
                        dragTo:    translatePointFromBezierToCanvas([0.8, 0.9]),
                        expected:  [".42", "0", ".8", ".9"]
                    });
                });
                it("should not move point P2 x-value out-of-range on drag", function () {
                    testCubicBezierDrag({
                        downItem:  "P2",        // mouse down on this element
                        clickAt:   [5, 5],
                        dragItem:  "curve",     // drag over this element
                        dragTo:    translatePointFromBezierToCanvas([1.1, 1]),
                        expected:  [".42", "0", "1", "1"]
                    });
                });
            });

            describe("Editing with Keyboard", function () {

                function makeKeyEvent(opts) {
                    return $.Event("keydown", { keyCode: opts.key, shiftKey: !!opts.shift });
                }

                /**
                 * Create a timing function editor and trigger a key event on it.
                 * @param {object} opts The parameters to test:
                 *     func: The initial timing function
                 *     item: The (string) name of the member of BezierCurveEditor
                 *          that references the element to test.
                 *     key: The KeyEvent key code to simulate.
                 *     shift: Optional boolean specifying whether to simulate the shift
                 *          key being down (default false).
                 *     expected: The expected array of values for _cubicBezierCoords.
                 */
                function triggerTimingFunctionEditorKey(opts) {
                    makeTimingFuncUI(opts.func, opts.callback);
                    var $item = $(timingFuncEditor[opts.item]);
                    $item.focus();
                    $item.trigger(makeKeyEvent(opts));
                }

                // cubic-bezier() tests
                it("should increase P1 x-value by .02 on right arrow in cubic-bezier()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "cubic-bezier(.42, 0, .58, 1)",
                        item:      "P1",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        shift:     false
                    });
                    expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".44", "0", ".58", "1"]);
                });
                it("should increase P1 y-value by .1 on shift up arrow in cubic-bezier()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "cubic-bezier(.42, 0, .58, 1)",
                        item:      "P1",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true
                    });
                    expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".42", ".1", ".58", "1"]);
                });
                it("should decrease P2 x-value by .02 on left arrow in cubic-bezier()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "cubic-bezier(.42, 0, .58, 1)",
                        item:      "P2",
                        key:       KeyEvent.DOM_VK_LEFT,
                        shift:     false
                    });
                    expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".42", "0", ".56", "1"]);
                });
                it("should decrease P2 y-value by .1 on shift down arrow in cubic-bezier()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "cubic-bezier(.42, 0, .58 ,1)",
                        item:      "P2",
                        key:       KeyEvent.DOM_VK_DOWN,
                        shift:     true
                    });
                    expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".42", "0", ".58", ".9"]);
                });
                it("should not decrease P1 x-value below 0 on left arrow in cubic-bezier()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "cubic-bezier(0, 0, 1, 1)",
                        item:      "P1",
                        key:       KeyEvent.DOM_VK_LEFT,
                        shift:     false
                    });
                    expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, ["0", "0", "1", "1"]);
                });
                it("should not increase P2 x-value above 0 on shift right arrow in cubic-bezier()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "cubic-bezier(0, 0, 1, 1)",
                        item:      "P2",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        shift:     true
                    });
                    expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, ["0", "0", "1", "1"]);
                });
                it("should call callback function after cubic-bezier edit in cubic-bezier()", function () {
                    var calledBack = false;

                    var _callback = function (timingFunctionString) {
                        calledBack = true;
                        expect(timingFunctionString).toBe("cubic-bezier(.42, .1, .58, 1)");
                    };

                    runs(function () {
                        triggerTimingFunctionEditorKey({
                            func:      "cubic-bezier(.42, 0, .58 ,1)",
                            item:      "P1",
                            key:       KeyEvent.DOM_VK_UP,
                            shift:     true,
                            callback:  _callback
                        });
                        expectArraysToBeEqual(timingFuncEditor._cubicBezierCoords, [".42", ".1", ".58", "1"]);
                    });

                    runs(function () {
                        expect(calledBack).toBeTruthy();
                    });
                });

                // steps() tests
                it("should increase count by 1 on up arrow in steps()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "steps(5)",
                        item:      "canvas",
                        key:       KeyEvent.DOM_VK_UP
                    });
                    expect(timingFuncEditor._stepParams.count).toEqual(6);
                });
                it("should decrease count by 1 on down arrow in steps()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "steps(5)",
                        item:      "canvas",
                        key:       KeyEvent.DOM_VK_DOWN
                    });
                    expect(timingFuncEditor._stepParams.count).toEqual(4);
                });
                it("should change start to end on right arrow in steps()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "steps(5, start)",
                        item:      "canvas",
                        key:       KeyEvent.DOM_VK_RIGHT
                    });
                    expect(timingFuncEditor._stepParams.timing).toEqual("end");
                });
                it("should change end to start on left arrow in steps()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "steps(5, end)",
                        item:      "canvas",
                        key:       KeyEvent.DOM_VK_LEFT
                    });
                    expect(timingFuncEditor._stepParams.timing).toEqual("start");
                });
                it("should not decrease count to be less than 1 on down arrow in steps()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "steps(1)",
                        item:      "canvas",
                        key:       KeyEvent.DOM_VK_DOWN
                    });
                    expect(timingFuncEditor._stepParams.count).toEqual(1);
                });
                it("should not change start to end on left arrow in steps()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "steps(5, start)",
                        item:      "canvas",
                        key:       KeyEvent.DOM_VK_LEFT
                    });
                    expect(timingFuncEditor._stepParams.timing).toEqual("start");
                });
                it("should not change end to start on right arrow in steps()", function () {
                    triggerTimingFunctionEditorKey({
                        func:      "steps(5, end)",
                        item:      "canvas",
                        key:       KeyEvent.DOM_VK_RIGHT
                    });
                    expect(timingFuncEditor._stepParams.timing).toEqual("end");
                });

                it("should call callback function after steps function edit", function () {
                    var calledBack = false;

                    var _callback = function (timingFunctionString) {
                        calledBack = true;
                        expect(timingFunctionString).toBe("steps(5, start)");
                    };

                    runs(function () {
                        triggerTimingFunctionEditorKey({
                            func:      "steps(4, start)",
                            item:      "canvas",
                            key:       KeyEvent.DOM_VK_UP,
                            callback:  _callback
                        });
                        expect(timingFuncEditor._stepParams.count).toEqual(5);
                    });

                    runs(function () {
                        expect(calledBack).toBeTruthy();
                    });
                });

            });
        });
    });
});
