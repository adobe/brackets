/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, brackets, waitsForDone, spyOn, KeyEvent */

/*******************************

Tests
- select correct range from IP
- editor updates when doc updated
- doc updates when edit made


*******************************/


define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils   = brackets.getModule("spec/SpecRunnerUtils"),
//        Editor            = brackets.getModule("editor/Editor").Editor,
//        DocumentManager   = brackets.getModule("document/DocumentManager"),
//        Strings           = brackets.getModule("strings"),
//        KeyEvent          = brackets.getModule("utils/KeyEvent"),
//        testContentCSS    = require("text!unittest-files/unittests.css"),
//        testContentHTML   = require("text!unittest-files/unittests.html"),
//        provider          = require("main").inlineBezierCurveEditorProvider,
        BezierCurveUtils  = require("BezierCurveUtils"),
        BezierCurveEditor = require("BezierCurveEditor").BezierCurveEditor;

    describe("Inline Bezier Curve Editor", function () {

        var testDocument, testEditor, inline;
        
        /**
         * Creates an inline bezierCurve editor connected to the given cursor position in the test editor.
         * Note that this does *not* actually open it as an inline editor in the test editor.
         * Tests that use this must wrap their contents in a runs() block.
         * @param {!{line:number, ch: number}} cursor Position for which to open the inline editor.
         * if the provider did not create an inline editor.
         */
/*
        function makeBezierCurveEditor(cursor) {
            runs(function () {
                var promise = provider(testEditor, cursor);
                if (promise) {
                    promise.done(function (inlineResult) {
                        inlineResult.onAdded();
                        inline = inlineResult;
                    });
                    waitsForDone(promise, "open bezierCurve editor");
                }
            });
        }
*/
            
        /**
         * Expects an inline editor to be opened at the given cursor position and to have the
         * given initial bezierCurve (which should match the bezierCurve at that position).
         * @param {!{line:number, ch:number}} cursor The cursor position to try opening the inline at.
         * @param {string} bezierCurve The expected bezierCurve.
         */
/*
        function testOpenBezierCurve(cursor, bezierCurve) {
            makeBezierCurveEditor(cursor);
            runs(function () {
                expect(inline).toBeTruthy();
                expect(inline._bezierCurve).toBe(bezierCurve);
            });
        }
*/
        
        /**
         * Simulate the given event with clientX/clientY specified by the given
         * ratios of the item's actual width/height (offset by the left/top of the
         * item).
         * @param {string} event The name of the event to simulate.
         * @param {object} $item A jQuery object to trigger the event on.
         * @param {Array.<number>} ratios Numbers between 0 and 1 indicating the x and y positions of the
         *      event relative to the item's width and height.
         */
/*
        function eventAtRatio(event, $item, ratios) {
            $item.trigger($.Event(event, {
                clientX: $item.offset().left + (ratios[0] * $item.width()),
                clientY: $item.offset().top + (ratios[1] * $item.height())
            }));
        }
*/
                
        describe("BezierCurveUtils", function () {
            var match;
            
            // Valid cubic-bezier function cases
            it("should match bezier curve function in strict mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(.1, .2, .3, .4)", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.1, .2, .3, .4)");
                expect(match[1]).toEqual(".1");
                expect(match[2]).toEqual(".2");
                expect(match[3]).toEqual(".3");
                expect(match[4]).toEqual(".4");
            });
            it("should match bezier curve function in lax mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(.1, .2, .3, .4)", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.1, .2, .3, .4)");
                expect(match[1]).toEqual(".1");
                expect(match[2]).toEqual(".2");
                expect(match[3]).toEqual(".3");
                expect(match[4]).toEqual(".4");
            });
            it("should match bezier curve function with negative value", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(0, -.2, 1, 1.2)", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(0, -.2, 1, 1.2)");
                expect(match[1]).toEqual("0");
                expect(match[2]).toEqual("-.2");
                expect(match[3]).toEqual("1");
                expect(match[4]).toEqual("1.2");
            });
            it("should match bezier curve function in full line of longhand css", function () {
                match = BezierCurveUtils.cubicBezierMatch("    transition-timing-function: cubic-bezier(.37, .28, .83, .94);", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.37, .28, .83, .94)");
                expect(match[1]).toEqual(".37");
                expect(match[2]).toEqual(".28");
                expect(match[3]).toEqual(".83");
                expect(match[4]).toEqual(".94");
            });
            it("should match bezier curve function in full line of shorthand css", function () {
                match = BezierCurveUtils.cubicBezierMatch("    transition: top 100ms cubic-bezier(.37, .28, .83, .94) 0;", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.37, .28, .83, .94)");
                expect(match[1]).toEqual(".37");
                expect(match[2]).toEqual(".28");
                expect(match[3]).toEqual(".83");
                expect(match[4]).toEqual(".94");
            });
            it("should match bezier curve function with leading zeros", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(0.1, 0.2, 0.3, 0.4)", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(0.1, 0.2, 0.3, 0.4)");
                expect(match[1]).toEqual("0.1");
                expect(match[2]).toEqual("0.2");
                expect(match[3]).toEqual("0.3");
                expect(match[4]).toEqual("0.4");
            });
            it("should match bezier curve function with no optional whitespace", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(.1,.2,.3,.4)", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.1,.2,.3,.4)");
                expect(match[1]).toEqual(".1");
                expect(match[2]).toEqual(".2");
                expect(match[3]).toEqual(".3");
                expect(match[4]).toEqual(".4");
            });
            it("should match bezier curve function with extra optional whitespace", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier( .1 , .2 , .3 , .4 )", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier( .1 , .2 , .3 , .4 )");
                expect(match[1]).toEqual(".1");
                expect(match[2]).toEqual(".2");
                expect(match[3]).toEqual(".3");
                expect(match[4]).toEqual(".4");
            });
            
            // Valid other functions
            it("should match linear function in declaration in strict mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("transition-timing-function: linear;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("linear");
            });
            it("should match linear function value in lax mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("linear", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("linear");
            });
            it("should match ease function in declaration in strict mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("transition-timing-function: ease;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease");
            });
            it("should match ease function value in lax mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("ease", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease");
            });
            it("should match ease-in function in declaration in strict mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("transition-timing-function: ease-in;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in");
            });
            it("should match ease-in function value in lax mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("ease-in", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in");
            });
            it("should match ease-out function in declaration in strict mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("transition-timing-function: ease-out;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-out");
            });
            it("should match ease-out function value in lax mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("ease-out", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-out");
            });
            it("should match ease-in-out function in declaration in strict mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("transition-timing-function: ease-in-out;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in-out");
            });
            it("should match ease-in-out function value in lax mode", function () {
                match = BezierCurveUtils.cubicBezierMatch("ease-in-out", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in-out");
            });
            
            // Invalid cases
            it("should not match cubic-bezier function with out-of-range X parameters", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(-.2, 0, 1.2, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with Infinity parameters", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(0, Infinity, 1, -Infinity)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with non-numeric parameters", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(x1, y1, x2, y2)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with no parameters", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier()", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with 3 parameters", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(0, 0, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with 5 parameters", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier(0, 0, 1, 1, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with invalid whitespace", function () {
                match = BezierCurveUtils.cubicBezierMatch("cubic-bezier (0, 0, 1, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with UPPER-CASE", function () {
                match = BezierCurveUtils.cubicBezierMatch("CUBIC-BEZIER(0, 0, 1, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match unknown timing function", function () {
                match = BezierCurveUtils.cubicBezierMatch("ease-out-in", false);
                expect(match).toBeFalsy();
            });
            it("should not match linear when not a timing function", function () {
                match = BezierCurveUtils.cubicBezierMatch("background: linear-gradient(to bottom, blue, white);", false);
                expect(match).toBeFalsy();
            });
        });
        
        describe("Open", function () {
/*
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
         
            it("should highlight the timing function in doc when opened in inline editor", function () {
                testOpenBezierCurve({line: 1, ch: 18}, "#abcdef");
            });
*/
        });
        
        describe("Inline editor - HTML", function () {

/*
            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testContentHTML, "html");
                testDocument = mock.doc;
                testEditor = mock.editor;
            });
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });
         
            it("should open on a bezierCurve in an HTML file", function () {
                testOpenBezierCurve({line: 4, ch: 30}, "#dead01");
            });
*/
        });
            
        describe("BezierCurve editor UI", function () {
            var bezierCurveEditor,
                defaultSwatches = [{value: "#abcdef", count: 3}, {value: "rgba(100, 200, 250, 0.5)", count: 2}];
            
            /**
             * Creates a hidden BezierCurveEditor and appends it to the body. Note that this is a standalone
             * BezierCurveEditor, not inside an InlineBezierCurveEditor.
             * @param {string} initialBezierCurve The bezierCurve that should be initially set in the BezierCurveEditor.
             * @param {?function} callback An optional callback to be passed as the BezierCurveEditor's callback. If
             *     none is supplied, a dummy function is passed.
             * @param {?Array.<{value:string, count:number}>} swatches An optional array of swatches to display.
             *     If none is supplied, a default set of two swatches is passed.
             * @param {boolean=} hide Whether to hide the bezierCurve picker; default is true.
             */
/*
            function makeUI(initialBezierCurve, callback, swatches, hide) {
                bezierCurveEditor = new BezierCurveEditor($(document.body),
                                              initialBezierCurve,
                                              callback || function () { },
                                              swatches || defaultSwatches);
                if (hide !== false) {
                    bezierCurveEditor.getRootElement().css("display", "none");
                }
            }
*/
                        
/*
            afterEach(function () {
                bezierCurveEditor.getRootElement().remove();
            });
*/
            
            /**
             * Checks whether the difference between val1 and val2 is within the given tolerance.
             * (We can't use Jasmine's .toBeCloseTo() because that takes a precision in decimal places,
             * whereas we often need to check an absolute distance.)
             * @param {(number|string)} val1 The first value to check.
             * @param {(number|string)} val2 The second value to check.
             * @param {number} tolerance The desired tolerance.
             */
/*
            function checkNear(val1, val2, tolerance) {
                expect(Math.abs(Number(val1) - Number(val2)) < (tolerance || 1.0)).toBe(true);
            }
*/
            
            /**
             * Checks whether the given percentage string is near the given value.
             * @param {string} pct The percentage to check. Assumed to be a string ending in "%".
             * @param {number} val The value to check against. Assumed to be a percentage number, but not ending in "%".
             */
/*
            function checkPercentageNear(pct, val) {
                expect(checkNear(pct.substr(0, pct.length - 1), val));
            }
*/
            
            /** Returns the bezierCurveEditor's current value as a string in its current format */
/*
            function getBezierCurveString() {
                return tinybezierCurve(bezierCurveEditor.getBezierCurve()).toString();
            }
*/
            
            describe("simple load/commit", function () {
            
/*
                it("should load the initial bezierCurve correctly", function () {
                    var bezierCurveStr    = "rgba(77, 122, 31, 0.5)";
                    var bezierCurveStrRgb = "rgb(77, 122, 31)";
                    
                    runs(function () {
                        makeUI(bezierCurveStr);
                        expect(bezierCurveEditor.getBezierCurve().toString()).toBe(bezierCurveStr);
                        expect(bezierCurveEditor.$bezierCurveValue.val()).toBe(bezierCurveStr);
                        expect(tinybezierCurve.equals(bezierCurveEditor.$currentBezierCurve.css("background-bezierCurve"), bezierCurveStr)).toBe(true);
    
                        // Not sure why the tolerances need to be larger for these.
                        checkNear(tinybezierCurve(bezierCurveEditor.$selection.css("background-bezierCurve")).toHsv().h, 90, 2.0);
                        checkNear(tinybezierCurve(bezierCurveEditor.$hueBase.css("background-bezierCurve")).toHsv().h, 90, 2.0);
    
                        expect(tinybezierCurve.equals(bezierCurveEditor.$selectionBase.css("background-bezierCurve"), bezierCurveStrRgb)).toBe(true);
                    });

                    // Need to do these on a timeout since we can't seem to read back CSS positions synchronously.
                    waits(1);
                    
                    runs(function () {
                        checkPercentageNear(bezierCurveEditor.$hueSelector[0].style.bottom, 25);
                        checkPercentageNear(bezierCurveEditor.$opacitySelector[0].style.bottom, 50);
                        checkPercentageNear(bezierCurveEditor.$selectionBase[0].style.left, 74);
                        checkPercentageNear(bezierCurveEditor.$selectionBase[0].style.bottom, 47);
                    });
                });
*/
                
/*
                it("should load a committed bezierCurve correctly", function () {
                    var bezierCurveStr = "rgba(77, 122, 31, 0.5)";
                    var bezierCurveStrRgb = "rgb(77, 122, 31)";
                    
                    runs(function () {
                        makeUI("#0a0a0a");
                        bezierCurveEditor.setBezierCurveFromString(bezierCurveStr);
                        expect(bezierCurveEditor.getBezierCurve().toString()).toBe(bezierCurveStr);
                        expect(bezierCurveEditor.$bezierCurveValue.val()).toBe(bezierCurveStr);
                        expect(tinybezierCurve.equals(bezierCurveEditor.$currentBezierCurve.css("background-bezierCurve"), bezierCurveStr)).toBe(true);
                        checkNear(tinybezierCurve(bezierCurveEditor.$selection.css("background-bezierCurve")).toHsv().h, tinybezierCurve(bezierCurveStr).toHsv().h);
                        checkNear(tinybezierCurve(bezierCurveEditor.$hueBase.css("background-bezierCurve")).toHsv().h, tinybezierCurve(bezierCurveStr).toHsv().h);
                        expect(tinybezierCurve.equals(bezierCurveEditor.$selectionBase.css("background-bezierCurve"), bezierCurveStrRgb)).toBe(true);
                    });

                    // Need to do these on a timeout since we can't seem to read back CSS positions synchronously.
                    waits(1);

                    runs(function () {
                        checkPercentageNear(bezierCurveEditor.$hueSelector[0].style.bottom, 25);
                        checkPercentageNear(bezierCurveEditor.$opacitySelector[0].style.bottom, 50);
                        checkPercentageNear(bezierCurveEditor.$selectionBase[0].style.left, 74);
                        checkPercentageNear(bezierCurveEditor.$selectionBase[0].style.bottom, 47);
                    });
                });
*/
    
/*
                it("should call the callback when a new bezierCurve is committed", function () {
                    var lastBezierCurve;
                    makeUI("rgba(100, 100, 100, 0.5)", function (bezierCurve) {
                        lastBezierCurve = bezierCurve;
                    });
                    bezierCurveEditor.setBezierCurveFromString("#a0a0a0");
                    expect(lastBezierCurve).toBe("#a0a0a0");
                });
*/
                
            });
            
            describe("Conversions", function () {
                
                /**
                 * Test whether converting the given bezierCurve to the given mode results in the expected bezierCurve.
                 * @param {string} initialBezierCurve The bezierCurve to convert.
                 * @param {string} mode The mode to convert to: most be "rgba", "hsla", or "hex".
                 * @param {string} result The expected result of the conversion.
                 */
/*
                function testConvert(initialBezierCurve, mode, result) {
                    makeUI(initialBezierCurve);
                    var buttonMap = {
                        "rgba": "$rgbaButton",
                        "hsla": "$hslButton",
                        "hex": "$hexButton"
                    };
                    bezierCurveEditor[buttonMap[mode]].trigger("click");
                    expect(bezierCurveEditor.getBezierCurve().toString()).toBe(result);
                }
                
                it("should convert a hex bezierCurve to rgb when mode button clicked", function () {
                    testConvert("#112233", "rgba", "rgb(17, 34, 51)");
                });
*/
            });
            
            describe("parameter editing with mouse", function () {
                
                /**
                 * Test a mouse down event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     item: The (string) name of the member of BezierCurveEditor that references the element to test.
                 *     clickAt: An [x, y] array specifying the simulated x/y mouse position as a fraction of the
                 *          item's width/height. For example, [0.5, 0.5] would specify a click exactly in the
                 *          center of the element.
                 *     param: The (string) parameter whose value we're testing (h, s, v, or a).
                 *     expected: The expected value for the parameter.
                 *     tolerance: The tolerance in variation for the expected value.
                 */
/*
                function testMousedown(opts) {
                    makeUI("#0000ff");
                    eventAtRatio("mousedown", bezierCurveEditor[opts.item], opts.clickAt);
                    checkNear(tinybezierCurve(bezierCurveEditor.getBezierCurve()).toHsv()[opts.param], opts.expected, opts.tolerance);
                    bezierCurveEditor[opts.item].trigger("mouseup");  // clean up drag state
                }
*/

                /**
                 * Test a drag event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     item: The (string) name of the member of BezierCurveEditor that references the element to test.
                 *     clickAt: An [x, y] array specifying the simulated x/y mouse position for the initial mouse down
                 *          as a fraction of the item's width/height. For example, [0.5, 0.5] would specify a click 
                 *          exactly in the center of the element.
                 *     dragTo: An [x, y] array specifying the location to drag to, using the same convention as clickAt.
                 *     param: The (string) parameter whose value we're testing (h, s, v, or a).
                 *     expected: The expected value for the parameter.
                 *     tolerance: The tolerance in variation for the expected value.
                 */
/*
                function testDrag(opts) {
                    makeUI("#0000ff");
                    eventAtRatio("mousedown", bezierCurveEditor[opts.item], opts.clickAt);
                    eventAtRatio("mousemove", bezierCurveEditor[opts.item], opts.dragTo);
                    checkNear(tinybezierCurve(bezierCurveEditor.getBezierCurve()).toHsv()[opts.param], opts.expected, opts.tolerance);
                    bezierCurveEditor[opts.item].trigger("mouseup");  // clean up drag state
                }
*/
                
/*
                it("should set saturation on mousedown", function () {
                    testMousedown({
                        item:      "$selection",
                        clickAt:   [0.25, 0], // x: saturation, y: 1.0 - value
                        param:     "s",
                        expected:  0.25,
                        tolerance: 0.1
                    });
                });
*/
/*
                it("should set saturation on drag", function () {
                    testDrag({
                        item:      "$selection",
                        clickAt:   [0.25, 0], // x: saturation, y: 1.0 - value
                        dragTo:    [0.75, 0],
                        param:     "s",
                        expected:  0.75,
                        tolerance: 0.1
                    });
                });
*/
            });
            
            describe("parameter editing with keyboard", function () {
                
/*
                function makeKeyEvent(opts) {
                    return $.Event("keydown", { keyCode: opts.key, shiftKey: !!opts.shift });
                }
*/

                /**
                 * Test a key event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     bezierCurve: An optional initial value to set in the BezierCurveEditor. Defaults to "hsla(50, 25%, 50%, 0.5)".
                 *     item: The (string) name of the member of BezierCurveEditor that references the element to test.
                 *     key: The KeyEvent key code to simulate.
                 *     shift: Optional boolean specifying whether to simulate the shift key being down (default false).
                 *     param: The (string) parameter whose value we're testing (h, s, v, or a).
                 *     delta: The expected change in value for the parameter.
                 *     tolerance: The tolerance in variation for the expected value.
                 *     exact: True to compare the actual values stored in the _hsv object, false (default) to
                 *          compare tinybezierCurve's normalization of the bezierCurve value.
                 */
/*
                function testKey(opts) {
                    
                    function getParam() {
                        if (opts.exact) {
                            var result = bezierCurveEditor._hsv[opts.param];
                            // Because of #2201, this is sometimes a string with a percentage value.
                            if (typeof result === "string" && result.charAt(result.length - 1) === "%") {
                                result = Number(result.substr(0, result.length - 1));
                            }
                            return result;
                        } else {
                            return tinybezierCurve(bezierCurveEditor.getBezierCurve()).toHsv()[opts.param];
                        }
                    }
                    
                    makeUI(opts.bezierCurve || "hsla(50, 25%, 50%, 0.5)");

                    var before = getParam();
                    bezierCurveEditor[opts.item].trigger(makeKeyEvent(opts));
                    
                    var after = getParam();
                    checkNear(after, before + opts.delta, opts.tolerance);
                }
*/
                
                /**
                 * Test whether the given event's default is or isn't prevented on a given key.
                 * @param {object} opts The parameters to test:
                 *     bezierCurve: An optional initial value to set in the BezierCurveEditor. Defaults to "hsla(50, 25%, 50%, 0.5)".
                 *     item: The (string) name of the member of BezierCurveEditor that references the element to test.
                 *     selection: An optional array ([start, end]) specifying the selection to set in the given element.
                 *     key: The KeyEvent key code to simulate.
                 *     shift: Optional boolean specifying whether to simulate the shift key being down (default false).
                 *     expected: Whether the default is expected to be prevented.
                 */
/*
                function testPreventDefault(opts) {
                    var event, $item;
                    
                    // The bezierCurve picker needs to be displayed for this test; otherwise the
                    // selection won't be properly set, because you can only set the selection
                    // when the text field has focus.
                    makeUI(opts.bezierCurve || "hsla(50, 25%, 50%, 0.5)", function () { }, defaultSwatches, false);
                    
                    $item = bezierCurveEditor[opts.item];
                    $item.focus();
                    if (opts.selection) {
                        $item[0].setSelectionRange(opts.selection[0], opts.selection[1]);
                    }
                    
                    event = makeKeyEvent(opts);
                    $item.trigger(event);
                    expect(event.isDefaultPrevented()).toBe(opts.expected);
                }
*/
                
/*
                it("should increase saturation by 1.5% on right arrow", function () {
                    testKey({
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        param:     "s",
                        delta:     0.015,
                        tolerance: 0.01
                    });
                });
*/
/*
                it("should prevent default on the key event for an unhandled arrow key on non-text-field", function () {
                    testPreventDefault({
                        bezierCurve:     "#8e8247",
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        expected:  true
                    });
                });
*/
            });
        });
    });
});
