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
        
        var testPath            = SpecRunnerUtils.getTestPath("/spec/CSSManager-test-files"),
            simpleCssFileEntry  = new NativeFileSystem.FileEntry(testPath + "/simple.css"),
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
                    expect(styleRules.length).toEqual(4);
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
                
                // html and universal selector
                expect(matches.length).toEqual(1);
                expect(matches[0].mSelectorText).toBe("html");
            });
            
            it("should match class name selectors", function () {
                var tagInfo = {
                    tag     : "html",
                    clazz   : "firstGrade"
                };
                
                var matches = cssManager.findMatchingRules(tagInfo);
                
                // html and universal selector
                expect(matches.length).toEqual(1);
                expect(matches[0].mSelectorText).toBe("firstGrade");
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
    });
});