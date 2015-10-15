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
 * An element can be made resizable at any time using the `makeResizable()` API.
 * Panel sizes are saved via preferences and restored when the DOM node becomes resizable
 * again in a subsequent launch.
 *
 * The resizable elements trigger a panelResizeStart, panelResizeUpdate and panelResizeEnd
 * event that can be used to create performance optimizations (such as hiding/showing elements
 * while resizing), custom layout logic, etc. See makeResizable() for details on the events.
 *
 * A resizable element can be collapsed/expanded using the `show`, `hide` and `toggle` APIs or
 * via user action. This triggers panelCollapsed/panelExpanded events - see makeResizable().
 */
define(function (require, exports, module) {
    "use strict";

    var DIRECTION_VERTICAL = "vert";
    var DIRECTION_HORIZONTAL = "horz";
    
    var POSITION_TOP = "top";
    var POSITION_BOTTOM = "bottom";
    var POSITION_LEFT = "left";
    var POSITION_RIGHT = "right";
    var PREFS_PURE_CODE = "noDistractions";
	
    // Minimum size (height or width) for autodiscovered resizable panels
    var DEFAULT_MIN_SIZE = 100;
    
    // Load dependent modules
    var AppInit                 = require("utils/AppInit"),
        EventDispatcher         = require("utils/EventDispatcher"),
        ViewUtils               = require("utils/ViewUtils"),
        PreferencesManager      = require("preferences/PreferencesManager");
    
    var $mainView;
    
    var isResizing = false;

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
     * Removes the resizability of an element if it's resizable
     * @param {DOMNode} element Html element in which to remove sizing 
     */
    function removeSizable(element) {
        var removeSizableFunc = $(element).data("removeSizable");
        if (removeSizableFunc) {
            removeSizableFunc.apply(element);
        }
    }
    
    /**
     * Updates the sizing div by resyncing to the sizing edge of the element
     * Call this method after manually changing the size of the element
     * @param {DOMNode} element Html element whose sizer should be resynchronized
     */
    function resyncSizer(element) {
        var resyncSizerFunc = $(element).data("resyncSizer");
        if (resyncSizerFunc) {
            resyncSizerFunc.apply(element);
        }
    }
    
    /**
     * Returns the visibility state of a resizable element.
     * @param {DOMNode} element Html element to toggle
     * @return {boolean} true if element is visible, false if it is not visible
     */
    function isVisible(element) {
        return $(element).is(":visible");
    }
    
    /**
     * Adds resizing and (optionally) expand/collapse capabilities to a given html element. The element's size
     * & visibility are automatically saved & restored as a view-state preference.
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
     *  - panelResizeStart: When the resize starts. Passed the new size.
     *  - panelResizeUpdate: When the resize gets updated. Passed the new size.
     *  - panelResizeEnd: When the resize ends. Passed the final size.
     *  - panelCollapsed: When the panel gets collapsed (or hidden). Passed the last size
     *      before collapse. May occur without any resize events.
     *  - panelExpanded: When the panel gets expanded (or shown). Passed the initial size.
     *      May occur without any resize events.
     *
     * @param {!DOMNode} element DOM element which should be made resizable. Must have an id attribute, for
     *                          use as a preferences key.
     * @param {!string} direction Direction of the resize action: one of the DIRECTION_* constants.
     * @param {!string} position Which side of the element can be dragged: one of the POSITION_* constants
     *                          (TOP/BOTTOM for vertical resizing or LEFT/RIGHT for horizontal).
     * @param {?number} minSize Minimum size (width or height) of the element's outer dimensions, including
     *                          border & padding. Defaults to DEFAULT_MIN_SIZE.
     * @param {?boolean} collapsible Indicates the panel is collapsible on double click on the
     *                          resizer. Defaults to false.
     * @param {?string} forceLeft CSS selector indicating element whose 'left' should be locked to the
     *                          the resizable element's size (useful for siblings laid out to the right of
     *                          the element). Must lie in element's parent's subtree.
     * @param {?boolean} createdByWorkspaceManager For internal use only
     * @param {?boolean} usePercentages Maintain the size of the element as a percentage of its parent
     *                          the default is to maintain the size of the element in pixels
     * @param {?boolean} _attachToParent Attaches the resizer element to parent of the element rather than
     *                          to element itself. Attach the resizer to the parent *ONLY* if element has the
     *                          same offset as parent otherwise the resizer will be incorrectly positioned. 
     *                          FOR INTERNAL USE ONLY
     */
    function makeResizable(element, direction, position, minSize, collapsible, forceLeft, createdByWorkspaceManager, usePercentages, _attachToParent) {
        var $resizer            = $('<div class="' + direction + '-resizer"></div>'),
            $element            = $(element),
            $parent             = $element.parent(),
            $resizableElement   = $($element.find(".resizable-content:first")[0]),
            $body               = $(window.document.body),
            elementID           = $element.attr("id"),
            elementPrefs        = PreferencesManager.getViewState(elementID) || {},
            animationRequest    = null,
            directionProperty   = direction === DIRECTION_HORIZONTAL ? "clientX" : "clientY",
            directionIncrement  = (position === POSITION_TOP || position === POSITION_LEFT) ? 1 : -1,
            parentSizeFunction  = direction === DIRECTION_HORIZONTAL ? $parent.innerWidth : $parent.innerHeight,
            
            elementSizeFunction = function (newSize) {
                if (!newSize) {
                    // calling the function as a getter
                    if (direction === DIRECTION_HORIZONTAL) {
                        return this.width();
                    } else {
                        return this.height();
                    }
                } else if (!usePercentages) {
                    if (direction === DIRECTION_HORIZONTAL) {
                        return this.width(newSize);
                    } else {
                        return this.height(newSize);
                    }
                } else {
                    // calling the function as a setter
                    var parentSize = parentSizeFunction.apply($parent),
                        percentage,
                        prop;

                    if (direction === DIRECTION_HORIZONTAL) {
                        prop = "width";
                    } else {
                        prop = "height";
                    }
                    percentage = newSize / parentSize;
                    this.css(prop, (percentage * 100) + "%");
                    
                    return this; // chainable
                }
            },
            
            resizerCSSPosition  = direction === DIRECTION_HORIZONTAL ? "left" : "top",
            contentSizeFunction = direction === DIRECTION_HORIZONTAL ? $resizableElement.width : $resizableElement.height;

        if (PreferencesManager.get(PREFS_PURE_CODE)) {
            elementPrefs.visible = false;
        }

        if (!elementID) {
            console.error("Resizable panels must have a DOM id to use as a preferences key:", element);
            return;
        }
        // Detect legacy cases where panels in the editor area are created without using WorkspaceManager APIs
        if ($parent[0] && $parent.is(".content") && !createdByWorkspaceManager) {
            console.error("Resizable panels within the editor area should be created via WorkspaceManager.createBottomPanel(). \nElement:", element);
            return;
        }
        
        if (minSize === undefined) {
            minSize = DEFAULT_MIN_SIZE;
        }

        collapsible = collapsible || false;
        
        if (_attachToParent) {
            $parent.prepend($resizer);
        } else {
            $element.prepend($resizer);
        }
        // Important so min/max sizes behave predictably
        $element.css("box-sizing", "border-box");
        
        function adjustSibling(size) {
            if (forceLeft !== undefined) {
                $(forceLeft, $parent).css("left", size);
            }
        }
        
        function resizeElement(elementSize, contentSize) {
            elementSizeFunction.apply($element, [elementSize]);
            
            if ($resizableElement.length) {
                contentSizeFunction.apply($resizableElement, [contentSize]);
            }
        }
        
        // If the resizer is positioned right or bottom of the panel, we need to listen to
        // reposition it if the element size changes externally
        function repositionResizer(elementSize) {
            var resizerPosition = elementSize || 1;
            if (position === POSITION_RIGHT || position === POSITION_BOTTOM) {
                $resizer.css(resizerCSSPosition, resizerPosition);
            }
        }
            
        $element.data("removeSizable", function () {
            $resizer.off(".resizer");
            
            $element.removeData("show");
            $element.removeData("hide");
            $element.removeData("resyncSizer");
            $element.removeData("removeSizable");
            
            $resizer.remove();
        });
        
        $element.data("resyncSizer", function () {
            repositionResizer(elementSizeFunction.apply($element));
        });
        
        $element.data("show", function () {
            var elementOffset   = $element.offset(),
                elementSize     = elementSizeFunction.apply($element) || elementPrefs.size,
                contentSize     = contentSizeFunction.apply($resizableElement) || elementPrefs.contentSize;
            
            // Resize the element before showing it again. If the panel was collapsed by dragging
            // the resizer, the size of the element should be 0, so we restore size in preferences
            resizeElement(elementSize, contentSize);
            
            $element.show();
            elementPrefs.visible = true;
            
            if (collapsible) {
                if (_attachToParent) {
                    $parent.prepend($resizer);
                } else {
                    $element.prepend($resizer);
                }
                if (position === POSITION_TOP) {
                    $resizer.css(resizerCSSPosition, "");
                } else if (position === POSITION_RIGHT) {
                    $resizer.css(resizerCSSPosition, elementOffset[resizerCSSPosition] + elementSize);
                }
            }
            
            adjustSibling(elementSize);
            
            $element.trigger("panelExpanded", [elementSize]);
            PreferencesManager.setViewState(elementID, elementPrefs, null, isResizing);
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
            
            adjustSibling(0);
            
            $element.trigger("panelCollapsed", [elementSize]);
            PreferencesManager.setViewState(elementID, elementPrefs, null, isResizing);
        });
        

        $resizer.on("mousedown.resizer", function (e) {
            var $resizeShield   = $("<div class='resizing-container " + direction + "-resizing' />"),
                startPosition   = e[directionProperty],
                startSize       = $element.is(":visible") ? elementSizeFunction.apply($element) : 0,
                newSize         = startSize,
                previousSize    = startSize,
                baseSize        = 0,
                resizeStarted   = false;
            
            isResizing = true;
            $body.append($resizeShield);
                        
            if ($resizableElement.length) {
                $element.children().not(".horz-resizer, .vert-resizer, .resizable-content").each(function (index, child) {
                    if (direction === DIRECTION_HORIZONTAL) {
                        baseSize += $(child).outerWidth();
                    } else {
                        baseSize += $(child).outerHeight();
                    }
                });
            }
                        
            function doRedraw() {
                // only run this if the mouse is down so we don't constantly loop even
                // after we're done resizing.
                if (!isResizing) {
                    return;
                }
                
                // Check for real size changes to avoid unnecessary resizing and events
                if (newSize !== previousSize) {
                    previousSize = newSize;
                    
                    if ($element.is(":visible")) {
                        if (newSize < 10) {
                            toggle($element);
                            elementSizeFunction.apply($element, [0]);
                        } else {
                            // Trigger resizeStarted just before the first successful resize update
                            if (!resizeStarted) {
                                resizeStarted = true;
                                $element.trigger("panelResizeStart", newSize);
                            }
                            
                            // Resize the main element to the new size. If there is a content element,
                            // its size is the new size minus the size of the non-resizable elements
                            resizeElement(newSize, (newSize - baseSize));
                            adjustSibling(newSize);
                            
                            $element.trigger("panelResizeUpdate", [newSize]);
                        }
                    } else if (newSize > 10) {
                        elementSizeFunction.apply($element, [newSize]);
                        toggle($element);
                        
                        // Trigger resizeStarted after expanding the element if it was previously collapsed
                        if (!resizeStarted) {
                            resizeStarted = true;
                            $element.trigger("panelResizeStart", newSize);
                        }
                    }
                }
                
                animationRequest = window.requestAnimationFrame(doRedraw);
            }
            
            function onMouseMove(e) {
                // calculate newSize adding to startSize the difference
                // between starting and current position, capped at minSize
                newSize = Math.max(startSize + directionIncrement * (startPosition - e[directionProperty]), minSize);
                
                // respect max size if one provided (e.g. by WorkspaceManager)
                var maxSize = $element.data("maxsize");
                if (maxSize !== undefined) {
                    newSize = Math.min(newSize, maxSize);
                }
                                   
                e.preventDefault();
                
                if (animationRequest === null) {
                    animationRequest = window.requestAnimationFrame(doRedraw);
                }
            }
            
            $(window.document).on("mousemove", onMouseMove);
            
            // If the element is marked as collapsible, check for double click
            // to toggle the element visibility
            if (collapsible) {
                $resizeShield.on("mousedown", function (e) {
                    $(window.document).off("mousemove", onMouseMove);
                    $resizeShield.off("mousedown");
                    $resizeShield.remove();
                    animationRequest = null;
                    toggle($element);
                });
            }
            
            function endResize(e) {
                if (isResizing) {
                    
                    var elementSize	= elementSizeFunction.apply($element);
                    if ($element.is(":visible")) {
                        elementPrefs.size = elementSize;
                        if ($resizableElement.length) {
                            elementPrefs.contentSize = contentSizeFunction.apply($resizableElement);
                        }
                        PreferencesManager.setViewState(elementID, elementPrefs);
                        repositionResizer(elementSize);
                    }

                    isResizing = false;
                    
                    if (resizeStarted) {
                        $element.trigger("panelResizeEnd", [elementSize]);
                    }
                    
                    // We wait 300ms to remove the resizer container to capture a mousedown
                    // on the container that would account for double click
                    window.setTimeout(function () {
                        $(window.document).off("mousemove", onMouseMove);
                        $resizeShield.off("mousedown");
                        $resizeShield.remove();
                        animationRequest = null;
                    }, 300);
                }
            }
            
            $(window.document).one("mouseup", endResize);
            
            e.preventDefault();
        });
		
        // Panel preferences initialization
        if (elementPrefs) {
            
            if (elementPrefs.size !== undefined) {
                elementSizeFunction.apply($element, [elementPrefs.size]);
            }
            
            if (elementPrefs.contentSize !== undefined) {
                contentSizeFunction.apply($resizableElement, [elementPrefs.contentSize]);
            }
            
            if (elementPrefs.visible !== undefined && !elementPrefs.visible) {
                hide($element);
            } else {
                adjustSibling(elementSizeFunction.apply($element));
                repositionResizer(elementSizeFunction.apply($element));
            }
        }
    }

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
                makeResizable(element, DIRECTION_HORIZONTAL, POSITION_RIGHT, minSize, $(element).hasClass("collapsible"), $(element).data().forceleft);
            }
        });

        // The main toolbar is only collapsible.
        if ($("#main-toolbar").hasClass("collapsible") && PreferencesManager.get(PREFS_PURE_CODE)) {
            ViewUtils.hideMainToolBar();
        }
    });
    
    /**
     * @private
     * Examine each preference key for migration of any panel state.
     *
     * @param {string} key The key of the preference to be examined
     *      for migration of panel states.
     * @return {?string} - the scope to which the preference is to be migrated
     */
    function _isPanelPreferences(key) {
        if (key) {
            return "user";
        }
        
        return null;
    }

    PreferencesManager.convertPreferences(module, {"panelState": "user"}, true, _isPanelPreferences);

    EventDispatcher.makeEventDispatcher(exports);
    
    exports.makeResizable   = makeResizable;
    exports.removeSizable   = removeSizable;
    exports.resyncSizer     = resyncSizer;
    exports.toggle          = toggle;
    exports.show            = show;
    exports.hide            = hide;
    exports.isVisible       = isVisible;
    
    //Resizer Constants
    exports.DIRECTION_VERTICAL   = DIRECTION_VERTICAL;
    exports.DIRECTION_HORIZONTAL = DIRECTION_HORIZONTAL;
    exports.POSITION_TOP         = POSITION_TOP;
    exports.POSITION_RIGHT       = POSITION_RIGHT;
    exports.POSITION_BOTTOM      = POSITION_BOTTOM;
    exports.POSITION_LEFT        = POSITION_LEFT;
});
