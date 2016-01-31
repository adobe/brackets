/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, it, xit, expect, beforeEach, afterEach, $, brackets */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        Editor          = brackets.getModule("editor/Editor").Editor,
        HTMLCodeHints   = require("main");

    describe("HTML Code Hinting", function () {

        var defaultContent = "<!doctype html>\n" +
                             "<html>\n" +
                             "<style type=\"text/css\">\n" +
                             "</style>\n" +
                             "<body>\n" +
                             "  <h1 id='foo'>Heading</h1>\n" +       // tag without whitespace
                             "  <h3 id  = 'bar' >Subheading</h3>\n" + // tag with whitespace
                             "  <p></p>\n" +                         // tag without attributes
                             "  <h5 id='aaa' class='bbb'></h5>\n" +  // tag with two attributes
                             "  <div \n" +                           // incomplete tag
                             "</body>\n" +
                             "</html>\n";

        var testDocument, testEditor;

        beforeEach(function () {
            // create dummy Document for the Editor
            testDocument = SpecRunnerUtils.createMockDocument(defaultContent, "html");

            // create Editor instance (containing a CodeMirror instance)
            $("body").append("<div id='editor'/>");
            testEditor = new Editor(testDocument, true, $("#editor").get(0));
        });

        afterEach(function () {
            testEditor.destroy();
            testEditor = null;
            $("#editor").remove();
            testDocument = null;
        });


        // Ask provider for hints at current cursor position; expect it to return some
        function expectHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(true);
            var hintsObj = provider.getHints();
            expect(hintsObj).toBeTruthy();
            return hintsObj.hints; // return just the array of hints
        }

        // Ask provider for hints at current cursor position; expect it NOT to return any
        function expectNoHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(false);
        }

        // Expect hintList to contain tag names, starting with given value (if unspecified, expects the default unfilered list)
        function verifyTagHints(hintList, expectedFirstHint) {
            expect(hintList.indexOf("id")).toBe(-1);   // make sure attribute names aren't sneaking in there

            expectedFirstHint = expectedFirstHint || "a";  // assume unfiltered lists always start with "a"
            expect(hintList[0]).toBe(expectedFirstHint);
        }

        // Expect hintList to contain attribute names, starting with given value (if unspecified, expects the default unfilered list)
        function verifyAttrHints(hintList, expectedFirstHint) {
            expect(hintList.indexOf("div")).toBe(-1);   // make sure tag names aren't sneaking in there

            expectedFirstHint = expectedFirstHint || "accesskey";  // assume unfiltered lists always start with "accesskey"
            expect(hintList[0]).toBe(expectedFirstHint);
        }


        describe("Tag hint provider", function () {

            it("should not hint within <style> block", function () {  // (bug #1277)
                // Replace default test content with code containing a <style> block
                testDocument.setText("<!doctype html>\n" +
                                     "<html>\n" +
                                     "<head>\n" +
                                     "  <style>\n" +
                                     "  </style>\n" +
                                     "</head>\n" +
                                     "<body>\n" +
                                     "</body>\n" +
                                     "</html>\n");

                testEditor.setCursorPos({ line: 3, ch: 9 });        // cursor after the > in "<style>"
                expectNoHints(HTMLCodeHints.tagHintProvider);
            });

            it("should hint for < just before existing tag", function () {  // (bug #1260)
                testDocument.replaceRange("<", { line: 5, ch: 2 }); // insert text: "<h1" -> "<<h1"

                testEditor.setCursorPos({ line: 5, ch: 3 });        // cursor between the two <s
                var hintList = expectHints(HTMLCodeHints.tagHintProvider);
                verifyTagHints(hintList);
                expect(hintList.indexOf("div")).not.toBe(-1);  // additional sanity check
            });

            it("should filter hints by prefix", function () {  // (bug #1260)
                testDocument.replaceRange("  <s\n", { line: 8, ch: 0 }); // insert new line "<s", after line "<p></p>"

                testEditor.setCursorPos({ line: 8, ch: 4 });        // cursor at end of line
                var hintList = expectHints(HTMLCodeHints.tagHintProvider);
                verifyTagHints(hintList, "samp");
                expect(hintList.indexOf("div")).toBe(-1);
                expect(hintList.indexOf("span")).not.toBe(-1);
            });

            it("should list hints between '<' and some trailing spaces", function () {  // (bug #1515)
                // Replace line 9 with a complete div tag and insert a blank line and the closing div tag.
                testDocument.replaceRange("<div>\n   \n</div>", { line: 9, ch: 2 });
                expect(testDocument.getLine(10)).toBe("   ");

                // Insert a < on line 10
                testDocument.replaceRange("<", { line: 10, ch: 0 });
                testEditor.setCursorPos({ line: 10, ch: 1 });   // cursor between < and some trailing whitespaces
                var hintList = expectHints(HTMLCodeHints.tagHintProvider);
                verifyTagHints(hintList);

                // Replace '< ' on line 10 with '<\t'
                testDocument.replaceRange("<\t", { line: 10, ch: 0 }, { line: 10, ch: 2 });
                testEditor.setCursorPos({ line: 10, ch: 1 });   // cursor between < and some trailing whitespaces
                hintList = expectHints(HTMLCodeHints.tagHintProvider);
                verifyTagHints(hintList);
            });

            //Test for issue #3339
            it("should show HTML hints after HTML Entity on same line", function () {
                testDocument.replaceRange("&nbsp; Test <  ", { line: 8, ch: 0 });
                testEditor.setCursorPos({ line: 8, ch: 13 });   // cursor between < and some trailing whitespaces
                var hintList = expectHints(HTMLCodeHints.tagHintProvider);
                verifyTagHints(hintList);
            });
        });

        describe("Attribute name hint provider", function () {

            it("should list hints at start of existing attribute", function () {
                testEditor.setCursorPos({ line: 5, ch: 6 });
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                verifyAttrHints(hintList);  // expect no filtering (bug #1311)
            });
            it("should list hints within existing attribute", function () {
                testEditor.setCursorPos({ line: 5, ch: 7 });
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "id");  // filtered on "i"
            });
            it("should list hints at end of existing attribute", function () {
                testEditor.setCursorPos({ line: 5, ch: 8 });
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "id");  // filtered on "id"
            });
            it("should list hints at end of existing attribute with whitespace", function () {
                testEditor.setCursorPos({ line: 6, ch: 8 });        // cursor between end of attr ("d") and space
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "id");  // filtered on "id"
            });
            it("should list hints to right of attribute value and a space", function () {
                testEditor.setCursorPos({ line: 6, ch: 18 });        // cursor between space (after attr value) and >
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                verifyAttrHints(hintList);  // expect no filtering
            });

            it("should NOT list hints to right of '=' sign on id attr", function () {
                testEditor.setCursorPos({ line: 5, ch: 9 });
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
            it("should list hints to right of '=' sign", function () {
                testEditor.setCursorPos({ line: 2, ch: 12 });
                expectHints(HTMLCodeHints.attrHintProvider);
            });

            // TODO: Uncomment this after fixing issue #1521
            xit("should NOT list hints to left of '=' sign with whitespace", function () {
                testEditor.setCursorPos({ line: 6, ch: 9 });    // cursor between two spaces before =
                expectNoHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 6, ch: 10 });    // cursor between space and =
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
            it("should NOT list hints to right of '=' sign with whitespace on id attr", function () {
                testEditor.setCursorPos({ line: 6, ch: 11 });   // cursor between = and space
                expectNoHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 6, ch: 12 });   // cursor between space and '
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
            it("should list hints to right of '=' sign with whitespace", function () {
                testDocument.setText('<style type = "text/css">');
                testEditor.setCursorPos({ line: 0, ch: 13 });   // cursor between = and space
                expectHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 0, ch: 14 });   // cursor between space and "
                expectHints(HTMLCodeHints.attrHintProvider);
            });
            it("should NOT list hints to right of attribute value with no separating space", function () {
                testEditor.setCursorPos({ line: 5, ch: 14 });   // cursor between ' and >
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should NOT list hints within tag name", function () {
                testEditor.setCursorPos({ line: 5, ch: 3 });   // cursor between < and start of tag name ("h")
                expectNoHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 5, ch: 4 });   // cursor in middle of tag name
                expectNoHints(HTMLCodeHints.attrHintProvider);

                // two cases for end of tag name:
                testEditor.setCursorPos({ line: 5, ch: 5 });   // cursor between end of tag name ("1") and space
                expectNoHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 7, ch: 4 });   // cursor between end of tag name ("p") and >
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
            it("should list hints to right of tag name and a space", function () {  // (bug #1310)
                testDocument.replaceRange(" ", { line: 7, ch: 4 });  // insert a space: "<p>" -> "<p >"

                testEditor.setCursorPos({ line: 7, ch: 5 });   // cursor between space and >
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                verifyAttrHints(hintList);  // expect no filtering
            });
            it("should list hints between tag name and attribute name (space on both sides of cursor)", function () {
                testDocument.replaceRange(" ", { line: 5, ch: 5 });  // insert a space: "<h1 id" -> "<h1  id"

                testEditor.setCursorPos({ line: 5, ch: 6 });   // cursor between two spaces, which are between end of tag name ("p") and start of attribute name
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                verifyAttrHints(hintList);  // expect no filtering
            });
            it("should list hints between prev attribute value and next attribute name (space on both sides of cursor)", function () {
                testDocument.replaceRange(" ", { line: 8, ch: 14 });  // insert a space: "'aaa' class" -> "'aaa'  class"

                testEditor.setCursorPos({ line: 8, ch: 15 });   // cursor between two spaces, which are between end of attribute value ("p") and start of attribute name
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                verifyAttrHints(hintList);  // expect no filtering
            });

            it("should NOT list hints to left of tag", function () {
                testEditor.setCursorPos({ line: 4, ch: 0 });    // tag starting at column zero
                expectNoHints(HTMLCodeHints.attrHintProvider);

                testEditor.setCursorPos({ line: 5, ch: 2 });    // tag with whitespace indent after it
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
            it("should NOT list hints within text content or whitespace", function () {
                testEditor.setCursorPos({ line: 5, ch: 0 });    // whitespace
                expectNoHints(HTMLCodeHints.attrHintProvider);

                testEditor.setCursorPos({ line: 5, ch: 18 });   // plain text content
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should NOT list hints within doctype 'tag'", function () {
                testEditor.setCursorPos({ line: 0, ch: 10 });
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should NOT list hints within closing tag", function () {
                testEditor.setCursorPos({ line: 5, ch: 23 });   // cursor between < and /
                expectNoHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 5, ch: 24 });   // cursor between / and start of tag name ("h")
                expectNoHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 5, ch: 25 });   // cursor in middle of tag name
                expectNoHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 5, ch: 26 });   // cursor between end of tag name ("1") and >  (bug #1335)
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should NOT list hints between begin 'div' and end 'div' tag", function () {  // (bug #1510)
                // replace line 9 with a complete div tag and insert a blank line and the closing div tag.
                testDocument.replaceRange("<div>\n   \n  </div>", { line: 9, ch: 2 });

                testEditor.setCursorPos({ line: 10, ch: 2 });   // cursor between whitespaces on the newly inserted blank line
                expectNoHints(HTMLCodeHints.attrHintProvider);

                testEditor.setCursorPos({ line: 9, ch: 7 });   // cursor to the right of <div>
                expectNoHints(HTMLCodeHints.attrHintProvider);

                testEditor.setCursorPos({ line: 11, ch: 2 });   // cursor to the left of </div>
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should NOT list hints between an empty tag and 'body' end tag", function () {  // (bug #1519)
                // replace line 9 with an input tag and insert two extra blank lines with some whitespaces.
                testDocument.replaceRange("<input type='button' />\n  \n   ", { line: 9, ch: 2 }, { line: 9, ch: 7 });

                // Set cursor between whitespaces on one of the newly inserted blank lines.
                testEditor.setCursorPos({ line: 11, ch: 2 });
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should NOT list hints between the 'body' begin tag and 'h1' begin tag", function () {  // (bug #1519)
                // Insert two blank lines with some whitespaces before line 5.
                testDocument.replaceRange("\n  \n   ", { line: 5, ch: 0 });

                // Set cursor between whitespaces on one of the newly inserted blank lines.
                testEditor.setCursorPos({ line: 7, ch: 2 });
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should NOT list hints between the 'h1' end tag and 'h3' begin tag", function () {  // (bug #1519)
                // Insert two blank lines with some whitespaces before line 5.
                testDocument.replaceRange("\n  \n   ", { line: 6, ch: 0 });

                // Set cursor between whitespaces on one of the newly inserted blank lines.
                testEditor.setCursorPos({ line: 8, ch: 2 });
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should NOT list hints after an HTML comment", function () {  // (bug #1440)
                // replace line 9 with an HTML comment and some spaces
                testDocument.replaceRange("<!-- some comments -->    ", { line: 9, ch: 2 });

                testEditor.setCursorPos({ line: 9, ch: 25 });   // cursor between whitespaces at the end of line 9
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should list hints on incomplete tag, after tag name", function () {
                testEditor.setCursorPos({ line: 9, ch: 7 });
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);

                verifyAttrHints(hintList);  // expect no filtering
            });
            it("should NOT list hints on incomplete tag, at end of tag name", function () {
                testEditor.setCursorPos({ line: 9, ch: 5 });    // end of tag name
                expectNoHints(HTMLCodeHints.attrHintProvider);

                testEditor.setCursorPos({ line: 9, ch: 6 });    // within tag name
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
            it("should NOT list hints to left of incomplete tag", function () {
                testEditor.setCursorPos({ line: 9, ch: 2 });
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should list hints on incomplete attribute", function () {
                testDocument.replaceRange("i", { line: 9, ch: 7 });  // insert start of attribute: "<div " -> "<div i"

                testEditor.setCursorPos({ line: 9, ch: 8 });
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                verifyAttrHints(hintList, "id");  // filtered on "i"
            });
        });

        describe("Attribute value hint provider", function () {

            it("should list attribute value hints for a single quote after the equal sign", function () {
                testDocument.replaceRange(" dir='", { line: 7, ch: 4 });  // insert dir=' between <p and >

                testEditor.setCursorPos({ line: 7, ch: 10 });       // set cursor right after dir='
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                expect(hintList.indexOf("ltr")).not.toBe(-1);       // additional sanity check
            });
            it("should list attribute value hints within an existing attribute value", function () {
                testDocument.replaceRange(" dir=\"ltr\"", { line: 7, ch: 4 });  // insert dir="ltr" between <p and >

                testEditor.setCursorPos({ line: 7, ch: 11 });       // set cursor right after dir="l
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                expect(hintList.indexOf("ltr")).not.toBe(-1);       // additional sanity check
            });
            it("should list attribute value hints within an unquoted attribute value", function () {
                testDocument.replaceRange(" dir=ltr", { line: 7, ch: 4 });  // insert dir=ltr between <p and >

                testEditor.setCursorPos({ line: 7, ch: 10 });       // set cursor right after dir=l
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                expect(hintList.indexOf("ltr")).not.toBe(-1);       // additional sanity check
            });

            it("should list sorted boolean attribute value hints", function () {
                testDocument.replaceRange(" spellcheck=\"", { line: 7, ch: 4 });  // insert spellcheck=" between <p and >

                testEditor.setCursorPos({ line: 7, ch: 17 });       // set cursor right after spellcheck="
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                expect(hintList.indexOf("false")).toBe(0);
                expect(hintList.indexOf("true")).toBe(1);
                expect(hintList.length).toBe(2);
            });

            it("should NOT list attribute value hints to the right of a closing double quote", function () {
                testDocument.replaceRange(" dir=\"ltr\"", { line: 7, ch: 4 });  // insert dir="ltr" between <p and >

                testEditor.setCursorPos({ line: 7, ch: 14 });       // set cursor right after dir="ltr"
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
            it("should NOT list attribute value hints to the right of a closing single quote", function () {
                testDocument.replaceRange(" dir='ltr'", { line: 6, ch: 5 });  // insert dir='ltr' between <h3 and id

                testEditor.setCursorPos({ line: 4, ch: 15 });       // set cursor right after dir='ltr'
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should list attribute value hints for type attribute of style tag", function () {
                // set cursor to the right of type attribute but before the closing quote
                testEditor.setCursorPos({ line: 2, ch: 21 });
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                expect(hintList.indexOf("text/css")).not.toBe(-1);
            });
            it("should NOT list any attribute value for type attribute of embed tag", function () {
                // set cursor to the right of type attribute but before the closing quote
                testEditor.setCursorPos({ line: 9, ch: 3 });
                // Replace div on line 9 with embed type=' ("<div " --> "<embed type='")
                testDocument.replaceRange("embed type='", { line: 9, ch: 3 }, { line: 9, ch: 7 });
                testEditor.setCursorPos({ line: 9, ch: 15 });
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });

            it("should NOT list any attribute value for an unknown attribute name", function () {
                testDocument.replaceRange("foo='", { line: 9, ch: 7 });  // insert foo=' after <div tag
                testEditor.setCursorPos({ line: 9, ch: 12 });
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
        });


        // CodeMirror doesn't correctly support valueless attributes, so none of them are included in the default
        // test content above
        describe("Valueless attributes", function () {

            it("should list hints after valueless attribute", function () {  // (bug #1313)
                testDocument.replaceRange("  <input checked >\n", { line: 9, ch: 0 });  // insert new line

                testEditor.setCursorPos({ line: 9, ch: 17 });   // cursor between space and >
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);

                // Expect no filtering - however, we offer some attributes (including first in the list) that
                // are specific to the <input> tag, so we can't use the default "no filtering" empty arg here.
                // (This smart filtering isn't officially part of the release, so no unit tests specifically
                // targeting that functionality yet).
                verifyAttrHints(hintList, "accept");
            });

            it("should list hints after attribute that follows a valueless attribute", function () {  // (bug #1313)
                testDocument.replaceRange("  <input checked accept='' >\n", { line: 9, ch: 0 });  // insert new line

                testEditor.setCursorPos({ line: 9, ch: 27 });   // cursor between space and >
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);

                // "accept" will get filtered and won't be the first one in the hints.
                verifyAttrHints(hintList);
            });

            it("should list attribute value hints for an attribute that follows a valueless attribute", function () {  // (bug #2804)
                testDocument.replaceRange("  <input checked accept='' >\n", { line: 9, ch: 0 });  // insert new line

                // cursor between quotes of accept attribute
                testEditor.setCursorPos({ line: 9, ch: 25 });
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);

                verifyAttrHints(hintList, "application/msexcel");

                // cursor between equal sign and opening quote of accept attribute
                testEditor.setCursorPos({ line: 9, ch: 24 });
                hintList = expectHints(HTMLCodeHints.attrHintProvider);

                verifyAttrHints(hintList, "application/msexcel");
            });

            it("should NOT list attribute value hints when the cursor is after the end quote of an attribute value", function () {
                testDocument.replaceRange("  <input checked accept='' >\n", { line: 9, ch: 0 });  // insert new line

                // Set cursor after the closing quote of accept attribute
                testEditor.setCursorPos({ line: 9, ch: 26 });
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
        });


        describe("Attribute insertion", function () {

            function selectHint(provider, expectedHint) {
                var hintList = expectHints(provider);
                expect(hintList.indexOf(expectedHint)).not.toBe(-1);
                return provider.insertHint(expectedHint);
            }

            // Helper function for testing cursor position
            function expectCursorAt(pos) {
                var selection = testEditor.getSelection();
                expect(selection.start).toEqual(selection.end);
                expect(selection.start).toEqual(pos);
            }

            it("should insert =\"\" after attribute", function () {
                testEditor.setCursorPos({ line: 6, ch: 18 });   // cursor between space and >
                selectHint(HTMLCodeHints.attrHintProvider, "class");
                expect(testDocument.getLine(6)).toBe("  <h3 id  = 'bar' class=\"\">Subheading</h3>");
                expectCursorAt({ line: 6, ch: 25 });            // cursor between the two "s
            });

            it("should make explicit request for new hints after attribute name has been inserted", function () {
                testEditor.setCursorPos({ line: 6, ch: 18 });   // cursor between space and >
                expect(selectHint(HTMLCodeHints.attrHintProvider, "dir")).toBe(true); // returning 'true' from insertHint (which is called by selectHint helper) initiates a new explicit hint request
                expect(testDocument.getLine(6)).toBe("  <h3 id  = 'bar' dir=\"\">Subheading</h3>");
            });

            it("should NOT insert =\"\" after valueless attribute", function () {
                testDocument.replaceRange("  <input \n", { line: 9, ch: 0 });  // insert new line

                testEditor.setCursorPos({ line: 9, ch: 9 });    // cursor after trailing space
                selectHint(HTMLCodeHints.attrHintProvider, "checked");
                expect(testDocument.getLine(9)).toBe("  <input checked");
                expectCursorAt({ line: 9, ch: 16 });            // cursor at end of attr name
            });

            it("should insert a new attribute before the existing one that starts at cursor", function () {  // (bug #1312)
                testEditor.setCursorPos({ line: 5, ch: 6 });    // cursor between space and start of existing attribute name ("id")
                selectHint(HTMLCodeHints.attrHintProvider, "class");
                expect(testDocument.getLine(5)).toBe("  <h1 class=\"\"id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 13 });            // cursor between two double-quotes
            });
            it("should change nothing when cursor at end", function () {  // (bug #1314)
                testEditor.setCursorPos({ line: 5, ch: 8 });    // cursor between end of existing attribute name ("id") and =
                selectHint(HTMLCodeHints.attrHintProvider, "id");
                expect(testDocument.getLine(5)).toBe("  <h1 id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 8 });            // cursor stays at end of attr name
            });

            it("should insert a valueless attribute before the existing attribute that starts at cursor", function () {
                testDocument.replaceRange("  <input id='foo'>\n", { line: 9, ch: 0 });  // insert new line

                testEditor.setCursorPos({ line: 9, ch: 9 });    // cursor after between "i" and "d"
                selectHint(HTMLCodeHints.attrHintProvider, "checked");
                expect(testDocument.getLine(9)).toBe("  <input checkedid='foo'>");
                expectCursorAt({ line: 9, ch: 16 });            // cursor between end of attr name and =
            });

            it("should insert a new atribute with an empty value before the existing valueless attribute", function () {
                testDocument.replaceRange("  <input checked>\n", { line: 9, ch: 0 });  // insert new line

                testEditor.setCursorPos({ line: 9, ch: 9 });    // cursor after trailing space
                selectHint(HTMLCodeHints.attrHintProvider, "class");
                expect(testDocument.getLine(9)).toBe("  <input class=\"\"checked>");
                expectCursorAt({ line: 9, ch: 16 });            // cursor between the two "s
            });

            it("should insert the selected attribute value with the closing (single) quote", function () {
                testDocument.replaceRange("dir='", { line: 9, ch: 7 });  // insert dir=' after <div tag
                testEditor.setCursorPos({ line: 9, ch: 12 });
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(9)).toBe("  <div dir='rtl'");
                expectCursorAt({ line: 9, ch: 16 });            // cursor after the closing quote
            });

            it("should insert the selected attribute value with the closing (double) quote", function () {
                testDocument.replaceRange("dir=\"", { line: 9, ch: 7 });  // insert dir=" after <div tag
                testEditor.setCursorPos({ line: 9, ch: 12 });
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(9)).toBe("  <div dir=\"rtl\"");
                expectCursorAt({ line: 9, ch: 16 });            // cursor after the closing quote
            });

            it("should insert the selected attribute value inside the existing quotes", function () {
                testDocument.replaceRange("dir=\"\"", { line: 9, ch: 7 });  // insert dir="" after <div tag
                testEditor.setCursorPos({ line: 9, ch: 12 });
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(9)).toBe("  <div dir=\"rtl\"");
                expectCursorAt({ line: 9, ch: 16 });            // cursor after the closing quote
            });

            it("should insert the selected attribute value wrapped in double quotes", function () {
                testDocument.replaceRange("dir=", { line: 9, ch: 7 });  // insert dir= after <div tag
                testEditor.setCursorPos({ line: 9, ch: 11 });
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(9)).toBe("  <div dir=\"rtl\"");
                expectCursorAt({ line: 9, ch: 16 });            // cursor after the closing quote
            });

            it("should replace the partially typed attribute value with the selected attribute value", function () {
                testDocument.replaceRange("dir=\"lt", { line: 9, ch: 7 });  // insert dir="lt after <div tag
                testEditor.setCursorPos({ line: 9, ch: 14 });
                selectHint(HTMLCodeHints.attrHintProvider, "ltr");
                expect(testDocument.getLine(9)).toBe("  <div dir=\"ltr\"");
                expectCursorAt({ line: 9, ch: 16 });            // cursor after the closing quote
            });

            it("should replace the partially typed attribute value with the selected attribute value", function () {
                testDocument.replaceRange("dir=lt", { line: 9, ch: 7 });  // insert dir="lt after <div tag
                testEditor.setCursorPos({ line: 9, ch: 13 });
                selectHint(HTMLCodeHints.attrHintProvider, "ltr");
                expect(testDocument.getLine(9)).toBe("  <div dir=ltr");
                expectCursorAt({ line: 9, ch: 14 });            // cursor after the closing quote
            });

            it("should replace an existing attribute value with the selected attribute value", function () {
                // Intentionally change the type of style attribute to an invalid value by replacing
                // "css" with "javascript".
                testDocument.replaceRange("javascript", { line: 2, ch: 18 }, { line: 2, ch: 21 });
                testEditor.setCursorPos({ line: 2, ch: 18 });
                selectHint(HTMLCodeHints.attrHintProvider, "text/css");
                expect(testDocument.getLine(2)).toBe("<style type=\"text/css\">");
                expectCursorAt({ line: 2, ch: 22 });            // cursor after the closing quote
            });

            it("should replace a quoted attribute value and keep the preceding space and quotes", function () {
                // Insert an unquoted attribute between <div and id on line 5.
                testDocument.replaceRange("dir= \"ltr\" ", { line: 5, ch: 6 });
                testEditor.setCursorPos({ line: 5, ch: 10 });   // Set the cursor between = and the space
                // Select "rtl" to replace "ltr"
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(5)).toBe("  <h1 dir= \"rtl\" id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 16 });            // cursor after the closing quote

                testEditor.setCursorPos({ line: 5, ch: 11 });   // Set the cursor between the space and the begin quote
                // Select "ltr" to replace "rtl"
                selectHint(HTMLCodeHints.attrHintProvider, "ltr");
                expect(testDocument.getLine(5)).toBe("  <h1 dir= \"ltr\" id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 16 });            // cursor after the closing quote
            });

            it("should replace the unquoted attribute value with the selected attribute value in quotes", function () {
                // Insert an unquoted attribute between <div and id on line 5.
                testDocument.replaceRange("dir=ltr ", { line: 5, ch: 6 });
                testEditor.setCursorPos({ line: 5, ch: 10 });
                // Select "rtl" to replace "ltr"
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(5)).toBe("  <h1 dir=\"rtl\" id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 15 });            // cursor after the inserted value
            });

            it("should replace an unquoted attribute value when the cursor is inside that value", function () {
                // Insert an unquoted attribute between <div and id on line 5.
                // intentionally have an invalid attribute lttr here
                testDocument.replaceRange("dir= lttr ", { line: 5, ch: 6 });
                testEditor.setCursorPos({ line: 5, ch: 12 });   // Set cursor after l in the invalid attribute value
                selectHint(HTMLCodeHints.attrHintProvider, "ltr");
                expect(testDocument.getLine(5)).toBe("  <h1 dir= ltr id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 14 });            // cursor after the inserted value
            });

            it("should insert a quoted attribute value before an existing unquoted attribute value with preceding space character", function () {
                // Insert an unquoted attribute between <div and id on line 5.
                testDocument.replaceRange("dir= ltr ", { line: 5, ch: 6 });
                testEditor.setCursorPos({ line: 5, ch: 10 }); // Set cursor between = and the space
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(5)).toBe("  <h1 dir=\"rtl\" ltr id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 15 });          // cursor after the inserted value
            });

            it("should insert a quoted attribute value before an existing id attribute", function () {
                // Insert an unquoted attribute between <div and id on line 5.
                testDocument.replaceRange("dir= ", { line: 5, ch: 6 });
                testEditor.setCursorPos({ line: 5, ch: 10 }); // Set cursor between = and the space
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(5)).toBe("  <h1 dir=\"rtl\" id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 15 });          // cursor after the inserted value
            });

            it("should insert a quoted attribute value right before the closing > of the tag", function () {
                // Insert an unquoted attribute between <p and > on line 7.
                testDocument.replaceRange(" dir=", { line: 7, ch: 4 });
                testEditor.setCursorPos({ line: 7, ch: 9 }); // Set cursor between = and >
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(7)).toBe("  <p dir=\"rtl\"></p>");
                expectCursorAt({ line: 7, ch: 14 });         // cursor after the inserted value
            });

            it("should insert a quoted attribute value without overwriting the closing > of the tag", function () {
                // Insert an attribute value right before > on line 7 with an opening double quote that
                // creates an inbalanced string up to the first attribute value in the next tag.
                testDocument.replaceRange("<a dir=\"><span class=\"foo\"></span></a>", { line: 7, ch: 2 }, { line: 7, ch: 9 });
                testEditor.setCursorPos({ line: 7, ch: 10 }); // Set cursor between dir=" and >
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(7)).toBe("  <a dir=\"rtl\"><span class=\"foo\"></span></a>");
                expectCursorAt({ line: 7, ch: 14 });          // cursor after the inserted value
            });
        });


    }); // describe("HTML Code Hinting"
});
