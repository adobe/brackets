/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, document, window */

/**
 * Resizer is a Module utility to inject resizing capabilities to any element
 * inside Brackets.
 * 
 * On initialization, Resizer discovers all nodes tagged as "ver-resizable" 
 * and "hor-resizable" to add the resizer handler. Additionally, "top-resizer", 
 * "bottom-resizer", "left-resizer" and "right-resizer" classes control de 
 * position of the resizer on the element.
 *
 * An element can be made resizable at any time using the `makeResizable` API
 *
 * The `makeResizable` and `resizing` APIs return a promise that can be used to 
 * get updates about the resizing operations. The associated deferred object is
 * notified on resize start, progress and completion. This can be used to create
 * performance optimizations (such as hiding/showing elements while resizing),
 * custom or internal resizes and save the final resized value into local storage
 * for example.
 */
define(function (require, exports, module) {
    "use strict";

    var DIRECTION_VERTICAL = "ver";
    var DIRECTION_HORIZONTAL = "hor";
    
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
    
    // Map of resize promises
    var resizePromises = {};
    
    /**
     * Adds resizing capabilities to a given html element.
     *
     * Resizing can be configured in two directions:
     *  - Vertical ("ver"): Resizes the height of the element
     *  - Horizontal ("hor"): Resizes the width of the element
     *
     * Resizer handlers can be positioned on the element at:
     *  - Top ("top") or bottom ("bottom") for vertical resizing
     *  - Left ("left") or right ("right") for horizontal resizing
     *
     * A resize operation notifies its associated deferred object at:
     *  - start: When the resize starts 
     *  - update: On resize updates (every time it is redrawn)
     *  - end: When the resize ends
     *
     * @param {DOMNode} element Html element which should be made resizable.
     * @param {string} direction The direction of the resize action. Must be "hor" or "ver".
     * @param {string} position The position of the resizer on the element. Can be "top" or "bottom"
     * for vertical resizing and "left" or "right" for horizontal resizing.
     * @param {int} minSize Minimum size (width or height) of the element.
     * @return {$.Promise} jQuery Promise object that is never resolved, but gets
     * notified anytime the resize starts, updates or ends.
     */
    function makeResizable(element, direction, position, minSize) {
        
        var $resizer            = $('<div class="' + direction + '-resizer"></div>'),
            $element            = $(element),
            $resizableElement   = $($element.find(".resizable-content:first")[0]),
            $body               = $(document.body),
            $deferred           = $.Deferred(),
            animationRequest    = null,
            directionProperty   = direction === DIRECTION_HORIZONTAL ? "clientX" : "clientY",
            elementSizeFunction = direction === DIRECTION_HORIZONTAL ? $element.width : $element.height,
            contentSizeFunction = null;
                
        minSize = minSize || 0;
        resizePromises[$element.attr("id")] = $deferred.promise();
            
        $element.prepend($resizer);
        
        $resizer.on("mousedown", function (e) {
            var startPosition   = e[directionProperty],
                startSize       = elementSizeFunction.apply($element),
                newSize         = startSize,
                baseSize        = 0,
                doResize        = true,
                isMouseDown     = true;
            
            $deferred.notifyWith($element, ["start", elementSizeFunction.apply($element)]);
            
            if ($resizableElement !== undefined) {
                $element.children().not(".hor-resizer, .ver-resizer, .resizable-content").each(function (index, child) {
                    if (direction === DIRECTION_HORIZONTAL) {
                        baseSize += $(child).outerWidth();
                    } else {
                        baseSize += $(child).outerHeight();
                    }
                });
                
                contentSizeFunction = direction === DIRECTION_HORIZONTAL ? $resizableElement.width : $resizableElement.height;
            }

            $body.toggleClass(direction + "-resizing");
            
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
                    
                    $deferred.notifyWith($element, ["update", elementSizeFunction.apply($element)]);
                }
                
                animationRequest = window.webkitRequestAnimationFrame(doRedraw);
            });
            
            $mainView.on("mousemove", function (e) {
                // calculate newSize adding to startSize the difference
                // between starting and current position, capped at minSize
                newSize = Math.max(startSize + (startPosition - e[directionProperty]), minSize);
                e.preventDefault();
            });
            
            function endResize(e) {
                if (isMouseDown) {
                    isMouseDown = false;
                    $mainView.off("mousemove");
                    $body.toggleClass(direction + "-resizing");
                    $deferred.notifyWith($element, ["end", elementSizeFunction.apply($element)]);
                }
            }
            
            $mainView.one("mouseup", endResize);
            $mainView.mouseleave(endResize);
            
            e.preventDefault();
        });
        
        return $deferred.promise();
    }
    
    /**
     * Gets the resize promise for an element
     *
     * @param {DOMNode} element Already resizable html element
     * @return {$.Promise} jQuery The associated promise object or a new one
     * if the element is not registered as resizable.
     */
    function resizing(element) {
        return resizePromises[element.attr("id")] || new $.Deferred().promise();
    }
    
    // Scan DOM for hor-resizable and ver-resizable classes and make them resizable
    AppInit.htmlReady(function () {
        $mainView = $(".main-view");
        
        $(".ver-resizable").each(function (index, element) {
            
            if ($(element).hasClass("top-resizer")) {
                makeResizable(element, DIRECTION_VERTICAL, POSITION_TOP, DEFAULT_MIN_SIZE);
            }
            
            //if ($(element).hasClass("bottom-resizer")) {
            //    makeResizable(element, DIRECTION_VERTICAL, POSITION_BOTTOM, DEFAULT_MIN_SIZE);
            //}
        });
        
        $(".hor-resizable").each(function (index, element) {
            
            //if ($(element).hasClass("left-resizer")) {
            //    makeResizable(element, DIRECTION_HORIZONTAL, POSITION_LEFT, DEFAULT_MIN_SIZE);
            //}

            //if ($(element).hasClass("bottom-resizer")) {
            //    makeResizable(element, DIRECTION_HORIZONTAL, POSITION_RIGHT, DEFAULT_MIN_SIZE);
            //}
        });
    });
    
    exports.makeResizable = makeResizable;
    exports.resizing = resizing;
});