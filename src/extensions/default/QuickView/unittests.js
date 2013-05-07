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
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
   
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        FileUtils       = brackets.getModule("file/FileUtils");

    describe("Quick View", function () {
        var testFolder = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files/";
        var testWindow, brackets, CommandManager, Commands, EditorManager, QuickView, editor;

        beforeEach(function () {
            // Create a new window that will be shared by ALL tests in this spec.
            if (!testWindow) {
                runs(function () {
                    SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                        testWindow = w;
                        // Load module instances from brackets.test
                        brackets = testWindow.brackets;
                        CommandManager = testWindow.brackets.test.CommandManager;
                        Commands = testWindow.brackets.test.Commands;
                        EditorManager = brackets.test.EditorManager;
                        QuickView = brackets.test.extensions.QuickView;
                    });
                });
                
                runs(function () {
                    SpecRunnerUtils.loadProjectInTestWindow(testFolder);
                });

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["test.css"]), "open test file");
                });

                runs(function () {
                    editor = EditorManager.getCurrentFullEditor();
                });
            }
        });
        
        function getPopoverAtPos(lineNum, columnNum) {
            var cm = editor._codeMirror,
                pos = { line: lineNum, ch: columnNum },
                token;
            
            editor.setCursorPos(pos);
            token = cm.getTokenAt(pos);
            
            return QuickView._queryPreviewProviders(editor, pos, token);
        }
        
        function expectNoPreviewAtPos(line, ch) {
            var popoverInfo = getPopoverAtPos(line, ch);
            expect(popoverInfo).toBeFalsy();
        }
        
        function checkColorAtPos(expectedColor, line, ch) {
            var popoverInfo = getPopoverAtPos(line, ch);
            expect(popoverInfo._previewCSS).toBe(expectedColor);
        }
        
        function checkGradientAtPos(expectedGradient, line, ch) {
            // Just call checkColorAtPos since both have the same function calls.
            checkColorAtPos(expectedGradient, line, ch);
        }
        
        function checkImagePathAtPos(expectedPathEnding, line, ch) {
            var popoverInfo = getPopoverAtPos(line, ch),
                imagePath = popoverInfo._imgPath;
            
            // Just check end of path - local drive location prefix unimportant
            expect(imagePath.substr(imagePath.length - expectedPathEnding.length)).toBe(expectedPathEnding);
        }
        
        describe("Quick view colors", function () {
            it("should show preview of hex colors either in 3 digit hex or or 6-digit hex", function () {
                runs(function () {
                    checkColorAtPos("#369", 3, 12);
                    checkColorAtPos("#2491F5", 4, 13);
                });
            });

            it("should NOT show preview of color on words start with #", function () {
                runs(function () {
                    expectNoPreviewAtPos(7, 7);     // cursor on #invalid_hex
                    expectNoPreviewAtPos(8, 15);    // cursor on #web
                });
            });

            it("should show preview of valid rgb/rgba colors", function () {
                runs(function () {
                    checkColorAtPos("rgb(255,0,0)",           12, 12);  // no whitespace
                    checkColorAtPos("rgb(100%,   0%,   0%)",  13, 17);  // extra whitespace
                    checkColorAtPos("rgb(50%, 75%, 25%)",     14, 24);
                    
                    // rgba with values of 0-255 
                    checkColorAtPos("rgba(255, 0, 0, 0.5)", 15, 23);
                    checkColorAtPos("rgba(255, 0, 0, 1)",   16, 22);
                    checkColorAtPos("rgba(255, 0, 0, .5)",  17, 19);

                    // rgba with percentage values
                    checkColorAtPos("rgba(100%, 0%, 0%, 0.5)",  18, 32);
                    checkColorAtPos("rgba(80%, 50%, 50%, 1)",   20, 33);
                    checkColorAtPos("rgba(50%, 75%, 25%, 1.0)", 21, 23);
                });
            });

            it("should NOT show preview of unsupported rgb/rgba colors", function () {
                runs(function () {
                    expectNoPreviewAtPos(25, 14);    // cursor on rgb(300, 0, 0)
                    expectNoPreviewAtPos(26, 15);    // cursor on rgb(0, 95.5, 0)
                    expectNoPreviewAtPos(27, 15);    // cursor on rgba(-0, 0, 0, 0.5)
                });
            });

            it("should show preview of valid hsl/hsla colors", function () {
                runs(function () {
                    checkColorAtPos("hsl(0, 100%, 50%)",       31, 22);
                    checkColorAtPos("hsla(0, 100%, 50%, 0.5)", 32, 23);
                    checkColorAtPos("hsla(0, 100%, 50%, .5)",  33, 23);
                    checkColorAtPos("hsl(390, 100%, 50%)",     34, 24);
                });
            });

            it("should NOT show preview of unsupported hsl/hsla colors", function () {
                runs(function () {
                    expectNoPreviewAtPos(38, 25);    // cursor on hsla(90, 100%, 50%, 2)
                    expectNoPreviewAtPos(39, 24);    // cursor on hsla(0, 200%, 50%, 0.5)
                    expectNoPreviewAtPos(40, 25);    // cursor on hsla(0.0, 100%, 50%, .5)
                });
            });

            it("should show preview of colors with valid names", function () {
                runs(function () {
                    checkColorAtPos("blueviolet",    47, 15);
                    checkColorAtPos("darkgoldenrod", 49, 16);
                    checkColorAtPos("darkgray",      50, 16);
                    checkColorAtPos("firebrick",     51, 15);
                    checkColorAtPos("honeydew",      53, 16);
                    checkColorAtPos("lavenderblush", 56, 16);
                    checkColorAtPos("salmon",        61, 16);
                    checkColorAtPos("tomato",        66, 16);
                });
            });

            it("should NOT show preview of colors with invalid names", function () {
                runs(function () {
                    expectNoPreviewAtPos(72, 15);    // cursor on redsox
                    expectNoPreviewAtPos(73, 16);    // cursor on pinky
                    expectNoPreviewAtPos(74, 16);    // cursor on blue in hyphenated word blue-cheese
                    expectNoPreviewAtPos(75, 18);    // cursor on white in hyphenated word @bc-white
                });
            });
        });
            
        describe("Quick view gradients", function () {
            it("Should show linear gradient preview for those with vendor prefix", function () {
                runs(function () {
                    var expectedGradient1 = "-webkit-linear-gradient(top,  #d2dfed 0%, #c8d7eb 26%, #bed0ea 51%, #a6c0e3 51%, #afc7e8 62%, #bad0ef 75%, #99b5db 88%, #799bc8 100%)",
                        expectedGradient2 = "-webkit-gradient(linear, left top, left bottom, color-stop(0%,#d2dfed), color-stop(26%,#c8d7eb), color-stop(51%,#bed0ea), color-stop(51%,#a6c0e3), color-stop(62%,#afc7e8), color-stop(75%,#bad0ef), color-stop(88%,#99b5db), color-stop(100%,#799bc8))",
                        expectedGradient3 = "-webkit-linear-gradient(top,  #d2dfed 0%,#c8d7eb 26%,#bed0ea 51%,#a6c0e3 51%,#afc7e8 62%,#bad0ef 75%,#99b5db 88%,#799bc8 100%)",
                        expectedGradient4 = "-webkit-gradient(linear, left top, left bottom, from(rgb(51,51,51)), to(rgb(204,204,204)))";
                    checkGradientAtPos(expectedGradient1, 80, 36);   // -moz- prefix gets stripped
                    checkGradientAtPos(expectedGradient2, 81, 36);   // Old webkit syntax
                    checkGradientAtPos(expectedGradient3, 82, 36);   // -webkit- prefix gets stripped
                    checkGradientAtPos(expectedGradient3, 83, 36);   // -o- prefix gets stripped
                    checkGradientAtPos(expectedGradient3, 84, 36);   // -ms- prefix gets stripped
                    checkGradientAtPos(expectedGradient4, 90, 36);   // test parameters with 2 levels of nested parens
                });
            });
            
            it("Should show linear gradient preview for those with w3c standard syntax (no prefix)", function () {
                runs(function () {
                    checkGradientAtPos("-webkit-linear-gradient(#333, #CCC)",                  99, 50);
                    checkGradientAtPos("-webkit-linear-gradient(135deg, #333, #CCC)",          101, 50);
                    
                    // TODO (#3458): Keyword "to" not supported until Brackets upgrades to Chrome 26
                    //checkGradientAtPos("-webkit-linear-gradient(to right, #333, #CCC)",        98, 50);
                    //checkGradientAtPos("-webkit-linear-gradient(to bottom right, #333, #CCC)", 100, 50);
                    expectNoPreviewAtPos(98, 50);
                    expectNoPreviewAtPos(100, 50);

                    // multiple colors
                    checkGradientAtPos("-webkit-linear-gradient(#333, #CCC, #333)",             104, 50);
                    checkGradientAtPos("-webkit-linear-gradient(#333 0%, #CCC 33%, #333 100%)", 105, 50);
                    checkGradientAtPos("-webkit-linear-gradient(yellow, blue 20%, #0f0)",       106, 50);
                });
            });

            it("Should show radial gradient preview for those with vendor prefix syntax", function () {
                runs(function () {
                    var expectedGradient1 = "-webkit-gradient(radial, center center, 0, center center, 141, from(black), to(white), color-stop(25%, blue), color-stop(40%, green), color-stop(60%, red), color-stop(80%, purple))",
                        expectedGradient2 = "-webkit-radial-gradient(center center, circle contain, black 0%, blue 25%, green 40%, red 60%, purple 80%, white 100%)";
                    checkGradientAtPos(expectedGradient1, 110, 93);   // old webkit syntax
                    checkGradientAtPos(expectedGradient2, 111, 36);   // -webkit- prefix preserved
                    checkGradientAtPos(expectedGradient2, 112, 36);   // -moz- prefix gets stripped
                    checkGradientAtPos(expectedGradient2, 113, 36);   // -ms- prefix gets stripped
                    checkGradientAtPos(expectedGradient2, 114, 36);   // -0- prefix gets stripped
                });
            });
            
            it("Should show radial gradient preview for those with w3c standard syntax (no prefix)", function () {
                runs(function () {
                    // TODO (#3458): support new W3C syntax
//                    checkGradientAtPos("-webkit-radial-gradient(yellow, green)", 118, 35);
//                    checkGradientAtPos("-webkit-radial-gradient(yellow, green)", 118, 40);
                    
                    // For now the color stops are just previewed in isolation
                    expectNoPreviewAtPos(118, 35);
                    checkColorAtPos("yellow", 118, 40);
                });
            });

            it("Should show repeating linear gradient preview", function () {
                runs(function () {
                    // TODO (#3458): support repeat
//                    checkGradientAtPos("repeating-linear-gradient(red, blue 20px, red 40px)", 122, 50);
//                    checkGradientAtPos("repeating-linear-gradient(red 0px, white 0px, blue 0px)", 123, 50);
//                    checkGradientAtPos("repeating-linear-gradient(red 0px, white .1px, blue .2px)", 124, 50);
                    
                    // For now the color stops are just previewed in isolation
                    expectNoPreviewAtPos(122, 35);
                    expectNoPreviewAtPos(123, 35);
                    expectNoPreviewAtPos(124, 35);
                    checkColorAtPos("red", 122, 50);
                });
            });

            it("Should show repeating radial gradient preview", function () {
                runs(function () {
                    // TODO (#3458): support repeat
//                    checkGradientAtPos("repeating-radial-gradient(circle closest-side at 20px 30px, red, yellow, green 100%, yellow 150%, red 200%)", 128, 40);
//                    checkGradientAtPos("repeating-radial-gradient(red, blue 20px, red 40px)", 129, 40);
                    
                    expectNoPreviewAtPos(128, 40);
                    expectNoPreviewAtPos(129, 40);
                });
            });
            
            it("Should show comma-separated gradients", function () {
                runs(function () {
                    // line ending in comma
                    checkGradientAtPos("-webkit-linear-gradient(63deg, #999 23%, transparent 23%)", 135,  50);
                    
                    // multiple gradients on a line
                    checkGradientAtPos("-webkit-linear-gradient(63deg, transparent 74%, #999 78%)", 136,  50);
                    checkGradientAtPos("-webkit-linear-gradient(63deg, transparent 0%, #999 38%, #999 58%, transparent 100%)",   136, 100);
                });
            });
        });

        describe("Quick view display", function () {
            
            function showPopoverAtPos(line, ch) {
                var popoverInfo = getPopoverAtPos(line, ch);
                QuickView._forceShow(popoverInfo);
            }
            
            function getBounds(object) {
                return {
                    left:   object.offset().left,
                    top:    object.offset().top,
                    right:  object.offset().left + object.width(),
                    bottom: object.offset().top + object.height()
                };
            }

            function boundsInsideWindow(object) {
                var bounds = getBounds(object),
                    editorBounds = getBounds(testWindow.$("#editor-holder"));
                return bounds.left   >= editorBounds.left   &&
                       bounds.right  <= editorBounds.right  &&
                       bounds.top    >= editorBounds.top    &&
                       bounds.bottom <= editorBounds.bottom;
            }

            function toggleOption(commandID, text) {
                runs(function () {
                    var promise = CommandManager.execute(commandID);
                    waitsForDone(promise, text);
                });
            }

            it("popover is positioned within window bounds", function () {
                var $popover  = testWindow.$("#quick-view-container");
                expect($popover.length).toEqual(1);
                
                runs(function () {
                    // Popover should be below item
                    showPopoverAtPos(3, 12);
                    expect(boundsInsideWindow($popover)).toBeTruthy();

                    // Popover should above item
                    showPopoverAtPos(20, 33);
                    expect(boundsInsideWindow($popover)).toBeTruthy();
                });

                runs(function () {
                    // Turn off word wrap for next tests
                    toggleOption(Commands.TOGGLE_WORD_WRAP, "Toggle word-wrap");
                });

                runs(function () {
                    // Popover should be inside right edge
                    showPopoverAtPos(81, 36);
                    expect(boundsInsideWindow($popover)).toBeTruthy();

                    // Popover should be inside left edge
                    var scrollX = editor._codeMirror.defaultCharWidth()  * 80,
                        scrollY = editor._codeMirror.defaultTextHeight() * 70;

                    editor.setScrollPos(scrollX, scrollY);      // Scroll right
                    showPopoverAtPos(82, 136);
                    expect(boundsInsideWindow($popover)).toBeTruthy();

                    // restore word wrap
                    toggleOption(Commands.TOGGLE_WORD_WRAP, "Toggle word-wrap");
                });
            });
            
            it("highlight matched text when popover shown", function () {
                showPopoverAtPos(4, 14);
                var markers = editor._codeMirror.findMarksAt({line: 4, ch: 14});
                expect(markers.length).toBe(1);
                var range = markers[0].find();
                expect(range.from.ch).toBe(11);
                expect(range.to.ch).toBe(18);
            });
            
        });

        describe("Quick view images", function () {
            it("Should show image preview for file path inside url()", function () {
                runs(function () {
                    checkImagePathAtPos("img/grabber_color-well.png", 140, 26);
                    checkImagePathAtPos("img/Color.png",              141, 26);
                    checkImagePathAtPos("img/throbber.gif",           142, 26);
                    checkImagePathAtPos("img/update_large_icon.svg",  143, 26);
                });
            });
            
            it("Should show image preview for urls with http/https", function () {
                runs(function () {
                    checkImagePathAtPos("https://raw.github.com/gruehle/HoverPreview/master/screenshots/Image.png", 145, 26);
                });
            });
            
            it("Should show image preview for file path inside single or double quotes", function () {
                runs(function () {
                    checkImagePathAtPos("img/med_hero.jpg",  147, 26);
                    checkImagePathAtPos("img/Gradient.png",  148, 26);
                    checkImagePathAtPos("img/specials.jpeg", 149, 26);
                });
            });
            
            it("Should show image preview for subsequent images in a line", function () {
                runs(function () {
                    checkImagePathAtPos("img/Gradient.png", 153, 80);    // url("")
                    checkImagePathAtPos("img/Gradient.png", 154, 80);    // url()
                    checkImagePathAtPos("img/Gradient.png", 155, 80);    // ""
                });
                
                // This must be in the last spec in the suite.
                runs(function () {
                    this.after(function () {
                        SpecRunnerUtils.closeTestWindow();
                    });
                });
            });
        });
    });
});
