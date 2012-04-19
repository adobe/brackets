/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

define(function (require, exports, module) {
    'use strict';
    
    var SCROLL_SHADOW_HEIGHT = 5;

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
     * @param {!DOMElement} displayElement the DOMElement that displays the shadow
     * @param {!Object} scrollElement the object that is scrolled
     */
    function _updateScrollerShadow(displayElement, scrollElement) {
        var yPos        = Math.min(scrollElement.scrollTop - SCROLL_SHADOW_HEIGHT, 0);
        
        $(displayElement).css("background-position", "0px " + yPos + "px");
    }

    /** 
     * Installs event handlers for updatng shadow background elements to indicate vertical scrolling.
     * @param {!DOMElement} displayElement the DOMElement that displays the shadow
     * @param {?Object} scrollElement the object that is scrolled. If null, the displayElement is used.
     */
    function installScrollShadow(displayElement, scrollElement) {
        if (!scrollElement) {
            scrollElement = displayElement;
        }
        
        // update shadows when the scrolling element is scrolled
        var $displayElement = $(displayElement);
        var $scrollElement = $(scrollElement);
        $displayElement.toggleClass("scrollerShadow", true);
        $scrollElement.on("scroll", function () { _updateScrollerShadow(displayElement, scrollElement); });
        
        // update immediately
        _updateScrollerShadow(displayElement, scrollElement);
    }
    
    /** 
     * Within a scrolling DOMElement, creates and positions a styled selection
     * div to align a single selected list item.
     * 
     * @param {!DOMElement} scrollElement A DOMElement containing a list
     * @param {!string} selectedClassName A CSS class name on at most one list item in the contained list
     */
    function sidebarList($scrollElement, selectedClassName) {
        var $listElement = $scrollElement.find("ul"),
            $listItem,
            $selectionMarker,
            $selectionTriangle,
            $fileSection = $("#file-section"),
            selectionMarkerTop,
            selectionTriangleTop;
        
        // build selectionMarker with background and triangle visuals
        $selectionMarker = $(document.createElement("div")).prependTo($scrollElement).addClass("sidebarSelection");
        $selectionTriangle = $(document.createElement("div")).addClass("sidebarSelectionTriangle");
        $fileSection.append($selectionTriangle);
        
        // enable scrolling
        $scrollElement.css("overflow", "auto");
        
        // use relative postioning for clipping the selectionMarker within the scrollElement
        $scrollElement.css("position", "relative");
        
        selectedClassName = "." + (selectedClassName || "selected");
        
        var updateSelectionMarker = function () {
            // find the selected list item
            $listItem = $listElement.find(selectedClassName).closest("li");
            
            if ($listItem.length === 1) {
                // list item position is relative to it's immediate parent UL
                selectionMarkerTop = $listItem.position().top;
                
                // determine top position relative to scroller by sum of nested list items
                $.each($listItem.parentsUntil($scrollElement, "li"), function (index, ancestor) {
                    selectionMarkerTop += $(ancestor).position().top;
                });
                
                // triangle top position is relative to file-section div
                selectionTriangleTop = selectionMarkerTop;
                
                // offset by current scroll position
                selectionMarkerTop += $scrollElement[0].scrollTop;
                
                // move the selectionMarker position to align with the list item
                $selectionMarker.css("top", selectionMarkerTop);
                
                // adjust triangle position by scrollElement top offset
                selectionTriangleTop += $scrollElement.position().top + (Math.sqrt(200) * 0.9); // FIXME height / 2
                
                $selectionTriangle.css("top", selectionTriangleTop);
                $selectionTriangle.css("right", -$selectionTriangle.width());
                    
                // force selection width to match scroller
                $selectionMarker.width($scrollElement[0].scrollWidth);
                
                $selectionTriangle.show();
                $selectionMarker.show();
            } else {
                // hide the selection marker when no selection is found
                $selectionTriangle.hide();
                $selectionMarker.hide();
            }
        };
        
        $listElement.bind("selectionChanged", updateSelectionMarker);
        $scrollElement.bind("scroll", updateSelectionMarker);
        
        // update immediately
        updateSelectionMarker();
    }

    // Define public API
    exports.SCROLL_SHADOW_HEIGHT = SCROLL_SHADOW_HEIGHT;
    
    exports.updateChildrenToParentScrollwidth = updateChildrenToParentScrollwidth;
    exports.installScrollShadow = installScrollShadow;
    exports.sidebarList = sidebarList;
});
