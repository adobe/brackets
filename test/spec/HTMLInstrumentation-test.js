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
/*global define, $, describe, beforeEach, afterEach, it, runs, waitsFor, expect, spyOn */

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils           = require("file/FileUtils"),
        HTMLInstrumentation = require("language/HTMLInstrumentation"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");
    
    var testPath = SpecRunnerUtils.getTestPath("/spec/HTMLInstrumentation-test-files"),
        WellFormedFileEntry = new NativeFileSystem.FileEntry(testPath + "/wellformed.html"),
        NotWellFormedFileEntry = new NativeFileSystem.FileEntry(testPath + "/omitEndTags.html"),
        InvalidHTMLFileEntry =  new NativeFileSystem.FileEntry(testPath + "/invalidHTML.html"),
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
                    expect(elementCount).toEqual(49);
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
                    checkTagIdAtPos({ line: 58, ch: 4 }, "img");     // before <img
                    checkTagIdAtPos({ line: 58, ch: 95 }, "img");    // after />
                    checkTagIdAtPos({ line: 58, ch: 65 }, "img");    // inside src attribute value
                });
            });

            it("should get the parent 'a' tag for cursor positions between 'img' and its parent 'a' tag.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 58, ch: 1 }, "a");    // before "   <img"
                    checkTagIdAtPos({ line: 59, ch: 0 }, "a");    // before </a>
                });
            });

            it("No tag at cursor positions outside of the 'html' tag", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 0, ch: 4 }, "");    // inside 'doctype' tag
                    checkTagIdAtPos({ line: 146, ch: 0 }, "");  // after </html>
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
                    expect(elementCount).toEqual(41);
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
                    checkTagIdAtPos({ line: 21, ch: 0 }, "table");    // after a 'th' but before the start tag of another one 
                    checkTagIdAtPos({ line: 32, ch: 6 }, "table");    // inside </table> tag
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

            it("should get 'i' tag for cursor positions before </b>, inside </b> and after </b>.", function () {
                runs(function () {
                    checkTagIdAtPos({ line: 18, ch: 20 }, "i");   // after <i> and before </b>
                    checkTagIdAtPos({ line: 18, ch: 30 }, "i");   // inside </b>
                    checkTagIdAtPos({ line: 18, ch: 34 }, "i");   // between </b> and </i>
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
    });
});
