/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, $: false, beforeEach: false, afterEach: false, it: false, expect: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var ViewUtils = require("utils/ViewUtils");
    
    describe("ViewUtils", function () {

        /*
         * Note: This suite uses ViewUtils to apply the .scrollerShadow class to the fixture.
         * However, the brackets.less file is not part of the SpecRunner. Therefore, no background-image
         * is displayed or animated. These tests simply validate that the correct
         * background-position value is written to the scrolling DOMElement.
         */
        describe("Scroller Shadows", function () {
            
            var $fixture,
                fixture;
            
            beforeEach(function () {
                /* 100% x 100px scroller with 100px x 1000px content */
                $fixture = $("<div style='overflow:auto;height:100px'><div id='content' style='width:100px;height:1000px'></div></div>");
                fixture = $fixture[0];
                $(document.body).append($fixture);
            });
            
            afterEach(function () {
                $fixture.remove();
            });
            
            function scrollTop(val) {
                fixture.scrollTop = val;
                
                // scrollTop does not trigger scroll event, fire manually.
                $fixture.trigger("scroll");
            }
            
            function backgroundY(position) {
                return parseInt($fixture.find(".scrollerShadow." + position).css("background-position").split(" ")[1], 10);
            }
        
            it("should not show the top shadow when no scrolling is available", function () {
                $fixture.find("#content").height(50); // make height shorter than the viewport
                ViewUtils.addScrollerShadow(fixture, null, true);
                
                expect(fixture.scrollTop).toEqual(0);
                expect(backgroundY("top")).toEqual(-ViewUtils.SCROLL_SHADOW_HEIGHT);
                expect(backgroundY("bottom")).toEqual(ViewUtils.SCROLL_SHADOW_HEIGHT);
            });
        
            it("should partially reveal the shadow", function () {
                ViewUtils.addScrollerShadow(fixture, null, true);
                scrollTop(3);
                expect(backgroundY("top")).toEqual(3 - ViewUtils.SCROLL_SHADOW_HEIGHT);
                expect(backgroundY("bottom")).toEqual(0);
                
                scrollTop(899);
                expect(backgroundY("top")).toEqual(0);
                expect(backgroundY("bottom")).toEqual(4);
            });
        
            it("should update shadow position when installed", function () {
                scrollTop(100);
                ViewUtils.addScrollerShadow(fixture, null, true);
                
                expect(backgroundY("top")).toEqual(0);
            });
        
            it("should fully reveal the shadow at the bottommost scroll position", function () {
                ViewUtils.addScrollerShadow(fixture, null, true);
                scrollTop(900);
                
                expect(backgroundY("top")).toEqual(0);
                expect(backgroundY("bottom")).toEqual(ViewUtils.SCROLL_SHADOW_HEIGHT);
            });
        
        });
    });
});
