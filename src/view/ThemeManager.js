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
/*global $, define, require, less */

define(function (require, exports, module) {
    "use strict";

    // FontsCommandsManager will be going away soon when we add font size management in Brackets.
    require("themes/FontCommandsManager");

    var _                  = require("thirdparty/lodash"),
        FileSystem         = require("filesystem/FileSystem"),
        FileUtils          = require("file/FileUtils"),
        EditorManager      = require("editor/EditorManager"),
        ExtensionUtils     = require("utils/ExtensionUtils"),
        ThemeSettings      = require("view/ThemeSettings"),
        ThemeView          = require("view/ThemeView"),
        AppInit            = require("utils/AppInit"),
        PreferencesManager = require("preferences/PreferencesManager"),
        prefs              = PreferencesManager.getExtensionPrefs("brackets-themes");

    var loadedThemes    = {},
        defaultTheme    = "thor-light-theme",
        commentRegex    = /\/\*([\s\S]*?)\*\//mg,
        scrollbarsRegex = /::-webkit-scrollbar(?:[\s\S]*?)\{(?:[\s\S]*?)\}/mg,
        stylesPath      = FileUtils.getNativeBracketsDirectoryPath() + "/styles/",
        validExtensions = ["css", "less"];


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
     * @param {{name: string, className: string, title: string}} options to configure different
     *   properties in the theme
     */
    function Theme(file, options) {
        options = options || {};
        var fileName = file.name;

        // The name is used to map the loaded themes to the list in the settings dialog. So we want
        // a unique name if one is not provided.  This is particularly important when loading just
        // files where there is no other way to feed in meta data to provide unique names.  Say, there
        // is a theme1.css and a theme1.less that are entirely different themes...

        this.file        = file;
        this.name        = options.name      || (options.title || fileName).toLocaleLowerCase().replace(/[\W]/g, '-');
        this.className   = options.className || "theme-" + this.name;
        this.displayName = options.title     || toDisplayName(fileName);
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
            .replace(commentRegex, "")
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
        var parser   = new less.Parser({
            rootpath: fixPath(stylesPath),
            filename: fixPath(theme.file._path)
        });

        parser.parse("." + theme.className + "{" + content + "}", function (err, tree) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(tree.toCSS());
            }
        });

        return deferred.promise();
    }


    /**
     * @private
     * Verifies that the file passed in is a valid theme file type.
     *
     * @param {File} file is object to verify if it is a valid theme file type
     * @return {boolean} to confirm if the file is a valid theme file type
     */
    function isFileTypeValid(file) {
        return file.isFile &&
            validExtensions.indexOf(FileUtils.getFileExtension(file.name)) !== -1;
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
     * @private
     * Will trigger a refresh of codemirror instance and editor resize so that
     * inline widgets get properly rendered
     *
     * @param {CodeMirror} cm code mirror instance to refresh
     */
    function refreshEditor(cm) {
        // Really dislike timing issues with CodeMirror.  I have to refresh
        // the editor after a little bit of time to make sure that themes
        // are properly applied to quick edit widgets
        setTimeout(function () {
            cm.refresh();
            EditorManager.resizeEditor();
        }, 100);
    }


    /**
     * @private
     * Get all current theme objects
     *
     * @return {Array.<Theme>} collection of the current theme instances
     */
    function getCurrentThemes() {
        return _.map(prefs.get("themes").slice(0), function (item) {
            return loadedThemes[item] || loadedThemes[defaultTheme];
        });
    }


    /**
     * Provides quick access to all available themes
     * @return {Array.<Theme>} collection of all available themes
     */
    function getAllThemes() {
        return _.map(loadedThemes, function (item) {
            return item;
        });
    }


    /**
     * @private
     * Loads all current themes
     *
     * @return {$.Promise} promise object resolved with the theme object and all
     *    corresponding new css/less and scrollbar information
     */
    function loadCurrentThemes() {
        var pendingThemes = _.map(getCurrentThemes(), function (theme) {

            return theme && FileUtils.readAsText(theme.file)
                .then(function (content) {
                    var result = extractScrollbars(content);
                    theme.scrollbar = result.scrollbar;
                    return result.content;
                })
                .then(function (content) {
                    return lessifyTheme(content, theme);
                })
                .then(function (style) {
                    return ExtensionUtils.addEmbeddedStyleSheet(style);
                })
                .then(function (styleNode) {
                    // Remove after the style has been applied to avoid weird flashes
                    if (theme.css) {
                        $(theme.css).remove();
                    }

                    theme.css = styleNode;
                    return theme;
                });
        });

        return $.when.apply(undefined, pendingThemes);
    }


    /**
     * Refresh currently loaded themes
     *
     * @param {boolean} force is to force reload the current themes
     */
    function refresh(force) {
        $.when(force && loadCurrentThemes()).done(function () {
            var editor = EditorManager.getActiveEditor();
            if (!editor || !editor._codeMirror) {
                return;
            }

            var cm =  editor._codeMirror;
            ThemeView.setDocumentMode(cm);
            ThemeView.updateThemes(cm);
            refreshEditor(cm);
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
        var deferred      = new $.Deferred(),
            file          = FileSystem.getFileForPath(fileName),
            currentThemes = (prefs.get("themes") || []);

        file.exists(function (err, exists) {
            var theme;

            if (exists) {
                theme = new Theme(file, options);
                loadedThemes[theme.name] = theme;
                ThemeSettings._setThemes(loadedThemes);

                // For themes that are loaded after ThemeManager has been loaded,
                // we should check if it's the current theme.  It is, then we just
                // load it.
                if (currentThemes.indexOf(theme.name) !== -1) {
                    refresh(true);
                }

                deferred.resolve(theme);
            } else if (err) {
                deferred.reject(err);
            }
        });

        return deferred.promise();
    }


    /**
     * Loads a theme from an extension package.
     *
     * @param {Object} themePackage is a package for the theme to be loaded.
     * @return {$.Promise} promise object resolved with the theme to be loaded from the pacakge
     */
    function loadPackage(themePackage) {
        var fileName = themePackage.path + "/" + themePackage.metadata.theme;
        return loadFile(fileName, themePackage.metadata);
    }


    /**
     * Load css/less files from a directory to be treated as themes
     *
     * @param {string} path where theme files are to be loaded from
     * @return {$.Promise} promise object resolved with the themes to be loaded from the directory
     */
    function loadDirectory(path) {
        var result = new $.Deferred();

        if (!path) {
            return result.reject({
                path: path,
                error: "Path not defined"
            });
        }

        function readContent(err, entries) {
            var i, files = [];
            entries = entries || [];

            for (i = 0; i < entries.length; i++) {
                if (isFileTypeValid(entries[i])) {
                    files.push(entries[i].name);
                }
            }

            if (err) {
                result.reject({
                    path: path,
                    error: err
                });
            } else {
                result.resolve({
                    files: files,
                    path: path
                });
            }
        }

        function loadThemesFiles(themes) {
            // Iterate through each name in the themes and make them theme objects
            var deferred = _.map(themes.files, function (themeFile) {
                return loadFile(themes.path + "/" + themeFile);
            });

            return $.when.apply(undefined, deferred);
        }

        FileSystem.getDirectoryForPath(path).getContents(readContent);
        return result.then(loadThemesFiles);
    }


    prefs.on("change", "themes", function () {
        refresh(true);
        ThemeView.updateScrollbars(getCurrentThemes()[0]);

        // Expose event for theme changes
        $(exports).trigger("themeChange", getCurrentThemes());
    });

    prefs.on("change", "customScrollbars", function () {
        refresh();
        ThemeView.updateScrollbars(getCurrentThemes()[0]);
    });

    prefs.on("change", "fontSize", function () {
        refresh();
        ThemeView.updateFontSize();
    });

    prefs.on("change", "lineHeight", function () {
        refresh();
        ThemeView.updateLineHeight();
    });

    prefs.on("change", "fontFamily", function () {
        refresh();
        ThemeView.updateFontFamily();
    });

    FileSystem.on("change", function (evt, file) {
        if (file.isDirectory) {
            return;
        }

        if (getThemeByFile(file)) {
            refresh(true);
        }
    });

    $(EditorManager).on("activeEditorChange", function () {
        refresh();
    });

    refresh(true);
    ThemeView.updateFonts();
    ThemeView.updateScrollbars();

    exports.refresh          = refresh;
    exports.loadFile         = loadFile;
    exports.loadPackage      = loadPackage;
    exports.loadDirectory    = loadDirectory;
    exports.getCurrentThemes = getCurrentThemes;
    exports.getAllThemes     = getAllThemes;

    // Exposed for testing purposes
    exports._toDisplayName     = toDisplayName;
    exports._extractScrollbars = extractScrollbars;
});
