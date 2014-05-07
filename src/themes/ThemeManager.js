/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function (require, exports, module) {
    "use strict";

    require("themes/MenuCommands");
    require("themes/FontSettings");
    require("themes/FontCommandsManager");

    var _                   = require("thirdparty/lodash"),
        EditorManager       = require("editor/EditorManager"),
        FileSystem          = require("filesystem/FileSystem"),
        ExtensionUtils      = require("utils/ExtensionUtils"),
        Settings            = require("themes/SettingsManager"),
        Theme               = require("themes/Theme"),
        themeSettings       = require("themes/ThemeSettingsDialog"),
        themeFiles          = require("themes/ThemeFiles"),
        themeApply          = require("themes/ThemeApply"),
        scrollbarsApply     = require("themes/ScrollbarsApply");


    // Load up reset.css to override brackground settings from brackets because
    // they make the themes look really bad.
    ExtensionUtils.addLinkedStyleSheet("themes/reset.css");
    ExtensionUtils.addLinkedStyleSheet("styles/brackets_theme_settings.css");


    /**
    */
    var ThemeManager = {};


    /**
    * Refresh currently load theme
    */
    ThemeManager.refresh = function(force) {
        var cm = getCM();
        if ( cm ) {
            setDocumentMode(cm);
            themeApply(ThemeManager, cm);
            refreshEditor(cm);
        }

        if ( force === true ) {
            loadThemes(ThemeManager.getThemes(), force === true).done(function() {
                setDocumentTheme(Settings.getValue("themes"));
                scrollbarsApply(ThemeManager);

                if ( cm ) {
                    refreshEditor(cm);
                }
            });
        }
    };


    /**
    * Returns all current theme objects
    */
    ThemeManager.getThemes = function() {
        return _.map(Settings.getValue("themes").slice(0), function (item) {
            return ThemeManager.themes[item];
        });
    };


    /**
    * Loads a theme from a file. fileName is the full path to the file
    */
    ThemeManager.loadFile = function(fileName, displayName) {
        var deferred = new $.Deferred();
        var file = FileSystem.getFileForPath (fileName);

        file.exists(function( err, exists ) {
            if ( exists ) {
                var theme = new Theme(file, displayName);
                deferred.resolve((ThemeManager.themes[theme.name] = theme));
                themeSettings.setThemes(ThemeManager.themes);


                // For themes that are loaded after ThemeManager has been loaded,
                // we should check if it the theme in the selected array so that
                // we can determine if we need to trigger a refresh
                if ( ThemeManager.selected.indexOf(theme.name) !== -1 ) {
                    ThemeManager.refresh(true);
                }
            }
            else if ( err ) {
                deferred.reject(err);
            }
        });

        return deferred.promise();
    };


    /**
    * Loads a theme from a file. fileName is the full path to the file
    */
    ThemeManager.loadPackage = function(themePackage) {
        var fileName = themePackage.path + "/" + themePackage.metadata.theme;
        return ThemeManager.loadFile(fileName, themePackage.metadata.title);
    };


    /**
    * Load css/less files from a directory to be treated as themes
    */
    ThemeManager.loadDirectory = function(path) {
        return themeFiles.loadDirectory(path).then(loadThemesFiles);
    };


    /**
    * Process theme meta deta to create theme instances
    */
    function loadThemesFiles(themes) {
        if (themes.error) {
            return;
        }

        // Iterate through each name in the themes and make them theme objects
        var deferred = _.map(themes.files, function (themeFile) {
            return ThemeManager.loadFile(themes.path + "/" + themeFile);
        });

        return $.when.apply(undefined, deferred);
    }


    /**
    * Add theme class to the document to add proper theme styling scoping.
    * New class is added, old class is removed.  This basically allows
    * themeSettings to get nicely cleaned up from the DOM.
    */
    function setDocumentTheme(newThemes) {
        var oldThemes = ThemeManager.selected;
        ThemeManager.selected = (newThemes = newThemes || []);

        // We gotta prefix theme names with "theme" because themes that start with a number
        // will not render correctly.  Class names that start with a number are invalid
        newThemes = _.map(newThemes, function(theme){ return "theme-" + theme; }).join(" ");
        oldThemes = _.map(oldThemes, function(theme){ return "theme-" + theme; }).join(" ");
        $("html").removeClass(oldThemes.replace(' ', ',')).addClass(newThemes.replace(' ', ','));
    }


    /**
    *
    */
    function setDocumentMode(cm) {
        var mode = cm.getDoc().getMode();
        var docMode = mode && (mode.helperType || mode.name);
        $("html").removeClass("doctype-" + ThemeManager.docMode).addClass("doctype-" + docMode);
        ThemeManager.docMode = docMode;
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


    ThemeManager.docMode = "";
    ThemeManager.themes = {};
    ThemeManager.selected = Settings.getValue("themes");


    $(EditorManager)
        .on("activeEditorChange", function() {
            ThemeManager.refresh(true);
        });

    $(Settings)
        .on("change:themes", function(evt, themes) {
            setDocumentTheme(themes);
            ThemeManager.refresh(true);
        })
        .on("change:fontSize", function() {
            ThemeManager.refresh();
        });

    FileSystem
        .on("change", function(evt, file) {
            var name = (file.name || "").substring(0, file.name.lastIndexOf('.')),
                theme = ThemeManager.themes[name];

            if ( theme && theme.getFile().parentPath === file.parentPath ) {
                ThemeManager.refresh(true);
            }
        });


    //
    // Exposed API
    //
    return {
        refresh: ThemeManager.refresh,
        loadFile: ThemeManager.loadFile,
        loadPackage: ThemeManager.loadPackage,
        getThemes: ThemeManager.getThemes
    };

});
