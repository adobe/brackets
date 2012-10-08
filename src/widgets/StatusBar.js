/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, document*/

/**
 * A status bar with support for file information and busy and status indicators.
 */
define(function (require, exports, module) {
    'use strict';
    
    var AppInit = require("utils/AppInit");
    
    // Indicates if the busy cursor is active to avoid unnecesary operations
    var busyCursor = false;
    
    // A simple regexp to sanitize indicator ids
    var indicatorIDRegexp = new RegExp("[^a-zA-Z 0-9]+", "g");
    
    // These vars are initialized by the AppInit.htmlReady handler
    // below since they refer to DOM elements
    var $editorContainer,
        $statusBar,
        $indicators,
        $busyIndicator;
        
    /**
     * Shows the 'busy' indicator
     * @param {boolean} updateCursor Sets the cursor to "wait"
     */
    function showBusyIndicator(updateCursor) {
        if (updateCursor) {
            busyCursor = true;
            $("*").addClass("busyCursor");
        }
        
        $busyIndicator.show();
    }
    
    /**
     * Hides the 'busy' indicator
     */
    function hideBusyIndicator() {
        // Check if we are using the busyCursor class to avoid
        // unnecesary calls to $('*').removeClass()
        if (busyCursor) {
            busyCursor = false;
            $("*").removeClass("busyCursor");
        }
        
        $busyIndicator.hide();
    }
    
    /**
     * Registers a new status indicator
     * @param {string} id Registration id of the indicator to be updated.
     * @param {DOMNode} indicator Optional DOMNode for the indicator
     * @param {boolean} visible Shows or hides the indicator over the statusbar.
     * @param {string} style Sets the attribute "class" of the indicator.
     * @param {string} tooltip Sets the attribute "title" of the indicator.
     * @param {string} command Optional command name to execute on the indicator click.
     * TODO Unused command parameter. Include command functionality for statusbar indicators.
     */
    function addIndicator(id, indicator, visible, style, tooltip, command) {
        
        indicator = indicator || document.createElement("div");
        tooltip = tooltip || "";
        style = style || "";
        id = id.replace(indicatorIDRegexp, "-") || "";
        
        var $indicator = $(indicator);
        
        $indicator.attr("id", id);
        $indicator.attr("title", tooltip);
        $indicator.addClass("indicator");
        $indicator.addClass("style");
            
        if (!visible) {
            $indicator.hide();
        }
        
        $indicators.prepend($indicator);
    }
    
    /**
     * Updates a status indicator
     * @param {string} id Registration id of the indicator to be updated.
     * @param {boolean} visible Shows or hides the indicator over the statusbar.
     * @param {string} style Sets the attribute "class" of the indicator.
     * @param {string} tooltip Sets the attribute "title" of the indicator.
     * @param {string} command Optional command name to execute on the indicator click.
     */
    function updateIndicator(id, visible, style, tooltip, command) {
        
        var $indicator = $("#" + id.replace(indicatorIDRegexp, "-"));
        
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
     * Hide the statusbar
     */
    function hide() {
        $statusBar.hide();
    }
    
    /**
     * Show the statusbar
     */
    function show() {
        $statusBar.show();
    }
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        $statusBar          = $("#status-bar");
        $indicators         = $("#status-indicators");
        $busyIndicator      = $("#busy-indicator");
        
        $busyIndicator.hide();
    });
    
    exports.showBusyIndicator = showBusyIndicator;
    exports.hideBusyIndicator = hideBusyIndicator;
    exports.addIndicator = addIndicator;
    exports.updateIndicator = updateIndicator;
    exports.hide = hide;
    exports.show = show;
});