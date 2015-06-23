/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, brackets, window, Mustache*/

define(function (require, exports, module) {
    "use strict";
    
    var _ = brackets.getModule("thirdparty/lodash");
    
    var Commands               = brackets.getModule("command/Commands"),
        CommandManager         = brackets.getModule("command/CommandManager"),
        Menus                  = brackets.getModule("command/Menus"),
        FileSystem             = brackets.getModule("filesystem/FileSystem"),
        FileUtils              = brackets.getModule("file/FileUtils"),
        PerfUtils              = brackets.getModule("utils/PerfUtils"),
        StringUtils            = brackets.getModule("utils/StringUtils"),
        Dialogs                = brackets.getModule("widgets/Dialogs"),
        Strings                = brackets.getModule("strings"),
        PreferencesManager     = brackets.getModule("preferences/PreferencesManager"),
        LocalizationUtils      = brackets.getModule("utils/LocalizationUtils"),
        MainViewManager        = brackets.getModule("view/MainViewManager"),
        WorkingSetView         = brackets.getModule("project/WorkingSetView"),
        ErrorNotification      = require("ErrorNotification"),
        NodeDebugUtils         = require("NodeDebugUtils"),
        PerfDialogTemplate     = require("text!htmlContent/perf-dialog.html"),
        LanguageDialogTemplate = require("text!htmlContent/language-dialog.html");
    
    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));
    
    // default preferences file name    
    var DEFAULT_SETTINGS_FILENAME = "defaultSettings.json";

    var reComputeDefaultPrefs     = true,
        defaultSettingsFullPath   = brackets.app.getApplicationSupportDirectory() + "/" + DEFAULT_SETTINGS_FILENAME;
    
    // unit testing.
    var preferencesId      = "denniskehrig.ShowWhitespace";
    var defaultPreferences = {
        checked: true,
        colors: {
            "light": {
                "empty": "#ccc",
                "leading": "#ccc",
                "trailing": "#ff0000",
                "whitespace": "#ccc"
            },
            "dark": {
                "empty": "#686963",
                "leading": "#686963",
                "trailing": "#ff0000",
                "whitespace": "#686963"
            }
        }
    };
    
    var _preferences = PreferencesManager.getExtensionPrefs(preferencesId);
    _preferences.definePreference("checked", "boolean", defaultPreferences.checked);
    _preferences.definePreference("colors", "Object", defaultPreferences.colors);
    
    /**
     * Brackets Application Menu Constant
     * @const {string}
     */
    var DEBUG_MENU = "debug-menu";
    
     /**
      * Debug commands IDs
      * @enum {string}
      */
    var DEBUG_REFRESH_WINDOW                  = "debug.refreshWindow", // string must MATCH string in native code (brackets_extensions)
        DEBUG_SHOW_DEVELOPER_TOOLS            = "debug.showDeveloperTools",
        DEBUG_RUN_UNIT_TESTS                  = "debug.runUnitTests",
        DEBUG_SHOW_PERF_DATA                  = "debug.showPerfData",
        DEBUG_RELOAD_WITHOUT_USER_EXTS        = "debug.reloadWithoutUserExts",
        DEBUG_NEW_BRACKETS_WINDOW             = "debug.newBracketsWindow",
        DEBUG_SWITCH_LANGUAGE                 = "debug.switchLanguage",
        DEBUG_ENABLE_NODE_DEBUGGER            = "debug.enableNodeDebugger",
        DEBUG_LOG_NODE_STATE                  = "debug.logNodeState",
        DEBUG_RESTART_NODE                    = "debug.restartNode",
        DEBUG_SHOW_ERRORS_IN_STATUS_BAR       = "debug.showErrorsInStatusBar",
        DEBUG_OPEN_BRACKETS_SOURCE            = "debug.openBracketsSource",
        DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW  = "debug.openPrefsInSplitView";
    
    // define a preference to turn off opening preferences in split-view.
    PreferencesManager.definePreference(DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW, "boolean", true, {
        description: Strings.DESCRIPTION_OPEN_PREFS_IN_SPLIT_VIEW
    });
    
    PreferencesManager.definePreference(DEBUG_SHOW_ERRORS_IN_STATUS_BAR, "boolean", false, {
        description: Strings.DESCRIPTION_SHOW_ERRORS_IN_STATUS_BAR
    });
    
    function handleShowDeveloperTools() {
        brackets.app.showDeveloperTools();
    }
    
    // Implements the 'Run Tests' menu to bring up the Jasmine unit test window
    var _testWindow = null;
    function _runUnitTests(spec) {
        var queryString = spec ? "?spec=" + spec : "";
        if (_testWindow && !_testWindow.closed) {
            if (_testWindow.location.search !== queryString) {
                _testWindow.location.href = "../test/SpecRunner.html" + queryString;
            } else {
                _testWindow.location.reload(true);
            }
        } else {
            _testWindow = window.open("../test/SpecRunner.html" + queryString, "brackets-test", "width=" + $(window).width() + ",height=" + $(window).height());
            _testWindow.location.reload(true); // if it had been opened earlier, force a reload because it will be cached
        }
    }
    
    function handleReload() {
        CommandManager.execute(Commands.APP_RELOAD);
    }
    
    function handleReloadWithoutUserExts() {
        CommandManager.execute(Commands.APP_RELOAD_WITHOUT_EXTS);
    }
        
    function handleNewBracketsWindow() {
        window.open(window.location.href);
    }
    
    function handleShowPerfData() {
        var templateVars = {
            delimitedPerfData: PerfUtils.getDelimitedPerfData(),
            perfData: []
        };
        
        var getValue = function (entry) {
            // entry is either an Array or a number
            if (Array.isArray(entry)) {
                // For Array of values, return: minimum/average(count)/maximum/last
                var i, e, avg, sum = 0, min = Number.MAX_VALUE, max = 0;
                
                for (i = 0; i < entry.length; i++) {
                    e = entry[i];
                    min = Math.min(min, e);
                    sum += e;
                    max = Math.max(max, e);
                }
                avg = Math.round(sum * 10 / entry.length) / 10; // tenth of a millisecond
                return String(min) + "/" + String(avg) + "(" + entry.length + ")/" + String(max) + "/" + String(e);
            } else {
                return entry;
            }
        };
        
        var perfData = PerfUtils.getData();
        _.forEach(perfData, function (value, testName) {
            templateVars.perfData.push({
                testName: StringUtils.breakableUrl(testName),
                value:    getValue(value)
            });
        });
        
        var template = Mustache.render(PerfDialogTemplate, templateVars);
        Dialogs.showModalDialogUsingTemplate(template);
        
        // Select the raw perf data field on click since select all doesn't 
        // work outside of the editor
        $("#brackets-perf-raw-data").click(function () {
            $(this).focus().select();
        });
    }
    
    function handleSwitchLanguage() {
        var stringsPath = FileUtils.getNativeBracketsDirectoryPath() + "/nls";
        
        FileSystem.getDirectoryForPath(stringsPath).getContents(function (err, entries) {
            if (!err) {
                var $dialog,
                    $submit,
                    $select,
                    locale,
                    curLocale = (brackets.isLocaleDefault() ? null : brackets.getLocale()),
                    languages = [];
                
                var setLanguage = function (event) {
                    locale = $select.val();
                    $submit.prop("disabled", locale === (curLocale || ""));
                };

                // inspect all children of dirEntry
                entries.forEach(function (entry) {
                    if (entry.isDirectory) {
                        var match = entry.name.match(/^([a-z]{2})(-[a-z]{2})?$/);
                        
                        if (match) {
                            var language = entry.name,
                                label = match[1];
                            
                            if (match[2]) {
                                label += match[2].toUpperCase();
                            }
                            
                            languages.push({label: LocalizationUtils.getLocalizedLabel(label), language: language});
                        }
                    }
                });
                // add English (US), which is the root folder and should be sorted as well
                languages.push({label: LocalizationUtils.getLocalizedLabel("en"),  language: "en"});

                // sort the languages via their display name
                languages.sort(function (lang1, lang2) {
                    return lang1.label.localeCompare(lang2.label);
                });

                // add system default (which is placed on the very top)
                languages.unshift({label: Strings.LANGUAGE_SYSTEM_DEFAULT, language: null});
                
                var template = Mustache.render(LanguageDialogTemplate, {languages: languages, Strings: Strings});
                Dialogs.showModalDialogUsingTemplate(template).done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_OK && locale !== curLocale) {
                        brackets.setLocale(locale);
                        CommandManager.execute(Commands.APP_RELOAD);
                    }
                });
                
                $dialog = $(".switch-language.instance");
                $submit = $dialog.find(".dialog-button[data-button-id='" + Dialogs.DIALOG_BTN_OK + "']");
                $select = $dialog.find("select");
                
                $select.on("change", setLanguage).val(curLocale);
            }
        });
    }
    
    function enableRunTestsMenuItem() {
        if (brackets.inBrowser) {
            return;
        }

        // Check for the SpecRunner.html file
        var file = FileSystem.getFileForPath(
            FileUtils.getNativeBracketsDirectoryPath() + "/../test/SpecRunner.html"
        );
        
        file.exists(function (err, exists) {
            if (!err && exists) {
                // If the SpecRunner.html file exists, enable the menu item.
                // (menu item is already disabled, so no need to disable if the
                // file doesn't exist).
                CommandManager.get(DEBUG_RUN_UNIT_TESTS).setEnabled(true);
            }
        });
    }
    
    function toggleErrorNotification(bool) {
        var val,
            oldPref = !!PreferencesManager.get(DEBUG_SHOW_ERRORS_IN_STATUS_BAR);

        if (bool === undefined) {
            val = !oldPref;
        } else {
            val = !!bool;
        }

        ErrorNotification.toggle(val);

        // update menu
        CommandManager.get(DEBUG_SHOW_ERRORS_IN_STATUS_BAR).setChecked(val);
        if (val !== oldPref) {
            PreferencesManager.set(DEBUG_SHOW_ERRORS_IN_STATUS_BAR, val);
        }
    }

    function handleOpenBracketsSource() {
        // Brackets source dir w/o the trailing src/ folder
        var dir = FileUtils.getNativeBracketsDirectoryPath().replace(/\/[^\/]+$/, "/");
        brackets.app.showOSFolder(dir);
    }

    function _getDefaultPrefsFilePath() {
        // Default preferences
        return defaultSettingsFullPath;
    }

    function _openPrefFilesInSplitView(prefsPath, defaultPrefsPath) {

        var currScheme = MainViewManager.getLayoutScheme(),
            file       = FileSystem.getFileForPath(prefsPath);

        // Open the default preferences in the left pane in the read only mode.
        CommandManager.execute(Commands.FILE_OPEN, { fullPath: defaultPrefsPath, paneId: "first-pane", isReadOnly: true});

        if (currScheme.rows === 1 && currScheme.columns === 1) {
            // Split layout is not active yet. Inititate the
            // split view.
            MainViewManager.setLayoutScheme(1, 2);
        }


        // Make sure the preference file is already
        if (MainViewManager.findInWorkingSet("first-pane", prefsPath) >= 0) {

            MainViewManager._moveView("first-pane", "second-pane", file, 0, true);

            // Now refresh the project tree by asking
            // it to rebuild the UI.
            WorkingSetView.refresh(true);
        }

        CommandManager.execute(Commands.FILE_OPEN, { fullPath: prefsPath, paneId: "second-pane"});

    }

    // This method tries to deduce the preference type
    // based on various parameters like objects initial
    // value, object type, object's type property.
    function _getObjType(prefObj) {
        
        var prefType;
        
        if (prefObj) {
            
            // check the type parameter.
            if (prefObj.type) {
                
                // preference object's type
                // is defined. Check if that is valid or not.
                prefType = prefObj.type.toLowerCase();
                if ((prefType !== "number"  &&
                     prefType !== "boolean" &&
                     prefType !== "string"  &&
                     prefType !== "array"   &&
                     prefType !== "object")) {
                    prefType = undefined;
                }
            } else if (typeof (prefObj.initial) !== "undefined") {
                
                // OK looks like this preference has
                // no explicit type defined. instead 
                // it needs to be deduced from initial
                // variable.
                prefType = typeof (prefObj.initial);
                
            } else if (prefObj.keys !== undefined) {
                prefType = typeof (prefObj.keys);
            } else {
                prefType = typeof (prefObj);
            }
        }
        
        return prefType;
    }

    function _isValidPref(pref) {
        
        // Make sure to generate pref description only for
        // user overrides and don't generate for properties
        // meant to be used for internal purposes. Also check
        // if the preference type is valid or not.
        
        if (pref && !pref.excludeFromHints && _getObjType(pref) !== "undefined") {
            return true;
        }

        return false;
    }
    
    // This method tries to matach between initial objects
    // and key objects and then aggregates objects from both
    // the properties.
    function _getObjKeys(prefObj) {

        var finalObj = {},
            property,
            keysFound = false;
        
        if (!finalObj) {
            return {};
        }
        
        if (typeof (prefObj.initial) === "object") {
            // iterate through the list.
            keysFound = true;
            for (property in prefObj.initial) {
                if (prefObj.initial.hasOwnProperty(property)) {
                    finalObj[property] = prefObj.initial[property];
                }
            }
        }
        
        if (typeof (prefObj.keys) === "object") {
            // iterate through the list.
            var allKeys = prefObj.keys;
            keysFound = true;
            for (property in allKeys) {
                if (allKeys.hasOwnProperty(property)) {
                    finalObj[property] = prefObj.keys[property];
                }
            }
        }
        
        // Last resort: Maybe plain objects.
        if (keysFound === false) {
            for (property in prefObj) {
                if (prefObj.hasOwnProperty(property)) {
                    finalObj[property] = prefObj[property];
                }
            }
        }
        
        return finalObj;
        
    }

    function _formatDefault(prefObj, prefName, tabIndentStr) {
        
        if (!prefObj || _getObjType(prefObj) === "object") {
            // return empty string in case of
            // object or pref not defined.
            return "";
        }
        
        var prefDescription = prefObj.description || "",
            prefDefault     = prefObj.initial,
            prefFormatText  = tabIndentStr + "\t// {0}\n" + tabIndentStr + "\t\"{1}\": {2}",
            prefObjType     = _getObjType(prefObj);
        
        if (prefObj.initial === undefined && !prefObj.description) {
                
            if (prefObjType === "number" || prefObjType === "boolean" || prefObjType === "string") {
                prefDefault     = prefObj;
            }
        }

        if (prefDefault === undefined) {
            if (prefObjType === "number") {
                prefDefault = 0;
            } else if (prefObjType === "boolean") {
                // Defaulting the preference to false,
                // in case this is missing.
                prefDefault = false;
            } else {
                // for all other types
                prefDefault = "";
            }
        }

        if ((prefDescription === undefined || prefDescription.length === 0)) {
            if (!prefDefault.isArray) {
                prefDescription = "Default: " + prefDefault;
            }
        }

        if (prefObjType === "array") {
            prefDefault = "[]";
        } else if (prefDefault.length === 0 || (prefObjType !== "boolean" && prefObjType !== "number")) {
            prefDefault = "\"" + prefDefault + "\"";
        }

        return StringUtils.format(prefFormatText, prefDescription, prefName, prefDefault);
        
    }
        
    function _formatPref(prefName,  prefObj, indentLevel) {
        
        // check for validity of the parameters being passed
        if (!prefObj || indentLevel < 0 || !prefName || !prefName.length || prefName.length <= 0) {
            return "";
        }
        
        var iLevel,
            entireText     = "",
            property,
            prefObjKeys,
            prefObjDesc    = prefObj.description || "",
            prefObjType    = prefObj.type,
            hasKeys        = false,
            tabIndents     = "",
            numKeys        = 0;
        

        // Generate the indentLevel
        for (iLevel = 0; iLevel < indentLevel; iLevel++) {
            tabIndents = tabIndents + "\t";
        }
        
        if (_getObjType(prefObj) === "object") {
            prefObjKeys = _getObjKeys(prefObj);
        }
        
        if (prefObjKeys && Object.keys(prefObjKeys).length > 0) {
            hasKeys = true;
        }
        
        // There are some properties like "highlightMatches" that
        // are declared as boolean type but still can take object keys.
        // The below condition check can take care of cases like this.
        if (prefObjType !== "object" && hasKeys === false) {
            return _formatDefault(prefObj, prefName, tabIndents);
        }
        
        // Indent the beginning of the object.
        tabIndents = tabIndents + "\t";
        
        if (prefObjDesc && prefObjDesc.length > 0) {
            entireText = tabIndents + "// " + prefObjDesc + "\n";
        }
        
        entireText = entireText + tabIndents + "\"" + prefName + "\": " + "{";
        
        if (prefObjKeys) {
            numKeys = Object.keys(prefObjKeys).length;
        }
        
        // In case the object array is empty
        if (numKeys <= 0) {
            entireText = entireText + "}";
            return entireText;
        } else {
            entireText = entireText + "\n";
        }
        
        // Now iterate through all the keys
        // and generate nested formatted objects.

        for (property in prefObjKeys) {
            
            if (prefObjKeys.hasOwnProperty(property)) {

                var pref = prefObjKeys[property];
                
                if (_isValidPref(pref)) {

                    var formattedText = "";
                    
                    //if (pref.type === "object" || (pref.keys && pref.keys.length > 0)) {
                    if (_getObjType(pref) === "object") {
                        formattedText = _formatPref(property, pref, indentLevel + 1);
                    } else {
                        formattedText = _formatDefault(pref, property, tabIndents);
                    }
                    
                    if (formattedText.length > 0) {
                        entireText = entireText + formattedText + ",\n\n";
                    }
                }
            }
        }
        
        // Strip ",\n\n" that got added above, for the last property
        if (entireText.length > 0) {
            entireText = entireText.slice(0, -3) + "\n" + tabIndents + "}";
        } else {
            entireText = "{}";
        }
        
        return entireText;
        
    }
    
    function _getDefaultPreferencesString() {

        var allPrefs       = PreferencesManager.getAllPreferences(),
            headerComment  = Strings.DEFAULT_SETTINGS_JSON_HEADER_COMMENT + "\n{\n",
            entireText     = "",
            property;

        for (property in allPrefs) {

            if (allPrefs.hasOwnProperty(property)) {

                var pref = allPrefs[property];
                if (property === "denniskehrig.ShowWhitespace.colors") {
                    var i = 0;
                }
                if (property === "language.fileExtensions") {
                    var i2 = 0;
                }
                if (property === "linting.usePreferredOnly") {
                    var i3 = 0;
                }
                if (_isValidPref(pref)) {
                    entireText  = entireText + _formatPref(property, pref, 0) + ",\n\n";
                }
            }
        }
        
        // Strip ",\n\n" that got added above, for the last property
        if (entireText.length > 0) {
            entireText = headerComment + entireText.slice(0, -3) + "\n}\n";
        } else {
            entireText = headerComment + "}\n";
        }

        return entireText;
    }

    function _loadDefaultPrefs(prefsPath) {

        var defaultPrefsPath = _getDefaultPrefsFilePath(),
            file             = FileSystem.getFileForPath(defaultPrefsPath);

        file.exists(function (err, doesExist) {

            if (doesExist) {

                // Go about recreating the default preferecences file.
                if (reComputeDefaultPrefs) {

                    var prefsString = _getDefaultPreferencesString();
                    reComputeDefaultPrefs     = false;

                    // We need to delete this first
                    file.unlink(function (err) {
                        if (!err) {
                            // Go about recreating this
                            // file and write the default
                            // preferences string to this file.
                            FileUtils.writeText(file, prefsString, true)
                                .done(function () {
                                    reComputeDefaultPrefs = false;
                                    _openPrefFilesInSplitView(prefsPath, defaultPrefsPath);
                                });
                        } else {
                            // Some error occured while trying to delete
                            // the file. In this case open the user
                            // preferences alone.
                            console.error("Unable to delete the existing default preferences file! error code:" + err);
                            CommandManager.execute(Commands.FILE_OPEN_PREFERENCES);
                        }
                    });

                } else {
                    // Default preferences already generated.
                    // Just go about opening both the files.
                    _openPrefFilesInSplitView(prefsPath, defaultPrefsPath);
                }
            } else {

                // The default prefs file does not exist at all.
                // So go about recreating the default preferences
                // file.
                var _prefsString = _getDefaultPreferencesString();
                FileUtils.writeText(file, _prefsString, true)
                    .done(function () {
                        reComputeDefaultPrefs = false;
                        _openPrefFilesInSplitView(prefsPath, defaultPrefsPath);
                    });
            }
        });
    }

    function handleOpenPrefsInSplitView() {

        var fullPath        = PreferencesManager.getUserPrefFile(),
            file            = FileSystem.getFileForPath(fullPath),
            splitViewPrefOn = PreferencesManager.get(DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW);
        
        if (!splitViewPrefOn) {
            CommandManager.execute(Commands.FILE_OPEN_PREFERENCES);
        } else {
            file.exists(function (err, doesExist) {

                if (doesExist) {
                    _loadDefaultPrefs(fullPath);

                } else {
                    FileUtils.writeText(file, "", true)
                        .done(function () {
                            _loadDefaultPrefs(fullPath);
                        });
                }
            });
        }

    }

    /* Register all the command handlers */
    
    // Show Developer Tools (optionally enabled)
    CommandManager.register(Strings.CMD_SHOW_DEV_TOOLS,             DEBUG_SHOW_DEVELOPER_TOOLS,     handleShowDeveloperTools)
        .setEnabled(!!brackets.app.showDeveloperTools);
    CommandManager.register(Strings.CMD_REFRESH_WINDOW,             DEBUG_REFRESH_WINDOW,           handleReload);
    CommandManager.register(Strings.CMD_RELOAD_WITHOUT_USER_EXTS,   DEBUG_RELOAD_WITHOUT_USER_EXTS, handleReloadWithoutUserExts);
    CommandManager.register(Strings.CMD_NEW_BRACKETS_WINDOW,        DEBUG_NEW_BRACKETS_WINDOW,      handleNewBracketsWindow);
    
    // Start with the "Run Tests" item disabled. It will be enabled later if the test file can be found.
    CommandManager.register(Strings.CMD_RUN_UNIT_TESTS,       DEBUG_RUN_UNIT_TESTS,         _runUnitTests)
        .setEnabled(false);
    
    CommandManager.register(Strings.CMD_SHOW_PERF_DATA,            DEBUG_SHOW_PERF_DATA,            handleShowPerfData);

    // Open Brackets Source (optionally enabled)
    CommandManager.register(Strings.CMD_OPEN_BRACKETS_SOURCE,      DEBUG_OPEN_BRACKETS_SOURCE,      handleOpenBracketsSource)
        .setEnabled(!StringUtils.endsWith(decodeURI(window.location.pathname), "/www/index.html"));

    CommandManager.register(Strings.CMD_SWITCH_LANGUAGE,           DEBUG_SWITCH_LANGUAGE,           handleSwitchLanguage);
    CommandManager.register(Strings.CMD_SHOW_ERRORS_IN_STATUS_BAR, DEBUG_SHOW_ERRORS_IN_STATUS_BAR, toggleErrorNotification);
    
    // Node-related Commands
    CommandManager.register(Strings.CMD_ENABLE_NODE_DEBUGGER, DEBUG_ENABLE_NODE_DEBUGGER,   NodeDebugUtils.enableDebugger);
    CommandManager.register(Strings.CMD_LOG_NODE_STATE,       DEBUG_LOG_NODE_STATE,         NodeDebugUtils.logNodeState);
    CommandManager.register(Strings.CMD_RESTART_NODE,         DEBUG_RESTART_NODE,           NodeDebugUtils.restartNode);
    
    CommandManager.register(Strings.CMD_OPEN_PREFERENCES, DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW, handleOpenPrefsInSplitView);

    enableRunTestsMenuItem();
    toggleErrorNotification(PreferencesManager.get(DEBUG_SHOW_ERRORS_IN_STATUS_BAR));

    PreferencesManager.on("change", DEBUG_SHOW_ERRORS_IN_STATUS_BAR, function () {
        toggleErrorNotification(PreferencesManager.get(DEBUG_SHOW_ERRORS_IN_STATUS_BAR));
    });
    
    /*
     * Debug menu
     */
    var menu = Menus.addMenu(Strings.DEBUG_MENU, DEBUG_MENU, Menus.BEFORE, Menus.AppMenuBar.HELP_MENU);
    menu.addMenuItem(DEBUG_SHOW_DEVELOPER_TOOLS, KeyboardPrefs.showDeveloperTools);
    menu.addMenuItem(DEBUG_REFRESH_WINDOW, KeyboardPrefs.refreshWindow);
    menu.addMenuItem(DEBUG_RELOAD_WITHOUT_USER_EXTS, KeyboardPrefs.reloadWithoutUserExts);
    menu.addMenuItem(DEBUG_NEW_BRACKETS_WINDOW);
    menu.addMenuDivider();
    menu.addMenuItem(DEBUG_SWITCH_LANGUAGE);
    menu.addMenuDivider();
    menu.addMenuItem(DEBUG_RUN_UNIT_TESTS);
    menu.addMenuItem(DEBUG_SHOW_PERF_DATA);
    menu.addMenuItem(DEBUG_OPEN_BRACKETS_SOURCE);
    menu.addMenuDivider();
    menu.addMenuItem(DEBUG_ENABLE_NODE_DEBUGGER);
    menu.addMenuItem(DEBUG_LOG_NODE_STATE);
    menu.addMenuItem(DEBUG_RESTART_NODE);
    menu.addMenuItem(DEBUG_SHOW_ERRORS_IN_STATUS_BAR);
    menu.addMenuItem(DEBUG_OPEN_PREFERENCES_IN_SPLIT_VIEW); // this command will enable defaultPreferences and brackets preferences to be open side by side in split view.
    menu.addMenuItem(Commands.FILE_OPEN_KEYMAP);      // this command is defined in core, but exposed only in Debug menu for now
    
    // exposed for convenience, but not official API
    exports._runUnitTests = _runUnitTests;
});
