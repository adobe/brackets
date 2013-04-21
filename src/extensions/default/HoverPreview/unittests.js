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
/*global define, describe, it, xit, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
   
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        FileUtils       = brackets.getModule("file/FileUtils");

    describe("Hover Preview", function () {
        var testFolder = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files/";
        var testWindow, brackets, CommandManager, Commands, EditorManager, HoverPreview, editor;

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
                        HoverPreview = brackets.test.extensions.HoverPreview;
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
        
        function hoverOn(lineNum, columnNum, isImage) {
            var cm = editor._codeMirror,
                pos = { line: lineNum, ch: columnNum },
                token,
                line;
            
            editor.setCursorPos(pos);
            token = cm.getTokenAt(pos);
            line = cm.getLine(pos.line);

            if (isImage) {
                HoverPreview.imagePreviewProvider(editor, pos, token, line);
            } else {
                HoverPreview.colorAndGradientPreviewProvider(editor, pos, token, line);
            }
        }
        
        function checkColorAtPos(curColor, line, ch) {
            var colorInPreview;
            
            hoverOn(line, ch, false);
            colorInPreview = HoverPreview.getLastPreviewedColorOrGradient();
            expect(colorInPreview).toBe(curColor);
        }
        
        function checkGradientAtPos(curGradient, line, ch) {
            // Just call checkColorAtPos since both have the same function calls.
            checkColorAtPos(curGradient, line, ch);
        }
        
        function checkImagePathAtPos(curImagePath, line, ch) {
            var imagePath;
            
            hoverOn(line, ch, true);
            imagePath = HoverPreview.getLastPreviewedImagePath();
            expect(imagePath.indexOf(curImagePath)).toBeGreaterThan(-1);
        }
        
        describe("Hover preview colors", function () {
            it("should show preview of hex colors either in 3 digit hex or or 6-digit hex", function () {
                runs(function () {
                    checkColorAtPos("#369", 3, 5);
                    checkColorAtPos("#2491F5", 4, 6);
                });
            });

            it("should NOT show preview of color on words start with #", function () {
                runs(function () {
                    checkColorAtPos("", 7, 7);    // cursor on #invalid_hex
                    checkColorAtPos("", 8, 8);    // cursor on #web
                });
            });

            it("should show preview of valid rgb/rgba colors", function () {
                runs(function () {
                    checkColorAtPos("rgb(255,0,0)",       12, 5);
                    checkColorAtPos("rgb(100%, 0%, 0%)",  13, 10);
                    checkColorAtPos("rgb(50%, 75%, 25%)", 14, 17);
                    
                    // rgba with values of 0-255 
                    checkColorAtPos("rgba(255, 0, 0, 0.5)", 15, 16);
                    checkColorAtPos("rgba(255, 0, 0, 1)",   16, 15);
                    checkColorAtPos("rgba(255, 0, 0, .5)",  17, 12);

                    // rgba with percentage values
                    checkColorAtPos("rgba(100%, 0%, 0%, 0.5)",  18, 25);
                    checkColorAtPos("rgba(80%, 50%, 50%, 1)",   20, 26);
                    // This is not working yet
                    //checkColorAtPos("rgba(50%, 75%, 25%, 1.0)", 21, 16);
                });
            });

            it("should NOT show preview of unsupported rgb/rgba colors", function () {
                runs(function () {
                    checkColorAtPos("", 25, 7);    // cursor on rgb(300, 0, 0)
                    checkColorAtPos("", 26, 8);    // cursor on rgb(0, 95.5, 0)
                    checkColorAtPos("", 27, 8);    // cursor on rgba(-0, 0, 0, 0.5)
                });
            });

            it("should show preview of valid hsl/hsla colors", function () {
                runs(function () {
                    checkColorAtPos("hsl(0, 100%, 50%)",       31, 15);
                    checkColorAtPos("hsla(0, 100%, 50%, 0.5)", 32, 16);
                    checkColorAtPos("hsla(0, 100%, 50%, .5)",  33, 16);
                });
            });

            it("should NOT show preview of unsupported hsl/hsla colors", function () {
                runs(function () {
                    checkColorAtPos("", 37, 17);    // cursor on hsl(390, 100%, 50%)
                    checkColorAtPos("", 38, 18);    // cursor on hsla(90, 100%, 50%, 2)
                    checkColorAtPos("", 39, 17);    // cursor on hsla(0, 200%, 50%, 0.5)
                    checkColorAtPos("", 40, 18);    // cursor on hsla(0.0, 100%, 50%, .5)
                });
            });

            it("should show preview of colors with valid names", function () {
                runs(function () {
                    checkColorAtPos("blueviolet",    54,  15);
                    checkColorAtPos("darkgray",      68,  16);
                    checkColorAtPos("deeppink",      84,  16);
                    checkColorAtPos("firebrick",     89,  15);
                    checkColorAtPos("honeydew",      101, 16);
                    checkColorAtPos("lavenderblush", 108, 16);
                    checkColorAtPos("salmon",        167, 16);
                    checkColorAtPos("tomato",        183, 16);
                });
            });
        });
            
        describe("Hover preview gradients", function () {
            it("Should show linear gradient preview for those with vendor prefix", function () {
                runs(function () {
                    var expectedGradient1 = "linear-gradient(top,  #d2dfed 0%, #c8d7eb 26%, #bed0ea 51%, #a6c0e3 51%, #afc7e8 62%, #bad0ef 75%, #99b5db 88%, #799bc8 100%)",
                        expectedGradient2 = "linear-gradient(top,  #d2dfed 0%,#c8d7eb 26%,#bed0ea 51%,#a6c0e3 51%,#afc7e8 62%,#bad0ef 75%,#99b5db 88%,#799bc8 100%)";
                    checkGradientAtPos(expectedGradient1, 195, 36);   // -moz- prefix gets stripped
                    checkGradientAtPos("-webkit-gradient(linear, left top, left bottom, color-stop(0%,#d2dfed), color-stop(26%,#c8d7eb), color-stop(51%,#bed0ea), color-stop(51%,#a6c0e3), color-stop(62%,#afc7e8), color-stop(75%,#bad0ef), color-stop(88%,#99b5db), color-stop(100%,#799bc8));",
                                                       196, 36);   // Old webkit syntax
                    checkGradientAtPos(expectedGradient2, 197, 36);   // -webkit- prefix gets stripped
                    checkGradientAtPos(expectedGradient2, 198, 36);   // -o- prefix gets stripped
                    checkGradientAtPos(expectedGradient2, 199, 36);   // -ms- prefix gets stripped
                });
            });
            
            it("Should show linear gradient preview for those with w3c standard syntax (no prefix)", function () {
                runs(function () {
                    checkGradientAtPos("linear-gradient(to right, #333, #CCC)",        213, 50);
                    checkGradientAtPos("linear-gradient(#333, #CCC)",                  214, 50);
                    checkGradientAtPos("linear-gradient(to bottom right, #333, #CCC)", 215, 50);
                    checkGradientAtPos("linear-gradient(135deg, #333, #CCC)",          216, 50);

                    // multiple colors
                    checkGradientAtPos("linear-gradient(#333, #CCC, #333)",             219, 50);
                    checkGradientAtPos("linear-gradient(#333 0%, #CCC 33%, #333 100%)", 220, 50);
                    checkGradientAtPos("linear-gradient(yellow, blue 20%, #0f0)",       221, 50);
                });
            });

            it("Should show radial gradient preview for those with vendor prefix syntax", function () {
                runs(function () {
                    var expectedGradient1 = "-webkit-gradient(radial, center center, 0, center center, 141, from(black), to(white), color-stop(25%, blue), color-stop(40%, green), color-stop(60%, red), color-stop(80%, purple));",
                        expectedGradient2 = "radial-gradient(center center, circle contain, black 0%, blue 25%, green 40%, red 60%, purple 80%, white 100%);";
                    checkGradientAtPos(expectedGradient1, 225, 93);   // old webkit syntax
                    checkGradientAtPos("-webkit-" + expectedGradient2, 226, 36);   // Append -webkit- prefix
                    checkGradientAtPos("-moz-" + expectedGradient2,    227, 36);   // Append -moz- prefix
                    checkGradientAtPos("-ms-" + expectedGradient2,     228, 36);   // Append -ms- prefix
                    checkGradientAtPos("-o-" + expectedGradient2,      229, 36);   // Append -0- prefix
                });
            });
            
            xit("Should show radial gradient preview for those with w3c standard syntax (no prefix)", function () {
                runs(function () {
                    checkGradientAtPos("radial-gradient(yellow, green)", 233, 40);
                });
            });
        });

        describe("Hover preview positioning", function () {

            function getBounds(object) {
                return {
                    left:   object.offset().left,
                    top:    object.offset().top,
                    right:  object.offset().left + object.width(),
                    bottom: object.offset().top + object.height()
                };
            }

            function boundsInsideWindow(object) {
                var bounds = getBounds(object);
                return bounds.left   >= 0                      &&
                       bounds.right  <= $(testWindow).width()  &&
                       bounds.top    >= 0                      &&
                       bounds.bottom <= $(testWindow).height();
            }

            function toggleOption(commandID, text) {
                runs(function () {
                    var promise = CommandManager.execute(commandID);
                    waitsForDone(promise, text);
                });
            }

            it("popover is not clipped", function () {
                var $popover  = testWindow.$("#hover-preview-container");
                expect($popover.length).toEqual(1);

                runs(function () {
                    // Popover should be below item
                    hoverOn(3, 5, false);
                    expect(boundsInsideWindow($popover)).toBeTruthy();

                    // Popover should above item
                    hoverOn(20, 26, false);
                    expect(boundsInsideWindow($popover)).toBeTruthy();
                });

                runs(function () {
                    // Turn off word wrap for next tests
                    toggleOption(Commands.TOGGLE_WORD_WRAP, "Toggle word-wrap");
                });

                runs(function () {

// Issue #3447 - fixes both of the following tests
/*
                    // Popover should be inside right edge
                    hoverOn(196, 36, false);
                    expect(boundsInsideWindow($popover)).toBeTruthy();
*/

