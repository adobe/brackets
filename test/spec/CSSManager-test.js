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
    
    describe("CSSManager", function () {
        
        var testPath                = SpecRunnerUtils.getTestPath("/spec/CSSManager-test-files"),
            simpleCssFileEntry      = new NativeFileSystem.FileEntry(testPath + "/simple.css"),
            universalCssFileEntry   = new NativeFileSystem.FileEntry(testPath + "/universal.css"),
            cssManager;
        
        beforeEach(function () {
            cssManager = new CSSManager.CSSManager();
        });
        
        describe("initial state", function () {
            
            it("should initialize with no rules", function () {
                expect(cssManager.getStyleRules().length).toEqual(0);
            });
            
        });
        
        describe("loadFiles", function () {
            
            it("should parse a simple selectors from a file", function () {
                var styleRules = null,
                    loadFile   = false;
                
                runs(function () {
                    cssManager.loadFile(simpleCssFileEntry).done(function (result) {
                        styleRules = result;
                    });
                });
                
                waitsFor(function () { return styleRules; }, 1000);
                
                runs(function () {
                    expect(styleRules.length).toEqual(6);
                    expect(cssManager.getStyleRules()).toEqual(styleRules);
                });
            });
        });
        
        describe("findMatchingRules() with simple selectors", function () {
            
            beforeEach(function () {
                var styleRules;
                
                runs(function () {
                    cssManager.loadFile(simpleCssFileEntry).done(function (result) {
                        styleRules = result;
                    });
                });
                
                waitsFor(function () { return styleRules; }, 1000);
            });
            
            it("should match tag name selectors", function () {
                var tagInfo = {
                    tag: "html"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                expect(matches.length).toEqual(2);
                expect(matches[0].mSelectorText).toBe("html");
                expect(matches[1].mSelectorText).toBe("HTML");
            });
            
            it("should match class name selectors", function () {
                var tagInfo = {
                    tag     : "p",
                    clazz   : "firstGrade"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                expect(matches.length).toEqual(2);
                
                // Parser will save selectors as lowercase
                expect(matches[0].mSelectorText).toBe(".firstGrade");
                expect(matches[1].mSelectorText).toBe(".FIRSTGRADE");
            });
            
            it("should match case-insensetive IDs", function () {
                var tagInfo = {
                    tag     : "p",
                    id      : "JasonSanJose"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                expect(matches.length).toEqual(2);
                expect(matches[0].mSelectorText).toBe("#JasonSanJose");
                expect(matches[1].mSelectorText).toBe("#jasonsanjose");
            });
            
            it("should not find a universal selector", function () {
                var tagInfo = {
                    tag: "jason"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                // html and universal selector
                expect(matches.length).toEqual(0);
            });
        });
        
        
        describe("findMatchingRules() with compound selectors", function () {
            
            beforeEach(function () {
                var styleRules;
                
                runs(function () {
                    cssManager.loadFile(universalCssFileEntry).done(function (result) {
                        styleRules = result;
                    });
                });
                
                waitsFor(function () { return styleRules; }, 1000);
            });
            
            it("should match the universal selector", function () {
                var tagInfo = {
                    tag: "blockquote"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                expect(matches.length).toEqual(1);
                expect(matches[0].mSelectorText).toBe("*");
            });
            
            it("should match tag name selectors", function () {
                var tagInfo = {
                    tag: "p"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                expect(matches.length).toEqual(2);
                expect(matches[0].mSelectorText).toBe("*");
                expect(matches[1].mSelectorText).toBe("p");
            });
            
            it("should match class name selectors", function () {
                var tagInfo = {
                    tag: "pre",
                    clazz: "firstGrade"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                expect(matches.length).toEqual(2);
                expect(matches[0].mSelectorText).toBe("*");
                expect(matches[1].mSelectorText).toBe(".firstGrade");
            });
            
            it("should match a compound tag and class name selector", function () {
                var tagInfo = {
                    tag: "p",
                    clazz: "firstGrade"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                expect(matches.length).toEqual(3);
                expect(matches[0].mSelectorText).toBe("*");
                expect(matches[1].mSelectorText).toBe(".firstGrade");
                expect(matches[2].mSelectorText).toBe("p");
            });
            
            it("should match a compound tag name and id selector", function () {
                var tagInfo = {
                    tag: "p",
                    id: "JasonSanJose"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                expect(matches.length).toEqual(3);
                expect(matches[0].mSelectorText).toBe("*");
                expect(matches[1].mSelectorText).toBe("p");
                expect(matches[2].mSelectorText).toBe("#JasonSanJose");
            });
            
            it("should match a compound tag name, class name and id selector", function () {
                var tagInfo = {
                    tag: "p",
                    clazz: "firstGrade",
                    id: "JasonSanJose"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                expect(matches.length).toEqual(4);
                expect(matches[0].mSelectorText).toBe("*");
                expect(matches[1].mSelectorText).toBe(".firstGrade");
                expect(matches[2].mSelectorText).toBe("p");
                expect(matches[3].mSelectorText).toBe("#JasonSanJose");
            });
        });
    });
});