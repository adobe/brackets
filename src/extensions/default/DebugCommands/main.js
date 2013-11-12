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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, WebSocket, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    var _ = brackets.getModule("thirdparty/lodash");
    
    var Commands               = brackets.getModule("command/Commands"),
        CommandManager         = brackets.getModule("command/CommandManager"),
        KeyBindingManager      = brackets.getModule("command/KeyBindingManager"),
        Menus                  = brackets.getModule("command/Menus"),
        Editor                 = brackets.getModule("editor/Editor").Editor,
        FileSystem             = brackets.getModule("filesystem/FileSystem"),
        FileUtils              = brackets.getModule("file/FileUtils"),
        ProjectManager         = brackets.getModule("project/ProjectManager"),
        PerfUtils              = brackets.getModule("utils/PerfUtils"),
        NativeApp              = brackets.getModule("utils/NativeApp"),
        StringUtils            = brackets.getModule("utils/StringUtils"),
        Dialogs                = brackets.getModule("widgets/Dialogs"),
        Strings                = brackets.getModule("strings"),
        NodeDebugUtils         = require("NodeDebugUtils"),
        PerfDialogTemplate     = require("text!htmlContent/perf-dialog.html"),
        LanguageDialogTemplate = require("text!htmlContent/language-dialog.html");
    
    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));
	
	
    /** @const {string} Brackets Application Menu Constant */
    var DEBUG_MENU = "debug-menu";
    
     /** @const {string} Debug commands IDs */
    var DEBUG_REFRESH_WINDOW        = "debug.refreshWindow", // string must MATCH string in native code (brackets_extensions)
        DEBUG_SHOW_DEVELOPER_TOOLS  = "debug.showDeveloperTools",
        DEBUG_RUN_UNIT_TESTS        = "debug.runUnitTests",
        DEBUG_SHOW_PERF_DATA        = "debug.showPerfData",
        DEBUG_NEW_BRACKETS_WINDOW   = "debug.newBracketsWindow",
        DEBUG_SWITCH_LANGUAGE       = "debug.switchLanguage",
        DEBUG_ENABLE_NODE_DEBUGGER  = "debug.enableNodeDebugger",
        DEBUG_LOG_NODE_STATE        = "debug.logNodeState",
        DEBUG_RESTART_NODE          = "debug.restartNode";
    
    
    
    function handleShowDeveloperTools(commandData) {
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
    
    function _handleShowPerfData() {
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
    
    function _handleNewBracketsWindow() {
        window.open(window.location.href);
    }
    
    function _handleSwitchLanguage() {
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
                
                // returns the localized label for the given locale
                // or the locale, if nothing found
                var getLocalizedLabel = function (locale) {
                    var key  = "LOCALE_" + locale.toUpperCase().replace("-", "_"),
                        i18n = Strings[key];
                    
                    return i18n === undefined ? locale : i18n;
                };

                // add system default
                languages.push({label: Strings.LANGUAGE_SYSTEM_DEFAULT, language: null});
                
                // add english
                languages.push({label: getLocalizedLabel("en"),  language: "en"});
                
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
                            
                            languages.push({label: getLocalizedLabel(label), language: language});
                        }
                    }
                });
                
                var template = Mustache.render(LanguageDialogTemplate, {languages: languages, Strings: Strings});
                Dialogs.showModalDialogUsingTemplate(template).done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_OK && locale !== curLocale) {
                        brackets.setLocale(locale);
                        CommandManager.execute(DEBUG_REFRESH_WINDOW);
                    }
                });
                
                $dialog = $(".switch-language.instance");
                $submit = $dialog.find(".dialog-button[data-button-id='" + Dialogs.DIALOG_BTN_OK + "']");
                $select = $dialog.find("select");
                
                $select.on("change", setLanguage).val(curLocale);
            }
        });
    }
    
    function _enableRunTestsMenuItem() {
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
	
	
    /**
     * Disables Brackets' cache via the remote debugging protocol.
     * @return {$.Promise} A jQuery promise that will be resolved when the cache is disabled and be rejected in any other case
     */
    function _disableCache() {
        var result = new $.Deferred();
        
        if (brackets.inBrowser) {
            result.resolve();
        } else {
            var Inspector = brackets.getModule("LiveDevelopment/Inspector/Inspector");
            var port = brackets.app.getRemoteDebuggingPort ? brackets.app.getRemoteDebuggingPort() : 9234;
            Inspector.getDebuggableWindows("127.0.0.1", port)
                .fail(result.reject)
                .done(function (response) {
                    var page = response[0];
                    if (!page || !page.webSocketDebuggerUrl) {
                        result.reject();
                        return;
                    }
                    var _socket = new WebSocket(page.webSocketDebuggerUrl);
                    // Disable the cache
                    _socket.onopen = function _onConnect() {
                        _socket.send(JSON.stringify({ id: 1, method: "Network.setCacheDisabled", params: { "cacheDisabled": true } }));
                    };
                    // The first message will be the confirmation => disconnected to allow remote debugging of Brackets
                    _socket.onmessage = function _onMessage(e) {
                        _socket.close();
                        result.resolve();
                    };
                    // In case of an error
                    _socket.onerror = result.reject;
                });
        }
            
        return result.promise();
    }
	
    /** Does a full reload of the browser window */
    function handleFileReload(commandData) {
        return CommandManager.execute(Commands.FILE_CLOSE_ALL, { promptOnly: true }).done(function () {
            // Give everyone a chance to save their state - but don't let any problems block
            // us from quitting
            try {
                $(ProjectManager).triggerHandler("beforeAppClose");
            } catch (ex) {
                console.error(ex);
            }
            
            // Disable the cache to make reloads work
            _disableCache().always(function () {
                window.location.reload(true);
            });
        });
    }
    
    
    /* Register all the command handlers */
    
    // Show Developer Tools (optionally enabled)
    CommandManager.register(Strings.CMD_SHOW_DEV_TOOLS,       DEBUG_SHOW_DEVELOPER_TOOLS,   handleShowDeveloperTools)
        .setEnabled(!!brackets.app.showDeveloperTools);
    CommandManager.register(Strings.CMD_REFRESH_WINDOW,       DEBUG_REFRESH_WINDOW,         handleFileReload);
    CommandManager.register(Strings.CMD_NEW_BRACKETS_WINDOW,  DEBUG_NEW_BRACKETS_WINDOW,    _handleNewBracketsWindow);
    
    // Start with the "Run Tests" item disabled. It will be enabled later if the test file can be found.
    CommandManager.register(Strings.CMD_RUN_UNIT_TESTS,       DEBUG_RUN_UNIT_TESTS,         _runUnitTests)
        .setEnabled(false);
    
    CommandManager.register(Strings.CMD_SHOW_PERF_DATA,       DEBUG_SHOW_PERF_DATA,         _handleShowPerfData);
    CommandManager.register(Strings.CMD_SWITCH_LANGUAGE,      DEBUG_SWITCH_LANGUAGE,        _handleSwitchLanguage);
    
    // Node-related Commands
    CommandManager.register(Strings.CMD_ENABLE_NODE_DEBUGGER, DEBUG_ENABLE_NODE_DEBUGGER,   NodeDebugUtils.enableDebugger);
    CommandManager.register(Strings.CMD_LOG_NODE_STATE,       DEBUG_LOG_NODE_STATE,         NodeDebugUtils.logNodeState);
    CommandManager.register(Strings.CMD_RESTART_NODE,         DEBUG_RESTART_NODE,           NodeDebugUtils.restartNode);
    
    _enableRunTestsMenuItem();
    
    
    /*
     * Debug menu
     */
    var menu = Menus.addMenu(Strings.DEBUG_MENU, DEBUG_MENU, Menus.BEFORE, Menus.AppMenuBar.HELP_MENU);
    menu.addMenuItem(DEBUG_SHOW_DEVELOPER_TOOLS, KeyboardPrefs.showDeveloperTools);
    menu.addMenuItem(DEBUG_REFRESH_WINDOW, KeyboardPrefs.refreshWindow);
    menu.addMenuItem(DEBUG_NEW_BRACKETS_WINDOW);
    menu.addMenuDivider();
    menu.addMenuItem(DEBUG_SWITCH_LANGUAGE);
    menu.addMenuDivider();
    menu.addMenuItem(DEBUG_RUN_UNIT_TESTS);
    menu.addMenuItem(DEBUG_SHOW_PERF_DATA);
    menu.addMenuDivider();
    menu.addMenuItem(DEBUG_ENABLE_NODE_DEBUGGER);
    menu.addMenuItem(DEBUG_LOG_NODE_STATE);
    menu.addMenuItem(DEBUG_RESTART_NODE);
    
    
    // exposed for convenience, but not official API
    exports._runUnitTests = _runUnitTests;
});
