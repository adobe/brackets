/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, beforeEach: false, afterEach: false, it: false, runs: false, waitsFor: false, expect: false, $: false, CodeMirror: false  */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CodeHintUtils = require("CodeHintUtils"),
        Editor        = require("Editor").Editor;
    
    //Use a clean version of the editor each time
    var myEditor;
    beforeEach(function () {
        // init CodeMirror instance
        $("body").append("<div id='editor'/>");
        myEditor = new Editor("", "", $("#editor").get(0), {});
    });

    afterEach(function () {
        $("#editor").remove();
        myEditor = null;
    });
    
    function getContentAndUpdatePos(pos, linesBefore, hintLineBefore, hintLineAfter, linesAfter) {
        pos.line = linesBefore.length;
        pos.ch = hintLineBefore.length;
        var finalHintLine = (hintLineAfter ? hintLineBefore + hintLineAfter : hintLineBefore);
        var finalLines = linesBefore.concat([finalHintLine]);
        if (linesAfter) {
            finalLines = finalLines.concat(linesAfter);
        }
        return finalLines.join("\n");
    }
    
    
    describe("CodeHintUtils", function () {
        
        describe("Html Hinting", function () {
            beforeEach(function () {
                // tell CodeMirror this is html content as the mode is
                //used in determining the hints
                myEditor._codeMirror.setOption("mode", "htmlmixed");
            });
    
            it("should not find attribute hints in an empty editor", function () {
                var pos = {"ch": 0, "line": 0};
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo());
            });
            
            it("should find an attribute as a tag is getting typed", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class="');
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.ATTR_VALUE, 0, "p", "class"));
            });
            
            it("should find an attribute as it's added to a tag", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>', '<div class="clearfix">'],
                    '<p id="', '>test</p>',
                    [ '</div>', '</body>', '</html>']);
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.ATTR_VALUE, 0, "p", "id"));
            });
            
            it("should find an attribute as the value is typed", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>', '<div class="clearfix">'],
                    '<p id="one', '>test</p>',
                    [ '</div>', '</body>', '</html>']);
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.ATTR_VALUE, 3, "p", "id", "one"));
            });
            
            it("should not find an attribute as text is added", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p id="foo">tricky="', '</p>',
                    [ '</body>', '</html>']);
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo());
            });
            
            it("should find the attribute value if present", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class="foo"', '></p>',
                    [ '</body>', '</html>']);
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.ATTR_VALUE, 3, "p", "class", "foo"));
            });
            
            it("should find the full attribute as an existing value is changed", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class="foo', ' bar"></p>',
                    [ '</body>', '</html>']);
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.ATTR_VALUE, 3, "p", "class", "foo bar"));
            });
            
            it("should find the attribute value even when there is space around the =", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class = "foo"', '></p>',
                    [ '</body>', '</html>']);
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.ATTR_VALUE, 3, "p", "class", "foo"));
            });
            
            it("should find the attribute value when the IP is after the =", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class=', '"foo"></p>',
                    [ '</body>', '</html>']);
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.ATTR_VALUE, 0, "p", "class", "foo"));
            });
            
            it("should find the tagname as it's typed", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<di');
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.TAG_NAME, 2, "di"));
            });
            
            it("should hint tagname as the open < is typed", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p>test</p><');
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.TAG_NAME));
            });
            
            it("should find the tagname of the current tag if two tags are right next to each other", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><span');
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.TAG_NAME, 4, "span"));
            });
            
            it("should hint attributes even if there is a lot of space between the tag name and the next attr name", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><li  ', '  id="foo"');
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.ATTR_NAME, 0, "li"));
            });
            
            it("should find the tagname as space is typed before the attr name is added", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><span ');
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo(CodeHintUtils.ATTR_NAME, 0, "span"));
            });
            
            it("should not hint anything after the tag is closed", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><span>');
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo());
            });
            
            it("should not hint anything after a closing tag", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<div><span></span>', '</div>',
                    ['</body>', '</html>']);
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo());
            });
            
            it("should not hint anything inside a closing tag", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>', '<div id="test" class="foo"></div>'],
                    '</body></ht', 'ml>');
                
                myEditor.setText(content);
                var tag = CodeHintUtils.getTagInfo(myEditor, pos);
                expect(tag).toEqual(CodeHintUtils.createTagInfo());
            });
        });
    });
});
