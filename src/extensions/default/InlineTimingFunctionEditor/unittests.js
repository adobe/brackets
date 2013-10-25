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

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils         = brackets.getModule("spec/SpecRunnerUtils"),
        KeyEvent                = brackets.getModule("utils/KeyEvent"),
        testContentCSS          = require("text!unittest-files/unittests.css"),
        provider                = require("main").inlineTimingFunctionEditorProvider,
        TimingFunctionUtils     = require("TimingFunctionUtils"),
        TimingFunctionEditor    = require("TimingFunctionEditor").TimingFunctionEditor;

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
        
        describe("TimingFunctionUtils", function () {
            var match;
            
            // Valid cubic-bezier function cases
            it("should match bezier curve function in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(.1, .2, .3, .4)", false);
                expect(match).toBeTruthy();
                expectArraysToBeEqual(match, ["cubic-bezier(.1, .2, .3, .4)", ".1", ".2", ".3", ".4"]);
            });
            it("should match bezier curve function in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(.1, .2, .3, .4)", true);
                expect(match).toBeTruthy();
                expectArraysToBeEqual(match, ["cubic-bezier(.1, .2, .3, .4)", ".1", ".2", ".3", ".4"]);
            });
            it("should match bezier curve function with negative value", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(0, -.2, 1, 1.2)", false);
                expectArraysToBeEqual(match, ["cubic-bezier(0, -.2, 1, 1.2)", "0", "-.2", "1", "1.2"]);
            });
            it("should match bezier curve function in full line of longhand css", function () {
                match = TimingFunctionUtils.bezierCurveMatch("    transition-timing-function: cubic-bezier(.37, .28, .83, .94);", true);
                expectArraysToBeEqual(match, ["cubic-bezier(.37, .28, .83, .94)", ".37", ".28", ".83", ".94"]);
            });
            it("should match bezier curve function in full line of shorthand css", function () {
                match = TimingFunctionUtils.bezierCurveMatch("    transition: top 100ms cubic-bezier(.37, .28, .83, .94) 0;", true);
                expectArraysToBeEqual(match, ["cubic-bezier(.37, .28, .83, .94)", ".37", ".28", ".83", ".94"]);
            });
            it("should match bezier curve function with leading zeros", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(0.1, 0.2, 0.3, 0.4)", false);
                expectArraysToBeEqual(match, ["cubic-bezier(0.1, 0.2, 0.3, 0.4)", "0.1", "0.2", "0.3", "0.4"]);
            });
            it("should match bezier curve function with no optional whitespace", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(.1,.2,.3,.4)", false);
                expectArraysToBeEqual(match, ["cubic-bezier(.1,.2,.3,.4)", ".1", ".2", ".3", ".4"]);
            });
            it("should match bezier curve function with extra optional whitespace", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier( .1 , .2 , .3 , .4 )", false);
                expectArraysToBeEqual(match, ["cubic-bezier( .1 , .2 , .3 , .4 )", ".1", ".2", ".3", ".4"]);
            });
            
            // Valid other functions
            it("should match linear function in declaration in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: linear;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("linear");
            });
            it("should match linear function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("linear", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("linear");
            });
            it("should match ease function in declaration in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: ease;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease");
            });
            it("should match ease function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("ease", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease");
            });
            it("should match ease-in function in declaration in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: ease-in;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in");
            });
            it("should match ease-in function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("ease-in", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in");
            });
            it("should match ease-out function in declaration in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: ease-out;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-out");
            });
            it("should match ease-out function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("ease-out", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-out");
            });
            it("should match ease-in-out function in declaration in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: ease-in-out;", false);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in-out");
            });
            it("should match ease-in-out function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("ease-in-out", true);
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in-out");
            });
            
            // Invalid cases
            it("should not match cubic-bezier function with out-of-range X parameters", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(-.2, 0, 1.2, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with Infinity parameters", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(0, Infinity, 1, -Infinity)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with non-numeric parameters", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(x1, y1, x2, y2)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with no parameters", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier()", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with 3 parameters", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(0, 0, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with 5 parameters", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(0, 0, 1, 1, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with invalid whitespace", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier (0, 0, 1, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match cubic-bezier function with UPPER-CASE", function () {
                match = TimingFunctionUtils.bezierCurveMatch("CUBIC-BEZIER(0, 0, 1, 1)", false);
                expect(match).toBeFalsy();
            });
            it("should not match unknown timing function", function () {
                match = TimingFunctionUtils.bezierCurveMatch("ease-out-in", false);
                expect(match).toBeFalsy();
            });
            it("should not match linear when not a timing function", function () {
                match = TimingFunctionUtils.bezierCurveMatch("background: linear-gradient(to bottom, blue, white);", false);
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
        });
        
        describe("TimingFunction editor UI", function () {
            var timingFunctionEditor;
            
            /**
             * Creates a hidden TimingFunctionEditor and appends it to the body. Note that this is a
             * standalone TimingFunctionEditor, not inside an InlineTimingFunctionEditor.
             * @param {string} initialTimingFunction The timingFunction that should be initially set
             *     in the TimingFunctionEditor.
             * @param {?function} callback An optional callback to be passed as the TimingFunctionEditor's
             *     callback. If none is supplied, a dummy function is passed.
             */
            function makeUI(initialTimingFunction, callback) {
                timingFunctionEditor = new TimingFunctionEditor(
                    $(document.body),
                    TimingFunctionUtils.bezierCurveMatch(initialTimingFunction, true),
                    callback || function () { }
                );
                
                // Hide it
                timingFunctionEditor.getRootElement().css("display", "none");
            }
            
            afterEach(function () {
                timingFunctionEditor.getRootElement().remove();
            });
            
            
            describe("Initial Load and External Update", function () {
            
                it("should load the initial timing function correctly", function () {
                    runs(function () {
                        makeUI("cubic-bezier(.2, .3, .4, .5)");
                        expect(timingFunctionEditor).toBeTruthy();
                        expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, [".2", ".3", ".4", ".5"]);
                    });
                });
                it("should load externally updated timing function correctly", function () {
                    runs(function () {
                        makeUI("cubic-bezier(.1, .3, .5, .7)");
                        var matchUpdate = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(.2, .4, .6, .8)", true);
                        timingFunctionEditor.handleExternalUpdate(matchUpdate);
                        expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, [".2", ".4", ".6", ".8"]);
                    });
                });
            });
            
            describe("Conversions", function () {
                
                it("should convert linear function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("linear");
                        expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, ["0", "0", "1", "1"]);
                    });
                });
                it("should convert ease function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("ease");
                        expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, [".25", ".1", ".25", "1"]);
                    });
                });
                it("should convert ease-in function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("ease-in");
                        expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, [".42", "0", "1", "1"]);
                    });
                });
                it("should convert ease-out function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("ease-out");
                        expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, ["0", "0", ".58", "1"]);
                    });
                });
                it("should convert ease-in-out function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("ease-in-out");
                        expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, [".42", "0", ".58", "1"]);
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
                 *     item: The (string) name of the member of TimingFunctionEditor that
                 *          references the element to test.
                 *     clickAt: An [x, y] array specifying the simulated x/y mouse position as
                 *          an offset of the item's width/height.
                 *     expected: The expected array of values for _cubicBezierCoords.
                 */
                function testCubicBezierClick(opts) {
                    makeUI("cubic-bezier(.42, 0, .58 ,1)");
                    var $item = $(timingFunctionEditor[opts.item]);
                    eventAtOffset("click", $item, opts.clickAt);
                    expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, opts.expected);
                }

                /**
                 * Test a drag event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     downItem: The (string) name of the member of TimingFunctionEditor
                 *          that references the element to mousedown on to drag.
                 *     clickAt: An [x, y] array specifying the simulated x/y mouse position as an offset of the
                 *          item's width/height.
                 *     dragItem: The (string) name of the member of TimingFunctionEditor
                 *          that references the element to drag item to.
                 *     dragTo: An [x, y] array specifying the location to drag to, using the same convention as clickAt.
                 *     expected: The expected array of values for _cubicBezierCoords.
                 */
                function testCubicBezierDrag(opts) {
                    makeUI("cubic-bezier(.42, 0, .58 ,1)");
                    var $downItem = $(timingFunctionEditor[opts.downItem]),
                        $dragItem = $(timingFunctionEditor[opts.dragItem]);
                    
                    eventAtOffset("mousedown", $downItem, opts.clickAt);
                    eventAtOffset("mousemove", $dragItem, opts.dragTo);
                    $downItem.trigger("mouseup");
                    expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, opts.expected);
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
                 * Test a key event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     curve: The initial cubic-bezier curve
                 *     item: The (string) name of the member of TimingFunctionEditor
                 *          that references the element to test.
                 *     key: The KeyEvent key code to simulate.
                 *     shift: Optional boolean specifying whether to simulate the shift
                 *          key being down (default false).
                 *     expected: The expected array of values for _cubicBezierCoords.
                 */
                function testKey(opts) {
                    makeUI(opts.curve, opts.callback);
                    var $item = $(timingFunctionEditor[opts.item]);
                    $item.focus();
                    $item.trigger(makeKeyEvent(opts));
                    expectArraysToBeEqual(timingFunctionEditor._cubicBezierCoords, opts.expected);
                }
                
                it("should increase P1 x-value by .02 on right arrow", function () {
                    testKey({
                        curve:     "cubic-bezier(.42, 0, .58 ,1)",
                        item:      "P1",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        shift:     false,
                        expected:  [".44", "0", ".58", "1"]
                    });
                });
                it("should increase P1 y-value by .1 on shift up arrow", function () {
                    testKey({
                        curve:     "cubic-bezier(.42, 0, .58 ,1)",
                        item:      "P1",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        expected:  [".42", ".1", ".58", "1"]
                    });
                });
                it("should decrease P2 x-value by .02 on left arrow", function () {
                    testKey({
                        curve:     "cubic-bezier(.42, 0, .58 ,1)",
                        item:      "P2",
                        key:       KeyEvent.DOM_VK_LEFT,
                        shift:     false,
                        expected:  [".42", "0", ".56", "1"]
                    });
                });
                it("should decrease P2 y-value by .1 on shift down arrow", function () {
                    testKey({
                        curve:     "cubic-bezier(.42, 0, .58 ,1)",
                        item:      "P2",
                        key:       KeyEvent.DOM_VK_DOWN,
                        shift:     true,
                        expected:  [".42", "0", ".58", ".9"]
                    });
                });
                it("should not decrease P1 x-value below 0 on left arrow", function () {
                    testKey({
                        curve:     "cubic-bezier(0, 0, 1 ,1)",
                        item:      "P1",
                        key:       KeyEvent.DOM_VK_LEFT,
                        shift:     false,
                        expected:  ["0", "0", "1", "1"]
                    });
                });
                it("should not increase P2 x-value above 0 on shift right arrow", function () {
                    testKey({
                        curve:     "cubic-bezier(0, 0, 1 ,1)",
                        item:      "P2",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        shift:     true,
                        expected:  ["0", "0", "1", "1"]
                    });
                });
                it("should call callback function after edit", function () {
                    var calledBack = false;
                    
                    var _callback = function (timingFunctionString) {
                        calledBack = true;
                        expect(timingFunctionString).toBe("cubic-bezier(.42, .1, .58, 1)");
                    };
                        
                    runs(function () {
                        testKey({
                            curve:     "cubic-bezier(.42, 0, .58 ,1)",
                            item:      "P1",
                            key:       KeyEvent.DOM_VK_UP,
                            shift:     true,
                            expected:  [".42", ".1", ".58", "1"],
                            callback:  _callback
                        });
                    });
                    
                    runs(function () {
                        expect(calledBack).toBeTruthy();
                    });
                });
                
            });
        });
    });
});
