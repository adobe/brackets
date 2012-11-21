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
/*global define, describe, it, xit, expect, beforeEach, afterEach, waits, waitsFor, runs, $, brackets, waitsForDone, spyOn, Mustache, tinycolor, KeyEvent */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils   = brackets.getModule("spec/SpecRunnerUtils"),
        Editor            = brackets.getModule("editor/Editor").Editor,
        DocumentManager   = brackets.getModule("document/DocumentManager"),
        Strings           = brackets.getModule("strings"),
        KeyEvent          = brackets.getModule("utils/KeyEvent"),
        testContent       = require("text!unittests.css"),
        provider          = require("main").inlineColorEditorProvider,
        InlineColorEditor = require("InlineColorEditor").InlineColorEditor,
        ColorEditor       = require("ColorEditor").ColorEditor,
        InlineEditorTemplate = require("text!InlineColorEditorTemplate.html");

    require("thirdparty/tinycolor-min");

    describe("Inline Color Editor - unit", function () {

        var testDocument, testEditor;
        
        function makeColorEditor(cursor) {
            var result = new $.Deferred(),
                editorPromise,
                inline;
            runs(function () {
                editorPromise = provider(testEditor, cursor);
                if (editorPromise) {
                    editorPromise.done(function (result) {
                        result.onAdded();
                        inline = result;
                    });
                    waitsForDone(editorPromise, "open color editor");
                } else {
                    result.reject();
                }
            });
            runs(function () {
                result.resolve(inline);
            });
            return result;
        }
        
        function testOpenColor(cursor, color) {
            makeColorEditor(cursor).done(function (inline) {
                expect(inline).toBeTruthy();
                expect(inline.color).toBe(color);
            });
        }
        
        beforeEach(function () {
            var mock = SpecRunnerUtils.createMockEditor(testContent, "css");
            testDocument = mock.doc;
            testEditor = mock.editor;
        });
        
        afterEach(function () {
            SpecRunnerUtils.destroyMockEditor(testDocument);
            testEditor = null;
            testDocument = null;
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
            
            it("should not open when not on a color", function () {
                makeColorEditor({line: 1, ch: 6}).done(function (inline) {
                    expect(inline).toBeNull();
                });
            });
            it("should not open when on an invalid color", function () {
                makeColorEditor({line: 25, ch: 18}).done(function (inline) {
                    expect(inline).toBeNull();
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
                runs(function () {
                    makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                        expect(testDocument.addRef).toHaveBeenCalled();
                        expect(testDocument.addRef.callCount).toBe(1);
                        
                        inline.onClosed();
                        expect(testDocument.releaseRef).toHaveBeenCalled();
                        expect(testDocument.releaseRef.callCount).toBe(1);
                    });
                });
            });
            
        });
        
        describe("update host document on edit in color editor", function () {
            
            it("should update host document when change is committed in color editor", function () {
                makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                    inline.colorEditor.commitColor("#c0c0c0", false);
                    expect(testDocument.getRange({line: 1, ch: 16}, {line: 1, ch: 23})).toBe("#c0c0c0");
                });
            });
            
            it("should update correct range of host document with color format of different length", function () {
                makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                    inline.colorEditor.commitColor("rgb(20, 20, 20)", false);
                    expect(testDocument.getRange({line: 1, ch: 16}, {line: 1, ch: 31})).toBe("rgb(20, 20, 20)");
                });
            });

            it("should not invalidate range when change is committed", function () {
                makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                    inline.colorEditor.commitColor("rgb(20, 20, 20)", false);
                    expect(inline.getCurrentRange()).not.toBeNull();
                });
            });

        });
        
        describe("update color editor on edit in host editor", function () {
            
            it("should update when edit is made to color range in host editor", function () {
                makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                    spyOn(inline, "close");
    
                    testDocument.replaceRange("0", {line: 1, ch: 18}, {line: 1, ch: 19});
                    expect(inline.color).toBe("#a0cdef");
                    expect(inline.colorEditor.color.toHexString().toLowerCase()).toBe("#a0cdef");
                    expect(inline.close).not.toHaveBeenCalled();
                    expect(inline.getCurrentRange()).toEqual({start: {line: 1, ch: 16}, end: {line: 1, ch: 23}});
                });
            });
            
            it("should close itself if edit is made that destroys end bookmark and leaves color invalid", function () {
                makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                    spyOn(inline, "close");
                    
                    // Replace everything including the semicolon, so it crosses the bookmark boundary.
                    testDocument.replaceRange("rgb(255, 25", {line: 1, ch: 16}, {line: 1, ch: 24});
                    expect(inline.close).toHaveBeenCalled();
                });
            });
            
            it("should maintain the range if the user deletes the last character of the color and types a new one", function () {
                makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                    spyOn(inline, "close");
    
                    testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 23});
                    testDocument.replaceRange("0", {line: 1, ch: 22}, {line: 1, ch: 22});
                    expect(inline.color).toBe("#abcde0");
                    expect(inline.close).not.toHaveBeenCalled();
                    expect(inline.getCurrentRange()).toEqual({start: {line: 1, ch: 16}, end: {line: 1, ch: 23}});
                });
            });
            
            it("should not update the end bookmark to a shorter valid match if the bookmark still exists and the color becomes invalid", function () {
                makeColorEditor({line: 1, ch: 18}).done(function (inline) {
                    testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 23});
                    expect(inline.color).toBe("#abcde");
                    expect(inline.getCurrentRange()).toEqual({start: {line: 1, ch: 16}, end: {line: 1, ch: 22}});
                });
            });
            
            // The following test fails because if the end bookmark is deleted, we match the shorter
            // #xxx string at the beginning of the color and assume that's valid, and then reset the bookmark
            // to the end of that location. Filed as #2166.
