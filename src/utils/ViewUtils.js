/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var _                   = require("thirdparty/lodash"),
        LanguageManager     = require("language/LanguageManager");

    var SCROLL_SHADOW_HEIGHT = 5;

    /**
     * @private
     */
    var _resizeHandlers = [];

    /**
     * Positions shadow background elements to indicate vertical scrolling.
     * @param {!DOMElement} $displayElement the DOMElement that displays the shadow
     * @param {!Object} $scrollElement the object that is scrolled
     * @param {!DOMElement} $shadowTop div .scroller-shadow.top
     * @param {!DOMElement} $shadowBottom div .scroller-shadow.bottom
     * @param {boolean} isPositionFixed When using absolute position, top remains at 0.
     */
    function _updateScrollerShadow($displayElement, $scrollElement, $shadowTop, $shadowBottom, isPositionFixed) {
        var offsetTop           = 0,
            scrollElement       = $scrollElement.get(0),
            scrollTop           = scrollElement.scrollTop,
            topShadowOffset     = Math.min(scrollTop - SCROLL_SHADOW_HEIGHT, 0),
            displayElementWidth = $displayElement.width();

        if ($shadowTop) {
            $shadowTop.css("background-position", "0px " + topShadowOffset + "px");

            if (isPositionFixed) {
                offsetTop = $displayElement.offset().top;
                $shadowTop.css("top", offsetTop);
            }

            if (isPositionFixed) {
                $shadowTop.css("width", displayElementWidth);
            }
        }

        if ($shadowBottom) {
            var clientHeight        = scrollElement.clientHeight,
                outerHeight         = $displayElement.outerHeight(),
                scrollHeight        = scrollElement.scrollHeight,
                bottomShadowOffset  = SCROLL_SHADOW_HEIGHT; // outside of shadow div viewport

            if (scrollHeight > clientHeight) {
                bottomShadowOffset -= Math.min(SCROLL_SHADOW_HEIGHT, (scrollHeight - (scrollTop + clientHeight)));
            }

            $shadowBottom.css("background-position", "0px " + bottomShadowOffset + "px");
            $shadowBottom.css("top", offsetTop + outerHeight - SCROLL_SHADOW_HEIGHT);
            $shadowBottom.css("width", displayElementWidth);
        }
    }

    function getOrCreateShadow($displayElement, position, isPositionFixed) {
        var $findShadow = $displayElement.find(".scroller-shadow." + position);

        if ($findShadow.length === 0) {
            $findShadow = $(window.document.createElement("div")).addClass("scroller-shadow " + position);
            $displayElement.append($findShadow);
        }

        if (!isPositionFixed) {
            // position is fixed by default
            $findShadow.css("position", "absolute");
            $findShadow.css(position, "0");
        }

        return $findShadow;
    }

    /**
     * Installs event handlers for updatng shadow background elements to indicate vertical scrolling.
     * @param {!DOMElement} displayElement the DOMElement that displays the shadow. Must fire
     *  "contentChanged" events when the element is resized or repositioned.
     * @param {?Object} scrollElement the object that is scrolled. Must fire "scroll" events
     *  when the element is scrolled. If null, the displayElement is used.
     * @param {?boolean} showBottom optionally show the bottom shadow
     */
    function addScrollerShadow(displayElement, scrollElement, showBottom) {
        // use fixed positioning when the display and scroll elements are the same
        var isPositionFixed = false;

        if (!scrollElement) {
            scrollElement = displayElement;
            isPositionFixed = true;
        }

        // update shadows when the scrolling element is scrolled
        var $displayElement = $(displayElement),
            $scrollElement = $(scrollElement);

        var $shadowTop = getOrCreateShadow($displayElement, "top", isPositionFixed);
        var $shadowBottom = (showBottom) ? getOrCreateShadow($displayElement, "bottom", isPositionFixed) : null;

        var doUpdate = function () {
            _updateScrollerShadow($displayElement, $scrollElement, $shadowTop, $shadowBottom, isPositionFixed);
        };

        // remove any previously installed listeners on this node
        $scrollElement.off("scroll.scroller-shadow");
        $displayElement.off("contentChanged.scroller-shadow");

        // add new ones
        $scrollElement.on("scroll.scroller-shadow", doUpdate);
        $displayElement.on("contentChanged.scroller-shadow", doUpdate);

        // update immediately
        doUpdate();
    }

    /**
     * Remove scroller-shadow effect.
     * @param {!DOMElement} displayElement the DOMElement that displays the shadow
     * @param {?Object} scrollElement the object that is scrolled
     */
    function removeScrollerShadow(displayElement, scrollElement) {
        if (!scrollElement) {
            scrollElement = displayElement;
        }

        var $displayElement = $(displayElement),
            $scrollElement = $(scrollElement);

        // remove scrollerShadow elements from DOM
        $displayElement.find(".scroller-shadow.top").remove();
        $displayElement.find(".scroller-shadow.bottom").remove();

        // remove event handlers
        $scrollElement.off("scroll.scroller-shadow");
        $displayElement.off("contentChanged.scroller-shadow");
    }

    /**
     * Utility function to replace jQuery.toggleClass when used with the second argument, which needs to be a true boolean for jQuery
     * @param {!jQueryObject} $domElement The jQueryObject to toggle the Class on
     * @param {!string} className Class name or names (separated by spaces) to toggle
     * @param {!boolean} addClass A truthy value to add the class and a falsy value to remove the class
     */
    function toggleClass($domElement, className, addClass) {
        if (addClass) {
            $domElement.addClass(className);
        } else {
            $domElement.removeClass(className);
        }
    }

    /**
     * Within a scrolling DOMElement, creates and positions a styled selection
     * div to align a single selected list item from a ul list element.
     *
     * Assumptions:
     * - scrollerElement is a child of the #sidebar div
     * - ul list element fires a "selectionChanged" event after the
     *   selectedClassName is assigned to a new list item
     *
     * @param {!DOMElement} scrollElement A DOMElement containing a ul list element
     * @param {!string} selectedClassName A CSS class name on at most one list item in the contained list
     */
    function sidebarList($scrollerElement, selectedClassName, leafClassName) {
        var $listElement = $scrollerElement.find("ul"),
            $selectionMarker,
            $selectionExtension,
            $sidebar = $("#sidebar"),
            showExtension = true;

        // build selectionMarker and position absolute within the scroller
        $selectionMarker = $(window.document.createElement("div")).addClass("sidebar-selection");
        $scrollerElement.prepend($selectionMarker);

        // enable scrolling
        $scrollerElement.css("overflow", "auto");

        // use relative postioning for clipping the selectionMarker within the scrollElement
        $scrollerElement.css("position", "relative");

        // build selectionExtension and position fixed to the window
        $selectionExtension = $(window.document.createElement("div")).addClass("sidebar-selection-extension");

        $scrollerElement.append($selectionExtension);

        selectedClassName = "." + (selectedClassName || "selected");

        var updateSelectionExtension = function () {
            var selectionMarkerHeight = $selectionMarker.height(),
                selectionMarkerOffset = $selectionMarker.offset(),  // offset relative to *document*
                scrollerOffset = $scrollerElement.offset(),
                selectionExtensionHeight = $selectionExtension.outerHeight(),
                scrollerTop = scrollerOffset.top,
                scrollerBottom = scrollerTop + $scrollerElement.outerHeight(),
                selectionExtensionTop = selectionMarkerOffset.top;

            $selectionExtension.css("top", selectionExtensionTop);
            $selectionExtension.css("left", $sidebar.width() - $selectionExtension.outerWidth());
            toggleClass($selectionExtension, "selectionExtension-visible", showExtension);

            var selectionExtensionClipOffsetYBy = Math.floor((selectionMarkerHeight - selectionExtensionHeight) / 2),
                selectionExtensionBottom = selectionExtensionTop + selectionExtensionHeight + selectionExtensionClipOffsetYBy;

            if (selectionExtensionTop < scrollerTop || selectionExtensionBottom > scrollerBottom) {
                $selectionExtension.css("clip", "rect(" + Math.max(scrollerTop - selectionExtensionTop - selectionExtensionClipOffsetYBy, 0) + "px, auto, " +
                                           (selectionExtensionHeight - Math.max(selectionExtensionBottom - scrollerBottom, 0)) + "px, auto)");
            } else {
                $selectionExtension.css("clip", "");
            }
        };

        var hideSelectionMarker = function (event) {
            $selectionExtension.addClass("forced-hidden");
            $selectionMarker.addClass("forced-hidden");
        };

        var updateSelectionMarker = function (event, reveal) {
            // find the selected list item
            var $listItem = $listElement.find(selectedClassName).closest("li");

            if (leafClassName) {
                showExtension = $listItem.hasClass(leafClassName);
            }

            $selectionExtension.removeClass("forced-hidden");
            $selectionMarker.removeClass("forced-hidden");

            // always hide selection visuals first to force layout (issue #719)
            $selectionExtension.hide();
            $selectionMarker.hide();

            if ($listItem.length === 1) {
                // list item position is relative to scroller
                var selectionMarkerTop = $listItem.offset().top - $scrollerElement.offset().top + $scrollerElement.get(0).scrollTop;

                // move the selectionMarker position to align with the list item
                $selectionMarker.css("top", selectionMarkerTop);
                $selectionMarker.show();

                updateSelectionExtension();
                $selectionExtension.show();

                // fully scroll to the selectionMarker if it's not initially in the viewport
                var scrollerElement = $scrollerElement.get(0),
                    scrollerHeight = scrollerElement.clientHeight,
                    selectionMarkerHeight = $selectionMarker.height(),
                    selectionMarkerBottom = selectionMarkerTop + selectionMarkerHeight,
                    currentScrollBottom = scrollerElement.scrollTop + scrollerHeight;

                // update scrollTop to reveal the selected list item
                if (reveal) {
                    if (selectionMarkerTop >= currentScrollBottom) {
                        $listItem.get(0).scrollIntoView(false);
                    } else if (selectionMarkerBottom <= scrollerElement.scrollTop) {
                        $listItem.get(0).scrollIntoView(true);
                    }
                }
            }
        };

        $listElement.on("selectionChanged", updateSelectionMarker);
        $scrollerElement.on("scroll", updateSelectionExtension);
        $scrollerElement.on("selectionRedraw", updateSelectionExtension);
        $scrollerElement.on("selectionHide", hideSelectionMarker);

        // update immediately
        updateSelectionMarker();

        // update clipping when the window resizes
        _resizeHandlers.push(updateSelectionExtension);
    }

    /**
     * @private
     */
    function _handleResize() {
        _resizeHandlers.forEach(function (f) {
            f.apply();
        });
    }

    /**
     * Determine how much of an element rect is clipped in view.
     *
     * @param {!DOMElement} $view - A jQuery scrolling container
     * @param {!{top: number, left: number, height: number, width: number}}
     *          elementRect - rectangle of element's default position/size
     * @return {{top: number, right: number, bottom: number, left: number}}
     *          amount element rect is clipped in each direction
     */
    function getElementClipSize($view, elementRect) {
        var delta,
            clip = { top: 0, right: 0, bottom: 0, left: 0 },
            viewOffset = $view.offset() || { top: 0, left: 0};

        // Check if element extends below viewport
        delta = (elementRect.top + elementRect.height) - (viewOffset.top + $view.height());
        if (delta > 0) {
            clip.bottom = delta;
        }

        // Check if element extends above viewport
        delta = viewOffset.top - elementRect.top;
        if (delta > 0) {
            clip.top = delta;
        }

        // Check if element extends to the left of viewport
        delta = viewOffset.left - elementRect.left;
        if (delta > 0) {
            clip.left = delta;
        }

        // Check if element extends to the right of viewport
        delta = (elementRect.left + elementRect.width) - (viewOffset.left + $view.width());
        if (delta > 0) {
            clip.right = delta;
        }

        return clip;
    }

    /**
     * Within a scrolling DOMElement, if necessary, scroll element into viewport.
     *
     * To Perform the minimum amount of scrolling necessary, cases should be handled as follows:
     * - element already completely in view : no scrolling
     * - element above    viewport          : scroll view so element is at top
     * - element left of  viewport          : scroll view so element is at left
     * - element below    viewport          : scroll view so element is at bottom
     * - element right of viewport          : scroll view so element is at right
     *
     * Assumptions:
     * - $view is a scrolling container
     *
     * @param {!DOMElement} $view - A jQuery scrolling container
     * @param {!DOMElement} $element - A jQuery element
     * @param {?boolean} scrollHorizontal - whether to also scroll horizontally
     */
    function scrollElementIntoView($view, $element, scrollHorizontal) {
        var elementOffset = $element.offset();

        // scroll minimum amount
        var elementRect = {
                top:    elementOffset.top,
                left:   elementOffset.left,
                height: $element.height(),
                width:  $element.width()
            },
            clip = getElementClipSize($view, elementRect);

        if (clip.bottom > 0) {
            // below viewport
            $view.scrollTop($view.scrollTop() + clip.bottom);
        } else if (clip.top > 0) {
            // above viewport
            $view.scrollTop($view.scrollTop() - clip.top);
        }

        if (scrollHorizontal) {
            if (clip.left > 0) {
                $view.scrollLeft($view.scrollLeft() - clip.left);
            } else if (clip.right > 0) {
                $view.scrollLeft($view.scrollLeft() + clip.right);
            }
        }
    }

    /**
     * HTML formats a file entry name  for display in the sidebar.
     * @param {!File} entry File entry to display
     * @return {string} HTML formatted string
     */
    function getFileEntryDisplay(entry) {
        var name = entry.name,
            ext = LanguageManager.getCompoundFileExtension(name),
            i = name.lastIndexOf("." + ext);

        if (i > 0) {
            // Escape all HTML-sensitive characters in filename.
            name = _.escape(name.substring(0, i)) + "<span class='extension'>" + _.escape(name.substring(i)) + "</span>";
        } else {
            name = _.escape(name);
        }

        return name;
    }

    /**
     * Determine the minimum directory path to distinguish duplicate file names
     * for each file in list.
     *
     * @param {Array.<File>} files - list of Files with the same filename
     * @return {Array.<string>} directory paths to match list of files
     */
    function getDirNamesForDuplicateFiles(files) {
        // Must have at least two files in list for this to make sense
        if (files.length <= 1) {
            return [];
        }

        // First collect paths from the list of files and fill map with them
        var map = {}, filePaths = [], displayPaths = [];
        files.forEach(function (file, index) {
            var fp = file.fullPath.split("/");
            fp.pop(); // Remove the filename itself
            displayPaths[index] = fp.pop();
            filePaths[index] = fp;

            if (!map[displayPaths[index]]) {
                map[displayPaths[index]] = [index];
            } else {
                map[displayPaths[index]].push(index);
            }
        });

        // This function is used to loop through map and resolve duplicate names
        var processMap = function (map) {
            var didSomething = false;
            _.forEach(map, function (arr, key) {
                // length > 1 means we have duplicates that need to be resolved
                if (arr.length > 1) {
                    arr.forEach(function (index) {
                        if (filePaths[index].length !== 0) {
                            displayPaths[index] = filePaths[index].pop() + "/" + displayPaths[index];
                            didSomething = true;

                            if (!map[displayPaths[index]]) {
                                map[displayPaths[index]] = [index];
                            } else {
                                map[displayPaths[index]].push(index);
                            }
                        }
                    });
                }
                delete map[key];
            });
            return didSomething;
        };

        var repeat;
        do {
            repeat = processMap(map);
        } while (repeat);

        return displayPaths;
    }

    function traverseViewArray(viewArray, startIndex, direction) {
        if (Math.abs(direction) !== 1) {
            console.error("traverseViewArray called with unsupported direction: " + direction.toString());
            return null;
        }
        if (startIndex === -1) {
            // If doc not in view list, return most recent view list item
            if (viewArray.length > 0) {
                return viewArray[0];
            }
        } else if (viewArray.length > 1) {
            // If doc is in view list, return next/prev item with wrap-around
            startIndex += direction;
            if (startIndex >= viewArray.length) {
                startIndex = 0;
            } else if (startIndex < 0) {
                startIndex = viewArray.length - 1;
            }

            return viewArray[startIndex];
        }

        // If no doc open or view list empty, there is no "next" file
        return null;
    }

    function hideMainToolBar() {
        $("#main-toolbar").addClass("forced-hidden");
        $(".main-view .content").each(function (index, element) {
            $(element).addClass("force-right-zero");
        });
    }

    function showMainToolBar() {
        $("#main-toolbar").removeClass("forced-hidden");
        $(".main-view .content").each(function (index, element) {
            $(element).removeClass("force-right-zero");
        });
    }

    // handle all resize handlers in a single listener
    $(window).resize(_handleResize);

    // Define public API
    exports.SCROLL_SHADOW_HEIGHT         = SCROLL_SHADOW_HEIGHT;
    exports.addScrollerShadow            = addScrollerShadow;
    exports.removeScrollerShadow         = removeScrollerShadow;
    exports.sidebarList                  = sidebarList;
    exports.showMainToolBar              = showMainToolBar;
    exports.hideMainToolBar              = hideMainToolBar;
    exports.scrollElementIntoView        = scrollElementIntoView;
    exports.getElementClipSize           = getElementClipSize;
    exports.getFileEntryDisplay          = getFileEntryDisplay;
    exports.toggleClass                  = toggleClass;
    exports.getDirNamesForDuplicateFiles = getDirNamesForDuplicateFiles;
    exports.traverseViewArray            = traverseViewArray;
});
