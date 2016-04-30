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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, document, Mustache */

/**
 * A status bar with support for file information and busy and status indicators. This is a semi-generic
 * container; for the code that decides what content appears in the status bar, see client modules like
 * EditorStatusBar. (Although in practice StatusBar's HTML structure and initialization
 * assume it's only used for this one purpose, and all the APIs are on a singleton).
 */
define(function (require, exports, module) {
    'use strict';

    var AppInit          = require("utils/AppInit"),
        StatusBarHTML    = require("text!widgets/StatusBar.html"),
        Strings          = require("strings"),
        WorkspaceManager = require("view/WorkspaceManager");

    var _init = false;

    // Indicates if the busy cursor is active to avoid unnecesary operations
    var _busyCursor = false;

    // A simple regexp to sanitize indicator ids
    var _indicatorIDRegexp = new RegExp("[^a-zA-Z 0-9]+", "g");

    // These vars are initialized by the AppInit.htmlReady handler
    // below since they refer to DOM elements
    var $statusInfo,
        $statusBar,
        $indicators,
        $busyIndicator;

    /**
     * Shows the 'busy' indicator
     * @param {boolean} updateCursor Sets the cursor to "wait"
     */
    function showBusyIndicator(updateCursor) {
        if (!_init) {
            console.error("StatusBar API invoked before status bar created");
            return;
        }

        if (updateCursor) {
            _busyCursor = true;
            $("*").addClass("busyCursor");
        }

        $busyIndicator.addClass("spin");
    }

    /**
     * Hides the 'busy' indicator
     */
    function hideBusyIndicator() {
        if (!_init) {
            console.error("StatusBar API invoked before status bar created");
            return;
        }

        // Check if we are using the busyCursor class to avoid
        // unnecesary calls to $('*').removeClass()
        if (_busyCursor) {
            _busyCursor = false;
            $("*").removeClass("busyCursor");
        }

        $busyIndicator.removeClass("spin");
    }

    /**
     * Registers a new status indicator
     * @param {string} id Registration id of the indicator to be updated.
     * @param {(DOMNode|jQueryObject)=} indicator Optional DOMNode for the indicator
     * @param {boolean=} visible Shows or hides the indicator over the statusbar.
     * @param {string=} style Sets the attribute "class" of the indicator.
     * @param {string=} tooltip Sets the attribute "title" of the indicator.
     * @param {string=} insertBefore An id of an existing status bar indicator.
     *          The new indicator will be inserted before (i.e. to the left of)
     *          the indicator specified by this parameter.
     */
    function addIndicator(id, indicator, visible, style, tooltip, insertBefore) {
        if (!_init) {
            console.error("StatusBar API invoked before status bar created");
            return;
        }

        indicator = indicator || document.createElement("div");
        tooltip = tooltip || "";
        style = style || "";
        id = id.replace(_indicatorIDRegexp, "-") || "";

        var $indicator = $(indicator);

        $indicator.attr("id", id);
        $indicator.attr("title", tooltip);
        $indicator.addClass("indicator");
        $indicator.addClass(style);

        if (!visible) {
            $indicator.hide();
        }

        // This code looks backwards because the DOM model is ordered
        // top-to-bottom but the UI view is ordered right-to-left. The concept
        // of "before" in the model is "after" in the view, and vice versa.
        if (insertBefore && $("#" + insertBefore).length > 0) {
            $indicator.insertAfter("#" + insertBefore);
        } else {
            // No positioning is provided, put on left end of indicators, but
            // to right of "busy" indicator (which is usually hidden).
            var $busyIndicator = $("#status-bar .spinner");
            $indicator.insertBefore($busyIndicator);
        }
    }

    /**
     * Updates a status indicator
     * @param {string} id Registration id of the indicator to be updated.
     * @param {boolean} visible Shows or hides the indicator over the statusbar.
     * @param {string=} style Sets the attribute "class" of the indicator.
     * @param {string=} tooltip Sets the attribute "title" of the indicator.
     */
    function updateIndicator(id, visible, style, tooltip) {
        if (!_init && !!brackets.test) {
            console.error("StatusBar API invoked before status bar created");
            return;
        }

        var $indicator = $("#" + id.replace(_indicatorIDRegexp, "-"));

        if ($indicator) {

            if (visible) {
                $indicator.show();
            } else {
                $indicator.hide();
            }

            if (style) {
                $indicator.removeClass();
                $indicator.addClass(style);
            } else {
                $indicator.removeClass();
                $indicator.addClass("indicator");
            }

            if (tooltip) {
                $indicator.attr("title", tooltip);
            }
        }
    }

    /**
     * Hide the statusbar Information Panel
     */
    function hideInformation() {
        $statusInfo.css("display", "none");
    }

    /**
     * Show the statusbar Information Panel
     */
    function showInformation() {
        $statusInfo.css("display", "");
    }

    /**
     * Hide the statusbar Indicators
     */
    function hideIndicators() {
        $indicators.css("display", "none");
    }

    /**
     * Show the statusbar Indicators
     */
    function showIndicators() {
        $indicators.css("display", "");
    }


    /**
     * Hides all panels but not the status bar
     */
    function hideAllPanes() {
        hideInformation();
        hideIndicators();
    }

    /**
     * Shows all panels (will not show a hidden statusbar)
     */
    function showAllPanes() {
        showInformation();
        showIndicators();
    }


    /**
     * Hide the statusbar
     */
    function hide() {
        if (!_init) {
            console.error("StatusBar API invoked before status bar created");
            return;
        }

        if ($statusBar.is(":visible")) {
            $statusBar.hide();
            WorkspaceManager.recomputeLayout();
        }
    }

    /**
     * Show the statusbar
     */
    function show() {
        if (!_init) {
            console.error("StatusBar API invoked before status bar created");
            return;
        }

        if (!$statusBar.is(":visible")) {
            $statusBar.show();
            WorkspaceManager.recomputeLayout();
        }
    }

    AppInit.htmlReady(function () {
        var $parent = $(".main-view .content");
        $parent.append(Mustache.render(StatusBarHTML, Strings));

        // Initialize items dependent on HTML DOM
        $statusBar          = $("#status-bar");
        $indicators         = $("#status-indicators");
        $busyIndicator      = $("#status-bar .spinner");
        $statusInfo         = $("#status-info");

        _init = true;

        // hide on init
        hide();
    });

    exports.hideInformation   = hideInformation;
    exports.showInformation   = showInformation;
    exports.showBusyIndicator = showBusyIndicator;
    exports.hideBusyIndicator = hideBusyIndicator;
    exports.hideIndicators    = hideIndicators;
    exports.showIndicators    = showIndicators;
    exports.hideAllPanes      = hideAllPanes;
    exports.showAllPanes      = showAllPanes;
    exports.addIndicator      = addIndicator;
    exports.updateIndicator   = updateIndicator;
    exports.hide              = hide;
    exports.show              = show;
});
