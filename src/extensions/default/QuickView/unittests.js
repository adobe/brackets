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

/*global describe, it, expect, beforeEach, runs, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils    = brackets.getModule("spec/SpecRunnerUtils"),
        FileUtils          = brackets.getModule("file/FileUtils"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        prefs              = PreferencesManager.getExtensionPrefs("quickview");

    describe("Quick View", function () {
        var testFolder = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files/";

        // load from testWindow
        var testWindow,
            brackets,
            extensionRequire,
            CommandManager,
            Commands,
            EditorManager,
            QuickView,
            editor,
            testFile = "test.css",
            oldFile;

        beforeEach(function () {
            // Create a new window that will be shared by ALL tests in this spec.
            if (!testWindow) {
                runs(function () {
                    SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                        testWindow = w;
                        // Load module instances from brackets.test
                        brackets = testWindow.brackets;
                        CommandManager = brackets.test.CommandManager;
                        Commands = brackets.test.Commands;
                        EditorManager = brackets.test.EditorManager;
                        extensionRequire = brackets.test.ExtensionLoader.getRequireContextForExtension("QuickView");
                        QuickView = extensionRequire("main");
                    });
                });

                runs(function () {
                    SpecRunnerUtils.loadProjectInTestWindow(testFolder);
                });
            }

            if (testFile !== oldFile) {
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles([testFile]), "open test file: " + testFile);
                });

                runs(function () {
                    editor  = EditorManager.getCurrentFullEditor();
                    oldFile = testFile;
                });
            }
        });

        function getPopoverAtPos(lineNum, columnNum) {
            var cm = editor._codeMirror,
                pos = { line: lineNum, ch: columnNum },
                token;

            editor.setCursorPos(pos);
            token = cm.getTokenAt(pos, true);

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

        function checkImageDataAtPos(expectedData, line, ch) {
            var popoverInfo = getPopoverAtPos(line, ch);
            expect(popoverInfo._imgPath).toBe(expectedData);
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
                    expectNoPreviewAtPos(75, 18);    // cursor on white in hyphenated word @bc-bg-highlight
                });
            });

            describe("JavaScript file", function () {
                runs(function () {
                    testFile = "test.js";
                });

                it("should NOT show preview of color-named functions and object/array keys", function () {
                    runs(function () {
                        expectNoPreviewAtPos(2, 12);    // cursor on green()
                        expectNoPreviewAtPos(4, 22);    // cursor on Math.tan
                        expectNoPreviewAtPos(5, 14);    // cursor on tan()
                        expectNoPreviewAtPos(5, 38);    // cursor on array[red]
                    });
                });
                it("should not show preview of literal color names", function () {
                    runs(function () {
                        expectNoPreviewAtPos(2, 36);  // green
                        expectNoPreviewAtPos(3, 21);  // green
                        expectNoPreviewAtPos(4, 11);  // tan
                        expectNoPreviewAtPos(5, 25);  // red
                        expectNoPreviewAtPos(7,  1);  // darkgray
                    });
                });
                it("should show preview of non-literal color codes", function () {
                    runs(function () {
                        checkColorAtPos("#123456",          8, 7);
                        checkColorAtPos("rgb(65, 43, 21)",  9, 8);
                    });
                });
            });
        });

        describe("Quick view gradients", function () {
            runs(function () {
                testFile = "test.css";
            });

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

            it("Should show linear gradient preview for those with colon or space before", function () {
                runs(function () {
                    var expectedGradient = "linear-gradient(to bottom, black 0%, white 100%)";
                    checkGradientAtPos(expectedGradient, 169, 25);   // space colon space
                    checkGradientAtPos(expectedGradient, 170, 25);   // colon space
                    checkGradientAtPos(expectedGradient, 171, 25);   // space colon
                    checkGradientAtPos(expectedGradient, 172, 25);   // colon
                });
            });

            it("Should show radial gradient preview for those with colon or space before", function () {
                runs(function () {
                    var expectedGradient = "radial-gradient(red, white 50%, blue 100%)";
                    checkGradientAtPos(expectedGradient, 176, 25);   // space colon space
                    checkGradientAtPos(expectedGradient, 177, 25);   // colon space
                    checkGradientAtPos(expectedGradient, 178, 25);   // space colon
                    checkGradientAtPos(expectedGradient, 179, 25);   // colon
                });
            });

            it("Should show linear gradient preview for those with w3c standard syntax (no prefix)", function () {
                runs(function () {
                    checkGradientAtPos("linear-gradient(#333, #CCC)",                  99, 50);
                    checkGradientAtPos("linear-gradient(135deg, #333, #CCC)",          101, 50);

                    checkGradientAtPos("linear-gradient(to right, #333, #CCC)",        98, 50);
                    checkGradientAtPos("linear-gradient(to bottom right, #333, #CCC)", 100, 50);


                    // multiple colors
                    checkGradientAtPos("linear-gradient(#333, #CCC, #333)",             104, 50);
                    checkGradientAtPos("linear-gradient(#333 0%, #CCC 33%, #333 100%)", 105, 50);
                    checkGradientAtPos("linear-gradient(yellow, blue 20%, #0f0)",       106, 50);
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
                    checkGradientAtPos("radial-gradient(yellow, green)", 118, 35);
                    checkGradientAtPos("radial-gradient(yellow, green)", 118, 40);
                });
            });

            it("Should show repeating linear gradient preview", function () {
                runs(function () {
                    checkGradientAtPos("repeating-linear-gradient(red, blue 50%, red 100%)", 122, 50);
                    checkGradientAtPos("repeating-linear-gradient(red 0%, white 0%, blue 0%)", 123, 50);
                    checkGradientAtPos("repeating-linear-gradient(red 0%, white 50%, blue 100%)", 124, 50);
                });
            });

            it("Should show repeating radial gradient preview", function () {
                runs(function () {
                    checkGradientAtPos("repeating-radial-gradient(circle closest-side at 20px 30px, red, yellow, green 100%, yellow 150%, red 200%)", 128, 40);
                    checkGradientAtPos("repeating-radial-gradient(red, blue 50%, red 100%)", 129, 40);
                });
            });

            it("Should show comma-separated gradients", function () {
                runs(function () {
                    // line ending in comma
                    checkGradientAtPos("linear-gradient(63deg, #999 23%, transparent 23%)", 135,  50);

                    // multiple gradients on a line
                    checkGradientAtPos("linear-gradient(63deg, transparent 74%, #999 78%)", 136,  50);
                    checkGradientAtPos("linear-gradient(63deg, transparent 0%, #999 38%, #999 58%, transparent 100%)",   136, 100);
                });
            });

            it("Should convert gradients arguments from pixel to percent", function () {
                runs(function () {
                    // linear gradient in px
                    checkGradientAtPos("-webkit-linear-gradient(top, rgba(0,0,0,0) 0%, green 50%, red 100%)", 163, 40);
                    // repeating linear-gradient in pixels (no prefix)
                    checkGradientAtPos("repeating-linear-gradient(red, blue 50%, red 100%)", 164, 40);
                    // repeating radial-gradient in pixels (no prefix)
                    checkGradientAtPos("repeating-radial-gradient(red, blue 50%, red 100%)", 165, 40);
                });
            });

            it("Should not go into infinite loop on unbalanced parens", function () {
                runs(function () {
                    // no preview, and no infinite loop
                    expectNoPreviewAtPos(189, 30);
                    expectNoPreviewAtPos(190, 40);
                });
            });
        });

        describe("Quick view display", function () {

            function showPopoverAtPos(line, ch) {
                var popoverInfo = getPopoverAtPos(line, ch);
                QuickView._forceShow(popoverInfo);
            }

            function getBounds(object, useOffset) {
                var left = (useOffset ? object.offset().left : parseInt(object.css("left"), 10)),
                    top = (useOffset ? object.offset().top : parseInt(object.css("top"), 10));
                return {
                    left:   left,
                    top:    top,
                    right:  left + object.outerWidth(),
                    bottom: top + object.outerHeight()
                };
            }

            function boundsInsideWindow(object) {
                // For the popover, we can't use offset(), because jQuery gets confused by the
                // scale factor and transform origin that the animation uses. Instead, we rely
                // on the fact that its offset parent is body, and just test its explicit left/top
                // values.
                var bounds = getBounds(object, false),
                    editorBounds = getBounds(testWindow.$("#editor-holder"), true);
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
            });

            it("Should show image preview for URIs containing quotes", function () {
                checkImagePathAtPos("img/don't.png", 183, 26);  // url() containing '
                checkImagePathAtPos("img/don't.png", 184, 26);  // url("") containing '
                checkImageDataAtPos("data:image/svg+xml;utf8, <svg version='1.1' xmlns='http://www.w3.org/2000/svg'></svg>", 185, 26);  // data url("") containing '
            });

            it("Should show image preview for URLs with known image extensions", function () {
                checkImageDataAtPos("http://example.com/image.gif", 194, 20);
                checkImageDataAtPos("http://example.com/image.png", 195, 20);
                checkImageDataAtPos("http://example.com/image.jpe", 196, 20);
                checkImageDataAtPos("http://example.com/image.jpeg", 197, 20);
                checkImageDataAtPos("http://example.com/image.jpg", 198, 20);
                checkImageDataAtPos("http://example.com/image.ico", 199, 20);
                checkImageDataAtPos("http://example.com/image.bmp", 200, 20);
                checkImageDataAtPos("http://example.com/image.svg", 201, 20);
            });

            it("Should show image preview for extensionless URLs (with protocol) with pref set", function () {
                // Flip the pref on and restore when done
                var original = prefs.get("extensionlessImagePreview");
                prefs.set("extensionlessImagePreview", true);

                checkImageDataAtPos("https://image.service.com/id/1234513", 203, 20); // https
                checkImageDataAtPos("http://image.service.com/id/1234513", 204, 20);  // http
                checkImageDataAtPos("https://image.service.com/id/1234513?w=300&h=400", 205, 20); // qs params

                prefs.set("extensionlessImagePreview", original);
            });

            it("Should not show image preview for extensionless URLs (with protocol) without pref set", function () {
                // Flip the pref off and restore when done
                var original = prefs.get("extensionlessImagePreview");
                prefs.set("extensionlessImagePreview", false);

                checkImageDataAtPos("https://image.service.com/id/1234513", 203, 20); // https
                checkImageDataAtPos("http://image.service.com/id/1234513", 204, 20);  // http
                checkImageDataAtPos("https://image.service.com/id/1234513?w=300&h=400", 205, 20); // qs params

                prefs.set("extensionlessImagePreview", original);
            });

            it("Should ignore URLs for common non-image extensions", function () {
                expectNoPreviewAtPos(209, 20); // .html
                expectNoPreviewAtPos(210, 20); // .css
                expectNoPreviewAtPos(211, 20); // .js
                expectNoPreviewAtPos(212, 20); // .json
                expectNoPreviewAtPos(213, 20); // .md
                expectNoPreviewAtPos(214, 20); // .xml
                expectNoPreviewAtPos(215, 20); // .mp3
                expectNoPreviewAtPos(216, 20); // .ogv
                expectNoPreviewAtPos(217, 20); // .mp4
                expectNoPreviewAtPos(218, 20); // .mpeg
                expectNoPreviewAtPos(219, 20); // .webm
                expectNoPreviewAtPos(220, 20); // .zip
                expectNoPreviewAtPos(221, 20); // .tgz
            });

            it("Should show image preview for a data URI inside url()", function () {
                runs(function () {
                    checkImageDataAtPos("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAABq0lEQVQoU11RPUgcURD+Zt/unnrcCf4QIugRMcS7a2xjmmArRlRIFRBFgrVtGgmBRFCwTBoLsQiBGMxiJ4iksLRSFEzQRC2EAwm5g727feP3LpyFy1tm5s33zcz7RnDvG4x0zFgMJRY/jiewhy/w8FKSJkyaTuG7Fumvi+ARbQiLpcMDvH/Qj1S6Bf6vI5SxKPUG4fGm5kMf6wr08MKHILCKldoZlk0OIeuHjNuDBBcNAqvvENTLwKii1ZFoF/7G2PQDpNo8dFUt1AcSGfymz42PVfI8ghxht1bHh9MpucCiegMFdJoUOtSD+MxLPtI5T/GaHWhg+NjRk3G5utPikwb5bjzhq40JSChs6Sx1eOYAojg/fCFv7yvnBLGCLPMqxS2dZrtXnDthhySuYebnpFw3ST2RtmUVIx5z1sIKdX9qgDcOTJAj7WsNa8eTUhrY0Gwqg2FldeZiduH5r9JHvqEDigzDS/4VJvYJfMh9VLmbNO9+s9hNg5D/qjkJ8I6uW0yFtkrwHydCg+AhVgsp/8Pnu00XI+0jYJ7gjANRiEsmQ3aNOXuJhG035i1QA6g+uONCrgAAAABJRU5ErkJggg==",  159, 26);
                });

                // This must be in the last spec in the suite.
                runs(function () {
                    this.after(function () {
                        testWindow       = null;
                        brackets         = null;
                        CommandManager   = null;
                        Commands         = null;
                        EditorManager    = null;
                        extensionRequire = null;
                        QuickView        = null;
                        SpecRunnerUtils.closeTestWindow();
                    });
                });
            });
        });
    });
});
