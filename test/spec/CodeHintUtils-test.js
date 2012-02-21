/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, beforeEach: false, afterEach: false, it: false, runs: false, waitsFor: false, expect: false, $: false, CodeMirror: false  */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var CodeHintUtils = require("CodeHintUtils");
    
    //Use a clean version of the editor each time
    var myCodeMirror;
    beforeEach(function () {
        // init CodeMirror instance
        $("body").append("<div id='editor'/>");
        myCodeMirror = new CodeMirror($("#editor").get(0), {
            value: ""
        });
    });

    afterEach(function () {
        $("#editor").remove();
        myCodeMirror = null;
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
                myCodeMirror.setOption("mode", "htmlmixed");
            });
    
            it("it should not find attribute hints in an empty editor", function () {
                var pos = {"ch": 0, "line": 0};
                var attrName = CodeHintUtils.getAttrNameForValueHint(myCodeMirror, pos);
                expect(attrName).toEqual("");
            });
            
            it("it should find an attribute as a tag is getting typed", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class="');
                
                myCodeMirror.setValue(content);
                var attrName = CodeHintUtils.getAttrNameForValueHint(myCodeMirror, pos);
                expect(attrName).toEqual("class");
            });
            
            it("it should find an attribute as it's added to a tag", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>', '<div class="clearfix">'],
                    '<p id="', '>test</p>',
                    [ '</div>', '</body>', '</html>']);
                
                myCodeMirror.setValue(content);
                var attrName = CodeHintUtils.getAttrNameForValueHint(myCodeMirror, pos);
                expect(attrName).toEqual("id");
            });
            
            it("it should not find an attribute as text is added", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p id="foo">tricky="', '</p>',
                    [ '</body>', '</html>']);
                
                myCodeMirror.setValue(content);
                var attrName = CodeHintUtils.getAttrNameForValueHint(myCodeMirror, pos);
                expect(attrName).toEqual("");
            });
            
            it("it should not find an attribute when the end quote of the value is entered", function () {
                var pos = {"ch": 0, "line": 0};
                var content = getContentAndUpdatePos(pos,
                    ['<html>', '<body>'],
                    '<p class="foo"', '></p>',
                    [ '</body>', '</html>']);
                
                myCodeMirror.setValue(content);
                var attrName = CodeHintUtils.getAttrNameForValueHint(myCodeMirror, pos);
                expect(attrName).toEqual("");
            });
        });
    });
});
