/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, $: false, CodeMirror: false */

define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem = require("NativeFileSystem").NativeFileSystem,
        CSSManager       = require("CSSManager"),
        SpecRunnerUtils  = require("./SpecRunnerUtils.js");
    
    var testPath                = SpecRunnerUtils.getTestPath("/spec/CSSManager-test-files"),
        simpleCssFileEntry      = new NativeFileSystem.FileEntry(testPath + "/simple.css"),
        universalCssFileEntry   = new NativeFileSystem.FileEntry(testPath + "/universal.css");
    
    // jasmine matcher for sprint 4 selector matching
    var toMatchLastSelectorElement = function (expected, selectorIndex) {
        var info    = this.actual,
            ruleset = this.actual.ruleset;
        
        if (ruleset) {
            var selector,
                selectorCount   = ruleset.selectors.length;
            
            if (selectorIndex !== undefined) {
                selector = ruleset.selectors[selectorIndex];
            } else if (selectorCount) {
                selector = ruleset.selectors[selectorCount - 1];
            }
            
            if (selector) {
                var elementCount = selector.elements.length;
                
                if (elementCount) {
                    // match the last selector element
                    return selector.elements[elementCount - 1].value === expected;
                }
            }
        }
        
        return false;
    };
    
    function init(spec, fileEntry) {
        spec.cssManager = new CSSManager.CSSManager();
        
        if (fileEntry) {
            spec.addMatchers({toMatchLastSelectorElement: toMatchLastSelectorElement});
            
            var styleRules;
            
            runs(function () {
                spec.cssManager.loadFile(fileEntry).done(function (result) {
                    styleRules = result;
                });
            });
            
            waitsFor(function () { return styleRules; }, 1000);
        }
    }
    
    describe("CSSManager", function () {
        
        beforeEach(function () {
            init(this);
        });
        
        describe("initial state", function () {
            
            it("should initialize with no rules", function () {
                expect(this.cssManager.getStyleRules().length).toEqual(0);
            });
            
        });
        
        describe("loadFiles", function () {
            
            it("should parse a simple selectors from a file", function () {
                var styleRules = null,
                    loadFile   = false;
                
                runs(function () {
                    this.cssManager.loadFile(simpleCssFileEntry).done(function (result) {
                        styleRules = result;
                    });
                });
                
                waitsFor(function () { return styleRules; }, 1000);
                
                runs(function () {
                    expect(styleRules.length).toEqual(6);
                    expect(styleRules[0].source.fullPath).toEqual(simpleCssFileEntry.fullPath);
                    expect(this.cssManager.getStyleRules()).toEqual(styleRules);
                });
            });
        });
        
        describe("findMatchingRules() with simple selectors", function () {
        
            beforeEach(function () {
                init(this, simpleCssFileEntry);
            });
            
            it("should match type selectors", function () {
                var matches = this.cssManager.findMatchingRules("html");
                
                expect(matches.length).toEqual(2);
                expect(matches[0]).toMatchLastSelectorElement("html");
                expect(matches[1]).toMatchLastSelectorElement("HTML");
            });
            
            it("should match class name selectors", function () {
                var matches = this.cssManager.findMatchingRules(".firstGrade");
                
                expect(matches.length).toEqual(2);
                
                // Parser will save selectors as lowercase
                expect(matches[0]).toMatchLastSelectorElement(".firstGrade");
                expect(matches[1]).toMatchLastSelectorElement(".FIRSTGRADE");
            });
            
            it("should match IDs", function () {
                var matches = this.cssManager.findMatchingRules("#brack3ts");
                
                expect(matches.length).toEqual(2);
                expect(matches[0]).toMatchLastSelectorElement("#brack3ts");
                expect(matches[1]).toMatchLastSelectorElement("#BRACK3TS");
            });
            
            it("should not find a universal selector", function () {
                var matches = this.cssManager.findMatchingRules("pre");
                
                // html and universal selector
                expect(matches.length).toEqual(0);
            });
        });
        
        describe("findMatchingRules() with the universal selector", function () {
        
            beforeEach(function () {
                init(this, universalCssFileEntry);
            });
            
            it("should match the universal selector alone", function () {
                var matches = this.cssManager.findMatchingRules("blockquote");
                
                expect(matches.length).toEqual(1);
                expect(matches[0]).toMatchLastSelectorElement("*");
            });
            
            it("should match a tag name selector", function () {
                var matches = this.cssManager.findMatchingRules("p");
                
                expect(matches.length).toEqual(2);
                expect(matches[0]).toMatchLastSelectorElement("*");
                expect(matches[1]).toMatchLastSelectorElement("p");
            });
            
            it("should match a class name selector", function () {
                var matches = this.cssManager.findMatchingRules(".firstGrade");
                
                expect(matches.length).toEqual(2);
                expect(matches[0]).toMatchLastSelectorElement("*");
                expect(matches[1]).toMatchLastSelectorElement(".firstGrade");
            });
            
            it("should match an id selector", function () {
                var matches = this.cssManager.findMatchingRules("#brack3ts");
                
                expect(matches.length).toEqual(2);
                expect(matches[0]).toMatchLastSelectorElement("*");
                expect(matches[1]).toMatchLastSelectorElement("#brack3ts");
            });
        });
        
        describe("findMatchingRules() with selector grouping", function () {
        
            beforeEach(function () {
                var groupsFile = new NativeFileSystem.FileEntry(testPath + "/groups.css");
                init(this, groupsFile);
            });
            
            it("should match a selector in any position of a group", function () {
                var matches = this.cssManager.findMatchingRules("h1");
                
                expect(matches.length).toEqual(4);
                expect(matches[0]).toMatchLastSelectorElement("h1", 0);
                expect(matches[1]).toMatchLastSelectorElement("h1", 1);
                expect(matches[2]).toMatchLastSelectorElement("h1", 0);
                expect(matches[3]).toMatchLastSelectorElement("h1", 2);
            });
        });
        
        describe("findMatchingRules() with sprint 4 exemptions", function () {
        
            beforeEach(function () {
                var sprint4exemptions = new NativeFileSystem.FileEntry(testPath + "/sprint4.css");
                init(this, sprint4exemptions);
            });
            
            it("should match a class selector (right-most only, no pseudo or attr selectors)", function () {
                var matches = this.cssManager.findMatchingRules(".message");
                
                expect(matches.length).toEqual(4);
                expect(matches[0]).toMatchLastSelectorElement(".message", 0);
                expect(matches[1]).toMatchLastSelectorElement(".message", 0);
                expect(matches[2]).toMatchLastSelectorElement(".message", 0);
                expect(matches[3]).toMatchLastSelectorElement(".message", 1);
            });
            
            it("should match a type selector (can terminate with class name, ID, pseudo or attr selectors)", function () {
                var matches = this.cssManager.findMatchingRules("h4");
                
                expect(matches.length).toEqual(5);
                console.log(matches);
            });
        });
    });
});