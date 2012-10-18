/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window */

/**
 * Resizer is a Module utility to inject resizing capabilities to any element
 * inside Brackets.
 * 
 * On initialization, Resizer discovers all nodes tagged as "vert-resizable" 
 * and "horz-resizable" to add the resizer handler. Additionally, "top-resizer", 
 * "bottom-resizer", "left-resizer" and "right-resizer" classes control the 
 * position of the resizer on the element.
 *
 * An element can be made resizable at any time using the `makeResizable` API
 *
 * The resizable elements trigger a panelResizeStart, panelResizeUpdate and panelResizeEnd
 * event that can be used to create performance optimizations (such as hiding/showing elements 
 * while resizing), custom or internal resizes and save the final resized value into local 
 * storage for example.
 *
 * TODO Trigger panelResizeStart and panelResizeUpdate as required. They aren't needed
 *      currently.
 */
define(function (require, exports, module) {
    "use strict";

    var DIRECTION_VERTICAL = "vert";
    var DIRECTION_HORIZONTAL = "horz";
    
    var POSITION_TOP = "top";
    var POSITION_BOTTOM = "bottom";
    var POSITION_LEFT = "left";
    var POSITION_RIGHT = "right";
    
    // Minimum size (height or width) for autodiscovered resizable panels
    var DEFAULT_MIN_SIZE = 100;
    
    // Load dependent modules
    var AppInit                 = require("utils/AppInit"),
        EditorManager           = require("editor/EditorManager");
    
    var $mainView;
    
    /**
     * Adds resizing capabilities to a given html element.
     *
     * Resizing can be configured in two directions:
     *  - Vertical ("vert"): Resizes the height of the element
     *  - Horizontal ("horz"): Resizes the width of the element
     *
     * Resizer handlers can be positioned on the element at:
     *  - Top ("top") or bottom ("bottom") for vertical resizing
     *  - Left ("left") or right ("right") for horizontal resizing
     *
     * A resizable element triggers the following events while resizing:
     *  - panelResizeEnds: When the resize ends
     *
     * @param {DOMNode} element Html element which should be made resizable.
     * @param {string} direction The direction of the resize action. Must be "horz" or "vert".
     * @param {string} position The position of the resizer on the element. Can be "top" or "bottom"
     *                          for vertical resizing and "left" or "right" for horizontal resizing.
     * @param {int} minSize Minimum size (width or height) of the element.
     */
    function makeResizable(element, direction, position, minSize) {
        
        var $resizer            = $('<div class="' + direction + '-resizer"></div>'),
            $element            = $(element),
            $resizableElement   = $($element.find(".resizable-content:first")[0]),
            $body               = $(window.document.body),
            animationRequest    = null,
            directionProperty   = direction === DIRECTION_HORIZONTAL ? "clientX" : "clientY",
            elementSizeFunction = direction === DIRECTION_HORIZONTAL ? $element.width : $element.height,
            contentSizeFunction = null;
                
        minSize = minSize || 0;
            
        $element.prepend($resizer);
        
        $resizer.on("mousedown", function (e) {
            var $resizeCont     = $("<div class='resizing-container " + direction + "-resizing' />"),
                startPosition   = e[directionProperty],
                startSize       = elementSizeFunction.apply($element),
                newSize         = startSize,
                baseSize        = 0,
                doResize        = true,
                isMouseDown     = true;
            
            $body.append($resizeCont);

            if ($resizableElement !== undefined) {
                $element.children().not(".horz-resizer, .vert-resizer, .resizable-content").each(function (index, child) {
                    if (direction === DIRECTION_HORIZONTAL) {
                        baseSize += $(child).outerWidth();
                    } else {
                        baseSize += $(child).outerHeight();
                    }
                });
                
                contentSizeFunction = direction === DIRECTION_HORIZONTAL ? $resizableElement.width : $resizableElement.height;
            }
                        
            animationRequest = window.webkitRequestAnimationFrame(function doRedraw() {
                // only run this if the mouse is down so we don't constantly loop even 
                // after we're done resizing.
                if (!isMouseDown) {
                    return;
                }
                
                if (doResize) {
                    // resize the main element to the new size
                    elementSizeFunction.apply($element, [newSize]);
                    
                    // if there is a content element, its size is the new size
                    // minus the size of the non-resizable elements
                    if ($resizableElement !== undefined) {
                        contentSizeFunction.apply($resizableElement, [newSize - baseSize]);
                    }
                    
                    EditorManager.resizeEditor();
                }
                
                animationRequest = window.webkitRequestAnimationFrame(doRedraw);
            });
            
            $resizeCont.on("mousemove", function (e) {
                // calculate newSize adding to startSize the difference
                // between starting and current position, capped at minSize
                newSize = Math.max(startSize + (startPosition - e[directionProperty]), minSize);
                e.preventDefault();
            });
            
            function endResize(e) {
                if (isMouseDown) {
                    isMouseDown = false;
                    $resizeCont.off("mousemove");
                    $resizeCont.remove();
                    $element.trigger("panelResizeEnd", [elementSizeFunction.apply($element)]);
                }
            }
            
            $resizeCont.one("mouseup", endResize);
            $resizeCont.mouseleave(endResize);
            
            e.preventDefault();
        });
    }
    
    // Scan DOM for horz-resizable and vert-resizable classes and make them resizable
    AppInit.htmlReady(function () {
        $mainView = $(".main-view");
        
        $(".vert-resizable").each(function (index, element) {
            
            if ($(element).hasClass("top-resizer")) {
                makeResizable(element, DIRECTION_VERTICAL, POSITION_TOP, DEFAULT_MIN_SIZE);
            }
            
            //if ($(element).hasClass("bottom-resizer")) {
            //    makeResizable(element, DIRECTION_VERTICAL, POSITION_BOTTOM, DEFAULT_MIN_SIZE);
            //}
        });
        
        $(".horz-resizable").each(function (index, element) {
            
            //if ($(element).hasClass("left-resizer")) {
            //    makeResizable(element, DIRECTION_HORIZONTAL, POSITION_LEFT, DEFAULT_MIN_SIZE);
            //}

            //if ($(element).hasClass("right-resizer")) {
            //    makeResizable(element, DIRECTION_HORIZONTAL, POSITION_RIGHT, DEFAULT_MIN_SIZE);
            //}
        });
    });
    
    exports.makeResizable = makeResizable;
});