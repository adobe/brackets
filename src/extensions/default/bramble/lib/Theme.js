/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var ThemeManager     = brackets.getModule("view/ThemeManager");
    var prefs            = brackets
                            .getModule("preferences/PreferencesManager")
                            .getExtensionPrefs("themes");

    var Path             = brackets.getModule("filesystem/impls/filer/BracketsFiler").Path;
    var PathUtils        = brackets.getModule("thirdparty/path-utils/path-utils");
    var basePath         = PathUtils.directory(window.location.href);
    var themePath        = Path.join(basePath, 'extensions/default/bramble/stylesheets');
    var BrambleEvents    = brackets.getModule("bramble/BrambleEvents");

    function toggle(data) {
        var theme = data.theme || getTheme();
        setTheme(theme === "light-theme" ? "dark-theme" : "light-theme");
    }

    function setTheme(theme) {
        prefs.set("theme", theme);
        BrambleEvents.triggerThemeChange(theme);
    }

    function getTheme() {
        return prefs.get("theme");
    }

    function init(theme) {
        var lightFile = {
            name: "main.less",
            _path: Path.join(themePath, "lightTheme.css")
        };
        var lightOptions = {
            name: "light-theme"
        };

        var darkFile = {
            name: "main.less",
            _path: Path.join(themePath, "darkTheme.css")
        };
        var darkOptions = {
            name: "dark-theme",
            theme: {
                dark: true
            }
        };

        ThemeManager.addTheme(lightFile, lightOptions);
        ThemeManager.addTheme(darkFile, darkOptions);

        // We support only light-theme and dark-theme, with a default of dark-theme
        if(!(theme === "light-theme" || theme === "dark-theme")) {
            theme = "dark-theme";
        }

        prefs.set("theme", theme);
    }

    module.exports.toggle = toggle;
    module.exports.setTheme = setTheme;
    module.exports.getTheme = getTheme;
    module.exports.init = init;
});

