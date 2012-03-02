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
            var selector = CSSUtils._findAllMatchingSelectorsInText(content, "h2")[0];
            
            expect(selector).not.toBe(null);
            expect(selector.line).toBe(292);
            expect(selector.ruleEndLine).toBe(301);
        });
        
        it("should find all instances of the h2 selector", function () {
            var selectors = CSSUtils._findAllMatchingSelectorsInText(content, "h2");
            expect(selectors).not.toBe(null);
            expect(selectors.length).toBe(2);
            expect(selectors[0].line).toBe(292);
            expect(selectors[0].ruleEndLine).toBe(301);
            expect(selectors[1].line).toBe(318);
            expect(selectors[1].ruleEndLine).toBe(321);
        });
        
        it("should return an empty array when findAllMatchingSelectors() can't find any matches", function () {
            var selectors = CSSUtils._findAllMatchingSelectorsInText(content, "NO-SUCH-SELECTOR");
            expect(selectors.length).toBe(0);
        });
    });
});
