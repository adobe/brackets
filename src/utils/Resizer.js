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
 * A resizable element can be collapsed/expanded using the `show`, `hide` and `toggle` APIs
 *
 * The resizable elements trigger a panelCollapsed and panelExpanded event when the panel toggles
 * between visible and invisible
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
        PreferencesManager      = require("preferences/PreferencesManager"),
        EditorManager           = require("editor/EditorManager");
    
    var PREFERENCES_CLIENT_ID = module.id,
        defaultPrefs = { };
	
    /**
     * @private
     * @type {PreferenceStorage}
     */
    var _prefs = null;
	
    var $mainView;
    
    /**
     * Shows a resizable element.
     * @param {DOMNode} element Html element to show if possible
     */
    function show(element) {
        var showFunc = $(element).data("show");
        if (showFunc) {
            showFunc.apply(element);
        }
    }
    
    /**
     * Hides a resizable element.
     * @param {DOMNode} element Html element to hide if possible
     */
    function hide(element) {
        var hideFunc = $(element).data("hide");
        if (hideFunc) {
            hideFunc.apply(element);
        }
    }
    
    /**
     * Changes the visibility state of a resizable element. The toggle
     * functionality is added when an element is made resizable.
     * @param {DOMNode} element Html element to toggle
     */
    function toggle(element) {
        if ($(element).is(":visible")) {
            hide(element);
        } else {
            show(element);
        }
    }
    
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
     *  - panelResizeStart: When the resize starts
     *  - panelResizeUpdate: When the resize gets updated
     *  - panelResizeEnds: When the resize ends
     *  - panelCollapsed: When the panel gets collapsed (or hidden)
     *  - panelExpanded: When the panel gets expanded (or shown)     
     *
     * @param {DOMNode} element Html element which should be made resizable.
     * @param {string} direction The direction of the resize action. Must be "horz" or "vert".
     * @param {string} position The position of the resizer on the element. Can be "top" or "bottom"
     *                          for vertical resizing and "left" or "right" for horizontal resizing.
     * @param {int} minSize Minimum size (width or height) of the element.
     * @param {boolean} collapsible True indicates the panel is collapsible on double click
     *                              on the resizer.
     * @param {string} forcemargin Classes which margins need to be pushed when the element resizes
     */
    function makeResizable(element, direction, position, minSize, collapsible, forcemargin) {
        
        var $resizer            = $('<div class="' + direction + '-resizer"></div>'),
            $element            = $(element),
            $resizableElement   = $($element.find(".resizable-content:first")[0]),
            $body               = $(window.document.body),
            elementID           = $element.attr("id"),
            elementPrefs        = _prefs.getValue(elementID) || {},
            animationRequest    = null,
            directionProperty   = direction === DIRECTION_HORIZONTAL ? "clientX" : "clientY",
            directionIncrement  = (position === POSITION_TOP || position === POSITION_LEFT) ? 1 : -1,
            elementSizeFunction = direction === DIRECTION_HORIZONTAL ? $element.width : $element.height,
            resizerCSSPosition  = direction === DIRECTION_HORIZONTAL ? "left" : "top",
            contentSizeFunction = direction === DIRECTION_HORIZONTAL ? $resizableElement.width : $resizableElement.height;
		
        minSize = minSize || 0;
        collapsible = collapsible || false;
        
        $element.prepend($resizer);
        
        function forceMargins(size) {
            if (forcemargin !== undefined) {
                $(forcemargin, $element.parent()).css("margin-left", size);
            }
        }
        
        $element.data("show", function () {
            var elementOffset   = $element.offset(),
                elementSize     = elementSizeFunction.apply($element),
                resizerSize     = elementSizeFunction.apply($resizer);
			
            $element.show();
            elementPrefs.visible = true;
            
            if (collapsible) {
                $element.prepend($resizer);
                
                if (position === POSITION_TOP) {
                    $resizer.css(resizerCSSPosition, "");
                } else if (position === POSITION_RIGHT) {
                    $resizer.css(resizerCSSPosition, elementOffset[resizerCSSPosition] + elementSize);
                }
            }
            
            forceMargins(elementSize);
            EditorManager.resizeEditor();
            $element.trigger("panelExpanded", [elementSize]);
            _prefs.setValue(elementID, elementPrefs);
        });
                      
        $element.data("hide", function () {
            var elementOffset   = $element.offset(),
                elementSize     = elementSizeFunction.apply($element),
                resizerSize     = elementSizeFunction.apply($resizer);
            
            $element.hide();
            elementPrefs.visible = false;
            if (collapsible) {
                $resizer.insertBefore($element);
                if (position === POSITION_RIGHT) {
                    $resizer.css(resizerCSSPosition, "");
                } else if (position === POSITION_TOP) {
                    $resizer.css(resizerCSSPosition, elementOffset[resizerCSSPosition] + elementSize - resizerSize);
                }
            }
            
            forceMargins(0);
            EditorManager.resizeEditor();
            $element.trigger("panelCollapsed", [elementSize]);
            _prefs.setValue(elementID, elementPrefs);
        });
        
        // If the resizer is positioned right or bottom of the panel, we need to listen to 
        // reposition it if the element size changes externally		
        function repositionResizer(elementSize) {
            var resizerPosition = elementSize || 1;
            if (position === POSITION_RIGHT || position === POSITION_BOTTOM) {
                $resizer.css(resizerCSSPosition, resizerPosition);
            }
        }
    
        $resizer.on("mousedown", function (e) {
            var $resizeCont     = $("<div class='resizing-container " + direction + "-resizing' />"),
                startPosition   = e[directionProperty],
                startSize       = $element.is(":visible") ? elementSizeFunction.apply($element) : 0,
                newSize         = startSize,
                baseSize        = 0,
                doResize        = false,
                isMouseDown     = true,
                resizeStarted   = false;
            
            $body.append($resizeCont);
                        
            if ($resizableElement !== undefined) {
                $element.children().not(".horz-resizer, .vert-resizer, .resizable-content").each(function (index, child) {
                    if (direction === DIRECTION_HORIZONTAL) {
                        baseSize += $(child).outerWidth();
                    } else {
                        baseSize += $(child).outerHeight();
                    }
                });
            }
                        
            animationRequest = window.webkitRequestAnimationFrame(function doRedraw() {
                // only run this if the mouse is down so we don't constantly loop even 
                // after we're done resizing.
                if (!isMouseDown) {
                    return;
                }
                
                if (doResize) {
                    // resize the main element to the new size
                    if ($element.is(":visible")) {
                        elementSizeFunction.apply($element, [newSize]);
                        
                        // if there is a content element, its size is the new size
                        // minus the size of the non-resizable elements
                        if ($resizableElement !== undefined) {
                            contentSizeFunction.apply($resizableElement, [newSize - baseSize]);
                        }
                    
                        if (newSize < 10) {
                            toggle($element);
                        } else {
                            forceMargins(newSize);
                        }
                    } else if (newSize > 10) {
                        elementSizeFunction.apply($element, [newSize]);
                        toggle($element);
                        $element.trigger("panelResizeStart", [elementSizeFunction.apply($element)]);
                    }
    
                    EditorManager.resizeEditor();
                }
                
                animationRequest = window.webkitRequestAnimationFrame(doRedraw);
            });
            
            $resizeCont.on("mousemove", function (e) {
                
                // Trigger resizeStarted only if we move the mouse to avoid a resizeStarted event
                // when double clicking for collapse/expand functionality
                if (!resizeStarted) {
                    resizeStarted = true;
                    $element.trigger("panelResizeStart", [elementSizeFunction.apply($element)]);
                }
                
                doResize = true;
                // calculate newSize adding to startSize the difference
                // between starting and current position, capped at minSize
                newSize = Math.max(startSize + directionIncrement * (startPosition - e[directionProperty]), minSize);
                $element.trigger("panelResizeUpdate", [newSize]);
                e.preventDefault();
            });
            
            // If the element is marked as collapsible, check for double click
            // to toggle the element visibility
            if (collapsible) {
                $resizeCont.on("mousedown", function (e) {
                    toggle($element);
                });
            }
            
            function endResize(e) {
                var elementSize		= elementSizeFunction.apply($element);
                
                elementPrefs.size = elementSize;
                
                if (contentSizeFunction) {
                    elementPrefs.contentSize = contentSizeFunction.apply($resizableElement);
                }
                
                if (isMouseDown) {
                    isMouseDown = false;
                    repositionResizer(elementSize);
                    $element.trigger("panelResizeEnd", [elementSize]);
                    _prefs.setValue(elementID, elementPrefs);
                    
                    // We wait 100ms to remove the resizer container to capture a mousedown
                    // on the container that would account for double click
                    window.setTimeout(function () {
                        $resizeCont.off("mousemove");
                        $resizeCont.off("mousedown");
                        $resizeCont.remove();
                    }, 100);
                }
            }
            
            $resizeCont.one("mouseup", endResize);
            $resizeCont.mouseleave(endResize);
            
            e.preventDefault();
        });
		
        // Panel preferences initialization
        if (elementPrefs) {
            
            if (elementPrefs.size !== undefined) {
                elementSizeFunction.apply($element, [Math.max(elementPrefs.size, minSize)]);
            }
            
            if (elementPrefs.contentSize !== undefined) {
                contentSizeFunction.apply($resizableElement, [Math.max(elementPrefs.contentSize, minSize)]);
            }
            
            if (elementPrefs.visible !== undefined && !elementPrefs.visible) {
                hide($element);
            } else {
                forceMargins(elementSizeFunction.apply($element));
                repositionResizer(elementSizeFunction.apply($element));
            }
        }
    }
	
    // Init PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs);
    
    // Scan DOM for horz-resizable and vert-resizable classes and make them resizable
    AppInit.htmlReady(function () {
        var minSize = DEFAULT_MIN_SIZE;
		
        $mainView = $(".main-view");
        
        $(".vert-resizable").each(function (index, element) {
            
            if ($(element).data().minsize !== undefined) {
                minSize = $(element).data().minsize;
            }
			
            if ($(element).hasClass("top-resizer")) {
                makeResizable(element, DIRECTION_VERTICAL, POSITION_TOP, minSize, $(element).hasClass("collapsible"));
            }
            
            //if ($(element).hasClass("bottom-resizer")) {
            //    makeResizable(element, DIRECTION_VERTICAL, POSITION_BOTTOM, DEFAULT_MIN_SIZE);
            //}
        });
        
        $(".horz-resizable").each(function (index, element) {
            
            if ($(element).data().minsize !== undefined) {
                minSize = $(element).data().minsize;
            }
            
            //if ($(element).hasClass("left-resizer")) {
            //    makeResizable(element, DIRECTION_HORIZONTAL, POSITION_LEFT, DEFAULT_MIN_SIZE);
            //}

            if ($(element).hasClass("right-resizer")) {
                makeResizable(element, DIRECTION_HORIZONTAL, POSITION_RIGHT, minSize, $(element).hasClass("collapsible"), $(element).data().forcemargin);
            }
        });
    });
    
    exports.makeResizable = makeResizable;
    exports.toggle = toggle;
    exports.show = show;
    exports.hide = hide;
});