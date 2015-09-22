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

/*jslint vars: true, plusplus: true, devel: true, regexp: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, less */

define(function (require, exports, module) {
    "use strict";

    var _                  = require("thirdparty/lodash"),
        EventDispatcher    = require("utils/EventDispatcher"),
        FileSystem         = require("filesystem/FileSystem"),
        FileUtils          = require("file/FileUtils"),
        EditorManager      = require("editor/EditorManager"),
        ExtensionUtils     = require("utils/ExtensionUtils"),
        ThemeSettings      = require("view/ThemeSettings"),
        ThemeView          = require("view/ThemeView"),
        PreferencesManager = require("preferences/PreferencesManager"),
        prefs              = PreferencesManager.getExtensionPrefs("themes");

    var loadedThemes    = {},
        currentTheme    = null,
        styleNode       = $(ExtensionUtils.addEmbeddedStyleSheet("")),
        defaultTheme    = "thor-light-theme",
        commentRegex    = /\/\*([\s\S]*?)\*\//mg,
        scrollbarsRegex = /((?:[^}|,]*)::-webkit-scrollbar(?:[^{]*)[{](?:[^}]*?)[}])/mgi,
        stylesPath      = FileUtils.getNativeBracketsDirectoryPath() + "/styles/";


    /**
     * @private
     * Takes all dashes and converts them to white spaces. Then takes all first letters
     * and capitalizes them.
     *
     * @param {string} name is what needs to be procseed to generate a display name
     * @return {string} theme name properly formatted for display
     */
    function toDisplayName(name) {
        var extIndex = name.lastIndexOf('.');
        name = name.substring(0, extIndex !== -1 ? extIndex : undefined).replace(/-/g, ' ');

        return name.split(" ").map(function (part) {
            return part[0].toUpperCase() + part.substring(1);
        }).join(" ");
    }


    /**
     * @constructor
     * Theme contains all the essential bit to load a theme from disk, display a theme in the settings
     * dialog, and to properly add a theme into CodeMirror along with the rest of brackets.
     *
     * @param {File} file for the theme
     * @param {{name: string, title: string}} options to configure different
     *   properties in the theme
     */
    function Theme(file, options) {
        options = options || {};
        var fileName = file.name;

        // If no options.name is provided, then we derive the name of the theme from whichever we find
        // first, the options.title or the filename.
        if (!options.name) {
            if (options.title) {
                options.name = options.title;
            } else {
                // Remove the file extension when the filename is used as the theme name. This is to
                // follow CodeMirror conventions where themes are just a CSS file and the filename
                // (without the extension) is used to build CSS rules.  Also handle removing .min
                // in case the ".min" is part of the file name.
                options.name = FileUtils.getFilenameWithoutExtension(fileName).replace(/\.min$/, "");
            }

            // We do a bit of string treatment here to make sure we generate theme names that can be
            // used as a CSS class name by CodeMirror.
            options.name = options.name.toLocaleLowerCase().replace(/[\W]/g, '-');
        }

        this.file           = file;
        this.name           = options.name;
        this.displayName    = options.title || toDisplayName(fileName);
        this.dark           = options.theme !== undefined && options.theme.dark === true;
        this.addModeClass   = options.theme !== undefined && options.theme.addModeClass === true;
    }


    /**
     * @private
     * Extracts the scrollbar text from the css/less content so that it can be treated
     * as a separate styling component that can be anabled/disabled independently from
     * the theme.
     *
     * @param {string} content is the css/less input string to be processed
     * @return {{content: string, scrollbar: Array.<string>}} content is the new css/less content
     *   with the scrollbar rules extracted out and put in scrollbar
     */
    function extractScrollbars(content) {
        var scrollbar = [];

        // Go through and extract out scrollbar customizations so that we can
        // enable/disable via settings.
        content = content
            .replace(scrollbarsRegex, function (match) {
                scrollbar.push(match);
                return "";
            });

        return {
            content: content,
            scrollbar: scrollbar
        };
    }


    /**
     * @private
     * Function will process a string and figure out if it looks like window path with a
     * a drive.  If that's the case, then we lower case everything.
     * --- NOTE: There is a bug in less that only checks for lowercase in order to handle
     * the rootPath configuration...  Hopefully a PR will be coming their way soon.
     *
     * @param {string} path is a string to search for drive letters that need to be converted
     *   to lower case.
     *
     * @return {string} Windows Drive letter in lowercase.
     */
    function fixPath(path) {
        return path.replace(/^([A-Z]+:)?\//, function (match) {
            return match.toLocaleLowerCase();
        });
    }


    /**
     * @private
     * Takes the content of a file and feeds it through the less processor in order
     * to provide support for less files.
     *
     * @param {string} content is the css/less string to be processed
     * @param {Theme} theme is the object the css/less corresponds to
     * @return {$.Promise} promsie with the processed css/less as the resolved value
     */
    function lessifyTheme(content, theme) {
        var deferred = new $.Deferred();

        less.render("#editor-holder {" + content + "\n}", {
            rootpath: fixPath(stylesPath),
            filename: fixPath(theme.file._path)
        }, function (err, tree) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(tree.css);
            }
        });

        return deferred.promise();
    }

    /**
     * @private
     * Will search all loaded themes for one the matches the file passed in
     *
     * @param {File} file is the search criteria
     * @return {Theme} theme that matches the file
     */
    function getThemeByFile(file) {
        var path = file._path;
        return _.find(loadedThemes, function (item) {
            return item.file._path === path;
        });
    }


    /**
     * Get current theme object that is loaded in the editor.
     *
     * @return {Theme} the current theme instance
     */
    function getCurrentTheme() {
        if (!currentTheme) {
            currentTheme = loadedThemes[prefs.get("theme")] || loadedThemes[defaultTheme];
        }

        return currentTheme;
    }


    /**
     * Gets all available themes
     * @return {Array.<Theme>} collection of all available themes
     */
    function getAllThemes() {
        return _.map(loadedThemes, function (theme) {
            return theme;
        });
    }


    /**
     * @private
     * Process and load the current theme into the editor
     *
     * @return {$.Promise} promise object resolved with the theme object and all
     *    corresponding new css/less and scrollbar information
     */
    function loadCurrentTheme() {
        var theme = getCurrentTheme();

        var pending = theme && FileUtils.readAsText(theme.file)
            .then(function (lessContent) {
                return lessifyTheme(lessContent.replace(commentRegex, ""), theme);
            })
            .then(function (content) {
                var result = extractScrollbars(content);
                theme.scrollbar = result.scrollbar;
                return result.content;
            })
            .then(function (cssContent) {
                $("body").toggleClass("dark", theme.dark);
                styleNode.text(cssContent);
                return theme;
            });

        return $.when(pending);
    }


    /**
     * Refresh current theme in the editor
     *
     * @param {boolean} force Forces a reload of the current theme.  It reloads the theme file.
     */
    function refresh(force) {
        if (force) {
            currentTheme = null;
        }

        $.when(force && loadCurrentTheme()).done(function () {
            var editor = EditorManager.getActiveEditor();
            if (!editor || !editor._codeMirror) {
                return;
            }

            var cm = editor._codeMirror;
            ThemeView.updateThemes(cm);

            // currentTheme can be undefined, so watch out
            cm.setOption("addModeClass", !!(currentTheme && currentTheme.addModeClass));
        });
    }


    /**
     * Loads a theme from a file.
     *
     * @param {string} fileName is the full path to the file to be opened
     * @param {Object} options is an optional parameter to specify metadata
     *    for the theme.
     * @return {$.Promise} promise object resolved with the theme to be loaded from fileName
     */
    function loadFile(fileName, options) {
        var deferred         = new $.Deferred(),
            file             = FileSystem.getFileForPath(fileName),
            currentThemeName = prefs.get("theme");

        file.exists(function (err, exists) {
            var theme;

            if (exists) {
                theme = new Theme(file, options);
                loadedThemes[theme.name] = theme;
                ThemeSettings._setThemes(loadedThemes);

                // For themes that are loaded after ThemeManager has been loaded,
                // we should check if it's the current theme.  If it is, then we just
                // load it.
                if (currentThemeName === theme.name) {
                    refresh(true);
                }

                deferred.resolve(theme);
            } else if (err || !exists) {
                deferred.reject(err);
            }
        });

        return deferred.promise();
    }


    /**
     * Loads a theme from an extension package.
     *
     * @param {Object} themePackage is a package from the extension manager for the theme to be loaded.
     * @return {$.Promise} promise object resolved with the theme to be loaded from the pacakge
     */
    function loadPackage(themePackage) {
        var fileName = themePackage.path + "/" + themePackage.metadata.theme.file;
        return loadFile(fileName, themePackage.metadata);
    }


    prefs.on("change", "theme", function () {
        // Make sure we don't reprocess a theme that's already loaded
        if (currentTheme && currentTheme.name === prefs.get("theme")) {
            return;
        }

        // Refresh editor with the new theme
        refresh(true);

        // Process the scrollbars for the editor
        ThemeView.updateScrollbars(getCurrentTheme());

        // Expose event for theme changes
        exports.trigger("themeChange", getCurrentTheme());
    });

    prefs.on("change", "themeScrollbars", function () {
        refresh();
        ThemeView.updateScrollbars(getCurrentTheme());
    });

    // Monitor file changes.  If the file that has changed is actually the currently loaded
    // theme, then we just reload the theme.  This allows to live edit the theme
    FileSystem.on("change", function (evt, file) {
        if (!file || file.isDirectory) {
            return;
        }

        if (getThemeByFile(file)) {
            refresh(true);
        }
    });

    EditorManager.on("activeEditorChange", function () {
        refresh();
    });

    
    EventDispatcher.makeEventDispatcher(exports);
    
    exports.refresh         = refresh;
    exports.loadFile        = loadFile;
    exports.loadPackage     = loadPackage;
    exports.getCurrentTheme = getCurrentTheme;
    exports.getAllThemes    = getAllThemes;

    // Exposed for testing purposes
    exports._toDisplayName     = toDisplayName;
    exports._extractScrollbars = extractScrollbars;
});
