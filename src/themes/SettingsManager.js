/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function (require) {
    "use strict";

    var _                   = require("thirdparty/lodash"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        PreferencesImpl     = require("preferences/PreferencesImpl"),
        DefaultSettings     = require("themes/DefaultSettings"),
        SettingsDialog      = require("themes/ThemeSettingsDialog"),
        prefs               = PreferencesManager.getExtensionPrefs("brackets-themes");

    var Settings = {};


    Settings.showDialog = function() {
        SettingsDialog.show(Settings);
    };


    Settings.getValue = function() {
        return prefs.get.apply(prefs, arguments);
    };


    Settings.setValue = function() {
        prefs.set.apply(prefs, arguments);
        prefs.save();
        _triggerEvent(arguments[0]);
    };


    Settings.getAll = function() {
        return _.transform(arguments, function(result, value, key) {
            result[value] = prefs.get(value);
        });
    };


    Settings.reset = function() {
        Settings.setValue("themes",  DefaultSettings.themes);
        Settings.setValue("fontSize", DefaultSettings.fontSize + "px");
        Settings.setValue("lineHeight", DefaultSettings.lineHeight);
        Settings.setValue("fontType", DefaultSettings.fontType);
        Settings.setValue("customScrollbars", DefaultSettings.customScrollbars);
    };


    function _triggerEvent(item) {
        var data = prefs.get(item);
        $(Settings).trigger("change", data);
        $(Settings).trigger("change:" + item, [data]);
    }
    

    // Expose it so that other settings manager can trigger events as well
    Settings._triggerEvent = _triggerEvent;


    prefs.definePreference("themes", "array", DefaultSettings.themes)
        .on("change", function() {
            _triggerEvent("themes");
        });

    prefs.definePreference("fontSize", "string", DefaultSettings.fontSize + "px")
        .on("change", function() {
            _triggerEvent("fontSize");
        });

    prefs.definePreference("lineHeight", "string", DefaultSettings.lineHeight)
        .on("change", function() {
            _triggerEvent("lineHeight");
        });

    prefs.definePreference("fontType", "string", DefaultSettings.fontType)
        .on("change", function() {
            _triggerEvent("fontType");
        });

    prefs.definePreference("customScrollbars", "boolean", DefaultSettings.customScrollbars)
        .on("change", function() {
            _triggerEvent("customScrollbars");
        });

    return Settings;
});
