/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require, Mustache */

define(function(require, exports, module) {
    "use strict";

    var _themes = {};

    var defaults = {
        "fontSize": 12,
        "lineHeight": '1.3em',
        "fontType": "'SourceCodePro-Medium', ＭＳ ゴシック, 'MS Gothic', monospace",
        "customScrollbars": true,
        "themes": ["thor-light-theme"]
    };

    var templates = {
        "settings": require("text!htmlContent/themes-settings.html")
    };

    var _                  = require("thirdparty/lodash"),
        Dialogs            = require("widgets/Dialogs"),
        Strings            = require("strings"),
        PreferencesManager = require("preferences/PreferencesManager"),
        prefs              = PreferencesManager.getExtensionPrefs("brackets-themes");


    // Setup all the templates so that we can easily render them with Mustache
    var $settings = $(templates.settings).addClass("themeSettings");

    function showDialog() {
        var currentSettings = getValues("themes", "fontSize", "fontType", "lineHeight", "customScrollbars");
        var newSettings     = {};
        var themes          = _.map(_themes, function(theme) {return theme;});
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


    function setThemes(themes) {
        _themes = themes;
    }


    function getValues() {
        return _.transform(arguments, function(result, value) {
            result[value] = prefs.get(value);
        });
    }


    function reset() {
        prefs.set("themes",           defaults.themes);
        prefs.set("fontSize",         defaults.fontSize + "px");
        prefs.set("lineHeight",       defaults.lineHeight);
        prefs.set("fontType",         defaults.fontType);
        prefs.set("customScrollbars", defaults.customScrollbars);
    }


    prefs.definePreference("themes", "array", defaults.themes);
    prefs.definePreference("fontSize", "string", defaults.fontSize + "px");
    prefs.definePreference("lineHeight", "string", defaults.lineHeight);
    prefs.definePreference("fontType", "string", defaults.fontType);
    prefs.definePreference("customScrollbars", "boolean", defaults.customScrollbars);


    // Exposed API
    exports.defaults   = defaults;
    exports.reset      = reset;
    exports.setThemes  = setThemes;
    exports.showDialog = showDialog;
});
