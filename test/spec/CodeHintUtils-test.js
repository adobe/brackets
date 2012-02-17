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
                var content = '<html><body><p class="';
                myCodeMirror.setValue(content);
                var pos = {"ch": content.length, "line": 0};
                var attrName = CodeHintUtils.getAttrNameForValueHint(myCodeMirror, pos);
                expect(attrName).toEqual("class");
            });
            
            it("it should find an attribute as it's added to a tag", function () {
                var content = '<html><body><div class="clearfix"><p id="';
                var contentAfter = '></p></div></body></html>';
                myCodeMirror.setValue(content + contentAfter);
                var pos = {"ch": content.length, "line": 0};
                var attrName = CodeHintUtils.getAttrNameForValueHint(myCodeMirror, pos);
                expect(attrName).toEqual("id");
            });
            
            it("it should not find an attribute as text is added", function () {
                var content = '<html><body><p id="foo">tricky="';
                var contentAfter = '</p></body></html>';
                myCodeMirror.setValue(content + contentAfter);
                var pos = {"ch": content.length, "line": 0};
                var attrName = CodeHintUtils.getAttrNameForValueHint(myCodeMirror, pos);
                expect(attrName).toEqual("");
            });
        });
    });
});
