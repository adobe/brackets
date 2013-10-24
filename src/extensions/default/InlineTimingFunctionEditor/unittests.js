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


Search/Replace
- rgb
- hsl, hsv


Tests
- select correct range from IP
- editor updates when doc updated
- doc updates when edit made


*******************************/


define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils         = brackets.getModule("spec/SpecRunnerUtils"),
//        Editor                  = brackets.getModule("editor/Editor").Editor,
//        DocumentManager         = brackets.getModule("document/DocumentManager"),
//        Strings                 = brackets.getModule("strings"),
//        KeyEvent                = brackets.getModule("utils/KeyEvent"),
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
                
        describe("TimingFunctionUtils", function () {
            var match;
            
            // Valid cubic-bezier function cases
            it("should match bezier curve function in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(.1, .2, .3, .4)", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.1, .2, .3, .4)");
                expect(match[1]).toEqual(".1");
                expect(match[2]).toEqual(".2");
                expect(match[3]).toEqual(".3");
                expect(match[4]).toEqual(".4");
            });
            it("should match bezier curve function in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(.1, .2, .3, .4)", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.1, .2, .3, .4)");
                expect(match[1]).toEqual(".1");
                expect(match[2]).toEqual(".2");
                expect(match[3]).toEqual(".3");
                expect(match[4]).toEqual(".4");
            });
            it("should match bezier curve function with negative value", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(0, -.2, 1, 1.2)", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(0, -.2, 1, 1.2)");
                expect(match[1]).toEqual("0");
                expect(match[2]).toEqual("-.2");
                expect(match[3]).toEqual("1");
                expect(match[4]).toEqual("1.2");
            });
            it("should match bezier curve function in full line of longhand css", function () {
                match = TimingFunctionUtils.bezierCurveMatch("    transition-timing-function: cubic-bezier(.37, .28, .83, .94);", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.37, .28, .83, .94)");
                expect(match[1]).toEqual(".37");
                expect(match[2]).toEqual(".28");
                expect(match[3]).toEqual(".83");
                expect(match[4]).toEqual(".94");
            });
            it("should match bezier curve function in full line of shorthand css", function () {
                match = TimingFunctionUtils.bezierCurveMatch("    transition: top 100ms cubic-bezier(.37, .28, .83, .94) 0;", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.37, .28, .83, .94)");
                expect(match[1]).toEqual(".37");
                expect(match[2]).toEqual(".28");
                expect(match[3]).toEqual(".83");
                expect(match[4]).toEqual(".94");
            });
            it("should match bezier curve function with leading zeros", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(0.1, 0.2, 0.3, 0.4)", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(0.1, 0.2, 0.3, 0.4)");
                expect(match[1]).toEqual("0.1");
                expect(match[2]).toEqual("0.2");
                expect(match[3]).toEqual("0.3");
                expect(match[4]).toEqual("0.4");
            });
            it("should match bezier curve function with no optional whitespace", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(.1,.2,.3,.4)", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(5);
                expect(match[0]).toEqual("cubic-bezier(.1,.2,.3,.4)");
                expect(match[1]).toEqual(".1");
                expect(match[2]).toEqual(".2");
                expect(match[3]).toEqual(".3");
                expect(match[4]).toEqual(".4");
            });
            it("should match bezier curve function with extra optional whitespace", function () {
                match = TimingFunctionUtils.bezierCurveMatch("cubic-bezier( .1 , .2 , .3 , .4 )", false);
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
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: linear;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("linear");
            });
            it("should match linear function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("linear", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("linear");
            });
            it("should match ease function in declaration in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: ease;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease");
            });
            it("should match ease function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("ease", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease");
            });
            it("should match ease-in function in declaration in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: ease-in;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in");
            });
            it("should match ease-in function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("ease-in", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in");
            });
            it("should match ease-out function in declaration in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: ease-out;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-out");
            });
            it("should match ease-out function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("ease-out", true);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-out");
            });
            it("should match ease-in-out function in declaration in strict mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("transition-timing-function: ease-in-out;", false);
                expect(match).toBeTruthy();
                expect(match.length).toEqual(1);
                expect(match[0]).toEqual("ease-in-out");
            });
            it("should match ease-in-out function value in lax mode", function () {
                match = TimingFunctionUtils.bezierCurveMatch("ease-in-out", true);
                expect(match).toBeTruthy();
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
             * @param {boolean=} hide Whether to hide the TimingFunctionEditor; default is true.
             */
            function makeUI(initialTimingFunction, callback, hide) {
                timingFunctionEditor = new TimingFunctionEditor(
                    $(document.body),
                    TimingFunctionUtils.bezierCurveMatch(initialTimingFunction, true),
                    callback || function () { }
                );
                if (hide !== false) {
                    timingFunctionEditor.getRootElement().css("display", "none");
                }
            }
                        
            afterEach(function () {
                timingFunctionEditor.getRootElement().remove();
            });
            
            
            describe("Initial Load and External Update", function () {
            
                it("should load the initial timing function correctly", function () {
                    runs(function () {
                        makeUI("cubic-bezier(.2, .3, .4, .5)");
                        expect(timingFunctionEditor).toBeTruthy();
                        expect(timingFunctionEditor._cubicBezierCoords[0]).toBe(".2");
                        expect(timingFunctionEditor._cubicBezierCoords[1]).toBe(".3");
                        expect(timingFunctionEditor._cubicBezierCoords[2]).toBe(".4");
                        expect(timingFunctionEditor._cubicBezierCoords[3]).toBe(".5");
                    });
                });
                it("should load externally updated timing function correctly", function () {
                    runs(function () {
                        makeUI("cubic-bezier(.1, .3, .5, .7)");
                        expect(timingFunctionEditor).toBeTruthy();
                        
                        var matchUpdate = TimingFunctionUtils.bezierCurveMatch("cubic-bezier(.2, .4, .6, .8)", true);
                        timingFunctionEditor.handleExternalUpdate(matchUpdate);
                        
                        expect(timingFunctionEditor._cubicBezierCoords[0]).toBe(".2");
                        expect(timingFunctionEditor._cubicBezierCoords[1]).toBe(".4");
                        expect(timingFunctionEditor._cubicBezierCoords[2]).toBe(".6");
                        expect(timingFunctionEditor._cubicBezierCoords[3]).toBe(".8");
                    });
                });
            });
            
            describe("Conversions", function () {
                
                it("should convert linear function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("linear");
                        expect(timingFunctionEditor).toBeTruthy();
                        expect(timingFunctionEditor._cubicBezierCoords[0]).toBe("0");
                        expect(timingFunctionEditor._cubicBezierCoords[1]).toBe("0");
                        expect(timingFunctionEditor._cubicBezierCoords[2]).toBe("1");
                        expect(timingFunctionEditor._cubicBezierCoords[3]).toBe("1");
                    });
                });
                it("should convert ease function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("ease");
                        expect(timingFunctionEditor).toBeTruthy();
                        expect(timingFunctionEditor._cubicBezierCoords[0]).toBe("0.25");
                        expect(timingFunctionEditor._cubicBezierCoords[1]).toBe("0.1");
                        expect(timingFunctionEditor._cubicBezierCoords[2]).toBe("0.25");
                        expect(timingFunctionEditor._cubicBezierCoords[3]).toBe("1");
                    });
                });
                it("should convert ease-in function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("ease-in");
                        expect(timingFunctionEditor).toBeTruthy();
                        expect(timingFunctionEditor._cubicBezierCoords[0]).toBe("0.42");
                        expect(timingFunctionEditor._cubicBezierCoords[1]).toBe("0");
                        expect(timingFunctionEditor._cubicBezierCoords[2]).toBe("1");
                        expect(timingFunctionEditor._cubicBezierCoords[3]).toBe("1");
                    });
                });
                it("should convert ease-out function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("ease-out");
                        expect(timingFunctionEditor).toBeTruthy();
                        expect(timingFunctionEditor._cubicBezierCoords[0]).toBe("0");
                        expect(timingFunctionEditor._cubicBezierCoords[1]).toBe("0");
                        expect(timingFunctionEditor._cubicBezierCoords[2]).toBe("0.58");
                        expect(timingFunctionEditor._cubicBezierCoords[3]).toBe("1");
                    });
                });
                it("should convert ease-in-out function to cubic-bezier function parameters", function () {
                    runs(function () {
                        makeUI("ease-in-out");
                        expect(timingFunctionEditor).toBeTruthy();
                        expect(timingFunctionEditor._cubicBezierCoords[0]).toBe("0.42");
                        expect(timingFunctionEditor._cubicBezierCoords[1]).toBe("0");
                        expect(timingFunctionEditor._cubicBezierCoords[2]).toBe("0.58");
                        expect(timingFunctionEditor._cubicBezierCoords[3]).toBe("1");
                    });
                });
            });
            
            describe("Editing with Mouse", function () {
                
                /**
                 * Test a mouse down event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     item: The (string) name of the member of TimingFunctionEditor that references the element to test.
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
                    eventAtRatio("mousedown", timingFunctionEditor[opts.item], opts.clickAt);
                    timingFunctionEditor[opts.item].trigger("mouseup");  // clean up drag state
                }
*/

                /**
                 * Test a drag event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     item: The (string) name of the member of TimingFunctionEditor that references the element to test.
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
                    eventAtRatio("mousedown", timingFunctionEditor[opts.item], opts.clickAt);
                    eventAtRatio("mousemove", timingFunctionEditor[opts.item], opts.dragTo);
                    timingFunctionEditor[opts.item].trigger("mouseup");  // clean up drag state
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
            
            describe("Editing with Keyboard", function () {
                
/*
                function makeKeyEvent(opts) {
                    return $.Event("keydown", { keyCode: opts.key, shiftKey: !!opts.shift });
                }
*/

                /**
                 * Test a key event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     timingFunction: An optional initial value to set in the TimingFunctionEditor. Defaults to "hsla(50, 25%, 50%, 0.5)".
                 *     item: The (string) name of the member of TimingFunctionEditor that references the element to test.
                 *     key: The KeyEvent key code to simulate.
                 *     shift: Optional boolean specifying whether to simulate the shift key being down (default false).
                 *     param: The (string) parameter whose value we're testing (h, s, v, or a).
                 *     delta: The expected change in value for the parameter.
                 *     tolerance: The tolerance in variation for the expected value.
                 */
/*
                function testKey(opts) {
                    
                    function getParam() {
                        var result = timingFunctionEditor._hsv[opts.param];
                        // Because of #2201, this is sometimes a string with a percentage value.
                        if (typeof result === "string" && result.charAt(result.length - 1) === "%") {
                            result = Number(result.substr(0, result.length - 1));
                        }
                        return result;
                    }
                    
                    makeUI(opts.timingFunction || "hsla(50, 25%, 50%, 0.5)");

                    var before = getParam();
                    timingFunctionEditor[opts.item].trigger(makeKeyEvent(opts));
                }
*/
                
                /**
                 * Test whether the given event's default is or isn't prevented on a given key.
                 * @param {object} opts The parameters to test:
                 *     timingFunction: An optional initial value to set in the TimingFunctionEditor. Defaults to "hsla(50, 25%, 50%, 0.5)".
                 *     item: The (string) name of the member of TimingFunctionEditor that references the element to test.
                 *     selection: An optional array ([start, end]) specifying the selection to set in the given element.
                 *     key: The KeyEvent key code to simulate.
                 *     shift: Optional boolean specifying whether to simulate the shift key being down (default false).
                 *     expected: Whether the default is expected to be prevented.
                 */
/*
                function testPreventDefault(opts) {
                    var event, $item;
                    
                    // The timing function editor needs to be displayed for this test; otherwise the
                    // selection won't be properly set, because you can only set the selection
                    // when the text field has focus.
                    makeUI(opts.timingFunction || "hsla(50, 25%, 50%, 0.5)", null, false);
                    
                    $item = timingFunctionEditor[opts.item];
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
                        timingFunction:     "#8e8247",
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
