/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require, Mustache */

define(function(require, exports, module) {
    "use strict";

    var _                  = require("thirdparty/lodash"),
        Dialogs            = require("widgets/Dialogs"),
        Strings            = require("strings"),
        PreferencesManager = require("preferences/PreferencesManager"),
        settingsTemplate   = require("text!htmlContent/themes-settings.html");

    var prefs = PreferencesManager.getExtensionPrefs("brackets-themes");

    /**
     * Currently loaded themes that are available to choose from.
     */
    var loadedThemes = {};

    /**
     * Object with all default values that can be configure via the settings UI
     */
    var defaults = {
        "fontSize": 12,
        "lineHeight": '1.3em',
        "fontFamily": "'SourceCodePro-Medium', ＭＳ ゴシック, 'MS Gothic', monospace",
        "customScrollbars": true,
        "themes": ["thor-light-theme"]
    };


    /**
     * Cached html settings jQuery object for easier processing when opening the settings dialog
     */
    var $settings = $(settingsTemplate).addClass("themeSettings");

    /**
     * Opens the settings dialog
     */
    function showDialog() {
        var currentSettings = getValues();
        var newSettings     = {};
        var themes          = _.map(loadedThemes, function(theme) {return theme;});
        var template        = $("<div>").append($settings).html();
        var $template       = $(Mustache.render(template, {"settings": currentSettings, "themes": themes, "Strings": Strings}));

        // Select the correct theme.
        _.each(currentSettings.themes, function(item) {
            $template
                .find("[value='" + item + "']")
                .attr("selected", "selected");
        });

        $template
            .find("[data-toggle=tab].default")
            .tab("show");

        $template
            .on("change", "[data-target]:checkbox", function() {
                var $target = $(this);
                var attr = $target.attr("data-target");
                newSettings[attr] = $target.is(":checked");
            })
            .on("change", "[data-target]:text", function() {
                var $target = $(this);
                var attr = $target.attr("data-target");
                newSettings[attr] = $target.val();
            })
            .on("change", function() {
                var items;
                var $target = $(":selected", this);
                var attr = $target.attr("data-target");

                if (attr) {
                    items = $target.map(function(i, item) {
                        return $(item).val();
                    });

                    prefs.set(attr, items.toArray());
                }
            });

        Dialogs.showModalDialogUsingTemplate($template).done(function (id) {
            if (id === "save") {
                Object.keys(newSettings).forEach(function (setting) {
                    prefs.set(setting, newSettings[setting]);
                });
            }
        });
    }

    /**
     * Interface to set the themes that are available to chose from in the setting dialog
     * @param {ThemeManager.Theme} themes is a collection of themes created by the ThemeManager
     */
    function setThemes(themes) {
        loadedThemes = themes;
    }

    /**
     * @private
     * Gets all the configurable settings that need to be loaded in the settings dialog
     */
    function getValues() {
        return _.transform(defaults, function(result, value, key) {
            result[key] = prefs.get(key);
        });
    }

    /**
     * Restores themes to factory settings.
     */
    function restore() {
        prefs.set("themes", defaults.themes);
        prefs.set("fontSize", defaults.fontSize + "px");
        prefs.set("lineHeight", defaults.lineHeight);
        prefs.set("fontFamily", defaults.fontFamily);
        prefs.set("customScrollbars", defaults.customScrollbars);
    }


    prefs.definePreference("themes", "array", defaults.themes);
    prefs.definePreference("fontSize", "string", defaults.fontSize + "px");
    prefs.definePreference("lineHeight", "string", defaults.lineHeight);
    prefs.definePreference("fontFamily", "string", defaults.fontFamily);
    prefs.definePreference("customScrollbars", "boolean", defaults.customScrollbars);

    exports._setThemes = setThemes;
    exports._defaults  = defaults;
    exports.restore    = restore;
    exports.showDialog = showDialog;
});
