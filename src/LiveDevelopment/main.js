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

    var DocumentManager = require("DocumentManager");
    var LiveDevelopment = require("LiveDevelopment/LiveDevelopment");
    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    var config = {
        debug: true, // enable debug output and helpers
        autoconnect: true, // go live automatically after startup?
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
    var _statusNames = ["", ".", "..", _checkMark]; // Status label name
    var _statusStyle = ["", "info", "info", "success"]; // Status label class
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

    /** Change the status of a button */
    function _setLabel(btn, text, style) {
        $("span", btn).remove();
        if (text && text.length > 0) {
            var label = $("<span class=\"label\">");
            label.addClass(style);
            label.text(text);
            btn.append(label);
        }
    }

    /** Create the menu item "Go Live" */
    function _setupGoLiveButton() {
        _btnGoLive = $("<a href=\"#\">Go Live </a>");
        $(".nav").append($("<li>").append(_btnGoLive));
        _btnGoLive.click(function onGoLive() {
            if (LiveDevelopment.status > 0) {
                LiveDevelopment.close();
            } else {
                LiveDevelopment.open();
            }
        });
        $(LiveDevelopment).on("statusChange", function statusChange(event, status) {
            _setLabel(_btnGoLive, _statusNames[status], _statusStyle[status]);
        });
    }

    /** Create the menu item "Highlight" */
    function _setupHighlightButton() {
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
        _setupHighlightButton();
        if (config.debug) {
            _setupDebugHelpers();
        }
    }
    setTimeout(init);

    // Export public functions
    exports.init = init;
});
