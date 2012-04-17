/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 * @author Jonathan Diehl <jdiehl@adobe.com>
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, less */

/**
 * main integrates LiveDevelopment into Brackets
 *
 * This module creates two menu items:
 *
 *  "Go Live": open or close a Live Development session and visualize the status
 *  "Highlight": toggle source highlighting
 *
 * @require DocumentManager
 */
define(function main(require, exports, module) {
    'use strict';

    var DocumentManager = require("document/DocumentManager"),
        Commands        = require("command/Commands"),
        LiveDevelopment = require("LiveDevelopment/LiveDevelopment"),
        Inspector       = require("LiveDevelopment/Inspector/Inspector"),
        CommandManager  = require("command/CommandManager");

    var config = {
        debug: true, // enable debug output and helpers
        autoconnect: false, // go live automatically after startup?
        highlight: false, // enable highlighting?
        highlightConfig: { // the highlight configuration for the Inspector
            borderColor:  {r: 255, g: 229, b: 153, a: 0.66},
            contentColor: {r: 111, g: 168, b: 220, a: 0.55},
            marginColor:  {r: 246, g: 178, b: 107, a: 0.66},
            paddingColor: {r: 147, g: 196, b: 125, a: 0.66},
            showInfo: true
        }
    };
    var _checkMark = "✓"; // Check mark character
    // Status styles are ordered: error, not connected, progress1, progress2, connected.
    var _statusStyle = ["warning", "", "info", "info", "success"]; // Status label's CSS class
    var _allStatusStyles = _statusStyle.join(" ");
    
    var _btnGoLive; // reference to the GoLive button
    var _btnHighlight; // reference to the HighlightButton

    /** Load Live Development LESS Style */
    function _loadStyles() {
        var request = new XMLHttpRequest();
        request.open("GET", "LiveDevelopment/main.less", true);
        request.onload = function onLoad(event) {
            var parser = new less.Parser();
            parser.parse(request.responseText, function onParse(err, tree) {
                console.assert(!err, err);
                var style = $("<style>" + tree.toCSS() + "</style>");
                $(document.head).append(style);
            });
        };
        request.send(null);
    }

    /** Change the appearance of a button. Omit text to remove any extra text; omit style to return to default styling. */
    function _setLabel(btn, text, style) {
        // Clear text/styles from previous status
        $("span", btn).remove();
        btn.removeClass(_allStatusStyles);
        
        // Set text/styles for new status
        if (text && text.length > 0) {
            var label = $("<span class=\"label\">");
            label.addClass(style);
            label.text(text);
            btn.append(label);
        } else {
            btn.addClass(style);
        }
    }

    /** Toggles LiveDevelopment and synchronizes the state of UI elements that reports LiveDevelopment status */
    function _handleGoLiveCommand() {
        if (LiveDevelopment.status > 0) {
            LiveDevelopment.close();
            // TODO Ty: when checkmark support lands, remove checkmark
        } else {
            LiveDevelopment.open();
            // TODO Ty: when checkmark support lands, add checkmark
        }
    }

    /** Create the menu item "Go Live" */
    function _setupGoLiveButton() {
        _btnGoLive = $("#toolbar-go-live");
        _btnGoLive.click(function onGoLive() {
            _handleGoLiveCommand();
        });
        $(LiveDevelopment).on("statusChange", function statusChange(event, status) {
            // status starts at -1 (error), so add one when looking up name and style
            // See the comments at the top of LiveDevelopment.js for details on the 
            // various status codes.
            _setLabel(_btnGoLive, null, _statusStyle[status + 1]);
        });
    }

    /** Create the menu item "Highlight" */
    function _setupHighlightButton() {
        // TODO: this should be moved into index.html like the Go Live button once it's re-enabled
        _btnHighlight = $("<a href=\"#\">Highlight </a>");
        $(".nav").append($("<li>").append(_btnHighlight));
        _btnHighlight.click(function onClick() {
            config.highlight = !config.highlight;
            if (config.highlight) {
                _setLabel(_btnHighlight, _checkMark, "success");
            } else {
                _setLabel(_btnHighlight);
                LiveDevelopment.hideHighlight();
            }
        });
        if (config.highlight) {
            _setLabel(_btnHighlight, _checkMark, "success");
        }
    }

    /** Setup window references to useful LiveDevelopment modules */
    function _setupDebugHelpers() {
        window.ld = LiveDevelopment;
        window.i = Inspector;
        window.report = function report(params) { window.params = params; console.info(params); };
    }

    /** Initialize LiveDevelopment */
    function init() {
        Inspector.init(config);
        LiveDevelopment.init(config);
        _loadStyles();
        _setupGoLiveButton();
        /* _setupHighlightButton(); FUTURE - Highlight button */
        if (config.debug) {
            _setupDebugHelpers();
        }
    }
    setTimeout(init);

    CommandManager.register(Commands.FILE_LIVE_FILE_PREVIEW, _handleGoLiveCommand);

    // Export public functions
    exports.init = init;
});
