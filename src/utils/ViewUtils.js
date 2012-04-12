/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    require("thirdparty/jquery.ba-resize");

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
        var scrollTop       = element.scrollTop,
            clientHeight    = element.clientHeight,
            scrollHeight    = element.scrollHeight,
            shadowTop       = Math.min(scrollTop - 20, -10),
            shadowBottom    = clientHeight + 10; // outside of viewport
        
        if (scrollHeight > clientHeight) {
            var reveal = Math.min(scrollHeight - (scrollTop + clientHeight), 10);
            shadowBottom = clientHeight - reveal;
        }
        
        $(element).css("background-position", "0px " + shadowTop + "px, 0px " + shadowBottom + "px");
    }

    /** 
     * Installs event handlers for updatng shadow background elements to indicate vertical scrolling.
     * @param {!DOMElement} element the DOMElement using the scrollerShadow class
     */
    function installScrollShadowHandlers(element) {
        var $element = $(element),
            handler = function () { _updateScrollerShadow(element); };
        
        // update shadows when the scrolling element resizes or scrolls
        $element.on("resize", handler);
        $element.on("scroll", handler);
        
        // update shadows when the children of the scrolling element resize
        $element.children().on("resize", handler);
    }

    // Define public API
    exports.updateChildrenToParentScrollwidth = updateChildrenToParentScrollwidth;
    exports.installScrollShadowHandlers = installScrollShadowHandlers;
});
