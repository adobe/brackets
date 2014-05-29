/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function (require, exports, module) {
    "use strict";

    // FontsCommandsManager will be going away soon when we add font size management in Brackets.
    require("themes/FontCommandsManager");

    var _                  = require("thirdparty/lodash"),
        FileSystem         = require("filesystem/FileSystem"),
        FileUtils          = require("file/FileUtils"),
        EditorManager      = require("editor/EditorManager"),
        ExtensionUtils     = require("utils/ExtensionUtils"),
        Theme              = require("view/Theme"),
        ThemeSettings      = require("view/ThemeSettings"),
        ThemeView          = require("view/ThemeView"),
        AppInit            = require("utils/AppInit"),
        PreferencesManager = require("preferences/PreferencesManager"),
        prefs              = PreferencesManager.getExtensionPrefs("brackets-themes");

    // Load up reset.css to override brackground settings from brackets because
    // they make the themes look really bad.
    ExtensionUtils.addLinkedStyleSheet("themes/reset.css");
    ExtensionUtils.addLinkedStyleSheet("styles/brackets_theme_settings.css");

    var appReady = false;

    // Bucket with all fully resolved theme objects.
    var _themes = {};

    // Valid theme file extensions
    var validExtensions = ["css", "less"];


    /**
    * Refresh currently load theme
    */
    function refresh(force) {
        if (!appReady) {
            return;
        }

        var cm = getCM();

        if(cm) {
            ThemeView.setDocumentMode(cm);

            if(force === false) {
                ThemeView.updateThemes(cm);
                refreshEditor(cm);
            }
            else {
                loadThemes(getThemes(), true).done(function() {
                    ThemeView.updateThemes(cm);
                    refreshEditor(cm);
                });
            }
        }
    }


    /**
    * Returns all current theme objects
    */
    function getThemes() {
        return _.map(prefs.get("themes").slice(0), function (item) {
            return _themes[item];
        });
    }


    /**
    * Loads a theme from a file. fileName is the full path to the file
    */
    function loadFile(fileName, displayName) {
        var deferred      = new $.Deferred(),
            file          = FileSystem.getFileForPath(fileName),
            currentThemes = (prefs.get("themes") || []);

        file.exists(function(err, exists) {
            var theme;

            if(exists) {
                theme = new Theme(file, displayName);
                _themes[theme.name] = theme;
                ThemeSettings.setThemes(_themes);

                // For themes that are loaded after ThemeManager has been loaded,
                // we should check if it the theme in the selected array so that
                // we can determine if we need to trigger a refresh
                if(currentThemes.indexOf(theme.name) !== -1) {
                    refresh(true);
                }

                deferred.resolve(theme);
            }
            else if(err) {
                deferred.reject(err);
            }
        });

        return deferred.promise();
    }


    /**
    * Loads a theme from a file. fileName is the full path to the file
    */
    function loadPackage(themePackage) {
        var fileName = themePackage.path + "/" + themePackage.metadata.theme;
        return loadFile(fileName, themePackage.metadata.title);
    }


    /**
    * Load css/less files from a directory to be treated as themes
    */
    function loadDirectory(path) {
        var result = new $.Deferred();

        if(!path) {
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

            if ( err ) {
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


        FileSystem.getDirectoryForPath(path).getContents(readContent);
        return result.then(loadThemesFiles).promise();
    }


    function isFileTypeValid(file) {
        return file.isFile &&
            validExtensions.indexOf(FileUtils.getFileExtension(file.name)) !== -1;
    }


    /**
    * Process theme meta deta to create theme instances
    */
    function loadThemesFiles(themes) {
        // Iterate through each name in the themes and make them theme objects
        var deferred = _.map(themes.files, function (themeFile) {
            return loadFile(themes.path + "/" + themeFile);
        });

        return $.when.apply(undefined, deferred);
    }


    /**
    * Loads theme style files
    */
    function loadThemes(themes, refresh) {
        var pending = _.map(themes, function (theme) {
            if ( theme ) {
                return theme.load(refresh);
            }
        });

        return $.when.apply(undefined, pending);
    }


    /**
    * Will trigger a refresh of codemirror instance and editor resize so that
    * inline widgets get properly
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


    function getCM() {
        var editor = EditorManager.getActiveEditor();
        if (!editor || !editor._codeMirror) {
            return;
        }
        return editor._codeMirror;
    }


    prefs.on("change", "themes", function() {
        refresh(true);
        ThemeView.updateScrollbars(getThemes()[0]);

        // Expose event for theme changes
        $(exports).trigger("themeChange", getThemes());
    });

    prefs.on("change", "customScrollbars", function() {
        refresh();
        ThemeView.updateScrollbars(getThemes()[0]);
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


    $(EditorManager).on("activeEditorChange", function() {
        refresh(true);
    });


    FileSystem.on("change", function(evt, file) {
        var name = (file.name || "").substring(0, file.name.lastIndexOf('.')),
            theme = _themes[name];

        if ( theme && theme.getFile().parentPath === file.parentPath ) {
            refresh(true);
        }
    });


    AppInit.appReady(function() {
        appReady = true;
        refresh(true);
    });


    /**
    * TODO: remove temporary code to load all themes from CodeMirror.  This is just to test
    * the whole workflow of loading an entire directory and also to show case themes in brackets :)
    */
    var cm_path = FileUtils.getNativeBracketsDirectoryPath() + "/thirdparty/CodeMirror2";
    loadDirectory( cm_path + "/theme" );


    //
    // Exposed API
    //
    exports.refresh       = refresh;
    exports.loadFile      = loadFile;
    exports.loadPackage   = loadPackage;
    exports.loadDirectory = loadDirectory;
    exports.getThemes     = getThemes;
});
