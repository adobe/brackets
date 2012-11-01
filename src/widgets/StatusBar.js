/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, document, Mustache */

/**
 * A status bar with support for file information and busy and status indicators.
 */
define(function (require, exports, module) {
    'use strict';
    
    var AppInit         = require("utils/AppInit"),
        StatusBarHTML   = require("text!widgets/StatusBar.html"),
        EditorManager   = require("editor/EditorManager"),
        Strings         = require("strings");

    var _init = false;
    
    // Indicates if the busy cursor is active to avoid unnecesary operations
    var _busyCursor = false;
    
    // A simple regexp to sanitize indicator ids
    var _indicatorIDRegexp = new RegExp("[^a-zA-Z 0-9]+", "g");
    
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
        if (!_init) {
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
     * @param {DOMNode} indicator Optional DOMNode for the indicator
     * @param {boolean} visible Shows or hides the indicator over the statusbar.
     * @param {string} style Sets the attribute "class" of the indicator.
     * @param {string} tooltip Sets the attribute "title" of the indicator.
     * @param {string} command Optional command name to execute on the indicator click.
     * TODO Unused command parameter. Include command functionality for statusbar indicators.
     */
    function addIndicator(id, indicator, visible, style, tooltip, command) {
        if (!_init) {
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
        if (!_init) {
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
     * Hide the statusbar
     */
    function hide() {
        if (!_init) {
            return;
        }
        
        if ($statusBar.is(":visible")) {
            $statusBar.hide();
            EditorManager.resizeEditor();  // changes available ht for editor area
        }
    }
    
    /**
     * Show the statusbar
     */
    function show() {
        if (!_init) {
            return;
        }

        if (!$statusBar.is(":visible")) {
            $statusBar.show();
            EditorManager.resizeEditor();  // changes available ht for editor area
        }
    }

    function init($parent) {
        // check if status bar already exists
        if (_init) {
            return;
        }

        $parent = $parent || $("body");
        $parent.append(Mustache.render(StatusBarHTML, Strings));

        // Initialize items dependent on HTML DOM
        $statusBar          = $("#status-bar");
        $indicators         = $("#status-indicators");
        $busyIndicator      = $("#busy-indicator");

        _init = true;

        // hide on init
        hide();
    }

    function getModeDisplayString(mode) {
        // mode is either a string or an object with a name property string
        var s = (typeof mode === "string") ? mode : mode.name,
            slash,
            result;

        s = s.toLowerCase();

        // Handle special cases (in order of likely occurrance)
        if (s === "javascript") {
            return "JavaScript";
        } else if (s === "html" || s === "htmlmixed") {
            return "HTML";
        } else if (s === "css") {
            return "CSS";
        } else if (s === "less") {
            return "LESS";
        } else if (s === "text/plain") {
            return "Text";
        } else if (s === "php") {
            return "PHP";
        } else if (s === "xml") {
            return "XML";
        } else if (s === "yaml") {
            return "YAML";
        } else if (s === "coffeescript") {
            return "CoffeeScript";
        } else if (s === "mysql") {
            return "SQL";
        }

        // Generic case

        // Strip "text/" or "application/" from beginning
        s = s.replace(/^(text\/|application\/)/, "");

        // Strip "x-" from beginning
        s = s.replace(/^x-/, "");

        // Strip any remaining "/" sections from end
        slash = s.indexOf("/");
        if (slash !== -1) {
            s = s.substr(0, slash);
        }

        // Uppercase first char and rest is (already) lowercase
        result = s[0].toUpperCase();
        result += s.substr(1);

        return result;
    }
    
    exports.init = init;
    exports.showBusyIndicator = showBusyIndicator;
    exports.hideBusyIndicator = hideBusyIndicator;
    exports.addIndicator = addIndicator;
    exports.updateIndicator = updateIndicator;
    exports.getModeDisplayString = getModeDisplayString;
    exports.hide = hide;
    exports.show = show;
});