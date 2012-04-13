/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

define(function (require, exports, module) {
    'use strict';
    
    var SCROLL_SHADOW_HEIGHT = 20;

    /** If a parent div has overflow:auto then the child will have a problem
     * setting the background color. The reason for this is the width of the 
     * child is the visible width of the parent and not the scrollWidth, so if
     * the div scrolls the background looks wrong.
     * @param {!JQuery} $parent the jQuery parent for the object 
     */
    function updateChildrenToParentScrollwidth($parent) {
        var $children = $parent.children();
        //clear the width first so we get the natural scrollWidth below
        $children.width("");
        
        var targetWidth = $parent[0].scrollWidth -
            parseInt($parent.css("paddingLeft"), 10) -
            parseInt($parent.css("paddingRight"), 10);
        
        $children.width(targetWidth);
    }

    /** 
     * Positions shadow background elements to indicate vertical scrolling.
     * @param {!DOMElement} element the DOMElement using the scrollerShadow class
     */
    function _updateScrollerShadow(element) {
        var maxReveal   = -(SCROLL_SHADOW_HEIGHT / 2),
            yPos        = Math.min(element.scrollTop - SCROLL_SHADOW_HEIGHT, maxReveal);
        $(element).css("background-position", "0px " + yPos + "px");
    }

    /** 
     * Installs event handlers for updatng shadow background elements to indicate vertical scrolling.
     * @param {!DOMElement} element the DOMElement using the scrollerShadow class
     */
    function installScrollShadow(element) {
        // update shadows when the scrolling element is scrolled
        var $element = $(element);
        $element.toggleClass("scrollerShadow", true);
        $element.on("scroll", function () { _updateScrollerShadow(element); });
        
        // update immediately
        _updateScrollerShadow(element);
    }

    // Define public API
    exports.updateChildrenToParentScrollwidth = updateChildrenToParentScrollwidth;
    exports.installScrollShadow = installScrollShadow;
    exports.SCROLL_SHADOW_HEIGHT = SCROLL_SHADOW_HEIGHT;
});
