/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
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

    var _themes         = {},
        themeReady      = false,
        commentRegex    = /\/\*([\s\S]*?)\*\//mg,
        scrollbarsRegex = /(?:[^}|,]*)::-webkit-scrollbar(?:[\s\S]*?){(?:[\s\S]*?)}/mg,
        validExtensions = ["css", "less"];

    ExtensionUtils.addLinkedStyleSheet("styles/brackets_theme_settings.css");

    /**
    * @constructor
    *
    * @param {File} file for the theme
    * @param {string} displayName is an optional parameter used as the display name for the theme
    */
    function Theme(file, options) {
        options = options || {};
        var fileName = file.name;

        this.file        = file;
        this.displayName = options.title     || toDisplayName(fileName);
        this.name        = options.name      || fileName.substring(0, fileName.lastIndexOf('.'));
        this.className   = options.className || "theme-" + this.name;
    }


    /**
    * @private
    * Takes all dashes and converts them to white spaces. Then takes all first letters
    * and capitalizes them.
    *
    * @param {string} name is what needs to be procseed to generate a display name
    * @return {string} theme name properly formatted for display
    */
    function toDisplayName (name) {
        name = name.substring(0, name.lastIndexOf('.')).replace(/-/g, ' ');
        var parts = name.split(" ");

        $.each(parts.slice(0), function (index, part) {
            parts[index] = part[0].toUpperCase() + part.substring(1);
        });

        return parts.join(" ");
    }


    /**
    * @private
    * Extracts the scrollbar text from the css/less content so that it can be treated
    * as a separate styling component that can be anabled/disabled independently from
    * the theme.
    *
    * @param {string} content is the css/less input string to be processed
    * @return {{content: string, scrollbar: string}} content is the new css/less content
    * with the scrollbar rules extracted out and put in scrollbar
    */
    function extractScrollbars(content) {
        var scrollbar = [];

        // Go through and extract out scrollbar customizations so that we can
        // enable/disable via settings.
        content = content
            .replace(commentRegex, "")
            .replace(scrollbarsRegex, function(match) {
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
    * Takes the content of a file and feeds it through the less processor in order
    * to provide support for less files.
    *
    * @param {string} content is the css/less string to be processed
    * @param {Theme} theme is the object the css/less corresponds to
    * @return {$.Deferred} promsie with the processed css/less as the resolved value
    */
    function lessifyTheme(content, theme) {
        var deferred = $.Deferred(),
            parser = new less.Parser();

        parser.parse("." + theme.className + "{" + content + "}", function (err, tree) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(tree.toCSS());
            }
        });

        return deferred.promise();
    }


    function isFileTypeValid(file) {
        return file.isFile &&
            validExtensions.indexOf(FileUtils.getFileExtension(file.name)) !== -1;
    }


    /**
    * @private
    * Will trigger a refresh of codemirror instance and editor resize so that
    * inline widgets get properly rendered
    *
    * @param {CodeMiror} cm code mirror instance to refresh
    */
    function refreshEditor(cm) {
        // Really dislike timing issues with CodeMirror.  I have to refresh
        // the editor after a little bit of time to make sure that themes
        // are properly applied to quick edit widgets
        setTimeout(function(){
            cm.refresh();
            EditorManager.resizeEditor();
        }, 100);
    }


    /**
    * @private
    * Loads all current themes
    *
    * @return {$.Deferred} promise object resolved with the theme object and all
    *    corresponding new css/less and scrollbar information
    */
    function loadCurrentThemes() {
        return $.when(undefined, _.map(getCurrentThemes(), function (theme) {
            if (!theme) {
                return $.Deferred().reject("Theme not found");
            }

            if (theme.css) {
                $(theme.css).remove();
            }

            return FileUtils.readAsText(theme.file)
                .then(function(content) {
                    var result = extractScrollbars(content);
                    theme.scrollbar = result.scrollbar;
                    return result.content;
                })
                .then(function(content) {
                    return lessifyTheme(content, theme);
                })
                .then(function(style) {
                    console.log(style);
                    return ExtensionUtils.addEmbeddedStyleSheet(style);
                })
                .then(function(styleNode) {
                    theme.css = styleNode;
                    return theme;
                })
                .promise();
        }));
    }


    /**
    * @private
    * Get all current theme objects
    *
    * @return {_.map} collection of the current theme instances
    */
    function getCurrentThemes() {
        return _.map(prefs.get("themes").slice(0), function (item) {
            return _themes[item];
        });
    }


    /**
    * Refresh currently loaded themes
    *
    * @param <boolean> force is to force reload the current themes
    */
    function refresh(force) {
        if (!themeReady) {
            return;
        }

        var editor = EditorManager.getActiveEditor();
        if (!editor || !editor._codeMirror) {
            return;
        }

        var cm =  editor._codeMirror;

        ThemeView.setDocumentMode(cm);

        if (!force) {
            ThemeView.updateThemes(cm);
            refreshEditor(cm);
        }
        else {
            loadCurrentThemes().done(function() {
                ThemeView.updateThemes(cm);
                refreshEditor(cm);
            });
        }
    }


    /**
    * Loads a theme from a file.
    *
    * @param {string} fileName is the full path to the file to be opened
    * @param {!srting} displayName is an optional parameter to specify the display
    *    name for the theme
    * @return {$.Deferred} promise object resolved with the theme to be loaded from fileName
    */
    function loadFile(fileName, options) {
        options = options || {};
        var deferred      = new $.Deferred(),
            file          = FileSystem.getFileForPath(fileName),
            currentThemes = (prefs.get("themes") || []);

        file.exists(function(err, exists) {
            var theme;

            if (exists) {
                theme = new Theme(file, options);
                _themes[theme.name] = theme;
                ThemeSettings.setThemes(_themes);

                // For themes that are loaded after ThemeManager has been loaded,
                // we should check if it's the current theme.  It is, then we just
                // load it.
                if (currentThemes.indexOf(theme.name) !== -1) {
                    refresh(true);
                }

                deferred.resolve(theme);
            }
            else if (err) {
                deferred.reject(err);
            }
        });

        return deferred.promise();
    }


    /**
    * Loads a theme from an extension package.
    *
    * @param {package} themePackage is a package for the theme to be loaded.
    * @return {$.Deferred} promise object resolved with the theme to be loaded from the pacakge
    */
    function loadPackage(themePackage) {
        var fileName = themePackage.path + "/" + themePackage.metadata.theme;
        return loadFile(fileName, themePackage.metadata);
    }


    /**
    * Load css/less files from a directory to be treated as themes
    *
    * @param {string} path where theme files are to be loaded from
    * @return {$.Deferred} promise object resolved with the themes to be loaded from the directory
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
            }
            else {
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
        return result.then(loadThemesFiles).promise();
    }


    prefs.on("change", "themes", function() {
        refresh(true);
        ThemeView.updateScrollbars(getCurrentThemes()[0]);

        // Expose event for theme changes
        $(exports).trigger("themeChange", getCurrentThemes());
    });

    prefs.on("change", "customScrollbars", function() {
        refresh();
        ThemeView.updateScrollbars(getCurrentThemes()[0]);
    });

    prefs.on("change", "fontSize", function() {
        refresh();
        ThemeView.updateFontSize();
    });

    prefs.on("change", "lineHeight", function() {
        refresh();
        ThemeView.updateLineHeight();
    });

    prefs.on("change", "fontType", function() {
        refresh();
        ThemeView.updateFontType();
    });

    FileSystem.on("change", function(evt, file) {
        var name = (file.name || "").substring(0, file.name.lastIndexOf('.')),
            theme = _themes[name];

        if (theme && theme.file.parentPath === file.parentPath) {
            refresh(true);
        }
    });

    $(EditorManager).on("activeEditorChange", function() {
        refresh();
    });

    // When the app is ready, we need to try to load whatever theme needs to be processed
    AppInit.appReady(function() {
        loadCurrentThemes()
            .always(function() {
                themeReady = true;
            })
            .done(function(){
                refresh();
            });
    });

    //
    // Exposed API
    //
    exports.refresh          = refresh;
    exports.loadFile         = loadFile;
    exports.loadPackage      = loadPackage;
    exports.loadDirectory    = loadDirectory;
    exports.getCurrentThemes = getCurrentThemes;
});