//            it("should not update the end bookmark to a shorter valid match if the bookmark no longer exists and the color becomes invalid", function () {
//                makeColorEditor({line: 1, ch: 18}).done(function (inline) {
//                    testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 24});
//                    expect(inline.color).toBe("#abcde");
//                    expect(inline.getCurrentRange()).toEqual({start: {line: 1, ch: 16}, end: {line: 1, ch: 22}});
//                });
//            });
            
        });
        
        describe("used colors", function () {
            
            it("should trim the original array to the given length", function () {
                var inline = new InlineColorEditor();
                var result = inline.usedColors(["#abcdef", "#fedcba", "#aabbcc", "#bbccdd"], 2);
                expect(result).toEqual([
                    {value: "#abcdef", count: 1},
                    {value: "#fedcba", count: 1}
                ]);
            });
            
            it("should remove duplicates from the original array and sort it by usage", function () {
                var inline = new InlineColorEditor();
                var result = inline.usedColors(["#abcdef", "#fedcba", "#123456", "#FEDCBA", "#123456", "#123456", "rgb(100, 100, 100)"], 100);
                expect(result).toEqual([
                    {value: "#123456", count: 3},
                    {value: "#fedcba", count: 2},
                    {value: "#abcdef", count: 1},
                    {value: "rgb(100, 100, 100)", count: 1}
                ]);
            });
        });
        
        describe("color editor UI", function () {
            var $container,
                colorEditor,
                defaultSwatches = [{value: "#abcdef", count: 3}, {value: "rgba(100, 200, 250, 0.5)", count: 2}];
            
            function makeUI(initialColor, callback, swatches) {
                $container = $(Mustache.render(InlineEditorTemplate, Strings));
                colorEditor = new ColorEditor($container,
                                              initialColor,
                                              callback || function () { },
                                              swatches || defaultSwatches);
                $(document.body).append($container);
            }
            
            afterEach(function () {
                $container.remove();
            });
            
            function checkNear(val1, val2, tolerance) {
                expect(Math.abs(Number(val1) - Number(val2)) < (tolerance || 1.0)).toBe(true);
            }
            function checkPercentageNear(pct, val) {
                expect(checkNear(pct.substr(0, pct.length - 1), val));
            }
            
            describe("simple load/commit", function () {
            
                it("should load the initial color correctly", function () {
                    var colorStr = "rgba(77, 122, 31, 0.5)";
                    makeUI(colorStr);
                    expect(colorEditor.getColor().toString()).toBe(colorStr);
                    expect(colorEditor.$colorValue.attr("value")).toBe(colorStr);
                    expect(tinycolor.equals(colorEditor.$currentColor.css("background-color"), colorStr)).toBe(true);

                    // Not sure why the tolerances need to be larger for these.
                    checkNear(tinycolor(colorEditor.$selection.css("background-color")).toHsv().h, 90, 2.0);
                    checkNear(tinycolor(colorEditor.$hueBase.css("background-color")).toHsv().h, 90, 2.0);

                    expect(tinycolor.equals(colorEditor.$selectionBase.css("background-color"), colorStr)).toBe(true);
                    
                    // Need to do these on a timeout since we can't seem to read back CSS positions synchronously.
                    setTimeout(function () {
                        checkPercentageNear(colorEditor.$hueSelector.css("bottom"), 25);
                        checkPercentageNear(colorEditor.$opacitySelector.css("bottom"), 50);
                        checkPercentageNear(colorEditor.$selectionBase.css("left"), 74);
                        checkPercentageNear(colorEditor.$selectionBase.css("bottom"), 47);
                    }, 0);
                    waits(10);
                });
                
                it("should load a committed color correctly", function () {
                    var colorStr = "rgba(77, 122, 31, 0.5)";
                    makeUI("#0a0a0a");
                    colorEditor.commitColor(colorStr, true);
                    expect(colorEditor.getColor().toString()).toBe(colorStr);
                    expect(colorEditor.$colorValue.attr("value")).toBe(colorStr);
                    expect(tinycolor.equals(colorEditor.$currentColor.css("background-color"), colorStr)).toBe(true);
                    checkNear(tinycolor(colorEditor.$selection.css("background-color")).toHsv().h, tinycolor(colorStr).toHsv().h);
                    checkNear(tinycolor(colorEditor.$hueBase.css("background-color")).toHsv().h, tinycolor(colorStr).toHsv().h);
                    expect(tinycolor.equals(colorEditor.$selectionBase.css("background-color"), colorStr)).toBe(true);
                    
                    // Need to do these on a timeout since we can't seem to read back CSS positions synchronously.
                    setTimeout(function () {
                        checkPercentageNear(colorEditor.$hueSelector.css("bottom"), 25);
                        checkPercentageNear(colorEditor.$opacitySelector.css("bottom"), 50);
                        checkPercentageNear(colorEditor.$selectionBase.css("left"), 74);
                        checkPercentageNear(colorEditor.$selectionBase.css("bottom"), 47);
                    }, 0);
                    waits(10);
                });
    
                it("should call the callback when a new color is committed", function () {
                    var lastColor;
                    makeUI("rgba(100, 100, 100, 0.5)", function (color) {
                        lastColor = color;
                    });
                    colorEditor.commitColor("#a0a0a0", true);
                    expect(lastColor).toBe("#a0a0a0");
                });
                
            });
            
            describe("conversions", function () {
                
                function testConvert(initialColor, mode, result) {
                    makeUI(initialColor);
                    $container.find("." + mode).trigger("click");
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
                
                // Simulate the given event with clientX/clientY specified by the given
                // ratios of the item's actual width/height (offset by the left/top of the
                // item).
                function eventAtRatio(event, $item, hRatio, vRatio) {
                    $item.trigger($.Event(event, {
                        clientX: $item.offset().left + hRatio * $item.width(),
                        clientY: $item.offset().top + vRatio * $item.height()
                    }));
                }
                
                function testMousedown(itemMember, hRatio, vRatio, param, expectedValue, tolerance) {
                    makeUI("#0000ff");
                    eventAtRatio("mousedown", colorEditor[itemMember], hRatio, vRatio);
                    checkNear(tinycolor(colorEditor.color).toHsv()[param], expectedValue, tolerance);
                    colorEditor.$selection.trigger("mouseup");
                }

                // The hRatio1/vRatio1 are for setting up the pre-drag conditions. The expected value
                // should be related to the hRatio2 or vRatio2.
                function testDrag(itemMember, hRatio1, vRatio1, hRatio2, vRatio2, param, expectedValue, tolerance) {
                    makeUI("#0000ff");
                    eventAtRatio("mousedown", colorEditor[itemMember], hRatio1, vRatio1);
                    eventAtRatio("mousemove", colorEditor[itemMember], hRatio2, vRatio2);
                    checkNear(tinycolor(colorEditor.color).toHsv()[param], expectedValue, tolerance);
                    colorEditor.$selection.trigger("mouseup");
                }
                
                it("should set saturation on mousedown", function () {
                    testMousedown("$selection", 0.25, 0, "s", 0.25, 0.1);
                });
                it("should set saturation on drag", function () {
                    testDrag("$selection", 0.25, 0, 0.75, 0, "s", 0.75, 0.1);
                });
                it("should clip saturation to min value", function () {
                    testDrag("$selection", 0.25, 0, -0.25, 0, "s", 0, 0.1);
                });
                it("should clip saturation to max value", function () {
                    testDrag("$selection", 0.25, 0, 1.25, 0, "s", 1, 0.1);
                });
                it("should set value on mousedown", function () {
                    // V increases going up, so a clientY at 0.75 of the item's height corresponds to 25%.
                    testMousedown("$selection", 1.0, 0.75, "v", 0.25, 0.1);
                });
                it("should set value on drag", function () {
                    // V increases going up, so a clientY at 0.25 of the item's height corresponds to 75%.
                    testDrag("$selection", 1.0, 0.75, 1.0, 0.25, "v", 0.75, 0.1);
                });
                it("should clip value to min value", function () {
                    // V increases going up, so a clientY at 1.25 of the item's height corresponds to <0%.
                    testDrag("$selection", 1.0, 0.75, 1.0, 1.25, "v", 0, 0.1);
                });
                it("should clip value to max value", function () {
                    // V increases going up, so a clientY at -0.25 of the item's height corresponds to >100%.
                    testDrag("$selection", 1.0, 0.75, 1.0, -0.25, "v", 1, 0.1);
                });
                it("should set hue on mousedown", function () {
                    // H increases going up, so a clientY at 0.75 of the item's height corresponds to 90 deg.
                    testMousedown("$hueSlider", 0, 0.75, "h", 90, 1);
                });
                it("should set hue on drag", function () {
                    // H increases going up, so a clientY at 0.25 of the item's height corresponds to 270 deg.
                    testDrag("$hueSlider", 0, 0.75, 0, 0.25, "h", 270, 1);
                });
                it("should clip hue to min value", function () {
                    // H increases going up, so a clientY at 1.25 of the item's height corresponds to <0 deg.
                    testDrag("$hueSlider", 0, 0.75, 0, 1.25, "h", 0, 1);
                });
                it("should clip hue to max value", function () {
                    // H increases going up, so a clientY at -0.25 of the item's height corresponds to >360 deg.
                    // (This gets clipped to 360, which then normalizes to 0.)
                    testDrag("$hueSlider", 0, 0.75, 0, -0.25, "h", 0, 1);
                });
                it("should set opacity on mousedown", function () {
                    // A increases going up, so a clientY at 0.75 of the item's height corresponds to 25%.
                    testMousedown("$opacitySlider", 0, 0.75, "a", 0.25, 0.1);
                });
                it("should set opacity on drag", function () {
                    // A increases going up, so a clientY at 0.25 of the item's height corresponds to 75%.
                    testDrag("$opacitySlider", 0, 0.75, 0, 0.25, "a", 0.75, 0.1);
                });
                it("should clip opacity to min value", function () {
                    // A increases going up, so a clientY at 1.25 of the item's height corresponds to <0%.
                    testDrag("$opacitySlider", 0, 0.75, 0, 1.25, "a", 0, 0.1);
                });
                it("should clip opacity to max value", function () {
                    // A increases going up, so a clientY at -0.25 of the item's height corresponds to >100%.
                    testDrag("$opacitySlider", 0, 0.75, 0, -0.25, "a", 1, 0.1);
                });
                
            });
            
            describe("parameter editing with keyboard", function () {
                
                function testKey(itemMember, key, shift, param, delta, tolerance, initialColor) {
                    makeUI(initialColor || "hsla(50, 25%, 50%, 0.5)");
                    var orig = tinycolor(colorEditor.color).toHsv()[param];
                    colorEditor[itemMember].trigger($.Event("keydown", { keyCode: key, shiftKey: shift }));
                    checkNear(tinycolor(colorEditor.color).toHsv()[param], orig + delta, tolerance);
                }
                
                it("should increase saturation by 1.5% on right arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_RIGHT, false, "s", 0.015, 0.01);
                });
                it("should clip max saturation on right arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_RIGHT, false, "s", 0, 0.01, "hsla(50, 100%, 50%, 0.5)");
                });
                it("should increase saturation by 7.5% on shift right arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_RIGHT, true, "s", 0.075, 0.01);
                });
                it("should clip max saturation on shift right arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_RIGHT, true, "s", 0, 0.01, "hsla(50, 100%, 50%, 0.5)");
                });
                it("should decrease saturation by 1.5% on left arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_LEFT, false, "s", -0.015, 0.01);
                });
                it("should clip min saturation on left arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_LEFT, false, "s", 0, 0.01, "hsla(50, 0%, 50%, 0.5)");
                });
                it("should decrease saturation by 7.5% on shift left arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_LEFT, true, "s", -0.075, 0.01);
                });
                it("should clip min saturation on shift left arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_LEFT, true, "s", 0, 0.01, "hsla(50, 0%, 50%, 0.5)");
                });
                it("should increase value by 1.5% on up arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_UP, false, "v", 0.015, 0.01);
                });
                it("should clip max value on up arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_UP, false, "v", 0, 0.01, "hsla(50, 25%, 100%, 0.5)");
                });
                it("should increase value by 7.5% on shift up arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_UP, true, "v", 0.075, 0.01);
                });
                it("should clip max value on shift up arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_UP, true, "v", 0, 0.01, "hsla(50, 25%, 100%, 0.5)");
                });
                it("should decrease value by 1.5% on down arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_DOWN, false, "v", -0.015, 0.01);
                });
                it("should clip min value on down arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_DOWN, false, "v", 0, 0.01, "hsla(50, 25%, 0%, 0.5)");
                });
                it("should decrease value by 7.5% on shift down arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_DOWN, true, "v", -0.075, 0.01);
                });
                it("should clip min value on shift down arrow", function () {
                    testKey("$selectionBase", KeyEvent.DOM_VK_DOWN, true, "v", 0, 0.01, "hsla(50, 25%, 0%, 0.5)");
                });
                it("should increase hue by 3.6 on up arrow", function () {
                    testKey("$hueBase", KeyEvent.DOM_VK_UP, false, "h", 3.6, 1);
                });
                // TODO: Wraparound cases don't work currently because of #2139
