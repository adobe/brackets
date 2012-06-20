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
/*global define: false, describe: false, beforeEach: false, afterEach: false, it: false, runs: false, waitsFor: false, expect: false, $: false, CodeMirror: false  */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var HTMLUtils       = require("language/HTMLUtils"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        Editor          = require("editor/Editor");
    
    //Use a clean version of the editor each time
    var myDocument;
    var myEditor;
    beforeEach(function () {
        // init Editor instance (containing a CodeMirror instance)
        $("body").append("<div id='editor'/>");
        myDocument = SpecRunnerUtils.createMockDocument("");
        myEditor = new Editor(myDocument, true, "", $("#editor").get(0), {});
    });

    afterEach(function () {
        myEditor.destroy();
        myEditor = null;
        $("#editor").remove();
        myDocument = null;
    });
    
    function setContentAndUpdatePos(pos, linesBefore, hintLineBefore, hintLineAfter, linesAfter) {
        pos.line = linesBefore.length;
        pos.ch = hintLineBefore.length;
        var finalHintLine = (hintLineAfter ? hintLineBefore + hintLineAfter : hintLineBefore);
        var finalLines = linesBefore.concat([finalHintLine]);
        if (linesAfter) {
            finalLines = finalLines.concat(linesAfter);
        }
        
        var content = finalLines.join("\n");
        myDocument.setText(content);
    }
    
    
    describe("HTMLUtils", function () {
        
        describe("Html Hinting", function () {
            beforeEach(function () {
                // tell CodeMirror this is html content as the mode is
                //used in determining the hints
                myEditor._codeMirror.setOption("mode", "htmlmixed");
            });
    
            it("should not find attribute hints in an empty editor", function () {
                var pos = {"ch": 0, "line": 0};
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo());
            });
            
            it("should find an attribute as a tag is getting typed", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class="');
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.ATTR_VALUE, 0, "p", "class"));
            });
            
            it("should find an attribute as it's added to a tag", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>', '<div class="clearfix">'],
                    '<p id="', '>test</p>',
                    [ '</div>', '</body>', '</html>']);
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.ATTR_VALUE, 0, "p", "id"));
            });
            
            it("should find an attribute as the value is typed", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>', '<div class="clearfix">'],
                    '<p id="one', '>test</p>',
                    [ '</div>', '</body>', '</html>']);
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.ATTR_VALUE, 3, "p", "id", "one"));
            });
            
            it("should not find an attribute as text is added", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p id="foo">tricky="', '</p>',
                    [ '</body>', '</html>']);
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo());
            });
            
            it("should find the attribute value if present", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class="foo"', '></p>',
                    [ '</body>', '</html>']);
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.ATTR_VALUE, 3, "p", "class", "foo"));
            });
            
            it("should find the full attribute as an existing value is changed", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class="foo', ' bar"></p>',
                    [ '</body>', '</html>']);
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.ATTR_VALUE, 3, "p", "class", "foo bar"));
            });
            
            it("should find the attribute value even when there is space around the =", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class = "foo"', '></p>',
                    [ '</body>', '</html>']);
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.ATTR_VALUE, 3, "p", "class", "foo"));
            });
            
            it("should find the attribute value when the IP is after the =", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class=', '"foo"></p>',
                    [ '</body>', '</html>']);
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.ATTR_VALUE, 0, "p", "class", "foo"));
            });
            
            it("should find the tagname as it's typed", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<di');
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.TAG_NAME, 2, "di"));
            });
            
            it("should hint tagname as the open < is typed", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p>test</p><');
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.TAG_NAME));
            });
            
            it("should find the tagname of the current tag if two tags are right next to each other", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><span');
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.TAG_NAME, 4, "span"));
            });
            
            it("should hint attributes even if there is a lot of space between the tag name and the next attr name", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><li  ', '  id="foo"');
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.ATTR_NAME, 0, "li"));
            });
            
            it("should find the tagname as space is typed before the attr name is added", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><span ');
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo(HTMLUtils.ATTR_NAME, 0, "span"));
            });
            
            it("should not hint anything after the tag is closed", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><span>');
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo());
            });
            
            it("should not hint anything after a closing tag", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><span></span>', '</div>',
                    ['</body>', '</html>']);
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo());
            });
            
            it("should not hint anything inside a closing tag", function () {
                var pos = {"ch": 0, "line": 0};
                setContentAndUpdatePos(pos,
                    ['<html>', '<body>', '<div id="test" class="foo"></div>'],
                    '</body></ht', 'ml>');
                
                var tag = HTMLUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(HTMLUtils.createTagInfo());
            });
        });
    });
});
