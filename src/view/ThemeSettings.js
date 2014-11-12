/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
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
/*global $, define, Mustache */

define(function (require, exports, module) {
    "use strict";

    var _                   = require("thirdparty/lodash"),
        Dialogs             = require("widgets/Dialogs"),
        Strings             = require("strings"),
        ViewCommandHandlers = require("view/ViewCommandHandlers"),
        ThemeManager        = require("view/ThemeManager"),
        settingsTemplate    = require("text!htmlContent/themes-settings.html"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        prefs               = PreferencesManager.getExtensionPrefs("themes");


    /**
     * Object with all default values that can be configure via the settings UI
     */
    var defaults = {
        "themeScrollbars": true,
        "theme": ThemeManager.defaultThemeName
    };


    /**
     * Cached html settings jQuery object for easier processing when opening the settings dialog
     */
    var $settings = $(settingsTemplate).addClass("themeSettings");

    /**
     * @private
     * Gets all the configurable settings that need to be loaded in the settings dialog
     *
     * @return {Object} a collection with all the settings
     */
    function getCurrentSettings() {
        var result = {};

        Object.keys(defaults).forEach(function (key) {
            result[key] = prefs.get(key);
        });

        result.fontFamily = ViewCommandHandlers.getFontFamily();
        result.fontSize   = ViewCommandHandlers.getFontSize();
        return result;
    }

    /**
     * @private
     * Applies setting's value to the correct place.  Either as a preference or in the ViewCommandHandler.
     * Settings that go in the ViewCommandHandler as only for font settings at this point.
     */
    function setSetting(setting, value) {
        var setterFn;

        if (defaults.hasOwnProperty(setting)) {
            prefs.set(setting, value);
        } else {
            // Figure out if the setting is in the ViewCommandHandlers, which means it is
            // a font setting
            setterFn = "set" + setting[0].toLocaleUpperCase() + setting.substr(1);
            if (typeof ViewCommandHandlers[setterFn] === 'function') {
                ViewCommandHandlers[setterFn](value);
            }
        }
    }

    /**
     * Opens the settings dialog for themes
     */
    function showDialog() {
        var currentSettings = getCurrentSettings();
        var newSettings     = {};
        var templateData    = {"settings": currentSettings, "themes": ThemeManager.getAllThemes(), "Strings": Strings};
        var $template       = $(Mustache.render($("<div>").append($settings).html(), templateData));

        // Select the correct theme.
        var $currentThemeOption = $template
            .find("[value='" + ThemeManager.getCurrentTheme().name + "']");

        $currentThemeOption.attr("selected", "selected");

        $template
            .find("[data-toggle=tab].default")
            .tab("show");

        $template
            .on("change", "[data-target]:checkbox", function () {
                var $target = $(this);
                var attr = $target.attr("data-target");

                if (attr) {
                    newSettings[attr] = $target.is(":checked");
                    setSetting(attr, newSettings[attr]);
                }
            })
            .on("input", "[data-target]:text", _.debounce(function () {
                var $target = $(this);
                var attr = $target.attr("data-target");

                if (attr) {
                    newSettings[attr] = $target.val();
                    setSetting(attr, newSettings[attr]);
                }
            }, 500))
            .on("change", function () {
                var $target = $(":selected", this);
                var attr = $target.attr("data-target");

                if (attr) {
                    newSettings[attr] = $target.val();
                    setSetting(attr, newSettings[attr]);
                }
            });

        Dialogs.showModalDialogUsingTemplate($template).done(function (id) {
            if (id === "cancel") {
                // Go through each new setting and apply it
                Object.keys(newSettings).forEach(function (setting) {
                    setSetting(setting, currentSettings[setting]);
                });
            }
        });
    }


    /**
     * Restores themes settings to factory settings.
     */
    function restore() {
        prefs.set("theme", defaults.theme);
        prefs.set("themeScrollbars", defaults.themeScrollbars);
    }

    prefs.definePreference("theme", "string", defaults.theme);
    prefs.definePreference("themeScrollbars", "boolean", defaults.themeScrollbars);

    exports.restore    = restore;
    exports.showDialog = showDialog;
});
