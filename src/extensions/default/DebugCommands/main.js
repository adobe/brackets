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
/*global define, $, brackets, window, Mustache */

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
        ErrorNotification      = require("ErrorNotification"),
        NodeDebugUtils         = require("NodeDebugUtils"),
        PerfDialogTemplate     = require("text!htmlContent/perf-dialog.html"),
        LanguageDialogTemplate = require("text!htmlContent/language-dialog.html");
    
    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));
    
    /**
     * Brackets Application Menu Constant
     * @const {string}
     */
    var DEBUG_MENU = "debug-menu";
    
     /**
      * Debug commands IDs
      * @enum {string}
      */
    var DEBUG_REFRESH_WINDOW            = "debug.refreshWindow", // string must MATCH string in native code (brackets_extensions)
        DEBUG_SHOW_DEVELOPER_TOOLS      = "debug.showDeveloperTools",
        DEBUG_RUN_UNIT_TESTS            = "debug.runUnitTests",
        DEBUG_SHOW_PERF_DATA            = "debug.showPerfData",
        DEBUG_RELOAD_WITHOUT_USER_EXTS  = "debug.reloadWithoutUserExts",
        DEBUG_NEW_BRACKETS_WINDOW       = "debug.newBracketsWindow",
        DEBUG_SWITCH_LANGUAGE           = "debug.switchLanguage",
        DEBUG_ENABLE_NODE_DEBUGGER      = "debug.enableNodeDebugger",
        DEBUG_LOG_NODE_STATE            = "debug.logNodeState",
        DEBUG_RESTART_NODE              = "debug.restartNode",
        DEBUG_SHOW_ERRORS_IN_STATUS_BAR = "debug.showErrorsInStatusBar",
        DEBUG_OPEN_BRACKETS_SOURCE      = "debug.openBracketsSource";

    PreferencesManager.definePreference(DEBUG_SHOW_ERRORS_IN_STATUS_BAR, "boolean", false);
    
    function handleShowDeveloperTools() {
        brackets.app.showDeveloperTools();
    }
    
    // Implements the 'Run Tests' menu to bring up the Jasmine unit test window
    var _testWindow = null;
    function _runUnitTests(spec) {
        var queryString = spec ? "?spec=" + spec : "";
        if (_testWindow) {
            try {
                if (_testWindow.location.search !== queryString) {
                    _testWindow.location.href = "../test/SpecRunner.html" + queryString;
                } else {
                    _testWindow.location.reload(true);
                }
            } catch (e) {
                _testWindow = null;  // the window was probably closed
            }
        }
        
        if (!_testWindow) {
            _testWindow = window.open("../test/SpecRunner.html" + queryString, "brackets-test", "width=" + $(window).width() + ",height=" + $(window).height());
            _testWindow.location.reload(true); // if it was opened before, we need to reload because it will be cached
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
    menu.addMenuItem(Commands.FILE_OPEN_PREFERENCES); // this command is defined in core, but exposed only in Debug menu for now
    
    // exposed for convenience, but not official API
    exports._runUnitTests = _runUnitTests;
});
