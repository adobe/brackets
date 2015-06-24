/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var ThemeManager     = brackets.getModule("view/ThemeManager");
    var ThemePreferences = brackets
                            .getModule("preferences/PreferencesManager")
                            .getExtensionPrefs("themes");

    var Path             = brackets.getModule("filesystem/impls/filer/BracketsFiler").Path;
    var basePath         = PathUtils.directory(window.location.href);
    var themePath        = Path.join(basePath, 'extensions/default/bramble/stylesheets');
    var BrambleEvents    = brackets.getModule("bramble/BrambleEvents");

    // Store the current theme, and load defaults as if
    // they were third party themes
    var currentTheme = 'light-theme';

    function toggle(data) {
        var theme = data.theme || currentTheme;
        setTheme(theme === "light-theme" ? "dark-theme" : "light-theme");
    }

    function setTheme(theme) {
        currentTheme = theme;
        ThemePreferences.set("theme", theme);
        BrambleEvents.triggerThemeChange(theme);
    }

    function getTheme() {
        return currentTheme;
    }

    function init(theme) {
        var lightFile = {
            name: "main.less",
            _path: Path.join(themePath, "lightTheme.less")
        };
        var lightOptions = {
            name: "light-theme"
        };

        var darkFile = {
            name: "main.less",
            _path: Path.join(themePath, "darkTheme.less")
        };
        var darkOptions = {
            name: "dark-theme",
            theme: {
                dark: true
            }
        };

        ThemeManager.addTheme(lightFile, lightOptions);
        ThemeManager.addTheme(darkFile, darkOptions);

        currentTheme = theme === 'light-theme' ? "dark-theme" : "light-theme";
        ThemePreferences.set("theme", currentTheme);
    }

    module.exports.toggle = toggle;
    module.exports.setTheme = setTheme;
    module.exports.getTheme = getTheme;
    module.exports.init = init;
});