/*
                    // Popover should be inside left edge
                    var scrollX = editor._codeMirror.defaultCharWidth()  * 120,
                        scrollY = editor._codeMirror.defaultTextHeight() * 190;

                    editor.setScrollPos(scrollX, scrollY);      // Scroll right
                    hoverOn(197, 136, false);
                    expect(boundsInsideWindow($popover)).toBeTruthy();
*/

                    // restore word wrap
                    toggleOption(Commands.TOGGLE_WORD_WRAP, "Toggle word-wrap");
                });
            });
        });

        describe("Hover preview images", function () {
            it("Should show image preview for file path inside url()", function () {
                runs(function () {
                    checkImagePathAtPos("img/grabber_color-well.png", 237, 26);
                    checkImagePathAtPos("img/Color.png",              238, 26);
                    checkImagePathAtPos("img/DancingPeaks.gif",       239, 26);
                    checkImagePathAtPos("img/Example.svg",            240, 26);
                });
            });
            
            it("Should show image preview for urls with http/https", function () {
                runs(function () {
                    checkImagePathAtPos("https://raw.github.com/gruehle/HoverPreview/master/screenshots/Image.png", 242, 26);
                });
            });
            
            it("Should show image preview for file path inside single or double quotes", function () {
                runs(function () {
                    checkImagePathAtPos("img/med_hero.jpg",       244, 26);
                    checkImagePathAtPos("img/Gradient.png",       245, 26);
                    checkImagePathAtPos("Lake_mapourika_NZ.jpeg", 246, 26);
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