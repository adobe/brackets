/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function () {
    "use strict";

    var $lineHeight = $("<style type='text/css' id='lineHeight'>").appendTo("head"),
        $fontSize = $("<style type='text/css' id='fontSize'>").appendTo("head"),
        $fontType = $("<style type='text/css' id='fontType'>").appendTo("head");

    var Settings = null;


    function FontSettings(_settings) {
        Settings = _settings;
        $(Settings).on("change:lineHeight", FontSettings.updateLineHeight);
        $(Settings).on("change:fontSize", FontSettings.updateFontSize);
        $(Settings).on("change:fontType", FontSettings.updateFontType);
        FontSettings.update();
    }


    FontSettings.updateLineHeight = function () {
        clearFonts();
        var value = Settings.getValue("lineHeight");
        $lineHeight.text(".CodeMirror{" + "line-height: " + value + "; }");
    };


    FontSettings.updateFontSize = function () {
        clearFonts();
        var value = Settings.getValue("fontSize");
        $fontSize.text(".CodeMirror{" + "font-size: " + value + " !important; }");
    };


    FontSettings.updateFontType = function () {
        clearFonts();
        var value = Settings.getValue("fontType");
        $fontType.text(".CodeMirror{" + "font-family: " + value + " !important; }");
    };


    FontSettings.update = function () {
        clearFonts();
        FontSettings.updateLineHeight();
        FontSettings.updateFontSize();
        FontSettings.updateFontType();
    };


    function clearFonts() {
        // Remove this tag that is intefering with font settings set in this module
        $("#codemirror-dynamic-fonts").remove();
    }

    return FontSettings;
});
