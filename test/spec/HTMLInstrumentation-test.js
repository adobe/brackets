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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, describe, beforeEach, afterEach, it, runs, waitsFor, expect, spyOn, xit, xdescribe, jasmine */
/*unittests: HTML Instrumentation*/

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils           = require("file/FileUtils"),
        HTMLInstrumentation = require("language/HTMLInstrumentation"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils"),
        MurmurHash3         = require("thirdparty/murmurhash3_gc");
    
    var testPath = SpecRunnerUtils.getTestPath("/spec/HTMLInstrumentation-test-files"),
        WellFormedFileEntry = new NativeFileSystem.FileEntry(testPath + "/wellformed.html"),
        NotWellFormedFileEntry = new NativeFileSystem.FileEntry(testPath + "/omitEndTags.html"),
        InvalidHTMLFileEntry =  new NativeFileSystem.FileEntry(testPath + "/invalidHTML.html"),
        BigFileEntry = new NativeFileSystem.FileEntry(testPath + "/REC-widgets-20121127.html"),
        editor,
        instrumentedHTML,
        elementCount,
        elementIds = {};
    
    function init(spec, fileEntry) {
        spec.fileContent = null;
        
        if (fileEntry) {
            runs(function () {
                FileUtils.readAsText(fileEntry)
                    .done(function (text) {
                        spec.fileContent = text;
                    });
            });
            
            waitsFor(function () { return (spec.fileContent !== null); }, 1000);
        }
    }
        
    describe("HTML Instrumentation", function () {
        
        function getIdToTagMap(instrumentedHTML, map) {
            var count = 0;
            
            var elementIdRegEx = /<(\w+?)\s+(?:[^<]*?\s)*?data-brackets-id='(\S+?)'/gi,
                match,
                tagID,
                tagName;
            
            do {
                match = elementIdRegEx.exec(instrumentedHTML);
                if (match) {
                    tagID = match[2];
                    tagName = match[1];
                    
                    // Verify that the newly found ID is unique.
                    expect(map[tagID]).toBeUndefined();
                    
                    map[tagID] = tagName.toLowerCase();
                    count++;
                }
            } while (match);
    
            return count;
        }
        
        function checkTagIdAtPos(pos, expectedTag) {
            var tagID = HTMLInstrumentation._getTagIDAtDocumentPos(editor, pos);
            if (!expectedTag) {
                expect(tagID).toBe(-1);
            } else {
                expect(elementIds[tagID]).toBe(expectedTag);
            }
        }
        
        function verifyMarksCreated() {
            var cm    = editor._codeMirror,
                marks = cm.getAllMarks();
                
            expect(marks.length).toBeGreaterThan(0);
        }
        
        // Useful for debugging to see what the mark ranges. Just call it inside one of the following tests.
        function _dumpMarks() {
            var cm = editor._codeMirror,
                marks = cm.getAllMarks();
            marks.sort(function (mark1, mark2) {
                var range1 = mark1.find(), range2 = mark2.find();
                if (range1.from.line === range2.from.line) {
                    return range1.from.ch - range2.from.ch;
                } else {
                    return range1.from.line - range2.from.line;
                }
            });
            marks.forEach(function (mark) {
                if (mark.hasOwnProperty("tagID")) {
                    var range = mark.find();
                    console.log("<" + elementIds[mark.tagID] + "> (" + mark.tagID + ") " +
                                range.from.line + ":" + range.from.ch + " - " + range.to.line + ":" + range.to.ch);
                }
            });
        }
            
        describe("HTML Instrumentation in wellformed HTML", function () {
                
            beforeEach(function () {
                init(this, WellFormedFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "html").editor;
                    expect(editor).toBeTruthy();

                    spyOn(editor.document, "getText").andCallThrough();
                    instrumentedHTML = HTMLInstrumentation.generateInstrumentedHTML(editor.document);
                    elementCount = getIdToTagMap(instrumentedHTML, elementIds);
                    
                    if (elementCount) {
                        HTMLInstrumentation._markText(editor);
                        verifyMarksCreated();
                    }
                });
            });
    
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
                instrumentedHTML = "";
                elementCount = 0;
                elementIds = {};
            });
            
            it("should instrument all start tags except some empty tags", function () {
                runs(function () {
                    expect(elementCount).toEqual(15);
                });
            });
            
            it("should have created cache and never call document.getText() again", function () {
                runs(function () {
                    // scanDocument call here is to test the cache.                    
                    // HTMLInstrumentation.generateInstrumentedHTML call in "beforeEach"
                    // in turn calls scanDocument. Each function calls document.getText once
                    // and hence we've already had 2 calls from "beforeEach", but the following
                    // call should not call it again.
                    HTMLInstrumentation.scanDocument(editor.document);
                    expect(editor.document.getText.callCount).toBe(2);
                });
            });
            
            it("should have recreated cache when document timestamp is different", function () {
                runs(function () {
                    // update document timestamp with current time.
                    editor.document.diskTimestamp = new Date();
                    
                    // This is an intentional repeat call to recreate the cache.
                    HTMLInstrumentation.scanDocument(editor.document);

                    // 2 calls from generateInstrumentedHTML call and one call 
                    // from above scanDocument call. so total is 3.
                    expect(editor.document.getText.callCount).toBe(3);
                });
            });
            
            it("should get 'img' tag for cursor positions inside img tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 37, ch: 4 }, "img");     // before <img
                    checkTagIdAtPos({ line: 37, ch: 95 }, "img");    // after />
                    checkTagIdAtPos({ line: 37, ch: 65 }, "img");    // inside src attribute value
                });
            });

            it("should get the parent 'a' tag for cursor positions between 'img' and its parent 'a' tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 37, ch: 1 }, "a");    // before "   <img"
                    checkTagIdAtPos({ line: 38, ch: 0 }, "a");    // before </a>
                });
            });

            it("No tag at cursor positions outside of the 'html' tag", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 0, ch: 4 }, "");    // inside 'doctype' tag
                    checkTagIdAtPos({ line: 41, ch: 0 }, "");  // after </html>
                });
            });

            it("Should get parent tag (body) for all cursor positions inside an html comment", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 15, ch: 1 }, "body");  // cursor between < and ! in the comment start
                    checkTagIdAtPos({ line: 16, ch: 15 }, "body");
                    checkTagIdAtPos({ line: 17, ch: 3 }, "body");  // cursor after -->
                });
            });

            it("should get 'meta/link' tag for cursor positions in meta/link tags, not 'head' tag", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 5, ch: 64 }, "meta");
                    checkTagIdAtPos({ line: 8, ch: 12 }, "link");
                });
            });

            it("Should get 'title' tag at cursor positions (either in the content or begin/end tag)", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 6, ch: 11 }, "title"); // inside the begin tag
                    checkTagIdAtPos({ line: 6, ch: 30 }, "title"); // in the content
                    checkTagIdAtPos({ line: 6, ch: 50 }, "title"); // inside the end tag
                });
            });

            it("Should get 'h2' tag at cursor positions (either in the content or begin or end tag)", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 13, ch: 1 }, "h2"); // inside the begin tag
                    checkTagIdAtPos({ line: 13, ch: 20 }, "h2"); // in the content
                    checkTagIdAtPos({ line: 13, ch: 27 }, "h2"); // inside the end tag
                });
            });
        });

        describe("HTML Instrumentation in valid but not wellformed HTML", function () {
                
            beforeEach(function () {
                init(this, NotWellFormedFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "html").editor;
                    expect(editor).toBeTruthy();

                    instrumentedHTML = HTMLInstrumentation.generateInstrumentedHTML(editor.document);
                    elementCount = getIdToTagMap(instrumentedHTML, elementIds);

                    if (elementCount) {
                        HTMLInstrumentation._markText(editor);
                        verifyMarksCreated();
                    }
                });
            });
    
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
                instrumentedHTML = "";
                elementCount = 0;
                elementIds = {};
            });
            
            it("should instrument all start tags except some empty tags", function () {
                runs(function () {
                    expect(elementCount).toEqual(43);
                });
            });

            it("should get 'p' tag for cursor positions before the succeding start tag of an unclosed 'p' tag", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 8, ch: 36 }, "p");   // at the end of the line that has p start tag
                    checkTagIdAtPos({ line: 8, ch: 2 }, "p");    // at the beginning of the <p>
                    checkTagIdAtPos({ line: 8, ch: 4 }, "p");    // inside <p> tag
                    checkTagIdAtPos({ line: 8, ch: 5 }, "p");    // after <p> tag
                    checkTagIdAtPos({ line: 9, ch: 0 }, "p");    // before <h1> tag, but considered to be the end of 'p' tag
                });
            });

            it("should get 'h1' tag for cursor positions inside 'h1' that is following an unclosed 'p' tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 9, ch: 20 }, "h1");  // inside text content of h1 tag
                    checkTagIdAtPos({ line: 9, ch: 52 }, "h1");  // inside </h1>
                });
            });

            it("should get 'wbr' tag for cursor positions inside <wbr>, not its parent 'h1' tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 9, ch: 10 }, "wbr");  // inside <wbr> that is in h1 content
                });
            });

            it("should get 'li' tag for cursor positions inside the content of an unclosed 'li' tag", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 12, ch: 12 }, "li");   // inside first list item
                    checkTagIdAtPos({ line: 14, ch: 12 }, "li");   // inside third list item
                    checkTagIdAtPos({ line: 15, ch: 0 }, "li");    // before </ul> tag that follows an unclosed 'li'
                });
            });

            it("should get 'br' tag for cursor positions inside <br>, not its parent 'li' tag", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 13, ch: 22 }, "br");   // inside the <br> tag of the second list item
                });
            });

            it("should get 'ul' tag for cursor positions within 'ul' but outside of any unclosed 'li'.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 12, ch: 0 }, "ul");  // before first '<li>' tag
                    checkTagIdAtPos({ line: 15, ch: 8 }, "ul");  // inside </ul>
                });
            });

            it("should get 'table' tag for cursor positions that are not in any unclosed child tags", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 17, ch: 17 }, "table");   // inside an attribute of table tag
                    checkTagIdAtPos({ line: 32, ch: 6 }, "table");    // inside </table> tag
                });
            });
            
            it("should get 'tr' tag for cursor positions between child tags", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 21, ch: 0 }, "tr");    // after a 'th' but before the start tag of another one 
                });
            });

            it("should get 'input' tag for cursor positions inside one of the 'input' tags.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 34, ch: 61 }, "input");   // at the end of first input tag
                    checkTagIdAtPos({ line: 35, ch: 4 }, "input");    // at the first position of the 2nd input tag
                });
            });
            it("should get 'option' tag for cursor positions in any unclosed 'option' tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 40, ch: 0 }, "option");   // before second '<option>' tag
                    checkTagIdAtPos({ line: 41, ch: 28 }, "option");  // after third option tag that is unclosed
                });
            });

            it("should NOT get 'option' tag for cursor positions in the parent tags of an unclosed 'option'.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 42, ch: 5 }, "select");   // inside '</select>' tag
                    checkTagIdAtPos({ line: 43, ch: 5 }, "form");     // inside '</form>' tag
                });
            });

            it("should get 'label' tag for cursor positions in the 'label' tag or its content.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 37, ch: 17 }, "label");   // in the attribute of 'label' tag
                    checkTagIdAtPos({ line: 37, ch: 49 }, "label");   // in the text content
                    checkTagIdAtPos({ line: 37, ch: 55 }, "label");   // in the end 'label' tag
                });
            });

            it("should get 'form' tag for cursor positions NOT in any form element.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 35, ch: 0 }, "form");    // between two input tags
                    checkTagIdAtPos({ line: 43, ch: 2 }, "form");    // before </form> tag
                });
            });

            it("should get 'hr' tag for cursor positions in <hr> tag, not its parent <form> tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 36, ch: 6 }, "hr");    // inside <hr>
                });
            });

            it("should get 'script' tag for cursor positions anywhere inside the tag including CDATA.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 46, ch: 6 }, "script");   // before '<' of CDATA
                    checkTagIdAtPos({ line: 48, ch: 7 }, "script");   // right before '>' of CDATA
                    checkTagIdAtPos({ line: 45, ch: 18 }, "script");  // inside an attribute value of 'script' tag
                    checkTagIdAtPos({ line: 47, ch: 20 }, "script");  // before '<' of a literal string                  
                    checkTagIdAtPos({ line: 49, ch: 9 }, "script");   // inside 'script' end tag
                });
            });

            it("should get 'footer' tag that is explicitly using all uppercase tag names.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 50, ch: 3 }, "footer");    // in <FOOTER>
                    checkTagIdAtPos({ line: 50, ch: 20 }, "footer");   // in the text content
                    checkTagIdAtPos({ line: 50, ch: 30 }, "footer");   // in </FOOTER>
                });
            });
            
            it("should get 'body' for text after an h1 that closed a previous uncleosd paragraph", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 53, ch: 2 }, "body"); // in the text content after the h1
                });
            });
        });

        describe("HTML Instrumentation in an HTML page with some invalid markups", function () {
                
            beforeEach(function () {
                init(this, InvalidHTMLFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "html").editor;
                    expect(editor).toBeTruthy();

                    instrumentedHTML = HTMLInstrumentation.generateInstrumentedHTML(editor.document);
                    elementCount = getIdToTagMap(instrumentedHTML, elementIds);

                    if (elementCount) {
                        HTMLInstrumentation._markText(editor);
                        verifyMarksCreated();
                    }
                });
            });
    
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
                instrumentedHTML = "";
                elementCount = 0;
                elementIds = {};
            });
            
            it("should instrument all start tags except some empty tags", function () {
                runs(function () {
                    expect(elementCount).toEqual(39);
                });
            });

            it("should get 'script' tag for cursor positions anywhere inside the tag including CDATA.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 6, ch: 11 }, "script");   // before '<' of CDATA
                    checkTagIdAtPos({ line: 8, ch: 12 }, "script");   // right before '>' of CDATA
                    checkTagIdAtPos({ line: 5, ch: 33 }, "script");   // inside an attribute value of 'script' tag
                    checkTagIdAtPos({ line: 7, ch: 25 }, "script");   // after '<' of a literal string                  
                    checkTagIdAtPos({ line: 9, ch: 9 }, "script");    // inside 'script' end tag
                });
            });

            it("should get 'style' tag for cursor positions anywhere inside the tag including CDATA.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 11, ch: 11 }, "style");   // before '<' of CDATA
                    checkTagIdAtPos({ line: 13, ch: 12 }, "style");   // right before '>' of CDATA
                    checkTagIdAtPos({ line: 10, ch: 26 }, "style");   // before '>' of the 'style' tag
                    checkTagIdAtPos({ line: 12, ch: 33 }, "style");   // inside a property value                  
                    checkTagIdAtPos({ line: 14, ch: 9 }, "style");    // inside 'style' end tag
                });
            });

            it("should get 'i' tag for cursor position before </b>.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 18, ch: 20 }, "i");   // after <i> and before </b>
                    checkTagIdAtPos({ line: 18, ch: 28 }, "i");   // immediately before </b>
                });
            });
            
            it("should get 'p' tag after </b> because the </b> closed the overlapping <i>.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 18, ch: 34 }, "p");   // between </b> and </i>
                });
            });

            it("should get 'body' tag in a paragraph that has missing <p> tag, but has </p>", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 19, ch: 15 }, "body");   // before </p>
                    checkTagIdAtPos({ line: 19, ch: 38 }, "body");   // inside </p>
                });
            });

            it("should get 'hr' tag for cursor positions in any forms of <hr> tag", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 48, ch: 7 }, "hr");    // inside <hr>
                    checkTagIdAtPos({ line: 50, ch: 9 }, "hr");    // inside <hr />
                });
            });
            
            it("should get 'h2' tag for cursor positions between <wbr> and its invalide end tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 20, ch: 35 }, "h2");   // in the text between <wbr> and </wbr>
                });
            });

            it("should get 'wbr' tag for cursor positions inside <wbr>, not its parent <h2> tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 20, ch: 30 }, "wbr");   // inside <wbr>
                });
            });

            it("should get 'h2' tag for cursor positions inside invalid </wbr> tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 20, ch: 40 }, "h2");   // inside </wbr>
                });
            });

            it("should get 'name' tag for cursor positions before <name> and </name>.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 21, ch: 8 }, "name");    // inside <name>
                    checkTagIdAtPos({ line: 21, ch: 12 }, "name");   // inside content of 'mame' tag
                    checkTagIdAtPos({ line: 21, ch: 22 }, "name");   // inside </name>
                });
            });

            it("should get 'th' tag for cursor positions in any 'th' and their text contents.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 24, ch: 16 }, "th");    // inside first th content
                    checkTagIdAtPos({ line: 25, ch: 21 }, "th");    // inside second </th>
                    checkTagIdAtPos({ line: 26, ch: 17 }, "th");    // at the end of third th content
                    checkTagIdAtPos({ line: 27, ch: 0 }, "th");     // before the next <tr>
                });
            });

            it("should get 'input' tag for cursor positions in any input tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 39, ch: 57 }, "input");   // inside value attribute that has <
                    checkTagIdAtPos({ line: 39, ch: 64 }, "input");   // between / and > of input tag
                    checkTagIdAtPos({ line: 40, ch: 61 }, "input");   // inside value attribute that has >
                    checkTagIdAtPos({ line: 40, ch: 63 }, "input");   // right before the invalid </input>
                });
            });
            
            it("should get 'form' tag for cursor positions in any invalid end tag inside the form.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 40, ch: 65 }, "form");    // inside </input>
                });
            });

            it("should get 'p' tag for cursor positions inside an unclosed paragraph nested in a link.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 49, ch: 71 }, "p");    // before </a> but after <p> tag
                });
            });

            it("should get 'a' tag for cursor positions not in the unclosed 'p' child tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 49, ch: 32 }, "a");    // inside </a>
                    checkTagIdAtPos({ line: 49, ch: 72 }, "a");    // inside </a>
                });
            });
        });
        
        describe("Strict HTML parsing", function () {
            it("should parse a document with balanced, void and self-closing tags", function () {
                expect(HTMLInstrumentation._buildSimpleDOM("<p><b>some</b>awesome text</p><p>and <img> another <br/> para</p>", true)).not.toBeNull();
            });
            it("should parse a document with an implied-close tag followed by a tag that forces it to close", function () {
                var result = HTMLInstrumentation._buildSimpleDOM("<div><p>unclosed para<h1>heading that closes para</h1></div>", true);
                expect(result).not.toBeNull();
                expect(result.tag).toBe("div");
                expect(result.children[0].tag).toBe("p");
                expect(result.children[1].tag).toBe("h1");
            });
            it("should return null for an unclosed non-void/non-implied-close tag", function () {
                expect(HTMLInstrumentation._buildSimpleDOM("<p>this has an <b>unclosed bold tag</p>", true)).toBeNull();
            });
            it("should return null for an extra close tag", function () {
                expect(HTMLInstrumentation._buildSimpleDOM("<p>this has an unopened bold</b> tag</p>", true)).toBeNull();
            });
            it("should return null if there are unclosed tags at the end of the document", function () {
                expect(HTMLInstrumentation._buildSimpleDOM("<div>this has <b>multiple unclosed tags", true)).toBeNull();
            });
            it("should return null if there is a tokenization failure", function () {
                expect(HTMLInstrumentation._buildSimpleDOM("<div<badtag></div>", true)).toBeNull();
            });
            
            it("should handle empty attributes", function () {
                var dom = HTMLInstrumentation._buildSimpleDOM("<input disabled>", true);
                expect(dom.attributes.disabled).toEqual("");
            });
            
            it("should merge text nodes around a comment", function () {
                var dom = HTMLInstrumentation._buildSimpleDOM("<div>Text <!-- comment --> Text2</div>", true);
                expect(dom.children.length).toBe(1);
                expect(dom.children[0].content).toBe("Text  Text2");
            });
        });
        
        describe("HTML Instrumentation utility functions", function () {
            it("should locate the correct element and text siblings", function () {
                var findElementAndText = HTMLInstrumentation._findElementAndText;
                var parent = {
                    children: []
                };
                var elementOfInterest = { children: [] };
                var siblings = parent.children;
                parent.children.push(elementOfInterest);
                
                // check to the left
                var result = findElementAndText(siblings, 0, true);
                expect(result).toEqual({ firstChild: true });
                
                // check to the right
                result = findElementAndText(siblings, 0, false);
                expect(result).toEqual({ lastChild: true });
                
                var elementToTheLeft = { children: [] };
                parent.children.unshift(elementToTheLeft);
                
                result = findElementAndText(siblings, 1, true);
                expect(result).toEqual({
                    element: elementToTheLeft
                });
                
                result = findElementAndText(siblings, 1, false);
                expect(result).toEqual({ lastChild: true });
                
                var elementToTheRight = { children: [] };
                parent.children.push(elementToTheRight);
                
                result = findElementAndText(siblings, 1, true);
                expect(result).toEqual({
                    element: elementToTheLeft
                });
                
                result = findElementAndText(siblings, 1, false);
                expect(result).toEqual({
                    element: elementToTheRight
                });
                
                var textNode = {};
                parent.children[0] = textNode;
                
                result = findElementAndText(siblings, 1, true);
                expect(result).toEqual({
                    text: textNode
                });
                
                var textNode2 = {};
                parent.children[2] = textNode2;
                result = findElementAndText(siblings, 1, false);
                expect(result).toEqual({
                    text: textNode
                });
                
                parent.children.unshift(elementToTheLeft);
                result = findElementAndText(siblings, 2, true);
                expect(result).toEqual({
                    text: textNode,
                    element: elementToTheLeft
                });
                
                parent.children.push(elementToTheRight);
                result = findElementAndText(siblings, 2, false);
                expect(result).toEqual({
                    text: textNode2,
                    element: elementToTheRight
                });
            });
            
            it("should skip newly added elements when looking rightward from an element node", function () {
                var dom = HTMLInstrumentation._buildSimpleDOM("<body><div>First</div><div>Second</div><div>Third</div>");
                var second = dom.children[1];
                var third = dom.children[2];
                var elementInserts = {};
                elementInserts[second.tagID] = true;
                var result = HTMLInstrumentation._findElementAndText(dom.children, 0, false, [elementInserts]);
                expect(result).toEqual({
                    element: third
                });
            });
            
            it("should gather text as well as elements when looking rightward, but skip newly inserted nodes", function () {
                var dom = HTMLInstrumentation._buildSimpleDOM("<body><div>First</div>textOne<div>Second</div>textTwo<div>Third</div>");
                var secondText = dom.children[1];
                var secondElement = dom.children[2];
                var thirdText = dom.children[3];
                var thirdElement = dom.children[4];
                var elementInserts = {}, textInserts = {};
                elementInserts[secondText.tagID] = true;
                textInserts[secondElement.tagID] = true;
                var result = HTMLInstrumentation._findElementAndText(dom.children, 0, false, [elementInserts, textInserts]);
                expect(result).toEqual({
                    element: thirdElement,
                    text: thirdText
                });
            });
            
            it("should *not* skip newly added elements when looking leftward", function () {
                var dom = HTMLInstrumentation._buildSimpleDOM("<body><div>First</div><div>Second</div><div>Third</div>");
                var second = dom.children[1];
                var elementInserts = {};
                elementInserts[second.tagID] = true;
                var result = HTMLInstrumentation._findElementAndText(dom.children, 2, true, [elementInserts]);
                expect(result).toEqual({
                    element: second
                });
            });
            
            it("should mark the lastChild properly when skipping newly added elements", function () {
                var dom = HTMLInstrumentation._buildSimpleDOM("<body><div>First</div><div>Second</div>");
                var second = dom.children[1];
                var elementInserts = {};
                elementInserts[second.tagID] = true;
                var result = HTMLInstrumentation._findElementAndText(dom.children, 0, false, [elementInserts]);
                expect(result).toEqual({
                    lastChild: true
                });
            });
        });
        
        describe("HTML Instrumentation in dirty files", function () {
            var changeList;
            
            beforeEach(function () {
                init(this, WellFormedFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "html").editor;
                    expect(editor).toBeTruthy();

                    $(editor).on("change.instrtest", function (event, editor, change) {
                        changeList = change;
                    });
                    
                    instrumentedHTML = HTMLInstrumentation.generateInstrumentedHTML(editor.document);
                    elementCount = getIdToTagMap(instrumentedHTML, elementIds);
                });
            });
    
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
                instrumentedHTML = "";
                elementCount = 0;
                elementIds = {};
                changeList = null;
            });
            
            function doEditTest(origText, editFn, expectationFn, incremental) {
                // We need to fully reset the editor/mark state between the full and incremental tests
                // because if new DOM nodes are added by the edit, those marks will be present after the
                // full test, messing up the incremental test.                
                editor.document.refreshText(origText);
                
                var previousDOM = HTMLInstrumentation._buildSimpleDOM(editor.document.getText()),
                    result;
                HTMLInstrumentation._markTextFromDOM(editor, previousDOM);
                editFn(editor, previousDOM);

                result = HTMLInstrumentation._updateDOM(previousDOM, editor, (incremental ? changeList : null));
                expectationFn(result, previousDOM, incremental);
            }

            function doFullAndIncrementalEditTest(editFn, expectationFn) {
                var origText = editor.document.getText();
                doEditTest(origText, editFn, expectationFn, false);
                changeList = null;
                
                if (HTMLInstrumentation._allowIncremental) {
                    doEditTest(origText, editFn, expectationFn, true);
                }
            }
            
            function typeAndExpectNoEdits(editor, previousDOM, str, pos) {
                var i, result;
                for (i = 0; i < str.length; i++) {
                    editor.document.replaceRange(str.charAt(i), {line: pos.line, ch: pos.ch + i});
                    result = HTMLInstrumentation._updateDOM(previousDOM, editor, changeList);
                    expect(result).toBeNull();
                }
            }
            
            it("should re-instrument after document is dirtied", function () {
                runs(function () {
                    var pos = {line: 15, ch: 0};
                    editor.document.replaceRange("<div>New Content</div>", pos);
                    
                    var newInstrumentedHTML = HTMLInstrumentation.generateInstrumentedHTML(editor.document),
                        newElementIds = {},
                        newElementCount = getIdToTagMap(newInstrumentedHTML, newElementIds);
                    
                    expect(newElementCount).toBe(elementCount + 1);
                });
            });
            
            it("should build simple DOM", function () {
                runs(function () {
                    var dom = HTMLInstrumentation._buildSimpleDOM(editor.document.getText());
                    expect(dom.tagID).toEqual(jasmine.any(Number));
                    expect(dom.tag).toEqual("html");
                    expect(dom.start).toEqual(16);
                    expect(dom.end).toEqual(1269);
                    expect(dom.weight).toEqual(734);
                    expect(dom.signature).toEqual(jasmine.any(Number));
                    expect(dom.children.length).toEqual(5);
                    var meta = dom.children[1].children[1];
                    expect(Object.keys(meta.attributes).length).toEqual(1);
                    expect(meta.attributes.charset).toEqual("utf-8");
                    var titleContents = dom.children[1].children[5].children[0];
                    expect(titleContents.content).toEqual("GETTING STARTED WITH BRACKETS");
                    expect(titleContents.weight).toEqual(29);
                    expect(titleContents.parent.weight).toEqual(29);
                    expect(titleContents.signature).toEqual(MurmurHash3.hashString(titleContents.content, titleContents.content.length, HTMLInstrumentation._seed));
                    expect(dom.children[1].parent).toEqual(dom);
                    expect(dom.nodeMap[meta.tagID]).toBe(meta);
                    expect(meta.signature).toEqual(jasmine.any(Number));
                    expect(dom.signatureMap[meta.signature]).toBe(meta);
                });
            });
            
            it("should mark editor text based on the simple DOM", function () {
                runs(function () {
                    var dom = HTMLInstrumentation._buildSimpleDOM(editor.document.getText());
                    HTMLInstrumentation._markTextFromDOM(editor, dom);
                    expect(editor._codeMirror.getAllMarks().length).toEqual(15);
                });
            });
            
            it("should handle no diff", function () {
                runs(function () {
                    var previousDOM = HTMLInstrumentation._buildSimpleDOM(editor.document.getText());
                    HTMLInstrumentation._markTextFromDOM(editor, previousDOM);
                    var result = HTMLInstrumentation._updateDOM(previousDOM, editor);
                    expect(result.edits).toEqual([]);
                    expect(result.dom).toEqual(previousDOM);
                });
            });
            
            it("should handle attribute change", function () {
                runs(function () {
                    var tagID, origParent;
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange(", awesome", { line: 7, ch: 56 });
                            tagID = previousDOM.children[1].children[7].tagID;
                            origParent = previousDOM.children[1];
                        },
                        function (result, previousDOM, incremental) {
                            expect(result.edits.length).toEqual(1);
                            expect(result.edits[0]).toEqual({
                                type: "attrChange",
                                tagID: tagID,
                                attribute: "content",
                                value: "An interactive, awesome getting started guide for Brackets."
                            });
                            
                            if (incremental) {
                                // make sure the parent of the change is still the same node as in the old tree
                                expect(result.dom.nodeMap[tagID].parent).toBe(origParent);
                            } else {
                                // entire tree should be different
                                expect(result.dom.nodeMap[tagID].parent).not.toBe(origParent);
                            }
                        }
                    );
                });
            });
            
            it("should handle new attributes", function () {
                runs(function () {
                    var tagID, origParent;
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange(" class='supertitle'", { line: 12, ch: 3 });
                            tagID = previousDOM.children[3].children[1].tagID;
                            origParent = previousDOM.children[3];
                        },
                        function (result, previousDOM, incremental) {
                            expect(result.edits.length).toEqual(1);
                            expect(result.edits[0]).toEqual({
                                type: "attrAdd",
                                tagID: tagID,
                                attribute: "class",
                                value: "supertitle"
                            });

                            if (incremental) {
                                // make sure the parent of the change is still the same node as in the old tree
                                expect(result.dom.nodeMap[tagID].parent).toBe(origParent);
                            } else {
                                // entire tree should be different
                                expect(result.dom.nodeMap[tagID].parent).not.toBe(origParent);
                            }
                        }
                    );
                });
            });
            
            it("should handle deleted attributes", function () {
                runs(function () {
                    var tagID, origParent;
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange("", {line: 7, ch: 32}, {line: 7, ch: 93});
                            tagID = previousDOM.children[1].children[7].tagID;
                            origParent = previousDOM.children[1];
                        },
                        function (result, previousDOM, incremental) {
                            expect(result.edits.length).toEqual(1);
                            expect(result.edits[0]).toEqual({
                                type: "attrDel",
                                tagID: tagID,
                                attribute: "content"
                            });
                            
                            if (incremental) {
                                // make sure the parent of the change is still the same node as in the old tree
                                expect(result.dom.nodeMap[tagID].parent).toBe(origParent);
                            } else {
                                // entire tree should be different
                                expect(result.dom.nodeMap[tagID].parent).not.toBe(origParent);
                            }
                        }
                    );
                });
            });
            
            it("should handle simple altered text", function () {
                runs(function () {
                    var tagID, origParent;
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange("AWESOMER", {line: 12, ch: 12}, {line: 12, ch: 19});
                            tagID = previousDOM.children[3].children[1].tagID;
                            origParent = previousDOM.children[3];
                        },
                        function (result, previousDOM, incremental) {
                            expect(result.edits.length).toEqual(1);
                            expect(previousDOM.children[3].children[1].tag).toEqual("h1");
                            
                            expect(result.edits[0]).toEqual({
                                type: "textReplace",
                                parentID: tagID,
                                content: "GETTING AWESOMER WITH BRACKETS"
                            });
                            
                            if (incremental) {
                                // make sure the parent of the change is still the same node as in the old tree
                                expect(result.dom.nodeMap[tagID].parent).toBe(origParent);
                            } else {
                                // entire tree should be different
                                expect(result.dom.nodeMap[tagID].parent).not.toBe(origParent);
                            }
                        }
                    );
                });
            });
            
            it("should handle two incremental text edits in a row", function () {
                // Short-circuit this test if we're running without incremental updates
                if (!HTMLInstrumentation._allowIncremental) {
                    return;
                }
                
                runs(function () {
                    var previousDOM = HTMLInstrumentation._buildSimpleDOM(editor.document.getText()),
                        tagID = previousDOM.children[3].children[1].tagID,
                        result,
                        origParent = previousDOM.children[3];
                    HTMLInstrumentation._markTextFromDOM(editor, previousDOM);
                    
                    editor.document.replaceRange("AWESOMER", {line: 12, ch: 12}, {line: 12, ch: 19});
                    
                    result = HTMLInstrumentation._updateDOM(previousDOM, editor, changeList);
                    
                    // TODO: how to test that only an appropriate subtree was reparsed/diffed?
                    expect(result.edits.length).toEqual(1);
                    expect(result.dom.children[3].children[1].tag).toEqual("h1");
                    expect(result.dom.children[3].children[1].tagID).toEqual(tagID);
                    expect(result.edits[0]).toEqual({
                        type: "textReplace",
                        parentID: tagID,
                        content: "GETTING AWESOMER WITH BRACKETS"
                    });
                    // make sure the parent of the change is still the same node as in the old tree
                    expect(result.dom.nodeMap[tagID].parent).toBe(origParent);
                    
                    editor.document.replaceRange("MOAR AWESOME", {line: 12, ch: 12}, {line: 12, ch: 20});
                    
                    result = HTMLInstrumentation._updateDOM(previousDOM, editor, changeList);
                    
                    // TODO: how to test that only an appropriate subtree was reparsed/diffed?
                    expect(result.edits.length).toEqual(1);
                    expect(result.dom.children[3].children[1].tag).toEqual("h1");
                    expect(result.dom.children[3].children[1].tagID).toEqual(tagID);
                    expect(result.edits[0]).toEqual({
                        type: "textReplace",
                        parentID: tagID,
                        content: "GETTING MOAR AWESOME WITH BRACKETS"
                    });
                    
                    // make sure the parent of the change is still the same node as in the old tree
                    expect(result.dom.nodeMap[tagID].parent).toBe(origParent);
                });
            });
            
            it("in incremental edit, should avoid updating while typing an incomplete tag, then update when it's done", function () {
                // Short-circuit this test if we're running without incremental updates
                if (!HTMLInstrumentation._allowIncremental) {
                    return;
                }
                
                runs(function () {
                    var previousDOM = HTMLInstrumentation._buildSimpleDOM(editor.document.getText()),
                        result;
                    
                    HTMLInstrumentation._markTextFromDOM(editor, previousDOM);

                    // While the tag is incomplete, we should get no edits.                    
                    typeAndExpectNoEdits(editor, previousDOM, "<p", {line: 12, ch: 38});
                    
                    // This simulates our autocomplete behavior. The next case simulates the non-autocomplete case.
                    editor.document.replaceRange("></p>", {line: 12, ch: 40});
                    
                    // We don't pass the changeList here, to simulate doing a full rebuild (which is
                    // what the normal incremental update logic would do after invalid edits).
                    // TODO: a little weird that we're not going through the normal update logic
                    // (in getUnappliedEditList, etc.)
                    result = HTMLInstrumentation._updateDOM(previousDOM, editor);
                    
                    // This should really only have one edit (the tag insertion), but it also
                    // deletes and recreates the whitespace after it, similar to other insert cases.
                    var newElement = result.dom.children[3].children[2],
                        parentID = newElement.parent.tagID,
                        afterID = result.dom.children[3].children[1].tagID,
                        beforeID = result.dom.children[3].children[4].tagID;
                    expect(result.edits.length).toEqual(3);
                    expect(newElement.tag).toEqual("p");
                    expect(result.edits[0]).toEqual({
                        type: "textDelete",
                        parentID: parentID,
                        afterID: afterID,
                        beforeID: beforeID
                    });
                    expect(result.edits[1]).toEqual({
                        type: "elementInsert",
                        tag: "p",
                        tagID: newElement.tagID,
                        attributes: {},
                        parentID: parentID,
                        beforeID: beforeID // TODO: why is there no afterID here?
                    });
                    expect(result.edits[2]).toEqual({
                        type: "textInsert",
                        content: "\n",
                        parentID: parentID,
                        afterID: newElement.tagID,
                        beforeID: beforeID
                    });
                });
            });

            it("in incremental edit, should handle typing of a <p> without a </p> and then adding it later", function () {
                // Short-circuit this test if we're running without incremental updates
                if (!HTMLInstrumentation._allowIncremental) {
                    return;
                }
                
                runs(function () {
                    var previousDOM = HTMLInstrumentation._buildSimpleDOM(editor.document.getText()),
                        result;
                    
                    HTMLInstrumentation._markTextFromDOM(editor, previousDOM);
                    
                    typeAndExpectNoEdits(editor, previousDOM, "<p", {line: 12, ch: 38});
                    
                    // This simulates what would happen if autocomplete were off. We're actually
                    // valid at this point since <p> is implied close. We want to make sure that
                    // basically nothing happens if the user types </p> after this.
                    editor.document.replaceRange(">", {line: 12, ch: 40});
                    
                    // We don't pass the changeList here, to simulate doing a full rebuild (which is
                    // what the normal incremental update logic would do after invalid edits).
                    // TODO: a little weird that we're not going through the normal update logic
                    // (in getUnappliedEditList, etc.)
                    result = HTMLInstrumentation._updateDOM(previousDOM, editor);
                                        
                    // Since the <p> is unclosed, we think the whitespace after it is inside it.
                    var newElement = result.dom.children[3].children[2],
                        parentID = newElement.parent.tagID,
                        afterID = result.dom.children[3].children[1].tagID,
                        beforeID = result.dom.children[3].children[3].tagID;
                    expect(result.edits.length).toEqual(3);
                    expect(newElement.tag).toEqual("p");
                    expect(newElement.children.length).toEqual(1);
                    expect(newElement.children[0].content).toEqual("\n");
                    expect(result.edits[0]).toEqual({
                        type: "textDelete",
                        parentID: parentID,
                        afterID: afterID,
                        beforeID: beforeID
                    });
                    expect(result.edits[1]).toEqual({
                        type: "elementInsert",
                        tag: "p",
                        tagID: newElement.tagID,
                        attributes: {},
                        parentID: parentID,
                        beforeID: beforeID // TODO: why is there no afterID here?
                    });
                    expect(result.edits[2]).toEqual({
                        type: "textInsert",
                        content: "\n",
                        parentID: newElement.tagID
                    });
                    
                    // We should get no edits while typing the close tag.
                    previousDOM = result.dom;
                    typeAndExpectNoEdits(editor, previousDOM, "</p", {line: 12, ch: 41});
                    
                    // When we type the ">" at the end, we should get a delete of the text inside the <p>
                    // and an insert of text after the </p> since we now know that the close is before the
                    // text.
                    editor.document.replaceRange(">", {line: 12, ch: 44});
                    result = HTMLInstrumentation._updateDOM(previousDOM, editor);
                    
                    //console.log("final dom: " + HTMLInstrumentation._dumpDOM(result.dom));
                    newElement = result.dom.children[3].children[2];
                    beforeID = result.dom.children[3].children[4].tagID;
                    expect(newElement.children.length).toEqual(0);
                    expect(result.dom.children[3].children[3].content).toEqual("\n");
                    expect(result.edits.length).toEqual(2);
                    expect(result.edits[0]).toEqual({
                        type: "textDelete",
                        parentID: newElement.tagID
                    });
                    expect(result.edits[1]).toEqual({
                        type: "textInsert",
                        content: "\n",
                        parentID: newElement.parent.tagID,
                        afterID: newElement.tagID,
                        beforeID: beforeID
                    });
                });
            });

            it("should represent simple new tag insert", function () {
                runs(function () {
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange("<div>New Content</div>", {line: 15, ch: 0});
                        },
                        function (result, previousDOM, incremental) {
                            var newDOM = result.dom;
                            var newElement = newDOM.children[3].children[5];
                            expect(newElement.tag).toEqual("div");
                            expect(newElement.tagID).not.toEqual(newElement.parent.tagID);
                            expect(newElement.children[0].content).toEqual("New Content");
                            expect(result.edits.length).toEqual(4);
                            var beforeID = newElement.parent.children[7].tagID,
                                afterID = newElement.parent.children[3].tagID;
                            expect(result.edits[0]).toEqual({
                                type: "elementInsert",
                                tag: "div",
                                attributes: {},
                                tagID: newElement.tagID,
                                parentID: newElement.parent.tagID,
                                beforeID: beforeID
                            });
                            expect(result.edits[1]).toEqual({
                                type: "textInsert",
                                parentID: newElement.tagID,
                                content: "New Content"
                            });
                            expect(result.edits[2]).toEqual({
                                type: "textInsert",
                                parentID: newElement.parent.tagID,
                                afterID: newElement.tagID,
                                beforeID: beforeID,
                                content: "\n\n"
                            });
                            expect(result.edits[3]).toEqual({
                                type: "textReplace",
                                parentID: newElement.parent.tagID,
                                afterID: afterID,
                                beforeID: newElement.tagID,
                                content: "\n\n"
                            });
                        }
                    );
                });
            });
            
            it("should be able to add two tags at once", function () {
                runs(function () {
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange("<div>New Content</div><div>More new content</div>", {line: 15, ch: 0});
                        },
                        function (result, previousDOM, incremental) {
                            var newDOM = result.dom;
                            //console.log(HTMLInstrumentation._dumpDOM(newDOM));
                            var newElement = newDOM.children[3].children[5];
                            var newElement2 = newDOM.children[3].children[6];
                            expect(newElement.tag).toEqual("div");
                            expect(newElement2.tag).toEqual("div");
                            expect(newElement.tagID).not.toEqual(newElement.parent.tagID);
                            expect(newElement2.tagID).not.toEqual(newElement.tagID);
                            expect(newElement.children[0].content).toEqual("New Content");
                            expect(newElement2.children[0].content).toEqual("More new content");
                            expect(result.edits.length).toEqual(6);
                            var beforeID = newElement.parent.children[8].tagID,
                                afterID = newElement.parent.children[3].tagID;
                            expect(result.edits[0]).toEqual({
                                type: "elementInsert",
                                tag: "div",
                                attributes: {},
                                tagID: newElement.tagID,
                                parentID: newElement.parent.tagID,
                                beforeID: beforeID
                            });
                            expect(result.edits[1]).toEqual({
                                type: "elementInsert",
                                tag: "div",
                                attributes: {},
                                tagID: newElement2.tagID,
                                parentID: newElement2.parent.tagID,
                                beforeID: beforeID
                            });
                            expect(result.edits[2]).toEqual({
                                type: "textInsert",
                                parentID: newElement2.tagID,
                                content: "More new content"
                            });
                            expect(result.edits[3]).toEqual({
                                type: "textInsert",
                                parentID: newElement.tagID,
                                content: "New Content"
                            });
                            expect(result.edits[4]).toEqual({
                                type: "textInsert",
                                parentID: newElement2.parent.tagID,
                                afterID: newElement2.tagID,
                                beforeID: beforeID,
                                content: "\n\n"
                            });
                            expect(result.edits[5]).toEqual({
                                type: "textReplace",
                                parentID: newElement.parent.tagID,
                                afterID: afterID,
                                beforeID: newElement.tagID,
                                content: "\n\n"
                            });
                        }
                    );
                });
            });
            
            it("should be able to paste a tag with a nested tag", function () {
                runs(function () {
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange("<div>New <em>Awesome</em> Content</div>", {line: 13, ch: 0});
                        },
                        function (result, previousDOM, incremental) {
                            var newDOM = result.dom;
                            //console.log("new DOM: " + HTMLInstrumentation._dumpDOM(newDOM));
                            //console.log("edits: " + JSON.stringify(result.edits, null, "  "));
                            
                            var newElement = newDOM.children[3].children[3],
                                newChild = newElement.children[1];
                            expect(newElement.tag).toEqual("div");
                            expect(newElement.tagID).not.toEqual(newElement.parent.tagID);
                            expect(newElement.children.length).toEqual(3);
                            expect(newElement.children[0].content).toEqual("New ");
                            expect(newChild.tag).toEqual("em");
                            expect(newChild.tagID).not.toEqual(newElement.tagID);
                            expect(newChild.children.length).toEqual(1);
                            expect(newChild.children[0].content).toEqual("Awesome");
                            expect(newElement.children[2].content).toEqual(" Content");
                            expect(result.edits.length).toEqual(5);
                            
                            var beforeID = newElement.parent.children[4].tagID;
                            expect(result.edits[0]).toEqual({
                                type: "elementInsert",
                                tag: "div",
                                attributes: {},
                                tagID: newElement.tagID,
                                parentID: newElement.parent.tagID,
                                beforeID: beforeID
                            });
                            expect(result.edits[1]).toEqual({
                                type: "elementInsert",
                                tag: "em",
                                attributes: {},
                                tagID: newChild.tagID,
                                parentID: newElement.tagID,
                                lastChild: true
                            });
                            expect(result.edits[2]).toEqual({
                                type: "textInsert",
                                parentID: newElement.tagID,
                                content: " Content",
                                afterID: newChild.tagID
                            });
                            expect(result.edits[3]).toEqual({
                                type: "textInsert",
                                parentID: newChild.tagID,
                                content: "Awesome"
                            });
                            expect(result.edits[4]).toEqual({
                                type: "textInsert",
                                parentID: newElement.tagID,
                                content: "New ",
                                beforeID: newChild.tagID
                            });
                        }
                    );
                });
            });

            it("should handle inserting an element as the first child", function () {
                runs(function () {
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange("<div>New Content</div>", {line: 10, ch: 12});
                        },
                        function (result, previousDOM, incremental) {
                            var newDOM = result.dom;
//                            console.log("new DOM: ");
//                            console.log(HTMLInstrumentation._dumpDOM(newDOM));
                            var newElement = newDOM.children[3].children[0],
                                parent = newElement.parent,
                                parentID = parent.tagID,
                                beforeID = parent.children[2].tagID;
                            
                            // TODO: More optimally, this would take
                            // 2 edits rather than 4:
                            // * an elementInsert for the new element
                            // * a textInsert for the new text of the
                            //   new element.
                            //
                            // It current requires 4 edits because the
                            // whitespace text node that comes after
                            // the body tag is deleted and recreated
                            expect(result.edits.length).toBe(4);
                            expect(result.edits[0]).toEqual({
                                type: "textDelete",
                                parentID: parentID,
                                beforeID: beforeID
                            });
                            expect(result.edits[1]).toEqual({
                                type: "elementInsert",
                                parentID: parentID,
                                firstChild: true,
                                tag: "div",
                                attributes: {},
                                tagID: newElement.tagID
                            });
                            expect(result.edits[2]).toEqual({
                                type: "textInsert",
                                parentID: newElement.tagID,
                                content: "New Content"
                            });
                            expect(result.edits[3]).toEqual({
                                type: "textInsert",
                                parentID: parentID,
                                content: "\n\n",
                                afterID: newElement.tagID,
                                beforeID: beforeID
                            });
                        }
                    );
                });
            });
            
            it("should handle inserting an element as the last child", function () {
                runs(function () {
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            // insert a new element at the end of a paragraph
                            editor.document.replaceRange("<strong>New Content</strong>", {line: 33, ch: 0});
                        },
                        function (result, previousDOM, incremental) {
                            var newDOM = result.dom;
//                            console.log("new DOM: ");
//                            console.log(HTMLInstrumentation._dumpDOM(newDOM));
                            var newElement = newDOM.children[3].children[7].children[3],
                                parent = newElement.parent,
                                parentID = parent.tagID,
                                afterID = parent.children[2].tagID;
                            
                            expect(result.edits.length).toBe(2);
                            expect(result.edits[0]).toEqual({
                                type: "elementInsert",
                                parentID: parentID,
                                lastChild: true,
                                tag: "strong",
                                attributes: {},
                                tagID: newElement.tagID
                            });
                            expect(result.edits[1]).toEqual({
                                type: "textInsert",
                                parentID: newElement.tagID,
                                content: "New Content"
                            });
                        }
                    );
                });
            });
            
            it("should handle inserting an element before an existing text node", function () {
                runs(function () {
                    editor.document.replaceRange("<strong>pre-edit child</strong>", {line: 33, ch: 0});

                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange("<strong>New Content</strong>", {line: 29, ch: 59});
                        },
                        function (result, previousDOM, incremental) {
                            //console.log("edits: " + JSON.stringify(result.edits, null, "  "));
                            var newDOM = result.dom;
                            //console.log("new DOM: ");
                            //console.log(HTMLInstrumentation._dumpDOM(newDOM));
                            var newElement = newDOM.children[3].children[7].children[2],
                                parent = newElement.parent,
                                parentID = parent.tagID,
                                afterID = parent.children[1].tagID,
                                beforeID = parent.children[4].tagID;
                            
                            expect(result.edits.length).toBe(4);
                            expect(result.edits[0]).toEqual({
                                type: "textDelete",
                                parentID: parentID,
                                afterID: afterID,
                                beforeID: beforeID
                            });
                                
                            expect(result.edits[1]).toEqual({
                                type: "elementInsert",
                                parentID: parentID,
                                beforeID: beforeID,
                                tag: "strong",
                                attributes: {},
                                tagID: newElement.tagID
                            });
                            expect(result.edits[2]).toEqual({
                                type: "textInsert",
                                parentID: parentID,
                                content: jasmine.any(String),
                                afterID: newElement.tagID,
                                beforeID: beforeID
                            });
                        }
                    );
                });
            });

            it("should represent simple new tag insert immediately after previous tag before text before tag", function () {
                runs(function () {
                    var ed;
                    
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            ed = editor;
                            //console.log("original DOM: ");
                            //console.log(HTMLInstrumentation._dumpDOM(previousDOM));
                            editor.document.replaceRange("<div>New Content</div>", {line: 12, ch: 38});
                        },
                        function (result, previousDOM, incremental) {
                            var newDOM = result.dom;
                            
                            // first child is whitespace, second child is <h1>, third child is new tag
                            var newElement = newDOM.children[3].children[2],
                                afterID = newElement.parent.children[1].tagID,
                                beforeID = newElement.parent.children[4].tagID;
                            expect(newElement.tag).toEqual("div");
                            expect(newElement.tagID).not.toEqual(newElement.parent.tagID);
                            expect(newElement.children[0].content).toEqual("New Content");
                            
                            // 4 edits: 
                            // - delete original \n
                            // - insert new tag
                            // - insert text in tag
                            // - re-add \n after tag
                            expect(result.edits.length).toEqual(4);
                            expect(result.edits[0]).toEqual({
                                type: "textDelete",
                                parentID: newElement.parent.tagID,
                                afterID: afterID,
                                beforeID: beforeID
                            });
                            expect(result.edits[1]).toEqual({
                                type: "elementInsert",
                                tag: "div",
                                attributes: {},
                                tagID: newElement.tagID,
                                parentID: newElement.parent.tagID,
                                beforeID: beforeID
                            });
                            expect(result.edits[2]).toEqual({
                                type: "textInsert",
                                content: "New Content",
                                parentID: newElement.tagID
                            });
                            expect(result.edits[3]).toEqual({
                                type: "textInsert",
                                parentID: newElement.parent.tagID,
                                content: jasmine.any(String),
                                afterID: newElement.tagID,
                                beforeID: beforeID
                            });
                        }
                    );
                });
            });
            
            it("should handle new text insert between tags after whitespace", function () {
                runs(function () {
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange("New Content", {line: 13, ch: 0});
                        },
                        function (result, previousDOM, incremental) {
                            var newDOM = result.dom;
                            var newElement = newDOM.children[3].children[2];
                            expect(newElement.content).toEqual("\nNew Content");
                            expect(result.edits.length).toEqual(1);
                            expect(result.edits[0]).toEqual({
                                type: "textReplace",
                                content: "\nNew Content",
                                parentID: newElement.parent.tagID,
                                afterID: newDOM.children[3].children[1].tagID,
                                beforeID: newDOM.children[3].children[3].tagID
                            });
                        }
                    );
                });
            });

            it("should handle inserting an element in the middle of text", function () {
                runs(function () {
                    doFullAndIncrementalEditTest(
                        function (editor, previousDOM) {
                            editor.document.replaceRange("<img>", {line: 12, ch: 19});
                        },
                        function (result, previousDOM, incremental) {
                            var newDOM = result.dom;
                            var newElement = newDOM.children[3].children[1].children[1];
                            
                            //console.log("newDOM: " + HTMLInstrumentation._dumpDOM(newDOM));
                            //console.log("edits: " + JSON.stringify(result.edits, null, "  "));
                            expect(newElement.tag).toEqual("img");
                            expect(newDOM.children[3].children[1].children[0].content).toEqual("GETTING STARTED");
                            expect(newDOM.children[3].children[1].children[2].content).toEqual(" WITH BRACKETS");
                            expect(result.edits.length).toEqual(3);
                            expect(result.edits[0]).toEqual({
                                type: "elementInsert",
                                tag: "img",
                                attributes: {},
                                tagID: newElement.tagID,
                                parentID: newElement.parent.tagID,
                                lastChild: true
                            });
                            expect(result.edits[1]).toEqual({
                                type: "textInsert",
                                content: " WITH BRACKETS",
                                parentID: newElement.parent.tagID,
                                afterID: newElement.tagID
                            });
                            expect(result.edits[2]).toEqual({
                                type: "textReplace",
                                content: "GETTING STARTED",
                                parentID: newElement.parent.tagID,
                                beforeID: newElement.tagID
                            });
                        }
                    );
                });
            });
        });
        
        var benchmarker = {
            starts: {},
            timings: {},
            start: function (name) {
                this.starts[name] = window.performance.webkitNow();
            },
            end: function (name) {
                var end = window.performance.webkitNow();
                var timeList = this.timings[name];
                if (timeList === undefined) {
                    timeList = this.timings[name] = [];
                }
                timeList.push(end - this.starts[name]);
                delete this.starts[name];
            },
            report: function () {
                console.log(this.heading);
                var timingNames = Object.keys(this.timings);
                timingNames.forEach(function (name) {
                    var timings = this.timings[name];
                    timings.sort(function (a, b) {
                        return a - b;
                    });
                    var min = timings[0];
                    var max = timings[timings.length - 1];
                    var med = timings[Math.floor(timings.length / 2)];
                    console.log(name, "Min:", min.toFixed(2), "ms, Max:", max.toFixed(2), "ms, Median:", med.toFixed(2), "ms (" + timings.length + " runs)");
                }.bind(this));
            },
            reset: function () {
                this.starts = {};
                this.timings = {};
                this.heading = "Test Results";
            }
        };
        
        function doFullAndIncrementalBenchmarkTest(runs, editFn) {
            var i;
            var previousText = editor.document.getText();
            for (i = 0; i < runs; i++) {
                benchmarker.start("Base edit");
                editFn(editor);
                benchmarker.end("Base edit");
                editor.document.setText(previousText);
            }
            
            benchmarker.start("Initial DOM build");
            var previousDOM = HTMLInstrumentation._buildSimpleDOM(previousText),
                changeList,
                result;
            benchmarker.end("Initial DOM build");
            benchmarker.start("Mark text");
            HTMLInstrumentation._markTextFromDOM(editor, previousDOM);
            benchmarker.end("Mark text");
            
            for (i = 0; i < runs; i++) {
                benchmarker.start("Edit with marks");
                editFn(editor);
                benchmarker.end("Edit with marks");
                editor.document.setText(previousText);
                HTMLInstrumentation._markTextFromDOM(editor, previousDOM);
            }
            
            var changeFunction = function (event, editor, change) {
                changeList = change;
                result = HTMLInstrumentation._updateDOM(previousDOM, editor, changeList);
            };
            
            for (i = 0; i < runs; i++) {
                editor.document.setText(previousText);
                previousDOM = HTMLInstrumentation._buildSimpleDOM(previousText);
                HTMLInstrumentation._markTextFromDOM(editor, previousDOM);
                
                $(editor).on("change.perftest", changeFunction);
                benchmarker.start("Incremental");
                editFn(editor);
                benchmarker.end("Incremental");
                $(editor).off(".perftest");
            }
            
            var fullChangeFunction = function (event, editor, change) {
                result = HTMLInstrumentation._updateDOM(previousDOM, editor);
            };
            
            for (i = 0; i < runs; i++) {
                editor.document.setText(previousText);
                previousDOM = HTMLInstrumentation._buildSimpleDOM(previousText);
                HTMLInstrumentation._markTextFromDOM(editor, previousDOM);
                
                $(editor).on("change.perftest", fullChangeFunction);
                benchmarker.start("Full");
                // full test
                editFn(editor);
                benchmarker.end("Full");
                $(editor).off(".perftest");
            }
            
            benchmarker.report();
        }
        
        xdescribe("Performance Tests", function () {
            beforeEach(function () {
                init(this, WellFormedFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "html").editor;
                    expect(editor).toBeTruthy();

                    instrumentedHTML = HTMLInstrumentation.generateInstrumentedHTML(editor.document);
                    elementCount = getIdToTagMap(instrumentedHTML, elementIds);
                });
            });
    
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
                instrumentedHTML = "";
                elementCount = 0;
                elementIds = {};
                benchmarker.reset();
            });
            
            it("measure performance of text replacement", function () {
                benchmarker.heading = "Text Replacement";
                runs(function () {
                    doFullAndIncrementalBenchmarkTest(
                        10,
                        function (editor) {
                            editor.document.replaceRange("AWESOMER", {line: 12, ch: 12}, {line: 12, ch: 19});
                        }
                    );
                });
            });
            
            it("measure performance of simulated typing of text", function () {
                benchmarker.heading = "Simulated Typing of Text";
                runs(function () {
                    doFullAndIncrementalBenchmarkTest(
                        10,
                        function (editor) {
                            editor.document.replaceRange("A", {line: 12, ch: 12});
                            editor.document.replaceRange("W", {line: 12, ch: 13});
                            editor.document.replaceRange("E", {line: 12, ch: 14});
                            editor.document.replaceRange("S", {line: 12, ch: 15});
                            editor.document.replaceRange("O", {line: 12, ch: 16});
                            editor.document.replaceRange("M", {line: 12, ch: 17});
                            editor.document.replaceRange("E", {line: 12, ch: 18});
                            editor.document.replaceRange("R", {line: 12, ch: 19});
                        }
                    );
                });
            });
            
            it("measure performance of new tag insertion", function () {
                benchmarker.heading = "New Tag";
                runs(function () {
                    doFullAndIncrementalBenchmarkTest(
                        10,
                        function (editor) {
                            editor.document.replaceRange("<div>New Content</div>", {line: 15, ch: 0});
                        }
                    );
                });
            });
            
            it("measure performance of typing a new tag", function () {
                benchmarker.heading = "Typing New Tag";
                runs(function () {
                    doFullAndIncrementalBenchmarkTest(
                        5,
                        function (editor) {
                            editor.document.replaceRange("<", {line: 15, ch: 0});
                            editor.document.replaceRange("d", {line: 15, ch: 1});
                            editor.document.replaceRange("i", {line: 15, ch: 2});
                            editor.document.replaceRange("v", {line: 15, ch: 3});
                            editor.document.replaceRange(">", {line: 15, ch: 4});
                            editor.document.replaceRange("</div>", {line: 15, ch: 5});
                            editor.document.replaceRange("N", {line: 15, ch: 5});
                            editor.document.replaceRange("e", {line: 15, ch: 6});
                            editor.document.replaceRange("w", {line: 15, ch: 7});
                            editor.document.replaceRange(" ", {line: 15, ch: 8});
                            editor.document.replaceRange("C", {line: 15, ch: 9});
                            editor.document.replaceRange("o", {line: 15, ch: 10});
                            editor.document.replaceRange("n", {line: 15, ch: 11});
                            editor.document.replaceRange("t", {line: 15, ch: 12});
                            editor.document.replaceRange("e", {line: 15, ch: 13});
                            editor.document.replaceRange("n", {line: 15, ch: 14});
                            editor.document.replaceRange("t", {line: 15, ch: 15});
                        }
                    );
                });
            });
        });
        
        xdescribe("Big File Performance Tests", function () {
            beforeEach(function () {
                init(this, BigFileEntry);
                runs(function () {
                    editor = SpecRunnerUtils.createMockEditor(this.fileContent, "html").editor;
                    expect(editor).toBeTruthy();

                    instrumentedHTML = HTMLInstrumentation.generateInstrumentedHTML(editor.document);
                    elementCount = getIdToTagMap(instrumentedHTML, elementIds);
                });
            });
    
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor.document);
                editor = null;
                instrumentedHTML = "";
                elementCount = 0;
                elementIds = {};
                benchmarker.reset();
            });
            
            it("should handle a big file", function () {
                benchmarker.heading = "Big Text Replacement";
                runs(function () {
                    doFullAndIncrementalBenchmarkTest(
                        1,
                        function (editor) {
                            editor.document.replaceRange("AWESOMER", {line: 12, ch: 12}, {line: 12, ch: 19});
                        }
                    );
                });
            });
        });

        xdescribe("DOMNavigator", function () {
            it("implements easy depth-first traversal", function () {
                var dom = HTMLInstrumentation._buildSimpleDOM("<html><body><div>Here is <strong>my text</strong></div></body></html>");
                var nav = new HTMLInstrumentation._DOMNavigator(dom);
                expect(nav.next().tag).toEqual("body");
                expect(nav.next().tag).toEqual("div");
                expect(nav.next().content).toEqual("Here is ");
                expect(nav.getPosition()).toEqual({
                    tagID: dom.children[0].children[0].tagID,
                    child: 0
                });
                expect(nav.next().tag).toEqual("strong");
                expect(nav.next().content).toEqual("my text");
                expect(nav.next()).toBeNull();
            });
        });
    });
});
