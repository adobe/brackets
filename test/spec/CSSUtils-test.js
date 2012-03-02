/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    var CSSUtils        = require("CSSUtils"),
        SpecRunnerUtils = require("./SpecRunnerUtils.js");

    describe("CSS Utils", function () {
        var content = "";
        
        beforeEach(function () {
            var doneReading = false;
            
            // Read the contents of bootstrap.css. This will be used for all tests below
            runs(function () {
                var testFilePath = SpecRunnerUtils.getTestPath("/spec/CSSUtils-test-files/");
                
                brackets.fs.readFile(testFilePath + "bootstrap.css", "utf8", function (err, fileContents) {
                    content = fileContents;
                    doneReading = true;
                });
            });
            
            waitsFor(function () { return doneReading; }, 1000);
        });

        it("should find the first instance of the h2 selector", function () {
            var selector = CSSUtils._findSelector(content, "h2");
            
            expect(selector).not.toBe(null);
            expect(selector.start).toBe(4371);
            expect(selector.end).toBe(4482);
        });
        
        it("should find all instances of the h2 selector", function () {
            var selectors = CSSUtils._findAllMatchingSelectors(content, "h2");
            expect(selectors).not.toBe(null);
            expect(selectors.length).toBe(2);
            expect(selectors[0].start).toBe(4371);
            expect(selectors[0].end).toBe(4482);
            expect(selectors[1].start).toBe(4667);
            expect(selectors[1].end).toBe(4712);
        });
        
        it("should return null when a findSelector cannot find a match", function () {
            var selector = CSSUtils._findSelector(content, "NO-SUCH-SELECTOR");
            expect(selector).toBe(null);
        });
        
        it("should return an empty array when findAllMatchingSelectors() can't find any matches", function () {
            var selectors = CSSUtils._findAllMatchingSelectors(content, "NO-SUCH-SELECTOR");
            expect(selectors.length).toBe(0);
        });
    });
});
