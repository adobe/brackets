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
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, brackets, waitsForDone, spyOn, tinycolor, KeyEvent */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils   = brackets.getModule("spec/SpecRunnerUtils"),
        Editor            = brackets.getModule("editor/Editor").Editor,
        DocumentManager   = brackets.getModule("document/DocumentManager"),
        Strings           = brackets.getModule("strings"),
        KeyEvent          = brackets.getModule("utils/KeyEvent"),
        testContentCSS    = require("text!unittests.css"),
        testContentHTML   = require("text!unittests.html"),
        provider          = require("main").inlineColorEditorProvider,
        InlineColorEditor = require("InlineColorEditor").InlineColorEditor,
        ColorEditor       = require("ColorEditor").ColorEditor;

    require("thirdparty/tinycolor-min");

    describe("Inline Color Editor - unit", function () {

        var testDocument, testEditor, inline;
        
        /**
         * Creates an inline color editor connected to the given cursor position in the test editor.
         * Note that this does *not* actually open it as an inline editor in the test editor.
         * Tests that use this must wrap their contents in a runs() block.
         * @param {!{line:number, ch: number}} cursor Position for which to open the inline editor.
         * if the provider did not create an inline editor.
         */
        function makeColorEditor(cursor) {
            runs(function () {
                var promise = provider(testEditor, cursor);
                if (promise) {
                    promise.done(function (inlineResult) {
                        inlineResult.onAdded();
                        inline = inlineResult;
                    });
                    waitsForDone(promise, "open color editor");
                }
            });
        }
            
        /**
         * Expects an inline editor to be opened at the given cursor position and to have the
         * given initial color (which should match the color at that position).
         * @param {!{line:number, ch:number}} cursor The cursor position to try opening the inline at.
         * @param {string} color The expected color.
         */
        function testOpenColor(cursor, color) {
            makeColorEditor(cursor);
            runs(function () {
                expect(inline).toBeTruthy();
                expect(inline._color).toBe(color);
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
        function eventAtRatio(event, $item, ratios) {
            $item.trigger($.Event(event, {
                clientX: $item.offset().left + (ratios[0] * $item.width()),
                clientY: $item.offset().top + (ratios[1] * $item.height())
            }));
        }
                
        describe("Inline editor - CSS", function () {

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
         
            describe("simple open cases", function () {
                
                it("should show the correct color when opened on an #rrggbb color", function () {
                    testOpenColor({line: 1, ch: 18}, "#abcdef");
                });
                it("should open when at the beginning of the color", function () {
                    testOpenColor({line: 1, ch: 16}, "#abcdef");
                });
                it("should open when at the end of the color", function () {
                    testOpenColor({line: 1, ch: 23}, "#abcdef");
                });
                it("should show the correct color when opened on an #rgb color", function () {
                    testOpenColor({line: 5, ch: 18}, "#abc");
                });
                it("should show the correct color when opened on an rgb() color", function () {
                    testOpenColor({line: 9, ch: 18}, "rgb(100, 200, 150)");
                });
                it("should show the correct color when opened on an rgba() color", function () {
                    testOpenColor({line: 13, ch: 18}, "rgba(100, 200, 150, 0.5)");
                });
                it("should show the correct color when opened on an hsl() color", function () {
                    testOpenColor({line: 17, ch: 18}, "hsl(180, 50%, 50%)");
                });
                it("should show the correct color when opened on an hsla() color", function () {
                    testOpenColor({line: 21, ch: 18}, "hsla(180, 50%, 50%, 0.5)");
                });
                it("should show the correct color when opened on an uppercase hex color", function () {
                    testOpenColor({line: 33, ch: 18}, "#DEFCBA");
                });
                it("should show the correct color when opened on a color in a shorthand property", function () {
                    testOpenColor({line: 41, ch: 27}, "#0f0f0f");
                });
                
                it("should not open when not on a color", function () {
                    makeColorEditor({line: 1, ch: 6});
                    runs(function () {
                        expect(inline).toEqual(null);
                    });
                });
                it("should not open when on an invalid color", function () {
                    makeColorEditor({line: 25, ch: 18});
                    runs(function () {
                        expect(inline).toEqual(null);
                    });
                });
                it("should not open when on an hsl color with missing percent signs", function () {
                    makeColorEditor({line: 37, ch: 18});
                    runs(function (inline) {
                        expect(inline).toEqual(null);
                    });
                });
                
                it("should open on the second color when there are two colors in the same line", function () {
                    testOpenColor({line: 29, ch: 48}, "#ddeeff");
                });
            
                it("should properly add/remove ref to document when opened/closed", function () {
                    runs(function () {
                        spyOn(testDocument, "addRef").andCallThrough();
                        spyOn(testDocument, "releaseRef").andCallThrough();
                    });
                    makeColorEditor({line: 1, ch: 18});
                    runs(function () {
                        expect(testDocument.addRef).toHaveBeenCalled();
                        expect(testDocument.addRef.callCount).toBe(1);
                        
                        inline.onClosed();
                        expect(testDocument.releaseRef).toHaveBeenCalled();
                        expect(testDocument.releaseRef.callCount).toBe(1);
                    });
                });
                
            });
            
            describe("update host document on edit in color editor", function () {
                
                it("should update host document when change is committed in color editor", function () {
                    makeColorEditor({line: 1, ch: 18});
                    runs(function () {
                        inline.colorEditor.setColorFromString("#c0c0c0");
                        expect(testDocument.getRange({line: 1, ch: 16}, {line: 1, ch: 23})).toBe("#c0c0c0");
                    });
                });
                
                it("should update correct range of host document with color format of different length", function () {
                    makeColorEditor({line: 1, ch: 18});
                    runs(function () {
                        inline.colorEditor.setColorFromString("rgb(20, 20, 20)");
                        expect(testDocument.getRange({line: 1, ch: 16}, {line: 1, ch: 31})).toBe("rgb(20, 20, 20)");
                    });
                });
    
                it("should not invalidate range when change is committed", function () {
                    makeColorEditor({line: 1, ch: 18});
                    runs(function () {
                        inline.colorEditor.setColorFromString("rgb(20, 20, 20)");
                        expect(inline.getCurrentRange()).not.toBeNull();
                    });
                });
    
            });
            
            describe("update color editor on edit in host editor", function () {
                
                it("should update when edit is made to color range in host editor", function () {
                    makeColorEditor({line: 1, ch: 18});
                    runs(function () {
                        spyOn(inline, "close");
        
                        testDocument.replaceRange("0", {line: 1, ch: 18}, {line: 1, ch: 19});
                        expect(inline._color).toBe("#a0cdef");
                        // TODO (#2201): this assumes getColor() is a tinycolor, but sometimes it's a string
                        expect(inline.colorEditor.getColor().toHexString().toLowerCase()).toBe("#a0cdef");
                        expect(inline.close).not.toHaveBeenCalled();
                        expect(inline.getCurrentRange()).toEqual({start: {line: 1, ch: 16}, end: {line: 1, ch: 23}});
                    });
                });
                
                it("should close itself if edit is made that destroys end bookmark and leaves color invalid", function () {
                    makeColorEditor({line: 1, ch: 18});
                    runs(function () {
                        spyOn(inline, "close");
                        
                        // Replace everything including the semicolon, so it crosses the bookmark boundary.
                        testDocument.replaceRange("rgb(255, 25", {line: 1, ch: 16}, {line: 1, ch: 24});
                        expect(inline.close).toHaveBeenCalled();
                    });
                });
                
                it("should maintain the range if the user deletes the last character of the color and types a new one", function () {
                    makeColorEditor({line: 1, ch: 18});
                    runs(function () {
                        spyOn(inline, "close");
        
                        testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 23});
                        testDocument.replaceRange("0", {line: 1, ch: 22}, {line: 1, ch: 22});
                        expect(inline._color).toBe("#abcde0");
                        expect(inline.close).not.toHaveBeenCalled();
                        expect(inline.getCurrentRange()).toEqual({start: {line: 1, ch: 16}, end: {line: 1, ch: 23}});
                    });
                });
                
                it("should not update the end bookmark to a shorter valid match if the bookmark still exists and the color becomes invalid", function () {
                    makeColorEditor({line: 1, ch: 18});
                    runs(function () {
                        testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 23});
                        expect(inline._color).toBe("#abcde");
                        expect(inline.getCurrentRange()).toEqual({start: {line: 1, ch: 16}, end: {line: 1, ch: 22}});
                    });
                });
                
                // TODO: (issue #2166) The following test fails because if the end bookmark is deleted, we match the shorter
                // #xxx string at the beginning of the color and assume that's valid, and then reset the bookmark
                // to the end of that location.
    //            it("should not update the end bookmark to a shorter valid match if the bookmark no longer exists and the color becomes invalid", function () {
    //                makeColorEditor({line: 1, ch: 18}).done(function (inline) {
    //                    testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 24});
    //                    expect(inline._color).toBe("#abcde");
    //                    expect(inline.getCurrentRange()).toEqual({start: {line: 1, ch: 16}, end: {line: 1, ch: 22}});
    //                });
    //            });
                
            });
            
        });
        
        describe("Inline editor - HTML", function () {

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
         
            it("should open on a color in an HTML file", function () {
                testOpenColor({line: 4, ch: 30}, "#dead01");
            });
        });
            
        describe("Inline editor - used colors processing", function () {
            
            it("should trim the original array to the given length", function () {
                var inline = new InlineColorEditor();
                var result = inline._collateColors(["#abcdef", "#fedcba", "#aabbcc", "#bbccdd"], 2);
                expect(result).toEqual([
                    {value: "#abcdef", count: 1},
                    {value: "#fedcba", count: 1}
                ]);
            });
            
            it("should remove duplicates from the original array and sort it by usage", function () {
                var inline = new InlineColorEditor();
                var result = inline._collateColors(["#abcdef", "#fedcba", "#123456", "#FEDCBA", "#123456", "#123456", "rgb(100, 100, 100)"], 100);
                expect(result).toEqual([
                    {value: "#123456", count: 3},
                    {value: "#fedcba", count: 2},
                    {value: "#abcdef", count: 1},
                    {value: "rgb(100, 100, 100)", count: 1}
                ]);
            });
        });
        
        describe("Color editor UI", function () {
            var colorEditor,
                defaultSwatches = [{value: "#abcdef", count: 3}, {value: "rgba(100, 200, 250, 0.5)", count: 2}];
            
            /**
             * Creates a hidden ColorEditor and appends it to the body. Note that this is a standalone
             * ColorEditor, not inside an InlineColorEditor.
             * @param {string} initialColor The color that should be initially set in the ColorEditor.
             * @param {?function} callback An optional callback to be passed as the ColorEditor's callback. If
             *     none is supplied, a dummy function is passed.
             * @param {?Array.<{value:string, count:number}>} swatches An optional array of swatches to display.
             *     If none is supplied, a default set of two swatches is passed.
             * @param {boolean=} hide Whether to hide the color picker; default is true.
             */
            function makeUI(initialColor, callback, swatches, hide) {
                colorEditor = new ColorEditor($(document.body),
                                              initialColor,
                                              callback || function () { },
                                              swatches || defaultSwatches);
                if (hide !== false) {
                    colorEditor.getRootElement().css("display", "none");
                }
            }
                        
            afterEach(function () {
                colorEditor.getRootElement().remove();
            });
            
            /**
             * Checks whether the difference between val1 and val2 is within the given tolerance.
             * (We can't use Jasmine's .toBeCloseTo() because that takes a precision in decimal places,
             * whereas we often need to check an absolute distance.)
             * @param {(number|string)} val1 The first value to check.
             * @param {(number|string)} val2 The second value to check.
             * @param {number} tolerance The desired tolerance.
             */
            function checkNear(val1, val2, tolerance) {
                expect(Math.abs(Number(val1) - Number(val2)) < (tolerance || 1.0)).toBe(true);
            }
            /**
             * Checks whether the given percentage string is near the given value.
             * @param {string} pct The percentage to check. Assumed to be a string ending in "%".
             * @param {number} val The value to check against. Assumed to be a percentage number, but not ending in "%".
             */
            function checkPercentageNear(pct, val) {
                expect(checkNear(pct.substr(0, pct.length - 1), val));
            }
            
            /** Returns the colorEditor's current value as a string in its current format */
            function getColorString() {
                return tinycolor(colorEditor.getColor()).toString();
            }
            
            describe("simple load/commit", function () {
            
                it("should load the initial color correctly", function () {
                    var colorStr = "rgba(77, 122, 31, 0.5)";
                    
                    runs(function () {
                        makeUI(colorStr);
                        expect(colorEditor.getColor().toString()).toBe(colorStr);
                        expect(colorEditor.$colorValue.attr("value")).toBe(colorStr);
                        expect(tinycolor.equals(colorEditor.$currentColor.css("background-color"), colorStr)).toBe(true);
    
                        // Not sure why the tolerances need to be larger for these.
                        checkNear(tinycolor(colorEditor.$selection.css("background-color")).toHsv().h, 90, 2.0);
                        checkNear(tinycolor(colorEditor.$hueBase.css("background-color")).toHsv().h, 90, 2.0);
    
                        expect(tinycolor.equals(colorEditor.$selectionBase.css("background-color"), colorStr)).toBe(true);
                    });

                    // Need to do these on a timeout since we can't seem to read back CSS positions synchronously.
                    waits(1);
                    
                    runs(function () {
                        checkPercentageNear(colorEditor.$hueSelector.css("bottom"), 25);
                        checkPercentageNear(colorEditor.$opacitySelector.css("bottom"), 50);
                        checkPercentageNear(colorEditor.$selectionBase.css("left"), 74);
                        checkPercentageNear(colorEditor.$selectionBase.css("bottom"), 47);
                    });
                });
                
                it("should load a committed color correctly", function () {
                    var colorStr = "rgba(77, 122, 31, 0.5)";
                    
                    runs(function () {
                        makeUI("#0a0a0a");
                        colorEditor.setColorFromString(colorStr);
                        expect(colorEditor.getColor().toString()).toBe(colorStr);
                        expect(colorEditor.$colorValue.attr("value")).toBe(colorStr);
                        expect(tinycolor.equals(colorEditor.$currentColor.css("background-color"), colorStr)).toBe(true);
                        checkNear(tinycolor(colorEditor.$selection.css("background-color")).toHsv().h, tinycolor(colorStr).toHsv().h);
                        checkNear(tinycolor(colorEditor.$hueBase.css("background-color")).toHsv().h, tinycolor(colorStr).toHsv().h);
                        expect(tinycolor.equals(colorEditor.$selectionBase.css("background-color"), colorStr)).toBe(true);
                    });

                    // Need to do these on a timeout since we can't seem to read back CSS positions synchronously.
                    waits(1);

                    runs(function () {
                        checkPercentageNear(colorEditor.$hueSelector.css("bottom"), 25);
                        checkPercentageNear(colorEditor.$opacitySelector.css("bottom"), 50);
                        checkPercentageNear(colorEditor.$selectionBase.css("left"), 74);
                        checkPercentageNear(colorEditor.$selectionBase.css("bottom"), 47);
                    });
                });
    
                it("should call the callback when a new color is committed", function () {
                    var lastColor;
                    makeUI("rgba(100, 100, 100, 0.5)", function (color) {
                        lastColor = color;
                    });
                    colorEditor.setColorFromString("#a0a0a0");
                    expect(lastColor).toBe("#a0a0a0");
                });
                
            });
            
            describe("conversions", function () {
                
                /**
                 * Test whether converting the given color to the given mode results in the expected color.
                 * @param {string} initialColor The color to convert.
                 * @param {string} mode The mode to convert to: most be "rgba", "hsla", or "hex".
                 * @param {string} result The expected result of the conversion.
                 */
                function testConvert(initialColor, mode, result) {
                    makeUI(initialColor);
                    var buttonMap = {
                        "rgba": "$rgbaButton",
                        "hsla": "$hslButton",
                        "hex": "$hexButton"
                    };
                    colorEditor[buttonMap[mode]].trigger("click");
                    expect(colorEditor.getColor().toString()).toBe(result);
                }
                
                it("should convert a hex color to rgb when mode button clicked", function () {
                    testConvert("#112233", "rgba", "rgb(17, 34, 51)");
                });
                it("should convert a hex color to hsl when mode button clicked", function () {
                    testConvert("#112233", "hsla", "hsl(210, 50%, 13%)");
                });
                it("should convert an rgb color to hex when mode button clicked", function () {
                    testConvert("rgb(15, 160, 21)", "hex", "#0fa015");
                });
                it("should convert an rgba color to hex (dropping alpha) when mode button clicked", function () {
                    testConvert("rgba(15, 160, 21, 0.5)", "hex", "#0fa015");
                });
                it("should convert an rgb color to hsl when mode button clicked", function () {
                    testConvert("rgb(15, 160, 21)", "hsla", "hsl(122, 83%, 34%)");
                });
                it("should convert an rgba color to hsla when mode button clicked", function () {
                    testConvert("rgba(15, 160, 21, 0.3)", "hsla", "hsla(122, 83%, 34%, 0.3)");
                });
                it("should convert an hsl color to hex when mode button clicked", function () {
                    testConvert("hsl(152, 12%, 22%)", "hex", "#313f39");
                });
                it("should convert an hsla color to hex (dropping alpha) when mode button clicked", function () {
                    testConvert("hsla(152, 12%, 22%, 0.7)", "hex", "#313f39");
                });
                it("should convert an hsl color to rgb when mode button clicked", function () {
                    testConvert("hsl(152, 12%, 22%)", "rgba", "rgb(49, 63, 57)");
                });
                it("should convert an hsla color to rgba when mode button clicked", function () {
                    testConvert("hsla(152, 12%, 22%, 0.7)", "rgba", "rgba(49, 63, 57, 0.7)");
                });
                
            });
            
            describe("parameter editing with mouse", function () {
                
                /**
                 * Test a mouse down event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     item: The (string) name of the member of ColorEditor that references the element to test.
                 *     clickAt: An [x, y] array specifying the simulated x/y mouse position as a fraction of the
                 *          item's width/height. For example, [0.5, 0.5] would specify a click exactly in the
                 *          center of the element.
                 *     param: The (string) parameter whose value we're testing (h, s, v, or a).
                 *     expected: The expected value for the parameter.
                 *     tolerance: The tolerance in variation for the expected value.
                 */
                function testMousedown(opts) {
                    makeUI("#0000ff");
                    eventAtRatio("mousedown", colorEditor[opts.item], opts.clickAt);
                    checkNear(tinycolor(colorEditor.getColor()).toHsv()[opts.param], opts.expected, opts.tolerance);
                    colorEditor[opts.item].trigger("mouseup");  // clean up drag state
                }

                /**
                 * Test a drag event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     item: The (string) name of the member of ColorEditor that references the element to test.
                 *     clickAt: An [x, y] array specifying the simulated x/y mouse position for the initial mouse down
                 *          as a fraction of the item's width/height. For example, [0.5, 0.5] would specify a click 
                 *          exactly in the center of the element.
                 *     dragTo: An [x, y] array specifying the location to drag to, using the same convention as clickAt.
                 *     param: The (string) parameter whose value we're testing (h, s, v, or a).
                 *     expected: The expected value for the parameter.
                 *     tolerance: The tolerance in variation for the expected value.
                 */
                function testDrag(opts) {
                    makeUI("#0000ff");
                    eventAtRatio("mousedown", colorEditor[opts.item], opts.clickAt);
                    eventAtRatio("mousemove", colorEditor[opts.item], opts.dragTo);
                    checkNear(tinycolor(colorEditor.getColor()).toHsv()[opts.param], opts.expected, opts.tolerance);
                    colorEditor[opts.item].trigger("mouseup");  // clean up drag state
                }
                
                it("should set saturation on mousedown", function () {
                    testMousedown({
                        item:      "$selection",
                        clickAt:   [0.25, 0], // x: saturation, y: 1.0 - value
                        param:     "s",
                        expected:  0.25,
                        tolerance: 0.1
                    });
                });
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
                it("should clip saturation to min value", function () {
                    testDrag({
                        item:      "$selection",
                        clickAt:   [0.25, 0], // x: saturation, y: 1.0 - value
                        dragTo:    [-0.25, 0],
                        param:     "s",
                        expected:  0,
                        tolerance: 0.1
                    });
                });
                it("should clip saturation to max value", function () {
                    testDrag({
                        item:      "$selection",
                        clickAt:   [0.25, 0], // x: saturation, y: 1.0 - value
                        dragTo:    [1.25, 0],
                        param:     "s",
                        expected:  1,
                        tolerance: 0.1
                    });
                });
                it("should set value on mousedown", function () {
                    testMousedown({
                        item:      "$selection",
                        clickAt:   [1.0, 0.75], // x: saturation, y: 1.0 - value
                        param:     "v",
                        expected:  0.25,
                        tolerance: 0.1
                    });
                });
                it("should set value on drag", function () {
                    testDrag({
                        item:      "$selection",
                        clickAt:   [1.0, 0.75], // x: saturation, y: 1.0 - value
                        dragTo:    [1.0, 0.25],
                        param:     "v",
                        expected:  0.75,
                        tolerance: 0.1
                    });
                });
                it("should clip value to min value", function () {
                    testDrag({
                        item:      "$selection",
                        clickAt:   [1.0, 0.75], // x: saturation, y: 1.0 - value
                        dragTo:    [1.0, 1.25],
                        param:     "v",
                        expected:  0,
                        tolerance: 0.1
                    });
                });
                it("should clip value to max value", function () {
                    testDrag({
                        item:      "$selection",
                        clickAt:   [1.0, 0.75],
                        dragTo:    [1.0, -0.25],
                        param:     "v",
                        expected:  1,
                        tolerance: 0.1
                    });
                });
                it("should set hue on mousedown", function () {
                    testMousedown({
                        item:      "$hueSlider",
                        clickAt:   [0, 0.75], // x: unused, y: 1.0 - (hue / 360)
                        param:     "h",
                        expected:  90,
                        tolerance: 1
                    });
                });
                it("should set hue on drag", function () {
                    testDrag({
                        item:      "$hueSlider",
                        clickAt:   [0, 0.75], // x: unused, y: 1.0 - (hue / 360)
                        dragTo:    [0, 0.25],
                        param:     "h",
                        expected:  270,
                        tolerance: 1
                    });
                });
                it("should clip hue to min value", function () {
                    testDrag({
                        item:      "$hueSlider",
                        clickAt:   [0, 0.75], // x: unused, y: 1.0 - (hue / 360)
                        dragTo:    [0, 1.25],
                        param:     "h",
                        expected:  0,
                        tolerance: 1
                    });
                });
                it("should clip hue to max value", function () {
                    testDrag({
                        item:      "$hueSlider",
                        clickAt:   [0, 0.75], // x: unused, y: 1.0 - (hue / 360)
                        dragTo:    [0, -0.25],
                        param:     "h",
                        expected:  0,
                        tolerance: 1
                    });
                });
                it("should set opacity on mousedown", function () {
                    testMousedown({
                        item:      "$opacitySlider",
                        clickAt:   [0, 0.75], // x: unused, y: 1.0 - opacity
                        param:     "a",
                        expected:  0.25,
                        tolerance: 0.1
                    });
                });
                it("should set opacity on drag", function () {
                    testDrag({
                        item:      "$opacitySlider",
                        clickAt:   [0, 0.75], // x: unused, y: 1.0 - opacity
                        dragTo:    [0, 0.25],
                        param:     "a",
                        expected:  0.75,
                        tolerance: 0.1
                    });
                });
                it("should clip opacity to min value", function () {
                    testDrag({
                        item:      "$opacitySlider",
                        clickAt:   [0, 0.75], // x: unused, y: 1.0 - opacity
                        dragTo:    [0, 1.25],
                        param:     "a",
                        expected:  0,
                        tolerance: 0.1
                    });
                });
                it("should clip opacity to max value", function () {
                    // A increases going up, so a clientY at -0.25 of the item's height corresponds to >100%.
                    testDrag({
                        item:      "$opacitySlider",
                        clickAt:   [0, 0.75], // x: unused, y: 1.0 - opacity
                        dragTo:    [0, -0.25],
                        param:     "a",
                        expected:  1,
                        tolerance: 0.1
                    });
                });
                
            });
            
            describe("parameter editing with keyboard", function () {
                
                function makeKeyEvent(opts) {
                    return $.Event("keydown", { keyCode: opts.key, shiftKey: !!opts.shift });
                }

                /**
                 * Test a key event on the given UI element.
                 * @param {object} opts The parameters to test:
                 *     color: An optional initial value to set in the ColorEditor. Defaults to "hsla(50, 25%, 50%, 0.5)".
                 *     item: The (string) name of the member of ColorEditor that references the element to test.
                 *     key: The KeyEvent key code to simulate.
                 *     shift: Optional boolean specifying whether to simulate the shift key being down (default false).
                 *     param: The (string) parameter whose value we're testing (h, s, v, or a).
                 *     delta: The expected change in value for the parameter.
                 *     tolerance: The tolerance in variation for the expected value.
                 *     exact: True to compare the actual values stored in the _hsv object, false (default) to
                 *          compare tinycolor's normalization of the color value.
                 */
                function testKey(opts) {
                    
                    function getParam() {
                        if (opts.exact) {
                            var result = colorEditor._hsv[opts.param];
                            // Because of #2201, this is sometimes a string with a percentage value.
                            if (typeof result === "string" && result.charAt(result.length - 1) === "%") {
                                result = Number(result.substr(0, result.length - 1));
                            }
                            return result;
                        } else {
                            return tinycolor(colorEditor.getColor()).toHsv()[opts.param];
                        }
                    }
                    
                    makeUI(opts.color || "hsla(50, 25%, 50%, 0.5)");

                    var orig = getParam();
                    colorEditor[opts.item].trigger(makeKeyEvent(opts));
                    
                    var final = getParam();
                    checkNear(final, orig + opts.delta, opts.tolerance);
                }
                
                /**
                 * Test whether the given event's default is or isn't prevented on a given key.
                 * @param {object} opts The parameters to test:
                 *     color: An optional initial value to set in the ColorEditor. Defaults to "hsla(50, 25%, 50%, 0.5)".
                 *     item: The (string) name of the member of ColorEditor that references the element to test.
                 *     selection: An optional array ([start, end]) specifying the selection to set in the given element.
                 *     key: The KeyEvent key code to simulate.
                 *     shift: Optional boolean specifying whether to simulate the shift key being down (default false).
                 *     expected: Whether the default is expected to be prevented.
                 */
                function testPreventDefault(opts) {
                    var event, $item;
                    
                    // The color picker needs to be displayed for this test; otherwise the
                    // selection won't be properly set, because you can only set the selection
                    // when the text field has focus.
                    makeUI(opts.color || "hsla(50, 25%, 50%, 0.5)", function () { }, defaultSwatches, false);
                    
                    $item = colorEditor[opts.item];
                    $item.focus();
                    if (opts.selection) {
                        $item[0].setSelectionRange(opts.selection[0], opts.selection[1]);
                    }
                    
                    event = makeKeyEvent(opts);
                    $item.trigger(event);
                    expect(event.isDefaultPrevented()).toBe(opts.expected);
                }
                
                it("should increase saturation by 1.5% on right arrow", function () {
                    testKey({
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        param:     "s",
                        delta:     0.015,
                        tolerance: 0.01
                    });
                });
                it("should clip max saturation on right arrow", function () {
                    testKey({
                        color:     "hsla(50, 100%, 50%, 0.5)",
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        param:     "s",
                        delta:     0,
                        tolerance: 0.01
                    });
                });
                it("should increase saturation by 7.5% on shift right arrow", function () {
                    testKey({
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        shift:     true,
                        param:     "s",
                        delta:     0.075,
                        tolerance: 0.01
                    });
                });
                it("should clip max saturation on shift right arrow", function () {
                    testKey({
                        color:     "hsla(50, 100%, 50%, 0.5)",
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        shift:     true,
                        param:     "s",
                        delta:     0,
                        tolerance: 0.01
                    });
                });
                it("should decrease saturation by 1.5% on left arrow", function () {
                    testKey({
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_LEFT,
                        param:     "s",
                        delta:     -0.015,
                        tolerance: 0.01
                    });
                });
                it("should clip min saturation on left arrow", function () {
                    testKey({
                        color:     "hsla(50, 0%, 50%, 0.5)",
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_LEFT,
                        param:     "s",
                        delta:     0,
                        tolerance: 0.01
                    });
                });
                it("should decrease saturation by 7.5% on shift left arrow", function () {
                    testKey({
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_LEFT,
                        shift:     true,
                        param:     "s",
                        delta:     -0.075,
                        tolerance: 0.01
                    });
                });
                it("should clip min saturation on shift left arrow", function () {
                    testKey({
                        color:     "hsla(50, 0%, 50%, 0.5)",
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_LEFT,
                        shift:     true,
                        param:     "s",
                        delta:     0,
                        tolerance: 0.01
                    });
                });
                it("should increase value by 1.5% on up arrow", function () {
                    testKey({
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_UP,
                        param:     "v",
                        delta:     0.015,
                        tolerance: 0.01
                    });
                });
                it("should clip max value on up arrow", function () {
                    testKey({
                        color:     "hsla(50, 25%, 100%, 0.5)",
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_UP,
                        param:     "v",
                        delta:     0,
                        tolerance: 0.01
                    });
                });
                it("should increase value by 7.5% on shift up arrow", function () {
                    testKey({
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        param:     "v",
                        delta:     0.075,
                        tolerance: 0.01
                    });
                });
                it("should clip max value on shift up arrow", function () {
                    testKey({
                        color:     "hsla(50, 25%, 100%, 0.5)",
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        param:     "v",
                        delta:     0,
                        tolerance: 0.01
                    });
                });
                it("should decrease value by 1.5% on down arrow", function () {
                    testKey({
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_DOWN,
                        param:     "v",
                        delta:     -0.015,
                        tolerance: 0.01
                    });
                });
                it("should clip min value on down arrow", function () {
                    testKey({
                        color:     "hsla(50, 25%, 0%, 0.5)",
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_DOWN,
                        param:     "v",
                        delta:     0,
                        tolerance: 0.01
                    });
                });
                it("should decrease value by 7.5% on shift down arrow", function () {
                    testKey({
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_DOWN,
                        shift:     true,
                        param:     "v",
                        delta:     -0.075,
                        tolerance: 0.01
                    });
                });
                it("should clip min value on shift down arrow", function () {
                    testKey({
                        color:     "hsla(50, 25%, 0%, 0.5)",
                        item:      "$selectionBase",
                        key:       KeyEvent.DOM_VK_DOWN,
                        shift:     true,
                        param:     "v",
                        delta:     0,
                        tolerance: 0.01
                    });
                });
                it("should increase hue by 3.6 on up arrow", function () {
                    testKey({
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_UP,
                        param:     "h",
                        delta:     3.6,
                        tolerance: 1
                    });
                });
                it("should wrap around max hue on up arrow", function () {
                    testKey({
                        color:     "hsla(359, 25%, 50%, 0.5)",
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_UP,
                        param:     "h",
                        delta:     -359 + 3.6,
                        tolerance: 1
                    });
                });
                it("should increase hue by 18 on shift up arrow", function () {
                    testKey({
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        param:     "h",
                        delta:     18,
                        tolerance: 1
                    });
                });
                it("should wrap around max hue on shift up arrow", function () {
                    testKey({
                        color:     "hsla(359, 25%, 50%, 0.5)",
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        param:     "h",
                        delta:     -359 + 18,
                        tolerance: 1
                    });
                });
                it("should decrease hue by 3.6 on down arrow", function () {
                    testKey({
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_DOWN,
                        param:     "h",
                        delta:     -3.6,
                        tolerance: 1
                    });
                });
                it("should wrap around min hue on down arrow", function () {
                    testKey({
                        color:     "hsla(0, 25%, 50%, 0.5)",
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_DOWN,
                        param:     "h",
                        delta:     360 - 3.6,
                        tolerance: 1
                    });
                });
                it("should decrease hue by 18 on shift down arrow", function () {
                    testKey({
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_DOWN,
                        shift:     true,
                        param:     "h",
                        delta:     -18,
                        tolerance: 1
                    });
                });
                it("should wrap around min hue on shift down arrow", function () {
                    testKey({
                        color:     "hsla(0, 25%, 50%, 0.5)",
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_DOWN,
                        shift:     true,
                        param:     "h",
                        delta:     360 - 18,
                        tolerance: 1
                    });
                });
                it("should increase opacity by 0.01 on up arrow", function () {
                    testKey({
                        item:      "$opacitySelector",
                        key:       KeyEvent.DOM_VK_UP,
                        param:     "a",
                        delta:     0.01,
                        tolerance: 0.005
                    });
                });
                it("should clip max opacity on up arrow", function () {
                    testKey({
                        color:     "hsla(90, 25%, 50%, 1.0)",
                        item:      "$opacitySelector",
                        key:       KeyEvent.DOM_VK_UP,
                        param:     "a",
                        delta:     0,
                        tolerance: 0.005
                    });
                });
                it("should increase opacity by 0.05 on shift up arrow", function () {
                    testKey({
                        item:      "$opacitySelector",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        param:     "a",
                        delta:     0.05,
                        tolerance: 0.005
                    });
                });
                it("should clip max opacity on shift up arrow", function () {
                    testKey({
                        color:     "hsla(90, 25%, 50%, 1.0)",
                        item:      "$opacitySelector",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        param:     "a",
                        delta:     0,
                        tolerance: 0.005
                    });
                });
                it("should decrease opacity by 0.01 on down arrow", function () {
                    testKey({
                        item:      "$opacitySelector",
                        key:       KeyEvent.DOM_VK_DOWN,
                        param:     "a",
                        delta:     -0.01,
                        tolerance: 0.005
                    });
                });
                it("should clip min opacity on down arrow", function () {
                    testKey({
                        color:     "hsla(90, 25%, 50%, 0)",
                        item:      "$opacitySelector",
                        key:       KeyEvent.DOM_VK_DOWN,
                        param:     "a",
                        delta:     0,
                        tolerance: 0.005
                    });
                });
                it("should decrease opacity by 0.05 on shift down arrow", function () {
                    testKey({
                        item:      "$opacitySelector",
                        key:       KeyEvent.DOM_VK_DOWN,
                        shift:     true,
                        param:     "a",
                        delta:     -0.05,
                        tolerance: 0.005
                    });
                });
                it("should clip min opacity on shift down arrow", function () {
                    testKey({
                        color:     "hsla(90, 25%, 50%, 0)",
                        item:      "$opacitySelector",
                        key:       KeyEvent.DOM_VK_DOWN,
                        shift:     true,
                        param:     "a",
                        delta:     0,
                        tolerance: 0.005
                    });
                });
                
                // For #2138
                it("should increase hue by 18 on shift up arrow even if saturation is 0", function () {
                    testKey({
                        color:     "hsl(180, 0, 0)",
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        param:     "h",
                        delta:     18,
                        tolerance: 1,
                        exact:     true
                    });
                });
                it("should increase hue by 18 on shift up arrow for a near-gray hex color", function () {
                    testKey({
                        color:     "#5c5b56",
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        param:     "h",
                        delta:     18,
                        tolerance: 1,
                        exact:     true
                    });
                });
                it("should not change value when hue changes", function () {
                    testKey({
                        color:     "#8e8247",
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_UP,
                        shift:     true,
                        param:     "v",
                        delta:     0,
                        tolerance: 0.01,
                        exact:     true
                    });
                });
                
                // For #2193 and #2229
                it("should prevent default on the key event for an unhandled arrow key on non-text-field", function () {
                    testPreventDefault({
                        color:     "#8e8247",
                        item:      "$hueBase",
                        key:       KeyEvent.DOM_VK_RIGHT,
                        expected:  true
                    });
                });
                it("should prevent default on left arrow at the start of the text field", function () {
                    testPreventDefault({
                        color:     "#8e8247",
                        item:      "$colorValue",
                        selection: [0, 0],
                        key:       KeyEvent.DOM_VK_LEFT,
                        expected:  true
                    });
                });
                it("should not prevent default on left arrow in the middle of the text field", function () {
                    testPreventDefault({
                        color:     "#8e8247",
                        item:      "$colorValue",
                        selection: [3, 3],
                        key:       KeyEvent.DOM_VK_LEFT,
                        expected:  false
                    });
                });
                it("should not prevent default on left arrow at the end of the text field", function () {
                    testPreventDefault({
                        color:     "#8e8247",
                        item:      "$colorValue",
                        selection: [7, 7],
                        key:       KeyEvent.DOM_VK_LEFT,
                        expected:  false
                    });
                });
                it("should not prevent default on left arrow with a range selection", function () {
                    testPreventDefault({
                        color:     "#8e8247",
                        item:      "$colorValue",
                        selection: [0, 7],
                        key:       KeyEvent.DOM_VK_LEFT,
                        expected:  false
                    });
                });
                it("should not prevent default on right arrow at the start of the text field", function () {
                    testPreventDefault({
                        color:     "#8e8247",
                        item:      "$colorValue",
                        selection: [0, 0],
                        key:       KeyEvent.DOM_VK_RIGHT,
                        expected:  false
                    });
                });
                it("should not prevent default on right arrow in the middle of the text field", function () {
                    testPreventDefault({
                        color:     "#8e8247",
                        item:      "$colorValue",
                        selection: [3, 3],
                        key:       KeyEvent.DOM_VK_RIGHT,
                        expected:  false
                    });
                });
                it("should prevent default on right arrow at the end of the text field", function () {
                    testPreventDefault({
                        color:     "#8e8247",
                        item:      "$colorValue",
                        selection: [7, 7],
                        key:       KeyEvent.DOM_VK_RIGHT,
                        expected:  true
                    });
                });
                it("should not prevent default on right arrow with a range selection", function () {
                    testPreventDefault({
                        color:     "#8e8247",
                        item:      "$colorValue",
                        selection: [0, 7],
                        key:       KeyEvent.DOM_VK_RIGHT,
                        expected:  false
                    });
                });

            });
            
            describe("color swatches and original color", function () {
                
                it("should restore to original color when clicked on", function () {
                    makeUI("#abcdef");
                    colorEditor.setColorFromString("#0000ff");
                    colorEditor.$originalColor.trigger("click");
                    expect(tinycolor(colorEditor.getColor()).toHexString()).toBe("#abcdef");
                });
                
                it("should create swatches", function () {
                    makeUI("#abcdef");
                    expect($(".swatch").length).toBe(2);
                });
                
                it("should set color to a swatch when clicked on", function () {
                    makeUI("#fedcba");
                    $($(".swatch")[0]).trigger("click");
                    expect(tinycolor(colorEditor.getColor()).toHexString()).toBe("#abcdef");
                });
                
            });
            
            describe("input text field syncing", function () {
                
                it("should commit valid changes made in the input field on the input event", function () {
                    makeUI("#abcdef");
                    colorEditor.$colorValue.val("#fedcba");
                    colorEditor.$colorValue.trigger("input");
                    expect(tinycolor(colorEditor.getColor()).toHexString()).toBe("#fedcba");
                });
                it("should commit valid changes made in the input field on the change event", function () {
                    makeUI("#abcdef");
                    colorEditor.$colorValue.val("#fedcba");
                    colorEditor.$colorValue.trigger("change");
                    expect(tinycolor(colorEditor.getColor()).toHexString()).toBe("#fedcba");
                });
                it("should not commit changes on the input event while the value is invalid, but should keep them in the text field", function () {
                    makeUI("#abcdef");
                    colorEditor.$colorValue.val("rgb(0, 0, 0");
                    colorEditor.$colorValue.trigger("input");
                    expect(tinycolor(colorEditor.getColor()).toHexString()).toBe("#abcdef");
                    expect(colorEditor.$colorValue.val()).toBe("rgb(0, 0, 0");
                });
                it("should revert to the previous value on the change event while the value is invalid", function () {
                    makeUI("#abcdef");
                    colorEditor.$colorValue.val("rgb(0, 0, 0");
                    colorEditor.$colorValue.trigger("change");
                    expect(tinycolor(colorEditor.getColor()).toHexString()).toBe("#abcdef");
                    expect(colorEditor.$colorValue.val()).toBe("#abcdef");
                });
                
                it("should convert percentage RGB values to normal values", function () {
                    makeUI("#abcdef");
                    expect(colorEditor._convertToNormalRGB("rgb(25%, 50%, 75%)")).toBe("rgb(64, 128, 191)");
                });
                it("should normalize a string to match tinycolor's format", function () {
                    makeUI("#abcdef");
                    expect(colorEditor._normalizeColorString("rgb(25%,50%,75%)")).toBe("rgb(64, 128, 191)");
                    expect(colorEditor._normalizeColorString("rgb(10,20,   30)")).toBe("rgb(10, 20, 30)");
                });
            });
            
            describe("undo/redo", function () {
                
                function triggerCtrlKey($element, key, shift) {
                    var ctrlKeyProperty = (brackets.platform === "win" ? "ctrlKey" : "metaKey"),
                        eventProps = {keyCode: key, shiftKey: shift};
                    eventProps[ctrlKeyProperty] = true;
                    $element.trigger($.Event("keydown", eventProps));
                }
                
                it("should undo when Ctrl-Z is pressed on a focused element in the color editor", function () {
                    makeUI("#abcdef");
                    runs(function () {
                        colorEditor.setColorFromString("#a0a0a0");
                        colorEditor.$hueBase.focus();
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("#abcdef");
                    });
                });

                it("should redo when Ctrl-Shift-Z is pressed on a focused element in the color editor", function () {
                    makeUI("#abcdef");
                    runs(function () {
                        colorEditor._commitColor("#a0a0a0", true);
                        colorEditor.$hueBase.focus();
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Z);
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Z, true);
                        expect(getColorString()).toBe("#a0a0a0");
                    });
                });
                
                it("should redo when Ctrl-Y is pressed on a focused element in the color editor", function () {
                    makeUI("#abcdef");
                    runs(function () {
                        colorEditor._commitColor("#a0a0a0", true);
                        colorEditor.$hueBase.focus();
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Z);
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Y);
                        expect(getColorString()).toBe("#a0a0a0");
                    });
                });
                
                it("should redo when Ctrl-Y is pressed after two Ctrl-Zs (only one Ctrl-Z should take effect)", function () {
                    makeUI("#abcdef");
                    runs(function () {
                        colorEditor._commitColor("#a0a0a0", true);
                        colorEditor.$hueBase.focus();
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Z);
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Z);
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Y);
                        expect(getColorString()).toBe("#a0a0a0");
                    });
                });

                it("should undo when Ctrl-Z is pressed after two Ctrl-Ys (only one Ctrl-Y should take effect)", function () {
                    makeUI("#abcdef");
                    runs(function () {
                        colorEditor._commitColor("#a0a0a0", true);
                        colorEditor.$hueBase.focus();
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Z);
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Y);
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Y);
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("#abcdef");
                    });
                });

                it("should undo an rgba conversion", function () {
                    makeUI("#abcdef");
                    runs(function () {
                        colorEditor.$rgbaButton.click();
                        triggerCtrlKey(colorEditor.$rgbaButton, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("#abcdef");
                    });
                });
                it("should undo an hsla conversion", function () {
                    makeUI("#abcdef");
                    runs(function () {
                        colorEditor.$hslButton.click();
                        triggerCtrlKey(colorEditor.$hslButton, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("#abcdef");
                    });
                });
                it("should undo a hex conversion", function () {
                    makeUI("rgba(12, 32, 65, 0.2)");
                    runs(function () {
                        colorEditor.$hexButton.trigger("click");
                        triggerCtrlKey(colorEditor.$hexButton, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("rgba(12, 32, 65, 0.2)");
                    });
                });

                it("should undo a saturation/value change", function () {
                    makeUI("rgba(100, 150, 200, 0.3)");
                    runs(function () {
                        eventAtRatio("mousedown", colorEditor.$selectionBase, [0.5, 0.5]);
                        triggerCtrlKey(colorEditor.$selectionBase, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("rgba(100, 150, 200, 0.3)");
                        colorEditor.$selectionBase.trigger("mouseup");  // clean up drag state
                    });
                });
                it("should undo a hue change", function () {
                    makeUI("rgba(100, 150, 200, 0.3)");
                    runs(function () {
                        eventAtRatio("mousedown", colorEditor.$hueBase, [0, 0.5]);
                        triggerCtrlKey(colorEditor.$hueBase, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("rgba(100, 150, 200, 0.3)");
                        colorEditor.$hueBase.trigger("mouseup");  // clean up drag state
                    });
                });
                it("should undo an opacity change", function () {
                    makeUI("rgba(100, 150, 200, 0.3)");
                    runs(function () {
                        eventAtRatio("mousedown", colorEditor.$opacitySelector, [0, 0.5]);
                        triggerCtrlKey(colorEditor.$opacitySelector, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("rgba(100, 150, 200, 0.3)");
                        colorEditor.$opacitySelector.trigger("mouseup");  // clean up drag state
                    });
                });
                
                it("should undo a text field change", function () {
                    makeUI("rgba(100, 150, 200, 0.3)");
                    runs(function () {
                        colorEditor.$colorValue.val("rgba(50, 50, 50, 0.9)");
                        triggerCtrlKey(colorEditor.$colorValue, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("rgba(100, 150, 200, 0.3)");
                    });
                });
                it("should undo a swatch click", function () {
                    makeUI("rgba(100, 150, 200, 0.3)");
                    runs(function () {
                        var $swatch = $(colorEditor.$swatches.find("li")[0]);
                        $swatch.trigger("click");
                        triggerCtrlKey($swatch, KeyEvent.DOM_VK_Z);
                        expect(getColorString()).toBe("rgba(100, 150, 200, 0.3)");
                    });
                });

            });
        });
    });
});