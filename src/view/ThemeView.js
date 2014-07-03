/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function (require, exports, module) {
    "use strict";

    var currentDocMode, currentThemes = [];

    var _                  = require("thirdparty/lodash"),
        CodeMirror         = require("thirdparty/CodeMirror2/lib/codemirror"),
        PreferencesManager = require("preferences/PreferencesManager"),
        prefs              = PreferencesManager.getExtensionPrefs("brackets-themes");


    var templates = {
        $lineHeight: $("<style type='text/css' id='lineHeight'>").appendTo("head"),
        $fontSize: $("<style type='text/css' id='fontSize'>").appendTo("head"),
        $fontFamily: $("<style type='text/css' id='fontFamily'>").appendTo("head"),
        $scrollbars: $("<style id='scrollbars'>").appendTo("head")
    };


    function updateLineHeight() {
        clearFonts();
        var value = prefs.get("lineHeight");
        templates.$lineHeight.text(".CodeMirror{" + "line-height: " + value + "; }");
    }


    function updateFontSize() {
        clearFonts();
        var value = prefs.get("fontSize");
        templates.$fontSize.text(".CodeMirror{" + "font-size: " + value + " !important; }");
    }


    function updateFontFamily() {
        clearFonts();
        var value = prefs.get("fontFamily");
        templates.$fontFamily.text(".CodeMirror{" + "font-family: " + value + " !important; }");
    }


    function clearFonts() {
        // Remove this tag that is intefering with font settings set in this module
        $("#codemirror-dynamic-fonts").remove();
    }


    function updateFonts() {
        clearFonts();
        updateLineHeight();
        updateFontSize();
        updateFontFamily();
    }


    function updateScrollbars(theme) {
        theme = theme || {};
        if (prefs.get("customScrollbars")) {
            var scrollbar = (theme.scrollbar || []).join(" ");
            templates.$scrollbars.text(scrollbar || "");
        }
        else {
            templates.$scrollbars.text("");
        }
    }


    /**
    *  Handles updating codemirror with the current selection of themes.
    *
    * @param {CodeMirror} cm is the CodeMirror instance currently loaded
    */
    function updateThemes(cm) {
        var newThemes = (prefs.get("themes") || []).join(" "),
            cmThemes  = cm.getOption("theme").replace(/[\s]*/, " "); // Normalize themes string

        // Check if the editor already has the theme applied...
        if (cmThemes === newThemes) {
            return;
        }

        // Setup current and further documents to get the new theme...
        CodeMirror.defaults.theme = newThemes;
        cm.setOption("theme", newThemes);

        // Make sure to update the document theme if a new theme is being set.
        setDocumentTheme();
    }


    /**
    * Add theme class to the document to add proper theme styling scoping.
    * New class is added, old class is removed.  This basically allows
    * themeSettings to get nicely cleaned up from the DOM.
    */
    function setDocumentTheme() {
        var newThemes = (prefs.get("themes") || []);
        var oldThemes = (currentThemes || []).slice(0);
        currentThemes = newThemes.slice(0);

        // We gotta prefix theme names with "theme" because themes that start with a number
        // will not render correctly.  Class names that start with a number are invalid
        newThemes = _.map(newThemes, function(theme){ return "theme-" + theme; }).join(" ");
        oldThemes = _.map(oldThemes, function(theme){ return "theme-" + theme; }).join(" ");
        $("html").removeClass(oldThemes).addClass(newThemes);
    }


    /**
    * Sets the document type in the DOM to enable styling per doc type
    *
    * @param {CodeMirror} cm is the CodeMirror instance currently loaded
    * @rreturn {string} current document type
    */
    function setDocumentMode(cm) {
        var mode = cm.getDoc().getMode();
        var docMode = mode && (mode.helperType || mode.name);
        $("body").removeClass("doctype-" + currentDocMode).addClass("doctype-" + docMode);
        currentDocMode = docMode; // Update docMode
        return docMode;
    }


    //
    // Expose API
    //
    exports.updateFonts      = updateFonts;
    exports.updateLineHeight = updateLineHeight;
    exports.updateFontSize   = updateFontSize;
    exports.updateFontFamily = updateFontFamily;
    exports.updateScrollbars = updateScrollbars;
    exports.updateThemes     = updateThemes;
    exports.setDocumentMode  = setDocumentMode;
});
