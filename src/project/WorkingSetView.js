/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, window, brackets, Mustache  */

/**
 * WorkingSetView generates the UI for the list of the files user is editing based on the model provided by EditorManager.
 * The UI allows the user to see what files are open/dirty and allows them to close files and specify the current editor.
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var AppInit               = require("utils/AppInit"),
        DocumentManager       = require("document/DocumentManager"),
        MainViewManager       = require("view/MainViewManager"),
        CommandManager        = require("command/CommandManager"),
        Commands              = require("command/Commands"),
        Menus                 = require("command/Menus"),
        FileViewController    = require("project/FileViewController"),
        ViewUtils             = require("utils/ViewUtils"),
        KeyEvent              = require("utils/KeyEvent"),
        paneListTemplate      = require("text!htmlContent/working-set.html"),
        Strings               = require("strings"),
        _                     = require("thirdparty/lodash");
    
    /**
     * Open view dictionary  
     * Maps PaneId to WorkingSetView
     * @private
     * @type {Object.<string, WorkingSetView>}
     */
    var _views = {};

    /**
     * Icon Providers
     * @see {@link #addIconProvider}
     * @private
     */
    var _iconProviders = [];
    
    /**
     * Class Providers
     * @see {@link #addClassProvider}
     * @private
     */
    var _classProviders = [];
        

    /**
     * #working-set-list-container 
     * @type {jQuery}
     */
    var $workingFilesContainer;
    
    /**
     * Constants for event.which values
     * @enum {number}
     */
    var LEFT_BUTTON = 1,
        MIDDLE_BUTTON = 2;
    
    /**
     * Each list item in the working set stores a references to the related document in the list item's data.  
     *  Use `listItem.data(_FILE_KEY)` to get the document reference
     * @type {string}
     * @private
     */
    var _FILE_KEY = "file";
    
    /**
     * Constants for hitTest.where 
     * @enum {string}
     */
    var NOMANSLAND = "nomansland",
        NOMOVEITEM = "nomoveitem",
        ABOVEITEM  = "aboveitem",
        BELOWITEM  = "belowitem",
        TOPSCROLL  = "topscroll",
        BOTSCROLL  = "bottomscroll",
        BELOWVIEW  = "belowview",
        ABOVEVIEW  = "aboveview";
    
    /**
     * Drag an item has to move 3px before dragging starts
     * @constant
     */
    var _DRAG_MOVE_DETECTION_START = 3;
    
    /**
     * Refreshes all Pane View List Views
     */
    function refresh(rebuild) {
        _.forEach(_views, function (view) {
            var top = view.$openFilesContainer.scrollTop();
            if (rebuild) {
                view._rebuildViewList(true);
            } else {
                view._redraw();
            }
            view.$openFilesContainer.scrollTop(top);
        });
    }
    
    /** 
     * Synchronizes the selection indicator for all views
     */
    function syncSelectionIndicator() {
        _.forEach(_views, function (view) {
            view.$openFilesContainer.triggerHandler("scroll");
        });
    }
    
    /**
     * Updates the appearance of the list element based on the parameters provided.
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {?File} selectedFile
     */
    function _updateListItemSelection(listItem, selectedFile) {
        var shouldBeSelected = (selectedFile && $(listItem).data(_FILE_KEY).fullPath === selectedFile.fullPath);
        ViewUtils.toggleClass($(listItem), "selected", shouldBeSelected);
    }

    /**
     * Determines if a file is dirty
     * @private
     * @param {!File} file - file to test
     * @return {boolean} true if the file is dirty, false otherwise
     */
    function _isOpenAndDirty(file) {
        // working set item might never have been opened; if so, then it's definitely not dirty
        var docIfOpen = DocumentManager.getOpenDocumentForPath(file.fullPath);
        return (docIfOpen && docIfOpen.isDirty);
    }
    
    
    function _hasSelectionFocus() {
        return FileViewController.getFileSelectionFocus() === FileViewController.WORKING_SET_VIEW;
    }
    
    /** 
     * Turns on/off the flag which suppresses rebuilding of the working set 
     * when the "workingSetSort" event is dispatched from MainViewManager.
     * Only used while dragging things around in the working set to disable
     * rebuilding the list while dragging.
     * @private
     * @param {boolean} suppress - true suppress, false to allow sort redrawing
     */
    function _suppressSortRedrawForAllViews(suppress) {
        _.forEach(_views, function (view) {
            view.suppressSortRedraw = suppress;
        });
    }
    
    /** 
     * turns off the scroll shadow on view containers so they don't interfere with dragging
     * @private
     * @param {Boolean} disable - true to disable, false to enable
     */
    function _suppressScrollShadowsOnAllViews(disable) {
        _.forEach(_views, function (view) {
            if (disable) {
                ViewUtils.removeScrollerShadow(view.$openFilesContainer[0], null);
            } else if (view.$openFilesContainer[0].scrollHeight > view.$openFilesContainer[0].clientHeight) {
                ViewUtils.addScrollerShadow(view.$openFilesContainer[0], null, true);
            }
        });
    }
    
    /** 
     * Deactivates all views so the selection marker does not show
     * @private
     * @param {Boolean} deactivate - true to deactivate, false to reactivate
     */
    function _deactivateAllViews(deactivate) {
        _.forEach(_views, function (view) {
            if (deactivate) {
                if (view.$el.hasClass("active")) {
                    view.$el.removeClass("active").addClass("reactivate");
                    view.$openFilesList.trigger("selectionHide");
                }
            } else {
                if (view.$el.hasClass("reactivate")) {
                    view.$el.removeClass("reactivate").addClass("active");
                }
                // don't update the scroll pos
                view._fireSelectionChanged(false);
            }
        });
    }
    
    /** 
     * Finds the WorkingSetView object for the specified element
     * @private
     * @param {jQuery} $el - the element to find the view for
     * @return {View} view object
     */
    function _viewFromEl($el) {
        if (!$el.hasClass("working-set-view")) {
            $el = $el.parents(".working-set-view");
        }

        var id = $el.attr("id").match(/working\-set\-list\-([\w]+[\w\d\-\.\:\_]*)/).pop();
        return _views[id];
    }
    
    /** 
     * Makes the specified element draggable
     * @private
     * @param {jQuery} $el - the element to make draggable
     */
    function _makeDraggable($el) {
        var interval,
            sourceFile = $el.data(_FILE_KEY);

        // turn off the "hover-scroll" 
        function endScroll($el) {
            if (interval) {
                window.clearInterval(interval);
                interval = undefined;
            }
        }
        
        //  We scroll the list while hovering over the first or last visible list element
        //  in the working set, so that positioning a working set item before or after one
        //  that has been scrolled out of view can be performed.
        // 
        //  This function will call the drag interface repeatedly on an interval to allow
        //  the item to be dragged while scrolling the list until the mouse is moved off 
        //  the first or last item or endScroll is called
        function scroll($container, $el, dir, callback) {
            var container = $container[0],
                maxScroll = container.scrollHeight - container.clientHeight;
            if (maxScroll && dir && !interval) {
                // Scroll view if the mouse is over the first or last pixels of the container
                interval = window.setInterval(function () {
                    var scrollTop = $container.scrollTop();
                    if ((dir === -1 && scrollTop <= 0) || (dir === 1 && scrollTop >= maxScroll)) {
                        endScroll($el);
                    } else {
                        $container.scrollTop(scrollTop + 7 * dir);
                        callback($el);
                    }
                }, 50);
            }
        }
        
        // The mouse down handler pretty much handles everything
        $el.mousedown(function (e) {
            var scrollDir = 0,
                dragged = false,
                startPageY = e.pageY,
                lastPageY = startPageY,
                lastHit = { where: NOMANSLAND },
                tryClosing = $(e.target).hasClass("can-close"),
                currentFile = MainViewManager.getCurrentlyViewedFile(),
                activePaneId = MainViewManager.getActivePaneId(),
                activeView = _views[activePaneId],
                sourceView = _viewFromEl($el),
                currentView = sourceView,
                startingIndex = $el.index(),
                itemHeight,
                offset,
                $copy,
                $ghost,
                draggingCurrentFile;
            
            function initDragging() {
                itemHeight = $el.height();
                offset = $el.offset();
                $copy = $el.clone();
                $ghost = $("<div class='open-files-container wsv-drag-ghost' style='overflow: hidden; display: inline-block;'>").append($("<ul>").append($copy).css("padding", "0"));
                draggingCurrentFile = ($el.hasClass("selected") && sourceView.paneId === activePaneId);
                
                // setup our ghost element as position absolute
                //  so we can put it wherever we want to while dragging
                if (draggingCurrentFile && _hasSelectionFocus()) {
                    $ghost.addClass("dragging-current-file");
                }

                $ghost.css({
                    top: offset.top,
                    left: offset.left,
                    width: $el.width() + 8
                });

                // this will give the element the appearence that it's ghosted if the user
                //  drags the element out of the view and goes off into no mans land
                $ghost.appendTo($("body"));
            }
            
            // Switches the view context to match the hit context
            function updateContext(hit) {
                // just set the container and update
                currentView = _viewFromEl(hit.which);
            }
            
            // Determines where the mouse hit was
            function hitTest(e) {
                var pageY = $ghost.offset().top,
                    direction =  e.pageY - lastPageY,
                    result = {
                        where: NOMANSLAND
                    },
                    lookCount = 0,
                    hasScroller = false,
                    onTopScroller = false,
                    onBottomScroller = false,
                    $container,
                    $hit,
                    $item,
                    $view,
                    gTop,
                    gHeight,
                    gBottom,
                    deltaY,
                    containerOffset,
                    scrollerTopArea,
                    scrollerBottomArea;
                
                // if the mouse is outside of the view then
                //  return nomansland -- this prevents some UI glitches
                //  that appear when dragging onto a second monitor
                if (e.pageX < 0 || e.pageX > $workingFilesContainer.width()) {
                    return result;
                }
                
                do {
                    // Turn off the ghost so elementFromPoint ignores it
                    $ghost.hide();

                    $hit = $(window.document.elementFromPoint(e.pageX, pageY));
                    $view = $hit.closest(".working-set-view");
                    $item = $hit.closest("#working-set-list-container li");

                    // Show the ghost again
                    $ghost.show();

                    $container = $view.children(".open-files-container");

                    if ($container.length) {
                        containerOffset = $container.offset();

                        // Compute "scrollMe" regions
                        scrollerTopArea = { top: containerOffset.top - 14,
                                            bottom: containerOffset.top + 7};

                        scrollerBottomArea = { top: containerOffset.top + $container.height() - 7,
                                               bottom: containerOffset.top + $container.height() + 14};
                    }

                    // If we hit ourself then look for another 
                    //  element to insert before/after
                    if ($item[0] === $el[0]) {
                        if (direction > 0) {
                            $item = $item.next();
                            if ($item.length) {
                                pageY += itemHeight;
                            }
                        } else {
                            $item = $item.prev();
                            if ($item.length) {
                                pageY -= itemHeight;
                            }
                        }
                    }
                    
                    // If we didn't hit anything then
                    //  back up and try again in the other direction
                    if (!$item.length) {
                        pageY += itemHeight;
                    }
                    
                    // look one more time below the mouse
                    //  if we didn't get a hit
                } while (!$item.length && ++lookCount < 2);
                
                // if we hit a span or an anchor tag and didn't
                //  find an item then force the selection hit to
                //  the item so we can bail out on the scrollMe 
                //  region at the top and bottom of the list
                if ($item.length === 0 && ($hit.is("a") || $hit.is("span"))) {
                    $item = $hit.parents("#working-set-list-container li");
                }
              
                // compute ghost location, we compute the insertion point based
                //  on where the ghost is, not where the  mouse is
                gTop = $ghost.offset().top;
                gHeight = $ghost.height();
                gBottom = gTop + gHeight;
                deltaY = pageY - e.pageY;
                
                // data to help us determine if we have a scroller
                hasScroller = $item.length && $container.length && $container[0].scrollHeight > $container[0].clientHeight;
                
                // data to help determine if the ghost is in either of the scrollMe regions
                onTopScroller = hasScroller && scrollerTopArea && ((gTop >= scrollerTopArea.top && gTop <= scrollerTopArea.bottom)  ||
                                                    (gBottom >= scrollerTopArea.top && gBottom <= scrollerTopArea.bottom));
                onBottomScroller = hasScroller && scrollerBottomArea && ((gTop >= scrollerBottomArea.top && gTop <= scrollerBottomArea.bottom) ||
                                                         (gBottom >= scrollerBottomArea.top && gBottom <= scrollerBottomArea.bottom));

                
                // helpers 
                function mouseIsInTopHalf($elem) {
                    var top = $elem.offset().top,
                        height = $elem.height();
                    
                    return (pageY < top + (height / 2));
                }
                
                function ghostIsAbove($elem) {
                    var top = $elem.offset().top,
                        checkVal = gTop;
                    
                    if (direction > 0) {
                        checkVal += gHeight;
                    }
                    
                    return (checkVal <=  (top + (itemHeight / 2)));
                }
                
                function ghostIsBelow($elem) {
                    var top = $elem.offset().top,
                        checkVal = gTop;
                    
                    if (direction > 0) {
                        checkVal += gHeight;
                    }
                    
                    return (checkVal >= (top + (itemHeight / 2)));
                }
                
                function elIsClearBelow($a, $b) {
                    var aTop = $a.offset().top,
                        bTop = $b.offset().top;
                    
                    return (aTop >= bTop + $b.height());
                }
                
                function draggingBelowWorkingSet() {
                    return ($hit.length === 0 || elIsClearBelow($hit, $workingFilesContainer));
                }
                
                function targetIsContainer() {
                    return ($hit.is(".working-set-view") ||
                            $hit.is(".open-files-container") ||
                            ($hit.is("ul") && $hit.parent().is(".open-files-container")));
                }
                
                function targetIsNoDrop() {
                    return $hit.is(".working-set-header") ||
                           $hit.is(".working-set-header-title") ||
                           $hit.is(".scroller-shadow") ||
                           $hit.is(".scroller-shadow");
                }
                
                function findViewFor($elem) {
                    if ($elem.is(".working-set-view")) {
                        return $elem;
                    }
                    return $elem.parents(".working-set-view");
                }
                
                if ($item.length) {
                    // We hit an item (li)
                    if (onTopScroller && (direction <= 0 || lastHit.where === TOPSCROLL)) {
                        result = {
                            where: TOPSCROLL,
                            which: $item
                        };
                    } else if (onBottomScroller && (direction >= 0 || lastHit.where === BOTSCROLL)) {
                        result = {
                            where: BOTSCROLL,
                            which: $item
                        };
                    } else if (ghostIsAbove($item)) {
                        result = {
                            where: ABOVEITEM,
                            which: $item
                        };
                    } else if (ghostIsBelow($item)) {
                        result = {
                            where: BELOWITEM,
                            which: $item
                        };
                    }
                } else if ($el.parent()[0] !== $hit[0]) {
                    // Didn't hit an li, figure out 
                    //  where to go from here
                    $view = $el.parents(".working-set-view");
                    
                    if (targetIsNoDrop()) {
                        if (direction < 0) {
                            if (ghostIsBelow($hit)) {
                                return result;
                            }
                        } else {
                            return result;
                        }
                    }

                    if (draggingBelowWorkingSet()) {
                        return result;
                    }
                    
                    if (targetIsContainer()) {
                        if (mouseIsInTopHalf($hit)) {
                            result = {
                                where: ABOVEVIEW,
                                which: findViewFor($hit)
                            };
                        } else {
                            result = {
                                where: BELOWVIEW,
                                which: findViewFor($hit)
                            };
                        }
                        return result;
                    }
                    
                    // Data to determine to help determine if we should
                    //  append to the previous or prepend to the next
                    var $prev = $view.prev(),
                        $next = $view.next();
                    
                    if (direction < 0) {
                        // moving up, if there is a view above
                        //  then we want to append to the view above
                        // otherwise we're in nomandsland
                        if ($prev.length) {
                            result = {
                                where: BELOWVIEW,
                                which: $prev
                            };
                        }
                    } else if (direction > 0) {
                        // moving down, if there is a view below
                        // then we want to append to the view below
                        //  otherwise we're in nomandsland
                        if ($next.length) {
                            result = {
                                where: ABOVEVIEW,
                                which: $next
                            };
                        }
                    } else if (mouseIsInTopHalf($view)) {
                        // we're inside the top half of
                        //  a view so prepend to the view we hit
                        result = {
                            where: ABOVEVIEW,
                            which: $view
                        };
                    } else {
                        // we're inside the bottom half of 
                        //  a view so append to the view we hit
                        result = {
                            where: BELOWVIEW,
                            which: $view
                        };
                    }
                } else {
                    // The item doesn't need updating
                    result = {
                        where: NOMOVEITEM,
                        which: $hit
                    };
                }

                return result;
            }
   
            // mouse move handler -- this pretty much does
            //  the heavy lifting for dragging the item around
            $(window).on("mousemove.wsvdragging", function (e) {
                // The drag function
                function drag(e) {
                    if (!dragged) {
                        initDragging();
                        // sort redraw and scroll shadows
                        //  cause problems during drag so disable them
                        _suppressSortRedrawForAllViews(true);
                        _suppressScrollShadowsOnAllViews(true);
                        
                        // remove the "active" class to remove the 
                        //  selection indicator so we don't have to 
                        //  keep it in sync while we're dragging
                        _deactivateAllViews(true);
                        
                        // add a "dragging" class to the outer container
                        $workingFilesContainer.addClass("dragging");
                        
                        // add a class to the element we're dragging if 
                        //  it's the currently selected file so that we 
                        //  can show it as selected while dragging
                        if (!draggingCurrentFile && FileViewController.getFileSelectionFocus() === FileViewController.WORKING_SET_VIEW) {
                            $(activeView._findListItemFromFile(currentFile)).addClass("drag-show-as-selected");
                        }
                        
                        // we've dragged the item so set
                        //  dragged to true so we don't try and open it
                        dragged = true;
                    }
                    
                    // reset the scrolling direction to no-scroll
                    scrollDir = 0;
                    
                    // Find out where to to drag it to
                    lastHit = hitTest(e);

                    // if the drag goes into nomansland then
                    //  drop the opacity on the drag affordance
                    //  and show the inserted item at reduced opacity
                    switch (lastHit.where) {
                    case NOMANSLAND:
                    case BELOWVIEW:
                    case ABOVEVIEW:
                        $el.css({opacity: ".75"});
                        $ghost.css("opacity", ".25");
                        break;
                    default:
                        $el.css({opacity: ".0001"});
                        $ghost.css("opacity", "");
                        break;
                    }
                    
                    // now do the insertion
                    switch (lastHit.where) {
                    case TOPSCROLL:
                    case ABOVEITEM:
                        if (lastHit.where === TOPSCROLL) {
                            scrollDir = -1;
                        }
                        $el.insertBefore(lastHit.which);
                        updateContext(lastHit);
                        break;
                    case BOTSCROLL:
                    case BELOWITEM:
                        if (lastHit.where === BOTSCROLL) {
                            scrollDir = 1;
                        }
                        $el.insertAfter(lastHit.which);
                        updateContext(lastHit);
                        break;
                    case BELOWVIEW:
                        $el.appendTo(lastHit.which.find("ul"));
                        updateContext(lastHit);
                        break;
                    case ABOVEVIEW:
                        $el.prependTo(lastHit.which.find("ul"));
                        updateContext(lastHit);
                        break;
                    }
                    
                    // we need to scroll
                    if (scrollDir) {
                        // we're in range to scroll
                        scroll(currentView.$openFilesContainer, $el, scrollDir, function () {
                            // as we scroll, recompute the element and insert
                            //  it before/after the item to drag it in to place
                            drag(e);
                        });
                    } else {
                        // we've moved away from the top/bottom "scrolling" region
                        endScroll($el);
                    }
                }

                // Reposition the drag affordance if we've started dragging
                if ($ghost) {
                    $ghost.css("top", $ghost.offset().top + (e.pageY - lastPageY));
                }
                
                // if we have't started dragging yet then we wait until
                //  the mouse has moved 3 pixels before we start dragging
                //  to avoid the item moving when clicked or double clicked
                if (dragged || Math.abs(e.pageY - startPageY) > _DRAG_MOVE_DETECTION_START) {
                    drag(e);
                }

                lastPageY = e.pageY;
                e.stopPropagation();
            });
            

            function scrollCurrentViewToBottom() {
                var $container = currentView.$openFilesContainer,
                    container = $container[0],
                    maxScroll = container.scrollHeight - container.clientHeight;
                
                if (maxScroll) {
                    $container.scrollTop(maxScroll);
                }
            }
            
            // Close down the drag operation
            function preDropCleanup() {
                window.onmousewheel = window.document.onmousewheel = null;
                $(window).off(".wsvdragging");
                if (dragged) {
                    $workingFilesContainer.removeClass("dragging");
                    $workingFilesContainer.find(".drag-show-as-selected").removeClass("drag-show-as-selected");
                    endScroll($el);
                    // re-activate the views (adds the "active" class to the view that was previously active)
                    _deactivateAllViews(false);
                    // turn scroll wheel back on
                    $ghost.remove();
                    $el.css("opacity", "");
                
                    if ($el.next().length === 0) {
                        scrollCurrentViewToBottom();
                    }
                }
            }
        
            // Final Cleanup
            function postDropCleanup(noRefresh) {
                if (dragged) {
                    // re-enable stuff we turned off
                    _suppressSortRedrawForAllViews(false);
                    _suppressScrollShadowsOnAllViews(false);
                }
                
                // we don't need to refresh if the item
                //  was dragged but not enough to not change 
                //  its order in the working set
                if (!noRefresh) {
                    // rebuild the view
                    refresh(true);
                }
                // focus the editor
                MainViewManager.focusActivePane();
            }
            
            // Drop
            function drop() {
                preDropCleanup();
                if (sourceView.paneId === currentView.paneId && startingIndex === $el.index()) {
                    // if the item was dragged but not moved then don't open or close 
                    if (!dragged) {
                        // Click on close icon, or middle click anywhere - close the item without selecting it first
                        if (tryClosing || e.which === MIDDLE_BUTTON) {
                            CommandManager
                                .execute(Commands.FILE_CLOSE, {file: sourceFile,
                                                           paneId: sourceView.paneId})
                                .always(function () {
                                    postDropCleanup();
                                });
                        } else {
                            // Normal right and left click - select the item
                            FileViewController.setFileViewFocus(FileViewController.WORKING_SET_VIEW);
                            CommandManager
                                .execute(Commands.FILE_OPEN, {fullPath: sourceFile.fullPath,
                                                               paneId: currentView.paneId})
                                .always(function () {
                                    postDropCleanup();
                                });
                        }
                    } else {
                        // no need to refresh
                        postDropCleanup(true);
                    }
                } else if (sourceView.paneId === currentView.paneId) {
                    // item was reordered 
                    MainViewManager._moveWorkingSetItem(sourceView.paneId, startingIndex, $el.index());
                    postDropCleanup();
                } else {
                    // item was dragged to another working set
                    MainViewManager._moveView(sourceView.paneId, currentView.paneId, sourceFile, $el.index())
                        .always(function () {
                            // if the current document was dragged to another working set 
                            //  then reopen it to make it the currently selected file
                            if (draggingCurrentFile) {
                                CommandManager
                                    .execute(Commands.FILE_OPEN, {fullPath: sourceFile.fullPath,
                                                                   paneId: currentView.paneId})
                                    .always(function () {
                                        postDropCleanup();
                                    });
                            } else {
                                postDropCleanup();
                            }
                        });
                }
            }

            // prevent working set from grabbing focus no matter what type of click/drag occurs
            e.preventDefault();
            
            // initialization
            $(window).on("mouseup.wsvdragging", function () {
                drop();
            });
            
            // let escape cancel the drag
            $(window).on("keydown.wsvdragging", function (e) {
                if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                    preDropCleanup();
                    postDropCleanup();
                    e.stopPropagation();
                }
            });
            
            // turn off scroll wheel
            window.onmousewheel = window.document.onmousewheel = function (e) {
                e.preventDefault();
            };

            // close all menus, and disable sorting 
            Menus.closeAll();
            
            // Dragging only happens with the left mouse button
            //  or (on the Mac) when the ctrl key isn't pressed
            if (e.which !== LEFT_BUTTON || (e.ctrlKey && brackets.platform === "mac")) {
                drop();
                return;
            }
            

            
            e.stopPropagation();
        });
    }
    
    /* 
     * WorkingSetView constructor
     * @constructor
     * @param {!jQuery} $container - owning container
     * @param {!string} paneId - paneId of this view pertains to
     */
    function WorkingSetView($container, paneId) {
        var id = "working-set-list-" + paneId;
        
        this.$header = null;
        this.$openFilesList = null;
        this.$container = $container;
        this.$el = $container.append(Mustache.render(paneListTemplate, _.extend({id: id}, Strings))).find("#" + id);
        this.suppressSortRedraw = false;
        this.paneId = paneId;
        
        this.init();
    }

    /*
     * Hides or shows the WorkingSetView
     */
    WorkingSetView.prototype._updateVisibility = function () {
        var fileList = MainViewManager.getWorkingSet(this.paneId);
        if (MainViewManager.getPaneCount() === 1 && (!fileList || fileList.length === 0)) {
            this.$openFilesContainer.hide();
            this.$workingSetListViewHeader.hide();
        } else {
            this.$openFilesContainer.show();
            this.$workingSetListViewHeader.show();
            this._checkForDuplicatesInWorkingTree();
        }
    };
    
    /*
     * paneLayoutChange event listener
     * @private
     */
    WorkingSetView.prototype._handlePaneLayoutChange = function () {
        var $titleEl = this.$el.find(".working-set-header-title"),
            title = Strings.WORKING_FILES;
        
        this._updateVisibility();
        
        if (MainViewManager.getPaneCount() > 1) {
            title = MainViewManager.getPaneTitle(this.paneId);
        }
        
        $titleEl.text(title);
    };

    /**
     * Finds the listItem item assocated with the file. Returns null if not found.
     * @private
     * @param {!File} file
     * @return {HTMLLIItem} returns the DOM element of the item. null if one could not be found
     */
    WorkingSetView.prototype._findListItemFromFile = function (file) {
        var result = null;

        if (file) {
            var items = this.$openFilesContainer.find("ul").children();
            items.each(function () {
                var $listItem = $(this);
                if ($listItem.data(_FILE_KEY).fullPath === file.fullPath) {
                    result = $listItem;
                    return false; // breaks each
                }
            });
        }

        return result;
    };

    /*
     * creates a name that is namespaced to this pane
     * @param {!string} name - name of the event to create.
     * use an empty string to get just the event name to turn off all events in the namespace
     * @private
     */
    WorkingSetView.prototype._makeEventName = function (name) {
        return name + ".paneList" + this.paneId;
    };
    

    /**
     * Scrolls the selected file into view
     * @private
     */
    WorkingSetView.prototype._scrollSelectedFileIntoView = function () {
        if (!_hasSelectionFocus()) {
            return;
        }

        var file = MainViewManager.getCurrentlyViewedFile(this.paneId);

        var $selectedFile = this._findListItemFromFile(file);
        if (!$selectedFile) {
            return;
        }

        ViewUtils.scrollElementIntoView(this.$openFilesContainer, $selectedFile, false);
    };

    /**
     * Redraw selection when list size changes or DocumentManager currentDocument changes.
     * @param {boolean=} scrollIntoView = Scrolls the selected item into view (the default behavior)
     * @private
     */
    WorkingSetView.prototype._fireSelectionChanged = function (scrollIntoView) {
        var reveal = (scrollIntoView === undefined || scrollIntoView === true);
        
        if (reveal) {
            this._scrollSelectedFileIntoView();
        }

        if (_hasSelectionFocus() && this.$el.hasClass("active")) {
            this.$openFilesList.trigger("selectionChanged", reveal);
        } else {
            this.$openFilesList.trigger("selectionHide");
        }
        // in-lieu of resize events, manually trigger contentChanged to update scroll shadows
        this.$openFilesContainer.trigger("contentChanged");
    };

    /**
     * adds the style 'vertical-scroll' if a vertical scroll bar is present
     * @private
     */
    WorkingSetView.prototype._adjustForScrollbars = function () {
        if (this.$openFilesContainer[0].scrollHeight > this.$openFilesContainer[0].clientHeight) {
            if (!this.$openFilesContainer.hasClass("vertical-scroll")) {
                this.$openFilesContainer.addClass("vertical-scroll");
            }
        } else {
            this.$openFilesContainer.removeClass("vertical-scroll");
        }
    };
    
    /**
     * Adds directory names to elements representing passed files in working tree
     * @private
     * @param {Array.<File>} filesList - list of Files with the same filename
     */
    WorkingSetView.prototype._addDirectoryNamesToWorkingTreeFiles = function (filesList) {
        // filesList must have at least two files in it for this to make sense
        if (filesList.length <= 1) {
            return;
        }

        var displayPaths = ViewUtils.getDirNamesForDuplicateFiles(filesList);

        // Go through open files and add directories to appropriate entries
        this.$openFilesContainer.find("ul > li").each(function () {
            var $li = $(this);
            var io = filesList.indexOf($li.data(_FILE_KEY));
            if (io !== -1) {
                var dirSplit = displayPaths[io].split("/");
                if (dirSplit.length > 3) {
                    displayPaths[io] = dirSplit[0] + "/\u2026/" + dirSplit[dirSplit.length - 1];
                }

                var $dir = $("<span class='directory'/>").html(" &mdash; " + displayPaths[io]);
                $li.children("a").append($dir);
            }
        });
    };

    /**
     * Looks for files with the same name in the working set
     * and adds a parent directory name to them
     * @private
     */
    WorkingSetView.prototype._checkForDuplicatesInWorkingTree = function () {
        var self = this,
            map = {},
            fileList = MainViewManager.getWorkingSet(MainViewManager.ALL_PANES);

        // We need to always clear current directories as files could be removed from working tree.
        this.$openFilesContainer.find("ul > li > a > span.directory").remove();

        // Go through files and fill map with arrays of files.
        fileList.forEach(function (file) {
            // Use the same function that is used to create html for file.
            var displayHtml = ViewUtils.getFileEntryDisplay(file);

            if (!map[displayHtml]) {
                map[displayHtml] = [];
            }
            map[displayHtml].push(file);
        });

        // Go through the map and solve the arrays with length over 1. Ignore the rest.
        _.forEach(map, function (value) {
            if (value.length > 1) {
                self._addDirectoryNamesToWorkingTreeFiles(value);
            }
        });
    };

    /**
     * Shows/Hides open files list based on working set content.
     * @private
     */
    WorkingSetView.prototype._redraw = function () {
        this._updateViewState();
        this._updateVisibility();
        this._updateItemClasses();
        this._adjustForScrollbars();
        this._fireSelectionChanged();
    };
    
    /**
     * activePaneChange event handler
     * @private
     */
    WorkingSetView.prototype._handleActivePaneChange = function () {
        this._redraw();
    };
    
    /**
     * Updates the appearance of the list element based on the parameters provided
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {bool} isDirty 
     * @param {bool} canClose
     */
    WorkingSetView.prototype._updateFileStatusIcon = function (listElement, isDirty, canClose) {
        var $fileStatusIcon = listElement.find(".file-status-icon"),
            showIcon = isDirty || canClose;

        // remove icon if its not needed
        if (!showIcon && $fileStatusIcon.length !== 0) {
            $fileStatusIcon.remove();
            $fileStatusIcon = null;
            
        // create icon if its needed and doesn't exist
        } else if (showIcon && $fileStatusIcon.length === 0) {
            
            $fileStatusIcon = $("<div class='file-status-icon'></div>")
                .prependTo(listElement);
        }

        // Set icon's class
        if ($fileStatusIcon) {
            ViewUtils.toggleClass($fileStatusIcon, "dirty", isDirty);
            ViewUtils.toggleClass($fileStatusIcon, "can-close", canClose);
        }
    };
    
    /**
     * Updates the working set item class list
     * @private
     */
    WorkingSetView.prototype._updateItemClasses = function () {
        if (_classProviders.length > 0) {
            this.$openFilesContainer.find("ul > li").each(function () {
                var $li = $(this),
                    file = $li.data(_FILE_KEY),
                    data = {fullPath: file.fullPath,
                            name: file.name,
                            isFile: file.isFile};
                $li.removeAttr("class");
                _classProviders.forEach(function (provider) {
                    $li.addClass(provider(data));
                });
            });
        }
    };
    
    /** 
     * Builds the UI for a new list item and inserts in into the end of the list
     * @private
     * @param {File} file
     * @return {HTMLLIElement} newListItem
     */
    WorkingSetView.prototype._createNewListItem = function (file) {
        var self = this,
            selectedFile = MainViewManager.getCurrentlyViewedFile(this.paneId),
            data = {fullPath: file.fullPath,
                    name: file.name,
                    isFile: file.isFile};

        // Create new list item with a link
        var $link = $("<a href='#'></a>").html(ViewUtils.getFileEntryDisplay(file));
           
        _iconProviders.forEach(function (provider) {
            var icon = provider(data);
            if (icon) {
                $link.prepend($(icon));
            }
        });
        
        var $newItem = $("<li></li>")
            .append($link)
            .data(_FILE_KEY, file);

        this.$openFilesContainer.find("ul").append($newItem);
        
        _classProviders.forEach(function (provider) {
            $newItem.addClass(provider(data));
        });
        
        // Update the listItem's apperance
        this._updateFileStatusIcon($newItem, _isOpenAndDirty(file), false);
        _updateListItemSelection($newItem, selectedFile);
        _makeDraggable($newItem);
        
        $newItem.hover(
            function () {
                self._updateFileStatusIcon($(this), _isOpenAndDirty(file), true);
            },
            function () {
                self._updateFileStatusIcon($(this), _isOpenAndDirty(file), false);
            }
        );
    };
    
    /**
     * Deletes all the list items in the view and rebuilds them from the working set model
     * @private
     */
    WorkingSetView.prototype._rebuildViewList = function (forceRedraw) {
        var self = this,
            fileList = MainViewManager.getWorkingSet(this.paneId);

        this.$openFilesContainer.find("ul").empty();
        
        fileList.forEach(function (file) {
            self._createNewListItem(file);
        });

        if (forceRedraw) {
            self._redraw();
        }
    };

    /**
     * Updates the pane view's selection state 
     * @private
     */
    WorkingSetView.prototype._updateViewState = function () {
        var paneId = MainViewManager.getActivePaneId();
        if (_hasSelectionFocus() && paneId === this.paneId) {
            this.$el.addClass("active");
            this.$openFilesContainer.addClass("active");
        } else {
            this.$el.removeClass("active");
            this.$openFilesContainer.removeClass("active");
        }
    };
    
    /**
     * Updates the pane view's selection marker and scrolls the item into view
     * @private
     */
    WorkingSetView.prototype._updateListSelection = function () {
        var file = MainViewManager.getCurrentlyViewedFile(this.paneId);
        
        this._updateViewState();
        
        // Iterate through working set list and update the selection on each
        this.$openFilesContainer.find("ul").children().each(function () {
            _updateListItemSelection(this, file);
        });

        // Make sure selection is in view
        this._scrollSelectedFileIntoView();
        this._fireSelectionChanged();
    };

    /**
     * workingSetAdd event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!File} fileAdded - the file that was added
     * @param {!number} index - index where the file was added
     * @param {!string} paneId - the id of the pane the item that was to
     */
    WorkingSetView.prototype._handleFileAdded = function (e, fileAdded, index, paneId) {
        if (paneId === this.paneId) {
            this._rebuildViewList(true);
        } else {
            this._checkForDuplicatesInWorkingTree();
        }
    };

    /**
     * workingSetAddList event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!Array.<File>} files - the files that were added
     * @param {!string} paneId - the id of the pane the item that was to
     */
    WorkingSetView.prototype._handleFileListAdded = function (e, files, paneId) {
        if (paneId === this.paneId) {
            this._rebuildViewList(true);
        } else {
            this._checkForDuplicatesInWorkingTree();
        }
    };

    /**
     * workingSetRemove event handler
     * @private 
     * @param {jQuery.Event} e - event object
     * @param {!File} file - the file that was removed
     * @param {?boolean} suppressRedraw If true, suppress redraw
     * @param {!string} paneId - the id of the pane the item that was to
     */
    WorkingSetView.prototype._handleFileRemoved = function (e, file, suppressRedraw, paneId) {
        /* 
         * The suppressRedraw flag is used in cases when we are replacing the working
         * set entry with another one. There are only 2 use cases for this:
         *
         *      1) When an untitled document is being saved.
         *      2) When a file is saved with a new name.
         */
        if (paneId === this.paneId) {
            if (!suppressRedraw) {
                var $listItem = this._findListItemFromFile(file);
                if ($listItem) {
                    // Make the next file in the list show the close icon, 
                    // without having to move the mouse, if there is a next file.
                    var $nextListItem = $listItem.next();
                    if ($nextListItem && $nextListItem.length > 0) {
                        var canClose = ($listItem.find(".can-close").length === 1);
                        var isDirty = _isOpenAndDirty($nextListItem.data(_FILE_KEY));
                        this._updateFileStatusIcon($nextListItem, isDirty, canClose);
                    }
                    $listItem.remove();
                }
                this._redraw();
            }
        } else {
            /*
             * When this event is handled by a pane that is not being updated then 
             * the suppressRedraw flag does not need to be respected.  
             * _checkForDuplicatesInWorkingTree() does not remove any entries so it's
             * safe to call at any time.
             */
            this._checkForDuplicatesInWorkingTree();
        }
    };

    /**
     * workingSetRemoveList event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!Array.<File>} files - the files that were removed
     * @param {!string} paneId - the id of the pane the item that was to
     */
    WorkingSetView.prototype._handleRemoveList = function (e, files, paneId) {
        var self = this;
        if (paneId === this.paneId) {
            files.forEach(function (file) {
                var $listItem = self._findListItemFromFile(file);
                if ($listItem) {
                    $listItem.remove();
                }
            });

            this._redraw();
        } else {
            this._checkForDuplicatesInWorkingTree();
        }
    };
    
    /**
     * workingSetSort event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!string} paneId - the id of the pane to sort
     */
    WorkingSetView.prototype._handleWorkingSetSort = function (e, paneId) {
        if (!this.suppressSortRedraw && paneId === this.paneId) {
            this._rebuildViewList(true);
        }
    };

    /**
     * dirtyFlagChange event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {Document} doc - document whose dirty state has changed
     */
    WorkingSetView.prototype._handleDirtyFlagChanged = function (e, doc) {
        var listItem = this._findListItemFromFile(doc.file);
        if (listItem) {
            var canClose = $(listItem).find(".can-close").length === 1;
            this._updateFileStatusIcon(listItem, doc.isDirty, canClose);
        }
    };
    
    /**
     * workingSetUpdate event handler
     * @private
     * @param {jQuery.Event} e - event object
     * @param {!string} paneId - the id of the pane to update
     */
    WorkingSetView.prototype._handleWorkingSetUpdate = function (e, paneId) {
        if (this.paneId === paneId) {
            this._rebuildViewList(true);
        } else {
            this._checkForDuplicatesInWorkingTree();
        }
    };
    

    /**
     * Initializes the WorkingSetView object
     */
    WorkingSetView.prototype.init = function () {
        this.$openFilesContainer = this.$el.find(".open-files-container");
        this.$workingSetListViewHeader = this.$el.find(".working-set-header");
        
        this.$openFilesList = this.$el.find("ul");
        
        // Register listeners
        MainViewManager.on(this._makeEventName("workingSetAdd"), _.bind(this._handleFileAdded, this));
        MainViewManager.on(this._makeEventName("workingSetAddList"), _.bind(this._handleFileListAdded, this));
        MainViewManager.on(this._makeEventName("workingSetRemove"), _.bind(this._handleFileRemoved, this));
        MainViewManager.on(this._makeEventName("workingSetRemoveList"), _.bind(this._handleRemoveList, this));
        MainViewManager.on(this._makeEventName("workingSetSort"), _.bind(this._handleWorkingSetSort, this));
        MainViewManager.on(this._makeEventName("activePaneChange"), _.bind(this._handleActivePaneChange, this));
        MainViewManager.on(this._makeEventName("paneLayoutChange"), _.bind(this._handlePaneLayoutChange, this));
        MainViewManager.on(this._makeEventName("workingSetUpdate"), _.bind(this._handleWorkingSetUpdate, this));

        DocumentManager.on(this._makeEventName("dirtyFlagChange"), _.bind(this._handleDirtyFlagChanged, this));

        FileViewController.on(this._makeEventName("documentSelectionFocusChange") + " " + this._makeEventName("fileViewFocusChange"), _.bind(this._updateListSelection, this));
        
        // Show scroller shadows when open-files-container scrolls
        ViewUtils.addScrollerShadow(this.$openFilesContainer[0], null, true);
        ViewUtils.sidebarList(this.$openFilesContainer);
        
        // Disable horizontal scrolling until WebKit bug #99379 is fixed
        this.$openFilesContainer.css("overflow-x", "hidden");

        this.$openFilesContainer.on("contextmenu.workingSetView", function (e) {
            Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_CONTEXT_MENU).open(e);
        });

        this._redraw();
    };

    /**
     * Destroys the WorkingSetView DOM element and removes all event handlers
     */
    WorkingSetView.prototype.destroy = function () {
        ViewUtils.removeScrollerShadow(this.$openFilesContainer[0], null);
        this.$openFilesContainer.off(".workingSetView");
        this.$el.remove();
        MainViewManager.off(this._makeEventName(""));
        DocumentManager.off(this._makeEventName(""));
        FileViewController.off(this._makeEventName(""));
    };
    
    /**
     * paneDestroy event handler
     */
    MainViewManager.on("paneDestroy", function (e, paneId) {
        var view = _views[paneId];
        delete _views[view.paneId];
        view.destroy();
    });
    
    /**
     * Creates a new WorkingSetView object for the specified pane
     * @param {!jQuery} $container - the WorkingSetView's DOM parent node
     * @param {!string} paneId - the id of the pane the view is being created for
     */
    function createWorkingSetViewForPane($container, paneId) {
        var view = _views[paneId];
        if (!view) {
            view = new WorkingSetView($container, paneId);
            _views[view.paneId] = view;
        }
    }

    
    /** 
     * Adds an icon provider. The callback is invoked before each working set item is created, and can
     * return content to prepend to the item.
     * 
     * @param {!function(!{name:string, fullPath:string, isFile:boolean}):?string|jQuery|DOMNode} callback
     * Return a string representing the HTML, a jQuery object or DOM node, or undefined. If undefined,
     * nothing is prepended to the list item.
     */
    function addIconProvider(callback) {
        if (!callback) {
            return;
        }
        _iconProviders.push(callback);
        // build all views so the provider has a chance to add icons
        //    to all items that have already been created
        refresh(true);
    }
    
    /** 
     * Adds a CSS class provider, invoked before each working set item is created or updated. When called
     * to update an existing item, all previously applied classes have been cleared.
     * 
     * @param {!function(!{name:string, fullPath:string, isFile:boolean}):?string} callback
     * Return a string containing space-separated CSS class(es) to add, or undefined to leave CSS unchanged.
     */
    function addClassProvider(callback) {
        if (!callback) {
            return;
        }
        _classProviders.push(callback);
        // build all views so the provider has a chance to style
        //    all items that have already been created
        refresh(true);
    }
    
    AppInit.htmlReady(function () {
        $workingFilesContainer =  $("#working-set-list-container");
    });
    
    
    // Public API
    exports.createWorkingSetViewForPane   = createWorkingSetViewForPane;
    exports.refresh                       = refresh;
    exports.addIconProvider               = addIconProvider;
    exports.addClassProvider              = addClassProvider;
    exports.syncSelectionIndicator        = syncSelectionIndicator;
});
