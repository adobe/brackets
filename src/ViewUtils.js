/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules


    /** If a parent div has overflow:auto then the child will have a problem
     * setting the background color. The reason for this is the width of the 
     * child is the visible width of the parent and not the scrollWidth, so if
     * the div scrolls the background looks wrong.
     * @param {!JQuery} $parent the jQuery parent for the object 
     */
    function updateChildWidthToParentScrollwidth($parent) {
        var $firstChild = $parent.children().first();
        //clear the width first so we get the natural scrollWidth below
        $firstChild.width("");
        
        var targetWidth = $parent[0].scrollWidth -
            parseInt($parent.css("paddingLeft"), 10) -
            parseInt($parent.css("paddingRight"), 10);
        
        $firstChild.width(targetWidth);
    }


    // Define public API
    exports.updateChildWidthToParentScrollwidth = updateChildWidthToParentScrollwidth;
});
