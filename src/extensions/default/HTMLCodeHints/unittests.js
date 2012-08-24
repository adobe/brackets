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
/*global define, describe, it, expect, beforeEach, afterEach, waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils"),
        Editor          = brackets.getModule("editor/Editor").Editor;
    
    // Modules from testWindow
    var HTMLCodeHints, CodeHintManager;

    describe("HTML Attribute Hinting", function () {

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
        
        var testWindow;
        var testDocument, testEditor;
        
        beforeEach(function () {
            // Create a new window that will be shared by ALL tests in this spec.
            // (We need the tests to run in a real Brackets window since HTMLCodeHints requires various core modules (it can't
            // run 100% in isolation), but popping a new window per testcase is unneeded overhead).
            if (!testWindow) {
                SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                    testWindow = w;
                    
                    // Get access to the extension's module, so we can unit-test its APIs directly
                    var extensionRequire = testWindow.brackets.getModule("utils/ExtensionLoader").getRequireContextForExtension("HTMLCodeHints");
                    HTMLCodeHints = extensionRequire("main");
                    CodeHintManager = testWindow.brackets.getModule("editor/CodeHintManager");
                });
                
                // Once entire spec has finished, then close the window
                this.after(function () {
                    SpecRunnerUtils.closeTestWindow();
                });
            }
            
            // Create a new, clean-slate Editor for each test
            runs(function () {
                // create dummy Document for the Editor
                testDocument = SpecRunnerUtils.createMockDocument(defaultContent);
                
                // create Editor instance (containing a CodeMirror instance)
                $("body").append("<div id='editor'/>");
                testEditor = new Editor(testDocument, true, "htmlmixed", $("#editor").get(0), {});
            });
        });
        
        afterEach(function () {
            testEditor.destroy();
            testEditor = null;
            $("#editor").remove();
            testDocument = null;
        });
        
        
        // Ask provider for hints at current cursor position; expect it to return some
        function expectHints(provider) {
            var query = provider.getQueryInfo(testEditor, testEditor.getCursorPos());
            expect(query).toBeTruthy();
            expect(query.queryStr).not.toBeNull();
            
            var hintList = provider.search(query);
            expect(hintList).toBeTruthy();
            
            return hintList;
        }
        
        // Ask provider for hints at current cursor position; expect it NOT to return any
        function expectNoHints(provider) {
            var query = provider.getQueryInfo(testEditor, testEditor.getCursorPos());
            expect(query).toBeTruthy();
            expect(query.queryStr).toBeNull();
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
        });
        
        describe("Attribute hint provider", function () {
            
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
            
            it("should list hints to right of '=' sign", function () {
                testEditor.setCursorPos({ line: 5, ch: 9 });
                expectHints(HTMLCodeHints.attrHintProvider);
            });
            it("should NOT list hints to left of '=' sign with whitespace", function () {
                testEditor.setCursorPos({ line: 6, ch: 9 });    // cursor between two spaces before =
                expectNoHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 6, ch: 10 });    // cursor between space and =
                expectNoHints(HTMLCodeHints.attrHintProvider);
            });
            it("should list hints to right of '=' sign with whitespace", function () {
                testEditor.setCursorPos({ line: 6, ch: 11 });   // cursor between = and space
                expectHints(HTMLCodeHints.attrHintProvider);
                testEditor.setCursorPos({ line: 6, ch: 12 });   // cursor between space and '
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
            
            it("should list attribute value hints for a single quote after the equal sign", function () {
                testDocument.replaceRange(" dir='", { line: 7, ch: 4 });  // insert dir=' between <p and >
                
                testEditor.setCursorPos({ line: 7, ch: 10 });       // set cursor right after dir='
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                expect(hintList.indexOf("ltr")).not.toBe(-1);       // additional sanity check
            });
            it("should list sorted boolean attribute value hints", function () {
                testDocument.replaceRange(" spellcheck=\"", { line: 7, ch: 4 });  // insert spellcheck=" between <p and >
                
                testEditor.setCursorPos({ line: 7, ch: 17 });       // set cursor right after spellcheck="
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                expect(hintList.indexOf("false")).toBe(0);
                expect(hintList.indexOf("true")).toBe(1);
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
            
            it("should list attribute value hints for type attribute of script tag", function () {
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
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                expect(hintList.length).toBe(0);
            });

            it("should NOT list any attribute value for an unknown attribute name", function () {
                testDocument.replaceRange("foo='", { line: 9, ch: 7 });  // insert foo=' after <div tag
                testEditor.setCursorPos({ line: 9, ch: 12 });
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                expect(hintList.length).toBe(0);
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
                // (This smart filtering isn't officially part of the sprint, so no unit tests specifically
                // targeting that functionality yet).
                verifyAttrHints(hintList, "accept");
            });
            
            it("should list hints after attribute that follows a valueless attribute", function () {  // (bug #1313)
                testDocument.replaceRange("  <input checked accept='' >\n", { line: 9, ch: 0 });  // insert new line
                
                testEditor.setCursorPos({ line: 9, ch: 27 });   // cursor between space and >
                var hintList = expectHints(HTMLCodeHints.attrHintProvider);
                
                verifyAttrHints(hintList, "accept");  // expect no filtering (see note above)
            });
            
        });
        
        
        describe("Attribute insertion", function () {
            
            function selectHint(provider, expectedHint) {
                var hintList = expectHints(provider);
                expect(hintList.indexOf(expectedHint)).not.toBe(-1);
                provider.handleSelect(expectedHint, testEditor, testEditor.getCursorPos());
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
            
            it("should pop up attribute value hints after attribute name has been inserted", function () {
                testEditor.setCursorPos({ line: 6, ch: 18 });   // cursor between space and >
                selectHint(HTMLCodeHints.attrHintProvider, "dir");
                expect(testDocument.getLine(6)).toBe("  <h3 id  = 'bar' dir=\"\">Subheading</h3>");
                expect(CodeHintManager._getCodeHintList()).toBeTruthy();
                expect(CodeHintManager._getCodeHintList().isOpen()).toBe(true);
            });
            
            it("should NOT insert =\"\" after valueless attribute", function () {
                testDocument.replaceRange("  <input \n", { line: 9, ch: 0 });  // insert new line
                
                testEditor.setCursorPos({ line: 9, ch: 9 });    // cursor after trailing space
                selectHint(HTMLCodeHints.attrHintProvider, "checked");
                expect(testDocument.getLine(9)).toBe("  <input checked");
                expectCursorAt({ line: 9, ch: 16 });            // cursor at end of attr name
            });
            
            it("should overwrite attribute but not change value, cursor at start", function () {  // (bug #1312)
                testEditor.setCursorPos({ line: 5, ch: 6 });    // cursor between space and start of existing attribute name ("id")
                selectHint(HTMLCodeHints.attrHintProvider, "class");
                expect(testDocument.getLine(5)).toBe("  <h1 class='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 11 });            // cursor at end of attr name
            });
            it("should change nothing when cursor at end", function () {  // (bug #1314)
                testEditor.setCursorPos({ line: 5, ch: 8 });    // cursor between end of existing attribute name ("id") and =
                selectHint(HTMLCodeHints.attrHintProvider, "id");
                expect(testDocument.getLine(5)).toBe("  <h1 id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 8 });            // cursor stays at end of attr name
            });
            
            it("should overwrite attribute with valueless attribute, but still not change value", function () {
                testDocument.replaceRange("  <input id='foo'>\n", { line: 9, ch: 0 });  // insert new line
                
                testEditor.setCursorPos({ line: 9, ch: 9 });    // cursor after trailing space
                selectHint(HTMLCodeHints.attrHintProvider, "checked");
                expect(testDocument.getLine(9)).toBe("  <input checked='foo'>");
                expectCursorAt({ line: 9, ch: 16 });            // cursor between end of attr name and =
            });
            
            it("should overwrite valueless attribute with normal attribute, adding value", function () {
                testDocument.replaceRange("  <input checked>\n", { line: 9, ch: 0 });  // insert new line
                
                testEditor.setCursorPos({ line: 9, ch: 9 });    // cursor after trailing space
                selectHint(HTMLCodeHints.attrHintProvider, "class");
                expect(testDocument.getLine(9)).toBe("  <input class=\"\">");
                expectCursorAt({ line: 9, ch: 16 });            // cursor between the two "s
            });
 
            it("should insert the selected attribute value with the closing quote", function () {
                testDocument.replaceRange("dir='", { line: 9, ch: 7 });  // insert dir=' after <div tag
                testEditor.setCursorPos({ line: 9, ch: 12 });
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(9)).toBe("  <div dir='rtl'");
                expectCursorAt({ line: 9, ch: 16 });            // cursor after the closing quote
            });
            
            it("should replace the partially typed attribute value with the selected attribute value", function () {
                testDocument.replaceRange("dir=\"lt", { line: 9, ch: 7 });  // insert dir="lt after <div tag
                testEditor.setCursorPos({ line: 9, ch: 14 });
                selectHint(HTMLCodeHints.attrHintProvider, "ltr");
                expect(testDocument.getLine(9)).toBe("  <div dir=\"ltr\"");
                expectCursorAt({ line: 9, ch: 16 });            // cursor after the closing quote
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

            it("should replace the unquoted attribute value with the selected attribute value", function () {
                // Insert an unquoted attribute between <div and id on line 5.
                testDocument.replaceRange("dir=ltr ", { line: 5, ch: 6 });
                testEditor.setCursorPos({ line: 5, ch: 10 });
                // Select "rtl" to replace "ltr"
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(5)).toBe("  <h1 dir=rtl id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 13 });            // cursor after the inserted value
            });

            it("should replace an unquoted attribute value when the cursor is inside that value", function () {
                // Insert an unquoted attribute between <div and id on line 5.
                // intentionally have an invalid attribute lttr here
                testDocument.replaceRange("dir= lttr ", { line: 5, ch: 6 });
                testEditor.setCursorPos({ line: 5, ch: 12 }); // Set cursor between = and the space
                selectHint(HTMLCodeHints.attrHintProvider, "ltr");
                expect(testDocument.getLine(5)).toBe("  <h1 dir= ltr id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 14 });            // cursor after the inserted value
            });

            it("should insert an unquoted attribute value before an existing unquoted attribute value with preceding space character", function () {
                // Insert an unquoted attribute between <div and id on line 5.
                testDocument.replaceRange("dir= ltr ", { line: 5, ch: 6 });
                testEditor.setCursorPos({ line: 5, ch: 10 }); // Set cursor between = and the space
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(5)).toBe("  <h1 dir=rtl ltr id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 13 });            // cursor after the inserted value
            });

            it("should insert an unquoted attribute value before an existing id attribute", function () {
                // Insert an unquoted attribute between <div and id on line 5.
                testDocument.replaceRange("dir= ", { line: 5, ch: 6 });
                testEditor.setCursorPos({ line: 5, ch: 10 }); // Set cursor between = and the space
                selectHint(HTMLCodeHints.attrHintProvider, "rtl");
                expect(testDocument.getLine(5)).toBe("  <h1 dir=rtl id='foo'>Heading</h1>");
                expectCursorAt({ line: 5, ch: 13 });            // cursor after the inserted value
            });
        });
        
        
    }); // describe("HTML Attribute Hinting"
});