//                it("should wrap around max hue on up arrow", function () {
//                    testKey("$hueBase", KeyEvent.DOM_VK_UP, false, "h", -360 + 3.6, 1, "hsla(360, 25%, 50%, 0.5)");
//                });
                it("should increase hue by 18 on shift up arrow", function () {
                    testKey("$hueBase", KeyEvent.DOM_VK_UP, true, "h", 18, 1);
                });
//                it("should wrap around max hue on shift up arrow", function () {
//                    testKey("$hueBase", KeyEvent.DOM_VK_UP, true, "h", -360 + 18, 1, "hsla(360, 25%, 50%, 0.5)");
//                });
                it("should decrease hue by 3.6 on down arrow", function () {
                    testKey("$hueBase", KeyEvent.DOM_VK_DOWN, false, "h", -3.6, 1);
                });
//                it("should wrap around min hue on down arrow", function () {
//                    testKey("$hueBase", KeyEvent.DOM_VK_DOWN, false, "h", 360 - 3.6, 1, "hsla(0, 25%, 50%, 0.5)");
//                });
                it("should decrease hue by 18 on shift down arrow", function () {
                    testKey("$hueBase", KeyEvent.DOM_VK_DOWN, true, "h", -18, 1);
                });
//                it("should wrap around min hue on shift down arrow", function () {
//                    testKey("$hueBase", KeyEvent.DOM_VK_DOWN, true, "h", 360 - 18, 1, "hsla(0, 25%, 50%, 0.5)");
//                });
                it("should increase opacity by 0.01 on up arrow", function () {
                    testKey("$opacitySelector", KeyEvent.DOM_VK_UP, false, "a", 0.01, 0.005);
                });
                it("should clip max opacity on up arrow", function () {
                    testKey("$opacitySelector", KeyEvent.DOM_VK_UP, false, "a", 0, 0.005, "hsla(90, 25%, 50%, 1.0)");
                });
                it("should increase opacity by 0.05 on shift up arrow", function () {
                    testKey("$opacitySelector", KeyEvent.DOM_VK_UP, true, "a", 0.05, 0.005);
                });
                it("should clip max opacity on shift up arrow", function () {
                    testKey("$opacitySelector", KeyEvent.DOM_VK_UP, true, "a", 0, 0.005, "hsla(90, 25%, 50%, 1.0)");
                });
                it("should decrease opacity by 0.01 on down arrow", function () {
                    testKey("$opacitySelector", KeyEvent.DOM_VK_DOWN, false, "a", -0.01, 0.005);
                });
                it("should clip min opacity on down arrow", function () {
                    testKey("$opacitySelector", KeyEvent.DOM_VK_DOWN, false, "a", 0, 0.005, "hsla(90, 25%, 50%, 0)");
                });
                it("should decrease opacity by 0.05 on shift down arrow", function () {
                    testKey("$opacitySelector", KeyEvent.DOM_VK_DOWN, true, "a", -0.05, 0.005);
                });
                it("should clip min opacity on shift down arrow", function () {
                    testKey("$opacitySelector", KeyEvent.DOM_VK_DOWN, true, "a", 0, 0.005, "hsla(90, 25%, 50%, 0)");
                });
                
            });
            
            describe("color swatches and original color", function () {
                
                it("should restore to original color when clicked on", function () {
                    makeUI("#abcdef");
                    colorEditor.commitColor("#0000ff");
                    colorEditor.$lastColor.trigger("click");
                    expect(tinycolor(colorEditor.color).toHexString()).toBe("#abcdef");
                });
                
                it("should create swatches", function () {
                    makeUI("#abcdef");
                    expect($(".swatch").length).toBe(2);
                });
                
                it("should set color to a swatch when clicked on", function () {
                    makeUI("#fedcba");
                    $($(".swatch")[0]).trigger("click");
                    expect(tinycolor(colorEditor.color).toHexString()).toBe("#abcdef");
                });
                
            });
            
            describe("input text field syncing", function () {
                
                it("should commit valid changes made in the input field on the input event", function () {
                    makeUI("#abcdef");
                    colorEditor.$colorValue.val("#fedcba");
                    colorEditor.$colorValue.trigger("input");
                    expect(tinycolor(colorEditor.color).toHexString()).toBe("#fedcba");
                });
                it("should commit valid changes made in the input field on the change event", function () {
                    makeUI("#abcdef");
                    colorEditor.$colorValue.val("#fedcba");
                    colorEditor.$colorValue.trigger("change");
                    expect(tinycolor(colorEditor.color).toHexString()).toBe("#fedcba");
                });
                it("should not commit changes on the input event while the value is invalid, but should keep them in the text field", function () {
                    makeUI("#abcdef");
                    colorEditor.$colorValue.val("rgb(0, 0, 0");
                    colorEditor.$colorValue.trigger("input");
                    expect(tinycolor(colorEditor.color).toHexString()).toBe("#abcdef");
                    expect(colorEditor.$colorValue.val()).toBe("rgb(0, 0, 0");
                });
                it("should revert to the previous value on the change event while the value is invalid", function () {
                    makeUI("#abcdef");
                    colorEditor.$colorValue.val("rgb(0, 0, 0");
                    colorEditor.$colorValue.trigger("change");
                    expect(tinycolor(colorEditor.color).toHexString()).toBe("#abcdef");
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
        });
    });
});