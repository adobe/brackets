/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, document, window */

/**
 * Allows JSLint to run on the current document and report results in a UI panel.
 *
 */
define(function (require, exports, module) {
    "use strict";

    var VERTICAL = "ver";
    var HORIZONTAL = "hor";
    
    var DEFAULT_MIN_HEIGHT = 100;
    
    // Load dependent modules
    var AppInit                 = require("utils/AppInit"),
        EditorManager           = require("editor/EditorManager");
    
    // These vars are initialized by the htmlReady handler
    // below since they refer to DOM elements
    var $mainView;
    
    //
    var resizePromises = {};
    
    /**
     * 
     *
     */
    function makeResizable(element, direction, minSize) {
        
        var $resizer            = $('<div class="' + direction + '-resizer"></div>'),
            $element            = $(element),
            $resizableElement   = $($element.find(".resizable:first")[0]),
            $body               = $(document.body),
            $deferred           = $.Deferred(),
            animationRequest    = null,
            directionProperty   = direction === HORIZONTAL ? "clientX" : "clientY",
            elementSizeFunction = direction === HORIZONTAL ? $element.width : $element.height,
            contSizeFunction    = null;
                
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
            
            $deferred.notify("start");
            
            if ($resizableElement !== undefined) {
                $element.children().not(".hor-resizer, ver-resizer, .resizable").each(function (index, child) {
                    if (direction === HORIZONTAL) {
                        baseSize += $(child).outerWidth();
                    } else {
                        baseSize += $(child).outerHeight();
                    }
                });
            }

            $body.toggleClass(direction + "-resizing");
            
            animationRequest = window.webkitRequestAnimationFrame(function doRedraw() {
                // only run this if the mouse is down so we don't constantly loop even 
                // after we're done resizing.
                if (!isMouseDown) {
                    return;
                }
                
                if (doResize) {
                    // resize the main element to the new height
                    elementSizeFunction.apply($element, [newSize]);
                    //$element.height(newHeight);
                    
                    // if there is an internal resizable element, get the size of
                    // all the other elements and set the resizable element size to
                    // the rest
                    if ($resizableElement !== undefined) {
                        elementSizeFunction.apply($resizableElement, [newSize - baseSize]);
                        //$resizableElement.height(newSize - baseSize);
                    }
                    
                    EditorManager.resizeEditor();
                    
                    $deferred.notify("update");
                }
                
                animationRequest = window.webkitRequestAnimationFrame(doRedraw);
            });
            
            $mainView.on("mousemove", function (e) {
                // calculate newHeight as difference between starting and current
                // position, capped at minHeight if exists
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
    
    //
    function promise(element) {
        return resizePromises[element.attr("id")] || new $.Deferred().promise();
    }
    
    // Scan DOM for hresizable and vresizable classes and make them resizable
    AppInit.htmlReady(function () {
        $mainView = $(".main-view");
        
        $(".vresizable").each(function (index, element) {
            makeResizable(element, VERTICAL, DEFAULT_MIN_HEIGHT);
        });
        
        $(".hresizable").each(function (index, element) {
            makeResizable(element, HORIZONTAL, DEFAULT_MIN_HEIGHT);
        });
    });
    
    exports.makeResizable = makeResizable;
    exports.promise = promise;
});